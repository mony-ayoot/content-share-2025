import React, { useEffect } from 'react';
import { getNotifications } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import '../styles/NotificationBadge.css';

const NotificationBadge = () => {
  const { hasUnreadNotifications, setUnreadStatus } = useNotifications();

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      const notifications = Array.isArray(data) ? data : (data?.notifications || data?.data || []);
      setUnreadStatus(notifications.some(n => !n.is_read));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  if (!hasUnreadNotifications) return null;

  return (
    <span className="notification-badge"></span>
  );
};

export default NotificationBadge;