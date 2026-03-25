from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List
import uuid
import secrets
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.user import User
from app.models.training import Training, Enrollment, EnrollmentStatus, TrainingStatus, Completion
from app.schemas.training import EnrollmentOut
from app.api.v1.deps import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("/my", response_model=List[EnrollmentOut])
async def my_enrollments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{enrollment_id}/certificate")
async def get_certificate(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get enrollment
    enrollment = await db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Must belong to current user
    if enrollment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Must be completed
    if enrollment.enrollment_status != EnrollmentStatus.completed:
        raise HTTPException(status_code=400, detail="Training not completed yet")

    # Get completion record
    comp_result = await db.execute(
        select(Completion).where(Completion.enrollment_id == enrollment_id)
    )
    completion = comp_result.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Get training — use raw SQL to bypass ORM cache and get fresh certificate_template
    training_result = await db.execute(
        text("SELECT id, title, certificate_template FROM trainings WHERE id = :id"),
        {"id": str(enrollment.training_id)}
    )
    training_row = training_result.fetchone()
    if not training_row:
        raise HTTPException(status_code=404, detail="Training not found")

    return {
        "participant_name": current_user.full_name,
        "training_title": training_row[1],
        "completed_at": completion.completed_at.isoformat(),
        "certificate_id": completion.certificate_id,
        "verification_code": completion.verification_code,
        "hours": "N/A",
        "certificate_template": training_row[2],
    }


@router.post("/complete-by-video/{training_id}", status_code=200)
async def complete_by_video(
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

    if not enrollment:
        enrollment = Enrollment(user_id=current_user.id, training_id=training_id)
        db.add(enrollment)
        await db.flush()

    if enrollment.enrollment_status == EnrollmentStatus.completed:
        return {"message": "Already completed", "enrollment_id": str(enrollment.id)}

    enrollment.enrollment_status = EnrollmentStatus.completed

    existing_comp_result = await db.execute(
        select(Completion).where(Completion.enrollment_id == enrollment.id)
    )
    if not existing_comp_result.scalar_one_or_none():
        cert_id = f"HOPE-{secrets.token_hex(4).upper()}"
        verification_code = secrets.token_urlsafe(16)
        completion = Completion(
            enrollment_id=enrollment.id,
            completed_by=current_user.id,
            completed_at=datetime.now(timezone.utc),
            certificate_id=cert_id,
            verification_code=verification_code,
            certificate_url=f"/certificate/{enrollment.id}",
        )
        db.add(completion)

    await log_action(db, current_user.id, "complete_by_video", "Enrollment", str(enrollment.id))
    await db.commit()
    await db.refresh(enrollment)
    return {"message": "Completed", "certificate_url": f"/certificate/{enrollment.id}"}


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