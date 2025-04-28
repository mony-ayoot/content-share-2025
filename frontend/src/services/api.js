import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Instead of redirecting, we'll throw an error that components can handle
      localStorage.removeItem('token');
      throw new Error('Authentication required. Please log in again.');
    }
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

// User authentication
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const registerUser = async (userData) => {
  console.log('Registering user with data:', JSON.stringify(userData, null, 2));
  
  try {
    const response = await api.post('/register/', userData);
    console.log('Registration success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response?.data?.errors) {
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          }
          return `${field}: ${messages}`;
        })
        .join('\n');
      throw new Error(errorMessages);
    }
    throw error.response?.data || error.message;
  }
};

export const getStudentIssues = async () => {
  try {
    console.log('Fetching all student issues');
    const response = await api.get('/student/issues', {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    console.log('Received issues:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server responded with error:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

export const getIssueById = async (issueId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const user = JSON.parse(localStorage.getItem('user'));
    let endpoint = '/issues';
    
    // Use different endpoints based on user role
    if (user.role === 'registrar') {
      endpoint = '/registrar/issues';
    } else if (user.role === 'lecturer') {
      endpoint = '/lecturer/issues';
    }

    const response = await api.get(`${endpoint}/${issueId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Issue not found');
    }
    
    throw error.response?.data || error.message;
  }
};

export const createIssue = async (issueData) => {
  try {
    console.log('Creating issue with data:', issueData);
    
    // Create FormData if there's an attachment
    let data = issueData;
    if (issueData.attachment) {
      const formData = new FormData();
      // Add all non-file fields to FormData
      Object.keys(issueData).forEach(key => {
        if (key === 'attachment') {
          formData.append('attachment', issueData.attachment);
        } else {
          formData.append(key, issueData[key]);
        }
      });
      data = formData;
    }

    const response = await api.post('/student/issues', data, {
      headers: {
        ...(issueData.attachment ? {
          'Content-Type': 'multipart/form-data'
        } : {
          'Content-Type': 'application/json'
        })
      }
    });
    console.log('Issue creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createIssue:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const updateIssue = async (issueId, issueData) => {
  try {
    console.log('Updating issue:', issueId, 'with data:', issueData);
    
    // Create FormData if there's an attachment
    let data = issueData;
    if (issueData.attachment) {
      const formData = new FormData();
      // Add all non-file fields to FormData
      Object.keys(issueData).forEach(key => {
        if (key === 'attachment') {
          formData.append('attachment', issueData.attachment);
        } else {
          formData.append(key, issueData[key]);
        }
      });
      data = formData;
    }

    const response = await api.patch(`/student/issues/${issueId}`, data, {
      headers: {
        ...(issueData.attachment ? {
          'Content-Type': 'multipart/form-data'
        } : {
          'Content-Type': 'application/json'
        })
      }
    });
    
    console.log('Issue updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating issue:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getNotifications = async () => {
  try {
    console.log('Fetching notifications');
    const response = await api.get('/notifications', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    console.log('Received notifications:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server responded with error:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    console.log('Marking notification as read:', notificationId);
    const response = await api.post(`/notifications/${notificationId}/mark-read`, {}, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    console.log('Notification marked as read:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server responded with error:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

export const getStudents = async () => {
  try {
    console.log('Fetching all students');
    const response = await api.get('/students', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    console.log('Received students:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server responded with error:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};
export const getRegistrarIssues = async () => {
  try {
    const response = await api.get('/registrar/issues', {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw error;
    }
  }
};

export const getRegistrarIssueById = async (issueId) => {
  try {
    const response = await api.get(`/registrar/issues/${issueId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Issue not found');
    }
    throw error.response?.data || error.message;
  }
};

export const getLecturerIssues = async () => {
  try {
    const response = await api.get('/lecturer/issues', {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw error;
    }
  }
};

export const updateIssueStatus = async (issueId, status) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await api.patch(`/issues/${issueId}/update`, {
      status
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating issue status:', error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      throw new Error('Authentication required. Please log in again.');
    }
    throw error.response?.data || error.message;
  }
};

export const assignIssueToLecturer = async (issueId, lecturerId) => {
  try {
    const response = await api.patch(`/issues/${issueId}/assign`, {
      lecturer_id: lecturerId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteIssue = async (issueId) => {
  try {
    const response = await api.delete(`/issues/${issueId}/delete`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getLecturers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.department) {
      params.append('department', filters.department);
    }

    const response = await api.get(`/lecturers?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching lecturers:', error);
    throw error.response?.data || error.message;
  }
};

export const deleteLecturer = async (lecturerId) => {
  try {
    const response = await api.delete(`/lecturers/${lecturerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateLecturer = async (lecturerId, data) => {
  try {
    const response = await api.patch(`/lecturers/${lecturerId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default api;