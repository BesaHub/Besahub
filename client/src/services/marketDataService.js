import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? '/api'  // Use relative URL in production (same domain)
    : 'http://localhost:3001/api'  // Use localhost in development
);

class MarketDataService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/market-data`,
      timeout: 30000,
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Market Data API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Get detailed property information from external APIs
  async getPropertyDetails(address, city, state) {
    try {
      const response = await this.api.get('/property-details', {
        params: { address, city, state }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching property details:', error);
      throw new Error('Failed to fetch property details');
    }
  }

  // Get market comparables for a property
  async getMarketComparables(address, city, state, propertyType, squareFeet) {
    try {
      const response = await this.api.get('/comparables', {
        params: { address, city, state, propertyType, squareFeet }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching market comparables:', error);
      throw new Error('Failed to fetch market comparables');
    }
  }

  // Get market trends for a specific area and property type
  async getMarketTrends(city, state, propertyType = '') {
    try {
      const response = await this.api.get('/trends', {
        params: { city, state, propertyType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching market trends:', error);
      throw new Error('Failed to fetch market trends');
    }
  }

  // Get submarket analysis for a city
  async getSubmarketAnalysis(city, state) {
    try {
      const response = await this.api.get('/submarket-analysis', {
        params: { city, state }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching submarket analysis:', error);
      throw new Error('Failed to fetch submarket analysis');
    }
  }

  // Enhanced property search with market data
  async searchPropertiesWithMarketData(searchCriteria) {
    try {
      const response = await this.api.get('/enhanced-search', {
        params: searchCriteria
      });
      return response.data;
    } catch (error) {
      console.error('Error performing enhanced property search:', error);
      throw new Error('Failed to perform enhanced property search');
    }
  }

  // Cache management for frequently accessed data
  async getCachedMarketTrends(city, state, propertyType = '') {
    const cacheKey = `market_trends_${city}_${state}_${propertyType}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);

    // Check if cache is valid (1 hour expiry)
    if (cachedData && cacheExpiry && new Date().getTime() < parseInt(cacheExpiry)) {
      return JSON.parse(cachedData);
    }

    try {
      const data = await this.getMarketTrends(city, state, propertyType);
      
      // Cache the data for 1 hour
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_expiry`, (new Date().getTime() + 3600000).toString());
      
      return data;
    } catch (error) {
      // If API fails and we have old cached data, return it
      if (cachedData) {
        console.warn('Using expired cache due to API failure');
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  // Get aggregated market data for dashboard
  async getDashboardMarketData(locations = []) {
    try {
      const promises = locations.map(location => 
        this.getCachedMarketTrends(location.city, location.state, location.propertyType)
      );

      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        location: locations[index],
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));
    } catch (error) {
      console.error('Error fetching dashboard market data:', error);
      throw new Error('Failed to fetch dashboard market data');
    }
  }

  // Clear all cached market data
  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('market_trends_') || key.includes('_expiry')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Utility function to format price data
  formatPrice(price) {
    if (!price) return 'N/A';
    
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price.toLocaleString()}`;
    }
  }

  // Utility function to format square feet
  formatSquareFeet(sqft) {
    if (!sqft) return 'N/A';
    return `${sqft.toLocaleString()} SF`;
  }

  // Utility function to calculate price per square foot
  calculatePricePerSF(price, squareFeet) {
    if (!price || !squareFeet) return null;
    return (price / squareFeet).toFixed(2);
  }

  // Get mock data for demo purposes (fallback when no API keys are configured)
  getMockMarketData(type = 'trends') {
    const mockData = {
      trends: {
        success: true,
        data: {
          location: 'New York, NY',
          propertyType: 'Office Building',
          timeframe: 'Last 12 Months',
          priceTrends: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(2024, i).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            avgPricePerSF: 280 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
            salesVolume: Math.floor(50 + Math.sin(i * 0.3) * 20 + Math.random() * 30),
            inventory: Math.floor(200 + Math.cos(i * 0.4) * 50 + Math.random() * 40)
          })),
          marketMetrics: {
            avgPricePerSF: 295.50,
            priceChange: '+4.2%',
            salesVolume: 847,
            volumeChange: '+12.1%',
            avgDaysOnMarket: 45,
            domChange: '-8.3%',
            vacancyRate: 8.2,
            vacancyChange: '-1.1%'
          },
          lastUpdated: new Date().toISOString(),
          source: 'Mock Market Data'
        }
      },
      comparables: {
        success: true,
        data: Array.from({ length: 6 }, (_, i) => ({
          id: `comp_${i + 1}`,
          address: `${1000 + i * 100} Business Ave`,
          city: 'New York',
          state: 'NY',
          propertyType: 'Office Building',
          squareFeet: Math.floor(40000 + Math.random() * 60000),
          pricePerSF: (250 + Math.random() * 100).toFixed(2),
          lastSaleDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          distance: (0.1 + Math.random() * 0.9).toFixed(1) + ' miles',
          source: 'Mock Comparable'
        }))
      }
    };

    return Promise.resolve(mockData[type] || mockData.trends);
  }
}

// Export a singleton instance
const marketDataService = new MarketDataService();
export default marketDataService;

// Also export the class for testing purposes
export { MarketDataService };