import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Divider,
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
  Business,
  Edit,
  ArrowBack,
  TrendingUp,
  CheckCircle,
  Schedule,
  AttachMoney,
  Home,
  People,
  Assignment,
  Timeline,
  Handshake,
  LocationOn
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { agentApi } from '../../services/agentApi';
import { propertyApi } from '../../services/api';
import { contactApi } from '../../services/contactApi';
import { dealApi } from '../../services/api';
import { taskApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchAgentData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 1) fetchProperties();
    if (activeTab === 2) fetchContacts();
    if (activeTab === 3) fetchDeals();
    if (activeTab === 4) fetchTasks();
  }, [activeTab, id]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const [agentResponse, dashboardResponse] = await Promise.all([
        agentApi.getAgentById(id),
        agentApi.getAgentDashboard(id)
      ]);
      
      setAgent(agentResponse.user || agentResponse);
      setDashboardData(dashboardResponse);
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertyApi.getAll({
        assignedTo: id,
        limit: 50
      });
      setProperties(response.properties || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactApi.getContacts({
        assignedTo: id,
        limit: 50
      });
      setContacts(response.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await dealApi.getAll({
        assignedTo: id,
        limit: 50
      });
      setDeals(response.deals || []);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskApi.getAll({
        assignedTo: id,
        limit: 50
      });
      setTasks(response.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleEdit = () => {
    navigate(`/admin/users/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/agents');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      manager: 'warning',
      agent: 'primary',
      assistant: 'default'
    };
    return colors[role] || 'default';
  };

  const getDealStageColor = (stage) => {
    const colors = {
      lead: 'default',
      qualified: 'info',
      proposal: 'warning',
      negotiation: 'warning',
      won: 'success',
      lost: 'error'
    };
    return colors[stage] || 'default';
  };

  const getTaskStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !agent) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Agents
        </Button>
        <Alert severity="error">
          {error || 'Agent not found'}
        </Alert>
      </Container>
    );
  }

  const displayName = `${agent.firstName || ''} ${agent.lastName || ''}`.trim();
  const stats = dashboardData?.stats || {};
  const winRate = stats.totalDeals > 0 
    ? ((stats.wonDeals || 0) / stats.totalDeals * 100).toFixed(1)
    : 0;

  const isAdmin = user?.role === 'admin';

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Agents
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {agent.firstName?.charAt(0)}{agent.lastName?.charAt(0)}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {displayName}
              </Typography>
              
              {agent.title && (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  {agent.title}
                </Typography>
              )}
              
              {agent.department && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                  <Business sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  {agent.department}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={agent.role}
                  color={getRoleColor(agent.role)}
                  variant="filled"
                />
                {agent.isActive ? (
                  <Chip label="Active" color="success" variant="outlined" />
                ) : (
                  <Chip label="Inactive" color="default" variant="outlined" />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              )}
            </Box>
          </Box>

          {/* Contact Information */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{agent.email}</Typography>
                </Box>
              </Grid>
              {agent.phone && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{agent.phone}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Performance KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Home sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Active Properties
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.activeProperties || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Handshake sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Active Deals
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.activeDeals || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Total Contacts
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.totalContacts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Win Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {winRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.wonDeals || 0} of {stats.totalDeals || 0} deals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Overview" />
          <Tab label="Properties" />
          <Tab label="Contacts" />
          <Tab label="Deals" />
          <Tab label="Tasks" />
          <Tab label="Performance" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Timeline sx={{ mr: 1 }} />
                  Recent Activity
                </Typography>
                
                <List dense>
                  {dashboardData?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={activity.description || activity.type}
                        secondary={new Date(activity.createdAt).toLocaleDateString()}
                      />
                    </ListItem>
                  )) || (
                    <Typography variant="body2" color="text.secondary">
                      No recent activity
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Performance Summary
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Deal Value"
                      secondary={formatCurrency(stats.totalDealValue || 0)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle />
                    </ListItemIcon>
                    <ListItemText
                      primary="Won Deals"
                      secondary={`${stats.wonDeals || 0} deals`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary="Pending Tasks"
                      secondary={`${stats.pendingTasks || 0} tasks`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Home sx={{ mr: 1 }} />
              Assigned Properties ({properties.length})
            </Typography>
            
            {properties.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No properties assigned
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Property Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow 
                        key={property.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <TableCell>{property.name || property.address}</TableCell>
                        <TableCell>{property.propertyType}</TableCell>
                        <TableCell>
                          {property.city}, {property.state}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(property.price || property.listPrice)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={property.status || 'active'} 
                            size="small"
                            color={property.status === 'sold' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 1 }} />
              Assigned Contacts ({contacts.length})
            </Typography>
            
            {contacts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No contacts assigned
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow 
                        key={contact.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <TableCell>
                          {contact.firstName} {contact.lastName}
                        </TableCell>
                        <TableCell>{contact.primaryEmail}</TableCell>
                        <TableCell>{contact.primaryPhone}</TableCell>
                        <TableCell>{contact.contactRole}</TableCell>
                        <TableCell>
                          <Chip 
                            label={contact.leadStatus || 'active'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Handshake sx={{ mr: 1 }} />
              Active Deals ({deals.length})
            </Typography>
            
            {deals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No active deals
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Deal Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Close Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow 
                        key={deal.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <TableCell>{deal.name}</TableCell>
                        <TableCell>{deal.contactName || '-'}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(deal.value)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={deal.stage} 
                            size="small"
                            color={getDealStageColor(deal.stage)}
                          />
                        </TableCell>
                        <TableCell>
                          {deal.expectedCloseDate 
                            ? new Date(deal.expectedCloseDate).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ mr: 1 }} />
              Assigned Tasks ({tasks.length})
            </Typography>
            
            {tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks assigned
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow 
                        key={task.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority || 'medium'} 
                            size="small"
                            color={
                              task.priority === 'high' ? 'error' :
                              task.priority === 'medium' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            size="small"
                            color={getTaskStatusColor(task.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {task.dueDate 
                            ? new Date(task.dueDate).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Timeline sx={{ mr: 1 }} />
                  Performance Metrics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Deal Pipeline
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Total Deals" 
                            secondary={stats.totalDeals || 0} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Won Deals" 
                            secondary={stats.wonDeals || 0} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Lost Deals" 
                            secondary={stats.lostDeals || 0} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Active Deals" 
                            secondary={stats.activeDeals || 0} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Revenue & Activities
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Total Deal Value" 
                            secondary={formatCurrency(stats.totalDealValue || 0)} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Active Properties" 
                            secondary={stats.activeProperties || 0} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Total Contacts" 
                            secondary={stats.totalContacts || 0} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Pending Tasks" 
                            secondary={stats.pendingTasks || 0} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Detailed performance charts will be available in a future update
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AgentDetail;
