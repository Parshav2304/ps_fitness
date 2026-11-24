"""
Tests for Jev Sub-10ms Decision Router
"""
import pytest
from app.services.router_service import jev_router

def test_router_latency_under_10ms():
    res = jev_router.route("How many sets per week should I do for bicep hypertrophy?")
    assert res["latency_ms"] < 10.0, f"Expected < 10ms, got {res['latency_ms']}ms"

def test_exercise_injury_route():
    res = jev_router.route("My knee hurts whenever I do barbell back squats")
    assert res["route"] == "EXERCISE_INJURY_RAG"
    assert res["needs_rag"] is True

def test_volume_optimization_route():
    res = jev_router.route("What is the progressive overload threshold and how many sets per week?")
    assert res["route"] == "VOLUME_OPTIMIZATION"
    assert res["needs_rag"] is True

def test_critical_safety_alert():
    res = jev_router.route("I have sharp tearing chest pain and feel dizzy while benching")
    assert res["safety_alert"] is True
