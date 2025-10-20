import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Handshake as HandshakeIcon,
  Assignment as TaskIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  ArrowDropDown,
  SupervisorAccount as AdminIcon,
  Timeline as PipelineIcon,
  Message as MessageIcon,
  AutoAwesome as AIIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useCommunication } from '../../contexts/CommunicationContext';

// Horizontal Navigation Component for Top Bar
export const HorizontalNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEls, setAnchorEls] = React.useState({});

  const handleMenuOpen = (event, menuKey) => {
    setAnchorEls(prev => ({
      ...prev,
      [menuKey]: event.currentTarget
    }));
  };

  const handleMenuClose = (menuKey) => {
    setAnchorEls(prev => ({
      ...prev,
      [menuKey]: null
    }));
  };

  const handleNavigate = (path, menuKey = null) => {
    navigate(path);
    if (menuKey) handleMenuClose(menuKey);
  };

  const isParentActive = (parentPath) => location.pathname.startsWith(parentPath);

  const menuItems = [
    {
      title: 'Properties',
      icon: <HomeIcon />,
      path: '/properties'
    },
    {
      title: 'Contacts',
      icon: <PeopleIcon />,
      path: '/contacts'
    },
    {
      title: 'Companies',
      icon: <BusinessIcon />,
      path: '/companies',
      submenu: [
        { title: 'All Companies', path: '/companies' },
        { title: 'Add Company', path: '/companies/new' },
        { title: 'Investors', path: '/companies/investors' }
      ]
    },
    {
      title: 'Pipeline',
      icon: <PipelineIcon />,
      path: '/pipeline'
    },
    {
      title: 'Deals',
      icon: <HandshakeIcon />,
      path: '/deals'
    },
    {
      title: 'Tasks',
      icon: <TaskIcon />,
      path: '/tasks',
      submenu: [
        { title: 'My Tasks', path: '/tasks' },
        { title: 'Add Task', path: '/tasks/new' },
        { title: 'Overdue', path: '/tasks/overdue' }
      ]
    },
    {
      title: 'Communications',
      icon: <MessageIcon />,
      path: '/communications',
      submenu: [
        { title: 'All Communications', path: '/communications' },
        { title: 'Email', path: '/communications?tab=email' },
        { title: 'Calls', path: '/communications?tab=calls' },
        { title: 'SMS', path: '/communications?tab=sms' },
        { title: 'WhatsApp', path: '/communications?tab=whatsapp' }
      ]
    },
    {
      title: 'Calendar',
      icon: <CalendarIcon />,
      path: '/calendar',
      submenu: [
        { title: 'Calendar View', path: '/calendar' },
        { title: 'Upcoming Events', path: '/calendar?tab=events' },
        { title: 'Calendar Settings', path: '/calendar?tab=settings' },
        { title: 'Sync Calendars', path: '/calendar?tab=sync' }
      ]
    },
    {
      title: 'AI Assistant',
      icon: <AIIcon />,
      path: '/ai-assistant',
      submenu: [
        { title: 'Email Assistant', path: '/ai-assistant' },
        { title: 'Writing Tips', path: '/ai-assistant?tab=tips' },
        { title: 'Email Optimizer', path: '/ai-assistant?tab=optimizer' },
        { title: 'Smart Suggestions', path: '/ai-assistant?tab=suggestions' }
      ]
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      submenu: [
        { title: 'All Notifications', path: '/notifications' },
        { title: 'Settings', path: '/notifications?tab=settings' },
        { title: 'Analytics', path: '/notifications?tab=analytics' }
      ]
    },
    {
      title: 'Reports',
      icon: <ReportsIcon />,
      path: '/reports',
      submenu: [
        { title: 'Dashboard', path: '/reports' },
        { title: 'Sales Pipeline', path: '/reports/pipeline' },
        { title: 'Property Performance', path: '/reports/properties' },
        { title: 'Lead Analysis', path: '/reports/leads' },
        { title: 'Revenue Forecast', path: '/reports/revenue' }
      ]
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: { xs: 0.25, sm: 0.5, lg: 0.75 }, 
      flexShrink: 1, 
      overflow: 'auto', 
      maxWidth: '100%',
      '&::-webkit-scrollbar': {
        height: '4px'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px'
      }
    }}>
      {menuItems.map((item) => (
        <Box key={item.title}>
          <Button
            startIcon={item.icon}
            endIcon={item.submenu ? <ArrowDropDown fontSize="small" /> : null}
            onClick={item.submenu ? (e) => handleMenuOpen(e, item.title) : () => handleNavigate(item.path)}
            sx={{
              color: isParentActive(item.path) ? '#1976d2' : '#666',
              backgroundColor: isParentActive(item.path) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
              textTransform: 'none',
              minWidth: 'auto',
              px: { xs: 0.75, sm: 1, lg: 1.5 },
              py: 0.5,
              borderRadius: 2,
              fontSize: { xs: '0.7rem', sm: '0.75rem', lg: '0.8rem' },
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '& .MuiButton-startIcon': {
                marginRight: { xs: 0.25, sm: 0.5 },
                '& > svg': {
                  fontSize: { xs: '1rem', sm: '1.1rem', lg: '1.25rem' }
                }
              },
              '& .MuiButton-endIcon': {
                marginLeft: { xs: 0, sm: 0.25 },
                '& > svg': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              },
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            {item.title}
          </Button>

          {item.submenu && (
            <Menu
              anchorEl={anchorEls[item.title]}
              open={Boolean(anchorEls[item.title])}
              onClose={() => handleMenuClose(item.title)}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }
                }
              }}
            >
              {item.submenu.map((subItem) => (
                <MenuItem
                  key={subItem.path}
                  onClick={() => handleNavigate(subItem.path, item.title)}
                  sx={{
                    py: 1.5,
                    color: location.pathname === subItem.path ? '#1976d2' : 'inherit',
                    backgroundColor: location.pathname === subItem.path ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
                  }}
                >
                  {subItem.title}
                </MenuItem>
              ))}
            </Menu>
          )}
        </Box>
      ))}
    </Box>
  );
};

