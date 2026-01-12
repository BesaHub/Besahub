import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, FormControl, InputLabel, Select,
  MenuItem, Chip, IconButton, Alert, CircularProgress,
  Grid, Card, CardContent, List, ListItem, ListItemText,
  ListItemIcon, Avatar, Divider, Tabs, Tab, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Phone, Close, Schedule, Call, VideoCall, RecordVoiceOver,
  PlayArrow, Pause, Stop, Download, Delete, Add, Edit,
  TrendingUp, TrendingDown, AccessTime, CheckCircle, Error
} from '@mui/icons-material';
import communicationsApi from '../../services/communicationsApi';

const CallManager = ({ open, onClose, onSchedule, contactId = null }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    contactId: contactId || '',
    phoneNumber: '',
    callType: 'outbound',
    purpose: '',
    scheduledTime: '',
    duration: 30,
    notes: ''
  });
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Mock call history data
  const mockCallHistory = [
    {
      id: 'call_1',
      contactId: 'contact_1',
      phoneNumber: '+1234567890',
      type: 'outbound',
      status: 'completed',
      duration: 15,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      purpose: 'Property inquiry follow-up',
      notes: 'Client interested in downtown office space',
      recordingUrl: '/recordings/call_1.mp3',
      transcription: 'Client called to discuss property requirements...'
    },
    {
      id: 'call_2',
      contactId: 'contact_2',
      phoneNumber: '+1987654321',
      type: 'inbound',
      status: 'completed',
      duration: 8,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      purpose: 'General inquiry',
      notes: 'Quick question about lease terms',
      recordingUrl: null,
      transcription: null
    }
  ];

  useEffect(() => {
    if (open) {
      loadCallHistory();
    }
  }, [open]);

  const loadCallHistory = async () => {
    try {
      // In a real app, this would fetch from the API
      setCallHistory(mockCallHistory);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleScheduleCall = async () => {
    if (!formData.phoneNumber || !formData.scheduledTime) {
      setError('Please fill in phone number and scheduled time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const callData = {
        ...formData,
        status: 'scheduled',
        metadata: {
          callType: formData.callType,
          purpose: formData.purpose,
          duration: formData.duration
        }
      };

      // In a real app, this would create a scheduled call
      console.log('Scheduling call:', callData);
      
      setSuccess('Call scheduled successfully!');
      setTimeout(() => {
        onSchedule();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError('Failed to schedule call. Please try again.');
      console.error('Error scheduling call:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async () => {
    if (!formData.phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real app, this would initiate a call
      console.log('Starting call to:', formData.phoneNumber);
      
      setSuccess('Call initiated!');
      setTimeout(() => {
        onSchedule();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError('Failed to start call. Please try again.');
      console.error('Error starting call:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setCallDuration(0);
    // In a real app, this would start recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In a real app, this would stop recording
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getCallStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'missed': return 'error';
      case 'scheduled': return 'info';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getCallTypeIcon = (type) => {
    return type === 'inbound' ? <Phone /> : <Phone />;
  };

  const resetForm = () => {
    setFormData({
      contactId: contactId || '',
      phoneNumber: '',
      callType: 'outbound',
      purpose: '',
      scheduledTime: '',
      duration: 30,
      notes: ''
    });
    setError(null);
    setSuccess(null);
    setIsRecording(false);
    setCallDuration(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const tabPanels = [
    {
      label: 'Make Call',
      component: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+1234567890"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Contact ID"
              value={formData.contactId}
              onChange={(e) => handleInputChange('contactId', e.target.value)}
              placeholder="contact_123"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Call Type</InputLabel>
              <Select
                value={formData.callType}
                onChange={(e) => handleInputChange('callType', e.target.value)}
                label="Call Type"
              >
                <MenuItem value="outbound">Outbound</MenuItem>
                <MenuItem value="inbound">Inbound</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="e.g., Property inquiry follow-up"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              multiline
              rows={3}
              placeholder="Add any notes about this call..."
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Schedule Call',
      component: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+1234567890"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Contact ID"
              value={formData.contactId}
              onChange={(e) => handleInputChange('contactId', e.target.value)}
              placeholder="contact_123"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Scheduled Time *"
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expected Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              inputProps={{ min: 5, max: 120 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="e.g., Property viewing discussion"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              multiline
              rows={3}
              placeholder="Add any notes about this scheduled call..."
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Call History',
      component: (
        <Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {callHistory.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCallTypeIcon(call.type)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {call.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{call.phoneNumber}</TableCell>
                    <TableCell>{formatDuration(call.duration * 60)}</TableCell>
                    <TableCell>
                      <Chip
                        label={call.status}
                        color={getCallStatusColor(call.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatTimestamp(call.timestamp)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {call.recordingUrl && (
                          <IconButton size="small" color="primary">
                            <PlayArrow />
                          </IconButton>
                        )}
                        {call.recordingUrl && (
                          <IconButton size="small" color="primary">
                            <Download />
                          </IconButton>
                        )}
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone color="primary" />
            <Typography variant="h6">Call Manager</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {tabPanels.map((panel, index) => (
              <Tab key={index} label={panel.label} />
            ))}
          </Tabs>
        </Box>

        {tabPanels[activeTab].component}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {activeTab === 0 && (
          <Button
            onClick={handleStartCall}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Call />}
          >
            {loading ? 'Starting...' : 'Start Call'}
          </Button>
        )}
        {activeTab === 1 && (
          <Button
            onClick={handleScheduleCall}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Schedule />}
          >
            {loading ? 'Scheduling...' : 'Schedule Call'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CallManager;
