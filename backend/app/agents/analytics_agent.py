"""
Analytics Agent - Advanced data analysis and insights
"""
from typing import Dict, List
from datetime import datetime, timedelta
import statistics

class AnalyticsAgent:
    """Advanced agent for data analysis and insights generation"""
    
    @staticmethod
    def generate_insights(progress_data: List[Dict], goals: List[Dict]) -> Dict:
        """
        Generate comprehensive insights from user data
        
        Args:
            progress_data: List of progress entries
            goals: List of user goals
        
        Returns:
            Comprehensive insights dictionary
        """
        insights = {
            "summary": {},
            "trends": {},
            "achievements": [],
            "recommendations": [],
            "warnings": []
        }
        
        if not progress_data:
            insights["summary"] = {
                "status": "no_data",
                "message": "Start tracking to get personalized insights"
            }
            return insights
        
        # Calculate key metrics
        sorted_data = sorted(progress_data, key=lambda x: x.get("date", datetime.utcnow()))
        latest = sorted_data[-1]
        earliest = sorted_data[0]
        
        # Weight trends
        weights = [e.get("weight", 0) for e in sorted_data]
        weight_change = weights[-1] - weights[0]
        weight_trend = "increasing" if weight_change > 0 else "decreasing" if weight_change < 0 else "stable"
        
        # BMI trends
        bmis = [e.get("bmi", 0) for e in sorted_data]
        bmi_change = bmis[-1] - bmis[0]
        
        insights["summary"] = {
            "total_entries": len(progress_data),
            "tracking_period_days": (sorted_data[-1].get("date", datetime.utcnow()) - 
                                    sorted_data[0].get("date", datetime.utcnow())).days,
            "current_weight": latest.get("weight"),
            "weight_change": round(weight_change, 2),
            "current_bmi": latest.get("bmi"),
            "bmi_change": round(bmi_change, 2),
            "current_plan": latest.get("fitness_plan")
        }
        
        # Trend analysis
        insights["trends"] = {
            "weight_trend": weight_trend,
            "consistency": AnalyticsAgent._analyze_consistency(sorted_data),
            "velocity": AnalyticsAgent._calculate_velocity(sorted_data)
        }
        
        # Achievement detection
        insights["achievements"] = AnalyticsAgent._detect_achievements(sorted_data, goals)
        
        # Generate recommendations
        insights["recommendations"] = AnalyticsAgent._generate_recommendations(
            sorted_data, latest, goals
        )
        
        # Warnings
        insights["warnings"] = AnalyticsAgent._detect_warnings(sorted_data, latest)
        
        return insights
    
    @staticmethod
    def _analyze_consistency(data: List[Dict]) -> Dict:
        """Analyze tracking consistency"""
        if len(data) < 2:
            return {"level": "insufficient_data"}
        
        dates = [e.get("date", datetime.utcnow()) for e in data]
        intervals = []
        
        for i in range(1, len(dates)):
            if isinstance(dates[i], str):
                dates[i] = datetime.fromisoformat(dates[i])
            if isinstance(dates[i-1], str):
                dates[i-1] = datetime.fromisoformat(dates[i-1])
            intervals.append((dates[i] - dates[i-1]).days)
        
        avg_interval = statistics.mean(intervals) if intervals else 30
        
        if avg_interval <= 7:
            return {"level": "excellent", "avg_days_between": round(avg_interval, 1)}
        elif avg_interval <= 14:
            return {"level": "good", "avg_days_between": round(avg_interval, 1)}
        else:
            return {"level": "needs_improvement", "avg_days_between": round(avg_interval, 1)}
    
    @staticmethod
    def _calculate_velocity(data: List[Dict]) -> Dict:
        """Calculate progress velocity"""
        if len(data) < 2:
            return {}
        
        weights = [e.get("weight", 0) for e in data]
        dates = [e.get("date", datetime.utcnow()) for e in data]
        
        total_days = (dates[-1] - dates[0]).days
        total_change = weights[-1] - weights[0]
        
        if total_days > 0:
            weekly_velocity = (total_change / total_days) * 7
        else:
            weekly_velocity = 0
        
        return {
            "weekly_change_kg": round(weekly_velocity, 2),
            "is_healthy": -1.0 <= weekly_velocity <= 0.5  # Healthy range
        }
    
    @staticmethod
    def _detect_achievements(data: List[Dict], goals: List[Dict]) -> List[str]:
        """Detect user achievements"""
        achievements = []
        
        if len(data) >= 7:
            achievements.append("🎯 7-Day Tracking Streak!")
        
        if len(data) >= 30:
            achievements.append("🔥 30-Day Tracking Streak!")
        
        # Check goal progress
        for goal in goals:
            if goal.get("completed") == 1:
                achievements.append(f"✅ Completed: {goal.get('goal_type', 'Goal')}")
            elif goal.get("progress_percentage", 0) >= 75:
                achievements.append(f"🎉 Almost there: {goal.get('goal_type', 'Goal')} - {goal.get('progress_percentage', 0)}%")
        
        # Weight milestones
        if len(data) >= 2:
            weight_change = abs(data[-1].get("weight", 0) - data[0].get("weight", 0))
            if weight_change >= 5:
                achievements.append(f"💪 Lost/Gained {round(weight_change, 1)}kg!")
        
        return achievements
    
    @staticmethod
    def _generate_recommendations(data: List[Dict], latest: Dict, goals: List[Dict]) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Consistency recommendations
        if len(data) < 10:
            recommendations.append("📊 Track more frequently (aim for weekly) to get better insights")
        
        # Plan-specific recommendations
        plan = latest.get("fitness_plan", "")
        if plan == "Cut":
            recommendations.append("💡 During cutting: Prioritize protein intake to preserve muscle")
            recommendations.append("🏋️ Include strength training 3-4x per week")
        elif plan == "Bulk":
            recommendations.append("💡 During bulking: Focus on progressive overload in training")
            recommendations.append("🍽️ Ensure you're hitting calorie targets consistently")
        
        # Goal-based recommendations
        active_goals = [g for g in goals if g.get("completed", 0) == 0]
        if active_goals:
            recommendations.append(f"🎯 You have {len(active_goals)} active goal(s). Stay consistent!")
        
        return recommendations
    
    @staticmethod
    def _detect_warnings(data: List[Dict], latest: Dict) -> List[str]:
        """Detect potential issues or warnings"""
        warnings = []
        
        if len(data) >= 2:
            weights = [e.get("weight", 0) for e in data[-7:]]  # Last 7 entries
            if len(weights) >= 3:
                recent_change = weights[-1] - weights[0]
                
                # Rapid weight loss warning
                if recent_change < -2.0:
                    warnings.append("⚠️ Rapid weight loss detected. Ensure you're eating enough and consult a professional if needed")
                
                # Rapid weight gain warning
                if recent_change > 2.0:
                    warnings.append("⚠️ Rapid weight gain detected. Review your calorie intake")
        
        # BMI warnings
        bmi = latest.get("bmi", 0)
        if bmi < 18.5:
            warnings.append("⚠️ BMI is below healthy range. Consider consulting a healthcare professional")
        elif bmi > 30:
            warnings.append("⚠️ BMI indicates obesity. Consider professional guidance for safe weight loss")
        
        return warnings

    @staticmethod
    def calculate_workout_volume(workout_logs: List[Dict]) -> Dict:
        """
        Calculate weekly workout volume (weight * reps)
        Returns: { "labels": ["Week 1", ...], "data": [5000, 7000, ...] }
        """
        if not workout_logs:
            return {"labels": [], "data": []}
            
        # Group by week
        volume_by_week = {}
        for log in workout_logs:
            date_str = log.get("date")
            if isinstance(date_str, str):
                date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                date = date_str
            
            # Get start of week (Monday)
            start_of_week = date - timedelta(days=date.weekday())
            week_key = start_of_week.strftime("%b %d")
            
            # Calculate volume
            log_volume = log.get("volume", 0)
            if log_volume == 0 and "exercises" in log:
                 # Recalculate if missing
                 for ex in log["exercises"]:
                     for s in ex.get("sets", []):
                         log_volume += s.get("weight", 0) * s.get("reps", 0)
            
            volume_by_week[week_key] = volume_by_week.get(week_key, 0) + log_volume

        # Sort and format
        sorted_weeks = sorted(volume_by_week.keys(), key=lambda x: datetime.strptime(x, "%b %d"))
        return {
            "labels": sorted_weeks,
            "data": [round(volume_by_week[w]) for w in sorted_weeks]
        }

    @staticmethod
    def identify_personal_records(workout_logs: List[Dict]) -> List[Dict]:
        """
        Identify One Rep Max (estimated) or Best Weight for major lifts
        Returns: [{name: "Bench Press", weight: 100, date: "..."}]
        """
        major_lifts = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull Up"]
        best_lifts = {}
        
        for log in workout_logs:
            date = log.get("date")
            for ex in log.get("exercises", []):
                name = ex.get("name", "")
                # Simple string matching for now
                matched_lift = next((lift for lift in major_lifts if lift.lower() in name.lower()), None)
                
                if matched_lift:
                    max_weight = 0
                    for s in ex.get("sets", []):
                        if s.get("weight", 0) > max_weight:
                            max_weight = s.get("weight")
                    
                    if max_weight > 0:
                        current_best = best_lifts.get(matched_lift, {"weight": 0})
                        if max_weight > current_best["weight"]:
                            best_lifts[matched_lift] = {
                                "name": matched_lift,
                                "weight": max_weight,
                                "date": date.split("T")[0] if isinstance(date, str) else str(date.date())
                            }
        
        return list(best_lifts.values())

    @staticmethod
    def generate_consistency_heatmap(logs: List[Dict]) -> List[Dict]:
        """
        Generate heatmap data: [{date: "2023-01-01", count: 1}]
        """
        heatmap = {}
        for log in logs:
            date_str = log.get("date")
            if not date_str: continue
            
            if isinstance(date_str, str):
                day = date_str.split("T")[0]
            else:
                day = str(date_str.date())
                
            heatmap[day] = heatmap.get(day, 0) + 1
            
        return [{"date": k, "count": v} for k, v in heatmap.items()]

    @staticmethod
    def get_weekly_summary(logs: List[Dict]) -> Dict:
        """
        Generate a text summary comparison of this week vs last week.
        """
        now = datetime.utcnow()
        start_of_current_week = now - timedelta(days=now.weekday())
        start_of_last_week = start_of_current_week - timedelta(days=7)
        
        current_week_logs = []
        last_week_logs = []
        
        for log in logs:
            date_str = log.get("date")
            if isinstance(date_str, str):
                date = datetime.fromisoformat(date_str.replace('Z', ''))
            else:
                date = date_str
                
            if date >= start_of_current_week:
                current_week_logs.append(log)
            elif date >= start_of_last_week:
                last_week_logs.append(log)
                
        current_count = len(current_week_logs)
        last_count = len(last_week_logs)
        
        diff = current_count - last_count
        
        if diff > 0:
            trend = "up"
            message = "🔥 You're crushing it! More workouts than last week."
        elif diff < 0:
            trend = "down"
            message = "⚠️ A bit quieter than last week. Let's push for one more!"
        else:
            trend = "stable"
            message = "✅ Consistent effort. Keeping the pace!"
            
        return {
            "this_week_count": current_count,
            "last_week_count": last_count,
            "trend": trend,
            "message": message
        }

    @staticmethod
    def detect_progressive_overload(workout_logs: List[Dict]) -> List[str]:
        """
        Analyze recent workouts to detect Progressive Overload or Plateaus.
        Returns generic insights like:
        - "Bench Press: 📈 Increasing load (Success)"
        - "Squat: ⚖️ Plateau detected (3 sessions same weight)"
        """
        if not workout_logs: return []
        
        # 1. Group sets by Exercise Name
        exercise_history = {} # { "Bench Press": [ {date, max_weight, volume} ] }
        
        for log in workout_logs:
            date = log.get("date")
            for ex in log.get("exercises", []):
                name = ex.get("name")
                if not name: continue
                
                # Calculate max weight and volume for this session
                max_weight = 0
                volume = 0
                for s in ex.get("sets", []):
                    w = s.get("weight", 0)
                    r = s.get("reps", 0)
                    if w > max_weight: max_weight = w
                    volume += w * r
                
                if max_weight > 0:
                    if name not in exercise_history: exercise_history[name] = []
                    exercise_history[name].append({
                        "date": date,
                        "max_weight": max_weight,
                        "volume": volume
                    })
        
        insights = []
        
        # 2. Analyze Trends for each Exercise (Last 3 sessions)
        for name, history in exercise_history.items():
            if len(history) < 3: continue
            
            # Sort by date
            sorted_hist = sorted(history, key=lambda x: x["date"])
            recent = sorted_hist[-3:] # Last 3
            
            # Check Trends
            # 1. Increasing Weight (Overload)
            if recent[-1]["max_weight"] > recent[-2]["max_weight"] >= recent[-3]["max_weight"]:
                insights.append(f"📈 **{name}**: Progressive Overload detected! Strength is going up.")
                
            # 2. Plateau (Same weight for 3 sessions)
            elif recent[-1]["max_weight"] == recent[-2]["max_weight"] == recent[-3]["max_weight"]:
                insights.append(f"⚖️ **{name}**: Potential Plateau. Try increasing reps or weight next time.")
                
            # 3. Deload / Drop (Significant volume drop)
            elif recent[-1]["volume"] < (recent[-2]["volume"] * 0.8):
                 insights.append(f"📉 **{name}**: Volume dropped. Good for recovery if intentional.")
                 
        return insights[:5] # Return top 5 insights

    @staticmethod
    def analyze_sleep_correlation(workout_logs: List[Dict], sleep_logs: List[Dict]) -> List[str]:
        """
        Correlate sleep duration/quality with workout volume.
        """
        if not workout_logs or not sleep_logs: return []
        
        # Map date (YYYY-MM-DD) to sleep data
        sleep_map = {}
        for s in sleep_logs:
            # Handle date string formats
            d_str = s.get("date", "").split("T")[0]
            sleep_map[d_str] = s
            
        high_sleep_vols = []
        low_sleep_vols = []
        
        for w in workout_logs:
            w_date = w.get("date", "").split("T")[0]
            if w_date in sleep_map:
                sleep = sleep_map[w_date]
                # Calculate volume for this workout
                vol = w.get("volume", 0)
                if vol == 0: # Recalculate if missing
                    for ex in w.get("exercises", []):
                        for set_ in ex.get("sets", []): vol += set_.get("weight", 0) * set_.get("reps", 0)
                
                if sleep.get("duration_hours", 0) >= 7.0:
                    high_sleep_vols.append(vol)
                else:
                    low_sleep_vols.append(vol)
                    
        insights = []
        if high_sleep_vols and low_sleep_vols:
            avg_high = sum(high_sleep_vols) / len(high_sleep_vols)
            avg_low = sum(low_sleep_vols) / len(low_sleep_vols)
            
            if avg_high > avg_low * 1.05: # 5% better
                diff = int(((avg_high - avg_low) / avg_low) * 100)
                insights.append(f"💤 **Sleep Power**: You lift **{diff}% more volume** when you sleep 7+ hours!")
            elif avg_low > avg_high:
                 insights.append("💤 **Odd Trend**: You seem to perform well even with less sleep. Ensure you recover enough!")
                 
        return insights
