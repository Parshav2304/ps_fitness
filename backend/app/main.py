"""
FastAPI main application with MongoDB and Authentication
"""
print("DEBUG: I AM THE CORRECT FILE - LOADED main.py")
from fastapi import FastAPI, HTTPException, status, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional, Any
from app.schemas.schemas import (
    UserInput, PredictionOutput, HealthStatus, ErrorResponse,
    ProgressEntryCreate, GoalCreate, WorkoutPlanRequest, MealPlanRequest, ChatMessage, ChatResponse,
    WorkoutSet, ExerciseLog, WorkoutLogCreate, WorkoutLogResponse,
    ProgressEntryResponse, FoodLogCreate, FoodLogResponse,
    HydrationLogCreate, HydrationLogResponse, ChatHistory,
    SleepLogCreate, SleepLogResponse, ProgressPhotoCreate, ProgressPhotoResponse
)
from app.schemas.auth_schemas import UserRegister, UserLogin, Token, UserResponse, UserUpdate
from app.services.prediction_service import get_prediction_service
from app.services.workout_service import WorkoutService
from app.services.meal_service import MealService
from app.services.chatbot_service import ChatbotService
from app.services.usda_service import USDAService
from app.services.barcode_service import BarcodeService
from app.services.gamification_service import GamificationService
from app.services.grocery_service import GroceryService
from app.database import get_database, init_db, close_database
from app.auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_user_id
)
from app.agents.fitness_agent import FitnessAgent
from app.agents.nutrition_agent import NutritionAgent
from app.agents.progress_agent import ProgressAgent
from app.agents.analytics_agent import AnalyticsAgent
from bson import ObjectId
from datetime import datetime, timedelta
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Load environment variables
load_dotenv()
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting PS Fitness API...")
    # Initialize database
    await init_db()
    logger.info("MongoDB database initialized")
    prediction_service = get_prediction_service()
    model_info = prediction_service.get_model_info()
    logger.info(f"Model info: {model_info}")
    yield
    # Shutdown
    logger.info("Shutting down PS Fitness API...")
    await close_database()

# Create FastAPI app
app = FastAPI(
    title="PS Fitness API",
    description="AI-powered fitness plan prediction with personalized nutrition recommendations",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "detail": str(exc)}
    )



# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        db = get_database()
        
        # Check if user already exists
        existing_user = await db.users.find_one({
            "$or": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        })
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )
        
        # Create new user
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "full_name": user_data.full_name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            # Fitness Profile
            "age": user_data.age,
            "gender": user_data.gender,
            "height": user_data.height,
            "weight": user_data.weight,
            "activity_level": user_data.activity_level,
            "fitness_goal": user_data.fitness_goal
        }
        
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        # Return user data (without password)
        user_response = {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "created_at": user_doc["created_at"].isoformat(),
            "age": user_data.age,
            "gender": user_data.gender,
            "height": user_data.height,
            "weight": user_data.weight,
            "activity_level": user_data.activity_level,
            "fitness_goal": user_data.fitness_goal
        }
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during registration: {str(e)}"
        )

@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login and get access token"""
    try:
        logger.info(f"Login attempt for email: {credentials.email}")
        db = get_database()
        
        # Find user by email
        user = await db.users.find_one({"email": credentials.email})
        logger.info(f"User found: {user is not None}")
        
        if not user or not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create access token
        user_id = str(user["_id"])
        access_token = create_access_token(data={"sub": user_id})
        
        # Return user data (without password)
        user_response = {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "created_at": user["created_at"].isoformat()
        }
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    if "created_at" in current_user and not isinstance(current_user["created_at"], str):
        current_user["created_at"] = current_user["created_at"].isoformat()
        
    # Gamification Data
    level = current_user.get("level", 1)
    current_user["level"] = level
    current_user["xp"] = current_user.get("xp", 0)
    current_user["xp_to_next_level"] = level * 1000
    current_user["streak_days"] = current_user.get("streak_days", 0)
    
    return UserResponse(**current_user)

@app.put("/auth/me", response_model=UserResponse)
async def update_current_user_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update current user profile"""
    try:
        db = get_database()
        user_id = current_user["id"]  # 'auth.py' stores id as string, _id is deleted
        
        # Filter out None values
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
            
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user in DB
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Get updated user
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        # Convert _id to id string for response
        updated_user["id"] = str(updated_user["_id"])
        del updated_user["_id"]
        
        # Format created_at for response
        if "created_at" in updated_user and not isinstance(updated_user["created_at"], str):
            updated_user["created_at"] = updated_user["created_at"].isoformat()
            
        return UserResponse(**updated_user)
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

# ==================== HYDRATION ENDPOINTS ====================

@app.post("/hydration/log", response_model=HydrationLogResponse)
async def log_hydration(log: HydrationLogCreate, current_user: dict = Depends(get_current_user)):
    """Log water intake"""
    try:
        db = get_database()
        user_id = str(current_user["id"])  # Convert to string to match DB format
        
        # 1. Prepare Log Entry
        log_entry = log.model_dump()
        log_entry["user_id"] = user_id
        if not log_entry.get("date"):
            log_entry["date"] = datetime.utcnow().isoformat()
        
        # 2. Insert into DB
        new_log = await db.hydration_logs.insert_one(log_entry)
        log_entry["id"] = str(new_log.inserted_id)
        
        # 3. Gamification (Small XP for water)
        # XP: 5 XP per log
        xp_result = await GamificationService.award_xp(user_id, 5)
        log_entry["xp_earned"] = xp_result["xp_gained"] if xp_result else 0
        
        # Update streak? Maybe treated as activity? Yes.
        await GamificationService.update_streak(user_id)
        
        return HydrationLogResponse(**log_entry)
        
    except Exception as e:
        logger.error(f"Error logging hydration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging hydration: {str(e)}"
        )

