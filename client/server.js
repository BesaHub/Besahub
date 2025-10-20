const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static/css', express.static(path.join(__dirname, 'src/assets/styles')));

// API endpoints for development
app.get('/api/*', (req, res) => {
  res.json({ 
    message: 'CRE Pro API', 
    note: 'Connect to backend at http://localhost:5000' 
  });
});

// Serve the main React app for all routes
app.get('*', (req, res) => {
  // Read and modify the HTML template
  const indexPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Replace placeholders
  html = html.replace(/%PUBLIC_URL%/g, '');
  
  res.send(html);
});

app.listen(port, () => {
  console.log('🏢 CRE Pro - Commercial Real Estate CRM');
  console.log('='.repeat(50));
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log('📊 Professional CRE management platform');
  console.log('🚀 Landing page, authentication, and full CRM ready');
  console.log('');
  console.log('Features:');
  console.log('  • Professional landing page');
  console.log('  • User authentication (Sign up/Sign in)');
  console.log('  • Commercial property management');
  console.log('  • Contact and lead management');
  console.log('  • Deal pipeline tracking');
  console.log('  • Task management');
  console.log('  • Document management');
  console.log('  • Reporting and analytics');
  console.log('');
  console.log('Demo Access:');
  console.log('  Email: admin@crecrm.com');
  console.log('  Password: password123');
  console.log('='.repeat(50));
});