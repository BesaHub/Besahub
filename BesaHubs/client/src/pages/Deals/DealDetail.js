import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tab,
  Tabs,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  AttachMoney,
  Person,
  Schedule,
  Timeline,
  TrendingUp,
  Payment,
  History,
  Assessment,
  Note,
  Add,
  Send
} from '@mui/icons-material';
import { dealApi, DEAL_STAGES } from '../../services/dealApi';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`deal-tabpanel-${index}`}
      aria-labelledby={`deal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [activities, setActivities] = useState([]);
  const [quickNote, setQuickNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Mock deal data
  const mockDeal = {
    id: '1',
    name: '123 Main Street Office Building Sale',
    stage: 'negotiation',
    type: 'sale',
    priority: 'high',
    value: 2500000,
    probability: 75,
    expectedCloseDate: '2024-03-15',
    assignedTo: { 
      firstName: 'John', 
      lastName: 'Smith', 
      email: 'john@company.com' 
    },
    description: 'Prime downtown office building with excellent rental income potential',
    tags: ['Hot Lead', 'Referral', 'High Value'],
    commissionStructure: {
      amount: 75000
    },
    keyMetrics: {
      daysInStage: 12
    }
  };

  const mockContact = {
    firstName: 'Jane',
    lastName: 'Wilson',
    companyName: 'Wilson Investments',
    title: 'Managing Partner',
    primaryEmail: 'jane@wilsoninvestments.com',
    primaryPhone: '(555) 123-4567',
    contactRole: 'investor'
  };

  useEffect(() => {
    fetchDealDetails();
  }, [id]);

  const fetchDealDetails = async () => {
    try {
      setLoading(true);
      try {
        const dealResponse = await dealApi.getDeal(id);
        // Handle different response structures
        const dealData = dealResponse?.deal || dealResponse?.data?.deal || dealResponse?.data || null;
        
        if (dealData) {
          setDeal(dealData);
          // Try to fetch contact if contactId exists
          if (dealData.contactId) {
            try {
              // Contact fetching would go here if contactApi is available
            } catch (contactErr) {
              // Use mock contact if API fails
              setContact(mockContact);
            }
          } else {
            setContact(mockContact);
          }
        } else {
          // Use demo data if API returns empty
          setDeal(mockDeal);
          setContact(mockContact);
        }
      } catch (apiError) {
        console.log('API call failed, using demo data:', apiError);
        // Use demo data when API fails
        setDeal(mockDeal);
        setContact(mockContact);
      }
    } catch (err) {
      console.log('API call failed, using demo data:', err);
      // Use demo data when API fails
      setDeal(mockDeal);
      setContact(mockContact);
      
      // Load activities/notes
      setActivities([
        {
          id: '1',
          type: 'note',
          content: 'Initial meeting scheduled for next week. Client seems very interested.',
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: { firstName: 'John', lastName: 'Smith' }
        },
        {
          id: '2',
          type: 'stage_change',
          content: 'Deal moved to negotiation stage',
          createdAt: '2024-01-18T14:30:00Z',
          createdBy: { firstName: 'John', lastName: 'Smith' }
        },
        {
          id: '3',
          type: 'note',
          content: 'Received financing pre-approval. Moving forward with due diligence.',
          createdAt: '2024-01-20T09:15:00Z',
          createdBy: { firstName: 'John', lastName: 'Smith' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuickNote = async () => {
    if (!quickNote.trim()) return;
    
    const newActivity = {
      id: Date.now().toString(),
      type: 'note',
      content: quickNote,
      createdAt: new Date().toISOString(),
      createdBy: { firstName: 'You', lastName: '' }
    };
    
    setActivities(prev => [newActivity, ...prev]);
    setQuickNote('');
    setAddingNote(false);
    
    // Update deal's last activity date
    if (deal) {
      setDeal({ ...deal, lastActivityDate: new Date().toISOString() });
    }
    
    // In real app, would save to API
    try {
      await dealApi.updateDeal(deal.id, { 
        lastActivityDate: new Date().toISOString(),
        notes: deal.notes ? `${deal.notes}\n\n${new Date().toLocaleString()}: ${quickNote}` : `${new Date().toLocaleString()}: ${quickNote}`
      });
    } catch (err) {
      // Silently fail in demo mode
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStageIndex = (stage) => {
    return DEAL_STAGES.findIndex(s => s.id === stage);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading deal details...</Typography>
      </Box>
    );
  }

  if (!deal) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Deal not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/deals')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {deal.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip
              label={deal.stage?.replace('_', ' ').toUpperCase()}
              color="primary"
            />
            <Chip
              label={deal.priority?.toUpperCase()}
              color={getPriorityColor(deal.priority)}
              size="small"
            />
            <Chip
              label={deal.type?.toUpperCase()}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/deals/${deal.id}/edit`)}
          >
            Edit Deal
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/market-analysis')}
          >
            Market Analysis
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(deal.value || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deal Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {deal.probability || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Probability
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ color: 'warning.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {deal.keyMetrics?.daysInStage || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Days in Stage
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Payment sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(deal.commissionStructure?.amount || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Est. Commission
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stage Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Deal Progress</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={deal.stage || 'prospecting'}
                onChange={async (e) => {
                  const newStage = e.target.value;
                  try {
                    await dealApi.updateDeal(deal.id, { stage: newStage });
                    setDeal({ ...deal, stage: newStage, lastActivityDate: new Date().toISOString() });
                    setActivities(prev => [{
                      id: Date.now().toString(),
                      type: 'stage_change',
                      content: `Deal moved to ${DEAL_STAGES.find(s => s.id === newStage)?.name || newStage} stage`,
                      createdAt: new Date().toISOString(),
                      createdBy: { firstName: 'You', lastName: '' }
                    }, ...prev]);
                  } catch (err) {
                    console.log('Failed to update stage:', err);
                  }
                }}
              >
                {DEAL_STAGES.filter(s => s.id !== 'closed_lost').map((stage) => (
                  <MenuItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Stepper activeStep={getStageIndex(deal.stage)} alternativeLabel>
            {DEAL_STAGES.slice(0, -2).map((stage) => (
              <Step key={stage.id}>
                <StepLabel>{stage.name}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Expected Close Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(deal.expectedCloseDate || Date.now()).toLocaleDateString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(getStageIndex(deal.stage) / (DEAL_STAGES.length - 3)) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Activities" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Deal Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {deal.description || 'No description provided'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Assigned Agent
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                      {deal.assignedTo?.firstName?.charAt(0) || 'A'}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {deal.assignedTo?.firstName} {deal.assignedTo?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {deal.assignedTo?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {deal.tags && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {deal.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {contact && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Contact Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {contact.firstName} {contact.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contact.title} at {contact.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contact.primaryEmail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contact.primaryPhone}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={contact.contactRole}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Activities Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Add a quick note..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddQuickNote();
                }
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleAddQuickNote}
                    disabled={!quickNote.trim() || addingNote}
                    color="primary"
                  >
                    <Send />
                  </IconButton>
                )
              }}
            />
          </Box>
        </Box>
        
        {activities && activities.length > 0 ? (
          <Box>
            {activities.map((activity) => (
              <Card key={activity.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {activity.type === 'note' && <Note sx={{ fontSize: 20, color: 'primary.main' }} />}
                      {activity.type === 'stage_change' && <Timeline sx={{ fontSize: 20, color: 'warning.main' }} />}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {activity.createdBy?.firstName} {activity.createdBy?.lastName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {activity.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No activities yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add activities to track your progress on this deal
            </Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default DealDetail;
