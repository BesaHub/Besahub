import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Speed as SpeedIcon,
  VpnLock as VpnLockIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SecurityDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [failedLogins, setFailedLogins] = useState([]);
  const [rateLimitViolations, setRateLimitViolations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timeWindow, setTimeWindow] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get(`/api/security/dashboard?timeWindow=${timeWindow}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching security dashboard:', error);
    }
  }, [timeWindow]);

  const fetchFailedLogins = useCallback(async () => {
    try {
      const response = await api.get(`/api/security/failed-logins?timeWindow=${timeWindow}&limit=10`);
      setFailedLogins(response.data.data || []);
    } catch (error) {
      console.error('Error fetching failed logins:', error);
    }
  }, [timeWindow]);

  const fetchRateLimitViolations = useCallback(async () => {
    try {
      const response = await api.get(`/api/security/rate-limit-violations?timeWindow=${timeWindow}&limit=10`);
      setRateLimitViolations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching rate limit violations:', error);
    }
  }, [timeWindow]);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get('/api/security/alerts?limit=20');
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchFailedLogins(),
      fetchRateLimitViolations(),
      fetchAlerts()
    ]);
    setLoading(false);
  }, [fetchDashboardData, fetchFailedLogins, fetchRateLimitViolations, fetchAlerts]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAllData]);

  const handleResolveAlert = async () => {
    try {
      await api.post(`/api/security/alerts/${selectedAlert.id}/resolve`, {
        notes: resolutionNotes
      });
      setResolveDialogOpen(false);
      setSelectedAlert(null);
      setResolutionNotes('');
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      case 'INFO': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
    case 'CRITICAL': return <ErrorIcon />;
      case 'WARNING': return <WarningIcon />;
      case 'INFO': return <SecurityIcon />;
      default: return <SecurityIcon />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Security Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAllData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Chip
            label={autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            clickable
          />
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Failed Logins
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.failedLogins?.count || 0}
                  </Typography>
                </Box>
                <ErrorIcon color="error" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Account Lockouts
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.accountLockouts?.activeCount || 0}
                  </Typography>
                </Box>
                <BlockIcon color="warning" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Rate Limit Violations
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.rateLimitViolations?.count || 0}
                  </Typography>
                </Box>
                <SpeedIcon color="info" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Critical Alerts
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.criticalAlerts || 0}
                  </Typography>
                </Box>
                <WarningIcon color="error" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MFA Enrollment Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <VpnLockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              MFA Enrollment
            </Typography>
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Enrolled Users</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {dashboardData?.mfaEnrollment?.enrolled || 0} / {dashboardData?.mfaEnrollment?.total || 0}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 10 }}>
                  <Box
                    sx={{
                      width: `${dashboardData?.mfaEnrollment?.rate || 0}%`,
                      bgcolor: 'success.main',
                      borderRadius: 1,
                      height: 10
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {dashboardData?.mfaEnrollment?.rate || 0}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Lockouts
            </Typography>
            <Box mt={2}>
              {dashboardData?.accountLockouts?.active?.length > 0 ? (
                <Box>
                  {dashboardData.accountLockouts.active.slice(0, 3).map((lockout) => (
                    <Box key={lockout.id} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{lockout.email}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Until: {new Date(lockout.lockUntil).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No active lockouts
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Security Alerts */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Security Alerts
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No recent alerts
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Chip
                        icon={getSeverityIcon(alert.severity)}
                        label={alert.severity}
                        color={getSeverityColor(alert.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{alert.alertType}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>{alert.email || '-'}</TableCell>
                    <TableCell>{alert.ip || '-'}</TableCell>
                    <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {alert.resolved ? (
                        <Chip label="Resolved" color="success" size="small" icon={<CheckCircleIcon />} />
                      ) : (
                        <Chip label="Active" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.resolved && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setResolveDialogOpen(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Failed Login Attempts */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Failed Login Attempts
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>User Agent</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {failedLogins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No failed login attempts
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                failedLogins.map((login, index) => (
                  <TableRow key={index}>
                    <TableCell>{login.email || '-'}</TableCell>
                    <TableCell>{login.ip || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title={login.userAgent || ''}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {login.userAgent ? login.userAgent.substring(0, 50) + '...' : '-'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(login.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{login.reason || 'Invalid credentials'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Rate Limit Violations */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Rate Limit Violations
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IP Address</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rateLimitViolations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No rate limit violations
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rateLimitViolations.map((violation, index) => (
                  <TableRow key={index}>
                    <TableCell>{violation.ip || '-'}</TableCell>
                    <TableCell>{violation.path || '-'}</TableCell>
                    <TableCell>{violation.user || 'Anonymous'}</TableCell>
                    <TableCell>{new Date(violation.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Resolve Alert Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)}>
        <DialogTitle>Resolve Security Alert</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Alert Type:</strong> {selectedAlert.alertType}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Message:</strong> {selectedAlert.message}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Recommended Action:</strong> {selectedAlert.recommendedAction}
              </Typography>
              <TextField
                label="Resolution Notes"
                multiline
                rows={4}
                fullWidth
                margin="normal"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe the action taken to resolve this alert..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResolveAlert} variant="contained" color="primary">
            Resolve Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SecurityDashboard;
