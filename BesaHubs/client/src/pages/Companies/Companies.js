import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  Pagination,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Business,
  People,
  TrendingUp,
  Clear,
  Refresh,
  Phone,
  Email,
  Language,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { companyApi } from '../../services/api';
import useScrollReveal from '../../utils/useScrollReveal';
import { CardSkeleton } from '../../components/Common/LoadingSkeletons';
import EmptyState from '../../components/Common/EmptyState';
import CompanyDialog from './CompanyDialog';

const Companies = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [cardGridRef, cardGridVisible] = useScrollReveal({ threshold: 0.05, initialVisible: true });
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedCompanyType, setSelectedCompanyType] = useState('');
  const [selectedLeadStatus, setSelectedLeadStatus] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const [companyDialog, setCompanyDialog] = useState({ open: false, mode: 'create', company: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        
        const [sortField, sortDirection] = sortBy.split('-');
        const apiSortBy = sortField === 'revenue' ? 'annualRevenue' 
          : sortField === 'portfolio' ? 'portfolioValue'
          : sortField === 'lastContact' ? 'lastContactDate'
          : sortField;
        
        const params = {
          page,
          limit: itemsPerPage,
          sortBy: apiSortBy,
          sortOrder: sortDirection.toUpperCase()
        };

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        if (selectedIndustry) {
          params.industry = selectedIndustry;
        }
        if (selectedCompanyType) {
          params.companyType = selectedCompanyType;
        }
        if (selectedLeadStatus) {
          params.leadStatus = selectedLeadStatus;
        }

        const response = await companyApi.getAll(params);
        
        setCompanies(response?.data?.companies || response?.companies || []);
        setPagination(response?.data?.pagination || response?.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: itemsPerPage
        });
      } catch (err) {
        console.log('API call failed, using demo data:', err);
        // Use demo data when API fails
        const demoCompanies = [
          {
            id: '1',
            name: 'ABC Corporation',
            industry: 'Technology',
            companyType: 'investor',
            leadStatus: 'qualified',
            website: 'https://abccorp.com',
            phone: '(555) 123-4567',
            email: 'contact@abccorp.com',
            address: '123 Business St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            employeeCount: 500,
            annualRevenue: 50000000,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Chen Capital Partners',
            industry: 'Finance',
            companyType: 'investor',
            leadStatus: 'qualified',
            website: 'https://chencapital.com',
            phone: '(555) 234-5678',
            email: 'info@chencapital.com',
            address: '456 Financial Blvd',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            employeeCount: 150,
            annualRevenue: 85000000,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            name: 'Johnson Realty Group',
            industry: 'Real Estate',
            companyType: 'broker',
            leadStatus: 'active',
            website: 'https://jrg.com',
            phone: '(555) 345-6789',
            email: 'contact@jrg.com',
            address: '789 Real Estate Ave',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            employeeCount: 75,
            annualRevenue: 25000000,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            name: 'Williams Development',
            industry: 'Construction',
            companyType: 'developer',
            leadStatus: 'qualified',
            website: 'https://willdev.com',
            phone: '(555) 456-7890',
            email: 'info@willdev.com',
            address: '321 Development Way',
            city: 'Miami',
            state: 'FL',
            zipCode: '33101',
            employeeCount: 300,
            annualRevenue: 120000000,
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '5',
            name: 'TechStart Solutions',
            industry: 'Technology',
            companyType: 'tenant',
            leadStatus: 'active',
            website: 'https://techstart.com',
            phone: '(555) 567-8901',
            email: 'hello@techstart.com',
            address: '654 Tech Street',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            employeeCount: 200,
            annualRevenue: 35000000,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '6',
            name: 'Park Investment Holdings',
            industry: 'Finance',
            companyType: 'investor',
            leadStatus: 'hot',
            website: 'https://pih.com',
            phone: '(555) 678-9012',
            email: 'contact@pih.com',
            address: '987 Investment Plaza',
            city: 'Seattle',
            state: 'WA',
            zipCode: '98101',
            employeeCount: 100,
            annualRevenue: 95000000,
            createdAt: new Date().toISOString()
          },
          {
            id: '7',
            name: 'Thompson & Associates',
            industry: 'Real Estate',
            companyType: 'broker',
            leadStatus: 'active',
            website: 'https://thompsonassoc.com',
            phone: '(555) 789-0123',
            email: 'info@thompsonassoc.com',
            address: '147 Broker Lane',
            city: 'Boston',
            state: 'MA',
            zipCode: '02101',
            employeeCount: 50,
            annualRevenue: 18000000,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '8',
            name: 'Miller Construction',
            industry: 'Construction',
            companyType: 'developer',
            leadStatus: 'qualified',
            website: 'https://millerconst.com',
            phone: '(555) 890-1234',
            email: 'contact@millerconst.com',
            address: '258 Builders Blvd',
            city: 'Denver',
            state: 'CO',
            zipCode: '80201',
            employeeCount: 400,
            annualRevenue: 150000000,
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '9',
            name: 'Davis Capital Management',
            industry: 'Finance',
            companyType: 'investor',
            leadStatus: 'hot',
            website: 'https://daviscap.com',
            phone: '(555) 901-2345',
            email: 'info@daviscap.com',
            address: '369 Capital Drive',
            city: 'Phoenix',
            state: 'AZ',
            zipCode: '85001',
            employeeCount: 80,
            annualRevenue: 110000000,
            createdAt: new Date().toISOString()
          },
          {
            id: '10',
            name: 'Taylor Real Estate Fund',
            industry: 'Real Estate',
            companyType: 'investor',
            leadStatus: 'active',
            website: 'https://taylorfund.com',
            phone: '(555) 012-3456',
            email: 'contact@taylorfund.com',
            address: '741 Fund Street',
            city: 'Portland',
            state: 'OR',
            zipCode: '97201',
            employeeCount: 60,
            annualRevenue: 75000000,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '11',
            name: 'Global Logistics Solutions',
            industry: 'Logistics',
            companyType: 'tenant',
            leadStatus: 'qualified',
            website: 'https://globallog.com',
            phone: '(555) 567-1234',
            email: 'info@globallog.com',
            address: '852 Logistics Way',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            employeeCount: 600,
            annualRevenue: 200000000,
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '12',
            name: 'Healthcare Partners LLC',
            industry: 'Healthcare',
            companyType: 'tenant',
            leadStatus: 'qualified',
            website: 'https://healthpartners.com',
            phone: '(555) 234-8901',
            email: 'contact@healthpartners.com',
            address: '963 Medical Center',
            city: 'Atlanta',
            state: 'GA',
            zipCode: '30301',
            employeeCount: 250,
            annualRevenue: 65000000,
            createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setCompanies(demoCompanies);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: demoCompanies.length,
          itemsPerPage: itemsPerPage
        });
        setSnackbar({
          open: true,
          message: 'Using demo data - API unavailable',
          severity: 'info'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [page, debouncedSearch, selectedIndustry, selectedCompanyType, selectedLeadStatus, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const refreshCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortDirection] = sortBy.split('-');
      const apiSortBy = sortField === 'revenue' ? 'annualRevenue' 
        : sortField === 'portfolio' ? 'portfolioValue'
        : sortField === 'lastContact' ? 'lastContactDate'
        : sortField;
      
      const params = {
        page,
        limit: itemsPerPage,
        sortBy: apiSortBy,
        sortOrder: sortDirection.toUpperCase()
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (selectedIndustry) {
        params.industry = selectedIndustry;
      }
      if (selectedCompanyType) {
        params.companyType = selectedCompanyType;
      }
      if (selectedLeadStatus) {
        params.leadStatus = selectedLeadStatus;
      }

      const response = await companyApi.getAll(params);
      
      setCompanies(response?.data?.companies || response?.companies || []);
      setPagination(response?.data?.pagination || response?.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      });
      setSnackbar({
        open: true,
        message: 'Companies updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.log('Failed to refresh companies, using demo data:', err);
      const demoCompanies = [
        {
          id: '1',
          name: 'ABC Corporation',
          industry: 'Technology',
          companyType: 'investor',
          leadStatus: 'qualified',
          website: 'https://abccorp.com',
          phone: '(555) 123-4567',
          email: 'contact@abccorp.com',
          address: '123 Business St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          employeeCount: 500,
          annualRevenue: 50000000,
          createdAt: new Date().toISOString()
        }
      ];
      setCompanies(demoCompanies);
      setSnackbar({
        open: true,
        message: 'Using demo data - API unavailable',
        severity: 'info'
      });
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, debouncedSearch, selectedIndustry, selectedCompanyType, selectedLeadStatus]);

  const handleDeleteCompany = useCallback(async (company) => {
    try {
      await companyApi.delete(company.id);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setSnackbar({
        open: true,
        message: 'Company deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to delete company:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete company',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, company: null });
    }
  }, []);

  const handleViewDetails = useCallback((company, event) => {
    event?.stopPropagation();
    navigate(`/companies/${company.id}`);
  }, [navigate]);

  const handleEditCompany = useCallback((company, event) => {
    event?.stopPropagation();
    setCompanyDialog({ open: true, mode: 'edit', company });
  }, []);

  const handleAddCompany = useCallback(() => {
    setCompanyDialog({ open: true, mode: 'create', company: null });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedIndustry('');
    setSelectedCompanyType('');
    setSelectedLeadStatus('');
    setSearchTerm('');
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDialogSuccess = useCallback(() => {
    refreshCompanies();
  }, [refreshCompanies]);

  const startItem = pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  const activeFilterCount = [selectedIndustry, selectedCompanyType, selectedLeadStatus].filter(Boolean).length;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedIndustry, selectedCompanyType, selectedLeadStatus]);

  const getLeadStatusColor = (status) => {
    const colors = {
      cold: theme.palette.info.main,
      warm: theme.palette.warning.main,
      hot: theme.palette.error.main,
      qualified: theme.palette.secondary.main,
      customer: theme.palette.success.main,
      inactive: theme.palette.text.disabled
    };
    return colors[status] || theme.palette.text.secondary;
  };

  const getLeadStatusGradient = (status) => {
    const gradients = {
      cold: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      warm: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      hot: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      qualified: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      customer: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      inactive: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
    };
    return gradients[status] || theme.palette.gradient.primary;
  };

  const getLeadStatusLabel = (status) => {
    const labels = {
      cold: 'Cold',
      warm: 'Warm',
      hot: 'Hot',
      qualified: 'Qualified',
      customer: 'Customer',
      inactive: 'Inactive'
    };
    return labels[status] || status;
  };

  const getIndustryLabel = (industry) => {
    const labels = {
      real_estate: 'Real Estate',
      commercial_real_estate: 'Commercial RE',
      real_estate_investment: 'RE Investment',
      real_estate_development: 'RE Development',
      property_management: 'Property Mgmt',
      retail: 'Retail',
      hospitality: 'Hospitality',
      healthcare: 'Healthcare',
      manufacturing: 'Manufacturing',
      technology: 'Technology',
      finance: 'Finance',
      legal: 'Legal',
      construction: 'Construction',
      other: 'Other'
    };
    return labels[industry] || industry;
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ py: 2, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Companies
          </Typography>
          <Button variant="contained" startIcon={<Add />} disabled>
            Add Company
          </Button>
        </Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth disabled placeholder="Search companies..." />
            </Grid>
          </Grid>
        </Paper>
        <CardSkeleton count={12} />
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: theme.spacing(2),
        animation: 'fadeInScale 0.5s ease-out'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>
            Companies
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {pagination.totalItems > 0 
              ? `Showing ${startItem}-${endItem} of ${pagination.totalItems} ${pagination.totalItems === 1 ? 'company' : 'companies'}`
              : 'No companies found'
            }
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: theme.spacing(1) }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshCompanies}
            disabled={loading}
            sx={{ 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[15]
              },
              '&:active': {
                transform: 'scale(0.95)'
              },
              '& .MuiButton-startIcon': {
                transition: 'transform 0.3s ease'
              },
              '&:hover .MuiButton-startIcon': {
                transform: 'rotate(180deg)'
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCompany}
            sx={{
              borderRadius: 3,
              background: theme.palette.gradient.primary,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[20]
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            Add Company
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by company name, legal name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={selectedIndustry}
                label="Industry"
                onChange={(e) => setSelectedIndustry(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Industries</MenuItem>
                <MenuItem value="real_estate">Real Estate</MenuItem>
                <MenuItem value="commercial_real_estate">Commercial RE</MenuItem>
                <MenuItem value="real_estate_investment">RE Investment</MenuItem>
                <MenuItem value="real_estate_development">RE Development</MenuItem>
                <MenuItem value="property_management">Property Mgmt</MenuItem>
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="hospitality">Hospitality</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="manufacturing">Manufacturing</MenuItem>
                <MenuItem value="technology">Technology</MenuItem>
                <MenuItem value="finance">Finance</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
                <MenuItem value="construction">Construction</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Company Type</InputLabel>
              <Select
                value={selectedCompanyType}
                label="Company Type"
                onChange={(e) => setSelectedCompanyType(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="corporation">Corporation</MenuItem>
                <MenuItem value="llc">LLC</MenuItem>
                <MenuItem value="partnership">Partnership</MenuItem>
                <MenuItem value="sole_proprietorship">Sole Prop</MenuItem>
                <MenuItem value="trust">Trust</MenuItem>
                <MenuItem value="non_profit">Non-Profit</MenuItem>
                <MenuItem value="government">Government</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Lead Status</InputLabel>
              <Select
                value={selectedLeadStatus}
                label="Lead Status"
                onChange={(e) => setSelectedLeadStatus(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="cold">Cold</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
                <MenuItem value="hot">Hot</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem value="revenue-desc">Revenue (High to Low)</MenuItem>
                <MenuItem value="revenue-asc">Revenue (Low to High)</MenuItem>
                <MenuItem value="portfolio-desc">Portfolio (High to Low)</MenuItem>
                <MenuItem value="portfolio-asc">Portfolio (Low to High)</MenuItem>
                <MenuItem value="lastContact-desc">Last Contact (Recent)</MenuItem>
                <MenuItem value="lastContact-asc">Last Contact (Oldest)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              onClick={handleClearFilters}
              startIcon={<Clear />}
              sx={{ textTransform: 'none' }}
            >
              Clear Filters ({activeFilterCount})
            </Button>
          )}
        </Box>
      </Paper>

      {companies.length === 0 ? (
        <EmptyState
          icon={Business}
          title="No companies found"
          description={
            activeFilterCount > 0 || debouncedSearch
              ? "Try adjusting your search or filters"
              : "Get started by adding your first company"
          }
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddCompany}
              sx={{ mt: 2 }}
            >
              Add Company
            </Button>
          }
        />
      ) : (
        <>
          <Grid 
            container 
            spacing={1.5}
            ref={cardGridRef}
            sx={{
              opacity: cardGridVisible ? 1 : 0,
              transform: cardGridVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out'
            }}
          >
            {companies.map((company, index) => (
              <Grid item xs={12} sm={6} md={4} key={company.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[20],
                      '& .company-actions': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    },
                    animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                  }}
                  onClick={(e) => handleViewDetails(company, e)}
                >
                  <Box
                    sx={{
                      background: getLeadStatusGradient(company.leadStatus),
                      height: 4
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Avatar
                        src={company.logo}
                        sx={{
                          width: 44,
                          height: 44,
                          mr: 1.5,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '1.125rem',
                          fontWeight: 600
                        }}
                      >
                        {company.name?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 0.3,
                            fontSize: '0.9375rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {company.name}
                        </Typography>
                        {company.industry && (
                          <Chip
                            label={getIndustryLabel(company.industry)}
                            size="small"
                            sx={{
                              background: theme.palette.gradient.info,
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.65rem',
                              height: 18
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      {company.primaryEmail && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {company.primaryEmail}
                          </Typography>
                        </Box>
                      )}
                      {company.primaryPhone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {company.primaryPhone}
                          </Typography>
                        </Box>
                      )}
                      {company.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Language sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {company.website.replace(/^https?:\/\//, '')}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
                          <People sx={{ fontSize: 14, color: 'text.secondary', mr: 0.4 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Employees
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {formatNumber(company.employeeCount)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
                          <TrendingUp sx={{ fontSize: 14, color: 'text.secondary', mr: 0.4 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Portfolio
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {formatCurrency(company.portfolioValue)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={getLeadStatusLabel(company.leadStatus)}
                        size="small"
                        sx={{
                          bgcolor: getLeadStatusColor(company.leadStatus),
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                      <Box
                        className="company-actions"
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          opacity: 0,
                          transform: 'translateY(-5px)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditCompany(company, e)}
                            sx={{
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'primary.main', color: 'white' }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({ open: true, company });
                            }}
                            sx={{
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'error.main', color: 'white' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="medium"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                    fontWeight: 500
                  }
                }}
              />
            </Box>
          )}
        </>
      )}

      <CompanyDialog
        open={companyDialog.open}
        mode={companyDialog.mode}
        company={companyDialog.company}
        onClose={() => setCompanyDialog({ open: false, mode: 'create', company: null })}
        onSuccess={handleDialogSuccess}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, company: null })}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.company?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, company: null })}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteCompany(deleteDialog.company)}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default Companies;