// Vertical Navigation Component (original - kept for compatibility)
const Navigation = ({ onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openPhoneDialer, openEmailComposer, openCalendar } = useCommunication();
  const [openMenus, setOpenMenus] = React.useState({});

  const handleClick = (path, hasSubmenu = false) => {
    if (hasSubmenu) {
      setOpenMenus(prev => ({
        ...prev,
        [path]: !prev[path]
      }));
    } else {
      navigate(path);
      if (onMobileClose) onMobileClose();
    }
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (parentPath) => location.pathname.startsWith(parentPath);

  const menuItems = [
    {
      title: 'Properties',
      icon: <HomeIcon />,
      path: '/properties'
    },
    {
      title: 'Contacts',
      icon: <PeopleIcon />,
      path: '/contacts'
    },
    {
      title: 'Companies',
      icon: <BusinessIcon />,
      path: '/companies',
      submenu: [
        { title: 'All Companies', path: '/companies' },
        { title: 'Add Company', path: '/companies/new' },
        { title: 'Investors', path: '/companies/investors' }
      ]
    },
    {
      title: 'Pipeline',
      icon: <PipelineIcon />,
      path: '/pipeline'
    },
    {
      title: 'Deals',
      icon: <HandshakeIcon />,
      path: '/deals'
    },
    {
      title: 'Tasks',
      icon: <TaskIcon />,
      path: '/tasks',
      submenu: [
        { title: 'My Tasks', path: '/tasks' },
        { title: 'Add Task', path: '/tasks/new' },
        { title: 'Overdue', path: '/tasks/overdue' }
      ]
    },
    {
      title: 'Communications',
      icon: <MessageIcon />,
      path: '/communications',
      submenu: [
        { title: 'All Communications', path: '/communications' },
        { title: 'Email', path: '/communications?tab=email' },
        { title: 'Calls', path: '/communications?tab=calls' },
        { title: 'SMS', path: '/communications?tab=sms' },
        { title: 'WhatsApp', path: '/communications?tab=whatsapp' }
      ]
    },
    {
      title: 'Calendar',
      icon: <CalendarIcon />,
      path: '/calendar',
      submenu: [
        { title: 'Calendar View', path: '/calendar' },
        { title: 'Upcoming Events', path: '/calendar?tab=events' },
        { title: 'Calendar Settings', path: '/calendar?tab=settings' },
        { title: 'Sync Calendars', path: '/calendar?tab=sync' }
      ]
    },
    {
      title: 'AI Assistant',
      icon: <AIIcon />,
      path: '/ai-assistant',
      submenu: [
        { title: 'Email Assistant', path: '/ai-assistant' },
        { title: 'Writing Tips', path: '/ai-assistant?tab=tips' },
        { title: 'Email Optimizer', path: '/ai-assistant?tab=optimizer' },
        { title: 'Smart Suggestions', path: '/ai-assistant?tab=suggestions' }
      ]
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      submenu: [
        { title: 'All Notifications', path: '/notifications' },
        { title: 'Settings', path: '/notifications?tab=settings' },
        { title: 'Analytics', path: '/notifications?tab=analytics' }
      ]
    },
    {
      title: 'Reports',
      icon: <ReportsIcon />,
      path: '/reports',
      submenu: [
        { title: 'Dashboard', path: '/reports' },
        { title: 'Sales Pipeline', path: '/reports/pipeline' },
        { title: 'Property Performance', path: '/reports/properties' },
        { title: 'Lead Analysis', path: '/reports/leads' },
        { title: 'Revenue Forecast', path: '/reports/revenue' }
      ]
    }
  ];

  const communicationItems = [
    {
      title: 'Phone',
      icon: <PhoneIcon />,
      action: openPhoneDialer
    },
    {
      title: 'Email',
      icon: <EmailIcon />,
      action: openEmailComposer
    },
    {
      title: 'Calendar',
      icon: <CalendarIcon />,
      action: openCalendar
    }
  ];

  // Add admin menu item for admin users only
  const adminMenuItem = {
    title: 'Admin',
    icon: <AdminIcon />,
    path: '/admin',
    submenu: [
      { title: 'Admin Dashboard', path: '/admin' },
      { title: 'Audit Logs', path: '/admin/audit-logs' },
      { title: 'Security Dashboard', path: '/admin/security' }
    ]
  };

  // Filter menu items based on user role
  const getMenuItems = () => {
    const items = [...menuItems];

    // Add admin item for admin users
    if (user && user.role === 'admin') {
      items.splice(1, 0, adminMenuItem); // Insert after Dashboard
    }

    return items;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flexGrow: 1, px: 1 }}>
        {getMenuItems().map((item) => (
          <React.Fragment key={item.title}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleClick(item.path, !!item.submenu)}
                sx={{
                  borderRadius: 2,
                  background: isParentActive(item.path) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  color: isParentActive(item.path) ? '#1976d2' : 'inherit',
                  '&:hover': {
                    background: 'rgba(25, 118, 210, 0.08)'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isParentActive(item.path) ? '#1976d2' : 'inherit',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontWeight: isParentActive(item.path) ? 600 : 400,
                    fontSize: '0.875rem'
                  }}
                />
                {item.submenu && (
                  openMenus[item.path] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {item.submenu && (
              <Collapse in={openMenus[item.path]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  {item.submenu.map((subItem) => (
                    <ListItem key={subItem.path} disablePadding sx={{ mb: 0.2 }}>
                      <ListItemButton
                        onClick={() => handleClick(subItem.path)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          background: isActive(subItem.path) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                          color: isActive(subItem.path) ? '#1976d2' : 'inherit',
                          '&:hover': {
                            background: 'rgba(25, 118, 210, 0.08)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={subItem.title}
                          primaryTypographyProps={{
                            fontSize: '0.8125rem',
                            fontWeight: isActive(subItem.path) ? 600 : 400
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}

        {/* Communication Section */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Communication
          </Typography>
        </Box>

        {communicationItems.map((item) => (
          <ListItem key={item.title} disablePadding sx={{ mb: 0.2 }}>
            <ListItemButton
              onClick={item.action}
              sx={{
                borderRadius: 2,
                mx: 1,
                '&:hover': {
                  background: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: '0.875rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Settings at bottom */}
      <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick('/settings')}
            sx={{
              borderRadius: 2,
              background: isActive('/settings') ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
              color: isActive('/settings') ? '#1976d2' : 'inherit',
              '&:hover': {
                background: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive('/settings') ? '#1976d2' : 'inherit',
                minWidth: 40
              }}
            >
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontWeight: isActive('/settings') ? 600 : 400,
                fontSize: '0.875rem'
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );
};

export default Navigation;