import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Person,
  Business,
  Schedule,
  MoreVert,
  Edit,
  Payment,
  Visibility,
  Add,
  Calculate,
  AccountBalance,
  Assessment,
  PieChart
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { commissionApi, CommissionCalculator, COMMISSION_STATUS, COMMISSION_TYPES } from '../../services/commissionApi';
import { dealApi } from '../../services/dealApi';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`commission-tabpanel-${index}`}
      aria-labelledby={`commission-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CommissionDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [commissions, setCommissions] = useState([]);
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState({
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    thisMonth: 0,
    averageCommission: 0
  });
  
  // Dialog states
  const [calculatorDialog, setCalculatorDialog] = useState({ open: false, deal: null });
  const [paymentDialog, setPaymentDialog] = useState({ open: false, commission: null });
  const [menuAnchor, setMenuAnchor] = useState({ element: null, commission: null });

  // Mock commission data
  const mockCommissions = [
    {
      id: '1',
      dealId: '1',
      dealName: '123 Main Street Office Building',
      dealValue: 2500000,
      commissionAmount: 75000,
      status: 'paid',
      createdAt: '2024-01-15T10:00:00Z',
      paidAt: '2024-01-20T14:30:00Z',
      agents: [
        { id: '1', name: 'John Smith', role: 'listing_agent', amount: 37500, percentage: 50 },
        { id: '2', name: 'Sarah Johnson', role: 'buyer_agent', amount: 37500, percentage: 50 }
      ],
      structure: { type: 'percentage', rate: 3 }
    },
    {
      id: '2',
      dealId: '2',
      dealName: 'Industrial Warehouse Lease',
      dealValue: 180000,
      commissionAmount: 7200,
      status: 'approved',
      createdAt: '2024-01-12T09:15:00Z',
      approvedAt: '2024-01-18T11:00:00Z',
      agents: [
        { id: '3', name: 'Mike Davis', role: 'listing_agent', amount: 7200, percentage: 100 }
      ],
      structure: { type: 'percentage', rate: 4 }
    },
    {
      id: '3',
      dealId: '3',
      dealName: 'Retail Space Purchase',
      dealValue: 850000,
      commissionAmount: 25500,
      status: 'calculated',
      createdAt: '2024-01-10T16:45:00Z',
      agents: [
        { id: '4', name: 'Lisa Wang', role: 'buyer_agent', amount: 25500, percentage: 100 }
      ],
      structure: { type: 'percentage', rate: 3 }
    },
    {
      id: '4',
      dealId: '5',
      dealName: 'Luxury Retail Flagship',
      dealValue: 3200000,
      commissionAmount: 128000,
      status: 'pending',
      createdAt: '2024-01-08T13:20:00Z',
      agents: [
        { id: '5', name: 'Robert Chen', role: 'listing_agent', amount: 64000, percentage: 50 },
        { id: '6', name: 'Emily Rodriguez', role: 'buyer_agent', amount: 64000, percentage: 50 }
      ],
      structure: { type: 'tiered', tiers: [
        { threshold: 0, max: 1000000, rate: 5 },
        { threshold: 1000000, max: null, rate: 3 }
      ]}
    }
  ];

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      try {
        const [commissionsResponse, dealsResponse] = await Promise.all([
          commissionApi.getCommissions({ limit: 100 }),
          dealApi.getDeals({ limit: 100 })
        ]);
        
        setCommissions(commissionsResponse?.commissions || []);
        setDeals(dealsResponse?.deals || []);
        
        if (commissionsResponse?.commissions) {
          calculateSummary(commissionsResponse.commissions);
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
        setCommissions(mockCommissions);
        calculateSummary(mockCommissions);
      }
    } catch (err) {
      setError('Failed to load commission data');
      console.error('Commission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (commissionsData) => {
    const total = commissionsData.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paid = commissionsData.filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const pending = commissionsData.filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    
    const thisMonth = commissionsData.filter(c => {
      const commissionDate = new Date(c.createdAt);
      const now = new Date();
      return commissionDate.getMonth() === now.getMonth() && 
             commissionDate.getFullYear() === now.getFullYear();
    }).reduce((sum, c) => sum + c.commissionAmount, 0);

    setSummary({
      totalCommissions: total,
      paidCommissions: paid,
      pendingCommissions: pending,
      thisMonth,
      averageCommission: commissionsData.length > 0 ? total / commissionsData.length : 0
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      calculated: 'info',
      approved: 'primary',
      paid: 'success',
      disputed: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Schedule />,
      calculated: <Calculate />,
      approved: <Assessment />,
      paid: <Payment />,
      disputed: <MoreVert />,
      cancelled: <MoreVert />
    };
    return icons[status] || <MoreVert />;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event, commission) => {
    setMenuAnchor({ element: event.currentTarget, commission });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, commission: null });
  };

  const handleCalculateCommission = (deal) => {
    setCalculatorDialog({ open: true, deal });
  };

  const handleProcessPayment = (commission) => {
    setPaymentDialog({ open: true, commission });
    handleMenuClose();
  };

  const handleViewCommission = (commission) => {
    // Navigate to commission details
    console.log('View commission:', commission);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading commission data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
            Commission Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage commission calculations and payments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCalculatorDialog({ open: true, deal: null })}
        >
          Calculate Commission
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.totalCommissions)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Commissions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Payment sx={{ color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.paidCommissions)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Out
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ color: 'warning.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.pendingCommissions)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payment
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.thisMonth)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Commission Records" />
          <Tab label="Agent Performance" />
          <Tab label="Commission Calculator" />
        </Tabs>
      </Paper>

      {/* Commission Records Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Deal</TableCell>
                <TableCell align="right">Deal Value</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Agents</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {commission.dealName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {commission.dealId}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(commission.dealValue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(commission.commissionAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {((commission.commissionAmount / commission.dealValue) * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={commission.status.toUpperCase()}
                      color={getStatusColor(commission.status)}
                      size="small"
                      icon={getStatusIcon(commission.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {commission.agents.slice(0, 2).map((agent, index) => (
                        <Tooltip key={agent.id} title={`${agent.name} - ${formatCurrency(agent.amount)}`}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                            {agent.name.charAt(0)}
                          </Avatar>
                        </Tooltip>
                      ))}
                      {commission.agents.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{commission.agents.length - 2}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, commission)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Agent Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Agent Commission Performance
            </Typography>
            
            {/* Agent summary would go here */}
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PieChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Agent Performance Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed agent performance metrics and commission breakdowns coming soon.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Commission Calculator Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Commission Structure Templates
            </Typography>
            
            <Grid container spacing={2}>
              {CommissionCalculator.getCommissionTemplates().map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      
                      {template.type === 'percentage' && (
                        <Chip
                          label={`${template.rate}% of deal value`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      
                      {template.type === 'tiered' && (
                        <Box>
                          {template.tiers.map((tier, index) => (
                            <Typography key={index} variant="caption" display="block">
                              ${(tier.threshold / 1000000).toFixed(1)}M+: {tier.rate}%
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Recommended for: {template.recommended_for.join(', ')}
                        </Typography>
                      </Box>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => console.log('Use template:', template)}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewCommission(menuAnchor.commission)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => console.log('Edit commission')}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Commission</ListItemText>
        </MenuItem>
        {menuAnchor.commission?.status === 'approved' && (
          <MenuItem onClick={() => handleProcessPayment(menuAnchor.commission)}>
            <ListItemIcon>
              <Payment fontSize="small" />
            </ListItemIcon>
            <ListItemText>Process Payment</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onClose={() => setPaymentDialog({ open: false, commission: null })}>
        <DialogTitle>Process Commission Payment</DialogTitle>
        <DialogContent>
          {paymentDialog.commission && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Deal: {paymentDialog.commission.dealName}
              </Typography>
              <Typography variant="h6" color="success.main" gutterBottom>
                Amount: {formatCurrency(paymentDialog.commission.commissionAmount)}
              </Typography>
              
              <TextField
                fullWidth
                label="Payment Method"
                select
                sx={{ mt: 2, mb: 2 }}
                defaultValue="bank_transfer"
              >
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
              </TextField>
              
              <TextField
                fullWidth
                label="Payment Reference"
                placeholder="Transaction ID, Check #, etc."
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                placeholder="Payment notes..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog({ open: false, commission: null })}>
            Cancel
          </Button>
          <Button variant="contained" color="success">
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommissionDashboard;