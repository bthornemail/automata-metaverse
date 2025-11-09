import { HealthChecker } from '../utils/health.js';
import { MetaLogDb } from 'meta-log-db';

describe('HealthChecker', () => {
  let db: MetaLogDb;
  let checker: HealthChecker;

  beforeEach(() => {
    db = new MetaLogDb({
      enableProlog: true,
      enableDatalog: true,
      enableRdf: true,
      enableShacl: true
    });
    checker = new HealthChecker(db);
  });

  describe('Health checks', () => {
    test('should run all health checks', async () => {
      const result = await checker.runAll();

      expect(result).toBeDefined();
      expect(result.status).toMatch(/healthy|degraded|unhealthy/);
      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    test('should have summary statistics', async () => {
      const result = await checker.runAll();

      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
    });

    test('should run specific check', async () => {
      const check = await checker.runCheck('database-connectivity');

      expect(check).toBeDefined();
      expect(check.name).toBe('database-connectivity');
      expect(check.status).toMatch(/pass|fail|warn/);
    });

    test('should throw for unknown check', async () => {
      await expect(checker.runCheck('unknown-check')).rejects.toThrow();
    });
  });

  describe('Custom health checks', () => {
    test('should register custom check', async () => {
      checker.registerCheck('custom-check', async () => ({
        name: 'custom-check',
        status: 'pass',
        message: 'Custom check passed'
      }));

      const check = await checker.runCheck('custom-check');
      expect(check.name).toBe('custom-check');
      expect(check.status).toBe('pass');
    });
  });

  describe('Health status', () => {
    test('should get health status', async () => {
      const status = await checker.getStatus();

      expect(status).toMatch(/healthy|degraded|unhealthy/);
    });
  });
});
