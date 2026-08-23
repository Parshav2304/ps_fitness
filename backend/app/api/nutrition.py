from fastapi import APIRouter, HTTPException, status, Depends, Body, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List, Dict
from datetime import datetime
from bson import ObjectId
import logging

from app.database import get_database
from app.auth import get_current_user, get_current_user_id
from app.schemas.schemas import FoodLogCreate, FoodLogResponse, HydrationLogCreate, HydrationLogResponse, MealPlanRequest
from app.services.usda_service import USDAService
from app.services.barcode_service import BarcodeService
from app.services.meal_service import MealService
from app.services.grocery_service import GroceryService
from app.services.gamification_service import GamificationService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["nutrition"])
limiter = Limiter(key_func=get_remote_address)

# ==================== HYDRATION ENDPOINTS ====================

@router.post("/hydration/log", response_model=HydrationLogResponse)
async def log_hydration(log: HydrationLogCreate, current_user: dict = Depends(get_current_user)):
    """Log water intake"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        log_entry = log.model_dump()
        log_entry["user_id"] = user_id
        if not log_entry.get("date"):
            log_entry["date"] = datetime.utcnow().isoformat()
        
        new_log = await db.hydration_logs.insert_one(log_entry)
        log_entry["id"] = str(new_log.inserted_id)
        
        xp_result = await GamificationService.award_xp(user_id, 5)
        log_entry["xp_earned"] = xp_result["xp_gained"] if xp_result else 0
        
        await GamificationService.update_streak(user_id)
        
        return HydrationLogResponse(**log_entry)
        
    except Exception as e:
        logger.error(f"Error logging hydration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/hydration/undo")
async def undo_hydration_log(current_user: dict = Depends(get_current_user)):
    """Remove the most recent hydration log for today"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        today_str = datetime.utcnow().date().isoformat()
        latest_log = await db.hydration_logs.find_one(
            {
                "user_id": user_id,
                "date": {"$regex": f"^{today_str}"}
            },
            sort=[("_id", -1)]
        )
        
        if not latest_log:
            raise HTTPException(status_code=404, detail="No hydration logs found for today to undo")
            
        await db.hydration_logs.delete_one({"_id": latest_log["_id"]})
        
        amount_removed = latest_log.get("amount_ml", 0)
        return {"message": "Undo successful", "amount_removed": amount_removed}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error undoing hydration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nutrition/hydration")
@router.get("/hydration/today")
async def get_hydration_today(current_user: dict = Depends(get_current_user)):
    """Get total water intake for today"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        today_str = datetime.utcnow().date().isoformat()
        cursor = db.hydration_logs.find({
            "user_id": user_id,
            "date": {"$regex": f"^{today_str}"}
        })
        logs = await cursor.to_list(length=100)
        
        total_ml = sum([log.get("amount_ml", 0) for log in logs])
        
        # User's goal - default to 2500ml if not set
        target_ml = current_user.get("hydration_goal", 2500)
        
        return {
            "total_ml": total_ml, 
            "target_ml": target_ml,
            "percentage": round((total_ml / target_ml) * 100, 1) if target_ml > 0 else 0,
            "logs_count": len(logs)
        }
        
    except Exception as e:
        logger.error(f"Error fetching hydration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FOOD LOG ENDPOINTS ====================

@router.post("/food/log", response_model=FoodLogResponse)
async def log_food(food: FoodLogCreate, current_user: dict = Depends(get_current_user)):
    """Log a food item"""
    try:
        user_id = current_user["id"]
        db = get_database()
        
        log_entry = food.model_dump()
        log_entry["user_id"] = user_id
        if not log_entry.get("date"):
            log_entry["date"] = datetime.utcnow().isoformat()
        log_entry["created_at"] = datetime.utcnow()
        
        result = await db.food_logs.insert_one(log_entry)
        
        xp_result = await GamificationService.award_xp(user_id, GamificationService.XP_MEAL_LOG)
        streak_result = await GamificationService.update_streak(user_id, db)
        achievements = await GamificationService.check_achievements(user_id, 'food', log_entry)

        log_entry["id"] = str(result.inserted_id)
        log_entry["created_at"] = log_entry["created_at"].isoformat()
        if "_id" in log_entry:
            del log_entry["_id"]
            
        if xp_result:
            log_entry["xp_earned"] = xp_result["xp_gained"]
            if xp_result["leveled_up"]:
                log_entry["new_level"] = xp_result["new_level"]
                log_entry["level_up_message"] = f"🎉 LEVEL UP! You reached Level {xp_result['new_level']}!"
        
        if streak_result and streak_result.get("xp_gained"):
             log_entry["streak_bonus"] = streak_result["xp_gained"]
             
        log_entry["achievements"] = achievements
        return FoodLogResponse(**log_entry)
        
    except Exception as e:
        logger.error(f"Error logging food: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/food/today", response_model=List[FoodLogResponse])
async def get_food_today(current_user: dict = Depends(get_current_user)):
    """Get all food logs for today"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        today_str = datetime.utcnow().date().isoformat()
        cursor = db.food_logs.find({
            "user_id": user_id,
            "date": {"$regex": f"^{today_str}"}
        }).sort("date", 1)
        
        logs = await cursor.to_list(length=100)
        processed_logs = []
        for log in logs:
            log["id"] = str(log["_id"])
            if "_id" in log: del log["_id"]
            if isinstance(log.get("created_at"), datetime):
                log["created_at"] = log["created_at"].isoformat()
            processed_logs.append(log)
            
        return [FoodLogResponse(**log) for log in processed_logs]
        
    except Exception as e:
        logger.error(f"Error fetching today's food: {str(e)}")
        return []

