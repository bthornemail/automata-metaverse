import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';

interface JSONLObject {
  id: string;
  type: string;
  [key: string]: any;
}

class JSONLExtractor {
  private allJSONLLines: string[] = [];
  private allParsedObjects: JSONLObject[] = [];

  extractJSONLFromMarkdown(markdownContent: string): string[] {
    const jsonlLines: string[] = [];
    const lines = markdownContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Only include lines that are valid JSON objects
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          // Validate it's parseable JSON
          JSON.parse(trimmed);
          jsonlLines.push(trimmed);
        } catch (error) {
          // Skip invalid JSON lines
          continue;
        }
      }
    }

    return jsonlLines;
  }

  extractJSONLFromFile(filePath: string): string[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      return this.extractJSONLFromMarkdown(content);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  extractAllJSONLFromDirectory(directoryPath: string): void {
    console.log(`Extracting JSONL from directory: ${directoryPath}`);

    if (!existsSync(directoryPath)) {
      console.error(`Directory not found: ${directoryPath}`);
      return;
    }

    const files = readdirSync(directoryPath)
      .filter(file => extname(file) === '.md') // Only .md files
      .sort(); // Sort alphabetically (50-Grok.md, 51-Grok.md, etc.)

    this.allJSONLLines = [];
    this.allParsedObjects = [];

    for (const file of files) {
      const filePath = join(directoryPath, file);
      const jsonlLines = this.extractJSONLFromFile(filePath);
      
      console.log(`📁 ${file}: Found ${jsonlLines.length} JSONL lines`);
      
      this.allJSONLLines.push(...jsonlLines);

      // Also parse the objects for validation
      jsonlLines.forEach(line => {
        try {
          const obj = JSON.parse(line);
          this.allParsedObjects.push(obj);
        } catch (error) {
          console.warn(`Invalid JSON in ${file}: ${line}`);
        }
      });
    }

    console.log(`\n✅ Total JSONL lines extracted: ${this.allJSONLLines.length}`);
    console.log(`✅ Total valid JSON objects: ${this.allParsedObjects.length}`);
  }

  getAllJSONLLines(): string[] {
    return this.allJSONLLines;
  }

  getAllParsedObjects(): JSONLObject[] {
    return this.allParsedObjects;
  }

  saveJSONLToFile(outputPath: string): void {
    try {
      const outputContent = this.allJSONLLines.join('\n');
//      readFileSync(outputPath, 'utf-8'); // Check if we can write (using require for writeFileSync)
      const fs = require('fs');
      fs.writeFileSync(outputPath, outputContent);
      console.log(`💾 Saved ${this.allJSONLLines.length} JSONL lines to: ${outputPath}`);
    } catch (error) {
      console.error(`Error saving to ${outputPath}:`, error);
    }
  }

  printSummary(): void {
    console.log('\n=== JSONL EXTRACTION SUMMARY ===');
    console.log(`Total JSONL lines: ${this.allJSONLLines.length}`);
    
    const types = this.allParsedObjects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nObject types:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Show first few lines as preview
    console.log('\nFirst 5 JSONL lines:');
    this.allJSONLLines.slice(0, 5).forEach((line, index) => {
      console.log(`  ${index + 1}. ${line}`);
    });
  }
}

// Main function
function main() {
  const extractor = new JSONLExtractor();
  
  // Change this to your directory path
  const directoryPath = './grok_files';
  
  // Extract all JSONL lines
  extractor.extractAllJSONLFromDirectory(directoryPath);
  
  // Print summary
  extractor.printSummary();
  
  // Get all JSONL lines
  const allLines = extractor.getAllJSONLLines();
  console.log(`\n📋 All ${allLines.length} JSONL lines ready for use.`);
  
  // Save to file if needed
  extractor.saveJSONLToFile('./extracted-jsonl.jsonl');
  
  // You can also get parsed objects
  const parsedObjects = extractor.getAllParsedObjects();
  console.log(`\n🔄 ${parsedObjects.length} objects parsed and ready for processing.`);
  
  return {
    lines: allLines,
    objects: parsedObjects
  };
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { JSONLExtractor };
export type { JSONLObject };