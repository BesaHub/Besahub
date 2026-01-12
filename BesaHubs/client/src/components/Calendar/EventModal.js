import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import calendarApi from '../../services/calendarApi';

const EventModal = ({ open, event, accounts, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [attendees, setAttendees] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStart(event.start ? new Date(event.start) : new Date());
      setEnd(event.end ? new Date(event.end) : new Date());
      setIsAllDay(event.isAllDay || false);
      setAttendees(event.attendees ? event.attendees.map(a => a.email || a).join(', ') : '');
      setSelectedAccountId(event.calendarAccountId || (accounts.length > 0 ? accounts[0].id : ''));
    } else {
      resetForm();
    }
  }, [event, accounts]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setStart(new Date());
    setEnd(new Date());
    setIsAllDay(false);
    setAttendees('');
    setSelectedAccountId(accounts.length > 0 ? accounts[0].id : '');
    setError(null);
  };

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        setError('Event title is required');
        return;
      }

      if (!selectedAccountId) {
        setError('Please select a calendar account');
        return;
      }

      setSaving(true);
      setError(null);

      const eventData = {
        accountId: selectedAccountId,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        start: start.toISOString(),
        end: end.toISOString(),
        isAllDay,
        attendees: attendees ? attendees.split(',').map(email => email.trim()).filter(Boolean) : [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      if (event && event.id) {
        await calendarApi.updateEvent(event.id, eventData);
      } else {
        await calendarApi.createEvent(eventData);
      }

      onSave();
      resetForm();
    } catch (err) {
      console.error('Failed to save event:', err);
      setError(err.response?.data?.error || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await calendarApi.deleteEvent(event.id);

      onDelete();
      resetForm();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err.response?.data?.error || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const activeAccounts = accounts.filter(acc => acc.isActive);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {event && event.id ? 'Edit Event' : 'Create New Event'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {activeAccounts.length === 0 && (
            <Alert severity="warning">
              No active calendar accounts available. Please connect a calendar first.
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Calendar Account</InputLabel>
            <Select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              label="Calendar Account"
              disabled={event && event.id}
            >
              {activeAccounts.map(account => (
                <MenuItem key={account.id} value={account.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {account.provider === 'google' && <GoogleIcon sx={{ fontSize: 18 }} />}
                    {account.email}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
              />
            }
            label="All-day event"
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start"
              value={start}
              onChange={(newValue) => setStart(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              disabled={isAllDay}
            />

            <DateTimePicker
              label="End"
              value={end}
              onChange={(newValue) => setEnd(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              disabled={isAllDay}
              minDateTime={start}
            />
          </LocalizationProvider>

          <TextField
            label="Attendees (comma-separated emails)"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            fullWidth
            placeholder="email1@example.com, email2@example.com"
            helperText="Separate multiple email addresses with commas"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {event && event.id && (
          <IconButton
            onClick={handleDelete}
            disabled={deleting || saving}
            color="error"
            sx={{ mr: 'auto' }}
          >
            {deleting ? <CircularProgress size={24} /> : <DeleteIcon />}
          </IconButton>
        )}

        <Button onClick={handleClose} disabled={saving || deleting}>
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || deleting || activeAccounts.length === 0}
        >
          {saving ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventModal;