@router.get("/food/recent", response_model=List[Dict])
async def get_recent_foods(current_user: dict = Depends(get_current_user)):
    """Get unique recently logged foods for quick add"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        cursor = db.food_logs.find({"user_id": user_id}).sort("date", -1).limit(50)
        logs = await cursor.to_list(length=50)
        
        seen_names = set()
        unique_foods = []
        
        for log in logs:
            if log["name"] not in seen_names:
                seen_names.add(log["name"])
                unique_foods.append({
                    "name": log["name"],
                    "calories": int(log["calories"] / log.get("servings", 1)),
                    "protein": round(log["protein"] / log.get("servings", 1), 1),
                    "carbs": round(log["carbs"] / log.get("servings", 1), 1),
                    "fats": round(log["fats"] / log.get("servings", 1), 1),
                    "serving": "1 serving",
                    "category": "Recent"
                })
                
            if len(unique_foods) >= 10: break
                
        return unique_foods
        
    except Exception as e:
        logger.error(f"Error fetching recent foods: {str(e)}")
        return []

@router.delete("/food/log/{log_id}")
async def delete_food_log(log_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a specific food log entry by ID"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        try:
            oid = ObjectId(log_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        log = await db.food_logs.find_one({"_id": oid, "user_id": user_id})
        if not log:
            raise HTTPException(status_code=404, detail="Food log not found or not authorized")
        
        await db.food_logs.delete_one({"_id": oid})
        return {"message": "Food log deleted successfully", "id": log_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting food log: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== MEAL PLAN ENDPOINTS ====================

@router.post("/nutrition/meal-plan")
@limiter.limit("5/minute")
async def generate_meal_plan(request: Request, meal_request: MealPlanRequest, current_user: dict = Depends(get_current_user)):
    """Generate a personalized meal plan (rate-limited: 5/min)"""
    try:
        if not meal_request.macros:
            calories = meal_request.target_calories
            diet_type = meal_request.diet_type.lower()
            p_ratio, c_ratio, f_ratio = 0.25, 0.45, 0.30
            
            if diet_type == 'keto': p_ratio, c_ratio, f_ratio = 0.30, 0.05, 0.65
            elif diet_type == 'low_carb': p_ratio, c_ratio, f_ratio = 0.40, 0.20, 0.40
            elif diet_type == 'high_protein': p_ratio, c_ratio, f_ratio = 0.40, 0.35, 0.25
            
            meal_request.macros = {
                "protein": int((calories * p_ratio) / 4),
                "carbs": int((calories * c_ratio) / 4),
                "fat": int((calories * f_ratio) / 9)
            }
            
        meal_service = MealService()
        plan = await meal_service.generate_meal_plan(
            target_calories=meal_request.target_calories,
            macros=meal_request.macros,
            meals_per_day=meal_request.meals_per_day,
            diet_type=meal_request.diet_type
        )
        
        db = get_database()
        meal_doc = {
            "user_id": str(current_user["id"]),
            "date": datetime.utcnow(),
            "target_calories": meal_request.target_calories,
            "diet_type": meal_request.diet_type,
            "plan": plan
        }
        await db.meal_plans.insert_one(meal_doc)
        return plan
    
    except Exception as e:
        logger.error(f"Error generating meal plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meal/suggestions")
async def get_meal_suggestions(macro_type: str = "balanced", calories: int = 500, current_user_id: str = Depends(get_current_user_id)):
    """Get meal suggestions based on macro preference"""
    try:
        meal_service = MealService()
        suggestions = meal_service.get_meal_suggestions(macro_type, calories)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/nutrition/grocery-list")
@limiter.limit("5/minute")
async def generate_grocery_list(request: Request, meal_plan: Dict = Body(...), current_user: dict = Depends(get_current_user)):
    """Generate a grocery list from a meal plan (rate-limited: 5/min)"""
    try:
        return GroceryService.generate_list(meal_plan)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Food Search and Favorites routes have been moved/consolidated
