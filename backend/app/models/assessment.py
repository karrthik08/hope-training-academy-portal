from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, CheckConstraint, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    training_id = Column(UUID(as_uuid=True), ForeignKey("trainings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    assessment_type = Column(String(50), nullable=False)  # pre_test, post_test, quiz, knowledge_check, assignment
    time_limit_minutes = Column(Integer)
    passing_score = Column(Integer, default=70)
    max_attempts = Column(Integer, default=3)
    randomize_questions = Column(Boolean, default=False)
    show_correct_answers = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)
    available_from = Column(DateTime)
    available_until = Column(DateTime)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    training = relationship("Training", back_populates="assessments")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan", order_by="Question.order_index")
    responses = relationship("ParticipantResponse", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("assessment_type IN ('pre_test', 'post_test', 'quiz', 'knowledge_check', 'assignment')", name="valid_assessment_type"),
    )
