import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Download,
  Preview,
  Upload,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  InfoOutlined
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import {
  parseCSVFile,
  mapCSVHeaders,
  processCsvData,
  downloadCSVTemplate,
  PROPERTY_FIELD_MAPPINGS
} from '../../utils/csvImport';
import { apiService } from '../../services/api';

const PropertyImport = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [headerMapping, setHeaderMapping] = useState({});
  const [unmappedHeaders, setUnmappedHeaders] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showDetails, setShowDetails] = useState({ valid: false, invalid: false, warnings: false });

  const steps = [
    'Upload CSV File',
    'Map Columns',
    'Review Data',
    'Import Properties'
  ];

  // Step 1: File Upload
  const handleFileUpload = async (files) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setSnackbar({
        open: true,
        message: 'Please upload a CSV file',
        severity: 'error'
      });
      return;
    }

    try {
      setCsvFile(file);
      const result = await parseCSVFile(file);
      setCsvData(result);

      // Auto-map headers
      const { mapping, unmappedHeaders: unmapped } = mapCSVHeaders(result.headers, PROPERTY_FIELD_MAPPINGS);
      setHeaderMapping(mapping);
      setUnmappedHeaders(unmapped);

      setActiveStep(1);
      setSnackbar({
        open: true,
        message: `Successfully loaded ${result.totalRows} rows from CSV`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error parsing CSV: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Step 2: Column Mapping
  const handleMappingChange = (csvHeader, dbField) => {
    setHeaderMapping(prev => ({
      ...prev,
      [csvHeader]: dbField
    }));
  };

  const proceedToReview = () => {
    const result = processCsvData(csvData.data, headerMapping, 'property');
    setProcessedData(result);
    setActiveStep(2);
  };

  // Step 3: Data Review
  const proceedToImport = () => {
    setActiveStep(3);
  };

  // Step 4: Import
  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);

    try {
      const { validRows } = processedData;
      const totalRows = validRows.length;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < validRows.length; i++) {
        try {
          await apiService.properties.create(validRows[i]);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            row: validRows[i]._originalRow,
            error: error.response?.data?.message || error.message
          });
        }
        setImportProgress((i + 1) / totalRows * 100);
      }

      setImportResults({
        total: totalRows,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      });

      setSnackbar({
        open: true,
        message: `Import completed: ${successCount} success, ${errorCount} errors`,
        severity: successCount > 0 ? 'success' : 'error'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Import failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleBack = () => {
    navigate('/properties');
  };

  const handleReset = () => {
    setActiveStep(0);
    setCsvFile(null);
    setCsvData(null);
    setHeaderMapping({});
    setUnmappedHeaders([]);
    setProcessedData(null);
    setImportResults(null);
    setImportProgress(0);
  };

  const renderFileUploadStep = () => (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload Property CSV File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a CSV file containing property data to import into your system
          </Typography>

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              cursor: 'pointer',
              mb: 3,
              backgroundColor: isDragActive ? 'primary.light' : 'background.paper',
              '&:hover': {
                backgroundColor: 'grey.50'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop CSV file here' : 'Upload CSV File'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag & drop your CSV file here, or click to browse
              <br />
              Maximum file size: 10MB
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => downloadCSVTemplate('property')}
            sx={{ mr: 2 }}
          >
            Download Template
          </Button>

          <Button
            variant="text"
            startIcon={<InfoOutlined />}
            onClick={() => setSnackbar({
              open: true,
              message: 'Template includes all supported fields with sample data',
              severity: 'info'
            })}
          >
            Template Info
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderMappingStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Map CSV Columns to Database Fields
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Map your CSV columns to the appropriate property fields. Auto-mapped fields are shown below.
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CSV Column</TableCell>
                <TableCell>Maps to Property Field</TableCell>
                <TableCell>Sample Data</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {csvData?.headers.map(header => (
                <TableRow key={header}>
                  <TableCell>
                    <Chip
                      label={header}
                      color={headerMapping[header] ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Select Field</InputLabel>
                      <Select
                        value={headerMapping[header] || ''}
                        label="Select Field"
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Don't import</em>
                        </MenuItem>
                        {Object.keys(PROPERTY_FIELD_MAPPINGS).map(field => (
                          <MenuItem key={field} value={field}>
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {csvData?.data[0]?.[header] || 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {unmappedHeaders.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Unmapped columns: {unmappedHeaders.join(', ')}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={proceedToReview}
            disabled={Object.keys(headerMapping).length === 0}
          >
            Review Data
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Review Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip
              icon={<CheckCircle />}
              label={`${processedData?.validCount || 0} Valid Rows`}
              color="success"
              onClick={() => setShowDetails(prev => ({ ...prev, valid: !prev.valid }))}
              clickable
            />
            <Chip
              icon={<ErrorIcon />}
              label={`${processedData?.invalidCount || 0} Invalid Rows`}
              color="error"
              onClick={() => setShowDetails(prev => ({ ...prev, invalid: !prev.invalid }))}
              clickable
            />
            <Chip
              icon={<Warning />}
              label={`${processedData?.warnings?.length || 0} Warnings`}
              color="warning"
              onClick={() => setShowDetails(prev => ({ ...prev, warnings: !prev.warnings }))}
              clickable
            />
          </Box>

          {processedData?.invalidCount > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {processedData.invalidCount} rows have errors and will be skipped during import.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Valid Rows Detail */}
      <Collapse in={showDetails.valid}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Valid Rows (First 5)
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Name/Address</TableCell>
                    <TableCell>City, State</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedData?.validRows.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row._originalRow}</TableCell>
                      <TableCell>{row.name || row.address}</TableCell>
                      <TableCell>{row.city}, {row.state}</TableCell>
                      <TableCell>{row.propertyType}</TableCell>
                      <TableCell>{row.listPrice || row.leaseRate || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Collapse>

      {/* Invalid Rows Detail */}
      <Collapse in={showDetails.invalid}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Invalid Rows
            </Typography>
            <List dense>
              {processedData?.invalidRows.map((row, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Row ${row._originalRow}`}
                    secondary={row._errors?.join(', ')}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Collapse>

      {/* Warnings Detail */}
      <Collapse in={showDetails.warnings}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Warnings
            </Typography>
            <List dense>
              {processedData?.warnings.map((warning, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Collapse>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setActiveStep(1)}
        >
          Back to Mapping
        </Button>
        <Button
          variant="contained"
          onClick={proceedToImport}
          disabled={processedData?.validCount === 0}
        >
          Import {processedData?.validCount} Properties
        </Button>
      </Box>
    </Box>
  );

  const renderImportStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {importing ? 'Importing Properties...' : 'Import Complete'}
        </Typography>

        {importing && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={importProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Progress: {Math.round(importProgress)}%
            </Typography>
          </Box>
        )}

        {importResults && (
          <Box>
            <Alert severity={importResults.errors > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
              Import completed: {importResults.success} successful, {importResults.errors} failed
            </Alert>

            {importResults.errorDetails.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Import Errors:
                </Typography>
                <List dense>
                  {importResults.errorDetails.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Row ${error.row}`}
                        secondary={error.error}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/properties')}
              >
                View Properties
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Import More
              </Button>
            </Box>
          </Box>
        )}

        {!importing && !importResults && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={handleImport}
              startIcon={<Upload />}
              size="large"
              disabled={processedData?.validCount === 0}
            >
              Start Import
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Properties
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Import Properties from CSV
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bulk import property data from a CSV file
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Box>
        {activeStep === 0 && renderFileUploadStep()}
        {activeStep === 1 && renderMappingStep()}
        {activeStep === 2 && renderReviewStep()}
        {activeStep === 3 && renderImportStep()}
      </Box>

      {/* Snackbar */}
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

export default PropertyImport;