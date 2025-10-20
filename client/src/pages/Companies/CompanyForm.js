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
  Snackbar,
  Card,
  CardMedia,
  IconButton,
  Avatar
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Business,
  Email,
  Phone,
  LocationOn,
  CloudUpload,
  Delete,
  AccountCircle
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { apiService } from '../../services/api';
import { compressImage, getCompressionOptions, validateImageFile, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    type: 'investor',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    description: '',
    industry: '',
    size: '',
    logo: null
  });

  const [formErrors, setFormErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const companyTypes = [
    'investor',
    'developer',
    'brokerage',
    'lender',
    'contractor',
    'property_management',
    'legal_services',
    'consulting',
    'other'
  ];

  const companySizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-1000',
    '1000+'
  ];

  const industries = [
    'Real Estate Investment',
    'Property Development',
    'Commercial Brokerage',
    'Property Management',
    'Construction',
    'Architecture',
    'Legal Services',
    'Financial Services',
    'Consulting',
    'Technology',
    'Other'
  ];

  useEffect(() => {
    if (isEditing) {
      fetchCompany();
    }
  }, [id, isEditing]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await apiService.companies.getById(id);

      if (response && response.data) {
        const company = response.data;
        setFormData({
          name: company.name || '',
          type: company.type || 'investor',
          email: company.email || '',
          phone: company.phone || '',
          website: company.website || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          zipCode: company.zipCode || '',
          country: company.country || 'US',
          description: company.description || '',
          industry: company.industry || '',
          size: company.size || '',
          logo: company.logo || null
        });

        // Set logo preview if exists
        if (company.logo) {
          setLogoPreview(`http://localhost:3001${company.logo}`);
        }
      }
    } catch (err) {
      setError('Failed to load company details');
      console.error('Error fetching company:', err);
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

  // Logo upload functions
  const handleLogoUpload = async (files) => {
    const file = files[0];
    if (!file) return;

    setUploadingLogo(true);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setSnackbar({
          open: true,
          message: validation.errors[0],
          severity: 'error'
        });
        return;
      }

      // Get compression options for logo
      const compressionOptions = getCompressionOptions('logo', file.type);

      // Compress image
      const originalSize = file.size;
      const compressedFile = await compressImage(file, compressionOptions);
      const compressedSize = compressedFile.size;

      // Show compression results
      if (originalSize > compressedSize) {
        const savingsPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        setSnackbar({
          open: true,
          message: `Logo compressed: ${savingsPercent}% size reduction (${((originalSize - compressedSize) / 1024 / 1024).toFixed(1)}MB saved)`,
          severity: 'info'
        });
      }

      // Store the file for upload
      setLogoFile(compressedFile);

      // Create preview
      const preview = createImagePreview(compressedFile);
      setLogoPreview(preview);

      // If editing existing company, upload immediately
      if (isEditing) {
        const response = await apiService.companies.uploadLogo(id, compressedFile);

        setFormData(prev => ({
          ...prev,
          logo: response.data.logo
        }));

        setSnackbar({
          open: true,
          message: 'Logo uploaded successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error processing logo:', error);
      setSnackbar({
        open: true,
        message: 'Failed to process or upload logo',
        severity: 'error'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      if (isEditing && formData.logo) {
        await apiService.companies.removeLogo(id);
        setFormData(prev => ({ ...prev, logo: null }));

        setSnackbar({
          open: true,
          message: 'Logo removed successfully',
          severity: 'success'
        });
      }

      // Clean up local state
      if (logoPreview && logoPreview.startsWith('blob:')) {
        revokeImagePreview(logoPreview);
      }
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove logo',
        severity: 'error'
      });
    }
  };

  const onDrop = (acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== acceptedFiles.length) {
      setSnackbar({
        open: true,
        message: 'Only image files are allowed',
        severity: 'warning'
      });
    }
    if (imageFiles.length > 0) {
      handleLogoUpload([imageFiles[0]]); // Only take the first file for logo
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }

    if (!formData.type) {
      errors.type = 'Company type is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

      let response;
      if (isEditing) {
        response = await apiService.companies.update(id, formData);
      } else {
        response = await apiService.companies.create(formData);

        // If we have a logo file and this is a new company, upload it
        if (logoFile && response.data && response.data.id) {
          await apiService.companies.uploadLogo(response.data.id, logoFile);
        }
      }

      setSnackbar({
        open: true,
        message: `Company ${isEditing ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });

      // Call the onUpdate callback if provided
      if (location.state?.onUpdate) {
        location.state.onUpdate();
      }

      // Navigate back to companies list after a short delay
      setTimeout(() => {
        navigate('/companies');
      }, 1500);

    } catch (err) {
      console.error('Error saving company:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} company`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/companies');
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
          Back to Companies
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEditing ? 'Edit Company' : 'Add New Company'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Company Logo Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <AccountCircle sx={{ mr: 0.5, fontSize: 20 }} />
                Company Logo
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                {/* Current Logo Display */}
                <Avatar
                  src={logoPreview}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'grey.200',
                    fontSize: '2rem'
                  }}
                >
                  <Business sx={{ fontSize: '3rem', color: 'grey.500' }} />
                </Avatar>

                {/* Logo Upload Area */}
                <Box sx={{ flex: 1 }}>
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragActive ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isDragActive ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    <CloudUpload sx={{ fontSize: 32, color: 'grey.500', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      {isDragActive ? 'Drop logo here' : 'Upload Company Logo'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drag & drop logo here, or click to select
                      <br />
                      Supports: JPG, PNG, GIF, WebP (max 10MB)
                      <br />
                      Logo will be automatically compressed and optimized
                    </Typography>
                    {uploadingLogo && (
                      <Box sx={{ mt: 2 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Processing logo...
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {logoPreview && (
                    <Button
                      startIcon={<Delete />}
                      onClick={handleRemoveLogo}
                      color="error"
                      sx={{ mt: 1 }}
                    >
                      Remove Logo
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Business sx={{ mr: 0.5, fontSize: 20 }} />
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required error={!!formErrors.type}>
                <InputLabel>Company Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Company Type"
                  onChange={handleInputChange('type')}
                >
                  {companyTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.type && (
                  <FormHelperText>{formErrors.type}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry}
                  label="Industry"
                  onChange={handleInputChange('industry')}
                >
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Company Size</InputLabel>
                <Select
                  value={formData.size}
                  label="Company Size"
                  onChange={handleInputChange('size')}
                >
                  {companySizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size} employees
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

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
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleInputChange('website')}
                placeholder="https://example.com"
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <LocationOn sx={{ mr: 0.5, fontSize: 20 }} />
                Address
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address}
                onChange={handleInputChange('address')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleInputChange('city')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleInputChange('state')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange('zipCode')}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                helperText="Describe the company's business, specialties, and other relevant details"
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
                  {saving ? 'Saving...' : (isEditing ? 'Update Company' : 'Create Company')}
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

export default CompanyForm;