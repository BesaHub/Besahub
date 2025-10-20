const validatePasswordComplexity = (password) => {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const getPasswordStrength = (password) => {
  let score = 0;
  
  if (!password) return 0;
  
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[@$!%*?&]/.test(password)) score += 15;
  
  const hasMultipleLowercase = (password.match(/[a-z]/g) || []).length > 1;
  const hasMultipleUppercase = (password.match(/[A-Z]/g) || []).length > 1;
  const hasMultipleNumbers = (password.match(/\d/g) || []).length > 1;
  const hasMultipleSpecial = (password.match(/[@$!%*?&]/g) || []).length > 1;
  
  if (hasMultipleLowercase) score += 2;
  if (hasMultipleUppercase) score += 2;
  if (hasMultipleNumbers) score += 2;
  if (hasMultipleSpecial) score += 2;
  
  return Math.min(100, score);
};

module.exports = {
  validatePasswordComplexity,
  getPasswordStrength
};
