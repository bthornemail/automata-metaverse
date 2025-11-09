#!/bin/bash

# Production Deployment Script for Automaton
# Deploys to Linode Kubernetes Engine (or any cloud provider)

set -e

# Configuration
DOMAIN="universallifeprotocol.com"
API_DOMAIN="api.universallifeprotocol.com"
NAMESPACE="automaton"
CLUSTER_NAME="automaton-production"
REGION="us-central"

echo "🚀 Automaton Production Deployment"
echo "=================================="
echo "Domain: $DOMAIN"
echo "API Domain: $API_DOMAIN"
echo "Namespace: $NAMESPACE"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for deployment
wait_for_deployment() {
    local deployment=$1
    local namespace=$2
    echo "⏳ Waiting for deployment $deployment..."
    kubectl wait --for=condition=available deployment/$deployment -n $namespace --timeout=600s
}

# Function to wait for LoadBalancer IP
wait_for_loadbalancer() {
    local service=$1
    local namespace=$2
    echo "⏳ Waiting for LoadBalancer IP for $service..."
    local timeout=300
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        local ip=$(kubectl get service $service -n $namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        if [ -n "$ip" ]; then
            echo "✅ LoadBalancer IP: $ip"
            echo $ip
            return 0
        fi
        sleep 10
        elapsed=$((elapsed + 10))
        echo "⏳ Still waiting... (${elapsed}s elapsed)"
    done
    
    echo "❌ Timeout waiting for LoadBalancer IP"
    return 1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists kubectl; then
    echo "❌ kubectl is required but not installed"
    exit 1
fi

if ! command_exists helm; then
    echo "⚠️  Helm not found. Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Check cluster access
if ! kubectl cluster-info &>/dev/null; then
    echo "❌ Cannot access Kubernetes cluster"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Create namespace
echo "📦 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Add required Helm repositories
echo "📚 Adding Helm repositories..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install NGINX Ingress Controller
echo "🌐 Installing NGINX Ingress Controller..."
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --create-namespace \
    --set controller.replicaCount=2 \
    --set controller.nodeSelector."kubernetes\.io/os"=linux \
    --set controller.admissionWebhooks.patch.nodeSelector."kubernetes\.io/os"=linux \
    --set controller.service.type=LoadBalancer \
    --set controller.service.externalTrafficPolicy=Local \
    --set controller.publishService.enabled=true

# Wait for Ingress LoadBalancer
INGRESS_IP=$(wait_for_loadbalancer ingress-nginx-controller ingress-nginx)

# Install cert-manager
echo "🔐 Installing cert-manager..."
helm upgrade --install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --set installCRDs=true \
    --set replicaCount=2 \
    --set webhook.replicaCount=2 \
    --set cainjector.replicaCount=2

# Wait for cert-manager pods
echo "⏳ Waiting for cert-manager pods..."
kubectl wait --for=condition=available deployment/cert-manager -n cert-manager --timeout=300s
kubectl wait --for=condition=available deployment/cert-manager-webhook -n cert-manager --timeout=300s
kubectl wait --for=condition=available deployment/cert-manager-cainjector -n cert-manager --timeout=300s

# Create Let's Encrypt ClusterIssuer
echo "🔑 Creating Let's Encrypt ClusterIssuer..."
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@${DOMAIN}
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Build and push Docker images (if needed)
echo "🐳 Building Docker images..."
if [ "$SKIP_BUILD" != "true" ]; then
    # Build backend image
    docker build -f Dockerfile.backend -t automaton/backend:latest .
    
    # Build frontend image  
    docker build -f Dockerfile.ui -t automaton/frontend:latest ./ui
    
    # Push to registry (configure your registry)
    echo "⚠️  Configure your Docker registry and push images:"
    echo "   docker push automaton/backend:latest"
    echo "   docker push automaton/frontend:latest"
fi

# Deploy application
echo "🚀 Deploying application..."

# Apply ConfigMaps and Secrets
kubectl apply -f k8s/config/ -n $NAMESPACE

# Deploy Redis
echo "📦 Deploying Redis..."
kubectl apply -f k8s/backend/redis-deployment.yaml -n $NAMESPACE
wait_for_deployment redis-deployment $NAMESPACE

# Deploy backend
echo "🔧 Deploying backend..."
kubectl apply -f k8s/backend/backend-deployment.yaml -n $NAMESPACE
wait_for_deployment backend-deployment $NAMESPACE

# Deploy frontend
echo "📱 Deploying frontend..."
kubectl apply -f k8s/frontend/frontend-deployment.yaml -n $NAMESPACE
wait_for_deployment frontend-deployment $NAMESPACE

# Create LoadBalancer services
echo "⚖️ Creating LoadBalancer services..."
kubectl apply -f k8s/production-loadbalancer.yaml -n $NAMESPACE

# Wait for LoadBalancer IPs
BACKEND_LB_IP=$(wait_for_loadbalancer automaton-backend-lb $NAMESPACE)
FRONTEND_LB_IP=$(wait_for_loadbalancer automaton-frontend-lb $NAMESPACE)

# Create production Ingress with TLS
echo "🌐 Creating production Ingress with TLS..."
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: automaton-production-ingress
  namespace: $NAMESPACE
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-http-version: "1.1"
    nginx.ingress.kubernetes.io/proxy-set-header: "Upgrade \$http_upgrade; Connection 'upgrade'"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - $DOMAIN
    - $API_DOMAIN
    secretName: automaton-tls
  rules:
  - host: $DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: $API_DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5555
EOF

# Configure DNS (manual step)
echo "🌍 DNS Configuration Required:"
echo "================================"
echo "Create the following DNS records:"
echo ""
echo "A Record: $DOMAIN → $FRONTEND_LB_IP"
echo "A Record: $API_DOMAIN → $BACKEND_LB_IP"
echo ""
echo "If using a cloud provider, you may need to:"
echo "1. Go to your DNS management console"
echo "2. Create A records pointing to the LoadBalancer IPs above"
echo "3. Wait for DNS propagation (can take 5-30 minutes)"
echo ""

# Wait for certificate issuance
echo "🔐 Waiting for TLS certificate issuance..."
kubectl wait --for=condition=Ready certificate/automaton-tls -n $NAMESPACE --timeout=600s || {
    echo "⚠️  Certificate issuance may take longer. Check with:"
    echo "   kubectl describe certificate automaton-tls -n $NAMESPACE"
}

# Verify deployment
echo "🧪 Verifying deployment..."
sleep 30

# Test HTTPS access
echo "🌐 Testing HTTPS access..."
if curl -s -f "https://$DOMAIN" >/dev/null 2>&1; then
    echo "✅ Frontend accessible via HTTPS"
else
    echo "⚠️  Frontend not yet accessible (DNS may be propagating)"
fi

if curl -s -f "https://$API_DOMAIN/api/status" >/dev/null 2>&1; then
    echo "✅ Backend API accessible via HTTPS"
else
    echo "⚠️  Backend API not yet accessible (DNS may be propagating)"
fi

# Display access information
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "🌐 Application Access:"
echo "Frontend: https://$DOMAIN"
echo "API: https://$API_DOMAIN/api/status"
echo "WebSocket: wss://$DOMAIN"
echo ""
echo "🔧 Management Commands:"
echo "Check pods: kubectl get pods -n $NAMESPACE"
echo "Check services: kubectl get svc -n $NAMESPACE"
echo "Check certificates: kubectl get certificate -n $NAMESPACE"
echo ""
echo "📊 Monitoring:"
echo "Check logs: kubectl logs -f deployment/backend-deployment -n $NAMESPACE"
echo "Scale deployment: kubectl scale deployment backend-deployment --replicas=5 -n $NAMESPACE"
echo ""
echo "🔐 Certificate Status:"
echo "kubectl describe certificate automaton-tls -n $NAMESPACE"
echo ""
echo "⚠️  Important Notes:"
echo "1. DNS propagation may take 5-30 minutes"
echo "2. TLS certificate issuance may take additional time"
echo "3. Monitor certificate status with the command above"
echo "4. Configure monitoring and backups as needed"
echo ""
echo "🚀 Your Automaton is now running in production!"