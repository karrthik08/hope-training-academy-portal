from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

class CourseContentBase(BaseModel):
    title: str
    content_type: str  # video, pdf, link, text
    content_value: Optional[str] = None
    order_index: int = 0

class CourseContentCreate(CourseContentBase):
    training_id: uuid.UUID

class CourseContentUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    content_value: Optional[str] = None
    order_index: Optional[int] = None

class CourseContentOut(CourseContentBase):
    id: uuid.UUID
    training_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
