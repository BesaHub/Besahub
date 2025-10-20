import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  SupervisorAccount,
  People,
  Business,
  Home,
  TrendingUp,
  Security,
  Settings,
  AttachMoney,
  Analytics,
  MoreVert,
  Edit,
  Delete,
  Add,
  Visibility,
  VisibilityOff,
  Groups
} from '@mui/icons-material';
import { userApi, dashboardApi, adminApi } from '../../services/api';
import UserManagement from './UserManagement';
import TeamManagement from './TeamManagement';
import RoleManagement from './RoleManagement';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [adminData, setAdminData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialog, setUserDialog] = useState(false);
  const [systemStats, setSystemStats] = useState({});

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch admin data first, fallback to regular data
      let dashData = {};
      let userData = [];

      try {
        const adminResponse = await adminApi.getOverview();
        dashData = adminResponse.data || adminResponse;
        userData = dashData.users || [];
      } catch (adminError) {
        console.warn('Admin API not accessible, using fallback data:', adminError);

        // Fallback to regular APIs
        const [dashboardResponse, usersResponse] = await Promise.all([
          dashboardApi.getOverview().catch(() => ({ data: null })),
          userApi.getAll().catch(() => ({ data: [] }))
        ]);

        dashData = dashboardResponse.data || {};
        userData = Array.isArray(usersResponse.data) ? usersResponse.data :
                   Array.isArray(usersResponse) ? usersResponse : [];
      }

      setAdminData(dashData);
      setUsers(userData);

      // Calculate system statistics
      const stats = {
        totalUsers: userData.length,
        activeUsers: userData.filter(u => u.isActive).length,
        adminUsers: userData.filter(u => u.role === 'admin').length,
        agentUsers: userData.filter(u => u.role === 'agent').length,
        managerUsers: userData.filter(u => u.role === 'manager').length,
        recentLogins: userData.filter(u => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return u.lastLogin && new Date(u.lastLogin) > oneWeekAgo;
        }).length,
        totalProperties: dashData.properties?.inventoryStats?.totalProperties || 0,
        totalDeals: dashData.pipeline?.totalPipeline?.reduce((sum, p) => sum + (parseInt(p.count) || 0), 0) || 0,
        pipelineValue: dashData.pipeline?.totalPipeline?.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0) || 0
      };

      setSystemStats(stats);

    } catch (error) {
      console.error('Admin dashboard error:', error);
      setError('Failed to load admin dashboard data');

      // Fallback data for demo
      setUsers([
        {
          id: '1',
          firstName: 'Demo',
          lastName: 'Admin',
          email: 'admin@demo.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date()
        }
      ]);
      setSystemStats({
        totalUsers: 1,
        activeUsers: 1,
        adminUsers: 1,
        agentUsers: 0,
        managerUsers: 0,
        recentLogins: 1,
        totalProperties: 3,
        totalDeals: 0,
        pipelineValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const updatedUser = await userApi.update(userId, { isActive: !currentStatus });
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserDialog(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.delete(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card className="admin-stat-card" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="success.main">
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SupervisorAccount />
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* System Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={systemStats.totalUsers}
            icon={<People />}
            color="#1976d2"
            subtitle={`${systemStats.activeUsers} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Revenue"
            value={`$${(systemStats.pipelineValue / 1000).toFixed(0)}K`}
            icon={<AttachMoney />}
            color="#2e7d32"
            subtitle="Pipeline value"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Properties"
            value={systemStats.totalProperties}
            icon={<Home />}
            color="#f57c00"
            subtitle="Total listings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Deals"
            value={systemStats.totalDeals}
            icon={<Business />}
            color="#7b1fa2"
            subtitle="In pipeline"
          />
        </Grid>
      </Grid>

      {/* Role Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Administrators"
            value={systemStats.adminUsers}
            icon={<Security />}
            color="#d32f2f"
            subtitle="Super users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Managers"
            value={systemStats.managerUsers}
            icon={<SupervisorAccount />}
            color="#1976d2"
            subtitle="Team leads"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Agents"
            value={systemStats.agentUsers}
            icon={<People />}
            color="#388e3c"
            subtitle="Sales team"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Logins"
            value={systemStats.recentLogins}
            icon={<Analytics />}
            color="#f57c00"
            subtitle="Past 7 days"
          />
        </Grid>
      </Grid>

      {/* RBAC Management Tabs */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Users" icon={<People />} iconPosition="start" />
          <Tab label="Teams" icon={<Groups />} iconPosition="start" />
          <Tab label="Roles" icon={<Security />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TeamManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <RoleManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;