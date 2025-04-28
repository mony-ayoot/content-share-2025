import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import NotificationBadge from './NotificationBadge';
import '../styles/Dashboard.css';
import '../styles/AcademicRegistrar.css';

const AcademicRegistrarDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    // Verify user is academic registrar
    if (!user || user.role !== 'academic_registrar') {
      navigate('/login');
    }
  }, [navigate, user]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <span className="graduation-icon">👨‍🎓</span>
          <h1>AITs - Academic Registrar Portal</h1>
        </div>
        <div className="user-menu">
          <UserProfile user={user} />
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <nav className="dashboard-nav">
          <ul>
            <li className="active">
              <span>🏠</span>
              Dashboard
            </li>
            <li onClick={() => navigate('/academic-registrar/issues')}>
              <span>📝</span>
              All Issues
            </li>
            <li onClick={() => navigate('/academic-registrar/lecturers')}>
              <span>👨‍🏫</span>
              Manage Lecturers
            </li>
            <li onClick={() => navigate('/academic-registrar/students')}>
              <span>👨‍🎓</span>
              Manage Students
            </li>
            <li onClick={() => navigate('/notifications')} className="notification-item">
              <span>🔔</span>
              Notifications
              <NotificationBadge />
            </li>
            <li onClick={() => navigate('/academic-registrar/settings')}>
              <span>⚙️</span>
              Settings
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="welcome-section">
            <h1>Welcome, {user?.fullName || 'Academic Registrar'}!</h1>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/academic-registrar/issues')}>
              <span className="action-icon">📝</span>
              <h3>View All Issues</h3>
              <p>Monitor and manage all academic issues</p>
            </div>

            <div className="action-card" onClick={() => navigate('/academic-registrar/lecturers')}>
              <span className="action-icon">👨‍🏫</span>
              <h3>Manage Lecturers</h3>
              <p>Add, remove, or modify lecturer accounts</p>
            </div>

            <div className="action-card" onClick={() => navigate('/academic-registrar/students')}>
              <span className="action-icon">👨‍🎓</span>
              <h3>Manage Students</h3>
              <p>View and manage student accounts</p>
            </div>

            <div className="action-card notification-item" onClick={() => navigate('/notifications')}>
              <span className="action-icon">🔔</span>
              <h3>Notifications</h3>
              <p>View system notifications</p>
              <NotificationBadge />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AcademicRegistrarDashboard;