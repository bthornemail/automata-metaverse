# 🌐 DNS Configuration Guide

## Domain Information
- **Domain**: universallifeprotocol.com
- **IP Address**: 172.238.45.134
- **Nameservers**: 
  - ns1.linode.com
  - ns2.linode.com
  - ns3.linode.com
  - ns4.linode.com

## DNS Records to Configure

### After Kubernetes Deployment

Once you deploy to production and get your LoadBalancer IPs, configure these DNS records:

#### A Records
```
Type: A
Name: @ (or universallifeprotocol.com)
Value: <FRONTEND_LOADBALANCER_IP>
TTL: 300 (5 minutes)

Type: A
Name: api
Value: <BACKEND_LOADBALANCER_IP>
TTL: 300 (5 minutes)
```

#### Alternative: Single LoadBalancer
If using Ingress with a single LoadBalancer:
```
Type: A
Name: @ (or universallifeprotocol.com)
Value: <LOADBALANCER_IP>
TTL: 300 (5 minutes)

Type: A
Name: api
Value: <LOADBALANCER_IP>
TTL: 300 (5 minutes)
```

### DNS Propagation

#### Check Propagation
```bash
# Check main domain
dig universallifeprotocol.com

# Check API subdomain
dig api.universallifeprotocol.com

# Check nameservers
dig ns universallifeprotocol.com
```

#### Online Tools
- https://www.whatsmydns.net/
- https://dnschecker.org/
- https://www.nslookup.io/

## Linode DNS Configuration

### Using Linode Manager
1. Log in to Linode Cloud Manager
2. Navigate to **Domains** → **universallifeprotocol.com**
3. Add/Edit DNS records:
   - **A Record**: `@` → `<LoadBalancer_IP>`
   - **A Record**: `api` → `<LoadBalancer_IP>`

### Using Linode CLI
```bash
# Install Linode CLI
pip3 install linode-cli

# Configure CLI
linode-cli configure

# Add A records
linode-cli domains records-create \
  --domain universallifeprotocol.com \
  --type A \
  --name "@" \
  --target <LOADBALANCER_IP>

linode-cli domains records-create \
  --domain universallifeprotocol.com \
  --type A \
  --name "api" \
  --target <LOADBALANCER_IP>
```

## SSL/TLS Certificate Configuration

### Let's Encrypt with Cert-Manager
The production Ingress is configured for automatic TLS:

```yaml
# Ingress annotations
cert-manager.io/cluster-issuer: "letsencrypt-prod"
nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

### Manual SSL (Alternative)
If you prefer manual SSL certificates:
```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes -keyout universallifeprotocol.com.key \
  -out universallifeprotocol.com.csr

# Get certificate from CA (Let's Encrypt, DigiCert, etc.)
# Create Kubernetes secret
kubectl create secret tls automaton-tls \
  --cert=path/to/certificate.crt \
  --key=path/to/private.key \
  -n automaton
```

## Testing DNS Configuration

### 1. DNS Resolution
```bash
# Test main domain
nslookup universallifeprotocol.com

# Test API subdomain
nslookup api.universallifeprotocol.com

# Test reverse DNS
nslookup <LOADBALANCER_IP>
```

### 2. HTTP/HTTPS Access
```bash
# Test HTTP access
curl -I http://universallifeprotocol.com

# Test HTTPS access
curl -I https://universallifeprotocol.com

# Test API endpoint
curl https://universallifeprotocol.com/api/status
```

### 3. WebSocket Connection
```bash
# Test WebSocket upgrade
curl -I -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://universallifeprotocol.com/socket.io/
```

## Troubleshooting DNS

### Common Issues

#### DNS Not Propagating
```bash
# Check TTL values
dig universallifeprotocol.com

# Clear local DNS cache
# Linux
sudo systemctl restart systemd-resolved

# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns
```

#### SSL Certificate Issues
```bash
# Check certificate details
openssl s_client -connect universallifeprotocol.com:443

# Check certificate chain
curl -Iv https://universallifeprotocol.com 2>&1 | grep -i ssl
```

#### LoadBalancer Not Working
```bash
# Check service status
kubectl get service -n automaton | grep LoadBalancer

# Check service events
kubectl describe service automaton-frontend-lb -n automaton
```

## Advanced DNS Configuration

### CDN Integration
```yaml
# Add to Ingress annotations
nginx.ingress.kubernetes.io/configuration-snippet: |
  more_set_headers "X-CDN-Cache-Status: HIT";
  proxy_cache_valid 200 1h;
```

### GeoDNS
For global applications, consider:
- **Cloudflare**: Free CDN with GeoDNS
- **AWS Route 53**: Latency-based routing
- **Google Cloud DNS**: Global anycast

### Health Checks
Configure health checks for your DNS provider:
```bash
# Health check endpoint
curl -f https://universallifeprotocol.com/health

# API health check
curl -f https://universallifeprotocol.com/api/status
```

## DNS Record Summary

| Record Type | Name | Value | Purpose |
|-------------|-------|--------|---------|
| A | @ | `<Frontend_LB_IP>` | Main application |
| A | api | `<Backend_LB_IP>` | API subdomain |
| CNAME | www | `universallifeprotocol.com` | www subdomain |
| TXT | @ | `"v=spf1 include:_spf.linode.com ~all"` | SPF record |
| TXT | _dmarc | `"v=DMARC1; p=none; rua=mailto:admin@universallifeprotocol.com"` | DMARC |

---

**🎯 After DNS configuration, your application will be accessible at:**
- 🌐 https://universallifeprotocol.com
- 🔌 https://api.universallifeprotocol.com
- 📊 https://universallifeprotocol.com/api/status