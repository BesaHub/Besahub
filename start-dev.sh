#!/bin/bash

# Set environment variables for development
export NODE_ENV=development
export DEMO_MODE=true

# Start the server
echo "🚀 Starting BesaHub CRM Server in Development Mode..."
echo "NODE_ENV: $NODE_ENV"
echo "DEMO_MODE: $DEMO_MODE"
echo ""

node server/index.js
