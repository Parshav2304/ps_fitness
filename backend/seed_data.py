"""
Seed Data Script for PS Fitness
Resets account passwords and creates rich demonstration data for today and recent weeks.
"""
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
from app.auth import get_password_hash, verify_password

client = MongoClient('mongodb://localhost:27017')
db = client['fitness_ai']

# 1. Reset passwords
new_hash = get_password_hash("Parshav123!")
target_emails = [
    "parshavshah2304@gmail.com",
    "forstake2304@gmail.com",
    "demo@psfitness.dev"
]

db.users.update_many(
    {"email": {"$in": target_emails}},
    {"$set": {
        "hashed_password": new_hash,
        "fitness_goal": "muscle_gain",
        "activity_level": "moderate",
        "weight": 75.0,
        "height": 178.0,
        "age": 25,
        "level": 3,
        "xp": 850,
        "xp_to_next_level": 1000,
        "streak_days": 5
    }}
)

print(f"[1/4] Passwords updated to 'Parshav123!' for {target_emails}")

# Verify passwords
for email in target_emails:
    u = db.users.find_one({"email": email})
    if u:
        valid = verify_password("Parshav123!", u["hashed_password"])
        print(f"       -> {email}: password verified = {valid}")

# 2. Seed data for all target users
users = list(db.users.find({"email": {"$in": target_emails}}))
now = datetime.now(timezone.utc)
today_iso = now.isoformat()
today_date_str = now.strftime("%Y-%m-%d")

for u in users:
    uid = str(u["_id"])
    
    # 2.1 Today's Food Logs
    db.food_logs.delete_many({"user_id": uid, "date": {"$regex": f"^{today_date_str}"}})
    meals = [
        {
            "user_id": uid,
            "name": "Whey Protein & Oatmeal Bowl",
            "calories": 420,
            "protein": 34.0,
            "carbs": 52.0,
            "fats": 8.0,
            "meal": "breakfast",
            "servings": 1.0,
            "date": f"{today_date_str}T08:30:00.000Z",
            "created_at": now - timedelta(hours=7)
        },
        {
            "user_id": uid,
            "name": "Grilled Chicken Breast, Basmati & Broccoli",
            "calories": 560,
            "protein": 52.0,
            "carbs": 60.0,
            "fats": 10.0,
            "meal": "lunch",
            "servings": 1.0,
            "date": f"{today_date_str}T13:00:00.000Z",
            "created_at": now - timedelta(hours=3)
        },
        {
            "user_id": uid,
            "name": "Greek Yogurt with Blueberries & Almonds",
            "calories": 260,
            "protein": 22.0,
            "carbs": 18.0,
            "fats": 6.0,
            "meal": "snacks",
            "servings": 1.0,
            "date": f"{today_date_str}T16:15:00.000Z",
            "created_at": now - timedelta(hours=1)
        }
    ]
    db.food_logs.insert_many(meals)

    # 2.2 Today's Hydration (2000 ml)
    db.hydration_logs.delete_many({"user_id": uid, "date": {"$regex": f"^{today_date_str}"}})
    hydrations = [
        {"user_id": uid, "amount_ml": 500, "date": f"{today_date_str}T08:00:00.000Z"},
        {"user_id": uid, "amount_ml": 750, "date": f"{today_date_str}T12:30:00.000Z"},
        {"user_id": uid, "amount_ml": 750, "date": f"{today_date_str}T15:45:00.000Z"}
    ]
    db.hydration_logs.insert_many(hydrations)

    # 2.3 Recent Completed Workouts
    db.workout_logs.delete_many({"user_id": uid})
    workout_history = [
        {
            "user_id": uid,
            "name": "Push Hypertrophy A",
            "date": (now - timedelta(days=2)).isoformat(),
            "duration_minutes": 55,
            "notes": "Felt strong on bench, hit 85kg for 3x8 with 2 RIR.",
            "exercises": [
                {
                    "name": "Barbell Bench Press",
                    "sets": [
                        {"set_number": 1, "reps": 8, "weight_kg": 85.0, "rpe": 8.0, "completed": True},
                        {"set_number": 2, "reps": 8, "weight_kg": 85.0, "rpe": 8.5, "completed": True},
                        {"set_number": 3, "reps": 8, "weight_kg": 85.0, "rpe": 9.0, "completed": True}
                    ]
                },
                {
                    "name": "Incline DB Press",
                    "sets": [
                        {"set_number": 1, "reps": 10, "weight_kg": 30.0, "rpe": 8.0, "completed": True},
                        {"set_number": 2, "reps": 10, "weight_kg": 30.0, "rpe": 8.5, "completed": True}
                    ]
                },
                {
                    "name": "Dumbbell Lateral Raises",
                    "sets": [
                        {"set_number": 1, "reps": 15, "weight_kg": 12.0, "rpe": 8.5, "completed": True},
                        {"set_number": 2, "reps": 15, "weight_kg": 12.0, "rpe": 9.0, "completed": True},
                        {"set_number": 3, "reps": 14, "weight_kg": 12.0, "rpe": 10.0, "completed": True}
                    ]
                }
            ],
            "created_at": now - timedelta(days=2)
        },
        {
            "user_id": uid,
            "name": "Pull & Biceps A",
            "date": (now - timedelta(days=1)).isoformat(),
            "duration_minutes": 50,
            "notes": "Great lat pump, maintained strict lumbar bracing.",
            "exercises": [
                {
                    "name": "Barbell Bent Over Row",
                    "sets": [
                        {"set_number": 1, "reps": 8, "weight_kg": 75.0, "rpe": 8.0, "completed": True},
                        {"set_number": 2, "reps": 8, "weight_kg": 75.0, "rpe": 8.0, "completed": True},
                        {"set_number": 3, "reps": 8, "weight_kg": 75.0, "rpe": 8.5, "completed": True}
                    ]
                },
                {
                    "name": "Lat Pulldown (Neutral Grip)",
                    "sets": [
                        {"set_number": 1, "reps": 10, "weight_kg": 65.0, "rpe": 8.0, "completed": True},
                        {"set_number": 2, "reps": 10, "weight_kg": 65.0, "rpe": 8.5, "completed": True}
                    ]
                }
            ],
            "created_at": now - timedelta(days=1)
        }
    ]
    db.workout_logs.insert_many(workout_history)

    # 2.4 30-Day Historical Progress & TDEE Weight Trend
    db.progress_entries.delete_many({"user_id": uid})
    progress_records = []
    base_weight = 76.5
    for i in range(30, 0, -1):
        entry_date = now - timedelta(days=i)
        progress_records.append({
            "user_id": uid,
            "weight": round(base_weight - ((30 - i) * 0.05), 2),
            "calories_consumed": 2150 + ((i % 5) * 40),
            "date": entry_date.isoformat(),
            "created_at": entry_date
        })
    db.progress_entries.insert_many(progress_records)

    # 2.5 Sleep Logs
    db.sleep_logs.delete_many({"user_id": uid})
    sleep_records = []
    for i in range(7, 0, -1):
        sleep_records.append({
            "user_id": uid,
            "duration_hours": round(7.2 + ((i % 3) * 0.3), 1),
            "quality_score": 85 + ((i % 4) * 3),
            "date": (now - timedelta(days=i)).isoformat()
        })
    db.sleep_logs.insert_many(sleep_records)

print("[2/4] Seeded today's meals, hydration, workouts, and 30-day analytics for all users!")
print("ALL DONE! PS Fitness database is now fully populated and vibrant.")
