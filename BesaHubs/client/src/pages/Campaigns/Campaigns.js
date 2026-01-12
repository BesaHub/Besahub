import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Pagination,
  Tooltip
} from '@mui/material';
import {
  Add,
  Search,
  Email,
  MoreVert,
  Edit,
  Delete,
  ContentCopy,
  Schedule,
  Send,
  Pause,
  Cancel,
  Assessment,
  PersonAdd,
  CalendarToday,
  Refresh
} from '@mui/icons-material';
import { campaignApi, CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '../../services/campaignApi';

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, campaign: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState({ element: null, campaign: null });

  const itemsPerPage = 12;

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: itemsPerPage,
        search: searchTerm,
        status: filterStatus,
        type: filterType,
        sortBy,
        sortOrder
      };

      const response = await campaignApi.getCampaigns(params);
      setCampaigns(response.campaigns || []);
      setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
    } catch (err) {
      setError(err.message || 'Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterStatus, filterType, sortBy, sortOrder]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle menu actions
  const handleMenuOpen = (event, campaign) => {
    setMenuAnchor({ element: event.currentTarget, campaign });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, campaign: null });
  };

  const handleEdit = (campaign) => {
    navigate(`/campaigns/${campaign.id}/edit`);
    handleMenuClose();
  };

  const handleDuplicate = async (campaign) => {
    try {
      await campaignApi.duplicateCampaign(campaign.id);
      setSnackbar({
        open: true,
        message: 'Campaign duplicated successfully',
        severity: 'success'
      });
      fetchCampaigns();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to duplicate campaign',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleSchedule = (campaign) => {
    navigate(`/campaigns/${campaign.id}/edit`, { state: { tab: 'settings' } });
    handleMenuClose();
  };

  const handleSend = async (campaign) => {
    try {
      await campaignApi.sendCampaign(campaign.id);
      setSnackbar({
        open: true,
        message: 'Campaign sent successfully (SendGrid integration pending)',
        severity: 'info'
      });
      fetchCampaigns();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to send campaign',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handlePause = async (campaign) => {
    try {
      await campaignApi.pauseCampaign(campaign.id);
      setSnackbar({
        open: true,
        message: 'Campaign paused successfully',
        severity: 'success'
      });
      fetchCampaigns();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to pause campaign',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleCancel = async (campaign) => {
    try {
      await campaignApi.cancelCampaign(campaign.id);
      setSnackbar({
        open: true,
        message: 'Campaign cancelled successfully',
        severity: 'success'
      });
      fetchCampaigns();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to cancel campaign',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleDeleteClick = (campaign) => {
    setDeleteDialog({ open: true, campaign });
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await campaignApi.deleteCampaign(deleteDialog.campaign.id);
      setSnackbar({
        open: true,
        message: 'Campaign deleted successfully',
        severity: 'success'
      });
      fetchCampaigns();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete campaign',
        severity: 'error'
      });
    }
    setDeleteDialog({ open: false, campaign: null });
  };

  const handleViewAnalytics = (campaign) => {
    navigate(`/campaigns/${campaign.id}/analytics`);
  };

  const handleCardClick = (campaign) => {
    if (campaign.status === 'draft') {
      navigate(`/campaigns/${campaign.id}/edit`);
    } else {
      navigate(`/campaigns/${campaign.id}/analytics`);
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
    const statusObj = CAMPAIGN_STATUSES.find(s => s.id === status);
    return statusObj?.color || 'default';
  };

  // Get type label
  const getTypeLabel = (type) => {
    const typeObj = CAMPAIGN_TYPES.find(t => t.id === type);
    return typeObj?.name || type;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate analytics percentages
  const calculateRate = (count, total) => {
    if (!total || total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Marketing Campaigns
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={fetchCampaigns}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => navigate('/campaigns/new')}
          >
            Create Campaign
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {CAMPAIGN_STATUSES.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                {CAMPAIGN_TYPES.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="scheduledDate">Scheduled Date</MenuItem>
                <MenuItem value="sentDate">Sent Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Email sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No campaigns found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first marketing campaign to engage with your contacts
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/campaigns/new')}
          >
            Create Campaign
          </Button>
        </Paper>
      ) : (
        <>
          {/* Campaign Cards Grid */}
          <Grid container spacing={2}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleCardClick(campaign)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                    {/* Header with Status and Menu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Chip
                        label={campaign.status}
                        size="small"
                        color={getStatusColor(campaign.status)}
                        sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, campaign);
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Campaign Name */}
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                      {campaign.name}
                    </Typography>

                    {/* Campaign Type */}
                    <Chip
                      label={getTypeLabel(campaign.type)}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1, fontSize: '0.7rem', height: 20 }}
                    />

                    {/* Subject */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 40
                      }}
                    >
                      <strong>Subject:</strong> {campaign.subject || 'No subject'}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    {/* Dates */}
                    <Box sx={{ mb: 1.5 }}>
                      {campaign.status === 'scheduled' && campaign.scheduledDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Scheduled: {formatDate(campaign.scheduledDate)}
                          </Typography>
                        </Box>
                      )}
                      {campaign.status === 'sent' && campaign.sentDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Send sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Sent: {formatDate(campaign.sentDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Recipients */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <PersonAdd sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Recipients: {campaign.totalRecipients || 0}
                      </Typography>
                    </Box>

                    {/* Analytics (for sent campaigns) */}
                    {campaign.status === 'sent' && campaign.sentCount > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 0.5, bgcolor: 'success.light', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.dark' }}>
                                Opens
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'success.dark' }}>
                                {calculateRate(campaign.openedCount, campaign.sentCount)}%
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 0.5, bgcolor: 'info.light', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'info.dark' }}>
                                Clicks
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'info.dark' }}>
                                {calculateRate(campaign.clickedCount, campaign.sentCount)}%
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 1, pt: 0 }}>
                    {campaign.status === 'sent' && (
                      <Button
                        size="small"
                        startIcon={<Assessment />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAnalytics(campaign);
                        }}
                        fullWidth
                      >
                        View Analytics
                      </Button>
                    )}
                    {campaign.status === 'draft' && (
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(campaign);
                        }}
                        fullWidth
                      >
                        Edit Campaign
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="medium"
              />
            </Box>
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(menuAnchor.campaign)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDuplicate(menuAnchor.campaign)}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        {menuAnchor.campaign?.status === 'draft' && (
          <>
            <MenuItem onClick={() => handleSchedule(menuAnchor.campaign)}>
              <ListItemIcon>
                <Schedule fontSize="small" />
              </ListItemIcon>
              <ListItemText>Schedule</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleSend(menuAnchor.campaign)}>
              <ListItemIcon>
                <Send fontSize="small" />
              </ListItemIcon>
              <ListItemText>Send Now</ListItemText>
            </MenuItem>
          </>
        )}
        {menuAnchor.campaign?.status === 'sending' && (
          <MenuItem onClick={() => handlePause(menuAnchor.campaign)}>
            <ListItemIcon>
              <Pause fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pause</ListItemText>
          </MenuItem>
        )}
        {['draft', 'scheduled', 'paused'].includes(menuAnchor.campaign?.status) && (
          <MenuItem onClick={() => handleCancel(menuAnchor.campaign)}>
            <ListItemIcon>
              <Cancel fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cancel</ListItemText>
          </MenuItem>
        )}
        {menuAnchor.campaign?.status === 'sent' && (
          <MenuItem onClick={() => handleViewAnalytics(menuAnchor.campaign)}>
            <ListItemIcon>
              <Assessment fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Analytics</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleDeleteClick(menuAnchor.campaign)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, campaign: null })}>
        <DialogTitle>Delete Campaign?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.campaign?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, campaign: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default Campaigns;
