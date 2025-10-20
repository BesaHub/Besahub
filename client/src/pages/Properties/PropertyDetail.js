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
  Add, Delete, Warning, AccountBalance, Receipt, Person, Info
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
        const response = await propertyApi.getProperty(id);
        if (response && response.property) {
          setProperty(response.property);
        } else {
          setError('Property not found');
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
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={property.status?.replace('_', ' ') || 'N/A'}
                  color={getStatusColor(property.status)}
                  variant="filled"
                />
                <Chip
                  label={property.propertyType}
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip
                  label={property.listingType === 'sale' ? 'For Sale' : 'For Lease'}
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FindInPage />}
                onClick={() => navigate(`/property-matching?propertyId=${property.id}`)}
              >
                Find Matches
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<NotificationsActive />}
                onClick={() => navigate('/property-alerts')}
              >
                Create Alert
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={() => navigate(`/market-analysis?location=${encodeURIComponent(property.city + ', ' + property.state)}&propertyType=${property.propertyType}`)}
              >
                Market Analysis
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Overview" />
          <Tab label="Details" />
          <Tab label="Documents" />
          <Tab label="Activity" />
          <Tab label="Leases" icon={<Receipt />} iconPosition="start" />
          <Tab label="Debt" icon={<AccountBalance />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Main Information */}
          <Grid item xs={12} md={8}>
            {/* Basic Info */}
            {(property.listingDate || property.expirationDate || property.internalPropertyId || property.mlsNumber || property.county) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1 }} />
                    Basic Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.internalPropertyId && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Internal Property ID</Typography>
                        <Typography variant="body1">{property.internalPropertyId}</Typography>
                      </Grid>
                    )}
                    
                    {property.mlsNumber && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">MLS#</Typography>
                        <Typography variant="body1">{property.mlsNumber}</Typography>
                      </Grid>
                    )}
                    
                    {property.county && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">County</Typography>
                        <Typography variant="body1">{property.county}</Typography>
                      </Grid>
                    )}
                    
                    {property.listingDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Listing Date</Typography>
                        <Typography variant="body1">{formatDate(property.listingDate)}</Typography>
                      </Grid>
                    )}
                    
                    {property.expirationDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Expiration Date</Typography>
                        <Typography variant="body1">{formatDate(property.expirationDate)}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Property Gallery */}
            {property.images && property.images.length > 0 ? (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <PropertyDetailGallery
                    images={property.images}
                    maxImages={6}
                    showFullGalleryButton={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      No images available
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Financial Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  Financial Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">List Price</Typography>
                    <Typography variant="h6">
                      {property.listPrice ? formatCurrency(property.listPrice) : 'N/A'}
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
                      {property.totalSquareFootage ? property.totalSquareFootage.toLocaleString() + ' sq ft' : 'N/A'}
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

            {/* Description */}
            {property.description && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ mr: 1 }} />
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Marketing Remarks */}
            {property.marketingRemarks && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Marketing Remarks
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.marketingRemarks}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {property.highlights && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Highlights
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.highlights}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Amenities
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {property.amenities.map((amenity, index) => (
                      <Chip key={index} label={amenity} variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Key Features */}
            {property.keyFeatures && property.keyFeatures.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Key Features
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {property.keyFeatures.map((feature, index) => (
                      <Chip key={index} label={feature} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
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
                          label={property.marketingStatus?.replace('_', ' ') || 'N/A'} 
                          size="small"
                          color={property.marketingStatus === 'published' ? 'success' : 'default'}
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Days on Market" 
                      secondary={property.daysOnMarket ?? 'N/A'} 
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

            {/* Transaction Info */}
            {(property.transactionStatus || property.dateSoldLeased || property.finalSalePrice || property.finalLeaseRate || property.buyerTenantName || property.transactionNotes) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 1 }} />
                    Transaction Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.transactionStatus && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Transaction Status</Typography>
                        <Chip 
                          label={property.transactionStatus?.replace('_', ' ') || 'N/A'} 
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
            )}

            {/* Floor Plans */}
            {property.floorPlans && property.floorPlans.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Floor Plans
                  </Typography>
                  <PropertyDetailGallery
                    images={property.floorPlans}
                    maxImages={6}
                    showFullGalleryButton={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* Site Plans */}
            {property.sitePlans && property.sitePlans.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Site Plans
                  </Typography>
                  <PropertyDetailGallery
                    images={property.sitePlans}
                    maxImages={6}
                    showFullGalleryButton={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* Additional Media */}
            {(property.virtualTourUrl || property.offeringMemorandum || property.brochure) && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Additional Documents
                  </Typography>
                  
                  {property.virtualTourUrl && (
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ mb: 1 }}
                      href={property.virtualTourUrl}
                      target="_blank"
                    >
                      View Virtual Tour
                    </Button>
                  )}
                  
                  {property.offeringMemorandum && (
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ mb: 1 }}
                      href={property.offeringMemorandum}
                      target="_blank"
                      startIcon={<Description />}
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
                      startIcon={<Description />}
                    >
                      Download Brochure
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {/* Property Identification */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Property Identification
                </Typography>
                
                <Grid container spacing={2}>
                  {property.mlsNumber && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">MLS Number</Typography>
                      <Typography variant="body1">{property.mlsNumber}</Typography>
                    </Grid>
                  )}
                  
                  {property.internalPropertyId && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Internal Property ID</Typography>
                      <Typography variant="body1">{property.internalPropertyId}</Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Property ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {property.id}
                    </Typography>
                  </Grid>
                  
                  {property.source && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Data Source</Typography>
                      <Chip label={property.source} size="small" variant="outlined" />
                    </Grid>
                  )}
                  
                  {property.isActive !== null && property.isActive !== undefined && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={property.isActive ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={property.isActive ? 'success' : 'default'}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Building Details */}
            {(property.totalSquareFootage || property.availableSquareFootage || property.floors || property.parkingSpaces || property.parkingRatio) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Building Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.totalSquareFootage && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Total Square Footage</Typography>
                        <Typography variant="body1">{property.totalSquareFootage.toLocaleString()} Sq Ft</Typography>
                      </Grid>
                    )}
                    
                    {property.availableSquareFootage && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Available Square Footage</Typography>
                        <Typography variant="body1">{property.availableSquareFootage.toLocaleString()} Sq Ft</Typography>
                      </Grid>
                    )}
                    
                    {property.floors && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Floors</Typography>
                        <Typography variant="body1">{property.floors} {property.floors === 1 ? 'floor' : 'floors'}</Typography>
                      </Grid>
                    )}
                    
                    {property.parkingSpaces && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Parking Spaces</Typography>
                        <Typography variant="body1">{property.parkingSpaces}</Typography>
                      </Grid>
                    )}
                    
                    {property.parkingRatio && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Parking Ratio</Typography>
                        <Typography variant="body1">{property.parkingRatio} spaces/1000 SF</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Utilities */}
            {property.utilities && Object.keys(property.utilities).length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Utilities
                  </Typography>
                  
                  <Grid container spacing={1}>
                    {Object.entries(property.utilities).map(([key, value]) => (
                      <Grid item xs={12} sm={6} key={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={key.charAt(0).toUpperCase() + key.slice(1)} 
                            size="small"
                            color={value ? 'success' : 'default'}
                            variant={value ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Lot Details */}
            {(property.lotSize || property.lotDimensions) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Lot Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.lotSize && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Lot Size</Typography>
                        <Typography variant="body1">
                          {parseFloat(property.lotSize).toLocaleString()} {property.lotSizeUnit || 'sqft'}
                        </Typography>
                      </Grid>
                    )}
                    
                    {property.lotDimensions && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Lot Dimensions</Typography>
                        <Typography variant="body1">{property.lotDimensions}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Industrial/Warehouse Specific */}
            {(property.ceilingHeight || property.clearHeight || property.loadingDocks !== null || property.driveInDoors !== null) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Industrial Features
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.ceilingHeight && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Ceiling Height</Typography>
                        <Typography variant="body1">{property.ceilingHeight} ft</Typography>
                      </Grid>
                    )}
                    
                    {property.clearHeight && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Clear Height</Typography>
                        <Typography variant="body1">{property.clearHeight} ft</Typography>
                      </Grid>
                    )}
                    
                    {property.loadingDocks !== null && property.loadingDocks !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Loading Docks</Typography>
                        <Typography variant="body1">
                          {property.loadingDocks} {property.loadingDocks === 1 ? 'loading dock' : 'loading docks'}
                        </Typography>
                      </Grid>
                    )}
                    
                    {property.driveInDoors !== null && property.driveInDoors !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Drive-In Doors</Typography>
                        <Typography variant="body1">
                          {property.driveInDoors} {property.driveInDoors === 1 ? 'drive-in door' : 'drive-in doors'}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Landlord Information */}
            {property.landlordName && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Landlord Information
                  </Typography>
                  
                  <Typography variant="body1">{property.landlordName}</Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            {/* Complete Lease Terms */}
            {property.leaseTerms && Object.keys(property.leaseTerms).filter(key => property.leaseTerms[key] !== null && property.leaseTerms[key] !== undefined && property.leaseTerms[key] !== '').length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Complete Lease Terms
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.leaseTerms.minTerm && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Minimum Term</Typography>
                        <Typography variant="body1">{property.leaseTerms.minTerm} months</Typography>
                      </Grid>
                    )}
                    
                    {property.leaseTerms.maxTerm && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Maximum Term</Typography>
                        <Typography variant="body1">{property.leaseTerms.maxTerm} months</Typography>
                      </Grid>
                    )}
                    
                    {property.leaseTerms.renewalOptions && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Renewal Options</Typography>
                        <Typography variant="body1">{property.leaseTerms.renewalOptions}</Typography>
                      </Grid>
                    )}
                    
                    {property.leaseTerms.securityDeposit && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Security Deposit</Typography>
                        <Typography variant="body1">{property.leaseTerms.securityDeposit}</Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Personal Guarantee Required</Typography>
                      <Chip 
                        label={property.leaseTerms.personalGuaranteeRequired ? 'Yes' : 'No'} 
                        size="small"
                        color={property.leaseTerms.personalGuaranteeRequired ? 'warning' : 'success'}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Complete Financial Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Complete Financial Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">List Price</Typography>
                    <Typography variant="h6">
                      {property.listPrice ? formatCurrency(property.listPrice) : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  {property.leaseRate && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Lease Rate</Typography>
                        <Typography variant="h6">{formatCurrency(property.leaseRate)}</Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Lease Rate Unit</Typography>
                        <Typography variant="body1">
                          {property.leaseRateUnit?.replace(/_/g, ' ') || 'N/A'}
                        </Typography>
                      </Grid>
                      
                      {property.leaseType && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Lease Type</Typography>
                          <Chip label={property.leaseType} size="small" />
                        </Grid>
                      )}
                    </>
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
                  
                  {property.operatingExpenses && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Operating Expenses</Typography>
                      <Typography variant="body1">{formatCurrency(property.operatingExpenses)}</Typography>
                    </Grid>
                  )}
                  
                  {property.taxes && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Property Taxes</Typography>
                      <Typography variant="body1">{formatCurrency(property.taxes)}</Typography>
                    </Grid>
                  )}
                  
                  {property.capRate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Cap Rate</Typography>
                      <Typography variant="h6" color="primary">
                        {(property.capRate * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                  )}
                  
                  {property.netOperatingIncome && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Net Operating Income</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(property.netOperatingIncome)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Occupancy & Vacancy */}
            {(property.occupancyPercentage !== null || property.vacancyPercentage !== null) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Occupancy Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {property.occupancyPercentage !== null && property.occupancyPercentage !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Occupancy Rate</Typography>
                        <Typography variant="h5" color="success.main">
                          {property.occupancyPercentage}%
                        </Typography>
                      </Grid>
                    )}
                    
                    {property.vacancyPercentage !== null && property.vacancyPercentage !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Vacancy Rate</Typography>
                        <Typography variant="h5" color="warning.main">
                          {property.vacancyPercentage}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Tracking Metrics */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Tracking Metrics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Days on Market</Typography>
                    <Typography variant="h5">{property.daysOnMarket ?? 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Views</Typography>
                    <Typography variant="h5">{property.views ?? 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Inquiries</Typography>
                    <Typography variant="h5">{property.inquiries ?? 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Showings</Typography>
                    <Typography variant="h5">{property.showings ?? 0}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tags */}
            {property.tags && property.tags.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Tags
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {property.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" color="primary" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {property.notes && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Internal Notes
                  </Typography>
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.notes}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {property.highlights && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Property Highlights
                  </Typography>
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {property.highlights}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Documents
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Document management coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <History sx={{ mr: 1 }} />
              Activity History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Activity tracking coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
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
                            {lease.squareFeet ? lease.squareFeet.toLocaleString() : 'N/A'}
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

      {activeTab === 5 && (
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
                            {debt.dscr || 'N/A'}
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