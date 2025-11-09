#!/bin/bash

# Test Agent API Endpoints
# This script tests all Agent API endpoints to verify they're working correctly

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
API_KEY="${API_KEY:-test-api-key}"

echo "🧪 Testing Agent API Endpoints"
echo "Base URL: $BASE_URL"
echo ""

# Check if server is running
echo "Checking if server is running..."
if ! curl -s --connect-timeout 2 "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo ""
    echo "Please start the backend server first:"
    echo "  cd /home/main/automaton"
    echo "  npm run dev"
    echo ""
    echo "Or use:"
    echo "  ./start-dev.sh"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing: $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
            -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 200)..."
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/health" "Health check endpoint"

# Test 2: List Agents
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Agent Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/agents" "List all agents"

# Test 3: Get Specific Agent
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Get Agent Details"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/agents/0D-Topology-Agent" "Get 0D-Topology-Agent details"

# Test 4: Get Agent Status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Agent Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/agents/0D-Topology-Agent/status" "Get agent status"

# Test 5: Execute Operation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Execute Operation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "POST" "/agents/execute" "Execute agent operation" \
    '{"agentId":"0D-Topology-Agent","operation":"query","parameters":{"query":"test"}}'

# Test 6: Execute with Invalid Agent
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Error Handling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Testing: Invalid agent ID ... "
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/agents/Invalid-Agent" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" 2>&1)
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code - Correctly returns 404)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code - Expected 404)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
