import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class CrisisEvent(Base):
    __tablename__ = "crisis_events"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(SAEnum("low", "medium", "high", "critical", name="crisis_severity_enum"), nullable=False)
    detected_content = Column(Text, nullable=False)
    trigger_type = Column(String(100), nullable=True)
    response_provided = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="crisis_events")
