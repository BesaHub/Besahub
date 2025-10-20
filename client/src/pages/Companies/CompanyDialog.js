import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  useTheme,
  Typography,
  Divider,
  Chip,
  Box,
  OutlinedInput,
} from '@mui/material';
import {
  Save,
  Close,
  Business,
  Email,
  Phone,
  Language,
  LocationOn,
  AttachMoney,
  People,
  Assessment,
  TrendingUp,
  CloudUpload,
  Delete,
  Image as ImageIcon,
} from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import { companyApi } from '../../services/api';

const COMPANY_TYPES = [
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'trust', label: 'Trust' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const INDUSTRIES = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'commercial_real_estate', label: 'Commercial Real Estate' },
  { value: 'real_estate_investment', label: 'Real Estate Investment' },
  { value: 'real_estate_development', label: 'Real Estate Development' },
  { value: 'property_management', label: 'Property Management' },
  { value: 'retail', label: 'Retail' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
];

const LEAD_STATUSES = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'customer', label: 'Customer' },
  { value: 'inactive', label: 'Inactive' },
];

const PROPERTY_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'land', label: 'Land' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'medical', label: 'Medical' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CompanyDialog = ({ open, mode, company, onClose, onSuccess }) => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    companyType: '',
    industry: '',
    primaryEmail: '',
    primaryPhone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    annualRevenue: '',
    employeeCount: '',
    portfolioValue: '',
    propertyTypes: [],
    leadStatus: 'cold',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && company) {
        setFormData({
          name: company.name || '',
          legalName: company.legalName || '',
          companyType: company.companyType || '',
          industry: company.industry || '',
          primaryEmail: company.primaryEmail || '',
          primaryPhone: company.primaryPhone || '',
          website: company.website || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          zipCode: company.zipCode || '',
          annualRevenue: company.annualRevenue?.toString() || '',
          employeeCount: company.employeeCount?.toString() || '',
          portfolioValue: company.portfolioValue?.toString() || '',
          propertyTypes: company.propertyTypes || [],
          leadStatus: company.leadStatus || 'cold',
        });
        setLogoPreview(company.logo || null);
      } else {
        setFormData({
          name: '',
          legalName: '',
          companyType: '',
          industry: '',
          primaryEmail: '',
          primaryPhone: '',
          website: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          annualRevenue: '',
          employeeCount: '',
          portfolioValue: '',
          propertyTypes: [],
          leadStatus: 'cold',
        });
        setLogoPreview(null);
      }
      setErrors({});
      setApiError('');
      setLogoFile(null);
    }
  }, [open, mode, company]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setApiError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Logo file size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setApiError('');
  };

  const handleRemoveLogo = async () => {
    if (mode === 'edit' && company?.id && !logoFile) {
      try {
        setUploadingLogo(true);
        await companyApi.removeLogo(company.id);
        setLogoPreview(null);
        setLogoFile(null);
        setApiError('');
      } catch (err) {
        console.error('Error removing logo:', err);
        setApiError('Failed to remove logo');
      } finally {
        setUploadingLogo(false);
      }
    } else {
      setLogoPreview(null);
      setLogoFile(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Company name must be 200 characters or less';
    }

    if (formData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Invalid email format';
    }

    if (formData.primaryPhone && !/^[\d\s\-+().]+$/.test(formData.primaryPhone)) {
      newErrors.primaryPhone = 'Invalid phone format';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format (12345 or 12345-6789)';
    }

    if (formData.annualRevenue && (isNaN(formData.annualRevenue) || parseFloat(formData.annualRevenue) < 0)) {
      newErrors.annualRevenue = 'Annual revenue must be a positive number';
    }

    if (formData.employeeCount && (isNaN(formData.employeeCount) || parseInt(formData.employeeCount) < 0)) {
      newErrors.employeeCount = 'Employee count must be a positive number';
    }

    if (formData.portfolioValue && (isNaN(formData.portfolioValue) || parseFloat(formData.portfolioValue) < 0)) {
      newErrors.portfolioValue = 'Portfolio value must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setApiError('');

      const submitData = {
        name: formData.name.trim(),
        legalName: formData.legalName.trim() || null,
        companyType: formData.companyType || null,
        industry: formData.industry || null,
        primaryEmail: formData.primaryEmail.trim() || null,
        primaryPhone: formData.primaryPhone.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        zipCode: formData.zipCode.trim() || null,
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : null,
        portfolioValue: formData.portfolioValue ? parseFloat(formData.portfolioValue) : null,
        propertyTypes: formData.propertyTypes,
        leadStatus: formData.leadStatus,
      };

      let companyId;
      if (mode === 'create') {
        const response = await companyApi.create(submitData);
        companyId = response.data?.company?.id || response.company?.id || response.data?.id || response.id;
      } else {
        await companyApi.update(company.id, submitData);
        companyId = company.id;
      }

      if (logoFile && companyId) {
        try {
          setUploadingLogo(true);
          await companyApi.uploadLogo(companyId, logoFile);
          setSnackbar({
            open: true,
            message: 'Logo uploaded successfully',
            severity: 'success'
          });
        } catch (logoErr) {
          console.error('Error uploading logo:', logoErr);
          setSnackbar({
            open: true,
            message: logoErr.response?.data?.error || 'Failed to upload logo',
            severity: 'error'
          });
        } finally {
          setUploadingLogo(false);
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error('Error saving company:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          `Failed to ${mode === 'create' ? 'create' : 'update'} company`;
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[20],
        },
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <Business sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {mode === 'create' ? 'Add Company' : 'Edit Company'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name || `${formData.name.length}/200 characters`}
                required
                disabled={loading}
                inputProps={{ maxLength: 200 }}
                placeholder="Enter company name..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Legal Name"
                value={formData.legalName}
                onChange={(e) => handleInputChange('legalName', e.target.value)}
                disabled={loading}
                placeholder="Legal entity name..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.companyType}>
                <InputLabel>Company Type</InputLabel>
                <Select
                  value={formData.companyType}
                  label="Company Type"
                  onChange={(e) => handleInputChange('companyType', e.target.value)}
                  disabled={loading}
                >
                  {COMPANY_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.companyType && <FormHelperText>{errors.companyType}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.industry}>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry}
                  label="Industry"
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  disabled={loading}
                >
                  {INDUSTRIES.map((industry) => (
                    <MenuItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.industry && <FormHelperText>{errors.industry}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Logo Upload Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                <ImageIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                Company Logo
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {logoPreview && (
                  <Box
                    component="img"
                    src={logoPreview}
                    alt="Company logo preview"
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'contain',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      p: 1,
                      bgcolor: 'background.paper',
                    }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload-button"
                    type="file"
                    onChange={handleLogoSelect}
                    disabled={loading || uploadingLogo}
                  />
                  <label htmlFor="logo-upload-button">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      disabled={loading || uploadingLogo}
                      sx={{ borderRadius: 2, mr: 1 }}
                    >
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </label>
                  {logoPreview && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={uploadingLogo ? <CircularProgress size={16} /> : <Delete />}
                      onClick={handleRemoveLogo}
                      disabled={loading || uploadingLogo}
                      sx={{ borderRadius: 2 }}
                    >
                      Remove
                    </Button>
                  )}
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Contact Information Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                <Email sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Email"
                value={formData.primaryEmail}
                onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                error={!!errors.primaryEmail}
                helperText={errors.primaryEmail}
                disabled={loading}
                type="email"
                placeholder="company@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Phone"
                value={formData.primaryPhone}
                onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                error={!!errors.primaryPhone}
                helperText={errors.primaryPhone}
                disabled={loading}
                placeholder="(555) 123-4567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                error={!!errors.website}
                helperText={errors.website}
                disabled={loading}
                placeholder="https://www.example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Language fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Address Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                <LocationOn sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                Address
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
                disabled={loading}
                placeholder="123 Main Street"
              />
            </Grid>

            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={!!errors.city}
                helperText={errors.city}
                disabled={loading}
                placeholder="New York"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!errors.state}>
                <InputLabel>State</InputLabel>
                <Select
                  value={formData.state}
                  label="State"
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  disabled={loading}
                >
                  {US_STATES.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
                {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                error={!!errors.zipCode}
                helperText={errors.zipCode}
                disabled={loading}
                placeholder="12345"
              />
            </Grid>

            {/* Business Information Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                <Assessment sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                Business Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Annual Revenue"
                value={formData.annualRevenue}
                onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                error={!!errors.annualRevenue}
                helperText={errors.annualRevenue}
                disabled={loading}
                type="number"
                placeholder="0"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney fontSize="small" />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Employee Count"
                value={formData.employeeCount}
                onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                error={!!errors.employeeCount}
                helperText={errors.employeeCount}
                disabled={loading}
                type="number"
                placeholder="0"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <People fontSize="small" />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Portfolio Value"
                value={formData.portfolioValue}
                onChange={(e) => handleInputChange('portfolioValue', e.target.value)}
                error={!!errors.portfolioValue}
                helperText={errors.portfolioValue}
                disabled={loading}
                type="number"
                placeholder="0"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TrendingUp fontSize="small" />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            {/* CRE-Specific Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                CRE-Specific Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Property Types of Interest</InputLabel>
                <Select
                  multiple
                  value={formData.propertyTypes}
                  onChange={(e) => handleInputChange('propertyTypes', e.target.value)}
                  input={<OutlinedInput label="Property Types of Interest" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={PROPERTY_TYPES.find(pt => pt.value === value)?.label || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                  disabled={loading}
                >
                  {PROPERTY_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Status</InputLabel>
                <Select
                  value={formData.leadStatus}
                  label="Lead Status"
                  onChange={(e) => handleInputChange('leadStatus', e.target.value)}
                  disabled={loading}
                >
                  {LEAD_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            startIcon={<Close />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              minWidth: 120,
            }}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Company' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Dialog>
  );
};

export default CompanyDialog;
