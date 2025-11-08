---
id: dns-configuration
title: "DNS Configuration Guide"
level: practical
type: guide
tags: [dns-configuration, domain-configuration, dns-records, nameservers]
keywords: [dns-configuration, domain-configuration, dns-records, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [production-deployment-guide]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, production-deployment-guide, dns-configuration-guide]
readingTime: 30
difficulty: 3
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

# DNS Configuration Guide

## Domain Information
- **Domain**: universallifeprotocol.com
- **IP Address**: 172.238.45.134
- **IPv6 Address**: 2600:3c0a::2000:96ff:fef2:9b19
- **Name Servers**: ns1.linode.com, ns2.linode.com, ns3.linode.com, ns4.linode.com

## DNS Records to Configure

### At Your Domain Registrar (Linode)

#### A Record (IPv4)
```
Type: A
Name: @ (or universallifeprotocol.com)
Value: 172.238.45.134
TTL: Default (3600)
```

#### AAAA Record (IPv6)
```
Type: AAAA
Name: @ (or universallifeprotocol.com)
Value: 2600:3c0a::2000:96ff:fef2:9b19
TTL: Default (3600)
```

#### API Subdomain
```
Type: A
Name: api
Value: 172.238.45.134
TTL: Default (3600)
```

#### API Subdomain (IPv6)
```
Type: AAAA
Name: api
Value: 2600:3c0a::2000:96ff:fef2:9b19
TTL: Default (3600)
```

#### WWW Subdomain (Optional)
```
Type: CNAME
Name: www
Value: universallifeprotocol.com
TTL: Default (3600)
```

## SSL Certificate Configuration

### Using cert-manager (Recommended)

The deployment is already configured to use cert-manager with Let's Encrypt. Once DNS is configured:

```bash
# Check certificate status
kubectl get certificates -n automaton

# Manual certificate renewal if needed
kubectl annotate certificate automaton-tls \
  cert-manager.io/renew-before="1h" \
  -n automaton
```

### Manual SSL Certificate

If you prefer manual certificates:

```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes -keyout universallifeprotocol.com.key \
  -out universallifeprotocol.com.csr -subj "/CN=universallifeprotocol.com"

# Create TLS secret
kubectl create secret tls automaton-tls \
  --cert=universallifeprotocol.com.crt \
  --key=universallifeprotocol.com.key \
  -n automaton
```

## Deployment with Your Domain

### Update Environment Variables

The deployment scripts have been updated with your domain. To deploy:

```bash
# Deploy with your domain
./deploy.sh

# Or manually with kubectl
kubectl apply -f k8s/01-automaton-deployment.yaml
kubectl apply -f k8s/02-ingress-and-scaling.yaml
kubectl apply -f k8s/03-monitoring.yaml
```

### Verify DNS Resolution

```bash
# Check A record
dig +short universallifeprotocol.com A

# Check AAAA record
dig +short universallifeprotocol.com AAAA

# Check API subdomain
dig +short api.universallifeprotocol.com A
```

## GitHub Repository Configuration

### Update CI/CD Pipeline

The GitHub Actions workflow is configured for your repository:
- **Repository**: bthornemail/automaton
- **Registry**: ghcr.io/bthornemail/automaton

### Required GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# Kubernetes Configuration
KUBE_CONFIG_PROD (base64 encoded kubeconfig)
KUBE_CONFIG_STAGING (base64 encoded kubeconfig)

# Notification (Optional)
SLACK_WEBHOOK (for deployment notifications)

# Container Registry (if using private registry)
DOCKER_USERNAME
DOCKER_PASSWORD
```

## Access URLs After Deployment

Once deployed and DNS is configured:

### Application URLs
- **Main Application**: https://universallifeprotocol.com
- **API Endpoint**: https://api.universallifeprotocol.com
- **WebSocket**: wss://universallifeprotocol.com

### Monitoring URLs
- **Grafana**: https://universallifeprotocol.com/grafana
- **Prometheus**: https://universallifeprotocol.com/prometheus

### Development Access (Port Forwarding)
```bash
# Frontend
kubectl port-forward -n automaton service/frontend-service 8080:80

# Backend API
kubectl port-forward -n automaton service/backend-service 5555:5555

# Grafana
kubectl port-forward -n monitoring service/grafana-service 3000:3000

# Prometheus
kubectl port-forward -n monitoring service/prometheus-service 9090:9090
```

## Testing the Deployment

### Health Checks
```bash
# Check application health
curl -k https://universallifeprotocol.com/health

# Check API health
curl -k https://api.universallifeprotocol.com/health

# Check WebSocket
wscat -c wss://universallifeprotocol.com/socket.io/
```

### SSL Certificate Verification
```bash
# Check certificate details
openssl s_client -connect universallifeprotocol.com:443 -servername universallifeprotocol.com

# Check certificate expiry
curl -I https://universallifeprotocol.com 2>&1 | grep -i expire
```

## Troubleshooting

### DNS Issues
```bash
# Check DNS propagation
dig universallifeprotocol.com
nslookup universallifeprotocol.com

# Check from different locations
ping universallifeprotocol.com
traceroute universallifeprotocol.com
```

### Certificate Issues
```bash
# Check certificate status
kubectl describe certificate automaton-tls -n automaton

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Force certificate renewal
kubectl delete certificate automaton-tls -n automaton
```

### Ingress Issues
```bash
# Check ingress status
kubectl get ingress -n automaton
kubectl describe ingress automaton-ingress -n automaton

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

## Production Checklist

- [ ] DNS records configured and propagated
- [ ] SSL certificates issued and valid
- [ ] Load balancer health checks passing
- [ ] Application health checks passing
- [ ] Monitoring dashboards accessible
- [ ] Alert notifications configured
- [ ] Backup procedures documented
- [ ] Security policies verified

## Next Steps

1. **Configure DNS** at Linode with the records above
2. **Deploy the application** using `./deploy.sh`
3. **Verify SSL certificates** are issued by Let's Encrypt
4. **Test all endpoints** and functionality
5. **Set up monitoring alerts** for production
6. **Configure backup** procedures

Your Church Encoding Metaverse will be accessible at https://universallifeprotocol.com once deployment is complete!