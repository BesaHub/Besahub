const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.PORT = '3000';

console.log('🚀 Starting CRE Pro development server...');
console.log('📍 Working directory:', __dirname);

// Try to start React development server
const reactScripts = path.join(__dirname, 'node_modules', '.bin', 'react-scripts');
const args = ['start'];

const child = spawn('node', [reactScripts, ...args], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    SKIP_PREFLIGHT_CHECK: 'true',
    GENERATE_SOURCEMAP: 'false',
    TSC_COMPILE_ON_ERROR: 'true',
    PORT: '3000'
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Development server exited with code ${code}`);
  }
  process.exit(code);
});

console.log('✅ React development server starting...');
console.log('🌐 Open http://localhost:3000 to view your CRE CRM');
console.log('💡 Use Ctrl+C to stop the server');