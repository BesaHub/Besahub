import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  AttachMoney,
  Business,
  CalendarToday,
  Refresh
} from '@mui/icons-material';

const Leases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Mock lease data
  const mockLeases = [
    {
      id: '1',
      propertyName: 'Downtown Office Tower',
      tenantName: 'TechCorp Solutions',
      unit: 'Suite 1200',
      leaseStart: '2023-01-01',
      leaseEnd: '2025-12-31',
      monthlyRent: 15000,
      totalSquareFeet: 3500,
      rentPSF: 4.29,
      status: 'active',
      daysUntilExpiration: 365,
      escalations: '3% annually',
      securityDeposit: 30000,
      leaseType: 'Triple Net',
      renewalOption: true
    },
    {
      id: '2',
      propertyName: 'Retail Plaza West',
      tenantName: 'Fashion Forward LLC',
      unit: 'Unit 5A',
      leaseStart: '2022-06-01',
      leaseEnd: '2024-05-31',
      monthlyRent: 8500,
      totalSquareFeet: 2200,
      rentPSF: 3.86,
      status: 'expiring-soon',
      daysUntilExpiration: 90,
      escalations: '2.5% annually',
      securityDeposit: 17000,
      leaseType: 'Modified Gross',
      renewalOption: true
    },
    {
      id: '3',
      propertyName: 'Industrial Center North',
      tenantName: 'Manufacturing Plus',
      unit: 'Building C',
      leaseStart: '2021-09-01',
      leaseEnd: '2024-02-29',
      monthlyRent: 12000,
      totalSquareFeet: 25000,
      rentPSF: 0.48,
      status: 'expired',
      daysUntilExpiration: -30,
      escalations: 'Fixed',
      securityDeposit: 24000,
      leaseType: 'Triple Net',
      renewalOption: false
    },
    {
      id: '4',
      propertyName: 'Medical Professional Building',
      tenantName: 'Central Dental Group',
      unit: 'Suite 203',
      leaseStart: '2023-03-01',
      leaseEnd: '2028-02-29',
      monthlyRent: 9200,
      totalSquareFeet: 1800,
      rentPSF: 5.11,
      status: 'active',
      daysUntilExpiration: 1200,
      escalations: '3.5% annually',
      securityDeposit: 18400,
      leaseType: 'Full Service',
      renewalOption: true
    },
    {
      id: '5',
      propertyName: 'Metropolitan Office Tower',
      tenantName: 'Park Investment Group',
      unit: 'Floors 15-17',
      leaseStart: '2022-01-15',
      leaseEnd: '2027-01-14',
      monthlyRent: 45000,
      totalSquareFeet: 12000,
      rentPSF: 3.75,
      status: 'active',
      daysUntilExpiration: 1080,
      escalations: '2.5% annually',
      securityDeposit: 90000,
      leaseType: 'Full Service',
      renewalOption: true
    },
    {
      id: '6',
      propertyName: 'Southeast Distribution Hub',
      tenantName: 'Global Logistics Solutions',
      unit: 'Warehouse A',
      leaseStart: '2021-03-01',
      leaseEnd: '2026-02-28',
      monthlyRent: 38000,
      totalSquareFeet: 45000,
      rentPSF: 0.84,
      status: 'active',
      daysUntilExpiration: 730,
      escalations: '3% annually',
      securityDeposit: 76000,
      leaseType: 'Triple Net',
      renewalOption: true
    },
    {
      id: '7',
      propertyName: 'Riverside Medical Center',
      tenantName: 'Healthcare Partners LLC',
      unit: 'Suite 100-105',
      leaseStart: '2023-06-01',
      leaseEnd: '2028-05-31',
      monthlyRent: 28000,
      totalSquareFeet: 5600,
      rentPSF: 5.00,
      status: 'active',
      daysUntilExpiration: 1460,
      escalations: '3.5% annually',
      securityDeposit: 56000,
      leaseType: 'Full Service',
      renewalOption: true
    },
    {
      id: '8',
      propertyName: 'Westside Shopping Plaza',
      tenantName: 'Wilson Retail Holdings',
      unit: 'Anchor Space',
      leaseStart: '2020-01-01',
      leaseEnd: '2024-12-31',
      monthlyRent: 22000,
      totalSquareFeet: 8500,
      rentPSF: 2.59,
      status: 'expiring-soon',
      daysUntilExpiration: 330,
      escalations: '2% annually',
      securityDeposit: 44000,
      leaseType: 'Triple Net',
      renewalOption: true
    },
    {
      id: '9',
      propertyName: 'Innovation District Offices',
      tenantName: 'TechStart Ventures',
      unit: 'Floor 3',
      leaseStart: '2023-09-01',
      leaseEnd: '2026-08-31',
      monthlyRent: 20000,
      totalSquareFeet: 5000,
      rentPSF: 4.00,
      status: 'active',
      daysUntilExpiration: 910,
      escalations: '2.5% annually',
      securityDeposit: 40000,
      leaseType: 'Full Service',
      renewalOption: true
    },
    {
      id: '10',
      propertyName: 'Arctic Storage Facility',
      tenantName: 'Lopez Food Distribution',
      unit: 'Cold Storage Unit 1',
      leaseStart: '2022-05-01',
      leaseEnd: '2025-04-30',
      monthlyRent: 26667,
      totalSquareFeet: 32000,
      rentPSF: 0.83,
      status: 'active',
      daysUntilExpiration: 450,
      escalations: '3% annually',
      securityDeposit: 53334,
      leaseType: 'Triple Net',
      renewalOption: true
    },
    {
      id: '11',
      propertyName: 'Garden View Apartments',
      tenantName: 'Property Management Co',
      unit: 'Entire Building',
      leaseStart: '2021-01-01',
      leaseEnd: '2031-12-31',
      monthlyRent: 85000,
      totalSquareFeet: 68000,
      rentPSF: 1.25,
      status: 'active',
      daysUntilExpiration: 2920,
      escalations: '2% annually',
      securityDeposit: 170000,
      leaseType: 'Triple Net',
      renewalOption: false
    },
    {
      id: '12',
      propertyName: 'Downtown Culinary District',
      tenantName: 'Harris Restaurant Group',
      unit: 'Restaurant Space',
      leaseStart: '2023-11-01',
      leaseEnd: '2026-10-31',
      monthlyRent: 8000,
      totalSquareFeet: 2500,
      rentPSF: 3.20,
      status: 'active',
      daysUntilExpiration: 1000,
      escalations: '3% annually',
      securityDeposit: 16000,
      leaseType: 'Modified Gross',
      renewalOption: true
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'expiring-soon': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'expiring-soon': return <Schedule />;
      case 'expired': return <Warning />;
      default: return null;
    }
  };

  const filteredLeases = mockLeases.filter(lease => {
    const matchesSearch = !searchTerm || 
      lease.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || lease.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalLeases: mockLeases.length,
    activeLeases: mockLeases.filter(l => l.status === 'active').length,
    expiringSoon: mockLeases.filter(l => l.status === 'expiring-soon').length,
    totalRentRoll: mockLeases.reduce((sum, lease) => sum + lease.monthlyRent, 0)
  };

  const StatCard = ({ title, value, subtitle, color = '#1976d2' }) => (
    <Card>
      <CardContent>
        <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1 }}>
          {typeof value === 'number' && value > 10000 ? 
            `$${(value / 1000).toFixed(0)}K` : value}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Lease Management
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Lease
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Leases"
            value={stats.totalLeases}
            subtitle="All lease agreements"
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Leases"
            value={stats.activeLeases}
            subtitle="Currently occupied"
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            subtitle="Within 6 months"
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Rent Roll"
            value={stats.totalRentRoll}
            subtitle="Total monthly income"
            color="#7b1fa2"
          />
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search leases by tenant, property, or unit..."
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
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status Filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Schedule />}
              sx={{ py: 2 }}
            >
              Lease Expirations
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AttachMoney />}
              sx={{ py: 2 }}
            >
              Rent Roll Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalendarToday />}
              sx={{ py: 2 }}
            >
              Renewal Reminders
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Business />}
              sx={{ py: 2 }}
            >
              Lease Comps
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Leases Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Lease Agreements ({filteredLeases.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Property/Tenant</TableCell>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Unit</TableCell>
                <TableCell align="right" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Monthly Rent</TableCell>
                <TableCell align="right" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>$/SF</TableCell>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Lease Term</TableCell>
                <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Status</TableCell>
                <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Days to Expiration</TableCell>
                <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeases.map((lease) => (
                <TableRow key={lease.id} hover>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.813rem' }}>
                        {lease.tenantName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.688rem' }}>
                        {lease.propertyName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>{lease.unit}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.688rem' }}>
                      {lease.totalSquareFeet.toLocaleString()} SF
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.813rem' }}>
                      ${lease.monthlyRent.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.688rem' }}>
                      per month
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>
                      ${lease.rentPSF.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>
                      {new Date(lease.leaseStart).toLocaleDateString()} - 
                      {new Date(lease.leaseEnd).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.688rem' }}>
                      {lease.leaseType}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Chip
                      size="small"
                      icon={getStatusIcon(lease.status)}
                      label={lease.status.replace('-', ' ').toUpperCase()}
                      color={getStatusColor(lease.status)}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.688rem', '& .MuiChip-icon': { fontSize: 14 } }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Typography
                      variant="caption"
                      color={lease.daysUntilExpiration < 0 ? 'error' : 
                             lease.daysUntilExpiration < 180 ? 'warning.main' : 'textSecondary'}
                      sx={{ fontWeight: lease.daysUntilExpiration < 180 ? 600 : 400, fontSize: '0.813rem' }}
                    >
                      {lease.daysUntilExpiration < 0 
                        ? `${Math.abs(lease.daysUntilExpiration)} days ago`
                        : `${lease.daysUntilExpiration} days`
                      }
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                      <Visibility sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Expiring Leases Alert */}
      {stats.expiringSoon > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small">
              View Details
            </Button>
          }
        >
          You have {stats.expiringSoon} lease{stats.expiringSoon > 1 ? 's' : ''} expiring within the next 6 months. 
          Consider reaching out to tenants about renewal options.
        </Alert>
      )}
    </Box>
  );
};

export default Leases;