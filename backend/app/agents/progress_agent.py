"""
Progress Agent - Advanced progress tracking and analysis
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import statistics

class ProgressAgent:
    """Advanced agent for progress tracking and analysis"""
    
    @staticmethod
    def calculate_progress_velocity(entries: List[Dict]) -> Dict:
        """
        Calculate progress velocity and predict future outcomes
        
        Args:
            entries: List of progress entries with dates and weights
        
        Returns:
            Velocity analysis and predictions
        """
        if len(entries) < 2:
            return {
                "velocity": 0,
                "trend": "insufficient_data",
                "prediction": None
            }
        
        # Sort by date
        sorted_entries = sorted(entries, key=lambda x: x.get("date", datetime.utcnow()))
        
        # Calculate weekly velocity
        weights = [e.get("weight", 0) for e in sorted_entries]
        dates = [e.get("date", datetime.utcnow()) for e in sorted_entries]
        
        if len(weights) < 2:
            return {"velocity": 0, "trend": "insufficient_data"}
        
        # Calculate change per week
        total_days = (dates[-1] - dates[0]).days
        total_change = weights[-1] - weights[0]
        
        if total_days > 0:
            weekly_velocity = (total_change / total_days) * 7
        else:
            weekly_velocity = 0
        
        # Determine trend
        if len(weights) >= 3:
            recent_trend = weights[-1] - weights[-3]
            if recent_trend < -0.5:
                trend = "accelerating_loss"
            elif recent_trend < 0:
                trend = "steady_loss"
            elif recent_trend > 0.5:
                trend = "accelerating_gain"
            elif recent_trend > 0:
                trend = "steady_gain"
            else:
                trend = "maintaining"
        else:
            if weekly_velocity < -0.3:
                trend = "losing"
            elif weekly_velocity > 0.3:
                trend = "gaining"
            else:
                trend = "maintaining"
        
        # Predict future (simple linear projection)
        prediction = None
        if abs(weekly_velocity) > 0.1:
            weeks_to_goal = None
            if weekly_velocity < 0:  # Losing weight
                target_loss = weights[0] - weights[-1]  # Already lost
                if target_loss > 0:
                    weeks_to_goal = abs(weekly_velocity) / 0.5  # Weeks to lose 0.5kg/week
            
            prediction = {
                "projected_weight_4_weeks": round(weights[-1] + (weekly_velocity * 4), 1),
                "projected_weight_8_weeks": round(weights[-1] + (weekly_velocity * 8), 1),
                "weekly_velocity_kg": round(weekly_velocity, 2)
            }
        
        return {
            "velocity": round(weekly_velocity, 2),
            "trend": trend,
            "total_change": round(total_change, 2),
            "days_tracked": total_days,
            "prediction": prediction
        }
    
    @staticmethod
    def detect_plateaus(entries: List[Dict], metric: str = "weight", threshold_days: int = 14) -> List[Dict]:
        """
        Detect weight/fitness plateaus
        
        Args:
            entries: Progress entries
            metric: Metric to analyze (weight, bmi, body_fat)
            threshold_days: Days without significant change to consider plateau
        
        Returns:
            List of detected plateaus
        """
        if len(entries) < 3:
            return []
        
        sorted_entries = sorted(entries, key=lambda x: x.get("date", datetime.utcnow()))
        plateaus = []
        
        i = 0
        while i < len(sorted_entries) - 2:
            start_entry = sorted_entries[i]
            start_value = start_entry.get(metric, 0)
            start_date = start_entry.get("date", datetime.utcnow())
            
            # Look ahead for plateau
            plateau_entries = [start_entry]
            j = i + 1
            
            while j < len(sorted_entries):
                current_entry = sorted_entries[j]
                current_value = current_entry.get(metric, 0)
                current_date = current_entry.get("date", datetime.utcnow())
                
                # Check if change is minimal (within 1% or 0.5kg for weight)
                if metric == "weight":
                    change_threshold = 0.5
                else:
                    change_threshold = start_value * 0.01
                
                if abs(current_value - start_value) <= change_threshold:
                    plateau_entries.append(current_entry)
                    j += 1
                else:
                    break
            
            # Check if plateau is significant
            if len(plateau_entries) >= 2:
                plateau_days = (plateau_entries[-1].get("date", datetime.utcnow()) - 
                               plateau_entries[0].get("date", datetime.utcnow())).days
                
                if plateau_days >= threshold_days:
                    plateaus.append({
                        "start_date": plateau_entries[0].get("date").isoformat() if isinstance(plateau_entries[0].get("date"), datetime) else plateau_entries[0].get("date"),
                        "end_date": plateau_entries[-1].get("date").isoformat() if isinstance(plateau_entries[-1].get("date"), datetime) else plateau_entries[-1].get("date"),
                        "duration_days": plateau_days,
                        "metric": metric,
                        "value": round(start_value, 2),
                        "recommendations": ProgressAgent._get_plateau_recommendations(metric, plateau_days)
                    })
            
            i = j if j > i + 1 else i + 1
        
        return plateaus
    
    @staticmethod
    def _get_plateau_recommendations(metric: str, duration_days: int) -> List[str]:
        """Get recommendations for breaking plateaus"""
        recommendations = []
        
        if metric == "weight":
            if duration_days < 21:
                recommendations.append("Plateau detected. Consider adjusting calories by 100-200 kcal")
                recommendations.append("Increase daily activity or add 1-2 cardio sessions")
            else:
                recommendations.append("Extended plateau. Consider reverse dieting or refeed day")
                recommendations.append("Review and adjust training program")
                recommendations.append("Ensure adequate sleep (7-9 hours)")
        elif metric == "body_fat":
            recommendations.append("Body composition may be changing even if weight stays same")
            recommendations.append("Take progress photos and measurements")
            recommendations.append("Consider adjusting macro ratios")
        
        return recommendations
    
    @staticmethod
    def calculate_consistency_score(entries: List[Dict]) -> Dict:
        """
        Calculate user consistency score based on tracking frequency
        
        Args:
            entries: Progress entries
        
        Returns:
            Consistency analysis
        """
        if not entries:
            return {
                "score": 0,
                "level": "No data",
                "recommendations": ["Start tracking your progress regularly"]
            }
        
        sorted_entries = sorted(entries, key=lambda x: x.get("date", datetime.utcnow()))
        
        # Calculate average days between entries
        if len(sorted_entries) < 2:
            return {
                "score": 50,
                "level": "Getting Started",
                "recommendations": ["Track at least weekly for better insights"]
            }
        
        dates = [e.get("date", datetime.utcnow()) for e in sorted_entries]
        intervals = []
        
        for i in range(1, len(dates)):
            if isinstance(dates[i], str):
                dates[i] = datetime.fromisoformat(dates[i])
            if isinstance(dates[i-1], str):
                dates[i-1] = datetime.fromisoformat(dates[i-1])
            interval = (dates[i] - dates[i-1]).days
            intervals.append(interval)
        
        avg_interval = statistics.mean(intervals) if intervals else 30
        
        # Score based on frequency (lower interval = higher score)
        if avg_interval <= 3:
            score = 100
            level = "Excellent"
        elif avg_interval <= 7:
            score = 85
            level = "Very Good"
        elif avg_interval <= 14:
            score = 70
            level = "Good"
        elif avg_interval <= 21:
            score = 55
            level = "Fair"
        else:
            score = 40
            level = "Needs Improvement"
        
        recommendations = []
        if avg_interval > 7:
            recommendations.append(f"Track more frequently (currently ~{int(avg_interval)} days apart)")
            recommendations.append("Aim for weekly tracking for best results")
        
        return {
            "score": score,
            "level": level,
            "average_interval_days": round(avg_interval, 1),
            "total_entries": len(entries),
            "recommendations": recommendations
        }
