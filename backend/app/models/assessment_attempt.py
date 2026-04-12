from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id", ondelete="CASCADE"))
    attempt_number = Column(Integer, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime)
    score = Column(DECIMAL(5, 2))  # Percentage score
    total_points = Column(Integer)
    points_earned = Column(Integer)
    passed = Column(Boolean)
    time_spent_seconds = Column(Integer)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="attempts")
    user = relationship("User")
    enrollment = relationship("Enrollment")
    
    __table_args__ = (
        UniqueConstraint('assessment_id', 'user_id', 'attempt_number', name='unique_assessment_user_attempt'),
    )
