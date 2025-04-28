import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentIssues } from '../services/api';
import UserProfile from './UserProfile';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
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
      const data = await getStudentIssues();
      console.log('Fetched issues data:', JSON.stringify(data, null, 2));
      if (Array.isArray(data)) {
        setIssues(data);
      } else if (data && typeof data === 'object') {
        // If the data is wrapped in an object, try to find the issues array
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

  const handleMyIssues = () => {
    navigate('/my-issues');
  };

  const handleIssueClick = (issueId) => {
    if (!issueId) {
      console.error('No issue ID provided');
      return;
    }
    // For students, always navigate to /issue/:issueId
    navigate(`/issue/${issueId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'resolved':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCategory = (category) => {
    if (!category) return '';
    // Split by underscore or space, capitalize each word, then join with space
    return category
      .split(/[_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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
            <li onClick={() => navigate('/notifications')}>
              <span>🔔</span>
              Notifications
            </li>
            <li>
              <span>⚙️</span>
              Settings
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          <h1 className="welcome-message">Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}!</h1>
          
          <section className="recent-issues">
            <div className="section-header">
              <h2>Recent Issues</h2>
              <button className="view-all-button" onClick={handleMyIssues}>
                View All
              </button>
            </div>
            
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="issues-list">
                {issues.length === 0 ? (
                  <div className="no-issues">No issues found. Create your first issue!</div>
                ) : (
                  [...issues]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 3)
                    .map((issue) => {
                      console.log('Rendering issue:', JSON.stringify(issue, null, 2));
                      const issueId = issue._id || issue.id || issue.issue_id;
                      return (
                        <div 
                          key={issueId} 
                          className="issue-card"
                          onClick={() => handleIssueClick(issueId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="issue-content">
                            <div className="issue-header">
                              <h3>{formatCategory(issue.title || issue.category)}</h3>
                              <div className="issue-metadata">
                                <div className={`issue-status-circle ${getStatusColor(issue.status)}`} />
                                <span className="issue-date">{formatDate(issue.created_at)}</span>
                              </div>
                            </div>
                            <p className="issue-description">{issue.description}</p>
                            <div className="issue-status">
                              <span className={`status-badge ${issue.status}`}>
                                {(issue.status || '').replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
            
            <button className="add-issue-button" onClick={handleAddNewIssue}>
              <span>➕</span> Add New Issue
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;