import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import '../statics/Login.css';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getInputLabel = () => {
    switch(activeTab) {
      case 'student':
        return { label: 'Student number', placeholder: '2400721333' };
      case 'lecturer':
        return { label: 'Lecturer ID', placeholder: 'Enter Lecturer ID' };
      case 'registrar':
        return { label: 'Registrar ID', placeholder: 'Enter Registrar ID' };
      default:
        return { label: 'Student number', placeholder: '2400721333' };
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await loginUser({
        userId: formData.userId,
        password: formData.password,
        role: activeTab
      });
      
      // Store the token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect based on user role
      switch (response.user.role) {
        case 'registrar':
          navigate('/registrar');
          break;
        case 'lecturer':
          navigate('/lecturer-dashboard');
          break;
        case 'student':
        default:
          navigate('/dashboard');
          break;
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <h1>AiTs</h1>
      </header>
      <h3 className="page-title">Login</h3>
      <div className="login-box">
        <h2>Welcome</h2>
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <span className="tab-icon">👨‍🎓</span>
            Student
          </button>
          <button 
            className={`tab ${activeTab === 'lecturer' ? 'active' : ''}`}
            onClick={() => setActiveTab('lecturer')}
          >
            <span className="tab-icon">👨‍🏫</span>
            Lecturer
          </button>
          <button 
            className={`tab ${activeTab === 'registrar' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrar')}
          >
            <span className="tab-icon">👨‍💼</span>
            Registrar
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">{getInputLabel().label}</label>
            <input 
              type="text" 
              id="userId" 
              value={formData.userId}
              onChange={handleChange}
              placeholder={getInputLabel().placeholder}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder="Password" 
            />
          </div>
          <a href="#" className="forgot-link">
            Forgot your username or password?
          </a>
          <button type="submit" className="login-button">
            Log in
          </button>
          <div className="signup-link-container">
            <span>Don't have an account? </span>
            <a onClick={() => navigate('/signup')} className="signup-link" style={{ cursor: 'pointer' }}>
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;