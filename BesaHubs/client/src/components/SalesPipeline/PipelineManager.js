import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  Person,
  Business,
  AttachMoney,
  Schedule,
  MoreVert
} from '@mui/icons-material';

// Mock pipeline data
const MOCK_PIPELINE = {
  stages: [
    {
      id: 1,
      name: 'Lead',
      order: 1,
      color: '#9e9e9e',
      deals: [
        {
          id: 1,
          name: 'ABC Corp Office Space',
          contact: 'John Smith',
          company: 'ABC Corp',
          value: 2500000,
          probability: 10,
          expectedCloseDate: '2024-03-15',
          lastActivity: '2024-01-15',
          stage: 'Lead'
        },
        {
          id: 2,
          name: 'XYZ Retail Lease',
          contact: 'Jane Doe',
          company: 'XYZ Inc',
          value: 1200000,
          probability: 15,
          expectedCloseDate: '2024-04-20',
          lastActivity: '2024-01-14',
          stage: 'Lead'
        }
      ]
    },
    {
      id: 2,
      name: 'Qualified',
      order: 2,
      color: '#ff9800',
      deals: [
        {
          id: 3,
          name: 'Tech Startup Office',
          contact: 'Mike Johnson',
          company: 'TechStart Inc',
          value: 1800000,
          probability: 25,
          expectedCloseDate: '2024-02-28',
          lastActivity: '2024-01-16',
          stage: 'Qualified'
        }
      ]
    },
    {
      id: 3,
      name: 'Proposal',
      order: 3,
      color: '#2196f3',
      deals: [
        {
          id: 4,
          name: 'Manufacturing Facility',
          contact: 'Sarah Wilson',
          company: 'Manufacturing Co',
          value: 5000000,
          probability: 40,
          expectedCloseDate: '2024-02-15',
          lastActivity: '2024-01-17',
          stage: 'Proposal'
        }
      ]
    },
    {
      id: 4,
      name: 'Negotiation',
      order: 4,
      color: '#ff5722',
      deals: [
        {
          id: 5,
          name: 'Retail Chain Expansion',
          contact: 'David Brown',
          company: 'Retail Chain',
          value: 3200000,
          probability: 60,
          expectedCloseDate: '2024-01-30',
          lastActivity: '2024-01-18',
          stage: 'Negotiation'
        }
      ]
    },
    {
      id: 5,
      name: 'Closed Won',
      order: 5,
      color: '#4caf50',
      deals: [
        {
          id: 6,
          name: 'Office Building Sale',
          contact: 'Lisa Garcia',
          company: 'Investment Group',
          value: 7500000,
          probability: 100,
          expectedCloseDate: '2024-01-20',
          lastActivity: '2024-01-19',
          stage: 'Closed Won'
        }
      ]
    }
  ]
};

