#!/bin/bash

# 🚀 Automaton Production Deployment Script
# Repository: https://github.com/bthornemail/automaton
# Domain: universallifeprotocol.com
# Nameservers: ns1.linode.com, ns2.linode.com, ns3.linode.com, ns4.linode.com

set -e

echo "🚀 Starting Automaton Production Deployment..."

# Configuration
REPO_URL="https://github.com/bthornemail/automaton"
DOMAIN="universallifeprotocol.com"
IP_ADDRESS="172.238.45.134"
NAMESPACE="automaton"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Kubernetes cluster is not accessible"
        exit 1
    fi
    
    log "Prerequisites check passed ✓"
}

# Deploy core application
deploy_core() {
    log "Deploying core application..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy main application
    kubectl apply -f k8s/local-deployment.yaml
    
    # Wait for pods to be ready
    log "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=backend -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=frontend -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
    
    log "Core application deployed ✓"
}

# Deploy LoadBalancer services
deploy_loadbalancer() {
    log "Deploying LoadBalancer services..."
    
    kubectl apply -f k8s/production-loadbalancer.yaml
    
    # Wait for LoadBalancer IPs
    log "Waiting for LoadBalancer IPs..."
    sleep 10
    
    FRONTEND_LB_IP=$(kubectl get service automaton-frontend-lb -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    BACKEND_LB_IP=$(kubectl get service automaton-backend-lb -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    
    if [ -z "$FRONTEND_LB_IP" ]; then
        warn "Frontend LoadBalancer IP not yet assigned"
        FRONTEND_LB_IP="<pending>"
    fi
    
    if [ -z "$BACKEND_LB_IP" ]; then
        warn "Backend LoadBalancer IP not yet assigned"
        BACKEND_LB_IP="<pending>"
    fi
    
    log "LoadBalancer services deployed ✓"
}

# Deploy autoscaling
deploy_autoscaling() {
    log "Deploying autoscaling configuration..."
    
    kubectl apply -f k8s/02-ingress-and-scaling.yaml
    
    log "Autoscaling configured ✓"
}

# Deploy monitoring
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    kubectl apply -f k8s/03-monitoring.yaml
    
    log "Monitoring deployed ✓"
}

# Configure DNS
configure_dns() {
    log "DNS Configuration Required:"
    echo "----------------------------------------"
    echo "Domain: $DOMAIN"
    echo "IP Address: $IP_ADDRESS"
    echo ""
    echo "Add these DNS records:"
    echo "A Record: $DOMAIN → $IP_ADDRESS"
    echo "A Record: api.$DOMAIN → $IP_ADDRESS"
    echo "----------------------------------------"
    echo ""
    echo "After DNS propagation, your app will be available at:"
    echo "🌐 https://$DOMAIN"
    echo "🔌 https://api.$DOMAIN"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check pods
    kubectl get pods -n $NAMESPACE
    
    # Check services
    kubectl get services -n $NAMESPACE
    
    # Test application health
    FRONTEND_LB_IP=$(kubectl get service automaton-frontend-lb -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    
    if [ -n "$FRONTEND_LB_IP" ] && [ "$FRONTEND_LB_IP" != "<pending>" ]; then
        log "Testing application health..."
        if curl -f -s "http://$FRONTEND_LB_IP/health" > /dev/null; then
            log "Application health check passed ✓"
        else
            warn "Application health check failed"
        fi
    else
        warn "Cannot test health - LoadBalancer IP not ready"
    fi
}

# Main deployment flow
main() {
    log "Starting deployment for $DOMAIN"
    log "Repository: $REPO_URL"
    echo ""
    
    check_prerequisites
    deploy_core
    deploy_loadbalancer
    deploy_autoscaling
    
    # Optional: deploy_monitoring
    read -p "Deploy monitoring stack? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_monitoring
    fi
    
    configure_dns
    verify_deployment
    
    echo ""
    log "🎉 Deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Configure DNS records as shown above"
    echo "2. Wait for DNS propagation"
    echo "3. Test your application at https://$DOMAIN"
    echo "4. Monitor deployment with: kubectl get pods -n $NAMESPACE"
    echo ""
    echo "For detailed monitoring, run:"
    echo "kubectl port-forward -n $NAMESPACE service/automaton-frontend-lb 8080:80"
}

# Run main function
main "$@"