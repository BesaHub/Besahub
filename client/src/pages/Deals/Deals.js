import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  useTheme,
  TablePagination
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  TrendingUp,
  Refresh,
  MoreVert,
  Edit,
  Delete,
  ContentCopy,
  Visibility,
  Assessment,
  PriorityHigh,
  Warning,
  CheckCircle,
  AccessTime,
  Link as LinkIcon,
  Search as SearchIcon,
  LocalOffer,
  Description,
  Handshake,
  Gavel
} from '@mui/icons-material';
import { dealApi, DEAL_STAGES, DEAL_PRIORITIES, DEAL_TYPES } from '../../services/dealApi';

const Deals = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [probabilityRange, setProbabilityRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('lastActivityDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, deal: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState({ element: null, deal: null });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const mockDeals = useMemo(() => [
    {
      id: '1',
      name: 'Downtown Office Tower Acquisition',
      propertyId: '1',
      contactId: '1',
      stage: 'negotiation',
      type: 'sale',
      priority: 'high',
      value: 12500000,
      probability: 80,
      expectedCloseDate: '2024-03-15',
      createdAt: '2024-01-15T10:00:00Z',
      lastActivityDate: '2024-01-22T14:30:00Z',
      assignedTo: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com'
      },
      property: {
        name: 'Metropolitan Office Tower',
        address: '1250 Fifth Avenue, Downtown',
        propertyType: 'office'
      },
      contact: {
        firstName: 'David',
        lastName: 'Park',
        companyName: 'Park Investment Group',
        type: 'individual'
      },
      notes: 'Major institutional buyer. Due diligence in progress. Strong financing confirmed.',
      tags: ['Hot Lead', 'Institutional', 'Pre-Approved']
    },
    {
      id: '2',
      name: 'Logistics Center Long-Term Lease',
      propertyId: '2',
      contactId: '2',
      stage: 'proposal',
      type: 'lease',
      priority: 'high',
      value: 450000,
      probability: 70,
      expectedCloseDate: '2024-02-28',
      createdAt: '2024-01-10T09:00:00Z',
      lastActivityDate: '2024-01-21T11:00:00Z',
      assignedTo: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com'
      },
      property: {
        name: 'Southeast Distribution Hub',
        address: '4500 Industrial Parkway',
        propertyType: 'industrial'
      },
      contact: {
        companyName: 'Global Logistics Solutions',
        type: 'company'
      },
      notes: '10-year lease term requested. Needs loading dock modifications.',
      tags: ['Corporate Client', 'Long Term', 'Modifications Required']
    },
    {
      id: '3',
      name: 'Medical Office Building Purchase',
      propertyId: '3',
      contactId: '13',
      stage: 'closing',
      type: 'sale',
      priority: 'high',
      value: 4200000,
      probability: 95,
      expectedCloseDate: '2024-02-15',
      createdAt: '2024-12-05T15:30:00Z',
      lastActivityDate: '2024-01-20T16:45:00Z',
      assignedTo: {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily@company.com'
      },
      property: {
        name: 'Riverside Medical Center',
        address: '890 Medical Plaza Drive',
        propertyType: 'medical'
      },
      contact: {
        companyName: 'Healthcare Partners LLC',
        type: 'company'
      },
      notes: 'Final walk-through scheduled. Closing docs in review.',
      tags: ['Nearly Closed', 'Medical', 'Closing This Month']
    },
    {
      id: '4',
      name: 'Retail Shopping Center Sale',
      propertyId: '4',
      contactId: '4',
      stage: 'due_diligence',
      type: 'sale',
      priority: 'medium',
      value: 8750000,
      probability: 60,
      expectedCloseDate: '2024-04-30',
      createdAt: '2024-01-08T12:00:00Z',
      lastActivityDate: '2024-01-19T09:30:00Z',
      assignedTo: {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'mchen@company.com'
      },
      property: {
        name: 'Westside Shopping Plaza',
        address: '1200 Commerce Way',
        propertyType: 'retail'
      },
      contact: {
        firstName: 'Michael',
        lastName: 'Chen',
        companyName: 'Chen Capital',
        type: 'individual'
      },
      notes: 'Environmental study pending. Good anchor tenant mix.',
      tags: ['Due Diligence', 'Environmental Review', 'Strong Tenants']
    },
    {
      id: '5',
      name: 'Tech Startup Office Lease',
      propertyId: '5',
      contactId: '7',
      stage: 'proposal',
      type: 'lease',
      priority: 'medium',
      value: 240000,
      probability: 55,
      expectedCloseDate: '2024-03-31',
      createdAt: '2024-01-12T14:15:00Z',
      lastActivityDate: '2024-01-18T10:20:00Z',
      assignedTo: {
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa@company.com'
      },
      property: {
        name: 'Innovation District Offices',
        address: '500 Tech Boulevard',
        propertyType: 'office'
      },
      contact: {
        companyName: 'TechStart Ventures',
        type: 'company'
      },
      notes: '5-year lease with 2 expansion options. Open floor plan required.',
      tags: ['Tech Client', 'Growth Company', 'Expansion Options']
    },
    {
      id: '6',
      name: 'Manufacturing Facility Acquisition',
      propertyId: '6',
      contactId: '12',
      stage: 'prospecting',
      type: 'sale',
      priority: 'medium',
      value: 3200000,
      probability: 30,
      expectedCloseDate: '2024-05-15',
      createdAt: '2024-01-18T11:45:00Z',
      lastActivityDate: '2024-01-19T15:30:00Z',
      assignedTo: {
        firstName: 'Robert',
        lastName: 'Williams',
        email: 'rwilliams@company.com'
      },
      property: {
        name: 'Northwest Manufacturing Complex',
        address: '750 Industrial Road',
        propertyType: 'industrial'
      },
      contact: {
        firstName: 'James',
        lastName: 'Miller',
        companyName: 'Miller Construction',
        type: 'individual'
      },
      notes: 'Owner-user purchase. Needs equipment inspection.',
      tags: ['Owner User', 'Manufacturing', 'Equipment Included']
    },
    {
      id: '7',
      name: 'Multifamily Investment Sale',
      propertyId: '7',
      contactId: '11',
      stage: 'negotiation',
      type: 'sale',
      priority: 'high',
      value: 6800000,
      probability: 75,
      expectedCloseDate: '2024-03-20',
      createdAt: '2024-01-02T09:00:00Z',
      lastActivityDate: '2024-01-21T13:15:00Z',
      assignedTo: {
        firstName: 'Amanda',
        lastName: 'Davis',
        email: 'amanda@company.com'
      },
      property: {
        name: 'Garden View Apartments',
        address: '1500 Residential Lane',
        propertyType: 'multifamily'
      },
      contact: {
        firstName: 'Amanda',
        lastName: 'Davis',
        companyName: 'Davis Capital Management',
        type: 'individual'
      },
      notes: '84-unit apartment complex. 95% occupancy. Value-add opportunity.',
      tags: ['Multifamily', 'Value Add', 'Strong Occupancy']
    },
    {
      id: '8',
      name: 'Hotel Portfolio Disposition',
      propertyId: '8',
      contactId: '1',
      stage: 'marketing',
      type: 'sale',
      priority: 'low',
      value: 25000000,
      probability: 40,
      expectedCloseDate: '2024-06-30',
      createdAt: '2024-01-20T16:00:00Z',
      lastActivityDate: '2024-01-21T10:00:00Z',
      assignedTo: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com'
      },
      property: {
        name: 'Regional Hotel Portfolio',
        address: 'Multiple Locations',
        propertyType: 'hotel'
      },
      contact: {
        firstName: 'John',
        lastName: 'Smith',
        companyName: 'Smith Properties',
        type: 'individual'
      },
      notes: '3-property hotel portfolio. Market just launched.',
      tags: ['Portfolio Sale', 'Hospitality', 'Multiple Assets']
    },
    {
      id: '9',
      name: 'Cold Storage Lease Renewal',
      propertyId: '9',
      contactId: '2',
      stage: 'negotiation',
      type: 'lease',
      priority: 'medium',
      value: 320000,
      probability: 85,
      expectedCloseDate: '2024-02-29',
      createdAt: '2024-01-05T08:30:00Z',
      lastActivityDate: '2024-01-20T14:00:00Z',
      assignedTo: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com'
      },
      property: {
        name: 'Arctic Storage Facility',
        address: '200 Cold Chain Drive',
        propertyType: 'industrial'
      },
      contact: {
        companyName: 'ABC Development Corp',
        type: 'company'
      },
      notes: 'Existing tenant renewal. Negotiating rent increase.',
      tags: ['Renewal', 'Existing Tenant', 'Specialized Use']
    },
    {
      id: '10',
      name: 'Mixed-Use Development Sale',
      propertyId: '10',
      contactId: '15',
      stage: 'qualification',
      type: 'sale',
      priority: 'low',
      value: 18500000,
      probability: 25,
      expectedCloseDate: '2024-07-15',
      createdAt: '2024-01-22T12:30:00Z',
      lastActivityDate: '2024-01-22T12:30:00Z',
      assignedTo: {
        firstName: 'Jennifer',
        lastName: 'Lee',
        email: 'jennifer@company.com'
      },
      property: {
        name: 'Central Square Development',
        address: '1000 Main Street',
        propertyType: 'mixed-use'
      },
      contact: {
        firstName: 'Kevin',
        lastName: 'Brown',
        companyName: 'Brown Investment Fund',
        type: 'individual'
      },
      notes: 'Ground-up development opportunity. Zoning approved.',
      tags: ['Development', 'Mixed Use', 'Zoning Approved']
    },
    {
      id: '11',
      name: 'Restaurant Space Sublease',
      propertyId: '11',
      contactId: '8',
      stage: 'proposal',
      type: 'sublease',
      priority: 'low',
      value: 96000,
      probability: 40,
      expectedCloseDate: '2024-04-01',
      createdAt: '2024-01-16T10:45:00Z',
      lastActivityDate: '2024-01-17T16:20:00Z',
      assignedTo: {
        firstName: 'Robert',
        lastName: 'Williams',
        email: 'rwilliams@company.com'
      },
      property: {
        name: 'Downtown Culinary District',
        address: '350 Food Court Plaza',
        propertyType: 'retail'
      },
      contact: {
        firstName: 'Lisa',
        lastName: 'Thompson',
        companyName: 'Thompson & Associates',
        type: 'individual'
      },
      notes: 'Restaurant space with existing kitchen. Short-term sublease.',
      tags: ['Sublease', 'Restaurant', 'Existing Kitchen']
    },
    {
      id: '12',
      name: 'Data Center Investment',
      propertyId: '12',
      contactId: '6',
      stage: 'due_diligence',
      type: 'sale',
      priority: 'high',
      value: 45000000,
      probability: 65,
      expectedCloseDate: '2024-05-30',
      createdAt: '2024-01-01T14:20:00Z',
      lastActivityDate: '2024-01-21T11:30:00Z',
      assignedTo: {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'mchen@company.com'
      },
      property: {
        name: 'Edge Computing Center',
        address: '800 Data Drive',
        propertyType: 'industrial'
      },
      contact: {
        firstName: 'David',
        lastName: 'Park',
        companyName: 'Park Investment Group',
        type: 'individual'
      },
      notes: 'Mission-critical facility. Extensive technical due diligence required.',
      tags: ['Data Center', 'Mission Critical', 'Technical DD']
    }
  ], []);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        
        try {
          const response = await dealApi.getDeals({
            page: 1,
            limit: 100
          });
          
          if (response && response.deals) {
            setDeals(response.deals);
          } else {
            setDeals(mockDeals);
          }
        } catch (apiError) {
          setDeals(mockDeals);
        }
      } catch (err) {
        setError('Failed to load deals');
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [mockDeals]);

  const refreshDeals = async () => {
    setLoading(true);
    try {
      const response = await dealApi.getDeals({
        page: 1,
        limit: 100
      });
      
      if (response && response.deals) {
        setDeals(response.deals);
        setSnackbar({
          open: true,
          message: 'Deals updated successfully',
          severity: 'success'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh deals',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeal = useCallback(() => {
    navigate('/deals/new');
  }, [navigate]);

  const handleViewDeal = useCallback((deal) => {
    navigate(`/deals/${deal.id}`);
  }, [navigate]);

  const handleEditDeal = useCallback((deal) => {
    navigate(`/deals/${deal.id}/edit`);
  }, [navigate]);

  const handleDeleteDeal = async (deal) => {
    try {
      try {
        await dealApi.deleteDeal(deal.id);
      } catch (apiError) {
        // API delete failed, removing from local state
      }
      
      // Update local state regardless (optimistic update)
      setDeals(prev => prev.filter(d => d.id !== deal.id));
      setSnackbar({
        open: true,
        message: 'Deal deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete deal',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, deal: null });
    }
  };

  const handleDuplicateDeal = async (deal) => {
    try {
      const response = await dealApi.duplicateDeal(deal.id, {
        name: `${deal.name} (Copy)`
      });
      
      if (response && response.deal) {
        setDeals(prev => [response.deal, ...prev]);
      } else {
        // Mock duplication for demo
        const duplicatedDeal = {
          ...deal,
          id: `${deal.id}_copy_${Date.now()}`,
          name: `${deal.name} (Copy)`,
          stage: 'prospecting',
          probability: 10,
          createdAt: new Date().toISOString()
        };
        setDeals(prev => [duplicatedDeal, ...prev]);
      }
      
      setSnackbar({
        open: true,
        message: 'Deal duplicated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to duplicate deal',
        severity: 'error'
      });
    }
    setMenuAnchor({ element: null, deal: null });
  };

  const handleMenuClick = useCallback((event, deal) => {
    setMenuAnchor({ element: event.currentTarget, deal });
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor({ element: null, deal: null });
  }, []);

  const filteredAndSortedDeals = useMemo(() => {
    let filtered = deals.filter(deal => {
      // Basic search
      const matchesSearch = !searchTerm ||
        deal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.property?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.assignedTo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.assignedTo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Basic filters
      const matchesStage = !filterStage || deal.stage === filterStage;
      const matchesType = !filterType || (deal.type || deal.dealType) === filterType;
      const matchesPriority = !filterPriority || deal.priority === filterPriority;

      // Value range filter
      let matchesValue = true;
      if (valueRange.min || valueRange.max) {
        const dealValue = deal.value || 0;
        const filterMin = valueRange.min ? parseFloat(valueRange.min) : 0;
        const filterMax = valueRange.max ? parseFloat(valueRange.max) : Infinity;
        matchesValue = dealValue >= filterMin && dealValue <= filterMax;
      }

      // Probability range filter
      let matchesProbability = true;
      if (probabilityRange.min || probabilityRange.max) {
        const dealProb = deal.probability || 0;
        const filterMin = probabilityRange.min ? parseFloat(probabilityRange.min) : 0;
        const filterMax = probabilityRange.max ? parseFloat(probabilityRange.max) : 100;
        matchesProbability = dealProb >= filterMin && dealProb <= filterMax;
      }

      return matchesSearch && matchesStage && matchesType && matchesPriority && matchesValue && matchesProbability;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'value':
          aVal = a.value || 0;
          bVal = b.value || 0;
          break;
        case 'probability':
          aVal = a.probability || 0;
          bVal = b.probability || 0;
          break;
        case 'expectedCloseDate':
          aVal = new Date(a.expectedCloseDate || 0);
          bVal = new Date(b.expectedCloseDate || 0);
          break;
        case 'lastActivityDate':
          aVal = new Date(a.lastActivityDate || 0);
          bVal = new Date(b.lastActivityDate || 0);
          break;
        case 'stage':
          aVal = a.stage || '';
          bVal = b.stage || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [deals, searchTerm, filterStage, filterType, filterPriority, valueRange, probabilityRange, sortBy, sortOrder]);

  const paginatedDeals = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedDeals.slice(startIndex, endIndex);
  }, [filteredAndSortedDeals, page, rowsPerPage]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStage('');
    setFilterType('');
    setFilterPriority('');
    setValueRange({ min: '', max: '' });
    setProbabilityRange({ min: '', max: '' });
    setSortBy('lastActivityDate');
    setSortOrder('desc');
  };

  const activeFiltersCount = [
    searchTerm,
    filterStage,
    filterType,
    filterPriority,
    valueRange.min,
    valueRange.max,
    probabilityRange.min,
    probabilityRange.max
  ].filter(Boolean).length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStageInfo = (stageId) => {
    return DEAL_STAGES.find(stage => stage.id === stageId) || DEAL_STAGES[0];
  };

  const getPriorityInfo = (priorityId) => {
    return DEAL_PRIORITIES.find(priority => priority.id === priorityId) || DEAL_PRIORITIES[0];
  };

  const getDealHealthStatus = (deal) => {
    const daysSinceActivity = Math.floor(
      (new Date() - new Date(deal.lastActivityDate)) / (1000 * 60 * 60 * 24)
    );
    const daysUntilClose = Math.floor(
      (new Date(deal.expectedCloseDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity > 14 && deal.probability < 50) {
      return { status: 'stalled', color: theme.palette.error.main, icon: Warning, text: 'Stalled' };
    } else if (daysUntilClose < 7 && deal.probability < 70) {
      return { status: 'at-risk', color: theme.palette.warning.main, icon: AccessTime, text: 'At Risk' };
    } else if (deal.probability >= 80) {
      return { status: 'healthy', color: theme.palette.success.main, icon: CheckCircle, text: 'Healthy' };
    } else if (daysSinceActivity > 7) {
      return { status: 'needs-attention', color: theme.palette.warning.main, icon: AccessTime, text: 'Needs Attention' };
    }
    return { status: 'normal', color: theme.palette.info.main, icon: TrendingUp, text: 'On Track' };
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return theme.palette.success.main;
    if (probability >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getValueColor = (value) => {
    if (value >= 10000000) return theme.palette.success.main;
    if (value >= 5000000) return theme.palette.info.main;
    return 'text.primary';
  };

  const getStageIcon = (stageId) => {
    const icons = {
      prospecting: SearchIcon,
      qualification: Assessment,
      proposal: Description,
      negotiation: Handshake,
      due_diligence: Assessment,
      closing: Gavel,
      marketing: LocalOffer
    };
    return icons[stageId] || TrendingUp;
  };

  const getPriorityIcon = (priorityId) => {
    const icons = {
      high: PriorityHigh,
      medium: Warning,
      low: CheckCircle
    };
    return icons[priorityId] || CheckCircle;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading deals...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Failed to load deals</Typography>
          <Typography>{error}</Typography>
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: theme.spacing(3) }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: theme.spacing(3) }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: theme.spacing(0.5) }}>
          Deals & Opportunities
        </Typography>
        <Box sx={{ display: 'flex', gap: theme.spacing(1) }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshDeals}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddDeal}
          >
            Add Deal
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: theme.spacing(3), mb: theme.spacing(3), borderRadius: 2 }}>
        <Grid container spacing={theme.spacing(2)} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select
                value={filterStage}
                label="Stage"
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <MenuItem value="">All Stages</MenuItem>
                {DEAL_STAGES.filter(stage => stage.id !== 'closed_lost').map((stage) => (
                  <MenuItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {DEAL_TYPES.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                {DEAL_PRIORITIES.map((priority) => (
                  <MenuItem key={priority.id} value={priority.id}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant={activeFiltersCount > 0 ? "contained" : "outlined"}
              startIcon={<FilterList />}
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              fullWidth
              color={activeFiltersCount > 0 ? "secondary" : "primary"}
            >
              Clear Filters
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  sx={{ ml: 1, height: 20, backgroundColor: 'white', color: 'secondary.main' }}
                />
              )}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate('/pipeline')}
              fullWidth
            >
              Pipeline
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
          {filteredAndSortedDeals.length > 0 
            ? <>Showing <strong>{page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredAndSortedDeals.length)}</strong> of <strong>{filteredAndSortedDeals.length}</strong> deals</>
            : 'No deals found'
          }
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`}
              size="small"
              color="primary"
              sx={{ ml: 1, fontSize: '0.75rem' }}
            />
          )}
        </Typography>
      </Box>

      {/* Deals Table */}
      {filteredAndSortedDeals.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {deals.length === 0 ? 'No deals found' : 'No matching deals'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {deals.length === 0
              ? 'Get started by creating your first deal'
              : 'Try adjusting your search or filter criteria'
            }
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddDeal}>
            {deals.length === 0 ? 'Create Your First Deal' : 'Add Deal'}
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2, maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                      Deal Name
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Property
                  </Typography>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Contact
                  </Typography>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Type
                  </Typography>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Stage
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <TableSortLabel
                    active={sortBy === 'value'}
                    direction={sortBy === 'value' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('value');
                      setSortOrder(sortBy === 'value' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                      Value
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <TableSortLabel
                    active={sortBy === 'probability'}
                    direction={sortBy === 'probability' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('probability');
                      setSortOrder(sortBy === 'probability' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                      Probability
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Priority
                  </Typography>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Health
                  </Typography>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <TableSortLabel
                    active={sortBy === 'expectedCloseDate'}
                    direction={sortBy === 'expectedCloseDate' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('expectedCloseDate');
                      setSortOrder(sortBy === 'expectedCloseDate' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                      Expected Close
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Assigned To
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Actions
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDeals.map((deal, index) => {
                const stageInfo = getStageInfo(deal.stage);
                const priorityInfo = getPriorityInfo(deal.priority);
                const healthStatus = getDealHealthStatus(deal);
                const StageIconComponent = getStageIcon(deal.stage);
                const PriorityIconComponent = getPriorityIcon(deal.priority);
                const HealthIconComponent = healthStatus.icon;

                return (
                  <TableRow
                    key={deal.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[2],
                        transition: 'all 0.2s ease-in-out'
                      },
                      backgroundColor: index % 2 === 0 ? theme.palette.background.paper : theme.palette.action.selected,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => handleViewDeal(deal)}
                  >
                    <TableCell sx={{ minWidth: 220, py: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: 'primary.main',
                          fontSize: '0.813rem',
                          '&:hover': { textDecoration: 'underline' },
                          mb: 0.25
                        }}
                      >
                        {deal.name}
                      </Typography>
                      {deal.tags && deal.tags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                          {deal.tags.slice(0, 2).map((tag, idx) => (
                            <Chip
                              key={idx}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.625rem', height: 18, fontWeight: 500 }}
                            />
                          ))}
                          {deal.tags.length > 2 && (
                            <Chip
                              label={`+${deal.tags.length - 2}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.625rem', height: 18 }}
                            />
                          )}
                        </Box>
                      )}
                    </TableCell>

                    <TableCell sx={{ minWidth: 170, py: 0.75 }}>
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 0.25 }}>
                        {deal.property?.name || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
                        {deal.property?.address || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 170, py: 0.75 }}>
                      <Box
                        component="span"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deal.contactId) {
                            navigate(`/contacts/${deal.contactId}`);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          '&:hover': {
                            '& .contact-name': { textDecoration: 'underline', color: 'primary.main' }
                          }
                        }}
                      >
                        <LinkIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography
                          variant="caption"
                          className="contact-name"
                          sx={{ fontWeight: 500, fontSize: '0.813rem', transition: 'all 0.2s' }}
                        >
                          {deal.contact?.type === 'company'
                            ? deal.contact?.companyName
                            : `${deal.contact?.firstName || ''} ${deal.contact?.lastName || ''}`.trim() || '-'
                          }
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Chip
                        label={((deal.type || deal.dealType || 'sale').charAt(0).toUpperCase() + (deal.type || deal.dealType || 'sale').slice(1))}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.688rem', fontWeight: 600, borderWidth: 1.5, height: 20 }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Chip
                        icon={<StageIconComponent sx={{ fontSize: 14, color: 'white !important' }} />}
                        label={stageInfo.name}
                        size="small"
                        sx={{
                          backgroundColor: stageInfo.color,
                          color: 'white',
                          fontSize: '0.688rem',
                          fontWeight: 600,
                          height: 22,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ py: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.813rem',
                          color: getValueColor(deal.value)
                        }}
                      >
                        {formatCurrency(deal.value)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 130, py: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={deal.probability}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProbabilityColor(deal.probability),
                              borderRadius: 3
                            }
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            minWidth: 30,
                            fontWeight: 600,
                            fontSize: '0.688rem',
                            color: getProbabilityColor(deal.probability)
                          }}
                        >
                          {deal.probability}%
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Chip
                        icon={<PriorityIconComponent sx={{ fontSize: 14, color: 'white !important' }} />}
                        label={priorityInfo.name}
                        size="small"
                        sx={{
                          backgroundColor: priorityInfo.color,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.688rem',
                          height: 22,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Chip
                        icon={<HealthIconComponent sx={{ fontSize: 14 }} />}
                        label={healthStatus.text}
                        size="small"
                        sx={{
                          backgroundColor: healthStatus.color,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.688rem',
                          height: 22,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.813rem', fontWeight: 500 }}>
                        {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: '0.688rem',
                            fontWeight: 600,
                            bgcolor: 'primary.main'
                          }}
                        >
                          {deal.assignedTo?.firstName?.[0] || '?'}{deal.assignedTo?.lastName?.[0] || ''}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ fontSize: '0.813rem', fontWeight: 500 }}>
                            {deal.assignedTo?.firstName} {deal.assignedTo?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                            {deal.assignedTo?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 0.75 }}>
                      <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeal(deal);
                          }}
                          sx={{
                            p: 0.5,
                            '&:hover': { backgroundColor: '#e3f2fd', color: 'primary.main' }
                          }}
                        >
                          <Visibility sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDeal(deal);
                          }}
                          sx={{
                            p: 0.5,
                            '&:hover': { backgroundColor: '#fff3e0', color: 'warning.main' }
                          }}
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(e, deal);
                          }}
                          sx={{
                            p: 0.5,
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          <MoreVert sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredAndSortedDeals.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleViewDeal(menuAnchor.deal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleEditDeal(menuAnchor.deal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Deal</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDuplicateDeal(menuAnchor.deal)}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate Deal</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            setDeleteDialog({ open: true, deal: menuAnchor.deal });
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Deal</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, deal: null })}>
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.deal?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, deal: null })}>
            Cancel
          </Button>
          <Button onClick={() => handleDeleteDeal(deleteDialog.deal)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default Deals;