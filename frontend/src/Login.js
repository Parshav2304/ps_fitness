// frontend/src/Login.js
import React, { useState } from 'react';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Account, 2: Body Metrics, 3: Lifestyle

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    age: '',
    gender: 'other',
    height: '',
    weight: '',
    activity_level: 'moderate',
    fitness_goal: 'general_fitness'
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[strength] || 'Very Weak';
  };

  const getPasswordStrengthColor = (strength) => {
    const colors = ['#e74c3c', '#e67e22', '#f39c12', '#3498db', '#2ecc71', '#27ae60'];
    return colors[strength] || '#e74c3c';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError(null);

    // Clear specific field error
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.username || formData.username.length < 3) errors.username = 'Username too short';
    if (!formData.email || !validateEmail(formData.email)) errors.email = 'Invalid email';
    if (!formData.password || formData.password.length < 6) errors.password = 'Password too short';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.age || formData.age < 10) errors.age = 'Invalid age';
    if (!formData.height || formData.height < 50) errors.height = 'Invalid height';
    if (!formData.weight || formData.weight < 20) errors.weight = 'Invalid weight';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Final payload construction
    // Ensure numbers are numbers
    const payload = {
      ...formData,
      age: parseInt(formData.age),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight)
    };

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';

      // For login, we send FormData as per OAuth2 spec usually, or JSON depending on backend
      // App.js used FormData for login, JSON for register.
      let body;
      let headers = {};

      if (isLogin) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          email: formData.email,
          password: formData.password
        });
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(payload);
      }

      console.log('Sending login request to:', `${API_URL}${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });
      console.log('Response received:', response.status);

      const data = await response.json();
      console.log('Data parsed:', data);

      if (!response.ok) {
        // Handle object errors
        let errorMsg = 'Authentication failed';
        if (typeof data.detail === 'string') errorMsg = data.detail;
        else if (Array.isArray(data.detail)) errorMsg = data.detail.map(e => e.msg).join(', ');
        else if (data.detail?.msg) errorMsg = data.detail.msg;

        throw new Error(errorMsg);
      }

      // Success
      localStorage.setItem('token', data.access_token);
      // We might need to fetch user profile if it's not returned in login
      // Login endpoint usually just returns token. 
      // The onLogin callback in App.js will likely fetch the profile.
      onLogin(null, data.access_token);

    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setError(null);
    setValidationErrors({});
  };

  // Render Logic
  const renderStep1 = () => (
    <>
      {!isLogin && (
        <>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className={validationErrors.username ? 'error' : ''}
            />
            {validationErrors.username && <span className="field-error">{validationErrors.username}</span>}
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Full Name (Optional)"
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label>Email {isLogin && '(Username)'}</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com"
          className={validationErrors.email ? 'error' : ''}
        />
        {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isLogin ? 'Password' : 'Min 6 characters'}
            className={validationErrors.password ? 'error' : ''}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {!isLogin && formData.password && (
          <div className="password-strength">
            <div className="strength-bar">
              <div className="strength-fill" style={{ width: `${(passwordStrength / 5) * 100}%`, backgroundColor: getPasswordStrengthColor(passwordStrength) }} />
            </div>
            <span className="strength-label" style={{ color: getPasswordStrengthColor(passwordStrength) }}>{getPasswordStrengthLabel(passwordStrength)}</span>
          </div>
        )}
        {validationErrors.password && <span className="field-error">{validationErrors.password}</span>}
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Age</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} className={validationErrors.age ? 'error' : ''} />
          {validationErrors.age && <span className="field-error">{validationErrors.age}</span>}
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Height (cm)</label>
          <input type="number" name="height" value={formData.height} onChange={handleChange} className={validationErrors.height ? 'error' : ''} />
          {validationErrors.height && <span className="field-error">{validationErrors.height}</span>}
        </div>
        <div className="form-group">
          <label>Weight (kg)</label>
          <input type="number" name="weight" value={formData.weight} onChange={handleChange} className={validationErrors.weight ? 'error' : ''} />
          {validationErrors.weight && <span className="field-error">{validationErrors.weight}</span>}
        </div>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="form-group">
        <label>Activity Level</label>
        <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
          <option value="sedentary">Sedentary (Office job)</option>
          <option value="light">Light (1-2 days/week)</option>
          <option value="moderate">Moderate (3-5 days/week)</option>
          <option value="active">Active (6-7 days/week)</option>
          <option value="very_active">Very Active (Physical job)</option>
        </select>
      </div>
      <div className="form-group">
        <label>Fitness Goal</label>
        <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange}>
          <option value="weight_loss">Weight Loss</option>
          <option value="muscle_gain">Muscle Gain</option>
          <option value="maintain">Maintain Weight</option>
          <option value="general_fitness">General Fitness</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💪 PS Fitness</h1>
          <p>
            {isLogin
              ? 'Welcome Back!'
              : step === 1
                ? 'Create Your Account'
                : step === 2
                  ? 'Tell Us About You'
                  : 'Your Goals'}
          </p>
          {!isLogin && (
            <div className="step-indicator">
              <span className={step >= 1 ? 'active' : ''}>1</span>
              <div className="line"></div>
              <span className={step >= 2 ? 'active' : ''}>2</span>
              <div className="line"></div>
              <span className={step >= 3 ? 'active' : ''}>3</span>
            </div>
          )}
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={isLogin || step === 3 ? handleSubmit : handleNextStep} className="auth-form">

          {/* LOGIN VIEW */}
          {isLogin && renderStep1()}

          {/* REGISTER STEPS */}
          {!isLogin && step === 1 && renderStep1()}
          {!isLogin && step === 2 && renderStep2()}
          {!isLogin && step === 3 && renderStep3()}

          <div className="button-group">
            {!isLogin && step > 1 && (
              <button type="button" className="auth-back" onClick={handleBack}>
                Back
              </button>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner"></span> Processing...</>
              ) : (
                isLogin ? '🔐 Login' : step === 3 ? '✨ Complete Signup' : 'Next ➡️'
              )}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button onClick={handleSwitchMode} className="link-button">Register here</button>
            </>
          ) : (
            <button onClick={handleSwitchMode} className="link-button">Back to Login</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
