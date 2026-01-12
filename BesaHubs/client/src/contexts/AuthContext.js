import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
const API_URL = '/api';
axios.defaults.baseURL = API_URL;

console.log('🔧 API Configuration:', {
  API_URL,
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

// Request interceptor to add auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Get current user query
  const { refetch: refetchUser } = useQuery(
    'currentUser',
    async () => {
      const response = await axios.get('/auth/me');
      return response.data.user;
    },
    {
      enabled: !!localStorage.getItem('token') && !user,
      onSuccess: (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      },
      onError: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      },
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    async ({ email, password }) => {
      console.log('Making login API call to:', axios.defaults.baseURL + '/auth/login');
      console.log('With credentials:', { email, password: '***' });
      const response = await axios.post('/auth/login', { email, password });
      console.log('Login API response:', response.data);
      return response.data;
    },
    {
      onMutate: () => {
        // Clear any previous errors when starting a new login attempt
        console.log('Login mutation starting - clearing previous errors');
      },
      onSuccess: (data) => {
        console.log('Login mutation onSuccess called with data:', data);
        const { token, user: userData } = data;

        // Store in localStorage first
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state
        setUser(userData);
        console.log('User state updated:', userData);

        // Invalidate queries
        queryClient.invalidateQueries();

        // Force a small delay to ensure state has propagated
        setTimeout(() => {
          console.log('Login state fully synchronized, user:', userData);
        }, 100);
      },
      onError: (error) => {
        console.error('Login mutation onError called:', error);
        console.error('Full error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      },
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    async (userData) => {
      const response = await axios.post('/auth/register', userData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        const { token, user: userData } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Registration error:', error);
      },
    }
  );

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  // Update user profile
  const updateProfileMutation = useMutation(
    async (profileData) => {
      const response = await axios.put('/auth/me', profileData);
      return response.data.user;
    },
    {
      onSuccess: (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        queryClient.invalidateQueries('currentUser');
      },
    }
  );

  // Change password
  const changePasswordMutation = useMutation(
    async ({ currentPassword, newPassword }) => {
      const response = await axios.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    }
  );

  // Forgot password
  const forgotPasswordMutation = useMutation(
    async ({ email }) => {
      const response = await axios.post('/auth/forgot-password', { email });
      return response.data;
    }
  );

  // Reset password
  const resetPasswordMutation = useMutation(
    async ({ token, password }) => {
      const response = await axios.post('/auth/reset-password', { token, password });
      return response.data;
    }
  );

  // Helper functions
  const isAuthenticated = () => !!user;
  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);
  const hasPermission = (resource, action) => {
    if (!user?.permissions) return false;
    return user.permissions[resource]?.includes(action) || false;
  };

  const value = {
    // State
    user,
    isLoading: isLoading || loginMutation.isLoading || registerMutation.isLoading,
    
    // Auth status
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasPermission,
    
    // Actions
    login: async (credentials) => {
      // Reset login mutation state before attempting login
      console.log('🔄 Resetting login mutation state...');
      loginMutation.reset();
      console.log('🚀 Calling loginMutation.mutateAsync with:', { ...credentials, password: '***' });
      try {
        const result = await loginMutation.mutateAsync(credentials);
        console.log('✅ loginMutation.mutateAsync completed successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ loginMutation.mutateAsync failed:', error);
        throw error;
      }
    },
    register: registerMutation.mutateAsync,
    logout,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    refetchUser,
    
    // Mutation states
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    updateProfileError: updateProfileMutation.error,
    changePasswordError: changePasswordMutation.error,
    forgotPasswordError: forgotPasswordMutation.error,
    resetPasswordError: resetPasswordMutation.error,
    
    // Loading states
    isLoginLoading: loginMutation.isLoading,
    isRegisterLoading: registerMutation.isLoading,
    isUpdateProfileLoading: updateProfileMutation.isLoading,
    isChangePasswordLoading: changePasswordMutation.isLoading,
    isForgotPasswordLoading: forgotPasswordMutation.isLoading,
    isResetPasswordLoading: resetPasswordMutation.isLoading,
    
    // Success states
    forgotPasswordSuccess: forgotPasswordMutation.isSuccess,
    resetPasswordSuccess: resetPasswordMutation.isSuccess,
    changePasswordSuccess: changePasswordMutation.isSuccess,
    updateProfileSuccess: updateProfileMutation.isSuccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;