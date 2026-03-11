from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class TrainingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class TrainingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class TrainingOut(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    status: str
    created_by: UUID4
    start_at: Optional[datetime]
    end_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class EnrollmentOut(BaseModel):
    id: UUID4
    user_id: UUID4
    training_id: UUID4
    enrollment_status: str
    enrolled_at: datetime
    canceled_at: Optional[datetime]
    model_config = {"from_attributes": True}

class AttendanceCreate(BaseModel):
    enrollment_id: UUID4
    attendance_status: str

class CompletionOut(BaseModel):
    id: UUID4
    enrollment_id: UUID4
    completed_at: datetime
    certificate_id: str
    certificate_url: Optional[str]
    verification_code: str
    model_config = {"from_attributes": True}

class AuditLogOut(BaseModel):
    id: UUID4
    actor_user_id: UUID4
    action: str
    entity_type: str
    entity_id: str
    created_at: datetime
    model_config = {"from_attributes": True}