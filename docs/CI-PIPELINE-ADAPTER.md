# CI Pipeline Adapter

## Overview

The CI Pipeline Adapter provides a unified interface for interacting with CI/CD pipeline systems. It supports GitHub Actions, GitLab CI, Jenkins, and custom CI systems through a common adapter pattern.

## Architecture

The CI Pipeline Adapter follows the same adapter pattern used throughout the automaton system:

```
┌─────────────────────────────────────────┐
│         CI Pipeline Adapter            │
│         (Common Interface)             │
└─────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐      ┌─────▼─────┐    ┌────▼────┐
│GitHub │      │  GitLab   │    │ Jenkins │
│Actions│      │    CI     │    │         │
└───────┘      └───────────┘    └─────────┘
```

## Usage

### Basic Setup

```typescript
import { CIPipelineFactory } from './src/ci';

// Create adapter from environment variables
const ciAdapter = CIPipelineFactory.fromEnvironment();

// Or create explicitly
const ciAdapter = CIPipelineFactory.create({
  type: 'github',
  token: process.env.GITHUB_TOKEN,
  repository: 'owner/repo',
});

// Connect
await ciAdapter.connect();
```

### Trigger a Pipeline

```typescript
const pipelineRun = await ciAdapter.triggerPipeline({
  workflow: 'ci.yml',
  branch: 'main',
  variables: {
    NODE_VERSION: '18',
    ENVIRONMENT: 'production',
  },
});

console.log(`Pipeline started: ${pipelineRun.id}`);
console.log(`Status: ${pipelineRun.status}`);
console.log(`URL: ${pipelineRun.url}`);
```

### Check Pipeline Status

```typescript
const status = await ciAdapter.getPipelineStatus(pipelineRun.id);
console.log(`Pipeline status: ${status}`);
```

### Get Pipeline Logs

```typescript
const logs = await ciAdapter.getPipelineLogs(pipelineRun.id);
console.log(logs);
```

### List Workflows

```typescript
const workflows = await ciAdapter.listWorkflows();
for (const workflow of workflows) {
  console.log(`${workflow.name}: ${workflow.path} (${workflow.state})`);
}
```

### Create a Workflow

```typescript
const workflow = await ciAdapter.createWorkflow({
  name: 'CI Pipeline',
  path: '.github/workflows/ci.yml',
  content: `
name: CI Pipeline
on: [push]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
  `,
  on: {
    push: { branches: ['main', 'develop'] },
    pull_request: { branches: ['main'] },
  },
});
```

### List Jobs

```typescript
const jobs = await ciAdapter.listJobs(pipelineRun.id);
for (const job of jobs) {
  console.log(`${job.name}: ${job.status}`);
}
```

### Download Artifacts

```typescript
const artifacts = await ciAdapter.listArtifacts(pipelineRun.id);
for (const artifact of artifacts) {
  const data = await ciAdapter.downloadArtifact(artifact.id);
  // Save artifact data
  fs.writeFileSync(artifact.name, data);
}
```

## Environment Variables

The adapter can be configured via environment variables:

- `CI_TYPE`: Type of CI system (`github`, `gitlab`, `jenkins`)
- `GITHUB_TOKEN` or `CI_TOKEN`: Authentication token
- `GITHUB_REPOSITORY` or `CI_REPOSITORY`: Repository in format `owner/repo`
- `CI_BASE_URL`: Base URL for custom CI systems

## Integration with Multi-Agent System

The CI Pipeline Adapter integrates with the multi-agent system:

- **4D-Network Agent**: Manages CI/CD network operations
- **5D-Consensus Agent**: Coordinates deployment decisions
- **6D-Intelligence Agent**: Analyzes test results and pipeline performance

### Agent Integration Example

```typescript
import { CIPipelineFactory, CIAgentManager } from './src/ci';

// Create CI adapter
const ciAdapter = CIPipelineFactory.fromEnvironment();
await ciAdapter.connect();

// Create agent manager
const ciAgents = new CIAgentManager(ciAdapter);

// 4D-Network Agent: Trigger deployment
const deployment = await ciAgents.network.triggerDeployment({
  environment: 'staging',
  branch: 'main',
});

// Monitor deployment
const status = await ciAgents.network.monitorDeployment(deployment.id, (status) => {
  console.log(`Deployment status: ${status}`);
});

// 6D-Intelligence Agent: Run tests and analyze
const testResults = await ciAgents.intelligence.runTestsAndAnalyze({
  workflow: '.github/workflows/ci.yml',
  branch: 'main',
});

console.log(`Tests: ${testResults.analysis.passCount}/${testResults.analysis.testCount} passed`);
console.log(`Duration: ${testResults.analysis.duration}ms`);

// 5D-Consensus Agent: Coordinate deployment decision
const consensus = await ciAgents.consensus.triggerConsensusPipeline({
  workflow: '.github/workflows/deploy-production.yml',
  approvals: 2, // Requires 2 approvals
});

const result = await ciAgents.consensus.waitForConsensus(consensus.id);
if (result.approved) {
  console.log('✅ Deployment approved by consensus');
}
```

## Supported CI Systems

### GitHub Actions ✅

Fully implemented with support for:
- Workflow triggers
- Status monitoring
- Log retrieval
- Artifact management
- Job management

### GitLab CI 🚧

Planned implementation

### Jenkins 🚧

Planned implementation

### Custom CI Systems

Can be implemented by providing a custom adapter that implements the `CIPipelineAdapter` interface.

## Example: Automated Testing Pipeline

```typescript
import { CIPipelineFactory } from './src/ci';

async function runAutomatedTests() {
  const ci = CIPipelineFactory.fromEnvironment();
  await ci.connect();

  // Trigger test pipeline
  const run = await ci.triggerPipeline({
    workflow: 'ci.yml',
    branch: 'main',
  });

  // Wait for completion
  let status = await ci.getPipelineStatus(run.id);
  while (status === 'running' || status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    status = await ci.getPipelineStatus(run.id);
  }

  // Get results
  if (status === 'success') {
    console.log('✅ All tests passed');
    const logs = await ci.getPipelineLogs(run.id);
    console.log(logs);
  } else {
    console.log('❌ Tests failed');
    const logs = await ci.getPipelineLogs(run.id);
    console.error(logs);
    process.exit(1);
  }
}
```

## Related Documentation

- [Database Adapters](../docs/02-JSONL-Database-Adapter/README.md)
- [Meta-Log Adapters](../docs/06-Meta-Log-Adapters/README.md)
- [AGENTS.md](../AGENTS.md) - Multi-agent system architecture
