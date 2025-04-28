import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentIssues } from '../services/api';
import UserProfile from './UserProfile';
import NotificationBadge from './NotificationBadge';
import '../styles/Dashboard.css';

const MyIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchIssues();
  }, [navigate]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const data = await getStudentIssues();
      if (Array.isArray(data)) {
        setIssues(data);
      } else if (data && typeof data === 'object') {
        const issuesArray = data.issues || data.data || [];
        setIssues(issuesArray);
      } else {
        setIssues([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch issues. Please try again later.');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewIssue = () => {
    navigate('/add-issue');
  };

  const handleIssueClick = (issueId) => {
    if (!issueId) {
      console.error('No issue ID provided');
      return;
    }
    // For students, consistently use /issue/:issueId
    navigate(`/issue/${issueId}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'resolved':
        return 'green';
      case 'closed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCategory = (text) => {
    if (!text) return '';
    return text
      .split(/[_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
            <li onClick={() => navigate('/dashboard')}>
              <span>🏠</span>
              Home
            </li>
            <li className="active">
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

        <main className="dashboard-main">
          <div className="page-header">
            <h1>My Issues</h1>
            <button className="add-issue-button" onClick={handleAddNewIssue}>
              <span>➕</span> Add New Issue
            </button>
          </div>
          
          <section className="all-issues">
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="issues-list">
                {issues.length === 0 ? (
                  <div className="no-issues">
                    <p>No issues found.</p>
                    <button className="add-issue-button" onClick={handleAddNewIssue}>
                      Create your first issue
                    </button>
                  </div>
                ) : (
                  issues
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((issue) => {
                      const issueId = issue.issue_id || issue._id || issue.id;
                      return (
                        <div 
                          key={issueId} 
                          className="issue-card"
                          onClick={() => handleIssueClick(issueId)}
                        >
                          <div className="issue-content">
                            <div className="issue-header">
                              <h3>{issue.title || formatCategory(issue.category)}</h3>
                              <div className="issue-metadata">
                                <div className={`issue-status-circle ${getStatusColor(issue.status)}`} />
                                <span className="issue-date">{formatDate(issue.created_at)}</span>
                              </div>
                            </div>
                            <p className="issue-description">{issue.description}</p>
                            <div className="issue-status">
                              <span className={`status-badge ${issue.status?.toLowerCase()}`}>
                                {formatCategory(issue.status) || 'Open'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default MyIssues;