const PipelineManager = () => {
  const [pipeline, setPipeline] = useState(MOCK_PIPELINE);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealDialog, setDealDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [dealForm, setDealForm] = useState({
    name: '',
    contact: '',
    company: '',
    value: '',
    probability: 0,
    expectedCloseDate: '',
    stage: 'Lead'
  });

  const calculatePipelineMetrics = () => {
    const totalDeals = pipeline.stages.reduce((sum, stage) => sum + stage.deals.length, 0);
    const totalValue = pipeline.stages.reduce((sum, stage) => 
      sum + stage.deals.reduce((stageSum, deal) => stageSum + deal.value, 0), 0
    );
    const weightedValue = pipeline.stages.reduce((sum, stage) => 
      sum + stage.deals.reduce((stageSum, deal) => 
        stageSum + (deal.value * deal.probability / 100), 0), 0
    );
    const closedWonValue = pipeline.stages
      .find(stage => stage.name === 'Closed Won')?.deals
      .reduce((sum, deal) => sum + deal.value, 0) || 0;

    return {
      totalDeals,
      totalValue,
      weightedValue,
      closedWonValue,
      conversionRate: totalDeals > 0 ? (pipeline.stages.find(s => s.name === 'Closed Won')?.deals.length || 0) / totalDeals * 100 : 0
    };
  };

  const metrics = calculatePipelineMetrics();

  const handleCreateDeal = () => {
    setEditingDeal(null);
    setDealForm({
      name: '',
      contact: '',
      company: '',
      value: '',
      probability: 0,
      expectedCloseDate: '',
      stage: 'Lead'
    });
    setDealDialog(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setDealForm({
      name: deal.name,
      contact: deal.contact,
      company: deal.company,
      value: deal.value,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate,
      stage: deal.stage
    });
    setDealDialog(true);
  };

  const handleSaveDeal = () => {
    try {
      const newDeal = {
        id: editingDeal ? editingDeal.id : Date.now(),
        ...dealForm,
        value: parseFloat(dealForm.value),
        probability: parseInt(dealForm.probability),
        lastActivity: new Date().toISOString().split('T')[0]
      };

      if (editingDeal) {
        // Update existing deal
        setPipeline(prev => ({
          ...prev,
          stages: prev.stages.map(stage => ({
            ...stage,
            deals: stage.deals.map(deal => 
              deal.id === editingDeal.id ? newDeal : deal
            )
          }))
        }));
        setSuccess('Deal updated successfully!');
      } else {
        // Create new deal
        setPipeline(prev => ({
          ...prev,
          stages: prev.stages.map(stage => 
            stage.name === newDeal.stage 
              ? { ...stage, deals: [...stage.deals, newDeal] }
              : stage
          )
        }));
        setSuccess('Deal created successfully!');
      }

      setDealDialog(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save deal');
    }
  };

  const handleDeleteDeal = (dealId) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      setPipeline(prev => ({
        ...prev,
        stages: prev.stages.map(stage => ({
          ...stage,
          deals: stage.deals.filter(deal => deal.id !== dealId)
        }))
      }));
      setSuccess('Deal deleted successfully!');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const moveDealToStage = (dealId, newStage) => {
    setPipeline(prev => {
      let dealToMove = null;
      const updatedStages = prev.stages.map(stage => ({
        ...stage,
        deals: stage.deals.filter(deal => {
          if (deal.id === dealId) {
            dealToMove = { ...deal, stage: newStage };
            return false;
          }
          return true;
        })
      }));

      return {
        ...prev,
        stages: updatedStages.map(stage => 
          stage.name === newStage 
            ? { ...stage, deals: [...stage.deals, dealToMove] }
            : stage
        )
      };
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return '#4caf50';
    if (probability >= 60) return '#ff9800';
    if (probability >= 40) return '#ff5722';
    return '#9e9e9e';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sales Pipeline</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateDeal}
        >
          Add Deal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Pipeline Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Deals
              </Typography>
              <Typography variant="h4">
                {metrics.totalDeals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(metrics.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Weighted Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(metrics.weightedValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h4">
                {metrics.conversionRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Stages */}
      <Grid container spacing={2}>
        {pipeline.stages.map((stage) => (
          <Grid item xs={12} md={2.4} key={stage.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color={stage.color}>
                    {stage.name}
                  </Typography>
                  <Chip 
                    label={stage.deals.length} 
                    size="small" 
                    sx={{ backgroundColor: stage.color, color: 'white' }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    {formatCurrency(stage.deals.reduce((sum, deal) => sum + deal.value, 0))}
                  </Typography>
                </Box>

                <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {stage.deals.map((deal) => (
                    <Card 
                      key={deal.id} 
                      sx={{ 
                        mb: 1, 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle2" noWrap>
                            {deal.name}
                          </Typography>
                          <IconButton size="small">
                            <MoreVert />
                          </IconButton>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {deal.contact}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Business fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {deal.company}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <AttachMoney fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(deal.value)}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            {deal.probability}% chance
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={deal.probability}
                            sx={{
                              flex: 1,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getProbabilityColor(deal.probability),
                                borderRadius: 2
                              }
                            }}
                          />
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Deal Dialog */}
      <Dialog open={dealDialog} onClose={() => setDealDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDeal ? 'Edit Deal' : 'Create Deal'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deal Name"
                value={dealForm.name}
                onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact"
                value={dealForm.contact}
                onChange={(e) => setDealForm({ ...dealForm, contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={dealForm.company}
                onChange={(e) => setDealForm({ ...dealForm, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deal Value"
                type="number"
                value={dealForm.value}
                onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Probability (%)"
                type="number"
                value={dealForm.probability}
                onChange={(e) => setDealForm({ ...dealForm, probability: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Close Date"
                type="date"
                value={dealForm.expectedCloseDate}
                onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Stage</InputLabel>
                <Select
                  value={dealForm.stage}
                  onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                  label="Stage"
                >
                  {pipeline.stages.map((stage) => (
                    <MenuItem key={stage.id} value={stage.name}>
                      {stage.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDealDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveDeal} variant="contained">
            {editingDeal ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineManager;
