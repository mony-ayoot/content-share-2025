import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile';
import NotificationBadge from '../NotificationBadge';
import axios from 'axios';
import '../../styles/Dashboard.css';
import '../../styles/ManagementPage.css';

const API_URL = 'http://localhost:8000/api';

// Map departments to their colleges for filtering
const DEPARTMENT_FACULTY_MAP = {
  'Department of Computer Science': 'College of Computing',
  'Department Of Software Engineering': 'College of Computing',
  'Department of Library And Information System': 'College Of Humanity And Social Sciences',
  'Department Of Information Technology': 'College of Computing'
};

const StudentManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const departmentOptions = [
    'All Departments',
    'Department of Computer Science',
    'Department Of Software Engineering',
    'Department of Library And Information System',
    'Department Of Information Technology'
  ];

  const yearOptions = [
    'All Years',
    'First Year',
    'Second Year',
    'Third Year'
  ];

  // Filter department options based on selected college
  const filteredDepartmentOptions = ['All Departments', ...departmentOptions.filter(dept => 
    dept === 'All Departments' || DEPARTMENT_FACULTY_MAP[dept] === selectedCollege
  )];

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      
      if (selectedCollege && selectedCollege !== 'All Colleges') {
        params.college = selectedCollege;
      }
      if (selectedDepartment && selectedDepartment !== 'All Departments') {
        params.department = selectedDepartment;
      }
      if (selectedYear && selectedYear !== 'All Years') {
        params.year = selectedYear;
      }

      const response = await axios.get(`${API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params
      });

      if (response.data) {
        setStudents(Array.isArray(response.data) ? response.data : []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      if (error.response && error.response.status === 401) {
        // Handle unauthorized access
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCollege, selectedDepartment, selectedYear, navigate]);

  useEffect(() => {
    // Check authentication and get user data
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'registrar') {
      navigate('/login');
      return;
    }
    setUser(userData);
    
    // Set the college filter to the registrar's college and disable changing it
    if (userData.college) {
      setSelectedCollege(userData.college);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
      student.studentNumber?.toLowerCase().includes(filter.toLowerCase()) ||
      student.email?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesCollege = selectedCollege === '' || selectedCollege === 'All Colleges' || 
      student.college === selectedCollege;
    
    const matchesDepartment = selectedDepartment === '' || selectedDepartment === 'All Departments' || 
      student.department?.name === selectedDepartment;
    
    const matchesYear = selectedYear === '' || selectedYear === 'All Years' || 
      student.yearOfStudy === selectedYear;
    
    return matchesSearch && matchesCollege && matchesDepartment && matchesYear;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <span className="graduation-icon">👨‍💼</span>
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
            <li onClick={() => navigate('/registrar')}>
              <span>🏠</span>
              Home
            </li>
            <li onClick={() => navigate('/registrar/issues')}>
              <span>📝</span>
              Issues
            </li>
            <li className="active">
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

            <li onClick={() => navigate('/registrar/notifications')} className="notification-item">
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
          <div className="page-header">
            <h1>Student Management</h1>
          </div>
          
          <div className="filter-bar">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name, ID or email..."
                value={filter}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="filter-dropdowns">
              
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="filter-select"
              >
                {filteredDepartmentOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                {yearOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-spinner">Loading student data...</div>
          ) : (
            <>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Number</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>College</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">No students match your filters</td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => (
                        <tr key={student.id}>
                          <td>{student.studentNumber}</td>
                          <td>{student.fullName}</td>
                          <td>{student.email}</td>
                          <td>{student.college}</td>
                          <td>{student.department.name}</td>
                          <td>{student.yearOfStudy}</td>
                          <td>{student.course}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination-controls">
                <button className="pagination-button" disabled>&lt; Previous</button>
                <span className="page-indicator">Page 1 of 1</span>
                <button className="pagination-button" disabled>Next &gt;</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentManagement;