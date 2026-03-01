import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Login from './Login';
import Sidebar from './Sidebar';
import PSAICoach from './components/PSAICoach';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OnboardingTour from './components/OnboardingTour';
import FoodLoggerModal from './components/FoodLoggerModal';


import { EXERCISE_DATABASE } from './data/exerciseDatabase';
import MuscleMap from './components/MuscleMap';

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
  const [mealPlan, setMealPlan] = useState(null); // Re-enabled
  const [groceryList, setGroceryList] = useState(null); // New
  // const [chatMessages, setChatMessages] = useState([]); // Removed
  // const [chatInput, setChatInput] = useState(''); // Removed
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showWorkoutPreferences, setShowWorkoutPreferences] = useState(false);
  const [workoutPreferences, setWorkoutPreferences] = useState({
    location: 'gym',
    daysPerWeek: 4,
    isAthlete: false
  });

  // Food tracking states
  const [foodEntries, setFoodEntries] = useState([]);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  // Workout tracking states
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState([]);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null); // New state for muscle map

  // Meal Plan Modal State
  const [mealPlanPreferences, setMealPlanPreferences] = useState({
    diet_type: 'balanced',
    target_calories: 2000,
    meals_per_day: 3
  });

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
  // Workout Helpers
  const filteredExercises = EXERCISE_DATABASE.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.category.toLowerCase().includes(exerciseSearch.toLowerCase());

    const matchesMuscle = selectedMuscleGroup ? ex.category === selectedMuscleGroup : true;

    return matchesSearch && matchesMuscle;
  });

  const handleAddSet = (exercise, weight, reps) => {
    if (!weight || !reps) return;
    setCurrentWorkout(prev => {
      const existingIdx = prev.findIndex(e => e.id === exercise.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          sets: [...updated[existingIdx].sets, { weight: parseFloat(weight), reps: parseInt(reps), id: Date.now() }]
        };
        return updated;
      } else {
        return [...prev, { ...exercise, sets: [{ weight: parseFloat(weight), reps: parseInt(reps), id: Date.now() }] }];
      }
    });
    setSuccess(`Added set for ${exercise.name}`);
    setTimeout(() => setSuccess(null), 1000);
  };

  const handleDeleteSet = (exerciseId, setId) => {
    setCurrentWorkout(prev => {
      return prev.map(ex => {
        if (ex.id === exerciseId) {
          return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
        }
        return ex;
      }).filter(ex => ex.sets.length > 0);
    });
  };

  const handleFinishWorkout = async () => {
    if (currentWorkout.length === 0) return;

    // Calculate total volume
    const volume = currentWorkout.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);

    try {
      // Get token
      const token = localStorage.getItem('token');
      if (!token) return;

      // Send to backend
      const response = await fetch(`${API_URL}/workout/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          exercises: currentWorkout,
          volume: volume
        })
      });

      if (!response.ok) throw new Error('Failed to save workout');
      const savedLog = await response.json();

      let successMsg = `Workout logged! +${savedLog.xp_earned || 0} XP 💪`;
      if (savedLog.level_up_message) {
        successMsg = savedLog.level_up_message;
        // You could trigger confetti here
      }

      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 5000);
      setCurrentWorkout([]);

      // Play Success Sound
      new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(e => console.log("Audio error", e)); // "Achievement Bell"

      // Refresh user profile (xp/level)
      fetchUserProfile();

    } catch (error) {
      console.error('Error saving workout:', error);
      setError('Failed to save workout. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

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



  const fetchTodayFoodLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/food/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFoodEntries(data); // Restore state
      }
    } catch (e) { console.error("Food logs fetch error", e); }
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

        fetchTodayFoodLogs(); // Fetch logs on load
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
  }, [token, user, fetchUserProfile, fetchTodayFoodLogs, fetchHydration, activeTab]);

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

  const handleConfirmGenerateMealPlan = async () => {
    // setShowMealPlanModal(false); // No longer needed
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/nutrition/meal-plan-new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealPlanPreferences),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.meal_plan) {
          setMealPlan(data.meal_plan); // Restored
          setSuccess('Meal plan generated!');
          setTimeout(() => setSuccess(null), 2000);
          // setActiveTab('nutrition'); // Removed to stay on current tab
        }
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.detail;
        if (!errorMessage) {
          errorMessage = JSON.stringify(errorData);
        } else if (typeof errorMessage !== 'string') {
          errorMessage = JSON.stringify(errorMessage);
        }
        setError(errorMessage || 'Failed to generate meal plan (Unknown Error)');
      }
    } catch (err) {
      setError('Network error');
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
        setShowAddFoodModal(false); // Reuse modal? No create new or just show in tab.
      }
    } catch (e) { setError("Failed to generate list"); }
    finally { setLoading(false); }
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

  // Food Database
  // Calculate totals from food entries

  // Calculate totals from food entries
  const calculateTotals = () => {
    return foodEntries.reduce((totals, entry) => ({
      calories: totals.calories + ((parseFloat(entry.calories) || 0) * (parseFloat(entry.servings) || 1)),
      protein: totals.protein + ((parseFloat(entry.protein) || 0) * (parseFloat(entry.servings) || 1)),
      carbs: totals.carbs + ((parseFloat(entry.carbs) || 0) * (parseFloat(entry.servings) || 1)),
      fats: totals.fats + ((parseFloat(entry.fats) || 0) * (parseFloat(entry.servings) || 1))
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };





  const handleDeleteFood = (id) => {
    setFoodEntries(foodEntries.filter(entry => entry.id !== id));
  };




  const renderEditProfileModal = () => (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '500px', padding: '30px', position: 'relative' }}>
        <button onClick={() => setIsEditingProfile(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Edit Profile</h2>

        <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '15px' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="full_name" defaultValue={user.full_name} placeholder="Full Name" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Age</label>
              <input name="age" type="number" defaultValue={user.age} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }} />
            </div>
            <div className="form-group">
              <label>Height (cm)</label>
              <input name="height" type="number" defaultValue={user.height} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }} />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input name="weight" type="number" defaultValue={user.weight} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Activity Level</label>
            <select name="activity_level" defaultValue={user.activity_level} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light Activity</option>
              <option value="moderate">Moderate Activity</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fitness Goal</label>
            <select name="fitness_goal" defaultValue={user.fitness_goal} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintain">Maintain Weight</option>
              <option value="general_fitness">General Fitness</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Save Changes</button>
        </form>
      </div>
    </div>
  );

  const [showSettings, setShowSettings] = useState(false);

  const renderSettingsModal = () => (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
        <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginBottom: '25px', color: 'var(--primary)' }}>👤 Profile & Settings</h2>

        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{user.username}</h3>
            <div style={{ color: 'var(--text-muted)' }}>Level {user.level || 1} • {user.streak_days || 0} Day Streak 🔥</div>
          </div>
        </div>

        {/* Achievements Section */}
        <h3 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🏆 Achievements</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {/* Mock Achievements for now if user.achievements is empty, else map them */}
          {[
            { id: 'early_bird', icon: '🐣', name: 'Early Bird', desc: 'Workout before 8am' },
            { id: 'heavy_lifter', icon: '🏋️', name: 'Heavy Lifter', desc: '5000kg Volume' },
            { id: 'streak_master', icon: '🔥', name: 'Streak Master', desc: '7 Day Streak' },
            { id: 'clean_eater', icon: '🥦', name: 'Clean Eater', desc: 'Perfect Macros' }
          ].map(ach => {
            const isUnlocked = (user.achievements || []).includes(ach.id);
            return (
              <div key={ach.id} style={{
                opacity: isUnlocked ? 1 : 0.4,
                filter: isUnlocked ? 'none' : 'grayscale(100%)',
                textAlign: 'center',
                padding: '10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: isUnlocked ? '1px solid #f59e0b' : '1px solid transparent'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '5px' }}>{ach.icon}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{ach.name}</div>
                {isUnlocked && <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Unlocked!</div>}
              </div>
            );
          })}
        </div>

        {/* Settings Section */}
        <h3 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>⚙️ Preferences</h3>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>🌙 Dark Mode</span>
            <input type="checkbox" checked readOnly style={{ accentColor: 'var(--primary)' }} />
          </label>
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>📏 Unit System</span>
            <select style={{ background: '#1a1a2e', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '5px', borderRadius: '5px' }}>
              <option value="metric">Metric (kg/cm)</option>
              <option value="imperial" disabled>Imperial (lbs/in)</option>
            </select>
          </label>
        </div>

        <button onClick={() => { setIsEditingProfile(true); setShowSettings(false); }} className="btn-glass" style={{ width: '100%', marginTop: '10px' }}>
          ✏️ Edit Profile Details
        </button>
      </div>
    </div>
  );

  const renderWorkoutPreferencesModal = () => (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '500px', padding: '30px', position: 'relative' }}>
        <button onClick={() => setShowWorkoutPreferences(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>🏋️ Workout Preferences</h2>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>Where do you want to train?</label>
            <select
              value={workoutPreferences.location}
              onChange={(e) => setWorkoutPreferences({ ...workoutPreferences, location: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '1rem' }}
            >
              <option value="gym">🏢 Gym (Full Equipment)</option>
              <option value="home">🏠 Home (Minimal Equipment)</option>
              <option value="athlete">⚡ Athletic Training</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={workoutPreferences.isAthlete}
                onChange={(e) => setWorkoutPreferences({ ...workoutPreferences, isAthlete: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ color: 'var(--text-main)' }}>I'm training as an athlete (High intensity)</span>
            </label>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>How many days per week?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[3, 4, 5, 6].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWorkoutPreferences({ ...workoutPreferences, daysPerWeek: days })}
                  style={{
                    padding: '15px',
                    borderRadius: '12px',
                    background: workoutPreferences.daysPerWeek === days ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    border: workoutPreferences.daysPerWeek === days ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {days}
                </button>
              ))}
            </div>
            <small style={{ color: 'var(--text-muted)', marginTop: '5px', display: 'block' }}>
              {workoutPreferences.daysPerWeek} days/week selected
            </small>
          </div>

          <button
            onClick={handleGenerateWithPreferences}
            className="btn-primary"
            style={{ marginTop: '10px', padding: '15px', fontSize: '1.1rem' }}
          >
            ⚡ Generate My Plan
          </button>
        </div>
      </div>
    </div>
  );

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
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{Math.round(calculateTotals().calories)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</div>
          </div>

          {/* Remaining */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Remaining</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
              {(() => {
                const goal = user?.weight && user?.height && user?.age ?
                  Math.round((10 * user.weight + 6.25 * user.height - 5 * user.age + 5) * 1.55 +
                    (user.fitness_goal === 'weight_loss' ? -500 : user.fitness_goal === 'muscle_gain' ? 400 : 0))
                  : 2000;
                return Math.max(0, goal - Math.round(calculateTotals().calories));
              })()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</div>
          </div>

          {/* Progress Ring */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '8px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {(() => {
                  const goal = user?.weight && user?.height && user?.age ?
                    Math.round((10 * user.weight + 6.25 * user.height - 5 * user.age + 5) * 1.55 +
                      (user.fitness_goal === 'weight_loss' ? -500 : user.fitness_goal === 'muscle_gain' ? 400 : 0))
                    : 2000;
                  return Math.min(100, Math.round((calculateTotals().calories / goal) * 100));
                })()}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>of goal</div>
            </div>
          </div>
        </div>

        {/* Macro Breakdown */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>Macros</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            {/* Protein */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Protein</span>
                <span style={{ fontWeight: 'bold' }}>{Math.round(calculateTotals().protein)} / {user?.weight ? Math.round(user.weight * 2.0) : 150}g</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (calculateTotals().protein / (user?.weight ? user.weight * 2.0 : 150)) * 100)}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carbs</span>
                <span style={{ fontWeight: 'bold' }}>{Math.round(calculateTotals().carbs)} / 250g</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (calculateTotals().carbs / 250) * 100)}%`, height: '100%', background: '#06b6d4', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {/* Fats */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fats</span>
                <span style={{ fontWeight: 'bold' }}>{Math.round(calculateTotals().fats)} / 65g</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (calculateTotals().fats / 65) * 100)}%`, height: '100%', background: '#f43f5e', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          </div>
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
            + Add Food
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

  const renderWorkout = () => (
    <div className="glass-panel animate-float" style={{ padding: '30px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>🏋️ Workout Logger</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={generateWorkoutPlan}
            className="btn-primary"
            disabled={loading}
            style={{ background: 'var(--secondary)' }}
          >
            ⚡ AI Generate Plan
          </button>
          <button
            onClick={() => setShowRestTimer(!showRestTimer)}
            className="btn-glass"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ⏱️ {showRestTimer ? 'Hide Timer' : 'Rest Timer'}
          </button>
          <button
            onClick={handleFinishWorkout}
            className="btn-primary"
            disabled={currentWorkout.length === 0}
            style={{ opacity: currentWorkout.length === 0 ? 0.5 : 1 }}
          >
            ✅ Finish Workout
          </button>
        </div>
      </div>

      {/* AI Plan View */}
      {workoutPlan && (
        <div className="glass-panel" style={{ marginBottom: '30px', padding: '20px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>✨ AI Plan: {workoutPlan.plan_name}</h3>
            <button
              className="btn-glass"
              onClick={() => setWorkoutPlan(null)}
              style={{ fontSize: '0.8rem' }}
            >
              Close Plan
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {workoutPlan.workouts?.map((day, i) => (
              <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#fff', fontSize: '1.1rem', display: 'block', marginBottom: '10px' }}>Day {day.day}: {day.name}</strong>
                <div style={{ display: 'grid', gap: '5px' }}>
                  {day.exercises?.map((ex, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <span>{ex.name}</span>
                      <span>{ex.sets}x{ex.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
        {/* LEFT: Exercise Search & List */}
        <div>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>
            <input
              placeholder="Search exercises (e.g., Bench Press)..."
              value={exerciseSearch}
              onChange={(e) => {
                setExerciseSearch(e.target.value);
                if (e.target.value) setSelectedMuscleGroup(null); // Clear map selection on search
              }}
              style={{
                width: '100%',
                padding: '15px 15px 15px 45px',
                borderRadius: '15px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          {!selectedMuscleGroup && !exerciseSearch ? (
            // SHOW MUSCLE MAP
            <div className="glass-panel" style={{ padding: '0' }}>
              <h3 style={{ textAlign: 'center', paddingTop: '20px', color: 'var(--primary)' }}>Select Muscle Group</h3>
              <MuscleMap onSelectMuscle={(muscle) => setSelectedMuscleGroup(muscle)} />
            </div>
          ) : (
            // SHOW EXERCISE LIST
            <div className="glass-panel" style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>
                  {selectedMuscleGroup ? `${selectedMuscleGroup} Exercises` : 'Search Results'}
                </h3>
                {selectedMuscleGroup && (
                  <button
                    onClick={() => setSelectedMuscleGroup(null)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Body Map
                  </button>
                )}
              </div>

              {filteredExercises.length > 0 ? (
                filteredExercises.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex)}
                    style={{
                      padding: '15px',
                      background: selectedExercise?.id === ex.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: selectedExercise?.id === ex.id ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{ex.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {ex.equipment} • {ex.difficulty}
                      </div>

                    </div>
                    {selectedExercise?.id === ex.id && <span style={{ color: '#8b5cf6' }}>●</span>}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No exercises found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Logger Area */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '20px' }}>
          {selectedExercise ? (
            <div>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📝 Log: <span style={{ color: 'var(--primary)' }}>{selectedExercise.name}</span>
              </h3>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input id="set-weight" type="number" placeholder="kg" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <input id="set-reps" type="number" placeholder="reps" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <button
                  className="btn-primary"
                  onClick={() => {
                    const w = document.getElementById('set-weight').value;
                    const r = document.getElementById('set-reps').value;
                    handleAddSet(selectedExercise, w, r);
                    document.getElementById('set-reps').focus();
                  }}
                >
                  + Add Set
                </button>
              </div>

              {/* Preview Current Sets for this exercise in workout */}
              <div>
                {currentWorkout.find(e => e.id === selectedExercise.id)?.sets.map((set, idx) => (
                  <div key={set.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>Set {idx + 1}</span>
                    <span>{set.weight}kg x {set.reps}</span>
                    <span
                      style={{ color: '#ef4444', cursor: 'pointer' }}
                      onClick={() => handleDeleteSet(selectedExercise.id, set.id)}
                    >×</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👈</div>
              Select an exercise to start logging sets
            </div>
          )}

          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0' }} />

          {/* Current Workout Summary */}
          <h3>⏱️ Current Session Volume: <span style={{ color: '#10b981' }}>{currentWorkout.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0)} kg</span></h3>
          <div style={{ marginTop: '15px' }}>
            {currentWorkout.map(ex => (
              <div key={ex.id} style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {ex.sets.length} sets of {ex.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );



  const renderSmartPlanSection = () => {
    if (!mealPlan && !groceryList) return null;
    return (
      <div className="glass-panel" style={{ marginBottom: '30px', setPadding: '20px', border: '1px solid var(--primary)', background: 'rgba(139, 92, 246, 0.05)' }}>
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
            {/* Summary Card */}
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

  const renderMealPlanUI = () => {
    if (mealPlan) {
      return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {renderSmartPlanSection()}
        </div>
      );
    }

    return (
      <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2rem' }}>🍎</span> Meal Plan Generator
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          Create a personalized daily meal plan based on your diet preferences and calorie goals.
        </p>

        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'grid', gap: '25px' }}>

            {/* Diet Type */}
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

            {/* Target Calories */}
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

            {/* Meals Per Day */}
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
              {loading ? (
                <>⚙️ Generating Plan...</>
              ) : (
                <>✨ Generate Personalized Plan</>
              )}
            </button>
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
            {activeTab === 'workout' && renderWorkout()}
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
              <div className="glass-panel" style={{ padding: '30px', minHeight: '80vh' }}>
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

                {/* Today's Meals */}
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Today's Meals</h3>

                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                    const mealFoods = foodEntries.filter(entry => entry.meal === mealType);
                    const mealCalories = mealFoods.reduce((sum, entry) => sum + (entry.calories * entry.servings), 0);



                    return (
                      <div key={mealType} style={{ marginBottom: '25px' }}>
                        <div style={{
                          padding: '15px 20px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mealFoods.length > 0 ? '15px' : '0' }}>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                              {mealType === 'breakfast' ? '🌅 Breakfast' : mealType === 'lunch' ? '☀️ Lunch' : mealType === 'dinner' ? '🌙 Dinner' : '🍪 Snacks'}
                            </h4>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{Math.round(mealCalories)} kcal</span>
                          </div>

                          {mealFoods.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>No foods logged yet</p>
                          ) : (
                            <div style={{ display: 'grid', gap: '10px' }}>
                              {mealFoods.map(entry => (
                                <div key={entry.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                                      {entry.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({entry.servings || 1}x)</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {Math.round(entry.calories * (entry.servings || 1))} cal •
                                      P: {(entry.protein * (entry.servings || 1)).toFixed(1)}g •
                                      C: {(entry.carbs * (entry.servings || 1)).toFixed(1)}g •
                                      F: {(entry.fats * (entry.servings || 1)).toFixed(1)}g
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteFood(entry.id)}
                                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#f43f5e', cursor: 'pointer', fontSize: '0.85rem' }}
                                  >
                                    Delete
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
              </div>
            )}
            {activeTab === 'progress' && <AnalyticsDashboard API_URL={API_URL} onProfileUpdate={fetchUserProfile} />}
            {activeTab === 'meal_plan' && renderMealPlanUI()}
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

      {isEditingProfile && renderEditProfileModal()}
      {showSettings && renderSettingsModal()}
      {showWorkoutPreferences && renderWorkoutPreferencesModal()}
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
      {/* {showMealPlanModal && renderMealPlanModal()} Removed in favor of tab */}

      <OnboardingTour user={user} />
    </div>
  );
}

export default App;