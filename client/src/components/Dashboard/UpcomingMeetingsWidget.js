import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Event as EventIcon,
  Google as GoogleIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import moment from 'moment';
import calendarApi from '../../services/calendarApi';

const UpcomingMeetingsWidget = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 7);

      const response = await calendarApi.getEvents({
        from: now.toISOString(),
        to: future.toISOString(),
        limit: 5
      });

      const upcomingEvents = (response.data.events || [])
        .filter(event => new Date(event.start) > now)
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 5);

      setEvents(upcomingEvents);
    } catch (err) {
      console.error('Failed to fetch upcoming meetings:', err);
      setError('Failed to load upcoming meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event) => {
    navigate('/calendar');
  };

  const getProviderIcon = (provider) => {
    if (provider === 'google') {
      return <GoogleIcon sx={{ fontSize: 16, color: '#4285f4' }} />;
    } else if (provider === 'microsoft') {
      return <EventIcon sx={{ fontSize: 16, color: '#00a4ef' }} />;
    }
    return <EventIcon sx={{ fontSize: 16 }} />;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Upcoming Meetings
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/calendar')}
          >
            View All
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No upcoming meetings in the next 7 days
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => navigate('/calendar')}
            >
              View Calendar
            </Button>
          </Box>
        )}

        {!loading && !error && events.length > 0 && (
          <List dense>
            {events.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => handleEventClick(event)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getProviderIcon(event.calendarAccount?.provider)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {event.title}
                      </Typography>
                      {event.isAllDay && (
                        <Chip label="All Day" size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {moment(event.start).format('MMM D, h:mm A')}
                        {!event.isAllDay && ` - ${moment(event.end).format('h:mm A')}`}
                      </Typography>
                      {event.location && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          📍 {event.location}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMeetingsWidget;
