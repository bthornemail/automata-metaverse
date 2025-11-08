/**
 * CI Pipeline Adapter Interface
 * 
 * Provides a unified interface for CI/CD pipeline operations
 * Supports GitHub Actions, GitLab CI, Jenkins, and custom CI systems
 */

export interface CIPipelineAdapter {
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

export interface PipelineConfig {
  workflow: string;
  branch?: string;
  commit?: string;
  environment?: string;
  variables?: Record<string, string>;
  secrets?: Record<string, string>;
}

export interface PipelineRun {
  id: string;
  workflow: string;
  branch: string;
  commit: string;
  status: PipelineStatus;
  startedAt: Date;
  completedAt?: Date;
  url?: string;
}

export type PipelineStatus = 
  | 'pending'
  | 'running'
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'skipped';

export interface Workflow {
  id: string;
  name: string;
  path: string;
  state: 'active' | 'deleted' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowConfig {
  name: string;
  path: string;
  content: string; // YAML content
  on?: {
    push?: { branches?: string[] };
    pull_request?: { branches?: string[] };
    schedule?: { cron?: string }[];
    workflow_dispatch?: boolean;
  };
}

export interface Job {
  id: string;
  name: string;
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  steps: JobStep[];
}

export type JobStatus = 
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobStep {
  name: string;
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  log?: string;
}

export interface Artifact {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CIAdapterConfig {
  type: 'github' | 'gitlab' | 'jenkins' | 'custom';
  baseUrl?: string;
  token?: string;
  repository?: string;
  options?: Record<string, any>;
  adapter?: CIPipelineAdapter; // For custom adapters
}
