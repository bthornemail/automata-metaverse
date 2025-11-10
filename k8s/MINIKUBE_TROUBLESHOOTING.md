# Minikube Troubleshooting Guide

## Issue: API Server Not Starting

If you encounter errors like:
```
error validating data: failed to download openapi: Get "https://192.168.49.2:8443/openapi/v2?timeout=32s": dial tcp 192.168.49.2:8443: i/o timeout
```

## Solutions

### 1. Check Minikube Status

```bash
minikube status
```

Expected output:
```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

### 2. Restart Minikube

```bash
# Stop minikube
minikube stop

# Delete and recreate (if needed)
minikube delete
minikube start --driver=docker

# Wait for it to be ready
minikube status
```

### 3. Check Docker

```bash
# Check if Docker is running
docker ps

# Check minikube container
docker ps | grep minikube

# Check minikube logs
docker logs minikube
```

### 4. Fix API Server Issues

If API server won't start:

```bash
# SSH into minikube
minikube ssh

# Inside minikube, check kubelet
sudo systemctl status kubelet
sudo journalctl -u kubelet -n 50

# Check API server
sudo journalctl -u kube-apiserver -n 50
```

### 5. Apply Configuration Without Validation

If minikube is partially working, you can apply with validation disabled:

```bash
kubectl apply -f k8s/agent-collaboration.yaml --validate=false --server-side
```

### 6. Alternative: Use kubectl with Direct Connection

If minikube API server is accessible but kubectl can't connect:

```bash
# Get minikube IP
minikube ip

# Update kubeconfig
kubectl config set-cluster minikube --server=https://$(minikube ip):8443 --insecure-skip-tls-verify
```

### 7. Complete Reset

If nothing works, completely reset minikube:

```bash
# Delete everything
minikube delete
docker system prune -a

# Start fresh
minikube start --driver=docker --memory=4096 --cpus=2

# Enable addons
minikube addons enable ingress
minikube addons enable ingress-dns
```

## Verify Agent Collaboration Configuration

Once minikube is running:

```bash
# Check if namespace exists
kubectl get namespace automaton

# Create namespace if needed
kubectl create namespace automaton

# Apply configuration
kubectl apply -f k8s/agent-collaboration.yaml

# Verify deployment
kubectl get deployments -n automaton
kubectl get services -n automaton
kubectl get pods -n automaton
```

## Common Issues

### Issue: "connection refused" on port 8443

**Cause**: API server not started or firewall blocking

**Solution**:
```bash
# Check if API server is listening
minikube ssh -- sudo netstat -tlnp | grep 8443

# Restart API server
minikube ssh -- sudo systemctl restart kube-apiserver
```

### Issue: "i/o timeout"

**Cause**: Network connectivity issues

**Solution**:
```bash
# Check network connectivity
ping $(minikube ip)

# Test API server directly
curl -k https://$(minikube ip):8443/healthz
```

### Issue: Validation errors during minikube start

**Cause**: API server not ready when addons try to apply

**Solution**: This is often harmless - wait for API server to be ready:
```bash
# Wait for API server
minikube status --wait=all

# Then apply your configuration
kubectl apply -f k8s/agent-collaboration.yaml
```

## Next Steps

After minikube is running:

1. **Apply agent collaboration config**:
   ```bash
   kubectl apply -f k8s/agent-collaboration.yaml
   ```

2. **Verify services**:
   ```bash
   kubectl get svc -n automaton | grep agent
   ```

3. **Check pods**:
   ```bash
   kubectl get pods -n automaton -l component=agent-service
   ```

4. **Test agent API**:
   ```bash
   kubectl port-forward -n automaton service/agent-service 8080:8080
   curl http://localhost:8080/api/agents
   ```
