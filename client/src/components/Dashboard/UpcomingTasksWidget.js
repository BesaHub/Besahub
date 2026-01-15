import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, Typography, List, ListItem,
  ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton,
  Chip, Box, Button, Avatar, Divider, Tooltip, Badge, Alert,
  CircularProgress, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, LinearProgress
} from '@mui/material';
import {
  Schedule, CheckCircle, Pending, PlayArrow, PriorityHigh,
  MoreVert, Add, Edit, Delete, Phone, Email, LocationOn,
  Business, Person, AttachMoney, CalendarToday, TrendingUp,
  Warning, Info, Error
} from '@mui/icons-material';
import calendarApi from '../../services/calendarApi';

const UpcomingTasksWidget = ({ limit = 5, showHeader = true, onTaskClick }) => {
  const [upcomingData, setUpcomingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadUpcomingData();
  }, []);

  const loadUpcomingData = async () => {
    try {
      setLoading(true);
      const response = await calendarApi.getUpcoming(7, limit * 2); // Get more to filter tasks
      setUpcomingData(response.data);
    } catch (err) {
      setError('Failed to load upcoming tasks');
      console.error('Error loading upcoming data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <PriorityHigh />;
      case 'medium': return <Warning />;
      case 'low': return <Info />;
      default: return <Schedule />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <PlayArrow />;
      case 'pending': return <Pending />;
      case 'overdue': return <Error />;
      default: return <Schedule />;
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'follow_up': return <Phone />;
      case 'proposal': return <AttachMoney />;
      case 'marketing': return <TrendingUp />;
      case 'legal': return <Business />;
      case 'meeting': return <CalendarToday />;
      case 'property_viewing': return <LocationOn />;
      default: return <Schedule />;
    }
  };

  const formatTimeUntil = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = (due - now) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      return 'Overdue';
    } else if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d`;
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleTaskAction = (action) => {
    if (!selectedTask) return;

    switch (action) {
      case 'view':
        if (onTaskClick) {
          onTaskClick(selectedTask);
        }
        break;
      case 'edit':
        setOpenDialog(true);
        break;
      case 'complete':
        // Handle task completion
        break;
      case 'delete':
        // Handle task deletion
        break;
      default:
        break;
    }
    
    handleMenuClose();
  };

  const getProgressPercentage = (task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'in_progress' && task.metadata?.progress) {
      return task.metadata.progress;
    }
    return 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150, py: 2 }}>
          <CircularProgress size={32} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const tasks = upcomingData?.tasks || [];
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
  const overdueTasks = tasks.filter(task => isOverdue(task.dueDate)).length;

  return (
    <Card>
      {showHeader && (
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              <Typography variant="h6">Upcoming Tasks</Typography>
              <Badge badgeContent={tasks.length} color="primary" />
            </Box>
          }
          action={
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Add Task
            </Button>
          }
        />
      )}
      
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          <Chip
            icon={<PriorityHigh />}
            label={`${highPriorityTasks} High Priority`}
            color="error"
            size="small"
          />
          {overdueTasks > 0 && (
            <Chip
              icon={<Error />}
              label={`${overdueTasks} Overdue`}
              color="error"
              size="small"
            />
          )}
        </Box>

        {/* Tasks List */}
        <List dense>
          {tasks.slice(0, limit).map((task, index) => (
            <React.Fragment key={task.id}>
              <ListItem
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: isOverdue(task.dueDate) ? 'error.light' : 
                          task.priority === 'high' ? 'warning.light' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: getPriorityColor(task.priority) + '.main',
                      width: 32,
                      height: 32
                    }}
                  >
                    {getTaskTypeIcon(task.type)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 'bold',
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        label={formatTimeUntil(task.dueDate)}
                        color={isOverdue(task.dueDate) ? 'error' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {task.description}
                      </Typography>
                      
                      {/* Progress Bar */}
                      {task.status === 'in_progress' && (
                        <Box sx={{ mb: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getProgressPercentage(task)}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {getProgressPercentage(task)}% complete
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Status and Priority */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          icon={getStatusIcon(task.status)}
                          label={task.status.replace('_', ' ')}
                          color={getStatusColor(task.status)}
                          size="small"
                        />
                        <Chip
                          icon={getPriorityIcon(task.priority)}
                          label={task.priority}
                          color={getPriorityColor(task.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, task)}
                  >
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < tasks.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Show More Button */}
        {tasks.length > limit && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              size="small"
              onClick={() => {
                // Navigate to full tasks view
                if (onTaskClick) {
                  onTaskClick({ type: 'view_all_tasks' });
                }
              }}
            >
              View All Tasks ({tasks.length})
            </Button>
          </Box>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Schedule sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No upcoming tasks
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ mt: 1 }}
            >
              Add Your First Task
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleTaskAction('view')}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTaskAction('edit')}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Task</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTaskAction('complete')}>
          <ListItemIcon><CheckCircle /></ListItemIcon>
          <ListItemText>Mark Complete</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleTaskAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTask ? 'Edit Task' : 'Add New Task'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Task Title"
              defaultValue={selectedTask?.title || ''}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              defaultValue={selectedTask?.description || ''}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  defaultValue={selectedTask?.priority || 'medium'}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  defaultValue={selectedTask?.type || 'follow_up'}
                  label="Type"
                >
                  <MenuItem value="follow_up">Follow Up</MenuItem>
                  <MenuItem value="proposal">Proposal</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                  <MenuItem value="meeting">Meeting</MenuItem>
                  <MenuItem value="property_viewing">Property Viewing</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              defaultValue={selectedTask?.dueDate ? new Date(selectedTask.dueDate).toISOString().slice(0, 16) : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained">
            {selectedTask ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default UpcomingTasksWidget;
