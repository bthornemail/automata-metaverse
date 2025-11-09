# Configuration Guide

This document provides comprehensive examples of using the configuration validation system in meta-log-plugin.

## Basic Configuration

### Minimal Configuration

```typescript
import { OpenCodeMetaLogPlugin } from './adapters/opencode';

// Minimal config - uses defaults
const plugin = new OpenCodeMetaLogPlugin({});
```

### Full Configuration

```typescript
const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './automaton-kernel.jsonl',
  enableProlog: true,
  enableDatalog: true,
  enableRdf: true,
  enableShacl: true,
  configPath: './meta-log-config.json'
});
```

## Configuration Validation

### Validating Before Creation

```typescript
import { ConfigValidator } from './utils/config-validator';

const validator = new ConfigValidator();

const config = {
  canvasPath: './canvas.jsonl',
  enableProlog: true,
  enableDatalog: 'invalid' // Should be boolean
};

const validation = validator.validate(config);

if (!validation.valid) {
  console.error('Configuration errors:');
  for (const error of validation.errors) {
    console.error(`- ${error.message}`);
  }
}
```

### Validation in Plugin

```typescript
// Plugin automatically validates on construction
try {
  const plugin = new OpenCodeMetaLogPlugin({
    enableShacl: true,
    enableRdf: false // Invalid: SHACL requires RDF
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
    console.error('Errors:', error.context?.errors);
  }
}
```

## Default Values

### Automatic Defaults

```typescript
// These are applied automatically if not specified
const config = {
  enableProlog: true,    // Default: true
  enableDatalog: true,   // Default: true
  enableRdf: true,       // Default: true
  enableShacl: true      // Default: true
};
```

### Custom Defaults

```typescript
import { ConfigValidator } from './utils/config-validator';

const validator = new ConfigValidator();

// Apply defaults
const configWithDefaults = validator.applyDefaults({
  canvasPath: './canvas.jsonl'
  // enableProlog, enableDatalog, etc. will be set to defaults
});
```

## Configuration Sanitization

### Removing Invalid Fields

```typescript
import { ConfigValidator } from './utils/config-validator';

const validator = new ConfigValidator();

const config = {
  canvasPath: './canvas.jsonl',
  enableProlog: true,
  invalidField: 'should be removed'
};

// Sanitize - removes invalid fields
const sanitized = validator.sanitize(config);
// Result: { canvasPath: './canvas.jsonl', enableProlog: true }
```

## Field Validation

### Type Validation

```typescript
const validator = new ConfigValidator();

// Valid
validator.validate({
  enableProlog: true,      // boolean ✓
  canvasPath: './path.jsonl' // string ✓
});

// Invalid
validator.validate({
  enableProlog: 'true',    // string ✗ (should be boolean)
  canvasPath: 123         // number ✗ (should be string)
});
```

### Required Fields

```typescript
// Create custom schema with required fields
const customSchema = {
  fields: {
    canvasPath: {
      type: 'path',
      required: true
    },
    enableProlog: {
      type: 'boolean',
      required: false
    }
  },
  required: ['canvasPath']
};

const validator = new ConfigValidator(customSchema);

// Missing required field
const validation = validator.validate({
  enableProlog: true
  // canvasPath missing ✗
});
```

### Value Range Validation

```typescript
const customSchema = {
  fields: {
    maxConnections: {
      type: 'number',
      min: 1,
      max: 100
    }
  }
};

const validator = new ConfigValidator(customSchema);

// Valid
validator.validate({ maxConnections: 50 }); // ✓

// Invalid
validator.validate({ maxConnections: 0 });  // ✗ (below min)
validator.validate({ maxConnections: 200 }); // ✗ (above max)
```

### Pattern Validation

```typescript
const customSchema = {
  fields: {
    canvasPath: {
      type: 'path',
      pattern: /\.jsonl$/,
      message: 'Canvas path must end with .jsonl'
    }
  }
};

const validator = new ConfigValidator(customSchema);

// Valid
validator.validate({ canvasPath: './canvas.jsonl' }); // ✓

// Invalid
validator.validate({ canvasPath: './canvas.txt' }); // ✗
```

