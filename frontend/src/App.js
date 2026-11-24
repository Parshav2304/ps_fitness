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
import { getApiUrl } from './utils/api';
import { FiZap, FiSettings, FiLogOut, FiPlus, FiActivity, FiDroplet, FiPieChart, FiTrendingUp } from 'react-icons/fi';

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
  const [todayNutrition, setTodayNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
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
        const response = await fetch(getApiUrl(API_URL, '/health/status'));
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

  // Auth Handlers
  const handleLoginSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setActiveTab('dashboard');
    triggerToast('Logged in successfully! Welcome back.', 'success');
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
    triggerToast('Logged out. See you soon!', 'info');
  }, [triggerToast]);

  // API Methods
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(API_URL, '/auth/me'), {
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
  }, [token, handleLogout, triggerToast]);

  const fetchHydration = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(getApiUrl(API_URL, '/nutrition/hydration'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHydration(data.total_ml ?? data.amount_ml ?? 0);
      }
    } catch (err) {
      console.error("Hydration fetch failed:", err);
    }
  }, [token]);

  const fetchTodayNutrition = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl(API_URL, '/food/today'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const tCalories = data.reduce((sum, e) => sum + ((e.calories || 0) * (e.servings || 1)), 0);
        const tProtein = data.reduce((sum, e) => sum + ((e.protein || 0) * (e.servings || 1)), 0);
        const tCarbs = data.reduce((sum, e) => sum + ((e.carbs || 0) * (e.servings || 1)), 0);
        const tFats = data.reduce((sum, e) => sum + ((e.fats || 0) * (e.servings || 1)), 0);
        setTodayNutrition({
          calories: Math.round(tCalories),
          protein: Math.round(tProtein),
          carbs: Math.round(tCarbs),
          fats: Math.round(tFats)
        });
      }
    } catch (err) {
      console.error("Today nutrition fetch error:", err);
    }
  }, [token]);

  // Profile, Hydration & Nutrition Loading
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchHydration();
      fetchTodayNutrition();
    }
  }, [token, fetchUserProfile, fetchHydration, fetchTodayNutrition]);

  const logWater = async (amount = 250) => {
    try {
      const response = await fetch(getApiUrl(API_URL, '/hydration/log'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount_ml: amount })
      });
      if (response.ok) {
        fetchHydration();
        triggerToast(`Logged ${amount}ml water 💧`, 'success');
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
      const response = await fetch(getApiUrl(API_URL, '/workout/generate'), {
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
        triggerToast('Personalized Training Split Generated!', 'success');
      } else {
        triggerToast('Failed to generate workout. Review metrics.', 'error');
      }
    } catch (err) {
      triggerToast('Error communicating with backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updates) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(API_URL, '/auth/me'), {
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

    // Dynamic Expenditure & Macro calculations (MacroFactor / Precision Nutrition standard)
    const weight = user?.weight || 70;
    const height = user?.height || 175;
    const age = user?.age || 25;
    const gender = user?.gender || 'male';
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5);
    const estimatedTdee = Math.round(bmr * 1.45);
    const goal = (user?.fitness_goal || '').toLowerCase();
    const goalOffset = goal.includes('loss') || goal.includes('lean') || goal.includes('cut') ? -400 : goal.includes('gain') || goal.includes('bulk') ? 350 : 0;
    const targetCalories = Math.max(1200, estimatedTdee + goalOffset);
    const targetProtein = Math.round(weight * 2.0);
    const targetFats = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.max(0, Math.round((targetCalories - (targetProtein * 4) - (targetFats * 9)) / 4));
    
    const consumedCalories = todayNutrition.calories;
    const remainingCalories = targetCalories - consumedCalories;
    const caloriePct = Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) || 0;
    const proteinPct = Math.min(100, Math.round((todayNutrition.protein / targetProtein) * 100)) || 0;
    const carbsPct = Math.min(100, Math.round((todayNutrition.carbs / targetCarbs) * 100)) || 0;
    const fatsPct = Math.min(100, Math.round((todayNutrition.fats / targetFats) * 100)) || 0;
    const waterTarget = user?.hydration_goal || 2500;
    const waterPct = Math.min(100, Math.round((hydration / waterTarget) * 100)) || 0;

    return (
      <div className="dashboard-grid animate-fade-in">
        {/* Welcome Banner */}
        <div className="glass-panel col-span-12" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--primary-dim)', padding: '3px 9px', borderRadius: '6px' }}>
                  ADAPTIVE METABOLISM & TRAINING
                </span>
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '6px', fontWeight: 800, color: '#fff' }}>
                Welcome back, <span>{user?.username}</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', fontWeight: '400' }}>
                Your adaptive nutrition and progressive overload dashboard is active and synchronized.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setIsEditingProfile(true)} className="btn-secondary">
                <FiSettings style={{ marginRight: '6px' }} /> Metrics & Goal
              </button>
              <button onClick={() => setActiveTab('workout')} className="btn-primary">
                <FiActivity style={{ marginRight: '6px' }} /> Start Workout
              </button>
            </div>
          </div>
        </div>

        {/* Primary Metrics Strip */}
        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Current Weight</span>
          <span className="stats-value">
            {user?.weight || '—'} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '500' }}>kg</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Target: {user?.fitness_goal || 'Lean'}</span>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Estimated TDEE</span>
          <span className="stats-value" style={{ color: '#38bdf8' }}>
            {estimatedTdee} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '500' }}>kcal/day</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Dynamic Expenditure</span>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Daily Calorie Target</span>
          <span className="stats-value" style={{ color: 'var(--primary)' }}>
            {targetCalories} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '500' }}>kcal</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: goalOffset < 0 ? '#f43f5e' : goalOffset > 0 ? '#10b981' : 'var(--text-muted)', marginTop: '4px' }}>
            {goalOffset < 0 ? `${goalOffset} kcal Deficit` : goalOffset > 0 ? `+${goalOffset} kcal Surplus` : 'Maintenance'}
          </span>
        </div>

        <div className="glass-panel stats-card col-span-3">
          <span className="stats-label">Training Level</span>
          <span className="stats-value" style={{ color: '#f59e0b' }}>
            Lvl {user?.level || 1}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {user?.xp || 0} XP Accumulated
          </span>
        </div>

        {/* MacroFactor-Style High-Density Adherence Engine */}
        <div className="glass-panel col-span-8" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
                Nutrition & Macro Adherence
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                High-precision tracking vs your metabolic targets
              </p>
            </div>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              padding: '6px 12px', 
              borderRadius: '20px',
              background: remainingCalories >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: remainingCalories >= 0 ? '#10b981' : '#f43f5e',
              border: `1px solid ${remainingCalories >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
            }}>
              {remainingCalories >= 0 ? `${remainingCalories} kcal Remaining` : `${Math.abs(remainingCalories)} kcal Over Target`}
            </span>
          </div>

          {/* Calorie Progress Overview */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <div>
                <span className="tabular-nums" style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit', color: 'var(--text-main)' }}>{consumedCalories}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '6px' }}>/ {targetCalories} kcal consumed</span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>{caloriePct}%</span>
            </div>
            <div className="macro-progress-track" style={{ height: '10px' }}>
              <div className="macro-progress-fill" style={{ width: `${caloriePct}%`, background: 'var(--gradient-main)' }}></div>
            </div>
          </div>

          {/* 3 Macro Progress Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Protein */}
            <div className="macro-bar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>Protein</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{proteinPct}%</span>
              </div>
              <div>
                <span className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit' }}>{todayNutrition.protein}g</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>/ {targetProtein}g</span>
              </div>
              <div className="macro-progress-track">
                <div className="macro-progress-fill" style={{ width: `${proteinPct}%`, background: '#10b981' }}></div>
              </div>
            </div>

            {/* Carbs */}
            <div className="macro-bar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>Carbs</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{carbsPct}%</span>
              </div>
              <div>
                <span className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit' }}>{todayNutrition.carbs}g</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>/ {targetCarbs}g</span>
              </div>
              <div className="macro-progress-track">
                <div className="macro-progress-fill" style={{ width: `${carbsPct}%`, background: '#38bdf8' }}></div>
              </div>
            </div>

            {/* Fats */}
            <div className="macro-bar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' }}>Fats</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fatsPct}%</span>
              </div>
              <div>
                <span className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit' }}>{todayNutrition.fats}g</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>/ {targetFats}g</span>
              </div>
              <div className="macro-progress-track">
                <div className="macro-progress-fill" style={{ width: `${fatsPct}%`, background: '#f59e0b' }}></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('nutrition')} className="btn-primary" style={{ padding: '10px 20px' }}>
              <FiPlus style={{ marginRight: '6px' }} /> Log Food & Macros
            </button>
            <button onClick={() => setActiveTab('meal_plan')} className="btn-secondary" style={{ padding: '10px 20px' }}>
              <FiPieChart style={{ marginRight: '6px' }} /> Open Meal Architecture
            </button>
          </div>
        </div>

        {/* Right Side Column: Hydration & Quick Actions */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Hydration Tracker Card */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiDroplet style={{ color: '#38bdf8', fontSize: '1.2rem' }} />
                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>Hydration Index</h4>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8' }}>{waterPct}%</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit' }}>
                {hydration} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ {waterTarget} ml</span>
              </div>
            </div>

            <div className="macro-progress-track" style={{ height: '8px', marginBottom: '20px' }}>
              <div className="macro-progress-fill" style={{ width: `${waterPct}%`, background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => logWater(250)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                + 250ml
              </button>
              <button onClick={() => logWater(500)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                + 500ml
              </button>
            </div>
          </div>

          {/* Intelligent Insights & Fast Navigation */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FiZap style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
              <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Training & Body Insights</h4>
            </div>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: '1.5' }}>
              Log session volumes, track strength trends via Epley 1RM, or analyze macro compliance.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-primary" onClick={generateWorkoutPlan} style={{ width: '100%', justifyContent: 'center' }}>
                Dynamic Training Split
              </button>
              <button className="btn-secondary" onClick={() => setActiveTab('analytics')} style={{ width: '100%', justifyContent: 'center' }}>
                <FiTrendingUp style={{ marginRight: '6px' }} /> Analytics & Composition
              </button>
              <button className="btn-glass" onClick={() => setActiveTab('chat')} style={{ width: '100%', justifyContent: 'center' }}>
                Consult Coach & Chat
              </button>
            </div>
          </div>
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