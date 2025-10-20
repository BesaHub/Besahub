import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon
} from '@mui/icons-material';
import { shareDashboard } from '../../services/dashboardApi';

const ROLES = ['admin', 'manager', 'agent', 'assistant'];

const ShareDashboardDialog = ({ open, onClose, dashboard }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentShares, setCurrentShares] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (dashboard && dashboard.sharedWith) {
      const shares = dashboard.sharedWith || [];
      setCurrentShares(shares);
      
      const roles = shares.filter(s => ROLES.includes(s));
      const users = shares.filter(s => !ROLES.includes(s));
      
      setSelectedRoles(roles);
      setSelectedUsers(users);
    }
  }, [dashboard]);

  const handleShare = async () => {
    try {
      setError(null);
      const shareData = {
        userIds: selectedUsers,
        roles: selectedRoles
      };

      const response = await shareDashboard(dashboard.id, shareData);
      
      if (response.success) {
        setSuccess('Dashboard shared successfully');
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error sharing dashboard:', err);
      setError(err.response?.data?.message || 'Failed to share dashboard');
    }
  };

  const handleRemoveShare = (shareId) => {
    if (ROLES.includes(shareId)) {
      setSelectedRoles(selectedRoles.filter(r => r !== shareId));
    } else {
      setSelectedUsers(selectedUsers.filter(u => u !== shareId));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Dashboard</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Share with roles
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Roles</InputLabel>
            <Select
              multiple
              value={selectedRoles}
              onChange={(e) => setSelectedRoles(e.target.value)}
              label="Roles"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {currentShares.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Current Shares
            </Typography>
            <List dense>
              {currentShares.map((share) => (
                <ListItem key={share}>
                  <ListItemText
                    primary={ROLES.includes(share) ? `Role: ${share}` : `User ID: ${share}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveShare(share)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Note: Users with shared access can view this dashboard but cannot edit it.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleShare}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDashboardDialog;
