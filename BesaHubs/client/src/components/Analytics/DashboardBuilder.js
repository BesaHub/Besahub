import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, IconButton, Alert, Snackbar,
  Switch, FormControlLabel
} from '@mui/material';
import {
  Add, Edit, Delete, Save, BarChart, PieChart,
  TrendingUp, Assessment, People, AttachMoney, Email, Home,
  DragIndicator
} from '@mui/icons-material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { CustomChart } from './ChartComponents';
import { analyticsApi } from '../../services/analyticsApi';
import { DashboardSkeleton } from './LoadingSkeleton';
import AnalyticsErrorBoundary from './ErrorBoundary';
import { usePerformanceMonitor } from '../../utils/performanceMonitor';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types and their configurations
const WIDGET_TYPES = {
  'revenue-chart': {
    name: 'Revenue Chart',
    icon: <TrendingUp />,
    defaultSize: { w: 6, h: 4 },
    description: 'Shows revenue trends over time'
  },
  'kpi-summary': {
    name: 'KPI Summary',
    icon: <Assessment />,
    defaultSize: { w: 6, h: 4 },
    description: 'Key performance indicators overview'
  },
  'top-performers': {
    name: 'Top Performers',
    icon: <People />,
    defaultSize: { w: 6, h: 4 },
    description: 'Top performing team members'
  },
  'market-trends': {
    name: 'Market Trends',
    icon: <BarChart />,
    defaultSize: { w: 6, h: 4 },
    description: 'Market trends and analysis'
  },
  'lead-sources': {
    name: 'Lead Sources',
    icon: <PieChart />,
    defaultSize: { w: 4, h: 4 },
    description: 'Lead source distribution'
  },
  'conversion-funnel': {
    name: 'Conversion Funnel',
    icon: <Assessment />,
    defaultSize: { w: 8, h: 4 },
    description: 'Lead conversion funnel'
  },
  'email-campaigns': {
    name: 'Email Campaigns',
    icon: <Email />,
    defaultSize: { w: 6, h: 4 },
    description: 'Email campaign performance'
  },
  'property-types': {
    name: 'Property Types',
    icon: <Home />,
    defaultSize: { w: 4, h: 4 },
    description: 'Property type distribution'
  },
  'financial-overview': {
    name: 'Financial Overview',
    icon: <AttachMoney />,
    defaultSize: { w: 6, h: 4 },
    description: 'Financial performance overview'
  },
  'website-traffic': {
    name: 'Website Traffic',
    icon: <TrendingUp />,
    defaultSize: { w: 6, h: 4 },
    description: 'Website traffic analytics'
  }
};

