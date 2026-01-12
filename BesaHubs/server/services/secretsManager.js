const { DopplerSDK } = require('@dopplerhq/node-sdk');
const { appLogger } = require('../config/logger');

class SecretsManager {
  constructor() {
    this.doppler = null;
    this.cache = new Map();
    this.cacheVersion = new Map();
    this.cacheTTL = 5 * 60 * 1000;
    this.isDopplerEnabled = false;
    this.initializationError = null;
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };
  }

  async initialize() {
    const dopplerToken = process.env.DOPPLER_TOKEN;

    if (!dopplerToken) {
      appLogger.info('🔧 Secrets Manager: No DOPPLER_TOKEN found - using environment variables fallback mode', {
        service: 'secrets-manager',
        mode: 'fallback'
      });
      this.isDopplerEnabled = false;
      return { success: true, mode: 'fallback' };
    }

    try {
      this.doppler = new DopplerSDK({
        accessToken: dopplerToken
      });

      await this._testDopplerConnection();

      this.isDopplerEnabled = true;
      appLogger.info('✅ Secrets Manager: Doppler initialized successfully', {
        service: 'secrets-manager',
        mode: 'doppler',
        cacheEnabled: true,
        cacheTTL: `${this.cacheTTL / 1000}s`
      });

      return { success: true, mode: 'doppler' };
    } catch (error) {
      this.initializationError = error;
      this.isDopplerEnabled = false;
      
      appLogger.error('❌ Secrets Manager: Failed to initialize Doppler - falling back to environment variables', {
        service: 'secrets-manager',
        error: error.message,
        mode: 'fallback'
      });

      return { success: false, mode: 'fallback', error: error.message };
    }
  }

  async _testDopplerConnection() {
    try {
      await this._fetchFromDopplerWithRetry('JWT_SECRET');
      appLogger.info('✅ Doppler connection test successful', {
        service: 'secrets-manager'
      });
    } catch (error) {
      throw new Error(`Doppler connection test failed: ${error.message}`);
    }
  }

  async _fetchFromDopplerWithRetry(secretName, attempt = 1) {
    try {
      const response = await this.doppler.secrets.get({
        project: process.env.DOPPLER_PROJECT || 'default',
        config: process.env.DOPPLER_CONFIG || 'dev',
        name: secretName
      });

      return response.value;
    } catch (error) {
      if (attempt >= this.retryConfig.maxAttempts) {
        appLogger.error('❌ Secrets Manager: Max retry attempts reached', {
          service: 'secrets-manager',
          secretName: this._sanitizeSecretName(secretName),
          attempts: attempt,
          error: error.message
        });
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
        this.retryConfig.maxDelay
      );

      appLogger.warn(`⚠️ Secrets Manager: Retry attempt ${attempt}/${this.retryConfig.maxAttempts} after ${delay}ms`, {
        service: 'secrets-manager',
        secretName: this._sanitizeSecretName(secretName),
        delay
      });

      await this._sleep(delay);
      return this._fetchFromDopplerWithRetry(secretName, attempt + 1);
    }
  }

  async get(secretName, options = {}) {
    const { bypassCache = false, required = true } = options;

    if (this.isDopplerEnabled && !bypassCache) {
      const cachedValue = this._getCachedSecret(secretName);
      if (cachedValue !== null) {
        appLogger.debug('📦 Secrets Manager: Retrieved from cache', {
          service: 'secrets-manager',
          secretName: this._sanitizeSecretName(secretName),
          source: 'cache'
        });
        return cachedValue;
      }
    }

    if (this.isDopplerEnabled) {
      try {
        const value = await this._fetchFromDopplerWithRetry(secretName);
        
        this._setCachedSecret(secretName, value);

        appLogger.info('✅ Secrets Manager: Secret retrieved from Doppler', {
          service: 'secrets-manager',
          secretName: this._sanitizeSecretName(secretName),
          source: 'doppler',
          cached: true
        });

        return value;
      } catch (error) {
        appLogger.error('❌ Secrets Manager: Failed to fetch from Doppler, falling back to env', {
          service: 'secrets-manager',
          secretName: this._sanitizeSecretName(secretName),
          error: error.message,
          fallback: 'process.env'
        });
      }
    }

    const envValue = process.env[secretName];

    if (!envValue && required) {
      appLogger.error(`❌ Secrets Manager: Required secret '${this._sanitizeSecretName(secretName)}' not found`, {
        service: 'secrets-manager',
        secretName: this._sanitizeSecretName(secretName),
        source: 'env',
        isDopplerEnabled: this.isDopplerEnabled
      });
      throw new Error(`Required secret '${secretName}' not found in Doppler or environment variables`);
    }

    if (envValue) {
      appLogger.info('📋 Secrets Manager: Secret retrieved from environment variables', {
        service: 'secrets-manager',
        secretName: this._sanitizeSecretName(secretName),
        source: 'env'
      });
    }

    return envValue || null;
  }

  _getCachedSecret(secretName) {
    const cached = this.cache.get(secretName);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(secretName);
      this.cacheVersion.delete(secretName);
      return null;
    }

    return cached.value;
  }

  _setCachedSecret(secretName, value) {
    const version = (this.cacheVersion.get(secretName) || 0) + 1;
    
    this.cache.set(secretName, {
      value,
      timestamp: Date.now()
    });
    
    this.cacheVersion.set(secretName, version);

    appLogger.debug('💾 Secrets Manager: Secret cached', {
      service: 'secrets-manager',
      secretName: this._sanitizeSecretName(secretName),
      version,
      ttl: `${this.cacheTTL / 1000}s`
    });
  }

  clearCache(secretName = null) {
    if (secretName) {
      this.cache.delete(secretName);
      this.cacheVersion.delete(secretName);
      appLogger.info('🗑️ Secrets Manager: Cache cleared for secret', {
        service: 'secrets-manager',
        secretName: this._sanitizeSecretName(secretName)
      });
    } else {
      this.cache.clear();
      this.cacheVersion.clear();
      appLogger.info('🗑️ Secrets Manager: All cache cleared', {
        service: 'secrets-manager'
      });
    }
  }

  async healthCheck() {
    const health = {
      status: 'healthy',
      mode: this.isDopplerEnabled ? 'doppler' : 'fallback',
      timestamp: new Date().toISOString(),
      cache: {
        size: this.cache.size,
        ttl: `${this.cacheTTL / 1000}s`
      },
      doppler: {
        enabled: this.isDopplerEnabled,
        configured: !!process.env.DOPPLER_TOKEN,
        initializationError: this.initializationError ? this.initializationError.message : null
      }
    };

    if (this.isDopplerEnabled) {
      try {
        await this._testDopplerConnection();
        health.doppler.connectionStatus = 'connected';
      } catch (error) {
        health.status = 'degraded';
        health.doppler.connectionStatus = 'failed';
        health.doppler.connectionError = error.message;
        
        appLogger.warn('⚠️ Secrets Manager: Health check failed - Doppler connection error', {
          service: 'secrets-manager',
          error: error.message
        });
      }
    }

    return health;
  }

  getSecretVersion(secretName) {
    return this.cacheVersion.get(secretName) || 0;
  }

  _sanitizeSecretName(secretName) {
    return secretName.replace(/[A-Z]/g, '*');
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMode() {
    return this.isDopplerEnabled ? 'doppler' : 'fallback';
  }

  isCached(secretName) {
    const cached = this.cache.get(secretName);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) <= this.cacheTTL;
  }
}

const secretsManager = new SecretsManager();

module.exports = secretsManager;
