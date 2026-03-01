"""
AI Chatbot Service - Intelligent Conversational Coach
"""
from typing import Dict, List, Optional
from datetime import datetime
import random

from .llm_service import LLMService

class ChatbotService:
    """Intelligent AI fitness coach with context awareness and conversation memory"""
    
    def __init__(self):
        self.llm = LLMService()
        
        # Personality traits
        self.encouragements = [
            "You're doing great! 💪",
            "Keep crushing it! 🔥",
            "I'm proud of your progress! 🌟",
            "You're on the right track! ⚡",
            "Amazing dedication! 🎯"
        ]
        
        self.motivations = [
            "Remember, consistency beats perfection!",
            "Every small step counts towards your goal!",
            "You're stronger than you think!",
            "Progress, not perfection!",
            "Your future self will thank you!"
        ]
        
        # In-memory history cache (backed by DB ideally)
        self.conversation_history = {}
    
    async def process_message(
        self, 
        message: str, 
        user_id: str,
        user_context: Optional[Dict] = None,
        conversation_history: List[Dict] = [],
        image_data: Optional[str] = None
    ) -> str:
        """
        Generate intelligent, context-aware response
        
        Args:
            message: User's question
            user_id: User identifier
            user_context: User fitness data
            conversation_history: List of previous messages [{'role': 'user'|'assistant', 'content': str}]
            image_data: Optional base64 encoded image
        
        Returns:
            Personalized response string
        """
        # 1. Try LLM (Gemini) First
        if self.llm.is_available():
            return await self.llm.generate_response(message, user_context or {}, conversation_history, image_data)

        # 2. Fallback to Rule-Based System
        return self._generate_response(message, user_id, user_context or {}, conversation_history)

    def _generate_response(self, message: str, user_id: str, user_context: Dict, history: List[Dict]) -> str:
        """Generate intelligent response based on context"""
        message_lower = message.lower()
        
        # Extract user data
        name = user_context.get('username', 'friend')
        weight = user_context.get('weight')
        height = user_context.get('height')
        goal = user_context.get('fitness_goal', 'general_fitness')
        age = user_context.get('age')
        stats = user_context.get('stats', {})
        
        # Check conversation history for context (last 5 messages)
        recent_history = history[-5:] if history else []
        is_first_message = len(history) == 0
        
        # Greeting
        if any(word in message_lower for word in ['hi', 'hello', 'hey']) and is_first_message:
            return self._personalized_greeting(name, goal)
        
        # Protein questions
        if any(word in message_lower for word in ['protein', 'how much protein']):
            return self._protein_advice(weight, goal)
        
        # Calorie questions
        if any(word in message_lower for word in ['calories', 'calorie', 'tdee', 'bmr', 'eat']):
            return self._calorie_advice(weight, height, age, goal)
        
        # Weight loss (Context Aware)
        if any(word in message_lower for word in ['lose weight', 'weight loss', 'fat loss', 'cut', 'not losing', 'plateau', 'stuck']):
            return self._weight_loss_advice(weight, goal, stats)
        
        # Muscle gain
        if any(word in message_lower for word in ['gain muscle', 'muscle gain', 'bulk', 'build muscle']):
            return self._muscle_gain_advice(weight, goal)
        
        # Workout questions
        if any(word in message_lower for word in ['workout', 'exercise', 'training', 'gym']):
            return self._workout_advice(goal)
        
        # Progress/motivation
        if any(word in message_lower for word in ['progress', 'motivation']):
            return self._motivation_response(name)
        
        # Plan explanation
        if any(word in message_lower for word in ['plan', 'cut', 'bulk', 'lean', 'recomp']):
            return self._plan_explanation(goal)
        
        # General fitness question
        return self._general_response(name)
    
    def _personalized_greeting(self, name: str, goal: str) -> str:
        """Personalized greeting based on user data"""
        goal_map = {
            'weight_loss': 'weight loss',
            'muscle_gain': 'muscle building',
            'maintain': 'maintaining your fitness',
            'general_fitness': 'general fitness'
        }
        goal_text = goal_map.get(goal, 'fitness')
        
        return (
            f"Hey {name}! 👋 Great to see you!\n\n"
            f"I'm your AI fitness coach, and I'm here to help you with your {goal_text} journey. "
            f"I can provide personalized advice on:\n\n"
            f"• Nutrition and calorie planning\n"
            f"• Workout recommendations\n"
            f"• Progress tracking tips\n"
            f"• Motivation and accountability\n\n"
            f"What would you like to know today?"
        )
    
    def _protein_advice(self, weight: Optional[float], goal: str) -> str:
        """Personalized protein recommendations"""
        if not weight:
            return (
                "Protein is crucial for muscle building and recovery!\n\n"
                "General recommendations:\n"
                "• Muscle building: 2.0-2.2g per kg bodyweight\n"
                "• Fat loss: 2.2-2.4g per kg (helps preserve muscle)\n"
                "• Maintenance: 1.6-2.0g per kg\n\n"
                "💡 Tip: Update your profile with your weight for personalized recommendations!"
            )
        
        # Calculate personalized protein
        protein_ranges = {
            'weight_loss': (2.2, 2.4),
            'muscle_gain': (2.0, 2.2),
            'maintain': (1.8, 2.0),
            'general_fitness': (1.6, 2.0)
        }
        
        min_protein, max_protein = protein_ranges.get(goal, (1.8, 2.0))
        protein_low = int(weight * min_protein)
        protein_high = int(weight * max_protein)
        
        goal_text = {
            'weight_loss': 'fat loss (higher protein helps preserve muscle)',
            'muscle_gain': 'muscle building',
            'maintain': 'maintenance',
            'general_fitness': 'general fitness'
        }.get(goal, 'your goal')
        
        return (
            f"Based on your weight of **{weight}kg** and your goal of {goal_text}, "
            f"I recommend:\n\n"
            f"🎯 **{protein_low}-{protein_high}g protein per day**\n\n"
            f"Here's how to hit that:\n"
            f"• Breakfast: 30-40g (eggs, Greek yogurt, protein shake)\n"
            f"• Lunch: 40-50g (chicken, fish, tofu)\n"
            f"• Dinner: 40-50g (lean meat, legumes)\n"
            f"• Snacks: 20-30g (protein bars, nuts)\n\n"
            f"💡 Pro tip: Spread protein across 4-5 meals for optimal muscle protein synthesis!\n\n"
            f"{random.choice(self.encouragements)}"
        )
    
    def _calorie_advice(self, weight: Optional[float], height: Optional[float], age: Optional[int], goal: str) -> str:
        """Personalized calorie recommendations"""
        if not weight or not height or not age:
            return (
                "I'd love to give you personalized calorie recommendations! 📊\n\n"
                "To calculate your exact needs, I need:\n"
                "• Your weight\n"
                "• Your height\n"
                "• Your age\n\n"
                "Click 'Edit Profile' on the dashboard to update your info, "
                "then ask me again! 😊"
            )
        
        # Calculate BMR (Mifflin-St Jeor)
        bmr = 10 * weight + 6.25 * height - 5 * age + 5  # Male formula (simplified)
        tdee = bmr * 1.55  # Moderate activity
        
        # Adjust for goal
        calorie_adjustments = {
            'weight_loss': -500,
            'muscle_gain': 400,
            'maintain': 0,
            'general_fitness': 0
        }
        
        adjustment = calorie_adjustments.get(goal, 0)
        target_calories = int(tdee + adjustment)
        
        goal_descriptions = {
            'weight_loss': 'fat loss (500 calorie deficit)',
            'muscle_gain': 'muscle building (400 calorie surplus)',
            'maintain': 'maintenance',
            'general_fitness': 'general fitness'
        }
        
        return (
            f"Here's your personalized calorie plan! 📊\n\n"
            f"**Your Stats:**\n"
            f"• BMR (calories at rest): ~{int(bmr)} kcal\n"
            f"• TDEE (with activity): ~{int(tdee)} kcal\n\n"
            f"**For {goal_descriptions.get(goal, 'your goal')}:**\n"
            f"🎯 **Target: {target_calories} calories/day**\n\n"
            f"**Macro Breakdown:**\n"
            f"• Protein: {int(weight * 2.0)}g ({int(weight * 2.0 * 4)} kcal)\n"
            f"• Fats: {int(target_calories * 0.25 / 9)}g ({int(target_calories * 0.25)} kcal)\n"
            f"• Carbs: {int((target_calories - weight * 2.0 * 4 - target_calories * 0.25) / 4)}g\n\n"
            f"💡 Track your food intake to stay on target!\n\n"
            f"{random.choice(self.motivations)}"
        )
    
    def _weight_loss_advice(self, weight: Optional[float], goal: str, stats: Dict = {}) -> str:
        """Weight loss strategy with data context"""
        protein_target = f"{int(weight * 2.2)}g" if weight else "2.2g per kg bodyweight"
        
        # Analyze available data
        avg_cals = stats.get('avg_daily_calories', 0)
        weight_change = stats.get('weight_change_30d', 0)
        has_data = avg_cals > 0
        
        intro = f"Let's create an effective fat loss strategy! 🔥\n\n"
        
        # Data-driven insight
        insight = ""
        if has_data:
            insight = f"**📊 Your Monthly Analysis:**\n"
            if weight_change < 0:
                insight += f"• Great job! You've lost {abs(weight_change)}kg in the last 30 days! 🎉\n"
            elif weight_change > 0:
                insight += f"• You've gained {weight_change}kg recently.\n"
            else:
                 insight += f"• Your weight has been stable.\n"
                 
            insight += f"• 7-Day Average: {avg_cals} calories/day\n\n"
            
            if weight_change >= 0 and avg_cals > 0:
                 insight += f"💡 **Coach's Insight:** It looks like you might be in a slight surplus. Try reducing your daily average by 300 calories to break the plateau.\n\n"
        
        return (
            f"{intro}"
            f"{insight}"
            f"**The Fundamentals:**\n\n"
            f"1️⃣ **Calorie Deficit**\n"
            f"   • Aim for 500 kcal below your TDEE\n"
            f"   • Lose ~0.5kg per week (sustainable!)\n\n"
            f"2️⃣ **High Protein** ({protein_target})\n"
            f"   • Preserves muscle during deficit\n"
            f"   • Keeps you feeling full\n\n"
            f"3️⃣ **Consistency**\n"
            f"   • Track every meal (even snacks!)\n"
            f"   • Weigh daily, take average weekly\n\n"
            f"You've got this! Slow and steady wins. 🐢💨"
        )
    
    def _muscle_gain_advice(self, weight: Optional[float], goal: str) -> str:
        """Muscle building strategy"""
        protein_target = f"{int(weight * 2.0)}g" if weight else "2.0g per kg bodyweight"
        
        return (
            f"Let's build some serious muscle! 💪\n\n"
            f"**The Muscle Building Blueprint:**\n\n"
            f"1️⃣ **Calorie Surplus**\n"
            f"   • 300-500 kcal above TDEE\n"
            f"   • Gain ~0.25-0.5kg per week\n\n"
            f"2️⃣ **Protein** ({protein_target})\n"
            f"   • Spread across 4-5 meals\n"
            f"   • Essential for muscle repair\n\n"
            f"3️⃣ **Progressive Overload**\n"
            f"   • Gradually increase weight/reps\n"
            f"   • Track every workout\n\n"
            f"4️⃣ **Training Split**\n"
            f"   • 4-6 sessions per week\n"
            f"   • Focus on compound movements\n"
            f"   • 6-12 reps for hypertrophy\n\n"
            f"5️⃣ **Recovery**\n"
            f"   • 7-9 hours of sleep\n"
            f"   • Rest days are crucial\n\n"
            f"6️⃣ **Patience**\n"
            f"   • Muscle takes time to build\n"
            f"   • Track progress monthly\n\n"
            f"You've got this! 🔥\n\n"
            f"{random.choice(self.motivations)}"
        )
    
    def _workout_advice(self, goal: str) -> str:
        """Workout recommendations"""
        return (
            f"Here's your workout strategy! 🏋️\n\n"
            f"**For Your Goal:**\n\n"
            f"• Click 'Generate Workout' on the dashboard\n"
            f"• Select your training location (Gym/Home)\n"
            f"• Choose your training frequency\n\n"
            f"I'll create a personalized plan with:\n"
            f"✓ Progressive exercises\n"
            f"✓ Proper volume and intensity\n"
            f"✓ Recovery built in\n\n"
            f"**General Tips:**\n"
            f"• Warm up for 5-10 minutes\n"
            f"• Focus on form over weight\n"
            f"• Rest 2-3 minutes between sets\n"
            f"• Cool down and stretch\n\n"
            f"Need help with a specific exercise? Just ask! 💪"
        )
    
    def _motivation_response(self, name: str) -> str:
        """Motivational response"""
        return (
            f"Hey {name}, I see you need some motivation! 🌟\n\n"
            f"Remember:\n"
            f"• You didn't come this far to only come this far\n"
            f"• Every workout counts, even the hard ones\n"
            f"• Progress isn't always linear - trust the process\n"
            f"• You're building habits that will last a lifetime\n\n"
            f"**Plateaus are normal!** Here's what to do:\n"
            f"1. Review your calorie intake\n"
            f"2. Increase training intensity\n"
            f"3. Ensure adequate sleep\n"
            f"4. Manage stress levels\n"
            f"5. Stay consistent for 2-3 more weeks\n\n"
            f"{random.choice(self.encouragements)}\n"
            f"{random.choice(self.motivations)}"
        )
    
    def _plan_explanation(self, goal: str) -> str:
        """Explain fitness plans"""
        return (
            f"Let me explain the four main fitness plans! 📋\n\n"
            f"**✂️ CUT** (Fat Loss)\n"
            f"• Calorie deficit: -500 kcal\n"
            f"• High protein (2.2g/kg)\n"
            f"• Strength + cardio\n"
            f"• Goal: Lose fat, keep muscle\n\n"
            f"**💪 BULK** (Muscle Gain)\n"
            f"• Calorie surplus: +400 kcal\n"
            f"• Moderate protein (2.0g/kg)\n"
            f"• Heavy lifting focus\n"
            f"• Goal: Maximum muscle growth\n\n"
            f"**🎯 LEAN** (Lean Muscle)\n"
            f"• Small surplus: +150 kcal\n"
            f"• High protein (2.1g/kg)\n"
            f"• Balanced training\n"
            f"• Goal: Slow muscle gain, minimal fat\n\n"
            f"**🔄 RECOMP** (Body Recomposition)\n"
            f"• Maintenance calories\n"
            f"• Very high protein (2.2g/kg)\n"
            f"• Strength focus\n"
            f"• Goal: Lose fat + build muscle simultaneously\n\n"
            f"Which one matches your goal? 🤔"
        )
    
    def _general_response(self, name: str) -> str:
        """General helpful response"""
        return (
            f"I'm here to help, {name}! 😊\n\n"
            f"I can assist you with:\n\n"
            f"💪 **Training**\n"
            f"• Workout plans and exercises\n"
            f"• Form tips and techniques\n"
            f"• Progressive overload strategies\n\n"
            f"🍎 **Nutrition**\n"
            f"• Calorie and macro calculations\n"
            f"• Meal planning and timing\n"
            f"• Supplement advice\n\n"
            f"📊 **Progress**\n"
            f"• Tracking methods\n"
            f"• Plateau solutions\n"
            f"• Goal setting\n\n"
            f"What specific topic can I help you with today?"
        )
    
    def get_conversation_history(self, user_id: str) -> List[Dict]:
        """Get conversation history for a user"""
        return self.conversation_history.get(user_id, [])
    
    def clear_history(self, user_id: str):
        """Clear conversation history for a user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]
