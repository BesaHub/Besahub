# Doppler Secrets Management Setup

The BesaHubs CRM now supports Doppler for centralized secrets management with automatic fallback to environment variables.

## Setup Instructions

### 1. Sign up for Doppler (Optional)
- Visit https://doppler.com and create an account
- Create a new project for your CRM application

### 2. Configure Doppler Environment Variables
Add the following secrets to your Replit Secrets or environment:

```bash
# Required for Doppler integration
DOPPLER_TOKEN=your_doppler_service_token_here

# Optional - defaults to 'default' and 'dev' respectively
DOPPLER_PROJECT=default
DOPPLER_CONFIG=dev
```

### 3. How It Works

#### With Doppler Enabled:
- Secrets are fetched from Doppler API
- Cached locally for 5 minutes to prevent rate limits
- Automatic retry with exponential backoff (3 attempts)
- Falls back to environment variables if Doppler is unavailable

#### Without Doppler (Fallback Mode):
- Uses process.env variables directly
- No additional setup required
- Perfect for local development

### 4. Features

✅ **Automatic Fallback**: If DOPPLER_TOKEN is not set, the app uses environment variables  
✅ **Caching Layer**: 5-minute TTL to prevent excessive API calls  
✅ **Version Tracking**: Track secret rotation for auditing  
✅ **Health Monitoring**: Built-in health check endpoint  
✅ **Retry Logic**: Exponential backoff for failed requests  
✅ **Secure Logging**: All secret names are sanitized in logs  

### 5. Health Check

Check secrets manager status:
```bash
GET /api/metrics
```

Response includes:
```json
{
  "secretsManager": {
    "status": "healthy",
    "mode": "doppler|fallback",
    "cache": {
      "size": 5,
      "ttl": "300s"
    },
    "doppler": {
      "enabled": true,
      "connectionStatus": "connected"
    }
  }
}
```

### 6. Migration from Environment Variables

No migration needed! The system automatically:
1. Checks if DOPPLER_TOKEN exists
2. Uses Doppler if available
3. Falls back to process.env if not

All existing environment variables continue to work.
