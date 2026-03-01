"""
Advanced Nutrition Agent - Intelligent meal and nutrition recommendations
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class NutritionAgent:
    """Advanced agent for nutrition planning and recommendations"""
    
    
    def __init__(self):
        from app.services.llm_service import LLMService
        self.llm_service = LLMService()

    async def generate_daily_plan_llm(self, target_calories: int, macros: Dict[str, int], diet_type: str, meals_per_day: int) -> Optional[Dict]:
        """
        Generate a fully customized meal plan using LLM.
        Returns JSON structure matching the frontend.
        """
        if not self.llm_service.is_available():
            return None
            
        prompt = f"""
        Act as an elite expert nutritionist. Create a PERFECT 1-day meal plan.
        
        Strict Requirements:
        1. **Diet Type**: {diet_type} (Adhere strictly. If Keto, NO high carb. If Vegan, NO animal products. If Vegetarian, NO meat/fish [Eggs/Dairy OK]. If Non-Veg, include high quality meat/fish/eggs).
        2. **Target Calories**: {target_calories} (Total MUST be within +/- 50 calories).
        3. **Meal Count**: Exactly {meals_per_day} meals.
        4. **Meal Appropriateness**: Breakfast MUST be breakfast foods. Dinner MUST be dinner foods.
        5. **Macros**: Aim for {macros}.
        6. **Cuisine**: Authentically Indian (North/South Indian) or Indian Fusion. Use Indian names (e.g., "Paneer Tikka", "Dal Tadka", "Masala Dosa").
        
        Output MUST be valid JSON:
        {{
            "total_calories": <int>,
            "total_protein": <int>,
            "total_carbs": <int>,
            "total_fat": <int>,
            "total_price": <float>,
            "meals": [
                {{
                    "name": "Creative Meal Name",
                    "calories": <int>,
                    "protein": <int>,
                    "carbs": <int>,
                    "fat": <int>,
                    "price": <float approx INR>,
                    "ingredients": ["Qty Ingredient", ...]
                }}
            ]
        }}
        
        CRITICAL Rules:
        - Return EXACTLY {meals_per_day} meals in the list.
        - Ensure nutrients sum up correctly.
        - Use ONLY valid JSON. No markdown.
        """
        
        result = await self.llm_service.generate_json(prompt)
        return result

    @staticmethod
    def calculate_meal_timing(workout_time: Optional[str] = None, meals_per_day: int = 4) -> Dict:
        """
        Calculate optimal meal timing based on workout schedule
        
        Args:
            workout_time: Time of day for workout (morning, afternoon, evening)
            meals_per_day: Number of meals per day
        
        Returns:
            Dictionary with meal timing recommendations
        """
        if workout_time == "morning":
            return {
                "pre_workout": "30-60 minutes before workout: Light carb snack (banana, toast)",
                "post_workout": "Within 30 minutes: Protein + carbs (protein shake + fruit)",
                "meal_times": {
                    "breakfast": "7:00 AM",
                    "lunch": "12:00 PM",
                    "snack": "3:00 PM",
                    "dinner": "7:00 PM"
                }
            }
        elif workout_time == "afternoon":
            return {
                "pre_workout": "2-3 hours before: Balanced meal",
                "post_workout": "Within 30 minutes: Protein + carbs",
                "meal_times": {
                    "breakfast": "8:00 AM",
                    "lunch": "12:00 PM",
                    "pre_workout_snack": "2:00 PM",
                    "dinner": "7:00 PM"
                }
            }
        elif workout_time == "evening":
            return {
                "pre_workout": "1-2 hours before: Light meal",
                "post_workout": "Within 30 minutes: Protein + carbs",
                "meal_times": {
                    "breakfast": "8:00 AM",
                    "lunch": "12:00 PM",
                    "snack": "4:00 PM",
                    "dinner": "8:00 PM"
                }
            }
        else:
            return {
                "meal_times": {
                    "breakfast": "8:00 AM",
                    "lunch": "12:30 PM",
                    "snack": "4:00 PM",
                    "dinner": "7:00 PM"
                }
            }
    
    @staticmethod
    def get_hydration_plan(weight_kg: float, activity_level: float, climate: str = "moderate") -> Dict:
        """
        Calculate optimal hydration plan
        
        Args:
            weight_kg: Body weight in kg
            activity_level: Activity multiplier
            climate: Climate type (hot, moderate, cold)
        
        Returns:
            Hydration recommendations
        """
        base_water = weight_kg * 0.033  # Base: 33ml per kg
        
        # Activity adjustment
        if activity_level >= 1.725:
            activity_multiplier = 1.5
        elif activity_level >= 1.55:
            activity_multiplier = 1.3
        else:
            activity_multiplier = 1.0
        
        # Climate adjustment
        climate_multipliers = {
            "hot": 1.3,
            "moderate": 1.0,
            "cold": 0.9
        }
        
        total_water = base_water * activity_multiplier * climate_multipliers.get(climate, 1.0)
        
        return {
            "daily_water_liters": round(total_water, 2),
            "daily_water_glasses": round(total_water * 4, 0),  # Assuming 250ml per glass
            "pre_workout": "500ml 2 hours before",
            "during_workout": "150-250ml every 15-20 minutes",
            "post_workout": "500ml within 30 minutes",
            "tips": [
                "Start your day with 500ml of water",
                "Drink water 30 minutes before meals",
                "Monitor urine color (pale yellow = well hydrated)",
                "Increase intake on high-protein days"
            ]
        }
    
    @staticmethod
    def get_supplement_recommendations(plan: str, goals: List[str]) -> Dict:
        """
        Get personalized supplement recommendations
        
        Args:
            plan: Fitness plan (Cut, Bulk, Lean, Recomp)
            goals: List of fitness goals
        
        Returns:
            Supplement recommendations
        """
        supplements = {
            "essential": [],
            "optional": [],
            "timing": {}
        }
        
        # Essential supplements for all plans
        supplements["essential"] = [
            {
                "name": "Multivitamin",
                "reason": "Fill nutritional gaps",
                "dosage": "As per label",
                "timing": "Morning with breakfast"
            },
            {
                "name": "Omega-3",
                "reason": "Anti-inflammatory, heart health",
                "dosage": "1-2g daily",
                "timing": "With meals"
            }
        ]
        
        # Plan-specific supplements
        if plan == "Cut":
            supplements["optional"].append({
                "name": "Caffeine",
                "reason": "Boost metabolism and energy",
                "dosage": "100-200mg",
                "timing": "Pre-workout or morning"
            })
            supplements["optional"].append({
                "name": "Green Tea Extract",
                "reason": "Metabolism support",
                "dosage": "400-500mg",
                "timing": "Morning or pre-workout"
            })
        
        if plan in ["Bulk", "Lean"]:
            supplements["optional"].append({
                "name": "Creatine Monohydrate",
                "reason": "Strength and muscle gains",
                "dosage": "5g daily",
                "timing": "Post-workout or anytime"
            })
        
        if "muscle_gain" in goals or plan in ["Bulk", "Lean", "Recomp"]:
            supplements["optional"].append({
                "name": "BCAA",
                "reason": "Muscle recovery and protein synthesis",
                "dosage": "5-10g",
                "timing": "During or post-workout"
            })
        
        supplements["timing"] = {
            "morning": ["Multivitamin", "Omega-3"],
            "pre_workout": ["Caffeine", "BCAA"],
            "post_workout": ["Creatine", "BCAA", "Protein"],
            "evening": ["Omega-3", "Magnesium"]
        }
        
        return supplements
    
    @staticmethod
    def analyze_macro_balance(macros: Dict[str, int], plan: str, weight_kg: float) -> Dict:
        """
        Analyze macro balance and provide recommendations
        
        Args:
            macros: Current macros (protein, carbs, fat)
            plan: Fitness plan
            weight_kg: Body weight
        
        Returns:
            Analysis and recommendations
        """
        total_cals = (macros["protein"] * 4) + (macros["carbs"] * 4) + (macros["fat"] * 9)
        
        protein_pct = (macros["protein"] * 4 / total_cals) * 100
        carbs_pct = (macros["carbs"] * 4 / total_cals) * 100
        fat_pct = (macros["fat"] * 9 / total_cals) * 100
        
        protein_per_kg = macros["protein"] / weight_kg
        
        analysis = {
            "total_calories": int(total_cals),
            "macro_percentages": {
                "protein": round(protein_pct, 1),
                "carbs": round(carbs_pct, 1),
                "fat": round(fat_pct, 1)
            },
            "protein_per_kg": round(protein_per_kg, 2),
            "recommendations": [],
            "status": "optimal"
        }
        
        # Protein analysis
        if protein_per_kg < 1.6:
            analysis["recommendations"].append("⚠️ Protein intake is low. Aim for 1.6-2.2g per kg bodyweight.")
            analysis["status"] = "needs_improvement"
        elif protein_per_kg > 2.5:
            analysis["recommendations"].append("ℹ️ Very high protein intake. Ensure adequate hydration.")
        
        # Fat analysis
        if fat_pct < 20:
            analysis["recommendations"].append("⚠️ Fat intake is low. Minimum 20% recommended for hormone health.")
            analysis["status"] = "needs_improvement"
        elif fat_pct > 35:
            analysis["recommendations"].append("ℹ️ High fat intake. Ensure it fits your calorie goals.")
        
        # Plan-specific recommendations
        if plan == "Cut" and carbs_pct < 30:
            analysis["recommendations"].append("💡 Consider increasing carbs slightly for better workout performance.")
        
        if plan == "Bulk" and carbs_pct < 40:
            analysis["recommendations"].append("💡 Increase carbs for better muscle growth and recovery.")
        
        if len(analysis["recommendations"]) == 0:
            analysis["recommendations"].append("✅ Macro balance looks optimal for your plan!")
        
        return analysis