@app.delete("/hydration/undo")
async def undo_hydration_log(current_user: dict = Depends(get_current_user)):
    """Remove the most recent hydration log for today"""
    try:
        db = get_database()
        user_id = str(current_user["id"])  # Convert to string to match DB format
        
        # Find latest log for today
        today_str = datetime.utcnow().date().isoformat()
        
        # Sort by natural insertion order (ObjectId) explicitly to be sure, or rely on _id
        latest_log = await db.hydration_logs.find_one(
            {
                "user_id": user_id,
                "date": {"$regex": f"^{today_str}"}
            },
            sort=[("_id", -1)]
        )
        
        if not latest_log:
            raise HTTPException(status_code=404, detail="No hydration logs found for today to undo")
            
        # Delete it
        await db.hydration_logs.delete_one({"_id": latest_log["_id"]})
        
        # Helper to remove XP/Streak? 
        # For simplicity in this "fix", we might leave XP/Streak as is to avoid complex rollback logic 
        # or we could try to deduct. Let's deduct 5 XP if possible, but keep it simple first.
        # User requested "remove" water option.
        
        amount_removed = latest_log.get("amount_ml", 0)
        return {"message": "Undo successful", "amount_removed": amount_removed}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error undoing hydration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hydration/today")
async def get_hydration_today(current_user: dict = Depends(get_current_user)):
    """Get total water intake for today"""
    try:
        db = get_database()
        user_id = str(current_user["id"])  # Convert to string to match DB format
        
        today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
        today_end = datetime.combine(datetime.utcnow().date(), datetime.max.time())
        
        # Safer approach: Fetch logs where 'date' string starts with YYYY-MM-DD
        today_str = datetime.utcnow().date().isoformat()
        print(f"DEBUG: Fetching hydration for user {user_id} on date {today_str}")
        cursor = db.hydration_logs.find({
            "user_id": user_id,
            "date": {"$regex": f"^{today_str}"}
        })
        logs = await cursor.to_list(length=100)
        print(f"DEBUG: Found {len(logs)} logs")
        
        total_ml = sum([log.get("amount_ml", 0) for log in logs])
        
        return {"total_ml": total_ml, "logs_count": len(logs)}
        
    except Exception as e:
        logger.error(f"Error fetching hydration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching hydration: {str(e)}"
        )

# ==================== SLEEP ENDPOINTS ====================

@app.post("/sleep/log", response_model=SleepLogResponse)
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
        
        # XP Reward
        xp_result = await GamificationService.award_xp(user_id, 10) # 10 XP for sleeping log
        log_entry["xp_earned"] = xp_result["xp_gained"] if xp_result else 0
        
        # Update streak
        await GamificationService.update_streak(user_id)
        
        return SleepLogResponse(**log_entry)
        
    except Exception as e:
        logger.error(f"Error logging sleep: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sleep/recent", response_model=List[SleepLogResponse])
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

