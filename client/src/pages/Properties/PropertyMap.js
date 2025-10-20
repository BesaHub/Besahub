import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Refresh,
  LocationOn,
  Close,
  ViewList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { propertyApi } from '../../services/propertyApi';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom map component to handle map updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);

  return null;
};

const PropertyMap = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // New York City default
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mock properties with coordinates
  const mockProperties = [
    {
      id: '1',
      name: 'Downtown Office Complex',
      address: '123 Business Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      propertyType: 'office',
      status: 'available',
      listingType: 'sale',
      listPrice: 2500000,
      totalSquareFootage: 25000,
      buildingClass: 'A',
      yearBuilt: 2020,
      coordinates: [40.7589, -73.9851], // Times Square area
      images: [],
      marketingStatus: 'published',
      description: 'Modern office building in the heart of Manhattan'
    },
    {
      id: '2',
      name: 'Industrial Warehouse',
      address: '456 Commerce Blvd',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      propertyType: 'industrial',
      status: 'leased',
      listingType: 'lease',
      leaseRate: 15,
      totalSquareFootage: 50000,
      buildingClass: 'B',
      yearBuilt: 2015,
      coordinates: [40.6892, -73.9442], // Brooklyn Heights
      images: [],
      marketingStatus: 'published',
      description: 'Large warehouse facility with modern amenities'
    },
    {
      id: '3',
      name: 'Retail Shopping Center',
      address: '789 Shopping Way',
      city: 'Queens',
      state: 'NY',
      zipCode: '11101',
      propertyType: 'retail',
      status: 'under_contract',
      listingType: 'sale',
      listPrice: 3500000,
      totalSquareFootage: 75000,
      buildingClass: 'A',
      yearBuilt: 2018,
      coordinates: [40.7505, -73.9300], // Long Island City
      images: [],
      marketingStatus: 'published',
      description: 'Prime retail location with high foot traffic'
    },
    {
      id: '4',
      name: 'Medical Office Building',
      address: '321 Health Plaza',
      city: 'Manhattan',
      state: 'NY',
      zipCode: '10016',
      propertyType: 'office',
      status: 'available',
      listingType: 'lease',
      leaseRate: 45,
      totalSquareFootage: 15000,
      buildingClass: 'A',
      yearBuilt: 2019,
      coordinates: [40.7452, -73.9808], // Murray Hill
      images: [],
      marketingStatus: 'published',
      description: 'Specialized medical office space with modern facilities'
    },
    {
      id: '5',
      name: 'Mixed-Use Development',
      address: '654 Urban Center',
      city: 'Bronx',
      state: 'NY',
      zipCode: '10451',
      propertyType: 'mixed_use',
      status: 'available',
      listingType: 'sale',
      listPrice: 4200000,
      totalSquareFootage: 85000,
      buildingClass: 'B',
      yearBuilt: 2021,
      coordinates: [40.8176, -73.9182], // South Bronx
      images: [],
      marketingStatus: 'published',
      description: 'Modern mixed-use development with retail and office space'
    }
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, typeFilter, statusFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await propertyApi.getMapProperties(
          'bounds', // This would be actual map bounds in a real implementation
          { searchTerm, type: typeFilter, status: statusFilter }
        );

        if (response && response.properties) {
          setProperties(response.properties);
        } else {
          setProperties(mockProperties);
        }
      } catch (apiError) {
        setProperties(mockProperties);
      }
    } catch (err) {
      setError('Failed to load properties');
      setProperties(mockProperties); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(property => property.propertyType === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    setFilteredProperties(filtered);
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    if (property.coordinates) {
      setMapCenter(property.coordinates);
      setMapZoom(15);
    }
  };

  const handleMarkerClick = (property) => {
    setSelectedProperty(property);
    setDrawerOpen(true);
  };

  const getStatusChip = (status) => {
    const colors = {
      available: 'success',
      under_contract: 'warning',
      leased: 'info',
      sold: 'default',
      off_market: 'error'
    };

    return (
      <Chip
        label={status.replace('_', ' ').toUpperCase()}
        color={colors[status] || 'default'}
        size="small"
      />
    );
  };

  const formatPrice = (property) => {
    if (property.listingType === 'sale' && property.listPrice) {
      return `$${(property.listPrice / 1000000).toFixed(1)}M`;
    } else if (property.listingType === 'lease' && property.leaseRate) {
      return `$${property.leaseRate}/sf/yr`;
    }
    return 'Price on request';
  };

  const propertyTypes = ['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'other'];
  const statusOptions = ['available', 'under_contract', 'sold', 'leased', 'off_market'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/properties')}
              variant="outlined"
            >
              Back to Properties
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Property Map View
            </Typography>
            <Chip
              icon={<LocationOn />}
              label={`${filteredProperties.length} properties`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ViewList />}
              onClick={() => setDrawerOpen(true)}
              variant="outlined"
            >
              Property List
            </Button>
            <Button
              startIcon={<Refresh />}
              onClick={fetchProperties}
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search properties"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Property Type</InputLabel>
            <Select
              value={typeFilter}
              label="Property Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {propertyTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />

          {filteredProperties.map((property) => (
            property.coordinates && (
              <Marker
                key={property.id}
                position={property.coordinates}
                eventHandlers={{
                  click: () => handleMarkerClick(property),
                }}
              >
                <Popup>
                  <Box sx={{ minWidth: 250 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {property.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {property.address}, {property.city}, {property.state}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {getStatusChip(property.status)}
                      <Chip
                        label={property.propertyType.replace('_', ' ').toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                      {formatPrice(property)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {property.totalSquareFootage?.toLocaleString()} sq ft
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/properties/${property.id}`)}
                      fullWidth
                    >
                      View Details
                    </Button>
                  </Box>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </Box>

      {/* Property List Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Properties ({filteredProperties.length})
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <List sx={{ p: 0 }}>
            {filteredProperties.map((property) => (
              <ListItem
                key={property.id}
                sx={{
                  p: 0,
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
                onClick={() => {
                  handlePropertyClick(property);
                  setDrawerOpen(false);
                }}
              >
                <Card sx={{ width: '100%' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {property.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <LocationOn sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {property.address}, {property.city}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                      {getStatusChip(property.status)}
                      <Chip
                        label={property.propertyType.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                      {formatPrice(property)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {property.totalSquareFootage?.toLocaleString()} sq ft
                    </Typography>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default PropertyMap;