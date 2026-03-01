"""
USDA FoodData Central API Integration Service
Provides access to 350,000+ foods with complete nutrition data
"""
import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class USDAService:
    """Service for integrating with USDA FoodData Central API"""
    
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"
    API_KEY = os.getenv("USDA_API_KEY", "DEMO_KEY")  # Get free key at https://fdc.nal.usda.gov/api-key-signup.html
    
    # Instant local database for high-frequency common queries to avoid 5-second API lag
    COMMON_FOODS = {
        "apple": {"id": "local_1", "name": "Apple", "nutrition": {"calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2}},
        "banana": {"id": "local_2", "name": "Banana", "nutrition": {"calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3}},
        "chicken": {"id": "local_3", "name": "Chicken Breast", "nutrition": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6}},
        "egg": {"id": "local_4", "name": "Egg (Whole)", "nutrition": {"calories": 155, "protein": 13, "carbs": 1.1, "fat": 11}},
        "rice": {"id": "local_5", "name": "White Rice", "nutrition": {"calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3}},
        "roti": {"id": "local_6", "name": "Roti / Chapati", "nutrition": {"calories": 297, "protein": 9, "carbs": 50, "fat": 6}},
        "noodle": {"id": "local_7", "name": "Noodles (Boiled)", "nutrition": {"calories": 138, "protein": 4.5, "carbs": 25, "fat": 2.1}},
        "milk": {"id": "local_8", "name": "Milk (Whole)", "nutrition": {"calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3}},
        "paneer": {"id": "local_9", "name": "Paneer", "nutrition": {"calories": 265, "protein": 18, "carbs": 1.2, "fat": 20}},
        "dal": {"id": "local_10", "name": "Dal (Lentils)", "nutrition": {"calories": 116, "protein": 9, "carbs": 20, "fat": 0.4}},
        "oats": {"id": "local_11", "name": "Oats", "nutrition": {"calories": 389, "protein": 16.9, "carbs": 66.3, "fat": 6.9}}
    }
    
    @staticmethod
    def search_foods(query: str, page_size: int = 25, page_number: int = 1) -> Dict:
        """
        Search for foods in USDA database (with instant local fallback)
        """
        try:
            # 1. Fast Local Intercept Check
            query_lower = query.lower().strip()
            local_results = []
            for key, food_data in USDAService.COMMON_FOODS.items():
                if query_lower in key or key in query_lower:
                    local_match = food_data.copy()
                    local_match["serving_size"] = 100
                    local_match["serving_unit"] = "g"
                    local_match["brand"] = "Generic"
                    local_match["data_type"] = "Local DB"
                    # Ensure all standard schema fields are present
                    nutr = local_match["nutrition"]
                    for blank in ['fiber', 'sugar', 'sodium']:
                        if blank not in nutr: nutr[blank] = 0
                    local_results.append(local_match)
            
            # If we found it locally, return instantly without waiting 5 seconds.
            if local_results:
                return {
                    "foods": local_results,
                    "total_hits": len(local_results),
                    "current_page": 1,
                    "total_pages": 1
                }

            # 2. Slow USDA Fallback
            url = f"{USDAService.BASE_URL}/foods/search"
            params = {
                "api_key": USDAService.API_KEY,
                "query": query,
                "pageSize": min(page_size, 200),
                "pageNumber": page_number,
                "sortBy": "dataType.keyword",
                "sortOrder": "asc"
            }
            
            response = requests.get(url, params=params, timeout=5) # Reduced timeout so UI doesn't hang forever
            response.raise_for_status()
            
            data = response.json()
            
            # Parse and format results
            foods = []
            for food in data.get("foods", []):
                parsed_food = USDAService._parse_food(food)
                if parsed_food:
                    foods.append(parsed_food)
            
            return {
                "foods": foods,
                "total_hits": data.get("totalHits", 0),
                "current_page": page_number,
                "total_pages": (data.get("totalHits", 0) + page_size - 1) // page_size
            }
            
        except requests.exceptions.RequestException as e:
            print(f"USDA API Error: {str(e)}")
            return {"foods": [], "total_hits": 0, "current_page": 1, "total_pages": 0}
    
    @staticmethod
    def get_food_details(fdc_id: int) -> Optional[Dict]:
        """
        Get detailed nutrition information for a specific food
        
        Args:
            fdc_id: USDA FoodData Central ID
            
        Returns:
            Detailed food information with all nutrients
        """
        try:
            url = f"{USDAService.BASE_URL}/food/{fdc_id}"
            params = {"api_key": USDAService.API_KEY}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            food = response.json()
            return USDAService._parse_food(food, detailed=True)
            
        except requests.exceptions.RequestException as e:
            print(f"USDA API Error: {str(e)}")
            return None
    
    @staticmethod
    def _parse_food(food: Dict, detailed: bool = False) -> Optional[Dict]:
        """Parse USDA food data into our format"""
        try:
            # Extract basic info
            parsed = {
                "id": f"usda_{food.get('fdcId')}",
                "fdc_id": food.get("fdcId"),
                "name": food.get("description", "Unknown Food"),
                "brand": food.get("brandOwner", food.get("brandName", "")),
                "data_type": food.get("dataType", ""),
                "serving_size": 100,  # Default to 100g
                "serving_unit": "g"
            }
            
            # Extract nutrients
            nutrients = {}
            food_nutrients = food.get("foodNutrients", [])
            
            for nutrient in food_nutrients:
                nutrient_name = nutrient.get("nutrientName", "")
                nutrient_value = nutrient.get("value", 0)
                
                # Map USDA nutrient names to our format
                if "Energy" in nutrient_name and "kcal" in nutrient.get("unitName", "").lower():
                    nutrients["calories"] = round(nutrient_value, 1)
                elif "Protein" in nutrient_name:
                    nutrients["protein"] = round(nutrient_value, 1)
                elif "Carbohydrate" in nutrient_name and "by difference" in nutrient_name:
                    nutrients["carbs"] = round(nutrient_value, 1)
                elif "Total lipid" in nutrient_name or "Fat, total" in nutrient_name:
                    nutrients["fat"] = round(nutrient_value, 1)
                elif "Fiber" in nutrient_name:
                    nutrients["fiber"] = round(nutrient_value, 1)
                elif "Sugars, total" in nutrient_name:
                    nutrients["sugar"] = round(nutrient_value, 1)
                elif "Sodium" in nutrient_name:
                    nutrients["sodium"] = round(nutrient_value, 1)
                elif detailed:
                    # Store additional nutrients for detailed view
                    if "Cholesterol" in nutrient_name:
                        nutrients["cholesterol"] = round(nutrient_value, 1)
                    elif "Calcium" in nutrient_name:
                        nutrients["calcium"] = round(nutrient_value, 1)
                    elif "Iron" in nutrient_name:
                        nutrients["iron"] = round(nutrient_value, 1)
                    elif "Vitamin A" in nutrient_name:
                        nutrients["vitamin_a"] = round(nutrient_value, 1)
                    elif "Vitamin C" in nutrient_name:
                        nutrients["vitamin_c"] = round(nutrient_value, 1)
            
            # Ensure all required nutrients exist
            parsed["nutrition"] = {
                "calories": nutrients.get("calories", 0),
                "protein": nutrients.get("protein", 0),
                "carbs": nutrients.get("carbs", 0),
                "fat": nutrients.get("fat", 0),
                "fiber": nutrients.get("fiber", 0),
                "sugar": nutrients.get("sugar", 0),
                "sodium": nutrients.get("sodium", 0)
            }
            
            # Add detailed nutrients if requested
            if detailed:
                parsed["nutrition"].update({
                    "cholesterol": nutrients.get("cholesterol", 0),
                    "calcium": nutrients.get("calcium", 0),
                    "iron": nutrients.get("iron", 0),
                    "vitamin_a": nutrients.get("vitamin_a", 0),
                    "vitamin_c": nutrients.get("vitamin_c", 0)
                })
            
            # Add serving size info if available
            if "servingSize" in food:
                parsed["serving_size"] = food["servingSize"]
                parsed["serving_unit"] = food.get("servingSizeUnit", "g")
            
            return parsed
            
        except Exception as e:
            print(f"Error parsing food: {str(e)}")
            return None
    
    @staticmethod
    def search_by_category(category: str, page_size: int = 25) -> Dict:
        """
        Search foods by category (e.g., "fruits", "vegetables", "protein")
        """
        category_queries = {
            "fruits": "fruit",
            "vegetables": "vegetable",
            "protein": "chicken beef fish",
            "dairy": "milk cheese yogurt",
            "grains": "bread rice pasta",
            "snacks": "chips cookies crackers"
        }
        
        query = category_queries.get(category.lower(), category)
        return USDAService.search_foods(query, page_size=page_size)
