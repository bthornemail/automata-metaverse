---
id: ci-pipeline-api-reference
title: "CI Pipeline API Reference"
level: reference
type: reference
tags: [ci-cd, api-reference, typescript, github-actions]
keywords: [ci-pipeline-adapter, api-reference, typescript-types, interface-definitions, method-signatures]
prerequisites: [ci-pipeline-adapter-overview]
enables: []
related: [ci-pipeline-usage-guide, ci-pipeline-agent-integration]
readingTime: 60
difficulty: 3
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

# CI Pipeline API Reference

**Complete API reference for the CI Pipeline Adapter system.**

## Table of Contents

1. [Interfaces](#interfaces)
2. [Factory](#factory)
3. [Adapters](#adapters)
4. [Utilities](#utilities)
5. [Agent Integration](#agent-integration)

## Interfaces

### CIPipelineAdapter

Main interface that all CI adapters must implement.

```typescript
interface CIPipelineAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Pipeline operations
  triggerPipeline(config: PipelineConfig): Promise<PipelineRun>;
  getPipelineStatus(runId: string): Promise<PipelineStatus>;
  cancelPipeline(runId: string): Promise<void>;
  getPipelineLogs(runId: string): Promise<string>;

  // Workflow management
  listWorkflows(): Promise<Workflow[]>;
  getWorkflow(workflowId: string): Promise<Workflow>;
  createWorkflow(config: WorkflowConfig): Promise<Workflow>;
  updateWorkflow(workflowId: string, config: WorkflowConfig): Promise<Workflow>;
  deleteWorkflow(workflowId: string): Promise<void>;

  // Job management
  listJobs(runId: string): Promise<Job[]>;
  getJobStatus(jobId: string): Promise<JobStatus>;
  rerunJob(jobId: string): Promise<void>;

  // Artifact management
  listArtifacts(runId: string): Promise<Artifact[]>;
  downloadArtifact(artifactId: string): Promise<Buffer>;
  uploadArtifact(runId: string, artifact: Artifact): Promise<void>;
}
```

### PipelineConfig

Configuration for triggering a pipeline.

```typescript
interface PipelineConfig {
  workflow: string;                    // Workflow file path or ID
  branch?: string;                     // Git branch (default: 'main')
  commit?: string;                     // Git commit SHA
  environment?: string;                // Environment name
  variables?: Record<string, string>;  // Pipeline variables
  secrets?: Record<string, string>;    // Pipeline secrets
}
```

### PipelineRun

Information about a pipeline run.

```typescript
interface PipelineRun {
  id: string;                    // Unique run ID
  workflow: string;              // Workflow identifier
  branch: string;                // Git branch
  commit: string;                // Git commit SHA
  status: PipelineStatus;         // Current status
  startedAt: Date;               // Start timestamp
  completedAt?: Date;             // Completion timestamp (if completed)
  url?: string;                   // URL to view run in CI system
}
```

### PipelineStatus

Pipeline status enumeration.

```typescript
type PipelineStatus =
  | 'pending'      // Pipeline is queued
  | 'running'      // Pipeline is executing
  | 'success'      // Pipeline completed successfully
  | 'failure'      // Pipeline failed
  | 'cancelled'    // Pipeline was cancelled
  | 'skipped';     // Pipeline was skipped
```

### Workflow

Workflow information.

```typescript
interface Workflow {
  id: string;                    // Unique workflow ID
  name: string;                  // Workflow name
  path: string;                  // Workflow file path
  state: 'active' | 'deleted' | 'disabled';
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### WorkflowConfig

Configuration for creating/updating a workflow.

```typescript
interface WorkflowConfig {
  name: string;                  // Workflow name
  path: string;                  // Workflow file path
  content: string;               // YAML content
  on?: {                         // Trigger configuration
    push?: { branches?: string[] };
    pull_request?: { branches?: string[] };
    schedule?: { cron?: string }[];
    workflow_dispatch?: boolean;
  };
}
```

### Job

Job information.

```typescript
interface Job {
  id: string;                    // Unique job ID
  name: string;                  // Job name
  status: JobStatus;              // Current status
  startedAt?: Date;              // Start timestamp
  completedAt?: Date;            // Completion timestamp
  steps: JobStep[];              // Job steps
}
```

### JobStatus

Job status enumeration.

```typescript
type JobStatus =
  | 'queued'       // Job is queued
  | 'in_progress'  // Job is executing
  | 'completed'    // Job completed successfully
  | 'failed'       // Job failed
  | 'cancelled';   // Job was cancelled
```

### JobStep

Step information within a job.

```typescript
interface JobStep {
  name: string;                  // Step name
  status: JobStatus;              // Current status
  startedAt?: Date;              // Start timestamp
  completedAt?: Date;            // Completion timestamp
  log?: string;                  // Step log output
}
```

### Artifact

Artifact information.

```typescript
interface Artifact {
  id: string;                    // Unique artifact ID
  name: string;                  // Artifact name
  size: number;                  // Size in bytes
  createdAt: Date;               // Creation timestamp
  expiresAt?: Date;              // Expiration timestamp
}
```

### CIAdapterConfig

Configuration for creating a CI adapter.

```typescript
interface CIAdapterConfig {
  type: 'github' | 'gitlab' | 'jenkins' | 'custom';
  baseUrl?: string;               // Base URL for custom CI systems
  token?: string;                 // Authentication token
  repository?: string;           // Repository in format 'owner/repo'
  options?: Record<string, any>; // Additional options
  adapter?: CIPipelineAdapter;   // Custom adapter instance
}
```

## Factory

### CIPipelineFactory

Factory for creating CI adapters.

#### create(config: CIAdapterConfig): CIPipelineAdapter

Creates a CI adapter based on configuration.

```typescript
const adapter = CIPipelineFactory.create({
  type: 'github',
  token: process.env.GITHUB_TOKEN,
  repository: 'owner/repo',
});
```

**Parameters**:
- `config`: CI adapter configuration

**Returns**: `CIPipelineAdapter` instance

**Throws**: Error if configuration is invalid or adapter creation fails

#### fromEnvironment(): CIPipelineAdapter

Creates a CI adapter from environment variables.

```typescript
const adapter = CIPipelineFactory.fromEnvironment();
```

**Returns**: `CIPipelineAdapter` instance

**Environment Variables**:
- `CI_TYPE`: Type of CI system (default: 'github')
- `GITHUB_TOKEN` or `CI_TOKEN`: Authentication token
- `GITHUB_REPOSITORY` or `CI_REPOSITORY`: Repository in format 'owner/repo'
- `CI_BASE_URL`: Base URL for custom CI systems

## Utilities

### waitForPipeline

Waits for a pipeline to complete.

```typescript
function waitForPipeline(
  adapter: CIPipelineAdapter,
  runId: string,
  options?: {
    interval?: number;                    // Polling interval (default: 5000ms)
    timeout?: number;                    // Timeout (default: 3600000ms)
    onStatusChange?: (status: PipelineStatus) => void;
  }
): Promise<PipelineStatus>
```

**Example**:
```typescript
const status = await waitForPipeline(adapter, runId, {
  interval: 5000,
  timeout: 1800000,
  onStatusChange: (status) => console.log(`Status: ${status}`),
});
```

### triggerAndWait

Triggers a pipeline and waits for completion.

```typescript
function triggerAndWait(
  adapter: CIPipelineAdapter,
  config: PipelineConfig,
  options?: WaitOptions
): Promise<{ run: PipelineRun; finalStatus: PipelineStatus }>
```

**Example**:
```typescript
const { run, finalStatus } = await triggerAndWait(adapter, {
  workflow: '.github/workflows/ci.yml',
  branch: 'main',
});
```

### formatPipelineLogs

Formats pipeline logs for display.

```typescript
function formatPipelineLogs(logs: string): string
```

**Example**:
```typescript
const logs = await adapter.getPipelineLogs(runId);
console.log(formatPipelineLogs(logs));
```

### Status Helpers

```typescript
function isPipelineSuccess(status: PipelineStatus): boolean
function isPipelineFailure(status: PipelineStatus): boolean
function isPipelineRunning(status: PipelineStatus): boolean
```

**Example**:
```typescript
const status = await adapter.getPipelineStatus(runId);
if (isPipelineSuccess(status)) {
  console.log('Success');
}
```

## Agent Integration

### CIAgentManager

Unified manager for all agent CI operations.

```typescript
class CIAgentManager {
  public readonly network: NetworkAgentCI;
  public readonly consensus: ConsensusAgentCI;
  public readonly intelligence: IntelligenceAgentCI;

  constructor(adapter: CIPipelineAdapter);

  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
```

### NetworkAgentCI

4D-Network Agent CI operations.

```typescript
class NetworkAgentCI {
  constructor(adapter: CIPipelineAdapter);

  triggerDeployment(config: {
    environment: 'staging' | 'production';
    branch?: string;
    variables?: Record<string, string>;
  }): Promise<PipelineRun>;

  monitorDeployment(
    runId: string,
    onStatusChange?: (status: PipelineStatus) => void
  ): Promise<PipelineStatus>;
}
```

### ConsensusAgentCI

5D-Consensus Agent CI operations.

```typescript
class ConsensusAgentCI {
  constructor(adapter: CIPipelineAdapter);

  triggerConsensusPipeline(config: {
    workflow: string;
    branch?: string;
    approvals?: number;
  }): Promise<PipelineRun>;

  waitForConsensus(runId: string): Promise<{
    approved: boolean;
    status: PipelineStatus;
  }>;
}
```

### IntelligenceAgentCI

6D-Intelligence Agent CI operations.

```typescript
class IntelligenceAgentCI {
  constructor(adapter: CIPipelineAdapter);

  runTestsAndAnalyze(config: {
    workflow?: string;
    branch?: string;
  }): Promise<{
    run: PipelineRun;
    success: boolean;
    logs: string;
    analysis: {
      testCount?: number;
      passCount?: number;
      failCount?: number;
      duration?: number;
    };
  }>;

  getPerformanceMetrics(runId: string): Promise<{
    duration: number;
    jobs: number;
    successRate: number;
  }>;
}
```

## Error Handling

All methods throw errors with descriptive messages:

```typescript
try {
  const run = await adapter.triggerPipeline(config);
} catch (error: any) {
  // Error messages are descriptive
  console.error(error.message);
  // Example: "Failed to trigger pipeline: Invalid workflow ID"
}
```

Common error scenarios:
- Connection failures
- Invalid configuration
- Workflow not found
- Permission errors
- Network errors

## Type Exports

All types are exported from the main module:

```typescript
import {
  CIPipelineAdapter,
  PipelineConfig,
  PipelineRun,
  PipelineStatus,
  Workflow,
  WorkflowConfig,
  Job,
  JobStatus,
  Artifact,
  CIAdapterConfig,
} from './src/ci';
```

## Related Documentation

- [Usage Guide](./CI-PIPELINE-USAGE-GUIDE.md) - Practical examples
- [Agent Integration](./CI-PIPELINE-AGENT-INTEGRATION.md) - Multi-agent patterns
- [Overview](./CI-PIPELINE-ADAPTER-OVERVIEW.md) - Architecture overview
