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

@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin"))
):
    """Get admin dashboard metrics with drop rate, login frequency, and test pass rates"""
    from sqlalchemy import func, select, and_, or_, case
    from app.models.training import Training, Enrollment, EnrollmentStatus, Completion
    from app.models.user import User
    from app.models.assessment import Assessment
    from app.models.assessment_attempt import AssessmentAttempt
    from datetime import datetime, timedelta
    
    # Total trainings
    total_trainings = await db.scalar(select(func.count(Training.id)))
    
    # Total users
    total_users = await db.scalar(select(func.count(User.id)))
    
    # Total enrollments
    total_enrollments = await db.scalar(select(func.count(Enrollment.id)))
    
    # Completion rate
    completed = await db.scalar(
        select(func.count(Enrollment.id)).where(
            Enrollment.enrollment_status == EnrollmentStatus.completed
        )
    )
    completion_rate = round((completed / total_enrollments * 100) if total_enrollments > 0 else 0, 1)
    
    popular_trainings_result = await db.execute(
        select(
            Training.id,
            Training.title,
            func.count(Enrollment.id).label('enrollment_count')
        )
        .join(Enrollment, Training.id == Enrollment.training_id)
        .group_by(Training.id, Training.title)
        .order_by(func.count(Enrollment.id).desc())
        .limit(5)
    )
    popular_trainings = [
        {"id": str(row[0]), "title": row[1], "enrollments": row[2]}
        for row in popular_trainings_result.all()
    ]

    recent_enrollments_result = await db.execute(
        select(Enrollment, Training.title, User.email)
        .join(Training, Enrollment.training_id == Training.id)
        .join(User, Enrollment.user_id == User.id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(10)
    )
    recent_enrollments = [
        {
            "training": row[1],
            "user": row[2],
            "date": row[0].enrolled_at.isoformat(),
            "status": row[0].enrollment_status
        }
        for row in recent_enrollments_result.all()
    ]
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # 1. DROP/WITHDRAWAL RATE
    withdrawn = await db.scalar(
        select(func.count(Enrollment.id)).where(
            Enrollment.enrollment_status.in_(['withdrawn', 'dropped'])
        )
    ) or 0
    drop_rate = round((withdrawn / total_enrollments * 100) if total_enrollments > 0 else 0, 2)
    
    # 2. LOGIN FREQUENCY (using enrollment activity as proxy)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    daily_active = await db.scalar(
        select(func.count(func.distinct(Enrollment.user_id))).where(Enrollment.enrolled_at >= one_day_ago)
    ) or 0
    
    weekly_active = await db.scalar(
        select(func.count(func.distinct(Enrollment.user_id))).where(Enrollment.enrolled_at >= seven_days_ago)
    ) or 0
    
    monthly_active = await db.scalar(
        select(func.count(func.distinct(Enrollment.user_id))).where(Enrollment.enrolled_at >= thirty_days_ago)
    ) or 0
    
    # 3. TEST PASS RATES
    total_attempts = await db.scalar(select(func.count(AssessmentAttempt.id))) or 0
    passed_attempts = await db.scalar(
        select(func.count(AssessmentAttempt.id)).where(AssessmentAttempt.passed == True)
    ) or 0
    overall_pass_rate = round((passed_attempts / total_attempts * 100) if total_attempts > 0 else 0, 2)
    
    avg_score = await db.scalar(select(func.avg(AssessmentAttempt.score))) or 0
    
    first_attempt_passed = await db.scalar(
        select(func.count(AssessmentAttempt.id)).where(
            and_(AssessmentAttempt.attempt_number == 1, AssessmentAttempt.passed == True)
        )
    ) or 0
    
    first_attempts = await db.scalar(
        select(func.count(AssessmentAttempt.id)).where(AssessmentAttempt.attempt_number == 1)
    ) or 0
    
    first_attempt_pass_rate = round((first_attempt_passed / first_attempts * 100) if first_attempts > 0 else 0, 2)
    
    return {
        # Original metrics
        "totalTrainings": total_trainings or 0,
        "totalUsers": total_users or 0,
        "totalEnrollments": total_enrollments or 0,
        "completionRate": completion_rate,
        "popularTrainings": popular_trainings,
        "recentActivity": recent_enrollments,
        
        # New metrics
        "dropWithdrawalRate": {
            "total": withdrawn,
            "percentage": drop_rate
        },
        "loginFrequency": {
            "daily": daily_active,
            "weekly": weekly_active,
            "monthly": monthly_active
        },
        "testPassRates": {
            "totalAttempts": total_attempts,
            "passed": passed_attempts,
            "overallPassRate": overall_pass_rate,
            "averageScore": round(float(avg_score), 2) if avg_score else 0,
            "firstAttemptPassRate": first_attempt_pass_rate
        }
    }


@router.get("/trainings/detailed-metrics")
async def get_detailed_training_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin"))
):
    """Get detailed metrics for all trainings with enrollment and completion data"""
    from sqlalchemy import func, select, case
    from app.models.training import Training, Enrollment, EnrollmentStatus
    
    # Query to get training stats
    query = select(
        Training.id,
        Training.title,
        Training.category,
        func.count(Enrollment.id).label('enrolled'),
        func.sum(
            case(
                (Enrollment.enrollment_status == EnrollmentStatus.completed, 1),
                else_=0
            )
        ).label('completed')
    ).outerjoin(
        Enrollment, Training.id == Enrollment.training_id
    ).group_by(
        Training.id, Training.title, Training.category
    )
    
    result = await db.execute(query)
    trainings_data = []
    
    for row in result.all():
        enrolled = row.enrolled or 0
        completed = row.completed or 0
        completion_percentage = round((completed / enrolled * 100) if enrolled > 0 else 0, 1)
        
        trainings_data.append({
            "id": str(row.id),
            "title": row.title,
            "category": row.category,
            "enrolled": enrolled,
            "completed": completed,
            "completion_percentage": completion_percentage
        })
    
    return trainings_data


@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin"))
):
    """Get audit logs for admin dashboard"""
    from sqlalchemy import select
    from app.models.training import AuditLog
    
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "user_id": str(log.actor_user_id) if log.actor_user_id else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]