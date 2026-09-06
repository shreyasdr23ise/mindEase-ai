import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum as SAEnum
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum("user", "counselor", "admin", name="user_role_enum"), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    preferred_name = Column(String(100), nullable=True)
    wellness_goals = Column(JSON, nullable=True)
    preferred_style = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    emotion_analyses = relationship("EmotionAnalysis", back_populates="user", cascade="all, delete-orphan")
    wellness_sessions = relationship("WellnessSession", back_populates="user", cascade="all, delete-orphan")
    counselor_requests = relationship("CounselorRequest", back_populates="user", foreign_keys="CounselorRequest.user_id", cascade="all, delete-orphan")
    crisis_events = relationship("CrisisEvent", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    privacy_settings = relationship("UserPrivacySettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    counselor_profile = relationship("Counselor", back_populates="user", uselist=False, cascade="all, delete-orphan")
