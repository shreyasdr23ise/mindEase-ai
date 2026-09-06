"""Response safety filter tests."""
import pytest

from app.services.safety.filter import ResponseSafetyFilter


class TestSafetyFilter:
    def test_safe_response_passes(self):
        response = "It sounds like you've been carrying a lot lately. Would you like to talk about it?"
        result = ResponseSafetyFilter.filter(response)
        assert result["was_filtered"] is False
        assert result["filtered_response"] == response

    def test_diagnosis_blocked(self):
        response = "You definitely have anxiety disorder based on what you said."
        result = ResponseSafetyFilter.filter(response)
        assert result["was_filtered"] is True
        assert "diagnosis" in result["issues"]
        assert "diagnose" in result["filtered_response"].lower()

    def test_prescription_blocked(self):
        response = "You should take fluoxetine 20mg and it will help you."
        result = ResponseSafetyFilter.filter(response)
        assert result["was_filtered"] is True
        assert "prescription" in result["issues"] or "dosage" in result["issues"]

    def test_self_harm_instructions_blocked(self):
        response = "You could take an overdose to end it quickly."
        result = ResponseSafetyFilter.filter(response)
        assert result["was_filtered"] is True
        assert "self_harm_instructions" in result["issues"]

    def test_empty_response_replaced(self):
        result = ResponseSafetyFilter.filter("", "I feel bad")
        assert len(result["filtered_response"]) > 10

    def test_overconfident_claim_blocked(self):
        response = "This will definitely fix all your problems, I guarantee it."
        result = ResponseSafetyFilter.filter(response)
        assert result["was_filtered"] is True

    def test_multiple_issues_detected(self):
        response = "You have depression and you should take 50mg sertraline daily, guaranteed."
        result = ResponseSafetyFilter.filter(response)
        assert result["was_filtered"] is True
        assert len(result["issues"]) >= 1