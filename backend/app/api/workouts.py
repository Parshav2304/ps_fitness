from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
import logging

from app.database import get_database
from app.auth import get_current_user, get_current_user_id
from app.schemas.schemas import SleepLogCreate, SleepLogResponse, WorkoutPlanRequest, WorkoutLogCreate, WorkoutLogResponse
from app.services.workout_service import WorkoutService
from app.services.gamification_service import GamificationService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["workouts"])

@router.post("/sleep/log", response_model=SleepLogResponse)
async def log_sleep(log: SleepLogCreate, current_user: dict = Depends(get_current_user)):
    """Log sleep duration and quality"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        log_entry = log.model_dump()
        log_entry["user_id"] = user_id
        if not log_entry.get("date"):
            log_entry["date"] = datetime.utcnow().isoformat()
            
        new_log = await db.sleep_logs.insert_one(log_entry)
        log_entry["id"] = str(new_log.inserted_id)
        
        xp_result = await GamificationService.award_xp(user_id, 10) # 10 XP for sleeping log
        log_entry["xp_earned"] = xp_result["xp_gained"] if xp_result else 0
        
        await GamificationService.update_streak(user_id)
        
        return SleepLogResponse(**log_entry)
        
    except Exception as e:
        logger.error(f"Error logging sleep: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sleep/recent", response_model=List[SleepLogResponse])
async def get_recent_sleep(current_user: dict = Depends(get_current_user)):
    """Get last 7 sleep logs"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        cursor = db.sleep_logs.find({"user_id": user_id}).sort("date", -1).limit(7)
        logs = await cursor.to_list(length=7)
        
        return [SleepLogResponse(**{**log, "id": str(log["_id"])}) for log in logs]
        
    except Exception as e:
        logger.error(f"Error fetching sleep: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workout/generate")
async def generate_workout_plan(request: WorkoutPlanRequest, current_user_id: str = Depends(get_current_user_id)):
    """Generate a personalized workout plan"""
    try:
        workout_service = WorkoutService()
        plan = workout_service.generate_workout_plan(
            request.fitness_plan,
            request.days_per_week,
            request.location,
            request.is_athlete
        )
        
        # Save to database
        db = get_database()
        workout_doc = {
            "user_id": current_user_id,
            "fitness_plan": request.fitness_plan,
            "plan_name": plan["plan_name"],
            "duration_weeks": 12,
            "workouts": plan["workouts"],
            "created_at": datetime.utcnow(),
            "is_active": 1
        }
        await db.workout_plans.insert_one(workout_doc)
        
        return plan
    
    except Exception as e:
        logger.error(f"Error generating workout plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating workout plan: {str(e)}"
        )

@router.post("/workout/log", response_model=WorkoutLogResponse)
async def log_workout(workout: WorkoutLogCreate, current_user: dict = Depends(get_current_user)):
    """Log a completed workout"""
    try:
        user_id = current_user["id"]
        logger.info(f"Logging workout for user_id: {user_id}")
        db = get_database()
        
        # Create log entry
        log_entry = workout.model_dump()
        log_entry["user_id"] = user_id
        if not log_entry.get("date"):
            log_entry["date"] = datetime.utcnow().isoformat()
        log_entry["created_at"] = datetime.utcnow()
        
        # Insert into database
        result = await db.workout_logs.insert_one(log_entry)
        
        # Gamification hooks
        # 1. Award XP
        xp_result = await GamificationService.award_xp(user_id, GamificationService.XP_WORKOUT)
        
        # 2. Update Streak
        streak_result = await GamificationService.update_streak(user_id, db)
        
        # 3. Check Achievements
        achievements = await GamificationService.check_achievements(user_id, 'workout', log_entry)
        
        # Prepare response
        log_entry["id"] = str(result.inserted_id)
        if "_id" in log_entry:
            del log_entry["_id"]
            
        # Add gamification info
        if xp_result:
            log_entry["xp_earned"] = xp_result["xp_gained"]
            if xp_result["leveled_up"]:
                log_entry["new_level"] = xp_result["new_level"]
                log_entry["level_up_message"] = f"🎉 LEVEL UP! You reached Level {xp_result['new_level']}!"
        
        if streak_result and streak_result.get("xp_gained"):
             log_entry["xp_earned"] = (log_entry.get("xp_earned") or 0) + streak_result["xp_gained"]
             log_entry["level_up_message"] = (log_entry.get("level_up_message") or "") + f" 🔥 Streak Bonus: +{streak_result['xp_gained']} XP!"
             
        if achievements:
             # Just appending the first one for the toast
             log_entry["level_up_message"] = (log_entry.get("level_up_message") or "") + f" {achievements[0]}"

        # Fix: Convert datetime to string for response
        if isinstance(log_entry.get("created_at"), datetime):
            log_entry["created_at"] = log_entry["created_at"].isoformat()

        return WorkoutLogResponse(**log_entry)
        
    except Exception as e:
        logger.error(f"Error logging workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging workout: {str(e)}"
        )
