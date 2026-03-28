from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from datetime import datetime
import uuid

# No prefix - the routes define their full paths
router = APIRouter(tags=["certificates"])

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
                t.duration_hours,
                t.category,
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
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Determine certificate template based on category
    category = row.category or ""
    if "PPW" in category.upper() or "PATRECIA" in category.upper():
        template = "PPW"
    elif any(x in category.upper() for x in ["BUSINESS", "WORKFORCE", "LEADERSHIP"]):
        template = "CORPORATE"
    else:
        template = "OOH"
    
    return {
        "enrollment_id": str(row.enrollment_id),
        "participant_name": row.participant_name,
        "training_title": row.training_title,
        "duration_hours": row.duration_hours,
        "completed_at": row.completed_at.isoformat() if row.completed_at else None,
        "certificate_id": row.certificate_id,
        "verification_code": row.verification_code,
        "certificate_template": template
    }
