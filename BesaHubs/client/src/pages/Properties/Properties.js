import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Alert,
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
  Skeleton,
  Tooltip,
  useTheme,
  Pagination,
  Checkbox,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Search,
  Add,
  Upload,
  LocationOn,
  Edit,
  Refresh,
  SquareFoot,
  Clear,
  Sort,
  FilterList,
  Share,
  Star,
  TrendingUp,
  AccessTime,
  Visibility,
  FavoriteBorder,
  ViewModule,
  ViewList,
  HomeWork,
  Business,
  CheckBox,
  CheckBoxOutlineBlank,
  Person,
  Close
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { propertyApi } from '../../services/propertyApi';
import useScrollReveal from '../../utils/useScrollReveal';
import { CardSkeleton, TableSkeleton } from '../../components/Common/LoadingSkeletons';
import EmptyState from '../../components/Common/EmptyState';
import SavedViews from '../../components/Properties/SavedViews';
import { useAuth } from '../../contexts/AuthContext';

const Properties = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cardGridRef, cardGridVisible] = useScrollReveal({ threshold: 0.05, initialVisible: true });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, property: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedViewId, setSelectedViewId] = useState('all');
  const [viewFilters, setViewFilters] = useState({});
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const itemsPerPage = 12;

  const LOCAL_KEY = 'dev_properties_cache';

  // Clear cache in development mode to avoid conflicts with sample data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem(LOCAL_KEY);
    }
  }, []);

  const readLocalCache = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  const writeLocalCache = (list) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch (_) {}
  };

  const mergeServerAndLocal = (serverList) => {
    // In development mode, just use server data to avoid cache conflicts
    if (process.env.NODE_ENV === 'development') {
      return serverList;
    }
    
    const localList = readLocalCache();
    const byId = new Map(serverList.map(p => [String(p.id), p]));
    for (const lp of localList) {
      if (!byId.has(String(lp.id))) byId.set(String(lp.id), lp);
    }
    return Array.from(byId.values())
      .sort((a, b) => (new Date(b.updatedAt || b.createdAt || 0)) - (new Date(a.updatedAt || a.createdAt || 0)));
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await propertyApi.getProperties({
          page: 1,
          limit: 100
        });
        
        const list = response?.properties || [];
        let merged = mergeServerAndLocal(list);
        
        // ========================================
        // TESTING ONLY: Hardcoded sample properties
        // TODO: Remove this seed data before production
        // ========================================
        const sampleProperties = [
          // 1. Fully complete office property - Active lease listing
          {
            id: 'sample-property-001',
            name: 'Downtown Financial Plaza',
            propertyType: 'office',
            city: 'Los Angeles',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'active',
            marketingStatus: 'actively_marketing',
            address: '1200 Wilshire Boulevard',
            zipCode: '90017',
            county: 'Los Angeles',
            totalSquareFootage: 45000,
            availableSquareFootage: 12000,
            buildingClass: 'A',
            yearBuilt: 2018,
            floors: 12,
            parkingSpaces: 180,
            parkingRatio: 4,
            leaseRate: 42.50,
            leaseRateUnit: 'per_sqft_annual',
            description: 'Premium Class A office building in the heart of downtown LA. Modern amenities, stunning views, and excellent accessibility.',
            highlights: 'Floor-to-ceiling windows, state-of-the-art HVAC, on-site parking garage, rooftop terrace',
            amenities: ['Concierge', 'Fitness Center', 'Conference Rooms', 'Rooftop Deck', 'EV Charging'],
            keyFeatures: ['LEED Certified', '24/7 Security', 'High-Speed Elevators', 'Fiber Internet Ready'],
            images: [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [
              { name: 'Property Flyer.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'Property Flyer.pdf' },
              { name: 'Floor Plans.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'Floor Plans.pdf' }
            ],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 2. Retail property - For sale, actively marketing
          {
            id: 'sample-property-002',
            name: 'Coastal Shopping Center',
            propertyType: 'retail',
            city: 'San Diego',
            state: 'CA',
            listingType: 'sale',
            propertyStatus: 'active',
            marketingStatus: 'actively_marketing',
            address: '2450 Pacific Coast Highway',
            zipCode: '92101',
            totalSquareFootage: 28000,
            availableSquareFootage: 28000,
            buildingClass: 'B',
            yearBuilt: 2005,
            parkingSpaces: 120,
            listPrice: 8500000,
            capRate: 0.065,
            netOperatingIncome: 552500,
            description: 'Prime retail center with excellent visibility and high foot traffic. Fully leased with strong tenant mix.',
            amenities: ['Parking Lot', 'Loading Docks', 'Signage Rights'],
            keyFeatures: ['High Traffic Location', 'Long-Term Tenants', 'Triple Net Lease'],
            images: [
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [
              { name: 'Offering Memorandum.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'Offering Memorandum.pdf' }
            ],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 3. Industrial warehouse - Under LOI
          {
            id: 'sample-property-003',
            name: 'Riverside Distribution Center',
            propertyType: 'industrial',
            city: 'Riverside',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'under_loi',
            marketingStatus: 'under_loi',
            address: '1850 Industrial Way',
            zipCode: '92507',
            totalSquareFootage: 125000,
            availableSquareFootage: 125000,
            buildingClass: 'A',
            yearBuilt: 2020,
            ceilingHeight: 32,
            clearHeight: 30,
            loadingDocks: 12,
            driveInDoors: 4,
            parkingSpaces: 50,
            leaseRate: 0.85,
            leaseRateUnit: 'per_sqft_monthly',
            description: 'State-of-the-art distribution facility with high ceilings, multiple loading docks, and excellent freeway access.',
            highlights: 'Rail access available, ESFR sprinkler system, 50-foot truck courts',
            amenities: ['Rail Access', 'ESFR Sprinklers', 'Office Space', 'Employee Parking'],
            keyFeatures: ['Cross-Dock Configuration', 'High Clearance', 'Truck Courts'],
            images: [
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 4. Office building - Draft status (minimal data)
          {
            id: 'sample-property-004',
            name: 'Midtown Business Center',
            propertyType: 'office',
            city: 'San Francisco',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'active',
            marketingStatus: 'draft',
            address: '500 Market Street',
            zipCode: '94102',
            totalSquareFootage: 25000,
            amenities: [],
            keyFeatures: [],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 5. Retail strip mall - Off market
          {
            id: 'sample-property-005',
            name: 'Sunset Strip Plaza',
            propertyType: 'retail',
            city: 'Los Angeles',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'off_market',
            marketingStatus: 'off_market',
            address: '7800 Sunset Boulevard',
            zipCode: '90046',
            totalSquareFootage: 15000,
            availableSquareFootage: 3500,
            buildingClass: 'C',
            yearBuilt: 1995,
            parkingSpaces: 45,
            leaseRate: 28.00,
            leaseRateUnit: 'per_sqft_annual',
            description: 'Well-located strip center with established tenants. One unit available for lease.',
            amenities: [],
            keyFeatures: [],
            keyHighlights: [],
            images: [
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [],
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          // 6. Industrial flex space - Sold/Leased
          {
            id: 'sample-property-006',
            name: 'Commerce Industrial Park',
            propertyType: 'industrial',
            city: 'Commerce',
            state: 'CA',
            listingType: 'sale',
            propertyStatus: 'sold_leased',
            marketingStatus: 'closed',
            transactionStatus: 'closed',
            address: '5900 Eastern Avenue',
            zipCode: '90040',
            totalSquareFootage: 75000,
            buildingClass: 'B',
            yearBuilt: 2010,
            ceilingHeight: 24,
            loadingDocks: 6,
            parkingSpaces: 30,
            finalSalePrice: 11250000,
            dateSoldLeased: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            buyerTenantName: 'ABC Logistics Inc.',
            description: 'Modern industrial facility sold to logistics company. Transaction closed successfully.',
            amenities: [],
            keyFeatures: [],
            keyHighlights: [],
            images: [
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [],
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          // 7. Office building - Partial data
          {
            id: 'sample-property-007',
            name: 'Tech Campus Building 3',
            propertyType: 'office',
            city: 'Palo Alto',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'active',
            marketingStatus: 'actively_marketing',
            address: '3200 Hillview Avenue',
            zipCode: '94304',
            totalSquareFootage: 85000,
            availableSquareFootage: 20000,
            buildingClass: 'A',
            yearBuilt: 2015,
            floors: 8,
            parkingSpaces: 300,
            leaseRate: 55.00,
            leaseRateUnit: 'per_sqft_annual',
            description: 'Premium tech campus building with modern amenities and flexible floor plans.',
            amenities: ['Cafeteria', 'Gym', 'Bike Storage', 'Showers'],
            keyFeatures: ['Tech-Ready', 'Fiber Internet', 'Conference Facilities'],
            images: [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [
              { name: 'Building Specifications.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'Building Specifications.pdf' }
            ],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 8. Retail property - Minimal data, draft
          {
            id: 'sample-property-008',
            name: 'Corner Retail Space',
            propertyType: 'retail',
            city: 'Santa Monica',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'active',
            marketingStatus: 'draft',
            address: '1400 3rd Street Promenade',
            zipCode: '90401',
            totalSquareFootage: 2500,
            amenities: [],
            keyFeatures: [],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 9. Industrial warehouse - Complete data, active
          {
            id: 'sample-property-009',
            name: 'Long Beach Port Warehouse',
            propertyType: 'industrial',
            city: 'Long Beach',
            state: 'CA',
            listingType: 'lease',
            propertyStatus: 'active',
            marketingStatus: 'actively_marketing',
            address: '2200 Pier A Avenue',
            zipCode: '90802',
            totalSquareFootage: 200000,
            availableSquareFootage: 50000,
            buildingClass: 'A',
            yearBuilt: 2018,
            ceilingHeight: 36,
            clearHeight: 34,
            loadingDocks: 20,
            driveInDoors: 8,
            parkingSpaces: 100,
            leaseRate: 0.95,
            leaseRateUnit: 'per_sqft_monthly',
            description: 'Port-adjacent warehouse facility with direct access to shipping terminals. Ideal for import/export operations.',
            highlights: 'Port access, container yard, customs bonded area available',
            amenities: ['Port Access', 'Container Yard', 'Office Space', 'Security Fencing'],
            keyFeatures: ['Port Proximity', 'High Clearance', 'Multiple Docks', 'Rail Access'],
            images: [
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [
              { name: 'Site Plan.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'Site Plan.pdf' },
              { name: 'Lease Terms.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'Lease Terms.pdf' }
            ],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          // 10. Office building - Under LOI, partial data
          {
            id: 'sample-property-010',
            name: 'Beverly Hills Executive Suites',
            propertyType: 'office',
            city: 'Beverly Hills',
            state: 'CA',
            listingType: 'sale',
            propertyStatus: 'under_loi',
            marketingStatus: 'under_loi',
            address: '9500 Wilshire Boulevard',
            zipCode: '90212',
            totalSquareFootage: 18000,
            buildingClass: 'A',
            yearBuilt: 2012,
            floors: 5,
            listPrice: 12500000,
            capRate: 0.055,
            description: 'Luxury office building in prestigious Beverly Hills location. Currently under LOI.',
            amenities: ['Valet Parking', 'Concierge', 'Private Elevators'],
            keyFeatures: ['Prime Location', 'Luxury Finish', 'High-End Tenants'],
            images: [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80'
            ],
            documents: [
              { name: 'LOI.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'LOI.pdf' }
            ],
            keyHighlights: [],
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        // Add sample properties that don't already exist
        const existingSampleIds = new Set(merged.map(p => String(p.id)));
        const newSamples = sampleProperties.filter(sp => !existingSampleIds.has(String(sp.id)));
        if (newSamples.length > 0) {
          merged = [...newSamples, ...merged];
          // Save sample properties to cache so they can be loaded in PropertyDetail and PropertyForm
          writeLocalCache(merged);
        }
        
        // If navigated from create/edit with a property, upsert it
        const maybeNew = location.state?.newProperty;
        if (maybeNew) {
          const existingIdx = merged.findIndex(p => String(p.id) === String(maybeNew.id));
          if (existingIdx >= 0) {
            merged[existingIdx] = { ...merged[existingIdx], ...maybeNew };
          } else {
            merged = [maybeNew, ...merged];
          }
          writeLocalCache(merged);
        }
        setProperties(merged);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setProperties([]);
        setSnackbar({
          open: true,
          message: 'Failed to load properties. Please try again.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [location.state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const refreshProperties = async () => {
    setLoading(true);
    try {
      const response = await propertyApi.getProperties({
        page: 1,
        limit: 100
      });
      const merged = mergeServerAndLocal(response.properties || []);
      setProperties(merged);
      setSnackbar({
        open: true,
        message: 'Properties updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to refresh properties:', err);
      setProperties([]);
      setSnackbar({
        open: true,
        message: 'Failed to refresh properties. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = useCallback(async (property) => {
    try {
      try {
        await propertyApi.deleteProperty(property.id);
      } catch (apiError) {
        // API delete failed, removing from local state
      }
      
      setProperties(prev => prev.filter(p => p.id !== property.id));
      // also remove from cache
      writeLocalCache(readLocalCache().filter(p => String(p.id) !== String(property.id)));
      setSnackbar({
        open: true,
        message: 'Property deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete property',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, property: null });
    }
  }, []);

  const handleViewDetails = useCallback((property, event) => {
    event?.stopPropagation();
    navigate(`/properties/${property.id}`);
  }, [navigate]);

  const handleEditProperty = useCallback((property, event) => {
    event?.stopPropagation();
    navigate(`/properties/${property.id}/edit`);
  }, [navigate]);

  const handleShareProperty = useCallback(async (property, event) => {
    event?.stopPropagation();
    try {
      const url = `${window.location.origin}/properties/${property.id}`;
      await navigator.clipboard.writeText(url);
      setSnackbar({
        open: true,
        message: 'Property link copied to clipboard!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to copy link',
        severity: 'error'
      });
    }
  }, []);

  const handleAddProperty = useCallback(() => {
    navigate('/properties/new');
  }, [navigate]);

  const handleImportProperty = useCallback(() => {
    navigate('/properties/import');
  }, [navigate]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedType('');
    setSelectedStatus('');
    setSearchTerm('');
    setViewFilters({});
    setSelectedViewId('all');
  }, []);

  const handleSelectProperty = useCallback((propertyId, event) => {
    event?.stopPropagation();
    setSelectedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  }, []);


  const handleBulkStatusChange = useCallback(async (newStatus) => {
    const propertyIds = Array.from(selectedProperties);
    if (propertyIds.length === 0) return;

    try {
      // Update properties in state
      setProperties(prev => prev.map(property => 
        selectedProperties.has(property.id)
          ? { ...property, propertyStatus: newStatus }
          : property
      ));

      // Update local cache
      const cached = readLocalCache();
      const updatedCache = cached.map(property =>
        selectedProperties.has(property.id)
          ? { ...property, propertyStatus: newStatus, updatedAt: new Date().toISOString() }
          : property
      );
      writeLocalCache(updatedCache);

      // Try to update via API (fail silently if API not available)
      try {
        await Promise.all(propertyIds.map(id => 
          propertyApi.updateProperty(id, { propertyStatus: newStatus })
        ));
      } catch (apiError) {
        console.log('Bulk status update - API not available, using local update');
      }

      const statusLabels = {
        active: 'Active',
        under_loi: 'Under LOI',
        off_market: 'Off Market',
        sold_leased: 'Sold / Leased'
      };
      const statusLabel = statusLabels[newStatus] || newStatus;
      setSnackbar({
        open: true,
        message: `Updated ${propertyIds.length} ${propertyIds.length === 1 ? 'property' : 'properties'} to ${statusLabel}`,
        severity: 'success'
      });

      setSelectedProperties(new Set());
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update properties',
        severity: 'error'
      });
    }
  }, [selectedProperties]);

  const handleBulkBrokerAssignment = useCallback(async (brokerInfo) => {
    const propertyIds = Array.from(selectedProperties);
    if (propertyIds.length === 0) return;

    try {
      // Update properties in state
      setProperties(prev => prev.map(property => 
        selectedProperties.has(property.id)
          ? { 
              ...property, 
              listingAgent: brokerInfo.name || brokerInfo.email || user?.email || '',
              listingAgentId: brokerInfo.id || user?.id || null,
              listingAgentEmail: brokerInfo.email || user?.email || '',
              updatedAt: new Date().toISOString()
            }
          : property
      ));

      // Update local cache
      const cached = readLocalCache();
      const updatedCache = cached.map(property =>
        selectedProperties.has(property.id)
          ? { 
              ...property, 
              listingAgent: brokerInfo.name || brokerInfo.email || user?.email || '',
              listingAgentId: brokerInfo.id || user?.id || null,
              listingAgentEmail: brokerInfo.email || user?.email || '',
              updatedAt: new Date().toISOString()
            }
          : property
      );
      writeLocalCache(updatedCache);

      // Try to update via API (fail silently if API not available)
      try {
        await Promise.all(propertyIds.map(id => 
          propertyApi.updateProperty(id, { 
            listingAgent: brokerInfo.name || brokerInfo.email || user?.email || '',
            listingAgentId: brokerInfo.id || user?.id || null
          })
        ));
      } catch (apiError) {
        console.log('Bulk broker assignment - API not available, using local update');
      }

      const brokerName = brokerInfo.name || brokerInfo.email || user?.email || 'you';
      setSnackbar({
        open: true,
        message: `Assigned ${propertyIds.length} ${propertyIds.length === 1 ? 'property' : 'properties'} to ${brokerName}`,
        severity: 'success'
      });

      setSelectedProperties(new Set());
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to assign broker',
        severity: 'error'
      });
    }
  }, [selectedProperties, user]);

  const handleInlineStatusChange = useCallback(async (propertyId, newStatus, event) => {
    event?.stopPropagation();
    
    try {
      // Update properties in state
      setProperties(prev => prev.map(property => 
        property.id === propertyId
          ? { ...property, propertyStatus: newStatus, updatedAt: new Date().toISOString() }
          : property
      ));

      // Update local cache
      const cached = readLocalCache();
      const updatedCache = cached.map(property =>
        String(property.id) === String(propertyId)
          ? { ...property, propertyStatus: newStatus, updatedAt: new Date().toISOString() }
          : property
      );
      writeLocalCache(updatedCache);

      // Try to update via API (fail silently if API not available)
      try {
        await propertyApi.updateProperty(propertyId, { propertyStatus: newStatus });
      } catch (apiError) {
        console.log('Inline status update - API not available, using local update');
      }

      const statusLabels = {
        active: 'Active',
        under_loi: 'Under LOI',
        off_market: 'Off Market',
        sold_leased: 'Sold / Leased'
      };
      const statusLabel = statusLabels[newStatus] || newStatus;
      setSnackbar({
        open: true,
        message: `Property status updated to ${statusLabel}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update property status',
        severity: 'error'
      });
    }
  }, []);

  const handleViewChange = useCallback((viewId) => {
    setSelectedViewId(viewId);
    setPage(1); // Reset to first page when changing views
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setViewFilters(filters);
    // Apply filters to state
    if (filters.type !== undefined) {
      setSelectedType(filters.type || '');
    }
    if (filters.propertyStatus !== undefined) {
      // If propertyStatus is an array, don't set dropdown
      if (Array.isArray(filters.propertyStatus)) {
        setSelectedStatus(''); // Clear dropdown when multiple statuses
      } else {
        // Map propertyStatus values to legacy status for compatibility if needed
        setSelectedStatus(''); // Clear selectedStatus since we're using propertyStatus now
      }
    } else if (filters.status !== undefined) {
      // Legacy support for old status field
      if (Array.isArray(filters.status)) {
        setSelectedStatus('');
      } else {
        setSelectedStatus('');
      }
    } else {
      setSelectedStatus(''); // Clear if no status filter
    }
    if (filters.search !== undefined) {
      setSearchTerm(filters.search || '');
    }
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = !debouncedSearch ||
        property.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        property.address?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        property.city?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesType = !selectedType || property.propertyType === selectedType;
      
      // Handle propertyStatus matching - can be string or array
      let matchesPropertyStatus = true;
      
      // Check if a saved view has a propertyStatus filter
      if (viewFilters.propertyStatus) {
        if (Array.isArray(viewFilters.propertyStatus)) {
          matchesPropertyStatus = viewFilters.propertyStatus.includes(property.propertyStatus);
        } else {
          matchesPropertyStatus = property.propertyStatus === viewFilters.propertyStatus;
        }
      } else {
        // If no filter, show all (matchesPropertyStatus remains true)
        matchesPropertyStatus = true;
      }

      // Filter by listing agent (for "My Properties" view)
      // Priority: 1. Primary broker assignment (listingAgentId, listingAgentEmail, listingAgent)
      //           2. If broker assignment is missing, default to creator (createdBy)
      let matchesListingAgent = true;
      if (viewFilters.listingAgentId || viewFilters.listingAgentEmail || viewFilters.listingAgentName) {
        const currentUserId = viewFilters.listingAgentId || user?.id;
        const currentUserEmail = viewFilters.listingAgentEmail || user?.email;
        
        // Check if property has any broker assignment
        const hasBrokerAssignment = !!(
          property.listingAgentId || 
          property.listingAgentEmail || 
          property.listingAgent
        );
        
        let brokerMatches = false;
        
        if (hasBrokerAssignment) {
          // Check primary broker assignment first
          // 1. Check listingAgentId (primary broker ID)
          if (currentUserId && property.listingAgentId) {
            brokerMatches = String(property.listingAgentId) === String(currentUserId);
          }
          
          // 2. Check listingAgentEmail (primary broker email)
          if (!brokerMatches && currentUserEmail && property.listingAgentEmail) {
            brokerMatches = property.listingAgentEmail.toLowerCase() === currentUserEmail.toLowerCase();
          }
          
          // 3. Check listingAgent object or string
          if (!brokerMatches && property.listingAgent) {
            if (typeof property.listingAgent === 'object') {
              // Match by ID in listingAgent object
              if (currentUserId && property.listingAgent.id) {
                brokerMatches = String(property.listingAgent.id) === String(currentUserId);
              }
              // Match by email in listingAgent object
              if (!brokerMatches && currentUserEmail && property.listingAgent.email) {
                brokerMatches = property.listingAgent.email.toLowerCase() === currentUserEmail.toLowerCase();
              }
              // Match by name in listingAgent object
              if (!brokerMatches && viewFilters.listingAgentName) {
                const agentName = `${property.listingAgent.firstName || ''} ${property.listingAgent.lastName || ''}`.trim();
                brokerMatches = agentName.toLowerCase() === viewFilters.listingAgentName.toLowerCase();
              }
            } else if (typeof property.listingAgent === 'string') {
              // String might contain email or name
              if (currentUserEmail) {
                brokerMatches = property.listingAgent.toLowerCase().includes(currentUserEmail.toLowerCase());
              }
              if (!brokerMatches && viewFilters.listingAgentName) {
                brokerMatches = property.listingAgent.toLowerCase().includes(viewFilters.listingAgentName.toLowerCase());
              }
            }
          }
          
          // If broker is assigned, use broker match result
          matchesListingAgent = brokerMatches;
        } else {
          // No broker assignment - default to creator (createdBy)
          if (currentUserId && property.createdBy) {
            matchesListingAgent = String(property.createdBy) === String(currentUserId);
          } else {
            matchesListingAgent = false;
          }
        }
      }

      // Filter by marketing status (for "Active Listings" view)
      let matchesMarketingStatus = true;
      if (viewFilters.marketingStatus) {
        matchesMarketingStatus = property.marketingStatus === viewFilters.marketingStatus;
      }

      // Filter by transaction status (for "Under LOI" view)
      let matchesTransactionStatus = true;
      if (viewFilters.transactionStatus) {
        matchesTransactionStatus = property.transactionStatus === viewFilters.transactionStatus;
      }

      return matchesSearch && matchesType && matchesPropertyStatus && matchesListingAgent && matchesMarketingStatus && matchesTransactionStatus;
    });

    const [field, direction] = sortBy.split('-');
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (field) {
        case 'price':
          aVal = a.listPrice || a.leaseRate || 0;
          bVal = b.listPrice || b.leaseRate || 0;
          break;
        case 'size':
          aVal = a.totalSquareFootage || 0;
          bVal = b.totalSquareFootage || 0;
          break;
        case 'date':
          aVal = a.daysOnMarket || 0;
          bVal = b.daysOnMarket || 0;
          break;
        case 'status':
          aVal = a.propertyStatus || '';
          bVal = b.propertyStatus || '';
          break;
        case 'name':
        default:
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [properties, debouncedSearch, selectedType, selectedStatus, sortBy, viewFilters, user]);

  const paginatedProperties = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProperties.slice(startIndex, endIndex);
  }, [filteredAndSortedProperties, page, itemsPerPage]);

  const handleSelectAll = useCallback(() => {
    if (selectedProperties.size === paginatedProperties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(paginatedProperties.map(p => p.id)));
    }
  }, [paginatedProperties, selectedProperties.size]);

  const totalPages = Math.ceil(filteredAndSortedProperties.length / itemsPerPage);
  const startItem = filteredAndSortedProperties.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredAndSortedProperties.length);

  const activeFilterCount = [selectedType].filter(Boolean).length;

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const getStatusGradient = (status) => {
    const gradients = {
      available: theme.palette.gradient.success,
      under_contract: theme.palette.gradient.warning,
      sold: theme.palette.gradient.secondary,
      leased: theme.palette.gradient.info,
      off_market: theme.palette.gradient.secondary
    };
    return gradients[status] || theme.palette.gradient.primary;
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: 'For Sale',
      under_contract: 'Under Contract',
      sold: 'Sold',
      leased: 'For Lease',
      off_market: 'Off Market'
    };
    return labels[status] || status;
  };

  const getPropertyStatusLabel = (propertyStatus) => {
    const labels = {
      active: 'Active',
      under_loi: 'Under LOI',
      off_market: 'Off Market',
      sold_leased: 'Sold / Leased'
    };
    return labels[propertyStatus] || propertyStatus || 'Not Set';
  };

  const getPropertyStatusGradient = (propertyStatus) => {
    const gradients = {
      active: theme.palette.gradient.success,
      under_loi: theme.palette.gradient.warning,
      off_market: theme.palette.gradient.secondary,
      sold_leased: theme.palette.gradient.info
    };
    return gradients[propertyStatus] || theme.palette.gradient.primary;
  };

  const getPropertyTypeLabel = (propertyType) => {
    const labels = {
      office: 'Office',
      retail: 'Retail',
      industrial: 'Industrial'
    };
    return labels[propertyType] || propertyType;
  };

  const getPropertyTypeGradient = (propertyType) => {
    const gradients = {
      office: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      retail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      industrial: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    return gradients[propertyType] || theme.palette.gradient.primary;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: theme.spacing(2) }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={300} height={36} />
        </Box>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Skeleton variant="rectangular" height={48} />
        </Paper>
        {viewMode === 'grid' ? (
          <CardSkeleton count={12} />
        ) : (
          <TableSkeleton rows={12} />
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: theme.spacing(3) }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: theme.spacing(3),
        animation: 'fadeInScale 0.5s ease-out'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: theme.spacing(0.5) }}>
            Properties
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {filteredAndSortedProperties.length > 0 
              ? `Showing ${startItem}-${endItem} of ${filteredAndSortedProperties.length} ${filteredAndSortedProperties.length === 1 ? 'property' : 'properties'}`
              : 'No properties found'
            }
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: theme.spacing(0.75), alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
            <Tooltip title="Grid View">
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  bgcolor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'text.secondary',
                  '&:hover': {
                    bgcolor: viewMode === 'grid' ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                <ViewModule />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'text.secondary',
                  '&:hover': {
                    bgcolor: viewMode === 'list' ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                <ViewList />
              </IconButton>
            </Tooltip>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshProperties}
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
            size="small"
            variant="outlined"
            startIcon={<Upload />}
            onClick={handleImportProperty}
            sx={{ 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[15]
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            Import
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddProperty}
            sx={{ 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[15]
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            Add Property
          </Button>
        </Box>
      </Box>

      {/* Saved Views */}
      <SavedViews
        selectedViewId={selectedViewId}
        onViewChange={handleViewChange}
        filters={viewFilters}
        onFiltersChange={handleFiltersChange}
        properties={properties}
        variant="tabs"
      />

      {/* Bulk Actions Bar */}
      {selectedProperties.size > 0 && (
        <Paper 
          elevation={4}
          sx={{ 
            position: 'sticky',
            top: 0,
            zIndex: 10,
            mb: 2,
            py: 1.5,
            px: 2,
            borderRadius: 2,
            background: theme.palette.gradient.primary,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {selectedProperties.size} {selectedProperties.size === 1 ? 'property' : 'properties'} selected
              </Typography>
              <IconButton
                size="small"
                onClick={() => setSelectedProperties(new Set())}
                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <Close />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1 }}>
                <InputLabel 
                  sx={{ 
                    color: 'rgba(255,255,255,0.9) !important',
                    '&.Mui-focused': { color: 'white !important' }
                  }}
                >
                  Change Status
                </InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value);
                    }
                  }}
                  label="Change Status"
                  sx={{ 
                    color: 'white',
                    '& .MuiSelect-select': { color: 'white' },
                    '& .MuiSelect-icon': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.9)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' }
                  }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="under_loi">Under LOI</MenuItem>
                  <MenuItem value="off_market">Off Market</MenuItem>
                  <MenuItem value="sold_leased">Sold / Leased</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ color: 'white', fontSize: 20 }} />
                <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1 }}>
                  <InputLabel 
                    sx={{ 
                      color: 'rgba(255,255,255,0.9) !important',
                      '&.Mui-focused': { color: 'white !important' }
                    }}
                  >
                    Assign Broker
                  </InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const brokerInfo = e.target.value === 'current_user' 
                          ? { id: user?.id, email: user?.email, name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'You' }
                          : { name: e.target.value };
                        handleBulkBrokerAssignment(brokerInfo);
                      }
                    }}
                    label="Assign Broker"
                    sx={{ 
                      color: 'white',
                      '& .MuiSelect-select': { color: 'white' },
                      '& .MuiSelect-icon': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.9)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'white' }
                    }}
                  >
                    <MenuItem value="current_user">
                      Assign to Me
                    </MenuItem>
                    {user?.email && user.email !== 'admin@demo.com' && (
                      <MenuItem value={user.email}>{user.firstName || user.email}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper elevation={2} sx={{ 
        py: 2,
        px: 2.5, 
        mb: theme.spacing(3), 
        borderRadius: 3,
        animation: 'fadeInUp 0.6s ease-out',
        animationDelay: '0.1s',
        animationFillMode: 'both'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <Clear />
                    </IconButton>
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
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: theme.spacing(1), flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                icon={<FilterList />}
                label="All Types"
                onClick={() => setSelectedType('')}
                color={!selectedType ? 'primary' : 'default'}
                sx={{ height: 28, fontSize: '0.8125rem' }}
              />
              <Chip
                label="Office"
                onClick={() => setSelectedType(selectedType === 'office' ? '' : 'office')}
                color={selectedType === 'office' ? 'primary' : 'default'}
                sx={{ height: 28, fontSize: '0.8125rem' }}
              />
              <Chip
                label="Retail"
                onClick={() => setSelectedType(selectedType === 'retail' ? '' : 'retail')}
                color={selectedType === 'retail' ? 'primary' : 'default'}
                sx={{ height: 28, fontSize: '0.8125rem' }}
              />
              <Chip
                label="Industrial"
                onClick={() => setSelectedType(selectedType === 'industrial' ? '' : 'industrial')}
                color={selectedType === 'industrial' ? 'primary' : 'default'}
                sx={{ height: 28, fontSize: '0.8125rem' }}
              />
              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<Clear />}
                  sx={{ ml: 1 }}
                >
                  Clear ({activeFilterCount})
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
                startAdornment={
                  <InputAdornment position="start">
                    <Sort />
                  </InputAdornment>
                }
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem value="price-asc">Price (Low to High)</MenuItem>
                <MenuItem value="price-desc">Price (High to Low)</MenuItem>
                <MenuItem value="size-asc">Size (Small to Large)</MenuItem>
                <MenuItem value="size-desc">Size (Large to Small)</MenuItem>
                <MenuItem value="status-asc">Status (A-Z)</MenuItem>
                <MenuItem value="status-desc">Status (Z-A)</MenuItem>
                <MenuItem value="date-asc">Oldest First</MenuItem>
                <MenuItem value="date-desc">Newest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {filteredAndSortedProperties.length === 0 ? (
        <EmptyState
          icon={Business}
          title={properties.length === 0 ? "No properties yet" : "No matching properties"}
          message={properties.length === 0 
            ? "Add your first property to get started."
            : "No properties match your current filters. Try adjusting your search or filters."
          }
          actionLabel={properties.length === 0 ? "Add Property" : "Clear Filters"}
          onAction={properties.length === 0 ? handleAddProperty : handleClearFilters}
        />
      ) : (
        <>
          {paginatedProperties.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Checkbox
                checked={selectedProperties.size > 0 && selectedProperties.size === paginatedProperties.length}
                indeterminate={selectedProperties.size > 0 && selectedProperties.size < paginatedProperties.length}
                onChange={handleSelectAll}
                size="small"
                sx={{ p: 0.5 }}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedProperties.size > 0 
                  ? `${selectedProperties.size} of ${paginatedProperties.length} selected`
                  : 'Select all'
                }
              </Typography>
            </Box>
          )}
          
          {/* Table View */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell padding="checkbox" sx={{ width: 48 }}>
                    {/* Checkbox column header */}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Property Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>City / State</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Property Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Listing Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marketing Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProperties.map((property, index) => {
                  const isSelected = selectedProperties.has(property.id);
                  return (
                    <TableRow
                      key={property.id}
                      hover
                      selected={isSelected}
                      onClick={(e) => {
                        if (!e.target.closest('.property-checkbox') && !e.target.closest('button') && !e.target.closest('.MuiSelect-root')) {
                          handleViewDetails(property, e);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': {
                            bgcolor: 'primary.light'
                          }
                        }
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ py: 1.5 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleSelectProperty(property.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="property-checkbox"
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {property.name || 'Unnamed Property'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {property.city && property.state 
                            ? `${property.city}, ${property.state}`
                            : property.city || property.state || '—'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        {property.propertyType ? (
                          <Chip
                            label={getPropertyTypeLabel(property.propertyType)}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 22,
                              background: getPropertyTypeGradient(property.propertyType),
                              color: 'white'
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        {property.listingType ? (
                          <Chip
                            label={property.listingType === 'sale' ? 'For Sale' : 'For Lease'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 22 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        {property.marketingStatus ? (
                          <Chip
                            label={property.marketingStatus.charAt(0).toUpperCase() + property.marketingStatus.slice(1).replace(/_/g, ' ')}
                            size="small"
                            color={
                              property.marketingStatus === 'active' ? 'success' :
                              property.marketingStatus === 'pending' ? 'warning' :
                              property.marketingStatus === 'inactive' ? 'default' : 'info'
                            }
                            sx={{ fontSize: '0.75rem', height: 22 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <FormControl 
                            size="small" 
                            sx={{ 
                              minWidth: 130,
                              '& .MuiOutlinedInput-root': {
                                height: 28,
                                fontSize: '0.75rem'
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              value={property.propertyStatus || 'active'}
                              onChange={(e) => handleInlineStatusChange(property.id, e.target.value, e)}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              sx={{ height: 28 }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    mt: 0.5,
                                    minWidth: 140,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                  }
                                }
                              }}
                            >
                              <MenuItem value="active">
                                <Chip
                                  label="Active"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.7rem',
                                    background: theme.palette.gradient.success,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </MenuItem>
                              <MenuItem value="under_loi">
                                <Chip
                                  label="Under LOI"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.7rem',
                                    background: theme.palette.gradient.warning,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </MenuItem>
                              <MenuItem value="off_market">
                                <Chip
                                  label="Off Market"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.7rem',
                                    background: theme.palette.gradient.secondary,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </MenuItem>
                              <MenuItem value="sold_leased">
                                <Chip
                                  label="Sold / Leased"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.7rem',
                                    background: theme.palette.gradient.info,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </MenuItem>
                            </Select>
                          </FormControl>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => handleViewDetails(property, e)}
                              sx={{ height: 28, width: 28 }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => handleEditProperty(property, e)}
                              sx={{ height: 28, width: 28 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {filteredAndSortedProperties.length > 0 && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, property: null })}>
        <DialogTitle>Delete Property</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteDialog.property?.name}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, property: null })}>
            Cancel
          </Button>
          <Button onClick={() => handleDeleteProperty(deleteDialog.property)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default Properties;
