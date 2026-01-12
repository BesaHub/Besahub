import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardHeader,
  Button, IconButton, Chip, Avatar, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, Alert, CircularProgress,
  Tabs, Tab, Divider, Tooltip, Badge, LinearProgress, Accordion,
  AccordionSummary, AccordionDetails, Rating, Slider, Menu,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  Notifications, NotificationsActive, NotificationsOff, Settings,
  MarkEmailRead, Delete, MoreVert, FilterList, Sort, Refresh,
  CheckCircle, Warning, Error, Info, Star, StarBorder, ExpandMore,
  Schedule, Person, Business, CalendarToday, AttachMoney, TrendingUp,
  Email, Sms, Phone, VolumeUp, VolumeOff, DesktopWindows, Smartphone,
  Visibility
} from '@mui/icons-material';
import notificationsApi from '../../services/notificationsApi';

const SmartNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadSettings();
    loadAnalytics();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationsApi.getNotifications({ limit: 50 }),
        notificationsApi.getUnreadCount()
      ]);
      
      setNotifications(notificationsResponse.data);
      setUnreadCount(unreadResponse.data.unread);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await notificationsApi.getSettings();
      setSettings(response.data);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await notificationsApi.getAnalytics();
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(notif => notif.id === notificationId);
        return deletedNotif && !deletedNotif.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type, category) => {
    switch (type) {
      case 'urgent':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'info':
      default:
        switch (category) {
          case 'lead':
            return <Person color="primary" />;
          case 'task':
            return <Schedule color="info" />;
          case 'deal':
            return <AttachMoney color="success" />;
          case 'calendar':
            return <CalendarToday color="primary" />;
          case 'market':
            return <TrendingUp color="warning" />;
          default:
            return <Info color="info" />;
        }
    }
  };

  const getNotificationColor = (type, priority) => {
    if (type === 'urgent' || priority === 'high') return 'error';
    if (type === 'warning' || priority === 'medium') return 'warning';
    if (type === 'success') return 'success';
    return 'info';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'urgent') return notif.priority === 'high' || notif.type === 'urgent';
    if (filter === 'action_required') return notif.actionRequired;
    return true;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  const handleMenuOpen = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleAction = (action) => {
    if (!selectedNotification) return;
    
    switch (action) {
      case 'mark_read':
        markAsRead(selectedNotification.id);
        break;
      case 'delete':
        deleteNotification(selectedNotification.id);
        break;
      case 'view':
        // Navigate to related entity
        if (selectedNotification.relatedEntity) {
          window.open(selectedNotification.relatedEntity.url, '_blank');
        }
        break;
      default:
        break;
    }
    
    handleMenuClose();
  };

  const tabPanels = [
    {
      label: 'All Notifications',
      component: (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filter}
                  label="Filter"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="unread">Unread</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="action_required">Action Required</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="timestamp">Time</MenuItem>
                  <MenuItem value="priority">Priority</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<MarkEmailRead />}
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
              <IconButton size="small" onClick={loadNotifications}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>

          <List>
            {sortedNotifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                  border: notification.actionRequired ? '2px solid' : '1px solid',
                  borderColor: notification.actionRequired ? 'warning.main' : 'divider'
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: getNotificationColor(notification.type, notification.priority) + '.main',
                      width: 40,
                      height: 40
                    }}
                  >
                    {getNotificationIcon(notification.type, notification.category)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                          color: notification.read ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      {notification.actionRequired && (
                        <Chip label="Action Required" color="warning" size="small" />
                      )}
                      <Chip
                        label={notification.priority}
                        color={getNotificationColor(notification.type, notification.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(notification.timestamp)}
                        </Typography>
                        {notification.relatedEntity && (
                          <Chip
                            label={notification.relatedEntity.type}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, notification)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {sortedNotifications.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up!
              </Typography>
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Settings',
      component: (
        <Box>
          {settings && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Email Notifications" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.email.enabled}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              email: { ...prev.email, enabled: e.target.checked }
                            }));
                          }}
                        />
                      }
                      label="Enable email notifications"
                    />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Notification Frequency
                      </Typography>
                      <FormControlLabel
                        control={<Switch checked={settings.email.immediate.includes('urgent')} />}
                        label="Immediate for urgent notifications"
                      />
                      <FormControlLabel
                        control={<Switch checked={settings.email.daily.includes('info')} />}
                        label="Daily digest for info notifications"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Push Notifications" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.push.enabled}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              push: { ...prev.push, enabled: e.target.checked }
                            }));
                          }}
                        />
                      }
                      label="Enable push notifications"
                    />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Categories
                      </Typography>
                      {['lead', 'task', 'deal', 'calendar', 'market'].map((category) => (
                        <FormControlLabel
                          key={category}
                          control={
                            <Switch
                              checked={settings.push.categories.includes(category)}
                            />
                          }
                          label={category.charAt(0).toUpperCase() + category.slice(1)}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )
    },
    {
      label: 'Analytics',
      component: (
        <Box>
          {analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {analytics.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Notifications
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {analytics.byPriority.high}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      High Priority
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {analytics.readRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Read Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {analytics.actionRequired}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Action Required
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )
    }
  ];

  if (loading && notifications.length === 0) {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Badge badgeContent={unreadCount} color="error">
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <Notifications />
          </Avatar>
        </Badge>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Smart Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} unread notifications
          </Typography>
        </Box>
      </Box>

      <Paper elevation={1}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabPanels.map((panel, index) => (
            <Tab key={index} label={panel.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabPanels[activeTab].component}
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => handleAction('view')}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItemComponent>
        {selectedNotification && !selectedNotification.read && (
          <MenuItemComponent onClick={() => handleAction('mark_read')}>
            <ListItemIcon><MarkEmailRead /></ListItemIcon>
            <ListItemText>Mark as Read</ListItemText>
          </MenuItemComponent>
        )}
        <Divider />
        <MenuItemComponent onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItemComponent>
      </Menu>
    </Box>
  );
};

export default SmartNotifications;
