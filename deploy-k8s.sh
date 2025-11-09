#!/bin/bash

# Kubernetes Deployment Script for Automaton
# Usage: ./deploy-k8s.sh [local|minikube|production]

set -e

ENVIRONMENT=${1:-local}
NAMESPACE="automaton"
REGISTRY=${REGISTRY:-localhost:5000}
VERSION=${VERSION:-latest}

echo "🚀 Deploying Automaton to Kubernetes..."
echo "📊 Environment: $ENVIRONMENT"
echo "📦 Registry: $REGISTRY"
echo "🏷️  Version: $VERSION"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for pod to be ready
wait_for_pod() {
    local pod_name=$1
    local namespace=$2
    local timeout=${3:-300}
    
    echo "⏳ Waiting for pod $pod_name to be ready..."
    kubectl wait --for=condition=ready pod -l app=$pod_name -n $namespace --timeout=${timeout}s
}

# Check prerequisites
if ! command_exists kubectl; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

if ! command_exists docker; then
    echo "❌ docker is not installed. Please install docker first."
    exit 1
fi

# Setup based on environment
case $ENVIRONMENT in
    "local")
        echo "🏠 Setting up local Kubernetes environment..."
        
        # Start local registry if not running
        if ! docker ps | grep -q "registry:2"; then
            echo "📦 Starting local Docker registry..."
            docker run -d -p 5000:5000 --name registry registry:2
        fi
        
        # Check if cluster exists, create with kind if not
        if ! kubectl cluster-info >/dev/null 2>&1; then
            if command_exists kind; then
                echo "🔧 Creating Kubernetes cluster with kind..."
                kind create cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30080
    hostPort: 80
  - containerPort: 30443
    hostPort: 443
EOF
            elif command_exists minikube; then
                echo "🔧 Starting Minikube..."
                minikube start --driver=docker
                minikube addons enable ingress
            else
                echo "❌ Neither kind nor minikube found. Please install one of them."
                exit 1
            fi
        fi
        ;;
        
    "minikube")
        echo "🔧 Using Minikube environment..."
        if ! minikube status | grep -q "Running"; then
            minikube start --driver=docker
            minikube addons enable ingress
            minikube addons enable metrics-server
        fi
        # Set docker environment to minikube
        eval $(minikube docker-env)
        REGISTRY="localhost:5000"
        ;;
        
    "production")
        echo "🌟 Deploying to production environment..."
        if ! kubectl cluster-info >/dev/null 2>&1; then
            echo "❌ No Kubernetes cluster found. Please configure kubectl for your production cluster."
            exit 1
        fi
        ;;
        
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Usage: $0 [local|minikube|production]"
        exit 1
        ;;
esac

# Build Docker images
echo "🏗️ Building Docker images..."

# Build backend image
echo "📦 Building backend image..."
docker build -f Dockerfile.backend -t ${REGISTRY}/automaton-backend:${VERSION} .
if [ "$ENVIRONMENT" != "production" ]; then
    docker push ${REGISTRY}/automaton-backend:${VERSION}
fi

# Build frontend image
echo "📦 Building frontend image..."
docker build -f Dockerfile.ui -t ${REGISTRY}/automaton-frontend:${VERSION} .
if [ "$ENVIRONMENT" != "production" ]; then
    docker push ${REGISTRY}/automaton-frontend:${VERSION}
fi

# Update K8s manifests with correct image references
echo "📝 Updating Kubernetes manifests..."
sed -i.bak "s|image: automaton-backend:latest|image: ${REGISTRY}/automaton-backend:${VERSION}|g" k8s/01-automaton-deployment.yaml
sed -i.bak "s|image: automaton-frontend:latest|image: ${REGISTRY}/automaton-frontend:${VERSION}|g" k8s/01-automaton-deployment.yaml

# Apply Kubernetes manifests
echo "🚀 Applying Kubernetes manifests..."

# Create namespace and core resources
echo "📋 Creating namespace and core resources..."
# Delete existing secret if it exists to avoid base64 encoding issues
echo "🔐 Ensuring secrets are properly configured..."
kubectl delete secret automaton-secrets -n automaton --ignore-not-found=true 2>/dev/null || true

kubectl apply -f k8s/01-automaton-deployment.yaml

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
wait_for_pod "redis" $NAMESPACE

# Apply ingress and scaling
echo "🌐 Setting up ingress and auto-scaling..."
kubectl apply -f k8s/02-ingress-and-scaling.yaml

# Apply monitoring
echo "📊 Setting up monitoring..."
kubectl apply -f k8s/03-monitoring.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
wait_for_pod "backend" $NAMESPACE
wait_for_pod "frontend" $NAMESPACE

# Show status
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Status:"
kubectl get pods -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
kubectl get ingress -n $NAMESPACE 2>/dev/null || echo "Ingress not available"

# Show access information
echo ""
echo "🌐 Access Information:"

case $ENVIRONMENT in
    "local")
        if command_exists kind; then
            echo "Frontend: http://localhost"
            echo "Backend API: http://localhost/api"
            echo "WebSocket: ws://localhost/socket.io"
        fi
        ;;
    "minikube")
        MINIKUBE_IP=$(minikube ip)
        echo "Frontend: http://$MINIKUBE_IP"
        echo "Backend API: http://$MINIKUBE_IP/api"
        echo "WebSocket: ws://$MINIKUBE_IP/socket.io"
        echo ""
        echo "📊 Monitoring:"
        echo "Grafana: http://$MINIKUBE_IP:30030"
        echo "Prometheus: http://$MINIKUBE_IP:30090"
        ;;
    "production")
        echo "Frontend: https://universallifeprotocol.com"
        echo "Backend API: https://api.universallifeprotocol.com"
        echo "WebSocket: wss://universallifeprotocol.com/socket.io"
        ;;
esac

echo ""
echo "📊 Monitoring Commands:"
echo "  kubectl logs -f deployment/backend-deployment -n $NAMESPACE"
echo "  kubectl logs -f deployment/frontend-deployment -n $NAMESPACE"
echo "  kubectl top pods -n $NAMESPACE"
echo "  kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"

# Restore original manifests
echo "🔄 Restoring original manifests..."
mv k8s/01-automaton-deployment.yaml.bak k8s/01-automaton-deployment.yaml

echo ""
echo "🎉 Automaton is now running on Kubernetes!"