#!/bin/bash

# Church Encoding Metaverse Deployment Script
# Deploys the complete visual agentic demo with all components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="automaton"
MONITORING_NAMESPACE="monitoring"
DOMAIN="universallifeprotocol.com"
REGISTRY="ghcr.io/bthornemail/automaton"

echo -e "${BLUE}🚀 Deploying Church Encoding Metaverse${NC}"
echo "========================================"

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Kubernetes cluster connection verified${NC}"
}

# Function to check if Helm is available
check_helm() {
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}❌ Helm is not installed or not in PATH${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Helm installation verified${NC}"
}

# Function to create namespaces
create_namespaces() {
    echo -e "${YELLOW}📦 Creating namespaces...${NC}"
    
    # Create main namespace
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Create monitoring namespace
    kubectl create namespace ${MONITORING_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    echo -e "${GREEN}✅ Namespaces created${NC}"
}

# Function to apply secrets and config
apply_secrets() {
    echo -e "${YELLOW}🔐 Applying secrets and configuration...${NC}"
    
    # Create secrets (you should replace these with actual secrets)
    kubectl create secret generic automaton-secrets \
        --from-literal=GRAFANA_PASSWORD=admin123 \
        --from-literal=SMTP_USER=your-email@example.com \
        --from-literal=SMTP_PASSWORD=your-smtp-password \
        --from-literal=JWT_SECRET=your-jwt-secret-key \
        --from-literal=REDIS_PASSWORD=your-redis-password \
        --namespace=${NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create config for monitoring
    kubectl create secret generic automaton-secrets \
        --from-literal=GRAFANA_PASSWORD=admin123 \
        --namespace=${MONITORING_NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo -e "${GREEN}✅ Secrets and configuration applied${NC}"
}

# Function to deploy core application
deploy_core() {
    echo -e "${YELLOW}🎯 Deploying core application...${NC}"
    
    # Apply core deployment
    kubectl apply -f k8s/01-automaton-deployment.yaml
    
    # Wait for deployments to be ready
    echo -e "${YELLOW}⏳ Waiting for core deployments to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n ${NAMESPACE}
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n ${NAMESPACE}
    kubectl wait --for=condition=available --timeout=300s deployment/redis-deployment -n ${NAMESPACE}
    
    echo -e "${GREEN}✅ Core application deployed${NC}"
}

# Function to deploy ingress and scaling
deploy_ingress() {
    echo -e "${YELLOW}🌐 Deploying ingress and auto-scaling...${NC}"
    
    # Apply ingress and scaling configuration
    kubectl apply -f k8s/02-ingress-and-scaling.yaml
    
    # Wait for load balancers (if applicable)
    echo -e "${YELLOW}⏳ Waiting for load balancers...${NC}"
    sleep 30
    
    echo -e "${GREEN}✅ Ingress and scaling configured${NC}"
}

# Function to deploy monitoring
deploy_monitoring() {
    echo -e "${YELLOW}📊 Deploying monitoring stack...${NC}"
    
    # Apply monitoring configuration
    kubectl apply -f k8s/03-monitoring.yaml
    
    # Wait for monitoring stack
    echo -e "${YELLOW}⏳ Waiting for monitoring stack...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n ${MONITORING_NAMESPACE}
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n ${MONITORING_NAMESPACE}
    
    echo -e "${GREEN}✅ Monitoring stack deployed${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    # Check all pods
    echo -e "${BLUE}📋 Pod status in ${NAMESPACE}:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "${BLUE}📋 Pod status in ${MONITORING_NAMESPACE}:${NC}"
    kubectl get pods -n ${MONITORING_NAMESPACE}
    
    # Check services
    echo -e "${BLUE}📋 Services in ${NAMESPACE}:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    # Check ingress
    echo -e "${BLUE}📋 Ingress status:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    # Check HPA
    echo -e "${BLUE}📋 HPA status:${NC}"
    kubectl get hpa -n ${NAMESPACE}
    
    echo -e "${GREEN}✅ Deployment verification complete${NC}"
}

# Function to show access information
show_access_info() {
    echo -e "${YELLOW}🌍 Access Information:${NC}"
    echo "========================================"
    
    # Get ingress IP (if available)
    INGRESS_IP=$(kubectl get ingress automaton-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    INGRESS_HOST=$(kubectl get ingress automaton-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")
    
    if [[ "$INGRESS_IP" != "pending" ]]; then
        echo -e "${GREEN}🌐 Main Application: http://${INGRESS_IP}${NC}"
        echo -e "${GREEN}🔌 API Endpoint: http://${INGRESS_IP}/api${NC}"
        echo -e "${GREEN}🌐 Domain: https://${DOMAIN}${NC}"
        echo -e "${GREEN}🔌 API Domain: https://api.${DOMAIN}${NC}"
    elif [[ "$INGRESS_HOST" != "pending" ]]; then
        echo -e "${GREEN}🌐 Main Application: http://${INGRESS_HOST}${NC}"
        echo -e "${GREEN}🔌 API Endpoint: http://${INGRESS_HOST}/api${NC}"
        echo -e "${GREEN}🌐 Domain: https://${DOMAIN}${NC}"
        echo -e "${GREEN}🔌 API Domain: https://api.${DOMAIN}${NC}"
    else
        echo -e "${YELLOW}⏳ Waiting for external IP...${NC}"
        echo "Run 'kubectl get ingress -n ${NAMESPACE}' to check status"
        echo -e "${GREEN}🌐 Domain: https://${DOMAIN}${NC}"
        echo -e "${GREEN}🔌 API Domain: https://api.${DOMAIN}${NC}"
    fi
    
    # Port forwarding commands
    echo -e "${BLUE}🔧 Port Forwarding Commands:${NC}"
    echo "# Forward frontend:"
    echo "kubectl port-forward -n ${NAMESPACE} service/frontend-service 8080:80"
    echo ""
    echo "# Forward backend:"
    echo "kubectl port-forward -n ${NAMESPACE} service/backend-service 5555:5555"
    echo ""
    echo "# Forward Grafana:"
    echo "kubectl port-forward -n ${MONITORING_NAMESPACE} service/grafana-service 3000:3000"
    echo ""
    echo "# Forward Prometheus:"
    echo "kubectl port-forward -n ${MONITORING_NAMESPACE} service/prometheus-service 9090:9090"
    
    echo -e "${GREEN}✅ Deployment complete!${NC}"
}

# Function to show monitoring dashboards
show_monitoring_info() {
    echo -e "${YELLOW}📊 Monitoring Dashboards:${NC}"
    echo "========================================"
    echo -e "${GREEN}🔍 Grafana: http://localhost:3000 (admin/admin123)${NC}"
    echo -e "${GREEN}📈 Prometheus: http://localhost:9090${NC}"
    echo ""
    echo "Available Grafana Dashboards:"
    echo "- Church Encoding Metrics"
    echo "- Dimensional Progression"
    echo "- System Performance"
    echo "- User Activity"
}

# Main deployment flow
main() {
    echo -e "${BLUE}🎭 Church Encoding Metaverse Deployment${NC}"
    echo "This will deploy the complete visual agentic demo including:"
    echo "- WebGL 3D Visualization"
    echo "- Multiplayer Collaboration"
    echo "- AI-driven WebLLM Evolution"
    echo "- Comprehensive Monitoring"
    echo "- Auto-scaling and Load Balancing"
    echo ""
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    check_kubectl
    check_helm
    create_namespaces
    apply_secrets
    deploy_core
    deploy_ingress
    deploy_monitoring
    verify_deployment
    show_access_info
    show_monitoring_info
    
    echo -e "${GREEN}🎉 Church Encoding Metaverse deployed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Configure your DNS to point to the load balancer IP"
    echo "2. Update the domain name in the ingress configuration"
    echo "3. Set up SSL certificates using cert-manager"
    echo "4. Explore the metaverse at your domain!"
    echo ""
    echo -e "${BLUE}📚 For more information, see the deployment guide.${NC}"
}

# Handle script arguments
case "${1:-}" in
    "verify")
        verify_deployment
        ;;
    "access")
        show_access_info
        show_monitoring_info
        ;;
    "cleanup")
        echo -e "${RED}🧹 Cleaning up deployment...${NC}"
        kubectl delete namespace ${NAMESPACE} ${MONITORING_NAMESPACE}
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    "help"|"-h"|"--help")
        echo "Church Encoding Metaverse Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)    Full deployment"
        echo "  verify    Verify existing deployment"
        echo "  access    Show access information"
        echo "  cleanup   Clean up deployment"
        echo "  help      Show this help"
        ;;
    *)
        main
        ;;
esac