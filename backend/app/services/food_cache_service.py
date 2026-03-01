"""
Food caching service for offline support and performance optimization
"""
import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List

class FoodCacheService:
    """Service for caching food data locally"""
    
    CACHE_DIR = "cache"
    CACHE_FILE = os.path.join(CACHE_DIR, "food_cache.json")
    CACHE_DURATION_DAYS = 7  # Cache foods for 7 days
    
    @staticmethod
    def _ensure_cache_dir():
        """Ensure cache directory exists"""
        if not os.path.exists(FoodCacheService.CACHE_DIR):
            os.makedirs(FoodCacheService.CACHE_DIR)
    
    @staticmethod
    def _load_cache() -> Dict:
        """Load cache from file"""
        FoodCacheService._ensure_cache_dir()
        
        if not os.path.exists(FoodCacheService.CACHE_FILE):
            return {}
        
        try:
            with open(FoodCacheService.CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cache: {e}")
            return {}
    
    @staticmethod
    def _save_cache(cache: Dict):
        """Save cache to file"""
        FoodCacheService._ensure_cache_dir()
        
        try:
            with open(FoodCacheService.CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(cache, f, indent=2)
        except Exception as e:
            print(f"Error saving cache: {e}")
    
    @staticmethod
    def get_cached_food(food_id: str) -> Optional[Dict]:
        """Get cached food by ID"""
        cache = FoodCacheService._load_cache()
        
        if food_id not in cache:
            return None
        
        cached_item = cache[food_id]
        cached_date = datetime.fromisoformat(cached_item['cached_at'])
        
        # Check if cache is still valid
        if datetime.now() - cached_date > timedelta(days=FoodCacheService.CACHE_DURATION_DAYS):
            # Cache expired, remove it
            del cache[food_id]
            FoodCacheService._save_cache(cache)
            return None
        
        return cached_item['data']
    
    @staticmethod
    def cache_food(food_id: str, food_data: Dict):
        """Cache food data"""
        cache = FoodCacheService._load_cache()
        
        cache[food_id] = {
            'data': food_data,
            'cached_at': datetime.now().isoformat()
        }
        
        FoodCacheService._save_cache(cache)
    
    @staticmethod
    def cache_search_results(query: str, results: List[Dict]):
        """Cache search results"""
        cache = FoodCacheService._load_cache()
        
        search_key = f"search_{query.lower()}"
        cache[search_key] = {
            'data': results,
            'cached_at': datetime.now().isoformat()
        }
        
        FoodCacheService._save_cache(cache)
    
    @staticmethod
    def get_cached_search(query: str) -> Optional[List[Dict]]:
        """Get cached search results"""
        cache = FoodCacheService._load_cache()
        
        search_key = f"search_{query.lower()}"
        if search_key not in cache:
            return None
        
        cached_item = cache[search_key]
        cached_date = datetime.fromisoformat(cached_item['cached_at'])
        
        # Search results cache for 1 day
        if datetime.now() - cached_date > timedelta(days=1):
            del cache[search_key]
            FoodCacheService._save_cache(cache)
            return None
        
        return cached_item['data']
    
    @staticmethod
    def clear_cache():
        """Clear all cached data"""
        FoodCacheService._ensure_cache_dir()
        
        if os.path.exists(FoodCacheService.CACHE_FILE):
            os.remove(FoodCacheService.CACHE_FILE)
    
    @staticmethod
    def get_cache_stats() -> Dict:
        """Get cache statistics"""
        cache = FoodCacheService._load_cache()
        
        total_items = len(cache)
        search_items = sum(1 for key in cache.keys() if key.startswith('search_'))
        food_items = total_items - search_items
        
        # Calculate cache size
        cache_size = 0
        if os.path.exists(FoodCacheService.CACHE_FILE):
            cache_size = os.path.getsize(FoodCacheService.CACHE_FILE)
        
        return {
            'total_items': total_items,
            'food_items': food_items,
            'search_items': search_items,
            'cache_size_bytes': cache_size,
            'cache_size_mb': round(cache_size / (1024 * 1024), 2)
        }
