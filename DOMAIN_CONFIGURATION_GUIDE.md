---
id: domain-configuration-guide
title: "Domain Configuration Guide"
level: practical
type: guide
tags: [domain-configuration-guide, domain-setup, dns-configuration, pm2-production]
keywords: [domain-configuration-guide, domain-setup, pm2-production, r5rs-canvas-engine, blackboard-architecture, automaton-self-building]
prerequisites: [production-deployment-guide, dns-configuration-guide]
enables: []
related: [r5rs-canvas-engine, blackboard-architecture-guide, production-deployment-guide, dns-configuration-guide]
readingTime: 25
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

## Domain Configuration Summary

### 1. universallifeprotocol.com (PM2 Production)
- **Purpose**: Main production site using PM2
- **Current IP**: 74.208.236.17
- **Nameservers**: ns1.linode.com, ns2.linode.com, ns3.linode.com, ns4.linode.com
- **Status**: ✅ Configured and active

### 2. universallifeprotocol.net (Kubernetes)
- **Purpose**: Kubernetes cluster deployment
- **Required Action**: Update nameservers to point to your Kubernetes cluster
- **Target**: Your K8s provider's nameservers or external DNS service

### 3. universallifeprotocol.online (Docker)
- **Purpose**: Docker Compose deployment
- **Required Action**: Update nameservers to point to your Docker host
- **Target**: Your Docker host's IP or load balancer

## DNS Updates Needed

### For universallifeprotocol.net:
1. Log into your domain registrar
2. Update nameservers to your Kubernetes provider:
   - If using GKE: Use Google Cloud DNS nameservers
   - If using EKS: Use Route 53 nameservers
   - If using AKS: Use Azure DNS nameservers
   - Or configure external DNS with your cluster IP

### For universallifeprotocol.online:
1. Log into your domain registrar
2. Set A record to your Docker host IP
3. Alternative: Update nameservers to your hosting provider

## SSL Certificate Setup

After DNS propagation, create SSL certificates:

### For Kubernetes (.net):
```bash
kubectl apply -f k8s/production-ingress.yaml
# cert-manager will automatically create certificates
```

### For Docker (.online):
```bash
# Use certbot or Let's Encrypt
certbot certonly --standalone -d universallifeprotocol.online
```

## Deployment Commands

### PM2 (.com):
```bash
npm run build
pm2 start ecosystem.config.js --env production
```

### Kubernetes (.net):
```bash
kubectl apply -f k8s/
```

### Docker (.online):
```bash
docker-compose -f docker-compose.online.yml up -d
```

## Testing

After DNS propagation (24-48 hours):
```bash
# Test each domain
curl -I https://universallifeprotocol.com
curl -I https://universallifeprotocol.net
curl -I https://universallifeprotocol.online
```