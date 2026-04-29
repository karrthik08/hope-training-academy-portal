from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import uuid
from app.db.session import get_db
from app.models.user import User
from app.models.training import Training, TrainingStatus
from app.schemas.training import TrainingCreate, TrainingUpdate, TrainingOut
from app.api.v1.deps import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/trainings", tags=["trainings"])


@router.get("/all", response_model=List[TrainingOut])
async def list_all_trainings(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),  # Changed to dict
    status: Optional[str] = None,
    category: Optional[str] = None,
):
    """
    Get all trainings - for admin and instructor dashboards.
    
    Query Parameters:
    - status: Filter by training status
    - category: Filter by category
    
    Access Control:
    - Admins: See all trainings
    - Instructors: See only their own trainings
    - Participants: Forbidden
    """
    # Get user roles from the token
    user_roles = current_user.get("roles", [])
    user_email = current_user.get("email", "")
    
    # Check if user has required role
    if "Admin" not in user_roles and "Instructor" not in user_roles:
        raise HTTPException(
            status_code=403,
            detail="Only admins and instructors can access this endpoint"
        )
    
    # Start building query
    query = select(Training)
    
    # If instructor (not admin), filter to their trainings
    if "Instructor" in user_roles and "Admin" not in user_roles:
        query = query.where(Training.instructor_email == user_email)
    
    # Apply status filter if provided
    if status:
        query = query.where(Training.status == status)
    
    # Apply category filter if provided
    if category:
        query = query.where(Training.category == category)
    
    # Order by most recent first
    query = query.order_by(Training.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    return result.scalars().all()

# ============================================================================
# Original endpoints - using require_roles for endpoints that need User object
# ============================================================================

@router.get("/public", response_model=List[TrainingOut])
async def list_published_trainings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Training).where(Training.status == TrainingStatus.published))
    return result.scalars().all()

@router.get("/{training_id}", response_model=TrainingOut)
async def get_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single training by ID"""
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    return training

@router.post("/", response_model=TrainingOut, status_code=201)
async def create_training(
    payload: TrainingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles and "Instructor" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins and instructors can create trainings")
    
    training = Training(**payload.model_dump(), created_by=current_user["sub"])
    db.add(training)
    await db.flush()
    await log_action(db, current_user["sub"], "create", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.put("/{training_id}", response_model=TrainingOut)
async def update_training(
    training_id: uuid.UUID,
    payload: TrainingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles and "Instructor" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins and instructors can update trainings")
    
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(training, field, value)
    await log_action(db, current_user["sub"], "update", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.post("/{training_id}/submit", response_model=TrainingOut)
async def submit_for_review(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles and "Instructor" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins and instructors can submit trainings")
    
    training = await db.get(Training, training_id)
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    if training.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft courses can be submitted for review")
    
    training.status = "submitted"
    training.submitted_at = datetime.utcnow()
    
    await log_action(db, current_user["sub"], "submit", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    
    return training

@router.patch("/{training_id}/approve", response_model=TrainingOut)
async def approve_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins can approve trainings")
    
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    training.status = TrainingStatus.approved
    await log_action(db, current_user["sub"], "approve", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.post("/{training_id}/reject", response_model=TrainingOut)
async def reject_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins can reject trainings")
    
    training = await db.get(Training, training_id)
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    if training.status not in ["submitted", "approved"]:
        raise HTTPException(status_code=400, detail="Only submitted or approved courses can be rejected")
    
    training.status = "draft"
    
    await log_action(db, current_user["sub"], "reject", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    
    return training

@router.patch("/{training_id}/publish", response_model=TrainingOut)
async def publish_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles and "Instructor" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins and instructors can publish trainings")
    
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    if training.status not in (TrainingStatus.approved, TrainingStatus.published):
        raise HTTPException(status_code=400, detail="Training must be approved before publishing")
    training.status = TrainingStatus.published
    await log_action(db, current_user["sub"], "publish", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.patch("/{training_id}/unpublish", response_model=TrainingOut)
async def unpublish_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check roles
    user_roles = current_user.get("roles", [])
    if "Admin" not in user_roles and "Instructor" not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins and instructors can unpublish trainings")
    
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    training.status = TrainingStatus.approved
    await log_action(db, current_user["sub"], "unpublish", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training