import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 400 }}>
        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>404</Typography>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The page you're looking for doesn't exist.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Home />}
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;