import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIssueById, assignIssueToLecturer, updateIssueStatus, deleteIssue, getLecturers as fetchLecturers, getRegistrarIssueById } from '../services/api';
import UserProfile from './UserProfile';
import NotificationBadge from './NotificationBadge';
import '../styles/Dashboard.css';
import '../styles/IssueDetail.css';

const IssueDetail = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [loadingLecturers, setLoadingLecturers] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const getNavigationPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'registrar':
        return '/registrar/issues';
      case 'lecturer':
        return '/lecturer/issues';
      default:
        return '/my-issues';
    }
  };

  const handleHomeNavigation = () => {
    switch (user?.role) {
      case 'registrar':
        return navigate('/registrar');
      case 'lecturer':
        return navigate('/lecturer-dashboard');
      default:
        return navigate('/dashboard');
    }
  };

  const getNotificationsPath = () => {
    switch (user?.role) {
      case 'lecturer':
        return '/lecturer/notifications';
      case 'registrar':
        return '/registrar/notifications';
      case 'academic_registrar':
        return '/academic-registrar/notifications';
      default:
        return '/notifications';
    }
  };

  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        // Check if we have a valid issueId
        if (!issueId || issueId === 'undefined') {
          setError('Invalid issue ID');
          setLoading(false);
          return;
        }

        // Use different API methods based on user role
        const data = user?.role === 'registrar' 
          ? await getRegistrarIssueById(issueId)
          : await getIssueById(issueId);
        
        if (!data) {
          setError('Issue not found');
          setLoading(false);
          return;
        }

        setIssue(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load issue details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have both issueId and user
    if (user) {
      fetchIssueDetails();
    }
  }, [issueId, user]);

  useEffect(() => {
    const fetchLecturerData = async () => {
      try {
        setLoadingLecturers(true);
        const data = await fetchLecturers();
        setLecturers(data);
      } catch (err) {
        console.error('Error fetching lecturers:', err);
      } finally {
        setLoadingLecturers(false);
      }
    };

    fetchLecturerData();
  }, []);

  const handleEditIssue = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (issue.student_id === user.id) {
      navigate(`/add-issue/${issueId}`);
    } else {
      setError('You are not authorized to edit this issue.');
    }
  };

  const handleDeleteIssue = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      try {
        await deleteIssue(issueId);
        navigate(getNavigationPath());
      } catch (err) {
        if (err.message === 'Authentication required. Please log in again.') {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setError('Failed to delete issue: ' + err.message);
        }
      }
    }
  };

  const handleAssignIssue = async () => {
    if (!selectedLecturer) {
      setError('Please select a lecturer');
      return;
    }
    try {
      await assignIssueToLecturer(issueId, selectedLecturer);
      // Fetch updated issue data using the appropriate method
      const updatedIssue = user?.role === 'registrar' 
        ? await getRegistrarIssueById(issueId)
        : await getIssueById(issueId);
      setIssue(updatedIssue);
      setShowAssignModal(false);
      setError('');
    } catch (err) {
      setError('Failed to assign issue to lecturer: ' + err.message);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdate) {
      setError('Please select a status');
      return;
    }
    try {
      setLoading(true);
      await updateIssueStatus(issueId, statusUpdate);
      // Fetch updated issue data using the appropriate method
      const updatedIssue = user?.role === 'registrar' 
        ? await getRegistrarIssueById(issueId)
        : await getIssueById(issueId);
      setIssue(updatedIssue);
      setShowStatusModal(false);
      setStatusUpdate('');
      setError('');
    } catch (err) {
      if (err.message === 'Authentication required. Please log in again.') {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to update issue status: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = () => {
    return [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' }
    ];
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="logo">
            <span className="graduation-icon">{user?.role === 'registrar' ? '👨‍💼' : '👨‍🎓'}</span>
            <h1>AITs</h1>
          </div>
          <div className="user-menu">
            <UserProfile user={user} />
          </div>
        </header>
        <div className="loading">Loading issue details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="logo">
            <span className="graduation-icon">{user?.role === 'registrar' ? '👨‍💼' : '👨‍🎓'}</span>
            <h1>AITs</h1>
          </div>
          <div className="user-menu">
            <UserProfile user={user} />
          </div>
        </header>
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Back to Issues
          </button>
        </div>
      </div>
    );
  }

  const renderActions = () => {
    if (user?.role === 'registrar') {
      return (
        <div className="issue-actions">
          <button onClick={() => setShowAssignModal(true)} className="assign-button">
            Assign to Lecturer
          </button>
          <button onClick={() => setShowStatusModal(true)} className="status-button">
            Update Status
          </button>
          <button onClick={handleDeleteIssue} className="delete-button">
            Delete Issue
          </button>
          <button onClick={() => navigate(-1)} className="back-button">
            Back to Issues
          </button>
        </div>
      );
    }

    if (user?.role === 'lecturer') {
      return (
        <div className="issue-actions">
          <button onClick={() => setShowStatusModal(true)} className="status-button">
            Update Status
          </button>
          <button onClick={() => navigate('/lecturer/issues')} className="back-button">
            Back to Issues
          </button>
        </div>
      );
    }

    return (
      <div className="issue-actions">
        {issue.student_id === user?.id && (
          <>
            <button onClick={handleEditIssue} className="edit-button">
              Edit Issue
            </button>
            <button onClick={handleDeleteIssue} className="delete-button">
              Delete Issue
            </button>
          </>
        )}
        <button onClick={() => navigate(-1)} className="back-button">
          Back to Issues
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <span className="graduation-icon">{user?.role === 'registrar' ? '👨‍💼' : '👨‍🎓'}</span>
          <h1>AITs</h1>
        </div>
        <div className="user-menu">
          <UserProfile user={user} />
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <ul>
            <li onClick={handleHomeNavigation}>
              <span>🏠</span>
              Home
            </li>
            {user?.role === 'registrar' ? (
              <>
                <li className="active">
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
              </>
            ) : (
              <li onClick={() => navigate('/my-issues')}>
                <span>📝</span>
                My Issues
              </li>
            )}
            <li onClick={() => navigate(getNotificationsPath())} className="notification-item">
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
          <div className="issue-container">
            <h1>Issue Details</h1>
            <p className="subtitle">Detailed view of the selected issue</p>

            {error && <div className="error-message">{error}</div>}

            <div className="issue-section">
              <h2>Issue Title</h2>
              <p>{issue.title}</p>
            </div>

            <div className="issue-section">
              <h2>Category</h2>
              <p>{issue.category}</p>
            </div>

            <div className="issue-section">
              <h2>Description</h2>
              <p>{issue.description}</p>
            </div>

            {issue.attachment_url && (
              <div className="issue-section">
                <h2>Attachment</h2>
                {issue.attachment_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img 
                    src={issue.attachment_url} 
                    alt="Issue attachment" 
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px' }} 
                  />
                ) : (
                  <a 
                    href={issue.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="attachment-link"
                  >
                    📎 Download Attachment
                  </a>
                )}
              </div>
            )}

            <div className="issue-meta">
              <div className="meta-item">
                <span className="label">Status</span>
                <span className={`status-badge ${issue.status}`}>{issue.status}</span>
              </div>
              <div className="meta-item">
                <span className="label">Priority</span>
                <span className={`priority-badge ${issue.priority}`}>{issue.priority}</span>
              </div>
              <div className="meta-item">
                <span className="label">Created</span>
                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
              {issue.assigned_to && (
                <div className="meta-item">
                  <span className="label">Assigned To</span>
                  <span>{issue.assigned_to.fullName}</span>
                </div>
              )}
            </div>

            {renderActions()}
          </div>

          {/* Assign Modal */}
          {showAssignModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Assign Issue to Lecturer</h2>
                <div className="form-group">
                  <select
                    value={selectedLecturer}
                    onChange={(e) => setSelectedLecturer(e.target.value)}
                    disabled={loadingLecturers}
                  >
                    <option value="">Select Lecturer</option>
                    {lecturers.map(lecturer => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.user.first_name} {lecturer.user.last_name} - {lecturer.department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowAssignModal(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button onClick={handleAssignIssue} className="confirm-button" disabled={loadingLecturers || !selectedLecturer}>
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Update Modal */}
          {showStatusModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Update Issue Status</h2>
                <div className="form-group">
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    {getStatusOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowStatusModal(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button onClick={handleUpdateStatus} className="confirm-button">
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IssueDetail;