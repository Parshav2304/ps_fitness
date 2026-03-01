"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re

class UserRegister(BaseModel):
    """User registration schema"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: Optional[str] = Field(None, max_length=100, description="Full name")
    
    # Fitness Profile Fields
    age: Optional[int] = Field(None, ge=1, le=120, description="Age")
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$", description="Gender")
    height: Optional[float] = Field(None, ge=50, le=300, description="Height in cm")
    weight: Optional[float] = Field(None, ge=20, le=500, description="Weight in kg")
    activity_level: Optional[str] = Field(None, description="Activity level")
    fitness_goal: Optional[str] = Field(None, description="Fitness goal")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 100:
            raise ValueError('Password is too long')
        # Check for at least one number or special character
        if not re.search(r'[0-9!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password should contain at least one number or special character for better security')
        return v

class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")

class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    """User response schema"""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: str
    
    # Fitness Profile
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    fitness_goal: Optional[str] = None
    
    # Gamification
    level: int = 1
    xp: int = 0
    xp_to_next_level: int = 1000
    streak_days: int = 0
    last_activity_date: Optional[str] = None
    
    # New Fields
    achievements: list[str] = []
    settings: dict = {"theme": "dark", "units": "metric", "notifications": True}
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "username": "johndoe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "created_at": "2024-01-01T00:00:00",
                "age": 25,
                "gender": "male",
                "height": 175.0,
                "weight": 70.0,
                "activity_level": "moderate",
                "fitness_goal": "build_muscle",
                "level": 5,
                "xp": 4500,
                "settings": {"theme": "dark", "units": "metric"}
            }
        }

class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = Field(None, max_length=100)
    
    # Fitness Profile Fields
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height: Optional[float] = Field(None, ge=50, le=300)
    weight: Optional[float] = Field(None, ge=20, le=500)
    activity_level: Optional[str] = None
    fitness_goal: Optional[str] = None
    
    # Settings Update
    settings: Optional[dict] = None
