const { appLogger } = require('./logger');

const MIN_SECRET_LENGTH = 32;

const requiredProductionSecrets = {
  JWT_SECRET: {
    minLength: MIN_SECRET_LENGTH,
    description: 'JWT signing secret'
  },
  JWT_REFRESH_SECRET: {
    minLength: MIN_SECRET_LENGTH,
    description: 'JWT refresh token signing secret'
  },
  DATABASE_URL: {
    minLength: 10,
    description: 'PostgreSQL database connection URL'
  },
  ENCRYPTION_KEY: {
    minLength: MIN_SECRET_LENGTH,
    description: 'Database encryption key for PII (pgcrypto)'
  }
};

const optionalSecrets = {
  REDIS_URL: {
    description: 'Redis connection URL for caching and session management',
    feature: 'caching'
  },
  SENDGRID_API_KEY: {
    description: 'SendGrid API key for email features',
    feature: 'email notifications'
  },
  EMAIL_HOST: {
    description: 'SMTP email host',
    feature: 'email features'
  },
  EMAIL_USER: {
    description: 'SMTP email user',
    feature: 'email features'
  },
  EMAIL_PASS: {
    description: 'SMTP email password',
    feature: 'email features'
  }
};

function validateSecretLength(secretName, secretValue, minLength) {
  if (!secretValue || secretValue.length < minLength) {
    return {
      valid: false,
      error: `${secretName} must be at least ${minLength} characters long (current: ${secretValue ? secretValue.length : 0})`
    };
  }
  return { valid: true };
}

function validateRequiredSecrets() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  if (isProduction) {
    console.log('🔐 Validating production secrets...\n');

    Object.entries(requiredProductionSecrets).forEach(([key, config]) => {
      const value = process.env[key];

      if (!value) {
        errors.push(`❌ ${key} is required in production (${config.description})`);
      } else {
        const validation = validateSecretLength(key, value, config.minLength);
        if (!validation.valid) {
          errors.push(`❌ ${validation.error}`);
        } else {
          console.log(`✅ ${key}: Valid (length: ${value.length} chars)`);
        }
      }
    });

    if (errors.length > 0) {
      console.error('\n🚨 CRITICAL: Required secrets validation failed:\n');
      errors.forEach(error => console.error(`   ${error}`));
      console.error('\n💡 Please set these environment variables before deploying to production.');
      console.error('   See .env.example for configuration template.\n');
      
      throw new Error(`Missing or invalid required secrets in production: ${errors.length} error(s)`);
    }

    Object.entries(optionalSecrets).forEach(([key, config]) => {
      if (!process.env[key]) {
        warnings.push(`⚠️  ${key} not set - ${config.feature} will be disabled`);
      }
    });

    if (warnings.length > 0) {
      console.warn('\n⚠️  Optional secrets missing (features may be limited):\n');
      warnings.forEach(warning => console.warn(`   ${warning}`));
      console.warn('');
    }

    console.log('✅ All required production secrets validated successfully\n');
  } else {
    console.log('🔧 Development mode: Skipping strict secret validation\n');

    const missingDev = [];
    Object.entries(requiredProductionSecrets).forEach(([key, config]) => {
      if (!process.env[key]) {
        missingDev.push(`⚠️  ${key} not set (${config.description})`);
      } else if (config.minLength) {
        const validation = validateSecretLength(key, process.env[key], config.minLength);
        if (!validation.valid) {
          missingDev.push(`⚠️  ${validation.error}`);
        }
      }
    });

    if (missingDev.length > 0) {
      console.warn('⚠️  Development warnings:\n');
      missingDev.forEach(warning => console.warn(`   ${warning}`));
      console.warn('\n   These should be set before deploying to production.\n');
    }
  }
}

function logSecurityConfiguration() {
  const isProduction = process.env.NODE_ENV === 'production';
  const demoMode = process.env.DEMO_MODE === 'true';
  const sslEnabled = process.env.SSL_ENABLED === 'true';

  console.log('🔒 Security Configuration:');
  console.log(`   Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`   HTTPS Enforcement: ${isProduction ? 'ENABLED' : 'DISABLED (dev only)'}`);
  console.log(`   HSTS: ${isProduction ? 'ENABLED (max-age: 1 year)' : 'DISABLED (dev only)'}`);
  console.log(`   Demo Mode: ${demoMode ? 'ENABLED ⚠️' : 'DISABLED'}`);
  console.log(`   SSL/TLS: ${sslEnabled ? 'ENABLED' : 'HTTP (dev only)'}`);
  
  if (isProduction && demoMode) {
    console.error('\n⚠️  WARNING: DEMO_MODE is enabled in production! This is a security risk.');
    console.error('   Set DEMO_MODE=false or remove it from production environment.\n');
  }
  
  console.log('');
}

module.exports = {
  validateRequiredSecrets,
  logSecurityConfiguration,
  MIN_SECRET_LENGTH
};
