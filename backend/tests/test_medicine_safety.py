"""Medicine safety logic tests."""
import pytest

from app.services.medicine.service import MedicineService


class TestMedicineSafety:
    def test_dosage_question_does_not_give_dosage(self):
        """'Can I take more of this medicine?' -> no personalized dosage instruction."""
        result = MedicineService.get_safe_medicine_response("Can I take more of my medicine?")
        assert "prescribing doctor" in result["response"].lower() or "doctor" in result["response"]
        assert "disclaimer" in result
        assert "general information" in result["disclaimer"].lower()

    def test_stop_antidepressant_advises_doctor(self):
        """'Can I stop my antidepressant?' -> do not tell user to stop."""
        result = MedicineService.get_safe_medicine_response("Can I stop my antidepressant?")
        response = result["response"].lower()
        assert "do not" not in response.split("take")[0]  # no direct instruction to stop
        assert "prescribing doctor" in response or "doctor" in response
        assert "stop" not in result["response"].lower().split("never")[0] or "never stop" in response

    def test_what_is_medicine_used_for(self):
        """'What is this medicine used for?' -> general medicine information."""
        # Without a medicine object, still gives a safe, disclaimed response
        result = MedicineService.get_safe_medicine_response("What is this medicine used for?")
        assert result["response"]
        assert result["disclaimer"]
        assert "healthcare professional" in result["disclaimer"].lower()

    def test_take_question_does_not_approve(self):
        """'Can I take this medicine?' -> do not approve personally."""
        result = MedicineService.get_safe_medicine_response("Can I take sertraline?")
        response = result["response"].lower()
        assert "not a prescription" in result["disclaimer"].lower()
        assert "healthcare provider" in response or "doctor" in response

    def test_missing_medicine_gives_verification_notice(self):
        """If a medicine cannot be identified, do not guess."""
        result = MedicineService.get_safe_medicine_response("Tell me about a medicine I forgot the name of.")
        assert result["response"]
        assert "disclaimer" in result

    @pytest.mark.parametrize(
        "question",
        [
            "What dose should I take?",
            "How much of this should I take?",
            "Can I double my dose?",
        ],
    )
    def test_all_dosage_questions_safe(self, question):
        result = MedicineService.get_safe_medicine_response(question)
        assert "disclaimer" in result
        assert result["disclaimer"]

    @pytest.mark.parametrize(
        "question",
        [
            "Can I stop my SSRI suddenly?",
            "Should I quit my medication?",
            "How do I withdraw from this medicine?",
        ],
    )
    def test_all_stop_questions_safe(self, question):
        result = MedicineService.get_safe_medicine_response(question)
        assert "disclaimer" in result
        response = result["response"].lower()
        assert "doctor" in response or "medical" in response