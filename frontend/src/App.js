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
import { FiZap, FiSettings, FiLogOut } from 'react-icons/fi';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Floating Toast Notifications List
  const [toasts, setToasts] = useState([]);
  
  // Modals & UI State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkoutPreferences, setShowWorkoutPreferences] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  // Feature Data
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [hydration, setHydration] = useState(0);
  const [workoutPreferences, setWorkoutPreferences] = useState({
    days_per_week: 4,
    location: 'gym',
    is_athlete: false
  });

  // ============================================
  // TOAST HANDLER
  // ============================================
  const triggerToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ============================================
  // INITIALIZATION & SIDE EFFECTS
  // ============================================
  
  // Load Active Theme on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('user-theme') || 'violet';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Backend Health Check
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health/status`);
        if (response.ok) {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (err) {
        setBackendConnected(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Profile & Hydration Loading
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchHydration();
    }
  }, [token]);

  // Auth Handlers
  const handleLoginSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setActiveTab('dashboard');
    triggerToast('Logged in successfully! Welcome back.', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
    triggerToast('Logged out. See you soon!', 'info');
  };

  // API Methods
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      triggerToast('Failed to load user profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHydration = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/nutrition/hydration`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHydration(data.amount_ml);
      }
    } catch (err) {
      console.error("Hydration fetch failed:", err);
    }
  }, [token]);

  const logWater = async () => {
    try {
      // FIX: Align route to backend '/api/hydration/log'
      const response = await fetch(`${API_URL}/api/hydration/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount_ml: 250 })
      });
      if (response.ok) {
        fetchHydration();
        triggerToast('Logged 250ml water 💧', 'success');
      }
    } catch (err) {
      triggerToast('Failed to log water intake.', 'error');
    }
  };

  const generateWorkoutPlan = async () => {
    setShowWorkoutPreferences(true);
  };

  const handleGenerateWithPreferences = async () => {
    try {
      setLoading(true);
      setShowWorkoutPreferences(false);
      // FIX: Align route to backend '/api/workout/generate'
      const response = await fetch(`${API_URL}/api/workout/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...workoutPreferences,
          fitness_plan: user?.fitness_goal || 'Lean'
        })
      });
      if (response.ok) {
        const data = await response.json();
        setWorkoutPlan(data);
        setActiveTab('workout');
        triggerToast('AI Workout Plan Generated!', 'success');
      } else {
        triggerToast('Failed to generate workout. Review metrics.', 'error');
      }
    } catch (err) {
      triggerToast('Error communicating with backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateMealPlan = async () => {
    setActiveTab('meal_plan');
  };

  const handleProfileUpdate = async (updates) => {
    try {
      setLoading(true);
      // FIX: Align route to backend '/api/auth/me'
      const response = await fetch(`${API_URL}/api/auth/me`, {
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
        triggerToast('Profile successfully updated!', 'success');
        setIsEditingProfile(false);
      } else {
        triggerToast('Failed to update profile info.', 'error');
      }
    } catch (err) {
      triggerToast('Network error during profile update.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER SECTIONS
  // ============================================
  const renderDashboard = () => {
    if (loading && !user) {
      return (
        <div className="dashboard-grid animate-fade-in">
          <div className="glass-panel col-span-12" style={{ padding: '40px' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-span-3 skeleton-card">
              <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
              <div className="skeleton skeleton-title" style={{ width: '70%', margin: 0 }}></div>
            </div>
          ))}
          <div className="glass-panel col-span-12" style={{ padding: '40px', height: '200px' }}>
            <div className="skeleton skeleton-title" style={{ width: '30%' }}></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-grid animate-fade-in">
        {/* Welcome & Stats */}
        <div className="glass-panel col-span-12" style={{ padding: '36px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                Welcome back, <span style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.username}</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>Here is your daily fitness summary.</p>
            </div>
            <button onClick={() => setIsEditingProfile(true)} className="btn-secondary">
              Edit Profile
            </button>
          </div>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Weight</span>
          <span className="stats-value">
            {user?.weight || 'N/A'} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '500' }}>kg</span>
          </span>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Height</span>
          <span className="stats-value">
            {user?.height || 'N/A'} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '500' }}>cm</span>
          </span>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Goal</span>
          <span className="stats-value" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{user?.fitness_goal || 'Not Set'}</span>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Level / XP</span>
          <span className="stats-value" style={{ color: 'var(--primary)' }}>
            Lvl {user?.level || 1}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            {user?.xp || 0} total XP
          </span>
        </div>

        {/* Calorie Tracking Card */}
        <div className="glass-panel col-span-12" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Today's Nutrition Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {[
              { label: 'Protein Target', color: 'var(--success)', val: user?.weight ? `${user.weight * 2}g` : '—' },
              { label: 'Calorie Target', color: 'var(--primary)', val: user?.weight && user?.height && user?.age ? `${Math.round((10 * user.weight + 6.25 * user.height - 5 * user.age + 5) * 1.55)} kcal` : '—' },
              { label: 'Water Consumed', color: 'var(--secondary)', val: `${hydration}ml` },
            ].map(({ label, color, val }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color, fontFamily: 'Outfit, sans-serif' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('nutrition')} className="btn-primary">
              Open Nutrition Log
            </button>
            <button onClick={logWater} className="btn-secondary">
              Log 250ml Water
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-panel col-span-8" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Quick Planners</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={generateWorkoutPlan}>
              AI Workout Generator
            </button>
            <button className="btn-primary" onClick={generateMealPlan} style={{ background: 'var(--gradient-main)' }}>
              AI Meal Planner
            </button>
          </div>
        </div>

        <div className="glass-panel col-span-4" style={{ padding: '30px', background: 'rgba(168, 85, 247, 0.03)', borderColor: 'rgba(168, 85, 247, 0.1)' }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: '700' }}>AI Coach</h3>
          <p style={{ margin: '12px 0 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ask questions, log food pictures, analyze plans.</p>
          <button className="btn-primary" onClick={() => setActiveTab('chat')} style={{ width: '100%' }}>
            Start Chat
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {!token || !user ? (
        <Login onLogin={handleLoginSuccess} />
      ) : (
        <div className="app-container">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} onSettings={() => setShowSettings(true)} user={user} />

          <main className="main-content">
            {token && user && (
              <div className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiZap size={18} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 6px var(--primary-glow))' }} />
                  <span style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '1.2rem', background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PS Fitness</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <FiSettings size={18} />
                  </button>
                  <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <FiLogOut size={18} />
                  </button>
                </div>
              </div>
            )}

            {!backendConnected && (
              <div style={{ background: '#f43f5e', color: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                ⚠️ Backend connection lost. Attempting to reconnect...
              </div>
            )}

            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'workout' && (
              <WorkoutLogger 
                API_URL={API_URL}
                token={token}
                setSuccess={(msg) => triggerToast(msg, 'success')}
                setError={(err) => triggerToast(err, 'error')}
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
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                API_URL={API_URL}
                onProfileUpdate={fetchUserProfile}
                hydration={hydration}
                refreshHydration={fetchHydration}
              />
            )}
            {activeTab === 'nutrition' && (
              <NutritionLogger 
                API_URL={API_URL} 
                token={token} 
                setSuccess={(msg) => triggerToast(msg, 'success')}
                setError={(err) => triggerToast(err, 'error')}
              />
            )}
            {activeTab === 'progress' && <AnalyticsDashboard API_URL={API_URL} onProfileUpdate={fetchUserProfile} />}
            {activeTab === 'meal_plan' && (
              <MealPlanner 
                API_URL={API_URL} 
                token={token} 
                setSuccess={(msg) => triggerToast(msg, 'success')} 
                setError={(err) => triggerToast(err, 'error')} 
              />
            )}
            {activeTab === 'chat' && <PSAICoach token={token} API_URL={API_URL} user={user} />}
          </main>
        </div>
      )}

      {/* Floating Rest Timer */}
      {showRestTimer && (
        <div className="glass-panel" style={{ position: 'fixed', bottom: '20px', right: '20px', width: '300px', padding: '20px', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>⏱️ Rest Timer</h4>
            <button onClick={() => setShowRestTimer(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
          <div style={{ fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '15px' }}>
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

      {/* Modals */}
      {isEditingProfile && <EditProfileModal user={user} onClose={() => setIsEditingProfile(false)} onUpdate={handleProfileUpdate} />}
      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onEditProfile={() => { setIsEditingProfile(true); setShowSettings(false); }} />}
      {showWorkoutPreferences && <WorkoutPreferencesModal preferences={workoutPreferences} setPreferences={setWorkoutPreferences} onClose={() => setShowWorkoutPreferences(false)} onGenerate={handleGenerateWithPreferences} />}

      {/* Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-message toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="toast-text">{t.message}</span>
          </div>
        ))}
      </div>

      <OnboardingTour user={user} />
    </div>
  );
}

export default App;