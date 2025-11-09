---
id: pm2-readme
title: "PM2 Process Management"
level: practical
type: guide
tags: [pm2, process-management, production, deployment]
keywords: [pm2-process-management, pm2-configuration, production-deployment, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [deployment-guide]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, deployment-guide, production-deployment-guide]
readingTime: 20
difficulty: 2
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

# PM2 Process Management

This project includes PM2 configuration for production-ready process management.

## Quick Start

```bash
# Development mode
npm run pm2:start

# Production mode
npm run pm2:start:prod

# Using deployment script
npm run deploy:pm2          # Development
npm run deploy:pm2:prod     # Production
```

## PM2 Scripts

| Script | Description |
|--------|-------------|
| `pm2:start` | Start application in development mode |
| `pm2:start:prod` | Start application in production mode |
| `pm2:stop` | Stop the application |
| `pm2:restart` | Restart the application |
| `pm2:delete` | Remove application from PM2 |
| `pm2:logs` | View application logs |
| `pm2:monit` | Open PM2 monitoring dashboard |
| `pm2:status` | Check application status |
| `pm2:save` | Save current process list |
| `pm2:startup` | Setup PM2 to start on system boot |

## Configuration

The PM2 configuration is defined in `ecosystem.config.js`:

- **Instances**: 1 (can be scaled)
- **Auto-restart**: Enabled
- **Memory limit**: 1GB
- **Log files**: Stored in `./logs/` directory
- **Environment variables**: 
  - Development: `NODE_ENV=development`, `PORT=5555`, `WS_PORT=5556`
  - Production: `NODE_ENV=production`, `PORT=5555`, `WS_PORT=5556`

## Deployment

### Automated Deployment

```bash
# Development deployment
./deploy-pm2.sh

# Production deployment
./deploy-pm2.sh production
```

### Manual Deployment

```bash
# 1. Build the application
npm run build

# 2. Start with PM2
pm2 start ecosystem.config.js --env production

# 3. Save configuration
pm2 save

# 4. Setup startup script
pm2 startup
```

## Monitoring

```bash
# View real-time logs
pm2 logs automaton-backend

# Monitor dashboard
pm2 monit

# Check status
pm2 status

# View detailed information
pm2 show automaton-backend
```

## Log Files

- **Error log**: `./logs/automaton-error.log`
- **Output log**: `./logs/automaton-out.log`
- **Combined log**: `./logs/automaton-combined.log`

## Troubleshooting

### Application not starting
```bash
# Check logs
pm2 logs automaton-backend --err

# Check configuration
pm2 show automaton-backend

# Restart
pm2 restart automaton-backend
```

### Memory issues
```bash
# Monitor memory usage
pm2 monit

# Check current memory
pm2 show automaton-backend | grep memory
```

### Performance monitoring
```bash
# Install pm2-logrotate for log management
pm2 install pm2-logrotate

# View metrics
pm2 show automaton-backend
```

## Production Best Practices

1. **Always use production environment**: `npm run pm2:start:prod`
2. **Save configuration**: `npm run pm2:save` after making changes
3. **Monitor logs regularly**: `npm run pm2:logs`
4. **Set up startup script**: `npm run pm2:startup`
5. **Use deployment script**: `npm run deploy:pm2:prod`

## URLs

- **API**: http://localhost:5555/api
- **WebSocket**: ws://localhost:5556
- **Health check**: http://localhost:5555/api/health