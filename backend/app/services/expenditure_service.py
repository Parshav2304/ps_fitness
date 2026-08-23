"""
Expenditure & Weight Trend Engine (MacroFactor-style Science)
Calculates smoothed weight trend using Exponential Moving Average (EMA)
and dynamically calculates Total Daily Energy Expenditure (TDEE).
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import math

class ExpenditureService:
    @staticmethod
    def calculate_weight_trend(weight_entries: List[Dict[str, Any]], alpha: float = 0.1) -> List[Dict[str, Any]]:
        """
        Calculates Exponential Moving Average (EMA) weight trend.
        Filters out daily water weight fluctuations.
        alpha: Smoothing factor (default 0.1 = ~10-day weighted window)
        """
        if not weight_entries:
            return []

        # Sort entries chronologically
        sorted_entries = sorted(weight_entries, key=lambda x: x.get('date', ''))
        
        smoothed_entries = []
        trend = None

        for entry in sorted_entries:
            raw_weight = entry.get('weight', 0.0)
            if raw_weight <= 0:
                continue

            if trend is None:
                trend = raw_weight
            else:
                trend = (alpha * raw_weight) + ((1 - alpha) * trend)

            entry_copy = dict(entry)
            entry_copy['trend_weight'] = round(trend, 2)
            smoothed_entries.append(entry_copy)

        return smoothed_entries

    @staticmethod
    def calculate_tdee(
        weight_entries: List[Dict[str, Any]], 
        calorie_entries: List[Dict[str, Any]], 
        days_window: int = 14
    ) -> Optional[Dict[str, Any]]:
        """
        Dynamically calculates TDEE based on energy balance equation:
        TDEE = Average Calorie Intake - (Weight Change in kg * 7700 kcal/kg / days)
        """
        if len(weight_entries) < 3 or len(calorie_entries) < 3:
            return None

        # Sort entries
        trend_entries = ExpenditureService.calculate_weight_trend(weight_entries)
        if len(trend_entries) < 2:
            return None

        recent_trends = trend_entries[-days_window:]
        initial_trend = recent_trends[0]['trend_weight']
        final_trend = recent_trends[-1]['trend_weight']
        weight_change_kg = final_trend - initial_trend

        # Calculate average calories over period
        sorted_cals = sorted(calorie_entries, key=lambda x: x.get('date', ''))[-days_window:]
        if not sorted_cals:
            return None

        total_cals = sum(entry.get('calories', 0) for entry in sorted_cals)
        avg_calories = total_cals / len(sorted_cals)

        # Caloric equivalent of 1kg body mass ≈ 7700 kcal
        surplus_deficit_per_day = (weight_change_kg * 7700) / max(len(recent_trends) - 1, 1)
        estimated_tdee = avg_calories - surplus_deficit_per_day

        # Bounds check (safeguard)
        estimated_tdee = max(1200, min(5000, round(estimated_tdee)))

        return {
            "estimated_tdee": estimated_tdee,
            "avg_calorie_intake": round(avg_calories),
            "weight_change_kg": round(weight_change_kg, 2),
            "initial_trend_weight": initial_trend,
            "current_trend_weight": final_trend,
            "days_analyzed": len(recent_trends)
        }

    @staticmethod
    def calculate_macro_targets(
        tdee: int, 
        goal: str = "maintain", 
        body_weight_kg: float = 70.0
    ) -> Dict[str, int]:
        """
        Calculates optimal macro targets based on TDEE and goal.
        - Weight Loss (Cut): 15-20% deficit, high protein (2.2g/kg)
        - Muscle Gain (Bulk): 10-15% surplus, protein (2.0g/kg)
        - Maintenance: TDEE, protein (1.8g/kg)
        """
        goal_lower = goal.lower()
        if "loss" in goal_lower or "cut" in goal_lower or "drop" in goal_lower:
            target_calories = int(tdee * 0.82)
            protein_per_kg = 2.2
        elif "gain" in goal_lower or "bulk" in goal_lower or "muscle" in goal_lower:
            target_calories = int(tdee * 1.10)
            protein_per_kg = 2.0
        else:
            target_calories = tdee
            protein_per_kg = 1.8

        protein_g = round(body_weight_kg * protein_per_kg)
        protein_cals = protein_g * 4

        # Fats: 25% of target calories
        fat_cals = target_calories * 0.25
        fat_g = round(fat_cals / 9)

        # Carbs: Remaining calories
        carb_cals = max(0, target_calories - (protein_cals + fat_cals))
        carb_g = round(carb_cals / 4)

        return {
            "target_calories": target_calories,
            "protein_g": protein_g,
            "carbs_g": carb_g,
            "fats_g": fat_g
        }
