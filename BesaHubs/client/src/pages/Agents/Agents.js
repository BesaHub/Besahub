import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  Paper,
  useTheme,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search,
  People as PeopleIcon,
  Refresh,
  TrendingUp,
  Business,
  Contacts,
  Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { agentApi } from '../../services/agentApi';
import { useAuth } from '../../contexts/AuthContext';

const Agents = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const itemsPerPage = 12;

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentApi.getAgents({
        page: 1,
        limit: 100,
        isActive: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined
      });
      
      const agentsData = response.users || [];
      
      const agentsWithPerformance = await Promise.all(
        agentsData
          .filter(agent => ['agent', 'manager', 'admin'].includes(agent.role))
          .map(async (agent) => {
            try {
              const dashboardData = await agentApi.getAgentDashboard(agent.id);
              return {
                ...agent,
                activeProperties: dashboardData.stats?.activeProperties || 0,
                activeDeals: dashboardData.stats?.activeDeals || 0,
                totalContacts: dashboardData.stats?.totalContacts || 0,
                wonDeals: dashboardData.stats?.wonDeals || 0,
                totalDeals: dashboardData.stats?.totalDeals || 0,
                winRate: dashboardData.stats?.totalDeals > 0 
                  ? ((dashboardData.stats?.wonDeals || 0) / dashboardData.stats.totalDeals * 100).toFixed(1)
                  : 0
              };
            } catch (err) {
              return {
                ...agent,
                activeProperties: 0,
                activeDeals: 0,
                totalContacts: 0,
                wonDeals: 0,
                totalDeals: 0,
                winRate: 0
              };
            }
          })
      );
      
      setAgents(agentsWithPerformance);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load agents. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAgents = async () => {
    await fetchAgents();
    setSnackbar({
      open: true,
      message: 'Agents data refreshed successfully',
      severity: 'success'
    });
  };

  const filteredAndSortedAgents = useMemo(() => {
    let filtered = agents.filter(agent => {
      const matchesSearch = !searchTerm ||
        agent.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !filterRole || agent.role === filterRole;
      const matchesDepartment = !filterDepartment || agent.department === filterDepartment;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && agent.isActive) ||
        (filterStatus === 'inactive' && !agent.isActive);

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bVal = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'properties':
          aVal = a.activeProperties || 0;
          bVal = b.activeProperties || 0;
          break;
        case 'deals':
          aVal = a.activeDeals || 0;
          bVal = b.activeDeals || 0;
          break;
        case 'contacts':
          aVal = a.totalContacts || 0;
          bVal = b.totalContacts || 0;
          break;
        case 'winRate':
          aVal = parseFloat(a.winRate) || 0;
          bVal = parseFloat(b.winRate) || 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [agents, searchTerm, filterRole, filterDepartment, filterStatus, sortBy, sortOrder]);

  const paginatedAgents = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAgents.slice(startIndex, endIndex);
  }, [filteredAndSortedAgents, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedAgents.length / itemsPerPage);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleAgentClick = useCallback((agent) => {
    navigate(`/agents/${agent.id}`);
  }, [navigate]);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterDepartment('');
    setFilterStatus('active');
    setSortBy('name');
    setSortOrder('asc');
  };

  const uniqueDepartments = [...new Set(agents.map(a => a.department).filter(Boolean))].sort();

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      manager: 'warning',
      agent: 'primary',
      assistant: 'default'
    };
    return colors[role] || 'default';
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return 'success';
    if (winRate >= 50) return 'warning';
    return 'default';
  };

  const activeFiltersCount = [
    searchTerm,
    filterRole,
    filterDepartment,
    filterStatus !== 'active' ? filterStatus : null
  ].filter(Boolean).length;

  return (
    <Container maxWidth="xl" sx={{ py: theme.spacing(2) }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: theme.spacing(2) 
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>
            Team & Agents
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {filteredAndSortedAgents.length} agents found
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: theme.spacing(1) }}>
          <Button
            variant="outlined"
            onClick={refreshAgents}
            disabled={loading}
            sx={{ borderRadius: 3 }}
            startIcon={<Refresh className="icon-spin-hover" />}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ py: 1, px: 1.5, mb: theme.spacing(2), borderRadius: 3 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 3 } 
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                label="Role"
                onChange={(e) => setFilterRole(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={filterDepartment}
                label="Department"
                onChange={(e) => setFilterDepartment(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {uniqueDepartments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="properties">Properties</MenuItem>
                <MenuItem value="deals">Deals</MenuItem>
                <MenuItem value="contacts">Contacts</MenuItem>
                <MenuItem value="winRate">Win Rate</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              size="large"
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Grid>
        </Grid>

        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </Typography>
            <Button size="small" onClick={clearFilters}>
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {/* Agent Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : paginatedAgents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No agents found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or search criteria
          </Typography>
          {activeFiltersCount > 0 && (
            <Button onClick={clearFilters} sx={{ mt: 2 }}>
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedAgents.map((agent) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleAgentClick(agent)}
                >
                  <CardContent>
                    {/* Agent Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          bgcolor: 'primary.main'
                        }}
                      >
                        {agent.firstName?.charAt(0)}{agent.lastName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {agent.firstName} {agent.lastName}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {agent.title || 'Agent'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Role and Status Chips */}
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={agent.role} 
                        size="small" 
                        color={getRoleColor(agent.role)}
                      />
                      {!agent.isActive && (
                        <Chip 
                          label="Inactive" 
                          size="small" 
                          color="default"
                        />
                      )}
                    </Box>

                    {/* Department and Email */}
                    <Box sx={{ mb: 2 }}>
                      {agent.department && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          {agent.department}
                        </Typography>
                      )}
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {agent.email}
                      </Typography>
                    </Box>

                    {/* Performance Metrics */}
                    <Box 
                      sx={{ 
                        pt: 2, 
                        borderTop: `1px solid ${theme.palette.divider}`,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Business sx={{ fontSize: 12 }} />
                          Properties
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {agent.activeProperties || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUp sx={{ fontSize: 12 }} />
                          Deals
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {agent.activeDeals || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Contacts sx={{ fontSize: 12 }} />
                          Contacts
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {agent.totalContacts || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Assignment sx={{ fontSize: 12 }} />
                          Win Rate
                        </Typography>
                        <Chip 
                          label={`${agent.winRate}%`} 
                          size="small" 
                          color={getWinRateColor(parseFloat(agent.winRate))}
                          sx={{ mt: 0.5, height: 24, fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Snackbar for notifications */}
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

export default Agents;
