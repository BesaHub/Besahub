import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Link
} from '@mui/material';
import { Security, VpnKey } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MFAVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tempToken = location.state?.tempToken || '';

  React.useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/mfa/verify', {
        tempToken,
        token: verificationCode
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      if (setAuthData) {
        setAuthData({
          user: response.data.user,
          token: response.data.token
        });
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('MFA verification error:', err);
      const errorMsg = err.response?.data?.error || 'Invalid verification code';
      setError(errorMsg);
      
      if (err.response?.status === 401 && errorMsg.includes('expired')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackupCode = async (e) => {
    e.preventDefault();
    
    if (!backupCode.trim()) {
      setError('Please enter a backup code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/mfa/backup-codes/verify', {
        tempToken,
        backupCode: backupCode.toUpperCase()
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      if (setAuthData) {
        setAuthData({
          user: response.data.user,
          token: response.data.token
        });
      }

      if (response.data.warning) {
        alert(response.data.warning);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Backup code verification error:', err);
      const errorMsg = err.response?.data?.error || 'Invalid backup code';
      setError(errorMsg);
      
      if (err.response?.status === 401 && errorMsg.includes('expired')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
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
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the verification code from your authenticator app
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              setTabValue(newValue);
              setError('');
              setVerificationCode('');
              setBackupCode('');
            }}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Authenticator App" />
            <Tab label="Backup Code" />
          </Tabs>

          {tabValue === 0 && (
            <form onSubmit={handleVerifyTotp}>
              <Box sx={{ textAlign: 'center' }}>
                <TextField
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputProps={{
                    maxLength: 6,
                    style: {
                      textAlign: 'center',
                      fontSize: '2rem',
                      letterSpacing: '0.5rem',
                      fontFamily: 'monospace'
                    }
                  }}
                  sx={{ width: 300, my: 3 }}
                  autoFocus
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || verificationCode.length !== 6}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify'}
                </Button>
              </Box>
            </form>
          )}

          {tabValue === 1 && (
            <form onSubmit={handleVerifyBackupCode}>
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Enter one of your backup codes. Each code can only be used once.
                  </Typography>
                </Alert>

                <TextField
                  label="Backup Code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  fullWidth
                  inputProps={{
                    style: {
                      fontFamily: 'monospace',
                      fontSize: '1.2rem',
                      textAlign: 'center'
                    }
                  }}
                  sx={{ mb: 3 }}
                  autoFocus
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !backupCode.trim()}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify Backup Code'}
                </Button>
              </Box>
            </form>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{ cursor: 'pointer' }}
            >
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default MFAVerify;
