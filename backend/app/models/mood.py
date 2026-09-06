import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, Enum as SAEnum
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mood = Column(SAEnum("very_good", "good", "neutral", "low", "very_low", name="mood_type_enum"), nullable=False)
    stress_level = Column(Integer, nullable=False)
    anxiety_level = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="mood_logs")