### Enum Validation

```typescript
const customSchema = {
  fields: {
    logLevel: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error']
    }
  }
};

const validator = new ConfigValidator(customSchema);

// Valid
validator.validate({ logLevel: 'info' }); // ✓

// Invalid
validator.validate({ logLevel: 'verbose' }); // ✗
```

## Dependency Validation

### Field Dependencies

```typescript
const customSchema = {
  fields: {
    enableShacl: { type: 'boolean' },
    enableRdf: { type: 'boolean' }
  },
  dependencies: {
    enableShacl: ['enableRdf'] // SHACL requires RDF
  }
};

const validator = new ConfigValidator(customSchema);

// Invalid: SHACL enabled but RDF disabled
const validation = validator.validate({
  enableShacl: true,
  enableRdf: false
});
// Returns validation error
```

## Custom Validators

### Custom Validation Function

```typescript
const customSchema = {
  fields: {
    canvasPath: {
      type: 'path',
      validate: (value: string) => {
        if (!fs.existsSync(value)) {
          return 'Canvas file does not exist';
        }
        return true;
      }
    }
  }
};

const validator = new ConfigValidator(customSchema);

const validation = validator.validate({
  canvasPath: './non-existent.jsonl'
});
// Returns validation error if file doesn't exist
```

## Configuration Updates

### Updating Configuration

```typescript
// Update configuration at runtime
await plugin.updateConfig({
  enableProlog: false
});

// Get updated config
const updatedConfig = plugin.getConfig();
```

### Validating Updates

```typescript
// Validate before updating
const updates = {
  enableShacl: true,
  enableRdf: false // Invalid
};

const validation = plugin.validateConfig(updates);

if (validation.valid) {
  await plugin.updateConfig(updates);
} else {
  console.error('Invalid configuration update:', validation.errors);
}
```

## Configuration Persistence

### Saving Configuration

```typescript
// Configuration is automatically saved
await plugin.updateConfig({
  enableProlog: false
});
// Saved to configPath (default: './meta-log-config.json')
```

### Loading Configuration

```typescript
import { ConfigManager } from './utils/config';

const configManager = new ConfigManager('./my-config.json');
const savedConfig = await configManager.load();

// Use saved config
const plugin = new OpenCodeMetaLogPlugin(savedConfig);
```

## Best Practices

### 1. Validate Early

```typescript
// Validate before plugin creation
const validator = new ConfigValidator();
const validation = validator.validate(config);

if (!validation.valid) {
  // Fix errors before creating plugin
  return;
}

const plugin = new OpenCodeMetaLogPlugin(config);
```

### 2. Use TypeScript Types

```typescript
import { PluginConfig } from './core/plugin';

const config: PluginConfig = {
  canvasPath: './canvas.jsonl',
  enableProlog: true
  // TypeScript will catch type errors
};
```

### 3. Handle Validation Errors

```typescript
try {
  const plugin = new OpenCodeMetaLogPlugin(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    // Handle configuration errors
    console.error('Config errors:', error.context?.errors);
  }
}
```

### 4. Use Defaults Wisely

```typescript
// Let defaults handle common cases
const plugin = new OpenCodeMetaLogPlugin({
  canvasPath: './canvas.jsonl'
  // Other fields use defaults
});
```

### 5. Sanitize User Input

```typescript
// Sanitize user-provided config
const userConfig = getUserConfig();
const sanitized = validator.sanitize(userConfig);
const plugin = new OpenCodeMetaLogPlugin(sanitized);
```

## Integration Examples

### With Error Handling

```typescript
try {
  const plugin = new OpenCodeMetaLogPlugin(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    ErrorLogger.log(error);
    // Attempt to fix configuration
    const fixedConfig = fixConfiguration(config, error);
    const plugin = new OpenCodeMetaLogPlugin(fixedConfig);
  }
}
```

### With Health Checks

```typescript
// Validate config before health checks
const validation = plugin.validateConfig(config);
if (validation.valid) {
  const health = await plugin.runHealthChecks();
  // Health checks depend on valid configuration
}
```
