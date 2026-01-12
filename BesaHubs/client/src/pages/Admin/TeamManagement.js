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
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Edit, Delete, Add, People } from '@mui/icons-material';
import axios from 'axios';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
    parentTeamId: ''
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data.teams);
      setError('');
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        description: team.description || '',
        leaderId: team.leaderId || '',
        parentTeamId: team.parentTeamId || ''
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        description: '',
        leaderId: '',
        parentTeamId: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      leaderId: '',
      parentTeamId: ''
    });
  };

  const handleSaveTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      if (editingTeam) {
        await axios.put(`/api/admin/teams/${editingTeam.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/teams', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      loadTeams();
      handleCloseDialog();
      setError('');
    } catch (err) {
      setError('Failed to save team');
      console.error(err);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTeams();
      setError('');
    } catch (err) {
      setError('Failed to delete team');
      console.error(err);
    }
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
        <Typography variant="h5">Team Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Team
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
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Leader</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Members</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ py: 0.75, fontSize: '0.813rem', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{team.name}</TableCell>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>{team.description}</TableCell>
                <TableCell sx={{ py: 0.75, fontSize: '0.813rem' }}>
                  {team.leader ? `${team.leader.firstName} ${team.leader.lastName}` : 'N/A'}
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Chip
                    icon={<People sx={{ fontSize: 14 }} />}
                    label={team.members?.length || 0}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.688rem' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Chip
                    label={team.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={team.isActive ? 'success' : 'default'}
                    sx={{ height: 20, fontSize: '0.688rem' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <IconButton size="small" onClick={() => handleOpenDialog(team)} sx={{ p: 0.5 }}>
                    <Edit sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteTeam(team.id)} sx={{ p: 0.5 }}>
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeam ? 'Edit Team' : 'Add Team'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Team Name"
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
          <Button onClick={handleSaveTeam} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;
