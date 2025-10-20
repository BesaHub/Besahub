const axios = require('axios');

class ExternalDataService {
  constructor() {
    this.attomApiKey = process.env.ATTOM_API_KEY;
    this.estatedApiKey = process.env.ESTATED_API_KEY;
    this.attomBaseUrl = 'https://search.onboard-apis.com/propertyapi/v1.0.0';
    this.estatedBaseUrl = 'https://apis.estated.com/v4';
  }

  async getPropertyDetails(address, city, state) {
    try {
      if (this.attomApiKey) {
        return await this.getAttomPropertyData(address, city, state);
      } else if (this.estatedApiKey) {
        return await this.getEstatedPropertyData(address, city, state);
      } else {
        console.log('No API keys configured, returning mock data');
        return this.getMockPropertyData(address, city, state);
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
      return this.getMockPropertyData(address, city, state);
    }
  }

  async getAttomPropertyData(address, city, state) {
    try {
      const response = await axios.get(`${this.attomBaseUrl}/property/detail`, {
        headers: {
          'accept': 'application/json',
          'apikey': this.attomApiKey
        },
        params: {
          address1: address,
          locality: city,
          stateorprovince: state
        }
      });

      const property = response.data.property && response.data.property[0];
      if (!property) {
        throw new Error('No property data found');
      }

      return this.formatAttomData(property);
    } catch (error) {
      console.error('ATTOM API Error:', error);
      throw error;
    }
  }

  async getEstatedPropertyData(address, city, state) {
    try {
      const response = await axios.get(`${this.estatedBaseUrl}/property`, {
        headers: {
          'Authorization': `Bearer ${this.estatedApiKey}`
        },
        params: {
          address: `${address}, ${city}, ${state}`
        }
      });

      return this.formatEstatedData(response.data);
    } catch (error) {
      console.error('Estated API Error:', error);
      throw error;
    }
  }

  formatAttomData(property) {
    const identifier = property.identifier || {};
    const location = property.location || {};
    const summary = property.summary || {};
    const building = property.building || {};
    const lot = property.lot || {};

    return {
      id: identifier.attomId,
      address: location.address,
      city: location.locality,
      state: location.stateorprovince,
      zipCode: location.postal1,
      propertyType: summary.proptype,
      yearBuilt: summary.yearbuilt,
      squareFeet: building.size?.livingsize,
      lotSize: lot.lotsize1,
      bedrooms: building.rooms?.beds,
      bathrooms: building.rooms?.bathstotal,
      estimatedValue: summary.propvalue,
      lastSaleDate: summary.saledate,
      lastSalePrice: summary.saleprice,
      county: location.countyorparish,
      neighborhood: location.neighborhoodname,
      marketValue: summary.marketvalue,
      taxAmount: summary.taxtotal,
      ownerName: property.owner?.owner1?.lastname + ', ' + property.owner?.owner1?.firstname,
      zoning: lot.zoning,
      propertyUse: summary.propLandUse,
      source: 'ATTOM'
    };
  }

  formatEstatedData(data) {
    const property = data.data || {};
    
    return {
      id: property.fips_code + '_' + property.parcel_number,
      address: property.address?.street_name,
      city: property.address?.city,
      state: property.address?.state,
      zipCode: property.address?.zip_code,
      propertyType: property.structure?.property_type,
      yearBuilt: property.structure?.year_built,
      squareFeet: property.structure?.total_area_sq_ft,
      lotSize: property.parcel?.area_acres,
      bedrooms: property.structure?.beds_count,
      bathrooms: property.structure?.baths,
      estimatedValue: property.valuation?.value,
      lastSaleDate: property.sale?.date,
      lastSalePrice: property.sale?.price,
      county: property.address?.county,
      neighborhood: property.address?.neighborhood,
      marketValue: property.valuation?.value,
      taxAmount: property.tax?.total,
      ownerName: property.owner?.name,
      zoning: property.parcel?.zoning,
      propertyUse: property.structure?.use_code_description,
      source: 'Estated'
    };
  }

  getMockPropertyData(address, city, state) {
    return {
      id: `mock_${Date.now()}`,
      address: address || '123 Main St',
      city: city || 'New York',
      state: state || 'NY',
      zipCode: '10001',
      propertyType: 'Office Building',
      yearBuilt: 1995,
      squareFeet: 50000,
      lotSize: 0.5,
      estimatedValue: 15000000,
      lastSaleDate: '2020-03-15',
      lastSalePrice: 12000000,
      county: 'New York County',
      neighborhood: 'Midtown',
      marketValue: 15000000,
      taxAmount: 180000,
      ownerName: 'Demo Property Owner LLC',
      zoning: 'C6-4',
      propertyUse: 'Commercial Office',
      source: 'Mock Data'
    };
  }

  async getMarketComparables(address, city, state, propertyType, squareFeet) {
    try {
      if (this.attomApiKey) {
        return await this.getAttomComparables(address, city, state, propertyType, squareFeet);
      } else {
        return this.getMockComparables(propertyType, squareFeet);
      }
    } catch (error) {
      console.error('Error fetching comparables:', error);
      return this.getMockComparables(propertyType, squareFeet);
    }
  }

  async getAttomComparables(address, city, state, propertyType, squareFeet) {
    try {
      const response = await axios.get(`${this.attomBaseUrl}/property/expand`, {
        headers: {
          'accept': 'application/json',
          'apikey': this.attomApiKey
        },
        params: {
          address1: address,
          locality: city,
          stateorprovince: state,
          radius: 1,
          maxresults: 10
        }
      });

      return response.data.property?.map(prop => this.formatAttomData(prop)) || [];
    } catch (error) {
      console.error('ATTOM Comparables API Error:', error);
      return this.getMockComparables(propertyType, squareFeet);
    }
  }

  getMockComparables(propertyType = 'Office Building', squareFeet = 50000) {
    const basePrice = 300; // per sq ft
    const variations = [-0.2, -0.1, 0, 0.1, 0.2, 0.3];
    
    return variations.map((variation, index) => {
      const adjustedPrice = basePrice * (1 + variation);
      const adjustedSize = squareFeet * (0.8 + Math.random() * 0.4);
      
      return {
        id: `comp_${index + 1}`,
        address: `${1000 + index * 100} Business Ave`,
        city: 'New York',
        state: 'NY',
        propertyType,
        squareFeet: Math.round(adjustedSize),
        pricePerSF: adjustedPrice.toFixed(2),
        lastSalePrice: Math.round(adjustedSize * adjustedPrice),
        lastSaleDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        distance: (0.1 + Math.random() * 0.9).toFixed(1) + ' miles',
        source: 'Mock Comparable'
      };
    });
  }

  async getMarketTrends(city, state, propertyType) {
    try {
      // In a real implementation, this would call APIs like CoStar, Reonomy, or CompStak
      return this.getMockMarketTrends(city, state, propertyType);
    } catch (error) {
      console.error('Error fetching market trends:', error);
      return this.getMockMarketTrends(city, state, propertyType);
    }
  }

  getMockMarketTrends(city, state, propertyType) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Generate price trends for last 12 months
    const priceTrends = months.map((month, index) => ({
      month: `${month} ${currentYear}`,
      avgPricePerSF: 280 + Math.sin(index * 0.5) * 20 + Math.random() * 10,
      salesVolume: Math.floor(50 + Math.sin(index * 0.3) * 20 + Math.random() * 30),
      inventory: Math.floor(200 + Math.cos(index * 0.4) * 50 + Math.random() * 40)
    }));

    const marketMetrics = {
      avgPricePerSF: 295.50,
      priceChange: '+4.2%',
      salesVolume: 847,
      volumeChange: '+12.1%',
      avgDaysOnMarket: 45,
      domChange: '-8.3%',
      vacancyRate: 8.2,
      vacancyChange: '-1.1%'
    };

    return {
      location: `${city}, ${state}`,
      propertyType,
      timeframe: 'Last 12 Months',
      priceTrends,
      marketMetrics,
      lastUpdated: new Date().toISOString(),
      source: 'Mock Market Data'
    };
  }

