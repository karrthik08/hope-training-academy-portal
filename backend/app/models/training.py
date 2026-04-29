import uuid, enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, UniqueConstraint, Integer, Boolean, Numeric
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from typing import Optional

def utcnow():
    return datetime.now(timezone.utc)

class TrainingStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    published = "published"
    rejected = "rejected"
    archived = "archived"

class EnrollmentStatus(str, enum.Enum):
    enrolled = "enrolled"
    canceled = "canceled"
    completed = "completed"

class Training(Base):
    __tablename__ = "trainings"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(precision=10, scale=2), nullable=True, server_default='0.00')
    
    # Course details
    target_audience: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    delivery_type: Mapped[str] = mapped_column(String(50), default="self-paced")
    duration_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Media
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    dropbox_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    flyer_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Instructor info
    instructor_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    instructor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
            
    # Enrollment settings
    self_enrollment_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default='false')
    
    # Dates
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    start_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Workflow status
    status: Mapped[str] = mapped_column(String(50), default=TrainingStatus.draft)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Created by
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    # Additional resources
    instructor_manual_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    knowledge_mgmt_folder_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    student_handbook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    student_workbook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    slides_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    qrc_surveys_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relations
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    approved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by_id])
    enrollments: Mapped[list["Enrollment"]] = relationship("Enrollment", back_populates="training")
    assessments: Mapped[list["Assessment"]] = relationship("Assessment", back_populates="training", cascade="all, delete-orphan")
    comments: Mapped[list["TrainingComment"]] = relationship("TrainingComment", back_populates="training", cascade="all, delete-orphan")

class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "training_id"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    training_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trainings.id"))
    enrollment_status: Mapped[str] = mapped_column(String(50), default=EnrollmentStatus.enrolled)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    user: Mapped["User"] = relationship("User", back_populates="enrollments")
    training: Mapped["Training"] = relationship("Training", back_populates="enrollments")
    completion: Mapped[Optional["Completion"]] = relationship("Completion", back_populates="enrollment", uselist=False)

class Completion(Base):
    __tablename__ = "completions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("enrollments.id"), unique=True)
    completed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    certificate_id: Mapped[str] = mapped_column(String(100), unique=True)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    verification_code: Mapped[str] = mapped_column(String(100), unique=True)
    enrollment: Mapped["Enrollment"] = relationship("Enrollment", back_populates="completion")
    completer: Mapped["User"] = relationship("User", foreign_keys=[completed_by])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)