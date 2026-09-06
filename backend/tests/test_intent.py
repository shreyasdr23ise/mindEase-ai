"""Intent detection tests."""
import pytest

from app.services.intent.detector import IntentDetector


class TestIntentDetection:
    def setup_method(self):
        self.detector = IntentDetector()

    def test_stress_intent(self):
        result = self.detector.detect("I'm feeling stressed out right now.")
        assert result["intent"] == "stress"

    def test_medicine_intent(self):
        result = self.detector.detect("Tell me about fluoxetine.")
        assert result["intent"] == "medicine_info"

    def test_breathing_exercise_intent(self):
        result = self.detector.detect("Give me a breathing exercise.")
        assert result["intent"] == "wellness_exercise"

    def test_journal_intent(self):
        result = self.detector.detect("I want to write about my day in my journal.")
        assert result["intent"] == "journal"

    def test_general_intent(self):
        result = self.detector.detect("Nice to see you today.")
        assert result["intent"] in ("general", "greeting")

    def test_professional_help_intent(self):
        result = self.detector.detect("I need to find a therapist.")
        assert result["intent"] == "professional_help"

    def test_mood_intent(self):
        result = self.detector.detect("I want to log my mood for today.")
        assert result["intent"] == "mood_tracking"

    def test_returns_confidence(self):
        result = self.detector.detect("I am so anxious.")
        assert "confidence" in result

    @pytest.mark.parametrize(
        "message,expected",
        [
            ("I'm having trouble sleeping.", "sleep"),
            ("Panic attack is happening now.", "panic"),
            ("I keep thinking about my exams.", "academic_pressure"),
            ("I feel lonely all the time.", "loneliness"),
            ("I'm really angry about this.", "anger"),
        ],
    )
    def test_various_intents(self, message, expected):
        result = self.detector.detect(message)
        assert result["intent"] == expected