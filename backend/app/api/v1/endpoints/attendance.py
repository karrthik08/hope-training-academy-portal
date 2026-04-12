from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from app.api.v1.deps import get_current_user, require_roles

router = APIRouter(prefix="/attendance", tags=["attendance"])

class AttendanceMarkRequest(BaseModel):
    enrollment_id: str
    session_date: str  # ISO format
    status: str  # present, absent, excused
    notes: str = None

class AttendanceOut(BaseModel):
    id: str
    enrollment_id: str
    session_date: str
    status: str
    marked_by: str
    marked_at: str
    notes: str = None

    class Config:
        from_attributes = True

@router.post("/mark")
async def mark_attendance(
    payload: AttendanceMarkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Mark attendance for a participant"""
    from app.models.training import Enrollment
    import uuid
    
    enrollment_id = uuid.UUID(payload.enrollment_id)
    session_date = datetime.fromisoformat(payload.session_date.replace('Z', '+00:00'))
    
    # Check if attendance already exists for this session
    existing = await db.execute(
        select(Attendance).where(
            Attendance.enrollment_id == enrollment_id,
            Attendance.session_date == session_date
        )
    )
    attendance = existing.scalar_one_or_none()
    
    if attendance:
        # Update existing
        attendance.status = AttendanceStatus(payload.status)
        attendance.notes = payload.notes
        attendance.marked_by = current_user.id
        attendance.marked_at = datetime.now(timezone.utc)
    else:
        # Create new
        attendance = Attendance(
            enrollment_id=enrollment_id,
            session_date=session_date,
            status=AttendanceStatus(payload.status),
            marked_by=current_user.id,
            notes=payload.notes
        )
        db.add(attendance)
    
    await db.commit()
    await db.refresh(attendance)
    
    return {"message": "Attendance marked successfully", "attendance_id": str(attendance.id)}

@router.get("/training/{training_id}")
async def get_training_attendance(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Get all attendance records for a training"""
    from app.models.training import Enrollment
    
    result = await db.execute(
        select(Attendance, Enrollment)
        .join(Enrollment, Attendance.enrollment_id == Enrollment.id)
        .where(Enrollment.training_id == training_id)
        .order_by(Attendance.session_date.desc())
    )
    
    records = []
    for attendance, enrollment in result.all():
        records.append({
            "id": str(attendance.id),
            "enrollment_id": str(attendance.enrollment_id),
            "user_id": str(enrollment.user_id),
            "session_date": attendance.session_date.isoformat(),
            "status": attendance.status.value,
            "marked_at": attendance.marked_at.isoformat(),
            "notes": attendance.notes
        })
    
    return records

@router.get("/enrollment/{enrollment_id}")
async def get_enrollment_attendance(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance records for a specific enrollment"""
    
    result = await db.execute(
        select(Attendance)
        .where(Attendance.enrollment_id == enrollment_id)
        .order_by(Attendance.session_date.desc())
    )
    
    records = []
    for attendance in result.scalars().all():
        records.append({
            "id": str(attendance.id),
            "session_date": attendance.session_date.isoformat(),
            "status": attendance.status.value,
            "marked_at": attendance.marked_at.isoformat(),
            "notes": attendance.notes
        })
    
    return records
