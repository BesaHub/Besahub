import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Extension as IntegrationIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Settings = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Integrations',
      description: 'Manage third-party integrations and API connections',
      icon: <IntegrationIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      path: '/settings/integrations'
    },
    {
      title: 'Security & MFA',
      description: 'Multi-factor authentication and security settings',
      icon: <SecurityIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      path: '/settings/mfa'
    },
    {
      title: 'Notifications',
      description: 'Configure email and push notification preferences',
      icon: <NotificationsIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      path: '/notifications'
    },
    {
      title: 'Profile',
      description: 'Update your personal information and preferences',
      icon: <PersonIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      path: '/profile'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>
      <Grid container spacing={3}>
        {settingsSections.map((section) => (
          <Grid item xs={12} sm={6} md={3} key={section.title}>
            <Card>
              <CardActionArea onClick={() => navigate(section.path)}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  {section.icon}
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Settings;