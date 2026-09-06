import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.models.uuid import UUIDType

from app.core.database import Base


class EmergencyResource(Base):
    __tablename__ = "emergency_resources"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    country = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=True)
    organization = Column(String(255), nullable=False)
    emergency_number = Column(String(50), nullable=True)
    crisis_helpline = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    availability = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    last_verified = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
