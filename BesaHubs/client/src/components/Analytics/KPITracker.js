import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, LinearProgress,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, Snackbar
} from '@mui/material';
import {
  TrendingUp, TrendingDown, TrendingFlat, Edit, Save, Close,
  AttachMoney, Email, Speed
} from '@mui/icons-material';
import { analyticsApi } from '../../services/analyticsApi';
import { KPISkeleton } from './LoadingSkeleton';
import AnalyticsErrorBoundary from './ErrorBoundary';

const KPITracker = () => {
  const [kpiData, setKpiData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Edit dialog state
  const [editDialog, setEditDialog] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [editForm, setEditForm] = useState({ target: '', current: '' });

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getKPIs();
      setKpiData(response.data.data);
    } catch (err) {
      setError('Failed to fetch KPI data');
      console.error('Error fetching KPI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="warning" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      default:
        return 'warning';
    }
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    return 'error';
  };

  const handleEditKPI = (category, metric, data) => {
    setEditingKPI({ category, metric, data });
    setEditForm({
      target: data.target,
      current: data.current
    });
    setEditDialog(true);
  };

  const handleSaveKPI = async () => {
    try {
      // In a real application, this would update the KPI in the backend
      const updatedKpiData = { ...kpiData };
      updatedKpiData[editingKPI.category][editingKPI.metric] = {
        ...editingKPI.data,
        target: parseFloat(editForm.target),
        current: parseFloat(editForm.current)
      };
      
      setKpiData(updatedKpiData);
      setSnackbar({ open: true, message: 'KPI updated successfully!', severity: 'success' });
      setEditDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update KPI', severity: 'error' });
      console.error('Error updating KPI:', err);
    }
  };

  const renderKPICard = (category, metric, data, icon) => {
    const progress = calculateProgress(data.current, data.target);
    const progressColor = getProgressColor(progress);
    const trendColor = getTrendColor(data.trend);

    return (
      <Card key={metric} sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {icon}
              <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getTrendIcon(data.trend)}
              <IconButton
                size="small"
                onClick={() => handleEditKPI(category, metric, data)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${progressColor}.main` }}>
              {typeof data.current === 'number' ? data.current.toLocaleString() : data.current}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Target: {typeof data.target === 'number' ? data.target.toLocaleString() : data.target}
            </Typography>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={progressColor}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Chip
            label={data.trend === 'up' ? 'Above Target' : data.trend === 'down' ? 'Below Target' : 'On Track'}
            color={trendColor}
            size="small"
            sx={{ mt: 1 }}
          />
        </CardContent>
      </Card>
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <KPISkeleton />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <AnalyticsErrorBoundary>
      <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        KPI Tracker
      </Typography>

      {/* Sales KPIs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} />
          Sales Performance
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(kpiData.sales || {}).map(([metric, data]) => (
            <Grid item xs={12} sm={6} md={3} key={metric}>
              {renderKPICard('sales', metric, data, <AttachMoney />)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Marketing KPIs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
          <Email sx={{ mr: 1 }} />
          Marketing Performance
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(kpiData.marketing || {}).map(([metric, data]) => (
            <Grid item xs={12} sm={6} md={3} key={metric}>
              {renderKPICard('marketing', metric, data, <Email />)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Operations KPIs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
          <Speed sx={{ mr: 1 }} />
          Operations Performance
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(kpiData.operations || {}).map(([metric, data]) => (
            <Grid item xs={12} sm={6} md={3} key={metric}>
              {renderKPICard('operations', metric, data, <Speed />)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Edit KPI Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit KPI</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Current Value"
            type="number"
            fullWidth
            value={editForm.current}
            onChange={(e) => setEditForm({ ...editForm, current: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Target Value"
            type="number"
            fullWidth
            value={editForm.target}
            onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} startIcon={<Close />}>
            Cancel
          </Button>
          <Button onClick={handleSaveKPI} variant="contained" startIcon={<Save />}>
            Save
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

export default KPITracker;
