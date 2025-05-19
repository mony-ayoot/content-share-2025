/**
 * Configuration for the application
 * This file contains environment-specific configuration
 */

// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_API_URL || '/api';

export default {
  API_URL,
}; 