#!/bin/bash

# Development Environment Setup Script
# This script sets up and starts the development environment

set -e

echo "🚀 Setting up Automaton Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies if needed
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "ui/node_modules" ]; then
    cd ui && npm install && cd ..
fi

# Build and start services
echo "🔨 Building and starting services..."
docker compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f docker-compose.dev.yml ps

# Health checks
echo "🏥 Running health checks..."

# Check backend health
if curl -f http://localhost:5555/api/status > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend is not responding yet (this is normal on first start)"
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "⚠️  Frontend is not responding yet (this is normal on first start)"
fi

# Check Redis
if docker compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is not responding"
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5555"
echo "   WebSocket: ws://localhost:9001"
echo "   Redis: localhost:6379"
echo ""
echo "🔧 Development Commands:"
echo "   View logs: docker compose -f docker-compose.dev.yml logs -f"
echo "   Stop services: docker compose -f docker-compose.dev.yml down"
echo "   Restart services: docker compose -f docker-compose.dev.yml restart"
echo ""
echo "🐛 Debugging:"
echo "   Backend debug port: 9229"
echo "   Attach debugger: chrome://inspect"
echo ""
echo "📝 To view logs in real-time:"
echo "   docker compose -f docker-compose.dev.yml logs -f backend-dev"
echo "   docker compose -f docker-compose.dev.yml logs -f frontend-dev"
echo "   docker compose -f docker-compose.dev.yml logs -f redis-dev"