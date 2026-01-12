import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Handshake as HandshakeIcon,
  Assignment as TaskIcon,
  Assessment as ReportsIcon,
  Psychology as AIIcon,
  ExpandMore as ArrowDropDownIcon,
  Receipt as LeaseIcon,
  TrendingUp as MarketIcon,
  Groups as TenantsIcon,
  Event as CalendarIcon,
  Calculate as FinancialIcon,
  Search as ProspectingIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreHoriz as MoreIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';

const HorizontalNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEls, setAnchorEls] = useState({});

  const handleMenuClick = (event, menuKey) => {
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

  const handleNavigation = (path, menuKey) => {
    navigate(path);
    if (menuKey) {
      handleMenuClose(menuKey);
    }
  };

  const isActiveRoute = (paths) => {
    const currentPath = location.pathname;
    return Array.isArray(paths) ?
      paths.some(path => currentPath.startsWith(path)) :
      currentPath.startsWith(paths);
  };

  // MVP Core navigation items - 8 essential CRM features
  const coreMenuItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      key: 'dashboard',
      routes: ['/dashboard']
    },
    {
      label: 'Properties',
      icon: <HomeIcon />,
      key: 'properties',
      routes: ['/properties'],
      submenu: [
        { title: 'All Properties', path: '/properties' },
        { title: 'Add Property', path: '/properties/new' }
      ]
    },
    {
      label: 'Contacts',
      icon: <PeopleIcon />,
      key: 'contacts',
      routes: ['/contacts'],
      submenu: [
        { title: 'All Contacts', path: '/contacts' },
        { title: 'Add Contact', path: '/contacts/new' }
      ]
    },
    {
      label: 'Companies',
      icon: <BusinessIcon />,
      key: 'companies',
      routes: ['/companies'],
      submenu: [
        { title: 'All Companies', path: '/companies' },
        { title: 'Add Company', path: '/companies/new' }
      ]
    },
    {
      label: 'Deals',
      icon: <HandshakeIcon />,
      key: 'deals',
      routes: ['/deals', '/pipeline'],
      submenu: [
        { title: 'All Deals', path: '/deals' },
        { title: 'Add Deal', path: '/deals/new' },
        { title: 'Pipeline View', path: '/pipeline' }
      ]
    },
    {
      label: 'Tasks',
      icon: <TaskIcon />,
      key: 'tasks',
      routes: ['/tasks'],
      submenu: [
        { title: 'My Tasks', path: '/tasks' },
        { title: 'Add Task', path: '/tasks/new' }
      ]
    },
    {
      label: 'Agents',
      icon: <TenantsIcon />,
      path: '/agents',
      key: 'agents',
      routes: ['/agents']
    },
    {
      label: 'Campaigns',
      icon: <CampaignIcon />,
      path: '/campaigns',
      key: 'campaigns',
      routes: ['/campaigns']
    },
    {
      label: 'Calendar',
      icon: <CalendarIcon />,
      path: '/calendar',
      key: 'calendar',
      routes: ['/calendar']
    },
    {
      label: 'Dashboards',
      icon: <DashboardIcon />,
      path: '/dashboards',
      key: 'dashboards',
      routes: ['/dashboards']
    }
  ];

  // No secondary items - MVP focuses on core features only
  const otherMenuItems = [];

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        p: 2,
        backgroundColor: '#f8f9fa'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        {/* Core Navigation Items */}
        {coreMenuItems.map((item) => (
          <Button
            key={item.key}
            startIcon={item.icon}
            endIcon={item.submenu ? <ArrowDropDownIcon /> : null}
            variant={isActiveRoute(item.routes) ? 'contained' : 'outlined'}
            size="medium"
            onClick={(e) => {
              if (item.submenu) {
                handleMenuClick(e, item.key);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 'auto',
              px: 2,
              py: 1,
              '&.MuiButton-contained': {
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              },
              '&.MuiButton-outlined': {
                borderColor: 'rgba(25, 118, 210, 0.3)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  borderColor: '#1976d2'
                }
              }
            }}
          >
            {item.label}
          </Button>
        ))}

        {/* Others Dropdown */}
        <Button
          startIcon={<MoreIcon />}
          endIcon={<ArrowDropDownIcon />}
          variant={isActiveRoute(otherMenuItems.flatMap(item => item.routes)) ? 'contained' : 'outlined'}
          size="medium"
          onClick={(e) => handleMenuClick(e, 'others')}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 'auto',
            px: 2,
            py: 1,
            '&.MuiButton-contained': {
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            },
            '&.MuiButton-outlined': {
              borderColor: 'rgba(25, 118, 210, 0.3)',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                borderColor: '#1976d2'
              }
            }
          }}
        >
          Others
        </Button>
      </Box>

      {/* Core Item Submenus */}
      {coreMenuItems.map((item) =>
        item.submenu && (
          <Menu
            key={item.key}
            anchorEl={anchorEls[item.key]}
            open={Boolean(anchorEls[item.key])}
            onClose={() => handleMenuClose(item.key)}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                minWidth: 200,
                mt: 0.5,
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            {item.submenu.map((subItem) => (
              <MenuItem
                key={subItem.path}
                onClick={() => handleNavigation(subItem.path, item.key)}
                sx={{
                  fontSize: '0.875rem',
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                {subItem.title}
              </MenuItem>
            ))}
          </Menu>
        )
      )}

      {/* Others Menu */}
      <Menu
        anchorEl={anchorEls['others']}
        open={Boolean(anchorEls['others'])}
        onClose={() => handleMenuClose('others')}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 250,
            mt: 0.5,
            maxHeight: 400,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        {otherMenuItems.map((item) => [
          <MenuItem
            key={item.key}
            onClick={(e) => {
              if (item.submenu) {
                handleMenuClick(e, item.key);
              }
            }}
            sx={{
              fontSize: '0.875rem',
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.icon}
              {item.label}
            </Box>
            {item.submenu && <ArrowDropDownIcon />}
          </MenuItem>,
          item.submenu && anchorEls[item.key] && (
            <Menu
              key={`${item.key}-submenu`}
              anchorEl={anchorEls[item.key]}
              open={Boolean(anchorEls[item.key])}
              onClose={() => handleMenuClose(item.key)}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
              PaperProps={{
                sx: {
                  minWidth: 200,
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              {item.submenu.map((subItem) => (
                <MenuItem
                  key={subItem.path}
                  onClick={() => {
                    handleNavigation(subItem.path, item.key);
                    handleMenuClose('others');
                  }}
                  sx={{
                    fontSize: '0.875rem',
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  {subItem.title}
                </MenuItem>
              ))}
            </Menu>
          )
        ])}
      </Menu>
    </Box>
  );
};

export default HorizontalNavigation;