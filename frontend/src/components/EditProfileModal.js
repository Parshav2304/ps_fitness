import React, { useState } from 'react';
import { FiX, FiUser, FiActivity, FiTarget } from 'react-icons/fi';

const EditProfileModal = ({ user = {}, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    age: user?.age || '',
    height: user?.height || '',
    weight: user?.weight || '',
    activity_level: user?.activity_level || 'moderate',
    fitness_goal: user?.fitness_goal || 'maintain'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {
      full_name: formData.full_name.trim(),
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      activity_level: formData.activity_level,
      fitness_goal: formData.fitness_goal
    };
    onUpdate(updates);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px', padding: '32px', position: 'relative',
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
          Edit Profile
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Update your personal metrics to ensure accurate TDEE and workout calculations.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FiUser size={14} /> Full Name
            </label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your Full Name"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Age
              </label>
              <input
                name="age"
                type="number"
                min="10"
                max="120"
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Height (cm)
              </label>
              <input
                name="height"
                type="number"
                min="50"
                max="260"
                step="0.5"
                value={formData.height}
                onChange={handleChange}
                placeholder="175"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Weight (kg)
              </label>
              <input
                name="weight"
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                placeholder="72"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FiActivity size={14} /> Activity Level
            </label>
            <select
              name="activity_level"
              value={formData.activity_level}
              onChange={handleChange}
              style={{ width: '100%' }}
            >
              <option value="sedentary">Sedentary (Desk job, little exercise)</option>
              <option value="light">Light Activity (1-3 days/week)</option>
              <option value="moderate">Moderate Activity (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very_active">Very Active (Physical job or 2x/day)</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FiTarget size={14} /> Fitness Goal
            </label>
            <select
              name="fitness_goal"
              value={formData.fitness_goal}
              onChange={handleChange}
              style={{ width: '100%' }}
            >
              <option value="weight_loss">Weight Loss (Caloric Deficit)</option>
              <option value="muscle_gain">Muscle Gain (Hypertrophy / Bulk)</option>
              <option value="maintain">Maintain Weight (TDEE Equilibrium)</option>
              <option value="general_fitness">General Fitness & Endurance</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
