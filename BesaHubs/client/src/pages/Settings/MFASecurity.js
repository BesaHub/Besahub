import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Warning,
  VpnKey
} from '@mui/icons-material';
import api from '../../services/api';

const MFASecurity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const fetchMfaStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/mfa/status');
      setMfaStatus(response.data);
    } catch (err) {
      console.error('Error fetching MFA status:', err);
      setError('Failed to load MFA status');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMfa = () => {
    navigate('/mfa/setup');
  };

  const handleDisableMfa = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      await api.post('/mfa/disable', { password });
      
      setSuccess('MFA has been disabled for your account');
      setDisableDialogOpen(false);
      setPassword('');
      fetchMfaStatus();
    } catch (err) {
      console.error('Error disabling MFA:', err);
      setError(err.response?.data?.error || 'Failed to disable MFA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      const response = await api.post('/mfa/backup-codes/generate', { password });
      
      setBackupCodes(response.data.backupCodes);
      setSuccess('New backup codes generated successfully');
      setPassword('');
      fetchMfaStatus();
    } catch (err) {
      console.error('Error regenerating backup codes:', err);
      setError(err.response?.data?.error || 'Failed to generate backup codes');
    } finally {
      setActionLoading(false);
    }
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

  const handleCloseRegenerateDialog = () => {
    setRegenerateDialogOpen(false);
    setBackupCodes([]);
    setPassword('');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading MFA settings...
        </Typography>
      </Container>
    );
  }

  if (!mfaStatus) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load MFA settings</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4">Multi-Factor Authentication</Typography>
            <Typography variant="body2" color="text.secondary">
              Add an extra layer of security to your account
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">MFA Status</Typography>
              {mfaStatus.mfaEnabled ? (
                <Chip
                  label="Enabled"
                  color="success"
                  icon={<CheckCircle />}
                />
              ) : (
                <Chip
                  label="Disabled"
                  color="default"
                  icon={<Warning />}
                />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Role:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {mfaStatus.role?.toUpperCase()}
                </Typography>
              </Grid>

              {mfaStatus.mfaEnabled && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Backup Codes Remaining:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {mfaStatus.backupCodesRemaining || 0}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {!mfaStatus.canEnableMfa && (
          <Alert severity="info" sx={{ mb: 3 }}>
            MFA is only available for Admin and Manager roles
          </Alert>
        )}

        {mfaStatus.canEnableMfa && !mfaStatus.mfaEnabled && (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                MFA is recommended for Admin and Manager accounts
              </Typography>
              <Typography variant="body2">
                Enable two-factor authentication to add an extra layer of security to your account
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              startIcon={<Security />}
              onClick={handleEnableMfa}
              fullWidth
            >
              Enable Multi-Factor Authentication
            </Button>
          </Box>
        )}

        {mfaStatus.mfaEnabled && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Manage MFA Settings
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<VpnKey />}
                  onClick={() => setRegenerateDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Regenerate Backup Codes
                </Button>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setDisableDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Disable MFA
                </Button>
              </Grid>
            </Grid>

            {mfaStatus.backupCodesRemaining <= 2 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                You have {mfaStatus.backupCodesRemaining} backup codes remaining. Consider regenerating them.
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)}>
        <DialogTitle>Disable Multi-Factor Authentication</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will remove the extra security layer from your account
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your password to confirm:
          </Typography>
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDisableMfa}
            color="error"
            variant="contained"
            disabled={actionLoading || !password}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Disable MFA'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={regenerateDialogOpen}
        onClose={handleCloseRegenerateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Regenerate Backup Codes</DialogTitle>
        <DialogContent>
          {backupCodes.length === 0 ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will invalidate all existing backup codes and generate new ones
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your password to confirm:
              </Typography>
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                New backup codes generated successfully!
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Save these codes in a secure location. Each code can only be used once.
              </Typography>
              <Grid container spacing={1}>
                {backupCodes.map((code, index) => (
                  <Grid item xs={6} key={index}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', fontFamily: 'monospace', bgcolor: 'grey.50' }}>
                      {code}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {backupCodes.length === 0 ? (
            <>
              <Button onClick={handleCloseRegenerateDialog} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleRegenerateBackupCodes}
                variant="contained"
                disabled={actionLoading || !password}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Generate New Codes'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleDownloadBackupCodes} variant="outlined">
                Download Codes
              </Button>
              <Button onClick={handleCloseRegenerateDialog} variant="contained">
                Done
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MFASecurity;
