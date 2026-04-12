from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class CommentCreate(BaseModel):
    training_id: UUID4
    comment_text: str

class CommentUpdate(BaseModel):
    comment_text: str

class CommentOut(BaseModel):
    id: UUID4
    training_id: UUID4
    user_id: UUID4
    user_full_name: Optional[str] = None
    comment_text: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
