"""
Generate synthetic fitness dataset for training the ML model
"""
import numpy as np
import pandas as pd
from typing import List
import os

np.random.seed(42)

def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """Calculate BMI from weight and height"""
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)

def estimate_body_fat(bmi: float, age: int, gender: int) -> float:
    """Estimate body fat percentage using Deurenberg formula"""
    bf = (1.20 * bmi) + (0.23 * age) - (10.8 * gender) - 5.4
    return max(5.0, min(50.0, bf))  # Clamp between 5% and 50%

def assign_plan(bmi: float, body_fat: float, age: int, gender: int, 
                activity_level: float) -> str:
    """
    Assign fitness plan based on body metrics and goals
    Plans: Cut, Bulk, Lean, Recomp
    """
    # BMI categories
    underweight = bmi < 18.5
    normal_weight = 18.5 <= bmi < 25
    overweight = 25 <= bmi < 30
    obese = bmi >= 30
    
    # Body fat thresholds
    if gender == 1:  # Male
        low_bf = body_fat < 12
        normal_bf = 12 <= body_fat < 20
        high_bf = body_fat >= 20
    else:  # Female
        low_bf = body_fat < 20
        normal_bf = 20 <= body_fat < 30
        high_bf = body_fat >= 30
    
    # Decision logic
    if obese or high_bf:
        return 'Cut'
    elif underweight or low_bf:
        return 'Bulk'
    elif normal_weight and normal_bf:
        if activity_level >= 1.55:  # Moderate to high activity
            return 'Lean'
        else:
            return 'Recomp'
    elif overweight and not high_bf:
        return 'Recomp'
    else:
        return 'Lean'

def generate_fitness_dataset(n_samples: int = 5000) -> pd.DataFrame:
    """Generate comprehensive fitness dataset"""
    
    data = []
    
    for _ in range(n_samples):
        # Generate random features
        gender = np.random.choice([0, 1])  # 0: Female, 1: Male
        age = np.random.randint(18, 65)
        
        # Height distribution by gender (cm)
        if gender == 1:  # Male
            height = np.random.normal(175, 8)
        else:  # Female
            height = np.random.normal(162, 7)
        height = np.clip(height, 140, 210)
        
        # Weight distribution by gender and height (kg)
        # Using a correlation with height
        base_weight = (height - 100) * 0.9
        weight_variation = np.random.normal(0, 10)
        weight = base_weight + weight_variation
        
        # Add some variation for different body types
        body_type = np.random.choice(['lean', 'average', 'heavy'], p=[0.25, 0.50, 0.25])
        if body_type == 'lean':
            weight *= 0.85
        elif body_type == 'heavy':
            weight *= 1.15
            
        weight = np.clip(weight, 40, 150)
        
        # Activity level
        activity_level = np.random.choice(
            [1.2, 1.375, 1.55, 1.725, 1.9],
            p=[0.20, 0.25, 0.30, 0.15, 0.10]
        )
        
        # Calculate derived features
        bmi = calculate_bmi(weight, height)
        body_fat = estimate_body_fat(bmi, age, gender)
        
        # Add realistic noise to body fat
        body_fat += np.random.normal(0, 2)
        body_fat = np.clip(body_fat, 5, 50)
        
        # Assign plan
        plan = assign_plan(bmi, body_fat, age, gender, activity_level)
        
        data.append({
            'Height': round(height, 1),
            'Weight': round(weight, 1),
            'Age': age,
            'Gender': gender,
            'Activity_Level': activity_level,
            'Body_Fat': round(body_fat, 2),
            'BMI': round(bmi, 2),
            'Plan': plan
        })
    
    df = pd.DataFrame(data)
    
    # Balance the dataset
    plan_counts = df['Plan'].value_counts()
    min_count = plan_counts.min()
    
    # Sample equal number from each class
    balanced_dfs = []
    for plan in df['Plan'].unique():
        plan_df = df[df['Plan'] == plan].sample(n=min_count, random_state=42)
        balanced_dfs.append(plan_df)
    
    df_balanced = pd.concat(balanced_dfs, ignore_index=True)
    df_balanced = df_balanced.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df_balanced

def main():
    """Generate and save the dataset"""
    print("Generating fitness dataset...")
    df = generate_fitness_dataset(n_samples=5000)
    
    # Create data directory if it doesn't exist
    os.makedirs('../../data', exist_ok=True)
    
    # Save to CSV
    output_path = '../../data/fitness_dataset.csv'
    df.to_csv(output_path, index=False)
    
    print(f"\nDataset generated successfully!")
    print(f"Total samples: {len(df)}")
    print(f"\nPlan distribution:")
    print(df['Plan'].value_counts())
    print(f"\nDataset saved to: {output_path}")
    print(f"\nFirst few rows:")
    print(df.head())
    print(f"\nDataset statistics:")
    print(df.describe())

if __name__ == "__main__":
    main()