# ==================== PROGRESS ENDPOINTS ====================

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded ML model"""
    prediction_service = get_prediction_service()
    return prediction_service.get_model_info()

@app.post("/predict", response_model=PredictionOutput, status_code=status.HTTP_200_OK)
async def predict_fitness_plan(user_input: UserInput, current_user_id: str = Depends(get_current_user_id)):
    """
    Predict fitness plan and calculate nutrition requirements
    """
    try:
        logger.info(f"Received prediction request for user: {current_user_id}")
        logger.info(f"Input data: height={user_input.height}, weight={user_input.weight}, age={user_input.age}")
        
        prediction_service = get_prediction_service()
        result = prediction_service.predict(user_input)
        
        logger.info(f"Prediction successful: plan={result.plan}")
        return result
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating prediction: {str(e)}"
        )

@app.post("/predict/confidence")
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
        logger.error(f"Error getting confidence scores: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating confidence: {str(e)}"
        )

@app.get("/plans")
async def get_available_plans():
    """Get information about all available fitness plans"""
    from app.agents.fitness_agent import FitnessAgent
    
    plans = {
        "Cut": {
            "name": "Cut",
            "goal": "Fat Loss",
            "calorie_adjustment": -500,
            "description": FitnessAgent.get_plan_description("Cut"),
            "recommended_for": "High body fat, overweight individuals"
        },
        "Bulk": {
            "name": "Bulk",
            "goal": "Muscle Gain",
            "calorie_adjustment": +400,
            "description": FitnessAgent.get_plan_description("Bulk"),
            "recommended_for": "Underweight, low muscle mass individuals"
        },
        "Lean": {
            "name": "Lean",
            "goal": "Lean Muscle Gain",
            "calorie_adjustment": +150,
            "description": FitnessAgent.get_plan_description("Lean"),
            "recommended_for": "Normal weight, active individuals"
        },
        "Recomp": {
            "name": "Recomp",
            "goal": "Body Recomposition",
            "calorie_adjustment": 0,
            "description": FitnessAgent.get_plan_description("Recomp"),
            "recommended_for": "Moderate body fat, sedentary individuals"
        }
    }
    
    return {"plans": plans}

@app.get("/activity-levels")
async def get_activity_levels():
    """Get information about activity level multipliers"""
    return {
        "activity_levels": [
            {
                "value": 1.2,
                "label": "Sedentary",
                "description": "Little or no exercise, desk job"
            },
            {
                "value": 1.375,
                "label": "Lightly Active",
                "description": "Light exercise 1-3 days/week"
            },
            {
                "value": 1.55,
                "label": "Moderately Active",
                "description": "Moderate exercise 3-5 days/week"
            },
            {
                "value": 1.725,
                "label": "Very Active",
                "description": "Hard exercise 6-7 days/week"
            },
            {
                "value": 1.9,
                "label": "Extremely Active",
                "description": "Very hard exercise, physical job or training twice per day"
            }
        ]
    }

# ==================== ADVANCED FEATURES ====================

@app.post("/progress", status_code=status.HTTP_201_CREATED)
async def create_progress_entry(entry: ProgressEntryCreate, current_user_id: str = Depends(get_current_user_id)):
    """Save a progress entry for tracking over time"""
    try:
        db = get_database()
        
        # Calculate metrics
        fitness_agent = FitnessAgent()
        bmi = fitness_agent.calculate_bmi(entry.weight, entry.height)
        
        # Get user info for BMR calculation
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        # For now, use defaults - you can store age/gender in user profile
        bmr = fitness_agent.calculate_bmr_mifflin_st_jeor(
            entry.weight, entry.height, 25, "male"
        )
        tdee = bmr * entry.activity_level if hasattr(entry, 'activity_level') else bmr * 1.55
        
        # Get current plan prediction
        user_input = UserInput(
            height=entry.height,
            weight=entry.weight,
            age=25,
            gender="male",
            activity_level=1.55,
            body_fat=entry.body_fat
        )
        prediction_service = get_prediction_service()
        prediction = prediction_service.predict(user_input)
        
        # Create progress entry
        progress_doc = {
            "user_id": current_user_id,
            "date": datetime.utcnow(),
            "weight": entry.weight,
            "height": entry.height,
            "body_fat": entry.body_fat,
            "bmi": bmi,
            "bmr": bmr,
            "tdee": tdee,
            "activity_level": entry.activity_level if hasattr(entry, 'activity_level') and entry.activity_level else 1.55,
            "fitness_plan": prediction.plan,
            "target_calories": prediction.target_calories,
            "macros_protein": prediction.macros.protein,
            "macros_carbs": prediction.macros.carbs,
            "macros_fat": prediction.macros.fat,
            "notes": entry.notes
        }
        
        result = await db.progress_entries.insert_one(progress_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "Progress entry created successfully",
            "date": progress_doc["date"].isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error creating progress entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating progress entry: {str(e)}"
        )

@app.get("/progress")
async def get_progress_history(limit: int = 30, current_user_id: str = Depends(get_current_user_id)):
    """Get progress history for current user"""
    try:
        db = get_database()
        
        cursor = db.progress_entries.find(
            {"user_id": current_user_id}
        ).sort("date", -1).limit(limit)
        
        entries = await cursor.to_list(length=limit)
        
        return [
            {
                "id": str(entry["_id"]),
                "user_id": entry["user_id"],
                "date": entry["date"].isoformat(),
                "weight": entry["weight"],
                "height": entry["height"],
                "body_fat": entry.get("body_fat"),
                "bmi": entry["bmi"],
                "bmr": entry["bmr"],
                "tdee": entry["tdee"],
                "fitness_plan": entry["fitness_plan"],
                "target_calories": entry["target_calories"]
            }
            for entry in entries
        ]
    
    except Exception as e:
        logger.error(f"Error fetching progress: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching progress: {str(e)}"
        )

@app.post("/progress/photos", status_code=status.HTTP_201_CREATED)
async def upload_progress_photo(photo: ProgressPhotoCreate, current_user_id: str = Depends(get_current_user_id)):
    """Upload a progress photo"""
    try:
        db = get_database()
        
        photo_doc = photo.dict()
        photo_doc["user_id"] = current_user_id
        photo_doc["created_at"] = datetime.utcnow()
        
        result = await db.progress_photos.insert_one(photo_doc)
        
        return {"id": str(result.inserted_id), "message": "Photo uploaded successfully"}
    
    except Exception as e:
        logger.error(f"Error uploading photo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress/photos", response_model=List[ProgressPhotoResponse])
async def get_progress_photos(current_user_id: str = Depends(get_current_user_id)):
    """Get all progress photos for user"""
    try:
        db = get_database()
        cursor = db.progress_photos.find({"user_id": current_user_id}).sort("date", -1)
        photos = await cursor.to_list(length=100)
        
        return [
            {**photo, "id": str(photo["_id"])} 
            for photo in photos
        ]
        
    except Exception as e:
        logger.error(f"Error fetching photos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/goals", status_code=status.HTTP_201_CREATED)
async def create_goal(goal: GoalCreate, current_user_id: str = Depends(get_current_user_id)):
    """Create a fitness goal"""
    try:
        db = get_database()
        
        deadline = None
        if goal.deadline:
            deadline = datetime.fromisoformat(goal.deadline.replace('Z', '+00:00'))
        
        goal_doc = {
            "user_id": current_user_id,
            "goal_type": goal.goal_type,
            "target_value": goal.target_value,
            "current_value": goal.current_value,
            "unit": goal.unit,
            "deadline": deadline,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed": 0
        }
        
        result = await db.goals.insert_one(goal_doc)
        
        return {"id": str(result.inserted_id), "message": "Goal created successfully"}
    
    except Exception as e:
        logger.error(f"Error creating goal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating goal: {str(e)}"
        )

@app.get("/goals")
async def get_goals(current_user_id: str = Depends(get_current_user_id)):
    """Get all goals for current user"""
    try:
        db = get_database()
        
        cursor = db.goals.find({"user_id": current_user_id}).sort("created_at", -1)
        goals = await cursor.to_list(length=100)
        
        result = []
        for goal in goals:
            progress = ((goal["current_value"] / goal["target_value"]) * 100) if goal["target_value"] > 0 else 0
            progress = min(100, max(0, progress))
            
            result.append({
                "id": str(goal["_id"]),
                "user_id": goal["user_id"],
                "goal_type": goal["goal_type"],
                "target_value": goal["target_value"],
                "current_value": goal["current_value"],
                "unit": goal["unit"],
                "deadline": goal["deadline"].isoformat() if goal.get("deadline") else None,
                "progress_percentage": round(progress, 2),
                "completed": goal["completed"]
            })
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching goals: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching goals: {str(e)}"
        )

@app.post("/workout/generate")
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

@app.post("/workout/log", response_model=WorkoutLogResponse)
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
        from app.services.gamification_service import GamificationService
        
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

@app.post("/food/log", response_model=FoodLogResponse)
async def log_food(food: FoodLogCreate, current_user: dict = Depends(get_current_user)):
    """Log a food item"""
    try:
        user_id = current_user["id"]
        db = get_database()
        
        # Create log entry
        log_entry = food.model_dump()
        log_entry["user_id"] = user_id
        if not log_entry.get("date"):
            log_entry["date"] = datetime.utcnow().isoformat()
        log_entry["created_at"] = datetime.utcnow()
        
        # Insert into database
        result = await db.food_logs.insert_one(log_entry)
        
        # Gamification
        from app.services.gamification_service import GamificationService
        
        # 1. Award XP (Meal Log)
        xp_result = await GamificationService.award_xp(user_id, GamificationService.XP_MEAL_LOG)
        
        # 2. Update Streak
        streak_result = await GamificationService.update_streak(user_id, db)
        
        # 3. Check Achievements
        achievements = await GamificationService.check_achievements(user_id, 'food', log_entry)

        # Prepare response
        log_entry["id"] = str(result.inserted_id)
        log_entry["created_at"] = log_entry["created_at"].isoformat()
        if "_id" in log_entry:
            del log_entry["_id"]
            
        # Add gamification info
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging food: {str(e)}"
        )

@app.get("/food/today", response_model=List[FoodLogResponse])
async def get_food_today(current_user: dict = Depends(get_current_user)):
    """Get all food logs for today"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        # Filter by today's date prefix (YYYY-MM-DD)
        today_str = datetime.utcnow().date().isoformat()
        cursor = db.food_logs.find({
            "user_id": user_id,
            "date": {"$regex": f"^{today_str}"}
        }).sort("date", 1)
        
        logs = await cursor.to_list(length=100)
        
        # Process logs for response
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
        # Return empty list on error to not break UI
        return []

