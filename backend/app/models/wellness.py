import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SAEnum
from app.models.uuid import UUIDType
from sqlalchemy.orm import relationship

from app.core.database import Base


class WellnessExercise(Base):
    __tablename__ = "wellness_exercises"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    category = Column(
        SAEnum(
            "breathing", "grounding", "mindfulness", "stress_relief",
            "cbt", "sleep", "positive_reflection",
            name="exercise_category_enum"
        ),
        nullable=False,
    )
    description = Column(Text, nullable=False)
    instructions = Column(JSON, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    difficulty = Column(
        SAEnum("beginner", "intermediate", "advanced", name="difficulty_enum"),
        default="beginner",
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sessions = relationship("WellnessSession", back_populates="exercise", cascade="all, delete-orphan")


class WellnessSession(Base):
    __tablename__ = "wellness_sessions"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(UUIDType, ForeignKey("wellness_exercises.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="wellness_sessions")
    exercise = relationship("WellnessExercise", back_populates="sessions")
