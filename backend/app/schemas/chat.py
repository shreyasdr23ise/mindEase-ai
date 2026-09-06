from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel


class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[UUID] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: UUID
    emotion: Optional[dict] = None
    intent: Optional[dict] = None
    suggested_actions: List[str] = []
    is_crisis: bool = False
    crisis_severity: Optional[str] = None
