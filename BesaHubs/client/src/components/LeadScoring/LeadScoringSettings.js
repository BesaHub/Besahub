import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Save,
  Refresh,
  Info,
  TrendingUp
} from '@mui/icons-material';
import { leadScoringApi } from '../../services/leadScoringApi';

const LeadScoringSettings = () => {
  const [scoringRules, setScoringRules] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadScoringRules();
  }, []);

  const loadScoringRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leadScoringApi.getScoringRules();
      setScoringRules(response.rules || {});
    } catch (error) {
      console.error('Error loading scoring rules:', error);
      setError('Failed to load scoring rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await leadScoringApi.updateScoringRules(scoringRules);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving scoring rules:', error);
      setError('Failed to save scoring rules');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (category, key, value) => {
    setScoringRules(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: parseInt(value) || 0
      }
    }));
  };

  const renderScoringCategory = (category, title, description) => {
    const rules = scoringRules[category] || {};
    
    return (
      <Accordion key={category}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp color="primary" />
            <Typography variant="h6">{title}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" mb={2}>
            {description}
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(rules).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  fullWidth
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  type="number"
                  value={value}
                  onChange={(e) => updateRule(category, key, e.target.value)}
                  size="small"
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Lead Scoring Rules
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Configure how leads are scored based on various factors. Higher scores indicate better quality leads.
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Rules">
              <IconButton onClick={loadScoringRules} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Rules'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Scoring rules saved successfully!
          </Alert>
        )}

        <Box mb={3}>
          <Alert severity="info" icon={<Info />}>
            <Typography variant="body2">
              <strong>Lead Quality Thresholds:</strong><br />
              • Hot Lead: 80+ points<br />
              • Warm Lead: 60-79 points<br />
              • Lukewarm Lead: 40-59 points<br />
              • Cold Lead: 0-39 points
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading scoring rules...</Typography>
          </Box>
        ) : (
          <Box>
            {renderScoringCategory(
              'companySize',
              'Company Size',
              'Score based on the size of the company. Larger companies typically have bigger budgets.'
            )}
            
            {renderScoringCategory(
              'budgetRange',
              'Budget Range',
              'Score based on the budget range. Higher budgets indicate more serious buyers.'
            )}
            
            {renderScoringCategory(
              'emailOpens',
              'Email Engagement',
              'Score based on email open rates. Higher engagement indicates more interest.'
            )}
            
            {renderScoringCategory(
              'websiteVisits',
              'Website Visits',
              'Score based on website visit frequency. More visits indicate higher interest.'
            )}
            
            {renderScoringCategory(
              'propertyTypeInterest',
              'Property Type Interest',
              'Score based on property types of interest. Some types may be more valuable.'
            )}
            
            {renderScoringCategory(
              'timeframe',
              'Timeline',
              'Score based on urgency of timeline. Immediate needs score higher.'
            )}
            
            {renderScoringCategory(
              'leadSource',
              'Lead Source',
              'Score based on how the lead was acquired. Referrals typically score higher.'
            )}
            
            {renderScoringCategory(
              'contactRole',
              'Contact Role',
              'Score based on the contact\'s role in the decision-making process.'
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadScoringSettings;
