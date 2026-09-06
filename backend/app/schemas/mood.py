from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel


class MoodCreate(BaseModel):
    mood: str
    stress_level: int
    anxiety_level: int
    note: Optional[str] = None


class MoodUpdate(BaseModel):
    mood: Optional[str] = None
    stress_level: Optional[int] = None
    anxiety_level: Optional[int] = None
    note: Optional[str] = None


class MoodResponse(BaseModel):
    id: UUID
    user_id: UUID
    mood: str
    stress_level: int
    anxiety_level: int
    note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MoodHistory(BaseModel):
    logs: List[MoodResponse]
    total: int
    average_stress: Optional[float] = None
    average_anxiety: Optional[float] = None
    mood_distribution: Optional[dict] = None
