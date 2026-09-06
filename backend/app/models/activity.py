import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Enum as SAEnum

from app.models.uuid import UUIDType
from app.core.database import Base


class ActivityLog(Base):
    """Centralized, searchable audit/activity table.

    Captures user and admin platform events (login, chat, mood, journal,
    wellness, medicine, emergency, crisis, counselor, onboarding, privacy,
    admin actions) with device/session context sourced from request headers.

    NEVER store: passwords, password hashes, JWT tokens, API keys, OTPs,
    or full message/search content. `metadata` holds only generic,
    non-sensitive summary fields.
    """

    __tablename__ = "activity_logs"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUIDType, ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    event_type = Column(String(64), nullable=False, index=True)
    event_category = Column(String(32), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    status = Column(SAEnum("success", "failed", name="activity_status_enum"), default="success", nullable=False)
    device_type = Column(String(32), nullable=True)
    device_manufacturer = Column(String(64), nullable=True)
    device_model = Column(String(64), nullable=True)
    os = Column(String(32), nullable=True)
    os_version = Column(String(32), nullable=True)
    app_version = Column(String(32), nullable=True)
    network_type = Column(String(32), nullable=True)
    ip_address = Column(String(45), nullable=True)
    request_id = Column(String(64), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    event_data = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)