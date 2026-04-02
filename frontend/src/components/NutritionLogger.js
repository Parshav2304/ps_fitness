import React, { useState, useEffect, useCallback } from 'react';
import FoodLoggerModal from './FoodLoggerModal';

const NutritionLogger = ({ API_URL, token, setSuccess, setError }) => {
  const [foodEntries, setFoodEntries] = useState([]);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const fetchTodayFoodLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/food/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFoodEntries(data);
        
        // Calculate Totals
        const tCalories = data.reduce((sum, e) => sum + (e.calories * (e.servings || 1)), 0);
        const tProtein = data.reduce((sum, e) => sum + (e.protein * (e.servings || 1)), 0);
        const tCarbs = data.reduce((sum, e) => sum + (e.carbs * (e.servings || 1)), 0);
        const tFats = data.reduce((sum, e) => sum + (e.fats * (e.servings || 1)), 0);
        
        setTotals({ calories: tCalories, protein: tProtein, carbs: tCarbs, fats: tFats });
      }
    } catch (e) { console.error("Food logs fetch error", e); }
  }, [token, API_URL]);

  useEffect(() => {
    fetchTodayFoodLogs();
  }, [fetchTodayFoodLogs]);

  const handleDeleteFood = async (id) => {
    try {
      const res = await fetch(`${API_URL}/food/log/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess("Food deleted");
        fetchTodayFoodLogs();
      } else {
        setError("Failed to delete food");
      }
    } catch (e) {
      setError("Delete failed");
    }
  };

  // SVG parameters for macro rings
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // Assume a 2000 cal diet roughly: 150g protein, 200g carbs, 65g fat for percentages
  // In a real app, these goals would come from User Profile or predictions
  const goals = { protein: 150, carbs: 200, fats: 65, calories: 2000 };

  const calculateDashOffset = (value, target) => {
    const percentage = Math.min(value / target, 1);
    return circumference - percentage * circumference;
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '30px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>🍎 Food Diary</h2>
        <button
          onClick={() => setShowAddFoodModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '1rem' }}
        >
          <span style={{ fontSize: '1.2rem' }}>+</span> Log Food
        </button>
      </div>

      {/* Premium Macro Dashboard with Animated SVG Rings */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '40px',
        background: 'rgba(0,0,0,0.2)',
        padding: '20px',
        borderRadius: '20px'
      }}>
        {/* Calories */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle className="macro-ring" cx="50" cy="50" r={radius} fill="none" stroke="#8b5cf6" strokeWidth="10" 
                strokeDasharray={circumference} strokeDashoffset={calculateDashOffset(totals.calories, goals.calories)} 
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>
              {Math.round(totals.calories)}
            </div>
          </div>
          <div style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Calories</div>
        </div>

        {/* Protein */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <svg width="100" height="100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="8" 
                strokeDasharray={circumference} strokeDashoffset={calculateDashOffset(totals.protein, goals.protein)} 
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>
              {Math.round(totals.protein)}g
            </div>
          </div>
          <div style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Protein</div>
        </div>

        {/* Carbs */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <svg width="100" height="100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#3b82f6" strokeWidth="8" 
                strokeDasharray={circumference} strokeDashoffset={calculateDashOffset(totals.carbs, goals.carbs)} 
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>
              {Math.round(totals.carbs)}g
            </div>
          </div>
          <div style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carbs</div>
        </div>

        {/* Fats */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <svg width="100" height="100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#f59e0b" strokeWidth="8" 
                strokeDasharray={circumference} strokeDashoffset={calculateDashOffset(totals.fats, goals.fats)} 
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>
              {Math.round(totals.fats)}g
            </div>
          </div>
          <div style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fats</div>
        </div>
      </div>

      {/* Today's Meals */}
      <div>
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Today's Entries</h3>

        {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
          const mealFoods = foodEntries.filter(entry => entry.meal === mealType);
          const mealCalories = mealFoods.reduce((sum, entry) => sum + (entry.calories * (entry.servings || 1)), 0);

          return (
            <div key={mealType} style={{ marginBottom: '25px' }}>
              <div style={{
                padding: '15px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mealFoods.length > 0 ? '15px' : '0' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', textTransform: 'capitalize' }}>
                    {mealType === 'breakfast' ? '🌅 Breakfast' : mealType === 'lunch' ? '☀️ Lunch' : mealType === 'dinner' ? '🌙 Dinner' : '🍪 Snacks'}
                  </h4>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{Math.round(mealCalories)} kcal</span>
                </div>

                {mealFoods.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>No foods logged yet</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {mealFoods.map(entry => (
                      <div key={entry.id} style={{ 
                        padding: '15px', 
                        background: 'rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1.05rem', marginBottom: '6px', fontWeight: 'bold' }}>
                            {entry.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'normal' }}>({entry.servings || 1}x)</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span style={{color: '#fff'}}>{Math.round(entry.calories * (entry.servings || 1))} cal</span> • 
                            <span style={{color: '#10b981'}}> P: {(entry.protein * (entry.servings || 1)).toFixed(1)}g</span> • 
                            <span style={{color: '#3b82f6'}}> C: {(entry.carbs * (entry.servings || 1)).toFixed(1)}g</span> • 
                            <span style={{color: '#f59e0b'}}> F: {(entry.fats * (entry.servings || 1)).toFixed(1)}g</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFood(entry.id)}
                          className="btn-glass"
                          style={{ 
                            padding: '10px', 
                            borderRadius: '10px', 
                            background: 'rgba(244, 63, 94, 0.1)', 
                            border: '1px solid rgba(244, 63, 94, 0.2)', 
                            color: '#f43f5e', 
                            cursor: 'pointer', 
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showAddFoodModal && (
        <FoodLoggerModal
          API_URL={API_URL}
          onClose={() => setShowAddFoodModal(false)}
          onFoodLogged={(data) => {
            fetchTodayFoodLogs();
            setShowAddFoodModal(false);
            setSuccess('Food logged successfully!');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
};

export default NutritionLogger;
