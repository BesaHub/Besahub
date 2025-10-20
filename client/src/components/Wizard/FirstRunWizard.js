import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Link,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Email,
  CalendarToday,
  Dashboard as DashboardIcon,
  EmojiEvents,
  Google,
  Microsoft,
  ArrowForward,
  Close
} from '@mui/icons-material';
import integrationsApi from '../../services/integrationsApi';
import calendarApi from '../../services/calendarApi';
import { useAuth } from '../../contexts/AuthContext';

const steps = [
  'Welcome',
  'Environment Check',
  'Connect Calendar',
  'Setup Complete'
];

const FirstRunWizard = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [envCheck, setEnvCheck] = useState(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [dashboardCreated, setDashboardCreated] = useState(false);
  const [dashboardId, setDashboardId] = useState(null);

  useEffect(() => {
    if (open && activeStep === 1) {
      checkEnvironment();
    }
  }, [open, activeStep]);

  const checkEnvironment = async () => {
    try {
      setLoading(true);
      const [sendGridRes, featureFlagsRes] = await Promise.all([
        integrationsApi.getSendGridStatus().catch(() => ({ configured: false })),
        integrationsApi.getFeatureFlags().catch(() => ({ data: {} }))
      ]);

      setEnvCheck({
        sendgrid: {
          configured: sendGridRes.configured,
          enabled: featureFlagsRes.data?.SENDGRID_ENABLED
        },
        calendar: {
          enabled: featureFlagsRes.data?.CALENDAR_ENABLED
        },
        dashboards: {
          enabled: featureFlagsRes.data?.DASHBOARDS_ENABLED
        }
      });
    } catch (err) {
      console.error('Environment check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkipStep = () => {
    handleNext();
  };

  const handleConnectCalendar = async (provider) => {
    try {
      const { data } = await calendarApi.getConnectUrl(provider);
      const authWindow = window.open(data.authUrl, 'Calendar Connection', 'width=600,height=700');
      
      const handleMessage = (event) => {
        if (event.data.type === 'calendar-connected') {
          authWindow.close();
          setCalendarConnected(true);
          setTimeout(() => handleNext(), 1000);
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
      alert('Failed to connect calendar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateDashboard = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.createSampleDashboard();
      setDashboardId(response.data.dashboardId);
      setDashboardCreated(true);
    } catch (err) {
      alert('Failed to create dashboard: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await integrationsApi.completeWizard();
      
      if (refreshUser) {
        await refreshUser();
      }
      
      localStorage.setItem('wizardCompleted', 'true');
      onClose();
    } catch (err) {
      alert('Failed to complete wizard: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWizard = async () => {
    if (window.confirm('Are you sure you want to skip the setup wizard? You can access these settings later from the Integrations page.')) {
      await handleComplete();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box textAlign="center" mb={3}>
              <EmojiEvents sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Welcome to BesaHub CRM!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Let's get you set up with our Phase 1 features
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Email color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="SendGrid Email Integration"
                  secondary="Send transactional emails and campaigns"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarToday color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Calendar Sync"
                  secondary="Connect Google and Microsoft calendars"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DashboardIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Custom Dashboards"
                  secondary="Create data visualizations and reports"
                />
              </ListItem>
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              All steps are optional. You can skip the wizard and configure these later.
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Environment Configuration Check
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Checking your system configuration...
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : envCheck ? (
              <List>
                <ListItem>
                  <ListItemIcon>
                    {envCheck.sendgrid.enabled && envCheck.sendgrid.configured ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="SendGrid Email"
                    secondary={
                      envCheck.sendgrid.enabled
                        ? envCheck.sendgrid.configured
                          ? 'Configured and ready'
                          : 'Enabled but not configured - set SENDGRID_API_KEY'
                        : 'Feature disabled - set SENDGRID_ENABLED=true'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {envCheck.calendar.enabled ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Calendar Integration"
                    secondary={
                      envCheck.calendar.enabled
                        ? 'Feature enabled - connect accounts in next step'
                        : 'Feature disabled - set CALENDAR_ENABLED=true'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {envCheck.dashboards.enabled ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Dashboards & Reports"
                    secondary={
                      envCheck.dashboards.enabled
                        ? 'Feature enabled and ready to use'
                        : 'Feature disabled - set DASHBOARDS_ENABLED=true'
                    }
                  />
                </ListItem>
              </List>
            ) : (
              <Alert severity="error">Failed to check environment configuration</Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Environment variables are configured in your <code>.env</code> file.{' '}
                <Link href="https://docs.besahub.com/setup" target="_blank" rel="noopener">
                  View setup guide
                </Link>
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Connect Calendar (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sync your calendar to manage meetings and events directly in BesaHub
            </Typography>

            {calendarConnected ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Calendar connected successfully! You can connect additional calendars later from the Integrations page.
                </Typography>
              </Alert>
            ) : (
              <>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Google />}
                    onClick={() => handleConnectCalendar('google')}
                    fullWidth
                    disabled={!envCheck?.calendar.enabled}
                  >
                    Connect Google Calendar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Microsoft />}
                    onClick={() => handleConnectCalendar('microsoft')}
                    fullWidth
                    disabled={!envCheck?.calendar.enabled}
                  >
                    Connect Microsoft Calendar
                  </Button>
                </Box>

                {!envCheck?.calendar.enabled && (
                  <Alert severity="warning">
                    Calendar feature is not enabled. Enable it in your environment variables to connect calendars.
                  </Alert>
                )}
              </>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              You can skip this step and connect calendars later from Settings → Integrations
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Box textAlign="center" mb={3}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Setup Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You're all set to start using BesaHub CRM
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              What's been configured:
            </Typography>
            <List dense>
              {envCheck?.sendgrid.configured && (
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="SendGrid email configured" />
                </ListItem>
              )}
              {calendarConnected && (
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Calendar connected" />
                </ListItem>
              )}
              {dashboardCreated && (
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Sample dashboard created" />
                </ListItem>
              )}
            </List>

            {envCheck?.dashboards.enabled && !dashboardCreated && (
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  Create a sample dashboard to get started:
                </Typography>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <DashboardIcon />}
                  onClick={handleCreateDashboard}
                  disabled={loading || dashboardCreated}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {dashboardCreated ? 'Dashboard Created' : 'Create Sales Leader Dashboard'}
                </Button>
                {dashboardCreated && dashboardId && (
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(`/dashboards/${dashboardId}`)}
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    View Dashboard
                  </Button>
                )}
              </Box>
            )}

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Quick Links:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label="Integrations"
                  onClick={() => {
                    onClose();
                    navigate('/settings/integrations');
                  }}
                  clickable
                />
                <Chip
                  label="Dashboards"
                  onClick={() => {
                    onClose();
                    navigate('/dashboards');
                  }}
                  clickable
                />
                <Chip
                  label="Calendar"
                  onClick={() => {
                    onClose();
                    navigate('/calendar');
                  }}
                  clickable
                />
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleSkipWizard}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">First-Run Setup Wizard</Typography>
          <Button
            startIcon={<Close />}
            onClick={handleSkipWizard}
            size="small"
          >
            Skip Setup
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box flex={1} />
        {activeStep < steps.length - 1 && (
          <Button onClick={handleSkipStep} color="inherit">
            Skip This Step
          </Button>
        )}
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            Finish Setup
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FirstRunWizard;
