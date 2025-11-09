# Error Handling Guide

This document provides comprehensive examples of using the enhanced error handling system in meta-log-plugin.

## Error Types

### DatabaseError

```typescript
import { DatabaseError } from './utils/errors';

try {
  const db = new MetaLogDb(config);
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
    console.error('Context:', error.context);
    console.error('Recoverable:', error.recoverable);
  }
}
```

### QueryError

```typescript
import { QueryError } from './utils/errors';

try {
  const results = await db.prologQuery('invalid query');
} catch (error) {
  if (error instanceof QueryError) {
    console.error('Query:', error.context?.query);
    console.error('Error:', error.message);
  }
}
```

### ConfigurationError

```typescript
import { ConfigurationError } from './utils/errors';

try {
  const plugin = new OpenCodeMetaLogPlugin({
    enableShacl: true,
    enableRdf: false // Invalid: SHACL requires RDF
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Config error:', error.message);
    console.error('Field:', error.context?.field);
  }
}
```

### CanvasError

```typescript
import { CanvasError } from './utils/errors';

try {
  await plugin.loadCanvas('./non-existent.jsonl');
} catch (error) {
  if (error instanceof CanvasError) {
    console.error('Canvas path:', error.context?.path);
    console.error('Error:', error.message);
    
    // Attempt recovery
    if (error.recoverable) {
      // Try alternative path
      await plugin.loadCanvas('./fallback.jsonl');
    }
  }
}
```

### ValidationError

```typescript
import { ValidationError } from './utils/errors';

const validation = plugin.validateConfig({
  enableProlog: 'invalid' // Should be boolean
});

if (!validation.valid) {
  for (const error of validation.errors) {
    if (error instanceof ValidationError) {
      console.error('Field:', error.context?.field);
      console.error('Value:', error.context?.value);
      console.error('Message:', error.message);
    }
  }
}
```

### LifecycleError

```typescript
import { LifecycleError } from './utils/errors';

try {
  await plugin.onLoad();
} catch (error) {
  if (error instanceof LifecycleError) {
    console.error('Stage:', error.context?.stage);
    console.error('Error:', error.message);
  }
}
```

## Error Recovery

### Automatic Recovery

```typescript
import { ErrorRecovery } from './utils/errors';

try {
  await plugin.loadCanvas('./canvas.jsonl');
} catch (error) {
  if (error instanceof CanvasError && error.recoverable) {
    const recovered = await ErrorRecovery.recover(error);
    if (recovered) {
      console.log('Error recovered successfully');
    } else {
      console.error('Recovery failed');
    }
  }
}
```

### Custom Recovery

```typescript
async function customRecovery(error: MetaLogError) {
  if (error.code === 'CANVAS_ERROR') {
    // Try alternative canvas path
    const altPath = './backup-canvas.jsonl';
    try {
      await plugin.loadCanvas(altPath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// Register custom recovery
ErrorRecovery.register('CANVAS_ERROR', customRecovery);
```

## Error Logging

### Basic Logging

```typescript
import { ErrorLogger } from './utils/errors';

try {
  await plugin.loadCanvas('./canvas.jsonl');
} catch (error) {
  ErrorLogger.log(error);
}
```

### Error Statistics

```typescript
// Get error statistics
const stats = ErrorLogger.getStatistics();

console.log('Total errors:', stats.total);
console.log('By code:', stats.byCode);
console.log('Recoverable:', stats.recoverable);
console.log('Unrecoverable:', stats.unrecoverable);
```

### Error History

```typescript
// Get all logged errors
const errors = ErrorLogger.getErrors();

for (const error of errors) {
  console.log(`${error.code}: ${error.message}`);
  console.log('Context:', error.context);
  console.log('Timestamp:', error.timestamp);
}
```

### Clear Error Log

```typescript
// Clear error log
ErrorLogger.clear();

// Or via plugin
plugin.clearErrorLog();
```

## Plugin Integration

### Error Handling in Plugin Methods

```typescript
class MyPlugin extends BaseMetaLogPlugin {
  async onLoad(): Promise<void> {
    try {
      await this.loadCanvas();
    } catch (error) {
      // Error is automatically logged
      // Attempt recovery if possible
      const recovered = await ErrorRecovery.recover(error);
      if (!recovered) {
        throw error; // Re-throw if recovery failed
      }
    }
  }
}
```

