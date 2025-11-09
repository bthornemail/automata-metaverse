---
id: ci-pipeline-usage-guide
title: "CI Pipeline Usage Guide"
level: practical
type: guide
tags: [ci-cd, usage, examples, github-actions]
keywords: [ci-pipeline-adapter, usage-guide, examples, github-actions, workflows, artifacts]
prerequisites: [ci-pipeline-adapter-overview]
enables: [ci-pipeline-agent-integration]
related: [ci-pipeline-api-reference, github-ci-cd-workflow-readme]
readingTime: 45
difficulty: 2
blackboard:
  status: active
  assignedAgent: "4D-Network-Agent"
  lastUpdate: 2025-01-07
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# CI Pipeline Usage Guide

**Practical guide for using the CI Pipeline Adapter with code examples and common patterns.**

## Table of Contents

1. [Setup](#setup)
2. [Basic Operations](#basic-operations)
3. [Pipeline Management](#pipeline-management)
4. [Workflow Management](#workflow-management)
5. [Artifact Management](#artifact-management)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Setup

### Environment Variables

Set up environment variables for authentication:

```bash
# Required for GitHub Actions
export GITHUB_TOKEN=your_github_personal_access_token
export GITHUB_REPOSITORY=owner/repo-name

# Optional
export CI_TYPE=github  # Default: github
export CI_BASE_URL=    # For custom CI systems
```

### Creating an Adapter

```typescript
import { CIPipelineFactory } from './src/ci';

// Option 1: From environment variables (recommended)
const ciAdapter = CIPipelineFactory.fromEnvironment();

// Option 2: Explicit configuration
const ciAdapter = CIPipelineFactory.create({
  type: 'github',
  token: process.env.GITHUB_TOKEN!,
  repository: 'owner/repo',
});

// Connect to CI system
await ciAdapter.connect();
```

## Basic Operations

### Trigger a Pipeline

```typescript
const run = await ciAdapter.triggerPipeline({
  workflow: '.github/workflows/ci.yml',
  branch: 'main',
  variables: {
    NODE_VERSION: '18',
    ENVIRONMENT: 'staging',
  },
});

console.log(`Pipeline started: ${run.id}`);
console.log(`Status: ${run.status}`);
console.log(`URL: ${run.url}`);
```

### Check Pipeline Status

```typescript
const status = await ciAdapter.getPipelineStatus(run.id);
console.log(`Pipeline status: ${status}`);
```

### Wait for Pipeline Completion

```typescript
import { waitForPipeline } from './src/ci';

const finalStatus = await waitForPipeline(ciAdapter, run.id, {
  interval: 5000,  // Check every 5 seconds
  timeout: 3600000,  // 1 hour timeout
  onStatusChange: (status) => {
    console.log(`Status changed: ${status}`);
  },
});

if (finalStatus === 'success') {
  console.log('✅ Pipeline succeeded');
} else {
  console.log('❌ Pipeline failed');
}
```

### Get Pipeline Logs

```typescript
import { formatPipelineLogs } from './src/ci';

const logs = await ciAdapter.getPipelineLogs(run.id);
console.log(formatPipelineLogs(logs));
```

### Cancel a Pipeline

```typescript
await ciAdapter.cancelPipeline(run.id);
console.log('Pipeline cancelled');
```

## Pipeline Management

### Trigger and Wait Pattern

```typescript
import { triggerAndWait } from './src/ci';

const { run, finalStatus } = await triggerAndWait(
  ciAdapter,
  {
    workflow: '.github/workflows/ci.yml',
    branch: 'main',
  },
  {
    interval: 5000,
    timeout: 1800000,  // 30 minutes
  }
);

if (finalStatus === 'success') {
  console.log(`✅ Pipeline ${run.id} completed successfully`);
} else {
  console.log(`❌ Pipeline ${run.id} failed`);
  const logs = await ciAdapter.getPipelineLogs(run.id);
  console.error(logs);
}
```

### List Jobs in a Pipeline

```typescript
const jobs = await ciAdapter.listJobs(run.id);
for (const job of jobs) {
  console.log(`${job.name}: ${job.status}`);
  if (job.startedAt && job.completedAt) {
    const duration = job.completedAt.getTime() - job.startedAt.getTime();
    console.log(`  Duration: ${duration}ms`);
  }
}
```

### Rerun a Failed Job

```typescript
const jobs = await ciAdapter.listJobs(run.id);
const failedJob = jobs.find(job => job.status === 'failed');

if (failedJob) {
  await ciAdapter.rerunJob(failedJob.id);
  console.log(`Rerunning job: ${failedJob.name}`);
}
```

## Workflow Management

### List All Workflows

```typescript
const workflows = await ciAdapter.listWorkflows();
for (const workflow of workflows) {
  console.log(`${workflow.name} (${workflow.path}) [${workflow.state}]`);
}
```

### Get Workflow Details

```typescript
const workflow = await ciAdapter.getWorkflow(workflowId);
console.log(`Workflow: ${workflow.name}`);
console.log(`Path: ${workflow.path}`);
console.log(`State: ${workflow.state}`);
console.log(`Created: ${workflow.createdAt}`);
console.log(`Updated: ${workflow.updatedAt}`);
```

### Create a New Workflow

```typescript
const workflow = await ciAdapter.createWorkflow({
  name: 'Custom CI Pipeline',
  path: '.github/workflows/custom-ci.yml',
  content: `
name: Custom CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  test:
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

console.log(`Created workflow: ${workflow.id}`);
```

### Update a Workflow

```typescript
const updatedWorkflow = await ciAdapter.updateWorkflow(workflowId, {
  name: 'Updated CI Pipeline',
  path: '.github/workflows/ci.yml',
  content: updatedYamlContent,
});

console.log(`Updated workflow: ${updatedWorkflow.id}`);
```

### Delete a Workflow

```typescript
await ciAdapter.deleteWorkflow(workflowId);
console.log('Workflow deleted');
```

## Artifact Management

### List Artifacts

```typescript
const artifacts = await ciAdapter.listArtifacts(run.id);
console.log(`Found ${artifacts.length} artifacts:`);

for (const artifact of artifacts) {
  console.log(`  - ${artifact.name} (${artifact.size} bytes)`);
  console.log(`    Created: ${artifact.createdAt}`);
  if (artifact.expiresAt) {
    console.log(`    Expires: ${artifact.expiresAt}`);
  }
}
```

### Download Artifacts

```typescript
import * as fs from 'fs';

const artifacts = await ciAdapter.listArtifacts(run.id);

for (const artifact of artifacts) {
  const data = await ciAdapter.downloadArtifact(artifact.id);
  fs.writeFileSync(`${artifact.name}.zip`, data);
  console.log(`Downloaded: ${artifact.name}`);
}
```

## Error Handling

### Try-Catch Pattern

```typescript
try {
  const run = await ciAdapter.triggerPipeline({
    workflow: '.github/workflows/ci.yml',
    branch: 'main',
  });
  console.log(`Pipeline started: ${run.id}`);
} catch (error: any) {
  console.error(`Failed to trigger pipeline: ${error.message}`);
  // Handle error appropriately
}
```

### Connection Error Handling

```typescript
try {
  await ciAdapter.connect();
} catch (error: any) {
  if (error.message.includes('Failed to connect')) {
    console.error('Connection failed. Check your token and repository.');
  }
  throw error;
}
```

### Status Check with Retries

```typescript
async function getPipelineStatusWithRetry(
  adapter: CIPipelineAdapter,
  runId: string,
  maxRetries: number = 3
): Promise<PipelineStatus> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await adapter.getPipelineStatus(runId);
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Best Practices

### 1. Always Connect Before Use

```typescript
if (!ciAdapter.isConnected()) {
  await ciAdapter.connect();
}
```

### 2. Use Environment Variables

```typescript
// ✅ Good
const adapter = CIPipelineFactory.fromEnvironment();

// ❌ Bad - hardcoded values
const adapter = CIPipelineFactory.create({
  type: 'github',
  token: 'hardcoded-token',
  repository: 'hardcoded/repo',
});
```

### 3. Handle Timeouts

```typescript
const { run, finalStatus } = await triggerAndWait(adapter, config, {
  timeout: 1800000,  // Set appropriate timeout
  interval: 5000,     // Reasonable polling interval
});
```

### 4. Clean Up Connections

```typescript
try {
  await ciAdapter.connect();
  // ... use adapter
} finally {
  await ciAdapter.disconnect();
}
```

### 5. Use Status Helpers

```typescript
import { isPipelineSuccess, isPipelineFailure, isPipelineRunning } from './src/ci';

const status = await ciAdapter.getPipelineStatus(runId);

if (isPipelineSuccess(status)) {
  // Handle success
} else if (isPipelineFailure(status)) {
  // Handle failure
} else if (isPipelineRunning(status)) {
  // Still running
}
```

### 6. Log Pipeline Operations

```typescript
const run = await ciAdapter.triggerPipeline(config);
console.log(`[CI] Triggered pipeline ${run.id} for workflow ${config.workflow}`);
console.log(`[CI] Status: ${run.status}, URL: ${run.url}`);
```

## Complete Example

```typescript
import { CIPipelineFactory, waitForPipeline, formatPipelineLogs } from './src/ci';

async function runCIPipeline() {
  // Setup
  const ciAdapter = CIPipelineFactory.fromEnvironment();
  await ciAdapter.connect();

  try {
    // Trigger pipeline
    const run = await ciAdapter.triggerPipeline({
      workflow: '.github/workflows/ci.yml',
      branch: 'main',
      variables: {
        NODE_VERSION: '18',
        ENVIRONMENT: 'staging',
      },
    });

    console.log(`Pipeline started: ${run.id}`);

    // Wait for completion
    const finalStatus = await waitForPipeline(ciAdapter, run.id, {
      interval: 5000,
      timeout: 1800000,
      onStatusChange: (status) => {
        console.log(`Status: ${status}`);
      },
    });

    // Get results
    if (finalStatus === 'success') {
      console.log('✅ Pipeline succeeded');
      
      // List artifacts
      const artifacts = await ciAdapter.listArtifacts(run.id);
      console.log(`Found ${artifacts.length} artifacts`);
    } else {
      console.log('❌ Pipeline failed');
      
      // Get logs for debugging
      const logs = await ciAdapter.getPipelineLogs(run.id);
      console.log(formatPipelineLogs(logs));
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await ciAdapter.disconnect();
  }
}

runCIPipeline();
```

## Next Steps

- Read the [Agent Integration Guide](./CI-PIPELINE-AGENT-INTEGRATION.md) for multi-agent patterns
- Check the [API Reference](./CI-PIPELINE-API-REFERENCE.md) for complete API documentation
