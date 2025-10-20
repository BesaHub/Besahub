import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  Email,
  Schedule,
  Person,
  Business,
  TrendingUp,
  FilterList
} from '@mui/icons-material';

// Mock workflow data
const MOCK_WORKFLOWS = [
  {
    id: 1,
    name: 'New Lead Welcome Series',
    description: 'Automated email sequence for new leads',
    status: 'active',
    trigger: 'contact_created',
    steps: [
      {
        id: 1,
        type: 'email',
        name: 'Welcome Email',
        delay: 0,
        template: 'welcome_template',
        conditions: []
      },
      {
        id: 2,
        type: 'email',
        name: 'Property Information',
        delay: 1,
        template: 'property_info_template',
        conditions: []
      },
      {
        id: 3,
        type: 'email',
        name: 'Market Update',
        delay: 7,
        template: 'market_update_template',
        conditions: []
      }
    ],
    stats: {
      contacts: 150,
      emailsSent: 450,
      openRate: 35.2,
      clickRate: 12.8
    },
    createdAt: '2024-01-15',
    lastRun: '2024-01-19'
  },
  {
    id: 2,
    name: 'Property Interest Follow-up',
    description: 'Follow up with leads who viewed specific properties',
    status: 'paused',
    trigger: 'property_viewed',
    steps: [
      {
        id: 1,
        type: 'email',
        name: 'Property Follow-up',
        delay: 1,
        template: 'property_followup_template',
        conditions: [
          { field: 'propertyType', operator: 'equals', value: 'office' }
        ]
      },
      {
        id: 2,
        type: 'task',
        name: 'Schedule Call',
        delay: 3,
        assignTo: 'agent',
        conditions: []
      }
    ],
    stats: {
      contacts: 75,
      emailsSent: 75,
      openRate: 42.1,
      clickRate: 18.5
    },
    createdAt: '2024-01-10',
    lastRun: '2024-01-18'
  }
];

const WORKFLOW_TRIGGERS = [
  { value: 'contact_created', label: 'New Contact Created' },
  { value: 'property_viewed', label: 'Property Viewed' },
  { value: 'email_opened', label: 'Email Opened' },
  { value: 'email_clicked', label: 'Email Clicked' },
  { value: 'deal_created', label: 'Deal Created' },
  { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'custom', label: 'Custom Trigger' }
];

