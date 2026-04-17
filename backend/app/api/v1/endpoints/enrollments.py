from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from typing import List
import uuid
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.user import User
from app.models.training import Training, Enrollment, EnrollmentStatus, TrainingStatus
from app.models.user import UserRole
from app.schemas.training import EnrollmentOut
from pydantic import BaseModel
from app.api.v1.deps import get_current_user, require_roles
from app.services.audit import log_action
from app.services.email_service import notify_training_enrollment, notify_training_completion


router = APIRouter(prefix="/enrollments", tags=["enrollments"])

class EnrollByEmailRequest(BaseModel):
    training_id: str
    email: str


class EnrollByEmailRequest(BaseModel):
    training_id: str
    email: str



@router.post("/bulk-enroll")
async def bulk_enroll(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Bulk enroll users by email"""
    user_emails = data.get("user_emails", [])
    training_id = uuid.UUID(data.get("training_id"))
    results = {"success": [], "failed": []}
    
    # Get training title once for all notifications
    training_result = await db.execute(select(Training).where(Training.id == training_id))
    training = training_result.scalar_one_or_none()
    
    for email in user_emails:
        try:
            user_result = await db.execute(
                select(User).where(User.email == email)
            )
            user = user_result.scalar_one_or_none()
            
            if not user:
                results["failed"].append({"email": email, "reason": "User not found"})
                continue
            existing = await db.execute(
                select(Enrollment).where(
                    Enrollment.user_id == user.id,
                    Enrollment.training_id == training_id
                )
            )
            if existing.scalar_one_or_none():
                results["failed"].append({"email": email, "reason": "Already enrolled"})
                continue
            
            enrollment = Enrollment(
                user_id=user.id,
                training_id=training_id,
                enrollment_status=EnrollmentStatus.enrolled
            )
            db.add(enrollment)
            results["success"].append(email)
            
            # Send notification email
            if training:
                await notify_training_enrollment(
                    user_name=user.full_name,
                    user_email=user.email,
                    training_title=training.title
                )
            
        except Exception as e:
            results["failed"].append({"email": email, "reason": str(e)})
    
    await db.commit()
    return results




@router.post("/enroll-by-email")
async def enroll_by_email(
    payload: EnrollByEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Enroll a user by their email address"""
    from sqlalchemy import select
    from app.models.user import User
    
    training_id = uuid.UUID(payload.training_id)
    email = payload.email

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found with email: {email}")

    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user.id,
            Enrollment.training_id == training_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already enrolled in this training")
    
    training_result = await db.execute(select(Training).where(Training.id == training_id))
    training = training_result.scalar_one_or_none()
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=user.id,
        training_id=training_id,
        enrollment_status=EnrollmentStatus.enrolled
    )
    db.add(enrollment)
    await db.commit()
    
    # Send notification email
    if training:
        await notify_training_enrollment(
            user_name=user.full_name,
            user_email=user.email,
            training_title=training.title
        )
    
    return {"message": "User enrolled successfully", "user_email": email}

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
    
    # Send notification email
    await notify_training_enrollment(
        user_name=current_user.full_name,
        user_email=current_user.email,
        training_title=training.title
    )
    
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
    
    # Get training title for notification
    training = await db.get(Training, training_id)
    
    # Send notification email
    if training:
        await notify_training_completion(
            user_name=current_user.full_name,
            user_email=current_user.email,
            training_title=training.title,
            certificate_id=cert_id
        )
    
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
                e.id::text             AS certificate_id,
                SUBSTRING(e.id::text, 1, 8) AS verification_code,
                NOW()                  AS completed_at,
                u.full_name            AS participant_name,
                t.title                AS training_title,
                t.duration_hours,
                t.certificate_template,
                t.category,
                e.id                   AS enrollment_id,
                e.enrollment_status
            FROM enrollments e
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
    
    # Check if enrollment is completed
    if row[9] != 'completed':  
        raise HTTPException(status_code=400, detail="Training not yet completed")

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
@router.get("/{enrollment_id}/details", response_model=EnrollmentOut)
async def get_enrollment_by_id(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.training))
        .where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if enrollment.user_id != current_user.id and not any(ur.role.name == "Admin" for ur in current_user.user_roles):
        raise HTTPException(status_code=403, detail="Not authorized to view this enrollment")
    
    return enrollment

@router.put("/trainings/{training_id}/self-enrollment")
async def toggle_self_enrollment(
    training_id: uuid.UUID,
    enabled: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Toggle self-enrollment for a training"""
    from sqlalchemy import text
    print(f"🔧 TOGGLE CALLED: training_id={training_id}, enabled={enabled}")
    
    # Use direct SQL update
    await db.execute(
        text("UPDATE trainings SET self_enrollment_enabled = :enabled WHERE id = :training_id"),
        {"enabled": enabled, "training_id": training_id}
    )
    await db.commit()
    
    # Verify it was saved
    result = await db.execute(
        text("SELECT title, self_enrollment_enabled FROM trainings WHERE id = :training_id"),
        {"training_id": training_id}
    )
    row = result.fetchone()
    print(f"✅ VERIFIED IN DB: {row[0] if row else 'NOT FOUND'} self_enrollment_enabled={row[1] if row else 'N/A'}")
    
    return {"message": f"Self-enrollment {'enabled' if enabled else 'disabled'}", "enabled": enabled}

@router.get("/available-users/{training_id}")
async def get_available_users(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Get users who are not yet enrolled in this training"""
    enrolled_result = await db.execute(
        select(Enrollment.user_id).where(Enrollment.training_id == training_id)
    )
    enrolled_ids = [row[0] for row in enrolled_result.all()]
    
    # Get users who are not enrolled and have Participant role
    users_result = await db.execute(
        select(User, UserRole.role_id)
        .join(UserRole, User.id == UserRole.user_id)
        .where(
            UserRole.role_id == 3,  # Participant role
            ~User.id.in_(enrolled_ids) if enrolled_ids else True
        )
    )
    
    users = []
    for user, _ in users_result.all():
        users.append({
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email
        })
    
    return users

class BulkEnrollRequest(BaseModel):
    user_emails: List[str]
    training_id: str


@router.post("/self-enroll/{training_id}")
async def self_enroll(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Self-enroll current user in a training"""
    training_result = await db.execute(
        select(Training).where(Training.id == training_id)
    )
    training = training_result.scalar_one_or_none()
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    if not training.self_enrollment_enabled:
        raise HTTPException(status_code=403, detail="Self-enrollment not enabled for this training")
    
    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.training_id == training_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled")
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=current_user.id,
        training_id=training_id,
        enrollment_status=EnrollmentStatus.enrolled
    )
    db.add(enrollment)
    await db.commit()
    
    # Send notification email
    await notify_training_enrollment(
        user_name=current_user.full_name,
        user_email=current_user.email,
        training_title=training.title
    )
    
    return {"message": "Successfully enrolled", "training_title": training.title}

@router.delete("/remove/{enrollment_id}")
async def delete_enrollment(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Delete remove an enrollment"""
    from sqlalchemy import text
    
    enrollment = await db.get(Enrollment, enrollment_id)
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    await db.execute(
        text("DELETE FROM completions WHERE enrollment_id = :enrollment_id"),
        {"enrollment_id": enrollment_id}
    )
    await db.delete(enrollment)
    await db.commit()
    
    return {"message": "Enrollment removed successfully"}