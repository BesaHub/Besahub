const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { encryptValue, decryptValue } = require('../utils/encryption');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [12, 255],
      isComplexPassword(value) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
        if (!passwordRegex.test(value)) {
          throw new Error('Password must contain at least 12 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
        }
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'agent', 'assistant'),
    defaultValue: 'agent'
  },
  title: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 100]
    }
  },
  department: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 100]
    }
  },
  avatar: {
    type: DataTypes.STRING
  },
  licenseNumber: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 50]
    }
  },
  licenseState: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 2]
    }
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 4),
    validate: {
      min: 0,
      max: 1
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING
  },
  passwordResetToken: {
    type: DataTypes.STRING
  },
  passwordResetExpires: {
    type: DataTypes.DATE
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastFailedLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: {
        email: true,
        sms: true,
        browser: true
      },
      theme: 'light',
      language: 'en',
      timezone: 'America/New_York'
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      properties: ['read', 'create', 'update'],
      contacts: ['read', 'create', 'update'],
      deals: ['read', 'create', 'update'],
      reports: ['read'],
      admin: []
    }
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mfaSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  mfaBackupCodes: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  mfaFailedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  mfaLockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletionRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  deletionRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataExportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  lastDataExport: {
    type: DataTypes.DATE,
    allowNull: true
  },
  firstRunCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  underscored: true,
  hooks: {
    /**
     * SECURITY: Encrypt PII and hash passwords before creating user
     * - Password: bcrypt hashing (for authentication)
     * - Email: pgcrypto encryption (for privacy)
     */
    beforeCreate: async (user) => {
      // Hash password
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // Encrypt PII fields if ENCRYPTION_KEY is set
      try {
        if (process.env.ENCRYPTION_KEY && user.email) {
          user.email = await encryptValue(user.email);
        }
      } catch (error) {
        // Log warning but don't fail - allows gradual rollout of encryption
        console.warn('⚠️ User email encryption failed:', error.message);
      }
    },
    
    /**
     * SECURITY: Encrypt changed PII fields and hash new passwords on update
     */
    beforeUpdate: async (user) => {
      // Hash password if changed
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // Encrypt email if changed
      try {
        if (process.env.ENCRYPTION_KEY && user.changed('email') && user.email) {
          user.email = await encryptValue(user.email);
        }
      } catch (error) {
        console.warn('⚠️ User email encryption failed:', error.message);
      }
    },
    
    /**
     * SECURITY: Decrypt PII fields after reading from database
     */
    afterFind: async (result) => {
      if (!result || !process.env.ENCRYPTION_KEY) return;
      
      const decryptUser = async (user) => {
        if (!user) return;
        
        try {
          if (user.email && Buffer.isBuffer(user.email)) {
            user.email = await decryptValue(user.email);
          }
        } catch (error) {
          console.warn('⚠️ User email decryption failed:', error.message);
        }
      };
      
      // Handle both single instance and arrays
      if (Array.isArray(result)) {
        await Promise.all(result.map(decryptUser));
      } else {
        await decryptUser(result);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password', 'passwordResetToken', 'emailVerificationToken', 'refreshToken', 'mfaSecret', 'mfaBackupCodes'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  },
  indexes: [
    { fields: ['role'] },
    { fields: ['is_active'] },
    { fields: [{ attribute: 'last_login', order: 'DESC' }] },
    { fields: ['role', 'is_active'] }
  ]
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.hasPermission = async function(resource, action) {
  const { Role, Permission, UserRole } = require('./index');
  
  const userRoles = await UserRole.findAll({
    where: { userId: this.id },
    include: [{
      model: Role,
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        where: { resource, action },
        required: false
      }]
    }]
  });

  return userRoles.some(ur => 
    ur.Role && ur.Role.permissions && ur.Role.permissions.length > 0
  );
};

User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

User.prototype.incLoginAttempts = async function() {
  this.lastFailedLogin = new Date();
  
  if (this.lockUntil && this.lockUntil < new Date()) {
    return await this.update({
      loginAttempts: 1,
      lockUntil: null,
      lastFailedLogin: new Date()
    });
  }
  
  const updates = {
    loginAttempts: this.loginAttempts + 1,
    lastFailedLogin: new Date()
  };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  return await this.update(updates);
};

User.prototype.resetLoginAttempts = async function() {
  return await this.update({
    loginAttempts: 0,
    lockUntil: null,
    lastFailedLogin: null
  });
};

User.prototype.isMfaLocked = function() {
  return !!(this.mfaLockUntil && this.mfaLockUntil > new Date());
};

User.prototype.incMfaAttempts = async function() {
  if (this.mfaLockUntil && this.mfaLockUntil < new Date()) {
    return await this.update({
      mfaFailedAttempts: 1,
      mfaLockUntil: null
    });
  }
  
  const updates = {
    mfaFailedAttempts: this.mfaFailedAttempts + 1
  };
  
  if (this.mfaFailedAttempts + 1 >= 5 && !this.isMfaLocked()) {
    updates.mfaLockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  return await this.update(updates);
};

User.prototype.resetMfaAttempts = async function() {
  return await this.update({
    mfaFailedAttempts: 0,
    mfaLockUntil: null
  });
};

module.exports = User;