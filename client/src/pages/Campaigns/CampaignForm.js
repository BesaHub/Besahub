import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Snackbar,
  Tab,
  Tabs,
  FormControlLabel,
  Radio,
  RadioGroup,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Send,
  Schedule,
  Email,
  Add,
  Delete,
  Close,
  PersonAdd,
  FilterList,
  CalendarToday,
  Assessment
} from '@mui/icons-material';
import { campaignApi, CAMPAIGN_TYPES, RECIPIENT_TYPES } from '../../services/campaignApi';
import { contactApi } from '../../services/contactApi';

const CampaignForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentTab, setCurrentTab] = useState(location.state?.tab || 0);
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    tags: [],
    subject: '',
    emailBody: '',
    plainTextBody: '',
    recipientType: 'all_contacts',
    recipientFilters: {
      leadStatus: [],
      contactRole: [],
      tags: []
    },
    recipientList: [],
    scheduledDate: '',
    propertyId: '',
    dealId: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState([]);

  const leadStatuses = ['cold', 'warm', 'hot', 'qualified', 'converted', 'lost'];
  const contactRoles = [
    'tenant', 'landlord', 'buyer', 'seller', 'investor', 
    'broker', 'attorney', 'lender', 'contractor', 'architect', 
    'property_manager', 'other'
  ];

  useEffect(() => {
    if (isEditing) {
      fetchCampaign();
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (currentTab === 2) {
      fetchContacts();
    }
  }, [currentTab]);

  useEffect(() => {
    calculateRecipientCount();
  }, [formData.recipientType, formData.recipientFilters, formData.recipientList, selectedContacts]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await campaignApi.getCampaignById(id);
      
      if (response && response.campaign) {
        const campaign = response.campaign;
        setFormData({
          name: campaign.name || '',
          description: campaign.description || '',
          type: campaign.type || 'email',
          tags: campaign.tags || [],
          subject: campaign.subject || '',
          emailBody: campaign.emailBody || '',
          plainTextBody: campaign.plainTextBody || '',
          recipientType: campaign.recipientType || 'all_contacts',
          recipientFilters: campaign.recipientFilters || {
            leadStatus: [],
            contactRole: [],
            tags: []
          },
          recipientList: campaign.recipientList || [],
          scheduledDate: campaign.scheduledDate ? 
            new Date(campaign.scheduledDate).toISOString().slice(0, 16) : '',
          propertyId: campaign.propertyId || '',
          dealId: campaign.dealId || ''
        });
      }
    } catch (err) {
      setError('Failed to load campaign details');
      console.error('Error fetching campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await contactApi.getContacts({ limit: 1000 });
      setContacts(response.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const calculateRecipientCount = () => {
    let count = 0;

    if (formData.recipientType === 'all_contacts') {
      count = contacts.length;
    } else if (formData.recipientType === 'filtered') {
      count = contacts.filter(contact => {
        let matches = true;
        
        if (formData.recipientFilters.leadStatus?.length > 0) {
          matches = matches && formData.recipientFilters.leadStatus.includes(contact.leadStatus);
        }
        
        if (formData.recipientFilters.contactRole?.length > 0) {
          matches = matches && formData.recipientFilters.contactRole.includes(contact.contactRole);
        }
        
        if (formData.recipientFilters.tags?.length > 0) {
          matches = matches && formData.recipientFilters.tags.some(tag => 
            contact.tags?.includes(tag)
          );
        }
        
        return matches;
      }).length;
    } else if (formData.recipientType === 'custom_list') {
      count = formData.recipientList.length;
    } else if (formData.recipientType === 'specific') {
      count = selectedContacts.length;
    }

    setRecipientCount(count);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleRecipientTypeChange = (event) => {
    setFormData(prev => ({
      ...prev,
      recipientType: event.target.value
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFormData(prev => ({
      ...prev,
      recipientFilters: {
        ...prev.recipientFilters,
        [filterType]: value
      }
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Campaign type is required';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Email subject is required';
    }
    
    if (!formData.emailBody.trim()) {
      errors.emailBody = 'Email body is required';
    }

    if (formData.recipientType === 'specific' && selectedContacts.length === 0) {
      errors.recipients = 'Please select at least one recipient';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (action = 'save') => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      setCurrentTab(0); // Go to first tab with errors
      return;
    }

    try {
      setSaving(true);
      
      const campaignData = {
        ...formData,
        recipientList: formData.recipientType === 'specific' ? 
          selectedContacts.map(c => c.id) : formData.recipientList
      };

      let response;
      if (isEditing) {
        response = await campaignApi.updateCampaign(id, campaignData);
      } else {
        response = await campaignApi.createCampaign(campaignData);
      }

      const campaignId = response.campaign?.id || id;

      // Handle different actions
      if (action === 'schedule' && formData.scheduledDate) {
        await campaignApi.scheduleCampaign(campaignId, formData.scheduledDate);
        setSnackbar({
          open: true,
          message: 'Campaign scheduled successfully',
          severity: 'success'
        });
      } else if (action === 'send') {
        await campaignApi.sendCampaign(campaignId);
        setSnackbar({
          open: true,
          message: 'Campaign sent successfully (SendGrid integration pending)',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Campaign ${isEditing ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
      }

      setTimeout(() => navigate('/campaigns'), 1500);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || `Failed to ${action} campaign`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter an email address',
        severity: 'error'
      });
      return;
    }

    try {
      setSendingTest(true);
      await campaignApi.sendTestEmail(id, testEmail);
      setSnackbar({
        open: true,
        message: 'Test email sent successfully (SendGrid integration pending)',
        severity: 'info'
      });
      setTestEmailDialog(false);
      setTestEmail('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to send test email',
        severity: 'error'
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/campaigns')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Edit Campaign' : 'Create Campaign'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditing && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Email />}
              onClick={() => setTestEmailDialog(true)}
            >
              Send Test
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/campaigns')}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Save />}
            onClick={() => handleSubmit('save')}
            disabled={saving}
          >
            Save Draft
          </Button>
          {formData.scheduledDate && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Schedule />}
              onClick={() => handleSubmit('schedule')}
              disabled={saving}
            >
              Schedule
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Send />}
            onClick={() => handleSubmit('send')}
            disabled={saving}
          >
            Send Now
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Basic Info" />
          <Tab label="Email Content" />
          <Tab label="Recipients" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper sx={{ p: 2 }}>
        {/* Tab 0: Basic Info */}
        {currentTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                size="small"
                label="Campaign Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={Boolean(formErrors.name)}
                helperText={formErrors.name}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required size="small" error={Boolean(formErrors.type)}>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Campaign Type"
                  onChange={handleInputChange('type')}
                >
                  {CAMPAIGN_TYPES.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      onDelete={() => handleTagRemove(tag)}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleTagAdd}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Email Content */}
        {currentTab === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                size="small"
                label="Email Subject"
                value={formData.subject}
                onChange={handleInputChange('subject')}
                error={Boolean(formErrors.subject)}
                helperText={formErrors.subject}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={12}
                size="small"
                label="Email Body (HTML supported)"
                value={formData.emailBody}
                onChange={handleInputChange('emailBody')}
                error={Boolean(formErrors.emailBody)}
                helperText={formErrors.emailBody || 'You can use HTML tags for formatting'}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                size="small"
                label="Plain Text Fallback (Optional)"
                value={formData.plainTextBody}
                onChange={handleInputChange('plainTextBody')}
                helperText="Plain text version for email clients that don't support HTML"
              />
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Recipients */}
        {currentTab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Recipient Type
                </Typography>
                <RadioGroup
                  value={formData.recipientType}
                  onChange={handleRecipientTypeChange}
                >
                  {RECIPIENT_TYPES.map((type) => (
                    <FormControlLabel
                      key={type.id}
                      value={type.id}
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2">{type.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>

            {formData.recipientType === 'filtered' && (
              <>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={leadStatuses}
                    value={formData.recipientFilters.leadStatus}
                    onChange={(e, value) => handleFilterChange('leadStatus', value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by Lead Status" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={contactRoles}
                    value={formData.recipientFilters.contactRole}
                    onChange={(e, value) => handleFilterChange('contactRole', value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by Contact Role" />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    size="small"
                    freeSolo
                    options={[]}
                    value={formData.recipientFilters.tags}
                    onChange={(e, value) => handleFilterChange('tags', value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by Tags" />
                    )}
                  />
                </Grid>
              </>
            )}

            {formData.recipientType === 'specific' && (
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  size="small"
                  options={contacts}
                  value={selectedContacts}
                  onChange={(e, value) => setSelectedContacts(value)}
                  getOptionLabel={(option) => 
                    option.type === 'individual' 
                      ? `${option.firstName} ${option.lastName}` 
                      : option.companyName
                  }
                  loading={loadingContacts}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Contacts"
                      error={Boolean(formErrors.recipients)}
                      helperText={formErrors.recipients}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Estimated Recipients: {recipientCount}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Settings */}
        {currentTab === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                size="small"
                label="Schedule Date & Time"
                value={formData.scheduledDate}
                onChange={handleInputChange('scheduledDate')}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty to save as draft"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Associated Property/Deal (Optional)
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Property ID"
                value={formData.propertyId}
                onChange={handleInputChange('propertyId')}
                helperText="Link this campaign to a specific property"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Deal ID"
                value={formData.dealId}
                onChange={handleInputChange('dealId')}
                helperText="Link this campaign to a specific deal"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Note:</strong> Email sending functionality requires SendGrid integration.
                  Campaigns will be saved and tracked, but actual email delivery will be enabled
                  after SendGrid setup.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCurrentTab(Math.max(0, currentTab - 1))}
            disabled={currentTab === 0}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              if (currentTab === 3) {
                handleSubmit('save');
              } else {
                setCurrentTab(Math.min(3, currentTab + 1));
              }
            }}
          >
            {currentTab === 3 ? 'Save Campaign' : 'Next'}
          </Button>
        </Box>
      </Paper>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialog} onClose={() => setTestEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Test Email</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            size="small"
            type="email"
            label="Test Email Address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestEmailDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendTestEmail}
            disabled={sendingTest}
          >
            Send Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CampaignForm;
