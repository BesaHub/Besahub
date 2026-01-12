const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Simple test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRE CRM Server is running!' });
});

// Serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CRE CRM - Server Running</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1976d2; margin-bottom: 20px; }
        .status { background: #e8f5e8; color: #2e7d32; padding: 10px; border-radius: 4px; margin: 20px 0; }
        .next-steps { background: #e3f2fd; padding: 20px; border-radius: 4px; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏢 CRE CRM Server</h1>
        <div class="status">✅ Backend server is running successfully on port ${PORT}!</div>
        
        <h3>System Status:</h3>
        <ul>
          <li>✅ Node.js server: Running</li>
          <li>✅ Express API: Active</li>
          <li>⚠️  Database: Not connected (PostgreSQL required)</li>
          <li>⚠️  React frontend: Not started</li>
        </ul>
        
        <div class="next-steps">
          <h3>Next Steps:</h3>
          <ol>
            <li>Install and configure PostgreSQL database</li>
            <li>Start the React frontend server</li>
            <li>Access the full CRM at <a href="http://localhost:3000">http://localhost:3000</a></li>
          </ol>
        </div>
        
        <p><strong>API Health Check:</strong> <a href="/api/health">/api/health</a></p>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 CRE CRM Test Server running on http://localhost:${PORT}`);
  console.log('📋 Backend is ready - PostgreSQL database connection needed for full functionality');
});