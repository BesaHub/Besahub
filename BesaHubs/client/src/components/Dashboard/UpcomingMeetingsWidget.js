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
  CircularProgress
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

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 7);

      try {
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
      } catch (apiErr) {
        console.log('API call failed, using demo data:', apiErr);
        // Use demo data when API fails
        const demoEvents = [
          {
            id: '1',
            title: 'Client Property Tour',
            start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            location: 'Downtown Office Building',
            isAllDay: false,
            calendarAccount: { provider: 'google' }
          },
          {
            id: '2',
            title: 'Team Standup',
            start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            location: 'Conference Room A',
            isAllDay: false,
            calendarAccount: { provider: 'microsoft' }
          },
          {
            id: '3',
            title: 'Property Inspection',
            start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
            location: '123 Main St, City',
            isAllDay: false,
            calendarAccount: { provider: 'google' }
          }
        ];
        setEvents(demoEvents);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming meetings:', err);
      // Use demo data even on error
      const demoEvents = [
        {
          id: '1',
          title: 'Client Property Tour',
          start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          location: 'Downtown Office Building',
          isAllDay: false,
          calendarAccount: { provider: 'google' }
        }
      ];
      setEvents(demoEvents);
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

        {!loading && (!events || events.length === 0) && (
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

        {!loading && events && events.length > 0 && (
          <List dense>
            {(events || []).map((event, index) => {
              if (!event || !event.id) return null;
              
              const eventStart = event.start || event.startDate;
              const eventEnd = event.end || event.endDate;
              const isAllDay = event.isAllDay || false;
              
              return (
              <ListItem
                key={event.id || index}
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
                  {getProviderIcon(event.calendarAccount?.provider || 'google')}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {event.title || 'Untitled Meeting'}
                      </Typography>
                      {isAllDay && (
                        <Chip label="All Day" size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {eventStart && (
                        <Typography variant="caption" color="text.secondary">
                          {moment(eventStart).format('MMM D, h:mm A')}
                          {!isAllDay && eventEnd && ` - ${moment(eventEnd).format('h:mm A')}`}
                        </Typography>
                      )}
                      {event.location && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          📍 {event.location}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMeetingsWidget;
