# Environment Variables Setup Guide

## Overview
All three deployment environments now use centralized `.env` variables for configuration management.

## Files Created/Updated

### 1. Environment Files
- **`.env`** - Production environment variables (DO NOT commit to version control)
- **`.env.example`** - Template for version control

### 2. PM2 Configuration
- **`ecosystem.config.js`** - Updated to load `.env` and support multiple domains
  - `env_production` - For universallifeprotocol.com
  - `env_net` - For universallifeprotocol.net  
  - `env_online` - For universallifeprotocol.online

### 3. Docker Compose Files
- **`docker-compose.production.yml`** - Updated with `${VARIABLE}` syntax
- **`docker-compose.online.yml`** - Updated with `${VARIABLE}` syntax

### 4. Kubernetes Configuration
- **`k8s/01-automaton-deployment.yaml`** - Updated ConfigMap with all variables
- **`k8s/config/env-configmap.yaml`** - Template for generating from .env
- **`scripts/generate-k8s-config.sh`** - Script to generate K8s resources from .env

## Usage

### PM2 Deployment (.com)
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your values

# Deploy with PM2
pm2 start ecosystem.config.js --env production    # .com domain
pm2 start ecosystem.config.js --env_net           # .net domain
pm2 start ecosystem.config.js --env_online        # .online domain
```

### Docker Deployment (.online)
```bash
# Configure environment
cp .env.example .env
# Edit .env with your values

# Deploy with Docker
docker-compose -f docker-compose.online.yml up -d
```

### Kubernetes Deployment (.net)
```bash
# Configure environment
cp .env.example .env
# Edit .env with your values

# Generate and apply Kubernetes resources
./scripts/generate-k8s-config.sh
kubectl apply -f k8s/
```

## Key Environment Variables

### Domain Configuration
- `DOMAIN_COM`, `DOMAIN_NET`, `DOMAIN_ONLINE`
- `BASE_URL_COM`, `BASE_URL_NET`, `BASE_URL_ONLINE`
- `API_URL_COM`, `API_URL_NET`, `API_URL_ONLINE`
- `WS_URL_COM`, `WS_URL_NET`, `WS_URL_ONLINE`

### Application Configuration
- `NODE_ENV`, `PORT`, `WS_PORT`, `LOG_LEVEL`
- `REDIS_URL`, `REDIS_PASSWORD`
- `JWT_SECRET`, `SESSION_SECRET`, `CORS_ORIGIN`

### Feature Flags
- `ENABLE_MONITORING`, `ENABLE_SSL`, `ENABLE_RATE_LIMITING`, `ENABLE_WEBSOCKETS`

### Performance Configuration
- `MAX_MEMORY_RESTART`, `MIN_UPTIME`, `MAX_RESTARTS`, `RESTART_DELAY`

## Security Notes

1. **Never commit `.env` to version control**
2. **Always use `.env.example` as template**
3. **Generate strong secrets for production:**
   ```bash
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For SESSION_SECRET
   ```

## Deployment Commands Summary

```bash
# PM2 (.com)
pm2 start ecosystem.config.js --env production

# Docker (.online)
docker-compose -f docker-compose.online.yml up -d

# Kubernetes (.net)
./scripts/generate-k8s-config.sh && kubectl apply -f k8s/
```

All environments now use centralized environment variable management!