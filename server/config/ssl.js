const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function detectSSLFiles(certPath, keyPath) {
  try {
    const certExists = fs.existsSync(certPath);
    const keyExists = fs.existsSync(keyPath);
    
    if (certExists && keyExists) {
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error reading SSL certificate files:', error.message);
    return null;
  }
}

function autoDetectSSL() {
  const sslDir = path.join(__dirname, '../ssl');
  const possiblePaths = [
    { cert: path.join(sslDir, 'cert.pem'), key: path.join(sslDir, 'key.pem') },
    { cert: path.join(sslDir, 'certificate.pem'), key: path.join(sslDir, 'private-key.pem') },
    { cert: path.join(sslDir, 'server.crt'), key: path.join(sslDir, 'server.key') },
    { cert: path.join(sslDir, 'fullchain.pem'), key: path.join(sslDir, 'privkey.pem') }
  ];

  for (const paths of possiblePaths) {
    const credentials = detectSSLFiles(paths.cert, paths.key);
    if (credentials) {
      console.log(`🔒 SSL certificates detected: ${paths.cert}`);
      return credentials;
    }
  }

  return null;
}

function createServer(app, config) {
  const isProduction = config.nodeEnv === 'production';
  const sslEnabled = config.ssl && config.ssl.enabled;
  
  if (isProduction && sslEnabled) {
    let sslCredentials = null;
    
    if (config.ssl.certPath && config.ssl.keyPath) {
      sslCredentials = detectSSLFiles(config.ssl.certPath, config.ssl.keyPath);
    }
    
    if (!sslCredentials) {
      sslCredentials = autoDetectSSL();
    }
    
    if (sslCredentials) {
      console.log('🔐 Creating HTTPS server for production...');
      const httpsServer = https.createServer(sslCredentials, app);
      
      const httpApp = require('express')();
      httpApp.get('*', (req, res) => {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        res.redirect(301, httpsUrl);
      });
      
      const httpServer = http.createServer(httpApp);
      httpServer.listen(80, () => {
        console.log('🔄 HTTP redirect server listening on port 80 (redirecting to HTTPS)');
      });
      
      return httpsServer;
    } else {
      // SSL was requested but certificates are missing - update config to reflect actual state
      console.warn('⚠️  SSL enabled but no certificates found. Falling back to HTTP.');
      console.warn('   To enable HTTPS, place SSL certificates in one of:');
      console.warn('   - server/ssl/cert.pem and server/ssl/key.pem');
      console.warn('   - Or set SSL_CERT_PATH and SSL_KEY_PATH environment variables');
      console.warn('   🔓 Server is running on HTTP (not HTTPS) - SSL status updated to false');
      
      // Mutate config to reflect actual server state (HTTP, not HTTPS)
      config.ssl.enabled = false;
      
      return http.createServer(app);
    }
  }
  
  if (isProduction) {
    console.log('ℹ️  Production mode: SSL not enabled. Set SSL_ENABLED=true to enable HTTPS.');
  } else {
    console.log('🔧 Development mode: Using HTTP server');
  }
  
  return http.createServer(app);
}

module.exports = {
  createServer,
  detectSSLFiles,
  autoDetectSSL
};
