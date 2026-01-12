const express = require('express');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');
const { User } = require('../models');
const mfaService = require('../services/mfaService');
const tokenService = require('../services/tokenService');
const { appLogger } = require('../config/logger');
const { mfaVerifyLimiter, strictLimiter } = require('../middleware/rateLimiters');
const { mfaVerifySchema } = require('../validation/schemas/auth.schemas');

const router = express.Router();

// POST /api/mfa/setup - Initialize MFA for user
router.post('/setup', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user role is Admin or Manager
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ 
        error: 'MFA is only available for Admin and Manager roles' 
      });
    }

    // Generate TOTP secret
    const { secret, qrCodeUrl, manualEntryKey } = await mfaService.generateSecret(user);

    // Don't save to database yet - wait for verification
    // Store secret temporarily in response for verification
    res.json({
      message: 'MFA setup initiated. Please scan the QR code and verify.',
      secret: secret,
      qrCodeUrl,
      manualEntryKey
    });
  } catch (error) {
    appLogger.error('❌ Error in MFA setup:', error);
    next(error);
  }
});

// POST /api/mfa/verify-setup - Confirm MFA setup by verifying first TOTP code
router.post('/verify-setup', authMiddleware, async (req, res, next) => {
  try {

    const { token, secret } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user role is Admin or Manager
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ 
        error: 'MFA is only available for Admin and Manager roles' 
      });
    }

    // Create temporary user object with the secret for verification
    const tempUser = {
      ...user.toJSON(),
      mfaSecret: secret
    };

    // Verify the token
    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please try again.' 
      });
    }

    // Generate backup codes
    const { codes, hashedCodes } = await mfaService.generateBackupCodes();

    // Save MFA configuration to database
    await mfaService.enableMFA(user, secret, hashedCodes);

    appLogger.info('✅ MFA setup completed', {
      userId: user.id,
      email: user.email
    });

    res.json({
      message: 'MFA has been successfully enabled for your account',
      backupCodes: codes,
      warning: 'Save these backup codes in a secure location. They will only be shown once.'
    });
  } catch (error) {
    appLogger.error('❌ Error in MFA verify-setup:', error);
    next(error);
  }
});

// POST /api/mfa/verify - Verify TOTP during login
router.post('/verify', mfaVerifyLimiter, async (req, res, next) => {
  try {

    const { tempToken, token } = req.body;

    // Verify temporary token
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(tempToken, secret);
      
      if (decoded.type !== 'mfa-temp') {
        return res.status(401).json({ error: 'Invalid temporary token' });
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Temporary token has expired. Please log in again.' 
        });
      }
      return res.status(401).json({ error: 'Invalid temporary token' });
    }

    // Get user with MFA details
    const user = await User.scope('withPassword').findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this account' });
    }

    // Verify TOTP
    const verified = await mfaService.verifyTOTP(user, token);

    if (!verified) {
      const lockStatus = mfaService.checkMfaLockout(user);
      
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          error: `Too many failed attempts. Account locked for ${lockStatus.lockTimeRemaining} minutes.` 
        });
      }

      return res.status(401).json({ 
        error: 'Invalid verification code',
        attemptsRemaining: lockStatus.attemptsRemaining
      });
    }

    // MFA verification successful - issue full tokens
    const { accessToken, refreshToken } = await tokenService.issueTokens(user);
    await user.update({ lastLogin: new Date() });

    const userData = await User.findByPk(user.id);

    appLogger.info('✅ MFA verification successful - full login', {
      userId: user.id,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    appLogger.error('❌ Error in MFA verify:', error);
    next(error);
  }
});

// POST /api/mfa/backup-codes/verify - Use backup code during login
router.post('/backup-codes/verify', mfaVerifyLimiter, async (req, res, next) => {
  try {

    const { tempToken, backupCode } = req.body;

    // Verify temporary token
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(tempToken, secret);
      
      if (decoded.type !== 'mfa-temp') {
        return res.status(401).json({ error: 'Invalid temporary token' });
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Temporary token has expired. Please log in again.' 
        });
      }
      return res.status(401).json({ error: 'Invalid temporary token' });
    }

    // Get user with MFA details
    const user = await User.scope('withPassword').findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this account' });
    }

    // Verify and consume backup code
    const verified = await mfaService.consumeBackupCode(user, backupCode.toUpperCase());

    if (!verified) {
      const lockStatus = mfaService.checkMfaLockout(user);
      
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          error: `Too many failed attempts. Account locked for ${lockStatus.lockTimeRemaining} minutes.` 
        });
      }

      return res.status(401).json({ 
        error: 'Invalid or already used backup code',
        attemptsRemaining: lockStatus.attemptsRemaining
      });
    }

    // Backup code verification successful - issue full tokens
    const { accessToken, refreshToken } = await tokenService.issueTokens(user);
    await user.update({ lastLogin: new Date() });

    const userData = await User.findByPk(user.id);

    // Reload user to get updated backup codes count
    const updatedUser = await User.findByPk(user.id);
    const remainingBackupCodes = updatedUser.mfaBackupCodes 
      ? updatedUser.mfaBackupCodes.filter(bc => !bc.used).length 
      : 0;

    appLogger.info('✅ Backup code verification successful', {
      userId: user.id,
      email: user.email,
      remainingBackupCodes
    });

    res.json({
      message: 'Login successful using backup code',
      token: accessToken,
      refreshToken,
      user: userData,
      warning: remainingBackupCodes <= 2 
        ? `Only ${remainingBackupCodes} backup codes remaining. Consider generating new ones.`
        : null
    });
  } catch (error) {
    appLogger.error('❌ Error in backup code verify:', error);
    next(error);
  }
});

// POST /api/mfa/backup-codes/generate - Generate new backup codes
router.post('/backup-codes/generate', authMiddleware, strictLimiter, async (req, res, next) => {
  try {

    const { password } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this account' });
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate new backup codes
    const { codes, hashedCodes } = await mfaService.generateBackupCodes();

    // Update user with new backup codes
    await user.update({ mfaBackupCodes: hashedCodes });

    appLogger.info('🔑 New backup codes generated', {
      userId: user.id,
      email: user.email
    });

    res.json({
      message: 'New backup codes generated successfully',
      backupCodes: codes,
      warning: 'Save these backup codes in a secure location. They will only be shown once.'
    });
  } catch (error) {
    appLogger.error('❌ Error generating backup codes:', error);
    next(error);
  }
});

// POST /api/mfa/disable - Disable MFA
router.post('/disable', authMiddleware, strictLimiter, async (req, res, next) => {
  try{

    const { password } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not currently enabled for this account' });
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable MFA
    await mfaService.disableMFA(user);

    appLogger.info('⚠️  MFA disabled', {
      userId: user.id,
      email: user.email
    });

    res.json({
      message: 'MFA has been disabled for your account'
    });
  } catch (error) {
    appLogger.error('❌ Error disabling MFA:', error);
    next(error);
  }
});

// GET /api/mfa/status - Check MFA status
router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const backupCodesCount = user.mfaBackupCodes 
      ? user.mfaBackupCodes.filter(bc => !bc.used).length 
      : 0;

    res.json({
      mfaEnabled: user.mfaEnabled,
      role: user.role,
      canEnableMfa: user.role === 'admin' || user.role === 'manager',
      backupCodesRemaining: user.mfaEnabled ? backupCodesCount : null
    });
  } catch (error) {
    appLogger.error('❌ Error checking MFA status:', error);
    next(error);
  }
});

module.exports = router;
