/**
 * CI/CD Workflow Integration for E2E Tests
 * 
 * Integrates with GitHub Actions CI/CD pipeline if environment variables are available
 * Uses the CI Pipeline Adapter to trigger workflows and monitor test results
 */

import { CIPipelineFactory, CIAgentManager } from '../../src/ci';

let ciAgents: CIAgentManager | null = null;
let ciEnabled = false;

/**
 * Initialize CI/CD integration if environment variables are available
 */
export async function initializeCI(): Promise<void> {
  // Check for required environment variables
  const hasToken = !!(process.env.GITHUB_TOKEN || process.env.CI_TOKEN);
  const hasRepository = !!(process.env.GITHUB_REPOSITORY || process.env.CI_REPOSITORY);
  
  if (hasToken && hasRepository) {
    try {
      const ciAdapter = CIPipelineFactory.fromEnvironment();
      ciAgents = new CIAgentManager(ciAdapter);
      await ciAgents.connect();
      ciEnabled = true;
      console.log('✅ CI/CD integration enabled');
    } catch (error) {
      console.warn('⚠️ CI/CD integration failed:', error);
      ciEnabled = false;
    }
  } else {
    console.log('ℹ️ CI/CD integration skipped (missing environment variables)');
    ciEnabled = false;
  }
}

/**
 * Check if CI/CD integration is enabled
 */
export function isCIEnabled(): boolean {
  return ciEnabled && ciAgents !== null;
}

/**
 * Get CI agent manager (returns null if not enabled)
 */
export function getCIAgents(): CIAgentManager | null {
  return ciAgents;
}

/**
 * Trigger test pipeline and analyze results (6D-Intelligence Agent)
 */
export async function runTestsAndAnalyze(config?: {
  workflow?: string;
  branch?: string;
}): Promise<{
  success: boolean;
  analysis?: {
    testCount?: number;
    passCount?: number;
    failCount?: number;
    duration?: number;
  };
  logs?: string;
} | null> {
  if (!isCIEnabled() || !ciAgents) {
    return null;
  }

  try {
    const result = await ciAgents.intelligence.runTestsAndAnalyze({
      workflow: config?.workflow || '.github/workflows/ci.yml',
      branch: config?.branch || process.env.GITHUB_REF?.replace('refs/heads/', '') || 'main',
    });

    return {
      success: result.success,
      analysis: result.analysis,
      logs: result.logs,
    };
  } catch (error) {
    console.error('Failed to run tests via CI:', error);
    return null;
  }
}

/**
 * Trigger deployment pipeline (4D-Network Agent)
 */
export async function triggerDeployment(config: {
  environment: 'staging' | 'production';
  branch?: string;
  variables?: Record<string, string>;
}): Promise<{
  runId: string;
  url: string;
  status: string;
} | null> {
  if (!isCIEnabled() || !ciAgents) {
    return null;
  }

  try {
    const deployment = await ciAgents.network.triggerDeployment({
      environment: config.environment,
      branch: config.branch || process.env.GITHUB_REF?.replace('refs/heads/', '') || 'main',
      variables: config.variables || {},
    });

    return {
      runId: deployment.id,
      url: deployment.url,
      status: deployment.status,
    };
  } catch (error) {
    console.error('Failed to trigger deployment via CI:', error);
    return null;
  }
}

/**
 * Monitor deployment status (4D-Network Agent)
 */
export async function monitorDeployment(runId: string): Promise<string | null> {
  if (!isCIEnabled() || !ciAgents) {
    return null;
  }

  try {
    const status = await ciAgents.network.monitorDeployment(runId, (newStatus) => {
      console.log(`Deployment status: ${newStatus}`);
    });

    return status;
  } catch (error) {
    console.error('Failed to monitor deployment via CI:', error);
    return null;
  }
}

/**
 * Get pipeline performance metrics (6D-Intelligence Agent)
 */
export async function getPerformanceMetrics(runId: string): Promise<{
  duration: number;
  jobs: number;
  successRate: number;
} | null> {
  if (!isCIEnabled() || !ciAgents) {
    return null;
  }

  try {
    return await ciAgents.intelligence.getPerformanceMetrics(runId);
  } catch (error) {
    console.error('Failed to get performance metrics via CI:', error);
    return null;
  }
}

/**
 * Cleanup CI/CD connection
 */
export async function cleanupCI(): Promise<void> {
  if (ciAgents) {
    try {
      await ciAgents.disconnect();
      ciAgents = null;
      ciEnabled = false;
      console.log('✅ CI/CD connection closed');
    } catch (error) {
      console.error('Failed to cleanup CI connection:', error);
    }
  }
}
