"""
Prediction service - Orchestrates ML model and fitness agent
"""
from typing import Dict
from app.models.ml_model import get_model
from app.agents.fitness_agent import FitnessAgent
from app.schemas.schemas import UserInput, PredictionOutput, MacroNutrients
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    """Service for handling fitness predictions"""
    
    def __init__(self):
        self.ml_model = get_model()
        self.fitness_agent = FitnessAgent()
    
    def predict(self, user_input: UserInput) -> PredictionOutput:
        """
        Generate complete fitness prediction
        
        Args:
            user_input: User input data
        
        Returns:
            Complete prediction with plan, calories, macros, and recommendations
        """
        try:
            # Convert gender to numeric
            gender_numeric = 1 if user_input.gender.lower() == 'male' else 0
            
            # Calculate BMI
            bmi = self.fitness_agent.calculate_bmi(user_input.weight, user_input.height)
            bmi_category = self.fitness_agent.get_bmi_category(bmi)
            
            # Estimate body fat if not provided
            if user_input.body_fat is None:
                body_fat = self.fitness_agent.estimate_body_fat(
                    bmi, user_input.age, user_input.gender
                )
            else:
                body_fat = user_input.body_fat
            
            # Prepare features for ML model
            features = {
                'height': user_input.height,
                'weight': user_input.weight,
                'age': user_input.age,
                'gender': gender_numeric,
                'activity_level': user_input.activity_level,
                'body_fat': body_fat
            }
            
            # Get ML prediction
            plan = self.ml_model.predict(features)
            logger.info(f"ML Model predicted plan: {plan}")
            
            # Calculate BMR and TDEE
            bmr = self.fitness_agent.calculate_bmr_mifflin_st_jeor(
                user_input.weight,
                user_input.height,
                user_input.age,
                user_input.gender
            )
            
            tdee = self.fitness_agent.calculate_tdee(bmr, user_input.activity_level)
            
            # Adjust calories based on plan
            target_calories = self.fitness_agent.adjust_calories_for_plan(tdee, plan)
            
            # Calculate macros
            macros_dict = self.fitness_agent.calculate_macros(
                target_calories,
                user_input.weight,
                plan
            )
            
            macros = MacroNutrients(**macros_dict)
            
            # Get plan description
            plan_description = self.fitness_agent.get_plan_description(plan)
            
            # Generate recommendations
            recommendations = self.fitness_agent.get_recommendations(
                plan, bmi, body_fat, user_input.age, user_input.activity_level
            )
            
            # Build response
            prediction_output = PredictionOutput(
                plan=plan,
                bmi=bmi,
                bmi_category=bmi_category,
                body_fat_percentage=body_fat,
                bmr=bmr,
                tdee=tdee,
                target_calories=target_calories,
                macros=macros,
                plan_description=plan_description,
                recommendations=recommendations
            )
            
            logger.info(f"Prediction completed successfully for user")
            return prediction_output
        
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise
    
    def get_model_info(self) -> Dict:
        """Get information about the ML model"""
        return self.ml_model.get_model_info()
    
    def get_prediction_confidence(self, user_input: UserInput) -> Dict[str, float]:
        """Get prediction confidence scores for all plans"""
        try:
            gender_numeric = 1 if user_input.gender.lower() == 'male' else 0
            
            bmi = self.fitness_agent.calculate_bmi(user_input.weight, user_input.height)
            
            if user_input.body_fat is None:
                body_fat = self.fitness_agent.estimate_body_fat(
                    bmi, user_input.age, user_input.gender
                )
            else:
                body_fat = user_input.body_fat
            
            features = {
                'height': user_input.height,
                'weight': user_input.weight,
                'age': user_input.age,
                'gender': gender_numeric,
                'activity_level': user_input.activity_level,
                'body_fat': body_fat
            }
            
            return self.ml_model.predict_proba(features)
        
        except Exception as e:
            logger.error(f"Error getting prediction confidence: {str(e)}")
            return {}

# Global service instance
_service_instance = None

def get_prediction_service() -> PredictionService:
    """Get or create global prediction service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = PredictionService()
    return _service_instance