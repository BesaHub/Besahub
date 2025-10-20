import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert
} from '@mui/material';
import {
  FileDownload as DownloadIcon
} from '@mui/icons-material';

const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG Image' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'csv', label: 'CSV (Table Widgets Only)' }
];

const ExportDialog = ({ open, onClose, dashboard, widgets }) => {
  const [format, setFormat] = useState('png');
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleWidgetToggle = (widgetId) => {
    setSelectedWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedWidgets.length === widgets.length) {
      setSelectedWidgets([]);
    } else {
      setSelectedWidgets(widgets.map(w => w.id));
    }
  };

  const handleExport = async () => {
    try {
      setError(null);

      if (selectedWidgets.length === 0) {
        setError('Please select at least one widget to export');
        return;
      }

      if (format === 'csv') {
        const tableWidgets = widgets.filter(
          w => w.type === 'table' && selectedWidgets.includes(w.id)
        );
        
        if (tableWidgets.length === 0) {
          setError('CSV export is only available for table widgets');
          return;
        }
      }

      setSuccess('Export feature is available in premium version');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error exporting dashboard:', err);
      setError('Failed to export dashboard');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Dashboard</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Export Format</InputLabel>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            label="Export Format"
          >
            {EXPORT_FORMATS.map((fmt) => (
              <MenuItem key={fmt.value} value={fmt.value}>
                {fmt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">
              Select Widgets to Export
            </Typography>
            <Button size="small" onClick={handleSelectAll}>
              {selectedWidgets.length === widgets.length ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>

          <FormGroup>
            {widgets.map((widget) => (
              <FormControlLabel
                key={widget.id}
                control={
                  <Checkbox
                    checked={selectedWidgets.includes(widget.id)}
                    onChange={() => handleWidgetToggle(widget.id)}
                  />
                }
                label={`${widget.title} (${widget.type})`}
              />
            ))}
          </FormGroup>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Note: Export functionality will generate a {format.toUpperCase()} file with the selected widgets.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
