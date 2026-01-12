import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, resetPasswordError, isResetPasswordLoading, resetPasswordSuccess } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!token) {
      alert('Invalid reset token');
      return;
    }

    try {
      await resetPassword({ token, password: formData.password });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

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
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
              Set New Password
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Enter your new password below.
            </Typography>
          </Box>

          {resetPasswordSuccess ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Password has been reset successfully! Redirecting to login...
              </Alert>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                autoFocus
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                sx={{ mb: 3 }}
              />

              {resetPasswordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetPasswordError.response?.data?.error || 'Failed to reset password. Please try again.'}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isResetPasswordLoading || !token}
                sx={{ mb: 3, py: 1.5 }}
              >
                {isResetPasswordLoading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>

              {!token && (
                <Alert severity="error">
                  Invalid or missing reset token. Please request a new password reset.
                </Alert>
              )}
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword;