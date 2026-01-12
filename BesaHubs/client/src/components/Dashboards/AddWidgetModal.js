import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { executeQuery } from '../../services/dashboardApi';
import WidgetRenderer from './WidgetRenderer';

const DATASETS = [
  { value: 'deals', label: 'Deals' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'properties', label: 'Properties' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'agents', label: 'Agents' }
];

const WIDGET_TYPES = [
  { value: 'kpi', label: 'KPI Card' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'table', label: 'Table' },
  { value: 'funnel', label: 'Funnel Chart' }
];

const DATASET_METRICS = {
  deals: ['count', 'sum', 'avg', 'win_rate', 'commission_total'],
  tasks: ['count', 'completion_rate', 'avg_duration', 'overdue_count'],
  properties: ['count', 'avg_price', 'total_value', 'avg_sqft'],
  contacts: ['count', 'conversion_rate'],
  campaigns: ['count', 'avg_open_rate', 'avg_click_rate', 'total_sent'],
  agents: ['count', 'total_deals', 'total_commission', 'avg_win_rate']
};

const DATASET_GROUPBY = {
  deals: ['stage', 'dealType', 'listingAgent', 'month', 'quarter'],
  tasks: ['status', 'priority', 'taskType', 'assignedTo', 'month'],
  properties: ['propertyType', 'status', 'city', 'state', 'listingAgent'],
  contacts: ['contactRole', 'leadStatus', 'leadSource', 'assignedAgent'],
  campaigns: ['type', 'status', 'month', 'createdBy'],
  agents: ['role', 'department', 'month']
};

const steps = ['Select Dataset', 'Choose Visualization', 'Configure Query', 'Preview & Name'];

const AddWidgetModal = ({ open, onClose, onAdd }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [dataset, setDataset] = useState('');
  const [widgetType, setWidgetType] = useState('');
  const [query, setQuery] = useState({
    metrics: [],
    groupBy: '',
    filters: {},
    limit: 100
  });
  const [title, setTitle] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNext = async () => {
    if (activeStep === 2) {
      await handlePreview();
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await executeQuery({ dataset, query });
      
      if (response.success) {
        setPreviewData(response.data);
      }
    } catch (err) {
      console.error('Error previewing query:', err);
      setError(err.response?.data?.message || 'Failed to preview query');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = () => {
    if (!title.trim()) {
      setError('Please enter a widget title');
      return;
    }

    onAdd({
      type: widgetType,
      dataset,
      query,
      title: title.trim(),
      position: { x: 0, y: 0, w: 4, h: 4 },
      refreshInterval: null
    });

    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setDataset('');
    setWidgetType('');
    setQuery({ metrics: [], groupBy: '', filters: {}, limit: 100 });
    setTitle('');
    setPreviewData(null);
    setError(null);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ minHeight: 200 }}>
            <Typography variant="body1" gutterBottom>
              Select the data source for your widget
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Dataset</InputLabel>
              <Select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                label="Dataset"
              >
                {DATASETS.map((ds) => (
                  <MenuItem key={ds.value} value={ds.value}>
                    {ds.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ minHeight: 200 }}>
            <Typography variant="body1" gutterBottom>
              Choose how you want to visualize the data
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {WIDGET_TYPES.map((type) => (
                <Grid item xs={6} sm={4} key={type.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: widgetType === type.value ? 2 : 1,
                      borderColor: widgetType === type.value ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => setWidgetType(type.value)}
                  >
                    <CardContent>
                      <Typography variant="h6" align="center">
                        {type.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ minHeight: 200 }}>
            <Typography variant="body1" gutterBottom>
              Configure your query
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Metrics</InputLabel>
              <Select
                multiple
                value={query.metrics}
                onChange={(e) => setQuery({ ...query, metrics: e.target.value })}
                label="Metrics"
              >
                {DATASET_METRICS[dataset]?.map((metric) => (
                  <MenuItem key={metric} value={metric}>
                    {metric.replace(/_/g, ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Group By</InputLabel>
              <Select
                value={query.groupBy}
                onChange={(e) => setQuery({ ...query, groupBy: e.target.value })}
                label="Group By"
              >
                <MenuItem value="">None</MenuItem>
                {DATASET_GROUPBY[dataset]?.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field.replace(/_/g, ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Limit"
              type="number"
              value={query.limit}
              onChange={(e) => setQuery({ ...query, limit: parseInt(e.target.value) || 100 })}
              sx={{ mt: 2 }}
              InputProps={{ inputProps: { min: 1, max: 1000 } }}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ minHeight: 200 }}>
            <TextField
              fullWidth
              label="Widget Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Enter a descriptive title for your widget"
            />

            {loading && (
              <Typography>Loading preview...</Typography>
            )}

            {previewData && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preview
                </Typography>
                <WidgetRenderer
                  widget={{
                    id: 'preview',
                    type: widgetType,
                    dataset,
                    query,
                    title: title || 'Preview'
                  }}
                />
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return dataset !== '';
      case 1:
        return widgetType !== '';
      case 2:
        return query.metrics.length > 0;
      case 3:
        return title.trim() !== '';
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Widget</DialogTitle>
      
      <DialogContent>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleAddWidget}
            disabled={!canProceed()}
          >
            Add Widget
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddWidgetModal;
