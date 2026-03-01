"""
Fitness Agent - Rule-based calculations for nutrition and body metrics
"""
from typing import Dict, Tuple, List
import math

class FitnessAgent:
    """Agent for fitness-related calculations"""
    
    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        """
        Calculate Body Mass Index
        BMI = weight(kg) / height(m)^2
        """
        height_m = height_cm / 100
        bmi = weight_kg / (height_m ** 2)
        return round(bmi, 2)
    
    @staticmethod
    def get_bmi_category(bmi: float) -> str:
        """Get BMI category"""
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"
    
    @staticmethod
    def estimate_body_fat(bmi: float, age: int, gender: str) -> float:
        """
        Estimate body fat percentage using Deurenberg formula
        """
        gender_value = 1 if gender.lower() == 'male' else 0
        body_fat = (1.20 * bmi) + (0.23 * age) - (10.8 * gender_value) - 5.4
        
        # Clamp to realistic values
        body_fat = max(5.0, min(50.0, body_fat))
        return round(body_fat, 2)
    
    @staticmethod
    def calculate_bmr_mifflin_st_jeor(weight_kg: float, height_cm: float, 
                                      age: int, gender: str) -> float:
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
        More accurate than Harris-Benedict
        
        Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
        Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
        """
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
        
        if gender.lower() == 'male':
            bmr += 5
        else:
            bmr -= 161
        
        return round(bmr, 2)
    
    @staticmethod
    def calculate_tdee(bmr: float, activity_level: float) -> float:
        """
        Calculate Total Daily Energy Expenditure
        TDEE = BMR × Activity Factor
        """
        tdee = bmr * activity_level
        return round(tdee, 2)
    
    @staticmethod
    def adjust_calories_for_plan(tdee: float, plan: str) -> int:
        """
        Adjust calorie intake based on fitness plan
        
        Cut: -500 kcal (lose ~0.5 kg/week)
        Bulk: +400 kcal (gain ~0.35 kg/week)
        Lean: +150 kcal (slow gain, minimize fat)
        Recomp: +0 kcal (maintain, body recomposition)
        """
        adjustments = {
            'Cut': -500,
            'Bulk': 400,
            'Lean': 150,
            'Recomp': 0
        }
        
        calories = tdee + adjustments.get(plan, 0)
        return int(calories)
    
    @staticmethod
    def calculate_macros(calories: int, weight_kg: float, plan: str) -> Dict[str, int]:
        """
        Calculate macronutrient distribution
        
        Protein: 2.0-2.2 g/kg bodyweight (muscle building/preservation)
        Fat: 20-30% of calories (hormone production)
        Carbs: Remaining calories (energy)
        """
        # Protein target based on plan
        protein_multipliers = {
            'Cut': 2.2,      # Higher protein during deficit
            'Bulk': 2.0,     # Sufficient for growth
            'Lean': 2.1,     # Moderate-high
            'Recomp': 2.2    # High for body recomp
        }
        
        protein_g_per_kg = protein_multipliers.get(plan, 2.0)
        protein_g = round(weight_kg * protein_g_per_kg)
        protein_kcal = protein_g * 4
        
        # Fat percentage based on plan
        fat_percentages = {
            'Cut': 0.25,     # 25% for satiety
            'Bulk': 0.25,    # 25% balanced
            'Lean': 0.25,    # 25% balanced
            'Recomp': 0.30   # 30% higher fat for hormones
        }
        
        fat_pct = fat_percentages.get(plan, 0.25)
        fat_kcal = int(calories * fat_pct)
        fat_g = round(fat_kcal / 9)
        
        # Carbs fill the rest
        carbs_kcal = calories - (protein_kcal + fat_kcal)
        carbs_g = round(carbs_kcal / 4)
        
        return {
            'protein': protein_g,
            'carbs': max(carbs_g, 0),  # Ensure non-negative
            'fat': fat_g
        }
    
    @staticmethod
    def get_plan_description(plan: str) -> str:
        """Get detailed plan description"""
        descriptions = {
            'Cut': "Focus on fat loss while preserving muscle mass. Maintain a moderate caloric deficit with high protein intake and strength training.",
            'Bulk': "Build muscle mass and strength. Controlled caloric surplus with emphasis on progressive overload and adequate protein intake.",
            'Lean': "Slow, controlled muscle gain with minimal fat gain. Small caloric surplus for steady progress without excessive fat accumulation.",
            'Recomp': "Body recomposition - simultaneously lose fat and build muscle. Maintain calories at maintenance level with optimal protein and training."
        }
        return descriptions.get(plan, "Balanced approach to fitness and nutrition.")
    
    @staticmethod
    def get_recommendations(plan: str, bmi: float, body_fat: float, 
                           age: int, activity_level: float) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Plan-specific recommendations
        plan_recs = {
            'Cut': [
                "Prioritize protein (2.2g/kg) to preserve muscle during deficit",
                "Include 2-3 strength training sessions per week",
                "Stay hydrated - drink at least 3L of water daily",
                "Consider adding 2-3 cardio sessions for additional calorie burn"
            ],
            'Bulk': [
                "Focus on progressive overload - increase weights gradually",
                "Eat protein-rich meals every 3-4 hours",
                "Get 7-9 hours of quality sleep for recovery",
                "Track your lifts to ensure consistent progression"
            ],
            'Lean': [
                "Follow a structured strength training program (4-5 days/week)",
                "Time your carbs around workouts for optimal performance",
                "Be patient - lean gains take time (0.25-0.5kg/month)",
                "Monitor weekly progress with photos and measurements"
            ],
            'Recomp': [
                "Maintain high protein intake (2.2g/kg bodyweight)",
                "Focus on compound movements (squats, deadlifts, bench press)",
                "Be consistent - recomp requires patience (3-6 months)",
                "Consider calorie cycling - higher on training days"
            ]
        }
        
        recommendations.extend(plan_recs.get(plan, []))
        
        # Age-specific
        if age > 40:
            recommendations.append("Include mobility work and warm-ups to prevent injury")
            recommendations.append("Consider omega-3 supplementation for joint health")
        
        # Activity level specific
        if activity_level < 1.4:
            recommendations.append("Increase daily activity - aim for 8,000-10,000 steps")
        
        # BMI-specific
        if bmi < 18.5:
            recommendations.append("Consult with healthcare provider about healthy weight gain")
        elif bmi > 30:
            recommendations.append("Consider consulting with a nutritionist for personalized guidance")
        
        # Body fat specific
        if body_fat > 25 and plan != 'Cut':
            recommendations.append("Monitor body composition with regular measurements")
        
        # General recommendations
        recommendations.extend([
            "Stay consistent with your nutrition and training",
            "Take progress photos weekly for visual tracking",
            "Consider working with a coach for personalized programming"
        ])
        
        return recommendations[:8]  # Return top 8 recommendations
    
    @staticmethod
    def validate_metrics(height: float, weight: float, age: int) -> Tuple[bool, str]:
        """Validate input metrics"""
        if not (100 <= height <= 250):
            return False, "Height must be between 100-250 cm"
        
        if not (30 <= weight <= 300):
            return False, "Weight must be between 30-300 kg"
        
        if not (10 <= age <= 120):
            return False, "Age must be between 10-120 years"
        
        return True, "Valid"