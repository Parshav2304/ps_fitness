import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Login from './Login';
import Sidebar from './Sidebar';
import PSAICoach from './components/PSAICoach';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OnboardingTour from './components/OnboardingTour';
import EditProfileModal from './components/EditProfileModal';
import SettingsModal from './components/SettingsModal';
import WorkoutPreferencesModal from './components/WorkoutPreferencesModal';
import WorkoutLogger from './components/WorkoutLogger';
import NutritionLogger from './components/NutritionLogger';
import MealPlanner from './components/MealPlanner';




// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  // ============================================
  // STATE DECLARATIONS
  // ============================================
  const [backendConnected, setBackendConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dashboard states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workoutPlan, setWorkoutPlan] = useState(null);
  // const [chatMessages, setChatMessages] = useState([]); // Removed
  // const [chatInput, setChatInput] = useState(''); // Removed
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkoutPreferences, setShowWorkoutPreferences] = useState(false);
  const [workoutPreferences, setWorkoutPreferences] = useState({
    location: 'gym',
    daysPerWeek: 4,
    isAthlete: false
  });


  // Workout tracking states (Global)
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);


  const [hydration, setHydration] = useState(0); // Current hydration in ml

  // ============================================
  // AUTH LOGIC
  // ============================================
  const handleLoginSuccess = (userData, accessToken) => {
    setToken(accessToken);
    setUser(userData);
    setSuccess('Welcome to PS Fitness!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Workout Helpers
  // Handlers moved to WorkoutLogger.js

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveTab('dashboard');
    setSuccess('Logged out successfully');
  };

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [token]);




  const fetchHydration = useCallback(async () => {
    if (!token) {
      console.log("🌊 fetchHydration: No token, skipping");
      return;
    }
    console.log("🌊 fetchHydration: Starting fetch...");
    console.log("🌊 API_URL:", API_URL);
    console.log("🌊 Token:", token ? "Present" : "Missing");

    try {
      const res = await fetch(`${API_URL}/hydration/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("🌊 Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("🌊 Hydration data received:", data);
        console.log("🌊 Setting hydration to:", data.total_ml || 0);
        setHydration(data.total_ml || 0);
        console.log("🌊 Hydration state updated");
      } else {
        console.error("🌊 Response not OK:", res.status, res.statusText);
      }
    } catch (e) {
      console.error("🌊 Hydration fetch error:", e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setBackendConnected(true);
      if (!user) {
        fetchUserProfile();

        
        fetchHydration();
      } else {
        // Always refresh hydration when switching tabs or when component mounts with existing user
        fetchHydration();
      }
    } else {
      const checkBackend = async () => {
        try {
          const response = await fetch(`${API_URL}/`);
          if (response.ok) setBackendConnected(true);
        } catch (e) { setBackendConnected(false); }
      };
      checkBackend();
    }
  }, [token, user, fetchUserProfile, fetchHydration, activeTab]);

  // Rest Timer Effect
  useEffect(() => {
    let interval;
    if (restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.log('Audio play failed', e));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimeLeft]);

  // ============================================
  // CORE FEATURES
  // ============================================
  const generateWorkoutPlan = async () => {
    if (!token) return;
    setShowWorkoutPreferences(true);
  };

  const handleGenerateWithPreferences = async () => {
    setShowWorkoutPreferences(false);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/workout/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fitness_plan: ({
            'weight_loss': 'Cut',
            'muscle_gain': 'Bulk',
            'maintain': 'Recomp',
            'general_fitness': 'Lean'
          })[user?.fitness_goal] || 'Lean',
          days_per_week: workoutPreferences.daysPerWeek,
          location: workoutPreferences.location,
          is_athlete: workoutPreferences.isAthlete
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setWorkoutPlan(data);
        setSuccess('Workout plan generated successfully!');
        setActiveTab('workout');
      } else {
        const data = await response.json();
        let errorMsg = 'Failed to generate workout plan';
        if (typeof data.detail === 'string') errorMsg = data.detail;
        else if (Array.isArray(data.detail)) errorMsg = data.detail.map(e => e.msg).join(', ');
        else if (data.detail?.msg) errorMsg = data.detail.msg;
        setError(errorMsg);
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };


  const logWater = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/hydration/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_ml: 250,
          date: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHydration(prev => prev + 250);
        setSuccess(`Water logged! +${data.xp_earned} XP 💧`);
        setTimeout(() => setSuccess(null), 3000);

        // Refresh profile if leveled up
        if (data.new_level) fetchUserProfile();
      }
    } catch (err) {
      console.error("Error logging water:", err);
    }
  };





  const generateMealPlan = () => {
    if (!token) return;
    setActiveTab('meal_plan');
  };


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = Object.fromEntries(formData.entries());

    // Convert numbers
    if (updates.weight) updates.weight = parseFloat(updates.weight);
    if (updates.height) updates.height = parseFloat(updates.height);
    if (updates.age) updates.age = parseInt(updates.age);

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setSuccess('Profile updated!');
        setIsEditingProfile(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };


















  // ============================================
  // RENDER SECTIONS
  // ============================================
  const renderDashboard = () => (
    <div className="dashboard-grid animate-float">
      {/* Welcome & Stats */}
      <div className="glass-panel col-span-12" style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
              Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.username}</span>! 🚀
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Let's crush your goals today.</p>
          </div>
          <button onClick={() => setIsEditingProfile(true)} className="btn-secondary" style={{ padding: '10px 20px' }}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      <div className="glass-panel stats-card col-span-3">
        <span className="stats-label">Weight</span>
        <span className="stats-value" style={{ color: !user?.weight ? '#F43F5E' : 'inherit' }}>
          {user?.weight || 'N/A'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg</span>
        </span>
        {!user?.weight && <small style={{ color: '#F43F5E' }}>Profile Incorect</small>}
      </div>

      <div className="glass-panel stats-card col-span-3">
        <span className="stats-label">Height</span>
        <span className="stats-value" style={{ color: !user?.height ? '#F43F5E' : 'inherit' }}>
          {user?.height || 'N/A'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>cm</span>
        </span>
      </div>

      <div className="glass-panel stats-card col-span-3">
        <span className="stats-label">Goal</span>
        <span className="stats-value" style={{ fontSize: '1.2rem' }}>{user?.fitness_goal || 'Not Set'}</span>
      </div>

      <div className="glass-panel stats-card col-span-3">
        <span className="stats-label">Status</span>
        <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '1.2rem' }}>Active 🔥</div>
      </div>

      {/* Calorie Tracking Card */}
      <div className="glass-panel col-span-12" style={{ padding: '30px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>📊 Today's Nutrition</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
          {/* Calorie Goal */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Goal</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {user?.weight && user?.height && user?.age ?
                Math.round((10 * user.weight + 6.25 * user.height - 5 * user.age + 5) * 1.55 +
                  (user.fitness_goal === 'weight_loss' ? -500 : user.fitness_goal === 'muscle_gain' ? 400 : 0))
                : '2000'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</div>
          </div>

          {/* Consumed */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Consumed</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>0</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</div>
          </div>
        </div>

        {/* Today's Nutrition Summary — click through to full diary */}
        <div
          onClick={() => setActiveTab('nutrition')}
          style={{ cursor: 'pointer' }}
          title="Click to open Food Diary"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Today's Nutrition</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>View Full Diary →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Protein', color: '#10b981' },
              { label: 'Carbs',   color: '#3b82f6' },
              { label: 'Fats',    color: '#f59e0b' },
            ].map(({ label, color }) => (
              <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontWeight: 'bold', color }}>—</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Open the <strong style={{ color: 'var(--primary)' }}>Nutrition</strong> tab to log your meals and track macros.
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('nutrition')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            + Log Food
          </button>
          <button
            onClick={logWater}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>💧</span>
            <span>{hydration} / 2500ml</span>
            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(+250ml)</span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="glass-panel col-span-8" style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button className="btn-primary" onClick={generateWorkoutPlan} disabled={loading}>
            {loading ? 'Generating...' : '⚡ Generate Workout'}
          </button>
          <button className="btn-primary" onClick={generateMealPlan} disabled={loading} style={{ background: 'var(--secondary)' }}>
            🍎 Generate Meal Plan
          </button>
        </div>
      </div>

      <div className="glass-panel col-span-4" style={{ padding: '30px', background: 'rgba(139, 92, 246, 0.1)' }}>
        <h3>AI Coach</h3>
        <p style={{ margin: '15px 0', color: 'var(--text-muted)' }}>Need advice on form or diet?</p>
        <button className="btn-primary" onClick={() => setActiveTab('chat')} style={{ width: '100%' }}>
          Chat Now
        </button>
      </div>
    </div>
  );

  // renderWorkout moved to WorkoutLogger component



  return (
    <div className="App">
      {!token || !user ? (
        <Login onLogin={handleLoginSuccess} />
      ) : (
        <div className="app-container">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} onSettings={() => setShowSettings(true)} user={user} />

          <main className="main-content">
            {!backendConnected && (
              <div style={{ background: '#f43f5e', color: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                ⚠️ Backend connection lost. Attempting to reconnect...
              </div>
            )}
            {error && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', color: '#f43f5e', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                ✅ {success}
              </div>
            )}

            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'workout' && (
              <WorkoutLogger 
                API_URL={API_URL}
                token={token}
                setSuccess={setSuccess}
                setError={setError}
                fetchUserProfile={fetchUserProfile}
                generateWorkoutPlan={generateWorkoutPlan}
                workoutPlan={workoutPlan}
                setWorkoutPlan={setWorkoutPlan}
                setShowRestTimer={setShowRestTimer}
                setRestTimeLeft={setRestTimeLeft}
                showRestTimer={showRestTimer}
                loading={loading}
              />
            )}
            {activeTab === 'analytics' && (() => {
              console.log("🎯 Rendering AnalyticsDashboard with:", { hydration, fetchHydration: typeof fetchHydration });
              return (
                <AnalyticsDashboard
                  API_URL={API_URL}
                  onProfileUpdate={fetchUserProfile}
                  hydration={hydration}
                  refreshHydration={fetchHydration}
                />
              );
            })()}
            {activeTab === 'nutrition' && (
              <NutritionLogger 
                API_URL={API_URL} 
                token={token} 
                setSuccess={setSuccess} 
                setError={setError} 
              />
            )}
                        {activeTab === 'progress' && <AnalyticsDashboard API_URL={API_URL} onProfileUpdate={fetchUserProfile} />}
            {activeTab === 'meal_plan' && <MealPlanner API_URL={API_URL} token={token} setSuccess={setSuccess} setError={setError} />}
            {activeTab === 'chat' && <PSAICoach token={token} API_URL={API_URL} user={user} />}
          </main>
        </div>
      )}

      {showRestTimer && (
        <div className="glass-panel animate-float" style={{ position: 'fixed', bottom: '20px', right: '20px', width: '300px', padding: '20px', zIndex: 1000, border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>⏱️ Rest Timer</h4>
            <button onClick={() => setShowRestTimer(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
          <div style={{ fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '15px', color: restTimeLeft > 0 ? '#fff' : 'var(--text-muted)' }}>
            {Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button className="btn-glass" onClick={() => setRestTimeLeft(30)}>30s</button>
            <button className="btn-glass" onClick={() => setRestTimeLeft(60)}>60s</button>
            <button className="btn-glass" onClick={() => setRestTimeLeft(90)}>90s</button>
            <button className="btn-glass" onClick={() => setRestTimeLeft(120)}>2m</button>
          </div>
        </div>
      )}

      {isEditingProfile && <EditProfileModal user={user} onClose={() => setIsEditingProfile(false)} onUpdate={handleProfileUpdate} />}
      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onEditProfile={() => { setIsEditingProfile(true); setShowSettings(false); }} />}
      {showWorkoutPreferences && <WorkoutPreferencesModal preferences={workoutPreferences} setPreferences={setWorkoutPreferences} onClose={() => setShowWorkoutPreferences(false)} onGenerate={handleGenerateWithPreferences} />}
      {/* {showMealPlanModal && renderMealPlanModal()} Removed in favor of tab */}

      <OnboardingTour user={user} />
    </div>
  );
}

export default App;