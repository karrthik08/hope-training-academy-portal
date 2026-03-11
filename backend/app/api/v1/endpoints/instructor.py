from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid, secrets, string
from app.db.session import get_db
from app.models.user import User
from app.models.training import Enrollment, Attendance, Completion, EnrollmentStatus
from app.schemas.training import AttendanceCreate, CompletionOut, EnrollmentOut
from app.api.v1.deps import require_roles
from app.services.audit import log_action

router = APIRouter(prefix="/instructor", tags=["instructor"])

def gen_cert_id():
    return "CERT-" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))

def gen_verification_code():
    return secrets.token_urlsafe(16)

@router.get("/trainings/{training_id}/roster", response_model=List[EnrollmentOut])
async def get_roster(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.training_id == training_id,
            Enrollment.enrollment_status == EnrollmentStatus.enrolled,
        )
    )
    return result.scalars().all()

@router.post("/attendance", status_code=201)
async def mark_attendance(
    payload: AttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    enrollment = await db.get(Enrollment, payload.enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    attendance = Attendance(
        enrollment_id=payload.enrollment_id,
        attendance_status=payload.attendance_status,
        marked_by=current_user.id,
    )
    db.add(attendance)
    await db.flush()
    await log_action(db, current_user.id, "mark_attendance", "Attendance", str(attendance.id))
    await db.commit()
    await db.refresh(attendance)
    return {"id": str(attendance.id), "attendance_status": attendance.attendance_status}

@router.post("/completions/{enrollment_id}", response_model=CompletionOut, status_code=201)
async def mark_completion(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    enrollment = await db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    result = await db.execute(select(Completion).where(Completion.enrollment_id == enrollment_id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Completion already recorded")
    completion = Completion(
        enrollment_id=enrollment_id,
        completed_by=current_user.id,
        certificate_id=gen_cert_id(),
        certificate_url=f"/api/v1/certificates/{gen_cert_id()}",
        verification_code=gen_verification_code(),
    )
    db.add(completion)
    enrollment.enrollment_status = EnrollmentStatus.completed
    await db.flush()
    await log_action(db, current_user.id, "mark_completion", "Completion", str(completion.id))
    await db.commit()
    await db.refresh(completion)
    return completion

@router.get("/certificates/verify/{verification_code}")
async def verify_certificate(verification_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Completion).where(Completion.verification_code == verification_code)
    )
    completion = result.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"valid": True, "certificate_id": completion.certificate_id, "completed_at": completion.completed_at}