import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardHeader,
  Button, IconButton, Chip, Avatar, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, Alert, CircularProgress,
  Tabs, Tab, Divider, Tooltip, Badge, LinearProgress
} from '@mui/material';
import {
  CalendarToday, Google, Microsoft, Apple, Sync, Add, Settings,
  CheckCircle, Error, Warning, Info, MoreVert, Edit, Delete,
  Link, Unlink, Refresh, TrendingUp, Schedule, Business,
  Person, LocationOn, AttachMoney, Phone, Email
} from '@mui/icons-material';
import calendarApi from '../../services/calendarApi';

const CalendarIntegration = () => {
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [syncLoading, setSyncLoading] = useState({});
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [calendarsResponse, eventsResponse, analyticsResponse] = await Promise.all([
        calendarApi.getCalendars(),
        calendarApi.getAllEvents(),
        calendarApi.getCalendarAnalytics()
      ]);
      
      setCalendars(calendarsResponse.data);
      setEvents(eventsResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      setError('Failed to load calendar data');
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSyncCalendar = async (calendarId) => {
    try {
      setSyncLoading(prev => ({ ...prev, [calendarId]: true }));
      await calendarApi.syncCalendar(calendarId);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error syncing calendar:', err);
    } finally {
      setSyncLoading(prev => ({ ...prev, [calendarId]: false }));
    }
  };

  const handleConnectCalendar = async (type) => {
    try {
      await calendarApi.connectCalendar(type, { name: `${type} Calendar` });
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error connecting calendar:', err);
    }
  };

  const getCalendarIcon = (type) => {
    switch (type) {
      case 'google': return <Google />;
      case 'outlook': return <Microsoft />;
      case 'apple': return <Apple />;
      default: return <CalendarToday />;
    }
  };

  const getCalendarColor = (type) => {
    switch (type) {
      case 'google': return '#4285f4';
      case 'outlook': return '#0078d4';
      case 'apple': return '#34c759';
      default: return '#666';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'property_viewing': return <LocationOn />;
      case 'client_meeting': return <Person />;
      case 'team_meeting': return <Business />;
      case 'property_inspection': return <Business />;
      default: return <Schedule />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= now && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);
  };

  const getCalendarStats = () => {
    return {
      totalCalendars: calendars.length,
      connectedCalendars: calendars.filter(cal => cal.isConnected).length,
      totalEvents: events.length,
      upcomingEvents: getUpcomingEvents().length
    };
  };

  const stats = getCalendarStats();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const tabPanels = [
    {
      label: 'Calendars',
      component: (
        <Box>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <CalendarToday />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {stats.totalCalendars}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Calendars
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <CheckCircle />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {stats.connectedCalendars}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Connected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <Schedule />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {stats.totalEvents}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Events
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {stats.upcomingEvents}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Connect New Calendar */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Connect New Calendar
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Google />}
                onClick={() => handleConnectCalendar('google')}
                sx={{ color: '#4285f4', borderColor: '#4285f4' }}
              >
                Google Calendar
              </Button>
              <Button
                variant="outlined"
                startIcon={<Microsoft />}
                onClick={() => handleConnectCalendar('outlook')}
                sx={{ color: '#0078d4', borderColor: '#0078d4' }}
              >
                Outlook Calendar
              </Button>
              <Button
                variant="outlined"
                startIcon={<Apple />}
                onClick={() => handleConnectCalendar('apple')}
                sx={{ color: '#34c759', borderColor: '#34c759' }}
              >
                Apple Calendar
              </Button>
            </Box>
          </Paper>

          {/* Calendars List */}
          <List>
            {calendars.map((calendar) => (
              <ListItem key={calendar.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: getCalendarColor(calendar.type) }}>
                    {getCalendarIcon(calendar.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {calendar.name}
                      </Typography>
                      {calendar.isPrimary && (
                        <Chip label="Primary" size="small" color="primary" />
                      )}
                      <Chip
                        label={calendar.isConnected ? 'Connected' : 'Disconnected'}
                        color={calendar.isConnected ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {calendar.type.charAt(0).toUpperCase() + calendar.type.slice(1)} Calendar
                      </Typography>
                      {calendar.lastSync && (
                        <Typography variant="caption" color="text.secondary">
                          Last synced: {new Date(calendar.lastSync).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Sync Calendar">
                      <IconButton
                        size="small"
                        onClick={() => handleSyncCalendar(calendar.id)}
                        disabled={syncLoading[calendar.id]}
                      >
                        {syncLoading[calendar.id] ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Sync />
                        )}
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small">
                      <Settings />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )
    },
    {
      label: 'Upcoming Events',
      component: (
        <Box>
          <Typography variant="h6" gutterBottom>
            This Week's Events
          </Typography>
          <List>
            {getUpcomingEvents().map((event) => (
              <ListItem key={event.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getEventTypeIcon(event.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {event.title}
                      </Typography>
                      <Chip
                        label={event.status}
                        color={event.status === 'confirmed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.start)} at {formatTime(event.start)}
                      </Typography>
                      {event.location && (
                        <Typography variant="body2" color="text.secondary">
                          📍 {event.location}
                        </Typography>
                      )}
                      {event.description && (
                        <Typography variant="body2" color="text.secondary">
                          {event.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )
    },
    {
      label: 'Analytics',
      component: (
        <Box>
          {analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Events by Type" />
                  <CardContent>
                    {Object.entries(analytics.byType).map(([type, count]) => (
                      <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Chip label={count} size="small" />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Events by Status" />
                  <CardContent>
                    {Object.entries(analytics.byStatus).map(([status, count]) => (
                      <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Typography>
                        <Chip label={count} size="small" color={status === 'confirmed' ? 'success' : 'warning'} />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Calendar Integration
      </Typography>

      <Paper elevation={1}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabPanels.map((panel, index) => (
            <Tab key={index} label={panel.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabPanels[activeTab].component}
        </Box>
      </Paper>
    </Box>
  );
};

export default CalendarIntegration;
