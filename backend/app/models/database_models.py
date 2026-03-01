"""
Database models for Fitness AI
"""
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime

class User(Base):
    """User model for tracking user sessions"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)  # Unique identifier (can be UUID or email)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress_entries = relationship("ProgressEntry", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")

class ProgressEntry(Base):
    """Track user progress over time"""
    __tablename__ = "progress_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Body metrics
    weight = Column(Float)
    height = Column(Float)
    body_fat = Column(Float, nullable=True)
    bmi = Column(Float)
    
    # Fitness metrics
    bmr = Column(Float)
    tdee = Column(Float)
    activity_level = Column(Float)
    
    # Current plan
    fitness_plan = Column(String)
    target_calories = Column(Integer)
    macros_protein = Column(Integer)
    macros_carbs = Column(Integer)
    macros_fat = Column(Integer)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="progress_entries")

class Goal(Base):
    """User fitness goals"""
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    
    goal_type = Column(String)  # 'weight_loss', 'muscle_gain', 'strength', 'endurance', 'body_fat'
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String)  # 'kg', 'lbs', '%', etc.
    deadline = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed = Column(Integer, default=0)  # 0 = not completed, 1 = completed
    
    # Relationship
    user = relationship("User", back_populates="goals")

class WorkoutPlan(Base):
    """Generated workout plans for users"""
    __tablename__ = "workout_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    fitness_plan = Column(String)  # Cut, Bulk, Lean, Recomp
    plan_name = Column(String)
    duration_weeks = Column(Integer, default=12)
    
    # Workout plan as JSON
    workouts = Column(JSON)  # List of workout days with exercises
    
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive
    
    # Relationship
    user = relationship("User", back_populates="workouts")

class MealPlan(Base):
    """Generated meal plans for users"""
    __tablename__ = "meal_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    fitness_plan = Column(String)
    target_calories = Column(Integer)
    
    # Meal plan as JSON
    meals = Column(JSON)  # List of meals with recipes and macros
    
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1)

class ChatHistory(Base):
    """Store AI chatbot conversations"""
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    message = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
