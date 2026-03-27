from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
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


@router.post("/complete-by-video/{training_id}")
async def complete_by_video(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a training as complete and generate certificate."""
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.training_id == training_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if enrollment.enrollment_status == EnrollmentStatus.completed:
        return {"success": True, "enrollment_id": str(enrollment.id), "already_completed": True}

    # Mark as completed
    enrollment.enrollment_status = EnrollmentStatus.completed

    # Generate certificate
    cert_id = f"HOPE-{str(uuid.uuid4()).upper()[:8]}"
    verification_code = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    await db.execute(
        text("""
            INSERT INTO completions
                (id, enrollment_id, completed_by, certificate_id,
                 verification_code, completed_at)
            VALUES
                (:id, :eid, :uid, :cert_id, :vcode, :now)
            ON CONFLICT (enrollment_id) DO NOTHING
        """),
        {
            "id": str(uuid.uuid4()),
            "eid": str(enrollment.id),
            "uid": str(current_user.id),
            "cert_id": cert_id,
            "vcode": verification_code,
            "now": now,
        }
    )
    await log_action(db, current_user.id, "complete", "Enrollment", str(enrollment.id))
    await db.commit()
    return {"success": True, "enrollment_id": str(enrollment.id), "certificate_id": cert_id}


@router.get("/{enrollment_id}/certificate")
async def get_certificate(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get certificate data — joins via enrollments since completions has no training_id."""
    result = await db.execute(
        text("""
            SELECT
                c.certificate_id,
                c.verification_code,
                c.completed_at,
                u.full_name            AS participant_name,
                t.title                AS training_title,
                t.duration_hours,
                t.certificate_template,
                t.category,
                e.id                   AS enrollment_id
            FROM completions c
            JOIN enrollments e ON e.id = c.enrollment_id
            JOIN users u       ON u.id = e.user_id
            JOIN trainings t   ON t.id = e.training_id
            WHERE e.id   = :eid
              AND e.user_id = :uid
        """),
        {"eid": str(enrollment_id), "uid": str(current_user.id)}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found or training not completed")

    return {
        "certificate_id":       row[0],
        "verification_code":    row[1],
        "completed_at":         row[2].isoformat() if row[2] else None,
        "participant_name":     row[3],
        "training_title":       row[4],
        "duration_hours":       row[5],
        "certificate_template": row[6],
        "category":             row[7],
        "enrollment_id":        str(row[8]),
    }