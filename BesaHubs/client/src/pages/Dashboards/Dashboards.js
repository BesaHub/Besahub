import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { getDashboards, deleteDashboard, setDefaultDashboard } from '../../services/dashboardApi';
import { LoadingSpinner } from '../../components/LoadingOptimization/LoadingSpinner';

const Dashboards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myDashboards, setMyDashboards] = useState([]);
  const [sharedDashboards, setSharedDashboards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboards();
      
      if (response.success) {
        setMyDashboards(response.data.myDashboards || []);
        setSharedDashboards(response.data.sharedDashboards || []);
      }
    } catch (err) {
      console.error('Error fetching dashboards:', err);
      setError(err.response?.data?.message || 'Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = () => {
    navigate('/dashboards/new');
  };

  const handleOpenDashboard = (id) => {
    navigate(`/dashboards/${id}`);
  };

  const handleMenuOpen = (event, dashboard) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedDashboard(dashboard);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDashboard(null);
  };

  const handleSetDefault = async () => {
    try {
      await setDefaultDashboard(selectedDashboard.id);
      handleMenuClose();
      fetchDashboards();
    } catch (err) {
      console.error('Error setting default dashboard:', err);
      setError('Failed to set default dashboard');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await deleteDashboard(selectedDashboard.id);
        handleMenuClose();
        fetchDashboards();
      } catch (err) {
        console.error('Error deleting dashboard:', err);
        setError('Failed to delete dashboard');
      }
    }
  };

  const filterDashboards = (dashboards) => {
    if (!searchTerm) return dashboards;
    
    const term = searchTerm.toLowerCase();
    return dashboards.filter(dashboard =>
      dashboard.name?.toLowerCase().includes(term) ||
      dashboard.description?.toLowerCase().includes(term)
    );
  };

  const DashboardCard = ({ dashboard, isShared = false }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        '&:hover': { boxShadow: 6 }
      }}
      onClick={() => handleOpenDashboard(dashboard.id)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            <DashboardIcon color="primary" />
            <Typography variant="h6" noWrap>
              {dashboard.name}
            </Typography>
            {dashboard.isDefault && (
              <StarIcon color="warning" fontSize="small" />
            )}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, dashboard)}
          >
            <MoreIcon />
          </IconButton>
        </Box>

        {dashboard.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 1, mb: 2 }}
            noWrap
          >
            {dashboard.description}
          </Typography>
        )}

        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            label={`${dashboard.widgets?.length || 0} widgets`} 
            size="small" 
            variant="outlined"
          />
          {isShared && (
            <Chip 
              label={`Shared by ${dashboard.user?.firstName} ${dashboard.user?.lastName}`}
              size="small"
              color="secondary"
              variant="outlined"
              icon={<ShareIcon />}
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboards
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateDashboard}
        >
          Create Dashboard
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search dashboards..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          My Dashboards
        </Typography>
        {filterDashboards(myDashboards).length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                No dashboards found. Create your first dashboard to get started.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filterDashboards(myDashboards).map((dashboard) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dashboard.id}>
                <DashboardCard dashboard={dashboard} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {sharedDashboards.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Shared With Me
          </Typography>
          <Grid container spacing={2}>
            {filterDashboards(sharedDashboards).map((dashboard) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dashboard.id}>
                <DashboardCard dashboard={dashboard} isShared />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleOpenDashboard(selectedDashboard?.id);
          handleMenuClose();
        }}>
          View Dashboard
        </MenuItem>
        {selectedDashboard && !selectedDashboard.isDefault && (
          <MenuItem onClick={handleSetDefault}>
            <StarBorderIcon fontSize="small" sx={{ mr: 1 }} />
            Set as Default
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Dashboards;
