import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Alert,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Tooltip,
  Avatar,
  Skeleton,
  Checkbox,
  Toolbar
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Visibility,
  Person,
  Schedule,
  TrendingUp,
  Refresh,
  ViewList,
  AttachMoney,
  Assignment,
  Close,
  Archive,
  SwapHoriz
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dealApi, DEAL_STAGES, DEAL_PRIORITIES } from '../../services/dealApi';
import useScrollReveal from '../../utils/useScrollReveal';
import EmptyState from '../../components/Common/EmptyState';

// Sortable Deal Item Component
const SortableDealItem = ({ deal, stage, onMenuClick, onViewDeal, onEditDeal, selectedDeals, onSelectDeal, getPriorityInfo, getStageGradient, getPriorityGradient, theme, formatCurrency }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityInfo = getPriorityInfo(deal.priority);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 0.75,
        cursor: 'grab',
        borderRadius: 2,
        boxShadow: isDragging ? 3 : 1,
        transform: isDragging ? 'rotate(5deg)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          '& .quick-actions': {
            opacity: 1,
            visibility: 'visible'
          }
        }
      }}
    >
      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Checkbox
          checked={selectedDeals.has(deal.id)}
          onChange={(e) => onSelectDeal(deal.id, e)}
          onClick={(e) => e.stopPropagation()}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            zIndex: 10,
            padding: 0.5,
            color: 'white',
            '&.Mui-checked': {
              color: theme.palette.gradient.secondary.main
            }
          }}
        />
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Chip
            label={priorityInfo.name}
            size="small"
            sx={{ 
              background: getPriorityGradient(deal.priority, theme),
              color: 'white',
              fontSize: '0.688rem',
              height: 18,
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: 'none'
            }}
          />
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(e, deal);
            }}
            sx={{ 
              p: 0.5,
              transition: 'all 0.2s',
              '&:hover': { 
                backgroundColor: 'action.hover',
                transform: 'scale(1.1)'
              }
            }}
          >
            <MoreVert sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Deal Name */}
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 600, 
            fontSize: '0.875rem',
            mb: 0.5,
            display: 'block',
            cursor: 'pointer',
            transition: 'color 0.2s',
            '&:hover': { 
              background: theme.palette.gradient.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDeal(deal);
          }}
        >
          {deal.name}
        </Typography>

        {/* Value with Gradient */}
        <Typography 
          variant="subtitle1" 
          sx={{ 
            background: theme.palette.gradient.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700, 
            fontSize: '1rem',
            mb: 0.5 
          }}
        >
          {formatCurrency(deal.value)}
        </Typography>

        {/* Probability with Gradient Progress */}
        <Box sx={{ mb: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
              Probability
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.688rem' }}>
              {deal.probability}%
            </Typography>
          </Box>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${deal.probability}%`,
                background: theme.palette.gradient.success,
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>

        {/* Quick Action Buttons on Hover */}
        <Box
          className="quick-actions"
          sx={{
            display: 'flex',
            gap: 0.5,
            mt: 0.5,
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Tooltip title="View Deal">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onViewDeal(deal);
              }}
              sx={{
                flex: 1,
                borderRadius: 1.5,
                p: 0.5,
                background: theme.palette.gradient.info,
                color: 'white',
                '&:hover': {
                  background: theme.palette.gradient.info,
                  opacity: 0.9
                }
              }}
            >
              <Visibility sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Deal">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEditDeal(deal);
              }}
              sx={{
                flex: 1,
                borderRadius: 1.5,
                p: 0.5,
                background: theme.palette.gradient.warning,
                color: 'white',
                '&:hover': {
                  background: theme.palette.gradient.warning,
                  opacity: 0.9
                }
              }}
            >
              <Edit sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stage Indicator */}
        <Box sx={{ mt: 0.5, mb: 0.5 }}>
          <Chip
            label={stage.name}
            size="small"
            sx={{
              background: getStageGradient(stage.id, theme),
              color: 'white',
              fontSize: '0.688rem',
              height: 18,
              fontWeight: 600,
              backdropFilter: 'blur(10px)'
            }}
          />
        </Box>

        {/* Contact */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Person sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.688rem' }}>
            {deal.contact?.type === 'company' 
              ? deal.contact?.companyName
              : `${deal.contact?.firstName} ${deal.contact?.lastName}`
            }
          </Typography>
        </Box>

        {/* Close Date */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Schedule sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
            {new Date(deal.expectedCloseDate).toLocaleDateString()}
          </Typography>
        </Box>

        {/* Assigned To */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 16, height: 16, mr: 0.5, fontSize: '0.625rem' }}>
            {deal.assignedTo?.firstName?.[0]}
          </Avatar>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
            {deal.assignedTo?.firstName} {deal.assignedTo?.lastName}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const Pipeline = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.1 });
  const [dealsByStage, setDealsByStage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState({ element: null, deal: null });
  const [stageDialog, setStageDialog] = useState({ open: false, deal: null, newStage: '', notes: '' });
  const [probabilityDialog, setProbabilityDialog] = useState({ open: false, deal: null, probability: 50 });
  const [pipelineStats, setPipelineStats] = useState({
    totalValue: 0,
    totalDeals: 0,
    averageDealSize: 0,
    winRate: 0
  });
  const [selectedDeals, setSelectedDeals] = useState(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState({ type: '', value: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchPipelineData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dealsResponse, statsResponse] = await Promise.all([
        dealApi.getDealsByStage(),
        dealApi.getPipelineStats()
      ]);
      
      if (dealsResponse && dealsResponse.dealsByStage) {
        setDealsByStage(dealsResponse.dealsByStage);
      } else {
        setDealsByStage({});
      }
      
      if (statsResponse && statsResponse.stats) {
        setPipelineStats(statsResponse.stats);
      } else {
        setPipelineStats({
          totalValue: 0,
          totalDeals: 0,
          averageDealSize: 0,
          winRate: 0
        });
      }
    } catch (err) {
      console.error('Failed to load pipeline data:', err);
      setDealsByStage({});
      setPipelineStats({
        totalValue: 0,
        totalDeals: 0,
        averageDealSize: 0,
        winRate: 0
      });
      setSnackbar({
        open: true,
        message: 'Failed to load pipeline data. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelineData();
  }, [fetchPipelineData]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Find which stage the active deal is in
    let sourceStageId = null;
    let dealIndex = -1;
    let deal = null;

    for (const [stageId, deals] of Object.entries(dealsByStage)) {
      const index = deals.findIndex(d => String(d.id) === activeId);
      if (index !== -1) {
        sourceStageId = stageId;
        dealIndex = index;
        deal = deals[index];
        break;
      }
    }

    if (!deal || !sourceStageId) return;

    // Determine destination stage
    let destStageId = sourceStageId;
    
    // If over is a different stage container
    if (overId !== sourceStageId && DEAL_STAGES.some(stage => stage.id === overId)) {
      destStageId = overId;
    }

    // Deep clone to avoid mutations
    const newDealsByStage = {};
    Object.keys(dealsByStage).forEach(key => {
      newDealsByStage[key] = [...(dealsByStage[key] || [])];
    });
    
    // Remove from source
    const [removed] = newDealsByStage[sourceStageId].splice(dealIndex, 1);
    
    // Add to destination with updated stage and probability
    const destStage = DEAL_STAGES.find(stage => stage.id === destStageId);
    const updatedDeal = {
      ...removed,
      stage: destStageId,
      probability: destStage ? destStage.probability : removed.probability
    };
    
    // Add to destination  
    newDealsByStage[destStageId] = newDealsByStage[destStageId] || [];
    newDealsByStage[destStageId].push(updatedDeal);
    
    // Store previous state for revert
    const previousState = dealsByStage;
    
    // Optimistic update
    setDealsByStage(newDealsByStage);

    // Update backend
    try {
      await dealApi.updateDealStage(removed.id, destStageId, `Moved from ${sourceStageId} to ${destStageId}`);
      setSnackbar({
        open: true,
        message: `Deal moved to ${destStage?.name || destStageId}`,
        severity: 'success'
      });
    } catch (err) {
      // Revert to pristine previous state
      setDealsByStage(previousState);
      setSnackbar({
        open: true,
        message: 'Failed to update deal stage',
        severity: 'error'
      });
    }
  }, [dealsByStage]);

  const handleMenuClick = useCallback((event, deal) => {
    setMenuAnchor({ element: event.currentTarget, deal });
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor({ element: null, deal: null });
  }, []);

  const handleViewDeal = useCallback((deal) => {
    navigate(`/deals/${deal.id}`);
  }, [navigate]);

  const handleEditDeal = useCallback((deal) => {
    navigate(`/deals/${deal.id}/edit`);
  }, [navigate]);

  const handleUpdateStage = useCallback((deal) => {
    setStageDialog({ 
      open: true, 
      deal, 
      newStage: deal.stage, 
      notes: '' 
    });
    setMenuAnchor({ element: null, deal: null });
  }, []);

  const handleUpdateProbability = useCallback((deal) => {
    setProbabilityDialog({
      open: true,
      deal,
      probability: deal.probability
    });
    setMenuAnchor({ element: null, deal: null });
  }, []);

  const confirmStageUpdate = async () => {
    try {
      await dealApi.updateDealStage(
        stageDialog.deal.id, 
        stageDialog.newStage, 
        stageDialog.notes
      );

      // Update local state
      const updatedDealsByStage = { ...dealsByStage };
      const currentStage = stageDialog.deal.stage;
      const newStage = stageDialog.newStage;

      if (currentStage !== newStage) {
        // Remove from current stage
        updatedDealsByStage[currentStage] = updatedDealsByStage[currentStage].filter(
          d => d.id !== stageDialog.deal.id
        );

        // Add to new stage
        const updatedDeal = {
          ...stageDialog.deal,
          stage: newStage,
          probability: DEAL_STAGES.find(s => s.id === newStage)?.probability || stageDialog.deal.probability
        };
        
        updatedDealsByStage[newStage] = updatedDealsByStage[newStage] || [];
        updatedDealsByStage[newStage].push(updatedDeal);
        
        setDealsByStage(updatedDealsByStage);
      }

      setSnackbar({
        open: true,
        message: 'Deal stage updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update deal stage',
        severity: 'error'
      });
    }

    setStageDialog({ open: false, deal: null, newStage: '', notes: '' });
  };

  const confirmProbabilityUpdate = async () => {
    try {
      await dealApi.updateProbability(probabilityDialog.deal.id, probabilityDialog.probability);

      // Update local state
      const updatedDealsByStage = { ...dealsByStage };
      const stage = probabilityDialog.deal.stage;
      const dealIndex = updatedDealsByStage[stage].findIndex(d => d.id === probabilityDialog.deal.id);
      
      if (dealIndex !== -1) {
        updatedDealsByStage[stage][dealIndex].probability = probabilityDialog.probability;
        setDealsByStage(updatedDealsByStage);
      }

      setSnackbar({
        open: true,
        message: 'Deal probability updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update deal probability',
        severity: 'error'
      });
    }

    setProbabilityDialog({ open: false, deal: null, probability: 50 });
  };

  const handleSelectDeal = useCallback((dealId, event) => {
    event.stopPropagation();
    setSelectedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((stage) => {
    const stageDeals = dealsByStage[stage] || [];
    const stageDealIds = stageDeals.map(d => d.id);
    
    setSelectedDeals(prev => {
      const newSet = new Set(prev);
      const allSelected = stageDealIds.every(id => newSet.has(id));
      
      if (allSelected) {
        stageDealIds.forEach(id => newSet.delete(id));
      } else {
        stageDealIds.forEach(id => newSet.add(id));
      }
      
      return newSet;
    });
  }, [dealsByStage]);

  const handleBulkStageChange = useCallback((newStage) => {
    setBulkAction({ type: 'stage', value: newStage });
    setBulkActionDialogOpen(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    setBulkAction({ type: 'delete', value: null });
    setBulkActionDialogOpen(true);
  }, []);

  const executeBulkAction = useCallback(async () => {
    const dealIds = Array.from(selectedDeals);
    
    if (dealIds.length === 0) {
      return;
    }

    try {
      let updates = {};
      
      if (bulkAction.type === 'stage') {
        updates.stage = bulkAction.value;
      } else if (bulkAction.type === 'delete') {
        updates.status = 'archived';
      }

      const response = await dealApi.bulkUpdateDeals(dealIds, updates);
      
      if (response.success) {
        await fetchPipelineData();
        
        setSnackbar({
          open: true,
          message: `Successfully updated ${response.updated} deal(s)`,
          severity: 'success'
        });
        
        setSelectedDeals(new Set());
        setBulkActionDialogOpen(false);
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Bulk update failed',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Bulk update error:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update deals. Please try again.',
        severity: 'error'
      });
    }
  }, [selectedDeals, bulkAction, fetchPipelineData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityInfo = (priorityId) => {
    return DEAL_PRIORITIES.find(priority => priority.id === priorityId) || DEAL_PRIORITIES[0];
  };

  const getStageGradient = (stageId, theme) => {
    const gradientMap = {
      prospecting: theme.palette.gradient.info,
      qualification: theme.palette.gradient.primary,
      proposal: theme.palette.gradient.warning,
      negotiation: theme.palette.gradient.secondary,
      contract: theme.palette.gradient.success,
      closed_won: theme.palette.gradient.success,
      closed_lost: theme.palette.gradient.secondary
    };
    return gradientMap[stageId] || theme.palette.gradient.primary;
  };

  const getPriorityGradient = (priorityId, theme) => {
    const gradientMap = {
      high: theme.palette.gradient.warning,
      medium: theme.palette.gradient.info,
      low: theme.palette.gradient.secondary
    };
    return gradientMap[priorityId] || theme.palette.gradient.secondary;
  };

  const allDealsEmpty = !loading && Object.keys(dealsByStage).every(stageId => {
    const deals = dealsByStage[stageId];
    return !deals || deals.length === 0;
  });

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Failed to load pipeline</Typography>
          <Typography>{error}</Typography>
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, animation: 'fadeInScale 0.6s ease-out' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Sales Pipeline
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ViewList />}
            onClick={() => navigate('/deals')}
          >
            List View
          </Button>
          <Button
            variant="outlined"
            onClick={fetchPipelineData}
            disabled={loading}
            startIcon={<Refresh className="icon-spin-hover" />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/deals/new')}
          >
            Add Deal
          </Button>
        </Box>
      </Box>

      {/* Pipeline Stats */}
      <Box
        ref={statsRef}
        sx={{
          opacity: statsVisible ? 1 : 0,
          transform: statsVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.6s ease-out'
        }}
      >
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {formatCurrency(pipelineStats.totalValue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Pipeline Value
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
              {pipelineStats.totalDeals}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Deals
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {formatCurrency(pipelineStats.averageDealSize)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Deal Size
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {pipelineStats.winRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      </Box>

      {/* Empty State - shown when not loading and all deals are empty */}
      {allDealsEmpty && (
        <EmptyState
          icon={Assignment}
          title="No deals in pipeline"
          message="Get started by creating your first deal to track your opportunities"
          actionLabel="Add Deal"
          onAction={() => navigate('/deals/new')}
        />
      )}

      {/* Pipeline Board - hidden when showing empty state */}
      {!allDealsEmpty && (
        <>
          {selectedDeals.size > 0 && (
            <Paper
              elevation={10}
              sx={{
                position: 'sticky',
                top: 16,
                zIndex: 1000,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.gradient.primary.main}, ${theme.palette.gradient.primary.light})`,
                borderRadius: '12px',
                overflow: 'hidden',
                animation: 'fadeInUp 0.3s ease-out'
              }}
            >
              <Toolbar>
                <Typography variant="h6" sx={{ flex: 1, color: 'white' }}>
                  {selectedDeals.size} deal{selectedDeals.size !== 1 ? 's' : ''} selected
                </Typography>
                
                <Tooltip title="Change Stage">
                  <IconButton
                    onClick={() => handleBulkStageChange('qualification')}
                    sx={{ color: 'white', mr: 1 }}
                  >
                    <SwapHoriz />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Archive Selected">
                  <IconButton
                    onClick={handleBulkDelete}
                    sx={{ color: 'white' }}
                  >
                    <Archive />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Clear Selection">
                  <IconButton
                    onClick={() => setSelectedDeals(new Set())}
                    sx={{ color: 'white', ml: 2 }}
                  >
                    <Close />
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </Paper>
          )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {DEAL_STAGES.filter(stage => stage.id !== 'closed_lost').map((stage) => {
              const stageDeals = dealsByStage[stage.id] || [];
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <Paper
                  key={stage.id}
                  sx={{
                    minWidth: 280,
                    maxWidth: 280,
                    borderRadius: 3,
                    boxShadow: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {/* Stage Header with Gradient */}
                  <Box 
                    sx={{ 
                      p: 1.25, 
                      background: getStageGradient(stage.id, theme),
                      color: 'white'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white', fontSize: '0.938rem' }}>
                        {stage.name}
                      </Typography>
                      {!loading && stageDeals.length > 0 && (
                        <Tooltip title="Select all deals in this stage">
                          <Checkbox
                            checked={stageDeals.length > 0 && stageDeals.every(d => selectedDeals.has(d.id))}
                            indeterminate={stageDeals.some(d => selectedDeals.has(d.id)) && !stageDeals.every(d => selectedDeals.has(d.id))}
                            onChange={() => handleSelectAll(stage.id)}
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-checked': {
                                color: 'white'
                              },
                              '&.MuiCheckbox-indeterminate': {
                                color: 'white'
                              }
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.813rem' }}>
                        {loading ? '-' : `${stageDeals.length} deal${stageDeals.length !== 1 ? 's' : ''}`}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'white', fontSize: '0.813rem' }}>
                        {loading ? '-' : formatCurrency(stageValue)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Droppable Area */}
                  <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    <Box
                      sx={{
                        minHeight: 200,
                        maxHeight: 600,
                        overflowY: 'auto',
                        p: 0.75,
                        backgroundColor: 'transparent'
                      }}
                    >
                    {loading ? (
                      // Show skeleton loading cards
                      [...Array(2)].map((_, index) => (
                        <Card
                          key={`skeleton-${index}`}
                          sx={{
                            mb: 0.75,
                            borderRadius: 2,
                            boxShadow: 1
                          }}
                        >
                          <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Skeleton variant="rounded" width={60} height={20} animation="wave" sx={{ borderRadius: 2 }} />
                              <Skeleton variant="circular" width={24} height={24} animation="wave" />
                            </Box>
                            <Skeleton variant="text" width="80%" height={24} animation="wave" sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="50%" height={32} animation="wave" sx={{ mb: 1 }} />
                            <Box sx={{ mb: 1 }}>
                              <Skeleton variant="text" width="100%" height={16} animation="wave" sx={{ mb: 0.5 }} />
                              <Skeleton variant="rounded" width="100%" height={6} animation="wave" sx={{ borderRadius: 3 }} />
                            </Box>
                            <Skeleton variant="text" width="70%" height={16} animation="wave" sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width="60%" height={16} animation="wave" />
                          </CardContent>
                        </Card>
                      ))
                    ) : stageDeals.length === 0 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 4,
                          px: 2
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" align="center">
                          No deals in this stage
                        </Typography>
                        <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5 }}>
                          Drag deals here to update their stage
                        </Typography>
                      </Box>
                    ) : (
                      stageDeals.map((deal) => (
                        <SortableDealItem
                          key={deal.id}
                          deal={deal}
                          stage={stage}
                          onMenuClick={handleMenuClick}
                          onViewDeal={handleViewDeal}
                          onEditDeal={handleEditDeal}
                          selectedDeals={selectedDeals}
                          onSelectDeal={handleSelectDeal}
                          getPriorityInfo={getPriorityInfo}
                          getStageGradient={getStageGradient}
                          getPriorityGradient={getPriorityGradient}
                          theme={theme}
                          formatCurrency={formatCurrency}
                        />
                      ))
                    )}
                    </Box>
                  </SortableContext>
                </Paper>
              );
            })}
          </Box>
        </DndContext>
        </>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleViewDeal(menuAnchor.deal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleEditDeal(menuAnchor.deal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Deal</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleUpdateStage(menuAnchor.deal)}>
          <ListItemIcon>
            <TrendingUp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Stage</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateProbability(menuAnchor.deal)}>
          <ListItemIcon>
            <AttachMoney fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Probability</ListItemText>
        </MenuItem>
      </Menu>

      {/* Stage Update Dialog */}
      <Dialog open={stageDialog.open} onClose={() => setStageDialog({ open: false, deal: null, newStage: '', notes: '' })}>
        <DialogTitle>Update Deal Stage</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>New Stage</InputLabel>
              <Select
                value={stageDialog.newStage}
                label="New Stage"
                onChange={(e) => setStageDialog(prev => ({ ...prev, newStage: e.target.value }))}
              >
                {DEAL_STAGES.filter(stage => stage.id !== 'closed_lost').map((stage) => (
                  <MenuItem key={stage.id} value={stage.id}>
                    {stage.name} ({stage.probability}%)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={stageDialog.notes}
              onChange={(e) => setStageDialog(prev => ({ ...prev, notes: e.target.value }))}
              helperText="Add any notes about this stage change"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageDialog({ open: false, deal: null, newStage: '', notes: '' })}>
            Cancel
          </Button>
          <Button onClick={confirmStageUpdate} variant="contained">
            Update Stage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Probability Update Dialog */}
      <Dialog open={probabilityDialog.open} onClose={() => setProbabilityDialog({ open: false, deal: null, probability: 50 })}>
        <DialogTitle>Update Deal Probability</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>
              Probability: {probabilityDialog.probability}%
            </Typography>
            <Slider
              value={probabilityDialog.probability}
              onChange={(e, value) => setProbabilityDialog(prev => ({ ...prev, probability: value }))}
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              Adjust the likelihood of this deal closing successfully
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProbabilityDialog({ open: false, deal: null, probability: 50 })}>
            Cancel
          </Button>
          <Button onClick={confirmProbabilityUpdate} variant="contained">
            Update Probability
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Confirmation Dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
      >
        <DialogTitle>Confirm Bulk Action</DialogTitle>
        <DialogContent>
          <Typography>
            {bulkAction.type === 'stage' && `Change stage to ${bulkAction.value} for ${selectedDeals.size} deal(s)?`}
            {bulkAction.type === 'delete' && `Archive ${selectedDeals.size} deal(s)?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button onClick={executeBulkAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Pipeline;