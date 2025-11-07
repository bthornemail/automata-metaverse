# 🚀 Production Deployment Guide

## Repository & Domain Information

- **GitHub Repository**: https://github.com/bthornemail/automaton
- **Domain**: universallifeprotocol.com
- **IP Address**: 172.238.45.134
- **DNS**: ns1.linode.com, ns2.linode.com, ns3.linode.com, ns4.linode.com

## Production Deployment Options

### Option 1: LoadBalancer Services (Recommended for Linode)

**Files**: `k8s/production-loadbalancer.yaml`

```bash
kubectl apply -f k8s/production-loadbalancer.yaml
```

**Access URLs**:
- **Frontend**: http://<LOADBALANCER_IP> (from Linode LB)
- **Backend API**: http://<BACKEND_LB_IP>:5555

### Option 2: Ingress with TLS (Advanced)

**Files**: `k8s/production-ingress.yaml`

**Prerequisites**:
```bash
# Install cert-manager for TLS certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@universallifeprotocol.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

**Deploy Ingress**:
```bash
kubectl apply -f k8s/production-ingress.yaml
```

**Access URLs**:
- **Main App**: https://universallifeprotocol.com/
- **API**: https://universallifeprotocol.com/api/status
- **API Subdomain**: https://api.universallifeprotocol.com/

## DNS Configuration

### Update DNS Records
Point your domain to the LoadBalancer IP:

```bash
# Get LoadBalancer IP
kubectl get service automaton-frontend-lb -n automaton
```

**DNS Records to configure**:
```
A Record: universallifeprotocol.com → <LOADBALANCER_IP>
A Record: api.universallifeprotocol.com → <LOADBALANCER_IP>
```

## Production Optimizations

### 1. Resource Limits
Already configured in `k8s/local-deployment.yaml`:
- Backend: 250m CPU, 256Mi memory (requests)
- Frontend: 250m CPU, 256Mi memory (requests)
- Redis: 100m CPU, 128Mi memory (requests)

### 2. Horizontal Pod Autoscaling
**Files**: `k8s/02-ingress-and-scaling.yaml`

```bash
kubectl apply -f k8s/02-ingress-and-scaling.yaml
```

**Features**:
- Backend: 2-10 replicas, 70% CPU, 80% memory
- Frontend: 2-6 replicas, 70% CPU
- Smart scaling with stabilization windows

### 3. Security Hardening

**Network Policies**:
```bash
kubectl apply -f k8s/security/network-policies.yaml
```

**Pod Security Policies**:
```bash
kubectl apply -f k8s/security/policy-constraints.yaml
```

### 4. Monitoring Stack

**Deploy Monitoring**:
```bash
kubectl apply -f k8s/03-monitoring.yaml
```

**Includes**:
- Prometheus for metrics collection
- Grafana for visualization
- AlertManager for notifications

## Deployment Commands

### Full Production Deployment
```bash
# 1. Deploy core application
kubectl apply -f k8s/local-deployment.yaml

# 2. Add LoadBalancer services
kubectl apply -f k8s/production-loadbalancer.yaml

# 3. Enable autoscaling
kubectl apply -f k8s/02-ingress-and-scaling.yaml

# 4. Add monitoring (optional)
kubectl apply -f k8s/03-monitoring.yaml

# 5. Add security policies (optional)
kubectl apply -f k8s/security/
```

### Verify Deployment
```bash
# Check all resources
kubectl get all -n automaton

# Check LoadBalancer IPs
kubectl get service -n automaton | grep LoadBalancer

# Check application status
curl http://<LOADBALANCER_IP>/api/status
```

## GitHub Actions CI/CD

### Update Repository
Your GitHub repository already has CI/CD workflows in `.github/workflows/`:

- `ci-cd.yml`: Main CI/CD pipeline
- `performance.yml`: Performance testing
- `security.yml`: Security scanning

### CI/CD Features
- **Build & Test**: Automated on push
- **Docker Registry**: Push to container registry
- **Kubernetes Deploy**: Auto-deploy to production
- **Rollback**: Automatic on failure
- **Monitoring**: Health checks and alerts

## Environment Configuration

### Production Environment Variables
```bash
# Create production ConfigMap
kubectl create configmap automaton-prod-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=API_RATE_LIMIT=100 \
  -n automaton

# Create production Secrets
kubectl create secret generic automaton-prod-secrets \
  --from-literal=DATABASE_URL=your-prod-db-url \
  --from-literal=JWT_SECRET=your-jwt-secret \
  -n automaton
```

## Backup & Disaster Recovery

### Automated Backups
```bash
# Backup etcd
kubectl get secrets -n kube-system etcd-backup

# Backup application data
kubectl exec -n automaton deployment/redis-deployment -- redis-cli BGSAVE
```

### Disaster Recovery
```bash
# Restore from backup
kubectl apply -f k8s/backup/restore.yaml

# Verify restoration
kubectl get pods -n automaton
```

## Performance Tuning

### Database Optimization
- Redis persistence enabled
- Connection pooling configured
- Query optimization indexes

### Application Caching
- Nginx static file caching
- Redis session storage
- API response caching

### CDN Integration
```yaml
# Add to Ingress annotations
nginx.ingress.kubernetes.io/configuration-snippet: |
  more_set_headers "X-CDN-Cache-Status: HIT";
```

## Security Checklist

### ✅ Implemented
- [x] Network policies
- [x] Pod security policies
- [x] RBAC configuration
- [x] TLS certificates (cert-manager)
- [x] Rate limiting
- [x] Security scanning in CI/CD

### 🔄 To Configure
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] Security audit logging
- [ ] Vulnerability scanning

## Monitoring & Alerting

### Key Metrics
- **Application**: Response time, error rate, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Business**: User sessions, API calls, feature usage

### Alert Channels
- **Email**: ops@universallifeprotocol.com
- **Slack**: #automaton-alerts
- **PagerDuty**: Critical incidents

---

**🎯 Ready for production deployment on Linode with your domain!**