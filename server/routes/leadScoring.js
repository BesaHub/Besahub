const express = require('express');
const router = express.Router();

// Mock lead scoring rules (in production, this would come from database)
let scoringRules = {
  companySize: {
    '1-10': 5,
    '11-50': 10,
    '51-200': 15,
    '201-1000': 20,
    '1000+': 25
  },
  budgetRange: {
    'under_100k': 5,
    '100k_500k': 10,
    '500k_1m': 15,
    '1m_5m': 20,
    '5m_10m': 25,
    '10m_plus': 30
  },
  emailOpens: {
    '0': 0,
    '1-3': 5,
    '4-10': 10,
    '11-25': 15,
    '25+': 20
  },
  websiteVisits: {
    '0': 0,
    '1-2': 5,
    '3-5': 10,
    '6-10': 15,
    '10+': 20
  },
  propertyTypeInterest: {
    'office': 10,
    'retail': 8,
    'industrial': 12,
    'warehouse': 10,
    'multifamily': 15,
    'hotel': 8,
    'mixed_use': 12,
    'land': 5
  },
  timeframe: {
    'immediate': 25,
    '30_days': 20,
    '90_days': 15,
    '6_months': 10,
    '1_year': 5,
    'flexible': 8
  },
  leadSource: {
    'referral': 20,
    'website': 15,
    'social_media': 10,
    'cold_call': 5,
    'email_campaign': 12,
    'event': 15,
    'advertising': 8,
    'other': 5
  },
  contactRole: {
    'decision_maker': 25,
    'influencer': 15,
    'user': 10,
    'gatekeeper': 5,
    'champion': 20
  }
};

// Mock score history storage
const scoreHistory = {};

// Calculate lead score
const calculateLeadScore = (contactData, rules) => {
  let totalScore = 0;
  const scoreBreakdown = {};

  // Company size scoring
  if (contactData.companySize && rules.companySize) {
    const companyScore = rules.companySize[contactData.companySize] || 0;
    totalScore += companyScore;
    scoreBreakdown.companySize = companyScore;
  }

  // Budget scoring
  if (contactData.budgetRange && rules.budgetRange) {
    const budgetScore = rules.budgetRange[contactData.budgetRange] || 0;
    totalScore += budgetScore;
    scoreBreakdown.budgetRange = budgetScore;
  }

  // Email engagement scoring
  if (contactData.emailOpens && rules.emailOpens) {
    const emailScore = rules.emailOpens[contactData.emailOpens] || 0;
    totalScore += emailScore;
    scoreBreakdown.emailOpens = emailScore;
  }

  // Website visits scoring
  if (contactData.websiteVisits && rules.websiteVisits) {
    const websiteScore = rules.websiteVisits[contactData.websiteVisits] || 0;
    totalScore += websiteScore;
    scoreBreakdown.websiteVisits = websiteScore;
  }

  // Property type interest scoring
  if (contactData.propertyTypeInterest && rules.propertyTypeInterest) {
    let propertyScore = 0;
    contactData.propertyTypeInterest.forEach(type => {
      propertyScore += rules.propertyTypeInterest[type] || 0;
    });
    totalScore += propertyScore;
    scoreBreakdown.propertyTypeInterest = propertyScore;
  }

  // Timeline scoring
  if (contactData.timeframe && rules.timeframe) {
    const timelineScore = rules.timeframe[contactData.timeframe] || 0;
    totalScore += timelineScore;
    scoreBreakdown.timeframe = timelineScore;
  }

  // Lead source scoring
  if (contactData.leadSource && rules.leadSource) {
    const sourceScore = rules.leadSource[contactData.leadSource] || 0;
    totalScore += sourceScore;
    scoreBreakdown.leadSource = sourceScore;
  }

  // Contact role scoring
  if (contactData.contactRole && rules.contactRole) {
    const roleScore = rules.contactRole[contactData.contactRole] || 0;
    totalScore += roleScore;
    scoreBreakdown.contactRole = roleScore;
  }

  // Determine lead quality
  let leadQuality = 'cold';
  if (totalScore >= 80) leadQuality = 'hot';
  else if (totalScore >= 60) leadQuality = 'warm';
  else if (totalScore >= 40) leadQuality = 'lukewarm';

  return {
    totalScore,
    leadQuality,
    scoreBreakdown,
    maxPossibleScore: 150,
    scorePercentage: Math.round((totalScore / 150) * 100)
  };
};

