import React from 'react';

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '500px', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Edit Profile</h2>

        <form onSubmit={onUpdate} style={{ display: 'grid', gap: '15px' }}>
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
};

export default EditProfileModal;
