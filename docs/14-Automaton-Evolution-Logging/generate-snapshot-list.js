#!/usr/bin/env node
/**
 * Generate snapshot list file for dashboard
 * Creates a JSON file listing all snapshot files for easy loading
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, '../../snapshots-memory');
const OUTPUT_FILE = path.join(SNAPSHOT_DIR, '.snapshot-list.json');

function generateSnapshotList() {
  console.log('📋 Generating snapshot list...');
  
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.error(`❌ Snapshot directory not found: ${SNAPSHOT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith('memory-snapshot-') && f.endsWith('.json'))
    .sort();

  console.log(`✅ Found ${files.length} snapshot files`);

  // Write list file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(files, null, 2));
  console.log(`✅ Written to ${OUTPUT_FILE}`);

  // Also create a sample data file for testing
  if (files.length > 0) {
    const sampleFiles = [
      files[0],
      files[Math.floor(files.length * 0.25)],
      files[Math.floor(files.length * 0.5)],
      files[Math.floor(files.length * 0.75)],
      files[files.length - 1]
    ].filter(Boolean);

    const sampleData = sampleFiles.map(file => {
      const content = fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf-8');
      return JSON.parse(content);
    });

    const sampleFile = path.join(__dirname, 'sample-snapshots.json');
    fs.writeFileSync(sampleFile, JSON.stringify(sampleData, null, 2));
    console.log(`✅ Created sample data file: ${sampleFile}`);
  }
}

if (require.main === module) {
  generateSnapshotList();
}

module.exports = { generateSnapshotList };
