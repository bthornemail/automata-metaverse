/**
 * Integrity Validation Service
 * Validates automaton integrity using R5RS/Scheme functions
 * Checks SHACL compliance, self-reference integrity, and structural validity
 */

import { schemeREPLService } from './scheme-repl-service';
import { databaseService } from './database-service';

export interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  component?: string;
  line?: number;
}

export interface IntegrityResult {
  valid: boolean;
  issues: string[];
  details: IntegrityIssue[];
  timestamp: number;
  checks: {
    shacl: boolean;
    selfReference: boolean;
    structure: boolean;
    rdf: boolean;
  };
}

class IntegrityService {
  /**
   * Validate automaton integrity
   */
  async validateIntegrity(): Promise<IntegrityResult> {
    const issues: IntegrityIssue[] = [];
    const checks = {
      shacl: false,
      selfReference: false,
      structure: false,
      rdf: false,
    };

    try {
      // Load automaton data
      let kernelData = await databaseService.readJSONL('automaton-kernel.jsonl');
      let metaverseData = await databaseService.readJSONL('generate.metaverse.jsonl');
      
      // Ensure all entries are objects (defensive check)
      kernelData = kernelData.filter(item => 
        item !== null && 
        item !== undefined && 
        typeof item === 'object' && 
        !Array.isArray(item) &&
        typeof item !== 'string'
      );
      metaverseData = metaverseData.filter(item => 
        item !== null && 
        item !== undefined && 
        typeof item === 'object' && 
        !Array.isArray(item) &&
        typeof item !== 'string'
      );

      // Check 1: Structure validation
      const structureCheck = this.validateStructure(kernelData, metaverseData);
      checks.structure = structureCheck.valid;
      issues.push(...structureCheck.issues);

      // Check 2: Self-reference validation
      const selfRefCheck = await this.validateSelfReferences(kernelData, metaverseData);
      checks.selfReference = selfRefCheck.valid;
      issues.push(...selfRefCheck.issues);

      // Check 3: RDF/Triple validation
      const rdfCheck = await this.validateRDF(kernelData, metaverseData);
      checks.rdf = rdfCheck.valid;
      issues.push(...rdfCheck.issues);

      // Check 4: SHACL validation (using Scheme REPL)
      const shaclCheck = await this.validateSHACL(kernelData, metaverseData);
      checks.shacl = shaclCheck.valid;
      issues.push(...shaclCheck.issues);

      return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        issues: issues.map(i => i.message),
        details: issues,
        timestamp: Date.now(),
        checks,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        details: [{
          severity: 'error',
          message: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        timestamp: Date.now(),
        checks,
      };
    }
  }

  /**
   * Validate structure (nodes, edges, types)
   */
  private validateStructure(kernelData: any[], metaverseData: any[]): { valid: boolean; issues: IntegrityIssue[] } {
    const issues: IntegrityIssue[] = [];
    const nodeIds = new Set<string>();
    const edgeReferences = new Set<string>();

    // Check kernel structure
    for (let i = 0; i < kernelData.length; i++) {
      const item = kernelData[i];
      if (!item || typeof item !== 'object') {
        issues.push({
          severity: 'error',
          message: `Kernel entry ${i + 1} is not a valid object`,
          component: 'kernel',
          line: i + 1,
        });
        continue;
      }

      // Check required fields
      if (!item.id) {
        issues.push({
          severity: 'error',
          message: `Kernel entry ${i + 1} missing required field: id`,
          component: 'kernel',
          line: i + 1,
        });
      } else {
        if (nodeIds.has(item.id)) {
          issues.push({
            severity: 'warning',
            message: `Duplicate node ID: ${item.id}`,
            component: 'kernel',
            line: i + 1,
          });
        }
        nodeIds.add(item.id);
      }

      if (!item.type) {
        issues.push({
          severity: 'warning',
          message: `Kernel entry ${i + 1} missing type field`,
          component: 'kernel',
          line: i + 1,
        });
      }

      // Track edge references
      if (item.from) edgeReferences.add(item.from);
      if (item.to) edgeReferences.add(item.to);
    }

    // Check metaverse structure
    for (let i = 0; i < metaverseData.length; i++) {
      const item = metaverseData[i];
      if (!item || typeof item !== 'object') {
        issues.push({
          severity: 'error',
          message: `Metaverse entry ${i + 1} is not a valid object`,
          component: 'metaverse',
          line: i + 1,
        });
        continue;
      }

      if (!item.id) {
        issues.push({
          severity: 'error',
          message: `Metaverse entry ${i + 1} missing required field: id`,
          component: 'metaverse',
          line: i + 1,
        });
      }
    }

    // Check for dangling references
    for (const ref of edgeReferences) {
      if (!nodeIds.has(ref)) {
        issues.push({
          severity: 'warning',
          message: `Edge references non-existent node: ${ref}`,
          component: 'edges',
        });
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Validate self-references
   */
  private async validateSelfReferences(kernelData: any[], metaverseData: any[]): Promise<{ valid: boolean; issues: IntegrityIssue[] }> {
    const issues: IntegrityIssue[] = [];
    const selfRefs: any[] = [];

    // Find self-references
    const allData = [...kernelData, ...metaverseData];
    for (const item of allData) {
      if (item.type === 'self-ref' || item.type === 'reference' || 
          (item.file && item.file.includes('.jsonl'))) {
        selfRefs.push(item);
      }
    }

    // Check self-reference integrity
    if (selfRefs.length === 0) {
      issues.push({
        severity: 'warning',
        message: 'No self-references found in automaton data',
        component: 'self-reference',
      });
    } else {
      // Validate self-reference targets exist
      for (const ref of selfRefs) {
        if (ref.file) {
          // Check if referenced file exists
          try {
            const referencedData = await databaseService.readJSONL(ref.file);
            if (!referencedData || referencedData.length === 0) {
              issues.push({
                severity: 'warning',
                message: `Self-reference points to empty file: ${ref.file}`,
                component: 'self-reference',
              });
            }
          } catch {
            issues.push({
              severity: 'error',
              message: `Self-reference points to non-existent file: ${ref.file}`,
              component: 'self-reference',
            });
          }
        }
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Validate RDF triples (using Scheme REPL)
   */
  private async validateRDF(kernelData: any[], metaverseData: any[]): Promise<{ valid: boolean; issues: IntegrityIssue[] }> {
    const issues: IntegrityIssue[] = [];

    try {
      // Convert to RDF using Scheme REPL
      // Ensure all entries are objects before stringifying
      const validKernelData = kernelData.filter(item => item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item));
      const validMetaverseData = metaverseData.filter(item => item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item));
      const allData = [...validKernelData, ...validMetaverseData];
      const jsonlContent = allData.map(item => {
        try {
          return JSON.stringify(item);
        } catch (e) {
          console.warn('Failed to stringify item:', item);
          return null;
        }
      }).filter((line): line is string => line !== null).join('\n');
      
      // Process through Scheme REPL to get RDF triples
      const result = await schemeREPLService.processJSONLFile(jsonlContent);
      
      if (result && result.success && result.result) {
        // Safely extract triples with multiple fallbacks
        let triples: any[] = [];
        try {
          if (result.result.triples !== null && result.result.triples !== undefined) {
            if (Array.isArray(result.result.triples)) {
              triples = result.result.triples;
            } else if (typeof result.result.triples === 'object') {
              // If it's an object, try to extract array from it
              if (Array.isArray(result.result.triples.triples)) {
                triples = result.result.triples.triples;
              } else if (Array.isArray(result.result.triples.data)) {
                triples = result.result.triples.data;
              } else if (Array.isArray(result.result.triples.result)) {
                triples = result.result.triples.result;
              }
            }
          }
        } catch (e) {
          // If extraction fails, use empty array
          triples = [];
        }
        
        // Final safety check - ensure triples is always an array
        if (!Array.isArray(triples)) {
          triples = [];
        }
        
        // Validate triples have required fields
        for (let i = 0; i < triples.length; i++) {
          const triple = triples[i];
          if (!triple || !triple.subject || !triple.predicate || !triple.object) {
            issues.push({
              severity: 'error',
              message: `Invalid RDF triple at index ${i}: missing subject, predicate, or object`,
              component: 'rdf',
            });
          }
        }

        if (triples.length === 0) {
          issues.push({
            severity: 'warning',
            message: 'No RDF triples generated from automaton data',
            component: 'rdf',
          });
        }
      } else {
        // Build detailed error message
        const errorDetails: string[] = [];
        
        if (result?.error) {
          // Safely convert error to string
          const errorMsg = typeof result.error === 'string' 
            ? result.error 
            : (result.error instanceof Error 
              ? result.error.message 
              : String(result.error));
          errorDetails.push(`Error: ${errorMsg}`);
        }
        
        if (result?.result) {
          errorDetails.push(`Result structure: ${JSON.stringify(Object.keys(result.result))}`);
          if (result.result.errors && Array.isArray(result.result.errors)) {
            // Safely convert error items to strings
            const errorStr = result.result.errors
              .slice(0, 5)
              .map(err => typeof err === 'string' ? err : String(err))
              .join('; ');
            errorDetails.push(`Line errors: ${errorStr}${result.result.errors.length > 5 ? ` (and ${result.result.errors.length - 5} more)` : ''}`);
          }
          if (result.result.entries !== undefined) {
            errorDetails.push(`Entries processed: ${result.result.entries}`);
          }
          if (result.result.triples !== undefined) {
            const triplesType = Array.isArray(result.result.triples) 
              ? `array[${result.result.triples.length}]` 
              : typeof result.result.triples;
            errorDetails.push(`Triples type: ${triplesType}`);
          }
        } else {
          errorDetails.push('No result object returned');
        }
        
        if (result?.output && Array.isArray(result.output) && result.output.length > 0) {
          // Safely convert output items to strings
          const outputStr = result.output
            .slice(-3)
            .map(item => typeof item === 'string' ? item : String(item))
            .join('; ');
          errorDetails.push(`Output: ${outputStr}`);
        }
        
        if (errorDetails.length === 0) {
          errorDetails.push('Unknown error - result structure: ' + JSON.stringify(result ? Object.keys(result) : 'null'));
        }
        
        issues.push({
          severity: 'error',
          message: `Failed to generate RDF triples: ${errorDetails.join(' | ')}`,
          component: 'rdf',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `${error.message}${error.stack ? ` (${error.stack.split('\n')[0]})` : ''}`
        : String(error);
      issues.push({
        severity: 'error',
        message: `RDF validation error: ${errorMessage} | Kernel entries: ${kernelData.length} | Metaverse entries: ${metaverseData.length}`,
        component: 'rdf',
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Validate SHACL compliance (using Scheme REPL R5RS functions)
   */
  private async validateSHACL(kernelData: any[], metaverseData: any[]): Promise<{ valid: boolean; issues: IntegrityIssue[] }> {
    const issues: IntegrityIssue[] = [];

    try {
      // Use Scheme REPL to validate SHACL
      // Ensure all entries are objects before stringifying
      const validKernelData = kernelData.filter(item => item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item));
      const validMetaverseData = metaverseData.filter(item => item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item));
      const allData = [...validKernelData, ...validMetaverseData];
      const jsonlContent = allData.map(item => {
        try {
          return JSON.stringify(item);
        } catch (e) {
          console.warn('Failed to stringify item:', item);
          return null;
        }
      }).filter((line): line is string => line !== null).join('\n');
      
      // Process through Scheme REPL
      const result = await schemeREPLService.processJSONLFile(jsonlContent);
      
      if (result && result.success && result.result) {
        // Safely extract triples with multiple fallbacks
        let triples: any[] = [];
        try {
          if (result.result.triples !== null && result.result.triples !== undefined) {
            if (Array.isArray(result.result.triples)) {
              triples = result.result.triples;
            } else if (typeof result.result.triples === 'object') {
              // If it's an object, try to extract array from it
              if (Array.isArray(result.result.triples.triples)) {
                triples = result.result.triples.triples;
              } else if (Array.isArray(result.result.triples.data)) {
                triples = result.result.triples.data;
              } else if (Array.isArray(result.result.triples.result)) {
                triples = result.result.triples.result;
              }
            }
          }
        } catch (e) {
          // If extraction fails, use empty array
          triples = [];
        }
        
        // Final safety check - ensure triples is always an array
        if (!Array.isArray(triples)) {
          triples = [];
        }
        
        // Basic SHACL checks
        // Check 1: All nodes have rdf:type
        const nodesWithoutType = triples.filter(t => 
          t && t.predicate === 'rdf:type' && !t.object
        );
        if (nodesWithoutType.length > 0) {
          issues.push({
            severity: 'error',
            message: `${nodesWithoutType.length} nodes missing rdf:type`,
            component: 'shacl',
          });
        }

        // Check 2: All nodes have rdfs:label (text field)
        const nodesWithoutLabel = triples.filter(t => 
          t && t.predicate === 'rdfs:label' && !t.object
        );
        if (nodesWithoutLabel.length > 0) {
          issues.push({
            severity: 'warning',
            message: `${nodesWithoutLabel.length} nodes missing rdfs:label`,
            component: 'shacl',
          });
        }

        // Check 3: Validate owl:sameAs minimum count (from AGENTS.md)
        const sameAsTriples = triples.filter(t => t && t.predicate === 'owl:sameAs');
        if (sameAsTriples.length === 0) {
          issues.push({
            severity: 'warning',
            message: 'No owl:sameAs relationships found (SHACL requires minimum 1)',
            component: 'shacl',
          });
        }
      } else {
        // Build detailed error message
        const errorDetails: string[] = [];
        
        if (result?.error) {
          // Safely convert error to string
          const errorMsg = typeof result.error === 'string' 
            ? result.error 
            : (result.error instanceof Error 
              ? result.error.message 
              : String(result.error));
          errorDetails.push(`Error: ${errorMsg}`);
        }
        
        if (result?.result) {
          errorDetails.push(`Result structure: ${JSON.stringify(Object.keys(result.result))}`);
          if (result.result.errors && Array.isArray(result.result.errors)) {
            // Safely convert error items to strings
            const errorStr = result.result.errors
              .slice(0, 5)
              .map(err => typeof err === 'string' ? err : String(err))
              .join('; ');
            errorDetails.push(`Line errors: ${errorStr}${result.result.errors.length > 5 ? ` (and ${result.result.errors.length - 5} more)` : ''}`);
          }
          if (result.result.entries !== undefined) {
            errorDetails.push(`Entries processed: ${result.result.entries}`);
          }
          if (result.result.triples !== undefined) {
            const triplesType = Array.isArray(result.result.triples) 
              ? `array[${result.result.triples.length}]` 
              : typeof result.result.triples;
            errorDetails.push(`Triples type: ${triplesType}`);
            if (typeof result.result.triples === 'object' && result.result.triples !== null) {
              errorDetails.push(`Triples object keys: ${JSON.stringify(Object.keys(result.result.triples))}`);
            }
          }
        } else {
          errorDetails.push('No result object returned');
        }
        
        if (result?.output && Array.isArray(result.output) && result.output.length > 0) {
          // Safely convert output items to strings
          const outputStr = result.output
            .slice(-3)
            .map(item => typeof item === 'string' ? item : String(item))
            .join('; ');
          errorDetails.push(`Output: ${outputStr}`);
        }
        
        if (errorDetails.length === 0) {
          errorDetails.push('Unknown error - result structure: ' + JSON.stringify(result ? Object.keys(result) : 'null'));
        }
        
        issues.push({
          severity: 'error',
          message: `SHACL validation failed: ${errorDetails.join(' | ')}`,
          component: 'shacl',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `${error.message}${error.stack ? ` (${error.stack.split('\n')[0]})` : ''}`
        : String(error);
      issues.push({
        severity: 'error',
        message: `SHACL validation error: ${errorMessage} | Kernel entries: ${kernelData.length} | Metaverse entries: ${metaverseData.length}`,
        component: 'shacl',
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Get integrity status summary
   */
  async getIntegrityStatus(): Promise<{ valid: boolean; issues: string[] }> {
    const result = await this.validateIntegrity();
    return {
      valid: result.valid,
      issues: result.issues,
    };
  }
}

export const integrityService = new IntegrityService();
