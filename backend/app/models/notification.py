from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification details
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # enrollment, completion, reminder, etc.
    
    # Status
    is_read = Column(Boolean, default=False)
    is_sent_email = Column(Boolean, default=False)
    
    # Metadata
    related_id = Column(UUID(as_uuid=True), nullable=True)  # enrollment_id, training_id, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Email preferences
    email_on_enrollment = Column(Boolean, default=True)
    email_on_completion = Column(Boolean, default=True)
    email_on_reminder = Column(Boolean, default=True)
    
    # In-app preferences
    inapp_on_enrollment = Column(Boolean, default=True)
    inapp_on_completion = Column(Boolean, default=True)
    inapp_on_reminder = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
