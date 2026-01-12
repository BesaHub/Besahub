import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
  TextField,
  MenuItem,
  Stack
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Business,
  People,
  AttachMoney,
  CalendarToday,
  Download
} from '@mui/icons-material';
import reportsApi from '../../services/reportsApi';

const Reports = () => {
  const { reportType } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(reportType || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Report data states
  const [dashboardData, setDashboardData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    propertyType: '',
    leadSource: ''
  });

  useEffect(() => {
    if (reportType) {
      setActiveTab(reportType);
    }
  }, [reportType]);

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        propertyType: filters.propertyType || undefined,
        leadSource: filters.leadSource || undefined
      };

      switch (activeTab) {
        case 'dashboard':
          const dashRes = await reportsApi.getDashboard();
          setDashboardData(dashRes.data.dashboard);
          break;
        case 'pipeline':
          const pipeRes = await reportsApi.getSalesPipeline(params);
          setPipelineData(pipeRes.data.pipeline);
          break;
        case 'properties':
          const propRes = await reportsApi.getPropertyPerformance(params);
          setPropertyData(propRes.data.propertyPerformance);
          break;
        case 'leads':
          const leadRes = await reportsApi.getLeadAnalysis(params);
          setLeadData(leadRes.data.leadAnalysis);
          break;
        case 'activity':
          const actRes = await reportsApi.getActivitySummary(params);
          setActivityData(actRes.data.activitySummary);
          break;
        case 'revenue':
          const revRes = await reportsApi.getRevenueForecast(params);
          setRevenueData(revRes.data.forecast);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/reports/${newValue}`);
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const exportToCSV = (data, filename) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const StatCard = ({ title, value, icon, trend, trendValue }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend === 'up' ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{ 
                    ml: 0.5,
                    color: trend === 'up' ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}
                >
                  {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: 'primary.light',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => {
    if (!dashboardData) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Properties"
            value={formatNumber(dashboardData.totalProperties)}
            icon={<Business sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contacts"
            value={formatNumber(dashboardData.totalContacts)}
            icon={<People sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Deals"
            value={formatNumber(dashboardData.totalDeals)}
            icon={<Assessment sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pipeline Value"
            value={formatCurrency(dashboardData.pipelineValue)}
            icon={<AttachMoney sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              This Month
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Closed Deals
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {dashboardData.closedDealsThisMonth}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Activities This Week
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {dashboardData.activitiesThisWeek}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => handleTabChange(null, 'pipeline')}
                fullWidth
              >
                View Sales Pipeline
              </Button>
              <Button
                variant="outlined"
                startIcon={<Business />}
                onClick={() => handleTabChange(null, 'properties')}
                fullWidth
              >
                Property Performance
              </Button>
              <Button
                variant="outlined"
                startIcon={<People />}
                onClick={() => handleTabChange(null, 'leads')}
                fullWidth
              >
                Lead Analysis
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderPipeline = () => {
    if (!pipelineData) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Pipeline by Stage
              </Typography>
              <Button
                startIcon={<Download />}
                onClick={() => exportToCSV(pipelineData.stageBreakdown, 'pipeline_by_stage')}
                size="small"
              >
                Export
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stage</TableCell>
                    <TableCell align="right">Deals</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                    <TableCell align="right">Avg Probability</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pipelineData.stageBreakdown?.map((stage) => (
                    <TableRow key={stage.stage}>
                      <TableCell>
                        <Chip
                          label={stage.stage.replace('_', ' ').toUpperCase()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{stage.count}</TableCell>
                      <TableCell align="right">{formatCurrency(stage.total_value)}</TableCell>
                      <TableCell align="right">{stage.avg_probability ? `${Math.round(stage.avg_probability)}%` : 'N/A'}</TableCell>
                      <TableCell sx={{ width: 200 }}>
                        <LinearProgress
                          variant="determinate"
                          value={stage.avg_probability || 0}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Deals by Type
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pipelineData.dealsByType?.map((type) => (
                    <TableRow key={type.dealType}>
                      <TableCell>{type.dealType?.replace('_', ' ') || 'N/A'}</TableCell>
                      <TableCell align="right">{type.count}</TableCell>
                      <TableCell align="right">{formatCurrency(type.total_value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {pipelineData.pipelineByAgent?.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Pipeline by Agent
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell align="right">Deals</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pipelineData.pipelineByAgent?.slice(0, 10).map((agent) => (
                      <TableRow key={agent.listingAgentId}>
                        <TableCell>
                          {agent.listingAgent?.firstName} {agent.listingAgent?.lastName}
                        </TableCell>
                        <TableCell align="right">{agent.deal_count}</TableCell>
                        <TableCell align="right">{formatCurrency(agent.pipeline_value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderPropertyPerformance = () => {
    if (!propertyData) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Average Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Avg List Price
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
                    {formatCurrency(propertyData.averageMetrics?.avg_list_price)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Avg Price/SF
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
                    ${Math.round(propertyData.averageMetrics?.avg_price_per_sqft || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Avg Days on Market
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
                    {Math.round(propertyData.averageMetrics?.avg_days_on_market || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Avg Inquiries
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
                    {Math.round(propertyData.averageMetrics?.avg_inquiries || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Properties by Type
              </Typography>
              <Button
                startIcon={<Download />}
                onClick={() => exportToCSV(propertyData.propertysByType, 'properties_by_type')}
                size="small"
              >
                Export
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Avg Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {propertyData.propertysByType?.map((type) => (
                    <TableRow key={type.propertyType}>
                      <TableCell>
                        <Chip
                          label={type.propertyType?.replace('_', ' ') || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{type.count}</TableCell>
                      <TableCell align="right">{formatCurrency(type.avg_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Properties by Status
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Avg Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {propertyData.propertiesByStatus?.map((status) => (
                    <TableRow key={status.status}>
                      <TableCell>
                        <Chip
                          label={status.status}
                          size="small"
                          color={status.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{status.count}</TableCell>
                      <TableCell align="right">{Math.round(status.avg_days_on_market || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {propertyData.topPerformingProperties?.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Top Performing Properties
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Property</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell align="right">List Price</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Inquiries</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {propertyData.topPerformingProperties?.map((prop) => (
                      <TableRow key={prop.id}>
                        <TableCell>{prop.name || prop.address}</TableCell>
                        <TableCell>{prop.city}, {prop.state}</TableCell>
                        <TableCell align="right">{formatCurrency(prop.listPrice)}</TableCell>
                        <TableCell align="right">{prop.views || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={prop.inquiries || 0}
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderLeadAnalysis = () => {
    if (!leadData) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Leads by Source
              </Typography>
              <Button
                startIcon={<Download />}
                onClick={() => exportToCSV(leadData.leadsBySource, 'leads_by_source')}
                size="small"
              >
                Export
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Converted</TableCell>
                    <TableCell align="right">Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadData.leadsBySource?.map((source) => {
                    const conversionRate = source.count > 0
                      ? ((source.converted / source.count) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <TableRow key={source.leadSource}>
                        <TableCell>
                          <Chip
                            label={source.leadSource?.replace('_', ' ') || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{source.count}</TableCell>
                        <TableCell align="right">{source.converted}</TableCell>
                        <TableCell align="right">{conversionRate}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Leads by Status
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadData.leadsByStatus?.map((status) => (
                    <TableRow key={status.leadStatus}>
                      <TableCell>
                        <Chip
                          label={status.leadStatus?.replace('_', ' ') || 'N/A'}
                          size="small"
                          color={status.leadStatus === 'converted' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{status.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Conversion Rates by Contact Role
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contact Role</TableCell>
                    <TableCell align="right">Total Leads</TableCell>
                    <TableCell align="right">Converted</TableCell>
                    <TableCell align="right">Conversion Rate</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadData.conversionRates?.map((role) => {
                    const rate = role.total_leads > 0
                      ? (role.converted_leads / role.total_leads) * 100
                      : 0;
                    return (
                      <TableRow key={role.contactRole}>
                        <TableCell>
                          <Chip
                            label={role.contactRole?.replace('_', ' ') || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{role.total_leads}</TableCell>
                        <TableCell align="right">{role.converted_leads}</TableCell>
                        <TableCell align="right">{rate.toFixed(1)}%</TableCell>
                        <TableCell sx={{ width: 200 }}>
                          <LinearProgress
                            variant="determinate"
                            value={rate}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderActivitySummary = () => {
    if (!activityData) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Activities by Type
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Avg Duration (min)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityData.activitiesByType?.map((type) => (
                    <TableRow key={type.type}>
                      <TableCell>
                        <Chip
                          label={type.type?.replace('_', ' ') || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{type.count}</TableCell>
                      <TableCell align="right">
                        {type.avg_duration ? Math.round(type.avg_duration) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Activities by Outcome
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Outcome</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityData.activitiesByOutcome?.map((outcome) => (
                    <TableRow key={outcome.outcome}>
                      <TableCell>
                        <Chip
                          label={outcome.outcome?.replace('_', ' ') || 'N/A'}
                          size="small"
                          color={outcome.outcome === 'successful' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{outcome.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {activityData.topActiveUsers?.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Most Active Users
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell align="right">Activity Count</TableCell>
                      <TableCell align="right">Avg Duration (min)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityData.topActiveUsers?.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          {user.user?.firstName} {user.user?.lastName}
                        </TableCell>
                        <TableCell align="right">{user.activity_count}</TableCell>
                        <TableCell align="right">
                          {user.avg_duration ? Math.round(user.avg_duration) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderFilters = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Grid>
        {activeTab === 'properties' && (
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Property Type"
              value={filters.propertyType}
              onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
              size="small"
              fullWidth
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="office">Office</MenuItem>
              <MenuItem value="retail">Retail</MenuItem>
              <MenuItem value="industrial">Industrial</MenuItem>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="multifamily">Multifamily</MenuItem>
              <MenuItem value="hotel">Hotel</MenuItem>
              <MenuItem value="land">Land</MenuItem>
              <MenuItem value="mixed_use">Mixed Use</MenuItem>
            </TextField>
          </Grid>
        )}
        {activeTab === 'leads' && (
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Lead Source"
              value={filters.leadSource}
              onChange={(e) => setFilters({ ...filters, leadSource: e.target.value })}
              size="small"
              fullWidth
            >
              <MenuItem value="">All Sources</MenuItem>
              <MenuItem value="referral">Referral</MenuItem>
              <MenuItem value="website">Website</MenuItem>
              <MenuItem value="cold_call">Cold Call</MenuItem>
              <MenuItem value="email_campaign">Email Campaign</MenuItem>
              <MenuItem value="social_media">Social Media</MenuItem>
              <MenuItem value="networking">Networking</MenuItem>
            </TextField>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            onClick={() => setFilters({ startDate: '', endDate: '', propertyType: '', leadSource: '' })}
            fullWidth
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Reports & Analytics
        </Typography>
        <Chip
          icon={<CalendarToday />}
          label={new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
          variant="outlined"
        />
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Sales Pipeline" value="pipeline" />
          <Tab label="Property Performance" value="properties" />
          <Tab label="Lead Analysis" value="leads" />
          <Tab label="Activity Summary" value="activity" />
          <Tab label="Revenue Forecast" value="revenue" />
        </Tabs>
      </Paper>

      {(activeTab !== 'dashboard') && renderFilters()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Box>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'pipeline' && renderPipeline()}
          {activeTab === 'properties' && renderPropertyPerformance()}
          {activeTab === 'leads' && renderLeadAnalysis()}
          {activeTab === 'activity' && renderActivitySummary()}
          {activeTab === 'revenue' && revenueData && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Revenue Forecast
              </Typography>
              <Alert severity="info">
                Revenue forecasting feature displays projected revenue based on pipeline deals and historical data.
              </Alert>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Reports;
