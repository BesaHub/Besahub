import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, TextField, Checkbox,
  FormControlLabel, FormGroup, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Chip,
  IconButton, FormLabel
} from '@mui/material';
import {
  GetApp, Add, Delete, Description,
  Assessment, AttachMoney, People, Email, Home, TrendingUp
} from '@mui/icons-material';
import { analyticsApi } from '../../services/analyticsApi';
import { ReportSkeleton } from './LoadingSkeleton';
import AnalyticsErrorBoundary from './ErrorBoundary';

const ReportGenerator = () => {
  const [reportTemplates, setReportTemplates] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Report creation state
  const [createDialog, setCreateDialog] = useState(false);
  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    timeframe: '30d',
    format: 'pdf',
    sections: [],
    schedule: null,
    recipients: []
  });

  // Available report sections
  const reportSections = [
    { id: 'executive-summary', name: 'Executive Summary', icon: <Assessment />, description: 'High-level overview of key metrics' },
    { id: 'sales-performance', name: 'Sales Performance', icon: <AttachMoney />, description: 'Revenue, deals, and conversion metrics' },
    { id: 'lead-analytics', name: 'Lead Analytics', icon: <People />, description: 'Lead generation and conversion analysis' },
    { id: 'marketing-metrics', name: 'Marketing Metrics', icon: <Email />, description: 'Email campaigns and website performance' },
    { id: 'property-analysis', name: 'Property Analysis', icon: <Home />, description: 'Property listings and market trends' },
    { id: 'financial-overview', name: 'Financial Overview', icon: <TrendingUp />, description: 'Revenue, expenses, and profitability' },
    { id: 'kpi-dashboard', name: 'KPI Dashboard', icon: <Assessment />, description: 'Key performance indicators' },
    { id: 'team-performance', name: 'Team Performance', icon: <People />, description: 'Individual and team metrics' }
  ];

  useEffect(() => {
    fetchAnalyticsData();
    loadReportTemplates();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overview, sales, leads, marketing, financial] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getSalesAnalytics(),
        analyticsApi.getLeadAnalytics(),
        analyticsApi.getMarketingAnalytics(),
        analyticsApi.getFinancialAnalytics()
      ]);

      setAnalyticsData({
        overview: overview.data.data,
        sales: sales.data.data,
        leads: leads.data.data,
        marketing: marketing.data.data,
        financial: financial.data.data
      });
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportTemplates = () => {
    // Mock report templates
    const templates = [
      {
        id: 'executive-report',
        name: 'Executive Report',
        description: 'Comprehensive monthly executive summary',
        sections: ['executive-summary', 'sales-performance', 'kpi-dashboard'],
        format: 'pdf',
        schedule: 'monthly',
        lastGenerated: '2024-10-15',
        nextGeneration: '2024-11-15'
      },
      {
        id: 'sales-report',
        name: 'Sales Performance Report',
        description: 'Detailed sales metrics and team performance',
        sections: ['sales-performance', 'team-performance', 'lead-analytics'],
        format: 'excel',
        schedule: 'weekly',
        lastGenerated: '2024-10-18',
        nextGeneration: '2024-10-25'
      },
      {
        id: 'marketing-report',
        name: 'Marketing Analytics Report',
        description: 'Marketing campaign performance and ROI analysis',
        sections: ['marketing-metrics', 'lead-analytics', 'financial-overview'],
        format: 'pdf',
        schedule: 'monthly',
        lastGenerated: '2024-10-01',
        nextGeneration: '2024-11-01'
      }
    ];
    setReportTemplates(templates);
  };

  const handleCreateReport = () => {
    setReportForm({
      name: '',
      description: '',
      timeframe: '30d',
      format: 'pdf',
      sections: [],
      schedule: null,
      recipients: []
    });
    setCreateDialog(true);
  };

  const handleSectionToggle = (sectionId) => {
    setReportForm(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(id => id !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const handleSaveReport = async () => {
    try {
      setGenerating(true);
      
      // In a real application, this would save the report template
      const newTemplate = {
        id: `report-${Date.now()}`,
        ...reportForm,
        lastGenerated: null,
        nextGeneration: reportForm.schedule ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
      };
      
      setReportTemplates(prev => [...prev, newTemplate]);
      setSnackbar({ open: true, message: 'Report template created successfully!', severity: 'success' });
      setCreateDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to create report template', severity: 'error' });
      console.error('Error creating report template:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = async (templateId) => {
    try {
      setGenerating(true);
      const template = reportTemplates.find(t => t.id === templateId);
      
      // Mock report generation
      const reportData = {
        templateId,
        sections: template.sections,
        timeframe: '30d',
        format: template.format
      };
      
      const response = await analyticsApi.exportAnalytics(template.format, reportData, template.name);
      
      setSnackbar({ 
        open: true, 
        message: `Report generated successfully! Download URL: ${response.data.data.downloadUrl}`, 
        severity: 'success' 
      });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to generate report', severity: 'error' });
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    setReportTemplates(prev => prev.filter(t => t.id !== templateId));
    setSnackbar({ open: true, message: 'Report template deleted', severity: 'success' });
  };

  const getSectionIcon = (sectionId) => {
    const section = reportSections.find(s => s.id === sectionId);
    return section ? section.icon : <Description />;
  };

  const getSectionName = (sectionId) => {
    const section = reportSections.find(s => s.id === sectionId);
    return section ? section.name : sectionId;
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  return (
    <AnalyticsErrorBoundary>
      <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Report Generator
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateReport}
        >
          Create Report Template
        </Button>
      </Box>

      {/* Report Templates */}
      <Grid container spacing={3}>
        {reportTemplates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sections:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {template.sections.map(sectionId => (
                      <Chip
                        key={sectionId}
                        icon={getSectionIcon(sectionId)}
                        label={getSectionName(sectionId)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Format: {template.format.toUpperCase()}
                  </Typography>
                  {template.schedule && (
                    <Typography variant="body2" color="text.secondary">
                      Schedule: {template.schedule}
                    </Typography>
                  )}
                </Box>

                {template.lastGenerated && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Generated: {template.lastGenerated}
                    </Typography>
                    {template.nextGeneration && (
                      <Typography variant="body2" color="text.secondary">
                        Next: {template.nextGeneration}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>

              <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={() => handleGenerateReport(template.id)}
                  disabled={generating}
                  sx={{ flexGrow: 1 }}
                >
                  Generate
                </Button>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Report Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Report Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                fullWidth
                label="Report Name"
                value={reportForm.name}
                onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={reportForm.format}
                  label="Format"
                  onChange={(e) => setReportForm({ ...reportForm, format: e.target.value })}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={reportForm.timeframe}
                  label="Timeframe"
                  onChange={(e) => setReportForm({ ...reportForm, timeframe: e.target.value })}
                >
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="90d">Last 90 days</MenuItem>
                  <MenuItem value="12m">Last 12 months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Schedule</InputLabel>
                <Select
                  value={reportForm.schedule || ''}
                  label="Schedule"
                  onChange={(e) => setReportForm({ ...reportForm, schedule: e.target.value })}
                >
                  <MenuItem value="">No Schedule</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormLabel component="legend">Report Sections</FormLabel>
              <FormGroup>
                <Grid container>
                  {reportSections.map((section) => (
                    <Grid item xs={12} sm={6} key={section.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reportForm.sections.includes(section.id)}
                            onChange={() => handleSectionToggle(section.id)}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {section.icon}
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="body2">{section.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {section.description}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveReport}
            variant="contained"
            disabled={generating || !reportForm.name || reportForm.sections.length === 0}
          >
            {generating ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </AnalyticsErrorBoundary>
  );
};

export default ReportGenerator;
