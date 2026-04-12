from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.models.module import Module
from app.schemas.module import ModuleCreate, ModuleUpdate, ModuleResponse
from app.db.session import get_db
from app.api.v1.deps import require_roles
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ModuleResponse)
async def create_module(
    module: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    new_module = Module(**module.dict())
    db.add(new_module)
    await db.commit()
    await db.refresh(new_module)
    return new_module

@router.get("/training/{training_id}", response_model=List[ModuleResponse])
async def get_modules_by_training(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin", "Participant"))
):
    result = await db.execute(
        select(Module).where(Module.training_id == training_id).order_by(Module.order_index)
    )
    modules = result.scalars().all()
    return modules

@router.get("/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin", "Participant"))
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

@router.put("/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: UUID,
    module_update: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    update_data = module_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)
    
    await db.commit()
    await db.refresh(module)
    return module

@router.delete("/{module_id}")
async def delete_module(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    await db.delete(module)
    await db.commit()
    return {"message": "Module delete successfully"}

@router.put("/modules/reorder")
async def reorder_modules(
    module_orders: List[dict],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Update order_index for multiple modules"""
    for item in module_orders:
        module_id = item["id"]
        new_order = item["order_index"]
        
        result = await db.execute(
            select(Module).where(Module.id == module_id)
        )
        module = result.scalar_one_or_none()
        
        if module:
            module.order_index = new_order
    
    await db.commit()
    return {"message": "Modules reordered successfully"}

@router.put("/lessons/reorder")
async def reorder_lessons(
    lesson_orders: List[dict],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Update order_index for multiple lessons"""
    for item in lesson_orders:
        lesson_id = item["id"]
        new_order = item["order_index"]
        
        result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = result.scalar_one_or_none()
        
        if lesson:
            lesson.order_index = new_order
    
    await db.commit()
    return {"message": "Lessons reordered successfully"}

@router.put("/content-items/reorder")
async def reorder_content_items(
    content_orders: List[dict],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Update order_index for multiple content items"""
    for item in content_orders:
        content_id = item["id"]
        new_order = item["order_index"]
        
        result = await db.execute(
            select(ContentItem).where(ContentItem.id == content_id)
        )
        content_item = result.scalar_one_or_none()
        
        if content_item:
            content_item.order_index = new_order
    
    await db.commit()
    return {"message": "Content items reordered successfully"}

@router.put("/reorder")
async def reorder_modules(
    module_ids: list[str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Reorder modules by updating their order_index"""
    from sqlalchemy import select
    import uuid
    
    for index, module_id in enumerate(module_ids):
        result = await db.execute(
            select(Module).where(Module.id == uuid.UUID(module_id))
        )
        module = result.scalar_one_or_none()
        if module:
            module.order_index = index
    
    await db.commit()
    return {"message": "Modules reordered successfully"}