// POST /contacts/:id/score - Calculate lead score for a contact
router.post('/contacts/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { contactData } = req.body;

    // Mock contact data if not provided
    const mockContactData = contactData || {
      companySize: '51-200',
      budgetRange: '1m_5m',
      emailOpens: '4-10',
      websiteVisits: '3-5',
      propertyTypeInterest: ['office', 'industrial'],
      timeframe: '90_days',
      leadSource: 'website',
      contactRole: 'decision_maker'
    };

    const scoreResult = calculateLeadScore(mockContactData, scoringRules);

    // Store score history
    if (!scoreHistory[id]) {
      scoreHistory[id] = [];
    }
    
    scoreHistory[id].push({
      ...scoreResult,
      timestamp: new Date().toISOString(),
      contactData: mockContactData
    });

    res.json({
      success: true,
      contactId: id,
      ...scoreResult
    });
  } catch (error) {
    console.error('Error calculating lead score:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /rules - Get scoring rules
router.get('/rules', async (req, res) => {
  try {
    res.json({
      success: true,
      rules: scoringRules
    });
  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /rules - Update scoring rules
router.put('/rules', async (req, res) => {
  try {
    const { rules } = req.body;
    scoringRules = { ...scoringRules, ...rules };

    res.json({
      success: true,
      message: 'Scoring rules updated successfully',
      rules: scoringRules
    });
  } catch (error) {
    console.error('Error updating scoring rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /contacts/:id/score-history - Get score history for a contact
router.get('/contacts/:id/score-history', async (req, res) => {
  try {
    const { id } = req.params;
    const history = scoreHistory[id] || [];

    res.json({
      success: true,
      contactId: id,
      history: history.reverse() // Most recent first
    });
  } catch (error) {
    console.error('Error fetching score history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /contacts/bulk-score - Bulk score multiple contacts
router.post('/contacts/bulk-score', async (req, res) => {
  try {
    const { contactIds } = req.body;
    const results = [];

    for (const id of contactIds) {
      // Mock contact data for bulk scoring
      const mockContactData = {
        companySize: '51-200',
        budgetRange: '1m_5m',
        emailOpens: '4-10',
        websiteVisits: '3-5',
        propertyTypeInterest: ['office'],
        timeframe: '90_days',
        leadSource: 'website',
        contactRole: 'decision_maker'
      };

      const scoreResult = calculateLeadScore(mockContactData, scoringRules);
      results.push({
        contactId: id,
        ...scoreResult
      });
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error bulk scoring contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /analytics - Get scoring analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Mock analytics data
    const analytics = {
      totalContacts: 1250,
      averageScore: 65,
      scoreDistribution: {
        hot: 150,
        warm: 300,
        lukewarm: 400,
        cold: 400
      },
      topScoringFactors: [
        { factor: 'budgetRange', averageScore: 18.5 },
        { factor: 'timeframe', averageScore: 15.2 },
        { factor: 'contactRole', averageScore: 12.8 },
        { factor: 'propertyTypeInterest', averageScore: 11.5 },
        { factor: 'leadSource', averageScore: 10.2 }
      ],
      scoreTrends: [
        { date: '2024-01-01', averageScore: 62 },
        { date: '2024-01-02', averageScore: 64 },
        { date: '2024-01-03', averageScore: 63 },
        { date: '2024-01-04', averageScore: 66 },
        { date: '2024-01-05', averageScore: 68 }
      ]
    };

    res.json({
      success: true,
      timeframe,
      ...analytics
    });
  } catch (error) {
    console.error('Error fetching scoring analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
