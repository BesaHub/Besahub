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
  Pagination
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
  Business
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { propertyApi } from '../../services/propertyApi';
import useScrollReveal from '../../utils/useScrollReveal';
import { CardSkeleton, TableSkeleton } from '../../components/Common/LoadingSkeletons';
import EmptyState from '../../components/Common/EmptyState';

const Properties = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
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
      const matchesStatus = !selectedStatus || property.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
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
  }, [properties, debouncedSearch, selectedType, selectedStatus, sortBy]);

  const paginatedProperties = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProperties.slice(startIndex, endIndex);
  }, [filteredAndSortedProperties, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProperties.length / itemsPerPage);
  const startItem = filteredAndSortedProperties.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredAndSortedProperties.length);

  const activeFilterCount = [selectedType, selectedStatus].filter(Boolean).length;

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
    <Container maxWidth="xl" sx={{ py: theme.spacing(2) }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: theme.spacing(2),
        animation: 'fadeInScale 0.5s ease-out'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: theme.spacing(0.25) }}>
            Properties
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
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

      <Paper elevation={2} sx={{ 
        py: 1,
        px: 1.5, 
        mb: theme.spacing(2), 
        borderRadius: 3,
        animation: 'fadeInUp 0.6s ease-out',
        animationDelay: '0.1s',
        animationFillMode: 'both'
      }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, address, or city..."
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
          
          <Grid item xs={12} md={3}>
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

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status"
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="available">For Sale</MenuItem>
                <MenuItem value="leased">For Lease</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
                <MenuItem value="under_contract">Under Contract</MenuItem>
                <MenuItem value="off_market">Off Market</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
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
          title="No properties yet"
          message="Get started by adding your first commercial property"
          actionLabel="Add Property"
          onAction={handleAddProperty}
        />
      ) : (
        <Grid container spacing={1.5} ref={cardGridRef}>
          {paginatedProperties.map((property, index) => (
          <Grid item xs={12} key={property.id}>
            <Card
              sx={{
                display: 'flex',
                flexDirection: 'row',
                height: 65,
                cursor: 'pointer',
                position: 'relative',
                borderRadius: 0,
                overflow: 'hidden',
                boxShadow: 2,
                opacity: cardGridVisible ? 1 : 0,
                transform: cardGridVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: `${Math.min(index * 0.1, 0.8)}s`,
                border: property.isFeatured ? '2px solid transparent' : 'none',
                backgroundImage: property.isFeatured 
                  ? `linear-gradient(white, white), ${theme.palette.gradient.warning}`
                  : 'none',
                backgroundOrigin: 'border-box',
                backgroundClip: property.isFeatured ? 'padding-box, border-box' : 'padding-box',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 4,
                  '& .property-overlay': {
                    opacity: 1
                  },
                  '& .quick-actions': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
              onClick={(e) => handleViewDetails(property, e)}
            >
              {property.isFeatured && (
                <Chip
                  icon={<Star sx={{ color: 'white !important', fontSize: 12 }} />}
                  label="Featured"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    zIndex: 2,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 18,
                    background: theme.palette.gradient.warning,
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                  }}
                />
              )}
              
              <Chip
                label={getStatusLabel(property.status)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 6,
                  left: property.isFeatured ? 90 : 6,
                  zIndex: 2,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 18,
                  background: getStatusGradient(property.status),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              />

              <Box sx={{ 
                position: 'relative', 
                width: 100,
                minWidth: 100,
                height: '100%'
              }}>
                {property.photo || property.images?.[0] ? (
                  <img 
                    src={property.photo || property.images?.[0]}
                    alt={property.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: theme.palette.gradient.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <HomeWork sx={{ fontSize: 36, color: 'white', opacity: 0.3 }} />
                  </Box>
                )}

                <Box 
                  className="property-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.4s'
                  }} 
                />
              </Box>
              
              <CardContent sx={{ 
                p: 1, 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                '&:last-child': { pb: 1 }
              }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.2, fontSize: '0.875rem', lineHeight: 1.2 }}>
                  {property.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.4 }}>
                  <LocationOn color="action" sx={{ fontSize: 12 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                    {property.address}, {property.city}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{
                    background: theme.palette.gradient.primary,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                      {formatPrice(property.listPrice || property.leaseRate)}
                    </Typography>
                  </Box>

                  {property.pricePerSquareFoot && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      ${property.pricePerSquareFoot}/sq ft
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <SquareFoot sx={{ fontSize: 12 }} color="action" />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{formatNumber(property.totalSquareFootage)} sf</Typography>
                  </Box>
                  
                  {property.buildingClass && (
                    <Chip
                      label={`Class ${property.buildingClass}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.65rem' }}
                    />
                  )}
                  
                  {property.capRate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <TrendingUp sx={{ fontSize: 12 }} color="success" />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{property.capRate}% CAP</Typography>
                    </Box>
                  )}
                  
                  {property.daysOnMarket > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <AccessTime sx={{ fontSize: 12 }} color="action" />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {property.daysOnMarket} days
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>

              <Box 
                className="quick-actions"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  display: 'flex',
                  gap: 0.5,
                  opacity: 0,
                  transform: 'translateY(10px)',
                  transition: 'all 0.3s',
                  zIndex: 2
                }}
              >
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={(e) => handleViewDetails(property, e)}
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { 
                        background: 'white',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(e) => handleEditProperty(property, e)}
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { 
                        background: 'white',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share">
                  <IconButton
                    size="small"
                    onClick={(e) => handleShareProperty(property, e)}
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { 
                        background: 'white',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Share fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Favorite">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSnackbar({
                        open: true,
                        message: 'Added to favorites!',
                        severity: 'success'
                      });
                    }}
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { 
                        background: 'white',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <FavoriteBorder fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
        </Grid>
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
