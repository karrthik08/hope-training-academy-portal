from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
import uuid
from app.db.session import get_db
from app.models.user import User
from app.models.training import Enrollment
from app.models.course_content import CourseContent
from app.models.content_progress import ContentProgress
from app.api.v1.deps import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/course-completion", tags=["course-completion"])

@router.post("/check-and-complete/{enrollment_id}")
async def check_and_complete_course(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if all course content is completed.
    If yes, mark enrollment as completed and generate certificate.
    """
    # Get the enrollment
    enrollment = await db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Get total content count for this training
    content_count_result = await db.execute(
        select(func.count(CourseContent.id))
        .where(CourseContent.training_id == enrollment.training_id)
    )
    total_content = content_count_result.scalar()
    
    # If no content, can't auto-complete
    if total_content == 0:
        raise HTTPException(status_code=400, detail="Course has no content")
    
    # Get completed content count for this enrollment
    completed_count_result = await db.execute(
        select(func.count(ContentProgress.id))
        .where(
            ContentProgress.enrollment_id == enrollment_id,
            ContentProgress.completed == True
        )
    )
    completed_content = completed_count_result.scalar()
    
    # Check if all content is completed
    if completed_content >= total_content:
        # Mark enrollment as completed
        enrollment.enrollment_status = "completed"
        enrollment.completed_at = datetime.utcnow()
        
        await log_action(db, current_user.id, "complete_course", "Enrollment", str(enrollment_id))
        await db.commit()
        await db.refresh(enrollment)
        
        return {
            "status": "completed",
            "message": "Course completed successfully!",
            "enrollment": enrollment
        }
    else:
        return {
            "status": "incomplete",
            "progress": f"{completed_content}/{total_content}",
            "message": f"Complete {total_content - completed_content} more items"
        }
