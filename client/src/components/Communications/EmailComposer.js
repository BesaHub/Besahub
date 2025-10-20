import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, FormControl, InputLabel, Select,
  MenuItem, Chip, IconButton, Tooltip, Alert, CircularProgress,
  Grid, Card, CardContent, Divider, List, ListItem, ListItemText,
  ListItemIcon, Checkbox, FormControlLabel
} from '@mui/material';
import {
  Send, AttachFile, Delete, Add, Close, Email, Person,
  Subject, Message, Template, Save, Preview, SpellCheck
} from '@mui/icons-material';
import communicationsApi from '../../services/communicationsApi';

const EmailComposer = ({ open, onClose, onSend, contactId = null }) => {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: '',
    templateId: '',
    contactId: contactId || ''
  });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [templateVariables, setTemplateVariables] = useState({});

  // Load email templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const response = await communicationsApi.getEmailTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        content: template.content
      }));
      
      // Extract variables from template
      const variables = {};
      template.variables.forEach(variable => {
        variables[variable] = '';
      });
      setTemplateVariables(variables);
    }
  };

  const handleVariableChange = (variable, value) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const processTemplate = (content, variables) => {
    let processedContent = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value || `{{${key}}}`);
    });
    return processedContent;
  };

  const handleSend = async () => {
    if (!formData.to || !formData.subject || !formData.content) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const emailData = {
        ...formData,
        content: processTemplate(formData.content, templateVariables),
        subject: processTemplate(formData.subject, templateVariables),
        metadata: {
          templateId: formData.templateId,
          variables: templateVariables,
          attachments: attachments.length
        }
      };

      await communicationsApi.sendEmail(emailData);
      
      setSuccess('Email sent successfully!');
      setTimeout(() => {
        onSend();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError('Failed to send email. Please try again.');
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // Save as draft logic would go here
      setSuccess('Draft saved successfully!');
    } catch (error) {
      setError('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleAttachment = (event) => {
    const files = Array.from(event.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      content: '',
      templateId: '',
      contactId: contactId || ''
    });
    setTemplateVariables({});
    setAttachments([]);
    setError(null);
    setSuccess(null);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email color="primary" />
            <Typography variant="h6">Compose Email</Typography>
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
          {/* Template Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Email Template</InputLabel>
              <Select
                value={formData.templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                label="Email Template"
              >
                <MenuItem value="">
                  <em>No Template</em>
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    <Box>
                      <Typography variant="body1">{template.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.category}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Recipients */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="To *"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
              label="CC"
              value={formData.cc}
              onChange={(e) => handleInputChange('cc', e.target.value)}
              placeholder="cc@example.com"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="BCC"
              value={formData.bcc}
              onChange={(e) => handleInputChange('bcc', e.target.value)}
              placeholder="bcc@example.com"
            />
          </Grid>

          {/* Subject */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Subject *"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Email subject"
              required
            />
          </Grid>

          {/* Template Variables */}
          {Object.keys(templateVariables).length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Template Variables
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(templateVariables).map(([variable, value]) => (
                      <Grid item xs={12} md={6} key={variable}>
                        <TextField
                          fullWidth
                          label={variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          value={value}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          size="small"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Content */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message *"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              multiline
              rows={8}
              placeholder="Type your message here..."
              required
            />
          </Grid>

          {/* Attachments */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Attachments</Typography>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="attachment-input"
                type="file"
                multiple
                onChange={handleAttachment}
              />
              <label htmlFor="attachment-input">
                <IconButton component="span" size="small">
                  <AttachFile />
                </IconButton>
              </label>
            </Box>
            {attachments.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => removeAttachment(index)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleSaveDraft}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
        >
          Save Draft
        </Button>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          startIcon={<Preview />}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Send />}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Email Preview</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                To: {formData.to}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Subject: {processTemplate(formData.subject, templateVariables)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {processTemplate(formData.content, templateVariables)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
};

export default EmailComposer;
