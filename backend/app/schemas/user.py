from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_anonymous: bool
    onboarding_completed: bool
    preferred_name: Optional[str] = None
    wellness_goals: Optional[list] = None
    preferred_style: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    avatar_url: Optional[str] = None


class OnboardingUpdate(BaseModel):
    preferred_name: str
    wellness_goals: Optional[List[str]] = None
    preferred_style: Optional[str] = None
    onboarding_completed: bool = True
