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
  InputAdornment,
  Snackbar
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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
      console.log('API call failed, using demo calendar events:', err);
      // Use demo data when API fails
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const demoEvents = [
        {
          id: '1',
          title: 'Client Meeting - ABC Corporation',
          start: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM today
          end: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11 AM today
          allDay: false,
          location: 'Downtown Office Tower - Suite 1200',
          description: 'Discuss lease renewal terms and expansion options',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '1',
            propertyId: '1'
          }
        },
        {
          id: '2',
          title: 'Property Tour - Coastal Shopping Center',
          start: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM today
          end: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 3:30 PM today
          allDay: false,
          location: '2450 Pacific Coast Highway, San Diego',
          description: 'Site visit with potential buyer - Wilson Retail Holdings',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '14',
            propertyId: '2'
          }
        },
        {
          id: '3',
          title: 'Closing - Medical Office Building',
          start: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 1 PM next week
          end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM next week
          allDay: false,
          location: 'Law Office - 500 Legal Plaza',
          description: 'Final closing for Riverside Medical Center purchase',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '3',
            propertyId: '3'
          }
        },
        {
          id: '4',
          title: 'Follow-up Call - Park Investment Group',
          start: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM tomorrow
          end: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000), // 9:30 AM tomorrow
          allDay: false,
          location: 'Phone Call',
          description: 'Discuss office space requirements and available properties',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '7'
          }
        },
        {
          id: '5',
          title: 'Proposal Presentation - TechStart Ventures',
          start: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11 AM day after tomorrow
          end: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 12.5 * 60 * 60 * 1000), // 12:30 PM
          allDay: false,
          location: 'Innovation District Offices - Conference Room',
          description: 'Present lease proposal for floor 3 expansion',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '15',
            propertyId: '5'
          }
        },
        {
          id: '6',
          title: 'Due Diligence Review - Data Center',
          start: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM
          end: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 4 PM
          allDay: false,
          location: 'Edge Computing Center',
          description: 'Technical due diligence review with engineering team',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '12',
            propertyId: '12'
          }
        },
        {
          id: '7',
          title: 'Lease Negotiation - Global Logistics',
          start: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 2 PM
          end: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 4 PM
          allDay: false,
          location: 'Southeast Distribution Hub',
          description: 'Finalize lease terms for warehouse expansion',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '16',
            propertyId: '2'
          }
        },
        {
          id: '8',
          title: 'Team Meeting',
          start: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM
          end: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM
          allDay: false,
          location: 'Office - Conference Room A',
          description: 'Weekly team sync and pipeline review',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com'
          }
        },
        {
          id: '9',
          title: 'Property Inspection - Manufacturing Facility',
          start: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 1 PM
          end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM
          allDay: false,
          location: 'Northwest Manufacturing Complex',
          description: 'Equipment inspection with potential buyer',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '6',
            propertyId: '6'
          }
        },
        {
          id: '10',
          title: 'Market Analysis Presentation',
          start: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM
          end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 16.5 * 60 * 60 * 1000), // 4:30 PM
          allDay: false,
          location: 'Davis Capital Management Office',
          description: 'Present market analysis for multifamily investment',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '10'
          }
        },
        {
          id: '11',
          title: 'All Day - Industry Conference',
          start: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
          allDay: true,
          location: 'Convention Center',
          description: 'Commercial Real Estate Annual Conference',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com'
          }
        },
        {
          id: '12',
          title: 'Renewal Discussion - Cold Storage',
          start: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM
          end: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11 AM
          allDay: false,
          location: 'Arctic Storage Facility',
          description: 'Discuss lease renewal terms with existing tenant',
          resource: {
            provider: 'google',
            accountEmail: 'broker@company.com',
            contactId: '9',
            propertyId: '9'
          }
        }
      ];
      setEvents(demoEvents);
      setError(null);
      setSnackbar({
        open: true,
        message: 'Using demo data - API unavailable',
        severity: 'info'
      });
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
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Calendar;
