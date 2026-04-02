"""
test_health.py — Sanity tests checking the API boots correctly and the
                 root / health endpoints return expected shapes.
"""
import pytest


class TestRootEndpoint:
    def test_docs_returns_200(self, client):
        """FastAPI always registers /docs — confirms the app boots."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_json_returns_200(self, client):
        """OpenAPI schema should always be accessible."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert data["info"]["title"] == "PS Fitness API"


class TestPredictEndpoint:
    """Smoke-test the ML prediction route without auth to confirm 401, not 500."""

    def test_predict_requires_auth(self, client):
        payload = {
            "height": 175,
            "weight": 75,
            "age": 25,
            "gender": "male",
            "activity_level": 1.55,
            "body_fat": 18.0
        }
        response = client.post("/predict", json=payload)
        # Should be 401 Unauthorized, NOT 500
        assert response.status_code == 401