@app.get("/food/recent", response_model=List[Dict])
async def get_recent_foods(current_user: dict = Depends(get_current_user)):
    """Get unique recently logged foods for quick add"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        # Get last 50 logs
        cursor = db.food_logs.find({"user_id": user_id}).sort("date", -1).limit(50)
        logs = await cursor.to_list(length=50)
        
        # Deduplicate by name
        seen_names = set()
        unique_foods = []
        
        for log in logs:
            if log["name"] not in seen_names:
                seen_names.add(log["name"])
                unique_foods.append({
                    "name": log["name"],
                    "calories": int(log["calories"] / log.get("servings", 1)), # Normalize per serving
                    "protein": round(log["protein"] / log.get("servings", 1), 1),
                    "carbs": round(log["carbs"] / log.get("servings", 1), 1),
                    "fats": round(log["fats"] / log.get("servings", 1), 1),
                    "serving": "1 serving", # Placeholder
                    "category": "Recent"
                })
                
            if len(unique_foods) >= 10:
                break
                
        return unique_foods
        
    except Exception as e:
        logger.error(f"Error fetching recent foods: {str(e)}")
        return []

@app.delete("/food/log/{log_id}")
async def delete_food_log(log_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a specific food log entry by ID"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        # Validate ObjectId
        try:
            oid = ObjectId(log_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        # Ensure the log belongs to the current user before deleting
        log = await db.food_logs.find_one({"_id": oid, "user_id": user_id})
        if not log:
            raise HTTPException(status_code=404, detail="Food log not found or not authorized")
        
        await db.food_logs.delete_one({"_id": oid})
        
        return {"message": "Food log deleted successfully", "id": log_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting food log: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting food log: {str(e)}")

@app.post("/progress/log", response_model=ProgressEntryResponse)
async def log_progress(entry: ProgressEntryCreate, current_user: dict = Depends(get_current_user)):
    """Log a progress entry (weight, body fat, etc.)"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        # Calculate derived metrics
        # Simple BMR calc (Mifflin-St Jeor)
        weight = entry.weight
        height = entry.height
        age = current_user.get("age", 25)
        gender = current_user.get("gender", "male")
        
        if gender == "male":
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
            
        tdee = bmr * entry.activity_level
        
        # Determine target calories based on goal (simple logic)
        fitness_plan = current_user.get("fitness_goal", "general_fitness")
        if fitness_plan == "weight_loss":
            target_calories = int(tdee - 500)
        elif fitness_plan == "muscle_gain":
            target_calories = int(tdee + 400)
        else:
            target_calories = int(tdee)
            
        progress_doc = entry.dict()
        progress_doc.update({
            "user_id": user_id,
            "date": datetime.utcnow().isoformat(),
            "bmi": weight / ((height / 100) ** 2),
            "bmr": bmr,
            "tdee": tdee,
            "fitness_plan": fitness_plan,
            "target_calories": target_calories,
            "created_at": datetime.utcnow(),
            "id": int(datetime.utcnow().timestamp()) # Simple ID generation
        })
        
        # Insert into DB
        await db.progress_entries.insert_one(progress_doc)
        
        # Also update User Profile current weight
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"weight": weight, "updated_at": datetime.utcnow()}}
        )
        
        # Gamification Hooks
        from app.services.gamification_service import GamificationService
        
        # 1. Award XP (Base)
        xp_result = await GamificationService.award_xp(user_id, 20)
        
        # 2. Update Streak
        streak_result = await GamificationService.update_streak(user_id, db)
        
        # Prepare response
        if "_id" in progress_doc:
            del progress_doc["_id"]
            
        # Add gamification info to response
        if xp_result:
            progress_doc["xp_earned"] = xp_result["xp_gained"]
            if xp_result["leveled_up"]:
                progress_doc["new_level"] = xp_result["new_level"]
                progress_doc["level_up_message"] = f"🎉 LEVEL UP! You reached Level {xp_result['new_level']}!"
        
        if streak_result and streak_result.get("xp_gained"):
             progress_doc["streak_bonus"] = streak_result["xp_gained"]
             progress_doc["xp_earned"] = (progress_doc.get("xp_earned") or 0) + streak_result["xp_gained"]
             progress_doc["level_up_message"] = (progress_doc.get("level_up_message") or "") + f" 🔥 Streak Bonus: +{streak_result['xp_gained']} XP!"

        return ProgressEntryResponse(**progress_doc)

    except Exception as e:
        logger.error(f"Error logging progress: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging progress: {str(e)}"
        )

