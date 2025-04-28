import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import NotificationBadge from './NotificationBadge';
import { getNotifications } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import '../styles/Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const { clearUnreadStatus } = useNotifications();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchNotifications();
    // Clear unread status when notifications page is opened
    clearUnreadStatus();
  }, [navigate, clearUnreadStatus]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && typeof data === 'object') {
        const notificationsArray = data.notifications || data.data || [];
        setNotifications(notificationsArray);
      } else {
        setNotifications([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch notifications. Please try again later.');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to delete notification');
      }

      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/notifications/clear-all/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to clear notifications');
      }

      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError(err.message);
    }
  };

  const getBackUrl = () => {
    switch (user?.role) {
      case 'lecturer':
        return '/lecturer';
      case 'registrar':
        return '/registrar';
      case 'academic_registrar':
        return '/academic-registrar';
      default:
        return '/dashboard';
    }
  };

  const getRoleSpecificIcon = (type) => {
    const baseIcons = {
      issue_created: '📝',
      issue_updated: '🔄',
      issue_resolved: '✅',
      issue_assigned: '👤',
      comment_added: '💬'
    };

    // Add role-specific icons
    if (user?.role === 'lecturer') {
      return {
        ...baseIcons,
        student_submission: '📚',
        deadline_approaching: '⏰',
      }[type] || '🔔';
    }

    if (user?.role === 'registrar' || user?.role === 'academic_registrar') {
      return {
        ...baseIcons,
        new_registration: '📋',
        department_update: '🏛️',
        system_alert: '⚠️',
      }[type] || '🔔';
    }

    return baseIcons[type] || '🔔';
  };

  return (
    <div className="dashboard-container">
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
        <nav className="dashboard-nav">
          <ul>
            <li onClick={() => navigate(getBackUrl())}>
              <span>🏠</span>
              Home
            </li>
            <li onClick={() => navigate('/my-issues')}>
              <span>📝</span>
              My Issues
            </li>
            <li className="active notification-item">
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

        <main className="dashboard-main">
          <div className="notifications-container">
            <div className="page-header">
              <h1>Notifications</h1>
              {notifications.length > 0 && (
                <button onClick={clearAllNotifications} className="clear-all-btn">
                  Clear All
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="loading">Loading notifications...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="empty-icon">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-icon">
                      {getRoleSpecificIcon(notification.notification_type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span className="unread-indicator">New</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;