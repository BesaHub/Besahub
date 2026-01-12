const { Joi, Segments, celebrate } = require('celebrate');
const { commonValidation } = require('../../middleware/validation');

const registerSchema = celebrate({
  [Segments.BODY]: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name must not exceed 100 characters',
        'any.required': 'First name is required'
      }),

    lastName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name must not exceed 100 characters',
        'any.required': 'Last name is required'
      }),

    email: commonValidation.email,

    password: commonValidation.password,

    phone: commonValidation.optionalPhoneNumber,

    title: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Title must not exceed 100 characters'
      }),

    role: Joi.string()
      .valid('admin', 'manager', 'agent', 'assistant')
      .default('agent')
      .messages({
        'any.only': 'Invalid role. Must be admin, manager, agent, or assistant'
      })
  })
});

const loginSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: commonValidation.email,
    password: commonValidation.simplePassword
  })
});

const forgotPasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: commonValidation.email
  })
});

const resetPasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Reset token is required',
        'any.required': 'Reset token is required'
      }),

    newPassword: commonValidation.password
  })
});

const changePasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    currentPassword: commonValidation.simplePassword,
    newPassword: commonValidation.password
  })
});

const mfaVerifySchema = celebrate({
  [Segments.BODY]: Joi.object({
    tempToken: Joi.string()
      .required()
      .messages({
        'string.empty': 'Temporary token is required',
        'any.required': 'Temporary token is required'
      }),

    mfaCode: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'MFA code must be exactly 6 digits',
        'string.pattern.base': 'MFA code must contain only numbers',
        'string.empty': 'MFA code is required',
        'any.required': 'MFA code is required'
      })
  })
});

const updateProfileSchema = celebrate({
  [Segments.BODY]: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .messages({
        'string.empty': 'First name cannot be empty',
        'string.max': 'First name must not exceed 100 characters'
      }),

    lastName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .messages({
        'string.empty': 'Last name cannot be empty',
        'string.max': 'Last name must not exceed 100 characters'
      }),

    phone: commonValidation.optionalPhoneNumber,

    title: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Title must not exceed 100 characters'
      }),

    department: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Department must not exceed 100 characters'
      }),

    preferences: Joi.object().unknown(true)
  }).min(1)
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  mfaVerifySchema,
  updateProfileSchema
};
