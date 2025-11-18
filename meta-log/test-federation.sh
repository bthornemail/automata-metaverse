#!/bin/bash
# Test script for meta-log federation

set -e

echo "=== Testing meta-log Federation ==="

# Determine Emacs server socket
EMACS_SOCKET="${EMACS_SOCKET:-/tmp/emacs1000/server}"
if [ -n "$EMACS_SERVER_SOCKET" ]; then
    EMACS_SOCKET="$EMACS_SERVER_SOCKET"
fi

# Test 1: Check if Emacs server is running
echo "Test 1: Checking Emacs server..."
if emacsclient -s "$EMACS_SOCKET" -e "(progn (message \"Server is running\") t)" > /dev/null 2>&1; then
    echo "✓ Emacs server is running"
else
    echo "⚠ Emacs server is not running (skipping server tests)"
    echo "  To test with server, start Emacs with: emacs --daemon"
    echo "  Or set EMACS_SOCKET environment variable"
    SERVER_AVAILABLE=false
fi

# Test 2: Check if meta-log is loaded (if server available)
if [ "$SERVER_AVAILABLE" != "false" ]; then
    echo "Test 2: Checking meta-log package..."
    if emacsclient -s "$EMACS_SOCKET" -e "(require 'meta-log)" > /dev/null 2>&1; then
        echo "✓ meta-log package is loaded"
    else
        echo "✗ meta-log package failed to load"
        SERVER_AVAILABLE=false
    fi
fi

# Test 3: Test crypto module (standalone or via server)
echo "Test 3: Testing crypto module..."
if [ "$SERVER_AVAILABLE" != "false" ]; then
    RESULT=$(emacsclient -s "$EMACS_SOCKET" -e "(progn (require 'meta-log-crypto) (let ((mnemonic (meta-log-crypto-generate-mnemonic 128))) (if mnemonic \"OK\" \"FAIL\")))" 2>&1)
else
    RESULT=$(emacs --batch -l cl-lib.el -l org.el -l meta-log-crypto.el -eval "(let ((mnemonic (meta-log-crypto-generate-mnemonic 128))) (if mnemonic (princ \"OK\") (princ \"FAIL\")))" 2>&1)
fi
if echo "$RESULT" | grep -q "OK"; then
    echo "✓ Crypto module: mnemonic generation works"
else
    echo "✗ Crypto module: mnemonic generation failed"
    echo "  Output: $RESULT"
fi

# Test 4: Test identity module
echo "Test 4: Testing identity module..."
if [ "$SERVER_AVAILABLE" != "false" ]; then
    RESULT=$(emacsclient -s "$EMACS_SOCKET" -e "(progn (require 'meta-log-identity) (let ((identity (meta-log-identity-create-peer))) (if identity \"OK\" \"FAIL\")))" 2>&1)
else
    RESULT=$(emacs --batch -l cl-lib.el -l org.el -l meta-log-crypto.el -l meta-log-identity.el -eval "(let ((identity (meta-log-identity-create-peer))) (if identity (princ \"OK\") (princ \"FAIL\")))" 2>&1)
fi
if echo "$RESULT" | grep -q "OK"; then
    echo "✓ Identity module: peer creation works"
else
    echo "✗ Identity module: peer creation failed"
    echo "  Output: $RESULT"
fi

# Test 5: Test MQTT connection (if broker available)
echo "Test 5: Testing MQTT connection..."
if command -v mosquitto_pub > /dev/null 2>&1; then
    if timeout 2 mosquitto_pub -h localhost -p 1883 -t test/topic -m "test" > /dev/null 2>&1; then
        echo "✓ MQTT broker is accessible"
    else
        echo "⚠ MQTT broker is not accessible (may not be running)"
        echo "  Start with: docker-compose up mqtt-broker"
    fi
else
    echo "⚠ mosquitto_pub not found (skipping MQTT test)"
    echo "  Install with: sudo apt install mosquitto-clients"
fi

# Test 6: Test protocol handlers
if [ "$SERVER_AVAILABLE" != "false" ]; then
    echo "Test 6: Testing protocol handlers..."
    RESULT=$(emacsclient -s "$EMACS_SOCKET" -e "(progn (require 'meta-log-protocol) (if (gethash \"canvasl\" meta-log-protocol--handlers) \"OK\" \"FAIL\"))" 2>&1)
    if echo "$RESULT" | grep -q "OK"; then
        echo "✓ Protocol handlers: canvasl:// handler registered"
    else
        echo "✗ Protocol handlers: canvasl:// handler not registered"
        echo "  Output: $RESULT"
    fi
else
    echo "Test 6: Skipping (server not available)"
fi

# Test 7: Test federation initialization
echo "Test 7: Testing federation initialization..."
TEST_FILE="/tmp/test-blackboard.org"
if [ "$SERVER_AVAILABLE" != "false" ]; then
    RESULT=$(emacsclient -s "$EMACS_SOCKET" -e "(progn (require 'meta-log-federation) (let ((blackboard \"$TEST_FILE\")) (meta-log-federation-create-blackboard blackboard) (if (file-exists-p blackboard) \"OK\" \"FAIL\")))" 2>&1)
else
    RESULT=$(emacs --batch -l cl-lib.el -l org.el -l json.el -l meta-log-crypto.el -l meta-log-identity.el -l meta-log-mqtt.el -l meta-log-webrtc.el -l meta-log-federation.el -eval "(let ((blackboard \"$TEST_FILE\")) (meta-log-federation-create-blackboard blackboard) (if (file-exists-p blackboard) (princ \"OK\") (princ \"FAIL\")))" 2>&1)
fi
if echo "$RESULT" | grep -q "OK"; then
    echo "✓ Federation: blackboard creation works"
    rm -f "$TEST_FILE"
else
    echo "✗ Federation: blackboard creation failed"
    echo "  Output: $RESULT"
fi

echo ""
echo "=== Federation Tests Complete ==="

