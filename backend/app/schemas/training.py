from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class TrainingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = 0.00
    target_audience: Optional[str] = None
    delivery_type: str = "self-paced"
    duration_hours: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    video_url: Optional[str] = None
    dropbox_url: Optional[str] = None
    flyer_url: Optional[str] = None
    instructor_name: Optional[str] = None
    instructor_email: Optional[str] = None
    instructor_manual_url: Optional[str] = None
    knowledge_mgmt_folder_url: Optional[str] = None
    student_handbook_url: Optional[str] = None
    student_workbook_url: Optional[str] = None
    slides_url: Optional[str] = None
    qrc_surveys_url: Optional[str] = None
    status: str = "draft"

class TrainingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    target_audience: Optional[str] = None
    delivery_type: Optional[str] = None
    duration_hours: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    video_url: Optional[str] = None
    dropbox_url: Optional[str] = None
    flyer_url: Optional[str] = None
    instructor_name: Optional[str] = None
    instructor_email: Optional[str] = None
    instructor_manual_url: Optional[str] = None
    knowledge_mgmt_folder_url: Optional[str] = None
    student_handbook_url: Optional[str] = None
    student_workbook_url: Optional[str] = None
    slides_url: Optional[str] = None
    qrc_surveys_url: Optional[str] = None
    status: Optional[str] = None

class TrainingOut(BaseModel):
    id: UUID4
    title: str
    description: Optional[str]
    status: str
    category: Optional[str] = None
    price: Optional[float] = None
    target_audience: Optional[str] = None
    delivery_type: str
    duration_hours: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by_id: Optional[UUID4] = None
    created_by: UUID4
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    video_url: Optional[str] = None
    dropbox_url: Optional[str] = None
    flyer_url: Optional[str] = None
    instructor_name: Optional[str] = None
    instructor_email: Optional[str] = None
    instructor_manual_url: Optional[str] = None
    knowledge_mgmt_folder_url: Optional[str] = None
    student_handbook_url: Optional[str] = None
    student_workbook_url: Optional[str] = None
    slides_url: Optional[str] = None
    qrc_surveys_url: Optional[str] = None
    self_enrollment_enabled: Optional[bool] = False
    
    model_config = {"from_attributes": True}

class EnrollmentOut(BaseModel):
    id: UUID4
    user_id: UUID4
    training_id: UUID4
    enrollment_status: str
    enrolled_at: datetime
    canceled_at: Optional[datetime]
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None
    participant_email: Optional[str] = None
    
    
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