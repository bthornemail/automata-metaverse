/**
 * CI Pipeline Agent Integration
 * 
 * Integration layer for multi-agent system to interact with CI/CD pipelines
 * Maps agent operations to CI pipeline operations
 */

import { CIPipelineAdapter, PipelineConfig, PipelineRun, PipelineStatus } from './interface';
import { waitForPipeline, triggerAndWait, isPipelineSuccess, isPipelineFailure } from './utils';

/**
 * CI Agent Integration for 4D-Network Agent
 * Manages CI/CD network operations
 */
export class NetworkAgentCI {
  constructor(private adapter: CIPipelineAdapter) {}

  /**
   * Trigger deployment pipeline (4D-Network Agent responsibility)
   */
  async triggerDeployment(config: {
    environment: 'staging' | 'production';
    branch?: string;
    variables?: Record<string, string>;
  }): Promise<PipelineRun> {
    const workflow = config.environment === 'production' 
      ? '.github/workflows/deploy-production.yml'
      : '.github/workflows/deploy-staging.yml';

    return await this.adapter.triggerPipeline({
      workflow,
      branch: config.branch || 'main',
      environment: config.environment,
      variables: config.variables || {},
    });
  }

  /**
   * Monitor deployment status
   */
  async monitorDeployment(runId: string, onStatusChange?: (status: PipelineStatus) => void): Promise<PipelineStatus> {
    return await waitForPipeline(this.adapter, runId, {
      interval: 10000, // Check every 10 seconds for deployments
      timeout: 1800000, // 30 minute timeout
      onStatusChange,
    });
  }
}

/**
 * CI Agent Integration for 5D-Consensus Agent
 * Coordinates deployment decisions and consensus
 */
export class ConsensusAgentCI {
  constructor(private adapter: CIPipelineAdapter) {}

  /**
   * Trigger consensus pipeline (requires multiple approvals)
   */
  async triggerConsensusPipeline(config: {
    workflow: string;
    branch?: string;
    approvals?: number; // Number of required approvals
  }): Promise<PipelineRun> {
    return await this.adapter.triggerPipeline({
      workflow: config.workflow,
      branch: config.branch || 'main',
      variables: {
        REQUIRED_APPROVALS: String(config.approvals || 1),
      },
    });
  }

  /**
   * Wait for consensus (all required approvals)
   */
  async waitForConsensus(runId: string): Promise<{ approved: boolean; status: PipelineStatus }> {
    const status = await waitForPipeline(this.adapter, runId, {
      interval: 5000,
      timeout: 3600000,
    });

    return {
      approved: isPipelineSuccess(status),
      status,
    };
  }
}

/**
 * CI Agent Integration for 6D-Intelligence Agent
 * Analyzes test results and pipeline performance
 */
export class IntelligenceAgentCI {
  constructor(private adapter: CIPipelineAdapter) {}

  /**
   * Trigger test pipeline and analyze results
   */
  async runTestsAndAnalyze(config: {
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
  }> {
    const { run, finalStatus } = await triggerAndWait(
      this.adapter,
      {
        workflow: config.workflow || '.github/workflows/ci.yml',
        branch: config.branch || 'main',
      },
      {
        interval: 5000,
        timeout: 1800000, // 30 minutes
      }
    );

    const logs = await this.adapter.getPipelineLogs(run.id);
    const analysis = this.analyzeTestLogs(logs);

    return {
      run,
      success: isPipelineSuccess(finalStatus),
      logs,
      analysis,
    };
  }

  /**
   * Analyze test logs to extract metrics
   */
  private analyzeTestLogs(logs: string): {
    testCount?: number;
    passCount?: number;
    failCount?: number;
    duration?: number;
  } {
    const analysis: {
      testCount?: number;
      passCount?: number;
      failCount?: number;
      duration?: number;
    } = {};

    // Extract test counts (common patterns)
    const passMatch = logs.match(/(\d+)\s+passing|passed:\s*(\d+)/i);
    const failMatch = logs.match(/(\d+)\s+failing|failed:\s*(\d+)/i);
    const testMatch = logs.match(/(\d+)\s+tests?/i);
    const durationMatch = logs.match(/Duration:\s*(\d+(?:\.\d+)?)\s*(?:ms|s|m)/i);

    if (testMatch) {
      analysis.testCount = parseInt(testMatch[1] || testMatch[2] || '0', 10);
    }
    if (passMatch) {
      analysis.passCount = parseInt(passMatch[1] || passMatch[2] || '0', 10);
    }
    if (failMatch) {
      analysis.failCount = parseInt(failMatch[1] || failMatch[2] || '0', 10);
    }
    if (durationMatch) {
      analysis.duration = parseFloat(durationMatch[1] || '0');
    }

    return analysis;
  }

  /**
   * Get pipeline performance metrics
   */
  async getPerformanceMetrics(runId: string): Promise<{
    duration: number;
    jobs: number;
    successRate: number;
  }> {
    const run = await this.adapter.getPipelineStatus(runId);
    const jobs = await this.adapter.listJobs(runId);

    // Calculate duration from job timestamps
    let totalDuration = 0;
    let successfulJobs = 0;

    for (const job of jobs) {
      if (job.startedAt && job.completedAt) {
        const duration = job.completedAt.getTime() - job.startedAt.getTime();
        totalDuration += duration;
      }
      if (job.status === 'completed') {
        successfulJobs++;
      }
    }

    return {
      duration: totalDuration,
      jobs: jobs.length,
      successRate: jobs.length > 0 ? successfulJobs / jobs.length : 0,
    };
  }
}

/**
 * Unified CI Agent Manager
 * Provides access to all agent-specific CI operations
 */
export class CIAgentManager {
  public readonly network: NetworkAgentCI;
  public readonly consensus: ConsensusAgentCI;
  public readonly intelligence: IntelligenceAgentCI;

  constructor(adapter: CIPipelineAdapter) {
    this.network = new NetworkAgentCI(adapter);
    this.consensus = new ConsensusAgentCI(adapter);
    this.intelligence = new IntelligenceAgentCI(adapter);
  }

  /**
   * Initialize CI adapter connection
   */
  async connect(): Promise<void> {
    await this.network['adapter'].connect();
  }

  /**
   * Disconnect CI adapter
   */
  async disconnect(): Promise<void> {
    await this.network['adapter'].disconnect();
  }
}
