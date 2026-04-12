from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.completion_criteria import CompletionCriteria
from app.models.progress import ModuleProgress, LessonProgress, ProgressStatus
from app.models.training import Enrollment, EnrollmentStatus
from app.api.v1.deps import get_current_user, require_roles
from app.services.notification_service import notify_completion

router = APIRouter(prefix="/completion", tags=["completion"])

class CompletionCriteriaRequest(BaseModel):
    training_id: str
    require_all_modules: bool = True
    require_assessment_pass: bool = False
    required_assessment_score: str = "80"
    require_attendance: bool = False
    required_attendance_percentage: str = "80"
    auto_complete_enabled: bool = True

@router.post("/criteria")
async def set_completion_criteria(
    payload: CompletionCriteriaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Set or update completion criteria for a training"""
    import uuid
    
    training_id = uuid.UUID(payload.training_id)
    
    # Check if criteria exists
    result = await db.execute(
        select(CompletionCriteria).where(CompletionCriteria.training_id == training_id)
    )
    criteria = result.scalar_one_or_none()
    
    if criteria:
        # Update existing
        criteria.require_all_modules = payload.require_all_modules
        criteria.require_assessment_pass = payload.require_assessment_pass
        criteria.required_assessment_score = payload.required_assessment_score
        criteria.require_attendance = payload.require_attendance
        criteria.required_attendance_percentage = payload.required_attendance_percentage
        criteria.auto_complete_enabled = payload.auto_complete_enabled
    else:
        # Create new
        criteria = CompletionCriteria(
            training_id=training_id,
            require_all_modules=payload.require_all_modules,
            require_assessment_pass=payload.require_assessment_pass,
            required_assessment_score=payload.required_assessment_score,
            require_attendance=payload.require_attendance,
            required_attendance_percentage=payload.required_attendance_percentage,
            auto_complete_enabled=payload.auto_complete_enabled
        )
        db.add(criteria)
    
    await db.commit()
    await db.refresh(criteria)
    
    return {"message": "Completion criteria saved"}

@router.get("/criteria/{training_id}")
async def get_completion_criteria(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get completion criteria for a training"""
    
    result = await db.execute(
        select(CompletionCriteria).where(CompletionCriteria.training_id == training_id)
    )
    criteria = result.scalar_one_or_none()
    
    if not criteria:
        # Return defaults
        return {
            "require_all_modules": True,
            "require_assessment_pass": False,
            "required_assessment_score": "80",
            "require_attendance": False,
            "required_attendance_percentage": "80",
            "auto_complete_enabled": True
        }
    
    return {
        "require_all_modules": criteria.require_all_modules,
        "require_assessment_pass": criteria.require_assessment_pass,
        "required_assessment_score": criteria.required_assessment_score,
        "require_attendance": criteria.require_attendance,
        "required_attendance_percentage": criteria.required_attendance_percentage,
        "auto_complete_enabled": criteria.auto_complete_enabled
    }

@router.post("/check/{enrollment_id}")
async def check_completion_eligibility(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if an enrollment meets completion criteria"""
    from app.models.module import Module
    from app.models.lesson import Lesson
    from app.models.attendance import Attendance, AttendanceStatus
    
    # Get enrollment
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = enrollment_result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Get criteria
    criteria_result = await db.execute(
        select(CompletionCriteria).where(CompletionCriteria.training_id == enrollment.training_id)
    )
    criteria = criteria_result.scalar_one_or_none()
    
    # Default criteria if not set
    if not criteria:
        criteria = CompletionCriteria(
            training_id=enrollment.training_id,
            require_all_modules=True,
            auto_complete_enabled=True
        )
    
    eligible = True
    reasons = []
    
    # Check modules completion
    if criteria.require_all_modules:
        modules_result = await db.execute(
            select(Module.id).where(Module.training_id == enrollment.training_id)
        )
        module_ids = [m[0] for m in modules_result.all()]
        
        for module_id in module_ids:
            # Check all lessons in module
            lessons_result = await db.execute(
                select(func.count(Lesson.id)).where(Lesson.module_id == module_id)
            )
            total_lessons = lessons_result.scalar()
            
            if total_lessons == 0:
                continue
            
            completed_lessons_result = await db.execute(
                select(func.count(LessonProgress.id)).where(
                    LessonProgress.enrollment_id == enrollment_id,
                    LessonProgress.lesson_id.in_(
                        select(Lesson.id).where(Lesson.module_id == module_id)
                    ),
                    LessonProgress.status == ProgressStatus.completed
                )
            )
            completed_lessons = completed_lessons_result.scalar()
            
            if completed_lessons < total_lessons:
                eligible = False
                reasons.append("Not all modules completed")
                break
    
    # Check attendance if required
    if criteria.require_attendance:
        attendance_result = await db.execute(
            select(func.count(Attendance.id)).where(Attendance.enrollment_id == enrollment_id)
        )
        total_sessions = attendance_result.scalar()
        
        if total_sessions > 0:
            present_result = await db.execute(
                select(func.count(Attendance.id)).where(
                    Attendance.enrollment_id == enrollment_id,
                    Attendance.status == AttendanceStatus.present
                )
            )
            present_count = present_result.scalar()
            
            attendance_pct = (present_count / total_sessions * 100) if total_sessions > 0 else 0
            required_pct = float(criteria.required_attendance_percentage)
            
            if attendance_pct < required_pct:
                eligible = False
                reasons.append(f"Attendance {attendance_pct:.1f}% is below required {required_pct}%")
    
    return {
        "eligible": eligible,
        "reasons": reasons,
        "auto_complete_enabled": criteria.auto_complete_enabled
    }

@router.post("/mark-complete/{enrollment_id}")
async def mark_enrollment_complete(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Manually mark an enrollment as complete"""
    
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = enrollment_result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    enrollment.enrollment_status = EnrollmentStatus.completed
    
    await db.commit()
    
    # Send notification
    from app.models.training import Training
    training_result = await db.execute(
        select(Training).where(Training.id == enrollment.training_id)
    )
    training = training_result.scalar_one_or_none()
    
    if training:
        await notify_completion(
            db=db,
            user_id=enrollment.user_id,
            training_title=training.title,
            enrollment_id=enrollment.id
        )
    
    return {"message": "Enrollment marked as complete"}
