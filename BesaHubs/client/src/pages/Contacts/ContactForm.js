import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
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
  InputAdornment,
  Snackbar,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Autocomplete,
  Card,
  CardMedia,
  IconButton,
  Avatar
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Business,
  Email,
  Phone,
  LocationOn,
  AttachMoney,
  TrendingUp,
  Add,
  CloudUpload,
  Delete,
  PhotoCamera
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { contactApi } from '../../services/contactApi';
import { propertyAlertsApi, PropertyAlertEngine } from '../../services/propertyAlertsApi';
import { compressImage, getCompressionOptions, validateImageFile } from '../../utils/imageCompression';

const ContactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [createPropertyAlert, setCreatePropertyAlert] = useState(true);

  const [formData, setFormData] = useState({
    type: 'individual',
    firstName: '',
    lastName: '',
    companyName: '',
    title: '',
    primaryEmail: '',
    secondaryEmail: '',
    primaryPhone: '',
    mobilePhone: '',
    mailingAddress: '',
    mailingCity: '',
    mailingState: '',
    mailingZipCode: '',
    contactRole: '',
    leadStatus: 'cold',
    budgetMin: '',
    budgetMax: '',
    propertyTypeInterest: [],
    preferredLocations: [],
    timeframe: '',
    notes: '',
    tags: [],
    creditRating: '',
    netWorth: '',
    liquidity: '',
    website: '',
    linkedInUrl: '',
    customFields: {},
    avatar: null
  });

  const [formErrors, setFormErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [propertyTypeInput, setPropertyTypeInput] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);

  const contactRoles = [
    'tenant',
    'landlord',
    'buyer',
    'seller',
    'investor',
    'broker',
    'attorney',
    'lender',
    'contractor',
    'architect',
    'property_manager',
    'other'
  ];

  const leadStatuses = [
    'cold',
    'warm',
    'hot',
    'qualified',
    'converted',
    'lost'
  ];

  const propertyTypes = [
    'office',
    'retail',
    'industrial',
    'warehouse',
    'multifamily',
    'hotel',
    'mixed_use',
    'land',
    'other'
  ];

  const timeframes = [
    'immediate',
    '30_days',
    '3_months',
    '6_months',
    '1_year',
    'flexible'
  ];

  const creditRatings = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

  useEffect(() => {
    if (isEditing) {
      fetchContact();
    }
  }, [id, isEditing]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await contactApi.getContact(id);
      
      if (response && response.contact) {
        const contact = response.contact;
        setFormData({
          type: contact.type || 'individual',
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          companyName: contact.companyName || '',
          title: contact.title || '',
          primaryEmail: contact.primaryEmail || '',
          secondaryEmail: contact.secondaryEmail || '',
          primaryPhone: contact.primaryPhone || '',
          mobilePhone: contact.mobilePhone || '',
          mailingAddress: contact.mailingAddress || '',
          mailingCity: contact.mailingCity || '',
          mailingState: contact.mailingState || '',
          mailingZipCode: contact.mailingZipCode || '',
          contactRole: contact.contactRole || '',
          leadStatus: contact.leadStatus || 'cold',
          budgetMin: contact.budgetMin || '',
          budgetMax: contact.budgetMax || '',
          propertyTypeInterest: contact.propertyTypeInterest || [],
          preferredLocations: contact.preferredLocations || [],
          timeframe: contact.timeframe || '',
          notes: contact.notes || '',
          tags: contact.tags || [],
          creditRating: contact.creditRating || '',
          netWorth: contact.netWorth || '',
          liquidity: contact.liquidity || '',
          website: contact.website || '',
          linkedInUrl: contact.linkedInUrl || '',
          customFields: contact.customFields || {},
          avatar: contact.avatar || null
        });
      }
    } catch (err) {
      setError('Failed to load contact details');
      console.error('Error fetching contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleArrayAdd = (field, input, setInput) => {
    if (input.trim() && !formData[field].includes(input.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput('');
    }
  };

  const handleArrayRemove = (field, itemToRemove) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== itemToRemove)
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (formData.type === 'individual') {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
    } else {
      if (!formData.companyName.trim()) {
        errors.companyName = 'Company name is required';
      }
    }
    
    if (!formData.primaryEmail.trim()) {
      errors.primaryEmail = 'Primary email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.primaryEmail)) {
      errors.primaryEmail = 'Please enter a valid email address';
    }
    
    if (!formData.primaryPhone.trim()) {
      errors.primaryPhone = 'Primary phone is required';
    }
    
    if (!formData.contactRole) {
      errors.contactRole = 'Contact role is required';
    }

    // Validate secondary email if provided
    if (formData.secondaryEmail && !/\S+@\S+\.\S+/.test(formData.secondaryEmail)) {
      errors.secondaryEmail = 'Please enter a valid email address';
    }

    // Validate website URL if provided
    if (formData.website && !formData.website.startsWith('http')) {
      errors.website = 'Website URL must start with http:// or https://';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createPropertyAlertFromPreferences = async (contactId, contactData) => {
    if (!createPropertyAlert || !contactData.propertyTypeInterest?.length) {
      return;
    }

    try {
      const alertData = {
        name: `${contactData.firstName} ${contactData.lastName} - Investment Preferences`,
        criteria: {
          propertyTypes: contactData.propertyTypeInterest || [],
          priceMin: contactData.budgetMin || null,
          priceMax: contactData.budgetMax || null,
          locations: contactData.preferredLocations || [],
          keywords: []
        },
        frequency: contactData.timeframe === 'immediate' ? 'realtime' : 'daily',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        active: true,
        contactId: contactId
      };

      await propertyAlertsApi.createAlert(alertData);
      console.log('Property alert created for contact preferences');
    } catch (error) {
      console.log('Could not create property alert (API might not be available):', error);
    }
  };

  // Avatar upload functions
  const handleAvatarUpload = async (files) => {
    if (files.length === 0) return;

    const file = files[0];

    // Validate the image file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setSnackbar({
        open: true,
        message: validation.errors.join(', '),
        severity: 'error'
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Compress the image before upload
      const compressionOptions = getCompressionOptions('avatar', file.type);
      const compressedFile = await compressImage(file, compressionOptions);

      if (!isEditing) {
        setSelectedAvatarFile(compressedFile);
        const fileUrl = URL.createObjectURL(compressedFile);
        setFormData(prev => ({ ...prev, avatar: fileUrl }));
        setSnackbar({
          open: true,
          message: `Avatar optimized! Size reduced by ${((file.size - compressedFile.size) / file.size * 100).toFixed(1)}%`,
          severity: 'success'
        });
        return;
      }

      const formDataToUpload = new FormData();
      formDataToUpload.append('avatar', compressedFile);

      const response = await contactApi.uploadAvatar(id, formDataToUpload);

      if (response.success) {
        setFormData(prev => ({ ...prev, avatar: response.avatar }));
        const compressionPercentage = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
        setSnackbar({
          open: true,
          message: `Avatar uploaded successfully! Optimized size by ${compressionPercentage}%`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload avatar',
        severity: 'error'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!isEditing) {
      setSelectedAvatarFile(null);
      setFormData(prev => ({ ...prev, avatar: null }));
      return;
    }

    try {
      setUploadingAvatar(true);
      await contactApi.removeAvatar(id);

      setFormData(prev => ({ ...prev, avatar: null }));
      setSnackbar({
        open: true,
        message: 'Avatar removed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Remove avatar error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove avatar',
        severity: 'error'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps, isDragActive: isAvatarDragActive } = useDropzone({
    onDrop: handleAvatarUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Convert string numbers to actual numbers
      const contactData = {
        ...formData,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        netWorth: formData.netWorth ? parseFloat(formData.netWorth) : null,
        liquidity: formData.liquidity ? parseFloat(formData.liquidity) : null
      };

      let response;
      if (isEditing) {
        response = await contactApi.updateContact(id, contactData);
      } else {
        response = await contactApi.createContact(contactData);
        
        // Create property alert based on preferences for new contacts
        if (response && response.contact?.id) {
          await createPropertyAlertFromPreferences(response.contact.id, contactData);
        }
      }

      setSnackbar({
        open: true,
        message: `Contact ${isEditing ? 'updated' : 'created'} successfully${!isEditing && createPropertyAlert ? ' (Property alert created)' : ''}`,
        severity: 'success'
      });

      // Call the onUpdate callback if provided
      if (location.state?.onUpdate) {
        location.state.onUpdate();
      }

      // Navigate back to contacts list after a short delay
      setTimeout(() => {
        navigate('/contacts');
      }, 1500);

    } catch (err) {
      console.error('Error saving contact:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} contact`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/contacts');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Contacts
        </Button>
        
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEditing ? 'Edit Contact' : 'Add New Contact'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={1.5}>
            {/* Contact Type */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Person sx={{ mr: 0.5, fontSize: 20 }} />
                Contact Type
              </Typography>
              
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={formData.type}
                  onChange={handleInputChange('type')}
                >
                  <FormControlLabel value="individual" control={<Radio />} label="Individual" />
                  <FormControlLabel value="company" control={<Radio />} label="Company" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                Basic Information
              </Typography>
            </Grid>

            {/* Avatar Upload */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Contact Avatar
              </Typography>

              {/* Current Avatar Display */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={formData.avatar ? (formData.avatar.startsWith('blob:') ? formData.avatar : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${formData.avatar}`) : undefined}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  <PhotoCamera />
                </Avatar>
                {formData.avatar && (
                  <IconButton
                    color="error"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              {/* Upload Area */}
              <Box
                {...getAvatarRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isAvatarDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isAvatarDragActive ? 'primary.50' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                <input {...getAvatarInputProps()} />
                {uploadingAvatar ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {isAvatarDragActive ? 'Drop avatar here...' : 'Click or drag to upload avatar'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Max size: 10MB • JPG, PNG, GIF
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>

            {formData.type === 'individual' ? (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.companyName}
                    onChange={handleInputChange('companyName')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.companyName}
                    onChange={handleInputChange('companyName')}
                    error={!!formErrors.companyName}
                    helperText={formErrors.companyName}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={handleInputChange('website')}
                    error={!!formErrors.website}
                    helperText={formErrors.website}
                    placeholder="https://company.com"
                  />
                </Grid>
              </>
            )}

            {/* Contact Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Email sx={{ mr: 0.5, fontSize: 20 }} />
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Email"
                type="email"
                value={formData.primaryEmail}
                onChange={handleInputChange('primaryEmail')}
                error={!!formErrors.primaryEmail}
                helperText={formErrors.primaryEmail}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secondary Email"
                type="email"
                value={formData.secondaryEmail}
                onChange={handleInputChange('secondaryEmail')}
                error={!!formErrors.secondaryEmail}
                helperText={formErrors.secondaryEmail}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Phone"
                value={formData.primaryPhone}
                onChange={handleInputChange('primaryPhone')}
                error={!!formErrors.primaryPhone}
                helperText={formErrors.primaryPhone}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile Phone"
                value={formData.mobilePhone}
                onChange={handleInputChange('mobilePhone')}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <LocationOn sx={{ mr: 0.5, fontSize: 20 }} />
                Mailing Address
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.mailingAddress}
                onChange={handleInputChange('mailingAddress')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.mailingCity}
                onChange={handleInputChange('mailingCity')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.mailingState}
                onChange={handleInputChange('mailingState')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.mailingZipCode}
                onChange={handleInputChange('mailingZipCode')}
              />
            </Grid>

            {/* Business Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Business sx={{ mr: 0.5, fontSize: 20 }} />
                Business Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required error={!!formErrors.contactRole}>
                <InputLabel>Contact Role</InputLabel>
                <Select
                  value={formData.contactRole}
                  label="Contact Role"
                  onChange={handleInputChange('contactRole')}
                >
                  {contactRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.contactRole && (
                  <FormHelperText>{formErrors.contactRole}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Lead Status</InputLabel>
                <Select
                  value={formData.leadStatus}
                  label="Lead Status"
                  onChange={handleInputChange('leadStatus')}
                >
                  {leadStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Investment Criteria (for investors) */}
            {(formData.contactRole === 'investor' || formData.contactRole === 'buyer') && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <AttachMoney sx={{ mr: 0.5, fontSize: 20 }} />
                    Investment Criteria
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Minimum Budget"
                    type="number"
                    value={formData.budgetMin}
                    onChange={handleInputChange('budgetMin')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maximum Budget"
                    type="number"
                    value={formData.budgetMax}
                    onChange={handleInputChange('budgetMax')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Investment Timeframe</InputLabel>
                    <Select
                      value={formData.timeframe}
                      label="Investment Timeframe"
                      onChange={handleInputChange('timeframe')}
                    >
                      {timeframes.map((timeframe) => (
                        <MenuItem key={timeframe} value={timeframe}>
                          {timeframe.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Credit Rating</InputLabel>
                    <Select
                      value={formData.creditRating}
                      label="Credit Rating"
                      onChange={handleInputChange('creditRating')}
                    >
                      {creditRatings.map((rating) => (
                        <MenuItem key={rating} value={rating}>
                          {rating}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Net Worth"
                    type="number"
                    value={formData.netWorth}
                    onChange={handleInputChange('netWorth')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Available Liquidity"
                    type="number"
                    value={formData.liquidity}
                    onChange={handleInputChange('liquidity')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>

                {/* Property Types of Interest */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                    Property Types of Interest
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Property Type</InputLabel>
                      <Select
                        value={propertyTypeInput}
                        label="Property Type"
                        onChange={(e) => setPropertyTypeInput(e.target.value)}
                      >
                        {propertyTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleArrayAdd('propertyTypeInterest', propertyTypeInput, setPropertyTypeInput)}
                      disabled={!propertyTypeInput || formData.propertyTypeInterest.includes(propertyTypeInput)}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.propertyTypeInterest.map((type, index) => (
                      <Chip
                        key={index}
                        label={type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        onDelete={() => handleArrayRemove('propertyTypeInterest', type)}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Preferred Locations */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                    Preferred Markets/Locations
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add location"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleArrayAdd('preferredLocations', locationInput, setLocationInput);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleArrayAdd('preferredLocations', locationInput, setLocationInput)}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.preferredLocations.map((location, index) => (
                      <Chip
                        key={index}
                        label={location}
                        onDelete={() => handleArrayRemove('preferredLocations', location)}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              </>
            )}

            {/* Additional Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                Additional Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="LinkedIn URL"
                value={formData.linkedInUrl}
                onChange={handleInputChange('linkedInUrl')}
                placeholder="https://linkedin.com/in/username"
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, fontWeight: 600 }}>
                Tags
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayAdd('tags', tagInput, setTagInput);
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleArrayAdd('tags', tagInput, setTagInput)}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleArrayRemove('tags', tag)}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            {/* Property Alert Creation Option */}
            {!isEditing && (formData.contactRole === 'investor' || formData.contactRole === 'buyer') && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createPropertyAlert}
                        onChange={(e) => setCreatePropertyAlert(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Create Property Alert
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Automatically create property alerts based on this contact's investment preferences
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleInputChange('notes')}
                helperText="Add any additional notes about this contact"
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBack}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (isEditing ? 'Update Contact' : 'Create Contact')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactForm;
