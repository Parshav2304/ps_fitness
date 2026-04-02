import React from 'react';

const SettingsModal = ({ user, onClose, onEditProfile }) => {
  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
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

        <button onClick={onEditProfile} className="btn-glass" style={{ width: '100%', marginTop: '10px' }}>
          ✏️ Edit Profile Details
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
