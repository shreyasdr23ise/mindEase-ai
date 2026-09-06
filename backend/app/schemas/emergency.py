from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EmergencyResourceResponse(BaseModel):
    id: UUID
    country: str
    region: Optional[str] = None
    organization: str
    emergency_number: Optional[str] = None
    crisis_helpline: Optional[str] = None
    website: Optional[str] = None
    availability: Optional[str] = None
    description: Optional[str] = None
    last_verified: Optional[datetime] = None

    model_config = {"from_attributes": True}
