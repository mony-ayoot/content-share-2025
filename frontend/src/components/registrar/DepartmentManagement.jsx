import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile';
import NotificationBadge from '../NotificationBadge';
import '../../styles/Dashboard.css';
import '../../styles/ManagementPage.css';

const DepartmentManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    faculty: '',
    headOfDepartment: '',
    numberOfStaff: '',
    numberOfStudents: '',
    establishmentDate: ''
  });

  useEffect(() => {
    // Check authentication
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'registrar') {
      navigate('/login');
      return;
    }
    setUser(userData);
    
    // Fetch department data
    fetchDepartments();
  }, [navigate]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      const mockDepartments = [
        {
          id: 1,
          name: 'Department of Computer Science',
          faculty: 'Computing and Technology',
          headOfDepartment: 'Dr. Robert Johnson',
          numberOfStaff: 24,
          numberOfStudents: 345,
          establishmentDate: '2005-09-01'
        },
        {
          id: 2,
          name: 'Department Of Software Engineering',
          faculty: 'Computing and Technology',
          headOfDepartment: 'Prof. Sarah Williams',
          numberOfStaff: 18,
          numberOfStudents: 278,
          establishmentDate: '2010-02-15'
        },
        {
          id: 3,
          name: 'Department of Library And Information System',
          faculty: 'Computing and Technology',
          headOfDepartment: 'Dr. Michael Davis',
          numberOfStaff: 15,
          numberOfStudents: 187,
          establishmentDate: '2008-05-10'
        },
        {
          id: 4,
          name: 'Department Of Information Technology',
          faculty: 'Computing and Technology',
          headOfDepartment: 'Prof. Emily Chen',
          numberOfStaff: 21,
          numberOfStudents: 310,
          establishmentDate: '2007-11-22'
        }
      ];
      
      setTimeout(() => {
        setDepartments(mockDepartments);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleNewDepartmentChange = (e) => {
    const { name, value } = e.target;
    setNewDepartment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDepartment = () => {
    // Validation
    if (!newDepartment.name || !newDepartment.faculty || !newDepartment.headOfDepartment) {
      alert('Please fill in all required fields.');
      return;
    }

    // Add the new department (in a real app, this would be an API call)
    const newDeptWithId = {
      ...newDepartment,
      id: departments.length + 1, // Simulated ID
      numberOfStaff: parseInt(newDepartment.numberOfStaff) || 0,
      numberOfStudents: parseInt(newDepartment.numberOfStudents) || 0
    };

    setDepartments([...departments, newDeptWithId]);
    setShowAddModal(false);
    setNewDepartment({
      name: '',
      faculty: '',
      headOfDepartment: '',
      numberOfStaff: '',
      numberOfStudents: '',
      establishmentDate: ''
    });
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(filter.toLowerCase()) ||
    dept.headOfDepartment.toLowerCase().includes(filter.toLowerCase()) ||
    dept.faculty.toLowerCase().includes(filter.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
            <li onClick={() => navigate('/registrar/students')}>
              <span>👨‍🎓</span>
              Students
            </li>
            <li onClick={() => navigate('/registrar/lecturers')}>
              <span>👨‍🏫</span>
              Lecturers
            </li>
            <li className="active">
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
            <h1>Department Management</h1>
            <button className="primary-button" onClick={() => setShowAddModal(true)}>
              Add New Department
            </button>
          </div>
          
          <div className="filter-bar">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search departments by name, faculty or head..."
                value={filter}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="loading-spinner">Loading department data...</div>
          ) : (
            <>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Faculty</th>
                      <th>Head of Department</th>
                      <th>Staff</th>
                      <th>Students</th>
                      <th>Established</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">No departments match your search</td>
                      </tr>
                    ) : (
                      filteredDepartments.map(dept => (
                        <tr key={dept.id}>
                          <td>{dept.name}</td>
                          <td>{dept.faculty}</td>
                          <td>{dept.headOfDepartment}</td>
                          <td>{dept.numberOfStaff}</td>
                          <td>{dept.numberOfStudents}</td>
                          <td>{formatDate(dept.establishmentDate)}</td>
                          <td className="actions-cell">
                            <button className="icon-button view-button" title="View Details">👁️</button>
                            <button className="icon-button edit-button" title="Edit">✏️</button>
                            <button className="icon-button delete-button" title="Delete">🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {/* Add Department Modal */}
          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Add New Department</h2>
                <div className="form-group">
                  <label>Department Name*</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={newDepartment.name}
                    onChange={handleNewDepartmentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Faculty*</label>
                  <input 
                    type="text" 
                    name="faculty" 
                    value={newDepartment.faculty}
                    onChange={handleNewDepartmentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Head of Department*</label>
                  <input 
                    type="text" 
                    name="headOfDepartment" 
                    value={newDepartment.headOfDepartment}
                    onChange={handleNewDepartmentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Number of Staff</label>
                  <input 
                    type="number" 
                    name="numberOfStaff" 
                    value={newDepartment.numberOfStaff}
                    onChange={handleNewDepartmentChange}
                  />
                </div>
                <div className="form-group">
                  <label>Number of Students</label>
                  <input 
                    type="number" 
                    name="numberOfStudents" 
                    value={newDepartment.numberOfStudents}
                    onChange={handleNewDepartmentChange}
                  />
                </div>
                <div className="form-group">
                  <label>Establishment Date</label>
                  <input 
                    type="date" 
                    name="establishmentDate" 
                    value={newDepartment.establishmentDate}
                    onChange={handleNewDepartmentChange}
                  />
                </div>
                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button className="primary-button" onClick={handleAddDepartment}>
                    Add Department
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

export default DepartmentManagement;