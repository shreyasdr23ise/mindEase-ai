import re
from typing import Dict, Any


class IntentDetector:
    """Pattern-based intent detection using regex patterns and keyword matching."""

    INTENT_PATTERNS = {
        "general": [
            r"\b(hi|hello|hey|how are you|what can you do|help)\b",
        ],
        "emotional_support": [
            r"\b(need support|need someone|listen to me|talk to someone|cry on|shoulder)\b",
            r"\bfeel\s+(bad|down|terrible|horrible|unbearable)\b",
            r"\b(just can'?t (cope|handle|do)\s+it)\b",
        ],
        "stress": [
            r"\b(stress|stressed|stressful|overwhelm|pressure|burnout|burnt\s*out)\b",
            r"\b(too much (work|pressure|going on)|weighed down)\b",
            r"\b(deadlines?|exams?|assignments?|workload)\b",
        ],
        "anxiety": [
            r"\b(anxiou?s|anxiety|nervous|worr(y|ied|ying)|fear|afraid|scared|terrified)\b",
            r"\b(on edge|jittery|racing thoughts|overthinking|restless)\b",
        ],
        "panic": [
            r"\b(panic\s*attack|panicking|hyperventilat|can'?t\s+breathe|chest\s*tight)\b",
            r"\b(losing control|going (crazy|insane)|impending doom)\b",
            r"\b(detach|unreal|not real|dizzy)\b",
        ],
        "sadness": [
            r"\b(sad|depress(ed|ion|sing)?|unhappy|down|miserable|hopeless)\b",
            r"\b(cry(ing)?|tears|heartbroken|grie?f|devastated)\b",
        ],
        "anger": [
            r"\b(angry|furious|mad|rage|irritated|annoyed|frustrat(ed|ion))\b",
            r"\b(livid|seething|fuming|hostile|pissed)\b",
        ],
        "loneliness": [
            r"\b(lonely|alone|isolat(ed|ion)|abandoned|left out|disconnected)\b",
            r"\b(no friends|nobody|no one cares|unwanted|forgotten)\b",
        ],
        "academic_pressure": [
            r"\b(exams?|stud(y|ying)|grades?|assignments?|homework|classes?|college|university|semesters?)\b",
            r"\b(cgpa|gpa|marks?|results?|syllabus|lectures?)\b",
            r"\b(placements?|internships?|iit|jee|neet|campus)\b",
        ],
        "sleep": [
            r"\b(slee(ps|p|ping)?|insomnia|sleepless|can'?t sleep|restless|nightmares?|tired)\b",
            r"\b(exhausted|fatigu|barely sleeping|lying awake)\b",
        ],
        "wellness_exercise": [
            r"\b(breathing|meditat|mindful|grounding|relax|exercise|yoga|stretch)\b",
            r"\b(anxiety technique|coping (skill|technique)|calm down|de.?stress)\b",
        ],
        "mood_tracking": [
            r"\b(mood|track(ing)? my (mood|feelings)|log mood|how (do|am) I feel)\b",
            r"\b(feeling (lately|today)|mood (tracker|log))\b",
        ],
        "journal": [
            r"\b(journal|diary|write(ing)?.*(feel|thought|emotion)|reflection)\b",
            r"\b(self[- ]reflection|daily journal)\b",
        ],
        "medicine_info": [
            r"\b(medicine|medication|prescription|drug|pill|tablet|capsule|dose|dosage)\b",
            r"\b(what is|about)\s+\w*\s*(medicine|drug|medication|pill|tablet)\b",
            r"\b(ssri|snri|antidepressant|anxiolytic|benzodiazepine|stimulant)\b",
            r"\b(sertraline|fluoxetine|escitalopram|citalopram|paroxetine|venlafaxine|duloxetine)\b",
            r"\b(alprazolam|lorazepam|clonazepam|diazepam|adderall|methylphenidate)\b",
            r"\b(prozac|zoloft|lexapro|celexa|paxil|effexor|cymbalta|wellbutrin|xanax|ativan)\b",
        ],
        "medical_care": [
            r"\b(doctor|medical|psychiatrist|neurologist|hospital|clinic|treatment|diagnos)\b",
            r"\b(physical (symptom|pain|issue)|thyroid|vitamin|blood test|surgery)\b",
        ],
        "professional_help": [
            r"\b(therapist|counselor|psychologist|psychiatrist|see someone|find help)\b",
            r"\b(professional help|talk to a professional|mental health professional)\b",
            r"\b(request (a )?session|book.*session|schedule.*session)\b",
        ],
        "crisis": [
            r"\b(suicide|suicidal|kill\s+m?yself|end(ing)?\s+(my\s+)?life)\b",
            r"\b(want\s+to\s+die|no\s+reason\s+to\s+live|better\s+off\s+dead)\b",
            r"\b(self[- ]harm|hurt\s+m?yself|cut\s+m?yself|harm\s+m?yself)\b",
            r"\b(give\s+up|end\s+it\s+all|say\s+goodbye)\b",
        ],
    }

    @classmethod
    def detect(cls, text: str) -> Dict[str, Any]:
        """Detect the intent of the given text."""
        lower = text.lower().strip()

        best_intent = "general"
        best_score = 0.0
        matches: list = []

        for intent, patterns in cls.INTENT_PATTERNS.items():
            score = 0.0
            intent_matches = 0
            for pattern in patterns:
                found = re.findall(pattern, lower)
                if found:
                    score += 1 + min(len(found) * 0.5, 2.0)
                    intent_matches += len(found)
            if score and score >= best_score:
                best_score = score
                best_intent = intent
                matches = [pattern for pattern in patterns if re.search(pattern, lower)]

        # Verbose/intensive text boosts confidence for non-general
        if best_intent == "general":
            words = lower.split()
            if len(words) > 8:
                best_score += 0.1
            confidence = 0.55
        else:
            length_factor = min(len(lower.split()) / 10, 1.0)
            confidence = min(0.5 + best_score * 0.25 + length_factor * 0.1, 0.96)
            confidence = max(0.6, confidence)

        return {
            "intent": best_intent,
            "confidence": round(confidence, 2),
            "matched_patterns": matches,
        }

    @classmethod
    async def detect_async(cls, text: str) -> Dict[str, Any]:
        """Async wrapper for detect."""
        return cls.detect(text)
