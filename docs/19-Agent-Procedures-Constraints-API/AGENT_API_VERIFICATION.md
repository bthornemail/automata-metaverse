# Agent API Backend Verification Guide

**Last Updated**: 2025-11-09  
**Status**: ✅ Verification Guide

## Overview

This guide provides instructions for verifying that the Agent API backend endpoints are working correctly.

---

## Prerequisites

1. **Backend Server Running**: The backend server must be running on port 3000
2. **Dependencies Installed**: All npm dependencies installed
3. **Environment Variables**: API keys configured (if required)

---

## Starting the Backend Server

### Option 1: Development Mode

```bash
cd /home/main/automaton
npm run dev
```

This starts the server using `ts-node-dev` with hot reload.

### Option 2: Using Start Script

```bash
cd /home/main/automaton
./start-dev.sh
```

### Option 3: Production Mode

```bash
cd /home/main/automaton
npm run build
npm start
```

### Option 4: Using PM2

```bash
cd /home/main/automaton
npm run pm2:start
```

---

## Verification Methods

### Method 1: Automated Test Script

Run the automated test script:

```bash
cd /home/main/automaton
./scripts/test-agent-api.sh
```

**Expected Output**:
```
🧪 Testing Agent API Endpoints
Base URL: http://localhost:3000/api

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing: Health check endpoint ... ✓ PASS (HTTP 200)
  Response: {"status":"ok","agents":{"total":10,"healthy":10},"timestamp":...}

...
```

### Method 2: Manual cURL Tests

#### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "agents": {
    "total": 10,
    "healthy": 10
  },
  "timestamp": 1234567890
}
```

#### 2. List All Agents

```bash
curl http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "0D-Topology-Agent",
      "name": "0D Topology Agent",
      "dimension": "0D",
      "status": "active",
      "capabilities": ["topology", "identity", "church-encoding"],
      ...
    },
    ...
  ],
  "timestamp": 1234567890
}
```

#### 3. Get Specific Agent

```bash
curl http://localhost:3000/api/agents/0D-Topology-Agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "0D-Topology-Agent",
    "name": "0D Topology Agent",
    "dimension": "0D",
    "status": "active",
    ...
  },
  "timestamp": 1234567890
}
```

#### 4. Get Agent Status

```bash
curl http://localhost:3000/api/agents/0D-Topology-Agent/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "active"
  },
  "timestamp": 1234567890
}
```

#### 5. Execute Operation

```bash
curl -X POST http://localhost:3000/api/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key" \
  -d '{
    "agentId": "0D-Topology-Agent",
    "operation": "query",
    "parameters": {
      "query": "test"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "result": "..."
  },
  "agentId": "0D-Topology-Agent",
  "operation": "query",
  "duration": 123.45,
  "timestamp": 1234567890
}
```

### Method 3: Unit Tests

Run the unit tests:

```bash
cd /home/main/automaton
npm test src/__tests__/agent-api.test.ts
```

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |
| GET | `/api/agents` | Optional | List all agents |
| GET | `/api/agents/:id` | Optional | Get agent details |
| GET | `/api/agents/:id/status` | Optional | Get agent status |
| POST | `/api/agents/execute` | Required | Execute operation |

---

## Troubleshooting

### Server Not Running

**Error**: `HTTP 000` or connection refused

**Solution**:
1. Check if server is running: `ps aux | grep node`
2. Start the server: `npm run dev`
3. Check port availability: `lsof -i :3000`

### Authentication Errors

**Error**: `401 Unauthorized` or `403 Forbidden`

**Solution**:
1. Check API key is set: `echo $API_KEY`
2. Include API key in headers: `-H "X-API-Key: your-api-key"`
3. For execute endpoint, ensure you're authenticated

### Agent Not Found

**Error**: `404 Not Found` for agent ID

**Solution**:
1. Verify agent exists: `curl http://localhost:3000/api/agents`
2. Check agent ID spelling (case-sensitive)
3. Ensure agent service initialized correctly

### Rate Limiting

**Error**: `429 Too Many Requests`

**Solution**:
1. Wait before retrying
2. Check rate limit configuration
3. Use authenticated requests for higher limits

---

## Expected Test Results

When all tests pass, you should see:

```
✅ All tests passed!
Passed: 6
Failed: 0
Total: 6
```

---

## Next Steps

After verification:
1. ✅ Test frontend integration
2. ✅ Test workflow execution
3. ✅ Test coordination features
4. ✅ Monitor performance

---

**Status**: ✅ Verification Guide Complete  
**Last Updated**: 2025-11-09
