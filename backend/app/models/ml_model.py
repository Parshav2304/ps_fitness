"""
ML Model loader and prediction
"""
import joblib
import numpy as np
import os
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class FitnessMLModel:
    """Wrapper for the trained ML model"""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize and load the model"""
        if model_path is None:
            # Default path relative to this file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, '..', '..', 'models', 'plan_predictor.pkl')
        
        self.model_path = model_path
        self.model = None
        self.is_loaded = False
        
        self.load_model()
    
    def load_model(self):
        """Load the trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.is_loaded = True
                logger.info(f"Model loaded successfully from {self.model_path}")
            else:
                logger.warning(f"Model file not found at {self.model_path}")
                logger.warning("Please train the model first using backend/ml/train_model.py")
                self.is_loaded = False
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.is_loaded = False
    
    def predict(self, features: Dict[str, float]) -> str:
        """
        Make a prediction using the loaded model
        
        Args:
            features: Dictionary containing:
                - height: Height in cm
                - weight: Weight in kg
                - age: Age in years
                - gender: Gender (0=female, 1=male)
                - activity_level: Activity multiplier (1.2-1.9)
                - body_fat: Body fat percentage
        
        Returns:
            Predicted fitness plan (Cut, Bulk, Lean, or Recomp)
        """
        if not self.is_loaded:
            logger.error("Model is not loaded. Cannot make prediction.")
            # Fallback to rule-based prediction
            return self._fallback_prediction(features)
        
        try:
            # Prepare features in the correct order
            X = np.array([[
                features['height'],
                features['weight'],
                features['age'],
                features['gender'],
                features['activity_level'],
                features['body_fat']
            ]])
            
            # Make prediction
            prediction = self.model.predict(X)[0]
            logger.info(f"Prediction made successfully: {prediction}")
            
            return prediction
        
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            return self._fallback_prediction(features)
    
    def predict_proba(self, features: Dict[str, float]) -> Dict[str, float]:
        """
        Get probability distribution for all classes
        
        Returns:
            Dictionary mapping plan names to probabilities
        """
        if not self.is_loaded:
            logger.error("Model is not loaded. Cannot get probabilities.")
            return {}
        
        try:
            X = np.array([[
                features['height'],
                features['weight'],
                features['age'],
                features['gender'],
                features['activity_level'],
                features['body_fat']
            ]])
            
            probabilities = self.model.predict_proba(X)[0]
            classes = self.model.classes_
            
            return dict(zip(classes, probabilities))
        
        except Exception as e:
            logger.error(f"Error getting probabilities: {str(e)}")
            return {}
    
    def _fallback_prediction(self, features: Dict[str, float]) -> str:
        """
        Rule-based fallback prediction when ML model is not available
        """
        logger.info("Using fallback rule-based prediction")
        
        # Calculate BMI
        height_m = features['height'] / 100
        bmi = features['weight'] / (height_m ** 2)
        body_fat = features['body_fat']
        gender = features['gender']
        activity_level = features['activity_level']
        
        # Simple rule-based logic
        if gender == 1:  # Male
            high_bf = body_fat >= 20
            low_bf = body_fat < 12
        else:  # Female
            high_bf = body_fat >= 30
            low_bf = body_fat < 20
        
        # Decision logic
        if bmi >= 30 or high_bf:
            return 'Cut'
        elif bmi < 18.5 or low_bf:
            return 'Bulk'
        elif 18.5 <= bmi < 25 and not high_bf:
            if activity_level >= 1.55:
                return 'Lean'
            else:
                return 'Recomp'
        elif 25 <= bmi < 30:
            return 'Recomp'
        else:
            return 'Lean'
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if not self.is_loaded:
            return {
                "loaded": False,
                "model_path": self.model_path,
                "message": "Model not loaded"
            }
        
        try:
            return {
                "loaded": True,
                "model_path": self.model_path,
                "model_type": type(self.model).__name__,
                "n_features": self.model.n_features_in_ if hasattr(self.model, 'n_features_in_') else None,
                "classes": self.model.classes_.tolist() if hasattr(self.model, 'classes_') else None
            }
        except Exception as e:
            return {
                "loaded": True,
                "model_path": self.model_path,
                "error": str(e)
            }

# Global model instance
_model_instance = None

def get_model() -> FitnessMLModel:
    """Get or create global model instance"""
    global _model_instance
    if _model_instance is None:
        _model_instance = FitnessMLModel()
    return _model_instance