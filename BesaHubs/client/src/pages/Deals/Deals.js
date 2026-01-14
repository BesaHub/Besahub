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
  TablePagination,
  Checkbox,
  Tooltip,
  MenuList,
  Tabs,
  Tab,
  Card,
  CardContent
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
  Gavel,
  GetApp,
  CheckBox,
  CheckBoxOutlineBlank,
  PlayArrow,
  Note,
  Today,
  Star
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
  const [selectedDeals, setSelectedDeals] = useState(new Set());
  const [quickFilter, setQuickFilter] = useState('');
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);

  const mockDeals = useMemo(() => [
    {
      id: '1',
      name: 'Downtown Office Tower Acquisition',
      propertyId: '1',
      contactId: '7', // Fixed: Changed from '1' to '7' to match David Park
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
        companyName: 'Park Investment Holdings',
        type: 'individual'
      },
      notes: 'Major institutional buyer. Due diligence in progress. Strong financing confirmed.',
      tags: ['Hot Lead', 'Institutional', 'Pre-Approved'],
      commissionStructure: {
        type: 'percentage',
        rate: 3,
        amount: 375000
      }
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
        firstName: 'Richard',
        lastName: 'Martinez',
        companyName: 'Global Logistics Solutions',
        type: 'company'
      },
      notes: '10-year lease term requested. Needs loading dock modifications.',
      tags: ['Corporate Client', 'Long Term', 'Modifications Required'],
      commissionStructure: {
        type: 'percentage',
        rate: 3,
        amount: 13500
      }
    },
    {
      id: '3',
      name: 'Medical Office Building Purchase',
      propertyId: '3',
      contactId: '3',
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
        firstName: 'Patricia',
        lastName: 'Anderson',
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
        firstName: 'Thomas',
        lastName: 'Wilson',
        companyName: 'Wilson Retail Holdings',
        type: 'individual'
      },
      notes: 'Environmental study pending. Good anchor tenant mix.',
      tags: ['Due Diligence', 'Environmental Review', 'Strong Tenants']
    },
    {
      id: '5',
      name: 'Tech Startup Office Lease',
      propertyId: '5',
      contactId: '5',
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
        firstName: 'Alex',
        lastName: 'Kumar',
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
      contactId: '6',
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
        companyName: 'Miller Construction Group',
        type: 'individual'
      },
      notes: 'Owner-user purchase. Needs equipment inspection.',
      tags: ['Owner User', 'Manufacturing', 'Equipment Included']
    },
    {
      id: '7',
      name: 'Multifamily Investment Sale',
      propertyId: '7',
      contactId: '7',
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
        firstName: 'Christopher',
        lastName: 'Taylor',
        companyName: 'Taylor Real Estate Fund',
        type: 'individual'
      },
      notes: '84-unit apartment complex. 95% occupancy. Value-add opportunity.',
      tags: ['Multifamily', 'Value Add', 'Strong Occupancy']
    },
    {
      id: '8',
      name: 'Hotel Portfolio Disposition',
      propertyId: '8',
      contactId: '8',
      stage: 'marketing',
      type: 'sale',
      priority: 'low',
      value: 25000000,
      probability: 40,
      expectedCloseDate: '2024-06-30',
      createdAt: '2024-01-20T16:00:00Z',
      lastActivityDate: '2024-01-21T10:00:00Z',
      assignedTo: {
        firstName: 'Jennifer',
        lastName: 'Lee',
        email: 'jennifer@company.com'
      },
      property: {
        name: 'Regional Hotel Portfolio',
        address: 'Multiple Locations',
        propertyType: 'hotel'
      },
      contact: {
        firstName: 'Robert',
        lastName: 'Garcia',
        companyName: 'Garcia Hospitality Group',
        type: 'individual'
      },
      notes: '3-property hotel portfolio. Market just launched.',
      tags: ['Portfolio Sale', 'Hospitality', 'Multiple Assets']
    },
    {
      id: '9',
      name: 'Cold Storage Lease Renewal',
      propertyId: '9',
      contactId: '9',
      stage: 'negotiation',
      type: 'lease',
      priority: 'medium',
      value: 320000,
      probability: 85,
      expectedCloseDate: '2024-02-29',
      createdAt: '2024-01-05T08:30:00Z',
      lastActivityDate: '2024-01-20T14:00:00Z',
      assignedTo: {
        firstName: 'Daniel',
        lastName: 'White',
        email: 'daniel@company.com'
      },
      property: {
        name: 'Arctic Storage Facility',
        address: '200 Cold Chain Drive',
        propertyType: 'industrial'
      },
      contact: {
        firstName: 'Maria',
        lastName: 'Lopez',
        companyName: 'Lopez Food Distribution',
        type: 'company'
      },
      notes: 'Existing tenant renewal. Negotiating rent increase.',
      tags: ['Renewal', 'Existing Tenant', 'Specialized Use']
    },
    {
      id: '10',
      name: 'Mixed-Use Development Sale',
      propertyId: '10',
      contactId: '10',
      stage: 'qualification',
      type: 'sale',
      priority: 'low',
      value: 18500000,
      probability: 25,
      expectedCloseDate: '2024-07-15',
      createdAt: '2024-01-22T12:30:00Z',
      lastActivityDate: '2024-01-22T12:30:00Z',
      assignedTo: {
        firstName: 'Jessica',
        lastName: 'Moore',
        email: 'jessica@company.com'
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
      contactId: '11',
      stage: 'proposal',
      type: 'sublease',
      priority: 'low',
      value: 96000,
      probability: 40,
      expectedCloseDate: '2024-04-01',
      createdAt: '2024-01-16T10:45:00Z',
      lastActivityDate: '2024-01-17T16:20:00Z',
      assignedTo: {
        firstName: 'Ryan',
        lastName: 'Jackson',
        email: 'ryan@company.com'
      },
      property: {
        name: 'Downtown Culinary District',
        address: '350 Food Court Plaza',
        propertyType: 'retail'
      },
      contact: {
        firstName: 'Sophia',
        lastName: 'Harris',
        companyName: 'Harris Restaurant Group',
        type: 'individual'
      },
      notes: 'Restaurant space with existing kitchen. Short-term sublease.',
      tags: ['Sublease', 'Restaurant', 'Existing Kitchen']
    },
    {
      id: '12',
      name: 'Data Center Investment',
      propertyId: '12',
      contactId: '12',
      stage: 'due_diligence',
      type: 'sale',
      priority: 'high',
      value: 45000000,
      probability: 65,
      expectedCloseDate: '2024-05-30',
      createdAt: '2024-01-01T14:20:00Z',
      lastActivityDate: '2024-01-21T11:30:00Z',
      assignedTo: {
        firstName: 'Mark',
        lastName: 'Thompson',
        email: 'mark@company.com'
      },
      property: {
        name: 'Edge Computing Center',
        address: '800 Data Drive',
        propertyType: 'industrial'
      },
      contact: {
        firstName: 'Nicole',
        lastName: 'Clark',
        companyName: 'Clark Technology Partners',
        type: 'individual'
      },
      notes: 'Mission-critical facility. Extensive technical due diligence required.',
      tags: ['Data Center', 'Mission Critical', 'Technical DD']
    },
    {
      id: '13',
      name: 'Warehouse Distribution Lease',
      propertyId: '13',
      contactId: '13',
      stage: 'proposal',
      type: 'lease',
      priority: 'medium',
      value: 380000,
      probability: 65,
      expectedCloseDate: '2024-03-10',
      createdAt: '2024-01-14T08:00:00Z',
      lastActivityDate: '2024-01-21T09:15:00Z',
      assignedTo: {
        firstName: 'Brian',
        lastName: 'Anderson',
        email: 'brian@company.com'
      },
      property: {
        name: 'Interstate Logistics Park',
        address: '2200 Highway 101',
        propertyType: 'industrial'
      },
      contact: {
        firstName: 'William',
        lastName: 'Robinson',
        companyName: 'Robinson Supply Chain',
        type: 'company'
      },
      notes: 'Cross-dock facility. 7-year lease with renewal options.',
      tags: ['Distribution', 'Cross-Dock', 'Long Term']
    },
    {
      id: '14',
      name: 'Senior Living Facility Sale',
      propertyId: '14',
      contactId: '14',
      stage: 'negotiation',
      type: 'sale',
      priority: 'high',
      value: 15200000,
      probability: 70,
      expectedCloseDate: '2024-04-20',
      createdAt: '2024-01-06T11:20:00Z',
      lastActivityDate: '2024-01-20T15:45:00Z',
      assignedTo: {
        firstName: 'Karen',
        lastName: 'Martinez',
        email: 'karen@company.com'
      },
      property: {
        name: 'Sunset Senior Living',
        address: '1800 Elder Care Boulevard',
        propertyType: 'senior-living'
      },
      contact: {
        firstName: 'Elizabeth',
        lastName: 'Young',
        companyName: 'Young Healthcare Realty',
        type: 'individual'
      },
      notes: '120-unit assisted living facility. Strong occupancy and cash flow.',
      tags: ['Senior Living', 'Healthcare', 'Stable Income']
    },
    {
      id: '15',
      name: 'Self-Storage Facility Purchase',
      propertyId: '15',
      contactId: '15',
      stage: 'due_diligence',
      type: 'sale',
      priority: 'medium',
      value: 5800000,
      probability: 55,
      expectedCloseDate: '2024-05-05',
      createdAt: '2024-01-11T13:30:00Z',
      lastActivityDate: '2024-01-19T10:00:00Z',
      assignedTo: {
        firstName: 'Steven',
        lastName: 'King',
        email: 'steven@company.com'
      },
      property: {
        name: 'Secure Storage Complex',
        address: '950 Storage Way',
        propertyType: 'self-storage'
      },
      contact: {
        firstName: 'Andrew',
        lastName: 'Wright',
        companyName: 'Wright Storage Investments',
        type: 'individual'
      },
      notes: '450-unit facility. 92% occupied. Climate-controlled units available.',
      tags: ['Self-Storage', 'High Occupancy', 'Climate Control']
    },
    {
      id: '16',
      name: 'Student Housing Lease',
      propertyId: '16',
      contactId: '16',
      stage: 'proposal',
      type: 'lease',
      priority: 'medium',
      value: 180000,
      probability: 50,
      expectedCloseDate: '2024-04-15',
      createdAt: '2024-01-13T09:45:00Z',
      lastActivityDate: '2024-01-18T14:20:00Z',
      assignedTo: {
        firstName: 'Michelle',
        lastName: 'Scott',
        email: 'michelle@company.com'
      },
      property: {
        name: 'University Heights Apartments',
        address: '600 College Avenue',
        propertyType: 'student-housing'
      },
      contact: {
        firstName: 'Jonathan',
        lastName: 'Green',
        companyName: 'Green Student Housing LLC',
        type: 'company'
      },
      notes: 'Furnished units near campus. Academic year lease terms.',
      tags: ['Student Housing', 'Furnished', 'Academic Year']
    },
    {
      id: '17',
      name: 'Industrial Land Development',
      propertyId: '17',
      contactId: '17',
      stage: 'qualification',
      type: 'sale',
      priority: 'low',
      value: 3200000,
      probability: 35,
      expectedCloseDate: '2024-08-30',
      createdAt: '2024-01-19T10:15:00Z',
      lastActivityDate: '2024-01-21T08:30:00Z',
      assignedTo: {
        firstName: 'Paul',
        lastName: 'Adams',
        email: 'paul@company.com'
      },
      property: {
        name: 'Industrial Park Parcel',
        address: '1500 Development Road',
        propertyType: 'land'
      },
      contact: {
        firstName: 'Rebecca',
        lastName: 'Baker',
        companyName: 'Baker Development Corp',
        type: 'individual'
      },
      notes: '15-acre zoned industrial land. Utilities available. Build-to-suit opportunity.',
      tags: ['Land', 'Development', 'Build-to-Suit']
    },
    {
      id: '18',
      name: 'Office Building Refinance',
      propertyId: '18',
      contactId: '18',
      stage: 'closing',
      type: 'sale',
      priority: 'high',
      value: 18500000,
      probability: 90,
      expectedCloseDate: '2024-02-28',
      createdAt: '2024-01-03T07:30:00Z',
      lastActivityDate: '2024-01-21T16:00:00Z',
      assignedTo: {
        firstName: 'Laura',
        lastName: 'Nelson',
        email: 'laura@company.com'
      },
      property: {
        name: 'Financial District Tower',
        address: '2000 Business Boulevard',
        propertyType: 'office'
      },
      contact: {
        firstName: 'Frank',
        lastName: 'Carter',
        companyName: 'Carter Real Estate Trust',
        type: 'individual'
      },
      notes: 'Refinance transaction. Strong NOI. Lender approved.',
      tags: ['Refinance', 'Strong NOI', 'Approved']
    },
    {
      id: '19',
      name: 'Retail Strip Center Lease',
      propertyId: '19',
      contactId: '19',
      stage: 'negotiation',
      type: 'lease',
      priority: 'medium',
      value: 125000,
      probability: 75,
      expectedCloseDate: '2024-03-05',
      createdAt: '2024-01-09T12:00:00Z',
      lastActivityDate: '2024-01-20T11:30:00Z',
      assignedTo: {
        firstName: 'Gregory',
        lastName: 'Mitchell',
        email: 'gregory@company.com'
      },
      property: {
        name: 'Neighborhood Shopping Center',
        address: '850 Retail Row',
        propertyType: 'retail'
      },
      contact: {
        firstName: 'Angela',
        lastName: 'Perez',
        companyName: 'Perez Retail Enterprises',
        type: 'company'
      },
      notes: 'Anchor tenant space. 5-year lease with percentage rent.',
      tags: ['Retail', 'Anchor Tenant', 'Percentage Rent']
    },
    {
      id: '20',
      name: 'Car Wash Facility Sale',
      propertyId: '20',
      contactId: '20',
      stage: 'prospecting',
      type: 'sale',
      priority: 'low',
      value: 1850000,
      probability: 20,
      expectedCloseDate: '2024-06-15',
      createdAt: '2024-01-17T14:00:00Z',
      lastActivityDate: '2024-01-19T09:00:00Z',
      assignedTo: {
        firstName: 'Nancy',
        lastName: 'Roberts',
        email: 'nancy@company.com'
      },
      property: {
        name: 'Express Car Wash',
        address: '3200 Auto Service Lane',
        propertyType: 'car-wash'
      },
      contact: {
        firstName: 'Dennis',
        lastName: 'Turner',
        companyName: 'Turner Auto Services',
        type: 'individual'
      },
      notes: 'Turn-key operation. Equipment included. High traffic location.',
      tags: ['Car Wash', 'Turn-Key', 'Equipment Included']
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
          
          // Handle different response structures
          const dealsData = response?.deals || response?.data?.deals || response?.data || [];
          
          if (Array.isArray(dealsData) && dealsData.length > 0) {
            setDeals(dealsData);
          } else {
            // Use demo data if API returns empty or invalid response
            setDeals(mockDeals);
          }
        } catch (apiError) {
          console.log('API call failed, using demo data:', apiError);
          // Use demo data when API fails
          setDeals(mockDeals);
        }
      } catch (err) {
        console.log('API call failed, using demo data:', err);
        // Use demo data when API fails
        setDeals(mockDeals);
        setError(null);
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
      
      // Handle different response structures
      const dealsData = response?.deals || response?.data?.deals || response?.data || [];
      
      if (Array.isArray(dealsData) && dealsData.length > 0) {
        setDeals(dealsData);
        setSnackbar({
          open: true,
          message: 'Deals updated successfully',
          severity: 'success'
        });
      } else {
        // Use demo data if API returns empty
        setDeals(mockDeals);
        setSnackbar({
          open: true,
          message: 'Using demo data',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Failed to refresh deals:', err);
      // Use demo data on error
      setDeals(mockDeals);
      setSnackbar({
        open: true,
        message: 'Using demo data - API unavailable',
        severity: 'warning'
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

      // Quick filter presets
      let matchesQuickFilter = true;
      if (quickFilter) {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const healthStatus = getDealHealthStatus(deal);
        
        switch (quickFilter) {
          case 'high-priority':
            matchesQuickFilter = deal.priority === 'high';
            break;
          case 'closing-this-week':
            if (deal.expectedCloseDate) {
              const closeDate = new Date(deal.expectedCloseDate);
              matchesQuickFilter = closeDate >= today && closeDate <= nextWeek;
            } else {
              matchesQuickFilter = false;
            }
            break;
          case 'needs-attention':
            matchesQuickFilter = healthStatus.status === 'stalled' || healthStatus.status === 'at-risk' || healthStatus.status === 'needs-attention';
            break;
          case 'high-value':
            matchesQuickFilter = (deal.value || 0) >= 5000000;
            break;
          default:
            matchesQuickFilter = true;
        }
      }

      return matchesSearch && matchesStage && matchesType && matchesPriority && matchesValue && matchesProbability && matchesQuickFilter;
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
  }, [deals, searchTerm, filterStage, filterType, filterPriority, valueRange, probabilityRange, sortBy, sortOrder, quickFilter]);

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
    setQuickFilter('');
    setSelectedDeals(new Set());
  };

  // Quick filter presets for common broker workflows
  const applyQuickFilter = (preset) => {
    setQuickFilter(preset);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    switch (preset) {
      case 'my-deals':
        // Filter by current user - would need auth context
        setFilterPriority('');
        setFilterStage('');
        break;
      case 'closing-this-week':
        setFilterStage('');
        setFilterPriority('');
        // Would filter by expectedCloseDate
        break;
      case 'high-priority':
        setFilterPriority('high');
        setFilterStage('');
        break;
      case 'needs-attention':
        setFilterPriority('');
        setFilterStage('');
        // Would filter by health status
        break;
      case 'high-value':
        setValueRange({ min: '5000000', max: '' });
        setFilterPriority('');
        setFilterStage('');
        break;
      default:
        clearFilters();
    }
  };

  // Quick stage change handler
  const handleQuickProbabilityChange = async (deal, newProbability) => {
    try {
      setDeals(prev => prev.map(d => 
        d.id === deal.id 
          ? { ...d, probability: newProbability, lastActivityDate: new Date().toISOString() }
          : d
      ));
      
      // Try to update via API
      await dealApi.updateDeal(deal.id, { 
        probability: newProbability,
        lastActivityDate: new Date().toISOString()
      }).catch(() => {});
      
      setSnackbar({
        open: true,
        message: `Updated probability to ${newProbability}%`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update probability',
        severity: 'error'
      });
    }
  };

  const handleQuickStageChange = async (deal, newStage) => {
    try {
      const updatedDeal = { ...deal, stage: newStage, lastActivityDate: new Date().toISOString() };
      setDeals(prev => prev.map(d => d.id === deal.id ? updatedDeal : d));
      
      try {
        await dealApi.updateDeal(deal.id, { stage: newStage });
      } catch (apiError) {
        // Silently fail in demo mode
      }
      
      setSnackbar({
        open: true,
        message: `Deal stage updated to ${DEAL_STAGES.find(s => s.id === newStage)?.name || newStage}`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update deal stage',
        severity: 'error'
      });
    }
  };

  // Export deals to CSV
  const handleExportDeals = () => {
    const headers = ['Deal Name', 'Property', 'Contact', 'Type', 'Stage', 'Value', 'Probability', 'Priority', 'Expected Close', 'Assigned To'];
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedDeals.map(deal => [
        `"${deal.name || ''}"`,
        `"${deal.property?.name || ''}"`,
        `"${deal.contact?.companyName || `${deal.contact?.firstName || ''} ${deal.contact?.lastName || ''}`.trim() || ''}"`,
        deal.type || '',
        deal.stage || '',
        deal.value || 0,
        deal.probability || 0,
        deal.priority || '',
        deal.expectedCloseDate || '',
        `${deal.assignedTo?.firstName || ''} ${deal.assignedTo?.lastName || ''}`.trim()
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `deals_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: `Exported ${filteredAndSortedDeals.length} deals to CSV`,
      severity: 'success'
    });
  };

  // Toggle deal selection
  const handleSelectDeal = (dealId) => {
    setSelectedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === paginatedDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(paginatedDeals.map(d => d.id)));
    }
  };

  // Bulk actions
  const handleBulkStageChange = async (newStage) => {
    const selectedIds = Array.from(selectedDeals);
    try {
      setDeals(prev => prev.map(d => 
        selectedIds.includes(d.id) 
          ? { ...d, stage: newStage, lastActivityDate: new Date().toISOString() }
          : d
      ));
      
      // Try to update via API
      await Promise.all(selectedIds.map(id => 
        dealApi.updateDeal(id, { stage: newStage }).catch(() => {})
      ));
      
      setSnackbar({
        open: true,
        message: `Updated ${selectedIds.length} deal(s) to ${DEAL_STAGES.find(s => s.id === newStage)?.name || newStage}`,
        severity: 'success'
      });
      setSelectedDeals(new Set());
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update deals',
        severity: 'error'
      });
    }
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
    const stage = DEAL_STAGES.find(s => s.id === stageId) || DEAL_STAGES[0];
    // Ensure backward compatibility - if old format, add new properties
    if (!stage.textColor) {
      stage.textColor = '#ffffff';
    }
    if (!stage.bgColor && stage.color) {
      // Use color as bgColor if bgColor doesn't exist
      stage.bgColor = stage.color;
    }
    return stage;
  };

  const getPriorityInfo = (priorityId) => {
    return DEAL_PRIORITIES.find(priority => priority.id === priorityId) || DEAL_PRIORITIES[0];
  };

  const getDealHealthStatus = (deal) => {
    if (!deal) {
      return { status: 'normal', color: theme.palette.info.main, icon: TrendingUp, text: 'On Track' };
    }
    
    const lastActivityDate = deal.lastActivityDate ? new Date(deal.lastActivityDate) : new Date();
    const expectedCloseDate = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null;
    
    const daysSinceActivity = Math.floor(
      (new Date() - lastActivityDate) / (1000 * 60 * 60 * 24)
    );
    const daysUntilClose = expectedCloseDate ? Math.floor(
      (expectedCloseDate - new Date()) / (1000 * 60 * 60 * 24)
    ) : Infinity;
    
    const probability = deal.probability || 0;

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

  // Keyboard shortcuts for broker workflow optimization
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when not typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      
      // Ctrl/Cmd + N for new deal
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/deals/new');
      }
      // Ctrl/Cmd + F for focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search deals"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      // Escape to clear selection
      if (e.key === 'Escape' && selectedDeals.size > 0) {
        setSelectedDeals(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDeals.size, navigate]);

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
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Deals & Opportunities
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selectedDeals.size > 0 && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Edit />}
              onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
            >
              Bulk Actions ({selectedDeals.size})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportDeals}
            disabled={filteredAndSortedDeals.length === 0}
          >
            Export
          </Button>
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
            <Chip 
              label="Ctrl+N" 
              size="small" 
              sx={{ 
                ml: 1, 
                height: 18, 
                fontSize: '0.625rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-label': { px: 0.75 }
              }} 
            />
          </Button>
        </Box>
      </Box>

      {/* Quick Filter Presets */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={quickFilter}
          onChange={(e, newValue) => applyQuickFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            label="All Deals" 
            value="" 
            icon={<Assessment />} 
            iconPosition="start"
          />
          <Tab 
            label="High Priority" 
            value="high-priority" 
            icon={<PriorityHigh />} 
            iconPosition="start"
          />
          <Tab 
            label="Closing This Week" 
            value="closing-this-week" 
            icon={<Today />} 
            iconPosition="start"
          />
          <Tab 
            label="Needs Attention" 
            value="needs-attention" 
            icon={<Warning />} 
            iconPosition="start"
          />
          <Tab 
            label="High Value" 
            value="high-value" 
            icon={<Star />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search deals... (Ctrl+F)"
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
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: 3, 
            borderRadius: 2, 
            maxHeight: { xs: 'calc(100vh - 450px)', md: 'calc(100vh - 400px)' }, 
            overflow: 'auto',
            '& .MuiTable-root': {
              display: { xs: 'none', md: 'table' }
            }
          }}
        >
          {/* Desktop Table View */}
          <Table stickyHeader size="small" sx={{ minWidth: { md: 1200, lg: 1400 }, display: { xs: 'none', md: 'table' } }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75, width: 48 }}>
                  <Checkbox
                    indeterminate={selectedDeals.size > 0 && selectedDeals.size < paginatedDeals.length}
                    checked={paginatedDeals.length > 0 && selectedDeals.size === paginatedDeals.length}
                    onChange={handleSelectAll}
                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                  />
                </TableCell>
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
                  <TableSortLabel
                    active={sortBy === 'lastActivityDate'}
                    direction={sortBy === 'lastActivityDate' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('lastActivityDate');
                      setSortOrder(sortBy === 'lastActivityDate' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                      Last Activity
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ backgroundColor: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.dark}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', fontSize: '0.813rem' }}>
                    Est. Commission
                  </Typography>
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
                if (!deal || !deal.id) return null;
                
                const stageInfo = getStageInfo(deal.stage || 'prospecting');
                const priorityInfo = getPriorityInfo(deal.priority || 'medium');
                const healthStatus = getDealHealthStatus(deal);
                const StageIconComponent = getStageIcon(deal.stage || 'prospecting');
                const PriorityIconComponent = getPriorityIcon(deal.priority || 'medium');
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
                    <TableCell padding="checkbox" sx={{ py: 0.75, width: 48 }}>
                      <Checkbox
                        checked={selectedDeals.has(deal.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectDeal(deal.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: { xs: 180, md: 220 }, py: 0.75 }}>
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
                      <Box
                        component="span"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deal.propertyId) {
                            navigate(`/properties/${deal.propertyId}`);
                          }
                        }}
                        sx={{
                          cursor: deal.propertyId ? 'pointer' : 'default',
                          '&:hover': {
                            '& .property-name': { textDecoration: 'underline', color: 'primary.main' }
                          }
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          className="property-name"
                          sx={{ 
                            fontWeight: 500, 
                            fontSize: '0.813rem', 
                            mb: 0.25,
                            transition: 'all 0.2s',
                            color: deal.propertyId ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {deal.property?.name || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
                          {deal.property?.address || '-'}
                        </Typography>
                      </Box>
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
                      <Select
                        value={deal.stage || 'prospecting'}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleQuickStageChange(deal, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{
                          minWidth: 140,
                          height: 32,
                          fontSize: '0.75rem',
                          backgroundColor: stageInfo.color || stageInfo.bgColor || '#e3f2fd',
                          color: stageInfo.textColor || '#1976d2',
                          fontWeight: 700,
                          borderRadius: 1,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          '& .MuiSelect-select': {
                            color: stageInfo.textColor || '#1976d2',
                            py: 0.75,
                            px: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: 'transparent'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: stageInfo.color || stageInfo.bgColor || '#e3f2fd',
                            borderWidth: 2
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: stageInfo.color || '#1976d2',
                            borderWidth: 2
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: stageInfo.color || '#1976d2',
                            borderWidth: 2
                          },
                          '& .MuiSvgIcon-root': {
                            color: stageInfo.textColor || '#1976d2',
                            fontSize: '1.2rem'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              mt: 0.5,
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              '& .MuiMenuItem-root': {
                                fontSize: '0.813rem',
                                py: 1,
                                px: 1.5,
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.04)'
                                }
                              }
                            }
                          }
                        }}
                      >
                        {DEAL_STAGES.filter(s => s.id !== 'closed_lost').map((stage) => {
                          const StageIcon = getStageIcon(stage.id);
                          const currentStageInfo = getStageInfo(stage.id);
                          return (
                            <MenuItem 
                              key={stage.id} 
                              value={stage.id}
                              sx={{
                                '&.Mui-selected': {
                                  backgroundColor: currentStageInfo.bgColor || currentStageInfo.color || '#e3f2fd',
                                  color: currentStageInfo.textColor || '#1976d2',
                                  fontWeight: 600,
                                  '&:hover': {
                                    backgroundColor: currentStageInfo.bgColor || currentStageInfo.color || '#e3f2fd'
                                  }
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: currentStageInfo.color || '#1976d2',
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {stage.name}
                                </Typography>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
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
                        {formatCurrency(deal.value || 0)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 130, py: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={deal.probability || 0}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProbabilityColor(deal.probability || 0),
                              borderRadius: 3
                            }
                          }}
                        />
                        <Select
                          value={deal.probability || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newProbability = parseInt(e.target.value);
                            handleQuickProbabilityChange(deal, newProbability);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                          sx={{
                            minWidth: 50,
                            height: 24,
                            fontSize: '0.688rem',
                            fontWeight: 600,
                            color: getProbabilityColor(deal.probability || 0),
                            '& .MuiSelect-select': {
                              py: 0.25,
                              px: 1
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'transparent'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: getProbabilityColor(deal.probability || 0)
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                mt: 0.5,
                                '& .MuiMenuItem-root': {
                                  fontSize: '0.813rem',
                                  py: 0.5
                                }
                              }
                            }
                          }}
                        >
                          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((prob) => (
                            <MenuItem key={prob} value={prob}>
                              {prob}%
                            </MenuItem>
                          ))}
                        </Select>
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
                      <Box>
                        <Typography variant="caption" sx={{ fontSize: '0.813rem', fontWeight: 500, display: 'block' }}>
                          {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '-'}
                        </Typography>
                        {deal.expectedCloseDate && (() => {
                          const daysUntil = Math.ceil((new Date(deal.expectedCloseDate) - new Date()) / (1000 * 60 * 60 * 24));
                          if (daysUntil < 0) {
                            return <Typography variant="caption" color="error.main" sx={{ fontSize: '0.625rem' }}>Overdue</Typography>;
                          } else if (daysUntil <= 7) {
                            return <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.625rem' }}>{daysUntil}d left</Typography>;
                          } else if (daysUntil <= 30) {
                            return <Typography variant="caption" color="info.main" sx={{ fontSize: '0.625rem' }}>{daysUntil}d left</Typography>;
                          }
                          return null;
                        })()}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontSize: '0.813rem', fontWeight: 500, display: 'block' }}>
                          {deal.lastActivityDate ? new Date(deal.lastActivityDate).toLocaleDateString() : '-'}
                        </Typography>
                        {deal.lastActivityDate && (() => {
                          const daysSince = Math.floor((new Date() - new Date(deal.lastActivityDate)) / (1000 * 60 * 60 * 24));
                          if (daysSince > 14) {
                            return <Typography variant="caption" color="error.main" sx={{ fontSize: '0.625rem' }}>{daysSince}d ago</Typography>;
                          } else if (daysSince > 7) {
                            return <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.625rem' }}>{daysSince}d ago</Typography>;
                          } else if (daysSince > 0) {
                            return <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem' }}>{daysSince}d ago</Typography>;
                          } else {
                            return <Typography variant="caption" color="success.main" sx={{ fontSize: '0.625rem' }}>Today</Typography>;
                          }
                        })()}
                      </Box>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.813rem',
                          color: 'success.main'
                        }}
                      >
                        {(() => {
                          // Use commission structure if available, otherwise estimate
                          if (deal.commissionStructure?.amount) {
                            const probability = deal.probability || 0;
                            // Calculate expected commission based on probability
                            return formatCurrency((deal.commissionStructure.amount * probability) / 100);
                          } else {
                            const value = deal.value || 0;
                            const probability = deal.probability || 0;
                            // Estimate commission at 3% of deal value
                            const estimatedCommission = (value * 0.03 * probability) / 100;
                            return formatCurrency(estimatedCommission);
                          }
                        })()}
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
                            {deal.assignedTo?.firstName || 'Unassigned'} {deal.assignedTo?.lastName || ''}
                          </Typography>
                          {deal.assignedTo?.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                              {deal.assignedTo.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 0.75 }}>
                      <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center', alignItems: 'center' }}>
                        <Tooltip title="Quick Note">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Quick note dialog would open here
                              setSnackbar({
                                open: true,
                                message: 'Quick note feature - click deal to add notes',
                                severity: 'info'
                              });
                            }}
                            sx={{
                              p: 0.5,
                              '&:hover': { backgroundColor: '#f3e5f5', color: 'secondary.main' }
                            }}
                          >
                            <Note sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
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
                        </Tooltip>
                        <Tooltip title="Edit Deal">
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
                        </Tooltip>
                        <Tooltip title="More Actions">
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
                        </Tooltip>
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
        <Divider />
        <MenuList>
          <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
            Change Stage
          </Typography>
          {DEAL_STAGES.filter(s => s.id !== 'closed_lost' && s.id !== menuAnchor.deal?.stage).map((stage) => {
            const StageIcon = getStageIcon(stage.id);
            return (
              <MenuItem 
                key={stage.id}
                onClick={() => {
                  if (menuAnchor.deal) {
                    handleQuickStageChange(menuAnchor.deal, stage.id);
                  }
                  handleMenuClose();
                }}
              >
                <ListItemIcon>
                  <StageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Move to {stage.name}</ListItemText>
              </MenuItem>
            );
          })}
        </MenuList>
        <Divider />
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

      {/* Bulk Actions Menu */}
      {selectedDeals.size > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 1.5,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: 2
          }}
        >
          <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>
            {selectedDeals.size} deal{selectedDeals.size > 1 ? 's' : ''} selected
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
          >
            Change Stage
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedDeals(new Set())}
          >
            Clear
          </Button>
        </Paper>
      )}

      {/* Bulk Stage Change Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        {DEAL_STAGES.filter(s => s.id !== 'closed_lost').map((stage) => {
          const StageIcon = getStageIcon(stage.id);
          return (
            <MenuItem
              key={stage.id}
              onClick={() => {
                handleBulkStageChange(stage.id);
                setBulkMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <StageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Move to {stage.name}</ListItemText>
            </MenuItem>
          );
        })}
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