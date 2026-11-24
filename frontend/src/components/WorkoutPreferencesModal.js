import React from 'react';
import { FiX, FiMapPin, FiCalendar, FiZap } from 'react-icons/fi';

const WorkoutPreferencesModal = ({ preferences = {}, setPreferences, onClose, onGenerate }) => {
  const daysPerWeek = preferences?.days_per_week ?? preferences?.daysPerWeek ?? 4;
  const isAthlete = preferences?.is_athlete ?? preferences?.isAthlete ?? false;
  const location = preferences?.location || 'gym';

  const updateLocation = (val) => {
    setPreferences(prev => ({ ...prev, location: val }));
  };

  const updateDays = (val) => {
    setPreferences(prev => ({
      ...prev,
      days_per_week: val,
      daysPerWeek: val
    }));
  };

  const updateAthlete = (val) => {
    setPreferences(prev => ({
      ...prev,
      is_athlete: val,
      isAthlete: val
    }));
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '480px', padding: '32px', position: 'relative',
        background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '24px', right: '24px', background: 'transparent',
            border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer',
            padding: '4px', display: 'flex', alignItems: 'center'
          }}
        >
          <FiX />
        </button>

        <h2 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
          Workout Programming
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Select your training environment and frequency to build a targeted split.
        </p>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FiMapPin size={14} /> Training Location
            </label>
            <select
              value={location}
              onChange={(e) => updateLocation(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="gym">Commercial Gym (Barbells, Dumbbells, Cables & Machines)</option>
              <option value="home">Home Gym (Dumbbells, Bodyweight, Minimal Gear)</option>
              <option value="athlete">Athletic Field & Performance Facility</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              <FiCalendar size={14} /> Weekly Frequency ({daysPerWeek} Days/Week)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[3, 4, 5, 6].map(days => {
                const isSelected = daysPerWeek === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updateDays(days)}
                    style={{
                      padding: '14px 0',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      fontFamily: 'Outfit, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {days}d
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{
            background: 'rgba(255,255,255,0.02)', padding: '16px',
            borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAthlete}
                onChange={(e) => updateAthlete(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiZap size={14} style={{ color: 'var(--warning)' }} /> High Intensity Athlete Mode
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '3px', lineHeight: 1.4 }}>
                  Increases compound set volume and introduces explosive conditioning drills.
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={onGenerate}
              className="btn-primary"
              style={{ flex: 1.5 }}
            >
              Generate Split
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPreferencesModal;
