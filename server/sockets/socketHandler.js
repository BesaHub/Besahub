const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Store connected users
const connectedUsers = new Map();

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.userId = user.id;
      socket.user = user;
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);
    
    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Join organization/team rooms if applicable
    if (socket.user.organizationId) {
      socket.join(`org:${socket.user.organizationId}`);
    }

    // Handle property alert subscriptions
    socket.on('subscribe_property_alerts', (data) => {
      try {
        const { alertIds } = data;
        
        if (!Array.isArray(alertIds)) {
          return socket.emit('error', { message: 'Invalid alert IDs format' });
        }

        // Join alert-specific rooms
        alertIds.forEach(alertId => {
          socket.join(`alert:${alertId}`);
        });

        socket.emit('subscribed', { 
          alertIds, 
          message: 'Subscribed to property alerts' 
        });
        
        console.log(`📢 User ${socket.user.email} subscribed to ${alertIds.length} alerts`);
      } catch (error) {
        socket.emit('error', { message: 'Subscription failed' });
      }
    });

    // Handle unsubscribe from property alerts
    socket.on('unsubscribe_property_alerts', (data) => {
      try {
        const { alertIds } = data;
        
        alertIds.forEach(alertId => {
          socket.leave(`alert:${alertId}`);
        });

        socket.emit('unsubscribed', { 
          alertIds, 
          message: 'Unsubscribed from property alerts' 
        });
      } catch (error) {
        socket.emit('error', { message: 'Unsubscription failed' });
      }
    });

    // Handle deal updates subscriptions
    socket.on('subscribe_deals', (data) => {
      try {
        const { dealIds } = data;
        
        if (!Array.isArray(dealIds)) {
          return socket.emit('error', { message: 'Invalid deal IDs format' });
        }

        dealIds.forEach(dealId => {
          socket.join(`deal:${dealId}`);
        });

        socket.emit('subscribed_deals', { 
          dealIds, 
          message: 'Subscribed to deal updates' 
        });
      } catch (error) {
        socket.emit('error', { message: 'Deal subscription failed' });
      }
    });

    // Handle task notifications
    socket.on('subscribe_tasks', () => {
      socket.join(`tasks:${socket.userId}`);
      socket.emit('subscribed_tasks', { message: 'Subscribed to task notifications' });
    });

    // Handle market analysis updates
    socket.on('subscribe_market_analysis', (data) => {
      try {
        const { locations, propertyTypes } = data;
        
        locations.forEach(location => {
          socket.join(`market:${location}`);
        });

        propertyTypes.forEach(type => {
          socket.join(`market:${type}`);
        });

        socket.emit('subscribed_market', { 
          message: 'Subscribed to market analysis updates' 
        });
      } catch (error) {
        socket.emit('error', { message: 'Market analysis subscription failed' });
      }
    });

    // Handle real-time chat/messaging
    socket.on('join_conversation', (data) => {
      try {
        const { conversationId } = data;
        socket.join(`conversation:${conversationId}`);
        
        // Notify other participants that user joined
        socket.to(`conversation:${conversationId}`).emit('user_joined', {
          userId: socket.userId,
          userName: `${socket.user.firstName} ${socket.user.lastName}`,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('send_message', (data) => {
      try {
        const { conversationId, message, type = 'text' } = data;
        
        const messageData = {
          id: require('uuid').v4(),
          conversationId,
          senderId: socket.userId,
          senderName: `${socket.user.firstName} ${socket.user.lastName}`,
          message,
          type,
          timestamp: new Date()
        };

        // Broadcast to conversation participants
        io.to(`conversation:${conversationId}`).emit('new_message', messageData);
        
        // Store message in database (implement as needed)
        // await storeMessage(messageData);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle activity tracking
    socket.on('activity', (data) => {
      const userConnection = connectedUsers.get(socket.userId);
      if (userConnection) {
        userConnection.lastActivity = new Date();
      }
    });

    // Handle user status updates
    socket.on('update_status', (data) => {
      try {
        const { status } = data; // online, away, busy, offline
        
        // Update user status in database if needed
        // await updateUserStatus(socket.userId, status);
        
        // Broadcast status to team members
        socket.to(`org:${socket.user.organizationId}`).emit('user_status_changed', {
          userId: socket.userId,
          status,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        typing: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.email} (${reason})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Notify organization members
      socket.to(`org:${socket.user.organizationId}`).emit('user_disconnected', {
        userId: socket.userId,
        timestamp: new Date(),
        reason
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`🔌 Socket error for user ${socket.user.email}:`, error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to CRE CRM real-time service',
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [userId, connection] of connectedUsers.entries()) {
      if (now - connection.lastActivity > timeout) {
        const socket = io.sockets.sockets.get(connection.socketId);
        if (socket) {
          socket.disconnect(true);
        }
        connectedUsers.delete(userId);
        console.log(`🧹 Cleaned up inactive connection for user ${userId}`);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Utility functions for emitting events from API routes
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
};

const emitToRole = (io, role, event, data) => {
  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
};

const emitToOrganization = (io, organizationId, event, data) => {
  io.to(`org:${organizationId}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
};

const emitPropertyAlert = (io, alertId, propertyData) => {
  io.to(`alert:${alertId}`).emit('property_match', {
    alertId,
    property: propertyData,
    timestamp: new Date()
  });
};

const emitDealUpdate = (io, dealId, updateData) => {
  io.to(`deal:${dealId}`).emit('deal_updated', {
    dealId,
    update: updateData,
    timestamp: new Date()
  });
};

const emitMarketUpdate = (io, location, propertyType, marketData) => {
  io.to(`market:${location}`).emit('market_update', {
    location,
    propertyType,
    data: marketData,
    timestamp: new Date()
  });
  
  io.to(`market:${propertyType}`).emit('market_update', {
    location,
    propertyType,
    data: marketData,
    timestamp: new Date()
  });
};

const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  socketHandler,
  emitToUser,
  emitToRole,
  emitToOrganization,
  emitPropertyAlert,
  emitDealUpdate,
  emitMarketUpdate,
  getConnectedUsers,
  isUserConnected
};