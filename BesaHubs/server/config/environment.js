const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const productionRequiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = {
  JWT_REFRESH_SECRET: null,
  FRONTEND_URL: 'http://localhost:3000',
  CLIENT_URL: 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '1000',
  MAX_FILE_SIZE: '50mb',
  UPLOAD_PATH: './uploads',
  CORS_ORIGIN: 'http://localhost:3000',
  APP_BASE_URL: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:3001'
};

const securityWarningVars = [
  'JWT_REFRESH_SECRET'
];

const featureFlagVars = {
  SENDGRID_ENABLED: [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'SENDGRID_FROM_NAME'
  ],
  CALENDAR_ENABLED: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'MS_CLIENT_ID',
    'MS_CLIENT_SECRET'
  ],
  DASHBOARDS_ENABLED: []
};

function validateEnvironment() {
  const missing = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';

  const varsToCheck = isProduction ? productionRequiredVars : requiredEnvVars;
  
  varsToCheck.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file or environment configuration.');
    console.error('   See .env.example for a template of required variables.\n');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  securityWarningVars.forEach(varName => {
    if (!process.env[varName] && !isProduction) {
      warnings.push(varName);
    }
  });

  if (warnings.length > 0) {
    console.warn('⚠️  Warning: Missing recommended security environment variables:');
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('   These are recommended for enhanced security in production.\n');
  }

  validateFeatureFlags();

  console.log('✅ Environment variables validated successfully');
  
  if (isProduction) {
    console.log('🔒 Running in PRODUCTION mode');
  } else {
    console.log('🔧 Running in DEVELOPMENT mode');
  }
}

function validateFeatureFlags() {
  const featureWarnings = [];

  Object.entries(featureFlagVars).forEach(([flagName, requiredVars]) => {
    const isEnabled = process.env[flagName] === 'true';
    
    if (isEnabled && requiredVars.length > 0) {
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        featureWarnings.push({
          feature: flagName,
          missing: missingVars
        });
      }
    }
  });

  if (featureWarnings.length > 0) {
    console.warn('\n⚠️  Feature Flag Configuration Warnings:');
    featureWarnings.forEach(({ feature, missing }) => {
      console.warn(`   ${feature} is enabled but missing required variables:`);
      missing.forEach(varName => {
        console.warn(`      - ${varName}`);
      });
    });
    console.warn('   These features may not work correctly without proper configuration.\n');
  }
}

function getConfig() {
  const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3001,
    databaseUrl: process.env.DATABASE_URL,
    
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    
    frontend: {
      url: process.env.FRONTEND_URL || process.env.CLIENT_URL || optionalEnvVars.FRONTEND_URL,
      corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || process.env.CLIENT_URL || optionalEnvVars.CORS_ORIGIN
    },
    
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || parseInt(optionalEnvVars.RATE_LIMIT_WINDOW_MS, 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || parseInt(optionalEnvVars.RATE_LIMIT_MAX_REQUESTS, 10)
    },
    
    upload: {
      maxFileSize: process.env.MAX_FILE_SIZE || optionalEnvVars.MAX_FILE_SIZE,
      path: process.env.UPLOAD_PATH || optionalEnvVars.UPLOAD_PATH
    },
    
    ssl: {
      enabled: process.env.SSL_ENABLED === 'true',
      certPath: process.env.SSL_CERT_PATH || 'server/ssl/cert.pem',
      keyPath: process.env.SSL_KEY_PATH || 'server/ssl/key.pem'
    },
    
    sendgrid: {
      enabled: process.env.SENDGRID_ENABLED === 'true',
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME,
      webhookSigningKey: process.env.SENDGRID_WEBHOOK_SIGNING_KEY,
      templates: {
        invite: process.env.SENDGRID_TEMPLATE_INVITE,
        passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET,
        propertyPromo: process.env.SENDGRID_TEMPLATE_PROPERTY_PROMO
      }
    },
    
    calendar: {
      enabled: process.env.CALENDAR_ENABLED === 'true',
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
      },
      microsoft: {
        clientId: process.env.MS_CLIENT_ID,
        clientSecret: process.env.MS_CLIENT_SECRET,
        redirectUri: process.env.MS_REDIRECT_URI,
        tenantId: process.env.MS_TENANT_ID || 'common'
      }
    },
    
    dashboards: {
      enabled: process.env.DASHBOARDS_ENABLED === 'true'
    },
    
    publicUrls: {
      appBaseUrl: process.env.APP_BASE_URL || optionalEnvVars.APP_BASE_URL,
      apiBaseUrl: process.env.API_BASE_URL || optionalEnvVars.API_BASE_URL
    },
    
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production'
  };

  return config;
}

validateEnvironment();

const config = getConfig();

module.exports = config;
