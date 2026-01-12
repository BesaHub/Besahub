import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
  Autocomplete,
  Slider,
  FormGroup,
  Checkbox,
  Avatar
} from '@mui/material';
import {
  Add,
  Notifications,
  NotificationsActive,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Visibility,
  MoreVert,
  Schedule,
  LocationOn,
  AttachMoney,
  Business,
  CheckCircle,
  Warning,
  Info,
  TrendingUp,
  Assessment,
  FilterList,
  Refresh,
  Settings,
  Email,
  Sms,
  Close
} from '@mui/icons-material';
import { 
  propertyAlertsApi, 
  PropertyAlertEngine, 
  mockPropertyAlerts, 
  mockTriggeredAlerts 
} from '../../services/propertyAlertsApi';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PropertyAlertsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [dialogState, setDialogState] = useState({
    open: false,
    mode: 'create', // 'create' or 'edit'
    alert: null
  });
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // Alert form state
  const [alertForm, setAlertForm] = useState({
    name: '',
    propertyTypes: [],
    priceMin: '',
    priceMax: '',
    locations: [],
    sizeMin: '',
    sizeMax: '',
    minCapRate: '',
    minCashFlow: '',
    maxDaysOnMarket: '',
    keywords: [],
    frequency: 'daily',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    active: true
  });

  const propertyTypeOptions = [
    'office',
    'retail',
    'industrial',
    'warehouse',
    'mixed_use',
    'land',
    'apartment',
    'hotel'
  ];

  const locationOptions = [
    'Downtown Seattle',
    'Bellevue',
    'Capitol Hill',
    'Queen Anne',
    'SODO',
    'Georgetown',
    'Fremont',
    'Ballard'
  ];

  const keywordOptions = [
    'parking',
    'elevator',
    'loading dock',
    'high ceiling',
    'modern',
    'renovated',
    'corner unit',
    'street level'
  ];

  useEffect(() => {
    fetchAlerts();
    fetchTriggeredAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      try {
        const response = await propertyAlertsApi.getAlerts('current_user');
        setAlerts(response.alerts);
      } catch (apiError) {
        console.log('API not available, using mock data');
        setAlerts(mockPropertyAlerts);
      }
      
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTriggeredAlerts = async () => {
    try {
      try {
        const response = await propertyAlertsApi.getTriggeredAlerts('current_user');
        setTriggeredAlerts(response.triggeredAlerts);
      } catch (apiError) {
        console.log('API not available, using mock data');
        setTriggeredAlerts(mockTriggeredAlerts);
      }
    } catch (error) {
      console.error('Error fetching triggered alerts:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateAlert = () => {
    setAlertForm({
      name: '',
      propertyTypes: [],
      priceMin: '',
      priceMax: '',
      locations: [],
      sizeMin: '',
      sizeMax: '',
      minCapRate: '',
      minCashFlow: '',
      maxDaysOnMarket: '',
      keywords: [],
      frequency: 'daily',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      active: true
    });
    setDialogState({ open: true, mode: 'create', alert: null });
  };

  const handleEditAlert = (alert) => {
    setAlertForm({
      name: alert.name,
      propertyTypes: alert.criteria.propertyTypes || [],
      priceMin: alert.criteria.priceMin || '',
      priceMax: alert.criteria.priceMax || '',
      locations: alert.criteria.locations || [],
      sizeMin: alert.criteria.sizeMin || '',
      sizeMax: alert.criteria.sizeMax || '',
      minCapRate: alert.criteria.minCapRate || '',
      minCashFlow: alert.criteria.minCashFlow || '',
      maxDaysOnMarket: alert.criteria.maxDaysOnMarket || '',
      keywords: alert.criteria.keywords || [],
      frequency: alert.frequency,
      notifications: alert.notifications || {
        email: true,
        sms: false,
        push: true
      },
      active: alert.active
    });
    setDialogState({ open: true, mode: 'edit', alert });
  };

  const handleSaveAlert = async () => {
    try {
      const alertData = {
        name: alertForm.name,
        criteria: {
          propertyTypes: alertForm.propertyTypes,
          priceMin: alertForm.priceMin ? parseInt(alertForm.priceMin) : null,
          priceMax: alertForm.priceMax ? parseInt(alertForm.priceMax) : null,
          locations: alertForm.locations,
          sizeMin: alertForm.sizeMin ? parseInt(alertForm.sizeMin) : null,
          sizeMax: alertForm.sizeMax ? parseInt(alertForm.sizeMax) : null,
          minCapRate: alertForm.minCapRate ? parseFloat(alertForm.minCapRate) / 100 : null,
          minCashFlow: alertForm.minCashFlow ? parseInt(alertForm.minCashFlow) : null,
          maxDaysOnMarket: alertForm.maxDaysOnMarket ? parseInt(alertForm.maxDaysOnMarket) : null,
          keywords: alertForm.keywords
        },
        frequency: alertForm.frequency,
        notifications: alertForm.notifications,
        active: alertForm.active
      };

      if (dialogState.mode === 'create') {
        try {
          await propertyAlertsApi.createAlert(alertData);
        } catch (apiError) {
          console.log('API not available, simulating create');
        }
      } else {
        try {
          await propertyAlertsApi.updateAlert(dialogState.alert.id, alertData);
        } catch (apiError) {
          console.log('API not available, simulating update');
        }
      }

      setDialogState({ open: false, mode: 'create', alert: null });
      await fetchAlerts();
      
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        try {
          await propertyAlertsApi.deleteAlert(alertId);
        } catch (apiError) {
          console.log('API not available, simulating delete');
        }
        await fetchAlerts();
      } catch (error) {
        console.error('Error deleting alert:', error);
      }
    }
  };

  const handleToggleAlert = async (alertId, currentStatus) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        try {
          await propertyAlertsApi.updateAlert(alertId, { ...alert, active: !currentStatus });
        } catch (apiError) {
          console.log('API not available, simulating toggle');
        }
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleTestAlert = async () => {
    try {
      const alertData = {
        criteria: {
          propertyTypes: alertForm.propertyTypes,
          priceMin: alertForm.priceMin ? parseInt(alertForm.priceMin) : null,
          priceMax: alertForm.priceMax ? parseInt(alertForm.priceMax) : null,
          locations: alertForm.locations,
          sizeMin: alertForm.sizeMin ? parseInt(alertForm.sizeMin) : null,
          sizeMax: alertForm.sizeMax ? parseInt(alertForm.sizeMax) : null,
          minCapRate: alertForm.minCapRate ? parseFloat(alertForm.minCapRate) / 100 : null,
          minCashFlow: alertForm.minCashFlow ? parseInt(alertForm.minCashFlow) : null,
          maxDaysOnMarket: alertForm.maxDaysOnMarket ? parseInt(alertForm.maxDaysOnMarket) : null,
          keywords: alertForm.keywords
        }
      };

      try {
        const response = await propertyAlertsApi.testAlert(alertData);
        setTestResults(response);
      } catch (apiError) {
        console.log('API not available, simulating test');
        setTestResults({
          matchingProperties: 3,
          sampleMatches: [
            { name: '123 Sample Property', score: 95 },
            { name: '456 Test Building', score: 88 },
            { name: '789 Demo Space', score: 82 }
          ]
        });
      }
      
      setTestDialogOpen(true);
    } catch (error) {
      console.error('Error testing alert:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getFrequencyColor = (frequency) => {
    const colors = {
      'realtime': 'error',
      'daily': 'primary',
      'weekly': 'warning',
      'monthly': 'secondary'
    };
    return colors[frequency] || 'default';
  };

  const unreadCount = triggeredAlerts.filter(alert => !alert.read).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading property alerts...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Property Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay notified of new properties matching your investment criteria
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateAlert}
          >
            Create Alert
          </Button>
          <IconButton onClick={fetchAlerts}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsActive sx={{ color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {alerts.filter(a => a.active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications sx={{ color: 'warning.main', mr: 1 }} />
                </Badge>
                <Box sx={{ ml: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {triggeredAlerts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Matches
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {alerts.filter(a => a.lastTriggered).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recently Triggered
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {Math.round(triggeredAlerts.reduce((sum, alert) => sum + (alert.matchScore || 0), 0) / Math.max(triggeredAlerts.length, 1))}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Match Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="My Alerts" />
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error">
                Notifications
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* My Alerts Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {alerts.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No alerts created yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first alert to get notified of new properties matching your criteria
                  </Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={handleCreateAlert}>
                    Create Your First Alert
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            alerts.map((alert) => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ flex: 1 }}>
                        {alert.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={alert.frequency}
                          color={getFrequencyColor(alert.frequency)}
                          size="small"
                        />
                        <Switch
                          checked={alert.active}
                          onChange={() => handleToggleAlert(alert.id, alert.active)}
                          size="small"
                        />
                        <IconButton size="small" onClick={() => handleEditAlert(alert)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteAlert(alert.id)}>
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {PropertyAlertEngine.generateAlertSummary(alert.criteria)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Created: {new Date(alert.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      {alert.lastTriggered && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                          <Typography variant="body2" color="success.main">
                            Last matched: {new Date(alert.lastTriggered).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={tabValue} index={1}>
        {triggeredAlerts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When properties match your alert criteria, you'll see notifications here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List>
            {triggeredAlerts.map((triggeredAlert, index) => (
              <React.Fragment key={triggeredAlert.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: triggeredAlert.read ? 'grey.300' : 'primary.main' }}>
                      <Notifications />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: triggeredAlert.read ? 400 : 600 }}>
                          {triggeredAlert.propertyName}
                        </Typography>
                        <Chip
                          label={`${triggeredAlert.matchScore}% match`}
                          color="success"
                          size="small"
                        />
                        {!triggeredAlert.read && (
                          <Chip label="New" color="primary" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Alert: {triggeredAlert.alertName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(triggeredAlert.triggeredAt).toLocaleString()}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {triggeredAlert.matchDetails?.slice(0, 3).map((detail, idx) => (
                            <Chip
                              key={idx}
                              label={detail.criteria.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                              color={detail.matched ? 'success' : 'default'}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton>
                      <Visibility />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < triggeredAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Create/Edit Alert Dialog */}
      <Dialog
        open={dialogState.open}
        onClose={() => setDialogState({ open: false, mode: 'create', alert: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogState.mode === 'create' ? 'Create New Alert' : 'Edit Alert'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alert Name"
                  value={alertForm.name}
                  onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                  placeholder="e.g., Downtown Office Buildings"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={propertyTypeOptions}
                  value={alertForm.propertyTypes}
                  onChange={(e, newValue) => setAlertForm({ ...alertForm, propertyTypes: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Property Types" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={locationOptions}
                  value={alertForm.locations}
                  onChange={(e, newValue) => setAlertForm({ ...alertForm, locations: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Locations" />
                  )}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Min Price"
                  type="number"
                  value={alertForm.priceMin}
                  onChange={(e) => setAlertForm({ ...alertForm, priceMin: e.target.value })}
                  placeholder="500000"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Max Price"
                  type="number"
                  value={alertForm.priceMax}
                  onChange={(e) => setAlertForm({ ...alertForm, priceMax: e.target.value })}
                  placeholder="2000000"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Min Size (sq ft)"
                  type="number"
                  value={alertForm.sizeMin}
                  onChange={(e) => setAlertForm({ ...alertForm, sizeMin: e.target.value })}
                  placeholder="1000"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Max Size (sq ft)"
                  type="number"
                  value={alertForm.sizeMax}
                  onChange={(e) => setAlertForm({ ...alertForm, sizeMax: e.target.value })}
                  placeholder="10000"
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Min Cap Rate (%)"
                  type="number"
                  value={alertForm.minCapRate}
                  onChange={(e) => setAlertForm({ ...alertForm, minCapRate: e.target.value })}
                  placeholder="6.0"
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Min Cash Flow"
                  type="number"
                  value={alertForm.minCashFlow}
                  onChange={(e) => setAlertForm({ ...alertForm, minCashFlow: e.target.value })}
                  placeholder="2000"
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Max Days on Market"
                  type="number"
                  value={alertForm.maxDaysOnMarket}
                  onChange={(e) => setAlertForm({ ...alertForm, maxDaysOnMarket: e.target.value })}
                  placeholder="90"
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={keywordOptions}
                  value={alertForm.keywords}
                  onChange={(e, newValue) => setAlertForm({ ...alertForm, keywords: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Keywords" />
                  )}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={alertForm.frequency}
                    onChange={(e) => setAlertForm({ ...alertForm, frequency: e.target.value })}
                    label="Frequency"
                  >
                    <MenuItem value="realtime">Real-time</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={alertForm.active}
                        onChange={(e) => setAlertForm({ ...alertForm, active: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </FormGroup>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Notification Methods
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={alertForm.notifications.email}
                        onChange={(e) => setAlertForm({
                          ...alertForm,
                          notifications: { ...alertForm.notifications, email: e.target.checked }
                        })}
                      />
                    }
                    label="Email"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={alertForm.notifications.sms}
                        onChange={(e) => setAlertForm({
                          ...alertForm,
                          notifications: { ...alertForm.notifications, sms: e.target.checked }
                        })}
                      />
                    }
                    label="SMS"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={alertForm.notifications.push}
                        onChange={(e) => setAlertForm({
                          ...alertForm,
                          notifications: { ...alertForm.notifications, push: e.target.checked }
                        })}
                      />
                    }
                    label="Push"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogState({ open: false, mode: 'create', alert: null })}>
            Cancel
          </Button>
          <Button onClick={handleTestAlert} variant="outlined">
            Test Alert
          </Button>
          <Button onClick={handleSaveAlert} variant="contained">
            {dialogState.mode === 'create' ? 'Create Alert' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Results Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Alert Test Results
        </DialogTitle>
        <DialogContent>
          {testResults && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Found {testResults.matchingProperties} matching properties
              </Typography>
              
              {testResults.sampleMatches && testResults.sampleMatches.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sample matches:
                  </Typography>
                  <List>
                    {testResults.sampleMatches.map((match, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={match.name}
                          secondary={`${match.score}% match`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyAlertsDashboard;