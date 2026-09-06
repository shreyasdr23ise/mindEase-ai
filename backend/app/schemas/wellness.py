from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class WellnessExerciseResponse(BaseModel):
    id: UUID
    title: str
    category: str
    description: str
    instructions: list
    duration_minutes: int
    difficulty: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WellnessSessionCreate(BaseModel):
    exercise_id: UUID
    completed: bool = True
    duration_seconds: int
    notes: Optional[str] = None


class WellnessSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    exercise_id: UUID
    completed: bool
    duration_seconds: int
    notes: Optional[str] = None
    created_at: datetime
    exercise: Optional[WellnessExerciseResponse] = None

    model_config = {"from_attributes": True}
