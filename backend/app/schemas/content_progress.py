from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

class ContentProgressBase(BaseModel):
    enrollment_id: uuid.UUID
    content_id: uuid.UUID
    completed: bool = False

class ContentProgressCreate(ContentProgressBase):
    pass

class ContentProgressUpdate(BaseModel):
    completed: bool

class ContentProgressOut(ContentProgressBase):
    id: uuid.UUID
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
