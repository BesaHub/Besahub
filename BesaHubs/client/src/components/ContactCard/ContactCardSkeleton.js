import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Skeleton
} from '@mui/material';

const ContactCardSkeleton = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="50%" height={20} />
            <Skeleton variant="text" width="60%" height={16} sx={{ mt: 1 }} />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="70%" height={20} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={70} height={24} />
        </Box>

        <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="rounded" width="100%" height={32} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContactCardSkeleton;
