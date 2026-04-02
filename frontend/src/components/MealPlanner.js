import React, { useState } from 'react';

const MealPlanner = ({ API_URL, token, setSuccess, setError }) => {
  const [mealPlanPreferences, setMealPlanPreferences] = useState({
    diet_type: 'balanced',
    target_calories: 2000,
    meals_per_day: 3
  });
  const [mealPlan, setMealPlan] = useState(null);
  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirmGenerateMealPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/nutrition/meal-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealPlanPreferences),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setMealPlan(data);
          setSuccess('Meal plan generated! 🍽️');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Received an empty meal plan. Try different settings.');
        }
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.detail;
        if (!errorMessage) {
          errorMessage = JSON.stringify(errorData);
        } else if (typeof errorMessage !== 'string') {
          errorMessage = JSON.stringify(errorMessage);
        }
        setError(errorMessage || 'Failed to generate meal plan');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const generateGroceryList = async () => {
    if (!mealPlan || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/nutrition/grocery-list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealPlan)
      });
      if (res.ok) {
        const data = await res.json();
        setGroceryList(data);
      }
    } catch (e) { setError("Failed to generate list"); }
    finally { setLoading(false); }
  };

  const renderSmartPlanSection = () => {
    if (!mealPlan && !groceryList) return null;
    return (
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '30px', padding: '20px', border: '1px solid var(--primary)', background: 'rgba(139, 92, 246, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            📋 Your Smart Plan
            {mealPlan?.generated_by === 'AI_PRO' && (
              <span style={{
                fontSize: '0.7rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: '4px 10px',
                borderRadius: '20px',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontWeight: '600'
              }}>
                ✨ AI Generated
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {mealPlan && !groceryList && (
              <button className="btn-primary" onClick={generateGroceryList} disabled={loading}>
                {loading ? 'Generating...' : '🛒 Generate Grocery List'}
              </button>
            )}
            <button className="btn-glass" onClick={() => { setMealPlan(null); setGroceryList(null); }} style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
              🔄 Generate New Plan
            </button>
          </div>
        </div>

        {groceryList ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {Object.entries(groceryList).map(([category, items]) => (
              <div key={category} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--secondary)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                  {category}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ padding: '4px 0', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              background: 'rgba(255,255,255,0.1)',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calories</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{mealPlan.total_calories}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Protein</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#10b981' }}>{mealPlan.total_protein || 0}g</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carbs</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#3b82f6' }}>{mealPlan.total_carbs || 0}g</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fats</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#f59e0b' }}>{mealPlan.total_fat || 0}g</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {mealPlan.meals?.map((meal, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                  {meal.image && (
                    <div style={{ height: '150px', overflow: 'hidden' }}>
                      <img src={meal.image} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '15px' }}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '5px' }}>Meal {i + 1}</strong>
                    <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '600', marginBottom: '10px' }}>{meal.name}</div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.4' }}>
                      {meal.ingredients?.join(', ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        <span style={{ fontWeight: 'bold' }}>{meal.calories}</span> cal<br />
                        <span style={{ opacity: 0.8 }}>P:{meal.protein} C:{meal.carbs} F:{meal.fat}</span>
                      </div>
                      <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>₹{meal.price?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      {mealPlan ? (
        renderSmartPlanSection()
      ) : (
        <div>
          <h2 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>🍎</span> Meal Plan Generator
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
            Create a personalized daily meal plan based on your diet preferences and calorie goals.
          </p>

          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'grid', gap: '25px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Diet Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'balanced', label: 'Balanced', icon: '⚖️' },
                    { id: 'non_vegetarian', label: 'Non-Veg', icon: '🍗' },
                    { id: 'vegetarian', label: 'Vegetarian', icon: '🥦' },
                    { id: 'vegan', label: 'Vegan', icon: '🌱' },
                    { id: 'keto', label: 'Keto', icon: '🥓' },
                    { id: 'low_carb', label: 'Low Carb', icon: '🥑' },
                    { id: 'high_protein', label: 'High Protein', icon: '💪' }
                  ].map(diet => (
                    <div
                      key={diet.id}
                      onClick={() => setMealPlanPreferences({ ...mealPlanPreferences, diet_type: diet.id })}
                      style={{
                        padding: '15px',
                        borderRadius: '12px',
                        background: mealPlanPreferences.diet_type === diet.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        transform: mealPlanPreferences.diet_type === diet.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{diet.icon}</div>
                      <div style={{ fontWeight: 'bold' }}>{diet.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Target Calories</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <input
                    type="range"
                    min="1200"
                    max="4000"
                    step="50"
                    value={mealPlanPreferences.target_calories}
                    onChange={(e) => setMealPlanPreferences({ ...mealPlanPreferences, target_calories: parseInt(e.target.value) })}
                    style={{ flex: 1, accentColor: 'var(--primary)' }}
                  />
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    {mealPlanPreferences.target_calories}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Meals Per Day</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {[3, 4, 5].map(nu => (
                    <button
                      key={nu}
                      onClick={() => setMealPlanPreferences({ ...mealPlanPreferences, meals_per_day: nu })}
                      style={{
                        flex: 1,
                        padding: '15px',
                        borderRadius: '12px',
                        background: mealPlanPreferences.meals_per_day === nu ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {nu} Meals
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirmGenerateMealPlan}
                className="btn-primary"
                style={{
                  marginTop: '20px',
                  padding: '20px',
                  fontSize: '1.2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px'
                }}
                disabled={loading}
              >
                {loading ? '⚙️ Generating Plan...' : '✨ Generate Personalized Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
