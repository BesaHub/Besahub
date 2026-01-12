# Real Data Integration Guide

## Overview

The BesaHubs Commercial Real Estate CRM now includes real data integration capabilities to connect with live market data sources. This provides accurate, up-to-date property information, market analytics, and comparable sales data.

## Features Implemented

### 1. External Data Service Layer
- **Location**: `server/services/externalDataService.js`
- **Purpose**: Manages connections to external real estate APIs
- **Supported APIs**:
  - ATTOM Data API (Property details, sales history, valuations)
  - Estated API (Comprehensive property data)
  - Fallback mock data when APIs are unavailable

### 2. Market Data API Endpoints
- **Location**: `server/routes/marketData.js`
- **Endpoints**:
  - `/api/market-data/property-details` - Get detailed property information
  - `/api/market-data/comparables` - Get market comparables
  - `/api/market-data/trends` - Get market trends and analytics
  - `/api/market-data/submarket-analysis` - Get submarket analysis
  - `/api/market-data/enhanced-search` - Enhanced property search with market data

### 3. Client-Side Market Data Service
- **Location**: `client/src/services/marketDataService.js`
- **Features**:
  - Automatic caching for improved performance
  - Fallback to mock data when APIs fail
  - Error handling and retry logic
  - Data formatting utilities

### 4. Updated Market Analytics Component
- **Location**: `client/src/pages/MarketAnalytics/MarketAnalytics.js`
- **Enhancements**:
  - Real-time data loading from external APIs
  - Location-based market search
  - Property type filtering
  - Time frame selection
  - Data refresh capabilities
  - Loading states and error handling

## API Configuration

### Setting Up API Keys

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file:
   ```env
   # ATTOM Data API
   ATTOM_API_KEY=your_attom_api_key_here
   
   # Estated API
   ESTATED_API_KEY=your_estated_api_key_here
   ```

### Getting API Keys

#### ATTOM Data API
1. Visit: https://api.developer.attom.com/
2. Sign up for a developer account
3. Subscribe to the Property API service
4. Generate your API key
5. Add to `.env` as `ATTOM_API_KEY`

**Features Available:**
- Property details and characteristics
- Sales history and pricing
- Market valuations
- Comparable properties
- Property ownership information

#### Estated API
1. Visit: https://estated.com/developers
2. Create a developer account
3. Choose an appropriate plan
4. Generate your API key
5. Add to `.env` as `ESTATED_API_KEY`

**Features Available:**
- Comprehensive property data
- Owner information
- Property valuation
- Tax records
- Property history

### API Usage Limits

- **ATTOM Data**: 500-10,000+ requests/month depending on plan
- **Estated**: 100-10,000+ requests/month depending on plan
- **Caching**: Data is cached for 1 hour to minimize API calls

## Data Flow

1. **User Action**: User searches for market data in the Market Analytics page
2. **Client Request**: Client calls marketDataService methods
3. **Cache Check**: Service checks localStorage cache first
4. **API Call**: If cache miss, makes request to server API
5. **External API**: Server calls external APIs (ATTOM/Estated)
6. **Data Processing**: Server formats and returns data
7. **Caching**: Client caches data for future use
8. **UI Update**: Components update with real data

## Mock Data Fallback

When API keys are not configured or APIs are unavailable:
- System automatically falls back to realistic mock data
- Users see demo data but with proper data structures
- All functionality remains operational
- Warning messages indicate when using demo data

## Performance Optimizations

### Caching Strategy
- **Client-side caching**: 1-hour cache for frequently accessed data
- **Background refresh**: Automatic cache invalidation
- **Batch requests**: Multiple data points fetched simultaneously

### Error Handling
- **Graceful degradation**: Falls back to mock data on API failures
- **User notifications**: Clear error messages and fallback indicators
- **Retry logic**: Automatic retries with exponential backoff

## Data Types Available

### Property Details
```javascript
{
  id: "unique_identifier",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  propertyType: "Office Building",
  yearBuilt: 1995,
  squareFeet: 50000,
  lotSize: 0.5,
  estimatedValue: 15000000,
  lastSaleDate: "2020-03-15",
  lastSalePrice: 12000000,
  marketValue: 15000000,
  source: "ATTOM" // or "Estated" or "Mock Data"
}
```

### Market Trends
```javascript
{
  location: "New York, NY",
  propertyType: "Office Building",
  timeframe: "Last 12 Months",
  priceTrends: [
    { month: "Jan 2024", avgPricePerSF: 295.50, salesVolume: 67 }
  ],
  marketMetrics: {
    avgPricePerSF: 295.50,
    priceChange: "+4.2%",
    salesVolume: 847,
    avgDaysOnMarket: 45,
    vacancyRate: 8.2
  }
}
```

### Market Comparables
```javascript
[
  {
    id: "comp_1",
    address: "456 Business Ave",
    propertyType: "Office Building", 
    squareFeet: 48000,
    pricePerSF: 285.50,
    lastSalePrice: 13700000,
    lastSaleDate: "2024-02-15",
    distance: "0.3 miles"
  }
]
```

## Future Enhancements

### Additional Data Sources
- **CoStar API** (when available for third-party developers)
- **LoopNet API** (commercial property listings)
- **Reonomy API** (commercial property intelligence)
- **CompStak API** (commercial lease comps)
- **PropertyRadar API** (property intelligence)

### Advanced Features
- Real-time market alerts
- Automated property valuations
- Market trend predictions using ML
- Comparative market analysis (CMA) generation
- Investment analysis tools
- Portfolio performance tracking

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key is correctly added to `.env`
   - Check API key permissions and quotas
   - Restart server after updating `.env`

2. **No Data Returned**
   - Check API rate limits
   - Verify location format (City, State)
   - Check server logs for API errors

3. **Slow Loading**
   - Data is cached for better performance
   - Initial loads may be slower due to API calls
   - Consider upgrading API plan for better limits

### Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed API request/response logs in the server console.

## Support

For API-related issues:
- **ATTOM Data**: support@attom.com
- **Estated**: support@estated.com
- **BesaHubs Integration**: Check server logs and error messages

## Security Notes

- **API Keys**: Never commit API keys to version control
- **Environment Files**: Keep `.env` files secure and excluded from git
- **Rate Limiting**: Built-in rate limiting prevents API abuse
- **CORS**: Proper CORS configuration for security

## Cost Management

- **Free Tiers**: Both APIs offer free tiers for development
- **Usage Monitoring**: Monitor API usage in respective dashboards
- **Caching**: Aggressive caching reduces API calls
- **Batch Processing**: Combine multiple requests where possible