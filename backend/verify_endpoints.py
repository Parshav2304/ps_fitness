"""
Endpoint Verification Script
"""
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['fitness_ai']
user = db.users.find_one({'email': 'demo@psfitness.dev'})
user_id = str(user['_id'])
token = create_access_token(data={'sub': user_id})
headers = {'Authorization': f'Bearer {token}'}

with TestClient(app) as client_app:
    endpoints = [
        ("GET", "/api/health/status", None),
        ("GET", "/api/food/today", None),
        ("GET", "/api/nutrition/hydration", None),
        ("GET", "/api/analytics/dashboard", None),
        ("GET", "/api/chat/history", None),
        ("POST", "/api/chat", {"message": "How many sets for chest hypertrophy?"}),
        ("GET", "/api/openclaw/status", None),
        ("POST", "/api/openclaw/simulate", {"channel": "whatsapp", "text": "Ate protein shake 200 cal 30g protein"}),
    ]

    print("\n--- ENDPOINT VERIFICATION RESULTS ---")
    all_ok = True
    for method, path, json_data in endpoints:
        res = client_app.request(method, path, headers=headers, json=json_data)
        ok = (res.status_code == 200)
        if not ok:
            all_ok = False
        print(f"[{'PASS' if ok else 'FAIL'}] {method} {path} -> {res.status_code}")
        if not ok:
            print(f"       Detail: {res.text[:120]}")

    print("\nAll endpoints working:", all_ok)
