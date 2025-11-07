#!/bin/bash

# Quick deployment verification for universallifeprotocol.com

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="universallifeprotocol.com"
NAMESPACE="automaton"

echo -e "${BLUE}🔍 Verifying Church Encoding Metaverse Deployment${NC}"
echo "=================================================="

# Function to check DNS
check_dns() {
    echo -e "${YELLOW}🌐 Checking DNS configuration...${NC}"
    
    # Check A record
    if dig +short $DOMAIN A | grep -q "172.238.45.134"; then
        echo -e "${GREEN}✅ A record correct: 172.238.45.134${NC}"
    else
        echo -e "${RED}❌ A record incorrect or missing${NC}"
        echo "Expected: 172.238.45.134"
        echo "Got: $(dig +short $DOMAIN A)"
    fi
    
    # Check AAAA record
    if dig +short $DOMAIN AAAA | grep -q "2600:3c0a::2000:96ff:fef2:9b19"; then
        echo -e "${GREEN}✅ AAAA record correct: 2600:3c0a::2000:96ff:fef2:9b19${NC}"
    else
        echo -e "${RED}❌ AAAA record incorrect or missing${NC}"
        echo "Expected: 2600:3c0a::2000:96ff:fef2:9b19"
        echo "Got: $(dig +short $DOMAIN AAAA)"
    fi
    
    # Check API subdomain
    if dig +short api.$DOMAIN A | grep -q "172.238.45.134"; then
        echo -e "${GREEN}✅ API subdomain correct${NC}"
    else
        echo -e "${RED}❌ API subdomain incorrect or missing${NC}"
    fi
}

# Function to check SSL certificate
check_ssl() {
    echo -e "${YELLOW}🔒 Checking SSL certificate...${NC}"
    
    if curl -s --head https://$DOMAIN | grep -q "200 OK"; then
        echo -e "${GREEN}✅ HTTPS accessible${NC}"
        
        # Check certificate expiry
        EXPIRY=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        echo -e "${BLUE}📅 Certificate expires: $EXPIRY${NC}"
        
        # Check certificate issuer
        ISSUER=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -issuer | cut -d= -f4)
        echo -e "${BLUE}🏢 Certificate issuer: $ISSUER${NC}"
    else
        echo -e "${RED}❌ HTTPS not accessible${NC}"
    fi
}

# Function to check application health
check_application() {
    echo -e "${YELLOW}🚀 Checking application health...${NC}"
    
    # Check main application
    if curl -s https://$DOMAIN/health | grep -q "ok\|healthy\|200"; then
        echo -e "${GREEN}✅ Main application healthy${NC}"
    else
        echo -e "${RED}❌ Main application not responding${NC}"
    fi
    
    # Check API
    if curl -s https://api.$DOMAIN/health | grep -q "ok\|healthy\|200"; then
        echo -e "${GREEN}✅ API endpoint healthy${NC}"
    else
        echo -e "${RED}❌ API endpoint not responding${NC}"
    fi
}

# Function to check Kubernetes deployment
check_kubernetes() {
    echo -e "${YELLOW}☸️ Checking Kubernetes deployment...${NC}"
    
    if kubectl cluster-info &>/dev/null; then
        echo -e "${GREEN}✅ Kubernetes cluster accessible${NC}"
        
        # Check pods
        echo -e "${BLUE}📦 Pod status:${NC}"
        kubectl get pods -n $NAMESPACE
        
        # Check services
        echo -e "${BLUE}🔌 Service status:${NC}"
        kubectl get services -n $NAMESPACE
        
        # Check ingress
        echo -e "${BLUE}🌐 Ingress status:${NC}"
        kubectl get ingress -n $NAMESPACE
        
    else
        echo -e "${RED}❌ Kubernetes cluster not accessible${NC}"
    fi
}

# Function to show access information
show_access() {
    echo -e "${YELLOW}🌍 Access Information:${NC}"
    echo "=================================="
    echo -e "${GREEN}🌐 Main Application: https://$DOMAIN${NC}"
    echo -e "${GREEN}🔌 API Endpoint: https://api.$DOMAIN${NC}"
    echo -e "${GREEN}📊 Grafana: https://$DOMAIN/grafana (admin/admin123)${NC}"
    echo -e "${GREEN}📈 Prometheus: https://$DOMAIN/prometheus${NC}"
    echo ""
    echo -e "${BLUE}🔧 Port Forwarding (Development):${NC}"
    echo "# Frontend:"
    echo "kubectl port-forward -n $NAMESPACE service/frontend-service 8080:80"
    echo ""
    echo "# Backend API:"
    echo "kubectl port-forward -n $NAMESPACE service/backend-service 5555:5555"
    echo ""
    echo "# Grafana:"
    echo "kubectl port-forward -n monitoring service/grafana-service 3000:3000"
    echo ""
    echo "# Prometheus:"
    echo "kubectl port-forward -n monitoring service/prometheus-service 9090:9090"
}

# Main execution
main() {
    echo -e "${BLUE}🎭 Church Encoding Metaverse Verification${NC}"
    echo "Domain: $DOMAIN"
    echo "Repository: https://github.com/bthornemail/automaton"
    echo ""
    
    check_dns
    echo ""
    check_ssl
    echo ""
    check_application
    echo ""
    check_kubernetes
    echo ""
    show_access
    
    echo -e "${GREEN}🎉 Verification complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. If DNS is not configured, see DNS_CONFIGURATION.md"
    echo "2. If SSL is not working, check cert-manager logs"
    echo "3. If application is not healthy, check pod logs"
    echo "4. Explore the metaverse at https://$DOMAIN!"
}

# Handle script arguments
case "${1:-}" in
    "dns")
        check_dns
        ;;
    "ssl")
        check_ssl
        ;;
    "app")
        check_application
        ;;
    "k8s")
        check_kubernetes
        ;;
    "access")
        show_access
        ;;
    "help"|"-h"|"--help")
        echo "Church Encoding Metaverse Verification Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)    Full verification"
        echo "  dns       Check DNS configuration"
        echo "  ssl       Check SSL certificate"
        echo "  app       Check application health"
        echo "  k8s       Check Kubernetes deployment"
        echo "  access    Show access information"
        echo "  help      Show this help"
        ;;
    *)
        main
        ;;
esac