const DashboardBuilder = () => {
  const { startRender, endRender, measureAsync } = usePerformanceMonitor('DashboardBuilder');
  
  const [dashboard, setDashboard] = useState({
    id: null,
    name: '',
    widgets: [],
    isPublic: false
  });
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [addWidgetDialog, setAddWidgetDialog] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);

  // Grid layout state
  const [layouts, setLayouts] = useState({ lg: [] });

  useEffect(() => {
    startRender();
    Promise.all([
      fetchAnalyticsData(),
      loadDefaultDashboard()
    ]).finally(() => {
      endRender();
    });
  }, [startRender, endRender]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overview, sales, leads, marketing, financial] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getSalesAnalytics(),
        analyticsApi.getLeadAnalytics(),
        analyticsApi.getMarketingAnalytics(),
        analyticsApi.getFinancialAnalytics()
      ]);

      setAnalyticsData({
        overview: overview.data.data,
        sales: sales.data.data,
        leads: leads.data.data,
        marketing: marketing.data.data,
        financial: financial.data.data
      });
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultDashboard = async () => {
    try {
      const response = await analyticsApi.getDashboard('executive');
      const dashboardData = response.data.data;
      
      setDashboard(dashboardData);
      setLayouts({ lg: dashboardData.widgets });
    } catch (err) {
      console.error('Error loading default dashboard:', err);
    }
  };

  const handleAddWidget = useCallback((widgetType) => {
    const widgetConfig = WIDGET_TYPES[widgetType];
    const newWidget = {
      i: `widget-${Date.now()}`,
      type: widgetType,
      title: widgetConfig.name,
      ...widgetConfig.defaultSize,
      x: 0,
      y: 0
    };

    const newWidgets = [...dashboard.widgets, newWidget];
    const newLayouts = {
      lg: [...layouts.lg, newWidget]
    };

    setDashboard(prev => ({ ...prev, widgets: newWidgets }));
    setLayouts(newLayouts);
    setAddWidgetDialog(false);
  }, [dashboard.widgets, layouts.lg]);

  const handleLayoutChange = useCallback((layout) => {
    setLayouts({ lg: layout });
    
    // Update widget positions
    const updatedWidgets = dashboard.widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.i);
      if (layoutItem) {
        return { ...widget, ...layoutItem };
      }
      return widget;
    });
    
    setDashboard(prev => ({ ...prev, widgets: updatedWidgets }));
  }, [dashboard.widgets]);

  const handleRemoveWidget = (widgetId) => {
    const newWidgets = dashboard.widgets.filter(widget => widget.i !== widgetId);
    const newLayouts = {
      lg: layouts.lg.filter(item => item.i !== widgetId)
    };

    setDashboard({ ...dashboard, widgets: newWidgets });
    setLayouts(newLayouts);
  };

  const handleSaveDashboard = async () => {
    try {
      setSaving(true);
      const widgets = layouts.lg.map(item => ({
        type: dashboard.widgets.find(w => w.i === item.i)?.type || 'revenue-chart',
        position: { x: item.x, y: item.y, w: item.w, h: item.h }
      }));

      await analyticsApi.saveDashboard(dashboard.name, widgets, dashboard.isPublic);
      setSnackbar({ open: true, message: 'Dashboard saved successfully!', severity: 'success' });
      setSaveDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save dashboard', severity: 'error' });
      console.error('Error saving dashboard:', err);
    } finally {
      setSaving(false);
    }
  };

  const getWidgetData = (widgetType) => {
    switch (widgetType) {
      case 'revenue-chart':
        return analyticsData.sales?.monthlyRevenue || [];
      case 'kpi-summary':
        return analyticsData.overview?.summary || {};
      case 'top-performers':
        return analyticsData.sales?.topPerformers || [];
      case 'market-trends':
        return analyticsData.sales?.marketTrends || [];
      case 'lead-sources':
        return analyticsData.leads?.leadSources || [];
      case 'conversion-funnel':
        return analyticsData.leads?.leadConversion || [];
      case 'email-campaigns':
        return analyticsData.marketing?.emailCampaigns?.campaigns || [];
      case 'property-types':
        return analyticsData.sales?.propertyTypes || [];
      case 'financial-overview':
        return analyticsData.financial?.revenue?.monthly || [];
      case 'website-traffic':
        return analyticsData.marketing?.websiteTraffic?.topPages || [];
      default:
        return [];
    }
  };


  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Memoized widget renderer
  const renderWidget = useCallback((widget) => {
    const ChartComponent = WIDGET_TYPES[widget.type]?.component;
    if (!ChartComponent) return null;

    return (
      <Box key={widget.i} sx={{ height: '100%', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {widget.title}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleRemoveWidget(widget.i)}
            sx={{ color: 'error.main' }}
          >
            <Delete />
          </IconButton>
        </Box>
        <ChartComponent 
          data={analyticsData[widget.type] || []} 
          height={200}
          {...widget.config}
        />
      </Box>
    );
  }, [analyticsData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <AnalyticsErrorBoundary>
      <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboard Builder
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                color="primary"
              />
            }
            label="Edit Mode"
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setAddWidgetDialog(true)}
            disabled={!editMode}
          >
            Add Widget
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => setSaveDialog(true)}
            disabled={!editMode}
          >
            Save Dashboard
          </Button>
        </Box>
      </Box>

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={editMode}
        isResizable={editMode}
        margin={[16, 16]}
      >
        {dashboard.widgets.map(widget => (
          <Box key={widget.i}>
            {renderWidget(widget)}
          </Box>
        ))}
      </ResponsiveGridLayout>

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetDialog} onClose={() => setAddWidgetDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Widget</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(WIDGET_TYPES).map(([type, config]) => (
              <Grid item xs={12} sm={6} md={4} key={type}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    '&:hover': { 
                      elevation: 4,
                      borderColor: 'primary.main' 
                    }
                  }}
                  onClick={() => handleAddWidget(type)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {config.icon}
                    <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {config.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {config.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWidgetDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Save Dashboard Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            value={dashboard.name}
            onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={dashboard.isPublic}
                onChange={(e) => setDashboard({ ...dashboard, isPublic: e.target.checked })}
              />
            }
            label="Make this dashboard public"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveDashboard}
            variant="contained"
            disabled={saving || !dashboard.name}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </AnalyticsErrorBoundary>
  );
};

export default DashboardBuilder;
