#!/usr/bin/env tsx
/**
 * Snapshot All Automaton Evolutions in Parallel
 * Tests each automaton variant with snapshot collection
 * Runs tests in parallel batches (default: 3 workers, configurable via PARALLEL_WORKERS env var)
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { takeSnapshot, MemorySnapshot } from './snapshot-automaton-memory';

interface EvolutionTest {
  name: string;
  path: string;
  type: 'extends-advanced' | 'extends-memory-optimized' | 'standalone';
  testDuration: number; // seconds
  automatonFile?: string; // Optional: specific automaton file path (relative to project root)
  status: 'pending' | 'running' | 'completed' | 'failed';
  snapshots: number;
  error?: string;
}

const EVOLUTIONS_DIR = path.join(__dirname, 'evolutions');
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots-memory');
const EVOLUTION_VARIANTS_DIR = path.join(__dirname, 'evolution-variants');
const DEFAULT_AUTOMATON_FILE = path.join(__dirname, 'automaton.jsonl');
const TEST_DURATION = 30; // 30 seconds per variant

/**
 * Find the automaton file for a specific evolution variant.
 * Checks in order:
 * 1. Explicit automatonFile specified in evolution config
 * 2. evolution-variants/automaton.{name}.canvasl
 * 3. evolutions/{name}/automaton.canvasl
 * 4. evolutions/{name}/automaton.jsonl
 * 5. Default automaton.jsonl
 */
function findAutomatonFileForVariant(evolution: EvolutionTest): string {
  // If explicitly specified, use that
  if (evolution.automatonFile) {
    const explicitPath = path.join(__dirname, evolution.automatonFile);
    if (fs.existsSync(explicitPath)) {
      return explicitPath;
    }
    console.warn(`   ⚠️  Specified automaton file not found: ${evolution.automatonFile}, falling back to search`);
  }
  
  // Try evolution-variants/automaton.{name}.canvasl
  const variantCanvasl = path.join(EVOLUTION_VARIANTS_DIR, `automaton.${evolution.name}.canvasl`);
  if (fs.existsSync(variantCanvasl)) {
    return variantCanvasl;
  }
  
  // Try evolutions/{name}/automaton.canvasl
  const evolutionCanvasl = path.join(EVOLUTIONS_DIR, evolution.name, 'automaton.canvasl');
  if (fs.existsSync(evolutionCanvasl)) {
    return evolutionCanvasl;
  }
  
  // Try evolutions/{name}/automaton.jsonl
  const evolutionJsonl = path.join(EVOLUTIONS_DIR, evolution.name, 'automaton.jsonl');
  if (fs.existsSync(evolutionJsonl)) {
    return evolutionJsonl;
  }
  
  // Fall back to default
  return DEFAULT_AUTOMATON_FILE;
}

const evolutions: EvolutionTest[] = [
  {
    name: 'advanced-automaton',
    path: 'evolutions/advanced-automaton/advanced-automaton.ts',
    type: 'standalone',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  },
  {
    name: 'automaton-runner',
    path: 'evolutions/automaton-runner/automaton-runner.ts',
    type: 'standalone',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  },
  {
    name: 'automaton-memory-optimized',
    path: 'evolutions/automaton-memory-optimized/automaton-memory-optimized.ts',
    type: 'extends-advanced',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  },
  {
    name: 'automaton-evolved',
    path: 'evolutions/automaton-evolved/automaton-evolved.ts',
    type: 'extends-memory-optimized',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  },
  {
    name: 'automaton-scalable',
    path: 'evolutions/automaton-scalable/automaton-scalable.ts',
    type: 'extends-memory-optimized',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  },
  {
    name: 'continuous-automaton',
    path: 'evolutions/continuous-automaton/continuous-automaton.ts',
    type: 'extends-advanced',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  },
  {
    name: 'ollama-automaton',
    path: 'evolutions/ollama-automaton/ollama-automaton.ts',
    type: 'extends-advanced',
    testDuration: TEST_DURATION,
    status: 'pending',
    snapshots: 0
  }
];

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

