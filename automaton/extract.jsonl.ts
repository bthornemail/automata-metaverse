import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';

function extractAllJSONLLines(directoryPath: string): string[] {
  if (!existsSync(directoryPath)) {
    throw new Error(`Directory not found: ${directoryPath}`);
  }

  const allJSONLLines: string[] = [];
  const files = readdirSync(directoryPath)
    .filter(file => extname(file) === '.md')
    .sort();

  for (const file of files) {
    const filePath = join(directoryPath, file);
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          JSON.parse(trimmed); // Validate JSON
          allJSONLLines.push(trimmed);
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return allJSONLLines;
}

// Usage
const directoryPath = './grok_files'; // Your directory path
const jsonlLines = extractAllJSONLLines(directoryPath);

console.log(`Extracted ${jsonlLines.length} JSONL lines:`);
jsonlLines.forEach((line, index) => {
  console.log(`${index + 1}. ${line}`);
});

// Save to file
const fs = require('fs');
fs.writeFileSync('all-jsonl.jsonl', jsonlLines.join('\n'));
console.log(`Saved to all-jsonl.jsonl`);