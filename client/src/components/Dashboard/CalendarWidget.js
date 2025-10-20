import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, Typography, List, ListItem,
  ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton,
  Chip, Box, Button, Avatar, Divider, Tooltip, Badge, Alert,
  CircularProgress, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, LinearProgress, Grid
} from '@mui/material';
import {
  CalendarToday, Schedule, LocationOn, Person, Business, Phone,
  Email, MoreVert, Add, Edit, Delete, CheckCircle, Warning,
  Error, Info, TrendingUp, AttachMoney, Refresh, Sync
} from '@mui/icons-material';
import calendarApi from '../../services/calendarApi';

const CalendarWidget = ({ limit = 5, showHeader = true, onEventClick }) => {
  const [upcomingData, setUpcomingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadUpcomingData();
  }, []);

  const loadUpcomingData = async () => {
    try {
      setLoading(true);
      const response = await calendarApi.getUpcoming(7, limit * 2); // Get more to filter events
      setUpcomingData(response.data);
    } catch (err) {
      setError('Failed to load upcoming events');
      console.error('Error loading upcoming data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'property_viewing': return <LocationOn />;
      case 'client_meeting': return <Person />;
      case 'team_meeting': return <Business />;
      case 'property_inspection': return <Business />;
      case 'follow_up': return <Phone />;
      case 'proposal': return <AttachMoney />;
      default: return <Schedule />;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'property_viewing': return 'success';
      case 'client_meeting': return 'primary';
      case 'team_meeting': return 'info';
      case 'property_inspection': return 'warning';
      case 'follow_up': return 'secondary';
      case 'proposal': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'tentative': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle />;
      case 'tentative': return <Warning />;
      case 'cancelled': return <Error />;
      default: return <Info />;
    }
  };

  const formatTimeUntil = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffInHours = (start - now) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      return 'Started';
    } else if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `in ${minutes}m`;
    } else if (diffInHours < 24) {
      return `in ${Math.floor(diffInHours)}h`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `in ${days}d`;
    }
  };

  const isToday = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = new Date(dateString);
    return tomorrow.toDateString() === eventDate.toDateString();
  };

  const formatEventTime = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isToday(startDate)) {
      return `Today ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow(startDate)) {
      return `Tomorrow ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return start.toLocaleDateString() + ' ' + start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleMenuOpen = (event, calendarEvent) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(calendarEvent);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleEventAction = (action) => {
    if (!selectedEvent) return;

    switch (action) {
      case 'view':
        if (onEventClick) {
          onEventClick(selectedEvent);
        }
        break;
      case 'edit':
        setOpenDialog(true);
        break;
      case 'join':
        // Handle joining meeting
        break;
      case 'reschedule':
        // Handle rescheduling
        break;
      case 'cancel':
        // Handle cancellation
        break;
      default:
        break;
    }
    
    handleMenuClose();
  };

  const getEventDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours < 1) {
      const minutes = Math.floor(durationMs / (1000 * 60));
      return `${minutes}m`;
    } else {
      return `${durationHours.toFixed(1)}h`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const events = upcomingData?.events || [];
  const confirmedEvents = events.filter(event => event.status === 'confirmed').length;
  const todayEvents = events.filter(event => isToday(event.start)).length;

  return (
    <Card>
      {showHeader && (
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="primary" />
              <Typography variant="h6">Upcoming Events</Typography>
              <Badge badgeContent={events.length} color="primary" />
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={loadUpcomingData}>
                <Refresh />
              </IconButton>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                Add Event
              </Button>
            </Box>
          }
        />
      )}
      
      <CardContent>
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                {confirmedEvents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confirmed
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {todayEvents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Today
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Events List */}
        <List dense>
          {events.slice(0, limit).map((event, index) => (
            <React.Fragment key={event.id}>
              <ListItem
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: isToday(event.start) ? 'primary.light' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: getEventTypeColor(event.type) + '.main',
                      width: 32,
                      height: 32
                    }}
                  >
                    {getEventTypeIcon(event.type)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {event.title}
                      </Typography>
                      <Chip
                        label={formatTimeUntil(event.start)}
                        color={isToday(event.start) ? 'primary' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {formatEventTime(event.start, event.end)} • {getEventDuration(event.start, event.end)}
                      </Typography>
                      
                      {event.location && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          📍 {event.location}
                        </Typography>
                      )}
                      
                      {event.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {event.description.length > 100 
                            ? `${event.description.substring(0, 100)}...` 
                            : event.description
                          }
                        </Typography>
                      )}
                      
                      {/* Attendees */}
                      {event.attendees && event.attendees.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Status and Type */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          icon={getStatusIcon(event.status)}
                          label={event.status}
                          color={getStatusColor(event.status)}
                          size="small"
                        />
                        <Chip
                          label={event.type.replace('_', ' ')}
                          color={getEventTypeColor(event.type)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, event)}
                  >
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < events.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Show More Button */}
        {events.length > limit && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              size="small"
              onClick={() => {
                // Navigate to full calendar view
                if (onEventClick) {
                  onEventClick({ type: 'view_all_events' });
                }
              }}
            >
              View All Events ({events.length})
            </Button>
          </Box>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No upcoming events
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ mt: 1 }}
            >
              Add Your First Event
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEventAction('view')}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEventAction('edit')}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Event</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEventAction('join')}>
          <ListItemIcon><Phone /></ListItemIcon>
          <ListItemText>Join Meeting</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEventAction('reschedule')}>
          <ListItemIcon><Schedule /></ListItemIcon>
          <ListItemText>Reschedule</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleEventAction('cancel')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Cancel Event</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Event Title"
              defaultValue={selectedEvent?.title || ''}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              defaultValue={selectedEvent?.description || ''}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Start Date & Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                defaultValue={selectedEvent?.start ? new Date(selectedEvent.start).toISOString().slice(0, 16) : ''}
              />
              <TextField
                fullWidth
                label="End Date & Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                defaultValue={selectedEvent?.end ? new Date(selectedEvent.end).toISOString().slice(0, 16) : ''}
              />
            </Box>
            <TextField
              fullWidth
              label="Location"
              defaultValue={selectedEvent?.location || ''}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  defaultValue={selectedEvent?.type || 'meeting'}
                  label="Event Type"
                >
                  <MenuItem value="property_viewing">Property Viewing</MenuItem>
                  <MenuItem value="client_meeting">Client Meeting</MenuItem>
                  <MenuItem value="team_meeting">Team Meeting</MenuItem>
                  <MenuItem value="property_inspection">Property Inspection</MenuItem>
                  <MenuItem value="follow_up">Follow Up</MenuItem>
                  <MenuItem value="proposal">Proposal</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  defaultValue={selectedEvent?.status || 'confirmed'}
                  label="Status"
                >
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="tentative">Tentative</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained">
            {selectedEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CalendarWidget;
