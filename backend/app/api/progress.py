from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict
from datetime import datetime
from bson import ObjectId
import logging

from app.database import get_database
from app.auth import get_current_user, get_current_user_id
from app.schemas.schemas import UserInput, PredictionOutput, ProgressEntryCreate, ProgressEntryResponse, ProgressPhotoCreate, ProgressPhotoResponse, GoalCreate
from app.services.prediction_service import get_prediction_service
from app.agents.fitness_agent import FitnessAgent
from app.services.gamification_service import GamificationService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["progress"])

@router.get("/model/info")
async def get_model_info():
    """Get information about the loaded ML model"""
    prediction_service = get_prediction_service()
    return prediction_service.get_model_info()

@router.post("/predict", response_model=PredictionOutput, status_code=status.HTTP_200_OK)
async def predict_fitness_plan(user_input: UserInput, current_user_id: str = Depends(get_current_user_id)):
    """Predict fitness plan and calculate nutrition requirements"""
    try:
        prediction_service = get_prediction_service()
        result = prediction_service.predict(user_input)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/predict/confidence")
async def get_prediction_confidence(user_input: UserInput, current_user_id: str = Depends(get_current_user_id)):
    """Get confidence scores for all fitness plans"""
    try:
        prediction_service = get_prediction_service()
        confidence_scores = prediction_service.get_prediction_confidence(user_input)
        return {
            "confidence_scores": confidence_scores,
            "top_prediction": max(confidence_scores.items(), key=lambda x: x[1])[0] if confidence_scores else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans")
async def get_available_plans():
    """Get information about all available fitness plans"""
    plans = {
        "Cut": {"name": "Cut", "goal": "Fat Loss", "calorie_adjustment": -500, "description": FitnessAgent.get_plan_description("Cut"), "recommended_for": "High body fat, overweight individuals"},
        "Bulk": {"name": "Bulk", "goal": "Muscle Gain", "calorie_adjustment": +400, "description": FitnessAgent.get_plan_description("Bulk"), "recommended_for": "Underweight, low muscle mass individuals"},
        "Lean": {"name": "Lean", "goal": "Lean Muscle Gain", "calorie_adjustment": +150, "description": FitnessAgent.get_plan_description("Lean"), "recommended_for": "Normal weight, active individuals"},
        "Recomp": {"name": "Recomp", "goal": "Body Recomposition", "calorie_adjustment": 0, "description": FitnessAgent.get_plan_description("Recomp"), "recommended_for": "Moderate body fat, sedentary individuals"}
    }
    return {"plans": plans}

@router.get("/activity-levels")
async def get_activity_levels():
    """Get information about activity level multipliers"""
    return {
        "activity_levels": [
            {"value": 1.2, "label": "Sedentary", "description": "Little or no exercise"},
            {"value": 1.375, "label": "Lightly Active", "description": "Light exercise"},
            {"value": 1.55, "label": "Moderately Active", "description": "Moderate exercise"},
            {"value": 1.725, "label": "Very Active", "description": "Hard exercise"},
            {"value": 1.9, "label": "Extremely Active", "description": "Very hard exercise"}
        ]
    }

@router.post("/progress", status_code=status.HTTP_201_CREATED)
async def create_progress_entry(entry: ProgressEntryCreate, current_user_id: str = Depends(get_current_user_id)):
    """Save a progress entry for tracking over time"""
    try:
        db = get_database()
        fitness_agent = FitnessAgent()
        bmi = fitness_agent.calculate_bmi(entry.weight, entry.height)
        
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        
        # Safe defaults and mappings from the retrieved user profile
        age = user.get("age", 25) if user and user.get("age") else 25
        gender = user.get("gender", "male") if user and user.get("gender") else "male"
        gender_for_calc = gender.lower() if gender.lower() in ["male", "female"] else "male"
        
        def resolve_activity_multiplier(val) -> float:
            if isinstance(val, (int, float)):
                return float(val)
            if not isinstance(val, str):
                return 1.55
            val_lower = val.lower().strip()
            if "sedentary" in val_lower: return 1.2
            elif "light" in val_lower: return 1.375
            elif "moderate" in val_lower: return 1.55
            elif "very" in val_lower: return 1.9
            elif "active" in val_lower: return 1.725
            return 1.55

        activity_level = resolve_activity_multiplier(
            entry.activity_level or (user.get("activity_level") if user else 1.55)
        )
        
        bmr = fitness_agent.calculate_bmr_mifflin_st_jeor(entry.weight, entry.height, age, gender_for_calc)
        tdee = bmr * activity_level
        
        user_input = UserInput(
            height=entry.height,
            weight=entry.weight,
            age=age,
            gender=gender_for_calc,
            activity_level=activity_level,
            body_fat=entry.body_fat
        )
        prediction_service = get_prediction_service()
        prediction = prediction_service.predict(user_input)
        
        progress_doc = {
            "user_id": current_user_id,
            "date": datetime.utcnow(),
            "weight": entry.weight,
            "height": entry.height,
            "body_fat": entry.body_fat,
            "bmi": bmi,
            "bmr": bmr,
            "tdee": tdee,
            "activity_level": activity_level,
            "fitness_plan": prediction.plan,
            "target_calories": prediction.target_calories,
            "macros_protein": prediction.macros.protein,
            "macros_carbs": prediction.macros.carbs,
            "macros_fat": prediction.macros.fat,
            "notes": entry.notes
        }
        
        result = await db.progress_entries.insert_one(progress_doc)
        return {"id": str(result.inserted_id), "message": "Progress entry created successfully", "date": progress_doc["date"].isoformat()}
    except Exception as e:
        logger.error(f"Error creating progress entry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/progress")
async def get_progress_history(limit: int = 30, current_user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", -1).limit(limit)
        entries = await cursor.to_list(length=limit)
        return [{"id": str(e["_id"]), "user_id": e["user_id"], "date": e["date"].isoformat(), "weight": e["weight"], "height": e["height"], "bmi": e["bmi"], "bmr": e["bmr"], "tdee": e["tdee"], "fitness_plan": e["fitness_plan"], "target_calories": e["target_calories"]} for e in entries]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/progress/photos", status_code=status.HTTP_201_CREATED)
async def upload_progress_photo(photo: ProgressPhotoCreate, current_user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        photo_doc = photo.model_dump()
        photo_doc["user_id"] = current_user_id
        photo_doc["created_at"] = datetime.utcnow()
        result = await db.progress_photos.insert_one(photo_doc)
        return {"id": str(result.inserted_id), "message": "Photo uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/progress/photos", response_model=List[ProgressPhotoResponse])
async def get_progress_photos(current_user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        cursor = db.progress_photos.find({"user_id": current_user_id}).sort("date", -1)
        photos = await cursor.to_list(length=100)
        return [{**p, "id": str(p["_id"])} for p in photos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/goals", status_code=status.HTTP_201_CREATED)
async def create_goal(goal: GoalCreate, current_user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        deadline = datetime.fromisoformat(goal.deadline.replace('Z', '+00:00')) if goal.deadline else None
        goal_doc = {"user_id": current_user_id, "goal_type": goal.goal_type, "target_value": goal.target_value, "current_value": goal.current_value, "unit": goal.unit, "deadline": deadline, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "completed": 0}
        result = await db.goals.insert_one(goal_doc)
        return {"id": str(result.inserted_id), "message": "Goal created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals")
async def get_goals(current_user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        cursor = db.goals.find({"user_id": current_user_id}).sort("created_at", -1)
        goals = await cursor.to_list(length=100)
        
        result = []
        for goal in goals:
            progress = ((goal["current_value"] / goal["target_value"]) * 100) if goal["target_value"] > 0 else 0
            progress = min(100, max(0, progress))
            result.append({"id": str(goal["_id"]), "user_id": goal["user_id"], "goal_type": goal["goal_type"], "target_value": goal["target_value"], "current_value": goal["current_value"], "unit": goal["unit"], "deadline": goal["deadline"].isoformat() if goal.get("deadline") else None, "progress_percentage": round(progress, 2), "completed": goal["completed"]})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expenditure")
async def get_expenditure_analysis(current_user_id: str = Depends(get_current_user_id)):
    """Calculate MacroFactor-style dynamic TDEE expenditure & weight trend"""
    try:
        from app.services.expenditure_service import ExpenditureService
        db = get_database()

        # Fetch progress entries (weights)
        weights_cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", 1)
        weights = await weights_cursor.to_list(length=365)
        weight_entries = [{"date": w.get("date", ""), "weight": w.get("weight", 0.0)} for w in weights]

        # Fetch food logs (calories)
        cals_cursor = db.food_logs.find({"user_id": current_user_id}).sort("date", 1)
        cals = await cals_cursor.to_list(length=365)
        cal_entries = [{"date": c.get("date", ""), "calories": c.get("calories", 0.0)} for c in cals]

        smoothed_weights = ExpenditureService.calculate_weight_trend(weight_entries)
        tdee_info = ExpenditureService.calculate_tdee(weight_entries, cal_entries)

        # Get user profile for goal macro recommendation
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        goal = user.get("fitness_goal", "Maintain Weight") if user else "Maintain Weight"
        latest_weight = smoothed_weights[-1]["trend_weight"] if smoothed_weights else (user.get("weight", 70.0) if user else 70.0)

        tdee_val = tdee_info["estimated_tdee"] if tdee_info else 2200
        recommended_macros = ExpenditureService.calculate_macro_targets(tdee_val, goal, latest_weight)

        return {
            "weight_trends": smoothed_weights,
            "tdee": tdee_info,
            "recommended_macros": recommended_macros
        }
    except Exception as e:
        logger.error(f"Expenditure calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
