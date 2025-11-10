# Agent Collaboration Configuration for Minikube

## Overview

This configuration enables multi-agent collaboration in the Kubernetes/minikube environment based on the multi-agent system architecture defined in `AGENTS.md`. It provides:

- **Agent Service Discovery**: DNS-based discovery using headless services
- **Agent-to-Agent Communication**: Direct pod-to-pod communication
- **Agent Coordination**: Multi-agent workflow coordination
- **Agent Registry**: Agent capability mapping and discovery
- **Network Policies**: Secure agent communication

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Service                      │
│                  (UI Components)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Service                        │
│              (Main API Gateway)                          │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Agent Service│ │ Coordination │ │   Registry   │
│  (3 replicas)│ │  (2 replicas)│ │   Service    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Redis Service   │
              │  (State Store)   │
              └─────────────────┘
```

## Components

### 1. Agent Service (`agent-service`)

**Purpose**: Main agent execution service handling agent operations

**Features**:
- REST API endpoints for agent operations (`/api/agents`)
- WebSocket support for real-time agent communication
- Agent discovery and registration
- Multi-replica deployment (3 replicas) for high availability

**Endpoints**:
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/execute` - Execute agent operation
- `GET /api/agents/:id/status` - Get agent status
- `WS /api/agents/ws` - WebSocket for real-time communication

**Service Discovery**:
- Headless service: `agent-service-headless` for DNS-based pod discovery
- ClusterIP service: `agent-service` for load-balanced access

### 2. Agent Coordination Service (`agent-coordination-service`)

**Purpose**: Coordinates multi-agent workflows and consensus operations

**Features**:
- Multi-agent workflow orchestration
- Consensus coordination (5D-Consensus-Agent integration)
- Agent dependency management
- Workflow state management

**Endpoints**:
- `POST /api/coordination/workflow` - Start multi-agent workflow
- `GET /api/coordination/workflow/:id` - Get workflow status
- `POST /api/coordination/consensus` - Request consensus vote
- `GET /api/coordination/consensus/:id` - Get consensus status

### 3. Agent Registry Service (`agent-registry-service`)

**Purpose**: Agent discovery and capability mapping

**Features**:
- Agent capability registry
- Dimension-based agent routing (0D-7D)
- Agent health monitoring
- Capability query interface

**Endpoints**:
- `GET /api/registry/agents` - List registered agents
- `GET /api/registry/capabilities` - List agent capabilities
- `GET /api/registry/dimensions/:dimension` - Get agents by dimension
- `POST /api/registry/register` - Register new agent

## Network Policies

### Agent Collaboration Policy

**Purpose**: Secure agent-to-agent communication

**Rules**:
- **Ingress**: Allows communication from:
  - Backend service (port 8080)
  - Frontend service (port 8080)
  - Other agent services (ports 8080, 8081, 8082)
  - Coordination service (ports 8080, 8081, 8082)

- **Egress**: Allows communication to:
  - Redis service (port 6379)
  - Backend service (port 5555)
  - Other agent services (ports 8080, 8081, 8082)
  - Coordination service (ports 8081, 8082)
  - DNS (ports 53)

## Configuration

### Environment Variables

The configuration is managed via ConfigMap `agent-collaboration-config`:

```yaml
AGENT_DISCOVERY_MODE: "kubernetes-dns"
AGENT_REGISTRY_ENABLED: "true"
AGENT_COORDINATION_ENABLED: "true"
AGENT_COMM_PROTOCOL: "http"
AGENT_WS_PROTOCOL: "ws"
AGENT_MESSAGE_TIMEOUT: "30000"
AGENT_RETRY_ATTEMPTS: "3"
```

### Service URLs

- **Agent Service**: `http://agent-service:8080`
- **Agent Coordination**: `http://agent-coordination-service:8081`
- **Agent Registry**: `http://agent-registry-service:8082`

## Deployment

### 1. Apply Configuration

```bash
# Apply agent collaboration configuration
kubectl apply -f k8s/agent-collaboration.yaml

# Verify deployment
kubectl get deployments -n automaton | grep agent
kubectl get services -n automaton | grep agent
```

### 2. Verify Agent Services