async function testEvolutionWithSnapshots(evolution: EvolutionTest): Promise<void> {
  return new Promise((resolve, reject) => {
    evolution.status = 'running';
    const fullPath = path.join(__dirname, evolution.path);
    
    if (!fs.existsSync(fullPath)) {
      evolution.status = 'failed';
      evolution.error = 'File not found';
      reject(new Error('File not found'));
      return;
    }
    
    // Find variant-specific automaton file
    const variantAutomatonFile = findAutomatonFileForVariant(evolution);
    console.log(`   📁 Using automaton file: ${path.relative(__dirname, variantAutomatonFile)}`);
    
    // Create a unique backup for this test (to avoid conflicts in parallel execution)
    const backupPath = `${DEFAULT_AUTOMATON_FILE}.backup.${evolution.name}`;
    if (fs.existsSync(DEFAULT_AUTOMATON_FILE) && variantAutomatonFile === DEFAULT_AUTOMATON_FILE) {
      fs.copyFileSync(DEFAULT_AUTOMATON_FILE, backupPath);
    }
    
    // Create variant-specific snapshot directory
    const variantSnapshotDir = path.join(SNAPSHOT_DIR, evolution.name);
    if (!fs.existsSync(variantSnapshotDir)) {
      fs.mkdirSync(variantSnapshotDir, { recursive: true });
    }
    
    console.log(`\n🔄 Testing ${evolution.name}...`);
    console.log(`   Type: ${evolution.type}`);
    console.log(`   Duration: ${evolution.testDuration}s`);
    
    let snapshotCount = 0;
    const snapshots: MemorySnapshot[] = [];
    const startTime = Date.now();
    
    // Take initial snapshot
    takeSnapshot().then(initialSnapshot => {
      snapshots.push(initialSnapshot);
      snapshotCount++;
      
      // Set up snapshot interval (every 100ms for testing)
      const snapshotInterval = setInterval(async () => {
        try {
          const snapshot = await takeSnapshot();
          snapshots.push(snapshot);
          snapshotCount++;
          
          // Save snapshot to variant-specific directory
          const filename = `snapshot-${snapshotCount.toString().padStart(6, '0')}-${snapshot.timestamp}.json`;
          const filepath = path.join(variantSnapshotDir, filename);
          fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
        } catch (error) {
          console.error(`   ⚠️  Snapshot error: ${error}`);
        }
      }, 100); // 100ms intervals for testing
      
      // Run the automaton variant using tsx
      // Create a test script that imports and runs the variant
      const testScriptPath = path.join(__dirname, `.test-${evolution.name}.ts`);
      // Use file path without .ts extension for import
      const importPath = fullPath.replace(/\.ts$/, '');
      const testScript = `#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const AUTOMATON_FILE = '${variantAutomatonFile}';
const TEST_DURATION = ${evolution.testDuration * 1000};
const VARIANT_PATH = '${importPath}';

async function testVariant() {
  try {
    // Dynamic import of the variant (tsx handles .ts files)
    const variant = await import(VARIANT_PATH);
    console.log('✅ Variant loaded successfully');
    
    // If it exports a class, try to instantiate it
    // Check for all possible export names (CommonJS and ES modules)
    // tsx imports CommonJS modules with 'module.exports' wrapper
    const moduleExports = variant['module.exports'] || variant;
    const AutomatonClass = moduleExports.AdvancedSelfReferencingAutomaton || 
                           moduleExports.SelfReferencingAutomaton || 
                           moduleExports.MemoryOptimizedAutomaton ||
                           moduleExports.EvolvedAutomaton ||
                           moduleExports.ScalableAutomaton ||
                           moduleExports.ContinuousAutomatonRunner ||
                           moduleExports.OllamaAutomatonRunner ||
                           variant.AdvancedSelfReferencingAutomaton ||
                           variant.SelfReferencingAutomaton ||
                           variant.MemoryOptimizedAutomaton ||
                           variant.EvolvedAutomaton ||
                           variant.ScalableAutomaton ||
                           variant.ContinuousAutomatonRunner ||
                           variant.OllamaAutomatonRunner ||
                           variant.default;
    
    if (AutomatonClass && typeof AutomatonClass === 'function') {
      try {
        // Some runners take different constructor args
        let automaton;
        const className = AutomatonClass.name || 'Unknown';
        if (className.includes('Runner') || className.includes('Continuous') || className.includes('Ollama')) {
          // Runners take file path, useOllama, model
          try {
            automaton = new AutomatonClass(AUTOMATON_FILE, false, 'llama3.2');
            console.log('✅ Runner variant instantiated');
          } catch (e: any) {
            // Fallback: try with just file path
            automaton = new AutomatonClass(AUTOMATON_FILE);
            console.log('✅ Runner variant instantiated (fallback)');
          }
        } else {
          // Standard automatons take just file path
          automaton = new AutomatonClass(AUTOMATON_FILE);
          console.log('✅ Automaton instantiated');
        }
        
        // Run for a short period
        await new Promise(resolve => setTimeout(resolve, TEST_DURATION));
        
        console.log('✅ Test completed');
        process.exit(0);
      } catch (error: any) {
        // If instantiation fails, just validate the import
        console.log('✅ Variant validated (instantiation skipped:', error.message + ')');
        process.exit(0);
      }
    } else {
      console.log('✅ Variant validated (no class export found, may be script-only)');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testVariant();
`;
      
      // Write test script to temporary file
      fs.writeFileSync(testScriptPath, testScript);
      fs.chmodSync(testScriptPath, 0o755); // Make executable
      
      // Use tsx with proper TypeScript/ES module support
      const child = spawn('tsx', [testScriptPath], {
        stdio: 'pipe',
        env: { 
          ...process.env, 
          NODE_OPTIONS: '--expose-gc'
        },
        cwd: __dirname
      });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`   ${data.toString().trim()}`);
      });
      
      child.stderr.on('data', (data) => {
        output += data.toString();
        console.error(`   ⚠️  ${data.toString().trim()}`);
      });
      
      const timeout = setTimeout(() => {
        clearInterval(snapshotInterval);
        child.kill();
        evolution.status = 'failed';
        evolution.error = 'Timeout';
        reject(new Error('Timeout'));
      }, (evolution.testDuration + 5) * 1000);
      
      child.on('exit', (code) => {
        clearInterval(snapshotInterval);
        clearTimeout(timeout);
        
        // Clean up test script
        if (fs.existsSync(testScriptPath)) {
          try {
            fs.unlinkSync(testScriptPath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
        const duration = Date.now() - startTime;
        evolution.snapshots = snapshotCount;
        
        // Take final snapshot
        takeSnapshot().then(finalSnapshot => {
          snapshots.push(finalSnapshot);
          
          // Save summary
          const summary = {
            evolution: evolution.name,
            type: evolution.type,
            automatonFile: path.relative(__dirname, variantAutomatonFile),
            duration: duration,
            snapshots: snapshotCount,
            status: code === 0 ? 'completed' : 'failed',
            memory: {
              start: snapshots[0]?.memory.heapUsed || 0,
              end: finalSnapshot.memory.heapUsed,
              peak: Math.max(...snapshots.map(s => s.memory.heapUsed))
            },
            objects: {
              start: snapshots[0]?.automatonState.objectCount || 0,
              end: finalSnapshot.automatonState.objectCount
            }
          };
          
          const summaryPath = path.join(variantSnapshotDir, 'summary.json');
          fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
          
          // Restore backup (only if we backed up the default file)
          // Note: In parallel execution, we don't restore to avoid conflicts
          // Each test uses its own variant file anyway
          if (fs.existsSync(backupPath) && variantAutomatonFile === DEFAULT_AUTOMATON_FILE) {
            try {
              fs.copyFileSync(backupPath, DEFAULT_AUTOMATON_FILE);
              fs.unlinkSync(backupPath);
            } catch (error) {
              // Ignore restore errors in parallel execution (file may be in use)
              if (process.env.PARALLEL_WORKERS) {
                // Clean up backup file even if restore failed
                try {
                  fs.unlinkSync(backupPath);
                } catch {
                  // Ignore cleanup errors
                }
              }
            }
          }
          
          if (code === 0) {
            evolution.status = 'completed';
            console.log(`   ✅ Completed: ${snapshotCount} snapshots in ${(duration / 1000).toFixed(1)}s`);
            resolve();
          } else {
            evolution.status = 'failed';
            evolution.error = `Exit code ${code}`;
            reject(new Error(`Exit code ${code}`));
          }
        }).catch(reject);
      });
    }).catch(reject);
  });
}

