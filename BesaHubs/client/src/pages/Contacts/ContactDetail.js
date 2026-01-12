import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Business,
  Edit,
  Delete,
  Message,
  AttachMoney,
  CalendarToday,
  TrendingUp,
  Assignment,
  History,
  ArrowBack,
  FindInPage,
  NotificationsActive,
  Handshake
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { contactApi } from '../../services/contactApi';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Mock contact data - replace with actual API call
  const mockContact = {
    id: '1',
    type: 'individual',
    firstName: 'John',
    lastName: 'Smith',
    companyName: 'Smith Properties',
    title: 'CEO',
    primaryEmail: 'john@smithproperties.com',
    secondaryEmail: 'j.smith@personal.com',
    primaryPhone: '(555) 123-4567',
    mobilePhone: '(555) 123-4568',
    mailingAddress: '123 Main Street',
    mailingCity: 'New York',
    mailingState: 'NY',
    mailingZipCode: '10001',
    contactRole: 'investor',
    leadStatus: 'hot',
    budgetMin: 1000000,
    budgetMax: 5000000,
    propertyTypeInterest: ['office', 'retail', 'industrial'],
    preferredLocations: ['New York', 'Los Angeles', 'Chicago'],
    timeframe: '30_days',
    notes: 'High-net-worth individual looking for commercial real estate investments. Prefers Class A office buildings in prime locations.',
    tags: ['VIP', 'High Priority', 'Referral'],
    lastContactDate: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    assignedAgentId: 'agent-123',
    creditRating: 'A',
    netWorth: 25000000,
    liquidity: 5000000,
    website: 'https://smithproperties.com',
    linkedInUrl: 'https://linkedin.com/in/johnsmith',
    customFields: {
      investorType: 'Individual',
      acquisitionCriteria: 'Value-add opportunities in major markets'
    }
  };

  const mockActivities = [
    {
      id: '1',
      type: 'email',
      title: 'Sent market update',
      description: 'Quarterly market report for NYC office market',
      date: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      type: 'call',
      title: 'Follow-up call',
      description: 'Discussed investment criteria and timeline',
      date: '2024-01-12T14:30:00Z'
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Property showing',
      description: 'Showed 123 Broadway office building',
      date: '2024-01-10T11:00:00Z'
    }
  ];

  const mockDeals = [
    {
      id: '1',
      name: '123 Broadway Office Building',
      stage: 'negotiation',
      value: 2500000,
      probability: 60,
      expectedCloseDate: '2024-02-15'
    },
    {
      id: '2',
      name: '456 Park Ave Retail Space',
      stage: 'proposal',
      value: 1800000,
      probability: 40,
      expectedCloseDate: '2024-03-01'
    }
  ];

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        
        try {
          const response = await contactApi.getContact(id);
          if (response && response.contact) {
            setContact(response.contact);
          } else {
            // Fallback to mock data for demo
            console.log('Using mock contact data - API response empty');
            setContact(mockContact);
          }
        } catch (apiError) {
          console.warn('API error, using mock data:', apiError);
          // Fallback to mock data if API fails
          setContact(mockContact);
        }
      } catch (err) {
        setError('Failed to load contact details');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const handleEdit = () => {
    navigate(`/contacts/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/contacts');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getContactTypeColor = (role) => {
    const colors = {
      tenant: 'primary',
      landlord: 'success',
      buyer: 'info',
      seller: 'warning',
      investor: 'secondary',
      broker: 'default'
    };
    return colors[role] || 'default';
  };

  const getLeadStatusColor = (status) => {
    const colors = {
      cold: 'default',
      warm: 'warning',
      hot: 'error',
      qualified: 'success',
      converted: 'primary'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !contact) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Contacts
        </Button>
        <Alert severity="error">
          {error || 'Contact not found'}
        </Alert>
      </Box>
    );
  }

  const displayName = contact.type === 'company' 
    ? contact.companyName 
    : `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Contacts
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                bgcolor: contact.type === 'company' ? 'primary.main' : 'secondary.main' 
              }}
            >
              {contact.avatar ? (
                <img src={contact.avatar} alt={displayName} style={{ width: '100%', height: '100%' }} />
              ) : (
                displayName.charAt(0)
              )}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {displayName}
              </Typography>
              
              {contact.title && (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  {contact.title}
                </Typography>
              )}
              
              {contact.type === 'individual' && contact.companyName && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                  {contact.companyName}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={contact.contactRole || 'Contact'}
                  color={getContactTypeColor(contact.contactRole)}
                  variant="outlined"
                />
                {contact.leadStatus && (
                  <Chip
                    label={contact.leadStatus.toUpperCase()}
                    color={getLeadStatusColor(contact.leadStatus)}
                    variant="filled"
                  />
                )}
                {contact.tags && contact.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEdit}
              >
                Edit
              </Button>
              
              {(contact.contactRole === 'investor' || contact.contactRole === 'buyer') && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<FindInPage />}
                    onClick={() => navigate(`/property-matching?contactId=${contact.id}`)}
                  >
                    Find Properties
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<NotificationsActive />}
                    onClick={() => navigate('/property-alerts')}
                  >
                    View Alerts
                  </Button>
                </>
              )}
              
              <Button
                variant="outlined"
                startIcon={<Handshake />}
                onClick={() => navigate(`/deals/new?contactId=${contact.id}&contactName=${encodeURIComponent(contact.firstName + ' ' + contact.lastName)}`)}
              >
                Create Deal
              </Button>
              
              <IconButton>
                <Message />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Overview" />
          <Tab label="Activity" />
          <Tab label="Deals" />
          <Tab label="Documents" />
          <Tab label="Email Activity" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Business sx={{ mr: 1 }} />
                  Contact Information
                </Typography>
                
                <List dense>
                  {contact.primaryEmail && (
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Primary Email" 
                        secondary={contact.primaryEmail} 
                      />
                    </ListItem>
                  )}
                  
                  {contact.secondaryEmail && (
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Secondary Email" 
                        secondary={contact.secondaryEmail} 
                      />
                    </ListItem>
                  )}
                  
                  {contact.primaryPhone && (
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Primary Phone" 
                        secondary={contact.primaryPhone} 
                      />
                    </ListItem>
                  )}
                  
                  {contact.mobilePhone && (
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Mobile Phone" 
                        secondary={contact.mobilePhone} 
                      />
                    </ListItem>
                  )}
                  
                  {contact.mailingAddress && (
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Address" 
                        secondary={`${contact.mailingAddress}, ${contact.mailingCity}, ${contact.mailingState} ${contact.mailingZipCode}`} 
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Investment Criteria */}
          {contact.contactRole === 'investor' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1 }} />
                    Investment Criteria
                  </Typography>
                  
                  <List dense>
                    {(contact.budgetMin || contact.budgetMax) && (
                      <ListItem>
                        <ListItemText 
                          primary="Budget Range" 
                          secondary={
                            contact.budgetMin && contact.budgetMax
                              ? `${formatCurrency(contact.budgetMin)} - ${formatCurrency(contact.budgetMax)}`
                              : contact.budgetMax
                              ? `Up to ${formatCurrency(contact.budgetMax)}`
                              : `From ${formatCurrency(contact.budgetMin)}`
                          } 
                        />
                      </ListItem>
                    )}
                    
                    {contact.propertyTypeInterest && contact.propertyTypeInterest.length > 0 && (
                      <ListItem>
                        <ListItemText 
                          primary="Property Types" 
                          secondary={contact.propertyTypeInterest.join(', ')} 
                        />
                      </ListItem>
                    )}
                    
                    {contact.preferredLocations && contact.preferredLocations.length > 0 && (
                      <ListItem>
                        <ListItemText 
                          primary="Preferred Markets" 
                          secondary={contact.preferredLocations.join(', ')} 
                        />
                      </ListItem>
                    )}
                    
                    {contact.timeframe && (
                      <ListItem>
                        <ListItemText 
                          primary="Timeframe" 
                          secondary={contact.timeframe.replace('_', ' ')} 
                        />
                      </ListItem>
                    )}
                    
                    {contact.netWorth && (
                      <ListItem>
                        <ListItemText 
                          primary="Net Worth" 
                          secondary={formatCurrency(contact.netWorth)} 
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Notes */}
          {contact.notes && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {contact.notes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <History sx={{ mr: 1 }} />
              Recent Activity
            </Typography>
            
            <List>
              {mockActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.date).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < mockActivities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              Active Deals
            </Typography>
            
            <Grid container spacing={2}>
              {mockDeals.map((deal) => (
                <Grid item xs={12} md={6} key={deal.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {deal.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Stage: {deal.stage} | {deal.probability}% probability
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(deal.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Expected close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ mr: 1 }} />
              Documents
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              Document management functionality coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Email sx={{ mr: 1 }} />
              Email Activity
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track email opens, clicks, bounces, and engagement for this contact.
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No email events yet. Email activity will appear here once campaigns are sent.
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Email tracking powered by SendGrid
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ContactDetail;
