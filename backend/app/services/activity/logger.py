"""Activity/audit event logging service.

Writes non-sensitive rows into `activity_logs` using device/session context
captured from standard request headers (set by the mobile/web clients):

  x-request-id, x-session-id, x-device-type, x-device-manufacturer,
  x-device-model, x-os, x-os-version, x-app-version, x-network-type

Event types follow the platform's canonical list (see EventType).
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import Request


class EventType:
    # Auth / onboarding
    REGISTER = "REGISTER"
    LOGIN = "LOGIN"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    ONBOARDING_COMPLETED = "ONBOARDING_COMPLETED"

    # Chat
    CHAT_STARTED = "CHAT_STARTED"
    CHAT_MESSAGE = "CHAT_MESSAGE"
    CHAT_COMPLETED = "CHAT_COMPLETED"
    SEARCH = "SEARCH"
    MEDICINE_INFO_REQUEST = "MEDICINE_INFO_REQUEST"

    # Mood / journal
    MOOD_CHECKIN = "MOOD_CHECKIN"
    MOOD_HISTORY_VIEW = "MOOD_HISTORY_VIEW"
    JOURNAL_CREATED = "JOURNAL_CREATED"
    JOURNAL_UPDATED = "JOURNAL_UPDATED"
    JOURNAL_DELETED = "JOURNAL_DELETED"

    # Wellness
    WELLNESS_STARTED = "WELLNESS_STARTED"
    WELLNESS_COMPLETED = "WELLNESS_COMPLETED"
    BREATHING_STARTED = "BREATHING_STARTED"
    BREATHING_COMPLETED = "BREATHING_COMPLETED"

    # Emergency / crisis / counselors
    EMERGENCY_OPENED = "EMERGENCY_OPENED"
    CRISIS_DETECTED = "CRISIS_DETECTED"
    COUNSELOR_VIEWED = "COUNSELOR_VIEWED"
    COUNSELOR_REQUESTED = "COUNSELOR_REQUESTED"

    # Profile / settings / privacy
    PROFILE_VIEWED = "PROFILE_VIEWED"
    PROFILE_UPDATED = "PROFILE_UPDATED"
    SETTINGS_UPDATED = "SETTINGS_UPDATED"
    PRIVACY_SETTINGS_CHANGED = "PRIVACY_SETTINGS_CHANGED"

    # Admin
    ADMIN_LOGIN = "ADMIN_LOGIN"
    ADMIN_LOGIN_FAILED = "ADMIN_LOGIN_FAILED"
    ADMIN_LOGOUT = "ADMIN_LOGOUT"
    ADMIN_VIEW_ACTIVITY = "ADMIN_VIEW_ACTIVITY"
    ADMIN_VIEW_USER = "ADMIN_VIEW_USER"
    ADMIN_EXPORT = "ADMIN_EXPORT"
    ADMIN_UPDATE_USER = "ADMIN_UPDATE_USER"
    ADMIN_CHANGE_SETTINGS = "ADMIN_CHANGE_SETTINGS"


class EventCategory:
    AUTH = "auth"
    ONBOARDING = "onboarding"
    CHAT = "chat"
    MOOD = "mood"
    JOURNAL = "journal"
    WELLNESS = "wellness"
    MEDICINE = "medicine"
    EMERGENCY = "emergency"
    CRISIS = "crisis"
    COUNSELOR = "counselor"
    PROFILE = "profile"
    SETTINGS = "settings"
    ADMIN = "admin"


_DEVICE_HEADERS = {
    "device_type": "x-device-type",
    "device_manufacturer": "x-device-manufacturer",
    "device_model": "x-device-model",
    "os": "x-os",
    "os_version": "x-os-version",
    "app_version": "x-app-version",
    "network_type": "x-network-type",
}


def _context_from_request(request: Optional[Request]) -> dict:
    context = {
        "ip_address": None,
        "request_id": None,
        "session_id": None,
        "device_type": None,
        "device_manufacturer": None,
        "device_model": None,
        "os": None,
        "os_version": None,
        "app_version": None,
        "network_type": None,
    }
    if request is None:
        return context
    context["ip_address"] = request.client.host if request.client else None
    context["request_id"] = request.headers.get("x-request-id")
    context["session_id"] = request.headers.get("x-session-id")
    for attr, header in _DEVICE_HEADERS.items():
        value = request.headers.get(header)
        if value:
            context[attr] = value[:64]
    return context


def build_activity_log(
    *,
    user_id,
    event_type: str,
    event_category: str,
    status: str = "success",
    metadata: Optional[dict] = None,
    request: Optional[Request] = None,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None,
    session_id: Optional[str] = None,
    device: Optional[dict] = None,
    timestamp: Optional[datetime] = None,
):
    """Build (but do not persist) an ActivityLog ORM row."""
    from app.models.activity import ActivityLog

    context = {}
    if device:
        context = {k: v for k, v in device.items() if v is not None}
    else:
        context = _context_from_request(request)

    return ActivityLog(
        id=uuid.uuid4(),
        user_id=user_id,
        event_type=event_type,
        event_category=event_category,
        timestamp=timestamp or datetime.utcnow(),
        status=status,
        device_type=context.get("device_type"),
        device_manufacturer=context.get("device_manufacturer"),
        device_model=context.get("device_model"),
        os=context.get("os"),
        os_version=context.get("os_version"),
        app_version=context.get("app_version"),
        network_type=context.get("network_type"),
        ip_address=ip_address or context.get("ip_address"),
        request_id=request_id or context.get("request_id"),
        session_id=session_id or context.get("session_id"),
        event_data=metadata,
    )