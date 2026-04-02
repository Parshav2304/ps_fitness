"""
Pydantic schemas for request/response validation
Fully migrated to Pydantic V2 — uses ConfigDict, no deprecated class-based Config.
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Dict, List, Union
from enum import Enum


class Gender(str, Enum):
    """Gender enum"""
    MALE = "male"
    FEMALE = "female"


class ActivityLevel(float, Enum):
    """Activity level multipliers"""
    SEDENTARY = 1.2
    LIGHT = 1.375
    MODERATE = 1.55
    ACTIVE = 1.725
    VERY_ACTIVE = 1.9


class FitnessPlan(str, Enum):
    """Fitness plan types"""
    CUT = "Cut"
    BULK = "Bulk"
    LEAN = "Lean"
    RECOMP = "Recomp"


class UserInput(BaseModel):
    """User input schema for fitness prediction"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "height": 175,
                "weight": 75,
                "age": 25,
                "gender": "male",
                "activity_level": 1.55,
                "body_fat": 15.5,
                "goal": "Build muscle"
            }
        }
    )

    height: float = Field(..., gt=100, lt=250, description="Height in centimeters")
    weight: float = Field(..., gt=30, lt=300, description="Weight in kilograms")
    age: int = Field(..., gt=10, lt=120, description="Age in years")
    gender: str = Field(..., description="Gender (male/female)")
    activity_level: float = Field(..., ge=1.2, le=1.9, description="Activity level multiplier (1.2-1.9)")
    body_fat: Optional[float] = Field(None, ge=5, le=50, description="Body fat percentage (optional)")
    goal: Optional[str] = Field(None, description="User's fitness goal")

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v.lower() not in ['male', 'female']:
            raise ValueError('Gender must be "male" or "female"')
        return v.lower()

    @field_validator('activity_level')
    @classmethod
    def validate_activity_level(cls, v: float) -> float:
        valid_levels = [1.2, 1.375, 1.55, 1.725, 1.9]
        if v not in valid_levels:
            raise ValueError(f'Activity level must be one of {valid_levels}')
        return v


class MacroNutrients(BaseModel):
    """Macronutrient breakdown"""
    model_config = ConfigDict(
        json_schema_extra={"example": {"protein": 150, "carbs": 250, "fat": 65}}
    )

    protein: int = Field(..., description="Protein in grams")
    carbs: int = Field(..., description="Carbohydrates in grams")
    fat: int = Field(..., description="Fat in grams")


class PredictionOutput(BaseModel):
    """Prediction output schema"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "plan": "Lean",
                "bmi": 24.5,
                "bmi_category": "Normal weight",
                "body_fat_percentage": 15.5,
                "bmr": 1750.5,
                "tdee": 2713.3,
                "target_calories": 2863,
                "macros": {"protein": 150, "carbs": 320, "fat": 75},
                "plan_description": "Slow, controlled muscle gain with minimal fat gain.",
                "recommendations": [
                    "Focus on progressive overload in training",
                    "Prioritize protein intake around workouts",
                    "Get 7-9 hours of quality sleep"
                ]
            }
        }
    )

    plan: str = Field(..., description="Recommended fitness plan")
    bmi: float = Field(..., description="Body Mass Index")
    bmi_category: str = Field(..., description="BMI category")
    body_fat_percentage: float = Field(..., description="Estimated body fat percentage")
    bmr: float = Field(..., description="Basal Metabolic Rate (kcal)")
    tdee: float = Field(..., description="Total Daily Energy Expenditure (kcal)")
    target_calories: int = Field(..., description="Target daily calorie intake")
    macros: MacroNutrients = Field(..., description="Macronutrient breakdown")
    plan_description: str = Field(..., description="Description of the fitness plan")
    recommendations: List[str] = Field(..., description="Personalized recommendations")


class HealthStatus(BaseModel):
    """Health status response"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "message": "Fitness AI API is running",
                "version": "1.0.0"
            }
        }
    )

    status: str
    message: str
    version: str


