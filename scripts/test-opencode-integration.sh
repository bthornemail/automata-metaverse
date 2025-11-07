#!/bin/bash

# Test script for opencode integration with domain configurations

echo "=== OpenCode Integration Test Suite ==="
echo ""

# Test 1: Basic opencode integration
echo "Test 1: Basic opencode integration"
node opencode-integration.cjs status
echo ""

# Test 2: Read command
echo "Test 2: Read command"
node opencode-integration.cjs execute read .env.example | head -10
echo ""

# Test 3: Bash command
echo "Test 3: Bash command"
node opencode-integration.cjs execute bash "ls -la *.json" | head -10
echo ""

# Test 4: Environment variable test
echo "Test 4: Environment variable test"
DOMAIN_COM="universallifeprotocol.com" node opencode-integration.cjs execute bash "echo 'Domain: \$DOMAIN_COM'"
echo ""

# Test 5: Canvas update test
echo "Test 5: Canvas update test"
node opencode-integration.cjs execute bash "echo 'Canvas test' > /tmp/test.txt"
node opencode-integration.cjs execute read /tmp/test.txt
echo ""

# Test 6: Integration report
echo "Test 6: Integration report"
node opencode-integration.cjs report
echo ""

echo "=== Test Suite Complete ==="