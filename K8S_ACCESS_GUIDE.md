# 🌐 Automaton Kubernetes Access Guide

## Access Methods

### 1. NodePort (Recommended for Local Development)
**URL**: http://192.168.49.2:30080
- **Frontend**: http://192.168.49.2:30080/
- **API**: http://192.168.49.2:30080/api/status
- **Health**: http://192.168.49.2:30080/health

### 2. Ingress (Domain-based Access)
Add to `/etc/hosts`:
```bash
sudo echo '192.168.49.2 automaton.local api.automaton.local' >> /etc/hosts
```

**URLs**:
- **Main App**: http://automaton.local/
- **API**: http://automaton.local/api/status
- **API Subdomain**: http://api.automaton.local/api/status

### 3. Port Forwarding (Development)
```bash
kubectl port-forward -n automaton service/frontend-service 8080:80
```
**URL**: http://localhost:8080

## Service Configuration

### Current Services
```bash
kubectl get services -n automaton
```
- `automaton-nodeport`: NodePort 30080 → Frontend (External Access)
- `frontend-service`: ClusterIP 80 → Frontend (Internal)
- `backend-service`: ClusterIP 5555 → Backend API/WebSocket
- `redis-service`: ClusterIP 6379 → Redis Cache

### Ingress Rules
- `automaton.local/` → Frontend Service
- `automaton.local/api/*` → Backend Service
- `automaton.local/socket.io/*` → Backend WebSocket
- `api.automaton.local/*` → Backend Service

## Application Features

### Working Endpoints
- ✅ **HTTP API**: `/api/status`, `/api/health`
- ✅ **WebSocket**: Socket.IO on `/socket.io/` and `/ws`
- ✅ **Static Files**: React UI served correctly
- ✅ **Health Checks**: All probes passing

### Application Status
- **Backend**: Running with 69 loaded objects
- **Frontend**: Serving React UI with Three.js visualizations
- **Redis**: Cache operational
- **WebSocket**: Socket.IO attached to HTTP server

## Next Steps

### Production Deployment
1. Replace NodePort with LoadBalancer service
2. Configure TLS certificates
3. Set up proper domain names
4. Enable monitoring and logging

### Scaling
1. Configure Horizontal Pod Autoscalers (HPA)
2. Set resource limits and requests
3. Enable cluster autoscaling

### Monitoring
1. Deploy Prometheus and Grafana
2. Configure alerting rules
3. Set up log aggregation

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n automaton
```

### Check Services
```bash
kubectl get services -n automaton
```

### Check Ingress
```bash
kubectl get ingress -n automaton
```

### View Logs
```bash
kubectl logs -n automaton deployment/backend-deployment
kubectl logs -n automaton deployment/frontend-deployment
```

### Port Forwarding
```bash
kubectl port-forward -n automaton service/frontend-service 8080:80
```

---

**🎉 Kubernetes deployment is fully operational with multiple access methods!**