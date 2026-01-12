import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid
} from '@mui/material';

// Primary loading spinner for full-page loads
export const LoadingSpinner = ({ message = 'Loading...', size = 40, fullscreen = false }) => {
  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
        width: '100%'
      }}
    >
      {content}
    </Box>
  );
};

// Skeleton loaders for different content types
export const PropertyCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={24} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={100} />
      </Box>
    </CardContent>
  </Card>
);

export const ContactCardSkeleton = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" height={24} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" height={20} width={120} />
        </Box>
      </Box>
      <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={20} width={150} />
    </CardContent>
  </Card>
);

export const DealCardSkeleton = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="text" height={28} width={200} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
      <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton variant="text" width={100} />
        <Skeleton variant="text" width={80} />
      </Box>
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', py: 2, borderBottom: '1px solid #e0e0e0' }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Box key={colIndex} sx={{ flex: 1, mr: colIndex < columns - 1 ? 2 : 0 }}>
            <Skeleton 
              variant="text" 
              height={20} 
              width={colIndex === 0 ? '80%' : colIndex === columns - 1 ? '60%' : '100%'} 
            />
          </Box>
        ))}
      </Box>
    ))}
  </Box>
);

export const DashboardSkeleton = () => (
  <Box>
    {/* Header skeleton */}
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" height={40} width={300} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={24} width={500} />
    </Box>

    {/* Stats cards skeleton */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                <Skeleton variant="text" width={80} />
              </Box>
              <Skeleton variant="text" height={36} width={60} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width={100} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Content skeleton */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={28} width={200} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={28} width={150} sx={{ mb: 3 }} />
            {Array.from({ length: 6 }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" height={16} width={80} />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

// Higher-order component for lazy loading with suspense
export const withLazyLoading = (Component, fallback = <LoadingSpinner />) => {
  return React.forwardRef((props, ref) => (
    <React.Suspense fallback={fallback}>
      <Component {...props} ref={ref} />
    </React.Suspense>
  ));
};

// Hook for managing loading states
export const useAsyncOperation = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const execute = React.useCallback(async (asyncOperation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncOperation();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};