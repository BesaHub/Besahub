import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { Edit, Delete, Add, Close } from '@mui/icons-material';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadTeams();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      setUsers(response.data.users);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data.roles);
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  };

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data.teams);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      setError('');
      alert('User updated successfully');
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/roles`, { roleId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      setError('');
      alert('Role assigned successfully');
    } catch (err) {
      setError('Failed to assign role');
      console.error(err);
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      setError('');
      alert('Role removed successfully');
    } catch (err) {
      setError('Failed to remove role');
      console.error(err);
    }
  };

  const handleAssignTeam = async (userId, teamId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/teams`, { teamId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
      setError('');
      alert('Team assigned successfully');
    } catch (err) {
      setError('Failed to assign team');
      console.error(err);
    }
  };

  const openUserDrawer = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ width: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={filters.role}
            label="Role"
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="agent">Agent</MenuItem>
            <MenuItem value="assistant">Assistant</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={getStatusColor(user.isActive)}
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openUserDrawer(user)}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 500, p: 3 } }}
      >
        {selectedUser && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                {`${selectedUser.firstName} ${selectedUser.lastName}`}
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Email: {selectedUser.email}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Current Role: {selectedUser.role}
            </Typography>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Assign Role
              </Typography>
              <List>
                {roles.map((role) => (
                  <ListItem
                    key={role.id}
                    button
                    onClick={() => handleAssignRole(selectedUser.id, role.id)}
                  >
                    <ListItemText primary={role.name} secondary={role.description} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Assign Team
              </Typography>
              <List>
                {teams.map((team) => (
                  <ListItem
                    key={team.id}
                    button
                    onClick={() => handleAssignTeam(selectedUser.id, team.id)}
                  >
                    <ListItemText primary={team.name} secondary={team.description} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box mt={4}>
              <Button
                variant="contained"
                color={selectedUser.isActive ? 'error' : 'success'}
                fullWidth
                onClick={() =>
                  handleUpdateUser(selectedUser.id, { isActive: !selectedUser.isActive })
                }
              >
                {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default UserManagement;
