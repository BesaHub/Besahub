import api from './api';

// Commission Management API
export const commissionApi = {
  // Get commission records with filtering
  getCommissions: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/commissions${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }
  },

  // Calculate commission for a deal
  calculateCommission: async (dealId, commissionStructure) => {
    try {
      const response = await api.post(`/commissions/calculate/${dealId}`, commissionStructure);
      return response.data;
    } catch (error) {
      console.error('Error calculating commission:', error);
      throw error;
    }
  },

  // Create commission record
  createCommission: async (commissionData) => {
    try {
      const response = await api.post('/commissions', commissionData);
      return response.data;
    } catch (error) {
      console.error('Error creating commission:', error);
      throw error;
    }
  },

  // Update commission record
  updateCommission: async (id, commissionData) => {
    try {
      const response = await api.put(`/commissions/${id}`, commissionData);
      return response.data;
    } catch (error) {
      console.error('Error updating commission:', error);
      throw error;
    }
  },

  // Get commission splits for a deal
  getCommissionSplits: async (dealId) => {
    try {
      const response = await api.get(`/commissions/splits/${dealId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching commission splits:', error);
      throw error;
    }
  },

  // Create or update commission splits
  updateCommissionSplits: async (dealId, splits) => {
    try {
      const response = await api.put(`/commissions/splits/${dealId}`, { splits });
      return response.data;
    } catch (error) {
      console.error('Error updating commission splits:', error);
      throw error;
    }
  },

  // Get agent commission summary
  getAgentCommissions: async (agentId, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/commissions/agent/${agentId}${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent commissions:', error);
      throw error;
    }
  },

  // Process commission payment
  processPayment: async (commissionId, paymentData) => {
    try {
      const response = await api.post(`/commissions/${commissionId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing commission payment:', error);
      throw error;
    }
  },

  // Get commission reports
  getCommissionReport: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/commissions/reports${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching commission report:', error);
      throw error;
    }
  }
};

// Commission Calculation Engine (Client-side)
export class CommissionCalculator {
  static calculateCommission(deal, commissionStructure, agents = []) {
    const dealValue = deal.value || 0;
    let totalCommission = 0;
    let calculations = {};

    // Base commission calculation
    switch (commissionStructure.type) {
      case 'percentage':
        totalCommission = dealValue * (commissionStructure.rate / 100);
        break;
      case 'flat_rate':
        totalCommission = commissionStructure.amount;
        break;
      case 'tiered':
        totalCommission = this.calculateTieredCommission(dealValue, commissionStructure.tiers);
        break;
      case 'sliding_scale':
        totalCommission = this.calculateSlidingScale(dealValue, commissionStructure.scale);
        break;
      default:
        totalCommission = 0;
    }

    calculations.baseCommission = totalCommission;

    // Apply bonuses
    if (commissionStructure.bonuses) {
      const bonusAmount = this.calculateBonuses(deal, commissionStructure.bonuses, dealValue);
      totalCommission += bonusAmount;
      calculations.bonuses = bonusAmount;
    }

    // Apply penalties/deductions
    if (commissionStructure.deductions) {
      const deductionAmount = this.calculateDeductions(deal, commissionStructure.deductions, dealValue);
      totalCommission -= deductionAmount;
      calculations.deductions = deductionAmount;
    }

    calculations.totalCommission = Math.max(0, totalCommission);

    // Calculate splits
    if (agents && agents.length > 0) {
      calculations.splits = this.calculateSplits(calculations.totalCommission, agents);
    }

    return calculations;
  }

  static calculateTieredCommission(dealValue, tiers) {
    let commission = 0;
    let remainingValue = dealValue;

    for (const tier of tiers.sort((a, b) => a.threshold - b.threshold)) {
      if (remainingValue <= 0) break;

      const tierAmount = tier.max 
        ? Math.min(remainingValue, tier.max - tier.threshold)
        : remainingValue;

      commission += tierAmount * (tier.rate / 100);
      remainingValue -= tierAmount;
    }

    return commission;
  }

  static calculateSlidingScale(dealValue, scale) {
    // Find appropriate scale tier
    const tier = scale
      .sort((a, b) => b.threshold - a.threshold)
      .find(s => dealValue >= s.threshold);

    if (!tier) return 0;

    return dealValue * (tier.rate / 100);
  }

  static calculateBonuses(deal, bonuses, dealValue) {
    let totalBonus = 0;

    bonuses.forEach(bonus => {
      let bonusAmount = 0;

      switch (bonus.type) {
        case 'early_close':
          if (this.isEarlyClose(deal, bonus.days)) {
            bonusAmount = bonus.amount_type === 'percentage' 
              ? dealValue * (bonus.amount / 100)
              : bonus.amount;
          }
          break;
        case 'volume':
          // Would need agent's total volume for period
          break;
        case 'deal_size':
          if (dealValue >= bonus.threshold) {
            bonusAmount = bonus.amount_type === 'percentage' 
              ? dealValue * (bonus.amount / 100)
              : bonus.amount;
          }
          break;
        case 'property_type':
          if (deal.property?.propertyType === bonus.property_type) {
            bonusAmount = bonus.amount_type === 'percentage' 
              ? dealValue * (bonus.amount / 100)
              : bonus.amount;
          }
          break;
      }

      totalBonus += bonusAmount;
    });

    return totalBonus;
  }

