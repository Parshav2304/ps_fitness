"""
Workout Plan Generation Service
"""
from typing import List, Dict
import random

class WorkoutService:
    """Service for generating personalized workout plans"""
    
    # Exercise database with equipment tags
    EXERCISES = {
        'chest': [
            {'name': 'Bench Press', 'type': 'compound', 'equipment': 'gym', 'sets': 4, 'reps': '6-8'},
            {'name': 'Incline Dumbbell Press', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '8-10'},
            {'name': 'Chest Flyes', 'type': 'isolation', 'equipment': 'gym', 'sets': 3, 'reps': '10-12'},
            {'name': 'Push-ups', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '15-20'},
            {'name': 'Dips', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '8-12'},
            {'name': 'Dumbbell Floor Press', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Diamond Push-ups', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '12-15'}
        ],
        'back': [
            {'name': 'Deadlift', 'type': 'compound', 'equipment': 'gym', 'sets': 4, 'reps': '5-6'},
            {'name': 'Pull-ups', 'type': 'compound', 'equipment': 'all', 'sets': 4, 'reps': '8-10'},
            {'name': 'Barbell Rows', 'type': 'compound', 'equipment': 'gym', 'sets': 4, 'reps': '8-10'},
            {'name': 'Dumbbell Rows', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Lat Pulldowns', 'type': 'compound', 'equipment': 'gym', 'sets': 3, 'reps': '10-12'},
            {'name': 'Superman', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '15'},
            {'name': 'Band Face Pulls', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '15-20'}
        ],
        'shoulders': [
            {'name': 'Overhead Press', 'type': 'compound', 'equipment': 'gym', 'sets': 4, 'reps': '6-8'},
            {'name': 'Dumbbell Shoulder Press', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '8-10'},
            {'name': 'Lateral Raises', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '12-15'},
            {'name': 'Front Raises', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '12-15'},
            {'name': 'Pike Push-ups', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '10-12'}
        ],
        'legs': [
            {'name': 'Barbell Squats', 'type': 'compound', 'equipment': 'gym', 'sets': 4, 'reps': '8-10'},
            {'name': 'Goblet Squats', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '12-15'},
            {'name': 'Lunges', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Romanian Deadlifts', 'type': 'compound', 'equipment': 'gym', 'sets': 3, 'reps': '8-10'},
            {'name': 'Dumbbell RDL', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Calf Raises', 'type': 'isolation', 'equipment': 'all', 'sets': 4, 'reps': '15-20'},
            {'name': 'Bulgarian Split Squats', 'type': 'compound', 'equipment': 'all', 'sets': 3, 'reps': '10-12'}
        ],
        'arms': [
            {'name': 'Barbell Curls', 'type': 'isolation', 'equipment': 'gym', 'sets': 3, 'reps': '10-12'},
            {'name': 'Dumbbell Curls', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Hammer Curls', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Tricep Dips', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '10-12'},
            {'name': 'Skullcrushers', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '10-12'}
        ],
        'core': [
            {'name': 'Plank', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '60s'},
            {'name': 'Russian Twists', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '20'},
            {'name': 'Leg Raises', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '15'},
            {'name': 'Bicycle Crunches', 'type': 'isolation', 'equipment': 'all', 'sets': 3, 'reps': '20'}
        ],
        'cardio': [
            {'name': 'Running', 'type': 'cardio', 'equipment': 'all', 'sets': 1, 'reps': '20-30 min'},
            {'name': 'Burpees', 'type': 'cardio', 'equipment': 'all', 'sets': 3, 'reps': '15'},
            {'name': 'Jump Rope', 'type': 'cardio', 'equipment': 'all', 'sets': 3, 'reps': '2 min'},
            {'name': 'Cycling', 'type': 'cardio', 'equipment': 'gym', 'sets': 1, 'reps': '30 min'}
        ]
    }
    
    @staticmethod
    def generate_workout_plan(fitness_plan: str, days_per_week: int = 4, location: str = 'gym', is_athlete: bool = False) -> Dict:
        """
        Generate a personalized workout plan based on fitness goal, location, and intensity
        """
        days_per_week = max(3, min(6, days_per_week))
        
        # Define Splita based on days
        splits = []
        if days_per_week == 3:
            splits = ['Full Body A', 'Full Body B', 'Full Body C']
        elif days_per_week == 4:
            splits = ['Upper A', 'Lower A', 'Upper B', 'Lower B']
        elif days_per_week == 5:
            splits = ['Push', 'Pull', 'Legs', 'Upper', 'Lower']
        elif days_per_week == 6:
            splits = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs']
            
        plan_name = f"{fitness_plan} - {days_per_week} Day Split ({'Athlete' if is_athlete else 'Standard'})"
        
        workouts = []
        for i, day_name in enumerate(splits):
            workout = {
                'day': i + 1,
                'name': day_name,
                'exercises': []
            }
            
            # Select target muscles based on split
            targets = []
            if 'Full Body' in day_name:
                targets = [('legs', 1), ('chest', 1), ('back', 1), ('shoulders', 1), ('arms', 1), ('core', 1)]
            elif 'Upper' in day_name:
                targets = [('chest', 2), ('back', 2), ('shoulders', 1), ('arms', 2)]
            elif 'Lower' in day_name:
                targets = [('legs', 3), ('core', 2)]
            elif 'Push' in day_name:
                targets = [('chest', 2), ('shoulders', 2), ('arms', 1)] # Triceps (Arms)
            elif 'Pull' in day_name:
                targets = [('back', 2), ('arms', 1), ('core', 1)] # Biceps (Arms)
            elif 'Legs' in day_name:
                targets = [('legs', 3), ('core', 1)]
            
            # Select exercises with filtering
            for muscle, count in targets:
                # Athlete mode: Increase exercise count by 1 for major groups
                if is_athlete and muscle in ['chest', 'back', 'legs']:
                    count += 1
                    
                selected = WorkoutService._select_exercises(muscle, count, location)
                
                # Athlete mode: Increase sets
                if is_athlete:
                    for ex in selected:
                        if isinstance(ex['sets'], int):
                            ex['sets'] += 1
                            
                workout['exercises'].extend(selected)
                
            workouts.append(workout)
            
        return {
            'plan_name': plan_name,
            'workouts': workouts,
            'fitness_goal': fitness_plan,
            'location': location,
            'is_athlete': is_athlete
        }
    
    @staticmethod
    def _select_exercises(group: str, count: int, location: str) -> List[Dict]:
        """Select random exercises filtering by location"""
        available = WorkoutService.EXERCISES.get(group, [])
        
        # Filter by location
        if location == 'home':
            available = [ex for ex in available if ex['equipment'] == 'all']
            
        if not available:
            return []
            
        # Select random
        selected_templates = random.sample(available, min(count, len(available)))
        
        # Return copies to avoid mutating the template
        return [ex.copy() for ex in selected_templates]
