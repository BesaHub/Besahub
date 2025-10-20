import React from 'react';
import { Box, Skeleton, Paper } from '@mui/material';

export const ChartSkeleton = ({ height = 300 }) => (
  <Paper elevation={2} sx={{ p: 2, height: height + 60 }}>
    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={height} />
  </Paper>
);

export const KPISkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Skeleton variant="text" width="40%" height={24} />
    <Skeleton variant="rectangular" width="100%" height={120} />
    <Skeleton variant="text" width="60%" height={20} />
  </Box>
);

export const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Skeleton variant="rectangular" width={200} height={40} />
      <Skeleton variant="rectangular" width={150} height={40} />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <ChartSkeleton key={i} height={250} />
      ))}
    </Box>
  </Box>
);

export const ReportSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="25%" height={40} sx={{ mb: 3 }} />
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
      {[1, 2, 3].map((i) => (
        <Paper key={i} elevation={2} sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={100} />
        </Paper>
      ))}
    </Box>
  </Box>
);
