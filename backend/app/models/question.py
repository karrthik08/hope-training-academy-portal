from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # multiple_choice, true_false, short_answer, essay, matching
    points = Column(Integer, default=1)
    order_index = Column(Integer, default=0)
    correct_answer = Column(Text)  # For true/false and short answer
    explanation = Column(Text)
    is_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", order_by="QuestionOption.order_index")
    responses = relationship("ParticipantResponse", back_populates="question", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching')", name="valid_question_type"),
    )
