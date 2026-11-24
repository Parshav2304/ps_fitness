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
  
  // Track inputs per active exercise to handle weight, reps, and RPE
  const [currentInputs, setCurrentInputs] = useState({ weight: '', reps: '', rpe: '8' });

  // Save to local storage automatically
  useEffect(() => {
    localStorage.setItem('currentWorkout', JSON.stringify(currentWorkout));
  }, [currentWorkout]);

  // When selected exercise changes, prep default values based on history or defaults
  useEffect(() => {
    if (selectedExercise) {
      const existingInCurrent = currentWorkout.find(ex => ex.id === selectedExercise.id);
      if (existingInCurrent && existingInCurrent.sets.length > 0) {
        const lastSet = existingInCurrent.sets[existingInCurrent.sets.length - 1];
        setCurrentInputs({ weight: String(lastSet.weight), reps: String(lastSet.reps), rpe: String(lastSet.rpe || 8) });
      } else {
        setCurrentInputs({ weight: '60', reps: '10', rpe: '8' });
      }
    }
  }, [selectedExercise, currentWorkout]);

  const filteredExercises = EXERCISE_DATABASE.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.category.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscle = selectedMuscleGroup ? ex.category === selectedMuscleGroup : true;
    return matchesSearch && matchesMuscle;
  });

  const handleAddAndCompleteSet = () => {
    const { weight, reps, rpe } = currentInputs;
    if (!weight || !reps || !selectedExercise) return;

    const parsedWeight = parseFloat(weight);
    const parsedReps = parseInt(reps);
    const parsedRpe = parseFloat(rpe || 8);
    
    // Epley Formula for 1RM estimation: 1RM = weight * (1 + reps/30)
    const estimated1RM = Math.round(parsedWeight * (1 + parsedReps / 30.0));

    const newSet = {
      id: Date.now(),
      weight: parsedWeight,
      reps: parsedReps,
      rpe: parsedRpe,
      estimated1RM,
      completed: true
    };

    setCurrentWorkout(prev => {
      const existingIdx = prev.findIndex(e => e.id === selectedExercise.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          sets: [...updated[existingIdx].sets, newSet]
        };
        return updated;
      } else {
        return [...prev, { ...selectedExercise, sets: [newSet] }];
      }
    });

    // Auto-Rest Timer
    setShowRestTimer(true);
    setRestTimeLeft(60);

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
    
    setSuccess("Set deleted");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleFinishWorkout = async () => {
    if (currentWorkout.length === 0) return;
    const volume = currentWorkout.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);

    try {
      if (!token) return;

      const endpoint = API_URL.endsWith('/api') ? `${API_URL}/workout/log` : `${API_URL}/api/workout/log`;

      const response = await fetch(endpoint, {
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
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              placeholder="Search exercises (e.g., Bench Press)..."
              value={exerciseSearch}
              onChange={(e) => {
                setExerciseSearch(e.target.value);
                if (e.target.value) setSelectedMuscleGroup(null);
              }}
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {!selectedMuscleGroup && !exerciseSearch ? (
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <h3 style={{ textAlign: 'center', paddingTop: '18px', color: 'var(--text-main)', fontSize: '1.05rem' }}>Select Muscle Group</h3>
              <MuscleMap onSelectMuscle={(muscle) => setSelectedMuscleGroup(muscle)} />
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '16px', maxHeight: '580px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                  {selectedMuscleGroup ? `${selectedMuscleGroup} Exercises` : 'Search Results'}
                </h3>
                {selectedMuscleGroup && (
                  <button
                    onClick={() => setSelectedMuscleGroup(null)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Back
                  </button>
                )}
              </div>

              {filteredExercises.length > 0 ? (
                filteredExercises.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex)}
                    style={{
                      padding: '12px 14px',
                      background: selectedExercise?.id === ex.id ? 'var(--primary-dim)' : 'rgba(255,255,255,0.02)',
                      border: selectedExercise?.id === ex.id ? '1px solid var(--primary-border)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '3px', fontSize: '0.94rem' }}>{ex.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ex.equipment} • {ex.difficulty}</div>
                    </div>
                    {selectedExercise?.id === ex.id && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700' }}>ACTIVE</span>}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exercises found.</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Logger Area */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {selectedExercise ? (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '12px', fontSize: '1.15rem' }}>
                Log Set: <span style={{ color: 'var(--primary)' }}>{selectedExercise.name}</span>
              </h3>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>Weight (kg)</label>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={currentInputs.weight}
                    onChange={(e) => setCurrentInputs(p => ({ ...p, weight: e.target.value }))}
                    placeholder="20" 
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>Reps</label>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    value={currentInputs.reps}
                    onChange={(e) => setCurrentInputs(p => ({ ...p, reps: e.target.value }))}
                    placeholder="10" 
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700' }} 
                  />
                </div>
              </div>
              
              <button
                className="btn-primary"
                onClick={handleAddAndCompleteSet}
                style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
              >
                Complete Set & Rest
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Select an exercise from the left to begin logging sets.
            </div>
          )}

          <div style={{ margin: '24px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Current Workout Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Today's Session</h3>
            <span style={{ color: '#10b981', fontWeight: '700', fontSize: '1.05rem', fontVariantNumeric: 'tabular-nums' }}>
              {currentWorkout.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0)} kg total
            </span>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {currentWorkout.map(ex => (
              <div key={ex.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '8px', fontSize: '0.95rem' }}>{ex.name}</strong>
                {ex.sets.map((set, idx) => (
                  <div key={set.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 10px', 
                    background: set.completed ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    borderLeft: set.completed ? '3px solid #10b981' : '3px solid transparent',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Set {idx + 1}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{set.weight}kg × {set.reps}</span>
                    <button
                      style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '1.1rem', cursor: 'pointer', padding: '0 6px', opacity: 0.8 }}
                      onClick={() => handleDeleteSet(ex.id, set.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {currentWorkout.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0', fontSize: '0.88rem' }}>
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
