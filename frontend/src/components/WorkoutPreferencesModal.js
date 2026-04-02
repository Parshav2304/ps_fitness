import React from 'react';

const WorkoutPreferencesModal = ({ preferences, setPreferences, onClose, onGenerate }) => {
  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '500px', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>🏋️ Workout Preferences</h2>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>Where do you want to train?</label>
            <select
              value={preferences.location}
              onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
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
                checked={preferences.isAthlete}
                onChange={(e) => setPreferences({ ...preferences, isAthlete: e.target.checked })}
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
                  onClick={() => setPreferences({ ...preferences, daysPerWeek: days })}
                  style={{
                    padding: '15px',
                    borderRadius: '12px',
                    background: preferences.daysPerWeek === days ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    border: preferences.daysPerWeek === days ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.2)',
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
              {preferences.daysPerWeek} days/week selected
            </small>
          </div>

          <button
            onClick={onGenerate}
            className="btn-primary"
            style={{ marginTop: '10px', padding: '15px', fontSize: '1.1rem' }}
          >
            ⚡ Generate My Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPreferencesModal;
