const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { validatePasswordComplexity, getPasswordStrength } = require('../utils/passwordHelper');
const { logAuthEvent, logCriticalEvent } = require('../middleware/auditLogger');
const { appLogger } = require('../config/logger');
const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const { verifyCaptcha } = require('../middleware/captchaVerifier');
const { geoIpFilter } = require('../middleware/geoIpFilter');

const { authLimiter, passwordResetLimiter, mfaVerifyLimiter, strictLimiter, duplicateRequestBlocker } = require('../middleware/rateLimiters');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  mfaVerifySchema,
  updateProfileSchema
} = require('../validation/schemas/auth.schemas');

const router = express.Router();

// Email transporter (configure with your SMTP settings)
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate JWT tokens (access and refresh)
const generateTokens = (user) => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  if (!process.env.JWT_SECRET) {
    appLogger.warn('⚠️  JWT_SECRET not set, using fallback. Set JWT_SECRET environment variable for production!');
  }

  // Access token - short-lived (15 minutes)
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '15m' }
  );

  // Refresh token - long-lived (7 days), minimal data
  const refreshToken = jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    secret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', geoIpFilter, verifyCaptcha, duplicateRequestBlocker, registerSchema, async (req, res, next) => {
  try {

    const { firstName, lastName, email, password, phone, title, role } = req.body;

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet complexity requirements',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // Will be hashed automatically by the model hook
      phone,
      title,
      role: role || 'agent',
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    });

    // Generate JWT tokens with rotation support
    const { accessToken, refreshToken } = await tokenService.issueTokens(user);

    // Send verification email (optional)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'CRE CRM - Verify Your Email',
          html: `
            <h2>Welcome to CRE CRM</h2>
            <p>Hello ${firstName},</p>
            <p>Thank you for registering with CRE CRM. Please click the link below to verify your email address:</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${user.emailVerificationToken}">Verify Email</a>
            <p>If you didn't create this account, please ignore this email.</p>
          `
        });
      } catch (emailError) {
        appLogger.error('Failed to send verification email:', emailError);
      }
    }

    // Return user data without sensitive information
    const userData = await User.findByPk(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token: accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    appLogger.error('Registration error:', error);
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', geoIpFilter, verifyCaptcha, authLimiter, loginSchema, async (req, res, next) => {
  try {
    appLogger.info('🔐 Login attempt:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    const { email, password } = req.body;

    // Demo credentials security check - OPTIMIZED: Check credentials first before DB query
    if (email === 'admin@demo.com' && password === 'Admin@Demo123') {
      const isProduction = process.env.NODE_ENV === 'production';
      const demoModeEnabled = process.env.DEMO_MODE === 'true';

      // Block demo login in production
      if (isProduction) {
        appLogger.warn('🚫 Demo login attempt blocked in production', {
          email: email,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        return res.status(403).json({ 
          error: 'Demo credentials disabled in production'
        });
      }

      // Only allow demo login if DEMO_MODE is explicitly enabled in development
      if (!demoModeEnabled) {
        appLogger.warn('🚫 Demo login attempt without DEMO_MODE enabled', {
          email: email,
          ip: req.ip,
          nodeEnv: process.env.NODE_ENV
        });
        return res.status(403).json({ 
          error: 'Demo mode is not enabled. Set DEMO_MODE=true to use demo credentials.'
        });
      }

      // Log warning about demo mode usage
      appLogger.warn('⚠️  Demo login used - This should only be for development/testing', {
        email: email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Use fallback demo user immediately for fast login (no DB dependency)
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@demo.com',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'admin',
        title: 'System Administrator',
        department: 'IT',
        isActive: true,
        emailVerified: true
      };

      appLogger.info('✅ Creating demo user tokens...');
      const { accessToken, refreshToken } = await tokenService.issueTokens(demoUser);
      appLogger.info('✅ Demo login successful (fast mode - no DB check):', { userId: demoUser.id, email: demoUser.email });

      return res.json({
        message: 'Demo login successful',
        token: accessToken,
        refreshToken,
        user: demoUser
      });
    }

    // Normal authentication for non-demo users
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check lockout status (both Redis and DB)
    const lockStatus = await authService.checkLockout(user.id, email);
    if (lockStatus.isLocked) {
      const minutesRemaining = Math.ceil((lockStatus.lockedUntil - new Date()) / 60000);
      appLogger.warn(`🔒 Login attempt for locked account: ${email} (locked for ${minutesRemaining} more minutes)`);
      return res.status(401).json({ 
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      const failureResult = await authService.handleFailedLogin(
        user.id, 
        email, 
        req.ip, 
        req.headers['user-agent']
      );
      
      if (failureResult.locked) {
        appLogger.warn(`🔒 Account locked after max attempts: ${email}`);
        return res.status(401).json({ 
          error: 'Account locked due to too many failed login attempts. Please try again in 30 minutes.' 
        });
      }
      
      appLogger.warn(`❌ Failed login attempt for ${email} (${failureResult.attemptsRemaining} attempts remaining)`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Successful login - reset attempts
    await authService.handleSuccessfulLogin(user.id, email, req.ip, user.role);

    // Check if MFA is enabled for this user
    const userWithMfa = await User.unscoped().findByPk(user.id);
    if (userWithMfa.mfaEnabled) {
      // Generate temporary MFA token (15 minutes)
      const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
      const tempToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: 'mfa-temp'
        },
        secret,
        { expiresIn: '15m' }
      );

      appLogger.info('🔐 MFA required for login', {
        userId: user.id,
        email: user.email
      });

      return res.json({
        requiresMfa: true,
        tempToken,
        message: 'MFA verification required'
      });
    }

    // Generate new tokens with rotation support
    const { accessToken, refreshToken } = await tokenService.issueTokens(user);

    // Return user data without sensitive information
    const userData = await User.findByPk(user.id);

    logAuthEvent('USER_LOGIN', user.id, user.email, user.role, req.ip, true, {
      method: 'credentials',
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    appLogger.error('Login error:', error);
    next(error);
  }
});

// POST /api/auth/mfa/verify-login
router.post('/mfa/verify-login', mfaVerifyLimiter, mfaVerifySchema, async (req, res, next) => {
  try {

    const { tempToken, mfaCode } = req.body;
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'MFA verification timeout. Please login again.' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if it's an MFA pending token
    if (decoded.type !== 'mfa-pending') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Get user with MFA secret
    const user = await User.unscoped().findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      appLogger.warn('🔒 MFA verification failed: Invalid user or inactive account', {
        userId: decoded.id,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      appLogger.warn('⚠️ MFA verification failed: MFA not enabled', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      return res.status(400).json({ error: 'MFA is not enabled for this account' });
    }

    // Check if user is MFA locked
    if (user.isMfaLocked()) {
      appLogger.warn('🔒 MFA verification blocked: User is locked', {
        userId: user.id,
        email: user.email,
        failedAttempts: user.mfaFailedAttempts,
        lockUntil: user.mfaLockUntil,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Too many failed MFA attempts. Please try again later.' });
    }

    let isValid = false;

    // Try TOTP verification first
    const totpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode,
      window: 2
    });

    if (totpValid) {
      isValid = true;
    } else {
      // Try backup codes
      if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
        for (let i = 0; i < user.mfaBackupCodes.length; i++) {
          const backupValid = await bcrypt.compare(mfaCode, user.mfaBackupCodes[i]);
          if (backupValid) {
            isValid = true;
            // Remove used backup code
            const updatedBackupCodes = [...user.mfaBackupCodes];
            updatedBackupCodes.splice(i, 1);
            await user.update({ mfaBackupCodes: updatedBackupCodes });
            appLogger.info('✅ MFA verification successful using backup code', {
              userId: user.id,
              email: user.email,
              remainingBackupCodes: updatedBackupCodes.length,
              ip: req.ip
            });
            break;
          }
        }
      }
    }

    if (!isValid) {
      // Increment failed MFA attempts
      await user.incMfaAttempts();
      appLogger.warn('❌ MFA verification failed: Invalid code', {
        userId: user.id,
        email: user.email,
        failedAttempts: user.mfaFailedAttempts + 1,
        isNowLocked: user.mfaFailedAttempts + 1 >= 5,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // Reset MFA failed attempts on success
    await user.resetMfaAttempts();

    // Generate new tokens with rotation support
    const { accessToken, refreshToken } = await tokenService.issueTokens(user);

    // Update last login
    await user.update({ lastLogin: new Date() });

    appLogger.info('✅ MFA verification successful', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    logAuthEvent('USER_LOGIN', user.id, user.email, user.role, req.ip, true, {
      method: 'mfa',
      userAgent: req.headers['user-agent']
    });

    // Return user data without sensitive information
    const userData = await User.findByPk(user.id);

    res.json({
      message: 'MFA verification successful',
      token: accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    appLogger.error('MFA verify-login error:', error);
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // User is already available from auth middleware
    res.json({
      user: req.user
    });
  } catch (error) {
    appLogger.error('Get user error:', error);
    next(error);
  }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, updateProfileSchema, async (req, res, next) => {
  try {

    const allowedFields = ['firstName', 'lastName', 'phone', 'title', 'department', 'preferences'];
    const updateData = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    await req.user.update(updateData);

    res.json({
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    appLogger.error('Update profile error:', error);
    next(error);
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, strictLimiter, changePasswordSchema, async (req, res, next) => {
  try {

    const { currentPassword, newPassword } = req.body;

    const passwordValidation = validatePasswordComplexity(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet complexity requirements',
        details: passwordValidation.errors
      });
    }

    // Get user with password
    const user = await User.scope('withPassword').findByPk(req.user.id);

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by model hook
    await user.save();

    logCriticalEvent('PASSWORD_CHANGE', {
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, user);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    appLogger.error('Change password error:', error);
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', geoIpFilter, verifyCaptcha, passwordResetLimiter, duplicateRequestBlocker, forgotPasswordSchema, async (req, res, next) => {
  try {

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Send reset email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'CRE CRM - Password Reset',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.firstName},</p>
            <p>You requested a password reset for your CRE CRM account. Click the link below to reset your password:</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}">Reset Password</a>
            <p>This link will expire in 30 minutes.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          `
        });
      } catch (emailError) {
        appLogger.error('Failed to send reset email:', emailError);
        return next(error);
      }
    }

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    appLogger.error('Forgot password error:', error);
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordSchema, async (req, res, next) => {
  try {
    const { token, newPassword: password } = req.body;

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet complexity requirements',
        details: passwordValidation.errors
      });
    }

    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    user.password = password; // Will be hashed by model hook
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    
    // Reset login attempts when password is reset
    await user.resetLoginAttempts();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    appLogger.error('Reset password error:', error);
    next(error);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {

    const { token } = req.body;

    const user = await User.findOne({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    appLogger.error('Email verification error:', error);
    next(error);
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res, next) => {
  try {

    const { refreshToken } = req.body;

    // Use tokenService to rotate the refresh token
    try {
      const { accessToken, refreshToken: newRefreshToken } = await tokenService.rotateRefreshToken(refreshToken);

      res.json({
        message: 'Tokens refreshed successfully',
        token: accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({ error: 'Refresh token expired' });
      } else if (error.message.includes('reuse detected')) {
        appLogger.error('⚠️  Token reuse detected - possible security incident');
        return res.status(401).json({ error: 'Invalid refresh token - session revoked' });
      } else if (error.message.includes('Invalid')) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      } else if (error.message.includes('User not found')) {
        return res.status(401).json({ error: 'User not found' });
      }
      throw error;
    }
  } catch (error) {
    appLogger.error('Refresh token error:', error);
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    // Clear refresh token from database
    await req.user.update({
      refreshToken: null,
      refreshTokenExpiry: null
    });

    logAuthEvent('USER_LOGOUT', req.user.id, req.user.email, req.user.role, req.ip, true);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    appLogger.error('Logout error:', error);
    next(error);
  }
});

// GET /api/auth/check-mfa-status - Check if user needs MFA enrollment
router.get('/check-mfa-status', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
    const shouldEnrollMfa = isAdminOrManager && !user.mfaEnabled;

    res.json({
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      canEnableMfa: isAdminOrManager,
      shouldEnrollMfa: shouldEnrollMfa,
      requiresMfaEnrollment: shouldEnrollMfa
    });
  } catch (error) {
    appLogger.error('Check MFA status error:', error);
    next(error);
  }
});

module.exports = router;