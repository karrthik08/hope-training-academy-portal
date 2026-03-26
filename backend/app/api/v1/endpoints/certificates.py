from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/enrollments/{enrollment_id}/certificate")
async def get_certificate(
    enrollment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get certificate data for an enrollment"""
    
    # Get enrollment with training and user info
    result = await db.execute(
        text("""
            SELECT 
                e.id as enrollment_id,
                u.full_name as participant_name,
                t.title as training_title,
                t.certificate_template,
                t.duration_hours,
                c.completed_at,
                c.certificate_id,
                c.verification_code
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN trainings t ON e.training_id = t.id
            LEFT JOIN completions c ON e.id = c.enrollment_id
            WHERE e.id = :enrollment_id
        """),
        {"enrollment_id": enrollment_id}
    )
    
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if not row[5]:  # completed_at
        raise HTTPException(status_code=400, detail="Training not completed yet")
    
    return {
        "enrollment_id": str(row[0]),
        "participant_name": row[1],
        "training_title": row[2],
        "certificate_template": row[3],
        "duration_hours": row[4],
        "completed_at": row[5].isoformat() if row[5] else None,
        "certificate_id": row[6],
        "verification_code": row[7]
    }
