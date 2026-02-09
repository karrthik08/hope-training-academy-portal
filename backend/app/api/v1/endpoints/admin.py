from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from app.db.session import get_db
from app.models.user import User
from app.models.training import Enrollment, Completion, AuditLog, EnrollmentStatus, Training
from app.schemas.training import AuditLogOut
from app.api.v1.deps import require_roles

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/reports/roster/{training_id}")
async def roster_report(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    result = await db.execute(select(Enrollment).where(Enrollment.training_id == training_id))
    enrollments = result.scalars().all()
    return [{"enrollment_id": str(e.id), "user_id": str(e.user_id), "status": e.enrollment_status, "enrolled_at": e.enrolled_at.isoformat()} for e in enrollments]

@router.get("/reports/completions/{training_id}")
async def completion_report(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    result = await db.execute(
        select(Completion, User.full_name)
        .join(Enrollment, Enrollment.id == Completion.enrollment_id)
        .join(User, User.id == Enrollment.user_id)
        .where(Enrollment.training_id == training_id)
    )
    rows = result.all()
    data = []
    for comp, full_name in rows:
        data.append({
            "id": str(comp.id),
            "participant_name": full_name,
            "certificate_id": comp.certificate_id,
            "verification_code": comp.verification_code,
            "completed_at": comp.completed_at.isoformat() if comp.completed_at else None,
        })
    return data

@router.get("/audit-logs", response_model=List[AuditLogOut])
async def list_audit_logs(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()