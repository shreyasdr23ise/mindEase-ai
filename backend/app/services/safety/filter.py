import re
from typing import Dict, Any


class ResponseSafetyFilter:
    """Checks AI responses for unsafe content and replaces with safe alternatives."""

    UNSAFE_PATTERNS = {
        "diagnosis": [
            r"\byou\s+(have|suffer from|are diagnosed with)\b",
            r"\byour\s+diagnos(is|ed)",
            r"\bi\s+diagnos(e|is)",
            r"\byou\s+definitely\s+have\b",
            r"\bobviously\s+(have|suffer)",
            r"\bclearly\s+(have|suffer)",
        ],
        "prescription": [
            r"you\s+should\s+(take|use|start|stop|increase|decrease)\s+\w*(medicine|medication|drug|pill|tablet|ssri|snri|sertraline|fluoxetine|escitalopram|citalopram|paroxetine|venlafaxine|duloxetine|alprazolam|lorazepam|clonazepam|diazepam)\b",
            r"\btake\s+\d+\s*(mg|mcg|gram|g)\b",
            r"\b\d+\s*(mg|mcg|milligrams?)\b",
            r"\bprescrib(e|ed|ing)\s+(to\s+you|for\s+you)",
            r"\byou\s+need\s+\d+\s*m(g|cg)\b",
            r"\b(here'?s|this\s+is)\s+your\s+(prescription|dosage|dose)\b",
        ],
        "dosage": [
            r"\btake\s+\d+\s*(mg|mcg|gram|g)\s+(of|per|twice|once|daily)",
            r"\b\d+\s*mg\s+(daily|per\s+day|twice|once)",
            r"\bdouble\s+(the\s+)?dose\b",
            r"\b(lower|reduce|raise|increase)\s+(the\s+)?dose\b",
            r"\bstop\s+.*(cold turkey|immediately)\b",
        ],
        "overconfidence": [
            r"\b(guarantee|absolutely cure|cure\s+you|definitely\s+(fix|cure|solve))\b",
            r"\bwill\s+definitely\s+(work|help|fix)\b",
            r"\b100%\s*(effective|cure)\b",
        ],
        "self_harm_instructions": [
            r"\b(how\s+to\s+harm\s+yourself|ways\s+to\s+kill|method\s+of\s+suicide)\b",
            r"\btake\s+an\s+overdose\b",
            r"\b(how\s+do\s+I|should\s+I)\s+(kill|hurt)\s+m?yself\b",
        ],
        "harmful_content": [
            r"\b(you\s+should\s+kill|just\s+end\s+it|give\s+up\s+on\s+life)\b",
            r"\bnobody\s+cares\s+about\s+you\b",
        ],
    }

    SAFE_REPLACEMENTS = {
        "diagnosis": (
            "I'm not able to diagnose conditions, but I can share that what you're describing "
            "sounds like it could be distressing, and it's worth speaking with a qualified "
            "healthcare professional who can give you an accurate assessment."
        ),
        "prescription": (
            "I'm not able to prescribe or recommend specific medications. Only a qualified doctor "
            "can do that after a proper evaluation. What I can do is help you understand general "
            "medication information or connect you with professional care."
        ),
        "dosage": (
            "Medication dosages should only be determined by a prescribing physician. Please never "
            "start, stop, or change any medication without consulting your doctor. If you have "
            "questions about your dosage, that's a conversation for your healthcare provider."
        ),
        "overconfidence": (
            "I can support you with coping strategies, but mental health isn't a one-size-fits-all "
            "fix. What works well is exploring different approaches with professional guidance. "
            "Let's focus on some gentle, practical steps you can take today."
        ),
        "self_harm_instructions": (
            "I'm really concerned about what you're going through. I won't share any information "
            "that could harm you, but I want you to know that you deserve support. Please reach "
            "out to a crisis helpline right now - in India, Vandrevala Foundation at 1860-266-2345 "
            "or AASRA at +91 9820466726, or call emergency services. You matter."
        ),
        "harmful_content": (
            "I'm here to be a source of support and care for you, not judgment. You are valuable "
            "and your feelings are concerning to me. Let's focus on finding you immediate help "
            "and support, because you deserve it."
        ),
    }

    SAFE_BLANK_MESSAGE = (
        "I notice that may not have been the most helpful response, so let me refocus. "
        "How are you feeling right now, and what support would be most useful to you?"
    )

    @classmethod
    def filter(cls, response: str, user_message: str = "") -> Dict[str, Any]:
        """Check and filter an AI response. Returns filtered response and safety info."""
        issues: list = []
        filtered = response

        for category, patterns in cls.UNSAFE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, response, re.IGNORECASE):
                    issues.append(category)
                    break

        if issues:
            # Replace with combined safe response
            parts = [cls.SAFE_REPLACEMENTS[c] for c in issues]
            filtered = " ".join(parts)

        # If response is empty or too short after filtering
        if len(filtered.strip()) < 10:
            filtered = cls.SAFE_BLANK_MESSAGE

        return {
            "filtered_response": filtered,
            "issues": issues,
            "was_filtered": len(issues) > 0,
            "original_response": response,
        }
