from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"


class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationUpdate(BaseModel):
    title: Optional[str] = None


class MessageCreate(BaseModel):
    conversation_id: Optional[UUID] = None
    content: str


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    emotion_detected: Optional[dict] = None
    intent_detected: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}
