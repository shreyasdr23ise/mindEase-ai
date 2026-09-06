import re
from typing import Dict, Any, Optional, List
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medicine import MedicineInformation


class MedicineService:
    """Service for medicine information queries and safe responses."""

    DOSAGE_QUESTION = re.compile(
        r"\b(how\s+much|what\s+dosage|what\s+dose|how\s+many)\b", re.IGNORECASE
    )
    STOP_QUESTION = re.compile(
        r"\b(can\s+I\s+stop|should\s+I\s+stop|stopping|quit|withdraw)\b", re.IGNORECASE
    )
    TAKE_QUESTION = re.compile(
        r"\b(can\s+I\s+take|should\s+I\s+take|is\s+it\s+safe\s+to\s+take)\b", re.IGNORECASE
    )
    SEARCH_TERMS = re.compile(r"\b(what\s+is|about|tell\s+me\s+about)\b", re.IGNORECASE)

    @staticmethod
    async def search_medicines(db: AsyncSession, query: str, limit: int = 20) -> List[MedicineInformation]:
        """Search medicines by name, generic name, or category."""
        q = f"%{query.lower()}%"
        result = await db.execute(
            select(MedicineInformation)
            .where(
                or_(
                    MedicineInformation.name.ilike(q),
                    MedicineInformation.generic_name.ilike(q),
                    MedicineInformation.category.ilike(q),
                )
            )
            .filter(MedicineInformation.is_active == True)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_medicine_info(db: AsyncSession, medicine_id) -> Optional[MedicineInformation]:
        """Get a specific medicine by ID."""
        result = await db.execute(
            select(MedicineInformation).where(MedicineInformation.id == medicine_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_medicine_by_name(db: AsyncSession, name: str) -> Optional[MedicineInformation]:
        """Find a medicine by name (case-insensitive)."""
        result = await db.execute(
            select(MedicineInformation).where(MedicineInformation.name.ilike(f"%{name}%"))
        )
        return result.scalars().first()

    @staticmethod
    def get_safe_medicine_response(
        user_message: str,
        medicine: Optional[MedicineInformation] = None,
    ) -> Dict[str, Any]:
        """Generate a safe, disclaimed response about a medicine."""
        lower = user_message.lower()

        if MedicineService.DOSAGE_QUESTION.search(lower):
            return {
                "response": (
                    "I understand you're looking for dosage information, but dosages are highly "
                    "individual and can only be safely determined by your prescribing doctor. "
                    "Taking the wrong dose can be dangerous. Please do not change your medication "
                    "without consulting your physician. I can, however, share general information "
                    "about how this medicine typically works, its common uses, and what to discuss "
                    "with your doctor."
                ),
                "disclaimer": "This is general information only and not a medical recommendation.",
                "topics_available": ["uses", "side_effects", "how_it_works"],
            }

        if MedicineService.STOP_QUESTION.search(lower):
            return {
                "response": (
                    "Stopping a psychiatric medication suddenly can cause withdrawal symptoms and "
                    "rebound effects, so it's really important to do this only under medical "
                    "supervision. Please speak with your prescribing doctor - they can help you "
                    "taper safely if that's appropriate. Never stop 'cold turkey' on your own."
                ),
                "disclaimer": "This is general information only, not medical advice. Always consult your doctor before stopping any medication.",
                "topics_available": ["why_consult_doctor", "withdrawal", "tapering"],
            }

        if MedicineService.TAKE_QUESTION.search(lower):
            return {
                "response": (
                    "Whether a medication is safe for you depends on your specific health history, "
                    "other medications, and your doctor's evaluation. I can't make that "
                    "determination, but I strongly encourage you to discuss it with your "
                    "healthcare provider, who can assess risks and benefits for your situation."
                ),
                "disclaimer": "This is general information only and not a prescription or medical endorsement.",
                "topics_available": ["why_ask_doctor", "interactions"],
            }

        # General info request about a known medicine
        if medicine:
            name = medicine.name
            use = medicine.common_uses or "various mental health conditions"
            category = medicine.category or "psychiatric medication"
            side_effects = ", ".join(medicine.side_effects[:5]) if medicine.side_effects else "individual side effects vary"
            response = (
                f"{name} ({medicine.generic_name or 'generic'}) is a {category.lower()} commonly "
                f"used for {use}. It works alongside therapy to help manage symptoms. "
                f"Common side effects may include: {side_effects}. "
                f"It's important to note this is general educational information - your doctor "
                f"is the only one who can tell you if it's right for you and at what dose."
            )
            return {
                "response": response,
                "disclaimer": "General educational information only. Not medical advice. Consult your healthcare provider.",
                "topics_available": ["uses", "side_effects", "warnings", "interactions", "administration"],
            }

        return {
            "response": (
                "I'd be happy to share general educational information about mental health "
                "medications. Could you tell me the name of the medicine you're curious about? "
                "Keep in mind that whatever I share is general information - only your doctor "
                "can diagnose, prescribe, or advise on your specific treatment."
            ),
            "disclaimer": "Always consult a qualified healthcare professional for medical advice.",
            "topics_available": [],
        }
