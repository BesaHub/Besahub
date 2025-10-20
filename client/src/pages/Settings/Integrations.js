import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Email,
  CalendarToday,
  Dashboard as DashboardIcon,
  Flag,
  HealthAndSafety,
  CheckCircle,
  Cancel,
  Sync,
  Delete,
  Send,
  Refresh,
  OpenInNew,
  Google,
  Microsoft
} from '@mui/icons-material';
import integrationsApi from '../../services/integrationsApi';
import calendarApi from '../../services/calendarApi';
import { useAuth } from '../../contexts/AuthContext';

const Integrations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sendGridStatus, setSendGridStatus] = useState(null);
  const [calendarAccounts, setCalendarAccounts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [error, setError] = useState(null);
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sendGridRes, calendarRes, healthRes, flagsRes] = await Promise.all([
        integrationsApi.getSendGridStatus().catch(() => null),
        calendarApi.getAccounts().catch(() => ({ data: { accounts: [] } })),
        isAdmin ? integrationsApi.getSystemHealth().catch(() => null) : Promise.resolve(null),
        isAdmin ? integrationsApi.getFeatureFlags().catch(() => null) : Promise.resolve(null)
      ]);

      setSendGridStatus(sendGridRes);
      setCalendarAccounts(calendarRes.data?.accounts || []);
      setSystemHealth(healthRes);
      setFeatureFlags(flagsRes);
    } catch (err) {
      setError('Failed to load integration data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setTestEmailLoading(true);
      await integrationsApi.sendTestEmail(testEmail);
      alert('Test email sent successfully!');
      setTestEmailDialog(false);
      setTestEmail('');
    } catch (err) {
      alert('Failed to send test email: ' + (err.response?.data?.error || err.message));
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleConnectCalendar = async (provider) => {
    try {
      const { data } = await calendarApi.getConnectUrl(provider);
      const authWindow = window.open(data.authUrl, 'Calendar Connection', 'width=600,height=700');
      
      const handleMessage = (event) => {
        if (event.data.type === 'calendar-connected') {
          authWindow.close();
          fetchData();
          alert(`${provider === 'google' ? 'Google' : 'Microsoft'} Calendar connected successfully!`);
        } else if (event.data.type === 'calendar-error') {
          alert('Failed to connect calendar: ' + event.data.error);
        }
      };

      window.addEventListener('message', handleMessage);
      
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 500);
    } catch (err) {
      alert('Failed to initiate calendar connection: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDisconnectCalendar = async (accountId) => {
    if (!window.confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }
    
    try {
      await calendarApi.disconnectAccount(accountId);
      alert('Calendar disconnected successfully');
      fetchData();
    } catch (err) {
      alert('Failed to disconnect calendar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSyncCalendar = async (accountId) => {
    try {
      await calendarApi.syncAccount(accountId);
      alert('Calendar synced successfully');
      fetchData();
    } catch (err) {
      alert('Failed to sync calendar: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Integrations
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchData}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* SendGrid Email Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<Email color="primary" />}
              title="SendGrid Email"
              subheader="Transactional email service"
            />
            <CardContent>
              {sendGridStatus ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                    <Chip
                      label={sendGridStatus.configured ? 'Connected' : 'Not Configured'}
                      color={sendGridStatus.configured ? 'success' : 'warning'}
                      size="small"
                      icon={sendGridStatus.configured ? <CheckCircle /> : <Cancel />}
                    />
                  </Box>

                  {sendGridStatus.configured && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>From Email:</strong> {sendGridStatus.fromEmail || 'Not set'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>From Name:</strong> {sendGridStatus.fromName || 'Not set'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Templates Configured:</strong>{' '}
                        {Object.values(sendGridStatus.templates || {}).filter(Boolean).length} / 3
                      </Typography>

                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={() => setTestEmailDialog(true)}
                        fullWidth
                      >
                        Send Test Email
                      </Button>
                    </>
                  )}

                  {!sendGridStatus.configured && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Configure SendGrid by setting SENDGRID_API_KEY in your environment variables.
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="warning">Failed to load SendGrid status</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar Integrations Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<CalendarToday color="primary" />}
              title="Calendar Integrations"
              subheader={`${calendarAccounts.length} account(s) connected`}
            />
            <CardContent>
              {calendarAccounts.length > 0 ? (
                <List dense>
                  {calendarAccounts.map((account) => (
                    <ListItem key={account.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {account.provider === 'google' ? (
                              <Google fontSize="small" />
                            ) : (
                              <Microsoft fontSize="small" />
                            )}
                            <Typography variant="body2">{account.email}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Last synced: {account.lastSyncedAt 
                                ? new Date(account.lastSyncedAt).toLocaleString()
                                : 'Never'}
                            </Typography>
                            <Chip
                              label={account.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={account.isActive ? 'success' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Sync Now">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleSyncCalendar(account.id)}
                            sx={{ mr: 1 }}
                          >
                            <Sync fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Disconnect">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDisconnectCalendar(account.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No calendar accounts connected
                </Alert>
              )}

              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={() => handleConnectCalendar('google')}
                  fullWidth
                >
                  Connect Google
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Microsoft />}
                  onClick={() => handleConnectCalendar('microsoft')}
                  fullWidth
                >
                  Connect Microsoft
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard & Reports Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<DashboardIcon color="primary" />}
              title="Dashboards & Reports"
              subheader="Custom dashboards and widgets"
            />
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="body2" sx={{ mr: 1 }}>Feature Status:</Typography>
                <Chip
                  label={featureFlags?.data?.DASHBOARDS_ENABLED ? 'Enabled' : 'Disabled'}
                  color={featureFlags?.data?.DASHBOARDS_ENABLED ? 'success' : 'warning'}
                  size="small"
                  icon={featureFlags?.data?.DASHBOARDS_ENABLED ? <CheckCircle /> : <Cancel />}
                />
              </Box>

              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Create custom dashboards with real-time metrics and visualizations
              </Typography>

              <Button
                variant="contained"
                endIcon={<OpenInNew />}
                onClick={() => navigate('/dashboards')}
                fullWidth
              >
                Go to Dashboards
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Flags Section (Admin Only) */}
        {isAdmin && featureFlags && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<Flag color="primary" />}
                title="Feature Flags"
                subheader="System feature toggles (read-only)"
              />
              <CardContent>
                <List dense>
                  {Object.entries(featureFlags.data || {}).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key.replace(/_/g, ' ')}
                        secondary="Configured in environment variables"
                      />
                      <Chip
                        label={value ? 'Enabled' : 'Disabled'}
                        color={value ? 'success' : 'default'}
                        size="small"
                        icon={value ? <CheckCircle /> : <Cancel />}
                      />
                    </ListItem>
                  ))}
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Feature flags can only be changed via environment variables (.env file)
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* System Health Section (Admin Only) */}
        {isAdmin && systemHealth && (
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<HealthAndSafety color="primary" />}
                title="System Health"
                subheader="API and infrastructure status"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="caption" color="text.secondary">API Server</Typography>
                      <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
                        <CheckCircle color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6">Operational</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Uptime: {Math.floor(systemHealth.data?.api?.uptime || 0)}s
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="caption" color="text.secondary">Database</Typography>
                      <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
                        {systemHealth.data?.database?.connected ? (
                          <>
                            <CheckCircle color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6">Connected</Typography>
                          </>
                        ) : (
                          <>
                            <Cancel color="error" sx={{ mr: 1 }} />
                            <Typography variant="h6">Disconnected</Typography>
                          </>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {systemHealth.data?.database?.status || 'Unknown'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="caption" color="text.secondary">Redis Cache</Typography>
                      <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
                        {systemHealth.data?.redis?.connected ? (
                          <>
                            <CheckCircle color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6">Connected</Typography>
                          </>
                        ) : (
                          <>
                            <Cancel color="warning" sx={{ mr: 1 }} />
                            <Typography variant="h6">Not Configured</Typography>
                          </>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {systemHealth.data?.redis?.status || 'Optional'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialog} onClose={() => setTestEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Test Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient Email"
            type="email"
            fullWidth
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestEmailDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendTestEmail}
            variant="contained"
            disabled={!testEmail || testEmailLoading}
            startIcon={testEmailLoading ? <CircularProgress size={20} /> : <Send />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Integrations;
