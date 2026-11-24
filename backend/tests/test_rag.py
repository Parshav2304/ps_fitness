"""
Tests for Sports Science & User History Vector RAG
"""
import pytest
from app.services.rag_service import sports_rag

def test_rag_retrieves_evidence():
    result = sports_rag.retrieve_evidence("knee pain during deep squats biomechanics")
    assert "evidence_cards" in result
    assert len(result["evidence_cards"]) > 0
    top_card = result["evidence_cards"][0]
    assert "title" in top_card
    assert "source" in top_card

def test_rag_user_history_indexing():
    user_id = "test_user_rag_99"
    success = sports_rag.index_user_log(
        user_id=user_id,
        entry_id="workout_leg_day_1",
        content="Squatted 140kg for 3 sets of 5 reps with 2 RIR. No patellar tendon pain.",
        entry_type="workout"
    )
    assert success is True

    # Retrieve with user_id
    search_res = sports_rag.retrieve_evidence("squat 140kg", user_id=user_id)
    assert "USER PERSONAL HISTORY" in search_res["rag_context"]
