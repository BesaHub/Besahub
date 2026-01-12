// AI Assistant API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class AIAssistantApi {
  // Get AI email suggestions
  async getEmailSuggestions(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/ai/email/suggestions?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Generate AI email content
  async generateEmail(template, variables, customInstructions = '') {
    const response = await fetch(`${API_BASE_URL}/ai/email/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template,
        variables,
        customInstructions
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get AI lead scoring insights
  async getLeadScoringInsights(contactId) {
    const response = await fetch(`${API_BASE_URL}/ai/insights/lead-scoring?contactId=${contactId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get AI market analysis
  async getMarketAnalysis(location, propertyType = 'commercial') {
    const response = await fetch(`${API_BASE_URL}/ai/insights/market-analysis?location=${location}&propertyType=${propertyType}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Optimize email content
  async optimizeEmail(subject, body, targetAudience, goal) {
    const response = await fetch(`${API_BASE_URL}/ai/email/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        body,
        targetAudience,
        goal
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get available AI templates
  async getAITemplates() {
    const response = await fetch(`${API_BASE_URL}/ai/templates`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Analyze email sentiment
  async analyzeSentiment(content, type = 'email') {
    const response = await fetch(`${API_BASE_URL}/ai/analyze/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        type
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Generate property-specific email suggestions
  async getPropertyEmailSuggestions(propertyId, contactId, context = 'inquiry') {
    return this.getEmailSuggestions({
      propertyId,
      contactId,
      context,
      type: 'property_inquiry'
    });
  }

  // Generate follow-up email suggestions
  async getFollowUpSuggestions(contactId, daysSinceLastContact = 3) {
    return this.getEmailSuggestions({
      contactId,
      context: 'follow_up',
      type: 'follow_up',
      daysAgo: daysSinceLastContact
    });
  }

  // Generate investment proposal suggestions
  async getInvestmentProposalSuggestions(contactId, propertyId) {
    return this.getEmailSuggestions({
      contactId,
      propertyId,
      context: 'investment',
      type: 'investment_proposal'
    });
  }

  // Get smart email recommendations based on contact behavior
  async getSmartRecommendations(contactId) {
    try {
      const [leadInsights, marketAnalysis] = await Promise.all([
        this.getLeadScoringInsights(contactId),
        this.getMarketAnalysis('downtown') // Default location
      ]);

      return {
        leadInsights: leadInsights.data,
        marketAnalysis: marketAnalysis.data,
        recommendations: this.generateSmartRecommendations(leadInsights.data, marketAnalysis.data)
      };
    } catch (error) {
      console.error('Error getting smart recommendations:', error);
      throw error;
    }
  }

  // Generate smart recommendations based on AI insights
  generateSmartRecommendations(leadInsights, marketAnalysis) {
    const recommendations = [];

    // Based on lead score
    if (leadInsights.overallScore > 80) {
      recommendations.push({
        type: 'urgent',
        action: 'Schedule immediate property tour',
        reason: 'High-value lead with strong buying signals',
        priority: 'high'
      });
    } else if (leadInsights.overallScore > 60) {
      recommendations.push({
        type: 'follow_up',
        action: 'Send detailed property information',
        reason: 'Medium-value lead needs nurturing',
        priority: 'medium'
      });
    } else {
      recommendations.push({
        type: 'nurture',
        action: 'Add to educational email sequence',
        reason: 'Early-stage lead needs education',
        priority: 'low'
      });
    }

    // Based on market conditions
    if (marketAnalysis.currentTrend === 'Growing') {
      recommendations.push({
        type: 'urgency',
        action: 'Emphasize market timing in communications',
        reason: 'Growing market creates urgency',
        priority: 'high'
      });
    }

    return recommendations;
  }

  // Batch generate multiple email variations
  async generateEmailVariations(template, variables, count = 3) {
    const variations = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const variation = await this.generateEmail(template, variables, `Variation ${i + 1}`);
        variations.push({
          id: `variation_${i + 1}`,
          ...variation.data,
          variation: i + 1
        });
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);
      }
    }
    
    return variations;
  }

  // Get AI-powered writing tips
  async getWritingTips(context = 'commercial_real_estate') {
    const tips = {
      commercial_real_estate: [
        "Use specific numbers and data points to build credibility",
        "Include market insights and trends relevant to the property",
        "Address potential concerns proactively",
        "Use professional but approachable tone",
        "Include clear call-to-action with next steps",
        "Personalize based on contact's industry and needs",
        "Highlight unique property features and benefits",
        "Use social proof when available"
      ],
      investment: [
        "Lead with ROI and financial benefits",
        "Include detailed financial projections",
        "Address risk factors and mitigation strategies",
        "Use market data to support investment thesis",
        "Include comparable property analysis",
        "Highlight tax benefits and incentives",
        "Provide clear exit strategies",
        "Use professional investment terminology"
      ],
      follow_up: [
        "Reference previous conversations or interactions",
        "Provide new information or updates",
        "Use gentle urgency without being pushy",
        "Offer multiple engagement options",
        "Show continued interest and availability",
        "Include relevant market updates",
        "Ask open-ended questions to encourage response",
        "Maintain professional relationship building"
      ]
    };

    return {
      success: true,
      data: {
        tips: tips[context] || tips.commercial_real_estate,
        context,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

// Create and export singleton instance
const aiAssistantApi = new AIAssistantApi();
export default aiAssistantApi;
