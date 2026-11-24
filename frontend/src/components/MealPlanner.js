import React, { useState } from 'react';
import { getApiUrl } from '../utils/api';

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
      const response = await fetch(getApiUrl(API_URL, '/nutrition/meal-plan'), {
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
          setSuccess('Meal plan generated');
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
      const res = await fetch(getApiUrl(API_URL, '/nutrition/grocery-list'), {
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
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '28px', padding: '24px', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'rgba(99, 102, 241, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', color: '#fff' }}>
            Your Smart Plan
            <span style={{
              fontSize: '0.7rem',
              background: 'var(--primary-dim)',
              border: '1px solid var(--primary-border)',
              padding: '3px 8px',
              borderRadius: '6px',
              color: '#818cf8',
              fontWeight: '700',
              letterSpacing: '0.04em'
            }}>
              TARGET SPLIT
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mealPlan && !groceryList && (
              <button className="btn-primary" onClick={generateGroceryList} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Grocery List'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => { setMealPlan(null); setGroceryList(null); }}>
              Generate New Plan
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
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.28)',
                color: 'var(--primary-light)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              Meal Plan Generator
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>
              Tailored nutritional architecture configured precisely to your caloric goals and macronutrient targets.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diet Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'non_vegetarian', label: 'Omnivore' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Plant-Based' },
                    { id: 'keto', label: 'Ketogenic' },
                    { id: 'low_carb', label: 'Low Carb' },
                    { id: 'high_protein', label: 'High Protein' }
                  ].map(diet => (
                    <div
                      key={diet.id}
                      onClick={() => setMealPlanPreferences({ ...mealPlanPreferences, diet_type: diet.id })}
                      style={{
                        padding: '14px 10px',
                        borderRadius: '10px',
                        background: mealPlanPreferences.diet_type === diet.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                        border: mealPlanPreferences.diet_type === diet.id ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                        color: mealPlanPreferences.diet_type === diet.id ? '#ffffff' : 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: mealPlanPreferences.diet_type === diet.id ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{diet.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Energy Intake</label>
                  <span style={{
                    background: 'var(--surface-raised)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--primary-light)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'monospace'
                  }}>
                    {mealPlanPreferences.target_calories} kcal
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <input
                    type="range"
                    min="1200"
                    max="4000"
                    step="50"
                    value={mealPlanPreferences.target_calories}
                    onChange={(e) => setMealPlanPreferences({ ...mealPlanPreferences, target_calories: parseInt(e.target.value) })}
                    style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meals Per Day</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[3, 4, 5].map(nu => (
                    <button
                      key={nu}
                      type="button"
                      onClick={() => setMealPlanPreferences({ ...mealPlanPreferences, meals_per_day: nu })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        background: mealPlanPreferences.meals_per_day === nu ? 'var(--surface-raised)' : 'transparent',
                        border: mealPlanPreferences.meals_per_day === nu ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        color: mealPlanPreferences.meals_per_day === nu ? 'var(--primary-light)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        transition: 'all 0.15s ease'
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
                  marginTop: '12px',
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '10px',
                  letterSpacing: '-0.01em'
                }}
                disabled={loading}
              >
                {loading ? 'Synthesizing Protocol...' : 'Generate Personalized Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
