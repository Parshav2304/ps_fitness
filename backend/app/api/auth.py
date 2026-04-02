from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth_schemas import UserRegister, UserLogin, Token, UserResponse, UserUpdate
from app.database import get_database
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        db = get_database()
        
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
        
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "full_name": user_data.full_name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "age": user_data.age,
            "gender": user_data.gender,
            "height": user_data.height,
            "weight": user_data.weight,
            "activity_level": user_data.activity_level,
            "fitness_goal": user_data.fitness_goal
        }
        
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        access_token = create_access_token(data={"sub": user_id})
        
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

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login and get access token"""
    try:
        logger.info(f"Login attempt for email: {credentials.email}")
        db = get_database()
        
        user = await db.users.find_one({"email": credentials.email})
        logger.info(f"User found: {user is not None}")
        
        if not user or not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        user_id = str(user["_id"])
        access_token = create_access_token(data={"sub": user_id})
        
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

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    if "created_at" in current_user and not isinstance(current_user["created_at"], str):
        current_user["created_at"] = current_user["created_at"].isoformat()
        
    level = current_user.get("level", 1)
    current_user["level"] = level
    current_user["xp"] = current_user.get("xp", 0)
    current_user["xp_to_next_level"] = level * 1000
    current_user["streak_days"] = current_user.get("streak_days", 0)
    
    return UserResponse(**current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update current user profile"""
    try:
        db = get_database()
        user_id = current_user["id"]
        
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
            
        update_data["updated_at"] = datetime.utcnow()
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        updated_user["id"] = str(updated_user["_id"])
        del updated_user["_id"]
        
        if "created_at" in updated_user and not isinstance(updated_user["created_at"], str):
            updated_user["created_at"] = updated_user["created_at"].isoformat()
            
        return UserResponse(**updated_user)
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )
