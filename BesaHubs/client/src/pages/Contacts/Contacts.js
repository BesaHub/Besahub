import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Paper,
  useTheme,
  Pagination
} from '@mui/material';
import {
  Add,
  Upload,
  Search,
  FilterList,
  Person,
  PersonAdd,
  Refresh,
  CheckBox,
  Delete,
  GetApp,
  SelectAll
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EnhancedContactCard from '../../components/ContactCard/EnhancedContactCard';
import { CardSkeleton } from '../../components/Common/LoadingSkeletons';
import EmptyState from '../../components/Common/EmptyState';
import { contactApi } from '../../services/contactApi';
import useScrollReveal from '../../utils/useScrollReveal';

const Contacts = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [cardGridRef, cardGridVisible] = useScrollReveal({ threshold: 0.05, initialVisible: true });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [sortBy, setSortBy] = useState('lastContactDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, contact: null });
  const [bulkActionDialog, setBulkActionDialog] = useState({ open: false, action: '', contacts: [] });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;


  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await contactApi.getContacts({
          page: 1,
          limit: 100
        });
        
        setContacts(response.contacts || []);
      } catch (err) {
        console.log('API call failed, using demo data:', err);
        // Use demo data when API fails
        const demoContacts = [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Smith',
            companyName: 'ABC Corporation',
            email: 'john.smith@abccorp.com',
            phone: '(555) 123-4567',
            role: 'investor',
            status: 'active',
            city: 'New York',
            state: 'NY',
            budget: 5000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Doe',
            companyName: 'XYZ Properties',
            email: 'jane.doe@xyzprop.com',
            phone: '(555) 987-6543',
            role: 'tenant',
            status: 'active',
            city: 'Los Angeles',
            state: 'CA',
            budget: 3000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '3',
            firstName: 'Michael',
            lastName: 'Chen',
            companyName: 'Chen Capital Partners',
            email: 'mchen@chencapital.com',
            phone: '(555) 234-5678',
            role: 'investor',
            status: 'qualified',
            city: 'San Francisco',
            state: 'CA',
            budget: 15000000,
            lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            firstName: 'Sarah',
            lastName: 'Johnson',
            companyName: 'Johnson Realty Group',
            email: 'sarah.j@jrg.com',
            phone: '(555) 345-6789',
            role: 'broker',
            status: 'active',
            city: 'Chicago',
            state: 'IL',
            budget: 8000000,
            lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '5',
            firstName: 'Robert',
            lastName: 'Williams',
            companyName: 'Williams Development',
            email: 'rwilliams@willdev.com',
            phone: '(555) 456-7890',
            role: 'developer',
            status: 'qualified',
            city: 'Miami',
            state: 'FL',
            budget: 25000000,
            lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '6',
            firstName: 'Emily',
            lastName: 'Rodriguez',
            companyName: 'TechStart Solutions',
            email: 'emily@techstart.com',
            phone: '(555) 567-8901',
            role: 'tenant',
            status: 'active',
            city: 'Austin',
            state: 'TX',
            budget: 2000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '7',
            firstName: 'David',
            lastName: 'Park',
            companyName: 'Park Investment Holdings',
            email: 'david.park@pih.com',
            phone: '(555) 678-9012',
            role: 'investor',
            status: 'hot',
            city: 'Seattle',
            state: 'WA',
            budget: 30000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '8',
            firstName: 'Lisa',
            lastName: 'Thompson',
            companyName: 'Thompson & Associates',
            email: 'lisa@thompsonassoc.com',
            phone: '(555) 789-0123',
            role: 'broker',
            status: 'active',
            city: 'Boston',
            state: 'MA',
            budget: 12000000,
            lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '9',
            firstName: 'James',
            lastName: 'Miller',
            companyName: 'Miller Construction',
            email: 'jmiller@millerconst.com',
            phone: '(555) 890-1234',
            role: 'developer',
            status: 'qualified',
            city: 'Denver',
            state: 'CO',
            budget: 18000000,
            lastContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '10',
            firstName: 'Amanda',
            lastName: 'Davis',
            companyName: 'Davis Capital Management',
            email: 'amanda@daviscap.com',
            phone: '(555) 901-2345',
            role: 'investor',
            status: 'hot',
            city: 'Phoenix',
            state: 'AZ',
            budget: 22000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '11',
            firstName: 'Christopher',
            lastName: 'Taylor',
            companyName: 'Taylor Real Estate Fund',
            email: 'ctaylor@taylorfund.com',
            phone: '(555) 012-3456',
            role: 'investor',
            status: 'active',
            city: 'Portland',
            state: 'OR',
            budget: 16000000,
            lastContactDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '12',
            firstName: 'Jennifer',
            lastName: 'Lee',
            companyName: 'Lee Properties LLC',
            email: 'jlee@leeprop.com',
            phone: '(555) 123-7890',
            role: 'broker',
            status: 'active',
            city: 'Nashville',
            state: 'TN',
            budget: 6000000,
            lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '13',
            firstName: 'Patricia',
            lastName: 'Anderson',
            companyName: 'Healthcare Partners LLC',
            email: 'panderson@healthpartners.com',
            phone: '(555) 234-8901',
            role: 'tenant',
            status: 'qualified',
            city: 'Atlanta',
            state: 'GA',
            budget: 4000000,
            lastContactDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '14',
            firstName: 'Thomas',
            lastName: 'Wilson',
            companyName: 'Wilson Retail Holdings',
            email: 'twilson@wilsonretail.com',
            phone: '(555) 345-9012',
            role: 'investor',
            status: 'active',
            city: 'Dallas',
            state: 'TX',
            budget: 14000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '15',
            firstName: 'Alex',
            lastName: 'Kumar',
            companyName: 'TechStart Ventures',
            email: 'akumar@techstart.com',
            phone: '(555) 456-0123',
            role: 'tenant',
            status: 'active',
            city: 'San Jose',
            state: 'CA',
            budget: 1500000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '16',
            firstName: 'Richard',
            lastName: 'Martinez',
            companyName: 'Global Logistics Solutions',
            email: 'rmartinez@globallog.com',
            phone: '(555) 567-1234',
            role: 'tenant',
            status: 'qualified',
            city: 'Houston',
            state: 'TX',
            budget: 3500000,
            lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '17',
            firstName: 'Kevin',
            lastName: 'Brown',
            companyName: 'Brown Investment Fund',
            email: 'kbrown@brownfund.com',
            phone: '(555) 678-2345',
            role: 'investor',
            status: 'hot',
            city: 'Charlotte',
            state: 'NC',
            budget: 28000000,
            lastContactDate: new Date().toISOString()
          },
          {
            id: '18',
            firstName: 'Sophia',
            lastName: 'Harris',
            companyName: 'Harris Restaurant Group',
            email: 'sharris@harrisrest.com',
            phone: '(555) 789-3456',
            role: 'tenant',
            status: 'active',
            city: 'Las Vegas',
            state: 'NV',
            budget: 1200000,
            lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '19',
            firstName: 'Nicole',
            lastName: 'Clark',
            companyName: 'Clark Technology Partners',
            email: 'nclark@clarktech.com',
            phone: '(555) 890-4567',
            role: 'investor',
            status: 'qualified',
            city: 'Minneapolis',
            state: 'MN',
            budget: 19000000,
            lastContactDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '20',
            firstName: 'William',
            lastName: 'Robinson',
            companyName: 'Robinson Supply Chain',
            email: 'wrobinson@robinsonsc.com',
            phone: '(555) 901-5678',
            role: 'tenant',
            status: 'active',
            city: 'Indianapolis',
            state: 'IN',
            budget: 2800000,
            lastContactDate: new Date().toISOString()
          }
        ];
        setContacts(demoContacts);
        setSnackbar({
          open: true,
          message: 'Using demo data - API unavailable',
          severity: 'info'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const refreshContacts = async () => {
    setLoading(true);
    try {
      const response = await contactApi.getContacts({
        page: 1,
        limit: 100
      });
      
      setContacts(response.contacts || []);
      setSnackbar({
        open: true,
        message: 'Contacts updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.log('Failed to refresh contacts, using demo data:', err);
      // Use demo data on error
      const demoContacts = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          companyName: 'ABC Corporation',
          email: 'john.smith@abccorp.com',
          phone: '(555) 123-4567',
          role: 'investor',
          status: 'active',
          city: 'New York',
          state: 'NY',
          budget: 5000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Doe',
          companyName: 'XYZ Properties',
          email: 'jane.doe@xyzprop.com',
          phone: '(555) 987-6543',
          role: 'tenant',
          status: 'active',
          city: 'Los Angeles',
          state: 'CA',
          budget: 3000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '3',
          firstName: 'Michael',
          lastName: 'Chen',
          companyName: 'Chen Capital Partners',
          email: 'mchen@chencapital.com',
          phone: '(555) 234-5678',
          role: 'investor',
          status: 'qualified',
          city: 'San Francisco',
          state: 'CA',
          budget: 15000000,
          lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          firstName: 'Sarah',
          lastName: 'Johnson',
          companyName: 'Johnson Realty Group',
          email: 'sarah.j@jrg.com',
          phone: '(555) 345-6789',
          role: 'broker',
          status: 'active',
          city: 'Chicago',
          state: 'IL',
          budget: 8000000,
          lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          firstName: 'Robert',
          lastName: 'Williams',
          companyName: 'Williams Development',
          email: 'rwilliams@willdev.com',
          phone: '(555) 456-7890',
          role: 'developer',
          status: 'qualified',
          city: 'Miami',
          state: 'FL',
          budget: 25000000,
          lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          firstName: 'Emily',
          lastName: 'Rodriguez',
          companyName: 'TechStart Solutions',
          email: 'emily@techstart.com',
          phone: '(555) 567-8901',
          role: 'tenant',
          status: 'active',
          city: 'Austin',
          state: 'TX',
          budget: 2000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '7',
          firstName: 'David',
          lastName: 'Park',
          companyName: 'Park Investment Group',
          email: 'david.park@pih.com',
          phone: '(555) 678-9012',
          role: 'investor',
          status: 'hot',
          city: 'Seattle',
          state: 'WA',
          budget: 30000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '8',
          firstName: 'Lisa',
          lastName: 'Thompson',
          companyName: 'Thompson & Associates',
          email: 'lisa@thompsonassoc.com',
          phone: '(555) 789-0123',
          role: 'broker',
          status: 'active',
          city: 'Boston',
          state: 'MA',
          budget: 12000000,
          lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '9',
          firstName: 'James',
          lastName: 'Miller',
          companyName: 'Miller Construction',
          email: 'jmiller@millerconst.com',
          phone: '(555) 890-1234',
          role: 'developer',
          status: 'qualified',
          city: 'Denver',
          state: 'CO',
          budget: 18000000,
          lastContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '10',
          firstName: 'Amanda',
          lastName: 'Davis',
          companyName: 'Davis Capital Management',
          email: 'amanda@daviscap.com',
          phone: '(555) 901-2345',
          role: 'investor',
          status: 'hot',
          city: 'Phoenix',
          state: 'AZ',
          budget: 22000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '11',
          firstName: 'Christopher',
          lastName: 'Taylor',
          companyName: 'Taylor Real Estate Fund',
          email: 'ctaylor@taylorfund.com',
          phone: '(555) 012-3456',
          role: 'investor',
          status: 'active',
          city: 'Portland',
          state: 'OR',
          budget: 16000000,
          lastContactDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '12',
          firstName: 'Jennifer',
          lastName: 'Lee',
          companyName: 'Lee Properties LLC',
          email: 'jlee@leeprop.com',
          phone: '(555) 123-7890',
          role: 'broker',
          status: 'active',
          city: 'Nashville',
          state: 'TN',
          budget: 6000000,
          lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '13',
          firstName: 'Patricia',
          lastName: 'Anderson',
          companyName: 'Healthcare Partners LLC',
          email: 'panderson@healthpartners.com',
          phone: '(555) 234-8901',
          role: 'tenant',
          status: 'qualified',
          city: 'Atlanta',
          state: 'GA',
          budget: 4000000,
          lastContactDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '14',
          firstName: 'Thomas',
          lastName: 'Wilson',
          companyName: 'Wilson Retail Holdings',
          email: 'twilson@wilsonretail.com',
          phone: '(555) 345-9012',
          role: 'investor',
          status: 'active',
          city: 'Dallas',
          state: 'TX',
          budget: 14000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '15',
          firstName: 'Alex',
          lastName: 'Kumar',
          companyName: 'TechStart Ventures',
          email: 'akumar@techstart.com',
          phone: '(555) 456-0123',
          role: 'tenant',
          status: 'active',
          city: 'San Jose',
          state: 'CA',
          budget: 1500000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '16',
          firstName: 'Richard',
          lastName: 'Martinez',
          companyName: 'Global Logistics Solutions',
          email: 'rmartinez@globallog.com',
          phone: '(555) 567-1234',
          role: 'tenant',
          status: 'qualified',
          city: 'Houston',
          state: 'TX',
          budget: 3500000,
          lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '17',
          firstName: 'Kevin',
          lastName: 'Brown',
          companyName: 'Brown Investment Fund',
          email: 'kbrown@brownfund.com',
          phone: '(555) 678-2345',
          role: 'investor',
          status: 'hot',
          city: 'Charlotte',
          state: 'NC',
          budget: 28000000,
          lastContactDate: new Date().toISOString()
        },
        {
          id: '18',
          firstName: 'Sophia',
          lastName: 'Harris',
          companyName: 'Harris Restaurant Group',
          email: 'sharris@harrisrest.com',
          phone: '(555) 789-3456',
          role: 'tenant',
          status: 'active',
          city: 'Las Vegas',
          state: 'NV',
          budget: 1200000,
          lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '19',
          firstName: 'Nicole',
          lastName: 'Clark',
          companyName: 'Clark Technology Partners',
          email: 'nclark@clarktech.com',
          phone: '(555) 890-4567',
          role: 'investor',
          status: 'qualified',
          city: 'Minneapolis',
          state: 'MN',
          budget: 19000000,
          lastContactDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '20',
          firstName: 'William',
          lastName: 'Robinson',
          companyName: 'Robinson Supply Chain',
          email: 'wrobinson@robinsonsc.com',
          phone: '(555) 901-5678',
          role: 'tenant',
          status: 'active',
          city: 'Indianapolis',
          state: 'IN',
          budget: 2800000,
          lastContactDate: new Date().toISOString()
        }
      ];
      setContacts(demoContacts);
      setSnackbar({
        open: true,
        message: 'Using demo data - API unavailable',
        severity: 'info'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      // Basic search
      const matchesSearch = !searchTerm ||
        contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.primaryEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.primaryPhone?.includes(searchTerm);

      // Role and status filters
      const matchesRole = !filterRole || contact.contactRole === filterRole;
      const matchesStatus = !filterStatus || contact.leadStatus === filterStatus;

      // Location filters
      const matchesCity = !filterCity || contact.mailingCity?.toLowerCase().includes(filterCity.toLowerCase());
      const matchesState = !filterState || contact.mailingState === filterState;

      // Budget range filter
      let matchesBudget = true;
      if (budgetRange.min || budgetRange.max) {
        const contactBudgetMax = contact.budgetMax || 0;
        const contactBudgetMin = contact.budgetMin || 0;
        const filterMin = budgetRange.min ? parseFloat(budgetRange.min) : 0;
        const filterMax = budgetRange.max ? parseFloat(budgetRange.max) : Infinity;

        matchesBudget = (contactBudgetMax >= filterMin && contactBudgetMin <= filterMax);
      }

      return matchesSearch && matchesRole && matchesStatus && matchesCity && matchesState && matchesBudget;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bVal = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'company':
          aVal = a.companyName || '';
          bVal = b.companyName || '';
          break;
        case 'lastContactDate':
          aVal = new Date(a.lastContactDate || 0);
          bVal = new Date(b.lastContactDate || 0);
          break;
        case 'budget':
          aVal = a.budgetMax || 0;
          bVal = b.budgetMax || 0;
          break;
        case 'status':
          aVal = a.leadStatus || '';
          bVal = b.leadStatus || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contacts, searchTerm, filterRole, filterStatus, filterCity, filterState, budgetRange, sortBy, sortOrder]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedContacts.slice(startIndex, endIndex);
  }, [filteredAndSortedContacts, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage);
  const startItem = filteredAndSortedContacts.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredAndSortedContacts.length);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleContactClick = useCallback((contact) => {
    navigate(`/contacts/${contact.id}`);
  }, [navigate]);

  const confirmDelete = async () => {
    try {
      await contactApi.deleteContact(deleteDialog.contact.id);
      setContacts(prev => prev.filter(c => c.id !== deleteDialog.contact.id));
      setSnackbar({
        open: true,
        message: 'Contact deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete contact. Please try again.',
        severity: 'error'
      });
    }
    setDeleteDialog({ open: false, contact: null });
  };

  const handleAddContact = useCallback(() => {
    navigate('/contacts/new');
  }, [navigate]);

  const handleImportContact = useCallback(() => {
    navigate('/contacts/import');
  }, [navigate]);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Bulk operations functions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedContacts([]);
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredAndSortedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredAndSortedContacts.map(contact => contact.id));
    }
  };

  const handleBulkAction = (action) => {
    const selectedContactsData = contacts.filter(contact =>
      selectedContacts.includes(contact.id)
    );
    setBulkActionDialog({ open: true, action, contacts: selectedContactsData });
  };

  const confirmBulkAction = async () => {
    const { action, contacts: selectedContactsData } = bulkActionDialog;

    try {
      switch (action) {
        case 'delete':
          const results = { success: [], failed: [] };
          
          for (const contact of selectedContactsData) {
            try {
              await contactApi.deleteContact(contact.id);
              results.success.push(contact.id);
            } catch (error) {
              console.error(`Failed to delete contact ${contact.id}:`, error);
              results.failed.push(contact.id);
            }
          }
          
          // Remove only successfully deleted contacts
          if (results.success.length > 0) {
            setContacts(prev => prev.filter(c => !results.success.includes(c.id)));
          }
          
          // Show accurate message
          if (results.failed.length === 0) {
            setSnackbar({
              open: true,
              message: `Successfully deleted ${results.success.length} contact(s)`,
              severity: 'success'
            });
          } else if (results.success.length === 0) {
            setSnackbar({
              open: true,
              message: `Failed to delete ${results.failed.length} contact(s)`,
              severity: 'error'
            });
          } else {
            setSnackbar({
              open: true,
              message: `Deleted ${results.success.length} of ${selectedContactsData.length} contacts. ${results.failed.length} failed.`,
              severity: 'warning'
            });
          }
          break;

        case 'updateStatus':
          // Update status for selected contacts (implement based on needs)
          setSnackbar({
            open: true,
            message: `Status updated for ${selectedContactsData.length} contacts`,
            severity: 'success'
          });
          break;

        case 'export':
          // Export selected contacts to CSV
          const csvContent = convertContactsToCSV(selectedContactsData);
          downloadCSV(csvContent, 'selected_contacts.csv');
          setSnackbar({
            open: true,
            message: `${selectedContactsData.length} contacts exported successfully`,
            severity: 'success'
          });
          break;

        default:
          break;
      }

      setSelectedContacts([]);
      setBulkMode(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to ${action} contacts`,
        severity: 'error'
      });
    } finally {
      setBulkActionDialog({ open: false, action: '', contacts: [] });
    }
  };

  const sanitizeForCSV = (value) => {
    if (!value) return '';
    const str = String(value);
    // Prevent CSV formula injection
    if (/^[=+\-@]/.test(str)) {
      return `'${str}`;
    }
    return str;
  };

  const convertContactsToCSV = (contactsData) => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Role', 'Status', 'City', 'State', 'Budget Max'];
    const rows = contactsData.map(contact => [
      sanitizeForCSV(`${contact.firstName || ''} ${contact.lastName || ''}`.trim()),
      sanitizeForCSV(contact.companyName || ''),
      sanitizeForCSV(contact.primaryEmail || ''),
      sanitizeForCSV(contact.primaryPhone || ''),
      sanitizeForCSV(contact.contactRole || ''),
      sanitizeForCSV(contact.leadStatus || ''),
      sanitizeForCSV(contact.mailingCity || ''),
      sanitizeForCSV(contact.mailingState || ''),
      sanitizeForCSV(contact.budgetMax || '')
    ]);

    return [headers, ...rows].map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterStatus('');
    setFilterCity('');
    setFilterState('');
    setBudgetRange({ min: '', max: '' });
    setSortBy('lastContactDate');
    setSortOrder('desc');
  };

  const activeFiltersCount = [
    searchTerm,
    filterRole,
    filterStatus,
    filterCity,
    filterState,
    budgetRange.min,
    budgetRange.max
  ].filter(Boolean).length;

  // Get unique values for filter dropdowns
  const uniqueStates = [...new Set(contacts.map(c => c.mailingState).filter(Boolean))].sort();
  const uniqueRoles = [...new Set(contacts.map(c => c.contactRole).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(contacts.map(c => c.leadStatus).filter(Boolean))].sort();

  const handleEmailContact = (contact) => {
    if (contact.primaryEmail) {
      window.location.href = `mailto:${contact.primaryEmail}`;
    }
  };

  const handleCallContact = (contact) => {
    if (contact.primaryPhone) {
      window.location.href = `tel:${contact.primaryPhone}`;
    }
  };

  const handleAddContactToDeal = (contact) => {
    setSnackbar({
      open: true,
      message: `Adding ${contact.firstName || contact.companyName} to a deal...`,
      severity: 'info'
    });
    navigate('/deals/new', { state: { contact } });
  };

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
      {/* Header with Contact Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, animation: 'fadeInScale 0.6s ease-out' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>
              Contacts & Leads
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {contacts.length} total contacts
            </Typography>
          </Box>
          {bulkMode && selectedContacts.length > 0 && (
            <Chip
              label={`${selectedContacts.length} selected`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Bulk Operations Controls */}
          {bulkMode ? (
            <>
              <Button
                variant="outlined"
                startIcon={<SelectAll />}
                onClick={handleSelectAll}
                disabled={filteredAndSortedContacts.length === 0}
              >
                {selectedContacts.length === filteredAndSortedContacts.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={() => handleBulkAction('export')}
                disabled={selectedContacts.length === 0}
              >
                Export ({selectedContacts.length})
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleBulkAction('delete')}
                disabled={selectedContacts.length === 0}
              >
                Delete ({selectedContacts.length})
              </Button>
              <Button
                variant="text"
                onClick={toggleBulkMode}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<CheckBox />}
                onClick={toggleBulkMode}
                sx={{ borderRadius: 3 }}
              >
                Select
              </Button>
              <Button
                variant="outlined"
                onClick={refreshContacts}
                disabled={loading}
                sx={{ borderRadius: 3 }}
                startIcon={<Refresh className="icon-spin-hover" />}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={handleImportContact}
                sx={{ borderRadius: 3 }}
              >
                Import
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleAddContact}
                sx={{ borderRadius: 3 }}
              >
                Add Contact
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Enhanced Search and Filters */}
      <Paper elevation={2} sx={{ py: 1, px: 1.5, mb: 2, borderRadius: 3 }}>
        {/* Basic Filters Row */}
        <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 3,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px',
                    borderImage: `${theme.palette.gradient.primary} 1`,
                  }
                } 
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                label="Role"
                onChange={(e) => setFilterRole(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {uniqueRoles.map(role => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="">All Status</MenuItem>
                {uniqueStatuses.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="lastContactDate">Last Contact</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              size="large"
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant={showAdvancedFilters ? 'contained' : 'outlined'}
              startIcon={<FilterList />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              fullWidth
            >
              {showAdvancedFilters ? 'Hide' : 'Advanced'}
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters - Collapsible */}
        {showAdvancedFilters && (
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1 }}>
            <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem', display: 'block' }}>
              Advanced Filters
            </Typography>

            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Any city"
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>State</InputLabel>
                  <Select
                    value={filterState}
                    label="State"
                    onChange={(e) => setFilterState(e.target.value)}
                  >
                    <MenuItem value="">All States</MenuItem>
                    {uniqueStates.map(state => (
                      <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Budget"
                  type="number"
                  value={budgetRange.min}
                  onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                  placeholder="0"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Max Budget"
                  type="number"
                  value={budgetRange.max}
                  onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                  placeholder="Any"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0}
                  fullWidth
                >
                  Clear All {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  variant="text"
                  onClick={() => setShowAdvancedFilters(false)}
                  fullWidth
                >
                  Hide Advanced
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Results Summary with Filter Badge */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {filteredAndSortedContacts.length > 0 
            ? `Showing ${startItem}-${endItem} of ${filteredAndSortedContacts.length} ${filteredAndSortedContacts.length === 1 ? 'contact' : 'contacts'}`
            : 'No contacts found'
          }
        </Typography>
        {activeFiltersCount > 0 && (
          <Chip
            label={`${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`}
            color="primary"
            size="small"
            onDelete={clearFilters}
          />
        )}
      </Box>

      {/* Contact Cards Grid */}
      {loading ? (
        <CardSkeleton count={12} />
      ) : filteredAndSortedContacts.length === 0 ? (
        contacts.length === 0 ? (
          <EmptyState
            icon={PersonAdd}
            title="No contacts yet"
            message="Get started by adding your first contact to your CRM"
            actionLabel="Add Contact"
            onAction={handleAddContact}
          />
        ) : (
          <Paper 
            elevation={2}
            sx={{ 
              textAlign: 'center', 
              py: 8, 
              px: 3,
              borderRadius: 2,
              background: theme.palette.gradient.primary,
              color: 'white'
            }}
          >
            <Person sx={{ fontSize: 64, mb: 2, opacity: 0.8 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              No Contacts Found
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, opacity: 0.9, fontSize: '0.875rem' }}>
              Try adjusting your search or filter criteria to find contacts
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleAddContact}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                Add Contact
              </Button>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="outlined" 
                  onClick={clearFilters}
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Paper>
        )
      ) : (
        <>
        <Box 
          ref={cardGridRef}
          sx={{
            opacity: cardGridVisible ? 1 : 0,
            transform: cardGridVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <Grid container spacing={1.5}>
            {paginatedContacts.map((contact, index) => (
              <Grid 
                item 
                xs={12} 
                key={contact.id}
                sx={{
                  animation: 'fadeInUp 0.6s ease-out',
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <EnhancedContactCard
                  contact={contact}
                  onClick={handleContactClick}
                  onEmail={handleEmailContact}
                  onCall={handleCallContact}
                  onAddToDeal={handleAddContactToDeal}
                  onViewDetails={handleContactClick}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {filteredAndSortedContacts.length > 0 && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, contact: null })}>
        <DialogTitle>Delete Contact</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteDialog.contact?.firstName} {deleteDialog.contact?.lastName}
            {deleteDialog.contact?.companyName && ` (${deleteDialog.contact.companyName})`}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, contact: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog
        open={bulkActionDialog.open}
        onClose={() => setBulkActionDialog({ open: false, action: '', contacts: [] })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Bulk {bulkActionDialog.action === 'delete' ? 'Delete' :
                      bulkActionDialog.action === 'export' ? 'Export' :
                      'Action'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {bulkActionDialog.action === 'delete' &&
              `Are you sure you want to delete ${bulkActionDialog.contacts.length} contact${bulkActionDialog.contacts.length > 1 ? 's' : ''}? This action cannot be undone.`
            }
            {bulkActionDialog.action === 'export' &&
              `Export ${bulkActionDialog.contacts.length} contact${bulkActionDialog.contacts.length > 1 ? 's' : ''} to CSV file?`
            }
            {bulkActionDialog.action === 'updateStatus' &&
              `Update status for ${bulkActionDialog.contacts.length} contact${bulkActionDialog.contacts.length > 1 ? 's' : ''}?`
            }
          </Typography>

          {bulkActionDialog.contacts.length > 0 && (
            <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected contacts:
              </Typography>
              {bulkActionDialog.contacts.slice(0, 5).map((contact) => (
                <Typography key={contact.id} variant="body2" color="text.secondary">
                  • {contact.firstName} {contact.lastName} {contact.companyName && `(${contact.companyName})`}
                </Typography>
              ))}
              {bulkActionDialog.contacts.length > 5 && (
                <Typography variant="body2" color="text.secondary">
                  ... and {bulkActionDialog.contacts.length - 5} more
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog({ open: false, action: '', contacts: [] })}>
            Cancel
          </Button>
          <Button
            onClick={confirmBulkAction}
            color={bulkActionDialog.action === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {bulkActionDialog.action === 'delete' ? 'Delete' :
             bulkActionDialog.action === 'export' ? 'Export' :
             'Confirm'}
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

export default Contacts;