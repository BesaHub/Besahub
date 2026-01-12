const express = require('express');
const router = express.Router();
const ExternalDataService = require('../services/externalDataService');
const { cacheMiddleware } = require('../middleware/cache');
const { appLogger } = require('../config/logger');

const externalDataService = new ExternalDataService();

// Get property details from external APIs
router.get('/property-details', 
  cacheMiddleware((req) => `crm:market-data:property-details:${req.query.address}:${req.query.city}:${req.query.state}`, 1800),
  async (req, res, next) => {
  try {
    const { address, city, state } = req.query;
    
    if (!address || !city || !state) {
      return res.status(400).json({ 
        error: 'Address, city, and state are required parameters' 
      });
    }

    const propertyData = await externalDataService.getPropertyDetails(address, city, state);
    
    res.json({
      success: true,
      data: propertyData
    });
  } catch (error) {
    appLogger.error('Property details API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch property details',
      message: error.message 
    });
  }
});

// Get market comparables
router.get('/comparables', 
  cacheMiddleware((req) => `crm:market-data:comparables:${req.query.address}:${req.query.city}:${req.query.state}:${req.query.propertyType}`, 1800),
  async (req, res, next) => {
  try {
    const { address, city, state, propertyType, squareFeet } = req.query;
    
    if (!address || !city || !state) {
      return res.status(400).json({ 
        error: 'Address, city, and state are required parameters' 
      });
    }

    const comparables = await externalDataService.getMarketComparables(
      address, 
      city, 
      state, 
      propertyType, 
      parseInt(squareFeet)
    );
    
    res.json({
      success: true,
      data: comparables
    });
  } catch (error) {
    appLogger.error('Comparables API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market comparables',
      message: error.message 
    });
  }
});

// Get market trends
router.get('/trends', 
  cacheMiddleware((req) => `crm:market-data:trends:${req.query.city}:${req.query.state}:${req.query.propertyType || 'all'}`, 1800),
  async (req, res, next) => {
  try {
    const { city, state, propertyType } = req.query;
    
    if (!city || !state) {
      return res.status(400).json({ 
        error: 'City and state are required parameters' 
      });
    }

    const trends = await externalDataService.getMarketTrends(city, state, propertyType);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    appLogger.error('Market trends API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market trends',
      message: error.message 
    });
  }
});

// Get submarket analysis
router.get('/submarket-analysis', 
  cacheMiddleware((req) => `crm:market-data:submarket:${req.query.city}:${req.query.state}`, 1800),
  async (req, res, next) => {
  try {
    const { city, state } = req.query;
    
    if (!city || !state) {
      return res.status(400).json({ 
        error: 'City and state are required parameters' 
      });
    }

    const analysis = await externalDataService.getSubmarketAnalysis(city, state);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    appLogger.error('Submarket analysis API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submarket analysis',
      message: error.message 
    });
  }
});

// Get enhanced property search with market data
router.get('/enhanced-search', 
  cacheMiddleware((req) => `crm:market-data:enhanced-search:${JSON.stringify(req.query)}`, 1800),
  async (req, res, next) => {
  try {
    const { query, city, state, propertyType, minPrice, maxPrice } = req.query;
    
    // This would normally integrate with a property search API
    // For now, return enhanced mock data
    const mockResults = [
      {
        id: 1,
        address: '350 Fifth Avenue',
        city: 'New York',
        state: 'NY',
        propertyType: 'Office Building',
        squareFeet: 75000,
        price: 18750000,
        pricePerSF: 250,
        yearBuilt: 1985,
        occupancyRate: 92,
        capRate: 4.2,
        marketRent: 65.50,
        images: [],
        description: 'Prime Manhattan office building with excellent visibility and transportation access.',
        amenities: ['Parking', 'Security', 'Elevator', 'HVAC'],
        marketData: {
          daysOnMarket: 45,
          priceHistory: [
            { date: '2024-01-01', price: 18000000 },
            { date: '2024-06-01', price: 18750000 }
          ],
          comparableAverage: 248.30
        }
      },
      {
        id: 2,
        address: '200 Park Avenue',
        city: 'New York',
        state: 'NY',
        propertyType: 'Office Building',
        squareFeet: 125000,
        price: 31250000,
        pricePerSF: 250,
        yearBuilt: 1990,
        occupancyRate: 88,
        capRate: 3.8,
        marketRent: 72.00,
        images: [],
        description: 'Class A office tower in Midtown Manhattan with premium finishes.',
        amenities: ['Concierge', 'Fitness Center', 'Conference Rooms', 'High-Speed Internet'],
        marketData: {
          daysOnMarket: 67,
          priceHistory: [
            { date: '2023-12-01', price: 30000000 },
            { date: '2024-03-01', price: 31250000 }
          ],
          comparableAverage: 255.75
        }
      }
    ];

    // Filter based on criteria
    let filteredResults = mockResults;
    
    if (propertyType) {
      filteredResults = filteredResults.filter(prop => 
        prop.propertyType.toLowerCase().includes(propertyType.toLowerCase())
      );
    }
    
    if (minPrice) {
      filteredResults = filteredResults.filter(prop => prop.price >= parseInt(minPrice));
    }
    
    if (maxPrice) {
      filteredResults = filteredResults.filter(prop => prop.price <= parseInt(maxPrice));
    }

    res.json({
      success: true,
      data: {
        results: filteredResults,
        totalCount: filteredResults.length,
        searchCriteria: { query, city, state, propertyType, minPrice, maxPrice },
        marketSummary: {
          avgPricePerSF: filteredResults.reduce((sum, prop) => sum + prop.pricePerSF, 0) / filteredResults.length,
          avgDaysOnMarket: 56,
          totalInventory: filteredResults.length
        }
      }
    });
  } catch (error) {
    appLogger.error('Enhanced search API error:', error);
    res.status(500).json({ 
      error: 'Failed to perform enhanced search',
      message: error.message 
    });
  }
});

module.exports = router;