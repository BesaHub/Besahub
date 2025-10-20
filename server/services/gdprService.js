const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { appLogger } = require('../config/logger');
const auditLogService = require('./auditLogService');

class GDPRService {
  async exportUserData(userId) {
    try {
      const {
        User,
        Property,
        Contact,
        Deal,
        Task,
        Activity,
        Document,
        CallLog,
        EmailLog,
        Notification
      } = require('../models');

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password', 'passwordResetToken', 'emailVerificationToken', 'refreshToken', 'mfaSecret', 'mfaBackupCodes'] }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const [
        properties,
        contacts,
        deals,
        tasks,
        activities,
        documents,
        callLogs,
        emailLogs,
        notifications,
        auditLogs
      ] = await Promise.all([
        Property.findAll({
          where: {
            [Op.or]: [
              { ownerId: userId },
              { createdBy: userId }
            ]
          },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        Contact.findAll({
          where: {
            [Op.or]: [
              { assignedTo: userId },
              { createdBy: userId }
            ]
          },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        Deal.findAll({
          where: {
            [Op.or]: [
              { ownerId: userId },
              { createdBy: userId }
            ]
          },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        Task.findAll({
          where: {
            [Op.or]: [
              { assignedTo: userId },
              { createdBy: userId }
            ]
          },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        Activity.findAll({
          where: { userId },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        Document.findAll({
          where: { uploadedBy: userId },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        CallLog.findAll({
          where: { userId },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        EmailLog.findAll({
          where: { userId },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        Notification.findAll({
          where: { userId },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }),
        auditLogService.getAuditLogs({ userId, limit: 1000 })
      ]);

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId: user.id,
          formatVersion: '1.0',
          dataRetentionNotice: 'This export contains all personal data associated with your account as of the export date.'
        },
        user: user.toJSON(),
        properties: properties.map(p => p.toJSON()),
        contacts: contacts.map(c => c.toJSON()),
        deals: deals.map(d => d.toJSON()),
        tasks: tasks.map(t => t.toJSON()),
        activities: activities.map(a => a.toJSON()),
        documents: documents.map(d => d.toJSON()),
        callLogs: callLogs.map(cl => cl.toJSON()),
        emailLogs: emailLogs.map(el => el.toJSON()),
        notifications: notifications.map(n => n.toJSON()),
        auditLogs: auditLogs.logs || []
      };

      await user.update({
        dataExportCount: (user.dataExportCount || 0) + 1,
        lastDataExport: new Date()
      });

      appLogger.info('GDPR data export completed', {
        userId: user.id,
        email: user.email,
        exportSize: JSON.stringify(exportData).length
      });

      return exportData;
    } catch (error) {
      appLogger.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  async requestAccountDeletion(userId, password) {
    try {
      const { User } = require('../models');
      
      const user = await User.scope('withPassword').findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.deletionRequested) {
        throw new Error('Account deletion already requested');
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid password confirmation');
      }

      await user.update({
        deletionRequested: true,
        deletionRequestedAt: new Date(),
        isActive: false
      });

      appLogger.info('Account deletion requested', {
        userId: user.id,
        email: user.email,
        deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      return {
        message: 'Account deletion scheduled',
        deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        gracePeriodDays: 30
      };
    } catch (error) {
      appLogger.error('Error requesting account deletion:', error);
      throw error;
    }
  }

  async cancelAccountDeletion(userId) {
    try {
      const { User } = require('../models');
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.deletionRequested) {
        throw new Error('No deletion request found');
      }

      const gracePeriodEnd = new Date(user.deletionRequestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (new Date() > gracePeriodEnd) {
        throw new Error('Grace period expired, cannot cancel deletion');
      }

      await user.update({
        deletionRequested: false,
        deletionRequestedAt: null,
        isActive: true
      });

      appLogger.info('Account deletion cancelled', {
        userId: user.id,
        email: user.email
      });

      return {
        message: 'Account deletion cancelled successfully',
        accountRestored: true
      };
    } catch (error) {
      appLogger.error('Error cancelling account deletion:', error);
      throw error;
    }
  }

  async permanentlyDeleteUser(userId, isAdminForceDelete = false) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        User,
        Property,
        Contact,
        Deal,
        Task,
        Activity,
        Document,
        CallLog,
        EmailLog,
        Notification
      } = require('../models');

      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      if (!isAdminForceDelete && !user.deletionRequested) {
        await transaction.rollback();
        throw new Error('User has not requested deletion');
      }

      if (!isAdminForceDelete && user.deletionRequestedAt) {
        const gracePeriodEnd = new Date(user.deletionRequestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (new Date() < gracePeriodEnd) {
          await transaction.rollback();
          throw new Error('Grace period not expired');
        }
      }

      const userEmail = user.email;
      const deletedUserIdentifier = `deleted_user_${user.id}`;

      await Promise.all([
        Property.update(
          { ownerId: null, createdBy: null },
          { where: { [Op.or]: [{ ownerId: userId }, { createdBy: userId }] }, transaction }
        ),
        Contact.destroy({
          where: { [Op.or]: [{ assignedTo: userId }, { createdBy: userId }] },
          transaction
        }),
        Deal.update(
          { ownerId: null, createdBy: null },
          { where: { [Op.or]: [{ ownerId: userId }, { createdBy: userId }] }, transaction }
        ),
        Task.destroy({
          where: { [Op.or]: [{ assignedTo: userId }, { createdBy: userId }] },
          transaction
        }),
        Activity.destroy({
          where: { userId },
          transaction
        }),
        Document.destroy({
          where: { uploadedBy: userId },
          transaction
        }),
        CallLog.destroy({
          where: { userId },
          transaction
        }),
        EmailLog.destroy({
          where: { userId },
          transaction
        }),
        Notification.destroy({
          where: { userId },
          transaction
        })
      ]);

      await user.destroy({ transaction });

      await transaction.commit();

      appLogger.info('User permanently deleted', {
        userId,
        email: userEmail,
        isAdminForceDelete,
        deletedIdentifier: deletedUserIdentifier
      });

      return {
        message: 'User account permanently deleted',
        deletedUserId: userId,
        deletedUserIdentifier
      };
    } catch (error) {
      await transaction.rollback();
      appLogger.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  async processScheduledDeletions() {
    try {
      const { User } = require('../models');

      const gracePeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const usersToDelete = await User.findAll({
        where: {
          deletionRequested: true,
          deletionRequestedAt: {
            [Op.lte]: gracePeriodEnd
          }
        }
      });

      appLogger.info(`Processing ${usersToDelete.length} scheduled account deletions`);

      const results = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      };

      for (const user of usersToDelete) {
        results.processed++;
        try {
          await this.permanentlyDeleteUser(user.id, false);
          results.succeeded++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId: user.id,
            email: user.email,
            error: error.message
          });
          appLogger.error('Failed to delete user during scheduled deletion:', {
            userId: user.id,
            error: error.message
          });
        }
      }

      appLogger.info('Scheduled deletions processing completed', results);

      return results;
    } catch (error) {
      appLogger.error('Error processing scheduled deletions:', error);
      throw error;
    }
  }

  async checkDataExportRateLimit(userId) {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const dailyLimit = 3;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (user.lastDataExport) {
        const lastExportDate = new Date(user.lastDataExport);
        lastExportDate.setHours(0, 0, 0, 0);

        if (lastExportDate.getTime() === today.getTime() && user.dataExportCount >= dailyLimit) {
          return {
            allowed: false,
            message: `Daily export limit of ${dailyLimit} reached. Please try again tomorrow.`,
            exportsToday: user.dataExportCount,
            limit: dailyLimit
          };
        }
      }

      return {
        allowed: true,
        exportsToday: user.dataExportCount || 0,
        limit: dailyLimit
      };
    } catch (error) {
      appLogger.error('Error checking data export rate limit:', error);
      throw error;
    }
  }
}

module.exports = new GDPRService();
