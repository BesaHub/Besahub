import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  Refresh,
  History
} from '@mui/icons-material';
import { leadScoringApi } from '../../services/leadScoringApi';

const LeadScoreCard = ({ contactId, contactData, onScoreUpdate }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);

  useEffect(() => {
    if (contactData) {
      calculateScore();
    }
  }, [contactData]);

  const calculateScore = async () => {
    try {
      setLoading(true);
      
      // Calculate score locally for immediate feedback
      const localScore = leadScoringApi.calculateScoreLocally(contactData);
      setScoreData(localScore);

      // Also calculate on server for persistence
      if (contactId) {
        try {
          const serverScore = await leadScoringApi.calculateLeadScore(contactId, contactData);
          setScoreData(serverScore);
        } catch (error) {
          console.warn('Server scoring failed, using local calculation:', error);
        }
      }

      if (onScoreUpdate) {
        onScoreUpdate(localScore);
      }
    } catch (error) {
      console.error('Error calculating lead score:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScoreHistory = async () => {
    if (!contactId) return;
    
    try {
      const history = await leadScoringApi.getScoreHistory(contactId);
      setScoreHistory(history.history || []);
    } catch (error) {
      console.error('Error loading score history:', error);
    }
  };

  const handleHistoryClick = () => {
    loadScoreHistory();
    setHistoryDialog(true);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#f44336'; // Red - Hot
    if (score >= 60) return '#ff9800'; // Orange - Warm
    if (score >= 40) return '#ffeb3b'; // Yellow - Lukewarm
    return '#9e9e9e'; // Grey - Cold
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Hot Lead';
    if (score >= 60) return 'Warm Lead';
    if (score >= 40) return 'Lukewarm Lead';
    return 'Cold Lead';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '🌡️';
    if (score >= 40) return '🌤️';
    return '❄️';
  };

  if (!scoreData) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={100}>
            <Typography color="textSecondary">Calculating lead score...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="div">
              Lead Score
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh Score">
                <IconButton size="small" onClick={calculateScore} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              {contactId && (
                <Tooltip title="Score History">
                  <IconButton size="small" onClick={handleHistoryClick}>
                    <History />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box textAlign="center">
              <Typography variant="h2" component="div" color={getScoreColor(scoreData.totalScore)}>
                {scoreData.totalScore}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                / {scoreData.maxPossibleScore}
              </Typography>
            </Box>
            
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6">
                  {getScoreIcon(scoreData.totalScore)} {getScoreLabel(scoreData.totalScore)}
                </Typography>
                <Chip 
                  label={`${scoreData.scorePercentage}%`}
                  size="small"
                  sx={{ 
                    backgroundColor: getScoreColor(scoreData.totalScore),
                    color: 'white'
                  }}
                />
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={scoreData.scorePercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(scoreData.totalScore),
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Score Breakdown
          </Typography>
          
          <Grid container spacing={1}>
            {Object.entries(scoreData.scoreBreakdown).map(([factor, score]) => (
              <Grid item xs={6} sm={4} key={factor}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    +{score}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {scoreData.totalScore < 40 && (
            <Box mt={2} p={2} bgcolor="#fff3e0" borderRadius={1}>
              <Typography variant="body2" color="warning.main">
                💡 <strong>Tip:</strong> This lead could benefit from more engagement. 
                Consider sending targeted property information or scheduling a call.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Score History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lead Score History</DialogTitle>
        <DialogContent>
          {scoreHistory.length === 0 ? (
            <Typography color="textSecondary">No score history available</Typography>
          ) : (
            <Box>
              {scoreHistory.map((entry, index) => (
                <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" color={getScoreColor(entry.totalScore)}>
                        {entry.totalScore}
                      </Typography>
                      <Chip 
                        label={entry.leadQuality}
                        size="small"
                        sx={{ 
                          backgroundColor: getScoreColor(entry.totalScore),
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Grid container spacing={1}>
                    {Object.entries(entry.scoreBreakdown).map(([factor, score]) => (
                      <Grid item xs={6} sm={4} key={factor}>
                        <Typography variant="body2" color="textSecondary">
                          {factor}: +{score}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeadScoreCard;