class ErrorResponse(BaseModel):
    """Error response schema"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "Validation Error",
                "detail": "Height must be between 100 and 250 cm"
            }
        }
    )

    error: str
    detail: Optional[str] = None


class ProgressEntryCreate(BaseModel):
    """Schema for creating a progress entry"""
    weight: float = Field(..., gt=30, lt=300)
    height: float = Field(..., gt=100, lt=250)
    body_fat: Optional[float] = Field(None, ge=5, le=50)
    activity_level: Optional[float] = Field(1.55, ge=1.2, le=1.9)
    notes: Optional[str] = None


class ProgressEntryResponse(BaseModel):
    """Schema for progress entry response"""
    id: int
    user_id: str
    date: str
    weight: float
    height: float
    body_fat: Optional[float] = None
    bmi: float
    bmr: float
    tdee: float
    fitness_plan: str
    target_calories: int
    streak_bonus: Optional[int] = 0
    xp_earned: Optional[int] = 0
    new_level: Optional[int] = None
    level_up_message: Optional[str] = None


class GoalCreate(BaseModel):
    """Schema for creating a goal"""
    goal_type: str = Field(..., description="Type: weight_loss, muscle_gain, strength, endurance, body_fat")
    target_value: float = Field(..., description="Target value")
    current_value: float = Field(..., description="Current value")
    unit: str = Field(..., description="Unit: kg, lbs, %, etc.")
    deadline: Optional[str] = Field(None, description="Deadline date (ISO format)")


class GoalResponse(BaseModel):
    """Schema for goal response"""
    id: int
    user_id: str
    goal_type: str
    target_value: float
    current_value: float
    unit: str
    deadline: Optional[str] = None
    progress_percentage: float
    completed: int


class WorkoutPlanRequest(BaseModel):
    """Schema for workout plan request"""
    fitness_plan: str = Field(..., description="Cut, Bulk, Lean, or Recomp")
    days_per_week: int = Field(4, ge=3, le=6, description="Training days per week")
    location: str = Field("gym", description="gym or home")
    is_athlete: bool = Field(False, description="Increase volume/intensity")


class MealPlanRequest(BaseModel):
    """Schema for meal plan request"""
    target_calories: int = Field(..., ge=1000, le=5000)
    diet_type: str = Field("balanced", description="balanced, low_carb, high_protein")
    meals_per_day: int = Field(4, ge=3, le=5)
    macros: Optional[MacroNutrients] = None


class ChatMessage(BaseModel):
    """Schema for chatbot message"""
    message: str = Field(..., description="User's message")
    user_context: Optional[Dict] = Field(None, description="Optional user context")
    image_data: Optional[str] = Field(None, description="Optional Base64 encoded image data")


class ChatResponse(BaseModel):
    """Schema for chatbot response"""
    response: str
    suggestions: Optional[List[str]] = None


class ChatHistory(BaseModel):
    """Schema for chat history entry"""
    user_id: str
    role: str = Field(..., description="user or assistant")
    content: str
    timestamp: str  # ISO format string


class WorkoutSet(BaseModel):
    """Schema for a single workout set"""
    id: Optional[int] = None
    weight: float
    reps: int


class ExerciseLog(BaseModel):
    """Schema for a logged exercise"""
    id: Union[str, int]
    name: str
    sets: List[WorkoutSet]


class WorkoutLogCreate(BaseModel):
    """Schema for creating a workout log"""
    exercises: List[ExerciseLog]
    volume: float
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    date: Optional[str] = None  # ISO format


class FoodLogCreate(BaseModel):
    """Schema for logging food"""
    name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    meal: str  # breakfast, lunch, dinner, snacks
    servings: float = 1.0
    date: Optional[str] = None  # ISO format


class FoodLogResponse(BaseModel):
    """Schema for food log response"""
    id: str
    user_id: str
    name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    meal: str
    servings: float
    xp_earned: Optional[int] = 0
    new_level: Optional[int] = None
    level_up_message: Optional[str] = None
    streak_bonus: Optional[int] = 0
    achievements: Optional[List[str]] = None
    created_at: str

    model_config = ConfigDict(populate_by_name=True)


class WorkoutLogResponse(BaseModel):
    """Schema for workout log response"""
    id: str
    user_id: str
    date: str
    exercises: List[ExerciseLog]
    volume: float
    created_at: str

    # Gamification Info
    xp_earned: Optional[int] = 0
    new_level: Optional[int] = None
    level_up_message: Optional[str] = None


class HydrationLogCreate(BaseModel):
    """Schema for logging water intake"""
    amount_ml: int = Field(..., gt=0, description="Amount of water in ml")
    date: Optional[str] = None  # ISO format


class HydrationLogResponse(HydrationLogCreate):
    id: str
    user_id: str
    xp_earned: int = 0


class SleepLogCreate(BaseModel):
    """Schema for logging sleep"""
    duration_hours: float = Field(..., gt=0, le=24, description="Hours of sleep")
    quality: int = Field(..., ge=1, le=5, description="Quality rating 1-5")
    date: Optional[str] = None  # ISO format
    notes: Optional[str] = None


class SleepLogResponse(SleepLogCreate):
    id: str
    user_id: str
    xp_earned: int = 0


class ProgressPhotoCreate(BaseModel):
    date: str  # ISO Date
    image_data: str  # Base64 string
    view_type: str = "front"  # front, side, back
    notes: Optional[str] = None


class ProgressPhotoResponse(ProgressPhotoCreate):
    id: str
    user_id: str