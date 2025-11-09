#!/usr/bin/env tsx
/**
 * CanvasL File Validation Script
 * Validates .canvasl files against CanvasL specification
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    directives: number;
    jsonlEntries: number;
    bipartiteNodes: number;
    horizontalEdges: number;
    r5rsCalls: number;
  };
}

function validateCanvasLFile(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: path.basename(filePath),
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      directives: 0,
      jsonlEntries: 0,
      bipartiteNodes: 0,
      horizontalEdges: 0,
      r5rsCalls: 0
    }
  };

  if (!fs.existsSync(filePath)) {
    result.valid = false;
    result.errors.push('File does not exist');
    return result;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let inDirectives = true;
  let directiveEndLine = -1;
  let hasBlankAfterDirectives = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    const lineNum = i + 1;

    // Skip empty lines
    if (!line) {
      if (inDirectives && directiveEndLine === -1) {
        directiveEndLine = i;
        hasBlankAfterDirectives = true;
      }
      continue;
    }

    // Check for directives
    if (line.startsWith('@')) {
      if (!inDirectives) {
        result.warnings.push(`Line ${lineNum}: Directive found after JSONL entries (should be at top)`);
      } else {
        result.stats.directives++;
        
        // Validate directive format
        const directiveMatch = line.match(/^@([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.+)$/);
        if (!directiveMatch || directiveMatch.length < 3) {
          result.errors.push(`Line ${lineNum}: Invalid directive format: ${line}`);
          result.valid = false;
        } else {
          const name = directiveMatch[1];
          const value = directiveMatch[2];
          if (!name || value === undefined) {
            result.errors.push(`Line ${lineNum}: Invalid directive format: ${line}`);
            result.valid = false;
            continue;
          }
          // Check for standard directives
          if (['version', 'schema', 'r5rs-engine', 'dimension'].includes(name)) {
            // Valid standard directive (value is available but not currently validated)
          } else {
            result.warnings.push(`Line ${lineNum}: Custom directive: @${name}`);
          }
        }
      }
      continue;
    }

    // Check for blank line after directives
    if (inDirectives && directiveEndLine === -1 && result.stats.directives > 0) {
      result.errors.push(`Line ${lineNum}: Missing blank line after directives`);
      result.valid = false;
    }

    // We've moved past directives
    if (inDirectives && result.stats.directives > 0) {
      inDirectives = false;
    }

    // Parse JSONL entry
    try {
      const obj = JSON.parse(line);
      result.stats.jsonlEntries++;

      // Check for bipartite nodes
      if (obj.partition === 'left' || obj.partition === 'right') {
        result.stats.bipartiteNodes++;
      }

      // Check for horizontal edges
      if (obj.type === 'horizontal' || (obj.type === 'edge' && obj.id?.startsWith('h:'))) {
        result.stats.horizontalEdges++;
      }

      // Check for R5RS calls
      if (obj.type === 'r5rs-call' || obj.function?.startsWith('r5rs:') || obj.expression) {
        result.stats.r5rsCalls++;
      }

      // Validate required fields
      if (!obj.id && obj.type !== 'comment') {
        result.warnings.push(`Line ${lineNum}: JSONL entry missing 'id' field`);
      }

      if (!obj.type && obj.id) {
        result.warnings.push(`Line ${lineNum}: JSONL entry missing 'type' field`);
      }

    } catch (e) {
      result.errors.push(`Line ${lineNum}: Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      result.valid = false;
    }
  }

  // Final checks
  if (result.stats.directives === 0) {
    result.warnings.push('No directives found (recommended: @version, @schema, @r5rs-engine)');
  }

  if (result.stats.jsonlEntries === 0) {
    result.errors.push('No JSONL entries found');
    result.valid = false;
  }

  return result;
}

function main() {
  const examplesDir = path.join(__dirname, 'examples');
  const rootDir = __dirname;
  
  const canvaslFiles: string[] = [];
  
  // Find all .canvasl files
  if (fs.existsSync(examplesDir)) {
    const files = fs.readdirSync(examplesDir);
    files.forEach(file => {
      if (file.endsWith('.canvasl')) {
        canvaslFiles.push(path.join(examplesDir, file));
      }
    });
  }

  // Check root directory
  const rootFiles = fs.readdirSync(rootDir);
  rootFiles.forEach(file => {
    if (file.endsWith('.canvasl') && !canvaslFiles.includes(path.join(rootDir, file))) {
      canvaslFiles.push(path.join(rootDir, file));
    }
  });

  if (canvaslFiles.length === 0) {
    console.log('❌ No .canvasl files found');
    return;
  }

  console.log('🔍 Validating CanvasL Files\n');
  console.log('='.repeat(80));

  const results: ValidationResult[] = [];
  let totalValid = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  canvaslFiles.forEach(filePath => {
    const result = validateCanvasLFile(filePath);
    results.push(result);
    
    if (result.valid) {
      totalValid++;
    }
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    console.log(`\n📄 ${result.file}`);
    console.log(`   Location: ${filePath}`);
    console.log(`   Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
    
    console.log(`\n   📊 Statistics:`);
    console.log(`      Directives: ${result.stats.directives}`);
    console.log(`      JSONL Entries: ${result.stats.jsonlEntries}`);
    console.log(`      Bipartite Nodes: ${result.stats.bipartiteNodes}`);
    console.log(`      Horizontal Edges: ${result.stats.horizontalEdges}`);
    console.log(`      R5RS Calls: ${result.stats.r5rsCalls}`);

    if (result.errors.length > 0) {
      console.log(`\n   ❌ Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`      - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\n   ⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(warn => console.log(`      - ${warn}`));
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   Files Validated: ${canvaslFiles.length}`);
  console.log(`   Valid Files: ${totalValid}/${canvaslFiles.length}`);
  console.log(`   Total Errors: ${totalErrors}`);
  console.log(`   Total Warnings: ${totalWarnings}`);

  if (totalValid === canvaslFiles.length && totalErrors === 0) {
    console.log('\n✅ All files are valid!');
  } else {
    console.log('\n⚠️  Some files have issues. Please review the errors above.');
  }
}

if (require.main === module) {
  main();
}

export { validateCanvasLFile, ValidationResult };
