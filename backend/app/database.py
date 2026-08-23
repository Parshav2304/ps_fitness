"""
Database configuration for MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from typing import Optional
import certifi

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "fitness_ai")

# Global client instance
_client: Optional[AsyncIOMotorClient] = None
_database = None

def get_database():
    """Get MongoDB database instance"""
    global _client, _database
    if _client is None:
        print("DEBUG: Initializing database connection...")
        
        # Only use TLS CA certifi wrapper for cloud Atlas connections (mongodb+srv)
        client_kwargs = {}
        if "mongodb+srv://" in MONGODB_URL:
            client_kwargs["tlsCAFile"] = certifi.where()
            
        _client = AsyncIOMotorClient(MONGODB_URL, **client_kwargs)
        _database = _client[DATABASE_NAME]
    return _database

def get_client():
    """Get MongoDB client instance"""
    global _client
    if _client is None:
        client_kwargs = {}
        if "mongodb+srv://" in MONGODB_URL:
            client_kwargs["tlsCAFile"] = certifi.where()
        _client = AsyncIOMotorClient(MONGODB_URL, **client_kwargs)
    return _client

async def close_database():
    """Close database connection"""
    global _client
    if _client:
        _client.close()
        _client = None

async def init_db():
    """Initialize database indexes"""
    db = get_database()
    
    # Create indexes for better query performance
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.progress_entries.create_index([("user_id", 1), ("date", -1)])
    await db.goals.create_index([("user_id", 1), ("created_at", -1)])
    await db.workout_plans.create_index([("user_id", 1), ("created_at", -1)])
    await db.meal_plans.create_index([("user_id", 1), ("created_at", -1)])
    await db.chat_history.create_index([("user_id", 1), ("created_at", -1)])
    
    # Telemetry and logging indexes for fast aggregation
    await db.food_logs.create_index([("user_id", 1), ("date", 1)])
    await db.hydration_logs.create_index([("user_id", 1), ("date", 1)])
    await db.sleep_logs.create_index([("user_id", 1), ("date", -1)])
