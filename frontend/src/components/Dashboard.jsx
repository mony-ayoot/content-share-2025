import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import NotificationBadge from './NotificationBadge';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <span className="graduation-icon">👨‍🎓</span>
          <h1>AITs</h1>
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
              Home
            </li>
            <li onClick={() => navigate('/my-issues')}>
              <span>📝</span>
              My Issues
            </li>
            <li onClick={() => navigate('/notifications')} className="notification-item">
              <span>🔔</span>
              Notifications
              <NotificationBadge />
            </li>
            <li>
              <span>⚙️</span>
              Settings
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="welcome-section">
            <h1>Welcome, {user?.fullName || 'User'}!</h1>
            <p>What would you like to do today?</p>
          </div>

          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/add-issue')}>
              <span className="action-icon">📝</span>
              <h3>Submit New Issue</h3>
              <p>Report an academic or technical issue</p>
            </div>

            <div className="action-card" onClick={() => navigate('/my-issues')}>
              <span className="action-icon">📋</span>
              <h3>View My Issues</h3>
              <p>Check the status of your submitted issues</p>
            </div>

            <div className="action-card notification-item" onClick={() => navigate('/notifications')}>
              <span className="action-icon">🔔</span>
              <h3>Notifications</h3>
              <p>View updates and responses</p>
              <NotificationBadge />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 