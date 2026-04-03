from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid
from app.db.session import get_db
from app.models.user import User
from app.models.training import Training, TrainingStatus
from app.schemas.training import TrainingCreate, TrainingUpdate, TrainingOut
from app.api.v1.deps import get_current_user, require_roles
from app.services.audit import log_action

router = APIRouter(prefix="/trainings", tags=["trainings"])

@router.get("/public", response_model=List[TrainingOut])
async def list_published_trainings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Training).where(Training.status == TrainingStatus.published))
    return result.scalars().all()

@router.get("/", response_model=List[TrainingOut])
async def list_all_trainings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    result = await db.execute(select(Training))
    return result.scalars().all()

@router.post("/", response_model=TrainingOut, status_code=201)
async def create_training(
    payload: TrainingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    training = Training(**payload.model_dump(), created_by=current_user.id)
    db.add(training)
    await db.flush()
    await log_action(db, current_user.id, "create", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.put("/{training_id}", response_model=TrainingOut)
async def update_training(
    training_id: uuid.UUID,
    payload: TrainingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(training, field, value)
    await log_action(db, current_user.id, "update", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.post("/{training_id}/submit", response_model=TrainingOut)
async def submit_for_review(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    training = await db.get(Training, training_id)
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    if training.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft courses can be submitted for review")
    
    training.status = "submitted"
    training.submitted_at = datetime.utcnow()
    
    await log_action(db, current_user.id, "submit", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    
    return training

@router.patch("/{training_id}/approve", response_model=TrainingOut)
async def approve_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    training.status = TrainingStatus.approved
    await log_action(db, current_user.id, "approve", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.post("/{training_id}/reject", response_model=TrainingOut)
async def reject_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    training = await db.get(Training, training_id)
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    # Allow rejecting both submitted and approved courses
    if training.status not in ["submitted", "approved"]:
        raise HTTPException(status_code=400, detail="Only submitted or approved courses can be rejected")
    
    training.status = "draft"
    
    await log_action(db, current_user.id, "reject", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    
    return training

@router.patch("/{training_id}/publish", response_model=TrainingOut)
async def publish_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    if training.status not in (TrainingStatus.approved, TrainingStatus.published):
        raise HTTPException(status_code=400, detail="Training must be approved before publishing")
    training.status = TrainingStatus.published
    await log_action(db, current_user.id, "publish", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training

@router.patch("/{training_id}/unpublish", response_model=TrainingOut)
async def unpublish_training(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    training = await db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    training.status = TrainingStatus.approved
    await log_action(db, current_user.id, "unpublish", "Training", str(training.id))
    await db.commit()
    await db.refresh(training)
    return training