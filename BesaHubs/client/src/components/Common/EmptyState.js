import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  message, 
  actionLabel, 
  onAction 
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: '300px', sm: '400px', md: '500px' },
        padding: theme.spacing(4),
        textAlign: 'center',
        animation: 'fadeIn 0.6s ease-out',
        '@keyframes fadeIn': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          mb: theme.spacing(4),
          animation: 'scaleIn 0.5s ease-out',
          animationDelay: '0.2s',
          animationFillMode: 'both',
          '@keyframes scaleIn': {
            from: {
              transform: 'scale(0.8)',
              opacity: 0,
            },
            to: {
              transform: 'scale(1)',
              opacity: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            width: { xs: 80, sm: 100, md: 120 },
            height: { xs: 80, sm: 100, md: 120 },
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: theme.palette.gradient.primary,
              borderRadius: '50%',
              zIndex: -1,
              opacity: 0.2,
            },
          }}
        >
          {Icon && (
            <Box
              sx={{
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon 
                sx={{ 
                  fontSize: { xs: 40, sm: 50, md: 60 },
                  opacity: 1,
                  filter: 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.2))',
                }} 
              />
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          maxWidth: { xs: '100%', sm: 500, md: 600 },
          mb: theme.spacing(2),
          animation: 'fadeInUp 0.6s ease-out',
          animationDelay: '0.3s',
          animationFillMode: 'both',
          '@keyframes fadeInUp': {
            from: {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: theme.spacing(2),
            background: theme.palette.gradient.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            lineHeight: 1.6,
            px: { xs: 2, sm: 0 },
          }}
        >
          {message}
        </Typography>
      </Box>

      {actionLabel && onAction && (
        <Box
          sx={{
            animation: 'fadeInUp 0.6s ease-out',
            animationDelay: '0.4s',
            animationFillMode: 'both',
          }}
        >
          <Button
            variant="contained"
            onClick={onAction}
            sx={{
              background: theme.palette.gradient.primary,
              color: 'white',
              padding: { xs: '10px 24px', sm: '12px 32px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 600,
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
              },
            }}
          >
            {actionLabel}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;
