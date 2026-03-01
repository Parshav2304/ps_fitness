"""
Barcode Lookup Service using Nutritionix API
Provides nutrition data for packaged foods via UPC/EAN barcodes
"""
import os
import requests
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

class BarcodeService:
    """Service for looking up food nutrition by barcode using OpenFoodFacts"""
    
    BASE_URL = "https://world.openfoodfacts.org/api/v0/product"
    
    @staticmethod
    def lookup_barcode(barcode: str) -> Optional[Dict]:
        """
        Look up food by UPC/EAN barcode
        
        Args:
            barcode: UPC or EAN barcode (8-13 digits)
            
        Returns:
            Food nutrition data or None if not found
        """
        try:
            url = f"{BarcodeService.BASE_URL}/{barcode}.json"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == 1 and "product" in data:
                return BarcodeService._parse_food(data["product"], barcode)
            
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"OpenFoodFacts API Error: {str(e)}")
            return None
    
    @staticmethod
    def _parse_food(product: Dict, barcode: str) -> Dict:
        """Parse OpenFoodFacts data into our format"""
        nutriments = product.get("nutriments", {})
        
        # Energy can be in kJ or kcal; we prefer kcal
        calories = nutriments.get("energy-kcal_100g", nutriments.get("energy-kcal_value", 0))
        if not calories:
            energy_kj = nutriments.get("energy_100g", 0)
            if energy_kj:
                calories = energy_kj / 4.184
                
        return {
            "id": f"barcode_{barcode}",
            "barcode": barcode,
            "name": product.get("product_name", "Unknown Product"),
            "brand": product.get("brands", "").split(",")[0] if product.get("brands") else "",
            "serving_size": 100, # OpenFoodFacts primarily gives data per 100g
            "serving_unit": "g",
            "serving_qty": 1,
            "serving_description": "100g",
            "photo_url": product.get("image_front_thumb_url", ""),
            "nutrition": {
                "calories": round(calories, 1),
                "protein": round(nutriments.get("proteins_100g", 0), 1),
                "carbs": round(nutriments.get("carbohydrates_100g", 0), 1),
                "fat": round(nutriments.get("fat_100g", 0), 1),
                "fiber": round(nutriments.get("fiber_100g", 0), 1),
                "sugar": round(nutriments.get("sugars_100g", 0), 1),
                "sodium": round(nutriments.get("sodium_100g", 0) * 1000, 1), # convert g to mg
                "cholesterol": round(nutriments.get("cholesterol_100g", 0) * 1000, 1), # convert g to mg
                "saturated_fat": round(nutriments.get("saturated-fat_100g", 0), 1)
            }
        }
    
    @staticmethod
    def validate_barcode(barcode: str) -> bool:
        """
        Validate barcode format (UPC/EAN)
        
        Args:
            barcode: Barcode string to validate
            
        Returns:
            True if valid UPC/EAN format
        """
        # Remove any whitespace
        barcode = barcode.strip()
        
        # Check if it's all digits
        if not barcode.isdigit():
            return False
        
        # Check length (UPC-A: 12, EAN-13: 13, UPC-E: 8)
        if len(barcode) not in [8, 12, 13]:
            return False
        
        return True
