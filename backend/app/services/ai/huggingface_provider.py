from typing import Dict, Any, Optional, List
import httpx

from app.core.config import settings
from app.services.ai.base import AIProvider


class HuggingFaceProvider(AIProvider):
    """HuggingFace inference API-based AI provider."""

    name = "huggingface"
    ENDPOINTS = {
        "response": "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        "emotion": "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
        "intent": "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
    }

    def __init__(self):
        if not settings.AI_API_KEY:
            raise ValueError("AI_API_KEY is required for HuggingFaceProvider")
        self.api_key = settings.AI_API_KEY
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    async def _call_inference(self, url: str, payload: Dict[str, Any]) -> Any:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=self.headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def generate_response(
        self,
        message: str,
        context: Optional[List[Dict[str, str]]] = None,
        emotion: Optional[Dict[str, Any]] = None,
        intent: Optional[Dict[str, Any]] = None,
    ) -> str:
        system = (
            "You are MindEase AI, an empathetic mental health companion. "
            "You give supportive, non-diagnostic advice. Never prescribe medication. "
            "In crisis situations, urge immediate professional help."
        )
        context_text = ""
        if context:
            context_text = "\n".join(
                f"{m.get('role', 'user')}: {m.get('content', '')}" for m in context[-6:]
            )
        prompt = f"{system}\n\n{context_text}\n\nuser: {message}\nassistant:"
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 300,
                "temperature": 0.7,
                "return_full_text": False,
            },
        }
        try:
            result = await self._call_inference(self.ENDPOINTS["response"], payload)
            if isinstance(result, list) and result:
                return result[0].get("generated_text", "").strip()
        except Exception:
            pass
        return "I'm here for you. Could you tell me more about how you're feeling?"

    async def analyze_emotion(self, text: str) -> Dict[str, Any]:
        try:
            result = await self._call_inference(self.ENDPOINTS["emotion"], {"inputs": text})
            if isinstance(result, list) and result and isinstance(result[0], list):
                scores = result[0]
                scores.sort(key=lambda x: x.get("score", 0), reverse=True)
                top = scores[0]
                label = top.get("label", "neutral").lower()
                label_map = {
                    "joy": "joy", "sadness": "sadness", "anger": "anger",
                    "fear": "anxiety", "neutral": "neutral", "love": "joy",
                    "surprise": "neutral",
                }
                emotion = label_map.get(label, "neutral")
                confidence = top.get("score", 0.5)
                severity = "high" if confidence > 0.8 else ("medium" if confidence > 0.6 else "low")
                return {"emotion": emotion, "confidence": confidence, "severity": severity}
        except Exception:
            pass
        return {"emotion": "neutral", "confidence": 0.5, "severity": "low"}

    async def detect_intent(self, text: str) -> Dict[str, Any]:
        labels = ["emotional support", "stress", "anxiety", "panic", "sadness", "anger",
                  "loneliness", "wellness exercise", "mood tracking", "journal", "medicine info",
                  "medical care"]
        try:
            result = await self._call_inference(
                self.ENDPOINTS["intent"],
                {"inputs": text, "parameters": {"candidate_labels": labels}},
            )
            if isinstance(result, dict):
                label = result.get("label", "").lower().replace(" ", "_")
                intent_map = {
                    "emotional_support": "emotional_support",
                    "stress": "stress",
                    "anxiety": "anxiety",
                    "panic": "panic",
                    "sadness": "sadness",
                    "anger": "anger",
                    "loneliness": "loneliness",
                    "wellness_exercise": "wellness_exercise",
                    "mood_tracking": "mood_tracking",
                    "journal": "journal",
                    "medicine_info": "medicine_info",
                    "medical_care": "medical_care",
                }
                intent = intent_map.get(label, "general")
                return {"intent": intent, "confidence": result.get("score", 0.5)}
        except Exception:
            pass
        return {"intent": "general", "confidence": 0.5}