@app.post("/nutrition/meal-plan")
async def generate_meal_plan(request: MealPlanRequest, current_user: dict = Depends(get_current_user)):
    """Generate a personalized meal plan with PERFECT macros"""
    try:
        # 1. Calculate Target Macros based on Diet Type (Perfect Ratios)
        if not request.macros:
            calories = request.target_calories
            diet_type = request.diet_type.lower()
            
            # Default Ratios (Balanced / Vegetarian / Vegan / Non-Veg)
            # Protein: 25%, Carbs: 45%, Fat: 30%
            p_ratio = 0.25
            c_ratio = 0.45
            f_ratio = 0.30
            
            if diet_type == 'keto':
                # Keto: 5% Carbs, 30% Protein, 65% Fat (Strict)
                p_ratio = 0.30
                c_ratio = 0.05
                f_ratio = 0.65
            elif diet_type == 'low_carb':
                # Low Carb: 20% Carbs, 40% Protein, 40% Fat
                p_ratio = 0.40
                c_ratio = 0.20
                f_ratio = 0.40
            elif diet_type == 'high_protein':
                # High Protein: 35% Carbs, 40% Protein, 25% Fat
                p_ratio = 0.40
                c_ratio = 0.35
                f_ratio = 0.25
            
            # Calculate grams
            protein_g = int((calories * p_ratio) / 4)
            carbs_g = int((calories * c_ratio) / 4)
            fat_g = int((calories * f_ratio) / 9)
            
            request.macros = {
                "protein": protein_g,
                "carbs": carbs_g,
                "fat": fat_g
            }
            
        # 2. Generate Plan using Service
        meal_service = MealService()
        plan = await meal_service.generate_meal_plan(
            target_calories=request.target_calories,
            macros=request.macros,
            meals_per_day=request.meals_per_day,
            diet_type=request.diet_type
        )
        
        # 3. Save to Database
        db = get_database()
        meal_doc = {
            "user_id": str(current_user["id"]),
            "date": datetime.utcnow(),
            "target_calories": request.target_calories,
            "diet_type": request.diet_type,
            "plan": plan
        }
        await db.meal_plans.insert_one(meal_doc)
        
        return plan
    
    except Exception as e:
        logger.error(f"Error generating meal plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating meal plan: {str(e)}"
        )

@app.get("/meal/suggestions")
async def get_meal_suggestions(macro_type: str = "balanced", calories: int = 500, current_user_id: str = Depends(get_current_user_id)):
    """Get meal suggestions based on macro preference"""
    try:
        meal_service = MealService()
        suggestions = meal_service.get_meal_suggestions(macro_type, calories)
        return {"suggestions": suggestions}
    
    except Exception as e:
        logger.error(f"Error getting meal suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting meal suggestions: {str(e)}"
        )

@app.get("/chat/history")
async def get_chat_history(current_user_id: str = Depends(get_current_user_id)):
    """Get user's chat history"""
    try:
        db = get_database()
        cursor = db.chat_history.find({"user_id": current_user_id}).sort("created_at", -1).limit(50)
        recent_docs = await cursor.to_list(length=50)
        
        history = []
        for doc in reversed(recent_docs):
            history.append({'role': 'user', 'content': doc['message'], 'timestamp': doc['created_at'].isoformat()})
            history.append({'role': 'assistant', 'content': doc['response'], 'timestamp': doc['created_at'].isoformat()})
            
        return history
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chat history: {str(e)}"
        )

# ==================== ANALYTICS ENDPOINTS ====================

