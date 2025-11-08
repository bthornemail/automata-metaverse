/**
 * CI Pipeline Utility Functions
 * 
 * Helper functions for common CI/CD operations
 */

import { CIPipelineAdapter, PipelineStatus, PipelineRun } from './interface';

/**
 * Wait for a pipeline to complete
 * @param adapter CI adapter instance
 * @param runId Pipeline run ID
 * @param options Configuration options
 * @returns Final pipeline status
 */
export async function waitForPipeline(
  adapter: CIPipelineAdapter,
  runId: string,
  options: {
    interval?: number; // Polling interval in milliseconds (default: 5000)
    timeout?: number; // Timeout in milliseconds (default: 3600000 = 1 hour)
    onStatusChange?: (status: PipelineStatus) => void; // Callback for status changes
  } = {}
): Promise<PipelineStatus> {
  const {
    interval = 5000,
    timeout = 3600000, // 1 hour default
    onStatusChange,
  } = options;

  const startTime = Date.now();
  let lastStatus: PipelineStatus | null = null;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > timeout) {
      throw new Error(`Pipeline timeout after ${timeout}ms`);
    }

    const status = await adapter.getPipelineStatus(runId);
    
    if (status !== lastStatus) {
      lastStatus = status;
      onStatusChange?.(status);
    }

    if (status === 'success' || status === 'failure' || status === 'cancelled' || status === 'skipped') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Trigger pipeline and wait for completion
 * @param adapter CI adapter instance
 * @param config Pipeline configuration
 * @param options Wait options
 * @returns Pipeline run result with final status
 */
export async function triggerAndWait(
  adapter: CIPipelineAdapter,
  config: Parameters<CIPipelineAdapter['triggerPipeline']>[0],
  options?: Parameters<typeof waitForPipeline>[2]
): Promise<{ run: PipelineRun; finalStatus: PipelineStatus }> {
  const run = await adapter.triggerPipeline(config);
  const finalStatus = await waitForPipeline(adapter, run.id, options);
  
  return { run, finalStatus };
}

/**
 * Format pipeline logs for display
 * @param logs Raw pipeline logs
 * @returns Formatted log string
 */
export function formatPipelineLogs(logs: string): string {
  return logs
    .split('\n')
    .map((line, index) => {
      // Add line numbers and formatting
      if (line.trim()) {
        return `${String(index + 1).padStart(4, ' ')} | ${line}`;
      }
      return line;
    })
    .join('\n');
}

/**
 * Check if pipeline status indicates success
 */
export function isPipelineSuccess(status: PipelineStatus): boolean {
  return status === 'success';
}

/**
 * Check if pipeline status indicates failure
 */
export function isPipelineFailure(status: PipelineStatus): boolean {
  return status === 'failure' || status === 'cancelled';
}

/**
 * Check if pipeline is still running
 */
export function isPipelineRunning(status: PipelineStatus): boolean {
  return status === 'running' || status === 'pending';
}
