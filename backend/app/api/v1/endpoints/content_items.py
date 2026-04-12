from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import shutil
import os
from pathlib import Path

from app.models.content_item import ContentItem
from app.schemas.content_item import ContentItemCreate, ContentItemUpdate, ContentItemResponse
from app.db.session import get_db
from app.api.v1.deps import require_roles
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = Path("uploads/content")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=ContentItemResponse)
async def create_content_item(
    content_item: ContentItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    new_content = ContentItem(**content_item.dict())
    db.add(new_content)
    await db.commit()
    await db.refresh(new_content)
    return new_content

@router.post("/upload")
async def upload_file(
    lesson_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    file_extension = os.path.splitext(file.filename)[1]
    file_path = UPLOAD_DIR / f"{lesson_id}_{file.filename}"
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    content_type = "pdf" if file_extension == ".pdf" else "image" if file_extension in [".png", ".jpg", ".jpeg"] else "document"
    
    new_content = ContentItem(
        lesson_id=lesson_id,
        content_type=content_type,
        title=file.filename,
        file_path=str(file_path),
        file_size=file_path.stat().st_size
    )
    db.add(new_content)
    await db.commit()
    await db.refresh(new_content)
    
    return {"message": "File uploaded successfully", "content_item": new_content}

@router.get("/lesson/{lesson_id}", response_model=List[ContentItemResponse])
async def get_content_items_by_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin", "Participant"))
):
    result = await db.execute(
        select(ContentItem).where(ContentItem.lesson_id == lesson_id).order_by(ContentItem.order_index)
    )
    items = result.scalars().all()
    return items

@router.get("/{content_id}", response_model=ContentItemResponse)
async def get_content_item(
    content_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin", "Participant"))
):
    result = await db.execute(select(ContentItem).where(ContentItem.id == content_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    return item

@router.put("/{content_id}", response_model=ContentItemResponse)
async def update_content_item(
    content_id: UUID,
    content_update: ContentItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    result = await db.execute(select(ContentItem).where(ContentItem.id == content_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    
    update_data = content_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{content_id}")
async def delete_content_item(
    content_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    result = await db.execute(select(ContentItem).where(ContentItem.id == content_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    
    if item.file_path and os.path.exists(item.file_path):
        os.remove(item.file_path)
    
    await db.delete(item)
    await db.commit()
    return {"message": "Content item deleted successfully"}
