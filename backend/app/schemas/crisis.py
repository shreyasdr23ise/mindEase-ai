from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CrisisAnalyzeRequest(BaseModel):
    text: str


class CrisisEventCreate(BaseModel):
    severity: str
    detected_content: str
    trigger_type: Optional[str] = None
    response_provided: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None


class CrisisEventResponse(BaseModel):
    id: UUID
    user_id: UUID
    severity: str
    detected_content: str
    trigger_type: Optional[str] = None
    response_provided: Optional[str] = None
    resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
