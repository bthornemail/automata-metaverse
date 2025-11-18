#!/bin/bash
# Docker test script for meta-log federation

set -e

echo "=== Docker Federation Test ==="

# Check if docker-compose is available
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "Error: docker compose not found"
    echo "Install with: sudo apt install docker-compose"
    exit 1
fi

cd "$(dirname "$0")"

echo "1. Building Docker images..."
$COMPOSE_CMD build

echo "2. Starting services..."
$COMPOSE_CMD up -d

echo "3. Waiting for services to be ready..."
sleep 5

echo "4. Testing MQTT broker..."
if docker exec meta-log-meta-log-1 mosquitto_pub -h mqtt-broker -p 1883 -t test/topic -m "test" 2>&1; then
    echo "✓ MQTT broker is accessible"
else
    echo "✗ MQTT broker test failed"
fi

echo "5. Testing Emacs server..."
if docker exec meta-log-meta-log-1 emacsclient -s /tmp/emacs1000/server -e "(progn (message \"Server test\") t)" 2>&1 | grep -q "t"; then
    echo "✓ Emacs server is running"
else
    echo "✗ Emacs server test failed"
fi

echo "6. Testing federation modules..."
docker exec meta-log-meta-log-1 bash -c "cd /root/.emacs.d/meta-log && emacs --batch -eval \"(add-to-list 'load-path \\\"/root/.emacs.d/meta-log\\\")\" -l test-federation.el -f test-federation-all" 2>&1

echo "7. Stopping services..."
$COMPOSE_CMD down

echo ""
echo "=== Docker Test Complete ==="

