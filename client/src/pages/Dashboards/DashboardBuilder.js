import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Responsive, WidthProvider } from 'react-grid-layout';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  IconButton,
  Toolbar,
  AppBar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  ArrowBack as BackIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import {
  getDashboard,
  createDashboard,
  updateDashboard,
  createWidget,
  updateWidget,
  deleteWidget
} from '../../services/dashboardApi';
import WidgetRenderer from '../../components/Dashboards/WidgetRenderer';
import AddWidgetModal from '../../components/Dashboards/AddWidgetModal';
import ShareDashboardDialog from '../../components/Dashboards/ShareDashboardDialog';
import ExportDialog from '../../components/Dashboards/ExportDialog';
import { LoadingSpinner } from '../../components/LoadingOptimization/LoadingSpinner';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewDashboard = id === 'new';

  const [loading, setLoading] = useState(!isNewDashboard);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardName, setDashboardName] = useState('');
  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    if (!isNewDashboard) {
      fetchDashboard();
    }
  }, [id]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboard(id);
      
      if (response.success) {
        setDashboard(response.data);
        setDashboardName(response.data.name);
        setWidgets(response.data.widgets || []);
        
        const layoutData = response.data.widgets?.map(widget => ({
          i: widget.id,
          x: widget.position.x || 0,
          y: widget.position.y || 0,
          w: widget.position.w || 4,
          h: widget.position.h || 4,
          minW: 2,
          minH: 2
        })) || [];
        setLayout(layoutData);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (!dashboardName.trim()) {
        setError('Dashboard name is required');
        return;
      }

      if (isNewDashboard) {
        const response = await createDashboard({
          name: dashboardName,
          description: '',
          layout: {},
          isDefault: false
        });

        if (response.success) {
          setSuccess('Dashboard created successfully');
          navigate(`/dashboards/${response.data.id}`);
        }
      } else {
        const layoutObj = {};
        layout.forEach(item => {
          layoutObj[item.i] = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          };
        });

        await updateDashboard(id, {
          name: dashboardName,
          layout: layoutObj
        });

        for (const widget of widgets) {
          const widgetLayout = layout.find(l => l.i === widget.id);
          if (widgetLayout) {
            await updateWidget(widget.id, {
              position: {
                x: widgetLayout.x,
                y: widgetLayout.y,
                w: widgetLayout.w,
                h: widgetLayout.h
              }
            });
          }
        }

        setSuccess('Dashboard saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving dashboard:', err);
      setError(err.response?.data?.message || 'Failed to save dashboard');
    }
  };

  const handleAddWidget = async (widgetData) => {
    try {
      setError(null);
      
      if (isNewDashboard) {
        setError('Please save the dashboard first before adding widgets');
        return;
      }

      const response = await createWidget(id, widgetData);

      if (response.success) {
        const newWidget = response.data;
        setWidgets([...widgets, newWidget]);
        
        setLayout([...layout, {
          i: newWidget.id,
          x: newWidget.position.x || 0,
          y: newWidget.position.y || 0,
          w: newWidget.position.w || 4,
          h: newWidget.position.h || 4,
          minW: 2,
          minH: 2
        }]);

        setSuccess('Widget added successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error adding widget:', err);
      setError(err.response?.data?.message || 'Failed to add widget');
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      try {
        await deleteWidget(widgetId);
        setWidgets(widgets.filter(w => w.id !== widgetId));
        setLayout(layout.filter(l => l.i !== widgetId));
        setSuccess('Widget deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error deleting widget:', err);
        setError('Failed to delete widget');
      }
    }
  };

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/dashboards')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          
          <TextField
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            placeholder="Dashboard Name"
            variant="standard"
            sx={{ minWidth: 300, mr: 2 }}
            InputProps={{
              sx: { fontSize: '1.25rem', fontWeight: 500 }
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Button
            startIcon={<AddIcon />}
            onClick={() => setAddWidgetOpen(true)}
            sx={{ mr: 1 }}
            disabled={isNewDashboard}
          >
            Add Widget
          </Button>

          {!isNewDashboard && (
            <>
              <Button
                startIcon={<ShareIcon />}
                onClick={() => setShareDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Share
              </Button>

              <Button
                startIcon={<ExportIcon />}
                onClick={() => setExportDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Export
              </Button>
            </>
          )}

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 2 }}>
          {success}
        </Alert>
      )}

      <Container maxWidth="xl" sx={{ flex: 1, py: 3, overflow: 'auto' }}>
        {widgets.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            height="60vh"
          >
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {isNewDashboard ? 'Save your dashboard first' : 'No widgets yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isNewDashboard 
                ? 'Click Save to create the dashboard, then add widgets' 
                : 'Click "Add Widget" to start building your dashboard'}
            </Typography>
            {!isNewDashboard && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddWidgetOpen(true)}
                sx={{ mt: 2 }}
              >
                Add Your First Widget
              </Button>
            )}
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <Box sx={{ height: '100%', position: 'relative' }}>
                  <Box
                    className="drag-handle"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 40,
                      cursor: 'move',
                      zIndex: 10,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  />
                  <WidgetRenderer widget={widget} />
                </Box>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </Container>

      <AddWidgetModal
        open={addWidgetOpen}
        onClose={() => setAddWidgetOpen(false)}
        onAdd={handleAddWidget}
      />

      {dashboard && (
        <>
          <ShareDashboardDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            dashboard={dashboard}
          />

          <ExportDialog
            open={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            dashboard={dashboard}
            widgets={widgets}
          />
        </>
      )}
    </Box>
  );
};

export default DashboardBuilder;
