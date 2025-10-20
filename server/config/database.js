const { Sequelize } = require('sequelize');
require('dotenv').config();

// Enhanced database configuration for production
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cre_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      connectTimeout: 60000,
      socketTimeout: 60000,
      keepAlive: true
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    benchmark: process.env.NODE_ENV === 'development',
    logQueryParameters: process.env.NODE_ENV === 'development',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
      evict: parseInt(process.env.DB_POOL_EVICT) || 1000,
      handleDisconnects: true
    },
    retry: {
      max: 5,
      match: [
        /SQLITE_BUSY/,
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Enable soft deletes
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    hooks: {
      beforeConnect: (config) => {
        console.log('🔗 Attempting database connection...');
      },
      afterConnect: (connection, config) => {
        console.log(`📊 Database connected successfully to ${config.host}:${config.port}`);
      },
      beforeDisconnect: (connection) => {
        console.log('🔌 Disconnecting from database...');
      }
    }
  }
);

// Test the connection with retry logic
const testConnection = async (retries = 5) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Log connection info
    const databaseVersion = await sequelize.query('SELECT version()', { 
      type: Sequelize.QueryTypes.SELECT 
    });
    console.log(`📦 PostgreSQL Version: ${databaseVersion[0].version.split(' ')[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    
    if (retries > 0 && process.env.NODE_ENV === 'production') {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return testConnection(retries - 1);
    }

    // In production, if DB connection fails, log error but don't exit
    // This allows the app to start and serve static files
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Database connection failed in production. App will start without DB.');
      return false;
    }

    // In development, don't exit the process if DB connection fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Database connection failed in development. App will continue without DB.');
      return false;
    }
    
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    return false;
  }
};

// Database health check
const checkDBHealth = async () => {
  try {
    const startTime = Date.now();
    await sequelize.query('SELECT 1', { type: Sequelize.QueryTypes.SELECT });
    const responseTime = Date.now() - startTime;
    
    const [connectionCount] = await sequelize.query(
      "SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    return {
      status: 'healthy',
      responseTime,
      activeConnections: connectionCount.connections,
      poolSize: {
        total: sequelize.connectionManager.pool._count,
        used: sequelize.connectionManager.pool._draining ? sequelize.connectionManager.pool._draining.length : 0,
        waiting: sequelize.connectionManager.pool._pendingAcquires.length
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: null
    };
  }
};

// Get database statistics
const getDBStats = async () => {
  try {
    // Get database size
    const [dbSize] = await sequelize.query(
      `SELECT pg_size_pretty(pg_database_size('${process.env.DB_NAME || 'cre_crm'}')) as size`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get table statistics
    const tableStats = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
    `, { type: Sequelize.QueryTypes.SELECT });

    // Get connection info
    const [connectionInfo] = await sequelize.query(
      "SELECT count(*) as total_connections, count(*) FILTER (WHERE state = 'active') as active_connections FROM pg_stat_activity",
      { type: Sequelize.QueryTypes.SELECT }
    );

    return {
      database: process.env.DB_NAME || 'cre_crm',
      size: dbSize.size,
      connections: connectionInfo,
      tables: tableStats.length > 0 ? tableStats : 'No statistics available'
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      error: error.message
    };
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('📊 Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
  sequelize,
  testConnection,
  checkDBHealth,
  getDBStats,
  closeConnection
};