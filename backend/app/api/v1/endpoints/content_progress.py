from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
import uuid
from datetime import datetime, timezone
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

@router.post("/complete")
async def mark_content_complete(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark content as complete - supports both content_id (old) and content_id (new content_items)"""
    enrollment_id = uuid.UUID(payload['enrollment_id'])
    content_id = uuid.UUID(payload['content_id'])  # This is actually content_item_id now
    
    # Check if progress record exists for this content_item
    result = await db.execute(
        select(ContentProgress).where(
            ContentProgress.enrollment_id == enrollment_id,
            ContentProgress.content_item_id == content_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if progress:
        progress.completed = True
        progress.completed_at = datetime.now(timezone.utc)
    else:
        progress = ContentProgress(
            enrollment_id=enrollment_id,
            content_item_id=content_id,  # Use content_item_id for new items
            completed=True,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(progress)
    
    await db.commit()
    await db.refresh(progress)
    return {"message": "Content marked as complete", "progress": progress}

@router.post("/incomplete")
async def mark_content_incomplete(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark content as incomplete"""
    enrollment_id = uuid.UUID(payload['enrollment_id'])
    content_id = uuid.UUID(payload['content_id'])  # This is actually content_item_id now
    
    result = await db.execute(
        select(ContentProgress).where(
            ContentProgress.enrollment_id == enrollment_id,
            ContentProgress.content_item_id == content_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if progress:
        progress.completed = False
        progress.completed_at = None
        await db.commit()
        await db.refresh(progress)
        return {"message": "Content marked as incomplete", "progress": progress}
    else:
        raise HTTPException(status_code=404, detail="Progress record not found")
