import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Sync as SyncIcon,
  Google as GoogleIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import calendarApi from '../../services/calendarApi';
import EventModal from '../../components/Calendar/EventModal';

const localizer = momentLocalizer(moment);

const Calendar = () => {
  const [currentView, setCurrentView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await calendarApi.getAccounts();
      setAccounts(response.data.accounts || []);
    } catch (err) {
      console.error('Failed to fetch calendar accounts:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startOfMonth = moment(selectedDate).startOf('month').subtract(7, 'days').toISOString();
      const endOfMonth = moment(selectedDate).endOf('month').add(7, 'days').toISOString();

      const filters = {
        from: startOfMonth,
        to: endOfMonth,
        limit: 1000
      };

      if (selectedAccountFilter) {
        filters.accountId = selectedAccountFilter;
      }

      const response = await calendarApi.getEvents(filters);
      
      const formattedEvents = (response.data.events || []).map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        allDay: event.isAllDay,
        resource: {
          ...event,
          provider: event.calendarAccount?.provider,
          accountEmail: event.calendarAccount?.email
        }
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedAccountFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0 || selectedAccountFilter === null) {
      fetchEvents();
    }
  }, [fetchEvents, accounts]);

  const handleConnectGoogle = async () => {
    try {
      const response = await calendarApi.getConnectUrl('google');
      const authUrl = response.data.authUrl;

      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        authUrl,
        'Connect Google Calendar',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const handleMessage = (event) => {
        if (event.data.type === 'calendar-connected') {
          popup.close();
          fetchAccounts();
          fetchEvents();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'calendar-error') {
          popup.close();
          setError(event.data.error || 'Failed to connect calendar');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Failed to connect Google Calendar:', err);
      setError('Failed to connect Google Calendar');
    }
  };

  const handleConnectMicrosoft = async () => {
    try {
      const response = await calendarApi.getConnectUrl('microsoft');
      const authUrl = response.data.authUrl;

      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        authUrl,
        'Connect Microsoft Calendar',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const handleMessage = (event) => {
        if (event.data.type === 'calendar-connected') {
          popup.close();
          fetchAccounts();
          fetchEvents();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'calendar-error') {
          popup.close();
          setError(event.data.error || 'Failed to connect calendar');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Failed to connect Microsoft Calendar:', err);
      setError('Failed to connect Microsoft Calendar');
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setError(null);

      for (const account of accounts) {
        if (account.isActive) {
          await calendarApi.syncAccount(account.id);
        }
      }

      await fetchAccounts();
      await fetchEvents();
    } catch (err) {
      console.error('Failed to sync calendars:', err);
      setError('Failed to sync calendars');
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setEventModalOpen(true);
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({
      start,
      end,
      isAllDay: false
    });
    setEventModalOpen(true);
  };

  const handleEventSaved = () => {
    setEventModalOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleEventDeleted = () => {
    setEventModalOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleCloseEventModal = () => {
    setEventModalOpen(false);
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => {
    const provider = event.resource?.provider;
    
    let backgroundColor = '#3174ad';
    if (provider === 'google') {
      backgroundColor = '#4285f4';
    } else if (provider === 'microsoft') {
      backgroundColor = '#00a4ef';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      return event.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Calendar
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          
          <Tooltip title="Filter by account">
            <IconButton
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              color={selectedAccountFilter ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={() => setFilterMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setSelectedAccountFilter(null);
                setFilterMenuAnchor(null);
              }}
            >
              All Accounts
            </MenuItem>
            {accounts.map(account => (
              <MenuItem
                key={account.id}
                onClick={() => {
                  setSelectedAccountFilter(account.id);
                  setFilterMenuAnchor(null);
                }}
              >
                {account.provider === 'google' && <GoogleIcon sx={{ mr: 1, fontSize: 18 }} />}
                {account.email}
              </MenuItem>
            ))}
          </Menu>

          <Button
            variant="outlined"
            startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={handleSyncAll}
            disabled={syncing || accounts.length === 0}
          >
            Sync
          </Button>

          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleConnectGoogle}
          >
            Connect Google
          </Button>

          <Button
            variant="outlined"
            onClick={handleConnectMicrosoft}
          >
            Connect Microsoft
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedEvent({
                start: new Date(),
                end: moment().add(1, 'hour').toDate(),
                isAllDay: false
              });
              setEventModalOpen(true);
            }}
            disabled={accounts.length === 0}
          >
            New Event
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {accounts.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No calendar accounts connected. Please connect Google Calendar or Microsoft Outlook to get started.
        </Alert>
      )}

      {accounts.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {accounts.map(account => (
            <Chip
              key={account.id}
              icon={account.provider === 'google' ? <GoogleIcon /> : undefined}
              label={`${account.email} ${account.lastSyncedAt ? `(synced ${moment(account.lastSyncedAt).fromNow()})` : '(not synced)'}`}
              color={account.isActive ? 'primary' : 'default'}
              variant={account.isActive ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>
      )}

      <Paper sx={{ p: 2, minHeight: 600 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
            <CircularProgress />
          </Box>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={currentView}
            onView={setCurrentView}
            date={selectedDate}
            onNavigate={setSelectedDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day', 'agenda']}
          />
        )}
      </Paper>

      <EventModal
        open={eventModalOpen}
        event={selectedEvent}
        accounts={accounts}
        onClose={handleCloseEventModal}
        onSave={handleEventSaved}
        onDelete={handleEventDeleted}
      />
    </Container>
  );
};

export default Calendar;
