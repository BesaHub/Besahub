import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Send,
  Preview,
  ContentCopy,
  Visibility
} from '@mui/icons-material';
import { emailTemplatesApi } from '../../services/emailTemplatesApi';

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'custom',
    subject: '',
    htmlBody: '',
    plainTextBody: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [templatesRes, categoriesRes] = await Promise.all([
        emailTemplatesApi.getTemplates(),
        emailTemplatesApi.getCategories()
      ]);
      
      setTemplates(templatesRes.templates || []);
      setCategories(categoriesRes.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'custom',
      subject: '',
      htmlBody: '',
      plainTextBody: '',
      isActive: true
    });
    setCurrentTab(0);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      htmlBody: template.htmlBody,
      plainTextBody: template.plainTextBody,
      isActive: template.isActive
    });
    setCurrentTab(0);
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingTemplate) {
        await emailTemplatesApi.updateTemplate(editingTemplate.id, formData);
        setSuccess('Template updated successfully!');
      } else {
        await emailTemplatesApi.createTemplate(formData);
        setSuccess('Template created successfully!');
      }

      setDialogOpen(false);
      loadData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await emailTemplatesApi.deleteTemplate(templateId);
        setSuccess('Template deleted successfully!');
        loadData();
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error('Error deleting template:', error);
        setError('Failed to delete template');
      }
    }
  };

  const handlePreviewTemplate = async (template) => {
    try {
      const previewData = await emailTemplatesApi.previewTemplate(template.id, {
        firstName: 'John',
        propertyName: 'Sample Office Building',
        propertyAddress: '123 Main St, New York, NY',
        propertyType: 'Office',
        propertySize: '50,000',
        propertyPrice: '5,000,000',
        propertyStatus: 'Available',
        agentName: 'Jane Smith',
        agentPhone: '(555) 123-4567',
        agentEmail: 'jane@example.com'
      });
      
      setPreviewData({
        ...template,
        ...previewData.preview
      });
      setPreviewDialog(true);
    } catch (error) {
      console.error('Error previewing template:', error);
      setError('Failed to preview template');
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Email Templates</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTemplate}
        >
          Create Template
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

      <Box mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Chip 
                        label={template.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => handlePreviewTemplate(template)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditTemplate(template)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {template.subject}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Variables: {template.variables?.length || 0}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={template.isActive}
                          size="small"
                          disabled
                        />
                      }
                      label="Active"
                    />
                    <Button
                      size="small"
                      startIcon={<Send />}
                      variant="outlined"
                    >
                      Send
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab label="Basic Info" />
              <Tab label="Content" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Use {{variableName}} for dynamic content"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="HTML Body"
                  multiline
                  rows={10}
                  value={formData.htmlBody}
                  onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                  placeholder="Enter HTML content with {{variableName}} for dynamic content"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plain Text Body"
                  multiline
                  rows={6}
                  value={formData.plainTextBody}
                  onChange={(e) => setFormData({ ...formData, plainTextBody: e.target.value })}
                  placeholder="Enter plain text content with {{variableName}} for dynamic content"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {previewData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Subject: {previewData.subject}
              </Typography>
              <Box 
                border={1} 
                borderColor="divider" 
                p={2} 
                borderRadius={1}
                dangerouslySetInnerHTML={{ __html: previewData.htmlBody }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplatesManager;
