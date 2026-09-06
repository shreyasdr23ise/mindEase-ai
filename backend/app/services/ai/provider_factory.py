from app.core.config import settings
from app.services.ai.base import AIProvider


def get_ai_provider() -> AIProvider:
    """Return the configured AI provider based on settings."""
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "openai":
        from app.services.ai.openai_provider import OpenAIProvider
        return OpenAIProvider()
    elif provider_name == "huggingface":
        from app.services.ai.huggingface_provider import HuggingFaceProvider
        return HuggingFaceProvider()
    else:
        # Default to mock provider
        from app.services.ai.mock_provider import MockAIProvider
        return MockAIProvider()
