"""
Database configuration for MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from typing import Optional
import certifi
import asyncio

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "fitness_ai")

# Global client instance
_client: Optional[AsyncIOMotorClient] = None
_database = None

def get_database():
    """Get MongoDB database instance"""
    global _client, _database
    needs_new = _client is None
    if not needs_new:
        try:
            if hasattr(_client, "io_loop") and _client.io_loop is not None and _client.io_loop.is_closed():
                needs_new = True
        except Exception:
            pass
    if needs_new:
        print("DEBUG: Initializing database connection...")
        
        # Only use TLS CA certifi wrapper for cloud Atlas connections (mongodb+srv)
        client_kwargs = {"serverSelectionTimeoutMS": 5000}
        if "mongodb+srv://" in MONGODB_URL:
            client_kwargs["tlsCAFile"] = certifi.where()
            
        _client = AsyncIOMotorClient(MONGODB_URL, **client_kwargs)
        _database = _client[DATABASE_NAME]
    return _database

def get_client():
    """Get MongoDB client instance"""
    global _client
    needs_new = _client is None
    if not needs_new:
        try:
            if hasattr(_client, "io_loop") and _client.io_loop is not None and _client.io_loop.is_closed():
                needs_new = True
        except Exception:
            pass
    if needs_new:
        client_kwargs = {"serverSelectionTimeoutMS": 5000}
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
    """Initialize database indexes with resilience against connection delays"""
    try:
        db = get_database()
        
        # User auth uniqueness indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        
        # Performance indexes for telemetry & aggregation
        await db.progress_entries.create_index([("user_id", 1), ("date", -1)])
        await db.goals.create_index([("user_id", 1), ("created_at", -1)])
        await db.workout_plans.create_index([("user_id", 1), ("created_at", -1)])
        await db.meal_plans.create_index([("user_id", 1), ("created_at", -1)])
        await db.chat_history.create_index([("user_id", 1), ("created_at", -1)])
        
        # Telemetry and logging indexes for fast aggregation
        await db.workout_logs.create_index([("user_id", 1), ("date", 1)])
        await db.food_logs.create_index([("user_id", 1), ("date", 1)])
        await db.hydration_logs.create_index([("user_id", 1), ("date", 1)])
        await db.sleep_logs.create_index([("user_id", 1), ("date", -1)])
        await db.favorite_foods.create_index([("user_id", 1), ("food_id", 1)])
        await db.progress_photos.create_index([("user_id", 1), ("date", -1)])
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Could not build indexes on startup (DB may be offline): {e}")
