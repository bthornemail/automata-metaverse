#!/bin/bash

# Production Environment Setup Script
# This script sets up and starts production environment

set -e

echo "🚀 Setting up Automaton Production Environment..."

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

# Build and start services
echo "🔨 Building and starting production services..."
docker compose -f docker-compose.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f docker-compose.yml ps

# Health checks
echo "🏥 Running health checks..."

# Check backend health
if curl -f http://localhost:5555/api/status > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

# Check Redis
if docker compose -f docker-compose.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is not responding"
fi

# Check Prometheus
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Prometheus is healthy"
else
    echo "⚠️  Prometheus is not responding"
fi

# Check Grafana
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Grafana is healthy"
else
    echo "⚠️  Grafana is not responding"
fi

echo ""
echo "🎉 Production environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5555"
echo "   WebSocket: ws://localhost:9001"
echo "   Redis: localhost:6379"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana: http://localhost:3001"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker compose -f docker-compose.yml logs -f"
echo "   Stop services: docker compose -f docker-compose.yml down"
echo "   Restart services: docker compose -f docker-compose.yml restart"
echo ""
echo "📊 Monitoring:"
echo "   Grafana Dashboard: http://localhost:3001"
echo "   Prometheus: http://localhost:9090"
echo "   Alertmanager: http://localhost:9093"