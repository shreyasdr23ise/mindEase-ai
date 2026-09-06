import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, ForeignKey, Text, JSON
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class Counselor(Base):
    __tablename__ = "counselors"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    specialty = Column(String(255), nullable=False)
    experience_years = Column(Integer, default=0, nullable=False)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    availability = Column(JSON, nullable=True)
    is_online = Column(Boolean, default=False, nullable=False)
    rating = Column(Float, default=0.0, nullable=False)
    consultation_fee = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="counselor_profile")
    requests = relationship("CounselorRequest", back_populates="counselor", cascade="all, delete-orphan")


class CounselorRequest(Base):
    __tablename__ = "counselor_requests"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    counselor_id = Column(UUIDType, ForeignKey("counselors.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="counselor_requests", foreign_keys=[user_id])
    counselor = relationship("Counselor", back_populates="requests")
