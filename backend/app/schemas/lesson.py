from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0
    is_required: bool = True

class LessonCreate(LessonBase):
    module_id: UUID

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_required: Optional[bool] = None

class LessonResponse(LessonBase):
    id: UUID
    module_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
