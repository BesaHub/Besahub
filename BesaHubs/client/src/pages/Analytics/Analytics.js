import React, { useState, Suspense, lazy } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Container, Grid, Card, CardContent,
  Button, IconButton, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Dashboard, Assessment, GetApp, TrendingUp, Settings, MoreVert,
  BarChart, AttachMoney, People, Email
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import '../../components/Analytics/analytics.css';

// Lazy load components for better performance
const DashboardBuilder = lazy(() => import('../../components/Analytics/DashboardBuilder'));
const KPITracker = lazy(() => import('../../components/Analytics/KPITracker'));
const ReportGenerator = lazy(() => import('../../components/Analytics/ReportGenerator'));
// import { CustomChart } from '../../components/Analytics/ChartComponents';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExportData = () => {
    // Handle data export
    handleMenuClose();
  };

  const handleSettings = () => {
    // Handle settings
    handleMenuClose();
  };

  const tabPanels = [
    {
      label: 'Dashboard',
      icon: <Dashboard />,
      component: (
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        }>
          <DashboardBuilder />
        </Suspense>
      )
    },
    {
      label: 'KPI Tracker',
      icon: <Assessment />,
      component: (
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        }>
          <KPITracker />
        </Suspense>
      )
    },
    {
      label: 'Reports',
      icon: <GetApp />,
      component: (
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        }>
          <ReportGenerator />
        </Suspense>
      )
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Analytics & Reporting
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive insights into your commercial real estate business
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={handleMenuOpen}
              >
                Quick Actions
              </Button>
              <IconButton onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleExportData}>
                  <ListItemIcon>
                    <GetApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Export Data</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSettings}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl">
        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Revenue</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  $2.5M
                </Typography>
                <Typography variant="body2" color="success.main">
                  +15.2% from last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Leads</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  1,250
                </Typography>
                <Typography variant="body2" color="success.main">
                  +8.3% from last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BarChart color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Properties Listed</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  890
                </Typography>
                <Typography variant="body2" color="success.main">
                  +12.1% from last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Conversion Rate</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  53%
                </Typography>
                <Typography variant="body2" color="warning.main">
                  -2.1% from last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Paper elevation={2}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabPanels.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ py: 2 }}
              />
            ))}
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {tabPanels[activeTab].component}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Analytics;