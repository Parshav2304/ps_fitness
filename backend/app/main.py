"""
FastAPI main application with MongoDB and Authentication
"""
print("DEBUG: I AM THE CORRECT FILE - LOADED main.py")
from fastapi import FastAPI, HTTPException, status, Depends, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
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
from app.api import auth, workouts, nutrition, progress, chat

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

# Rate limiter — keyed by client IP
limiter = Limiter(key_func=get_remote_address)

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

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

app.include_router(auth.router)
app.include_router(workouts.router)

app.include_router(nutrition.router)
app.include_router(progress.router)
app.include_router(chat.router)


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
