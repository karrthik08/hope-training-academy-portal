from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class ContentItemBase(BaseModel):
    content_type: str
    title: str
    description: Optional[str] = None
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    duration_minutes: Optional[int] = None
    order_index: int = 0
    is_required: bool = True

class ContentItemCreate(ContentItemBase):
    lesson_id: UUID

class ContentItemUpdate(BaseModel):
    content_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    duration_minutes: Optional[int] = None
    order_index: Optional[int] = None
    is_required: Optional[bool] = None

class ContentItemResponse(ContentItemBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
