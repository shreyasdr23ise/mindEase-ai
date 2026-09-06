import uuid
from datetime import datetime

from sqlalchemy import Column, Boolean, Integer, DateTime, ForeignKey
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserPrivacySettings(Base):
    __tablename__ = "user_privacy_settings"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    share_mood_data = Column(Boolean, default=False, nullable=False)
    share_journal = Column(Boolean, default=False, nullable=False)
    allow_analytics = Column(Boolean, default=False, nullable=False)
    data_retention_days = Column(Integer, default=365, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="privacy_settings")
