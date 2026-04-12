from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.models.lesson import Lesson
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.db.session import get_db
from app.api.v1.deps import require_roles
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=LessonResponse)
async def create_lesson(
    lesson: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    new_lesson = Lesson(**lesson.dict())
    db.add(new_lesson)
    await db.commit()
    await db.refresh(new_lesson)
    return new_lesson

@router.get("/module/{module_id}", response_model=List[LessonResponse])
async def get_lessons_by_module(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin", "Participant"))
):
    result = await db.execute(
        select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order_index)
    )
    lessons = result.scalars().all()
    return lessons

@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin", "Participant"))
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: UUID,
    lesson_update: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    update_data = lesson_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)
    
    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    await db.delete(lesson)
    await db.commit()
    return {"message": "Lesson deleted successfully"}

@router.put("/reorder")
async def reorder_lessons(
    lesson_ids: list[str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Reorder lessons by updating their order_index"""
    from sqlalchemy import select
    import uuid
    
    for index, lesson_id in enumerate(lesson_ids):
        result = await db.execute(
            select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
        )
        lesson = result.scalar_one_or_none()
        if lesson:
            lesson.order_index = index
    
    await db.commit()
    return {"message": "Lessons reordered successfully"}
