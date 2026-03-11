from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.user import User
from app.models.training import Training, Enrollment, EnrollmentStatus, TrainingStatus
from app.schemas.training import EnrollmentOut
from app.api.v1.deps import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/enrollments", tags=["enrollments"])

@router.post("/{training_id}", response_model=EnrollmentOut, status_code=201)
async def enroll(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    training = await db.get(Training, training_id)
    if not training or training.status != TrainingStatus.published:
        raise HTTPException(status_code=404, detail="Training not found or not available")
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.training_id == training_id,
        )
    )
    enrollment = existing.scalar_one_or_none()
    if enrollment:
        if enrollment.enrollment_status == EnrollmentStatus.enrolled:
            raise HTTPException(status_code=400, detail="Already enrolled")
        enrollment.enrollment_status = EnrollmentStatus.enrolled
        enrollment.canceled_at = None
    else:
        enrollment = Enrollment(user_id=current_user.id, training_id=training_id)
        db.add(enrollment)
    await db.flush()
    await log_action(db, current_user.id, "enroll", "Enrollment", str(enrollment.id))
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

@router.delete("/{training_id}", response_model=EnrollmentOut)
async def cancel_enrollment(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.training_id == training_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment or enrollment.enrollment_status != EnrollmentStatus.enrolled:
        raise HTTPException(status_code=404, detail="Active enrollment not found")
    enrollment.enrollment_status = EnrollmentStatus.canceled
    enrollment.canceled_at = datetime.now(timezone.utc)
    await log_action(db, current_user.id, "cancel_enrollment", "Enrollment", str(enrollment.id))
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

@router.get("/my", response_model=List[EnrollmentOut])
async def my_enrollments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    return result.scalars().all()