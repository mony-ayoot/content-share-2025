import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../../services/api';
import UserProfile from '../UserProfile';
import NotificationBadge from '../NotificationBadge';
import { useNotifications } from '../../context/NotificationContext';
import '../../styles/Dashboard.css';
import '../../styles/Notifications.css';
import '../../styles/Lecturer.css';

const LecturerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const { clearUnreadStatus } = useNotifications();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      console.log('Fetched notifications:', data);
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      console.error('Error:', err);
      if (err.message === 'Authentication required. Please log in again.') {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'lecturer') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchNotifications();
    clearUnreadStatus();
  }, [navigate, clearUnreadStatus, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      if (err.message === 'Authentication required. Please log in again.') {
        navigate('/login');
      }
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'issue_assigned':
        return '📋';
      case 'issue_updated':
        return '🔄';
      case 'issue_resolved':
        return '✅';
      case 'issue_comment':
        return '💬';
      case 'issue_priority':
        return '⚡';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.issue?.issue_id) {
      navigate(`/lecturer/issues/${notification.issue.issue_id}`);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <span className="graduation-icon">👨‍🏫</span>
          <h1>AITs</h1>
        </div>
        <div className="user-menu">
          <UserProfile user={user} />
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <ul>
            <li onClick={() => navigate('/lecturer-dashboard')}>
              <span>🏠</span>
              Home
            </li>
            <li onClick={() => navigate('/lecturer/issues')}>
              <span>📝</span>
              Assigned Issues
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
          <div className="page-header">
            <h1>Notifications</h1>
          </div>
          
          <section className="notifications-section">
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  notifications
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-content">
                          <div className="notification-header">
                            <span className="notification-type">
                              {getNotificationIcon(notification.notification_type)}
                            </span>
                            <span className="notification-date">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                          <p className="notification-message">{notification.message}</p>
                          {notification.issue && (
                            <div className="notification-issue-info">
                              <span className="issue-title">{notification.issue.title}</span>
                              <span className={`issue-status ${notification.issue.status}`}>
                                {notification.issue.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default LecturerNotifications;