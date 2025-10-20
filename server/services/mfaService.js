const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { appLogger } = require('../config/logger');
const { User } = require('../models');

class MFAService {
  /**
   * Generate a TOTP secret for a user
   * @param {Object} user - User object
   * @returns {Object} - {secret: string, qrCodeUrl: string, manualEntryKey: string}
   */
  async generateSecret(user) {
    try {
      const secret = speakeasy.generateSecret({
        name: `BesaHubs CRM (${user.email})`,
        issuer: 'BesaHubs CRM',
        length: 32
      });

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      appLogger.info('🔐 MFA secret generated', {
        userId: user.id,
        email: user.email
      });

      return {
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32,
        otpauthUrl: secret.otpauth_url
      };
    } catch (error) {
      appLogger.error('❌ Error generating MFA secret:', error);
      throw new Error('Failed to generate MFA secret');
    }
  }

  /**
   * Verify TOTP token
   * @param {Object} user - User object with mfaSecret
   * @param {string} token - 6-digit TOTP code
   * @returns {boolean} - true if valid
   */
  async verifyTOTP(user, token) {
    try {
      if (!user.mfaSecret) {
        throw new Error('MFA is not set up for this user');
      }

      // Check if user is locked out
      if (user.isMfaLocked()) {
        const lockTimeRemaining = Math.ceil((user.mfaLockUntil - new Date()) / 1000 / 60);
        appLogger.warn('🔒 MFA verification attempted on locked account', {
          userId: user.id,
          lockTimeRemaining: `${lockTimeRemaining} minutes`
        });
        throw new Error(`Account is locked. Try again in ${lockTimeRemaining} minutes.`);
      }

      // Verify the token with a window of ±1 time step (30 seconds each)
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before and after (±60 seconds tolerance)
      });

      if (verified) {
        // Reset failed attempts on successful verification
        await user.resetMfaAttempts();
        
        appLogger.info('✅ MFA verification successful', {
          userId: user.id,
          email: user.email
        });
        
        return true;
      } else {
        // Increment failed attempts
        await user.incMfaAttempts();
        
        appLogger.warn('❌ MFA verification failed', {
          userId: user.id,
          email: user.email,
          attempts: user.mfaFailedAttempts + 1
        });
        
        return false;
      }
    } catch (error) {
      appLogger.error('❌ Error verifying TOTP:', error);
      throw error;
    }
  }

  /**
   * Generate backup codes
   * @returns {Object} - {codes: string[], hashedCodes: string[]}
   */
  async generateBackupCodes() {
    try {
      const codes = [];
      const hashedCodes = [];

      // Generate 10 random 8-character backup codes
      for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(code);
        
        // Hash the code before storing (bcrypt cost 10)
        const hashedCode = await bcrypt.hash(code, 10);
        hashedCodes.push({
          code: hashedCode,
          used: false,
          createdAt: new Date()
        });
      }

      appLogger.info('🔑 Backup codes generated', {
        count: codes.length
      });

      return {
        codes, // Plain text codes to show user once
        hashedCodes // Hashed codes to store in database
      };
    } catch (error) {
      appLogger.error('❌ Error generating backup codes:', error);
      throw new Error('Failed to generate backup codes');
    }
  }

  /**
   * Consume a backup code
   * @param {Object} user - User object with mfaBackupCodes
   * @param {string} code - Backup code to verify
   * @returns {boolean} - true if valid and not used
   */
  async consumeBackupCode(user, code) {
    try {
      if (!user.mfaBackupCodes || user.mfaBackupCodes.length === 0) {
        throw new Error('No backup codes available for this user');
      }

      // Check if user is locked out
      if (user.isMfaLocked()) {
        const lockTimeRemaining = Math.ceil((user.mfaLockUntil - new Date()) / 1000 / 60);
        appLogger.warn('🔒 Backup code verification attempted on locked account', {
          userId: user.id,
          lockTimeRemaining: `${lockTimeRemaining} minutes`
        });
        throw new Error(`Account is locked. Try again in ${lockTimeRemaining} minutes.`);
      }

      // Find a matching backup code that hasn't been used
      let foundValidCode = false;
      const updatedBackupCodes = [...user.mfaBackupCodes];

      for (let i = 0; i < updatedBackupCodes.length; i++) {
        const backupCode = updatedBackupCodes[i];
        
        if (!backupCode.used) {
          const isMatch = await bcrypt.compare(code, backupCode.code);
          
          if (isMatch) {
            // Mark this code as used
            updatedBackupCodes[i].used = true;
            updatedBackupCodes[i].usedAt = new Date();
            foundValidCode = true;
            break;
          }
        }
      }

      if (foundValidCode) {
        // Update user's backup codes
        await user.update({ mfaBackupCodes: updatedBackupCodes });
        
        // Reset failed attempts
        await user.resetMfaAttempts();
        
        appLogger.info('✅ Backup code verified and consumed', {
          userId: user.id,
          email: user.email,
          remainingCodes: updatedBackupCodes.filter(bc => !bc.used).length
        });
        
        return true;
      } else {
        // Increment failed attempts
        await user.incMfaAttempts();
        
        appLogger.warn('❌ Backup code verification failed', {
          userId: user.id,
          email: user.email,
          attempts: user.mfaFailedAttempts + 1
        });
        
        return false;
      }
    } catch (error) {
      appLogger.error('❌ Error consuming backup code:', error);
      throw error;
    }
  }

  /**
   * Check if user's account is locked due to failed MFA attempts
   * @param {Object} user - User object
   * @returns {Object} - {isLocked: boolean, lockTimeRemaining: number (minutes)}
   */
  checkMfaLockout(user) {
    if (user.isMfaLocked()) {
      const lockTimeRemaining = Math.ceil((user.mfaLockUntil - new Date()) / 1000 / 60);
      return {
        isLocked: true,
        lockTimeRemaining
      };
    }
    
    return {
      isLocked: false,
      attemptsRemaining: 5 - user.mfaFailedAttempts
    };
  }

  /**
   * Enable MFA for a user
   * @param {Object} user - User object
   * @param {string} secret - MFA secret
   * @param {Array} backupCodes - Hashed backup codes
   */
  async enableMFA(user, secret, backupCodes) {
    try {
      await user.update({
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: backupCodes,
        mfaFailedAttempts: 0,
        mfaLockUntil: null
      });

      appLogger.info('✅ MFA enabled for user', {
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      appLogger.error('❌ Error enabling MFA:', error);
      throw new Error('Failed to enable MFA');
    }
  }

  /**
   * Disable MFA for a user
   * @param {Object} user - User object
   */
  async disableMFA(user) {
    try {
      await user.update({
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        mfaFailedAttempts: 0,
        mfaLockUntil: null
      });

      appLogger.info('⚠️  MFA disabled for user', {
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      appLogger.error('❌ Error disabling MFA:', error);
      throw new Error('Failed to disable MFA');
    }
  }
}

module.exports = new MFAService();
