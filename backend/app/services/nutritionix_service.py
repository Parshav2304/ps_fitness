import os
import httpx
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class NutritionixService:
    """Service for interacting with Nutritionix API"""
    
    def __init__(self):
        self.app_id = os.getenv('NUTRITIONIX_APP_ID', 'YOUR_APP_ID_HERE')
        self.api_key = os.getenv('NUTRITIONIX_API_KEY', 'YOUR_API_KEY_HERE')
        self.base_url = 'https://trackapi.nutritionix.com/v2'
        self.headers = {
            'x-app-id': self.app_id,
            'x-app-key': self.api_key,
            'Content-Type': 'application/json'
        }
    
    async def search_foods(self, query: str) -> List[Dict]:
        """
        Search for foods using Nutritionix instant search
        Returns list of matching foods with basic info
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f'{self.base_url}/search/instant',
                    headers=self.headers,
                    params={'query': query},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    foods = []
                    
                    # Process common foods (generic foods)
                    for food in data.get('common', [])[:10]:  # Limit to 10 results
                        foods.append({
                            'name': food.get('food_name', '').title(),
                            'serving': f"{food.get('serving_qty', 1)} {food.get('serving_unit', 'serving')}",
                            'category': 'Common',
                            'tag_id': food.get('tag_id'),
                            'is_common': True
                        })
                    
                    # Process branded foods (packaged foods)
                    for food in data.get('branded', [])[:5]:  # Limit to 5 branded
                        foods.append({
                            'name': food.get('food_name', '').title(),
                            'serving': f"{food.get('serving_qty', 1)} {food.get('serving_unit', 'serving')}",
                            'category': 'Branded',
                            'brand': food.get('brand_name', ''),
                            'nix_item_id': food.get('nix_item_id'),
                            'is_common': False
                        })
                    
                    return foods
                else:
                    logger.error(f"Nutritionix API error: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error searching foods: {str(e)}")
            return []
    
    async def get_food_details(self, food_name: str = None, nix_item_id: str = None) -> Optional[Dict]:
        """
        Get detailed nutrition info for a food
        Can use either food_name (for common foods) or nix_item_id (for branded foods)
        """
        try:
            async with httpx.AsyncClient() as client:
                if nix_item_id:
                    # Get branded food details
                    response = await client.get(
                        f'{self.base_url}/search/item',
                        headers=self.headers,
                        params={'nix_item_id': nix_item_id},
                        timeout=10.0
                    )
                else:
                    # Get common food details using natural language
                    response = await client.post(
                        f'{self.base_url}/natural/nutrients',
                        headers=self.headers,
                        json={'query': food_name},
                        timeout=10.0
                    )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if nix_item_id:
                        food = data.get('foods', [{}])[0]
                    else:
                        food = data.get('foods', [{}])[0]
                    
                    return {
                        'name': food.get('food_name', '').title(),
                        'serving': f"{food.get('serving_qty', 1)} {food.get('serving_unit', 'serving')}",
                        'calories': round(food.get('nf_calories', 0)),
                        'protein': round(food.get('nf_protein', 0), 1),
                        'carbs': round(food.get('nf_total_carbohydrate', 0), 1),
                        'fats': round(food.get('nf_total_fat', 0), 1),
                        'category': 'API'
                    }
                else:
                    logger.error(f"Nutritionix API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting food details: {str(e)}")
            return None
