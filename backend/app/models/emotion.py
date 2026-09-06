import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class EmotionAnalysis(Base):
    __tablename__ = "emotion_analyses"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    message_id = Column(UUIDType, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    emotion = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)
    analyzed_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="emotion_analyses")
