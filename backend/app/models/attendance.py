from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.db.session import Base

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    excused = "excused"

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False)
    session_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.absent)
    marked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