@app.get("/analytics/dashboard")
async def get_analytics_dashboard(current_user: dict = Depends(get_current_user)):
    """Get aggregated data for analytics dashboard"""
    try:
        user_id = current_user["id"]
        logger.info(f"Fetching analytics for user_id: {user_id}")
        db = get_database()
        
        # 1. Fetch Workout Logs (for Volume, Consistency, PRs)
        cursor = db.workout_logs.find({"user_id": user_id}).sort("date", 1)
        workout_logs = await cursor.to_list(length=1000)
        logger.info(f"Found {len(workout_logs)} workout logs for user {user_id}")
        
        # 2. Fetch Progress Entries (for Weight Trend)
        p_cursor = db.progress_entries.find({"user_id": user_id}).sort("date", 1)
        progress_entries = await p_cursor.to_list(length=1000)
        logger.info(f"Found {len(progress_entries)} progress entries for user {user_id}")

        # 2b. Fetch Sleep Logs (New)
        cursor = db.sleep_logs.find({"user_id": user_id}).sort("date", 1)
        sleep_logs = await cursor.to_list(length=30) # Last 30 days sufficient for correlation
        
        # 3. Calculate Stats
        from app.agents.analytics_agent import AnalyticsAgent
        
        # Volume Chart
        volume_data = AnalyticsAgent.calculate_workout_volume(workout_logs)
        
        # Weight Trend Chart
        # Convert progress entries to chart format {labels: [], data: []}
        weight_labels = []
        weight_values = []
        for entry in progress_entries:
            date_val = entry.get("date")
            if isinstance(date_val, str):
                date_val = datetime.fromisoformat(date_val.replace('Z', ''))
            elif isinstance(date_val, datetime):
                pass
            else:
                continue # Skip invalid dates
                
            weight_labels.append(date_val.strftime("%b %d"))
            weight_values.append(entry.get("weight", 0))
            
        weight_trend = {
            "labels": weight_labels,
            "data": weight_values
        }

        # Measurement Trends
        waist_values = []
        chest_values = []
        arms_values = []
        
        for entry in progress_entries:
             if entry.get("waist"): waist_values.append(entry.get("waist"))
             if entry.get("chest"): chest_values.append(entry.get("chest"))
             if entry.get("arms"): arms_values.append(entry.get("arms"))
        
        # Only sending data if we have similar lengths, but for simple line chart we can just send arrays
        # Actually simplified: we need labels for each, but we can reuse weight_labels if we assume logged together?
        # Safe bet: send full objects or separate charts. Let's send separate simplified data.
        
        measurements_data = {
             "waist": waist_values, # Simple array for sparkline or parallel chart
             "chest": chest_values,
             "arms": arms_values,
             "labels": weight_labels # Assuming logs are same frequency roughly
        }

        # Consistency Heatmap
        consistency_heatmap = AnalyticsAgent.generate_consistency_heatmap(workout_logs)
        
        # Personal Records
        best_lifts = AnalyticsAgent.identify_personal_records(workout_logs)
        
        # Weekly Summary
        weekly_summary = AnalyticsAgent.get_weekly_summary(workout_logs)
        
        # Aggregate Stats
        total_volume = sum([log.get("volume", 0) for log in workout_logs])
        
        # Quick streak calc (naive)
        current_streak = 0 
        # (Real streak logic is complex, maybe reuse User profile streak
        # Consistency Heatmap
        consistency_heatmap = AnalyticsAgent.generate_consistency_heatmap(workout_logs)
        
        # New: Progressive Overload Insights
        po_insights = AnalyticsAgent.detect_progressive_overload(workout_logs)
        sleep_insights = AnalyticsAgent.analyze_sleep_correlation(workout_logs, sleep_logs)
        
        all_insights = po_insights + sleep_insights
        
        return {
            "stats": {
                "total_workouts": len(workout_logs),
                "total_volume": total_volume,
                "current_streak": current_user.get("streak_days", 0)
            },
            "volume_chart": volume_data,
            "weight_trend": weight_trend,
            "measurements_data": measurements_data,
            "consistency_heatmap": consistency_heatmap,
            "best_lifts": best_lifts,
            "weekly_summary": weekly_summary,
            "insights": all_insights
        }
        
    except Exception as e:
        logger.error(f"Error generating analytics dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics dashboard: {str(e)}"
        )

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    """Chat with AI fitness assistant"""
    try:
        # Convert ObjectId to string
        user_id = str(current_user.get('id'))
        
        # Get additional context for analysis (Weight trend & Calorie consistency)
        db = get_database()
        cursor = db.progress_entries.find({"user_id": user_id}).sort("date", -1).limit(30)
        recent_entries = await cursor.to_list(length=30)
        
        avg_calories = 0
        weight_change = 0
        if recent_entries:
            # Calculate 7-day calorie average
            last_7 = recent_entries[:7]
            if last_7:
                avg_calories = sum(e.get('calories_consumed', 0) for e in last_7) / len(last_7)
            
            # Calculate weight change (last 30 days) - safely handle None values
            current_weight = recent_entries[0].get('weight')
            oldest_weight = recent_entries[-1].get('weight')
            if current_weight is not None and oldest_weight is not None:
                weight_change = current_weight - oldest_weight

        user_context = {
            'username': current_user.get('username'),
            'weight': current_user.get('weight'),
            'height': current_user.get('height'),
            'age': current_user.get('age'),
            'fitness_goal': current_user.get('fitness_goal'),
            'activity_level': current_user.get('activity_level'),
            'stats': {
                'avg_daily_calories': round(avg_calories),
                'weight_change_30d': round(weight_change, 1),
                'entries_count': len(recent_entries)
            }
        }
        
        chatbot_service = ChatbotService()
        
        # Get chat history (last 5 exchanges = 10 messages)
        db = get_database()
        cursor = db.chat_history.find({"user_id": user_id}).sort("created_at", -1).limit(5)
        recent_docs = await cursor.to_list(length=5)
        
        conversation_history = []
        for doc in reversed(recent_docs):
            conversation_history.append({'role': 'user', 'content': doc['message']})
            conversation_history.append({'role': 'assistant', 'content': doc['response']})
        
        response = await chatbot_service.process_message(
            message.message,
            user_id,
            user_context,
            conversation_history,
            message.image_data
        )
        
        # Save chat history
        db = get_database()
        
        # Don't save the massive base64 string to DB to save space, just the text
        chat_msg_content = message.message
        if message.image_data:
            chat_msg_content = f"[Attached Image] {chat_msg_content}"
            
        await db.chat_history.insert_one({
            "user_id": user_id,
            "message": chat_msg_content,
            "response": response,
            "created_at": datetime.utcnow()
        })
        
        return ChatResponse(response=response)
        
    except Exception as e:
        logger.error(f"Error in chat processing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in chat processing: {str(e)}"
        )

@app.delete("/chat/history")
async def clear_chat_history(current_user: dict = Depends(get_current_user)):
    """Clear user's chat history"""
    try:
        user_id = str(current_user.get('id'))
        db = get_database()
        
        # Delete all history for this user
        result = await db.chat_history.delete_many({"user_id": user_id})
        
        return {"message": f"Cleared {result.deleted_count} messages", "success": True}
        
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )





@app.get("/export")
async def export_user_data(format: str = "json", current_user_id: str = Depends(get_current_user_id)):
    """Export user data in JSON or CSV format"""
    try:
        db = get_database()
        
        entries_cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", 1)
        entries = await entries_cursor.to_list(length=10000)
        
        goals_cursor = db.goals.find({"user_id": current_user_id})
        goals = await goals_cursor.to_list(length=1000)
        
        data = {
            "user_id": current_user_id,
            "export_date": datetime.utcnow().isoformat(),
            "progress_entries": [
                {
                    "date": entry["date"].isoformat(),
                    "weight": entry["weight"],
                    "height": entry["height"],
                    "body_fat": entry.get("body_fat"),
                    "bmi": entry["bmi"],
                    "bmr": entry["bmr"],
                    "tdee": entry["tdee"],
                    "fitness_plan": entry["fitness_plan"],
                    "target_calories": entry["target_calories"],
                    "macros": {
                        "protein": entry["macros_protein"],
                        "carbs": entry["macros_carbs"],
                        "fat": entry["macros_fat"]
                    }
                }
                for entry in entries
            ],
            "goals": [
                {
                    "goal_type": goal["goal_type"],
                    "target_value": goal["target_value"],
                    "current_value": goal["current_value"],
                    "unit": goal["unit"],
                    "deadline": goal["deadline"].isoformat() if goal.get("deadline") else None,
                    "completed": bool(goal["completed"])
                }
                for goal in goals
            ]
        }
        
        if format.lower() == "csv":
            import csv
            import io
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["date", "weight", "bmi", "body_fat", "fitness_plan"])
            writer.writeheader()
            for entry in entries:
                writer.writerow({
                    "date": entry["date"].isoformat(),
                    "weight": entry["weight"],
                    "bmi": entry["bmi"],
                    "body_fat": entry.get("body_fat") or "",
                    "fitness_plan": entry["fitness_plan"]
                })
            from fastapi.responses import Response
            return Response(content=output.getvalue(), media_type="text/csv")
        
        return data
    
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting data: {str(e)}"
        )

