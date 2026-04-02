"""
conftest.py — Shared Pytest fixtures for the PS Fitness API test suite.

Uses an in-memory mock for MongoDB so tests never touch real data.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def mock_db():
    """Return a mock MongoDB database object whose async methods are pre-configured."""
    db = MagicMock()
    # Users collection
    db.users.find_one = AsyncMock(return_value=None)
    db.users.insert_one = AsyncMock(return_value=MagicMock(inserted_id="fake_user_id"))
    db.users.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    # Food logs
    db.food_logs.find = MagicMock(return_value=MagicMock(
        sort=MagicMock(return_value=MagicMock(
            to_list=AsyncMock(return_value=[])
        ))
    ))
    db.food_logs.insert_one = AsyncMock(return_value=MagicMock(inserted_id="fake_food_id"))
    # Hydration logs
    db.hydration_logs.find = MagicMock(return_value=MagicMock(
        to_list=AsyncMock(return_value=[])
    ))
    db.hydration_logs.insert_one = AsyncMock(return_value=MagicMock(inserted_id="fake_hydration_id"))
    return db


@pytest.fixture(scope="session")
def client(mock_db):
    """
    Return a FastAPI TestClient with:
      - MongoDB patched to use the mock_db above
      - DB init / teardown skipped
    """
    with patch("app.database.get_database", return_value=mock_db), \
         patch("app.database.init_db", new_callable=AsyncMock), \
         patch("app.database.close_database", new_callable=AsyncMock):
        from app.main import app
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c


@pytest.fixture
def auth_headers(client):
    """
    Register a test user, log in, and return Authorization headers.
    Re-registers safely if the user already exists.
    """
    payload = {
        "email": "testrunner@psfitness.dev",
        "password": "SuperSecure123!",
        "name": "Test Runner",
        "age": 25,
        "weight": 75.0,
        "height": 175.0,
        "gender": "male",
        "fitness_goal": "general_fitness",
        "activity_level": 1.55
    }
    # Register (may return 400 if already exists — that's fine)
    client.post("/auth/register", json=payload)

    # Login
    resp = client.post("/auth/login", json={
        "email": payload["email"],
        "password": payload["password"]
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
