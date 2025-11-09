---
id: deployment-guide
title: "Production Deployment Guide"
level: practical
type: guide
tags: [deployment, production, docker, kubernetes, helm, monitoring]
keywords: [production-deployment, deployment-guide, docker, kubernetes, helm, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [readme-main, environment-setup-guide]
enables: [k8s-access-guide, production-deployment-guide, docker-setup-guide]
related: [r5rs-canvas-engine, blackboard-architecture-guide, readme-main]
readingTime: 60
difficulty: 4
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

# 🚀 **Production Deployment Guide**

## Overview

This guide covers the complete deployment of the Computational Topology Canvas application using Docker, Kubernetes, and Helm with enterprise-grade monitoring and security.

## 📋 Prerequisites

### Infrastructure Requirements
- **Kubernetes Cluster**: v1.20+ with RBAC enabled
- **Ingress Controller**: nginx-ingress recommended
- **Container Registry**: Docker Hub, GitHub Container Registry, or private registry
- **Storage Class**: For persistent volumes (Redis, Prometheus)
- **Load Balancer**: For external access

### Tools Required
```bash
# Install required CLI tools
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh && ./get_helm.sh

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## 🐳 **Phase 1: Container Deployment**

### Local Development
```bash
# Clone repository
git clone https://github.com/automaton/automaton.git
cd automaton

# Development stack
docker-compose -f docker-compose.dev.yml up -d

# Production stack
docker-compose up -d
```

### Build Images
```bash
# Build backend
docker build -f Dockerfile.backend -t automaton/backend:latest .

# Build frontend
cd ui
docker build -f Dockerfile -t automaton/frontend:latest .
cd ..

# Tag and push
docker tag automaton/backend:latest your-registry/automaton-backend:v1.0.0
docker tag automaton/frontend:latest your-registry/automaton-frontend:v1.0.0

docker push your-registry/automaton-backend:v1.0.0
docker push your-registry/automaton-frontend:v1.0.0
```

## ☸️ **Phase 2: Kubernetes Deployment**

### Direct Kubernetes Manifests
```bash
# Apply manifests
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/config/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/monitoring/

# Wait for deployment
kubectl wait --for=condition=available deployment/automaton-backend -n automaton --timeout=300s
kubectl wait --for=condition=available deployment/automaton-frontend -n automaton --timeout=300s
```

### Helm Deployment (Recommended)
```bash
# Add dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install with default values
helm install automaton ./helm/automaton \
  --namespace automaton \
  --create-namespace

# Install with custom values
helm install automaton ./helm/automaton \
  --namespace automaton \
  --create-namespace \
  --values values-production.yaml \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=automaton.example.com
```

### Production Values Example
```yaml
# values-production.yaml
replicaCount: 5

image:
  registry: ghcr.io
  repository: automaton/backend
  tag: "v1.0.0"

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
  hosts:
    - host: automaton.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: automaton-tls
      hosts:
        - automaton.example.com

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20

monitoring:
  enabled: true
  serviceMonitor:
    enabled: true

security:
  networkPolicy:
    enabled: true
  rbac:
    enabled: true
```

## 🔒 **Phase 3: Security Hardening**

### Apply Security Policies
```bash
# Apply security manifests
kubectl apply -f k8s/security/

# Verify policies
kubectl get networkpolicies -n automaton-security
kubectl get rolebindings -n automaton-security
kubectl get podsecuritypolicies
```

### Enable Admission Controllers
```bash
# Install Gatekeeper
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system \
  --create-namespace

# Apply policy constraints
kubectl apply -f k8s/security/policy-constraints.yaml
```

### Security Validation
```bash
# Test security policies
kubectl run test-pod --image=nginx --restart=Never -n automaton-security
# Should be denied due to security policies

# Verify image signing
cosign verify ghcr.io/automaton/backend:v1.0.0
```

## 📊 **Phase 4: Monitoring Setup**

### Deploy Monitoring Stack
```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/prometheus-values.yaml

# Import Grafana dashboard
kubectl create configmap automaton-dashboard \
  --from-file=monitoring/grafana/dashboards/automaton-dashboard.json \
  --namespace monitoring

# Apply alerting rules
kubectl apply -f monitoring/prometheus/alerts.yml
```

### Configure Alertmanager
```bash
# Create Alertmanager secret
kubectl create secret generic alertmanager-config \
  --from-file=monitoring/alertmanager/alertmanager.yml \
  --namespace monitoring

# Update Prometheus to use Alertmanager
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set alertmanager.configSecret=alertmanager-config
```

## 🔄 **Phase 5: CI/CD Integration**

### GitHub Actions Setup
```bash
# Add required secrets to GitHub repository
# - GITHUB_TOKEN (automatic)
# - KUBE_CONFIG_PROD (base64 encoded kubeconfig)
# - KUBE_CONFIG_STAGING (base64 encoded kubeconfig)
# - SLACK_WEBHOOK (for notifications)
# - SNYK_TOKEN (for security scanning)
```

### Environment Configuration
```yaml
# .github/workflows/ci-cd.yml is already configured
# Just update the following:
# - Container registry URLs
# - Kubernetes cluster contexts
# - Notification channels
```

## 🚨 **Phase 6: Alerting Configuration**

### Slack Integration
```bash
# Create Slack app and get webhook URL
# Update alertmanager.yml with your webhook URL
kubectl apply -f monitoring/alertmanager/alertmanager.yml
```

### Email Configuration
```bash
# Update alertmanager.yml with SMTP settings
kubectl create secret generic smtp-credentials \
  --from-literal=username=alerts@automaton.example.com \
  --from-literal=password=your-smtp-password \
  --namespace monitoring
```

## 🧪 **Phase 7: Testing and Validation**

### Health Checks
```bash
# Check pod status
kubectl get pods -n automaton

# Check services
kubectl get services -n automaton

# Check ingress
kubectl get ingress -n automaton

# Test application
curl -k https://automaton.example.com/health
```

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load tests
artillery run tests/performance/load-test.yml

# Monitor during test
kubectl top pods -n automaton
```

### Security Testing
```bash
# Run security scan
trivy image ghcr.io/automaton/backend:v1.0.0
trivy image ghcr.io/automaton/frontend:v1.0.0

# Check network policies
kubectl exec -it deployment/automaton-backend -n automaton -- ping google.com
# Should fail due to network policies
```

## 📈 **Phase 8: Performance Optimization**

### Resource Tuning
```bash
# Monitor resource usage
kubectl top nodes
kubectl top pods -n automaton

# Adjust resource limits
helm upgrade automaton ./helm/automaton \
  --namespace automaton \
  --set backend.resources.limits.cpu=1000m \
  --set backend.resources.limits.memory=1Gi
```

### Autoscaling Configuration
```bash
# Enable HPA
kubectl autoscale deployment automaton-backend \
  --cpu-percent=80 \
  --min=3 \
  --max=20 \
  --namespace automaton

# Check HPA status
kubectl get hpa -n automaton
```

## 🔧 **Troubleshooting**

### Common Issues
```bash
# Pod not starting
kubectl describe pod <pod-name> -n automaton
kubectl logs <pod-name> -n automaton

# Ingress not working
kubectl get ingress -n automaton
kubectl describe ingress automaton-ingress -n automaton

# Certificate issues
kubectl get certificates -n automaton
kubectl describe certificate automaton-tls -n automaton

# Monitoring issues
kubectl get prometheus -n monitoring
kubectl logs prometheus-kube-prometheus-prometheus-0 -n monitoring
```

### Debug Commands
```bash
# Port forward for debugging
kubectl port-forward svc/automaton-backend 5555:5555 -n automaton
kubectl port-forward svc/automaton-frontend 3000:80 -n automaton

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3001:80 -n monitoring

# Access Prometheus
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
```

## 📚 **Maintenance**

### Regular Tasks
```bash
# Update certificates
cert-manager renew

# Backup data
kubectl exec -it deployment/redis -n automaton -- redis-cli BGSAVE

# Clean up old images
kubectl delete pods --field-selector=status.phase=Succeeded -n automaton

# Update Helm charts
helm repo update
helm upgrade automaton ./helm/automaton --namespace automaton
```

### Monitoring Health
```bash
# Check cluster health
kubectl get componentstatuses
kubectl get nodes

# Check application metrics
curl http://automaton-backend:5555/metrics

# Check logs
kubectl logs -f deployment/automaton-backend -n automaton
```

## 🎯 **Success Criteria**

✅ **Application Running**: All pods healthy and serving traffic  
✅ **Monitoring Active**: Prometheus collecting metrics, Grafana dashboards visible  
✅ **Alerting Working**: Alerts firing and notifications sent  
✅ **Security Enforced**: Network policies, RBAC, and admission controllers active  
✅ **CI/CD Functional**: Automated builds, tests, and deployments working  
✅ **Performance Optimized**: Resource usage within limits, autoscaling active  

## 📞 **Support**

For issues and questions:
- **Documentation**: Check `/docs` directory
- **Issues**: Create GitHub issue
- **Emergency**: Check alerting channels (Slack/Email)

---

**🎉 Congratulations! Your Computational Topology Canvas is now running in production with enterprise-grade monitoring, security, and CI/CD!**