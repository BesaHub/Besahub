import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  LocationOn,
  Business,
  Compare,
  FileDownload,
  Visibility,
  FilterList,
  DateRange,
  Refresh
} from '@mui/icons-material';
import marketDataService from '../../services/marketDataService';

const MarketAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSubmarket, setSelectedSubmarket] = useState('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');
  const [timeFrame, setTimeFrame] = useState('12months');
  
  // Real data state management
  const [marketTrends, setMarketTrends] = useState(null);
  const [submarketData, setSubmarketData] = useState(null);
  const [comparablesData, setComparablesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLocation, setSearchLocation] = useState({ city: 'New York', state: 'NY' });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Fetch market data on component mount and when location changes
  useEffect(() => {
    fetchMarketData();
  }, [searchLocation, selectedPropertyType]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trendsResponse, submarketResponse, comparablesResponse] = await Promise.allSettled([
        marketDataService.getCachedMarketTrends(
          searchLocation.city, 
          searchLocation.state, 
          selectedPropertyType === 'all' ? '' : selectedPropertyType
        ),
        marketDataService.getSubmarketAnalysis(searchLocation.city, searchLocation.state),
        marketDataService.getMarketComparables(
          '123 Main St', // Default address for comparables
          searchLocation.city,
          searchLocation.state,
          selectedPropertyType === 'all' ? 'Office Building' : selectedPropertyType,
          50000
        )
      ]);

      if (trendsResponse.status === 'fulfilled') {
        setMarketTrends(trendsResponse.value.data);
      } else {
        console.error('Failed to fetch market trends:', trendsResponse.reason);
      }

      if (submarketResponse.status === 'fulfilled') {
        setSubmarketData(submarketResponse.value.data);
      } else {
        console.error('Failed to fetch submarket data:', submarketResponse.reason);
      }

      if (comparablesResponse.status === 'fulfilled') {
        setComparablesData(comparablesResponse.value.data);
      } else {
        console.error('Failed to fetch comparables:', comparablesResponse.reason);
      }

    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data. Using demo data.');
      setSnackbarOpen(true);
      
      // Fallback to mock data
      const mockTrends = await marketDataService.getMockMarketData('trends');
      const mockComparables = await marketDataService.getMockMarketData('comparables');
      setMarketTrends(mockTrends.data);
      setComparablesData(mockComparables.data);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (field, value) => {
    setSearchLocation(prev => ({ ...prev, [field]: value }));
  };

  const handleRefreshData = () => {
    marketDataService.clearCache();
    fetchMarketData();
  };

  // Mock market data
  const marketStats = {
    averageRentPSF: 28.50,
    vacancyRate: 8.2,
    absorptionRate: 145000,
    avgSalesPricePSF: 285,
    capRate: 6.8,
    trendDirection: 'up'
  };

  const submarkets = [
    { 
      name: 'Downtown Core',
      avgRent: 32.75,
      vacancyRate: 5.2,
      absorption: 85000,
      trend: 'up',
      totalSF: 2100000
    },
    { 
      name: 'Midtown',
      avgRent: 28.90,
      vacancyRate: 7.8,
      absorption: 45000,
      trend: 'stable',
      totalSF: 1850000
    },
    { 
      name: 'Airport District',
      avgRent: 22.40,
      vacancyRate: 12.1,
      absorption: 15000,
      trend: 'down',
      totalSF: 980000
    },
    { 
      name: 'Tech Corridor',
      avgRent: 35.20,
      vacancyRate: 4.5,
      absorption: 125000,
      trend: 'up',
      totalSF: 1450000
    }
  ];

  const comparableSales = [
    {
      id: '1',
      address: '123 Business Center Dr',
      propertyType: 'Office',
      totalSF: 125000,
      salePrice: 28500000,
      pricePSF: 228,
      saleDate: '2024-01-15',
      capRate: 6.5,
      submarket: 'Downtown Core'
    },
    {
      id: '2',
      address: '456 Corporate Plaza',
      propertyType: 'Office',
      totalSF: 85000,
      salePrice: 22100000,
      pricePSF: 260,
      saleDate: '2024-02-08',
      capRate: 7.1,
      submarket: 'Midtown'
    },
    {
      id: '3',
      address: '789 Industrial Way',
      propertyType: 'Industrial',
      totalSF: 250000,
      salePrice: 15750000,
      pricePSF: 63,
      saleDate: '2024-01-28',
      capRate: 8.2,
      submarket: 'Airport District'
    },
    {
      id: '4',
      address: '321 Retail Center',
      propertyType: 'Retail',
      totalSF: 45000,
      salePrice: 18500000,
      pricePSF: 411,
      saleDate: '2024-02-20',
      capRate: 5.8,
      submarket: 'Tech Corridor'
    }
  ];

  const mockQuarterlyTrends = [
    { period: 'Q1 2024', rent: 27.80, vacancy: 8.8, absorption: 35000 },
    { period: 'Q2 2024', rent: 28.10, vacancy: 8.5, absorption: 42000 },
    { period: 'Q3 2024', rent: 28.35, vacancy: 8.3, absorption: 38000 },
    { period: 'Q4 2024', rent: 28.50, vacancy: 8.2, absorption: 30000 }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'down': return <TrendingDown sx={{ color: '#f44336' }} />;
      default: return <TrendingUp sx={{ color: '#ff9800' }} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      default: return '#ff9800';
    }
  };

  const StatCard = ({ title, value, subtitle, trend, unit = '' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
              {unit}{typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {trend && getTrendIcon(trend)}
        </Box>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Loading Market Analytics...
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Fetching real-time market data from external sources
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="warning" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Compact Header with Inline Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Title and Current Selection Summary */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Market Analytics
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchLocation.city}, {searchLocation.state} • {selectedPropertyType === 'all' ? 'All Types' : selectedPropertyType} • {timeFrame === '6months' ? '6M' : timeFrame === '12months' ? '12M' : '24M'}
            </Typography>
          </Grid>
          
          {/* Compact Location Controls */}
          <Grid item xs={6} md={1.5}>
            <TextField
              size="small"
              fullWidth
              label="City"
              value={searchLocation.city}
              onChange={(e) => handleLocationChange('city', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField
              size="small"
              fullWidth
              label="State"
              value={searchLocation.state}
              onChange={(e) => handleLocationChange('state', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Property Type</InputLabel>
              <Select
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                label="Property Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Office Building">Office</MenuItem>
                <MenuItem value="Retail">Retail</MenuItem>
                <MenuItem value="Industrial">Industrial</MenuItem>
                <MenuItem value="Multi-Family">Multi-Family</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                label="Period"
              >
                <MenuItem value="6months">6 Months</MenuItem>
                <MenuItem value="12months">12 Months</MenuItem>
                <MenuItem value="24months">24 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Action Buttons */}
          <Grid item xs={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={handleRefreshData}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Refresh
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                onClick={fetchMarketData}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Update
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Market Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Price PSF"
            value={marketTrends?.marketMetrics?.avgPricePerSF || 295.50}
            subtitle={`${searchLocation.city}, ${searchLocation.state} - ${selectedPropertyType !== 'all' ? selectedPropertyType : 'All Types'}`}
            trend={marketTrends?.marketMetrics?.priceChange?.startsWith('+') ? 'up' : 'down'}
            unit="$"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Sales Volume"
            value={marketTrends?.marketMetrics?.salesVolume || 847}
            subtitle={marketTrends?.marketMetrics?.volumeChange || '+12.1% from last period'}
            trend={marketTrends?.marketMetrics?.volumeChange?.startsWith('+') ? 'up' : 'down'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Avg Days on Market"
            value={marketTrends?.marketMetrics?.avgDaysOnMarket || 45}
            subtitle={marketTrends?.marketMetrics?.domChange || '-8.3% from last period'}
            trend={marketTrends?.marketMetrics?.domChange?.startsWith('-') ? 'up' : 'down'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Avg Sales Price PSF"
            value={marketStats.avgSalesPricePSF}
            subtitle="Up 8% YoY"
            trend="up"
            unit="$"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Cap Rate"
            value={`${marketStats.capRate}%`}
            subtitle="Investment grade properties"
            trend="stable"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Market Health"
            value="Strong"
            subtitle="Based on key indicators"
            trend="up"
          />
        </Grid>
      </Grid>


      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Submarket Analysis" />
          <Tab label="Comparable Sales" />
          <Tab label="Market Trends" />
          <Tab label="Rent Comps" />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: 600 }}>
            Submarket Performance Overview
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Submarket</TableCell>
                  <TableCell align="right">Avg Rent PSF</TableCell>
                  <TableCell align="right">Vacancy Rate</TableCell>
                  <TableCell align="right">Net Absorption</TableCell>
                  <TableCell align="right">Total SF</TableCell>
                  <TableCell align="center">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submarkets.map((sub, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {sub.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${sub.avgRent}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {sub.vacancyRate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {sub.absorption.toLocaleString()} SF
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {(sub.totalSF / 1000000).toFixed(1)}M SF
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={sub.trend.toUpperCase()}
                        sx={{
                          backgroundColor: `${getTrendColor(sub.trend)}20`,
                          color: getTrendColor(sub.trend),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: 600 }}>
            Recent Comparable Sales
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Property Address</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Sale Price</TableCell>
                  <TableCell align="right">Price PSF</TableCell>
                  <TableCell align="right">Total SF</TableCell>
                  <TableCell align="right">Cap Rate</TableCell>
                  <TableCell>Sale Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparableSales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {sale.address}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {sale.submarket}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={sale.propertyType}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ${(sale.salePrice / 1000000).toFixed(1)}M
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${sale.pricePSF}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {sale.totalSF.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {sale.capRate}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="primary">
                        <Compare />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Quarterly Market Trends
            </Typography>
            <Grid container spacing={3}>
              {mockQuarterlyTrends.map((trend, index) => (
                <Grid item xs={12} md={3} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        {trend.period}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Avg Rent PSF
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          ${trend.rent}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Vacancy Rate
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#f57c00' }}>
                          {trend.vacancy}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Net Absorption
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {trend.absorption.toLocaleString()} SF
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Lease Rate Comparables
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This section would contain detailed lease rate comparables analysis, 
              including recent lease transactions, asking rates by building class, 
              and tenant improvement allowances in your target submarkets.
            </Typography>
            <Button variant="outlined" sx={{ mt: 3 }}>
              Generate Lease Comp Report
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MarketAnalytics;