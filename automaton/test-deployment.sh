#!/bin/bash

# Test script for Automaton Kubernetes Deployment
# Tests all critical functionality

set -e

MINIKUBE_IP=$(minikube ip)
FRONTEND_URL="https://$MINIKUBE_IP"
API_URL="https://$MINIKUBE_IP"

echo "🧪 Testing Automaton Kubernetes Deployment"
echo "=========================================="
echo "Minikube IP: $MINIKUBE_IP"
echo ""

# Test 1: Frontend Access
echo "📱 Test 1: Frontend Access"
echo "Testing: curl -k -H \"Host: universallifeprotocol.com\" $FRONTEND_URL/"
if curl -k -s -H "Host: universallifeprotocol.com" "$FRONTEND_URL/" | grep -q "Automaton UI"; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible"
    exit 1
fi
echo ""

# Test 2: Backend API Status
echo "🔧 Test 2: Backend API Status"
echo "Testing: curl -k -H \"Host: api.universallifeprotocol.com\" $API_URL/api/status"
if curl -k -s -H "Host: api.universallifeprotocol.com" "$API_URL/api/status" | grep -q "\"success\":true"; then
    echo "✅ Backend API responding"
else
    echo "❌ Backend API not responding"
    exit 1
fi
echo ""

# Test 3: Automaton Start
echo "🚀 Test 3: Automaton Start"
echo "Testing: POST /api/automaton/start"
if curl -k -s -H "Host: api.universallifeprotocol.com" -X POST \
    -H "Content-Type: application/json" \
    -d '{"intervalMs": 1000, "maxIterations": 2}' \
    "$API_URL/api/automaton/start" | grep -q "\"success\":true"; then
    echo "✅ Automaton start successful"
else
    echo "❌ Automaton start failed"
    exit 1
fi
echo ""

# Test 4: Check Running Status
echo "📊 Test 4: Check Running Status"
sleep 2
if curl -k -s -H "Host: api.universallifeprotocol.com" "$API_URL/api/status" | grep -q "\"isRunning\":true"; then
    echo "✅ Automaton is running"
else
    echo "❌ Automaton not running"
    exit 1
fi
echo ""

# Test 5: Automaton Stop
echo "🛑 Test 5: Automaton Stop"
if curl -k -s -H "Host: api.universallifeprotocol.com" -X POST \
    "$API_URL/api/automaton/stop" | grep -q "\"success\":true"; then
    echo "✅ Automaton stop successful"
else
    echo "❌ Automaton stop failed"
    exit 1
fi
echo ""

# Test 6: Pod Status
echo "🏥 Test 6: Pod Health Check"
BACKEND_PODS=$(kubectl get pods -n automaton -l app=backend,component=api --field-selector=status.phase=Running --no-headers | wc -l)
FRONTEND_PODS=$(kubectl get pods -n automaton -l app=frontend --field-selector=status.phase=Running --no-headers | wc -l)
REDIS_PODS=$(kubectl get pods -n automaton -l app=redis --field-selector=status.phase=Running --no-headers | wc -l)

if [ "$BACKEND_PODS" -ge 1 ]; then
    echo "✅ Backend pods running: $BACKEND_PODS"
else
    echo "❌ No backend pods running"
    exit 1
fi

if [ "$FRONTEND_PODS" -ge 1 ]; then
    echo "✅ Frontend pods running: $FRONTEND_PODS"
else
    echo "❌ No frontend pods running"
    exit 1
fi

if [ "$REDIS_PODS" -ge 1 ]; then
    echo "✅ Redis pods running: $REDIS_PODS"
else
    echo "❌ No Redis pods running"
    exit 1
fi
echo ""

# Test 7: Services Status
echo "🔌 Test 7: Services Status"
if kubectl get service backend-service -n automaton &>/dev/null; then
    echo "✅ Backend service exists"
else
    echo "❌ Backend service missing"
    exit 1
fi

if kubectl get service frontend-service -n automaton &>/dev/null; then
    echo "✅ Frontend service exists"
else
    echo "❌ Frontend service missing"
    exit 1
fi

if kubectl get service redis-service -n automaton &>/dev/null; then
    echo "✅ Redis service exists"
else
    echo "❌ Redis service missing"
    exit 1
fi
echo ""

# Test 8: Ingress Status
echo "🌐 Test 8: Ingress Status"
if kubectl get ingress automaton-secure-ingress -n automaton &>/dev/null; then
    echo "✅ Secure ingress exists"
else
    echo "❌ Secure ingress missing"
    exit 1
fi

# Test 9: Certificate Status
echo "🔐 Test 9: Certificate Status"
if kubectl get certificate automaton-selfsigned-cert -n automaton &>/dev/null; then
    echo "✅ Self-signed certificate exists"
else
    echo "❌ Self-signed certificate missing"
    exit 1
fi
echo ""

echo "🎉 All Tests Passed!"
echo "===================="
echo "✅ Frontend accessible via HTTPS"
echo "✅ Backend API functional"
echo "✅ Automaton operations working"
echo "✅ All pods running healthy"
echo "✅ Services configured correctly"
echo "✅ Ingress and TLS working"
echo ""
echo "🌐 Access URLs:"
echo "Frontend: curl -k -H \"Host: universallifeprotocol.com\" $FRONTEND_URL/"
echo "API: curl -k -H \"Host: api.universallifeprotocol.com\" $API_URL/api/status"
echo ""
echo "🚀 Ready for production deployment to Linode!"