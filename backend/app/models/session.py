import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")
