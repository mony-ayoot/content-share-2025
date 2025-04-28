import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile';
import NotificationBadge from '../NotificationBadge';
import { getNotifications, markNotificationRead } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import '../../styles/Notifications.css';

const RegistrarNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, issues, students, departments
  const { clearUnreadStatus } = useNotifications();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'registrar') {
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

  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read if it isn't already
      if (!notification.is_read) {
        await markNotificationRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
      }

      // Navigate based on notification type and get the correct ID
      if (notification.issue) {
        const issueId = notification.issue.issue_id || notification.issue.id || notification.issue._id;
        if (issueId) {
          navigate(`/registrar/issues/${issueId}`);
        }
      } else if (notification.student_id) {
        navigate(`/registrar/students/${notification.student_id}`);
      } else if (notification.department_id) {
        navigate(`/registrar/departments/${notification.department_id}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      switch (filter) {
        case 'unread':
          return !notification.is_read;
        case 'issues':
          return notification.notification_type.includes('issue');
        case 'students':
          return notification.notification_type.includes('student');
        case 'departments':
          return notification.notification_type.includes('department');
        default:
          return true;
      }
    });
  };

  const getNotificationIcon = (type) => {
    if (type.includes('issue')) {
      return type.includes('resolved') ? '✅' : 
             type.includes('created') ? '📝' : 
             type.includes('closed') ? '🔒' : '🔄';
    }
    if (type.includes('student')) return '👨‍🎓';
    if (type.includes('department')) return '🏛️';
    return '📢';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <span className="graduation-icon">👨‍💼</span>
          <h1>AITs</h1>
        </div>
        <div className="user-menu">
          <UserProfile user={user} />
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <ul>
            <li onClick={() => navigate('/registrar')}>
              <span>🏠</span>
              Home
            </li>
            <li onClick={() => navigate('/registrar/issues')}>
              <span>📝</span>
              Issues
            </li>
            <li onClick={() => navigate('/registrar/students')}>
              <span>👨‍🎓</span>
              Students
            </li>
            <li onClick={() => navigate('/registrar/lecturers')}>
              <span>👨‍🏫</span>
              Lecturers
            </li>
            <li onClick={() => navigate('/registrar/departments')}>
              <span>🏛️</span>
              Departments
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
            <div className="filter-controls">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="issues">Issues</option>
                <option value="students">Students</option>
                <option value="departments">Departments</option>
              </select>
            </div>
          </div>
          
          <section className="notifications-section">
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="notifications-list">
                {getFilteredNotifications().length === 0 ? (
                  <div className="no-notifications">
                    <span className="empty-icon">🔔</span>
                    <p>No notifications found for the selected filter.</p>
                  </div>
                ) : (
                  getFilteredNotifications()
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
                          {!notification.is_read && (
                            <span className="unread-indicator">New</span>
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

export default RegistrarNotifications;