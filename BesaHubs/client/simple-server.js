const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Main route serves the demo
app.get('/', (req, res) => {
  const demoPath = path.join(__dirname, 'demo.html');
  res.sendFile(demoPath);
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'dashboard.html');
  res.sendFile(dashboardPath);
});

// API endpoints for development
app.get('/api/*', (req, res) => {
  res.json({ 
    message: 'CRE Pro API - Backend Ready',
    features: [
      'User Authentication & Authorization',
      'Property Management System', 
      'Contact & Lead Management',
      'Deal Pipeline Tracking',
      'Task Management',
      'Document Management',
      'Reporting & Analytics',
      'Third-party Integrations'
    ],
    note: 'Full backend API available at http://localhost:5000' 
  });
});

app.listen(port, () => {
  console.log('🏢 CRE Pro - Commercial Real Estate CRM');
  console.log('='.repeat(60));
  console.log(`✅ Landing Page: http://localhost:${port}`);
  console.log('📊 Professional CRE management platform ready!');
  console.log('');
  console.log('🌟 Features Available:');
  console.log('  ✓ Professional landing page with CRE focus');
  console.log('  ✓ Sign up & Sign in modals with demo data');
  console.log('  ✓ Mobile-responsive design');
  console.log('  ✓ Industry-specific value proposition');
  console.log('  ✓ Feature showcase and testimonials');
  console.log('  ✓ Free trial call-to-action');
  console.log('');
  console.log('🔐 Demo Interaction:');
  console.log('  • Click "Sign In" or "Start Free Trial"');
  console.log('  • Demo credentials pre-filled');
  console.log('  • Experience the full sign-up flow');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('  • Users land on professional homepage');
  console.log('  • Sign up flow captures CRE-specific data');
  console.log('  • Full React CRM dashboard integration ready');
  console.log('='.repeat(60));
});