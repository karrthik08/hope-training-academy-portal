from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
import uuid

class CompletionCriteria(Base):
    __tablename__ = "completion_criteria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    training_id = Column(UUID(as_uuid=True), ForeignKey("trainings.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Criteria flags
    require_all_modules = Column(Boolean, default=True)
    require_assessment_pass = Column(Boolean, default=False)
    required_assessment_score = Column(String(10), default="80")  # percentage
    require_attendance = Column(Boolean, default=False)
    required_attendance_percentage = Column(String(10), default="80")
    
    # Auto-completion
    auto_complete_enabled = Column(Boolean, default=True)
    
    # Additional criteria as JSON
    additional_criteria = Column(JSON, default={})
