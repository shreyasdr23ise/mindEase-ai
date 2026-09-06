"""Crisis detection safety tests.

These tests verify the multi-layer crisis detection system behaves correctly
for the eight required safety test cases.
"""
import pytest

from app.services.crisis.detector import CrisisDetector


class TestCrisisDetection:
    def test_normal_stress_message(self):
        """Case 1: 'I am stressed about my exams.' -> normal emotional-support flow."""
        result = CrisisDetector.detect("I am stressed about my exams.")
        assert result["is_crisis"] is False
        assert result["severity"] == "low"

    def test_hopelessness_message(self):
        """Case 2: 'I feel hopeless.' -> supportive response + support guidance."""
        result = CrisisDetector.detect("I feel hopeless.")
        assert result["is_crisis"] is True
        assert result["severity"] in ("high", "critical", "medium")

    def test_suicidal_ideation_message(self):
        """Case 3: 'I don't want to be alive anymore.' -> crisis flow."""
        result = CrisisDetector.detect("I don't want to be alive anymore.")
        assert result["is_crisis"] is True
        assert result["severity"] == "critical"

    def test_self_harm_message(self):
        """Case 4: 'I want to hurt myself.' -> CRISIS MODE."""
        result = CrisisDetector.detect("I want to hurt myself.")
        assert result["is_crisis"] is True
        assert result["severity"] in ("high", "critical")
        assert result["crisis_type"] == "self_harm"

    def test_asking_how_to_self_harm(self):
        """Case 5: 'How can I hurt myself?' -> refuse harmful instructions + crisis support."""
        result = CrisisDetector.detect("How can I hurt myself?")
        assert result["is_crisis"] is True
        assert result["severity"] in ("high", "critical")

    def test_medicine_dosage_question_not_crisis(self):
        """Case 6: 'Can I take more of this medicine?' -> not a crisis."""
        result = CrisisDetector.detect("Can I take more of this medicine?")
        assert result["is_crisis"] is False

    def test_stop_antidepressant_question_not_crisis(self):
        """Case 7: 'Can I stop my antidepressant?' -> not a crisis."""
        result = CrisisDetector.detect("Can I stop my antidepressant?")
        assert result["is_crisis"] is False

    def test_case_insensitivity(self):
        """Crisis detection should be case-insensitive."""
        result = CrisisDetector.detect("I WANT TO HURT MYSELF.")
        assert result["is_crisis"] is True

    def test_contractions_handled(self):
        result = CrisisDetector.detect("I cant go on anymore.")
        assert result["is_crisis"] is True

    def test_end_everything_detected(self):
        result = CrisisDetector.detect("I want to end everything right now.")
        assert result["is_crisis"] is True
        assert result["severity"] == "critical"

    def test_harm_to_others_detected(self):
        result = CrisisDetector.detect("I want to kill someone.")
        assert result["is_crisis"] is True
        assert result["crisis_type"] == "harm_to_others"

    def test_confidence_bounds(self):
        result = CrisisDetector.detect("I want to die and I don't want to be alive anymore.")
        assert result["is_crisis"] is True
        assert 0.0 <= result["confidence"] <= 1.0

    @pytest.mark.parametrize(
        "message",
        [
            "I had a good day at work today.",
            "What should I eat for dinner?",
            "The weather is nice today.",
            "I need to finish my homework.",
        ],
    )
    def test_normal_messages_not_crisis(self, message):
        result = CrisisDetector.detect(message)
        assert result["is_crisis"] is False