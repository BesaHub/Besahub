import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Chip, Grid,
  Table, TableBody, TableCell, TableRow, Alert, Avatar, Divider
} from '@mui/material';
import { Edit as EditIcon, Assignment, Person, CalendarToday } from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../../services/api';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: task, isLoading, error } = useQuery(
    ['task', id],
    () => api.tasks.getById(id),
    { enabled: !!id }
  );

  if (isLoading) return <Typography>Loading task...</Typography>;
  if (error) return <Alert severity="error">Error loading task</Alert>;
  if (!task) return <Alert severity="warning">Task not found</Alert>;

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {task.title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/tasks/${id}/edit`)}
        >
          Edit Task
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assignment sx={{ mr: 1 }} />
                Task Details
              </Typography>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell>
                      <Chip 
                        label={task.status} 
                        color={getStatusColor(task.status)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Priority</strong></TableCell>
                    <TableCell>
                      <Chip 
                        label={task.priority} 
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Due Date</strong></TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell>{new Date(task.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Last Updated</strong></TableCell>
                    <TableCell>{new Date(task.updatedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                  {task.completedAt && (
                    <TableRow>
                      <TableCell><strong>Completed</strong></TableCell>
                      <TableCell>{new Date(task.completedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {task.description && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body1">{task.description}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1 }} />
                Assignment
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Assigned To</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                    {task.assignedTo?.firstName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {task.assignedTo ? 
                        `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                        'Unassigned'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.assignedTo?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>Created By</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                    {task.createdBy?.firstName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {task.createdBy ? 
                        `${task.createdBy.firstName} ${task.createdBy.lastName}` : 
                        'Unknown'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.createdBy?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskDetail;
