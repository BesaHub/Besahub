const { appLogger } = require('./logger');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

const flags = {
  SENDGRID_ENABLED: parseBoolean(process.env.SENDGRID_ENABLED),
  CALENDAR_ENABLED: parseBoolean(process.env.CALENDAR_ENABLED),
  DASHBOARDS_ENABLED: parseBoolean(process.env.DASHBOARDS_ENABLED)
};

function isFeatureEnabled(featureName) {
  if (!flags.hasOwnProperty(featureName)) {
    appLogger.warn(`Unknown feature flag requested: ${featureName}`, { 
      service: 'feature-flags' 
    });
    return false;
  }
  return flags[featureName];
}

function logFeatureStatus() {
  appLogger.info('🎛️  Feature Flags Status:', { service: 'feature-flags' });
  
  Object.entries(flags).forEach(([flagName, isEnabled]) => {
    const status = isEnabled ? '✅ ENABLED' : '⚪ DISABLED';
    appLogger.info(`   ${flagName}: ${status}`, { service: 'feature-flags' });
  });
}

logFeatureStatus();

module.exports = {
  flags,
  isFeatureEnabled,
  SENDGRID_ENABLED: flags.SENDGRID_ENABLED,
  CALENDAR_ENABLED: flags.CALENDAR_ENABLED,
  DASHBOARDS_ENABLED: flags.DASHBOARDS_ENABLED
};
