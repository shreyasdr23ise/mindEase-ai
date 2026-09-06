import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON
from app.models.uuid import UUIDType

from app.core.database import Base


class MedicineInformation(Base):
    __tablename__ = "medicine_information"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    common_uses = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    side_effects = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)
    precautions = Column(JSON, nullable=True)
    administration_info = Column(JSON, nullable=True)
    interaction_warnings = Column(JSON, nullable=True)
    source = Column(String(255), nullable=True)
    source_url = Column(String(500), nullable=True)
    last_updated = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
