import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useCommunication } from '../../contexts/CommunicationContext';
import api from '../../services/api';

const PhoneDialerWorkspace = () => {
  const { phoneDrawerOpen, setPhoneDrawerOpen, selectedContact } = useCommunication();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [direction, setDirection] = useState('outbound');
  const [status, setStatus] = useState('completed');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (phoneDrawerOpen) {
      fetchCallHistory();
      if (selectedContact && selectedContact.primaryPhone) {
        setPhoneNumber(selectedContact.primaryPhone);
      }
    }
  }, [phoneDrawerOpen, selectedContact]);

  const fetchCallHistory = async () => {
    try {
      const response = await api.get('/communications/calls?limit=10');
      setCallHistory(response.data);
    } catch (error) {
      console.error('Error fetching call history:', error);
    }
  };

  const handleLogCall = async () => {
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const callData = {
        phoneNumber,
        direction,
        status,
        duration: duration ? parseInt(duration) : null,
        notes,
        outcome,
        contactId: selectedContact?.id || null
      };

      await api.post('/communications/calls', callData);
      alert('Call logged successfully');
      setPhoneNumber('');
      setNotes('');
      setDuration('');
      setOutcome('');
      fetchCallHistory();
    } catch (error) {
      console.error('Error logging call:', error);
      alert('Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneDrawerOpen(false);
    setPhoneNumber('');
    setNotes('');
    setDuration('');
    setOutcome('');
  };

  return (
    <Drawer
      anchor="right"
      open={phoneDrawerOpen}
      onClose={handleClose}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 450, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon color="primary" />
            Phone Dialer
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedContact && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Contact
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {selectedContact.firstName} {selectedContact.lastName}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Direction</InputLabel>
                <Select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  label="Direction"
                >
                  <MenuItem value="outbound">Outbound</MenuItem>
                  <MenuItem value="inbound">Inbound</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="missed">Missed</MenuItem>
                  <MenuItem value="voicemail">Voicemail</MenuItem>
                  <MenuItem value="busy">Busy</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Duration (seconds)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g., Left voicemail, Scheduled meeting"
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add call notes..."
            sx={{ mt: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogCall}
            disabled={loading}
            sx={{ mt: 2 }}
            startIcon={<PhoneIcon />}
          >
            {loading ? 'Logging...' : 'Log Call'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Recent Calls
          </Typography>
          <List>
            {callHistory.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No call history yet
              </Typography>
            ) : (
              callHistory.map((call) => (
                <ListItem
                  key={call.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {call.phoneNumber}
                    </Typography>
                    <Chip
                      label={call.status}
                      size="small"
                      color={call.status === 'completed' ? 'success' : 'default'}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {call.direction} • {call.duration ? `${call.duration}s` : 'No duration'} • {new Date(call.createdAt).toLocaleString()}
                  </Typography>
                  {call.notes && (
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      {call.notes}
                    </Typography>
                  )}
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default PhoneDialerWorkspace;
