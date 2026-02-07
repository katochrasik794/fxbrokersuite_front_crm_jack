const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

/**
 * Authentication service for handling API calls
 */
class AuthService {
  /**
   * Get stored JWT token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Store JWT token in localStorage
   */
  setToken(token) {
    localStorage.setItem('token', token);
  }

  /**
   * Store user data in localStorage
   */
  setUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  /**
   * Get user data from localStorage
   */
  getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Remove token and user data from localStorage
   */
  removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('ibStatusCache');
    localStorage.removeItem('enabledMenusCache');
    localStorage.removeItem('enabledMenusCacheTimestamp');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} - User data and token
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Handle inactive account requiring activation
      if (data.requiresActivation) {
        return {
          requiresActivation: true,
          message: data.message,
          activationLink: data.activationLink,
          email: data.email
        };
      }

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Check if it's an inactive account error
        if (response.status === 403 && data.requiresActivation) {
          return {
            requiresActivation: true,
            message: data.message,
            activationLink: data.activationLink,
            email: data.email
          };
        }
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        // Store user data
        if (data.data.user) {
          this.setUserData(data.data.user);
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      }
      throw error;
    }
  }

  /**
   * Register new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} - User data and token
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        // Store user data
        if (data.data.user) {
          this.setUserData(data.data.user);
        }
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.removeToken();
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<object>} - Response message
   */
  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send password reset email');
      }

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<object>} - Response message
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify token and get user data
   * @returns {Promise<object>} - User data
   */
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
        }
        throw new Error(data.message || 'Token verification failed');
      }

      // Update user data if available
      if (data.success && data.data && data.data.user) {
        this.setUserData(data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Verify token error:', error);
      throw error;
    }
  }
}

export default new AuthService();