const WORKFLOW_ACTIONS = [
  { value: 'email', label: 'Send Email', icon: <Email /> },
  { value: 'task', label: 'Create Task', icon: <Schedule /> },
  { value: 'update_contact', label: 'Update Contact', icon: <Person /> },
  { value: 'update_deal', label: 'Update Deal', icon: <Business /> },
  { value: 'wait', label: 'Wait', icon: <Schedule /> },
  { value: 'condition', label: 'Condition', icon: <FilterList /> }
];

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    trigger: 'contact_created',
    status: 'active'
  });

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setWorkflowForm({
      name: '',
      description: '',
      trigger: 'contact_created',
      status: 'active'
    });
    setActiveStep(0);
    setWorkflowDialog(true);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      status: workflow.status
    });
    setActiveStep(0);
    setWorkflowDialog(true);
  };

  const handleSaveWorkflow = () => {
    try {
      const newWorkflow = {
        id: editingWorkflow ? editingWorkflow.id : Date.now(),
        ...workflowForm,
        steps: editingWorkflow ? editingWorkflow.steps : [],
        stats: editingWorkflow ? editingWorkflow.stats : {
          contacts: 0,
          emailsSent: 0,
          openRate: 0,
          clickRate: 0
        },
        createdAt: editingWorkflow ? editingWorkflow.createdAt : new Date().toISOString().split('T')[0],
        lastRun: new Date().toISOString().split('T')[0]
      };

      if (editingWorkflow) {
        setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? newWorkflow : w));
        setSuccess('Workflow updated successfully!');
      } else {
        setWorkflows(prev => [...prev, newWorkflow]);
        setSuccess('Workflow created successfully!');
      }

      setWorkflowDialog(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save workflow');
    }
  };

  const handleDeleteWorkflow = (workflowId) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      setSuccess('Workflow deleted successfully!');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleToggleWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'stopped': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayArrow />;
      case 'paused': return <Pause />;
      case 'stopped': return <Stop />;
      default: return <Stop />;
    }
  };

  const WorkflowSteps = [
    {
      label: 'Basic Information',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflowForm.name}
              onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={workflowForm.description}
              onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Trigger</InputLabel>
              <Select
                value={workflowForm.trigger}
                onChange={(e) => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}
                label="Trigger"
              >
                {WORKFLOW_TRIGGERS.map((trigger) => (
                  <MenuItem key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={workflowForm.status === 'active'}
                  onChange={(e) => setWorkflowForm({ 
                    ...workflowForm, 
                    status: e.target.checked ? 'active' : 'paused' 
                  })}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Workflow Steps',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>
            Workflow Steps
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Define the actions that will be executed when the trigger is activated.
          </Typography>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Available Actions:
            </Typography>
            <Grid container spacing={1}>
              {WORKFLOW_ACTIONS.map((action) => (
                <Grid item key={action.value}>
                  <Chip
                    icon={action.icon}
                    label={action.label}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Alert severity="info">
            Workflow steps configuration will be available in the next version.
            For now, workflows will use default steps based on the trigger type.
          </Alert>
        </Box>
      )
    },
    {
      label: 'Review & Test',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>
            Review Workflow
          </Typography>
          
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {workflowForm.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                {workflowForm.description}
              </Typography>
              
              <Box display="flex" gap={2} mb={2}>
                <Chip 
                  label={`Trigger: ${WORKFLOW_TRIGGERS.find(t => t.value === workflowForm.trigger)?.label}`}
                  variant="outlined"
                />
                <Chip 
                  label={`Status: ${workflowForm.status}`}
                  color={getStatusColor(workflowForm.status)}
                />
              </Box>
            </CardContent>
          </Card>

          <Alert severity="success">
            Workflow is ready to be created! It will automatically start processing contacts based on the trigger conditions.
          </Alert>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Marketing Automation</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateWorkflow}
        >
          Create Workflow
        </Button>
      </Box>

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

      {/* Workflow Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Workflows
              </Typography>
              <Typography variant="h4">
                {workflows.filter(w => w.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Contacts
              </Typography>
              <Typography variant="h4">
                {workflows.reduce((sum, w) => sum + w.stats.contacts, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Emails Sent
              </Typography>
              <Typography variant="h4">
                {workflows.reduce((sum, w) => sum + w.stats.emailsSent, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Open Rate
              </Typography>
              <Typography variant="h4">
                {(workflows.reduce((sum, w) => sum + w.stats.openRate, 0) / workflows.length).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflows List */}
      <Grid container spacing={3}>
        {workflows.map((workflow) => (
          <Grid item xs={12} md={6} key={workflow.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {workflow.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      {workflow.description}
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Chip 
                        label={workflow.status}
                        color={getStatusColor(workflow.status)}
                        size="small"
                        icon={getStatusIcon(workflow.status)}
                      />
                      <Chip 
                        label={`${workflow.steps.length} steps`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Toggle Status">
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleWorkflow(workflow.id)}
                      >
                        {getStatusIcon(workflow.status)}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditWorkflow(workflow)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteWorkflow(workflow.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Contacts
                    </Typography>
                    <Typography variant="h6">
                      {workflow.stats.contacts}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Emails Sent
                    </Typography>
                    <Typography variant="h6">
                      {workflow.stats.emailsSent}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Open Rate
                    </Typography>
                    <Typography variant="h6">
                      {workflow.stats.openRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Click Rate
                    </Typography>
                    <Typography variant="h6">
                      {workflow.stats.clickRate}%
                    </Typography>
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Last run: {workflow.lastRun}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Workflow Dialog */}
      <Dialog open={workflowDialog} onClose={() => setWorkflowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {WorkflowSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  {step.content}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      {index < WorkflowSteps.length - 1 && (
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(index + 1)}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Continue
                        </Button>
                      )}
                      {index > 0 && (
                        <Button
                          onClick={() => setActiveStep(index - 1)}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                      )}
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialog(false)}>Cancel</Button>
          {activeStep === WorkflowSteps.length - 1 && (
            <Button onClick={handleSaveWorkflow} variant="contained">
              {editingWorkflow ? 'Update' : 'Create'} Workflow
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowBuilder;
