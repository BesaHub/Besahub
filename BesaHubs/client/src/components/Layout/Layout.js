import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Typography
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Logout,
  Settings as SettingsIcon,
  Person
} from '@mui/icons-material';
import io from 'socket.io-client';

import { useAuth } from '../../contexts/AuthContext';
import { HorizontalNavigation } from './Navigation';
import PhoneDialerWorkspace from '../Communication/PhoneDialerWorkspace';
import EmailComposerWorkspace from '../Communication/EmailComposerWorkspace';
import CalendarWorkspace from '../Communication/CalendarWorkspace';
import FirstRunWizard from '../Wizard/FirstRunWizard';
import integrationsApi from '../../services/integrationsApi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardChecked, setWizardChecked] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  useEffect(() => {
    const checkWizardStatus = async () => {
      if (!user || !user.id || wizardChecked) return;
      
      const localStorageKey = `wizardCompleted_${user.id}`;
      const localCompleted = localStorage.getItem(localStorageKey);
      
      if (localCompleted === 'true') {
        setWizardChecked(true);
        return;
      }

      if (user.role === 'admin') {
        try {
          const response = await integrationsApi.getWizardStatus();
          const shouldShow = response.data?.shouldShowWizard;
          
          setShowWizard(shouldShow);
          setWizardChecked(true);
        } catch (error) {
          console.error('Failed to check wizard status:', error);
          setWizardChecked(true);
        }
      } else {
        setWizardChecked(true);
      }
    };

    checkWizardStatus();
  }, [user, wizardChecked]);

  const handleWizardClose = () => {
    setShowWizard(false);
    if (user?.id) {
      localStorage.setItem(`wizardCompleted_${user.id}`, 'true');
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
      }
    };

    if (user) {
      fetchUnreadCount();

      // Use relative path to avoid mixed content issues (HTTPS page loading HTTP resources)
      // Socket.IO will connect to the same origin as the page
      const socket = io({
        auth: {
          token: localStorage.getItem('token')
        },
        path: '/socket.io',
        transports: ['polling', 'websocket']
      });

      socket.emit('join_user_room', user.id);

      socket.on('notification:new', () => {
        setUnreadCount(prev => prev + 1);
      });

      socket.on('notification:update', (notification) => {
        if (notification.status === 'read') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });

      return () => socket.disconnect();
    }
  }, [user]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        sx={{
          background: 'white',
          color: '#333',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e0e0e0',
          width: '100%',
          maxWidth: '100%'
        }}
        elevation={0}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          gap: { xs: 0.5, sm: 1, lg: 1.5 }, 
          py: 0.5, 
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          minHeight: '56px !important',
          maxWidth: '100%',
          width: '100%'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: 'fit-content',
              flexShrink: 0,
              letterSpacing: '-0.5px',
              userSelect: 'none',
              fontSize: { xs: '1.1rem', sm: '1.25rem', lg: '1.5rem' }
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Box 
              component="span" 
              sx={{ 
                color: '#1976d2',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif'
              }}
            >
              Besa
            </Box>
            <Box 
              component="span" 
              sx={{ 
                color: '#7c3aed',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif'
              }}
            >
              Hub
            </Box>
          </Typography>

          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            minWidth: 0, 
            overflow: 'hidden',
            mx: { xs: 0.5, sm: 1, lg: 2 }
          }}>
            <HorizontalNavigation />
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }, 
            minWidth: 'fit-content', 
            flexShrink: 0 
          }}>
            <IconButton 
              sx={{ color: '#666' }}
              onClick={() => navigate('/notifications')}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              edge="end"
              aria-label="account of current user"
              onClick={handleProfileMenuOpen}
            >
              <Avatar
                sx={{
                  bgcolor: '#1976d2',
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem'
                }}
              >
                {user?.firstName?.[0] || user?.email?.[0] || <Person />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          handleProfileMenuClose();
          navigate('/settings');
        }}>
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8f9fa',
          minHeight: 'calc(100vh - 120px)',
          p: { xs: 2, sm: 2.5, md: 3 },
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {children}
      </Box>

      <PhoneDialerWorkspace />
      <EmailComposerWorkspace />
      <CalendarWorkspace />
      <FirstRunWizard open={showWizard} onClose={handleWizardClose} />
    </Box>
  );
};

export default Layout;