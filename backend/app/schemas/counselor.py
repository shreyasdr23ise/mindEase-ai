from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CounselorResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: Optional[str] = None
    specialty: str
    experience_years: int
    bio: Optional[str] = None
    location: Optional[str] = None
    availability: Optional[dict] = None
    is_online: bool
    rating: float
    consultation_fee: Optional[float] = None
    is_active: bool

    model_config = {"from_attributes": True}


class CounselorRequestCreate(BaseModel):
    counselor_id: UUID
    message: Optional[str] = None


class CounselorRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    counselor_id: UUID
    status: str
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    counselor: Optional[CounselorResponse] = None

    model_config = {"from_attributes": True}
