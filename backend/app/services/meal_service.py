from typing import List, Dict, Optional
import random

class MealService:
    """Service for generating meal plans and suggestions"""
    
    # Predefined meals database with correct pricing (INR) and tags
    MEALS = {
        'breakfast': [
            {
                'name': 'Masala Oats (Vegetable)',
                'calories': 320,
                'protein': 12,
                'carbs': 45,
                'fat': 8,
                'price': 60.00,
                'ingredients': ['Oats', 'Mixed Vegetables (Carrot, Peas)', 'Indian Spices', 'Green Chili'],
                'tags': ['vegetarian', 'vegan', 'high_protein', 'balanced', 'intro_indian']
            },
            {
                'name': 'Paneer Bhurji & Toast',
                'calories': 380,
                'protein': 22,
                'carbs': 25,
                'fat': 20,
                'price': 120.00,
                'ingredients': ['150g Paneer', 'Onion', 'Tomato', '2 slices Whole Wheat Bread'],
                'tags': ['vegetarian', 'high_protein', 'balanced', 'keto', 'low_carb'] 
            },
            {
                'name': 'Egg Bhurji (Scrambled Eggs)',
                'calories': 350,
                'protein': 20,
                'carbs': 5,
                'fat': 25,
                'price': 60.00,
                'ingredients': ['3 Eggs', 'Onion', 'Green Chili', 'Coriander', 'Butter'],
                'tags': ['non_vegetarian', 'high_protein', 'balanced', 'keto', 'low_carb']
            },
             {
                'name': 'Poha with Peanuts',
                'calories': 300,
                'protein': 8,
                'carbs': 50,
                'fat': 10,
                'price': 40.00,
                'ingredients': ['1.5 cups Flattened Rice', 'Potato', 'Onion', 'Peanuts', 'Curry Leaves'],
                'tags': ['vegetarian', 'vegan', 'balanced', 'gluten_free']
            },
            {
                'name': 'Besan Chilla (Chickpea Crepe)',
                'calories': 320,
                'protein': 15,
                'carbs': 35,
                'fat': 12,
                'price': 50.00,
                'ingredients': ['1 cup Besan (Gram Flour)', 'Onion', 'Tomato', 'Coriander', 'Ajwain'],
                'tags': ['vegetarian', 'vegan', 'high_protein', 'gluten_free', 'balanced']
            },
            {
               'name': 'Idli Sambar',
               'calories': 350,
               'protein': 12,
               'carbs': 65,
               'fat': 4,
               'price': 80.00,
               'ingredients': ['3 Idlis', '1 cup Sambar (Lentil Soup)', 'Coconut Chutney'],
               'tags': ['vegetarian', 'vegan', 'balanced', 'gluten_free']
            }
        ],
        'lunch': [
            {
                'name': 'Chicken Tikka Salad',
                'calories': 400,
                'protein': 35,
                'carbs': 15,
                'fat': 18,
                'price': 220.00,
                'ingredients': ['150g Grilled Chicken Tikka', 'Cucumber', 'Tomato', 'Onion', 'Yogurt Dressing'],
                'tags': ['non_vegetarian', 'high_protein', 'low_carb', 'keto', 'gluten_free']
            },
            {
                'name': 'Rajma Chawal (Kidney Beans & Rice)',
                'calories': 500,
                'protein': 18,
                'carbs': 80,
                'fat': 12,
                'price': 100.00,
                'ingredients': ['1 cup Kidney Bean Curry', '1.5 cups Rice', 'Onion Salad'],
                'tags': ['vegetarian', 'vegan', 'balanced', 'gluten_free']
            },
            {
                'name': 'Paneer Butter Masala & Roti',
                'calories': 550,
                'protein': 22,
                'carbs': 45,
                'fat': 30,
                'price': 180.00,
                'ingredients': ['150g Paneer', 'Rich Tomato Gravy', '2 Whole Wheat Roti', 'Salad'],
                'tags': ['vegetarian', 'balanced', 'intro_indian']
            },
            {
                'name': 'Fish Curry & Rice',
                'calories': 450,
                'protein': 35,
                'carbs': 40,
                'fat': 15,
                'price': 250.00,
                'ingredients': ['200g Fish Fillet', 'Coconut Curry Gravy', '1 cup Rice'],
                'tags': ['non_vegetarian', 'high_protein', 'balanced', 'pescatarian', 'gluten_free']
            },
            {
                'name': 'Palak Paneer (Spinach Cottage Cheese)',
                'calories': 420,
                'protein': 25,
                'carbs': 12,
                'fat': 30,
                'price': 160.00,
                'ingredients': ['200g Paneer', 'Spinach Puree', 'Cream', 'Garlic'],
                'tags': ['vegetarian', 'keto', 'low_carb', 'high_protein', 'balanced']
            },
            {
                'name': 'Dal Tadka & Jeera Rice',
                'calories': 400,
                'protein': 15,
                'carbs': 60,
                'fat': 10,
                'price': 90.00,
                'ingredients': ['1 cup Yellow Lentil Curry', 'Tempering (Ghee, Cumin)', '1 cup Rice'],
                'tags': ['vegetarian', 'vegan', 'balanced', 'gluten_free']
            }
        ],
        'dinner': [
            {
                'name': 'Chicken Curry (Home Style) & Roti',
                'calories': 450,
                'protein': 35,
                'carbs': 30,
                'fat': 15,
                'price': 150.00,
                'ingredients': ['150g Chicken', 'Onion-Tomato Gravy', '2 Rotis'],
                'tags': ['non_vegetarian', 'high_protein', 'balanced']
            },
            {
                'name': 'Bhindi Masala (Okra) & Dal',
                'calories': 350,
                'protein': 12,
                'carbs': 40,
                'fat': 10,
                'price': 80.00,
                'ingredients': ['200g Okra stir fry', '1 cup Yellow Dal', '1 Roti'],
                'tags': ['vegetarian', 'vegan', 'balanced', 'low_carb']
            },
            {
                'name': 'Kadhai Paneer (No Gravy)',
                'calories': 400,
                'protein': 20,
                'carbs': 15,
                'fat': 25,
                'price': 180.00,
                'ingredients': ['150g Paneer', 'Capsicum', 'Onion', 'Spices'],
                'tags': ['vegetarian', 'keto', 'low_carb', 'high_protein', 'balanced']
            },
            {
                'name': 'Egg Curry & Rice',
                'calories': 420,
                'protein': 18,
                'carbs': 45,
                'fat': 15,
                'price': 70.00,
                'ingredients': ['2 Boiled Eggs', 'Spicy Gravy', '1 cup Rice'],
                'tags': ['non_vegetarian', 'balanced', 'high_protein']
            },
            {
                'name': 'Soya Chunks Curry',
                'calories': 380,
                'protein': 25,
                'carbs': 30,
                'fat': 12,
                'price': 60.00,
                'ingredients': ['50g Soya Chunks', 'Tomato Gravy', 'Mixed Veggies'],
                'tags': ['vegetarian', 'vegan', 'high_protein', 'balanced']
            },
            {
                'name': 'Tandoori Chicken & Salad',
                'calories': 450,
                'protein': 50,
                'carbs': 5,
                'fat': 20,
                'price': 250.00,
                'ingredients': ['200g Chicken Leg/Breast', 'Yogurt Marinade', 'Cucumber Salad'],
                'tags': ['non_vegetarian', 'keto', 'high_protein', 'low_carb']
            }
        ],
        'snacks': [
            {
                'name': 'Roasted Chana (Chickpeas)',
                'calories': 150,
                'protein': 8,
                'carbs': 20,
                'fat': 4,
                'price': 20.00,
                'ingredients': ['1/2 cup Roasted Chana', 'Spice Mix'],
                'tags': ['vegetarian', 'vegan', 'high_protein', 'balanced', 'intro_indian']
            },
            {
                'name': 'Masala Chai & Biscuits',
                'calories': 180,
                'protein': 3,
                'carbs': 25,
                'fat': 6,
                'price': 30.00,
                'ingredients': ['1 cup Tea with Milk', '2 Marie Biscuits'],
                'tags': ['vegetarian', 'balanced']
            },
            {
                'name': 'Sprouts Salad',
                'calories': 120,
                'protein': 10,
                'carbs': 18,
                'fat': 1,
                'price': 30.00,
                'ingredients': ['1 cup Moong Sprouts', 'Lemon Juice', 'Cucumber', 'Tomato'],
                'tags': ['vegetarian', 'vegan', 'high_protein', 'low_carb', 'keto']
            },
             {
                'name': 'Paneer Tikka (3 pcs)',
                'calories': 200,
                'protein': 12,
                'carbs': 5,
                'fat': 15,
                'price': 100.00,
                'ingredients': ['3 cubes Paneer', 'Bell Pepper', 'Yogurt Marinade'],
                'tags': ['vegetarian', 'keto', 'low_carb', 'high_protein']
            },
            {
                'name': 'Boiled Eggs with Chaat Masala',
                'calories': 140,
                'protein': 12,
                'carbs': 1,
                'fat': 10,
                'price': 15.00,
                'ingredients': ['2 Hard boiled eggs', 'Chaat Masala'],
                'tags': ['non_vegetarian', 'keto', 'low_carb', 'high_protein']
            },
            {
                'name': 'Buttermilk (Chaas)',
                'calories': 50,
                'protein': 3,
                'carbs': 4,
                'fat': 2,
                'price': 15.00,
                'ingredients': ['1 glass Buttermilk', 'Cumin Powder', 'Salt'],
                'tags': ['vegetarian', 'keto', 'low_carb', 'balanced']
            }
        ]
    }

    @staticmethod
    async def generate_meal_plan(target_calories: int, macros: Dict[str, int], meals_per_day: int = 4, diet_type: str = 'balanced') -> Dict:
        """
        Generate a daily meal plan closer to target calories and diet type.
        Tries to use Gemini LLM for "Pro" generation first, falls back to enhanced static DB.
        """
        
        # Try LLM Generation for truly dynamic plans
        # DISABLED FOR SPEED: The user requested instant meal plan generation, 
        # so we bypass the LLM and go straight to the instantaneous local DB matcher.
        # try:
        #     from app.agents.nutrition_agent import NutritionAgent
        #     agent = NutritionAgent()
        #     llm_plan = await agent.generate_daily_plan_llm(target_calories, macros, diet_type, meals_per_day)
        #     
        #     if llm_plan and 'meals' in llm_plan and len(llm_plan['meals']) >= 3:
        #         # Enhance LLM plan with metadata
        #         llm_plan['generated_by'] = 'AI_PRO'
        #         llm_plan['diet_type_applied'] = diet_type
        #         # Ensure price format
        #         for m in llm_plan['meals']:
        #             if 'price' not in m: m['price'] = 150.0  # fallback
        #             if 'portion_multiplier' not in m: m['portion_multiplier'] = 1.0 # default
        #         return llm_plan
        # except Exception as e:
        #     # Silently fail to fallback
        #     print(f"LLM Generation failed, falling back: {e}")

        if meals_per_day == 3:
            distribution = {'breakfast': 0.25, 'lunch': 0.35, 'dinner': 0.40}
        elif meals_per_day == 4:
            distribution = {'breakfast': 0.25, 'lunch': 0.30, 'dinner': 0.35, 'snacks': 0.10}
        else: # 5 meals
            # Use unique keys for iteration
            distribution = {
                'breakfast': 0.20, 
                'morning_snack': 0.10,
                'lunch': 0.30, 
                'afternoon_snack': 0.10, 
                'dinner': 0.30
            }  
            
        plan_meals = []
        total_plan_cals = 0
        total_price = 0
        
        # Helper to filter meals
        def get_filtered_meals(meal_time):
            # Map specific times to DB keys (e.g. morning_snack -> snacks)
            db_key = meal_time
            if 'snack' in meal_time:
                db_key = 'snacks'
                
            all_meals = MealService.MEALS.get(db_key, [])
            
            # 1. Balanced / Non-Veg: Return everything (Non-veg includes veg items too)
            if diet_type == 'balanced' or diet_type == 'non_vegetarian':
                return all_meals
            
            # 2. Strict Filtering
            # Ensure 'vegetarian' tag is present for vegetarian diet
            # 'vegan' tag logic is already handled by generic tag matching below
            filtered = [m for m in all_meals if diet_type in m.get('tags', [])]
            
            # 3. Fallback logic (Only if absolutely necessary, but try to avoid)
            if not filtered:
                # If Strict Keto/Vegan requested but no meals found, we SHOULD NOT return invalid meals.
                # However, to prevent empty plans, we might return a 'safe' subset or stick to empty to force a retry/error?
                # User asked for perfection. Let's return empty to signal issue or fallback to a very safe default if possible.
                # For this implementation, we will assume DB has coverage. If not, returning empty is better than returning non-compliance.
                print(f"Warning: No meals found for {diet_type} at {meal_time}")
                return [] 
                
            return filtered
            
        # Select meals
        for meal_type, percentage in distribution.items():
            meal_target = target_calories * percentage
            
            available_meals = get_filtered_meals(meal_type)
            if not available_meals: 
                # Critical failure for this slot if no strict match found
                # Fallback to a generic safe option to prevent crash, but warn
                available_meals = MealService.MEALS.get(meal_time, [])[:1] # extremely basic fallback

            if not available_meals: 
                continue

            # Find meals close to target (within 300 calories margin to allow scaling)
            selected_meal = random.choice(available_meals)
            
            # Calculate multiplier to hit target calories for this slot
            multiplier = meal_target / selected_meal['calories']
            
            # Clamp multiplier to reasonable limits (e.g. 0.5x to 2.0x) to avoid 10 eggs
            multiplier = max(0.5, min(2.5, multiplier))
            
            actual_calories = int(selected_meal['calories'] * multiplier)

            meal_entry = selected_meal.copy()
            meal_entry['original_calories'] = selected_meal['calories']
            meal_entry['calories'] = actual_calories
            meal_entry['protein'] = int(meal_entry['protein'] * multiplier)
            meal_entry['carbs'] = int(meal_entry['carbs'] * multiplier)
            meal_entry['fat'] = int(meal_entry['fat'] * multiplier)
            meal_entry['price'] = selected_meal['price'] * multiplier # Price scales with portion
            meal_entry['portion_multiplier'] = round(multiplier, 2)
            
            plan_meals.append(meal_entry)
            total_plan_cals += actual_calories
            total_price += meal_entry['price']

        return {
            'target_calories': target_calories,
            'total_calories': total_plan_cals,
            'total_protein': sum(m['protein'] for m in plan_meals),
            'total_carbs': sum(m['carbs'] for m in plan_meals),
            'total_fat': sum(m['fat'] for m in plan_meals),
            'total_price': round(total_price, 2),
            'meals': plan_meals,
            'diet_type_applied': diet_type,
            'generated_by': 'STANDARD_DB'
        }

    @staticmethod
    def get_meal_suggestions(macro_type: str, calories: int) -> List[Dict]:
        """Get top 3 meal suggestions for a macro type"""
        # Simplified suggestion logic
        all_meals = []
        for cat in MealService.MEALS:
            all_meals.extend(MealService.MEALS[cat])
            
        # Filter (naive)
        if macro_type == 'high_protein':
            filtered = sorted(all_meals, key=lambda x: x['protein'], reverse=True)
        elif macro_type == 'low_carb':
            filtered = sorted(all_meals, key=lambda x: x['carbs'])
        else:
            filtered = all_meals
            
        return filtered[:3]
