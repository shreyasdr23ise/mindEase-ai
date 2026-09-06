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


class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    event_type: str
    event_category: str
    timestamp: str
    status: str
    device_type: Optional[str] = None
    device_manufacturer: Optional[str] = None
    device_model: Optional[str] = None
    os: Optional[str] = None
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    network_type: Optional[str] = None
    ip_address: Optional[str] = None
    request_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[dict] = None


class ActivityLogPage(BaseModel):
    items: List[ActivityLogResponse]
    total: int
    page: int
    page_size: int


class UserActivitySummary(BaseModel):
    user_id: UUID
    email: str
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    role: str
    is_active: bool
    onboarding_completed: bool
    created_at: str
    total_events: int
    last_event_at: Optional[str] = None
    login_count: int
    failed_login_count: int
    chat_messages: int
    mood_checkins: int
    journal_entries: int
    wellness_sessions: int
    crisis_events: int
    recent_events: List[ActivityLogResponse] = []


class ActivityStats(BaseModel):
    total_events: int
    events_today: int
    logins_today: int
    active_users_today: int
    failed_logins_today: int
    by_category: dict
    by_event_type: dict
