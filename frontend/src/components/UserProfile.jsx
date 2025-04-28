import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserProfile.css';

const UserProfile = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="user-profile" ref={dropdownRef}>
      <div 
        className="profile-trigger" 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="profile-button">
          <span className="initials">{getInitials(user?.fullName)}</span>
        </div>
      </div>
      
      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="user-info">
            <p className="full-name">{user?.fullName || 'User'}</p>
          </div>
          <div className="dropdown-divider"></div>
          <div className="dropdown-item" onClick={handleLogout}>
            <span>🚪</span>
            Logout
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 