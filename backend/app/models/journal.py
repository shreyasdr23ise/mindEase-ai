import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON, Enum as SAEnum
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    mood = Column(SAEnum("very_good", "good", "neutral", "low", "very_low", name="journal_mood_enum"), nullable=True)
    emotion_analysis = Column(JSON, nullable=True)
    word_count = Column(Integer, default=0, nullable=False)
    writing_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="journal_entries")
