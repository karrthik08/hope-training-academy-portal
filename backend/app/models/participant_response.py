from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base

class ParticipantResponse(Base):
    __tablename__ = "participant_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id", ondelete="CASCADE"))
    response_text = Column(Text)  # For short answer/essay
    selected_option_id = Column(UUID(as_uuid=True), ForeignKey("question_options.id"))  # For multiple choice
    is_correct = Column(Boolean)
    points_earned = Column(Integer, default=0)
    attempt_number = Column(Integer, default=1)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    feedback = Column(Text)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question", back_populates="responses")
    user = relationship("User", foreign_keys=[user_id])
    grader = relationship("User", foreign_keys=[graded_by])
    selected_option = relationship("QuestionOption")
    enrollment = relationship("Enrollment")
    
    __table_args__ = (
        UniqueConstraint('question_id', 'user_id', 'attempt_number', name='unique_question_user_attempt'),
    )
