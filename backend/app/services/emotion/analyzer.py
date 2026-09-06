import re
from typing import Dict, Any


class EmotionAnalyzer:
    """Keyword-based and pattern-based emotion detection."""

    WEIGHTED_KEYWORDS = {
        "joy": {
            "happy": 3, "glad": 3, "joyful": 4, "excited": 4, "thrilled": 5, "great": 2,
            "amazing": 4, "wonderful": 4, "blessed": 3, "grateful": 3, "fantastic": 4,
            "awesome": 3, "cheerful": 3, "lovely": 3, "pleased": 3, "delighted": 4,
            "sunny": 2, "good": 1, "happy": 3, "smile": 2, "laughing": 3, "proud": 3,
            "relieved": 3, "content": 2, "peaceful": 2,
        },
        "sadness": {
            "sad": 3, "unhappy": 3, "down": 2, "depressed": 5, "depressing": 5, "cry": 4,
            "crying": 4, "tears": 4, "miserable": 5, "hopeless": 4, "heartbroken": 5,
            "grief": 5, "grieving": 5, "empty": 3, "worthless": 5, "blue": 2, "gloomy": 3,
            "disappointed": 3, "devastated": 5, "upset": 3, "lonely": 3, "lost": 3,
            "unmotivated": 3, "giving up": 4, "no point": 4,
        },
        "anxiety": {
            "anxious": 4, "anxiety": 4, "nervous": 3, "worried": 3, "worry": 3, "panic": 5,
            "panic attack": 6, "fear": 4, "afraid": 4, "scared": 4, "terrified": 5,
            "dread": 4, "uneasy": 3, "on edge": 4, "jittery": 3, "trembling": 4,
            "heart racing": 5, "tense": 3, "overthinking": 3, "racing thoughts": 4,
            "catastrophizing": 4, "overwhelmed": 4, "restless": 3, "irritable": 2,
        },
        "anger": {
            "angry": 4, "furious": 5, "mad": 3, "rage": 5, "irritated": 3, "annoyed": 3,
            "frustrated": 4, "frustration": 4, "resentful": 4, "bitter": 4, "livid": 5,
            "hostile": 4, "aggressive": 4, "fuming": 5, "seething": 5, "hate": 4,
            "pissed": 4, "fed up": 3, "fed-up": 3,
        },
        "stress": {
            "stress": 4, "stressed": 5, "overwhelmed": 4, "pressure": 3, "burnout": 5,
            "burnt out": 5, "exhausted": 4, "tired": 2, "drained": 4, "swamped": 4,
            "deadline": 3, "too much": 3, "weighed down": 4, "burdened": 4, "juggle": 3,
            "overloaded": 4, "snowed under": 4,
        },
        "panic": {
            "panic attack": 6, "panicking": 5, "can't breathe": 6, "cannot breathe": 6,
            "short of breath": 5, "chest tight": 5, "chest tightness": 5, "hyperventilating": 6,
            "dizzy": 3, "unreal": 4, "going crazy": 5, "losing control": 5, "dying": 4,
            "attack": 3, "impending doom": 6, "detached": 4, "not real": 4,
        },
        "loneliness": {
            "lonely": 5, "alone": 3, "isolated": 4, "abandoned": 4, "ignored": 3,
            "left out": 4, "no friends": 5, "nobody": 3, "no one": 3, "disconnected": 4,
            "unwanted": 4, "forgotten": 3, "missed out": 3, "separated": 3, "solitary": 3,
        },
    }

    NEUTRAL_MARKERS = ["i'm fine", "im fine", "okay", "ok", "alright", "fair", "so-so", "nothing much"]

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        """Analyze text for emotion. Returns emotion, confidence, severity."""
        lower = text.lower().strip()

        # Check neutral markers first
        for marker in cls.NEUTRAL_MARKERS:
            if marker in lower:
                return {"emotion": "neutral", "confidence": 0.85, "severity": "low"}

        scores: Dict[str, float] = {"neutral": 0.5}

        for emotion, keywords in cls.WEIGHTED_KEYWORDS.items():
            total = 0.0
            for kw, weight in keywords.items():
                if kw in lower:
                    # Weight by frequency
                    count = lower.count(kw)
                    total += weight * (1 + 0.5 * (count - 1))
                else:
                    # Also check word-boundary patterns
                    if re.search(rf"\b{re.escape(kw.split()[0])}\b", lower):
                        total += weight * 0.5
            if total > 0:
                scores[emotion] = total

        # Punctuation emphasis boosts intensity
        if text.count("!") >= 2:
            for region in ["panic", "anger", "anxiety", "stress"]:
                if region in scores:
                    scores[region] *= 1.4

        # Length / exclamation of distress
        if "?" not in text and text.count("!") >= 3:
            for region in ["sadness", "panic"]:
                if region in scores:
                    scores[region] *= 1.2

        if not scores or all(v < 1 for v in scores.values() if v > 0):
            return {"emotion": "neutral", "confidence": 0.6, "severity": "low"}

        best_emotion = max(scores, key=scores.get)
        if best_emotion == "neutral":
            return {"emotion": "neutral", "confidence": 0.75, "severity": "low"}

        best_score = scores[best_emotion]
        total_score = sum(scores.values())
        confidence = min(best_score / total_score * 1.1, 0.97)

        if best_score >= 8:
            severity = "high"
        elif best_score >= 4:
            severity = "medium"
        else:
            severity = "low"

        return {
            "emotion": best_emotion,
            "confidence": round(confidence, 2),
            "severity": severity,
        }

    @classmethod
    async def analyze_async(cls, text: str) -> Dict[str, Any]:
        """Async wrapper for analyze."""
        return cls.analyze(text)
