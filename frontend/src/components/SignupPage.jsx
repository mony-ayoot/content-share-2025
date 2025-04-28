import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import '../statics/Login.css';

const SignupPage = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userId: '',
    password: '',
    confirmPassword: '',
    college: '',
    department: '',
    yearOfStudy: '',
    course: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const collegeOptions = [
    'College of Computing',
    'College Of Humanity And Social Sciences',
    'College Of Engineering',
    'College Of Education'
  ];

  const departmentOptions = [
    'Department of Computer Science',
    'Department Of Software Engineering',
    'Department of Library And Information System',
    'Department Of Information Technology'
  ];

  const yearOptions = [
    'First Year',
    'Second Year',
    'Third Year'
  ];

  const courseOptions = [
    'Computer Science',
    'Software Engineering',
    'Library and Information',
    'Information Technology'
  ];

  const getInputLabel = () => {
    switch(activeTab) {
      case 'student':
        return { label: 'Student number', placeholder: '2400721333' };
      case 'lecturer':
        return { label: 'Lecturer ID', placeholder: 'Enter Lecturer ID' };
      case 'registrar':
        return { label: 'Registrar ID', placeholder: 'REG001' };
      default:
        return { label: 'Student number', placeholder: '2400721333' };
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Auto-format registrar ID
    if (id === 'userId' && activeTab === 'registrar') {
      // Remove any existing "REG" prefix and all spaces
      let cleanValue = value.replace(/^REG/i, '').replace(/\s/g, '');
      
      // If it's a number, format it
      if (/^\d*$/.test(cleanValue)) {
        // Pad with zeros if less than 3 digits
        cleanValue = cleanValue.padStart(3, '0');
        // Add REG prefix without space
        const formattedValue = `REG${cleanValue}`;
        setFormData(prev => ({
          ...prev,
          [id]: formattedValue
        }));
        return;
      }
    }

    // Default handling for other fields
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate registrar ID format
    if (activeTab === 'registrar') {
      const regIdPattern = /^REG\d{3}$/;
      if (!regIdPattern.test(formData.userId)) {
        setError('Registrar ID must be in the format "REGXXX" where XXX is a 3-digit number');
        return;
      }
    }

    try {
      let userData;

      // Handle lecturer registration differently
      if (activeTab === 'lecturer') {
        userData = {
          fullName: formData.fullName,  // Keep as single field
          email: formData.email,
          userId: formData.userId,      // Use userId instead of username
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: 'lecturer',            // Add role field
          lecturer_data: {
            department: formData.department
          }
        };
      } else {
        // Split full name into first and last name for other roles
        const nameParts = formData.fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        // For other roles, keep existing structure
        userData = {
          username: formData.userId,
          email: formData.email,
          password: formData.password,
          role: activeTab,
          first_name: firstName,
          last_name: lastName
        };

        // Add role-specific data
        if (activeTab === 'student') {
          userData.student_data = {
            college: formData.college,
            department: formData.department,
            year_of_study: formData.yearOfStudy,
            course: formData.course
          };
        } else if (activeTab === 'registrar') {
          userData.registrar_data = {
            college: formData.college,
            department: formData.department
          };
        }
      }

      console.log('Sending registration data:', JSON.stringify(userData, null, 2));
      const response = await registerUser(userData);
      console.log('Registration success:', response);
      
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <h1>AiTs</h1>
      </header>
      <h3 className="page-title">Sign Up</h3>
      <div className="login-box">
        <h2>Create Account</h2>
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <span className="tab-icon">👨‍🎓</span>
            Student
          </button>
          <button 
            className={`tab ${activeTab === 'lecturer' ? 'active' : ''}`}
            onClick={() => setActiveTab('lecturer')}
          >
            <span className="tab-icon">👨‍🏫</span>
            Lecturer
          </button>
          <button 
            className={`tab ${activeTab === 'registrar' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrar')}
          >
            <span className="tab-icon">👨‍💼</span>
            Registrar
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name" 
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email" 
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="userId">{getInputLabel().label}</label>
            <input 
              type="text" 
              id="userId" 
              value={formData.userId}
              onChange={handleChange}
              placeholder={getInputLabel().placeholder}
              required
            />
          </div>
          {(activeTab === 'student' || activeTab === 'lecturer' || activeTab === 'registrar') && (
            <>
              <div className="form-group">
                <label htmlFor="college">College</label>
                <select 
                  id="college" 
                  value={formData.college}
                  onChange={handleChange}
                  required
                  className="select-dropdown"
                >
                  <option value="" disabled>Select your college</option>
                  {collegeOptions.map((college, index) => (
                    <option key={index} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select 
                  id="department" 
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="select-dropdown"
                >
                  <option value="" disabled>Select your department</option>
                  {departmentOptions.map((department, index) => (
                    <option key={index} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {activeTab === 'student' && (
            <>
              <div className="form-group">
                <label htmlFor="yearOfStudy">Year of Study</label>
                <select 
                  id="yearOfStudy" 
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  required
                  className="select-dropdown"
                >
                  <option value="" disabled>Select your year of study</option>
                  {yearOptions.map((year, index) => (
                    <option key={index} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="course">Course</label>
                <select 
                  id="course" 
                  value={formData.course}
                  onChange={handleChange}
                  required
                  className="select-dropdown"
                >
                  <option value="" disabled>Select your course</option>
                  {courseOptions.map((course, index) => (
                    <option key={index} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password" 
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password" 
              required
            />
          </div>
          <button type="submit" className="login-button">
            Sign Up
          </button>
          <div className="signup-link-container">
            <span>Already have an account? </span>
            <a onClick={() => navigate('/login')} className="signup-link" style={{ cursor: 'pointer' }}>
              Log in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;