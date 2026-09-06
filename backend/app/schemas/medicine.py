from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MedicineSearch(BaseModel):
    query: str


class MedicineResponse(BaseModel):
    id: UUID
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    common_uses: Optional[str] = None
    description: Optional[str] = None
    side_effects: Optional[list] = None
    warnings: Optional[list] = None
    precautions: Optional[list] = None
    administration_info: Optional[dict] = None
    interaction_warnings: Optional[list] = None
    source: Optional[str] = None
    last_updated: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MedicineList(BaseModel):
    medicines: List[MedicineResponse]
    total: int
