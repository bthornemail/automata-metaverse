# Deployment Configuration - PM2, Docker & Kubernetes

## ✅ Configuration Status: COMPLETE

All deployment configurations have been aligned and verified.

## Port Configuration

**Default Ports:**
- HTTP API: `3000` (configurable via `PORT` env var)
- WebSocket: `3001` (configurable via `WS_PORT` env var)

All configurations (PM2, Docker, K8s) use port 3000 as default.

## PM2 Configuration

**File:** `ecosystem.config.js`

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs automaton-backend
```

**Environments:**
- `env`: Development (PORT=3000, WS_PORT=3001)
- `env_production`: Production (PORT=3000, WS_PORT=3001)
- `env_net`: Net domain (PORT=3000, WS_PORT=3001)
- `env_online`: Online domain (PORT=3000, WS_PORT=3001)

## Docker Configuration

**Files:**
- `Dockerfile.backend` - Backend API container
- `Dockerfile.ui` - Frontend UI container
- `docker-compose.yml` - Multi-container setup

**Build & Run:**
```bash
# Build backend
docker build -f Dockerfile.backend -t automaton-backend:latest .

# Build frontend
docker build -f Dockerfile.ui -t automaton-frontend:latest .

# Run with docker-compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Included JSONL Files:**
- automaton.jsonl
- automaton-kernel.jsonl
- automaton-kernel.seed.jsonl
- automaton.canvas.space.jsonl
- generate.metaverse.jsonl
- r5rs-functions-trie.jsonl

**Health Checks:**
- Backend: `http://localhost:3000/api/status`
- Frontend: `http://localhost:3000/health`

## Kubernetes Configuration

**Files:**
- `k8s/01-automaton-deployment.yaml` - Main deployment
- `k8s/config/config.yaml` - ConfigMap
- `k8s/backend/backend-deployment.yaml` - Backend deployment

**Deploy:**
```bash
# Create namespace
kubectl create namespace automaton

# Apply configurations
kubectl apply -f k8s/01-automaton-deployment.yaml
kubectl apply -f k8s/config/config.yaml

# Check status
kubectl get pods -n automaton
kubectl get services -n automaton

# View logs
kubectl logs -f deployment/backend-deployment -n automaton
```

**Ports:**
- Container: 3000 (HTTP), 3001 (WebSocket)
- Service: 3000 (HTTP), 3001 (WebSocket)
- Health checks: `/api/status` on port 3000

## Health Check Endpoints

**Available Endpoints:**
- `/health` - Simple health check
- `/api/health` - API health check
- `/api/status` - Detailed status

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890
}
```

## Environment Variables

**Key Variables:**
- `PORT` - HTTP port (default: 3000)
- `WS_PORT` - WebSocket port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)

## Verification

All configurations have been verified:
- ✅ Port consistency across PM2, Docker, K8s
- ✅ JSONL files included in Docker builds
- ✅ Health checks configured
- ✅ Environment variables allow override
- ✅ Volume mounts for JSONL files in Docker
- ✅ ConfigMaps and Secrets in K8s

## Notes

- Port 3000 is the default for all environments
- Can be overridden via `PORT` environment variable
- All JSONL files are accessible via `/api/jsonl/:file` endpoint
- Health checks are configured for all deployment methods
