import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  useTheme,
  Typography,
  Divider,
} from '@mui/material';
import {
  Save,
  Close,
  Event,
  Assignment,
  Timer,
  Notes,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { taskApi } from '../../../services/api';

const TASK_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'property_showing', label: 'Property Showing' },
  { value: 'document_review', label: 'Document Review' },
  { value: 'market_analysis', label: 'Market Analysis' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const TaskDialog = ({ open, mode, task, onClose, onSuccess }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'other',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    startDate: '',
    reminderDate: '',
    notes: '',
    estimatedDuration: '',
    assignedToId: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Initialize form data when dialog opens or task changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && task) {
        // Format dates for input fields
        const formatDateForInput = (date) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        };

        const formatDateTimeForInput = (date) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().slice(0, 16);
        };

        setFormData({
          title: task.title || '',
          description: task.description || '',
          taskType: task.taskType || 'other',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          dueDate: formatDateForInput(task.dueDate),
          startDate: formatDateForInput(task.startDate),
          reminderDate: formatDateTimeForInput(task.reminderDate),
          notes: task.notes || '',
          estimatedDuration: task.estimatedDuration?.toString() || '',
          assignedToId: task.assignedToId || user?.id,
        });
      } else {
        // Reset to defaults for create mode
        setFormData({
          title: '',
          description: '',
          taskType: 'other',
          status: 'pending',
          priority: 'medium',
          dueDate: '',
          startDate: '',
          reminderDate: '',
          notes: '',
          estimatedDuration: '',
          assignedToId: user?.id || '',
        });
      }
      setErrors({});
      setApiError('');
    }
  }, [open, mode, task]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field: title
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    // Validate estimated duration if provided
    if (formData.estimatedDuration) {
      const duration = parseInt(formData.estimatedDuration);
      if (isNaN(duration) || duration < 0) {
        newErrors.estimatedDuration = 'Duration must be a positive number';
      }
    }

    // Validate dates if provided
    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const due = new Date(formData.dueDate);
      if (start > due) {
        newErrors.dueDate = 'Due date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setApiError('');

      // Prepare data for submission
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        taskType: formData.taskType,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        reminderDate: formData.reminderDate ? new Date(formData.reminderDate).toISOString() : null,
        notes: formData.notes.trim(),
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        assignedToId: formData.assignedToId || user?.id,
      };

      // Call appropriate API method
      if (mode === 'create') {
        await taskApi.create(submitData);
      } else {
        await taskApi.update(task.id, submitData);
      }

      // Call parent's onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }
      
      // Wait briefly to ensure list refresh completes, then close
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error('Error saving task:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          `Failed to ${mode === 'create' ? 'create' : 'update'} task`;
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[20],
        },
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <Assignment sx={{ color: theme.palette.primary.main }} />
        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
          {mode === 'create' ? 'Create Task' : 'Edit Task'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title || `${formData.title.length}/200 characters`}
                required
                disabled={loading}
                inputProps={{ maxLength: 200 }}
                placeholder="Enter task title..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={4}
                disabled={loading}
                placeholder="Describe the task details..."
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" error={!!errors.taskType}>
                <InputLabel>Task Type</InputLabel>
                <Select
                  value={formData.taskType}
                  label="Task Type"
                  onChange={(e) => handleInputChange('taskType', e.target.value)}
                  disabled={loading}
                >
                  {TASK_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.taskType && <FormHelperText>{errors.taskType}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={loading}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" error={!!errors.priority}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={loading}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Scheduling Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                <Event sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                Scheduling
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                error={!!errors.startDate}
                helperText={errors.startDate}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                error={!!errors.dueDate}
                helperText={errors.dueDate}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reminder Date"
                type="datetime-local"
                value={formData.reminderDate}
                onChange={(e) => handleInputChange('reminderDate', e.target.value)}
                error={!!errors.reminderDate}
                helperText={errors.reminderDate}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                error={!!errors.estimatedDuration}
                helperText={errors.estimatedDuration || 'Duration in minutes'}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Timer fontSize="small" />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            {/* Assignment Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                Assignment
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assigned To"
                value={user ? `${user.firstName || ''} ${user.lastName || ''} (${user.email})`.trim() : 'Current User'}
                disabled
                helperText={mode === 'create' ? 'Task will be assigned to you' : 'Reassignment not available in this view'}
              />
            </Grid>

            {/* Additional Information Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'text.secondary' }}>
                <Notes sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                Additional Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                multiline
                rows={4}
                disabled={loading}
                placeholder="Add any additional notes or details..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          px: 2, 
          py: 1.5, 
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}>
          <Button
            size="small"
            onClick={handleClose}
            disabled={loading}
            startIcon={<Close />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 2,
              minWidth: 100,
            }}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskDialog;
