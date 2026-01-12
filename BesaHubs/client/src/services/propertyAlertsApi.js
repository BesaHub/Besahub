import api from './api';

// Property Alerts API Service
export const propertyAlertsApi = {
  // Get user's property alerts
  getAlerts: async (userId) => {
    try {
      const response = await api.get(`/property-alerts/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch property alerts:', error);
      throw error;
    }
  },

  // Create new property alert
  createAlert: async (alertData) => {
    try {
      const response = await api.post('/property-alerts', alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to create property alert:', error);
      throw error;
    }
  },

  // Update existing alert
  updateAlert: async (alertId, alertData) => {
    try {
      const response = await api.put(`/property-alerts/${alertId}`, alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to update property alert:', error);
      throw error;
    }
  },

  // Delete alert
  deleteAlert: async (alertId) => {
    try {
      const response = await api.delete(`/property-alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete property alert:', error);
      throw error;
    }
  },

  // Get triggered alerts (notifications)
  getTriggeredAlerts: async (userId, limit = 50) => {
    try {
      const response = await api.get(`/property-alerts/triggered/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch triggered alerts:', error);
      throw error;
    }
  },

  // Mark alerts as read
  markAlertsAsRead: async (alertIds) => {
    try {
      const response = await api.post('/property-alerts/mark-read', { alertIds });
      return response.data;
    } catch (error) {
      console.error('Failed to mark alerts as read:', error);
      throw error;
    }
  },

  // Test alert (preview what properties would match)
  testAlert: async (alertData) => {
    try {
      const response = await api.post('/property-alerts/test', alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to test alert:', error);
      throw error;
    }
  }
};

// Property Alert Engine - Client-side logic
export class PropertyAlertEngine {
  // Evaluate if a property matches alert criteria
  static evaluateProperty(property, alertCriteria) {
    const matches = [];
    let overallMatch = true;

    // Price range check
    if (alertCriteria.priceMin || alertCriteria.priceMax) {
      const priceMatch = this.checkPriceRange(property.price, alertCriteria.priceMin, alertCriteria.priceMax);
      matches.push({
        criteria: 'price_range',
        matched: priceMatch.matched,
        value: property.price,
        expected: `${alertCriteria.priceMin || 0} - ${alertCriteria.priceMax || '∞'}`,
        score: priceMatch.score
      });
      if (!priceMatch.matched) overallMatch = false;
    }

    // Property type check
    if (alertCriteria.propertyTypes && alertCriteria.propertyTypes.length > 0) {
      const typeMatch = alertCriteria.propertyTypes.includes(property.type);
      matches.push({
        criteria: 'property_type',
        matched: typeMatch,
        value: property.type,
        expected: alertCriteria.propertyTypes.join(', '),
        score: typeMatch ? 100 : 0
      });
      if (!typeMatch) overallMatch = false;
    }

    // Location check
    if (alertCriteria.locations && alertCriteria.locations.length > 0) {
      const locationMatch = this.checkLocationMatch(property.location, alertCriteria.locations, alertCriteria.locationRadius);
      matches.push({
        criteria: 'location',
        matched: locationMatch.matched,
        value: property.location,
        expected: alertCriteria.locations.join(', '),
        score: locationMatch.score
      });
      if (!locationMatch.matched) overallMatch = false;
    }

    // Size range check
    if (alertCriteria.sizeMin || alertCriteria.sizeMax) {
      const sizeMatch = this.checkSizeRange(property.size, alertCriteria.sizeMin, alertCriteria.sizeMax);
      matches.push({
        criteria: 'size_range',
        matched: sizeMatch.matched,
        value: property.size,
        expected: `${alertCriteria.sizeMin || 0} - ${alertCriteria.sizeMax || '∞'} sq ft`,
        score: sizeMatch.score
      });
      if (!sizeMatch.matched) overallMatch = false;
    }

    // Cap rate check
    if (alertCriteria.minCapRate) {
      const capRateMatch = property.capRate >= alertCriteria.minCapRate;
      matches.push({
        criteria: 'cap_rate',
        matched: capRateMatch,
        value: property.capRate ? `${(property.capRate * 100).toFixed(2)}%` : 'N/A',
        expected: `≥ ${(alertCriteria.minCapRate * 100).toFixed(2)}%`,
        score: capRateMatch ? 100 : 0
      });
      if (!capRateMatch) overallMatch = false;
    }

    // Cash flow check
    if (alertCriteria.minCashFlow) {
      const cashFlowMatch = property.monthlyCashFlow >= alertCriteria.minCashFlow;
      matches.push({
        criteria: 'cash_flow',
        matched: cashFlowMatch,
        value: property.monthlyCashFlow ? `$${property.monthlyCashFlow.toLocaleString()}` : 'N/A',
        expected: `≥ $${alertCriteria.minCashFlow.toLocaleString()}`,
        score: cashFlowMatch ? 100 : 0
      });
      if (!cashFlowMatch) overallMatch = false;
    }

    // Days on market check
    if (alertCriteria.maxDaysOnMarket) {
      const domMatch = property.daysOnMarket <= alertCriteria.maxDaysOnMarket;
      matches.push({
        criteria: 'days_on_market',
        matched: domMatch,
        value: `${property.daysOnMarket} days`,
        expected: `≤ ${alertCriteria.maxDaysOnMarket} days`,
        score: domMatch ? 100 : 0
      });
      if (!domMatch) overallMatch = false;
    }

    // Keywords check
    if (alertCriteria.keywords && alertCriteria.keywords.length > 0) {
      const keywordMatch = this.checkKeywords(property, alertCriteria.keywords);
      matches.push({
        criteria: 'keywords',
        matched: keywordMatch.matched,
        value: keywordMatch.foundKeywords.join(', ') || 'None found',
        expected: alertCriteria.keywords.join(', '),
        score: keywordMatch.score
      });
      if (!keywordMatch.matched) overallMatch = false;
    }

    // Calculate overall match score
    const overallScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;

    return {
      matched: overallMatch,
      score: Math.round(overallScore),
      matchDetails: matches,
      property
    };
  }

  static checkPriceRange(price, minPrice, maxPrice) {
    if (!price) return { matched: false, score: 0 };
    
    const min = minPrice || 0;
    const max = maxPrice || Infinity;
    const matched = price >= min && price <= max;
    
    // Score based on how well it fits the range
    let score = 0;
    if (matched) {
      if (max === Infinity) {
        score = 100;
      } else {
        const rangePosition = (price - min) / (max - min);
        score = 100 - Math.abs(rangePosition - 0.5) * 100; // Peak score at middle of range
      }
    }
    
    return { matched, score: Math.max(0, Math.round(score)) };
  }

  static checkLocationMatch(propertyLocation, alertLocations, radius = 5) {
    if (!propertyLocation || !alertLocations.length) return { matched: false, score: 0 };
    
    // Simple string matching for now - in production would use geolocation
    const locationString = propertyLocation.toLowerCase();
    
    for (const alertLocation of alertLocations) {
      const alertLocationString = alertLocation.toLowerCase();
      
      if (locationString.includes(alertLocationString) || alertLocationString.includes(locationString)) {
        return { matched: true, score: 100 };
      }
      
      // Check for partial matches (city, state, etc.)
      const locationWords = locationString.split(/[,\s]+/);
      const alertWords = alertLocationString.split(/[,\s]+/);
      
      const commonWords = locationWords.filter(word => 
        alertWords.some(alertWord => 
          word.length > 2 && alertWord.length > 2 && 
          (word.includes(alertWord) || alertWord.includes(word))
        )
      );
      
      if (commonWords.length > 0) {
        const matchRatio = commonWords.length / Math.max(locationWords.length, alertWords.length);
        if (matchRatio >= 0.3) {
          return { matched: true, score: Math.round(matchRatio * 100) };
        }
      }
    }
    
    return { matched: false, score: 0 };
  }

  static checkSizeRange(size, minSize, maxSize) {
    if (!size) return { matched: false, score: 0 };
    
    const min = minSize || 0;
    const max = maxSize || Infinity;
    const matched = size >= min && size <= max;
    
    let score = 0;
    if (matched) {
      if (max === Infinity) {
        score = 100;
      } else {
        const rangePosition = (size - min) / (max - min);
        score = 100 - Math.abs(rangePosition - 0.5) * 100;
      }
    }
    
    return { matched, score: Math.max(0, Math.round(score)) };
  }

  static checkKeywords(property, keywords) {
    const searchableText = [
      property.name,
      property.description,
      property.features?.join(' '),
      property.amenities?.join(' ')
    ].filter(Boolean).join(' ').toLowerCase();
    
    const foundKeywords = keywords.filter(keyword => 
      searchableText.includes(keyword.toLowerCase())
    );
    
    const matched = foundKeywords.length > 0;
    const score = matched ? (foundKeywords.length / keywords.length) * 100 : 0;
    
    return {
      matched,
      score: Math.round(score),
      foundKeywords
    };
  }

  // Generate alert summary for display
  static generateAlertSummary(alertCriteria) {
    const summary = [];
    
    if (alertCriteria.priceMin || alertCriteria.priceMax) {
      const min = alertCriteria.priceMin ? `$${alertCriteria.priceMin.toLocaleString()}` : 'Any';
      const max = alertCriteria.priceMax ? `$${alertCriteria.priceMax.toLocaleString()}` : 'Any';
      summary.push(`Price: ${min} - ${max}`);
    }
    
    if (alertCriteria.propertyTypes?.length) {
      summary.push(`Type: ${alertCriteria.propertyTypes.join(', ')}`);
    }
    
    if (alertCriteria.locations?.length) {
      summary.push(`Location: ${alertCriteria.locations.join(', ')}`);
    }
    
    if (alertCriteria.sizeMin || alertCriteria.sizeMax) {
      const min = alertCriteria.sizeMin ? `${alertCriteria.sizeMin.toLocaleString()}` : 'Any';
      const max = alertCriteria.sizeMax ? `${alertCriteria.sizeMax.toLocaleString()}` : 'Any';
      summary.push(`Size: ${min} - ${max} sq ft`);
    }
    
    if (alertCriteria.minCapRate) {
      summary.push(`Min Cap Rate: ${(alertCriteria.minCapRate * 100).toFixed(1)}%`);
    }
    
    if (alertCriteria.minCashFlow) {
      summary.push(`Min Cash Flow: $${alertCriteria.minCashFlow.toLocaleString()}`);
    }
    
    return summary.join(' • ');
  }

  // Process properties against all user alerts
  static processAlertsForProperties(properties, userAlerts) {
    const triggeredAlerts = [];
    
    userAlerts.forEach(alert => {
      if (!alert.active) return;
      
      const matchingProperties = [];
      
      properties.forEach(property => {
        const evaluation = this.evaluateProperty(property, alert.criteria);
        if (evaluation.matched) {
          matchingProperties.push(evaluation);
        }
      });
      
      if (matchingProperties.length > 0) {
        triggeredAlerts.push({
          alert,
          properties: matchingProperties,
          triggeredAt: new Date(),
          count: matchingProperties.length
        });
      }
    });
    
    return triggeredAlerts;
  }
}

// Mock data for development
export const mockPropertyAlerts = [
  {
    id: '1',
    name: 'Downtown Office Buildings',
    criteria: {
      propertyTypes: ['office'],
      priceMin: 500000,
      priceMax: 2000000,
      locations: ['Downtown Seattle', 'Bellevue'],
      minCapRate: 0.06,
      keywords: ['parking', 'elevator']
    },
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    frequency: 'daily',
    lastTriggered: '2024-01-20T08:30:00Z'
  },
  {
    id: '2',
    name: 'Retail Investment Properties',
    criteria: {
      propertyTypes: ['retail'],
      priceMax: 1500000,
      locations: ['Capitol Hill', 'Queen Anne'],
      minCashFlow: 2000,
      maxDaysOnMarket: 60
    },
    active: true,
    createdAt: '2024-01-10T14:30:00Z',
    frequency: 'weekly',
    lastTriggered: null
  },
  {
    id: '3',
    name: 'Industrial Warehouse Deals',
    criteria: {
      propertyTypes: ['industrial', 'warehouse'],
      priceMin: 800000,
      sizeMin: 10000,
      locations: ['SODO', 'Georgetown'],
      keywords: ['loading dock', 'high ceiling']
    },
    active: false,
    createdAt: '2024-01-05T09:15:00Z',
    frequency: 'daily',
    lastTriggered: '2024-01-18T16:45:00Z'
  }
];

export const mockTriggeredAlerts = [
  {
    id: '1',
    alertId: '1',
    alertName: 'Downtown Office Buildings',
    propertyId: 'prop_123',
    propertyName: '456 Pine Street Office Complex',
    triggeredAt: '2024-01-20T08:30:00Z',
    read: false,
    matchScore: 95,
    matchDetails: [
      { criteria: 'property_type', matched: true, value: 'office', expected: 'office', score: 100 },
      { criteria: 'price_range', matched: true, value: 1250000, expected: '500000 - 2000000', score: 90 },
      { criteria: 'location', matched: true, value: 'Downtown Seattle', expected: 'Downtown Seattle, Bellevue', score: 100 }
    ]
  },
  {
    id: '2',
    alertId: '2',
    alertName: 'Retail Investment Properties',
    propertyId: 'prop_456',
    propertyName: 'Capitol Hill Retail Space',
    triggeredAt: '2024-01-19T14:15:00Z',
    read: true,
    matchScore: 88,
    matchDetails: [
      { criteria: 'property_type', matched: true, value: 'retail', expected: 'retail', score: 100 },
      { criteria: 'price_range', matched: true, value: 950000, expected: '0 - 1500000', score: 85 },
      { criteria: 'cash_flow', matched: true, value: 2500, expected: '≥ 2000', score: 80 }
    ]
  }
];