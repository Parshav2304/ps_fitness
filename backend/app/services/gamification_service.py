from datetime import datetime
from app.database import get_database
from fastapi import HTTPException
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class GamificationService:
    BASE_XP_PER_LEVEL = 1000
    XP_WORKOUT = 150
    XP_MEAL_LOG = 20
    XP_STREAK_BONUS = 50

    @staticmethod
    async def award_xp(user_id: str, amount: int):
        """
        Awards XP to a user and handles level ups.
        Returns: { "xp_gained": int, "new_level": int | None, "message": str }
        """
        db = get_database()
        
        # Get current user stats
        try:
             user_oid = ObjectId(user_id)
        except:
             return None

        user = await db.users.find_one({"_id": user_oid})
        if not user:
            return None
            
        current_xp = user.get("xp", 0)
        current_level = user.get("level", 1)
        
        # Calculate new XP
        new_xp = current_xp + amount
        
        # Level Up Logic
        # Formula: XP needed for next level = Level * 1000
        xp_needed = current_level * GamificationService.BASE_XP_PER_LEVEL
        
        leveled_up = False
        new_level = current_level
        
        # While loop to handle multiple level ups at once (huge XP gain)
        while new_xp >= xp_needed:
            new_xp -= xp_needed
            new_level += 1
            leveled_up = True
            xp_needed = new_level * GamificationService.BASE_XP_PER_LEVEL
            
        # Update DB
        update_data = {
            "xp": new_xp,
            "level": new_level
        }
        
        await db.users.update_one(
            {"_id": user_oid},
            {"$set": update_data}
        )
        
        return {
            "xp_gained": amount,
            "leveled_up": leveled_up,
            "new_level": new_level if leveled_up else None,
            "current_xp": new_xp,
            "xp_to_next_level": xp_needed
        }

    @staticmethod
    async def update_streak(user_id: str, db=None):
        """
        Updates user streak based on activity.
        Should be called whenever a user logs something (workout, food, etc).
        """
        if db is None:
            db = get_database()
            
        try:
             user_oid = ObjectId(user_id)
        except:
             return None

        user = await db.users.find_one({"_id": user_oid})
        if not user:
            return None
            
        today = datetime.utcnow().date()
        last_activity = user.get("last_activity_date")
        current_streak = user.get("streak_days", 0)
        
        # Parse last activity date
        if last_activity:
            if isinstance(last_activity, str):
                last_date = datetime.fromisoformat(last_activity).date()
            else:
                last_date = last_activity.date() if hasattr(last_activity, 'date') else last_activity
        else:
            last_date = None
            
        new_streak = current_streak
        streak_bonus = False
        
        if last_date == today:
            # Already logged today, do nothing
            return None
        elif last_date and (today - last_date).days == 1:
            # Consecutive day!
            new_streak += 1
            streak_bonus = True
        else:
            # Broken streak or first log
            new_streak = 1
            
        # Update User
        await db.users.update_one(
            {"_id": user_oid},
            {
                "$set": {
                    "streak_days": new_streak,
                    "last_activity_date": datetime.utcnow().isoformat()
                }
            }
        )
        
        if streak_bonus:
            return await GamificationService.award_xp(user_id, GamificationService.XP_STREAK_BONUS)
            
        return None

    @staticmethod
    async def check_achievements(user_id: str, event_type: str, event_data: dict):
        """
        Check and unlock achievements based on events.
        event_type: 'workout', 'food', 'login'
        """
        db = get_database()
        try:
             user_oid = ObjectId(user_id)
        except:
             return []

        user = await db.users.find_one({"_id": user_oid})
        if not user:
            return []
            
        unlocked_now = []
        current_achievements = user.get("achievements", [])
        
        async def unlock(code: str, title: str, xp: int = 100):
            if code not in current_achievements:
                await db.users.update_one(
                    {"_id": user_oid},
                    {"$push": {"achievements": code}, "$inc": {"xp": xp}}
                )
                unlocked_now.append(f"🏆 Unlocked: {title} (+{xp} XP)")
        
        # 1. Early Bird (Workout before 8 AM)
        if event_type == 'workout':
            # Check time
            created_at = event_data.get("created_at") or datetime.utcnow()
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', ''))
            
            # Assuming server time close to user time or just using UTC morning
            # 5 AM to 8 AM UTC? Or simple check < 8
            if 4 <= created_at.hour < 8: 
                await unlock("early_bird", "Early Bird: Morning Workout")
                
            # Heavy Lifter (> 5000kg volume)
            if event_data.get("volume", 0) > 5000:
                await unlock("heavy_lifter", "Heavy Lifter: >5000kg Volume")

        # 2. Clean Eater (Protein > 100g AND < 20% Sugar - simplified to Protein focus for now)
        if event_type == 'food':
             # Get today's logs
             today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
             logs = await db.food_logs.find({
                 "user_id": user_id,
                 "created_at": {"$gte": today_start}
             }).to_list(length=100)
             
             total_protein = sum([log.get("protein", 0) for log in logs])
             total_calories = sum([log.get("calories", 0) for log in logs])
             
             # Criteria depends on Fitness Goal
             goal = user.get("fitness_goal", "general_fitness")
             
             target_hit = False
             
             if goal == "muscle_gain":
                 # High Protein focus
                 if total_protein >= 150 and total_calories > 2000:
                     target_hit = True
             elif goal == "weight_loss":
                 # High Protein + Calorie Deficit (approx < 2200 for now, could be smarter)
                 if total_protein >= 120 and total_calories < 2200:
                     target_hit = True
             else:
                 # General / Maintain
                 if total_protein >= 100:
                     target_hit = True
                     
             if target_hit:
                  await unlock("clean_eater", "Clean Eater: Perfect Macros", 300)
            
        # 3. Streak Master
        if user.get("streak_days", 0) >= 7:
             await unlock("streak_master", "Streak Master: 7 Day Streak", 500)
             
        return unlocked_now

    @staticmethod
    async def get_user_gamification_stats(user_id: str):
        db = get_database()
        try:
             user_oid = ObjectId(user_id)
        except:
             return {}
             
        user = await db.users.find_one({"_id": user_oid})
        if not user:
            return {}
            
        return {
            "level": user.get("level", 1),
            "xp": user.get("xp", 0),
            "streak_days": user.get("streak_days", 0),
            "achievements": user.get("achievements", []),
            "xp_to_next_level": (user.get("level", 1) * GamificationService.BASE_XP_PER_LEVEL) - (user.get("xp", 0) % (user.get("level", 1) * GamificationService.BASE_XP_PER_LEVEL)) # Approx
        }
