import re
from typing import Dict, Any, Optional, List

from app.services.ai.base import AIProvider


class MockAIProvider(AIProvider):
    """Default fallback AI provider.
    
    Provides contextually relevant, empathetic responses based on detected
    emotions and intents rather than canned responses.
    """

    name = "mock"

    EMOTION_KEYWORDS = {
        "sadness": {
            "sad", "unhappy", "down", "depressed", "cry", "crying", "tears",
            "miserable", "hopeless", "heartbroken", "grief", "grieving", "empty",
            "worthless", "blue", "gloomy", "disappointed", "devastated", "upset",
        },
        "anxiety": {
            "anxious", "anxiety", "nervous", "worried", "worry", "panic",
            "fear", "afraid", "scared", "terrified", "dread", "uneasy", "on edge",
            "jittery", "trembling", "heart racing", "tense", "overthinking", "palm sweating",
        },
        "stress": {
            "stress", "stressed", "overwhelmed", "pressure", "burnout", "burnt out",
            "exhausted", "tired", "drained", "swamped", "deadline", "too much", "weighed down",
        },
        "anger": {
            "angry", "furious", "mad", "rage", "irritated", "annoyed", "frustrated",
            "frustration", "resentful", "bitter", "livid", "hostile", "aggressive",
        },
        "loneliness": {
            "lonely", "alone", "isolated", "abandoned", "ignored", "left out",
            "no friends", "nobody", "no one", "disconnected", "unwanted", "forgotten",
        },
        "joy": {
            "happy", "glad", "joyful", "excited", "thrilled", "great", "amazing",
            "wonderful", "blessed", "grateful", "fantastic", "awesome", "cheerful",
            "lovely", "pleased", "delighted",
        },
        "panic": {
            "panic attack", "panicking", "can't breathe", "chest tight", "hyperventilating",
            "dizzy", "unreal", "going crazy", "losing control", "impending doom",
        },
    }

    INTENT_KEYWORDS = {
        "emotional_support": ["need help", "feel bad", "feel down", "support", "listening", "talk to someone"],
        "stress": ["stress", "stressed", "overwhelmed", "pressure", "burnout", "deadline"],
        "anxiety": ["anxious", "anxiety", "nervous", "worried", "worry", "fear"],
        "panic": ["panic", "panic attack", "hyperventilating", "losing control"],
        "sadness": ["sad", "depressed", "cry", "crying", "hopeless", "miserable"],
        "anger": ["angry", "mad", "furious", "rage", "frustrated"],
        "loneliness": ["lonely", "alone", "isolated", "no one", "nobody"],
        "academic_pressure": ["exam", "study", "grade", "assignment", "homework", "class", "college", "university", "semester", "cgpa"],
        "sleep": ["sleep", "insomnia", "can't sleep", "tired", "exhausted", "restless"],
        "wellness_exercise": ["breathing", "meditation", "exercise", "grounding", "relax", "mindfulness", "tips", "activity"],
        "mood_tracking": ["mood", "track my mood", "log mood", "how do i feel", "feeling lately"],
        "journal": ["journal", "write", "diary", "reflection"],
        "medicine_info": ["medicine", "medication", "prescription", "drug", "pill", "dose", "dosage", "tablet", "capsule", "what is", "drug info", "antidepressant", "ssri", "snri", "anxiolytic", "benzodiazepine", "sertraline", "fluoxetine", "escitalopram", "citalopram", "paroxetine", "venlafaxine", "duloxetine", "alprazolam", "lorazepam", "clonazepam", "diazepam", "stop", "withdraw", "taper"],
        "medical_care": ["doctor", "medical", "psychiatrist", "hospital", "therapy", "treatment"],
        "professional_help": ["therapist", "counselor", "psychologist", "help me find", "talk to a professional", "see someone"],
        "crisis": ["suicide", "kill myself", "end it", "end everything", "end my life", "want to die", "self-harm", "hurt myself", "no reason to live"],
    }

    SAFETY_ACTIONS = {
        "crisis": [
            "Call a crisis helpline immediately (India: Vandrevala 1860-2662-345 / AASRA +91-9820466726)",
            "Reach out to someone you trust - you don't have to go through this alone",
            "Go to a calm, safe place and try slow breathing",
            "Seek immediate professional help from a counselor or emergency services",
        ],
        "anxiety": [
            "Try the 5-4-3-2-1 grounding exercise to bring yourself back to the present",
            "Take 10 slow, deep breaths - breathe in for 4 counts, out for 6",
            "Write down 3 things you're grateful for right now",
            "Consider a quick mindful walk to shift your focus",
        ],
        "stress": [
            "Try the 4-7-8 breathing technique: breathe in 4, hold 7, out 8",
            "Break your tasks into small, manageable steps for the next 30 minutes",
            "Step away for 2 minutes and stretch or look at something green",
            "Schedule a short break to recharge before continuing",
        ],
        "sadness": [
            "Be gentle with yourself - it's okay to feel this way",
            "Try a positive reflection: write down one thing that brought you a little comfort today",
            "Consider journaling your feelings to process them",
            "Reach out to someone you trust and share how you're feeling",
        ],
        "loneliness": [
            "Try sending a message to one person you care about today",
            "Consider joining our wellness sessions or community activities",
            "Journal about what 'connection' means to you",
            "Reach out to a counselor - virtual support is available",
        ],
        "anger": [
            "Take 5 slow breaths and count to 10 before reacting",
            "Try progressive muscle relaxation to release tension",
            "Write out what's frustrating you - getting it out helps",
            "Step away from the situation for a few minutes to cool down",
        ],
        "panic": [
            "Focus on slow, deep breathing - breathe in for 4, out for 6",
            "Use 5-4-3-2-1 grounding: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste",
            "Remind yourself this is a panic response and it will pass",
            "Call a trusted person to talk you through it",
        ],
        "joy": [
            "That's wonderful - savor this moment and let yourself enjoy it",
            "Consider journaling about what made you happy so you can revisit it later",
            "Share your joy with someone - positivity is contagious",
            "Take a moment to appreciate how far you've come",
        ],
        "sleep": [
            "Try a sleep wind-down routine: dim lights and avoid screens an hour before bed",
            "Try 4-7-8 breathing to help calm your body for sleep",
            "Write down tomorrow's tasks to clear your mind",
            "Consider our guided sleep meditation exercise",
        ],
        "academic_pressure": [
            "Break your study sessions into 25-minute focused blocks with short breaks",
            "Prioritize the most important task and start small",
            "Remember that one exam doesn't define your worth",
            "Try a short grounding exercise before you study to center yourself",
        ],
        "general": [
            "Try a 2-minute breathing exercise to reset and refocus",
            "Consider logging your mood to track how you're feeling",
            "Journal one thought that's on your mind today",
            "Take a short mindful break - stretch, hydrate, breathe",
        ],
    }

    INTENT_RESPONSES = {
        "emotional_support": (
            "I'm really glad you reached out. You don't have to face this alone, and I'm here to "
            "listen without judgment. Whatever you're carrying, we can work through it together, "
            "one step at a time. Tell me more about what's been weighing on you."
        ),
        "stress": (
            "That sounds really overwhelming, and it's completely valid to feel stressed right now. "
            "Stress can build up fast when there's a lot on your plate. Let's tackle this together. "
            "First, take a few slow breaths with me. Then tell me - what's the one thing that's "
            "causing the most pressure right now, and we can break it down?"
        ),
        "anxiety": (
            "I can hear the worry in your voice, and that's really hard to sit with. Anxiety often "
            "makes our minds race ahead to worst-case scenarios, but let's ground ourselves in the "
            "here and now. Try taking a breath with me: in for 4, hold for 4, out for 6. "
            "Tell me what's making you feel most anxious and we'll work through it together."
        ),
        "panic": (
            "It sounds like you might be experiencing a panic response right now, and I want you to "
            "know it will pass. Let's focus on your breathing together. Breathe in slowly for 4 "
            "counts, hold for 7, and breathe out for 8. You are safe. Name 5 things you can see "
            "around you. You're doing the right thing by reaching out, and I'm right here with you."
        ),
        "sadness": (
            "I'm sorry you're feeling this way. Sadness can feel so heavy, and it's okay to let "
            "yourself feel it. You don't have to pretend to be okay. Just know that you matter and "
            "this feeling isn't permanent, even if it feels like it right now. Would you like to "
            "tell me what's brought this on?"
        ),
        "anger": (
            "It sounds like something really got under your skin, and your frustration is "
            "understandable. Anger often tells us something we care about is being challenged. "
            "Let's take a moment to breathe and let the intensity settle a little. What happened "
            "that made you this angry?"
        ),
        "loneliness": (
            "Feeling lonely is one of the hardest feelings to carry, and I'm sorry you're "
            "experiencing it. Even in this moment, you're being heard. You're not as alone as it "
            "feels right now - there are people who care about you and want to connect. Would you "
            "be open to talking about what's making you feel isolated?"
        ),
        "academic_pressure": (
            "Academic pressure can be incredibly intense, and it's natural to feel this way when "
            "so much seems to ride on results. But please remember - your grades don't define your "
            "worth. Let's make a small plan together. What's the most pressing academic task right "
            "now, and how can we make it feel more manageable?"
        ),
        "sleep": (
            "Trouble sleeping can really drain you and affect everything else. It's great that "
            "you're noticing it. There are gentle techniques to help you unwind. Would you like me "
            "to guide you through a sleep wind-down routine, or would you prefer some breathing "
            "exercises to help calm your body before bed?"
        ),
        "wellness_exercise": (
            "That's a great idea! Taking care of your mind with a wellness exercise can make a "
            "real difference. I can guide you through a breathing exercise, a grounding technique, "
            "or a mindfulness practice. What sounds most helpful to you right now?"
        ),
        "mood_tracking": (
            "Checking in with your mood is a powerful step - it helps you understand your patterns "
            "and what affects how you feel. You can log your current mood with our mood tracker "
            "(very good, good, neutral, low, or very low) and track how it changes over time. "
            "Would you like to log how you're feeling right now?"
        ),
        "journal": (
            "Journaling is a wonderful way to process what's on your mind and gain clarity. Even "
            "a few sentences can help untangle your thoughts. You can write freely, and I can "
            "gently analyze the emotions in your writing if you'd like. What's on your mind that "
            "you'd like to get down on paper?"
        ),
        "medicine_info": (
            "I can share general information about mental health medications, but it's really "
            "important to remember that I'm not a doctor. Anything you find here should be "
            "discussed with your prescribing physician before making changes. What medicine would "
            "you like to learn more about?"
        ),
        "medical_care": (
            "It's really wise to consider professional medical care - they're the experts who can "
            "give you the right guidance for your specific situation. I can help you understand "
            "what to expect and even connect you with counselors or resources. Would you like help "
            "finding professional support near you?"
        ),
        "professional_help": (
            "Reaching out for professional support is such a strong and caring step for yourself. "
            "Therapists and counselors can provide the expert guidance and tools that self-help "
            "alone can't always offer. I can show you available counselors and how to request a "
            "session. Would you like to explore those options?"
        ),
        "crisis": (
            "I'm really concerned about you, and I want you to know that you matter and what "
            "you're feeling right now matters. These feelings are intense and painful, but they "
            "won't last forever. Please reach out to someone who can help you right now. "
            "In India, you can call the Vandrevala Foundation at 1860-266-2345 or AASRA at "
            "+91 98204 66726 anytime. You can also contact emergency services. You deserve "
            "immediate support, and there are people ready to help you through this."
        ),
        "general": (
            "Thank you for sharing that with me. I'm here to support you, whatever is on your "
            "mind. Let's take it one step at a time - is there a specific area you'd like to talk "
            "about, like your mood, stress, sleep, or wellness goals?"
        ),
    }

    INTENT_EMOTION_MAP = {
        "stress": "stress", "anxiety": "anxiety", "panic": "panic", "sadness": "sadness",
        "anger": "anger", "loneliness": "loneliness", "emotional_support": "sadness",
        "academic_pressure": "stress", "sleep": "stress", "joy": "joy",
    }

    _CRISIS_PATTERNS = [
        (r"\b(suicide|suicidal|kill\s+m?yself|ending\s+(my\s+)?life|want\s+to\s+die|take\s+my\s+own\s+life)\b", "critical", "suicide"),
        (r"\b(self[- ]harm|hurt\s+m?yself|cut\s+m?yself|burn\s+m?yself|harm\s+m?yself)\b", "high", "self_harm"),
        (r"\b(no\s+reason\s+to\s+live|better\s+off\s+dead|don'?t\s+want\s+to\s+be\s+alive|wish\s+I\s+was\s+dead)\b", "critical", "suicidal_ideation"),
        (r"\b(hopeless|worthless|pointless|no\s+way\s+out)\b", "high", "hopelessness"),
        (r"\b(say\s+goodbye|give\s+up|end\s+it\s+all)\b", "high", "suicidal_ideation"),
    ]

    @staticmethod
    def _contains_crisis(text: str) -> Optional[tuple]:
        lower = text.lower()
        for pattern, severity, crisis_type in MockAIProvider._CRISIS_PATTERNS:
            if re.search(pattern, lower):
                return severity, crisis_type
        return None

    def _detect_emotion_rule(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        scores: Dict[str, int] = {
            "joy": 0, "sadness": 0, "anxiety": 0, "anger": 0,
            "stress": 0, "panic": 0, "loneliness": 0, "neutral": 1,
        }

        # Punctuation-based emphasis
        if "!!!" in text or text.count("!") >= 2:
            for k in scores:
                if k != "neutral":
                    scores[k] += 1

        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", lower) or kw in lower:
                    scores[emotion] += 2
                    if emotion == "anxiety" and "!" in text:
                        scores["panic"] += 1

        best = max(scores, key=scores.get)
        total = sum(scores.values())
        confidence = min(scores[best] / max(total, 2), 0.95)
        severity = "high" if scores[best] >= 6 else ("medium" if scores[best] >= 3 else "low")
        return {"emotion": best, "confidence": round(max(confidence, 0.5), 2), "severity": severity}

    def _detect_intent_rule(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        best_intent = "general"
        best_score = 0
        for intent, keywords in self.INTENT_KEYWORDS.items():
            score = 0
            for kw in keywords:
                if kw in lower or re.search(rf"\b{re.escape(kw)}\b", lower):
                    score += 1
            if score > best_score:
                best_score = score
                best_intent = intent
        confidence = min(best_score * 0.35 + 0.4, 0.95)
        return {"intent": best_intent, "confidence": round(confidence, 2)}

    async def generate_response(
        self,
        message: str,
        context: Optional[List[Dict[str, str]]] = None,
        emotion: Optional[Dict[str, Any]] = None,
        intent: Optional[Dict[str, Any]] = None,
    ) -> str:
        crisis_check = self._contains_crisis(message)
        if crisis_check:
            return self.INTENT_RESPONSES["crisis"]

        emo = emotion or self._detect_emotion_rule(message)
        inten = intent or self._detect_intent_rule(message)

        if inten.get("intent") in self.INTENT_RESPONSES:
            response = self.INTENT_RESPONSES[inten["intent"]]
        elif emo.get("emotion") in self.INTENT_RESPONSES:
            response = self.INTENT_RESPONSES[emo["emotion"]]
        else:
            response = self.INTENT_RESPONSES["general"]

        # Personalize with emotional acknowledgment
        if emo.get("emotion") == "sadness":
            response = (
                "I can hear the heaviness in what you're sharing, and I want you to know that's "
                "valid. " + response
            )
        elif emo.get("emotion") == "joy":
            response = ("It's so good to hear something is bringing you light! " + response)

        if message.lower().strip() in ["hi", "hello", "hey", "hi there"]:
            return (
                "Hello! I'm MindEase, your mental health companion. I'm here to listen, support, "
                "and help you work through whatever you're feeling. You can talk to me about your "
                "mood, stress, anxiety, sleep, relationships, or anything else on your mind. "
                "You can also ask for wellness exercises like breathing techniques. How are you "
                "feeling today?"
            )

        return response

    async def analyze_emotion(self, text: str) -> Dict[str, Any]:
        return self._detect_emotion_rule(text)

    async def detect_intent(self, text: str) -> Dict[str, Any]:
        return self._detect_intent_rule(text)
