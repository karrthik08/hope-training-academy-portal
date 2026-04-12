from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.training import Training, Enrollment, Completion

router = APIRouter()

@router.get("/trainings/detailed-metrics")
async def get_detailed_training_metrics(
    db: AsyncSession = Depends(get_db)
):
    """Get detailed metrics for each training - optimized version"""
    
    # Get all trainings with enrollment count in one query
    from sqlalchemy import outerjoin
    
    stmt = (
        select(
            Training.id,
            Training.title,
            Training.category,
            Training.created_at,
            func.count(Enrollment.id).label('enrollment_count'),
            func.count(Completion.id).label('completion_count')
        )
        .outerjoin(Enrollment, Training.id == Enrollment.training_id)
        .outerjoin(Completion, Enrollment.id == Completion.enrollment_id)
        .group_by(Training.id, Training.title, Training.category, Training.created_at)
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    detailed_metrics = []
    for row in rows:
        total_enrolled = row.enrollment_count or 0
        total_completed = row.completion_count or 0
        
        completion_rate = 0
        if total_enrolled > 0:
            completion_rate = round((total_completed / total_enrolled) * 100, 1)
        
        detailed_metrics.append({
            "id": str(row.id),
            "title": row.title,
            "category": row.category,
            "total_enrolled": total_enrolled,
            "total_completed": total_completed,
            "completion_rate": completion_rate,
            "created_at": row.created_at.isoformat() if row.created_at else None
        })
    
    return detailed_metrics