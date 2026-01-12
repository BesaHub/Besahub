import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, FormControl, InputLabel, Select,
  MenuItem, Chip, IconButton, Alert, CircularProgress,
  Grid, Card, CardContent, List, ListItem, ListItemText,
  ListItemIcon, Avatar, Divider
} from '@mui/material';
import {
  Send, Sms, Close, ContentPaste, Person, Message, CheckCircle,
  Schedule, Delete, Edit, Add
} from '@mui/icons-material';
import communicationsApi from '../../services/communicationsApi';

const SmsComposer = ({ open, onClose, onSend, contactId = null }) => {
  const [formData, setFormData] = useState({
    to: '',
    content: '',
    templateId: '',
    contactId: contactId || '',
    scheduledTime: ''
  });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);

  // SMS character limits
  const SMS_LIMIT = 160;
  const SMS_LIMIT_LONG = 1600;

  // Load SMS templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const response = await communicationsApi.getSmsTemplates();
      // API shape: { success: true, data: [...] }
      setTemplates(response?.data?.data || []);
    } catch (error) {
      console.error('Error loading SMS templates:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'content') {
      setCharacterCount(value.length);
    }
  };

  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      templateId: template.id,
      // Backend uses `body` for SMS template content
      content: template.body || ''
    }));
    setCharacterCount((template.body || '').length);
    setShowTemplates(false);
  };

  const getCharacterCountColor = () => {
    if (characterCount <= SMS_LIMIT) return 'success';
    if (characterCount <= SMS_LIMIT_LONG) return 'warning';
    return 'error';
  };

  const getSmsCount = () => {
    if (characterCount <= SMS_LIMIT) return 1;
    return Math.ceil(characterCount / SMS_LIMIT);
  };

  const handleSend = async () => {
    if (!formData.to || !formData.content) {
      setError('Please fill in all required fields');
      return;
    }

    if (characterCount > SMS_LIMIT_LONG) {
      setError('Message is too long. Maximum 1600 characters allowed.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const smsData = {
        ...formData,
        metadata: {
          templateId: formData.templateId,
          characterCount,
          smsCount: getSmsCount()
        }
      };

      await communicationsApi.sendSms(smsData);
      
      setSuccess('SMS sent successfully!');
      setTimeout(() => {
        onSend();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError('Failed to send SMS. Please try again.');
      console.error('Error sending SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!formData.scheduledTime) {
      setError('Please select a scheduled time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Schedule SMS logic would go here
      setSuccess('SMS scheduled successfully!');
      setTimeout(() => {
        onSend();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError('Failed to schedule SMS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      to: '',
      content: '',
      templateId: '',
      contactId: contactId || '',
      scheduledTime: ''
    });
    setCharacterCount(0);
    setError(null);
    setSuccess(null);
    setShowTemplates(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sms color="primary" />
            <Typography variant="h6">Send SMS</Typography>
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

        <Grid container spacing={2}>
          {/* Recipient */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="+1234567890"
              required
              helperText="Include country code (e.g., +1 for US)"
            />
          </Grid>

          {/* Contact ID */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Contact ID"
              value={formData.contactId}
              onChange={(e) => handleInputChange('contactId', e.target.value)}
              placeholder="contact_123"
            />
          </Grid>

          {/* Template Selection */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Message Template</Typography>
              <Button
                size="small"
                startIcon={<ContentPaste />}
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? 'Hide Templates' : 'Use Template'}
              </Button>
            </Box>
            
            {showTemplates && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quick Templates
                  </Typography>
                  <List dense>
                    {templates.map((template) => (
                      <ListItem
                        key={template.id}
                        button
                        onClick={() => handleTemplateSelect(template)}
                        sx={{ borderRadius: 1, mb: 0.5 }}
                      >
                        <ListItemIcon>
                          <Message />
                        </ListItemIcon>
                        <ListItemText
                      primary={template.body || ''}
                      secondary={template.name || ''}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Message Content */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message *"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              multiline
              rows={4}
              placeholder="Type your SMS message here..."
              required
              helperText={`${characterCount} characters • ${getSmsCount()} SMS${getSmsCount() > 1 ? 'es' : ''}`}
              error={characterCount > SMS_LIMIT_LONG}
            />
            
            {/* Character count indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Chip
                label={`${characterCount}/${SMS_LIMIT_LONG}`}
                color={getCharacterCountColor()}
                size="small"
                variant="outlined"
              />
              {characterCount > SMS_LIMIT && (
                <Chip
                  label={`${getSmsCount()} SMS${getSmsCount() > 1 ? 'es' : ''}`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </Grid>

          {/* Schedule Option */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Schedule (Optional)"
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Leave empty to send immediately"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {formData.scheduledTime ? (
          <Button
            onClick={handleSchedule}
            variant="outlined"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Schedule />}
          >
            {loading ? 'Scheduling...' : 'Schedule SMS'}
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={loading || characterCount > SMS_LIMIT_LONG}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            {loading ? 'Sending...' : 'Send SMS'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SmsComposer;