  async getSubmarketAnalysis(city, state) {
    try {
      return this.getMockSubmarketAnalysis(city, state);
    } catch (error) {
      console.error('Error fetching submarket analysis:', error);
      return this.getMockSubmarketAnalysis(city, state);
    }
  }

  getMockSubmarketAnalysis(city, state) {
    const submarkets = [
      { name: 'Downtown Core', avgRent: 65.50, vacancyRate: 6.2, inventory: 450000 },
      { name: 'Midtown', avgRent: 58.25, vacancyRate: 8.1, inventory: 320000 },
      { name: 'Financial District', avgRent: 72.00, vacancyRate: 4.8, inventory: 280000 },
      { name: 'Tech Hub', avgRent: 68.75, vacancyRate: 3.2, inventory: 180000 },
      { name: 'Waterfront', avgRent: 59.80, vacancyRate: 9.5, inventory: 220000 }
    ];

    return {
      location: `${city}, ${state}`,
      submarkets: submarkets.map(sub => ({
        ...sub,
        priceChange: (Math.random() * 10 - 5).toFixed(1) + '%',
        absorption: Math.floor(Math.random() * 50000),
        newSupply: Math.floor(Math.random() * 30000)
      })),
      marketSummary: {
        totalInventory: submarkets.reduce((sum, sub) => sum + sub.inventory, 0),
        avgVacancyRate: (submarkets.reduce((sum, sub) => sum + sub.vacancyRate, 0) / submarkets.length).toFixed(1),
        avgRent: (submarkets.reduce((sum, sub) => sum + sub.avgRent, 0) / submarkets.length).toFixed(2)
      },
      lastUpdated: new Date().toISOString(),
      source: 'Mock Submarket Data'
    };
  }
}

module.exports = ExternalDataService;