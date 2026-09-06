"""Emotion analysis tests."""
import pytest

from app.services.emotion.analyzer import EmotionAnalyzer


class TestEmotionAnalysis:
    def setup_method(self):
        self.analyzer = EmotionAnalyzer()

    def test_stress_detected(self):
        result = self.analyzer.analyze("I am completely stressed out about work.")
        assert result["emotion"] == "stress"

    def test_sadness_detected(self):
        result = self.analyzer.analyze("I feel really sad today.")
        assert result["emotion"] == "sadness"

    def test_anxiety_detected(self):
        result = self.analyzer.analyze("I'm so anxious about the future.")
        assert result["emotion"] in ("anxiety", "anxious")

    def test_happy_detected(self):
        result = self.analyzer.analyze("I'm feeling great and happy today!")
        assert result["emotion"] == "joy"

    def test_neutral_default(self):
        result = self.analyzer.analyze("The quick brown fox jumps over the lazy dog.")
        assert result["emotion"] == "neutral"

    def test_returns_required_fields(self):
        result = self.analyzer.analyze("I am so angry right now.")
        assert "emotion" in result
        assert "confidence" in result
        assert "severity" in result
        assert 0.0 <= result["confidence"] <= 1.0

    def test_severity_in_allowed_set(self):
        result = self.analyzer.analyze("I am feeling anxious about my presentation tomorrow.")
        assert result["severity"] in ("low", "medium", "high")

    @pytest.mark.parametrize(
        "message,expected",
        [
            ("I'm so happy to see you!", "joy"),
            ("I feel lonely here.", "loneliness"),
            ("I am feeling scared.", "anxiety"),
            ("This is making me furious.", "anger"),
        ],
    )
    def test_multiple_emotions(self, message, expected):
        result = self.analyzer.analyze(message)
        assert result["emotion"] == expected