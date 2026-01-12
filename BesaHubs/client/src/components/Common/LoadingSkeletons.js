import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  TableCell,
  TableRow,
  Paper,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <>
      {[...Array(rows)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton variant="text" width="80%" height={24} animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width="90%" height={24} animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width="70%" height={24} animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width="60%" height={24} animation="wave" />
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Skeleton variant="circular" width={32} height={32} animation="wave" />
              <Skeleton variant="circular" width={32} height={32} animation="wave" />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export const CardSkeleton = ({ count = 6 }) => {
  return (
    <Grid container spacing={3}>
      {[...Array(count)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton 
                  variant="circular" 
                  width={48} 
                  height={48} 
                  animation="wave"
                  sx={{ mr: 2 }} 
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton 
                    variant="text" 
                    width="70%" 
                    height={28} 
                    animation="wave"
                    sx={{ mb: 0.5 }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="50%" 
                    height={20} 
                    animation="wave" 
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Skeleton 
                  variant="text" 
                  width="100%" 
                  height={20} 
                  animation="wave"
                  sx={{ mb: 1 }} 
                />
                <Skeleton 
                  variant="text" 
                  width="90%" 
                  height={20} 
                  animation="wave"
                  sx={{ mb: 1 }} 
                />
                <Skeleton 
                  variant="text" 
                  width="80%" 
                  height={20} 
                  animation="wave" 
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton 
                  variant="rounded" 
                  width={80} 
                  height={28} 
                  animation="wave"
                  sx={{ borderRadius: 2 }} 
                />
                <Skeleton 
                  variant="rounded" 
                  width={70} 
                  height={28} 
                  animation="wave"
                  sx={{ borderRadius: 2 }} 
                />
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 1.5, 
                  pt: 2, 
                  mt: 2,
                  borderTop: 1, 
                  borderColor: 'divider' 
                }}
              >
                <Skeleton 
                  variant="rounded" 
                  width="48%" 
                  height={40} 
                  animation="wave"
                  sx={{ borderRadius: 2.5 }} 
                />
                <Skeleton 
                  variant="rounded" 
                  width="48%" 
                  height={40} 
                  animation="wave"
                  sx={{ borderRadius: 2.5 }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export const ListSkeleton = ({ count = 8 }) => {
  return (
    <Paper 
      sx={{ 
        borderRadius: 3,
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        overflow: 'hidden'
      }}
    >
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          <ListItem 
            sx={{ 
              py: 2,
              px: 3,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            <ListItemAvatar>
              <Skeleton 
                variant="circular" 
                width={48} 
                height={48} 
                animation="wave" 
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Skeleton 
                  variant="text" 
                  width="60%" 
                  height={24} 
                  animation="wave"
                  sx={{ mb: 0.5 }} 
                />
              }
              secondary={
                <Box>
                  <Skeleton 
                    variant="text" 
                    width="80%" 
                    height={20} 
                    animation="wave"
                    sx={{ mb: 0.5 }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="40%" 
                    height={16} 
                    animation="wave" 
                  />
                </Box>
              }
            />
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              <Skeleton 
                variant="rounded" 
                width={80} 
                height={32} 
                animation="wave"
                sx={{ borderRadius: 2 }} 
              />
              <Skeleton 
                variant="circular" 
                width={32} 
                height={32} 
                animation="wave" 
              />
            </Box>
          </ListItem>
          {index < count - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Paper>
  );
};
