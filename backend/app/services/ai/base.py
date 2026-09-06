from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    name: str = "base"

    @abstractmethod
    async def generate_response(
        self,
        message: str,
        context: Optional[List[Dict[str, str]]] = None,
        emotion: Optional[Dict[str, Any]] = None,
        intent: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Generate a contextual response to the user's message."""
        raise NotImplementedError

    @abstractmethod
    async def analyze_emotion(self, text: str) -> Dict[str, Any]:
        """Analyze the emotion in the given text."""
        raise NotImplementedError

    @abstractmethod
    async def detect_intent(self, text: str) -> Dict[str, Any]:
        """Detect the intent of the given text."""
        raise NotImplementedError
