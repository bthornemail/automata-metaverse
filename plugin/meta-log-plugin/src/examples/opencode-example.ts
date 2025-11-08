/**
 * Example usage of OpenCodeMetaLogPlugin
 * 
 * This file demonstrates how to use the plugin in an OpenCode environment
 */

import { OpenCodeMetaLogPlugin } from '../adapters/opencode.js';

async function example() {
  // Create plugin instance
  const plugin = new OpenCodeMetaLogPlugin({
    canvasPath: './automaton-kernel.jsonl',
    enableProlog: true,
    enableDatalog: true,
    enableRdf: true,
    enableShacl: true
  });

  // Set up event listeners
  plugin.on('beforeQuery', (query: string) => {
    console.log('Executing query:', query);
  });

  plugin.on('afterQuery', (query: string, results: any) => {
    console.log('Query results:', results);
  });

  plugin.on('canvasUpdate', (canvasPath: string) => {
    console.log('Canvas updated:', canvasPath);
  });

  // Load plugin
  await plugin.onLoad();

  // Enable plugin
  await plugin.onEnable();

  // Execute queries
  try {
    // ProLog query
    const prologResults = await plugin.getDb().prologQuery('(node ?Id ?Type)');
    console.log('ProLog results:', prologResults);

    // DataLog query
    const datalogResults = await plugin.getDb().datalogQuery('(missing_implementation ?N)');
    console.log('DataLog results:', datalogResults);

    // SPARQL query
    const sparqlResults = await plugin.getDb().sparqlQuery(`
      SELECT ?id ?type WHERE {
        ?id rdf:type ?type
      }
    `);
    console.log('SPARQL results:', sparqlResults);
  } catch (error) {
    console.error('Query error:', error);
  }

  // Update configuration
  await plugin.updateConfig({
    enableProlog: false
  });

  // Disable and unload
  await plugin.onDisable();
  await plugin.onUnload();
}

// Export for use in OpenCode
export default example;
