import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Tooltip,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import {
  Add,
  Search,
  CheckCircle,
  Edit,
  Delete,
  Sort,
  Assignment,
  Warning,
  Clear,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { TableSkeleton } from '../../components/Common/LoadingSkeletons';
import EmptyState from '../../components/Common/EmptyState';
import useScrollReveal from '../../utils/useScrollReveal';
import TaskDialog from './components/TaskDialog';

const Tasks = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tableRef, tableVisible] = useScrollReveal({ threshold: 0.05 });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasksData, isLoading, error, refetch } = useQuery(
    ['tasks'],
    async () => {
      const response = await taskApi.getAll({
        page: 1,
        limit: 100,
      });
      return response.data || { tasks: [] };
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasks = useMemo(() => tasksData?.tasks || [], [tasksData]);

  const completeMutation = useMutation(
    (taskId) => taskApi.complete(taskId, {}),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        setSnackbar({
          open: true,
          message: 'Task marked as complete',
          severity: 'success',
        });
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Failed to complete task',
          severity: 'error',
        });
      },
    }
  );

  const deleteMutation = useMutation(
    (taskId) => taskApi.delete(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        setSnackbar({
          open: true,
          message: 'Task deleted successfully',
          severity: 'success',
        });
        setDeleteDialog({ open: false, task: null });
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Failed to delete task',
          severity: 'error',
        });
        setDeleteDialog({ open: false, task: null });
      },
    }
  );

  const handleComplete = useCallback((task) => {
    if (task.status !== 'completed') {
      completeMutation.mutate(task.id);
    }
  }, [completeMutation]);

  const handleEdit = useCallback((task) => {
    setDialogMode('edit');
    setSelectedTask(task);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((task) => {
    setDeleteDialog({ open: true, task });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteDialog.task) {
      deleteMutation.mutate(deleteDialog.task.id);
    }
  }, [deleteDialog.task, deleteMutation]);

  const handleAddTask = useCallback(() => {
    setDialogMode('create');
    setSelectedTask(null);
    setDialogOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterView('all');
    setFilterStatus('');
    setFilterPriority('');
  }, []);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch = !searchTerm ||
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesView = 
        filterView === 'all' ? true :
        filterView === 'my' ? task.assignedToId === user?.id :
        filterView === 'overdue' ? new Date(task.dueDate) < new Date() && task.status !== 'completed' :
        true;

      const matchesStatus = !filterStatus || task.status === filterStatus;
      const matchesPriority = !filterPriority || task.priority === filterPriority;

      return matchesSearch && matchesView && matchesStatus && matchesPriority;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate) : new Date('2099-12-31');
          bVal = b.dueDate ? new Date(b.dueDate) : new Date('2099-12-31');
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          aVal = priorityOrder[a.priority] ?? 4;
          bVal = priorityOrder[b.priority] ?? 4;
          break;
        default:
          return 0;
      }

      return aVal > bVal ? 1 : -1;
    });

    return filtered;
  }, [tasks, searchTerm, filterView, filterStatus, filterPriority, sortBy, user?.id]);

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'error',
      high: 'error',
      medium: 'warning',
      low: 'success',
    };
    return colors[priority] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeFilterCount = [filterStatus, filterPriority].filter(Boolean).length;

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: theme.spacing(3) }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.response?.data?.message || 'Failed to load tasks. Please try again.'}
        </Alert>
        <Button variant="contained" startIcon={<Refresh />} onClick={() => refetch()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: theme.spacing(3) }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: theme.spacing(3),
        animation: 'fadeInScale 0.5s ease-out'
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: theme.spacing(0.5) }}>
            Tasks & Activities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {filteredAndSortedTasks.length > 0 
              ? `${filteredAndSortedTasks.length} ${filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}`
              : 'No tasks found'
            }
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: theme.spacing(1), alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}
            sx={{ 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[15]
              },
              '& .MuiButton-startIcon': {
                transition: 'transform 0.3s ease'
              },
              '&:hover .MuiButton-startIcon': {
                transform: 'rotate(180deg)'
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddTask}
            sx={{ 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[15]
              }
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ 
        p: theme.spacing(3), 
        mb: theme.spacing(3), 
        borderRadius: 3,
        animation: 'fadeInUp 0.6s ease-out',
        animationDelay: '0.1s',
        animationFillMode: 'both'
      }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                flex: 1, 
                minWidth: { xs: '100%', sm: 250 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<Sort sx={{ mr: 1, color: 'text.secondary' }} />}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="dueDate">Due Date</MenuItem>
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={filterView}
              exclusive
              onChange={(e, newView) => newView && setFilterView(newView)}
              sx={{ 
                '& .MuiToggleButton-root': {
                  borderRadius: 2,
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }
              }}
            >
              <ToggleButton value="all">All Tasks</ToggleButton>
              <ToggleButton value="my">My Tasks</ToggleButton>
              <ToggleButton value="overdue">Overdue</ToggleButton>
            </ToggleButtonGroup>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            {(searchTerm || filterStatus || filterPriority || filterView !== 'all') && (
              <Button
                startIcon={<Clear />}
                onClick={handleClearFilters}
                size="small"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Clear Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      {isLoading ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 1, fontSize: '0.813rem' }}>Title</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.813rem' }}>Status</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.813rem' }}>Priority</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.813rem' }}>Due Date</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.813rem' }}>Assigned To</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.813rem' }}>Type</TableCell>
                <TableCell align="right" sx={{ py: 1, fontSize: '0.813rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableSkeleton rows={10} />
            </TableBody>
          </Table>
        </TableContainer>
      ) : filteredAndSortedTasks.length === 0 ? (
        <Paper sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
          <EmptyState
            icon={Assignment}
            title={tasks.length === 0 ? 'No tasks yet' : 'No tasks found'}
            message={
              tasks.length === 0
                ? 'Get started by creating your first task to stay organized and on track.'
                : 'Try adjusting your filters or search criteria to find what you\'re looking for.'
            }
            actionLabel={tasks.length === 0 ? 'Create First Task' : undefined}
            onAction={tasks.length === 0 ? handleAddTask : undefined}
          />
        </Paper>
      ) : (
        <TableContainer 
          component={Paper} 
          ref={tableRef}
          sx={{ 
            borderRadius: 3, 
            boxShadow: theme.shadows[2],
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, py: 1, fontSize: '0.813rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTasks.map((task) => (
                <TableRow 
                  key={task.id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.813rem' }}>
                        {task.title || 'Untitled Task'}
                      </Typography>
                      {isOverdue(task.dueDate, task.status) && (
                        <Tooltip title="Overdue">
                          <Warning sx={{ fontSize: 14, color: 'error.main' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Chip 
                      label={task.status?.replace('_', ' ').toUpperCase() || 'PENDING'} 
                      color={getStatusColor(task.status)}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.688rem',
                        height: 20,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Chip 
                      label={task.priority?.toUpperCase() || 'MEDIUM'} 
                      color={getPriorityColor(task.priority)}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.688rem',
                        height: 20,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.813rem',
                        color: isOverdue(task.dueDate, task.status) ? 'error.main' : 'text.primary',
                        fontWeight: isOverdue(task.dueDate, task.status) ? 600 : 400,
                      }}
                    >
                      {formatDate(task.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.813rem' }}>
                      {task.assignedTo 
                        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` 
                        : 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize', fontSize: '0.813rem' }}>
                      {task.taskType?.replace('_', ' ') || 'General'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                      {task.status !== 'completed' && (
                        <Tooltip title="Mark Complete">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(task);
                            }}
                            sx={{ 
                              color: 'success.main',
                              '&:hover': { bgcolor: 'success.lighter' },
                              p: 0.5
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(task);
                          }}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.lighter' },
                            p: 0.5
                          }}
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task);
                          }}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' },
                            p: 0.5
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, task: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.task?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, task: null })}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isLoading}
            sx={{ textTransform: 'none' }}
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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

      <TaskDialog
        open={dialogOpen}
        mode={dialogMode}
        task={selectedTask}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['tasks']);
          queryClient.invalidateQueries(['dashboard']);
          refetch();
        }}
      />
    </Container>
  );
};

export default Tasks;
