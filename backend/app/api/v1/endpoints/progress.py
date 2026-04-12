from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.progress import ModuleProgress, LessonProgress, ProgressStatus
from app.api.v1.deps import get_current_user, require_roles

router = APIRouter(prefix="/progress", tags=["progress"])

class UpdateProgressRequest(BaseModel):
    enrollment_id: str
    module_id: str = None
    lesson_id: str = None
    status: str
    time_spent: int = None

@router.post("/update")
async def update_progress(
    payload: UpdateProgressRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update module or lesson progress"""
    import uuid
    
    enrollment_id = uuid.UUID(payload.enrollment_id)
    
    if payload.module_id:
        # Update module progress
        module_id = uuid.UUID(payload.module_id)
        
        result = await db.execute(
            select(ModuleProgress).where(
                ModuleProgress.enrollment_id == enrollment_id,
                ModuleProgress.module_id == module_id
            )
        )
        progress = result.scalar_one_or_none()
        
        if not progress:
            progress = ModuleProgress(
                enrollment_id=enrollment_id,
                module_id=module_id,
                status=ProgressStatus(payload.status),
                started_at=datetime.now(timezone.utc)
            )
            db.add(progress)
        else:
            progress.status = ProgressStatus(payload.status)
            
        if payload.status == 'completed':
            progress.completed_at = datetime.now(timezone.utc)
            progress.completion_percentage = 100
            
        await db.commit()
        await db.refresh(progress)
        
    elif payload.lesson_id:
        # Update lesson progress
        lesson_id = uuid.UUID(payload.lesson_id)
        
        result = await db.execute(
            select(LessonProgress).where(
                LessonProgress.enrollment_id == enrollment_id,
                LessonProgress.lesson_id == lesson_id
            )
        )
        progress = result.scalar_one_or_none()
        
        if not progress:
            progress = LessonProgress(
                enrollment_id=enrollment_id,
                lesson_id=lesson_id,
                status=ProgressStatus(payload.status),
                started_at=datetime.now(timezone.utc),
                last_accessed=datetime.now(timezone.utc)
            )
            db.add(progress)
        else:
            progress.status = ProgressStatus(payload.status)
            progress.last_accessed = datetime.now(timezone.utc)
            if payload.time_spent:
                progress.time_spent += payload.time_spent
                
        if payload.status == 'completed':
            progress.completed_at = datetime.now(timezone.utc)
            
        await db.commit()
        await db.refresh(progress)
    
    return {"message": "Progress updated"}

@router.get("/enrollment/{enrollment_id}")
async def get_enrollment_progress(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete progress for an enrollment"""
    from app.models.module import Module
    from app.models.lesson import Lesson
    from app.models.training import Enrollment
    
    # Get enrollment and training info
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = enrollment_result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Get all modules for this training
    modules_result = await db.execute(
        select(Module)
        .where(Module.training_id == enrollment.training_id)
        .order_by(Module.order_index)
    )
    modules = modules_result.scalars().all()
    
    # Get all module progress
    module_progress_result = await db.execute(
        select(ModuleProgress)
        .where(ModuleProgress.enrollment_id == enrollment_id)
    )
    module_progress_map = {mp.module_id: mp for mp in module_progress_result.scalars().all()}
    
    # Get all lesson progress
    lesson_progress_result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.enrollment_id == enrollment_id)
    )
    lesson_progress_map = {lp.lesson_id: lp for lp in lesson_progress_result.scalars().all()}
    
    # Build response
    progress_data = []
    for module in modules:
        # Get lessons for this module
        lessons_result = await db.execute(
            select(Lesson)
            .where(Lesson.module_id == module.id)
            .order_by(Lesson.order_index)
        )
        lessons = lessons_result.scalars().all()
        
        module_prog = module_progress_map.get(module.id)
        
        lessons_data = []
        for lesson in lessons:
            lesson_prog = lesson_progress_map.get(lesson.id)
            lessons_data.append({
                "id": str(lesson.id),
                "title": lesson.title,
                "status": lesson_prog.status.value if lesson_prog else "not_started",
                "time_spent": lesson_prog.time_spent if lesson_prog else 0,
                "last_accessed": lesson_prog.last_accessed.isoformat() if lesson_prog and lesson_prog.last_accessed else None,
                "completed_at": lesson_prog.completed_at.isoformat() if lesson_prog and lesson_prog.completed_at else None
            })
        
        # Calculate module completion percentage
        if lessons:
            completed_lessons = sum(1 for l in lessons_data if l['status'] == 'completed')
            completion_pct = int((completed_lessons / len(lessons)) * 100)
        else:
            completion_pct = 0
            
        progress_data.append({
            "module_id": str(module.id),
            "module_title": module.title,
            "status": module_prog.status.value if module_prog else "not_started",
            "completion_percentage": completion_pct,
            "lessons": lessons_data
        })
    
    # Overall completion
    total_modules = len(modules)
    completed_modules = sum(1 for m in progress_data if m['completion_percentage'] == 100)
    overall_completion = int((completed_modules / total_modules * 100)) if total_modules > 0 else 0
    
    return {
        "enrollment_id": str(enrollment_id),
        "overall_completion": overall_completion,
        "modules": progress_data
    }

@router.get("/training/{training_id}/summary")
async def get_training_progress_summary(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Get progress summary for all participants in a training"""
    from app.models.training import Enrollment
    from app.models.user import User as UserModel
    
    # Get all enrollments
    enrollments_result = await db.execute(
        select(Enrollment, UserModel.email)
        .join(UserModel, Enrollment.user_id == UserModel.id)
        .where(Enrollment.training_id == training_id)
    )
    
    summary = []
    for enrollment, user_email in enrollments_result.all():
        # Get total modules
        from app.models.module import Module
        from app.models.lesson import Lesson
        
        total_modules_result = await db.execute(
            select(func.count(Module.id))
            .where(Module.training_id == training_id)
        )
        total_modules = total_modules_result.scalar()
        
        # Calculate completed modules based on lesson completion
        modules_result = await db.execute(
            select(Module.id)
            .where(Module.training_id == training_id)
        )
        module_ids = [m[0] for m in modules_result.all()]
        
        completed_modules = 0
        for module_id in module_ids:
            # Get total lessons in module
            lessons_result = await db.execute(
                select(func.count(Lesson.id))
                .where(Lesson.module_id == module_id)
            )
            total_lessons = lessons_result.scalar()
            
            if total_lessons == 0:
                continue
                
            # Get completed lessons
            completed_lessons_result = await db.execute(
                select(func.count(LessonProgress.id))
                .where(
                    LessonProgress.enrollment_id == enrollment.id,
                    LessonProgress.lesson_id.in_(
                        select(Lesson.id).where(Lesson.module_id == module_id)
                    ),
                    LessonProgress.status == ProgressStatus.completed
                )
            )
            completed_lessons = completed_lessons_result.scalar()
            
            # If all lessons completed, module is completed
            if completed_lessons == total_lessons:
                completed_modules += 1
        
        completion_pct = int((completed_modules / total_modules * 100)) if total_modules > 0 else 0
        
        summary.append({
            "enrollment_id": str(enrollment.id),
            "user_email": user_email,
            "completed_modules": completed_modules,
            "total_modules": total_modules,
            "completion_percentage": completion_pct
        })
    
    return summary
