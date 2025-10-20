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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  Grid
} from '@mui/material';
import { Edit, Delete, Add, Security } from '@mui/icons-material';
import axios from 'axios';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data.roles);
      setError('');
    } catch (err) {
      setError('Failed to load roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data.permissions);
    } catch (err) {
      console.error('Failed to load permissions', err);
    }
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || ''
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSaveRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (editingRole) {
        await axios.put(`/api/admin/roles/${editingRole.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/roles', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      loadRoles();
      handleCloseDialog();
      setError('');
    } catch (err) {
      setError('Failed to save role');
      console.error(err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadRoles();
      setError('');
    } catch (err) {
      setError('Failed to delete role');
      console.error(err);
    }
  };

  const handleOpenPermissionDialog = (role) => {
    setSelectedRole(role);
    setPermissionDialogOpen(true);
  };

  const handleClosePermissionDialog = () => {
    setPermissionDialogOpen(false);
    setSelectedRole(null);
  };

  const handleTogglePermission = async (permissionId) => {
    if (!selectedRole) return;

    try {
      const token = localStorage.getItem('token');
      const hasPermission = selectedRole.permissions?.some(p => p.id === permissionId);

      if (hasPermission) {
        await axios.delete(`/api/admin/roles/${selectedRole.id}/permissions/${permissionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`/api/admin/roles/${selectedRole.id}/permissions`, { permissionId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      loadRoles();
      setError('');
    } catch (err) {
      setError('Failed to update permissions');
      console.error(err);
    }
  };

  const groupPermissionsByResource = () => {
    const grouped = {};
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    return grouped;
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
        <Typography variant="h5">Role Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Permissions</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>System Role</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{role.name}</TableCell>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{role.description}</TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Chip
                    icon={<Security sx={{ fontSize: 14 }} />}
                    label={role.permissions?.length || 0}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.688rem' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Chip
                    label={role.isSystem ? 'Yes' : 'No'}
                    size="small"
                    color={role.isSystem ? 'warning' : 'default'}
                    sx={{ height: 20, fontSize: '0.688rem' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenPermissionDialog(role)}
                    title="Manage Permissions"
                    sx={{ p: 0.5 }}
                  >
                    <Security sx={{ fontSize: 16 }} />
                  </IconButton>
                  {!role.isSystem && (
                    <>
                      <IconButton size="small" onClick={() => handleOpenDialog(role)} sx={{ p: 0.5 }}>
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteRole(role.id)} sx={{ p: 0.5 }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Role Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={permissionDialogOpen}
        onClose={handleClosePermissionDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Permissions - {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
              <Box key={resource} mb={3}>
                <Typography variant="h6" gutterBottom>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </Typography>
                <Grid container spacing={2}>
                  {perms.map((permission) => (
                    <Grid item xs={6} sm={4} key={permission.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedRole?.permissions?.some(p => p.id === permission.id)}
                            onChange={() => handleTogglePermission(permission.id)}
                          />
                        }
                        label={permission.action}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