### Error Statistics API

```typescript
// Get error statistics
const stats = plugin.getErrorStatistics();

console.log('Error statistics:', stats);

// Monitor errors over time
setInterval(() => {
  const currentStats = plugin.getErrorStatistics();
  if (currentStats.total > 100) {
    console.warn('High error count detected!');
  }
}, 60000); // Check every minute
```

## Best Practices

### 1. Always Handle Errors

```typescript
// Good
try {
  await plugin.loadCanvas(path);
} catch (error) {
  ErrorLogger.log(error);
  // Handle appropriately
}

// Bad
await plugin.loadCanvas(path); // Unhandled error
```

### 2. Check Error Types

```typescript
try {
  await plugin.loadCanvas(path);
} catch (error) {
  if (error instanceof CanvasError) {
    // Handle canvas-specific error
  } else if (error instanceof DatabaseError) {
    // Handle database error
  } else {
    // Handle generic error
  }
}
```

### 3. Use Error Context

```typescript
try {
  await plugin.loadCanvas(path);
} catch (error) {
  if (error instanceof CanvasError) {
    console.error('Failed to load:', error.context?.path);
    // Use context for recovery
  }
}
```

### 4. Log All Errors

```typescript
try {
  await operation();
} catch (error) {
  ErrorLogger.log(error);
  // Continue handling
}
```

### 5. Monitor Error Rates

```typescript
// Monitor error rates
const stats = plugin.getErrorStatistics();

if (stats.total > threshold) {
  // Alert or take action
  console.warn('High error rate detected!');
}
```

## Error Recovery Strategies

### Retry Strategy

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const result = await retryOperation(() => 
  plugin.loadCanvas('./canvas.jsonl')
);
```

### Fallback Strategy

```typescript
async function loadCanvasWithFallback(path: string) {
  try {
    await plugin.loadCanvas(path);
  } catch (error) {
    if (error instanceof CanvasError) {
      // Try fallback
      const fallbackPath = './backup-canvas.jsonl';
      try {
        await plugin.loadCanvas(fallbackPath);
        console.log('Used fallback canvas');
      } catch {
        throw error; // Re-throw original error
      }
    } else {
      throw error;
    }
  }
}
```

### Graceful Degradation

```typescript
async function loadWithDegradation() {
  try {
    await plugin.loadCanvas('./canvas.jsonl');
  } catch (error) {
    ErrorLogger.log(error);
    
    // Continue with limited functionality
    console.warn('Canvas loading failed, using limited mode');
    
    // Initialize with minimal config
    const minimalConfig = {
      enableProlog: true,
      enableDatalog: false,
      enableRdf: false,
      enableShacl: false
    };
    
    // Continue with minimal features
  }
}
```

## Error Reporting

### JSON Export

```typescript
// Export errors as JSON
const errors = ErrorLogger.getErrors();
const json = JSON.stringify(errors.map(e => e.toJSON()), null, 2);
fs.writeFileSync('./errors.json', json);
```

### Error Dashboard

```typescript
// Create error dashboard data
function createErrorDashboard() {
  const stats = ErrorLogger.getStatistics();
  const recentErrors = ErrorLogger.getErrors().slice(-10);
  
  return {
    summary: stats,
    recent: recentErrors.map(e => ({
      code: e.code,
      message: e.message,
      timestamp: e.timestamp,
      recoverable: e.recoverable
    }))
  };
}
```

## Integration Examples

### With Health Checks

```typescript
// Combine error handling with health checks
const healthStatus = await plugin.getHealthStatus();

if (healthStatus === 'unhealthy') {
  const errors = ErrorLogger.getErrors();
  console.error('Unhealthy - recent errors:', errors.slice(-5));
}
```

### With Performance Monitoring

```typescript
// Track errors in performance metrics
const stats = plugin.getPerformanceStats();
const errorStats = plugin.getErrorStatistics();

// Correlate errors with performance
if (errorStats.total > 0 && stats.averageQueryTime > 1000) {
  console.warn('High error rate and slow queries detected');
}
```