# NOTE: /hydration/log and /hydration/today are defined earlier (lines 290 and 363)

# ==================== ADVANCED AGENT ENDPOINTS ====================

@app.get("/agents/nutrition/hydration")
async def get_hydration_plan(
    weight_kg: float,
    activity_level: float,
    climate: str = "moderate",
    current_user_id: str = Depends(get_current_user_id)
):
    """Get personalized hydration plan"""
    try:
        nutrition_agent = NutritionAgent()
        plan = nutrition_agent.get_hydration_plan(weight_kg, activity_level, climate)
        return plan
    except Exception as e:
        logger.error(f"Error generating hydration plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating hydration plan: {str(e)}"
        )

@app.get("/agents/nutrition/supplements")
async def get_supplement_recommendations(
    plan: str,
    goals: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get personalized supplement recommendations"""
    try:
        nutrition_agent = NutritionAgent()
        goal_list = goals.split(",") if goals else []
        recommendations = nutrition_agent.get_supplement_recommendations(plan, goal_list)
        return recommendations
    except Exception as e:
        logger.error(f"Error getting supplement recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recommendations: {str(e)}"
        )

@app.post("/agents/nutrition/analyze-macros")
async def analyze_macro_balance(
    macros: dict,
    plan: str,
    weight_kg: float,
    current_user_id: str = Depends(get_current_user_id)
):
    """Analyze macro balance and get recommendations"""
    try:
        nutrition_agent = NutritionAgent()
        analysis = nutrition_agent.analyze_macro_balance(macros, plan, weight_kg)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing macros: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing macros: {str(e)}"
        )

@app.get("/agents/progress/velocity")
async def get_progress_velocity(current_user_id: str = Depends(get_current_user_id)):
    """Calculate progress velocity and predictions"""
    try:
        db = get_database()
        cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", 1)
        entries = await cursor.to_list(length=1000)
        
        # Convert ObjectId to string and ensure dates are datetime
        for entry in entries:
            entry["id"] = str(entry["_id"])
            del entry["_id"]
            # Ensure date is datetime object
            if "date" in entry and isinstance(entry["date"], str):
                try:
                    entry["date"] = datetime.fromisoformat(entry["date"].replace('Z', '+00:00'))
                except:
                    pass
        
        progress_agent = ProgressAgent()
        velocity = progress_agent.calculate_progress_velocity(entries)
        return velocity
    except Exception as e:
        logger.error(f"Error calculating velocity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating velocity: {str(e)}"
        )

@app.get("/agents/progress/plateaus")
async def detect_plateaus(
    metric: str = "weight",
    threshold_days: int = 14,
    current_user_id: str = Depends(get_current_user_id)
):
    """Detect progress plateaus"""
    try:
        db = get_database()
        cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", 1)
        entries = await cursor.to_list(length=1000)
        
        progress_agent = ProgressAgent()
        plateaus = progress_agent.detect_plateaus(entries, metric, threshold_days)
        return {"plateaus": plateaus, "count": len(plateaus)}
    except Exception as e:
        logger.error(f"Error detecting plateaus: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error detecting plateaus: {str(e)}"
        )

@app.get("/agents/progress/consistency")
async def get_consistency_score(current_user_id: str = Depends(get_current_user_id)):
    """Get tracking consistency score"""
    try:
        db = get_database()
        cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", 1)
        entries = await cursor.to_list(length=1000)
        
        progress_agent = ProgressAgent()
        consistency = progress_agent.calculate_consistency_score(entries)
        return consistency
    except Exception as e:
        logger.error(f"Error calculating consistency: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating consistency: {str(e)}"
        )

@app.get("/agents/analytics/insights")
async def get_comprehensive_insights(current_user_id: str = Depends(get_current_user_id)):
    """Get comprehensive analytics insights"""
    try:
        db = get_database()
        
        # Get progress data
        cursor = db.progress_entries.find({"user_id": current_user_id}).sort("date", 1)
        progress_data = await cursor.to_list(length=1000)
        
        # Get goals
        goals_cursor = db.goals.find({"user_id": current_user_id})
        goals = await goals_cursor.to_list(length=100)
        
        # Convert ObjectIds
        for entry in progress_data:
            if "_id" in entry:
                entry["id"] = str(entry["_id"])
                del entry["_id"]
        
        for goal in goals:
            if "_id" in goal:
                goal["id"] = str(goal["_id"])
                del goal["_id"]
            progress = ((goal.get("current_value", 0) / goal.get("target_value", 1)) * 100) if goal.get("target_value", 0) > 0 else 0
            goal["progress_percentage"] = round(min(100, max(0, progress)), 2)
        
        analytics_agent = AnalyticsAgent()
        insights = analytics_agent.generate_insights(progress_data, goals)
        return insights
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating insights: {str(e)}"
        )

# ============================================
# NUTRITION PLANS (UPDATED)
# ============================================
@app.post("/nutrition/meal-plan-new")
async def generate_meal_plan_endpoint_v2(
    request: MealPlanRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Generate a daily meal plan (v2)"""
    try:
        logger.info(f"Generating meal plan for user: {current_user.get('username')}, Request: {request}")
        
        # Test DB access explicitly
        try:
            db_test = get_database()
            logger.info("Database connection in meal plan endpoint: Success")
        except Exception as db_err:
             logger.error(f"Failed to get database in meal plan endpoint: {str(db_err)}")
             # Don't raise yet, as we might not need it for local generation
        
        # Calculate default macros if not provided
        macros_dict = {}
        if request.macros:
            macros_dict = request.macros.dict()
        else:
            # Simple 30/30/40 split or similar based on diet_type could go here
            cals = request.target_calories
            macros_dict = {
                "protein": int(cals * 0.3 / 4),
                "carbs": int(cals * 0.4 / 4),
                "fat": int(cals * 0.3 / 9)
            }
        
        logger.info(f"Calling MealService with macros: {macros_dict}")

        try:
            plan = await MealService.generate_meal_plan(
                target_calories=request.target_calories,
                macros=macros_dict,
                meals_per_day=request.meals_per_day,
                diet_type=request.diet_type
            )
            logger.info(f"Meal plan generated by: {plan.get('generated_by', 'UNKNOWN')} with diet: {request.diet_type}")
            return {"meal_plan": plan}
        except NameError as ne:
             logger.error(f"NameError in MealService or call: {str(ne)}")
             raise HTTPException(status_code=500, detail=f"Code Error: {str(ne)}")
        except Exception as inner_e:
             logger.error(f"Error inside MealService call: {str(inner_e)}")
             raise inner_e
        
    except Exception as e:
        logger.error(f"Error generating meal plan (Outer): {str(e)}")
        # Return specific error to frontend
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating meal plan: {str(e)}"
        )

