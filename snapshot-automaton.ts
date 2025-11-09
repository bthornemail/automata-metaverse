#!/usr/bin/env tsx
/**
 * Automaton Self-Modification Snapshot Tool
 * Takes snapshots every 5 seconds to analyze reasoning quality
 */

import * as fs from 'fs';
import * as path from 'path';

interface Snapshot {
  timestamp: number;
  isoTime: string;
  fileStats: {
    size: number;
    mtime: number;
    lineCount: number;
  };
  automatonState: {
    objectCount: number;
    selfModificationCount: number;
    currentDimension: number;
    executionHistoryLength: number;
  };
  sampleObjects: any[];
  modifications: any[];
  reasoning: {
    newObjects: number;
    newModifications: number;
    dimensionProgression: boolean;
    patternConsistency: string;
  };
}

const SNAPSHOT_INTERVAL = 5000; // 5 seconds
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const AUTOMATON_FILE = path.join(__dirname, 'automaton.jsonl');
const API_URL = process.env.API_URL || 'http://localhost:5555';

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

let previousSnapshot: Snapshot | null = null;
let snapshotCount = 0;

function readAutomatonFile(): { objects: any[]; lineCount: number } {
  if (!fs.existsSync(AUTOMATON_FILE)) {
    return { objects: [], lineCount: 0 };
  }

  const content = fs.readFileSync(AUTOMATON_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());
  const objects = lines.map((line, idx) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  return { objects, lineCount: lines.length };
}

async function getAutomatonState(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/automaton/state`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // API not available, use file-based state
  }
  return null;
}

function analyzeReasoning(current: Snapshot, previous: Snapshot | null): Snapshot['reasoning'] {
  if (!previous) {
    return {
      newObjects: current.automatonState.objectCount,
      newModifications: current.automatonState.selfModificationCount,
      dimensionProgression: false,
      patternConsistency: 'initial'
    };
  }

  const newObjects = current.automatonState.objectCount - previous.automatonState.objectCount;
  const newModifications = current.automatonState.selfModificationCount - previous.automatonState.selfModificationCount;
  const dimensionProgression = current.automatonState.currentDimension > previous.automatonState.currentDimension;

  // Analyze pattern consistency
  const currentMods = current.modifications.map(m => m.pattern || m.text?.substring(0, 50));
  const previousMods = previous.modifications.map(m => m.pattern || m.text?.substring(0, 50));
  const patternConsistency = currentMods.length > previousMods.length ? 'expanding' : 
                            currentMods.some(m => !previousMods.includes(m)) ? 'evolving' : 'stable';

  return {
    newObjects,
    newModifications,
    dimensionProgression,
    patternConsistency
  };
}

async function takeSnapshot(): Promise<Snapshot> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  
  // Read file state
  const { objects, lineCount } = readAutomatonFile();
  const fileStats = fs.statSync(AUTOMATON_FILE);
  
  // Try to get API state
  const apiState = await getAutomatonState();
  
  // Extract modifications
  const modifications = objects.filter((obj: any) => 
    obj.currentState === 'modified' || 
    obj.currentState === 'evolved' ||
    obj.id?.includes('modification') ||
    obj.selfReference
  );

  const automatonState = {
    objectCount: objects.length,
    selfModificationCount: apiState?.selfModificationCount || modifications.length,
    currentDimension: apiState?.currentDimension || apiState?.status?.currentDimension || 0,
    executionHistoryLength: apiState?.executionHistory?.length || 0
  };

  // Sample objects (last 5)
  const sampleObjects = objects.slice(-5);

  const snapshot: Snapshot = {
    timestamp: now,
    isoTime,
    fileStats: {
      size: fileStats.size,
      mtime: fileStats.mtimeMs,
      lineCount
    },
    automatonState,
    sampleObjects,
    modifications: modifications.slice(-10), // Last 10 modifications
    reasoning: {
      newObjects: 0,
      newModifications: 0,
      dimensionProgression: false,
      patternConsistency: 'initial'
    }
  };

  // Analyze reasoning compared to previous
  snapshot.reasoning = analyzeReasoning(snapshot, previousSnapshot);

  return snapshot;
}

function saveSnapshot(snapshot: Snapshot): void {
  snapshotCount++;
  const filename = `snapshot-${snapshotCount.toString().padStart(4, '0')}-${snapshot.timestamp}.json`;
  const filepath = path.join(SNAPSHOT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
  console.log(`📸 Snapshot #${snapshotCount} saved: ${filename}`);
}

function printSnapshot(snapshot: Snapshot): void {
  console.log('\n' + '='.repeat(80));
  console.log(`📸 SNAPSHOT #${snapshotCount} - ${snapshot.isoTime}`);
  console.log('='.repeat(80));
  
  console.log('\n📊 State:');
  console.log(`   Objects: ${snapshot.automatonState.objectCount}`);
  console.log(`   Self-Modifications: ${snapshot.automatonState.selfModificationCount}`);
  console.log(`   Current Dimension: ${snapshot.automatonState.currentDimension}D`);
  console.log(`   Execution History: ${snapshot.automatonState.executionHistoryLength} entries`);
  console.log(`   File Size: ${(snapshot.fileStats.size / 1024).toFixed(2)} KB`);
  console.log(`   Lines: ${snapshot.fileStats.lineCount}`);

  if (snapshotCount > 1 && previousSnapshot) {
    console.log('\n🧠 Reasoning Quality:');
    console.log(`   New Objects: ${snapshot.reasoning.newObjects > 0 ? '+' : ''}${snapshot.reasoning.newObjects}`);
    console.log(`   New Modifications: ${snapshot.reasoning.newModifications > 0 ? '+' : ''}${snapshot.reasoning.newModifications}`);
    console.log(`   Dimension Progression: ${snapshot.reasoning.dimensionProgression ? '✅ Yes' : '❌ No'}`);
    console.log(`   Pattern Consistency: ${snapshot.reasoning.patternConsistency}`);
    
    const timeDelta = snapshot.timestamp - previousSnapshot.timestamp;
    const objectsPerSecond = snapshot.reasoning.newObjects / (timeDelta / 1000);
    console.log(`   Objects/Second: ${objectsPerSecond.toFixed(3)}`);
  }

  if (snapshot.modifications.length > 0) {
    console.log('\n🔧 Recent Modifications:');
    snapshot.modifications.slice(-3).forEach((mod, idx) => {
      const pattern = mod.selfReference?.pattern || mod.text?.substring(0, 40) || mod.id;
      console.log(`   ${idx + 1}. ${pattern}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  console.log('🔍 Starting Automaton Self-Modification Snapshot Monitor');
  console.log(`   Interval: ${SNAPSHOT_INTERVAL / 1000} seconds`);
  console.log(`   File: ${AUTOMATON_FILE}`);
  console.log(`   API: ${API_URL}`);
  console.log(`   Snapshots will be saved to: ${SNAPSHOT_DIR}\n`);

  // Take initial snapshot
  const initialSnapshot = await takeSnapshot();
  previousSnapshot = initialSnapshot;
  saveSnapshot(initialSnapshot);
  printSnapshot(initialSnapshot);

  // Set up interval
  const interval = setInterval(async () => {
    try {
      const snapshot = await takeSnapshot();
      saveSnapshot(snapshot);
      printSnapshot(snapshot);
      previousSnapshot = snapshot;
    } catch (error) {
      console.error('❌ Error taking snapshot:', error);
    }
  }, SNAPSHOT_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping snapshot monitor...');
    clearInterval(interval);
    
    if (previousSnapshot) {
      console.log(`\n📊 Summary:`);
      console.log(`   Total Snapshots: ${snapshotCount}`);
      console.log(`   Total Objects: ${previousSnapshot.automatonState.objectCount}`);
      console.log(`   Total Modifications: ${previousSnapshot.automatonState.selfModificationCount}`);
      console.log(`   Final Dimension: ${previousSnapshot.automatonState.currentDimension}D`);
    }
    
    process.exit(0);
  });

  console.log('\n⏳ Monitoring... Press Ctrl+C to stop\n');
}

if (require.main === module) {
  main().catch(console.error);
}

export { takeSnapshot, Snapshot };
