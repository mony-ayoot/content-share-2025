import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue, getLecturers } from '../services/api';
import '../styles/CreateIssue.css';

const CreateIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    priority: '',
    courseUnit: '',
    yearOfStudy: '',
    semester: '',
    assignedTo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [loadingLecturers, setLoadingLecturers] = useState(true);

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const data = await getLecturers();
        setLecturers(data);
      } catch (err) {
        console.error('Failed to fetch lecturers:', err);
        setError('Failed to load lecturers. Please try again later.');
      } finally {
        setLoadingLecturers(false);
      }
    };

    fetchLecturers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      console.log('Submitting issue with data:', formData);
      
      // Prepare the data with the correct assigned_to field
      const issueData = {
        ...formData,
        assigned_to_id: formData.assignedTo // Map assignedTo to assigned_to_id for the API
      };
      delete issueData.assignedTo; // Remove the original assignedTo field
      
      console.log('Prepared issue data:', issueData);

      const response = await createIssue(issueData);
      console.log('Issue creation response:', response);

      setSuccess('Issue created successfully!');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(err.message || 'Failed to create issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-issue-container">
      <h2>Submit New Issue</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="issue-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="academic">Academic Issues</option>
            <option value="technical">Technical Issues</option>
            <option value="administrative">Administrative Issues</option>
            <option value="examination">Examination Issues</option>
            <option value="registration">Registration Issues</option>
            <option value="other">Other Issues</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="">Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="courseUnit">Course Unit</label>
          <select
            id="courseUnit"
            name="courseUnit"
            value={formData.courseUnit}
            onChange={handleChange}
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
          <label htmlFor="yearOfStudy">Year of Study</label>
          <select
            id="yearOfStudy"
            name="yearOfStudy"
            value={formData.yearOfStudy}
            onChange={handleChange}
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
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            required
          >
            <option value="">Select Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="assignedTo">Lecturer to Assign Issue</label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
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

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </button>
          <button type="button" onClick={() => navigate('/student/dashboard')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIssue;