from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel


class AdminAnalytics(BaseModel):
    total_users: int
    total_conversations: int
    total_messages: int
    total_mood_logs: int
    total_journal_entries: int
    total_crisis_events: int
    total_wellness_sessions: int
    active_users_today: int
    total_counselors: int


class UserListResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    onboarding_completed: bool
    created_at: str

    model_config = {"from_attributes": True}
