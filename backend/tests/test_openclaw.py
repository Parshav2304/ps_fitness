"""
Tests for OpenClaw Omnichannel Messaging Gateway
"""
import pytest
from app.api.openclaw import OpenClawSimulationRequest

def test_openclaw_status(client):
    response = client.get("/api/openclaw/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "whatsapp" in data["channels"]
    assert "telegram" in data["channels"]

def test_openclaw_webhook_challenge(client):
    response = client.get("/api/openclaw/webhook?hub.mode=subscribe&hub.challenge=112233&hub.verify_token=psfitness_token")
    assert response.status_code == 200
    assert response.text == "112233"
