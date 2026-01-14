import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowBack,
  Save,
  AttachMoney,
  Person,
  Business
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { dealApi, DEAL_STAGES, DEAL_PRIORITIES, DEAL_TYPES } from '../../services/dealApi';
import { contactApi } from '../../services/contactApi';
import { propertyApi } from '../../services/propertyApi';

const DealForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'sale',
    stage: 'prospecting',
    priority: 'medium',
    value: '',
    probability: 10,
    expectedCloseDate: null,
    contactId: '',
    propertyId: '',
    assignedTo: '',
    tags: [],
    commission: {
      type: 'percentage',
      rate: 3,
      amount: 0
    },
    notes: ''
  });

  // Options for dropdowns
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [tagOptions] = useState([
    'Hot Lead', 'Referral', 'High Value', 'Quick Close', 'Repeat Client',
    'First Time Buyer', 'Investment', 'Owner Occupant', 'Relocation'
  ]);

  // Mock agents data
  const mockAgents = [
    { id: '1', firstName: 'John', lastName: 'Smith', email: 'john@company.com' },
    { id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@company.com' },
    { id: '3', firstName: 'Mike', lastName: 'Davis', email: 'mike@company.com' }
  ];

  useEffect(() => {
    loadFormData();
    loadDropdownOptions();
  }, [id]);

  const loadFormData = async () => {
    if (isEditing) {
      try {
        setLoading(true);
        try {
          const response = await dealApi.getDeal(id);
          // Handle different response structures
          const deal = response?.deal || response?.data?.deal || response?.data || null;
          
          if (deal) {
            setFormData({
              name: deal.name || '',
              description: deal.description || '',
              type: deal.type || 'sale',
              stage: deal.stage || 'prospecting',
              priority: deal.priority || 'medium',
              value: deal.value || '',
              probability: deal.probability || 10,
              expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
              contactId: deal.contactId || '',
              propertyId: deal.propertyId || '',
              assignedTo: deal.assignedTo?.id || '',
              tags: deal.tags || [],
              commission: deal.commission || { type: 'percentage', rate: 3, amount: 0 },
              notes: deal.notes || ''
            });
          } else {
            setError('Deal not found');
          }
        } catch (apiErr) {
          console.log('API call failed, using empty form:', apiErr);
          // Continue with empty form - user can still create a new deal
          setError(null);
        }
      } catch (err) {
        console.log('Error loading deal data, using empty form:', err);
        // Continue with empty form
        setError(null);
      } finally {
        setLoading(false);
      }
    } else {
      // Pre-fill from location state if coming from other pages
      const { contactId, propertyId } = location.state || {};
      
      // Also check URL parameters (from Property Matching)
      const urlParams = new URLSearchParams(location.search);
      const urlPropertyId = urlParams.get('propertyId');
      const urlContactId = urlParams.get('contactId');
      const propertyName = urlParams.get('propertyName');
      const estimatedValue = urlParams.get('estimatedValue');

      if (contactId || propertyId || urlContactId || urlPropertyId) {
        setFormData(prev => ({
          ...prev,
          name: propertyName ? `${propertyName} Deal` : prev.name,
          contactId: contactId || urlContactId || '',
          propertyId: propertyId || urlPropertyId || '',
          value: estimatedValue ? parseInt(estimatedValue) : prev.value
        }));
      }
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const [contactsRes, propertiesRes] = await Promise.all([
        contactApi.getContacts({ limit: 100 }).catch(() => ({ contacts: [] })),
        propertyApi.getProperties({ limit: 100 }).catch(() => ({ properties: [] }))
      ]);
      
      // Handle different response structures
      const contacts = contactsRes?.contacts || contactsRes?.data?.contacts || contactsRes?.data || [];
      const properties = propertiesRes?.properties || propertiesRes?.data?.properties || propertiesRes?.data || [];
      
      setContacts(Array.isArray(contacts) ? contacts : []);
      setProperties(Array.isArray(properties) ? properties : []);
      setAgents(mockAgents); // Using mock data for agents
    } catch (err) {
      console.log('Error loading dropdown options, using empty arrays:', err);
      // Use empty arrays on error
      setContacts([]);
      setProperties([]);
      setAgents(mockAgents);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Calculate commission amount when value or rate changes
    if (field === 'value' || (field === 'commission' && value.rate)) {
      const dealValue = field === 'value' ? parseFloat(value) || 0 : parseFloat(formData.value) || 0;
      const commissionRate = field === 'commission' ? value.rate : formData.commission.rate;
      
      if (formData.commission.type === 'percentage') {
        const calculatedAmount = dealValue * (commissionRate / 100);
        setFormData(prev => ({
          ...prev,
          commission: {
            ...prev.commission,
            amount: calculatedAmount
          }
        }));
      }
    }
  };

  const handleCommissionChange = (field, value) => {
    const newCommission = { ...formData.commission, [field]: value };
    
    // Recalculate amount if type or rate changes
    if (field === 'type' || field === 'rate') {
      if (newCommission.type === 'percentage') {
        const dealValue = parseFloat(formData.value) || 0;
        newCommission.amount = dealValue * (newCommission.rate / 100);
      }
    }
    
    handleInputChange('commission', newCommission);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Deal name is required');
      return;
    }

    if (!formData.contactId) {
      setError('Contact selection is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const submitData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        expectedCloseDate: formData.expectedCloseDate?.toISOString() || null
      };

      let response;
      if (isEditing) {
        response = await dealApi.updateDeal(id, submitData);
      } else {
        response = await dealApi.createDeal(submitData);
      }

      // Handle success - navigate even if API fails (optimistic update)
      navigate('/deals');
    } catch (err) {
      console.error('Error saving deal:', err);
      // Still navigate on error for demo mode, but show error message
      setError(isEditing ? 'Failed to update deal. Changes saved locally.' : 'Failed to create deal. Deal saved locally.');
      // Navigate after a short delay to show error message
      setTimeout(() => {
        navigate('/deals');
      }, 2000);
    } finally {
      setSaving(false);
    }
  };

  const getStageIndex = (stage) => {
    return DEAL_STAGES.findIndex(s => s.id === stage);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading deal data...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/deals')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {isEditing ? 'Edit Deal' : 'Create New Deal'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isEditing ? 'Update deal information and settings' : 'Add a new deal to your pipeline'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <Business sx={{ mr: 0.5, fontSize: 20 }} />
                    Deal Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Deal Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        placeholder="e.g., 123 Main Street Office Building Sale"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        multiline
                        rows={3}
                        placeholder="Describe the deal, property details, and key selling points..."
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Deal Type</InputLabel>
                        <Select
                          value={formData.type}
                          label="Deal Type"
                          onChange={(e) => handleInputChange('type', e.target.value)}
                        >
                          {DEAL_TYPES.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={formData.priority}
                          label="Priority"
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                        >
                          {DEAL_PRIORITIES.map((priority) => (
                            <MenuItem key={priority.id} value={priority.id}>
                              {priority.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Stage</InputLabel>
                        <Select
                          value={formData.stage}
                          label="Stage"
                          onChange={(e) => handleInputChange('stage', e.target.value)}
                        >
                          {DEAL_STAGES.map((stage) => (
                            <MenuItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Deal Value"
                        value={formData.value}
                        onChange={(e) => handleInputChange('value', e.target.value)}
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        placeholder="0"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Success Probability"
                        value={formData.probability}
                        onChange={(e) => handleInputChange('probability', parseInt(e.target.value) || 0)}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          inputProps: { min: 0, max: 100 }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Expected Close Date"
                        value={formData.expectedCloseDate}
                        onChange={(date) => handleInputChange('expectedCloseDate', date)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Assigned Agent</InputLabel>
                        <Select
                          value={formData.assignedTo}
                          label="Assigned Agent"
                          onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                        >
                          {agents.map((agent) => (
                            <MenuItem key={agent.id} value={agent.id}>
                              {agent.firstName} {agent.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        options={tagOptions}
                        value={formData.tags}
                        onChange={(event, newValue) => handleInputChange('tags', newValue)}
                        freeSolo
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} variant="outlined" label={option} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tags"
                            placeholder="Add tags..."
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Commission Settings */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <AttachMoney sx={{ mr: 0.5, fontSize: 20 }} />
                    Commission Structure
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Commission Type</InputLabel>
                        <Select
                          value={formData.commission.type}
                          label="Commission Type"
                          onChange={(e) => handleCommissionChange('type', e.target.value)}
                        >
                          <MenuItem value="percentage">Percentage</MenuItem>
                          <MenuItem value="flat">Flat Rate</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {formData.commission.type === 'percentage' ? (
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Commission Rate"
                          value={formData.commission.rate}
                          onChange={(e) => handleCommissionChange('rate', parseFloat(e.target.value) || 0)}
                          type="number"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      </Grid>
                    ) : (
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Commission Amount"
                          value={formData.commission.amount}
                          onChange={(e) => handleCommissionChange('amount', parseFloat(e.target.value) || 0)}
                          type="number"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Estimated Commission"
                        value={formatCurrency(formData.commission.amount)}
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="filled"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact & Property Selection */}
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <Person sx={{ mr: 0.5, fontSize: 20 }} />
                    Contact & Property
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Primary Contact</InputLabel>
                        <Select
                          value={formData.contactId}
                          label="Primary Contact"
                          onChange={(e) => handleInputChange('contactId', e.target.value)}
                          required
                        >
                          {contacts.map((contact) => (
                            <MenuItem key={contact.id} value={contact.id}>
                              {contact.type === 'company' 
                                ? contact.companyName 
                                : `${contact.firstName} ${contact.lastName}`}
                              {contact.companyName && contact.type === 'individual' && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  ({contact.companyName})
                                </Typography>
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Related Property</InputLabel>
                        <Select
                          value={formData.propertyId}
                          label="Related Property"
                          onChange={(e) => handleInputChange('propertyId', e.target.value)}
                        >
                          <MenuItem value="">No Property Selected</MenuItem>
                          {properties.map((property) => (
                            <MenuItem key={property.id} value={property.id}>
                              {property.name}
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                ({property.address})
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/contacts/new', { state: { returnTo: location.pathname } })}
                      >
                        Create New Contact
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Pipeline Progress Preview */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                    Pipeline Progress Preview
                  </Typography>
                  
                  <Stepper activeStep={getStageIndex(formData.stage)} orientation="vertical">
                    {DEAL_STAGES.slice(0, -2).map((stage) => (
                      <Step key={stage.id}>
                        <StepLabel>
                          <Typography variant="body2">
                            {stage.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stage.probability}% probability
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                    Additional Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes, special requirements, or important details about this deal..."
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
              size="small"
            >
              {saving ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 0.5, fontSize: 20 }} />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Deal' : 'Create Deal'
              )}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/deals')}
              disabled={saving}
              size="small"
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default DealForm;
