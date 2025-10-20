import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import TurnstileWidget from '../../components/TurnstileWidget';

const Login = ({ onSuccess, embedded = false }) => {
  const navigate = useNavigate();
  const { login, loginError, isLoginLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: 'admin@demo.com',
    password: 'Admin@Demo123'
  });
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCaptchaSuccess = (token) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 Login form submitted with:', { ...formData, password: '***' });

    try {
      console.log('🚀 Calling login function...');
      const loginData = { ...formData };
      if (captchaToken) {
        loginData.captchaToken = captchaToken;
      }
      const result = await login(loginData);
      console.log('✅ Login successful, result:', result);

      // Check if MFA is required
      if (result?.requiresMfa && result?.tempToken) {
        console.log('🔐 MFA verification required, redirecting...');
        navigate('/mfa/verify', { 
          state: { tempToken: result.tempToken } 
        });
        return;
      }

      // Let the PublicRoute component handle navigation after state updates
      // The user state will be updated by the login mutation's onSuccess callback
      // and the PublicRoute will automatically redirect to /dashboard

      if (onSuccess) {
        console.log('📞 Calling onSuccess callback');
        onSuccess();
      } else {
        console.log('⚠️ No onSuccess callback provided');
      }
      // Don't manually navigate - let React Router handle it based on auth state
    } catch (error) {
      console.error('❌ Login error in form handler:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
    }
  };

  if (embedded) {
    return (
      <Box sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              fontWeight: 700,
              mb: 2,
              letterSpacing: '-0.5px'
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                color: '#1976d2',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif'
              }}
            >
              Besa
            </Box>
            <Box 
              component="span" 
              sx={{ 
                color: '#7c3aed',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif'
              }}
            >
              Hub
            </Box>
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Sign in to your account
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </Box>

          <TurnstileWidget 
            onSuccess={handleCaptchaSuccess}
            onError={handleCaptchaError}
            onExpire={handleCaptchaExpire}
          />

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError.response?.data?.error || 'Login failed. Please try again.'}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoginLoading}
            sx={{ mb: 3, py: 1.5, fontSize: '1.1rem' }}
          >
            {isLoginLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mb: 1 }}>
            <strong>Demo Credentials:</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
            Email: admin@demo.com<br />
            Password: Admin@Demo123
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h2" 
              component="h1"
              sx={{ 
                fontWeight: 700,
                mb: 2,
                letterSpacing: '-0.5px'
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  color: '#1976d2',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif'
                }}
              >
                Besa
              </Box>
              <Box 
                component="span" 
                sx={{ 
                  color: '#7c3aed',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif'
                }}
              >
                Hub
              </Box>
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Commercial Real Estate Management System
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </Box>

            <TurnstileWidget 
              onSuccess={handleCaptchaSuccess}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
            />

            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError.response?.data?.error || 'Login failed. Please try again.'}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoginLoading}
              sx={{ mb: 3, py: 1.5, fontSize: '1.1rem' }}
            >
              {isLoginLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Sign up here
              </Link>
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              <Link to="/forgot-password" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Forgot your password?
              </Link>
            </Typography>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', display: 'block' }}>
              Demo Credentials: admin@demo.com / Admin@Demo123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;