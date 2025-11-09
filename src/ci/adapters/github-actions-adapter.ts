/**
 * GitHub Actions CI Pipeline Adapter
 * 
 * Implements CI pipeline operations for GitHub Actions
 */

import { CIPipelineAdapter, PipelineConfig, PipelineRun, PipelineStatus, Workflow, WorkflowConfig, Job, JobStatus, Artifact } from '../interface';
import { Octokit } from '@octokit/rest';

export class GitHubActionsAdapter implements CIPipelineAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private connected: boolean = false;

  constructor(config: {
    token: string;
    owner: string;
    repo: string;
  }) {
    this.octokit = new Octokit({
      auth: config.token,
    });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  async connect(): Promise<void> {
    try {
      // Verify connection by getting repository info
      await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to GitHub: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async triggerPipeline(config: PipelineConfig): Promise<PipelineRun> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // Trigger workflow dispatch
      const response = await this.octokit.rest.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: config.workflow,
        ref: config.branch || 'main',
        inputs: config.variables || {},
      });

      // Get the workflow run
      const runs = await this.octokit.rest.actions.listWorkflowRuns({
        owner: this.owner,
        repo: this.repo,
        workflow_id: config.workflow,
        per_page: 1,
      });

      const run = runs.data.workflow_runs[0];
      if (!run) {
        throw new Error('Failed to get workflow run');
      }

      return {
        id: run.id.toString(),
        workflow: config.workflow,
        branch: run.head_branch || 'unknown',
        commit: run.head_sha,
        status: this.mapStatus(run.status, run.conclusion),
        startedAt: new Date(run.created_at),
        completedAt: run.updated_at ? new Date(run.updated_at) : undefined,
        url: run.html_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to trigger pipeline: ${error.message}`);
    }
  }

  async getPipelineStatus(runId: string): Promise<PipelineStatus> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.octokit.rest.actions.getWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: parseInt(runId),
      });

      return this.mapStatus(response.data.status, response.data.conclusion);
    } catch (error: any) {
      throw new Error(`Failed to get pipeline status: ${error.message}`);
    }
  }

  async cancelPipeline(runId: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      await this.octokit.rest.actions.cancelWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: parseInt(runId),
      });
    } catch (error: any) {
      throw new Error(`Failed to cancel pipeline: ${error.message}`);
    }
  }

  async getPipelineLogs(runId: string): Promise<string> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const jobs = await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: parseInt(runId),
      });

      const logs: string[] = [];
      for (const job of jobs.data.jobs) {
        const jobLogs = await this.octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner: this.owner,
          repo: this.repo,
          job_id: job.id,
        });
        logs.push(`Job: ${job.name}\n${jobLogs.data as string}`);
      }

      return logs.join('\n\n');
    } catch (error: any) {
      throw new Error(`Failed to get pipeline logs: ${error.message}`);
    }
  }

  async listWorkflows(): Promise<Workflow[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // Use listRepoWorkflows (correct method name for Octokit v20+)
      const response = await this.octokit.rest.actions.listRepoWorkflows({
        owner: this.owner,
        repo: this.repo,
      });

      return response.data.workflows.map((wf) => ({
        id: wf.id.toString(),
        name: wf.name,
        path: wf.path,
        state: wf.state as 'active' | 'deleted' | 'disabled',
        createdAt: new Date(wf.created_at),
        updatedAt: new Date(wf.updated_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.octokit.rest.actions.getWorkflow({
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowId,
      });

      return {
        id: response.data.id.toString(),
        name: response.data.name,
        path: response.data.path,
        state: response.data.state as 'active' | 'deleted' | 'disabled',
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to get workflow: ${error.message}`);
    }
  }

  async createWorkflow(config: WorkflowConfig): Promise<Workflow> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // Create workflow file via GitHub API
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: config.path,
        message: `Create workflow: ${config.name}`,
        content: Buffer.from(config.content).toString('base64'),
      });

      // Get the workflow
      const workflows = await this.listWorkflows();
      const workflow = workflows.find((wf) => wf.path === config.path);
      if (!workflow) {
        throw new Error('Failed to find created workflow');
      }

      return workflow;
    } catch (error: any) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  async updateWorkflow(workflowId: string, config: WorkflowConfig): Promise<Workflow> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const workflow = await this.getWorkflow(workflowId);
      
      // Update workflow file via GitHub API
      const fileResponse = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: workflow.path,
      });

      if (Array.isArray(fileResponse.data)) {
        throw new Error('Expected file, got directory');
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: workflow.path,
        message: `Update workflow: ${config.name}`,
        content: Buffer.from(config.content).toString('base64'),
        sha: fileResponse.data.sha,
      });

      return await this.getWorkflow(workflowId);
    } catch (error: any) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const workflow = await this.getWorkflow(workflowId);
      
      const fileResponse = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: workflow.path,
      });

      if (Array.isArray(fileResponse.data)) {
        throw new Error('Expected file, got directory');
      }

      await this.octokit.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: workflow.path,
        message: `Delete workflow: ${workflow.name}`,
        sha: fileResponse.data.sha,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  async listJobs(runId: string): Promise<Job[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: parseInt(runId),
      });

      return response.data.jobs.map((job) => ({
        id: job.id.toString(),
        name: job.name,
        status: this.mapJobStatus(job.status, job.conclusion),
        startedAt: job.started_at ? new Date(job.started_at) : undefined,
        completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
        steps: [], // Steps would need separate API call
      }));
    } catch (error: any) {
      throw new Error(`Failed to list jobs: ${error.message}`);
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.octokit.actions.getJobForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        job_id: parseInt(jobId),
      });

      return this.mapJobStatus(response.data.status, response.data.conclusion);
    } catch (error: any) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  async rerunJob(jobId: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      await this.octokit.actions.reRunJobForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        job_id: parseInt(jobId),
      });
    } catch (error: any) {
      throw new Error(`Failed to rerun job: ${error.message}`);
    }
  }

  async listArtifacts(runId: string): Promise<Artifact[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.octokit.rest.actions.listWorkflowRunArtifacts({
        owner: this.owner,
        repo: this.repo,
        run_id: parseInt(runId),
      });

      return response.data.artifacts.map((artifact) => ({
        id: artifact.id.toString(),
        name: artifact.name,
        size: artifact.size_in_bytes,
        createdAt: new Date(artifact.created_at || Date.now()),
        expiresAt: artifact.expires_at ? new Date(artifact.expires_at) : undefined,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list artifacts: ${error.message}`);
    }
  }

  async downloadArtifact(artifactId: string): Promise<Buffer> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.octokit.actions.downloadArtifact({
        owner: this.owner,
        repo: this.repo,
        artifact_id: parseInt(artifactId),
        archive_format: 'zip',
      });

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error: any) {
      throw new Error(`Failed to download artifact: ${error.message}`);
    }
  }

  async uploadArtifact(runId: string, artifact: Artifact): Promise<void> {
    // GitHub Actions doesn't support direct artifact upload via API
    // Artifacts are created during workflow execution
    throw new Error('Artifact upload not supported via GitHub API. Artifacts must be created during workflow execution.');
  }

  private mapStatus(status: string | null, conclusion: string | null): PipelineStatus {
    if (status === 'completed') {
      if (conclusion === 'success') return 'success';
      if (conclusion === 'failure') return 'failure';
      if (conclusion === 'cancelled') return 'cancelled';
      if (conclusion === 'skipped') return 'skipped';
    }
    if (status === 'in_progress' || status === 'queued') return 'running';
    return 'pending';
  }

  private mapJobStatus(status: string | null, conclusion: string | null): JobStatus {
    if (status === 'completed') {
      if (conclusion === 'success') return 'completed';
      if (conclusion === 'failure') return 'failed';
      if (conclusion === 'cancelled') return 'cancelled';
    }
    if (status === 'in_progress') return 'in_progress';
    if (status === 'queued') return 'queued';
    return 'queued';
  }
}
