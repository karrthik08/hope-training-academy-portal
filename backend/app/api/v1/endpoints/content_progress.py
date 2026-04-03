from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.content_progress import ContentProgress
from app.models.training import Enrollment
from app.schemas.content_progress import ContentProgressCreate, ContentProgressUpdate, ContentProgressOut
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/content-progress", tags=["content-progress"])

@router.get("/enrollment/{enrollment_id}", response_model=List[ContentProgressOut])
async def get_progress(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all content progress for an enrollment"""
    result = await db.execute(
        select(ContentProgress).where(ContentProgress.enrollment_id == enrollment_id)
    )
    return result.scalars().all()

@router.post("/mark-complete", response_model=ContentProgressOut)
async def mark_complete(
    enrollment_id: uuid.UUID,
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a content item as complete"""
    # Check if progress record exists
    result = await db.execute(
        select(ContentProgress).where(
            ContentProgress.enrollment_id == enrollment_id,
            ContentProgress.content_id == content_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if progress:
        # Update existing
        progress.completed = True
        progress.completed_at = datetime.utcnow()
    else:
        # Create new
        progress = ContentProgress(
            enrollment_id=enrollment_id,
            content_id=content_id,
            completed=True,
            completed_at=datetime.utcnow()
        )
        db.add(progress)
    
    await db.commit()
    await db.refresh(progress)
    return progress

@router.post("/mark-incomplete", response_model=ContentProgressOut)
async def mark_incomplete(
    enrollment_id: uuid.UUID,
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a content item as incomplete"""
    result = await db.execute(
        select(ContentProgress).where(
            ContentProgress.enrollment_id == enrollment_id,
            ContentProgress.content_id == content_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    progress.completed = False
    progress.completed_at = None
    
    await db.commit()
    await db.refresh(progress)
    return progress
