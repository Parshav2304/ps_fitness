from google import genai
from google.genai import types
import os
import logging
from typing import Dict, Any, List, Optional
import json
import asyncio
import base64

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        self._configured = False

    def _ensure_configured(self):
        if self._configured:
            return
            
        if not self.api_key:
            logger.error("❌ GEMINI_API_KEY not found in environment variables")
            return
            
        try:
            self.client = genai.Client(api_key=self.api_key)
            self._configured = True
            logger.info("✅ Gemini API Configured Successfully")
        except Exception as e:
            logger.error(f"❌ Failed to configure Gemini: {e}")

    def is_available(self) -> bool:
        """Check if LLM is ready to use."""
        self._ensure_configured()
        return self.client is not None

    async def generate_response(self, user_message: str, context: Dict[str, Any], history: List[Dict[str, str]], image_data: Optional[str] = None) -> str:
        """
        Generate a response using Gemini with context-aware prompting.
        """
        self._ensure_configured()
        if not self.client:
            return "I apologize, but I'm having trouble connecting to my brain right now. Please try again later."
            
        try:
            # Construct system prompt
            system_prompt = self._build_system_prompt(context)
            
            prompt_parts = []
            prompt_parts.append(f"{system_prompt}\n\nUser History: {history}\n\nCurrent Request: {user_message}")
            
            # Handle Base64 image
            if image_data:
                try:
                    # Expecting format "data:image/jpeg;base64,/9j/4AAQ..."
                    if "," in image_data:
                        mime_type = image_data.split(';')[0].split(':')[1]
                        base64_str = image_data.split(',')[1]
                    else:
                        mime_type = "image/jpeg"
                        base64_str = image_data
                        
                    image_bytes = base64.b64decode(base64_str)
                    
                    import io
                    # Use types.Part for the new Gemini SDK version 
                    image_part = types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type,
                    )
                    prompt_parts.append(image_part)
                except Exception as e:
                    import traceback
                    err_msg = traceback.format_exc()
                    logger.error(f"Failed to process image data: {e}")
                    return f"DEBUG FATAL ERROR. Failed processing image. Details: {str(e)}\n\nTraceback:\n{err_msg}"
            
            # Content generation
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_parts
            )
            
            return response.text
        except Exception as e:
            logger.error(f"❌ LLM Generation Failed: {e}")
            return "I'm having a bit of a glitch. Could you ask that again?"

    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """
        Constructs a detailed system prompt for the AI Coach.
        """
        user = context 
        stats = context.get('stats', {})
        
        prompt = f"""
        You are 'PS AI Coach', an elite, encouraging, and data-driven fitness coach.
        You are speaking to {user.get('username', 'the user')}.
        
        **Your Personality & Capabilities:**
        - Energetic, motivating, and professional.
        - You use emojis occasionally but not excessively.
        - You focus on DATA-DRIVEN advice.
        - You NEVER judge; you only optimize.
        - YOU CAN SEE IMAGES. You have advanced computer vision. If the user provides an image of food, you MUST analyze it, identify the items, estimate the quantities, and provide nutritional macros. NEVER say you can't see an image if one is provided.

        **User Profile:**
        - Goal: {user.get('fitness_goal', 'General Fitness')}
        - Weight: {user.get('weight', 'N/A')}kg
        - Height: {user.get('height', 'N/A')}cm
        - Experience: {user.get('activity_level', 'Moderate')}

        **Recent User Stats (Last 7 Days):**
        - Avg Calories: {stats.get('avg_calories', 'N/A')} kcal
        - Weight Change: {stats.get('weight_change', '0')} kg
        - Workout Consistency: {stats.get('workout_count', '0')} workouts

        **Instructions:**
        - Answer the user's question directly.
        - Use the provided stats to give specific advice.
        - Keep responses concise (under 100 words) unless asked for a detailed plan or analyzing food.
        
        Now, respond to the user.
        """
        return prompt.strip()

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """
        Generate a structured JSON response from the LLM asynchronously.
        """
        self._ensure_configured()
        if not self.client:
            return None
            
        try:
            # Enforce JSON in prompt
            full_prompt = f"""
            {prompt}
            
            IMPORTANT: Return ONLY valid JSON. No markdown formatting, no explanations.
            """
            
            # content generation
            response = self.client.models.generate_content(
                model='gemini-flash-latest',
                contents=full_prompt
            )
            
            text = response.text.strip()
            
            # Clean markdown code blocks if present
            if text.startswith("```json"):
                text = text.replace("```json", "", 1).replace("```", "", 1).strip()
            elif text.startswith("```"):
                text = text.replace("```", "", 1).replace("```", "", 1).strip()
                
            return json.loads(text)
            
        except Exception as e:
            logger.error(f"Error generating JSON: {e}")
            return None
