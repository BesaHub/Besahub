import { apiService } from './api';

const LEAD_SCORING_ENDPOINTS = {
  SCORE_CONTACT: '/api/contacts/:id/score',
  GET_SCORING_RULES: '/api/lead-scoring/rules',
  UPDATE_SCORING_RULES: '/api/lead-scoring/rules',
  GET_SCORE_HISTORY: '/api/contacts/:id/score-history',
  BULK_SCORE: '/api/contacts/bulk-score',
  SCORING_ANALYTICS: '/api/lead-scoring/analytics'
};

// Default scoring rules for commercial real estate
const DEFAULT_SCORING_RULES = {
  // Demographic scoring
  companySize: {
    '1-10': 5,
    '11-50': 10,
    '51-200': 15,
    '201-1000': 20,
    '1000+': 25
  },
  
  // Budget scoring
  budgetRange: {
    'under_100k': 5,
    '100k_500k': 10,
    '500k_1m': 15,
    '1m_5m': 20,
    '5m_10m': 25,
    '10m_plus': 30
  },
  
  // Engagement scoring
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
  
  // Property interest scoring
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
  
  // Timeline scoring
  timeframe: {
    'immediate': 25,
    '30_days': 20,
    '90_days': 15,
    '6_months': 10,
    '1_year': 5,
    'flexible': 8
  },
  
  // Lead source scoring
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
  
  // Contact role scoring
  contactRole: {
    'decision_maker': 25,
    'influencer': 15,
    'user': 10,
    'gatekeeper': 5,
    'champion': 20
  }
};

class LeadScoringService {
  // Calculate lead score for a contact
  async calculateLeadScore(contactId, contactData = null) {
    try {
      const response = await apiService.post(
        LEAD_SCORING_ENDPOINTS.SCORE_CONTACT.replace(':id', contactId),
        { contactData }
      );
      return response.data;
    } catch (error) {
      console.error('Error calculating lead score:', error);
      throw error;
    }
  }

  // Get scoring rules
  async getScoringRules() {
    try {
      const response = await apiService.get(LEAD_SCORING_ENDPOINTS.GET_SCORING_RULES);
      return response.data;
    } catch (error) {
      console.error('Error fetching scoring rules:', error);
      // Return default rules if API fails
      return { rules: DEFAULT_SCORING_RULES };
    }
  }

  // Update scoring rules
  async updateScoringRules(rules) {
    try {
      const response = await apiService.put(
        LEAD_SCORING_ENDPOINTS.UPDATE_SCORING_RULES,
        { rules }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating scoring rules:', error);
      throw error;
    }
  }

  // Get score history for a contact
  async getScoreHistory(contactId) {
    try {
      const response = await apiService.get(
        LEAD_SCORING_ENDPOINTS.GET_SCORE_HISTORY.replace(':id', contactId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching score history:', error);
      throw error;
    }
  }

  // Bulk score multiple contacts
  async bulkScoreContacts(contactIds) {
    try {
      const response = await apiService.post(
        LEAD_SCORING_ENDPOINTS.BULK_SCORE,
        { contactIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk scoring contacts:', error);
      throw error;
    }
  }

  // Get scoring analytics
  async getScoringAnalytics(timeframe = '30d') {
    try {
      const response = await apiService.get(
        `${LEAD_SCORING_ENDPOINTS.SCORING_ANALYTICS}?timeframe=${timeframe}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching scoring analytics:', error);
      throw error;
    }
  }

  // Calculate score locally (for immediate feedback)
  calculateScoreLocally(contactData, rules = DEFAULT_SCORING_RULES) {
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
      maxPossibleScore: 150, // Sum of all max scores
      scorePercentage: Math.round((totalScore / 150) * 100)
    };
  }

  // Get lead quality color
  getLeadQualityColor(quality) {
    const colors = {
      'hot': '#f44336',      // Red
      'warm': '#ff9800',     // Orange
      'lukewarm': '#ffeb3b', // Yellow
      'cold': '#9e9e9e'      // Grey
    };
    return colors[quality] || colors.cold;
  }

  // Get lead quality icon
  getLeadQualityIcon(quality) {
    const icons = {
      'hot': '🔥',
      'warm': '🌡️',
      'lukewarm': '🌤️',
      'cold': '❄️'
    };
    return icons[quality] || icons.cold;
  }
}

export const leadScoringApi = new LeadScoringService();
export { DEFAULT_SCORING_RULES };
