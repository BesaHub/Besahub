import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  QrCode2,
  VpnKey,
  CheckCircle,
  Info,
  Security
} from '@mui/icons-material';
import api from '../../services/api';

const MFASetup = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaData, setMfaData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  const steps = ['Generate Secret', 'Scan QR Code', 'Verify', 'Save Backup Codes'];

  useEffect(() => {
    initializeMFA();
  }, []);

  const initializeMFA = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/mfa/setup');
      setMfaData(response.data);
      setActiveStep(1);
    } catch (err) {
      console.error('MFA setup error:', err);
      setError(err.response?.data?.error || 'Failed to initialize MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/mfa/verify-setup', {
        token: verificationCode,
        secret: mfaData.secret
      });

      setBackupCodes(response.data.backupCodes);
      setActiveStep(3);
    } catch (err) {
      console.error('MFA verification error:', err);
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/settings');
  };

  const handleDownloadBackupCodes = () => {
    const text = `BesaHubs CRM - MFA Backup Codes\n\n${backupCodes.join('\n')}\n\nSave these codes in a secure location. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'besahubs-mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    alert('Backup codes copied to clipboard');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4">Set Up Multi-Factor Authentication</Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Initializing MFA setup...
            </Typography>
          </Box>
        )}

        {activeStep === 1 && mfaData && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      <QrCode2 /> Scan QR Code
                    </Typography>
                    <Box
                      component="img"
                      src={mfaData.qrCodeUrl}
                      alt="MFA QR Code"
                      sx={{
                        width: '100%',
                        maxWidth: 250,
                        height: 'auto',
                        my: 2
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <VpnKey /> Manual Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Can't scan? Enter this key manually:
                    </Typography>
                    <TextField
                      fullWidth
                      value={mfaData.manualEntryKey}
                      InputProps={{
                        readOnly: true,
                        sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                      }}
                      sx={{ my: 2 }}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(mfaData.manualEntryKey);
                        alert('Key copied to clipboard');
                      }}
                    >
                      Copy Key
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setActiveStep(2)}
              >
                Next: Verify Code
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Enter the 6-digit code from your authenticator app to verify the setup
              </Typography>
            </Alert>

            <form onSubmit={handleVerifyCode}>
              <Box sx={{ textAlign: 'center' }}>
                <TextField
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

                <Box sx={{ mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify & Enable MFA'}
                  </Button>
                </Box>
              </Box>
            </form>
          </Box>
        )}

        {activeStep === 3 && backupCodes.length > 0 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                Important: Save these backup codes in a secure location!
              </Typography>
              <Typography variant="body2">
                Each code can only be used once. You'll need them if you lose access to your authenticator app.
              </Typography>
            </Alert>

            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Backup Codes
                </Typography>
                <Grid container spacing={2}>
                  {backupCodes.map((code, index) => (
                    <Grid item xs={6} key={index}>
                      <Paper sx={{ p: 2, textAlign: 'center', fontFamily: 'monospace', bgcolor: 'white' }}>
                        {code}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                onClick={handleDownloadBackupCodes}
                fullWidth
              >
                Download Codes
              </Button>
              <Button
                variant="outlined"
                onClick={handleCopyBackupCodes}
                fullWidth
              >
                Copy to Clipboard
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                MFA Successfully Enabled!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your account is now protected with two-factor authentication
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleComplete}
              >
                Go to Settings
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MFASetup;
