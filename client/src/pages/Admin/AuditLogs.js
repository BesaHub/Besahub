import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);

  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    eventType: '',
    email: '',
    statusCode: '',
    correlationId: '',
    ipAddress: ''
  });

  useEffect(() => {
    fetchEventTypes();
    fetchStats();
    fetchLogs();
  }, [page, rowsPerPage]);

  const fetchEventTypes = async () => {
    try {
      const response = await api.get('/audit-logs/event-types');
      setEventTypes(response.data.eventTypes);
    } catch (err) {
      console.error('Error fetching event types:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const response = await api.get('/audit-logs/stats', { params });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };

      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.email) params.email = filters.email;
      if (filters.statusCode) params.statusCode = filters.statusCode;
      if (filters.correlationId) params.correlationId = filters.correlationId;
      if (filters.ipAddress) params.ipAddress = filters.ipAddress;

      const response = await api.get('/audit-logs', { params });
      setLogs(response.data.logs);
      setTotalCount(response.data.pagination.total);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchLogs();
    fetchStats();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      eventType: '',
      email: '',
      statusCode: '',
      correlationId: '',
      ipAddress: ''
    });
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.email) params.email = filters.email;
      if (filters.statusCode) params.statusCode = filters.statusCode;

      const response = await api.get('/audit-logs/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Failed to export audit logs');
    }
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'info';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'default';
  };

  const getEventTypeColor = (eventType) => {
    const criticalEvents = ['USER_DELETE', 'PASSWORD_CHANGE', 'ADMIN_ACTION', 'MFA_OPERATION'];
    const warningEvents = ['USER_LOGIN', 'PASSWORD_RESET', 'USER_UPDATE'];
    
    if (criticalEvents.includes(eventType)) return 'error';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Audit Logs</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => { fetchLogs(); fetchStats(); }} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Events
                </Typography>
                <Typography variant="h5">
                  {stats.summary.totalEvents.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Unique Users
                </Typography>
                <Typography variant="h5">
                  {stats.summary.uniqueUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Failed Logins
                </Typography>
                <Typography variant="h5" color="error">
                  {stats.summary.failedLogins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Successful Logins
                </Typography>
                <Typography variant="h5" color="success.main">
                  {stats.summary.successfulLogins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Admin Actions
                </Typography>
                <Typography variant="h5">
                  {stats.summary.adminActions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Security Events
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {stats.summary.securityEvents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {eventTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Code</InputLabel>
                <Select
                  value={filters.statusCode}
                  onChange={(e) => handleFilterChange('statusCode', e.target.value)}
                  label="Status Code"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="200">200 (Success)</MenuItem>
                  <MenuItem value="400">400 (Bad Request)</MenuItem>
                  <MenuItem value="401">401 (Unauthorized)</MenuItem>
                  <MenuItem value="403">403 (Forbidden)</MenuItem>
                  <MenuItem value="404">404 (Not Found)</MenuItem>
                  <MenuItem value="500">500 (Server Error)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="User Email"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Search by email..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Correlation ID"
                value={filters.correlationId}
                onChange={(e) => handleFilterChange('correlationId', e.target.value)}
                placeholder="Search by correlation ID..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="IP Address"
                value={filters.ipAddress}
                onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                placeholder="Search by IP..."
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleApplyFilters}
                fullWidth
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Timestamp</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Event Type</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>User</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>IP Address</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Method</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Path</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Duration</TableCell>
                      <TableCell align="center" sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 0.75 }}>
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow
                          key={log.correlationId}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{formatDate(log.timestamp)}</TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Chip
                              label={log.eventType || 'N/A'}
                              color={getEventTypeColor(log.eventType)}
                              size="small"
                              sx={{ height: 20, fontSize: '0.688rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{log.user?.email || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Chip label={log.user?.role || 'N/A'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.688rem' }} />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', py: 0.75 }}>
                            {log.request?.ip || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Chip label={log.request?.method || 'N/A'} size="small" sx={{ height: 20, fontSize: '0.688rem' }} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', py: 0.75, fontSize: '0.813rem' }}>
                            {log.request?.path || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Chip
                              label={log.response?.statusCode || 'N/A'}
                              color={getStatusColor(log.response?.statusCode)}
                              size="small"
                              sx={{ height: 20, fontSize: '0.688rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{log.response?.duration || 'N/A'}</TableCell>
                          <TableCell align="center" sx={{ py: 0.75 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(log)}
                                color="primary"
                                sx={{ p: 0.5 }}
                              >
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Correlation ID</Typography>
              <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                {selectedLog.correlationId}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Timestamp</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {formatDate(selectedLog.timestamp)}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Event Type</Typography>
              <Chip label={selectedLog.eventType} color={getEventTypeColor(selectedLog.eventType)} sx={{ mb: 2 }} />

              <Typography variant="subtitle2" gutterBottom>User Information</Typography>
              <Box sx={{ mb: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                <Typography variant="body2">Email: {selectedLog.user?.email || 'N/A'}</Typography>
                <Typography variant="body2">Role: {selectedLog.user?.role || 'N/A'}</Typography>
                <Typography variant="body2">User ID: {selectedLog.user?.id || 'N/A'}</Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Request Details</Typography>
              <Box sx={{ mb: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                <Typography variant="body2">Method: {selectedLog.request?.method}</Typography>
                <Typography variant="body2">Path: {selectedLog.request?.path}</Typography>
                <Typography variant="body2">URL: {selectedLog.request?.url}</Typography>
                <Typography variant="body2">IP: {selectedLog.request?.ip}</Typography>
                <Typography variant="body2">User Agent: {selectedLog.request?.userAgent}</Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Response Details</Typography>
              <Box sx={{ mb: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                <Typography variant="body2">
                  Status Code: <Chip label={selectedLog.response?.statusCode} color={getStatusColor(selectedLog.response?.statusCode)} size="small" />
                </Typography>
                <Typography variant="body2">Duration: {selectedLog.response?.duration}</Typography>
              </Box>

              {selectedLog.request?.body && Object.keys(selectedLog.request.body).length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Request Body</Typography>
                  <Box sx={{ mb: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.85em' }}>
                      {JSON.stringify(selectedLog.request.body, null, 2)}
                    </pre>
                  </Box>
                </>
              )}

              {selectedLog.previousHash && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Hash Chain</Typography>
                  <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75em', wordBreak: 'break-all' }}>
                      Current: {selectedLog.hash}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75em', wordBreak: 'break-all' }}>
                      Previous: {selectedLog.previousHash}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
