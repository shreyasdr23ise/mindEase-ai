import re
from typing import Dict, Any, Optional, Tuple


class CrisisDetector:
    """Multi-layer crisis detection with rule-based keyword matching and severity assessment."""

    # Layer 1: High-severity direct statements
    CRITICAL_PATTERNS = [
        r"\b(suicide|suicidal)\b",
        r"\b(plan(ning)?\s+to\s+kill\s+m?yself)\b",
        r"\b(kill\s+m?yself)\b",
        r"\b(want\s+to\s+die)\b",
        r"\b(wish\s+I\s+was\s+dead)\b",
        r"\b(better\s+off\s+dead)\b",
        r"\b(no\s+reason\s+to\s+live)\b",
        r"\b(don'?t\s+want\s+to\s+be\s+alive)\b",
        r"\b(end(ing)?\s+(my\s+)?(own\s+)?life)\b",
        r"\b(end\s+everything)\b",
        r"\b(take\s+my\s+own\s+life)\b",
        r"\b(say\s+goodbye)\b",
        r"\b(end\s+it\s+(all|now))\b",
        r"\b(done\s+with\s+life)\b",
        r"\b(overdose\s+(on\s+)?(pills|medication|drugs))\b",
        r"\b(how\s+(do|to)\s+(I\s+)?(kill|harm)\s+m?yself)\b",
    ]

    HIGH_PATTERNS = [
        r"\b(self[- ]harm)\b",
        r"\b(hurt\s+m?yself)\b",
        r"\b(cut\s+m?yself)\b",
        r"\b(burn\s+m?yself)\b",
        r"\b(harm\s+m?yself)\b",
        r"\b(kill\s+(him|her|them|someone|everyone))\b",
        r"\b(hurt\s+(him|her|them|someone|another\s+person))\b",
        r"\b(harm\s+(him|her|them|someone))\b",
        r"\b(attack\s+(him|her|them|someone|people))\b",
        r"\b(give\s+up\s+(on\s+everything|on\s+life))\b",
        r"\b(hopeless)\b",
        r"\b(pointless\s+(to\s+live|living|going\s+on))\b",
        r"\b(no\s+way\s+out)\b",
        r"\b(worthless)\b",
        r"\b(can'?t\s+go\s+on)\b",
        r"\b(don'?t\s+want\s+to\s+wake\s+up)\b",
    ]

    MEDIUM_PATTERNS = [
        r"\b(feel\s+like\s+giving\s+up)\b",
        r"\b(so\s+over\s+everything)\b",
        r"\b(no\s+point\s+in\s+anything)\b",
        r"\b(drowning|trapped|stuck)\b",
        r"\b(can'?t\s+take\s+(this|it|anymore|any\s+more))\b",
        r"\b(nothing\s+matters)\b",
        r"\b(give\s+up)\b",
        r"\b(end\s+it)\b",
        r"\b(alone\s+in\s+this)\b",
        r"\b(very\s+(dark|bad|down)\s+place)\b",
    ]

    CRISIS_TYPES = {
        "suicide": r"\b(suicide|suicidal|kill\s+m?yself|end\s+(my\s+)?life|die|dead|death)\b",
        "self_harm": r"\b(self[- ]harm|hurt\s+m?yself|cut\s+m?yself|burn\s+m?yself)\b",
        "hopelessness": r"\b(hopeless|worthless|pointless|no\s+way\s+out|give\s+up)\b",
        "harm_to_others": r"\b(kill\s+(him|her|them|someone)|hurt\s+(him|her|them|someone))\b",
    }

    LAYER_WEIGHTS = {
        "critical": 1.0,
        "high": 0.8,
        "medium": 0.5,
    }

    @classmethod
    def detect(cls, text: str) -> Dict[str, Any]:
        """Multi-layer crisis detection returning is_crisis, severity, crisis_type, confidence."""
        lower = text.lower()
        all_matches: list = []
        critical_hits = 0
        high_hits = 0
        medium_hits = 0

        # Layer 1: critical patterns
        for pattern in cls.CRITICAL_PATTERNS:
            if re.search(pattern, lower):
                critical_hits += 1
                all_matches.append(pattern)

        # Layer 2: high patterns
        for pattern in cls.HIGH_PATTERNS:
            if re.search(pattern, lower):
                high_hits += 1
                all_matches.append(pattern)

        # Layer 3: medium patterns
        for pattern in cls.MEDIUM_PATTERNS:
            if re.search(pattern, lower):
                medium_hits += 1
                all_matches.append(pattern)

        total_weight = (
            critical_hits * cls.LAYER_WEIGHTS["critical"]
            + high_hits * cls.LAYER_WEIGHTS["high"]
            + medium_hits * cls.LAYER_WEIGHTS["medium"]
        )

        # Determine severity
        if critical_hits > 0 or total_weight >= 1.5:
            severity = "critical"
        elif high_hits > 0 or total_weight >= 0.8:
            severity = "high"
        elif medium_hits > 0 or total_weight >= 0.4:
            severity = "medium"
        else:
            severity = "low"

        # Determine crisis type
        crisis_type = "general"
        best_type_score = 0
        for ctype, pattern in cls.CRISIS_TYPES.items():
            if re.search(pattern, lower):
                score = cls._match_count(lower, pattern)
                if score > best_type_score:
                    best_type_score = score
                    crisis_type = ctype

        # Calculate confidence
        is_crisis = total_weight >= 0.4 and severity in ("medium", "high", "critical")
        confidence = min(total_weight / 2.0, 0.98)
        if is_crisis and confidence < 0.6:
            confidence = 0.6

        return {
            "is_crisis": is_crisis,
            "severity": severity if is_crisis else "low",
            "crisis_type": crisis_type if is_crisis else "none",
            "confidence": round(confidence, 2) if is_crisis else round(confidence, 2),
            "matched_patterns": all_matches,
            "score": round(total_weight, 2),
        }

    @staticmethod
    def _match_count(text: str, pattern: str) -> int:
        return len(re.findall(pattern, text, re.IGNORECASE))

    @classmethod
    async def detect_async(cls, text: str) -> Dict[str, Any]:
        """Async wrapper for detect."""
        return cls.detect(text)
