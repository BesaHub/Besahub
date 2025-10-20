// Data validation utilities for analytics components

export const validateChartData = (data, requiredFields = []) => {
  if (!Array.isArray(data)) {
    return { isValid: false, error: 'Data must be an array' };
  }

  if (data.length === 0) {
    return { isValid: true, data: [] };
  }

  // Check if all items have required fields
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    for (const field of requiredFields) {
      if (item[field] === undefined || item[field] === null) {
        return { 
          isValid: false, 
          error: `Missing required field '${field}' at index ${i}` 
        };
      }
    }
  }

  return { isValid: true, data };
};

export const sanitizeChartData = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    const sanitized = {};
    for (const [key, value] of Object.entries(item)) {
      // Remove any potentially dangerous content
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  });
};

export const validateKPIData = (kpiData) => {
  const requiredFields = ['value', 'target', 'label'];
  const errors = [];

  for (const [key, kpi] of Object.entries(kpiData)) {
    for (const field of requiredFields) {
      if (kpi[field] === undefined || kpi[field] === null) {
        errors.push(`KPI '${key}' missing required field '${field}'`);
      }
    }

    // Validate numeric values
    if (typeof kpi.value !== 'number' || isNaN(kpi.value)) {
      errors.push(`KPI '${key}' value must be a number`);
    }
    if (typeof kpi.target !== 'number' || isNaN(kpi.target)) {
      errors.push(`KPI '${key}' target must be a number`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDashboardConfig = (config) => {
  const errors = [];

  if (!config.name || typeof config.name !== 'string') {
    errors.push('Dashboard name is required');
  }

  if (!Array.isArray(config.widgets)) {
    errors.push('Widgets must be an array');
  } else {
    config.widgets.forEach((widget, index) => {
      if (!widget.i || !widget.type) {
        errors.push(`Widget at index ${index} missing required fields (i, type)`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateReportConfig = (config) => {
  const errors = [];

  if (!config.name || typeof config.name !== 'string') {
    errors.push('Report name is required');
  }

  if (!config.type || typeof config.type !== 'string') {
    errors.push('Report type is required');
  }

  if (!Array.isArray(config.metrics) || config.metrics.length === 0) {
    errors.push('At least one metric must be selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
