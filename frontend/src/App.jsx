import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import StudentDashboard from './components/StudentDashboard';
import AddNewIssue from './components/AddNewIssue';
import MyIssues from './components/MyIssues';
import IssueDetail from './components/IssueDetail';
import Notifications from './components/Notifications';
// Import registrar components
import RegistrarDashboard from './components/registrar/RegistrarDashboard';
import StudentManagement from './components/registrar/StudentManagement';
import LecturerManagement from './components/registrar/LecturerManagement';
import DepartmentManagement from './components/registrar/DepartmentManagement';
import RegistrarNotifications from './components/registrar/RegistrarNotifications';
import RegistrarIssues from './components/registrar/RegistrarIssues';
// Import lecturer components
import LecturerDashboard from './components/lecturer/LecturerDashboard';
import LecturerIssueManagement from './components/lecturer/LecturerIssueManagement';
import LecturerNotifications from './components/lecturer/LecturerNotifications';
import './App.css';
import { NotificationProvider } from './context/NotificationContext';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <div className="App">
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Student routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-issue"
              element={
                <PrivateRoute>
                  <AddNewIssue />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-issue/:issueId"
              element={
                <PrivateRoute>
                  <AddNewIssue />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-issues"
              element={
                <PrivateRoute>
                  <MyIssues />
                </PrivateRoute>
              }
            />
            <Route
              path="/issue/:issueId"
              element={
                <PrivateRoute>
                  <IssueDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            
            {/* Registrar routes */}
            <Route
              path="/registrar"
              element={
                <PrivateRoute>
                  <RegistrarDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/registrar/students"
              element={
                <PrivateRoute>
                  <StudentManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/registrar/lecturers"
              element={
                <PrivateRoute>
                  <LecturerManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/registrar/departments"
              element={
                <PrivateRoute>
                  <DepartmentManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/registrar/issues"
              element={
                <PrivateRoute>
                  <RegistrarIssues />
                </PrivateRoute>
              }
            />
            <Route
              path="/registrar/issues/:issueId"
              element={
                <PrivateRoute>
                  <IssueDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/registrar/notifications"
              element={
                <PrivateRoute>
                  <RegistrarNotifications />
                </PrivateRoute>
              }
            />
            
            {/* Lecturer routes */}
            <Route
              path="/lecturer-dashboard"
              element={
                <PrivateRoute>
                  <LecturerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/lecturer/issues"
              element={
                <PrivateRoute>
                  <LecturerIssueManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/lecturer/issues/:issueId"
              element={
                <PrivateRoute>
                  <IssueDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/lecturer/dashboard"
              element={
                <PrivateRoute>
                  <LecturerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/lecturer/issues/:issueId"
              element={
                <PrivateRoute>
                  <IssueDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/lecturer/notifications"
              element={
                <PrivateRoute>
                  <LecturerNotifications />
                </PrivateRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;
