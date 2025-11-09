/**
 * Health Check System for Meta-Log Plugin
 * Provides database connectivity checks, query execution tests, and resource monitoring
 */

import { MetaLogDb } from 'meta-log-db';
import { MetaLogError, DatabaseError, QueryError } from './errors.js';

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: Date;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
  details?: Record<string, any>;
}

/**
 * Health Check Manager
 */
export class HealthChecker {
  private db: MetaLogDb;
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();

  constructor(db: MetaLogDb) {
    this.db = db;
    this.registerDefaultChecks();
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    this.registerCheck('database-connectivity', () => this.checkDatabaseConnectivity());
    this.registerCheck('query-execution', () => this.checkQueryExecution());
    this.registerCheck('memory-usage', () => this.checkMemoryUsage());
    this.registerCheck('canvas-accessibility', () => this.checkCanvasAccessibility());
  }

  /**
   * Register a custom health check
   */
  registerCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }

  /**
   * Run all health checks
   */
  async runAll(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];
    const startTime = Date.now();

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const checkStart = Date.now();
        const result = await checkFn();
        result.duration = Date.now() - checkStart;
        checks.push(result);
      } catch (error) {
        checks.push({
          name,
          status: 'fail',
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { error: error instanceof Error ? error.stack : String(error) }
        });
      }
    }

    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warn').length
    };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (summary.failed === 0 && summary.warnings === 0) {
      status = 'healthy';
    } else if (summary.failed === 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: new Date(),
      summary
    };
  }

  /**
   * Run a specific health check
   */
  async runCheck(name: string): Promise<HealthCheck> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    const result = await checkFn();
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<HealthCheck> {
    try {
      // Try to get database instance
      if (!this.db) {
        return {
          name: 'database-connectivity',
          status: 'fail',
          message: 'Database instance not available'
        };
      }

      // Try to extract facts (lightweight operation)
      const facts = this.db.extractFacts();
      
      return {
        name: 'database-connectivity',
        status: 'pass',
        message: 'Database is accessible',
        details: {
          factCount: facts.length
        }
      };
    } catch (error) {
      return {
        name: 'database-connectivity',
        status: 'fail',
        message: `Database connectivity check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.stack : String(error) }
      };
    }
  }

  /**
   * Check query execution
   */
  private async checkQueryExecution(): Promise<HealthCheck> {
    try {
      // Try a simple ProLog query
      try {
        const result = await this.db.prologQuery('(true)');
        return {
          name: 'query-execution',
          status: 'pass',
          message: 'Query execution is working',
          details: {
            queryType: 'prolog',
            resultCount: result.bindings?.length || 0
          }
        };
      } catch (prologError) {
        // Try DataLog query as fallback
        try {
          const result = await this.db.datalogQuery('(true)');
          return {
            name: 'query-execution',
            status: 'warn',
            message: 'ProLog queries failed, but DataLog queries work',
            details: {
              queryType: 'datalog',
              prologError: prologError instanceof Error ? prologError.message : String(prologError)
            }
          };
        } catch (datalogError) {
          return {
            name: 'query-execution',
            status: 'fail',
            message: 'Both ProLog and DataLog queries failed',
            details: {
              prologError: prologError instanceof Error ? prologError.message : String(prologError),
              datalogError: datalogError instanceof Error ? datalogError.message : String(datalogError)
            }
          };
        }
      }
    } catch (error) {
      return {
        name: 'query-execution',
        status: 'fail',
        message: `Query execution check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.stack : String(error) }
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheck> {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        const heapUsedMB = usage.heapUsed / 1024 / 1024;
        const heapTotalMB = usage.heapTotal / 1024 / 1024;
        const rssMB = usage.rss / 1024 / 1024;

        // Warning if heap usage exceeds 80% of total
        const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
        
        let status: 'pass' | 'warn' | 'fail' = 'pass';
        let message = 'Memory usage is normal';

        if (heapUsagePercent > 90) {
          status = 'fail';
          message = `Memory usage is critical: ${heapUsagePercent.toFixed(1)}%`;
        } else if (heapUsagePercent > 80) {
          status = 'warn';
          message = `Memory usage is high: ${heapUsagePercent.toFixed(1)}%`;
        }

        return {
          name: 'memory-usage',
          status,
          message,
          details: {
            heapUsedMB: heapUsedMB.toFixed(2),
            heapTotalMB: heapTotalMB.toFixed(2),
            rssMB: rssMB.toFixed(2),
            heapUsagePercent: heapUsagePercent.toFixed(1)
          }
        };
      } else {
        return {
          name: 'memory-usage',
          status: 'warn',
          message: 'Memory usage information not available',
          details: { reason: 'process.memoryUsage not available' }
        };
      }
    } catch (error) {
      return {
        name: 'memory-usage',
        status: 'warn',
        message: `Memory usage check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.stack : String(error) }
      };
    }
  }

  /**
   * Check canvas accessibility
   */
  private async checkCanvasAccessibility(): Promise<HealthCheck> {
    try {
      // Try to extract facts (requires canvas to be loaded)
      const facts = this.db.extractFacts();
      
      if (facts.length === 0) {
        return {
          name: 'canvas-accessibility',
          status: 'warn',
          message: 'No canvas data loaded',
          details: {
            factCount: 0
          }
        };
      }

      return {
        name: 'canvas-accessibility',
        status: 'pass',
        message: 'Canvas data is accessible',
        details: {
          factCount: facts.length
        }
      };
    } catch (error) {
      return {
        name: 'canvas-accessibility',
        status: 'fail',
        message: `Canvas accessibility check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.stack : String(error) }
      };
    }
  }

  /**
   * Get health check status summary
   */
  async getStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    const result = await this.runAll();
    return result.status;
  }
}
