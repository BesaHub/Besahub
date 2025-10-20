import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Grid, Card, CardContent,
  Button, IconButton, Chip, Avatar, TextField, InputAdornment,
  Menu, MenuItem, ListItemIcon, ListItemText, Badge, Alert,
  CircularProgress, Divider, Tooltip
} from '@mui/material';
import {
  Email, Phone, Sms, WhatsApp, Add, Search, FilterList,
  MoreVert, Reply, Forward, Archive, Delete, MarkAsUnread,
  Schedule, Call, VideoCall, Message, AttachFile, Send,
  TrendingUp, TrendingDown, AccessTime, CheckCircle, Error
} from '@mui/icons-material';
import CommunicationsTimeline from './CommunicationsTimeline';
import EmailComposer from './EmailComposer';
import SmsComposer from './SmsComposer';
import CallManager from './CallManager';
import CommunicationAnalytics from './CommunicationAnalytics';
import communicationsApi from '../../services/communicationsApi';

const CommunicationHub = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState('email');
  const [anchorEl, setAnchorEl] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Load communications data
  const loadCommunications = useCallback(async () => {
    try {
      setLoading(true);
      const [communicationsResponse, analyticsResponse] = await Promise.all([
        communicationsApi.getCommunications({ limit: 100 }),
        communicationsApi.getCommunicationAnalytics('7d')
      ]);
      
      setCommunications(communicationsResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      setError('Failed to load communications');
      console.error('Error loading communications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunications();
  }, [loadCommunications]);

  // Filter communications based on search and filters
  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = !searchTerm || 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || comm.type === filterType;
    const matchesStatus = filterStatus === 'all' || comm.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group communications by contact
  const communicationsByContact = filteredCommunications.reduce((acc, comm) => {
    if (!acc[comm.contactId]) {
      acc[comm.contactId] = [];
    }
    acc[comm.contactId].push(comm);
    return acc;
  }, {});

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleComposeOpen = (type) => {
    setComposeType(type);
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setComposeType('email');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'email': return <Email />;
      case 'call': return <Phone />;
      case 'sms': return <Sms />;
      case 'whatsapp': return <WhatsApp />;
      default: return <Message />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'delivered': return 'info';
      case 'read': return 'primary';
      case 'replied': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle />;
      case 'delivered': return <CheckCircle />;
      case 'read': return <CheckCircle />;
      case 'replied': return <Reply />;
      case 'failed': return <Error />;
      case 'pending': return <AccessTime />;
      default: return null;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const tabPanels = [
    {
      label: 'Timeline',
      icon: <Message />,
      component: (
        <CommunicationsTimeline
          communications={filteredCommunications}
          onRefresh={loadCommunications}
        />
      )
    },
    {
      label: 'Email',
      icon: <Email />,
      component: (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Email Communications</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleComposeOpen('email')}
            >
              Compose Email
            </Button>
          </Box>
          <Grid container spacing={2}>
            {filteredCommunications
              .filter(comm => comm.type === 'email')
              .map((comm) => (
                <Grid item xs={12} key={comm.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Email />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {comm.subject}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {comm.direction === 'inbound' ? 'From' : 'To'} Contact • {formatTimestamp(comm.timestamp)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getStatusIcon(comm.status)}
                            label={comm.status}
                            color={getStatusColor(comm.status)}
                            size="small"
                          />
                          <IconButton size="small" onClick={handleMenuOpen}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {comm.content.length > 200 
                          ? `${comm.content.substring(0, 200)}...` 
                          : comm.content
                        }
                      </Typography>
                      {comm.metadata && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {comm.metadata.opened && (
                            <Chip label="Opened" size="small" color="info" />
                          )}
                          {comm.metadata.clicked && (
                            <Chip label="Clicked" size="small" color="success" />
                          )}
                          {comm.metadata.replied && (
                            <Chip label="Replied" size="small" color="success" />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )
    },
    {
      label: 'Calls',
      icon: <Phone />,
      component: (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Call History</Typography>
            <Button
              variant="contained"
              startIcon={<Phone />}
              onClick={() => handleComposeOpen('call')}
            >
              Schedule Call
            </Button>
          </Box>
          <Grid container spacing={2}>
            {filteredCommunications
              .filter(comm => comm.type === 'call')
              .map((comm) => (
                <Grid item xs={12} key={comm.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: comm.direction === 'inbound' ? 'success.main' : 'primary.main' }}>
                          <Phone />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {comm.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatTimestamp(comm.timestamp)}
                            {comm.metadata?.duration && ` • ${comm.metadata.duration} min`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getStatusIcon(comm.status)}
                            label={comm.status}
                            color={getStatusColor(comm.status)}
                            size="small"
                          />
                          {comm.metadata?.recordingUrl && (
                            <IconButton size="small" color="primary">
                              <Call />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {comm.content}
                      </Typography>
                      {comm.metadata?.transcription && (
                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Transcription:
                          </Typography>
                          <Typography variant="body2">
                            {comm.metadata.transcription}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )
    },
    {
      label: 'SMS',
      icon: <Sms />,
      component: (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">SMS Messages</Typography>
            <Button
              variant="contained"
              startIcon={<Sms />}
              onClick={() => handleComposeOpen('sms')}
            >
              Send SMS
            </Button>
          </Box>
          <Grid container spacing={2}>
            {filteredCommunications
              .filter(comm => comm.type === 'sms')
              .map((comm) => (
                <Grid item xs={12} key={comm.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                          <Sms />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            SMS Message
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {comm.direction === 'inbound' ? 'From' : 'To'} Contact • {formatTimestamp(comm.timestamp)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getStatusIcon(comm.status)}
                            label={comm.status}
                            color={getStatusColor(comm.status)}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2">
                        {comm.content}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )
    },
    {
      label: 'WhatsApp',
      icon: <WhatsApp />,
      component: (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">WhatsApp Messages</Typography>
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              onClick={() => handleComposeOpen('whatsapp')}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
            >
              Send WhatsApp
            </Button>
          </Box>
          <Grid container spacing={2}>
            {filteredCommunications
              .filter(comm => comm.type === 'whatsapp')
              .map((comm) => (
                <Grid item xs={12} key={comm.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: '#25D366' }}>
                          <WhatsApp />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            WhatsApp Message
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {comm.direction === 'inbound' ? 'From' : 'To'} Contact • {formatTimestamp(comm.timestamp)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getStatusIcon(comm.status)}
                            label={comm.status}
                            color={getStatusColor(comm.status)}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2">
                        {comm.content}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )
    },
    {
      label: 'Analytics',
      icon: <TrendingUp />,
      component: (
        <CommunicationAnalytics analytics={analytics} />
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Communication Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleMenuOpen}
          >
            New Message
          </Button>
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="call">Call</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="replied">Replied</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper elevation={1}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabPanels.map((panel, index) => (
            <Tab
              key={index}
              label={panel.label}
              icon={panel.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {tabPanels[activeTab].component}
        </Box>
      </Paper>

      {/* Compose Dialogs */}
      {composeOpen && (
        <>
          {composeType === 'email' && (
            <EmailComposer
              open={composeOpen}
              onClose={handleComposeClose}
              onSend={loadCommunications}
            />
          )}
          {composeType === 'sms' && (
            <SmsComposer
              open={composeOpen}
              onClose={handleComposeClose}
              onSend={loadCommunications}
            />
          )}
          {composeType === 'call' && (
            <CallManager
              open={composeOpen}
              onClose={handleComposeClose}
              onSchedule={loadCommunications}
            />
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleComposeOpen('email'); handleMenuClose(); }}>
          <ListItemIcon><Email /></ListItemIcon>
          <ListItemText>Compose Email</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleComposeOpen('sms'); handleMenuClose(); }}>
          <ListItemIcon><Sms /></ListItemIcon>
          <ListItemText>Send SMS</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleComposeOpen('whatsapp'); handleMenuClose(); }}>
          <ListItemIcon><WhatsApp /></ListItemIcon>
          <ListItemText>Send WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleComposeOpen('call'); handleMenuClose(); }}>
          <ListItemIcon><Phone /></ListItemIcon>
          <ListItemText>Schedule Call</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommunicationHub;
