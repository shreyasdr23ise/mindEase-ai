from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class JournalCreate(BaseModel):
    title: Optional[str] = None
    content: str
    mood: Optional[str] = None
    writing_prompt: Optional[str] = None


class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = None


class JournalResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    content: str
    mood: Optional[str] = None
    emotion_analysis: Optional[dict] = None
    word_count: int
    writing_prompt: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
