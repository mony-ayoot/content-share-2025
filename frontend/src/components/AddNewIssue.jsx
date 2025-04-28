import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createIssue, getIssueById, updateIssue, getLecturers } from '../services/api';
import UserProfile from './UserProfile';
import NotificationBadge from './NotificationBadge';
import '../styles/Dashboard.css';
import '../styles/AddNewIssue.css';

const AddNewIssue = () => {
  const navigate = useNavigate();
  const { issueId } = useParams(); // Get issueId if we're editing
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    courseUnit: '',
    yearOfStudy: '',
    semester: '',
    lecturer: '',
    description: '',
    attachment: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [isEditing, setIsEditing] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [loadingLecturers, setLoadingLecturers] = useState(true);

  useEffect(() => {
    // If we have an issueId, fetch the issue data
    if (issueId) {
      setIsEditing(true);
      
      const fetchIssueData = async () => {
        try {
          setLoading(true);
          const data = await getIssueById(issueId);
          console.log('Fetched issue data:', data);
          setFormData({
            title: data.title || '',
            category: data.category || '',
            courseUnit: data.courseUnit || '',
            yearOfStudy: data.yearOfStudy || '',
            semester: data.semester || '',
            lecturer: data.assigned_to?.id || '',
            description: data.description || '',
            attachment: null // We don't load the existing attachment for security reasons
          });
        } catch (err) {
          console.error('Error loading issue:', err);
          setError('Failed to load issue data. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchIssueData();
    }
  }, [issueId]);

  useEffect(() => {
    const fetchLecturerData = async () => {
      try {
        setLoadingLecturers(true);
        const data = await getLecturers();
        setLecturers(data);
      } catch (err) {
        console.error('Error loading lecturers:', err);
        setError('Failed to load lecturers. Please try again.');
      } finally {
        setLoadingLecturers(false);
      }
    };

    fetchLecturerData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachment') {
      setFormData(prev => ({
        ...prev,
        attachment: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const issueData = {
        ...formData,
        assigned_to: formData.lecturer // Map lecturer field to assigned_to for the API
      };
      delete issueData.lecturer; // Remove the original lecturer field

      if (isEditing) {
        await updateIssue(issueId, issueData);
        navigate(`/issue/${issueId}`);
      } else {
        const response = await createIssue(issueData);
        console.log('Issue created successfully:', response);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error submitting issue:', err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} issue. Please try again.`);
    } finally {
      setLoading(false);
    }
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
            <li onClick={() => navigate('/dashboard')}>
              <span>🏠</span>
              Home
            </li>
            <li onClick={() => navigate('/my-issues')}>
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

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="add-issue-container">
            <h1>{isEditing ? 'Edit Issue' : 'Submit an Academic Issue'}</h1>
            
            <form onSubmit={handleSubmit} className="add-issue-form">
              <div className="form-group">
                <label>Issue Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Choose an option.</option>
                  <option value="academic">Academic Issues</option>
                  <option value="technical">Technical Issues</option>
                  <option value="administrative">Administrative Issues</option>
                  <option value="examination">Examination Issues</option>
                  <option value="registration">Registration Issues</option>
                  <option value="other">Other Issues</option>
                </select>
              </div>

              <div className="form-group">
                <label>Issue Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter a brief title for your issue"
                />
              </div>

              <div className="form-group">
                <label>Course Unit</label>
                <select
                  name="courseUnit"
                  value={formData.courseUnit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Course Unit</option>
                  <option value="CSC1100">CSC1100 - Programming Fundamentals</option>
                  <option value="CSC1200">CSC1200 - Data Structures</option>
                  <option value="CSC2100">CSC2100 - Database Systems</option>
                  <option value="CSC2200">CSC2200 - Web Development</option>
                  <option value="CSC3100">CSC3100 - Software Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label>Year of Study</label>
                <select
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">First Year</option>
                  <option value="2">Second Year</option>
                  <option value="3">Third Year</option>
                  <option value="4">Fourth Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Lecturer to Assign Issue</label>
                <select
                  name="lecturer"
                  value={formData.lecturer}
                  onChange={handleInputChange}
                  required
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

              <div className="form-group">
                <label>Issue Detail</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  placeholder="Please provide a detailed description of your issue"
                />
              </div>

              <div className="form-group">
                <label>Attach a file or photo</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    name="attachment"
                    onChange={handleInputChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    id="file-input"
                  />
                  <div className="custom-file-input">
                    <span>Choose a file</span>
                    <span className="file-name">
                      {formData.attachment ? formData.attachment.name : ''}
                    </span>
                  </div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`submit-button ${isEditing ? 'edit-mode' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit Issue'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => navigate(`/issue/${issueId}`)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <footer className="add-issue-footer">
              <p>© 2025 Makerere University</p>
              <div className="footer-links">
                <a href="/terms">Terms of Service</a>
                <span>|</span>
                <a href="/privacy">Privacy Policy</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddNewIssue;