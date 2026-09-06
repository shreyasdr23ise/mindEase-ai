from typing import Dict, Any, Optional, List
import httpx

from app.core.config import settings
from app.services.ai.base import AIProvider


class OpenAIProvider(AIProvider):
    """OpenAI API-based AI provider using httpx."""

    name = "openai"
    MODELS = {
        "response": "gpt-4o-mini",
        "emotion": "gpt-4o-mini",
        "intent": "gpt-4o-mini",
    }

    def __init__(self):
        if not settings.AI_API_KEY:
            raise ValueError("AI_API_KEY is required for OpenAIProvider")
        self.api_key = settings.AI_API_KEY
        self.base_url = "https://api.openai.com/v1"

    async def _call_chat(self, messages: List[Dict[str, str]], model: str, max_tokens: int = 500) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    async def generate_response(
        self,
        message: str,
        context: Optional[List[Dict[str, str]]] = None,
        emotion: Optional[Dict[str, Any]] = None,
        intent: Optional[Dict[str, Any]] = None,
    ) -> str:
        system_prompt = (
            "You are MindEase AI, a supportive and empathetic mental health companion. "
            "You provide emotional support, coping strategies, and wellness guidance. "
            "You are NOT a licensed therapist and never give medical diagnoses or prescription advice. "
            "If someone is in crisis (suicidal thoughts, self-harm), you respond with care and direct them to professional help immediately. "
            "Keep responses warm, supportive, and practical. Use suggested actions."
        )
        if emotion:
            system_prompt += f"\nUser's detected emotion: {emotion.get('emotion', 'unknown')} (severity: {emotion.get('severity', 'unknown')})."
        if intent:
            system_prompt += f"\nUser's detected intent: {intent.get('intent', 'general')}."

        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

        if context:
            for msg in context[-10:]:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        messages.append({"role": "user", "content": message})

        return await self._call_chat(messages, self.MODELS["response"])

    async def analyze_emotion(self, text: str) -> Dict[str, Any]:
        prompt = (
            f"Analyze the emotion in this text. Return JSON with keys 'emotion' "
            f"(one of: joy, sadness, anxiety, anger, stress, panic, loneliness, neutral), "
            f"'confidence' (0-1 float), and 'severity' (low, medium, high).\n\nText: {text}"
        )
        messages = [{"role": "system", "content": "You are an emotion analysis engine. Return only valid JSON."},
                    {"role": "user", "content": prompt}]
        result = await self._call_chat(messages, self.MODELS["emotion"], max_tokens=100)
        return self._parse_json(result, {"emotion": "neutral", "confidence": 0.5, "severity": "low"})

    async def detect_intent(self, text: str) -> Dict[str, Any]:
        valid_intents = (
            "general, emotional_support, stress, anxiety, panic, sadness, anger, loneliness, "
            "academic_pressure, sleep, wellness_exercise, mood_tracking, journal, medicine_info, "
            "medical_care, professional_help, crisis"
        )
        prompt = (
            f"Detect the primary intent of this text. Return JSON with keys 'intent' "
            f"(one of: {valid_intents}) and 'confidence' (0-1 float).\n\nText: {text}"
        )
        messages = [{"role": "system", "content": "You are an intent detection engine. Return only valid JSON."},
                    {"role": "user", "content": prompt}]
        result = await self._call_chat(messages, self.MODELS["intent"], max_tokens=100)
        return self._parse_json(result, {"intent": "general", "confidence": 0.5})

    @staticmethod
    def _parse_json(text: str, default: Dict[str, Any]) -> Dict[str, Any]:
        import json
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except Exception:
            pass
        return default
