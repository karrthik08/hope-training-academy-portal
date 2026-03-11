import uuid, enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class TrainingStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    published = "published"
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
    status: Mapped[str] = mapped_column(String(50), default=TrainingStatus.draft)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    enrollments: Mapped[list["Enrollment"]] = relationship("Enrollment", back_populates="training")

class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "training_id"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    training_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trainings.id"))
    enrollment_status: Mapped[str] = mapped_column(String(50), default=EnrollmentStatus.enrolled)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    canceled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    user: Mapped["User"] = relationship("User", back_populates="enrollments")
    training: Mapped["Training"] = relationship("Training", back_populates="enrollments")
    attendance: Mapped[list["Attendance"]] = relationship("Attendance", back_populates="enrollment")
    completion: Mapped["Completion"] = relationship("Completion", back_populates="enrollment", uselist=False)

class Attendance(Base):
    __tablename__ = "attendances"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("enrollments.id"))
    attendance_status: Mapped[str] = mapped_column(String(50), nullable=False)
    marked_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    marked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    enrollment: Mapped["Enrollment"] = relationship("Enrollment", back_populates="attendance")
    marker: Mapped["User"] = relationship("User", foreign_keys=[marked_by])

class Completion(Base):
    __tablename__ = "completions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("enrollments.id"), unique=True)
    completed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    certificate_id: Mapped[str] = mapped_column(String(100), unique=True)
    certificate_url: Mapped[str] = mapped_column(String(500), nullable=True)
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