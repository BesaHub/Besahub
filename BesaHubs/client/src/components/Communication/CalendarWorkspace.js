import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useCommunication } from '../../contexts/CommunicationContext';
import api from '../../services/api';

const CalendarWorkspace = () => {
  const { calendarDrawerOpen, setCalendarDrawerOpen } = useCommunication();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(dayjs());
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (calendarDrawerOpen) {
      fetchTasks();
    }
  }, [calendarDrawerOpen]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!title) {
      alert('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tasks', {
        title,
        description,
        dueDate: dueDate.toISOString(),
        priority,
        status: 'pending'
      });
      alert('Task created successfully');
      setTitle('');
      setDescription('');
      setDueDate(dayjs());
      setPriority('medium');
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCalendarDrawerOpen(false);
    setTitle('');
    setDescription('');
    setDueDate(dayjs());
    setPriority('medium');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={calendarDrawerOpen}
      onClose={handleClose}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 450, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" />
            Calendar & Tasks
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Task
          </Typography>

          <TextField
            fullWidth
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            sx={{ mb: 2 }}
          />

          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(newValue) => setDueDate(newValue)}
            sx={{ width: '100%', mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            onClick={handleCreateTask}
            disabled={loading}
            startIcon={<AddIcon />}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Upcoming Tasks
          </Typography>
          <List>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No tasks yet
              </Typography>
            ) : (
              tasks.slice(0, 10).map((task) => (
                <ListItem
                  key={task.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority)}
                      />
                      <Chip
                        label={task.status}
                        size="small"
                        color={getStatusColor(task.status)}
                      />
                    </Box>
                  </Box>
                  {task.description && (
                    <Typography variant="caption" sx={{ mb: 1 }}>
                      {task.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="textSecondary">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </Typography>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CalendarWorkspace;
