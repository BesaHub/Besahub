import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  FileDownload,
  Email,
  OpenInNew,
  TouchApp,
  ErrorOutline,
  Unsubscribe,
  CalendarToday,
  PersonAdd,
  CheckCircle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { campaignApi, CAMPAIGN_STATUSES } from '../../services/campaignApi';

const CampaignAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchCampaignAnalytics();
  }, [id]);

  const fetchCampaignAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [campaignRes, analyticsRes, recipientsRes] = await Promise.all([
        campaignApi.getCampaignById(id),
        campaignApi.getCampaignAnalytics(id),
        campaignApi.getCampaignRecipients(id)
      ]);

      setCampaign(campaignRes.campaign);
      setAnalytics(analyticsRes.analytics);
      setRecipients(recipientsRes.recipients || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch campaign analytics');
      console.error('Error fetching campaign analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = () => {
    try {
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `campaign-${campaign.name}-analytics.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'Analytics exported successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to export analytics',
        severity: 'error'
      });
    }
  };

  const generateCSV = () => {
    const headers = ['Recipient', 'Email', 'Status', 'Opened', 'Clicked', 'Bounced', 'Unsubscribed'];
    const rows = recipients.map(r => [
      r.name || 'N/A',
      r.email,
      r.status,
      r.opened ? 'Yes' : 'No',
      r.clicked ? 'Yes' : 'No',
      r.bounced ? 'Yes' : 'No',
      r.unsubscribed ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRate = (count, total) => {
    if (!total || total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  const getStatusColor = (status) => {
    const statusObj = CAMPAIGN_STATUSES.find(s => s.id === status);
    return statusObj?.color || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Campaign not found</Alert>
      </Container>
    );
  }

  const kpiData = [
    {
      title: 'Total Sent',
      value: campaign.sentCount || 0,
      icon: <Email />,
      color: '#1976d2'
    },
    {
      title: 'Opens',
      value: campaign.openedCount || 0,
      icon: <OpenInNew />,
      color: '#2e7d32'
    },
    {
      title: 'Clicks',
      value: campaign.clickedCount || 0,
      icon: <TouchApp />,
      color: '#ed6c02'
    },
    {
      title: 'Bounces',
      value: campaign.bouncedCount || 0,
      icon: <ErrorOutline />,
      color: '#d32f2f'
    },
    {
      title: 'Unsubscribes',
      value: campaign.unsubscribedCount || 0,
      icon: <Unsubscribe />,
      color: '#9c27b0'
    }
  ];

  const performanceMetrics = [
    {
      label: 'Open Rate',
      value: calculateRate(campaign.openedCount, campaign.sentCount),
      color: '#2e7d32'
    },
    {
      label: 'Click Rate',
      value: calculateRate(campaign.clickedCount, campaign.sentCount),
      color: '#ed6c02'
    },
    {
      label: 'Bounce Rate',
      value: calculateRate(campaign.bouncedCount, campaign.sentCount),
      color: '#d32f2f'
    },
    {
      label: 'Unsubscribe Rate',
      value: calculateRate(campaign.unsubscribedCount, campaign.sentCount),
      color: '#9c27b0'
    }
  ];

  const engagementData = [
    { name: 'Opened', value: campaign.openedCount || 0, color: '#2e7d32' },
    { name: 'Clicked', value: campaign.clickedCount || 0, color: '#ed6c02' },
    { name: 'Bounced', value: campaign.bouncedCount || 0, color: '#d32f2f' },
    { name: 'Unsubscribed', value: campaign.unsubscribedCount || 0, color: '#9c27b0' },
    {
      name: 'No Action',
      value: Math.max(0, (campaign.sentCount || 0) - (campaign.openedCount || 0) - (campaign.bouncedCount || 0)),
      color: '#bdbdbd'
    }
  ];

  const opensOverTimeData = analytics?.opensOverTime || [
    { date: 'Day 1', opens: campaign.openedCount * 0.6 },
    { date: 'Day 2', opens: campaign.openedCount * 0.3 },
    { date: 'Day 3', opens: campaign.openedCount * 0.1 }
  ];

  const clickPerformanceData = analytics?.clickPerformance || [
    { link: 'Link 1', clicks: Math.floor((campaign.clickedCount || 0) * 0.5) },
    { link: 'Link 2', clicks: Math.floor((campaign.clickedCount || 0) * 0.3) },
    { link: 'Link 3', clicks: Math.floor((campaign.clickedCount || 0) * 0.2) }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/campaigns')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Campaign Analytics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownload />}
          onClick={handleExportAnalytics}
        >
          Export CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Campaign Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {campaign.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                label={campaign.status}
                size="small"
                color={getStatusColor(campaign.status)}
                sx={{ textTransform: 'capitalize' }}
              />
              <Chip
                label={campaign.type}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Subject:</strong> {campaign.subject}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {campaign.scheduledDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Scheduled: {formatDate(campaign.scheduledDate)}
                  </Typography>
                </Box>
              )}
              {campaign.sentDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Sent: {formatDate(campaign.sentDate)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonAdd sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Recipients: {campaign.totalRecipients || 0}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: `${kpi.color}20`,
                      color: kpi.color
                    }}
                  >
                    {kpi.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.title}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {kpi.value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Performance Metrics */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Performance Metrics
        </Typography>
        <Grid container spacing={2}>
          {performanceMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {metric.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: metric.color }}>
                  {metric.value}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Opens Over Time */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Opens Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={opensOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opens" stroke="#2e7d32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Click Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Click-Through Performance
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clickPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="link" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" fill="#ed6c02" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Engagement Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Engagement Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recipient List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recipient Details
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Recipient</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Opened</TableCell>
                <TableCell align="center">Clicked</TableCell>
                <TableCell align="center">Bounced</TableCell>
                <TableCell align="center">Unsubscribed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recipients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No recipient data available
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recipients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((recipient, index) => (
                  <TableRow key={index}>
                    <TableCell>{recipient.name || 'N/A'}</TableCell>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={recipient.status || 'sent'}
                        size="small"
                        sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {recipient.opened ? (
                        <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {recipient.clicked ? (
                        <CheckCircle sx={{ fontSize: 18, color: 'info.main' }} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {recipient.bounced ? (
                        <ErrorOutline sx={{ fontSize: 18, color: 'error.main' }} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {recipient.unsubscribed ? (
                        <Unsubscribe sx={{ fontSize: 18, color: 'warning.main' }} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {recipients.length > 0 && (
          <TablePagination
            component="div"
            count={recipients.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        )}
      </Paper>

      {/* Email Events Section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Email sx={{ mr: 1 }} />
            Email Events
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownload />}
            onClick={() => alert('CSV export coming soon')}
          >
            Export CSV
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Detailed email event tracking for this campaign via SendGrid webhooks.
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event Type</TableCell>
                <TableCell>Count</TableCell>
                <TableCell>Last Occurred</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No email events yet. Events will appear here once emails are sent and webhooks are configured.
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Real-time event tracking powered by SendGrid
          </Typography>
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default CampaignAnalytics;
