import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Avatar, Alert, CircularProgress,
  List, ListItem, ListItemText, Paper, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Snackbar,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, LocationOn, Home, Business, ArrowBack, 
  AttachMoney, Assessment, History,
  Description, FindInPage, NotificationsActive, TrendingUp,
  Add, Delete, Warning, AccountBalance, Receipt, Person, Info, Photo,
  Folder, PictureAsPdf
} from '@mui/icons-material';
import { propertyApi } from '../../services/propertyApi';
import { leaseApi } from '../../services/leaseApi';
import { debtApi } from '../../services/debtApi';
import { contactApi } from '../../services/contactApi';
import { companyApi } from '../../services/api';
import PropertyDetailGallery from '../../components/PropertyDetailGallery';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [leases, setLeases] = useState([]);
  const [debts, setDebts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [leasesLoading, setLeasesLoading] = useState(false);
  const [debtsLoading, setDebtsLoading] = useState(false);

  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [editingDebt, setEditingDebt] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [leaseForm, setLeaseForm] = useState({
    tenantId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    squareFeet: '',
    terms: '',
    options: '',
    status: 'pending'
  });

  const [debtForm, setDebtForm] = useState({
    lenderId: '',
    amount: '',
    interestRate: '',
    maturityDate: '',
    dscr: '',
    loanType: 'mortgage',
    notes: ''
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        
        // Check if this is a sample/hardcoded property (starts with 'sample-')
        if (id && id.startsWith('sample-')) {
          // Load from local storage cache
          const LOCAL_KEY = 'dev_properties_cache';
          try {
            const cachedProperties = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            const sampleProp = cachedProperties.find(p => String(p.id) === String(id));
            if (sampleProp) {
              setProperty(sampleProp);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.error('Error reading from cache:', cacheError);
          }
        }
        
        // Try API fetch
        try {
          const response = await propertyApi.getProperty(id);
          if (response && response.property) {
            setProperty(response.property);
          } else {
            setError('Property not found');
          }
        } catch (apiErr) {
          // If API fails and it's a sample property, try to load from cache again
          if (id && id.startsWith('sample-')) {
            const LOCAL_KEY = 'dev_properties_cache';
            try {
              const cachedProperties = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
              const sampleProp = cachedProperties.find(p => String(p.id) === String(id));
              if (sampleProp) {
                setProperty(sampleProp);
                return;
              }
            } catch (cacheError) {
              console.error('Error reading from cache:', cacheError);
            }
          }
          console.error('Error fetching property:', apiErr);
          setError(apiErr.response?.data?.error || 'Failed to load property details');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.error || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
    fetchLeases();
    fetchDebts();
    fetchContacts();
    fetchCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLeases = async () => {
    try {
      setLeasesLoading(true);
      const response = await leaseApi.getLeases({ propertyId: id });
      setLeases(response.leases || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
      setLeases([]);
    } finally {
      setLeasesLoading(false);
    }
  };

  const fetchDebts = async () => {
    try {
      setDebtsLoading(true);
      const response = await debtApi.getDebts({ propertyId: id });
      setDebts(response.debts || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      setDebts([]);
    } finally {
      setDebtsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactApi.getContacts({ limit: 1000 });
      setContacts(response.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAll({ limit: 1000 });
      setCompanies(response.data?.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const handleEdit = () => {
    navigate(`/properties/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/properties');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      under_contract: 'warning',
      sold: 'info',
      leased: 'secondary',
      off_market: 'default',
      for_sale: 'success',
      for_lease: 'success',
      coming_soon: 'info'
    };
    return colors[status] || 'default';
  };

  const getTransactionStatusColor = (status) => {
    const colors = {
      active: 'success',
      under_contract: 'warning',
      closed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to render a field row
  const renderField = (label, value, condition = true) => {
    if (!condition || !value) return null;
    return (
      <Grid item xs={12} sm={6} md={4}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
      </Grid>
    );
  };

  const getLeaseExpirationWarning = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const daysRemaining = Math.floor((end - now) / (1000 * 60 * 60 * 24));
    const monthsRemaining = daysRemaining / 30;

    if (daysRemaining < 0) {
      return { label: 'Expired', color: 'error', variant: 'filled', days: null };
    }
    if (monthsRemaining < 3) {
      return { label: `${daysRemaining} days`, color: 'error', days: daysRemaining };
    } else if (monthsRemaining < 6) {
      return { label: `${daysRemaining} days`, color: 'warning', days: daysRemaining };
    } else if (monthsRemaining < 12) {
      return { label: `${daysRemaining} days`, color: 'info', days: daysRemaining };
    }
    return null;
  };

  const getDebtMaturityWarning = (maturityDate) => {
    const now = new Date();
    const maturity = new Date(maturityDate);
    const daysRemaining = Math.floor((maturity - now) / (1000 * 60 * 60 * 24));
    const monthsRemaining = daysRemaining / 30;

    if (daysRemaining < 0) {
      return { label: 'Matured', color: 'error', variant: 'filled', days: null };
    }
    if (monthsRemaining < 6) {
      return { label: `${daysRemaining} days`, color: 'error', days: daysRemaining };
    } else if (monthsRemaining < 12) {
      return { label: `${daysRemaining} days`, color: 'warning', days: daysRemaining };
    }
    return null;
  };

  const validateLeaseForm = () => {
    const errors = [];
    
    if (!leaseForm.tenantId) {
      errors.push('Tenant is required');
    }
    
    if (!leaseForm.startDate) {
      errors.push('Start date is required');
    }
    
    if (!leaseForm.endDate) {
      errors.push('End date is required');
    }
    
    if (leaseForm.endDate && leaseForm.startDate) {
      const startDate = new Date(leaseForm.startDate);
      const endDate = new Date(leaseForm.endDate);
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }
    
    const monthlyRent = parseFloat(leaseForm.monthlyRent);
    if (!leaseForm.monthlyRent || !Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      errors.push('Monthly rent must be a valid positive number');
    }
    
    const squareFeet = parseFloat(leaseForm.squareFeet);
    if (leaseForm.squareFeet && (!Number.isFinite(squareFeet) || squareFeet <= 0)) {
      errors.push('Square feet must be a valid positive number');
    }
    
    return errors;
  };

  const validateDebtForm = () => {
    const errors = [];
    
    if (!debtForm.lenderId) {
      errors.push('Lender is required');
    }
    
    const amount = parseFloat(debtForm.amount);
    if (!debtForm.amount || !Number.isFinite(amount) || amount <= 0) {
      errors.push('Amount must be a valid positive number');
    }
    
    const interestRate = parseFloat(debtForm.interestRate);
    if (!debtForm.interestRate || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) {
      errors.push('Interest rate must be a valid number between 0 and 100');
    }
    
    if (!debtForm.maturityDate) {
      errors.push('Maturity date is required');
    }
    
    if (!debtForm.loanType) {
      errors.push('Loan type is required');
    }
    
    const dscr = parseFloat(debtForm.dscr);
    if (debtForm.dscr && (!Number.isFinite(dscr) || dscr <= 0)) {
      errors.push('DSCR must be a valid positive number');
    }
    
    return errors;
  };

  const handleOpenLeaseDialog = (lease = null) => {
    if (lease) {
      setEditingLease(lease);
      setLeaseForm({
        tenantId: lease.tenantId,
        startDate: lease.startDate?.split('T')[0] || '',
        endDate: lease.endDate?.split('T')[0] || '',
        monthlyRent: lease.monthlyRent,
        squareFeet: lease.squareFeet || '',
        terms: lease.terms || '',
        options: lease.options || '',
        status: lease.status
      });
    } else {
      setEditingLease(null);
      setLeaseForm({
        tenantId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        squareFeet: '',
        terms: '',
        options: '',
        status: 'pending'
      });
    }
    setLeaseDialogOpen(true);
  };

  const handleCloseLeaseDialog = () => {
    setLeaseDialogOpen(false);
    setEditingLease(null);
  };

  const handleSaveLease = async () => {
    const validationErrors = validateLeaseForm();
    if (validationErrors.length > 0) {
      setSnackbar({ 
        open: true, 
        message: validationErrors.join('. '), 
        severity: 'error' 
      });
      return;
    }

    try {
      const leaseData = {
        ...leaseForm,
        propertyId: id,
        monthlyRent: parseFloat(leaseForm.monthlyRent),
        squareFeet: leaseForm.squareFeet ? parseInt(leaseForm.squareFeet) : null
      };

      if (editingLease) {
        await leaseApi.updateLease(editingLease.id, leaseData);
        setSnackbar({ open: true, message: 'Lease updated successfully', severity: 'success' });
      } else {
        await leaseApi.createLease(leaseData);
        setSnackbar({ open: true, message: 'Lease created successfully', severity: 'success' });
      }

      handleCloseLeaseDialog();
      fetchLeases();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error saving lease', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteLease = async (leaseId) => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;

    try {
      await leaseApi.deleteLease(leaseId);
      setSnackbar({ open: true, message: 'Lease deleted successfully', severity: 'success' });
      fetchLeases();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error deleting lease', 
        severity: 'error' 
      });
    }
  };

  const handleOpenDebtDialog = (debt = null) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm({
        lenderId: debt.lenderId,
        amount: debt.amount,
        interestRate: debt.interestRate,
        maturityDate: debt.maturityDate?.split('T')[0] || '',
        dscr: debt.dscr || '',
        loanType: debt.loanType,
        notes: debt.notes || ''
      });
    } else {
      setEditingDebt(null);
      setDebtForm({
        lenderId: '',
        amount: '',
        interestRate: '',
        maturityDate: '',
        dscr: '',
        loanType: 'mortgage',
        notes: ''
      });
    }
    setDebtDialogOpen(true);
  };

  const handleCloseDebtDialog = () => {
    setDebtDialogOpen(false);
    setEditingDebt(null);
  };

  const handleSaveDebt = async () => {
    const validationErrors = validateDebtForm();
    if (validationErrors.length > 0) {
      setSnackbar({ 
        open: true, 
        message: validationErrors.join('. '), 
        severity: 'error' 
      });
      return;
    }

    try {
      const debtData = {
        ...debtForm,
        propertyId: id,
        amount: parseFloat(debtForm.amount),
        interestRate: parseFloat(debtForm.interestRate),
        dscr: debtForm.dscr ? parseFloat(debtForm.dscr) : null
      };

      if (editingDebt) {
        await debtApi.updateDebt(editingDebt.id, debtData);
        setSnackbar({ open: true, message: 'Debt updated successfully', severity: 'success' });
      } else {
        await debtApi.createDebt(debtData);
        setSnackbar({ open: true, message: 'Debt created successfully', severity: 'success' });
      }

      handleCloseDebtDialog();
      fetchDebts();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error saving debt', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (!window.confirm('Are you sure you want to delete this debt record?')) return;

    try {
      await debtApi.deleteDebt(debtId);
      setSnackbar({ open: true, message: 'Debt deleted successfully', severity: 'success' });
      fetchDebts();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error deleting debt', 
        severity: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !property) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Properties
        </Button>
        <Alert severity="error">
          {error || 'Property not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Properties
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {property.name || property.address}
              </Typography>
              
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {property.address}, {property.city}, {property.state} {property.zipCode}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {property.propertyStatus && (
                  <Chip
                    label={property.propertyStatus === 'active' ? 'Active' : 
                           property.propertyStatus === 'under_loi' ? 'Under LOI' :
                           property.propertyStatus === 'off_market' ? 'Off Market' :
                           property.propertyStatus === 'sold_leased' ? 'Sold / Leased' : property.propertyStatus}
                    color={property.propertyStatus === 'active' ? 'success' : 
                           property.propertyStatus === 'under_loi' ? 'warning' :
                           property.propertyStatus === 'off_market' ? 'default' : 'info'}
                    variant="filled"
                  />
                )}
                {property.propertyType && (
                  <Chip
                    label={property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                    variant="outlined"
                  />
                )}
                {property.listingType && (
                  <Chip
                    label={property.listingType === 'sale' ? 'For Sale' : 'For Lease'}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Property Content - All Sections */}
      <Grid container spacing={3}>
          {/* Main Information */}
          <Grid item xs={12} md={8}>
            {/* Section 1: Basic Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <Info sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  {renderField('Property Name', property.name)}
                  {renderField('Address', property.address)}
                  {renderField('City', property.city)}
                  {renderField('State', property.state)}
                  {renderField('ZIP Code', property.zipCode)}
                  {renderField('County', property.county)}
                  {renderField('Property Type', property.propertyType ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : null)}
                  {renderField('Property Status', property.propertyStatus ? 
                    (property.propertyStatus === 'active' ? 'Active' : 
                     property.propertyStatus === 'under_loi' ? 'Under LOI' :
                     property.propertyStatus === 'off_market' ? 'Off Market' :
                     property.propertyStatus === 'sold_leased' ? 'Sold / Leased' : property.propertyStatus) : null)}
                  {renderField('Listing Type', property.listingType ? (property.listingType === 'sale' ? 'For Sale' : 'For Lease') : null)}
                  {renderField('Internal Property ID', property.internalPropertyId)}
                  {renderField('MLS Number', property.mlsNumber)}
                  {renderField('Listing Date', property.listingDate ? formatDate(property.listingDate) : null)}
                  {renderField('Expiration Date', property.expirationDate ? formatDate(property.expirationDate) : null)}
                </Grid>
              </CardContent>
            </Card>

            {/* Section 2: Photos */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <Photo sx={{ mr: 1 }} />
                  Photos
                </Typography>
                {property.images && property.images.length > 0 ? (
                  <PropertyDetailGallery
                    images={property.images}
                    maxImages={6}
                    showFullGalleryButton={true}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No photos uploaded
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Section 3: Financials */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  Financial Details
                </Typography>
                
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">List Price</Typography>
                    <Typography variant="h6">
                      {property.listPrice ? formatCurrency(property.listPrice) : '—'}
                    </Typography>
                  </Grid>
                  
                  {property.leaseRate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Lease Rate</Typography>
                      <Typography variant="h6">
                        {formatCurrency(property.leaseRate)}
                        {property.leaseRateUnit && ` (${property.leaseRateUnit.replace(/_/g, ' ')})`}
                      </Typography>
                    </Grid>
                  )}
                  
                  {property.pricePerSquareFoot && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Price per Sq Ft</Typography>
                      <Typography variant="h6">
                        ${typeof property.pricePerSquareFoot === 'number' 
                          ? property.pricePerSquareFoot.toFixed(2) 
                          : parseFloat(property.pricePerSquareFoot).toFixed(2)}
                      </Typography>
                    </Grid>
                  )}
                  
                  {property.capRate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Cap Rate</Typography>
                      <Typography variant="h6">{(property.capRate * 100).toFixed(2)}%</Typography>
                    </Grid>
                  )}
                  
                  {property.netOperatingIncome && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Net Operating Income</Typography>
                      <Typography variant="h6">{formatCurrency(property.netOperatingIncome)}</Typography>
                    </Grid>
                  )}
                  
                  {property.grossIncome && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Gross Income</Typography>
                      <Typography variant="h6">{formatCurrency(property.grossIncome)}</Typography>
                    </Grid>
                  )}
                  
                  {property.operatingExpenses && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Operating Expenses</Typography>
                      <Typography variant="h6">{formatCurrency(property.operatingExpenses)}</Typography>
                    </Grid>
                  )}
                  
                  {property.taxes && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Property Taxes</Typography>
                      <Typography variant="h6">{formatCurrency(property.taxes)}</Typography>
                    </Grid>
                  )}
                  
                  {property.propertyTaxes && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Annual Property Taxes</Typography>
                      <Typography variant="h6">{formatCurrency(property.propertyTaxes)}</Typography>
                    </Grid>
                  )}
                  
                  {property.hoaFees && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">HOA Fees</Typography>
                      <Typography variant="h6">{formatCurrency(property.hoaFees)}</Typography>
                    </Grid>
                  )}
                  
                  {property.leaseTermsDescription && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Lease Terms</Typography>
                      <Typography variant="body1">{property.leaseTermsDescription}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Physical Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Home sx={{ mr: 1 }} />
                  Physical Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="body2" color="text.secondary">Total Square Footage</Typography>
                    <Typography variant="body1">
                      {property.totalSquareFootage ? property.totalSquareFootage.toLocaleString() + ' sq ft' : '—'}
                    </Typography>
                  </Grid>
                  
                  {property.availableSquareFootage && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Available Sq Ft</Typography>
                      <Typography variant="body1">{property.availableSquareFootage.toLocaleString()} sq ft</Typography>
                    </Grid>
                  )}
                  
                  {property.buildingClass && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Building Class</Typography>
                      <Typography variant="body1">Class {property.buildingClass}</Typography>
                    </Grid>
                  )}
                  
                  {property.yearBuilt && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Year Built</Typography>
                      <Typography variant="body1">{property.yearBuilt}</Typography>
                    </Grid>
                  )}
                  
                  {property.renovationYear && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Renovation Year</Typography>
                      <Typography variant="body1">{property.renovationYear}</Typography>
                    </Grid>
                  )}
                  
                  {property.floors && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Floors</Typography>
                      <Typography variant="body1">{property.floors}</Typography>
                    </Grid>
                  )}
                  
                  {property.units && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Units</Typography>
                      <Typography variant="body1">{property.units}</Typography>
                    </Grid>
                  )}
                  
                  {property.numberOfUnits && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Number of Units</Typography>
                      <Typography variant="body1">{property.numberOfUnits}</Typography>
                    </Grid>
                  )}
                  
                  {property.parkingSpaces && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Parking Spaces</Typography>
                      <Typography variant="body1">{property.parkingSpaces}</Typography>
                    </Grid>
                  )}
                  
                  {property.parkingRatio && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Parking Ratio</Typography>
                      <Typography variant="body1">{property.parkingRatio} per 1,000 sq ft</Typography>
                    </Grid>
                  )}
                  
                  {property.lotSize && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Lot Size</Typography>
                      <Typography variant="body1">
                        {property.lotSize} {property.lotSizeUnit || 'sqft'}
                      </Typography>
                    </Grid>
                  )}
                  
                  {property.ceilingHeight && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Ceiling Height</Typography>
                      <Typography variant="body1">{property.ceilingHeight} ft</Typography>
                    </Grid>
                  )}
                  
                  {property.clearHeight && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Clear Height</Typography>
                      <Typography variant="body1">{property.clearHeight} ft</Typography>
                    </Grid>
                  )}
                  
                  {property.loadingDocks > 0 && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Loading Docks</Typography>
                      <Typography variant="body1">{property.loadingDocks}</Typography>
                    </Grid>
                  )}
                  
                  {property.driveInDoors > 0 && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Drive-In Doors</Typography>
                      <Typography variant="body1">{property.driveInDoors}</Typography>
                    </Grid>
                  )}
                  
                  {property.occupancyPercentage !== null && property.occupancyPercentage !== undefined && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Occupancy</Typography>
                      <Typography variant="body1">{property.occupancyPercentage}%</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Contacts */}
            {(property.ownerName || property.ownerEmail || property.ownerPhone || property.listingAgent || property.brokerage || property.coBrokerSplit) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1 }} />
                    Contact Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.ownerName && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Owner Name</Typography>
                        <Typography variant="body1">{property.ownerName}</Typography>
                      </Grid>
                    )}
                    
                    {property.ownerEmail && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Owner Email</Typography>
                        <Typography variant="body1">{property.ownerEmail}</Typography>
                      </Grid>
                    )}
                    
                    {property.ownerPhone && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Owner Phone</Typography>
                        <Typography variant="body1">{property.ownerPhone}</Typography>
                      </Grid>
                    )}
                    
                    {property.listingAgent && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Listing Agent</Typography>
                        <Typography variant="body1">{property.listingAgent}</Typography>
                      </Grid>
                    )}
                    
                    {property.brokerage && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Brokerage</Typography>
                        <Typography variant="body1">{property.brokerage}</Typography>
                      </Grid>
                    )}
                    
                    {property.coBrokerSplit !== null && property.coBrokerSplit !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Co-Broker Split</Typography>
                        <Typography variant="body1">{property.coBrokerSplit}%</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Lease Information */}
            {property.listingType !== 'sale' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Receipt sx={{ mr: 1 }} />
                    Lease Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.leaseType && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Lease Type</Typography>
                        <Typography variant="body1">{property.leaseType}</Typography>
                      </Grid>
                    )}
                    
                    {property.availabilityDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Availability Date</Typography>
                        <Typography variant="body1">
                          {new Date(property.availabilityDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                    
                    {property.leaseTerms && Object.keys(property.leaseTerms).length > 0 && (
                      <>
                        {property.leaseTerms.minTerm && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Min Lease Term</Typography>
                            <Typography variant="body1">{property.leaseTerms.minTerm} months</Typography>
                          </Grid>
                        )}
                        
                        {property.leaseTerms.maxTerm && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Max Lease Term</Typography>
                            <Typography variant="body1">{property.leaseTerms.maxTerm} months</Typography>
                          </Grid>
                        )}
                        
                        {property.leaseTerms.renewalOptions && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Renewal Options</Typography>
                            <Typography variant="body1">{property.leaseTerms.renewalOptions}</Typography>
                          </Grid>
                        )}
                        
                        {property.leaseTerms.securityDeposit && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Security Deposit</Typography>
                            <Typography variant="body1">{property.leaseTerms.securityDeposit}</Typography>
                          </Grid>
                        )}
                        
                        {property.leaseTerms.personalGuaranteeRequired !== null && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Personal Guarantee</Typography>
                            <Typography variant="body1">
                              {property.leaseTerms.personalGuaranteeRequired ? 'Required' : 'Not Required'}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Section 5: Marketing */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <Business sx={{ mr: 1 }} />
                  Marketing
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {renderField('Marketing Status', property.marketingStatus ? property.marketingStatus.charAt(0).toUpperCase() + property.marketingStatus.slice(1) : null)}
                  {renderField('Listing Agent', property.listingAgent ? (typeof property.listingAgent === 'string' ? property.listingAgent : `${property.listingAgent.firstName || ''} ${property.listingAgent.lastName || ''}`.trim()) : null)}
                  {renderField('Brokerage', property.brokerage)}
                  {renderField('Co-Broker Split', property.coBrokerSplit ? `${property.coBrokerSplit}%` : null)}
                </Grid>

                {property.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {property.description}
                    </Typography>
                  </Box>
                )}

                {property.marketingRemarks && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Marketing Remarks
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {property.marketingRemarks}
                    </Typography>
                  </Box>
                )}

                {property.highlights && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Highlights
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {property.highlights}
                    </Typography>
                  </Box>
                )}

                {property.keyHighlights && property.keyHighlights.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Key Highlights
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {property.keyHighlights.map((highlight, index) => (
                        <Chip key={index} label={highlight} variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {property.keyFeatures && property.keyFeatures.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Key Features
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {property.keyFeatures.map((feature, index) => (
                        <Chip key={index} label={feature} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {property.amenities && property.amenities.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Amenities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {property.amenities.map((amenity, index) => (
                        <Chip key={index} label={amenity} variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Location Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1 }} />
                  Location Details
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {property.address}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {property.city}, {property.state} {property.zipCode}
                </Typography>
                
                {property.county && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>County:</strong> {property.county}
                  </Typography>
                )}
                
                {property.zoning && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Zoning:</strong> {property.zoning}
                  </Typography>
                )}
                
                {property.latitude && property.longitude && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Coordinates:</strong> {property.latitude}, {property.longitude}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Listing Agent */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Business sx={{ mr: 1 }} />
                  Listing Agent
                </Typography>
                
                {property.listingAgent ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2 }}>
                      {property.listingAgent.firstName?.[0] || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {property.listingAgent.firstName} {property.listingAgent.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {property.listingAgent.email}
                      </Typography>
                      {property.listingAgent.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {property.listingAgent.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No listing agent assigned
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Owner Information */}
            {property.owner && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Owner Information
                  </Typography>
                  
                  <Typography variant="subtitle2">
                    {property.owner.firstName} {property.owner.lastName}
                  </Typography>
                  {property.owner.companyName && (
                    <Typography variant="body2" color="text.secondary">
                      {property.owner.companyName}
                    </Typography>
                  )}
                  {property.owner.primaryEmail && (
                    <Typography variant="body2" color="text.secondary">
                      {property.owner.primaryEmail}
                    </Typography>
                  )}
                  {property.owner.primaryPhone && (
                    <Typography variant="body2" color="text.secondary">
                      {property.owner.primaryPhone}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Marketing Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ mr: 1 }} />
                  Marketing Info
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Marketing Status" 
                      secondary={
                        <Chip 
                          label={property.marketingStatus?.replace('_', ' ') || '—'} 
                          size="small"
                          color={property.marketingStatus === 'published' ? 'success' : 'default'}
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Days on Market" 
                      secondary={property.daysOnMarket ?? '—'} 
                    />
                  </ListItem>
                  
                  {property.views !== null && property.views !== undefined && (
                    <ListItem>
                      <ListItemText 
                        primary="Views" 
                        secondary={property.views} 
                      />
                    </ListItem>
                  )}
                  
                  {property.inquiries !== null && property.inquiries !== undefined && (
                    <ListItem>
                      <ListItemText 
                        primary="Inquiries" 
                        secondary={property.inquiries} 
                      />
                    </ListItem>
                  )}
                  
                  {property.showings !== null && property.showings !== undefined && (
                    <ListItem>
                      <ListItemText 
                        primary="Showings" 
                        secondary={property.showings} 
                      />
                    </ListItem>
                  )}
                </List>
                
                {property.keyHighlights && property.keyHighlights.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Key Highlights
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {property.keyHighlights.map((highlight, index) => (
                        <Chip key={index} label={highlight} variant="filled" color="primary" size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Section 6: Transaction */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <AccountBalance sx={{ mr: 1 }} />
                  Transaction
                </Typography>
                  
                  <Grid container spacing={2}>
                    {property.transactionStatus && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Transaction Status</Typography>
                        <Chip 
                          label={property.transactionStatus?.replace('_', ' ') || '—'} 
                          color={getTransactionStatusColor(property.transactionStatus)}
                          variant="filled"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    )}
                    
                    {property.dateSoldLeased && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Date Sold/Leased</Typography>
                        <Typography variant="body1">{formatDate(property.dateSoldLeased)}</Typography>
                      </Grid>
                    )}
                    
                    {property.finalSalePrice && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Final Sale Price</Typography>
                        <Typography variant="h6" color="success.main">{formatCurrency(property.finalSalePrice)}</Typography>
                      </Grid>
                    )}
                    
                    {property.finalLeaseRate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Final Lease Rate</Typography>
                        <Typography variant="h6" color="success.main">{formatCurrency(property.finalLeaseRate)}</Typography>
                      </Grid>
                    )}
                    
                    {property.buyerTenantName && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Buyer/Tenant Name</Typography>
                        <Typography variant="body1">{property.buyerTenantName}</Typography>
                      </Grid>
                    )}
                    
                    {property.transactionNotes && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Transaction Notes
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {property.transactionNotes}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

            {/* Section 7: Documents */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  <Folder sx={{ mr: 1 }} />
                  Documents
                </Typography>
                
                <Grid container spacing={2}>
                  {property.documents && property.documents.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Uploaded Documents
                      </Typography>
                      <List>
                        {property.documents.map((doc, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={doc.name || doc.filename || `Document ${index + 1}`}
                              secondary={doc.url ? (
                                <Button
                                  size="small"
                                  href={doc.url}
                                  target="_blank"
                                  startIcon={<PictureAsPdf />}
                                >
                                  View Document
                                </Button>
                              ) : null}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}

                  {property.floorPlans && property.floorPlans.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Floor Plans
                      </Typography>
                      <PropertyDetailGallery
                        images={property.floorPlans}
                        maxImages={6}
                        showFullGalleryButton={true}
                      />
                    </Grid>
                  )}

                  {property.sitePlans && property.sitePlans.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Site Plans
                      </Typography>
                      <PropertyDetailGallery
                        images={property.sitePlans}
                        maxImages={6}
                        showFullGalleryButton={true}
                      />
                    </Grid>
                  )}

                  {(property.virtualTourUrl || property.offeringMemorandum || property.brochure) && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Additional Resources
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {property.virtualTourUrl && (
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            href={property.virtualTourUrl}
                            target="_blank"
                            startIcon={<Description />}
                          >
                            View Virtual Tour
                          </Button>
                        )}
                        
                        {property.offeringMemorandum && (
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            href={property.offeringMemorandum}
                            target="_blank"
                            startIcon={<PictureAsPdf />}
                          >
                            Download Offering Memorandum
                          </Button>
                        )}
                        
                        {property.brochure && (
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            href={property.brochure}
                            target="_blank"
                            startIcon={<PictureAsPdf />}
                          >
                            Download Brochure
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {(!property.documents || property.documents.length === 0) && 
                   (!property.floorPlans || property.floorPlans.length === 0) && 
                   (!property.sitePlans || property.sitePlans.length === 0) && 
                   !property.virtualTourUrl && 
                   !property.offeringMemorandum && 
                   !property.brochure && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        No documents uploaded
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      {/* Removed duplicate tab-based content - all property data is now in the main view above */}
      {false && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Receipt sx={{ mr: 1 }} />
                Leases
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenLeaseDialog()}
              >
                Add Lease
              </Button>
            </Box>

            {leasesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : leases.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No leases found for this property.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleOpenLeaseDialog()}
                  sx={{ mt: 2 }}
                >
                  Add First Lease
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tenant</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell align="right">Monthly Rent</TableCell>
                      <TableCell align="right">Square Feet</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Warning</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leases.map((lease) => {
                      const warning = getLeaseExpirationWarning(lease.endDate);
                      return (
                        <TableRow key={lease.id}>
                          <TableCell>
                            {lease.tenant ? 
                              `${lease.tenant.firstName} ${lease.tenant.lastName}` : 
                              'Unknown Tenant'}
                          </TableCell>
                          <TableCell>
                            {new Date(lease.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(lease.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(lease.monthlyRent)}
                          </TableCell>
                          <TableCell align="right">
                            {lease.squareFeet ? lease.squareFeet.toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={lease.status} 
                              size="small"
                              color={lease.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {warning && (
                              <Chip
                                icon={warning.days !== null ? <Warning /> : undefined}
                                label={warning.label}
                                size="small"
                                color={warning.color}
                                variant={warning.variant || 'outlined'}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenLeaseDialog(lease)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteLease(lease.id)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Removed tab-based content - all property data is now in the main view above */}
      {false && activeTab === 5 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1 }} />
                Debt
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDebtDialog()}
              >
                Add Debt
              </Button>
            </Box>

            {debtsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : debts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No debt records found for this property.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleOpenDebtDialog()}
                  sx={{ mt: 2 }}
                >
                  Add First Debt Record
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lender</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Interest Rate</TableCell>
                      <TableCell>Maturity Date</TableCell>
                      <TableCell align="right">DSCR</TableCell>
                      <TableCell>Loan Type</TableCell>
                      <TableCell>Warning</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debts.map((debt) => {
                      const warning = getDebtMaturityWarning(debt.maturityDate);
                      return (
                        <TableRow key={debt.id}>
                          <TableCell>
                            {debt.lender?.name || 'Unknown Lender'}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(debt.amount)}
                          </TableCell>
                          <TableCell align="right">
                            {debt.interestRate}%
                          </TableCell>
                          <TableCell>
                            {new Date(debt.maturityDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            {debt.dscr || '—'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={debt.loanType} 
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {warning && (
                              <Chip
                                icon={warning.days !== null ? <Warning /> : undefined}
                                label={warning.label}
                                size="small"
                                color={warning.color}
                                variant={warning.variant || 'outlined'}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDebtDialog(debt)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteDebt(debt.id)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={leaseDialogOpen} onClose={handleCloseLeaseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLease ? 'Edit Lease' : 'Add New Lease'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Tenant</InputLabel>
                <Select
                  value={leaseForm.tenantId}
                  onChange={(e) => setLeaseForm({ ...leaseForm, tenantId: e.target.value })}
                  label="Tenant"
                >
                  {contacts.map((contact) => (
                    <MenuItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.companyName && ` (${contact.companyName})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Start Date"
                type="date"
                value={leaseForm.startDate}
                onChange={(e) => setLeaseForm({ ...leaseForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="End Date"
                type="date"
                value={leaseForm.endDate}
                onChange={(e) => setLeaseForm({ ...leaseForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Monthly Rent"
                type="number"
                value={leaseForm.monthlyRent}
                onChange={(e) => setLeaseForm({ ...leaseForm, monthlyRent: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Square Feet"
                type="number"
                value={leaseForm.squareFeet}
                onChange={(e) => setLeaseForm({ ...leaseForm, squareFeet: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={leaseForm.status}
                  onChange={(e) => setLeaseForm({ ...leaseForm, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="terminated">Terminated</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Terms"
                value={leaseForm.terms}
                onChange={(e) => setLeaseForm({ ...leaseForm, terms: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Options"
                value={leaseForm.options}
                onChange={(e) => setLeaseForm({ ...leaseForm, options: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLeaseDialog}>Cancel</Button>
          <Button onClick={handleSaveLease} variant="contained" color="primary">
            {editingLease ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={debtDialogOpen} onClose={handleCloseDebtDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDebt ? 'Edit Debt' : 'Add New Debt'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Lender</InputLabel>
                <Select
                  value={debtForm.lenderId}
                  onChange={(e) => setDebtForm({ ...debtForm, lenderId: e.target.value })}
                  label="Lender"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Amount"
                type="number"
                value={debtForm.amount}
                onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Interest Rate"
                type="number"
                value={debtForm.interestRate}
                onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Maturity Date"
                type="date"
                value={debtForm.maturityDate}
                onChange={(e) => setDebtForm({ ...debtForm, maturityDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="DSCR"
                type="number"
                value={debtForm.dscr}
                onChange={(e) => setDebtForm({ ...debtForm, dscr: e.target.value })}
                helperText="Debt Service Coverage Ratio"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Loan Type</InputLabel>
                <Select
                  value={debtForm.loanType}
                  onChange={(e) => setDebtForm({ ...debtForm, loanType: e.target.value })}
                  label="Loan Type"
                >
                  <MenuItem value="mortgage">Mortgage</MenuItem>
                  <MenuItem value="bridge">Bridge</MenuItem>
                  <MenuItem value="mezzanine">Mezzanine</MenuItem>
                  <MenuItem value="construction">Construction</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={debtForm.notes}
                onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDebtDialog}>Cancel</Button>
          <Button onClick={handleSaveDebt} variant="contained" color="primary">
            {editingDebt ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default PropertyDetail;