import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLecturerIssues, updateIssueStatus } from '../../services/api';
import UserProfile from '../UserProfile';
import NotificationBadge from '../NotificationBadge';
import '../../styles/Dashboard.css';
import '../../styles/Lecturer.css';

const LecturerIssueManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'lecturer') {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await getLecturerIssues();
      setIssues(data);
      setError('');
    } catch (error) {
      setError('Error fetching issues: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      // Refresh issues list after update
      await fetchIssues();
      setError('');
    } catch (error) {
      setError('Error updating issue status: ' + error.message);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesFilter = filter === 'all' || issue.status.toLowerCase() === filter;
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.courseUnit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <li className="active">
              <span>📝</span>
              Assigned Issues
            </li>
            <li onClick={() => navigate('/lecturer/notifications')} className="notification-item">
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
            <h1>Issue Management</h1>
            <div className="filter-tabs">
              <button 
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${filter === 'open' ? 'active' : ''}`}
                onClick={() => setFilter('open')}
              >
                Open
              </button>
              <button 
                className={`filter-button ${filter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </button>
              <button 
                className={`filter-button ${filter === 'resolved' ? 'active' : ''}`}
                onClick={() => setFilter('resolved')}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-spinner">Loading issues...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Issue Title</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Course</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">No issues found</td>
                    </tr>
                  ) : (
                    filteredIssues.map(issue => (
                      <tr key={issue.issue_id} onClick={() => navigate(`/lecturer/issues/${issue.issue_id}`)}>
                        <td>{issue.title}</td>
                        <td>{issue.student?.fullName || 'N/A'}</td>
                        <td>
                          <span className={`status ${issue.status.toLowerCase()}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td>
                          <span className={`priority ${issue.priority.toLowerCase()}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td>{issue.courseUnit}</td>
                        <td className="actions-cell">
                          <select
                            value={issue.status}
                            onChange={(e) => handleUpdateStatus(issue.issue_id, e.target.value)}
                            className="status-select"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option key="open" value="open">Open</option>
                            <option key="in_progress" value="in_progress">In Progress</option>
                            <option key="resolved" value="resolved">Resolved</option>
                            <option key="closed" value="closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LecturerIssueManagement;