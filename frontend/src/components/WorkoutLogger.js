import React, { useState, useEffect } from 'react';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import MuscleMap from './MuscleMap';

const WorkoutLogger = ({
  API_URL,
  token,
  setSuccess,
  setError,
  fetchUserProfile,
  generateWorkoutPlan,
  workoutPlan,
  setWorkoutPlan,
  setShowRestTimer,
  setRestTimeLeft,
  showRestTimer,
  loading
}) => {
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState(() => {
    const saved = localStorage.getItem('currentWorkout');
    if (saved) return JSON.parse(saved);
    return [];
  });
  
  // Track inputs per active exercise to easily handle Smart Defaults
  const [currentInputs, setCurrentInputs] = useState({ weight: '', reps: '' });

  // Save to local storage automatically
  useEffect(() => {
    localStorage.setItem('currentWorkout', JSON.stringify(currentWorkout));
  }, [currentWorkout]);

  // When selected exercise changes, check if we have previous data (Smart Defaults mock)
  useEffect(() => {
    if (selectedExercise) {
      // In a real app we'd fetch this from the backend. 
      // For now, we mock a previous record for UX.
      setCurrentInputs({ weight: '20', reps: '10' }); 
    }
  }, [selectedExercise]);

  const filteredExercises = EXERCISE_DATABASE.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.category.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscle = selectedMuscleGroup ? ex.category === selectedMuscleGroup : true;
    return matchesSearch && matchesMuscle;
  });

  const handleAddAndCompleteSet = () => {
    const { weight, reps } = currentInputs;
    if (!weight || !reps || !selectedExercise) return;

    setCurrentWorkout(prev => {
      const existingIdx = prev.findIndex(e => e.id === selectedExercise.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          sets: [...updated[existingIdx].sets, { weight: parseFloat(weight), reps: parseInt(reps), id: Date.now(), completed: true }]
        };
        return updated;
      } else {
        return [...prev, { ...selectedExercise, sets: [{ weight: parseFloat(weight), reps: parseInt(reps), id: Date.now(), completed: true }] }];
      }
    });

    // UX Feature: Auto-Rest Timer
    setShowRestTimer(true);
    setRestTimeLeft(60); // 60s default rest

    // Haptic feedback if supported
    if (window.navigator && window.navigator.vibrate) {
       window.navigator.vibrate(50);
    }
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
    
    // Simulate Snackbar for undo (Mock logic)
    setSuccess("Set deleted [UNDO]");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleFinishWorkout = async () => {
    if (currentWorkout.length === 0) return;
    const volume = currentWorkout.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);

    try {
      if (!token) return;

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
      }

      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 5000);
      
      setCurrentWorkout([]);
      localStorage.removeItem('currentWorkout');

      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.play().catch(e => console.log("Audio error", e));

      fetchUserProfile();
    } catch (error) {
      console.error('Error saving workout:', error);
      setError('Failed to save workout. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="glass-panel animate-float" style={{ padding: '30px', minHeight: '80vh', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🏋️ Workout Logger</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={generateWorkoutPlan} className="btn-primary" disabled={loading} style={{ background: 'var(--secondary)' }}>
            ⚡ AI Generate Plan
          </button>
          <button onClick={() => setShowRestTimer(!showRestTimer)} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⏱️ {showRestTimer ? 'Hide Timer' : 'Rest Timer'}
          </button>
          <button
            onClick={handleFinishWorkout}
            className="btn-primary"
            disabled={currentWorkout.length === 0}
            style={{ opacity: currentWorkout.length === 0 ? 0.5 : 1, background: '#10b981', transform: 'scale(1.05)' }}
          >
            ✅ Finish Workout
          </button>
        </div>
      </div>

      {workoutPlan && (
        <div className="glass-panel" style={{ marginBottom: '30px', padding: '20px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>✨ AI Plan: {workoutPlan.plan_name}</h3>
            <button className="btn-glass" onClick={() => setWorkoutPlan(null)} style={{ fontSize: '0.8rem' }}>Close Plan</button>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }} className="workout-logger-grid">
        {/* LEFT: Exercise Search & List */}
        <div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>
            <input
              placeholder="Search exercises (e.g., Bench Press)..."
              value={exerciseSearch}
              onChange={(e) => {
                setExerciseSearch(e.target.value);
                if (e.target.value) setSelectedMuscleGroup(null);
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
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <h3 style={{ textAlign: 'center', paddingTop: '20px', color: 'var(--primary)' }}>Select Muscle Group</h3>
              <MuscleMap onSelectMuscle={(muscle) => setSelectedMuscleGroup(muscle)} />
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>
                  {selectedMuscleGroup ? `${selectedMuscleGroup} Exercises` : 'Search Results'}
                </h3>
                {selectedMuscleGroup && (
                  <button
                    onClick={() => setSelectedMuscleGroup(null)}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    ← Back
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
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.equipment} • {ex.difficulty}</div>
                    </div>
                    {selectedExercise?.id === ex.id && <span style={{ color: '#8b5cf6' }}>●</span>}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No exercises found.</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Logger Area */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '20px' }}>
          {selectedExercise ? (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                📝 Log: <span style={{ color: 'var(--primary)' }}>{selectedExercise.name}</span>
              </h3>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Weight (kg)</label>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={currentInputs.weight}
                    onChange={(e) => setCurrentInputs(p => ({ ...p, weight: e.target.value }))}
                    placeholder="Prev: 20" 
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.2rem', textAlign: 'center' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Reps</label>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    value={currentInputs.reps}
                    onChange={(e) => setCurrentInputs(p => ({ ...p, reps: e.target.value }))}
                    placeholder="Prev: 10" 
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.2rem', textAlign: 'center' }} 
                  />
                </div>
              </div>
              
              <button
                className="btn-primary"
                onClick={handleAddAndCompleteSet}
                style={{ width: '100%', padding: '16px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
              >
                ✓ Complete Set & Rest
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👈</div>
              Select an exercise to start logging sets
            </div>
          )}

          <div style={{ margin: '30px 0' }} />

          {/* Current Workout Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>⏱️ Today's Session</h3>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {currentWorkout.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0)} kg
            </span>
          </div>

          <div style={{ marginTop: '15px', display: 'grid', gap: '15px' }}>
            {currentWorkout.map(ex => (
              <div key={ex.id} className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '10px', fontSize: '1.1rem' }}>{ex.name}</strong>
                {ex.sets.map((set, idx) => (
                  <div key={set.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px 10px', 
                    background: set.completed ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    borderLeft: set.completed ? '3px solid #10b981' : '3px solid transparent',
                    borderRadius: '4px',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Set {idx + 1}</span>
                    <span style={{ fontSize: '1.1rem' }}>{set.weight}kg × {set.reps}</span>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer', padding: '0 10px' }}
                      onClick={() => handleDeleteSet(ex.id, set.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {currentWorkout.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>
                Session is empty.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogger;
