from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from app.db.session import get_db
from app.models.user import User
from app.models.course_content import CourseContent
from app.schemas.course_content import CourseContentCreate, CourseContentUpdate, CourseContentOut
from app.api.v1.deps import require_roles

router = APIRouter(prefix="/course-content", tags=["course-content"])

@router.get("/training/{training_id}", response_model=List[CourseContentOut])
async def get_course_content(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all content for a specific training (ordered by order_index)"""
    result = await db.execute(
        select(CourseContent)
        .where(CourseContent.training_id == training_id)
        .order_by(CourseContent.order_index)
    )
    return result.scalars().all()

@router.post("/", response_model=CourseContentOut, status_code=201)
async def create_content(
    payload: CourseContentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    """Create new course content item"""
    content = CourseContent(**payload.model_dump())
    db.add(content)
    await db.commit()
    await db.refresh(content)
    return content

@router.put("/{content_id}", response_model=CourseContentOut)
async def update_content(
    content_id: uuid.UUID,
    payload: CourseContentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    """Update course content item"""
    content = await db.get(CourseContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(content, field, value)
    
    await db.commit()
    await db.refresh(content)
    return content

@router.delete("/{content_id}")
async def delete_content(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Instructor")),
):
    """Delete course content item"""
    content = await db.get(CourseContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    await db.delete(content)
    await db.commit()
    return {"message": "Content deleted successfully"}
