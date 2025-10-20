const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const socketHandler = require('./sockets/socketHandler');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL
    ].filter(Boolean),
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io accessible to routes
app.set('io', io);

// Initialize socket handlers
socketHandler(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for origins: ${JSON.stringify([
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL
  ].filter(Boolean))}`);
  console.log(`⚡ Socket.IO enabled`);
  console.log(`🔒 Security headers enabled`);
  console.log(`📝 Request logging enabled`);
});

// Export server for testing and graceful shutdown
module.exports = server;