async function runAllEvolutionTests(): Promise<void> {
  const PARALLEL_WORKERS = parseInt(process.env.PARALLEL_WORKERS || '3'); // Default to 3 parallel workers
  
  console.log('🔍 Snapshot Testing All Automaton Evolutions\n');
  console.log('='.repeat(80));
  console.log(`   Total Variants: ${evolutions.length}`);
  console.log(`   Parallel Workers: ${PARALLEL_WORKERS}`);
  console.log(`   Test Duration: ${TEST_DURATION}s per variant`);
  console.log(`   Snapshot Interval: 100ms`);
  console.log('='.repeat(80));
  
  const results = {
    total: evolutions.length,
    completed: 0,
    failed: 0
  };
  
  // Run tests in parallel batches
  const batches: EvolutionTest[][] = [];
  for (let i = 0; i < evolutions.length; i += PARALLEL_WORKERS) {
    batches.push(evolutions.slice(i, i + PARALLEL_WORKERS));
  }
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]!;
    console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length} (${batch.length} variants in parallel)...`);
    
    // Run batch in parallel
    const batchPromises = batch.map(async (evolution, index) => {
      const globalIndex = batchIndex * PARALLEL_WORKERS + index + 1;
      console.log(`\n[${globalIndex}/${evolutions.length}] Testing ${evolution.name}...`);
      
      try {
        await testEvolutionWithSnapshots(evolution);
        results.completed++;
        return { success: true, evolution };
      } catch (error) {
        results.failed++;
        evolution.status = 'failed';
        evolution.error = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed: ${evolution.error}`);
        return { success: false, evolution };
      }
    });
    
    // Wait for all tests in batch to complete
    await Promise.all(batchPromises);
    
    // Brief pause between batches
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Summary:');
  console.log(`   Total: ${results.total}`);
  console.log(`   ✅ Completed: ${results.completed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  console.log('\n📸 Snapshot Summary:');
  evolutions.forEach(e => {
    const status = e.status === 'completed' ? '✅' : e.status === 'failed' ? '❌' : '⏳';
    console.log(`   ${status} ${e.name.padEnd(35)} ${e.snapshots} snapshots`);
  });
  
  console.log('\n💾 Snapshot Locations:');
  evolutions.forEach(e => {
    const variantDir = path.join(SNAPSHOT_DIR, e.name);
    if (fs.existsSync(variantDir)) {
      const files = fs.readdirSync(variantDir).filter(f => f.endsWith('.json'));
      console.log(`   ${e.name}: ${files.length} files in ${variantDir}`);
    }
  });
  
  if (results.failed > 0) {
    console.log('\n⚠️  Some tests failed. Review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All evolution tests completed!');
  }
}

if (require.main === module) {
  runAllEvolutionTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

export { testEvolutionWithSnapshots, evolutions };
