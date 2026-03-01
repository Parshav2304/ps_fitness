from typing import List, Dict

class GroceryService:
    """Service to generate grocery lists from meal plans"""
    
    @staticmethod
    def generate_list(meal_plan: Dict) -> Dict[str, List[str]]:
        """
        Extracts ingredients from a meal plan and categorizes them.
        Returns: { "Produce": ["Spinach", "Apple"], "Protein": ["Chicken Breast"], ... }
        """
        grocery_list = {
            "Produce": set(),
            "Meat & Seafood": set(),
            "Dairy & Eggs": set(),
            "Grains & Pantry": set(),
            "Other": set()
        }
        
        # Simple keywords for categorization (in real app, use LLM or robust db)
        categories = {
            "Produce": ["apple", "banana", "spinach", "lettuce", "tomato", "carrot", "broccoli", "berry", "onion", "garlic", "potato"],
            "Meat & Seafood": ["chicken", "beef", "pork", "fish", "salmon", "tuna", "steak", "turkey"],
            "Dairy & Eggs": ["milk", "cheese", "yogurt", "egg", "butter", "cream"],
            "Grains & Pantry": ["rice", "bread", "oat", "pasta", "cereal", "nut", "oil", "spice", "sauce", "bean"]
        }
        
        if not meal_plan: return {}
        
        def categorize(item):
            item_lower = item.lower()
            for cat, keywords in categories.items():
                if any(k in item_lower for k in keywords):
                    return cat
            return "Other"

        # Walk through the meal plan structure
        # Assuming meal_plan["days"][i]["meals"][j]["ingredients"] or similar
        # Based on NutritionAgent structure, it might just be meal descriptions.
        # If it's just descriptions ("Grilled Chicken Salad"), we need LLM to parse ingredients.
        # For V1, checking if we have ingredients. If not, just list the Meal Names as "To Buy".
        
        # Check structure: usually "meals": [{"name": "Chicken...", "ingredients": [...]}]
        
        if "week_plan" in meal_plan: # Enhanced structure
             for day in meal_plan["week_plan"]:
                 for meal in day.get("meals", []):
                     _process_meal_item(meal, grocery_list, categorize)
        elif "days" in meal_plan: # Gemini structure often returns days
             for day in meal_plan["days"]:
                 for meal in day.get("meals", []):
                     _process_meal_item(meal, grocery_list, categorize)
        elif "meals" in meal_plan: # Single day structure (MealService)
             for meal in meal_plan["meals"]:
                 _process_meal_item(meal, grocery_list, categorize)
                     
        # Convert sets to sorted lists
        return {k: sorted(list(v)) for k, v in grocery_list.items() if v}

def _process_meal_item(meal, grocery_list, categorize_func):
    # If meal has explicit ingredients (ideal)
    if "ingredients" in meal and isinstance(meal["ingredients"], list):
        for ing in meal["ingredients"]:
            cat = categorize_func(ing)
            grocery_list[cat].add(ing)
    else:
        # Fallback: Just add the meal name if no ingredients found
        # Or try to guess from name (e.g. "Chicken Salad" -> Chicken, Salad)
        name = meal.get("name", "")
        if name:
            grocery_list["Other"].add(name)
