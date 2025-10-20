import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardHeader,
  Button, IconButton, Chip, Avatar, List, ListItem, ListItemText,
  ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel, Alert, CircularProgress,
  Tabs, Tab, Divider, Tooltip, Badge, LinearProgress, Accordion,
  AccordionSummary, AccordionDetails, Rating, Slider
} from '@mui/material';
import {
  AutoAwesome, Email, Psychology, TrendingUp, Insights, SmartToy,
  ContentCopy, Send, Refresh, ThumbUp, ThumbDown, Edit, Visibility,
  VisibilityOff, Lightbulb, Assessment, Speed, CheckCircle, Warning,
  Error, Info, Star, StarBorder, ExpandMore, FilterList, Sort
} from '@mui/icons-material';
import aiAssistantApi from '../../services/aiAssistantApi';

const AIEmailAssistant = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [writingTips, setWritingTips] = useState([]);
  const [contactContext, setContactContext] = useState({
    contactId: 'contact_123',
    propertyId: 'property_456',
    context: 'property_inquiry'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [templatesResponse, tipsResponse] = await Promise.all([
        aiAssistantApi.getAITemplates(),
        aiAssistantApi.getWritingTips('commercial_real_estate')
      ]);
      
      setTemplates(templatesResponse.data);
      setWritingTips(tipsResponse.data.tips);
    } catch (err) {
      setError('Failed to load AI assistant data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generateSuggestions = async (type = 'property_inquiry') => {
    try {
      setLoading(true);
      const response = await aiAssistantApi.getEmailSuggestions({
        ...contactContext,
        type
      });
      setSuggestions(response.data.suggestions);
    } catch (err) {
      setError('Failed to generate suggestions');
      console.error('Error generating suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async (template, variables) => {
    try {
      setLoading(true);
      const response = await aiAssistantApi.generateEmail(template, variables);
      setGeneratedEmail(response.data);
      setOpenDialog(true);
    } catch (err) {
      setError('Failed to generate email');
      console.error('Error generating email:', err);
    } finally {
      setLoading(false);
    }
  };

  const optimizeEmail = async (subject, body) => {
    try {
      setLoading(true);
      const response = await aiAssistantApi.optimizeEmail(
        subject,
        body,
        'commercial_real_estate_investors',
        'generate_interest'
      );
      setOptimizationResult(response.data);
    } catch (err) {
      setError('Failed to optimize email');
      console.error('Error optimizing email:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async (content) => {
    try {
      setLoading(true);
      const response = await aiAssistantApi.analyzeSentiment(content);
      setSentimentAnalysis(response.data);
    } catch (err) {
      setError('Failed to analyze sentiment');
      console.error('Error analyzing sentiment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.9) return <CheckCircle />;
    if (confidence >= 0.7) return <Warning />;
    return <Error />;
  };

  const tabPanels = [
    {
      label: 'AI Suggestions',
      component: (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() => generateSuggestions('property_inquiry')}
              disabled={loading}
            >
              Generate Property Inquiry
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => generateSuggestions('follow_up')}
              disabled={loading}
            >
              Generate Follow-up
            </Button>
            <Button
              variant="outlined"
              startIcon={<TrendingUp />}
              onClick={() => generateSuggestions('investment_proposal')}
              disabled={loading}
            >
              Generate Investment Proposal
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={2}>
            {suggestions.map((suggestion) => (
              <Grid item xs={12} md={6} key={suggestion.id}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: getConfidenceColor(suggestion.confidence) + '.main' }}>
                        {getConfidenceIcon(suggestion.confidence)}
                      </Avatar>
                    }
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{suggestion.subject}</Typography>
                        <Chip
                          label={`${Math.round(suggestion.confidence * 100)}%`}
                          color={getConfidenceColor(suggestion.confidence)}
                          size="small"
                        />
                      </Box>
                    }
                    subheader={suggestion.preview}
                    action={
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => generateEmail(suggestion.template, suggestion.variables)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton size="small">
                          <ContentCopy />
                        </IconButton>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {suggestion.template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.keys(suggestion.variables).slice(0, 3).map((key) => (
                        <Chip
                          key={key}
                          label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {Object.keys(suggestion.variables).length > 3 && (
                        <Chip
                          label={`+${Object.keys(suggestion.variables).length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )
    },
    {
      label: 'Email Optimizer',
      component: (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Original Email
                </Typography>
                <TextField
                  fullWidth
                  label="Subject"
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                  placeholder="Enter your email subject..."
                />
                <TextField
                  fullWidth
                  label="Email Body"
                  multiline
                  rows={8}
                  placeholder="Enter your email content..."
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={() => {
                      const subject = document.querySelector('input[placeholder*="subject"]')?.value || '';
                      const body = document.querySelector('textarea[placeholder*="content"]')?.value || '';
                      if (subject && body) {
                        optimizeEmail(subject, body);
                      }
                    }}
                    disabled={loading}
                  >
                    Optimize Email
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Psychology />}
                    onClick={() => {
                      const content = document.querySelector('textarea[placeholder*="content"]')?.value || '';
                      if (content) {
                        analyzeSentiment(content);
                      }
                    }}
                    disabled={loading}
                  >
                    Analyze Sentiment
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  AI Optimizations
                </Typography>
                {optimizationResult ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Subject Optimization
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Original: {optimizationResult.subject.original}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Optimized: {optimizationResult.subject.optimized}
                      </Typography>
                      <Chip
                        label={optimizationResult.subject.improvement}
                        color="success"
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Overall Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={optimizationResult.score.after * 10}
                          sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="body2">
                          {optimizationResult.score.after}/10
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="success.main">
                        {optimizationResult.score.improvement} improvement
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Suggestions
                      </Typography>
                      {optimizationResult.suggestions.map((suggestion, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {suggestion}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Enter your email content and click "Optimize Email" to see AI suggestions.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )
    },
    {
      label: 'Writing Tips',
      component: (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  AI-Powered Writing Tips
                </Typography>
                <List>
                  {writingTips.map((tip, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Lightbulb color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sentiment Analysis
                </Typography>
                {sentimentAnalysis ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Overall Sentiment
                      </Typography>
                      <Chip
                        label={sentimentAnalysis.overallSentiment}
                        color={sentimentAnalysis.overallSentiment === 'Positive' ? 'success' : 'warning'}
                        icon={<ThumbUp />}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Confidence: {Math.round(sentimentAnalysis.confidence * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={sentimentAnalysis.confidence * 100}
                        color="primary"
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Emotions
                      </Typography>
                      {Object.entries(sentimentAnalysis.emotions).map(([emotion, value]) => (
                        <Box key={emotion} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {emotion}
                          </Typography>
                          <Typography variant="body2">
                            {Math.round(value * 100)}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Analyze your email content to see sentiment insights.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )
    }
  ];

  if (loading && suggestions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
          <SmartToy />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            AI Email Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Powered by artificial intelligence to help you write better emails
          </Typography>
        </Box>
      </Box>

      <Paper elevation={1}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabPanels.map((panel, index) => (
            <Tab key={index} label={panel.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabPanels[activeTab].component}
        </Box>
      </Paper>

      {/* Generated Email Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            AI Generated Email
          </Box>
        </DialogTitle>
        <DialogContent>
          {generatedEmail && (
            <Box>
              <TextField
                fullWidth
                label="Subject"
                value={generatedEmail.subject}
                sx={{ mb: 2 }}
                InputProps={{
                  readOnly: true
                }}
              />
              <TextField
                fullWidth
                label="Email Body"
                multiline
                rows={12}
                value={generatedEmail.body}
                InputProps={{
                  readOnly: true
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip
                  label={`Confidence: ${Math.round(generatedEmail.confidence * 100)}%`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`Template: ${generatedEmail.template}`}
                  color="info"
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Send />}>
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIEmailAssistant;
