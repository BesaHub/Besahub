const { Notification } = require('../models');
const { appLogger } = require('../config/logger');

class NotificationService {
  async create(notificationData, io = null) {
    try {
      const notification = await Notification.create(notificationData);
      
      if (io) {
        io.to(`user_${notification.userId}`).emit('notification:new', notification);
        appLogger.info('Real-time notification sent', {
          service: 'notification-service',
          notificationId: notification.id,
          userId: notification.userId,
          type: notification.type
        });
      }
      
      return notification;
    } catch (error) {
      appLogger.error('Error creating notification', {
        service: 'notification-service',
        error: error.message
      });
      throw error;
    }
  }

  async getUserNotifications(userId, { limit = 20, offset = 0, status = null, type = null }) {
    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return { notifications: rows, total: count };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.update(
      { status: 'read', readAt: new Date() },
      { where: { userId, status: 'unread' } }
    );
  }

  async getUnreadCount(userId) {
    return await Notification.count({
      where: { userId, status: 'unread' }
    });
  }
}

module.exports = new NotificationService();