  static calculateDeductions(deal, deductions, dealValue) {
    let totalDeductions = 0;

    deductions.forEach(deduction => {
      let deductionAmount = 0;

      switch (deduction.type) {
        case 'late_close':
          if (this.isLateClose(deal, deduction.days)) {
            deductionAmount = deduction.amount_type === 'percentage' 
              ? dealValue * (deduction.amount / 100)
              : deduction.amount;
          }
          break;
        case 'marketing_cost':
          deductionAmount = deduction.amount;
          break;
        case 'referral_fee':
          deductionAmount = deduction.amount_type === 'percentage' 
            ? dealValue * (deduction.amount / 100)
            : deduction.amount;
          break;
      }

      totalDeductions += deductionAmount;
    });

    return totalDeductions;
  }

  static calculateSplits(totalCommission, agents) {
    const splits = [];
    let remainingCommission = totalCommission;

    // Sort agents by split priority/hierarchy
    const sortedAgents = agents.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    sortedAgents.forEach(agent => {
      let agentCommission = 0;

      switch (agent.split_type) {
        case 'percentage':
          agentCommission = totalCommission * (agent.split_rate / 100);
          break;
        case 'fixed':
          agentCommission = Math.min(agent.split_amount, remainingCommission);
          break;
        case 'remaining':
          agentCommission = remainingCommission;
          break;
      }

      splits.push({
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        splitType: agent.split_type,
        splitRate: agent.split_rate,
        amount: Math.max(0, agentCommission)
      });

      remainingCommission -= agentCommission;
    });

    return splits;
  }

  static isEarlyClose(deal, bonusDays) {
    if (!deal.expectedCloseDate || !deal.actualCloseDate) return false;
    
    const expected = new Date(deal.expectedCloseDate);
    const actual = new Date(deal.actualCloseDate);
    const diffDays = Math.floor((expected - actual) / (24 * 60 * 60 * 1000));
    
    return diffDays >= bonusDays;
  }

  static isLateClose(deal, penaltyDays) {
    if (!deal.expectedCloseDate || !deal.actualCloseDate) return false;
    
    const expected = new Date(deal.expectedCloseDate);
    const actual = new Date(deal.actualCloseDate);
    const diffDays = Math.floor((actual - expected) / (24 * 60 * 60 * 1000));
    
    return diffDays >= penaltyDays;
  }

  // Generate commission structure templates
  static getCommissionTemplates() {
    return [
      {
        id: 'standard_percentage',
        name: 'Standard Percentage',
        description: 'Fixed percentage of deal value',
        type: 'percentage',
        rate: 3,
        recommended_for: ['Residential', 'Small Commercial']
      },
      {
        id: 'tiered_commercial',
        name: 'Tiered Commercial',
        description: 'Decreasing rates for larger deals',
        type: 'tiered',
        tiers: [
          { threshold: 0, max: 1000000, rate: 6 },
          { threshold: 1000000, max: 5000000, rate: 4 },
          { threshold: 5000000, max: null, rate: 2 }
        ],
        recommended_for: ['Large Commercial', 'Investment Properties']
      },
      {
        id: 'leasing_structure',
        name: 'Leasing Commission',
        description: 'Based on annual rent with lease terms',
        type: 'percentage',
        rate: 4,
        bonuses: [
          {
            type: 'lease_term',
            threshold: 5, // years
            amount: 0.5, // additional percentage
            amount_type: 'percentage'
          }
        ],
        recommended_for: ['Lease Deals']
      },
      {
        id: 'team_split',
        name: 'Team Commission Split',
        description: 'Multiple agent commission splits',
        type: 'percentage',
        rate: 5,
        default_splits: [
          { role: 'listing_agent', split_rate: 50, split_type: 'percentage' },
          { role: 'buyer_agent', split_rate: 50, split_type: 'percentage' }
        ],
        recommended_for: ['Team Transactions']
      }
    ];
  }
}

// Commission Status Types
export const COMMISSION_STATUS = {
  PENDING: 'pending',
  CALCULATED: 'calculated',
  APPROVED: 'approved',
  PAID: 'paid',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled'
};

// Commission Structure Types
export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FLAT_RATE: 'flat_rate',
  TIERED: 'tiered',
  SLIDING_SCALE: 'sliding_scale'
};

// Agent Roles for Commission Splits
export const AGENT_ROLES = {
  LISTING_AGENT: 'listing_agent',
  BUYER_AGENT: 'buyer_agent',
  REFERRAL_AGENT: 'referral_agent',
  TEAM_LEAD: 'team_lead',
  SUPPORT_AGENT: 'support_agent'
};

export default commissionApi;