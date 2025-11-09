---
id: docker-setup-guide
title: "Docker Development Setup Guide"
level: practical
type: guide
tags: [docker, docker-setup, development, containerization]
keywords: [docker-setup-guide, docker-development, containerization, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [environment-setup-guide]
enables: [deployment-guide]
related: [r5rs-canvas-engine, blackboard-architecture-guide, environment-setup-guide]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: null
  lastUpdate: null
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
    regeneration:
      function: "r5rs:parse-jsonl-canvas"
      args: ["generate.metaverse.jsonl"]
---

# 🐳 **Docker Development Setup - Fixed**

## ✅ **Issues Resolved**

### **1. Missing TypeScript Configuration**
- ✅ Created `tsconfig.json` for backend
- ✅ Updated `package.json` with proper dependencies and scripts
- ✅ Added ESLint and Jest configuration

### **2. Docker Configuration Issues**
- ✅ Fixed Dockerfile.backend to properly build TypeScript
- ✅ Created separate development Dockerfile (Dockerfile.backend.dev)
- ✅ Updated docker-compose.dev.yml to use correct Dockerfile
- ✅ Added proper volume mounts and environment variables

### **3. Frontend Build Configuration**
- ✅ Created production Dockerfile for frontend
- ✅ Added nginx configuration
- ✅ Fixed Vite configuration for development
- ✅ Added proper Tailwind and PostCSS configs

## 🚀 **Quick Start**

### **Development Environment**
```bash
# Start development environment
./start-dev.sh

# Or manually
docker compose -f docker-compose.dev.yml up --build -d
```

### **Production Environment**
```bash
# Start production environment
./start-prod.sh

# Or manually
docker compose -f docker-compose.yml up --build -d
```

## 📁 **Key Files Created/Fixed**

```
/home/main/automaton/
├── tsconfig.json                    # Backend TypeScript config
├── package.json                     # Backend dependencies
├── jest.config.js                   # Testing config
├── .eslintrc.js                    # Linting config
├── .dockerignore                    # Docker ignore file
├── Dockerfile.backend.dev           # Development backend
├── start-dev.sh                     # Development script
├── start-prod.sh                    # Production script
└── ui/
    ├── Dockerfile                   # Production frontend
    ├── nginx.conf                   # Nginx config
    ├── vite.config.ts              # Vite config
    ├── tailwind.config.js          # Tailwind config
    ├── postcss.config.js           # PostCSS config
    └── .dockerignore              # Frontend Docker ignore
```

## 🔧 **Development Features**

### **Backend Development**
- ✅ Hot reload with ts-node-dev
- ✅ TypeScript compilation on the fly
- ✅ Debugging support on port 9229
- ✅ Volume mounts for live code changes
- ✅ Environment-specific configuration

### **Frontend Development**
- ✅ Vite dev server with hot reload
- ✅ Proxy to backend API
- ✅ WebSocket support
- ✅ TypeScript support
- ✅ Tailwind CSS compilation

### **Production Features**
- ✅ Multi-stage builds for optimization
- ✅ Nginx reverse proxy
- ✅ Gzip compression
- ✅ Security headers
- ✅ Static asset optimization

## 📊 **Service URLs**

### **Development**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5555
- WebSocket: ws://localhost:9001
- Redis: localhost:6379
- Debug Port: 9229

### **Production**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5555
- WebSocket: ws://localhost:9001
- Redis: localhost:6379
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## 🐛 **Troubleshooting**

### **Common Issues**
```bash
# Check service status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f backend-dev
docker compose -f docker-compose.dev.yml logs -f frontend-dev

# Rebuild services
docker compose -f docker-compose.dev.yml up --build

# Clean up
docker compose -f docker-compose.dev.yml down -v
docker system prune -f
```

### **TypeScript Issues**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Rebuild backend
docker compose -f docker-compose.dev.yml exec backend-dev npm run build
```

### **Frontend Issues**
```bash
# Check Vite configuration
cd ui && npx vite --debug

# Rebuild frontend
docker compose -f docker-compose.dev.yml exec frontend-dev npm run build
```

## 🎯 **Next Steps**

1. **Run Development**: `./start-dev.sh`
2. **Access Application**: http://localhost:3000
3. **Check Logs**: `docker compose -f docker-compose.dev.yml logs -f`
4. **Start Coding**: Changes will auto-reload

**🎉 Docker Compose is now properly configured with TypeScript support!**