from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from datetime import datetime, timezone
import uuid
from app.db.session import get_db
from app.models.user import User
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

# All 25 required pre-onboarding trainings from the tracker Excel
REQUIRED_TRAININGS = [
    {"id": 1,  "category": "ACCESS / SSP Core", "title": "SSP Core Training Live Opening Session", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=GhQtx2fNl8Q", "deadline": "NOW - before Day 1", "proof": "Completion confirmation", "instructions": "Watch full opening session"},
    {"id": 2,  "category": "ACCESS / SSP Core", "title": "Foundations of Harm Reduction Training", "provider": "NHRC Learning Lab", "link": "https://nhrclearninglab.thinkific.com/courses/foundations-of-harm-reduction", "deadline": "NOW - before Day 1", "proof": "Certificate or completion screenshot", "instructions": "Complete course and upload proof"},
    {"id": 3,  "category": "ACCESS / SSP Core", "title": "Engaging People Who Use Drugs", "provider": "NHRC Learning Lab", "link": "https://nhrclearninglab.thinkific.com/courses/engaging-people-who-use-drugs", "deadline": "NOW - before Day 1", "proof": "Certificate or completion screenshot", "instructions": "Complete course and upload proof"},
    {"id": 4,  "category": "ACCESS / SSP Core", "title": "Safer Injection and Basic Wound Care", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=tj-KgFeQvX0", "deadline": "NOW - before Day 1", "proof": "Completion screenshot", "instructions": "Upload proof after viewing"},
    {"id": 5,  "category": "ACCESS / SSP Core", "title": "Fentanyl Test Strips", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=1NCunsvOQ4w", "deadline": "NOW - before Day 1", "proof": "Completion screenshot", "instructions": "Upload proof after viewing"},
    {"id": 6,  "category": "ACCESS / SSP Core", "title": "Overdose Response Program", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=JnuR8hQPNFc", "deadline": "NOW - before Day 1", "proof": "Completion screenshot", "instructions": "Upload proof after viewing"},
    {"id": 7,  "category": "ACCESS / SSP Core", "title": "De-Escalation and Conflict", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=GWxtK4pQt3s", "deadline": "NOW - before Day 1", "proof": "Completion screenshot", "instructions": "Upload proof after viewing"},
    {"id": 8,  "category": "ACCESS / SSP Core", "title": "Motivational Interviewing for People", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=RegIKqyZTa0", "deadline": "NOW - before Day 1", "proof": "Completion screenshot", "instructions": "Upload proof after viewing"},
    {"id": 9,  "category": "ACCESS / SSP Core", "title": "Maryland Overdose Response Program Training of Trainers", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=JnuR8hQPNFc", "deadline": "NOW - before Day 1", "proof": "Completion screenshot", "instructions": "Upload proof after viewing"},
    {"id": 10, "category": "ACCESS / SSP Core", "title": "SSP Core Training Live Closing Session", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=-kbe1b_oR7w", "deadline": "NOW - before Day 1", "proof": "Completion confirmation", "instructions": "Watch full closing session"},
    {"id": 11, "category": "ACCESS / SSP Core", "title": "Webinar Evaluation Form", "provider": "Microsoft Forms", "link": "https://forms.office.com/FormsPro/Pages/ResponsePage.aspx?id=4nL4BsSK5Uu3oQ-rodQLcc2NmvubjnlMkWCFEy2NzptUN0xDMVpBVEI1WjdFNzE3NEtZVk1SR0ZJWi4u", "deadline": "NOW - after session", "proof": "Form submission confirmation", "instructions": "Each class requires a form"},
    {"id": 12, "category": "Safety Training", "title": "CPR/AED/First-Aid", "provider": "NCPRF", "link": "https://ncprf.com/fkd4hd", "deadline": "NOW", "proof": "Certificate of completion", "instructions": "Required before Day 1"},
    {"id": 13, "category": "Safety Training", "title": "Bloodborne Pathogens", "provider": "NCPRF", "link": "https://ncprf.com/ytjnqn", "deadline": "NOW", "proof": "Certificate of completion", "instructions": "Required before Day 1"},
    {"id": 14, "category": "Peer Support", "title": "Peer Support Specialist Overview Video", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=su4bw9DbPOY", "deadline": "NOW", "proof": "Screenshot or note of completion", "instructions": "MABPCB certification required within 15 months"},
    {"id": 15, "category": "Youth Prevention", "title": "Youth Prevention Training (NCA Bootcamp)", "provider": "CADCA / NCA", "link": "", "deadline": "Within 1 year", "proof": "Certificate of completion", "instructions": "Await CADCA announcement"},
    {"id": 16, "category": "Core ORP + SSP", "title": "Naloxone 101 Online Course", "provider": "Toward the Heart", "link": "https://towardtheheart.com/naloxone-course", "deadline": "NOW", "proof": "Certificate or completion screenshot", "instructions": "Upload proof after completion"},
    {"id": 17, "category": "Core ORP + SSP", "title": "Naloxone Training (Tracked Version)", "provider": "PSHSA", "link": "https://www.pshsa.ca/resource/naloxone-training-elearning/", "deadline": "NOW", "proof": "Certificate or completion screenshot", "instructions": "Upload proof after completion"},
    {"id": 18, "category": "Core ORP + SSP", "title": "Harm Reduction and Street Outreach Specialist", "provider": "Connect for Recovery", "link": "https://connectforrecovery.org/courses/harm-reduction-and-street-outreach-specialist/", "deadline": "NOW", "proof": "Certificate or completion screenshot", "instructions": "Upload proof after completion"},
    {"id": 19, "category": "Core ORP + SSP", "title": "Harm Reduction Course", "provider": "Mainline Foundation", "link": "https://harmreductionschool.teachable.com/p/harm-reduction", "deadline": "NOW", "proof": "Certificate or completion screenshot", "instructions": "Upload proof after completion"},
    {"id": 20, "category": "Core ORP + SSP", "title": "CDC Talking About Naloxone", "provider": "CDC", "link": "https://www.cdc.gov/overdose-prevention/hcp/trainings/talking-about-naloxone.html", "deadline": "NOW", "proof": "Completion screenshot", "instructions": "Review and upload proof"},
    {"id": 21, "category": "PPW", "title": "PPW Registration", "provider": "SurveyMonkey", "link": "https://www.surveymonkey.com/r/Q8NSVF2", "deadline": "NOW", "proof": "Registration confirmation", "instructions": "Complete name and email registration first"},
    {"id": 22, "category": "PPW", "title": "Implementing the SPORT & Other Youth Substance Use Prevention Plus Wellness Programs", "provider": "YouTube", "link": "https://www.youtube.com/watch?v=vfDhoDBnUYM", "deadline": "NOW", "proof": "Completion screenshot", "instructions": "Review the full online training"},
    {"id": 23, "category": "PPW", "title": "PPW Evaluation", "provider": "SurveyMonkey", "link": "https://www.surveymonkey.com/r/YZVTZJT", "deadline": "NOW - after PPW training", "proof": "Evaluation confirmation", "instructions": "MUST enter 'Bridging Hope HOPEYA'"},
    {"id": 24, "category": "Safe Sleep", "title": "Safe Sleep Assessment Tool Training", "provider": "SharePoint / BHSB", "link": "", "deadline": "As assigned", "proof": "Completion confirmation", "instructions": "Request direct SharePoint link from HR"},
    {"id": 25, "category": "Gambling", "title": "Problem Gambling Training for Social Service Professionals: Module One", "provider": "ACORN", "link": "https://www.acorncourses.org/courses/oha-pgs-gambling-tx-module1", "deadline": "As assigned", "proof": "Certificate or completion screenshot", "instructions": "At least 2 gambling trainings required"},
]


@router.get("/trainings")
async def get_onboarding_trainings():
    """Get all 25 required pre-onboarding trainings."""
    return REQUIRED_TRAININGS


@router.get("/my-progress")
async def get_my_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's onboarding progress."""
    result = await db.execute(
        text("""
            SELECT training_id, dropbox_link, initials, date_completed,
                   notes, is_completed, created_at, updated_at
            FROM onboarding_progress
            WHERE user_id = :uid
        """),
        {"uid": str(current_user.id)}
    )
    rows = result.fetchall()
    progress = {}
    for r in rows:
        progress[r[0]] = {
            "training_id": r[0],
            "dropbox_link": r[1],
            "initials": r[2],
            "date_completed": r[3].isoformat() if r[3] else None,
            "notes": r[4],
            "is_completed": r[5],
        }

    # Get submission status
    sub = await db.execute(
        text("SELECT status, submitted_at, reviewed_at, reviewer_notes FROM onboarding_submissions WHERE user_id = :uid"),
        {"uid": str(current_user.id)}
    )
    submission = sub.fetchone()

    return {
        "progress": progress,
        "completed_count": sum(1 for p in progress.values() if p["is_completed"]),
        "total": 25,
        "submission": {
            "status": submission[0] if submission else None,
            "submitted_at": submission[1].isoformat() if submission and submission[1] else None,
            "reviewed_at": submission[2].isoformat() if submission and submission[2] else None,
            "reviewer_notes": submission[3] if submission else None,
        } if submission else None
    }


@router.post("/update-item")
async def update_onboarding_item(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a single onboarding training item."""
    training_id = payload.get("training_id")
    dropbox_link = payload.get("dropbox_link", "")
    initials = payload.get("initials", "")
    notes = payload.get("notes", "")
    is_completed = bool(dropbox_link and initials)

    # Upsert
    await db.execute(
        text("""
            INSERT INTO onboarding_progress
                (id, user_id, training_id, dropbox_link, initials, notes,
                 is_completed, date_completed, created_at, updated_at)
            VALUES
                (:id, :uid, :tid, :dl, :ini, :notes,
                 :done, :date, NOW(), NOW())
            ON CONFLICT (user_id, training_id)
            DO UPDATE SET
                dropbox_link = :dl,
                initials = :ini,
                notes = :notes,
                is_completed = :done,
                date_completed = :date,
                updated_at = NOW()
        """),
        {
            "id": str(uuid.uuid4()),
            "uid": str(current_user.id),
            "tid": training_id,
            "dl": dropbox_link,
            "ini": initials,
            "notes": notes,
            "done": is_completed,
            "date": datetime.now(timezone.utc) if is_completed else None,
        }
    )
    await db.commit()
    return {"success": True, "is_completed": is_completed}


@router.post("/submit")
async def submit_for_review(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit onboarding tracker for admin review."""
    signature = payload.get("signature", "")
    if not signature:
        raise HTTPException(status_code=400, detail="Signature required")

    await db.execute(
        text("""
            INSERT INTO onboarding_submissions
                (id, user_id, signature, status, submitted_at, created_at, updated_at)
            VALUES (:id, :uid, :sig, 'pending', NOW(), NOW(), NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                signature = :sig,
                status = 'pending',
                submitted_at = NOW(),
                updated_at = NOW()
        """),
        {
            "id": str(uuid.uuid4()),
            "uid": str(current_user.id),
            "sig": signature,
        }
    )
    await db.commit()
    return {"success": True, "message": "Submitted for review"}


@router.get("/admin/all-progress")
async def admin_get_all_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: Get all users' onboarding progress."""
    # Check admin role
    roles_result = await db.execute(
        text("SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :uid"),
        {"uid": str(current_user.id)}
    )
    roles = [r[0] for r in roles_result.fetchall()]
    if "Admin" not in roles and "Instructor" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        text("""
            SELECT
                u.id, u.full_name, u.email,
                COUNT(op.id) FILTER (WHERE op.is_completed = true) as completed,
                os.status, os.submitted_at, os.reviewed_at
            FROM users u
            LEFT JOIN onboarding_progress op ON op.user_id = u.id
            LEFT JOIN onboarding_submissions os ON os.user_id = u.id
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id AND r.name = 'Participant'
            GROUP BY u.id, u.full_name, u.email, os.status, os.submitted_at, os.reviewed_at
            ORDER BY os.submitted_at DESC NULLS LAST, u.full_name
        """)
    )
    rows = result.fetchall()
    return [
        {
            "user_id": str(r[0]),
            "full_name": r[1],
            "email": r[2],
            "completed": r[3] or 0,
            "total": 25,
            "status": r[4],
            "submitted_at": r[5].isoformat() if r[5] else None,
            "reviewed_at": r[6].isoformat() if r[6] else None,
        }
        for r in rows
    ]


@router.get("/admin/user-progress/{user_id}")
async def admin_get_user_progress(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: Get specific user's full onboarding progress."""
    roles_result = await db.execute(
        text("SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :uid"),
        {"uid": str(current_user.id)}
    )
    roles = [r[0] for r in roles_result.fetchall()]
    if "Admin" not in roles and "Instructor" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get user info
    user = await db.execute(
        text("SELECT full_name, email FROM users WHERE id = :uid"),
        {"uid": user_id}
    )
    user_row = user.fetchone()

    # Get progress
    result = await db.execute(
        text("SELECT training_id, dropbox_link, initials, date_completed, notes, is_completed FROM onboarding_progress WHERE user_id = :uid"),
        {"uid": user_id}
    )
    progress = {}
    for r in result.fetchall():
        progress[r[0]] = {
            "training_id": r[0],
            "dropbox_link": r[1],
            "initials": r[2],
            "date_completed": r[3].isoformat() if r[3] else None,
            "notes": r[4],
            "is_completed": r[5],
        }

    # Get submission
    sub = await db.execute(
        text("SELECT status, submitted_at, signature, reviewer_notes FROM onboarding_submissions WHERE user_id = :uid"),
        {"uid": user_id}
    )
    submission = sub.fetchone()

    return {
        "user": {"full_name": user_row[0], "email": user_row[1]},
        "progress": progress,
        "completed_count": sum(1 for p in progress.values() if p["is_completed"]),
        "submission": {
            "status": submission[0] if submission else None,
            "submitted_at": submission[1].isoformat() if submission and submission[1] else None,
            "signature": submission[2] if submission else None,
            "reviewer_notes": submission[3] if submission else None,
        } if submission else None
    }


@router.post("/admin/approve/{user_id}")
async def admin_approve(
    user_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: Approve or request changes for a user's onboarding."""
    roles_result = await db.execute(
        text("SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :uid"),
        {"uid": str(current_user.id)}
    )
    roles = [r[0] for r in roles_result.fetchall()]
    if "Admin" not in roles and "Instructor" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    status = payload.get("status", "approved")  # approved | needs_revision
    reviewer_notes = payload.get("reviewer_notes", "")

    await db.execute(
        text("""
            UPDATE onboarding_submissions
            SET status = :status,
                reviewer_notes = :notes,
                reviewed_at = NOW(),
                reviewer_id = :rid,
                updated_at = NOW()
            WHERE user_id = :uid
        """),
        {
            "status": status,
            "notes": reviewer_notes,
            "rid": str(current_user.id),
            "uid": user_id,
        }
    )
    await db.commit()
    return {"success": True, "status": status}