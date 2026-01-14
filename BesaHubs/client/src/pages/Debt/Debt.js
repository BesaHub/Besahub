import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Warning,
  CheckCircle,
  AttachMoney,
  Business,
  Refresh,
  Delete
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { debtApi } from '../../services/debtApi';

const Debt = () => {
  const navigate = useNavigate();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanType, setSelectedLoanType] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, debt: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await debtApi.getDebts();
      setDebts(response.debts || []);
    } catch (err) {
      console.log('API call failed, using demo data:', err);
      // Use demo data when API fails
      const now = new Date();
      const demoDebts = [
        {
          id: '1',
          propertyId: '1',
          propertyName: 'Metropolitan Office Tower',
          principal: 8500000,
          interestRate: 0.045,
          maturityDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'First National Bank',
          monthlyPayment: 42500,
          remainingBalance: 8200000
        },
        {
          id: '2',
          propertyId: '2',
          propertyName: 'Coastal Shopping Center',
          principal: 6800000,
          interestRate: 0.052,
          maturityDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'Commercial Lending Corp',
          monthlyPayment: 35467,
          remainingBalance: 6500000
        },
        {
          id: '3',
          propertyId: '3',
          propertyName: 'Riverside Medical Center',
          principal: 3200000,
          interestRate: 0.048,
          maturityDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'maturing-soon',
          loanType: 'commercial_mortgage',
          lender: 'Regional Bank',
          monthlyPayment: 16000,
          remainingBalance: 3100000
        },
        {
          id: '4',
          propertyId: '4',
          propertyName: 'Westside Shopping Plaza',
          principal: 7000000,
          interestRate: 0.055,
          maturityDate: new Date(now.getTime() + 200 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'Metro Financial',
          monthlyPayment: 38500,
          remainingBalance: 6800000
        },
        {
          id: '5',
          propertyId: '5',
          propertyName: 'Innovation District Offices',
          principal: 2400000,
          interestRate: 0.042,
          maturityDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'Tech Lending Partners',
          monthlyPayment: 10080,
          remainingBalance: 2350000
        },
        {
          id: '6',
          propertyId: '6',
          propertyName: 'Northwest Manufacturing Complex',
          principal: 2800000,
          interestRate: 0.050,
          maturityDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'Industrial Credit Union',
          monthlyPayment: 14000,
          remainingBalance: 2700000
        },
        {
          id: '7',
          propertyId: '7',
          propertyName: 'Garden View Apartments',
          principal: 5400000,
          interestRate: 0.046,
          maturityDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'multifamily_loan',
          lender: 'Residential Finance Co',
          monthlyPayment: 27000,
          remainingBalance: 5200000
        },
        {
          id: '8',
          propertyId: '8',
          propertyName: 'Regional Hotel Portfolio',
          principal: 20000000,
          interestRate: 0.060,
          maturityDate: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'portfolio_loan',
          lender: 'Hospitality Lending Group',
          monthlyPayment: 100000,
          remainingBalance: 19500000
        },
        {
          id: '9',
          propertyId: '9',
          propertyName: 'Arctic Storage Facility',
          principal: 2600000,
          interestRate: 0.044,
          maturityDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'maturing-soon',
          loanType: 'commercial_mortgage',
          lender: 'Storage Finance LLC',
          monthlyPayment: 11440,
          remainingBalance: 2550000
        },
        {
          id: '10',
          propertyId: '10',
          propertyName: 'Central Square Development',
          principal: 14800000,
          interestRate: 0.058,
          maturityDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'construction_loan',
          lender: 'Development Capital Bank',
          monthlyPayment: 71533,
          remainingBalance: 14500000
        },
        {
          id: '11',
          propertyId: '11',
          propertyName: 'Downtown Culinary District',
          principal: 800000,
          interestRate: 0.047,
          maturityDate: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'Small Business Bank',
          monthlyPayment: 3760,
          remainingBalance: 780000
        },
        {
          id: '12',
          propertyId: '12',
          propertyName: 'Edge Computing Center',
          principal: 36000000,
          interestRate: 0.052,
          maturityDate: new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          loanType: 'commercial_mortgage',
          lender: 'Data Center Finance',
          monthlyPayment: 187200,
          remainingBalance: 35000000
        }
      ];
      setDebts(demoDebts);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = async () => {
    if (!deleteDialog.debt) return;

    try {
      await debtApi.deleteDebt(deleteDialog.debt.id);
      setDebts(prev => prev.filter(d => d.id !== deleteDialog.debt.id));
      setSnackbar({
        open: true,
        message: 'Debt record deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete debt record',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, debt: null });
    }
  };

  const calculateDaysUntilMaturity = (maturityDate) => {
    const now = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity - now;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMaturityStatus = (daysUntilMaturity) => {
    if (daysUntilMaturity < 0) {
      return { label: 'Matured', color: 'default', severity: 'low' };
    } else if (daysUntilMaturity < 180) {
      return { label: 'Critical', color: 'error', severity: 'critical' };
    } else if (daysUntilMaturity < 365) {
      return { label: 'Warning', color: 'warning', severity: 'warning' };
    }
    return { label: 'Healthy', color: 'success', severity: 'healthy' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatLoanType = (type) => {
    const types = {
      mortgage: 'Mortgage',
      bridge: 'Bridge',
      mezzanine: 'Mezzanine',
      construction: 'Construction',
      other: 'Other'
    };
    return types[type] || type;
  };

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = !searchTerm ||
      (debt.Property?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (debt.Lender?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLoanType = !selectedLoanType || debt.loanType === selectedLoanType;
    
    return matchesSearch && matchesLoanType;
  });

  const stats = {
    totalDebt: debts.reduce((sum, debt) => sum + parseFloat(debt.amount || 0), 0),
    totalRecords: debts.length,
    maturingSoon: debts.filter(d => {
      const days = calculateDaysUntilMaturity(d.maturityDate);
      return days >= 0 && days < 180;
    }).length,
    matured: debts.filter(d => calculateDaysUntilMaturity(d.maturityDate) < 0).length,
    avgDSCR: debts.length > 0 
      ? (debts.reduce((sum, d) => sum + parseFloat(d.dscr || 0), 0) / debts.length).toFixed(2)
      : 0
  };

  const StatCard = ({ title, value, subtitle, color = '#1976d2', icon: Icon }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {Icon && <Icon sx={{ color, mr: 1 }} />}
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value}
          </Typography>
        </Box>
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Debt Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDebts}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Add Debt
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Debt"
            value={formatCurrency(stats.totalDebt)}
            subtitle="All properties"
            color="#1976d2"
            icon={AttachMoney}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Records"
            value={stats.totalRecords}
            subtitle="Debt instruments"
            color="#2e7d32"
            icon={Business}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maturing Soon"
            value={stats.maturingSoon}
            subtitle="Within 6 months"
            color="#f57c00"
            icon={Warning}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg DSCR"
            value={stats.avgDSCR}
            subtitle="Debt coverage ratio"
            color="#7b1fa2"
            icon={CheckCircle}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by property or lender..."
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
              label="Loan Type"
              value={selectedLoanType}
              onChange={(e) => setSelectedLoanType(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">All Types</option>
              <option value="mortgage">Mortgage</option>
              <option value="bridge">Bridge</option>
              <option value="mezzanine">Mezzanine</option>
              <option value="construction">Construction</option>
              <option value="other">Other</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setSelectedLoanType('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredDebts.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Debt Records Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {debts.length === 0 
              ? 'Add your first debt record to get started.'
              : 'Try adjusting your filters to see more results.'}
          </Typography>
          {debts.length === 0 && (
            <Button variant="contained" startIcon={<Add />}>
              Add Debt Record
            </Button>
          )}
        </Paper>
      ) : (
        <Paper>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Debt Records ({filteredDebts.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Property</TableCell>
                  <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Lender</TableCell>
                  <TableCell align="right" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Amount</TableCell>
                  <TableCell align="right" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Interest Rate</TableCell>
                  <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Maturity Date</TableCell>
                  <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Days Until Maturity</TableCell>
                  <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>DSCR</TableCell>
                  <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Loan Type</TableCell>
                  <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDebts.map((debt) => {
                  const daysUntilMaturity = calculateDaysUntilMaturity(debt.maturityDate);
                  const maturityStatus = getMaturityStatus(daysUntilMaturity);

                  return (
                    <TableRow key={debt.id} hover>
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.813rem' }}>
                          {debt.Property?.name || 'Unknown Property'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.688rem' }}>
                          {debt.Property?.address || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>
                          {debt.Lender?.name || 'Unknown Lender'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.813rem' }}>
                          {formatCurrency(debt.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>
                          {parseFloat(debt.interestRate).toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>
                          {new Date(debt.maturityDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75 }}>
                        <Chip
                          size="small"
                          label={daysUntilMaturity < 0 
                            ? `${Math.abs(daysUntilMaturity)} days ago` 
                            : `${daysUntilMaturity} days`}
                          color={maturityStatus.color}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.688rem' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75 }}>
                        <Typography 
                          variant="caption"
                          color={debt.dscr && parseFloat(debt.dscr) >= 1.25 ? 'success.main' : 'warning.main'}
                          sx={{ fontWeight: 600, fontSize: '0.813rem' }}
                        >
                          {debt.dscr ? parseFloat(debt.dscr).toFixed(2) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.75 }}>
                        <Chip
                          size="small"
                          label={formatLoanType(debt.loanType)}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.688rem' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75 }}>
                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/properties/${debt.propertyId}`)}
                            title="View Property"
                            sx={{ p: 0.5 }}
                          >
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            title="Edit Debt"
                            sx={{ p: 0.5 }}
                          >
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, debt })}
                            title="Delete Debt"
                            sx={{ p: 0.5 }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, debt: null })}
      >
        <DialogTitle>Delete Debt Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this debt record for{' '}
            <strong>{deleteDialog.debt?.Property?.name || 'this property'}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, debt: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteDebt} color="error" variant="contained">
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

export default Debt;
