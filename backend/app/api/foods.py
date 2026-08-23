from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import List, Dict, Optional
from datetime import datetime
import logging

from app.database import get_database
from app.auth import get_current_user
from app.services.usda_service import USDAService
from app.services.barcode_service import BarcodeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/foods", tags=["foods"])

@router.get("/search")
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

@router.get("/recent")
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
        
        recent_foods = []
        seen_foods = set()
        
        for log in logs:
            food_name = log.get("name", "")
            if food_name and food_name not in seen_foods:
                seen_foods.add(food_name)
                recent_foods.append({
                    "id": str(log.get("_id")),
                    "name": food_name,
                    "calories": log.get("calories"),
                    "protein": log.get("protein"),
                    "carbs": log.get("carbs"),
                    "fats": log.get("fats"),
                    "meal": log.get("meal"),
                    "last_logged": log.get("date")
                })
        
        return {"recent_foods": recent_foods}
    except Exception as e:
        logger.error(f"Error getting recent foods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recent foods: {str(e)}"
        )

@router.get("/favorites")
async def get_favorite_foods(current_user: dict = Depends(get_current_user)):
    """Get user's favorite foods"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        cursor = db.favorite_foods.find({"user_id": user_id}).sort("added_date", -1)
        favorites = await cursor.to_list(length=100)
        
        favorite_foods = []
        for fav in favorites:
            favorite_foods.append({
                "id": str(fav.get("_id")),
                "food_id": fav.get("food_id", ""),
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

@router.post("/favorites")
async def add_favorite_food(food_data: Dict = Body(...), current_user: dict = Depends(get_current_user)):
    """Add a food to favorites"""
    try:
        db = get_database()
        user_id = str(current_user["id"])
        
        existing = await db.favorite_foods.find_one({
            "user_id": user_id,
            "food_id": food_data.get("id")
        })
        
        if existing:
            return {"message": "Food already in favorites", "already_exists": True}
        
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
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/favorites/{food_id}")
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
        raise HTTPException(status_code=404, detail="Favorite not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/barcode/{barcode}")
async def lookup_barcode(barcode: str):
    """Look up food by UPC/EAN barcode"""
    try:
        if not BarcodeService.validate_barcode(barcode):
            raise HTTPException(status_code=400, detail="Invalid barcode format")
        food = BarcodeService.lookup_barcode(barcode)
        if food:
            return food
        raise HTTPException(status_code=404, detail="Product not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error looking up barcode: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{fdc_id}")
async def get_food_by_id(fdc_id: int):
    """Get detailed food information by USDA FDC ID"""
    try:
        food = USDAService.get_food_details(fdc_id)
        if food:
            return food
        raise HTTPException(status_code=404, detail="Food not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting food details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