```bash
# Check agent service pods
kubectl get pods -n automaton -l component=agent-service

# Check agent coordination pods
kubectl get pods -n automaton -l component=agent-coordination

# Check agent registry pods
kubectl get pods -n automaton -l component=agent-registry
```

### 3. Test Agent Communication

```bash
# Port forward to agent service
kubectl port-forward -n automaton service/agent-service 8080:8080

# Test agent API
curl http://localhost:8080/api/agents

# Test agent status
curl http://localhost:8080/api/agents/0D-Topology-Agent/status
```

### 4. Access via Ingress

Add to `/etc/hosts`:
```bash
echo "192.168.49.2 agents.automaton.local" | sudo tee -a /etc/hosts
```

Access:
- Agent API: http://agents.automaton.local/api/agents
- Agent Coordination: http://automaton.local/api/coordination
- Agent Registry: http://automaton.local/api/registry

## Agent Communication Patterns

### 1. Direct Agent-to-Agent Communication

Agents can communicate directly using DNS-based service discovery:

```typescript
// Agent discovers other agents via DNS
const agentServiceUrl = `http://agent-service-headless.automaton.svc.cluster.local:8080`;
const response = await fetch(`${agentServiceUrl}/api/agents/${targetAgentId}/execute`, {
  method: 'POST',
  body: JSON.stringify({ operation: '...' })
});
```

### 2. Coordination-Based Communication

For multi-agent workflows, use the coordination service:

```typescript
// Start multi-agent workflow
const workflow = await fetch('http://agent-coordination-service:8081/api/coordination/workflow', {
  method: 'POST',
  body: JSON.stringify({
    agents: ['0D-Topology-Agent', '1D-Temporal-Agent'],
    operation: '...'
  })
});
```

### 3. Registry-Based Discovery

Discover agents by capability or dimension:

```typescript
// Find agents by dimension
const agents = await fetch('http://agent-registry-service:8082/api/registry/dimensions/4D');

// Find agents by capability
const networkAgents = await fetch('http://agent-registry-service:8082/api/registry/capabilities/network-operations');
```

## Monitoring

### Health Checks

- **Agent Service**: `GET /api/agents/health`
- **Coordination Service**: `GET /api/coordination/health`
- **Registry Service**: `GET /api/registry/health`

### Metrics

Prometheus metrics are exposed at:
- Agent Service: `http://agent-service:8080/metrics`
- Coordination Service: `http://agent-coordination-service:8081/metrics`

## Troubleshooting

### Agent Service Not Starting

```bash
# Check pod logs
kubectl logs -n automaton -l component=agent-service --tail=100

# Check events
kubectl get events -n automaton --field-selector involvedObject.name=agent-service-deployment-*
```

### Network Policy Issues

```bash
# Check network policies
kubectl get networkpolicies -n automaton

# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n automaton -- sh
# Inside pod:
wget -O- http://agent-service:8080/api/agents
```

### Service Discovery Issues

```bash
# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n automaton -- nslookup agent-service-headless

# Check service endpoints
kubectl get endpoints -n automaton agent-service
```

## Integration with AGENTS.md

This configuration implements the following from `AGENTS.md`:

- ✅ **4D-Network-Agent**: Network operations and CI/CD integration
- ✅ **5D-Consensus-Agent**: Consensus coordination via coordination service
- ✅ **6D-Intelligence-Agent**: AI operations and test analysis
- ✅ **Multi-agent Communication**: Agent-to-agent communication protocol
- ✅ **Service Discovery**: Kubernetes DNS-based discovery
- ✅ **Coordination**: Multi-agent workflow coordination

## Next Steps

1. **Implement Agent Endpoints**: Ensure backend implements agent API endpoints
2. **Add Agent Monitoring**: Set up Prometheus/Grafana dashboards for agents
3. **Implement Coordination Logic**: Add workflow orchestration logic
4. **Add Agent Registry**: Implement agent registration and discovery
5. **Test Multi-Agent Workflows**: Test agent collaboration scenarios

## Related Documentation

- `AGENTS.md` - Multi-agent system architecture
- `k8s/minikube-ingress.yaml` - Ingress configuration
- `docs/19-Agent-Procedures-Constraints-API/` - Agent API documentation
