from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import datetime
import io
import csv

from app.db.session import get_db
from app.models.user import User
from app.models.training import Training, Enrollment, EnrollmentStatus
from app.models.attendance import Attendance
from app.models.progress import ModuleProgress, LessonProgress, ProgressStatus
from app.api.v1.deps import get_current_user, require_roles

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/training/{training_id}/summary")
async def get_training_summary(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Get summary report for a training"""
    
    # Get training info
    training_result = await db.execute(
        select(Training).where(Training.id == training_id)
    )
    training = training_result.scalar_one_or_none()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    # Get enrollment stats
    total_enrolled = await db.execute(
        select(func.count(Enrollment.id))
        .where(Enrollment.training_id == training_id)
    )
    total = total_enrolled.scalar()
    
    completed_count = await db.execute(
        select(func.count(Enrollment.id))
        .where(
            and_(
                Enrollment.training_id == training_id,
                Enrollment.enrollment_status == EnrollmentStatus.completed
            )
        )
    )
    completed = completed_count.scalar()
    
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    return {
        "training_title": training.title,
        "category": training.category,
        "duration_hours": training.duration_hours,
        "total_enrolled": total,
        "total_completed": completed,
        "completion_rate": round(completion_rate, 1),
        "status": training.status
    }

@router.get("/training/{training_id}/attendance-export")
async def export_attendance_report(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Export attendance report as CSV"""
    
    # Get training info
    training_result = await db.execute(
        select(Training).where(Training.id == training_id)
    )
    training = training_result.scalar_one_or_none()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    # Get all enrollments with user info
    enrollments_result = await db.execute(
        select(Enrollment, User.email, User.full_name)
        .join(User, Enrollment.user_id == User.id)
        .where(Enrollment.training_id == training_id)
        .order_by(User.full_name)
    )
    enrollments = enrollments_result.all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Name', 'Email', 'Total Sessions', 'Present', 'Absent', 'Excused', 'Attendance %'])
    
    # Data rows
    for enrollment, email, full_name in enrollments:
        # Get attendance stats
        total_sessions = await db.execute(
            select(func.count(Attendance.id))
            .where(Attendance.enrollment_id == enrollment.id)
        )
        total = total_sessions.scalar()
        
        present_count = await db.execute(
            select(func.count(Attendance.id))
            .where(
                and_(
                    Attendance.enrollment_id == enrollment.id,
                    Attendance.status == 'present'
                )
            )
        )
        present = present_count.scalar()
        
        absent_count = await db.execute(
            select(func.count(Attendance.id))
            .where(
                and_(
                    Attendance.enrollment_id == enrollment.id,
                    Attendance.status == 'absent'
                )
            )
        )
        absent = absent_count.scalar()
        
        excused_count = await db.execute(
            select(func.count(Attendance.id))
            .where(
                and_(
                    Attendance.enrollment_id == enrollment.id,
                    Attendance.status == 'excused'
                )
            )
        )
        excused = excused_count.scalar()
        
        attendance_pct = (present / total * 100) if total > 0 else 0
        
        writer.writerow([
            full_name,
            email,
            total,
            present,
            absent,
            excused,
            f"{attendance_pct:.1f}%"
        ])
    
    # Return CSV file
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_report_{training.title.replace(' ', '_')}.csv"
        }
    )

@router.get("/training/{training_id}/completion-export")
async def export_completion_report(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Export completion report as CSV"""
    
    # Get training info
    training_result = await db.execute(
        select(Training).where(Training.id == training_id)
    )
    training = training_result.scalar_one_or_none()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    # Get completed enrollments
    enrollments_result = await db.execute(
        select(Enrollment, User.email, User.full_name)
        .join(User, Enrollment.user_id == User.id)
        .where(
            and_(
                Enrollment.training_id == training_id,
                Enrollment.enrollment_status == EnrollmentStatus.completed
            )
        )
        .order_by(User.full_name)
    )
    enrollments = enrollments_result.all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Name', 'Email', 'Enrolled Date', 'Completion Date', 'Certificate ID'])
    
    # Data rows
    for enrollment, email, full_name in enrollments:
        writer.writerow([
            full_name,
            email,
            enrollment.enrolled_at.strftime('%Y-%m-%d') if enrollment.enrolled_at else 'N/A',
            'Completed',
            str(enrollment.id)[:8]
        ])
    
    # Return CSV file
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=completion_report_{training.title.replace(' ', '_')}.csv"
        }
    )

@router.get("/user/{user_id}/transcript")
async def get_user_transcript(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user training transcript"""
    
    # Check authorization - users can only view their own transcript unless admin/instructor
    if current_user.id != user_id and current_user.role not in ["Admin", "Instructor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get user info
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all enrollments
    enrollments_result = await db.execute(
        select(Enrollment, Training.title, Training.duration_hours, Training.category)
        .join(Training, Enrollment.training_id == Training.id)
        .where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = enrollments_result.all()
    
    transcript = []
    total_hours = 0
    
    for enrollment, title, duration, category in enrollments:
        if enrollment.enrollment_status == EnrollmentStatus.completed:
            total_hours += duration or 0
        
        transcript.append({
            "training_title": title,
            "category": category,
            "duration_hours": duration,
            "status": enrollment.enrollment_status.value,
            "enrolled_date": enrollment.enrolled_at.strftime('%Y-%m-%d') if enrollment.enrolled_at else None,
            "certificate_id": str(enrollment.id)[:8] if enrollment.enrollment_status == EnrollmentStatus.completed else None
        })
    
    return {
        "user_name": user.full_name,
        "user_email": user.email,
        "total_training_hours": total_hours,
        "trainings": transcript
    }
