import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const clearUnreadStatus = () => {
    setHasUnreadNotifications(false);
  };

  const setUnreadStatus = (status) => {
    setHasUnreadNotifications(status);
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        hasUnreadNotifications, 
        clearUnreadStatus,
        setUnreadStatus 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 