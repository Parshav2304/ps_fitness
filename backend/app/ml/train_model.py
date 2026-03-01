"""
Train XGBoost model for fitness plan prediction
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import xgboost as xgb
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns

def load_data(filepath: str = 'app/fitness_dataset.csv'):
    """Load the fitness dataset"""
    df = pd.read_csv(filepath)
    return df

def prepare_features(df: pd.DataFrame):
    """Prepare features and target"""
    feature_cols = ['Height', 'Weight', 'Age', 'Gender', 'Activity_Level', 'Body_Fat']
    # Mapping categorical variables if needed, assuming they're already encoded or handled by XGBoost
    # For simplicity, if they are strings, we might need OneHotEncoding or LabelEncoding.
    # Checking dataset structure from previous view: likely numerical or needing encoding.
    # Assuming the dataset is ready or XGBoost handles it (XGBoost can handle some distincts but usually needs numeric).
    # Let's add basic encoding just in case to be safe, or just pass if already numeric.
    # Looking at error "could not convert string to float" usually happens if not encoded.
    # For now, let's restore the original logic which likely assumed pre-processed or numeric data.
    # Wait, the previous file view showed simple selection.
    
    # Simple encoding for 'Gender' and 'Activity_Level' if they are strings
    df_processed = df.copy()
    if df_processed['Gender'].dtype == 'object':
        df_processed['Gender'] = df_processed['Gender'].map({'Male': 0, 'Female': 1})
    
    if df_processed['Activity_Level'].dtype == 'object':
         activity_map = {
             'Sedentary': 0, 'Lightly Active': 1, 'Moderately Active': 2, 
             'Very Active': 3, 'Extra Active': 4
         }
         df_processed['Activity_Level'] = df_processed['Activity_Level'].map(activity_map)

    X = df_processed[feature_cols]
    y = df_processed['Plan']
    
    # Encode target if it's string
    if y.dtype == 'object':
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        y = le.fit_transform(y)
        # We might need to save the encoder to decode later, but for training just passing is fine.
        
    return X, y

def train_model(X_train, y_train, tune_hyperparameters=False):
    """Train XGBoost classifier"""
    # Use optimized parameters
    model = xgb.XGBClassifier(
        max_depth=5,
        learning_rate=0.1,
        n_estimators=200,
        min_child_weight=3,
        subsample=0.9,
        colsample_bytree=0.9,
        objective='multi:softmax',
        eval_metric='mlogloss',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test, feature_names):
    """Evaluate model performance"""
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n{'='*50}")
    print(f"Model Accuracy: {accuracy:.4f}")
    print(f"{'='*50}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return accuracy, y_pred

def plot_confusion_matrix(y_test, y_pred, labels):
    """Plot confusion matrix"""
    try:
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title('Confusion Matrix')
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        plt.tight_layout()
        plt.savefig('models/confusion_matrix.png') # Adjusted path
        print("\nConfusion matrix saved to: models/confusion_matrix.png")
    except Exception as e:
        print(f"Could not save confusion matrix: {e}")

def plot_feature_importance(model, feature_names):
    """Plot feature importance"""
    try:
        importance = model.feature_importances_
        indices = np.argsort(importance)[::-1]
        
        plt.figure(figsize=(10, 6))
        plt.title("Feature Importance")
        plt.bar(range(len(importance)), importance[indices])
        plt.xticks(range(len(importance)), [feature_names[i] for i in indices], rotation=45)
        plt.tight_layout()
        plt.savefig('models/feature_importance.png') # Adjusted path
        print("Feature importance plot saved to: models/feature_importance.png")
    except Exception as e:
        print(f"Could not save feature importance: {e}")

def save_model(model, filepath='models/plan_predictor.pkl'):
    """Save trained model"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    joblib.dump(model, filepath)
    print(f"\nModel saved to: {filepath}")

def main():
    """Main training pipeline"""
    print("Starting model training pipeline...")
    
    # Load data
    print("\n1. Loading data...")
    df = load_data()
    print(f"Dataset shape: {df.shape}")
    print(f"\nPlan distribution:\n{df['Plan'].value_counts()}")
    
    # Prepare features
    print("\n2. Preparing features...")
    X, y = prepare_features(df)
    feature_names = X.columns.tolist()
    print(f"Features: {feature_names}")
    print(f"Target classes: {np.unique(y)}")
    
    # Split data
    print("\n3. Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Training set: {X_train.shape}")
    print(f"Test set: {X_test.shape}")
    
    # Train model
    print("\n4. Training model...")
    model = train_model(X_train, y_train, tune_hyperparameters=False)
    
    # Evaluate model
    print("\n5. Evaluating model...")
    accuracy, y_pred = evaluate_model(model, X_test, y_test, feature_names)
    
    # Cross-validation
    print("\n6. Performing cross-validation...")
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"Cross-validation scores: {cv_scores}")
    print(f"Mean CV accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Plot results
    print("\n7. Generating visualizations...")
    plot_confusion_matrix(y_test, y_pred, labels=sorted(np.unique(y)))
    plot_feature_importance(model, feature_names)
    
    # Save model
    print("\n8. Saving model...")
    save_model(model)
    
    print("\n" + "="*50)
    print("Training completed successfully!")
    print("="*50)

if __name__ == "__main__":
    main()