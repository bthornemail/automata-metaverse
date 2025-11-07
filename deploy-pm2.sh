#!/bin/bash

# PM2 Deployment Script for Automaton Backend
# Usage: ./deploy-pm2.sh [development|production]

set -e

ENVIRONMENT=${1:-development}
APP_NAME="automaton-backend"

echo "🚀 Deploying Automaton Backend with PM2..."
echo "📊 Environment: $ENVIRONMENT"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Build the application
echo "🏗️ Building application..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing process if running
if pm2 list | grep -q "$APP_NAME"; then
    echo "🛑 Stopping existing process..."
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
fi

# Start the application
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌟 Starting in production mode..."
    pm2 start ecosystem.config.js --env production
else
    echo "🔧 Starting in development mode..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "🔧 Setting up PM2 startup..."
pm2 startup

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 PM2 Commands:"
echo "  pm2 status          - Check status"
echo "  pm2 logs $APP_NAME  - View logs"
echo "  pm2 restart $APP_NAME - Restart application"
echo "  pm2 monit           - Monitor dashboard"
echo ""
echo "🌐 Application URLs:"
echo "  API: http://localhost:5555/api"
echo "  WebSocket: ws://localhost:5556"