# ============================================
# USDA FOODDATA CENTRAL API ENDPOINTS (FREE!)
# ============================================



@app.post("/nutrition/grocery-list")
async def generate_grocery_list(meal_plan: Dict = Body(...), current_user: dict = Depends(get_current_user)):
    """Generate a grocery list from a meal plan"""
    try:
        return GroceryService.generate_list(meal_plan)
    except Exception as e:
        logger.error(f"Error generating grocery list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating grocery list: {str(e)}"
        )

# ==================== FOOD DATABASE & SEARCH ====================

@app.get("/api/foods/search")
async def search_foods(query: str, page: int = 1, page_size: int = 25, current_user: dict = Depends(get_current_user)):
    """Search for foods in USDA database"""
    try:
        if not query or len(query) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query must be at least 2 characters"
            )
        
        results = USDAService.search_foods(query, page_size=page_size, page_number=page)
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching foods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching foods: {str(e)}"
        )

@app.get("/api/foods/{fdc_id}")
async def get_food_by_id(fdc_id: int):
    """Get detailed food information by USDA FDC ID"""
    try:
        food = USDAService.get_food_details(fdc_id)
        if food:
            return food
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Food not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting food details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting food details: {str(e)}"
        )

@app.get("/api/foods/barcode/{barcode}")
async def lookup_barcode(barcode: str):
    """Look up food by UPC/EAN barcode"""
    try:
        if not BarcodeService.validate_barcode(barcode):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid barcode format. Must be 8, 12, or 13 digits."
            )
        
        food = BarcodeService.lookup_barcode(barcode)
        if food:
            return food
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in database"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error looking up barcode: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error looking up barcode: {str(e)}"
        )

@app.get("/api/foods/category/{category}")
async def search_by_category(category: str, page_size: int = 25):
    """Search foods by category (fruits, vegetables, protein, etc.)"""
    try:
        results = USDAService.search_by_category(category, page_size=page_size)
        return results
    except Exception as e:
        logger.error(f"Error searching by category: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching by category: {str(e)}"
        )

# ==================== RECENT FOODS & FAVORITES ====================

@app.get("/api/foods/recent")
async def get_recent_foods(current_user: dict = Depends(get_current_user), limit: int = 20):
    """Get user's recently logged foods"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        # Get recent food logs
        cursor = db.food_logs.find(
            {"user_id": user_id}
        ).sort("logged_at", -1).limit(limit)
        
        logs = await cursor.to_list(length=limit)
        
        # Extract unique foods
        recent_foods = []
        seen_foods = set()
        
        for log in logs:
            food_id = log.get("food_id", "")
            if food_id and food_id not in seen_foods:
                seen_foods.add(food_id)
                recent_foods.append({
                    "id": food_id,
                    "name": log.get("food_name", ""),
                    "nutrition": log.get("nutrition", {}),
                    "last_logged": log.get("logged_at")
                })
        
        return {"recent_foods": recent_foods}
        
    except Exception as e:
        logger.error(f"Error getting recent foods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recent foods: {str(e)}"
        )

@app.get("/api/foods/favorites")
async def get_favorite_foods(current_user: dict = Depends(get_current_user)):
    """Get user's favorite foods"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        cursor = db.favorite_foods.find({"user_id": user_id}).sort("added_date", -1)
        favorites = await cursor.to_list(length=100)
        
        # Format response
        favorite_foods = []
        for fav in favorites:
            favorite_foods.append({
                "id": fav.get("food_id", ""),
                "name": fav.get("food_name", ""),
                "nutrition": fav.get("nutrition", {}),
                "added_date": fav.get("added_date")
            })
        
        return {"favorites": favorite_foods}
        
    except Exception as e:
        logger.error(f"Error getting favorites: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting favorites: {str(e)}"
        )

@app.post("/api/foods/favorites")
async def add_favorite_food(food_data: Dict = Body(...), current_user: dict = Depends(get_current_user)):
    """Add a food to favorites"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        # Check if already favorited
        existing = await db.favorite_foods.find_one({
            "user_id": user_id,
            "food_id": food_data.get("id")
        })
        
        if existing:
            return {"message": "Food already in favorites", "already_exists": True}
        
        # Add to favorites
        favorite = {
            "user_id": user_id,
            "food_id": food_data.get("id"),
            "food_name": food_data.get("name"),
            "nutrition": food_data.get("nutrition", {}),
            "added_date": datetime.utcnow().isoformat()
        }
        
        await db.favorite_foods.insert_one(favorite)
        
        return {"message": "Food added to favorites", "success": True}
        
    except Exception as e:
        logger.error(f"Error adding favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding favorite: {str(e)}"
        )

@app.delete("/api/foods/favorites/{food_id}")
async def remove_favorite_food(food_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a food from favorites"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        result = await db.favorite_foods.delete_one({
            "user_id": user_id,
            "food_id": food_id
        })
        
        if result.deleted_count > 0:
            return {"message": "Food removed from favorites", "success": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing favorite: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
