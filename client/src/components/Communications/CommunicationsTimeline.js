import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, IconButton, Card, CardContent, Button, TextField,
  InputAdornment, Menu, MenuItem, ListItemIcon, ListItemText,
  Tooltip, Badge, Divider, List, ListItem, ListItemAvatar
} from '@mui/material';
import {
  Email, Phone, Sms, WhatsApp, MoreVert, Reply, Forward,
  Archive, Delete, MarkAsUnread, Schedule, Call, VideoCall,
  Search, FilterList, Refresh, TrendingUp, TrendingDown
} from '@mui/icons-material';
import communicationsApi from '../../services/communicationsApi';

const CommunicationsTimeline = ({ communications, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Group communications by date
  const groupedCommunications = useMemo(() => {
    const groups = {};
    
    communications.forEach(comm => {
      const date = new Date(comm.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(comm);
    });

    // Sort each group by timestamp (newest first)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return groups;
  }, [communications]);

  // Filter communications
  const filteredCommunications = useMemo(() => {
    return communications.filter(comm => {
      const matchesSearch = !searchTerm || 
        comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || comm.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [communications, searchTerm, filterType]);

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'email': return <Email />;
      case 'call': return <Phone />;
      case 'sms': return <Sms />;
      case 'whatsapp': return <WhatsApp />;
      default: return <Email />;
    }
  };

  const getCommunicationColor = (type, direction) => {
    if (direction === 'inbound') {
      switch (type) {
        case 'email': return 'success';
        case 'call': return 'info';
        case 'sms': return 'warning';
        case 'whatsapp': return 'success';
        default: return 'primary';
      }
    } else {
      switch (type) {
        case 'email': return 'primary';
        case 'call': return 'info';
        case 'sms': return 'warning';
        case 'whatsapp': return 'success';
        default: return 'primary';
      }
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMenuOpen = (event, communication) => {
    setAnchorEl(event.currentTarget);
    setSelectedCommunication(communication);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCommunication(null);
  };

  const handleAction = async (action) => {
    if (!selectedCommunication) return;

    try {
      switch (action) {
        case 'reply':
          // Handle reply logic
          break;
        case 'forward':
          // Handle forward logic
          break;
        case 'archive':
          await communicationsApi.updateCommunication(selectedCommunication.id, {
            status: 'archived'
          });
          onRefresh();
          break;
        case 'delete':
          await communicationsApi.deleteCommunication(selectedCommunication.id);
          onRefresh();
          break;
        case 'mark_unread':
          await communicationsApi.updateCommunication(selectedCommunication.id, {
            status: 'unread'
          });
          onRefresh();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      handleMenuClose();
    }
  };

  const getCommunicationStats = () => {
    const stats = {
      total: communications.length,
      email: communications.filter(c => c.type === 'email').length,
      call: communications.filter(c => c.type === 'call').length,
      sms: communications.filter(c => c.type === 'sms').length,
      whatsapp: communications.filter(c => c.type === 'whatsapp').length,
      inbound: communications.filter(c => c.direction === 'inbound').length,
      outbound: communications.filter(c => c.direction === 'outbound').length
    };
    return stats;
  };

  const stats = getCommunicationStats();

  return (
    <Box>
      {/* Header with Stats */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Communication Timeline</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>
        
        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<Email />}
            label={`${stats.email} Emails`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<Phone />}
            label={`${stats.call} Calls`}
            color="info"
            variant="outlined"
          />
          <Chip
            icon={<Sms />}
            label={`${stats.sms} SMS`}
            color="warning"
            variant="outlined"
          />
          <Chip
            icon={<WhatsApp />}
            label={`${stats.whatsapp} WhatsApp`}
            color="success"
            variant="outlined"
          />
        </Box>

        {/* Search and Filter */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search communications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label="Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="call">Call</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Communication List */}
      <List>
        {Object.entries(groupedCommunications)
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .map(([date, comms]) => (
            <React.Fragment key={date}>
              {/* Date Header */}
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Schedule />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="h6">
                      {formatDate(comms[0].timestamp)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {comms.length} communication{comms.length !== 1 ? 's' : ''}
                    </Typography>
                  }
                />
              </ListItem>

              {/* Communications for this date */}
              {comms.map((comm) => (
                <ListItem key={comm.id} sx={{ pl: 4 }}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: getCommunicationColor(comm.type, comm.direction) === 'success' ? 'success.main' :
                                getCommunicationColor(comm.type, comm.direction) === 'info' ? 'info.main' :
                                getCommunicationColor(comm.type, comm.direction) === 'warning' ? 'warning.main' : 'primary.main'
                      }}
                    >
                      {getCommunicationIcon(comm.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {comm.subject}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={comm.status}
                            color={getStatusColor(comm.status)}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, comm)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {comm.direction === 'inbound' ? 'From' : 'To'} Contact • {formatTime(comm.timestamp)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {comm.content.length > 200 
                            ? `${comm.content.substring(0, 200)}...` 
                            : comm.content
                          }
                        </Typography>
                        {/* Metadata */}
                        {comm.metadata && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {comm.metadata.opened && (
                              <Chip label="Opened" size="small" color="info" />
                            )}
                            {comm.metadata.clicked && (
                              <Chip label="Clicked" size="small" color="success" />
                            )}
                            {comm.metadata.replied && (
                              <Chip label="Replied" size="small" color="success" />
                            )}
                            {comm.metadata.duration && (
                              <Chip label={`${comm.metadata.duration} min`} size="small" color="info" />
                            )}
                            {comm.metadata.recordingUrl && (
                              <Chip 
                                icon={<Call />} 
                                label="Recording" 
                                size="small" 
                                color="primary" 
                                clickable
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              <Divider sx={{ my: 2 }} />
            </React.Fragment>
          ))}
      </List>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('reply')}>
          <ListItemIcon><Reply /></ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('forward')}>
          <ListItemIcon><Forward /></ListItemIcon>
          <ListItemText>Forward</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('mark_unread')}>
          <ListItemIcon><MarkAsUnread /></ListItemIcon>
          <ListItemText>Mark as Unread</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('archive')}>
          <ListItemIcon><Archive /></ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommunicationsTimeline;
