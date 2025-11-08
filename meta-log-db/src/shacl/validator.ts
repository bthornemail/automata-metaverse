import { ShaclShapes, ShaclValidationReport, ShaclViolation, RdfTriple } from '../types/index.js';
import * as fs from 'fs';

/**
 * SHACL Validator
 */
export class ShaclValidator {
  /**
   * Load SHACL shapes from file
   */
  async loadShapes(path: string): Promise<ShaclShapes> {
    // Simplified: In a full implementation, this would parse Turtle/RDF
    const content = fs.readFileSync(path, 'utf-8');
    return this.parseShapes(content);
  }

  /**
   * Parse shapes from content (simplified)
   */
  private parseShapes(content: string): ShaclShapes {
    // Simplified parser - full implementation would parse Turtle/RDF
    const shapes: ShaclShapes = {};
    
    // Basic shape structure
    const shapeMatch = content.match(/sh:NodeShape\s+([^;]+)/g);
    if (shapeMatch) {
      for (const match of shapeMatch) {
        const idMatch = match.match(/@id\s*:\s*(\S+)/);
        if (idMatch) {
          const id = idMatch[1];
          shapes[id] = {
            targetClass: id,
            properties: [],
            constraints: []
          };
        }
      }
    }

    return shapes;
  }

  /**
   * Validate triples against shapes
   */
  async validate(shapes: ShaclShapes, triples: RdfTriple[]): Promise<ShaclValidationReport> {
    const violations: ShaclViolation[] = [];

    for (const [shapeId, shape] of Object.entries(shapes)) {
      // Find nodes matching target
      const targetNodes = this.findTargetNodes(shape, triples);

      for (const node of targetNodes) {
        // Validate properties
        if (shape.properties) {
          for (const property of shape.properties) {
            const propViolations = this.validateProperty(node, property, triples);
            violations.push(...propViolations);
          }
        }

        // Validate constraints
        if (shape.constraints) {
          for (const constraint of shape.constraints) {
            const constraintViolations = this.validateConstraint(node, constraint, triples);
            violations.push(...constraintViolations);
          }
        }
      }
    }

    return {
      conforms: violations.length === 0,
      violations
    };
  }

  /**
   * Find nodes matching shape target
   */
  private findTargetNodes(shape: any, triples: RdfTriple[]): string[] {
    const nodes: string[] = [];
    const rdfType = '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>';

    if (shape.targetClass) {
      const typeTriples = triples.filter(t => 
        t.predicate === rdfType &&
        (typeof t.object === 'string' ? t.object : t.object.value) === shape.targetClass
      );
      nodes.push(...typeTriples.map(t => t.subject));
    }

    if (shape.targetNode) {
      nodes.push(shape.targetNode);
    }

    return [...new Set(nodes)];
  }

  /**
   * Validate a property constraint
   */
  private validateProperty(
    node: string,
    property: any,
    triples: RdfTriple[]
  ): ShaclViolation[] {
    const violations: ShaclViolation[] = [];
    const path = property.path || property.predicate;
    
    // Find triples with this predicate
    const matchingTriples = triples.filter(t => 
      t.subject === node && t.predicate === path
    );

    // Check minCount
    if (property.minCount !== undefined && matchingTriples.length < property.minCount) {
      violations.push({
        focusNode: node,
        resultPath: path,
        message: `Minimum count ${property.minCount} not met, found ${matchingTriples.length}`,
        severity: 'error'
      });
    }

    // Check maxCount
    if (property.maxCount !== undefined && matchingTriples.length > property.maxCount) {
      violations.push({
        focusNode: node,
        resultPath: path,
        message: `Maximum count ${property.maxCount} exceeded, found ${matchingTriples.length}`,
        severity: 'error'
      });
    }

    // Check datatype
    if (property.datatype) {
      for (const triple of matchingTriples) {
        const objValue = typeof triple.object === 'string' ? triple.object : triple.object.value;
        if (!this.checkDatatype(objValue, property.datatype)) {
          violations.push({
            focusNode: node,
            resultPath: path,
            message: `Value ${objValue} does not match datatype ${property.datatype}`,
            severity: 'error'
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate a constraint
   */
  private validateConstraint(
    node: string,
    constraint: any,
    triples: RdfTriple[]
  ): ShaclViolation[] {
    const violations: ShaclViolation[] = [];

    // Check constraint based on type
    switch (constraint.type) {
      case 'sh:minCount':
        // Already handled in property validation
        break;
      case 'sh:maxCount':
        // Already handled in property validation
        break;
      default:
        // Custom constraint checking
        if (!this.checkConstraint(node, constraint, triples)) {
          violations.push({
            focusNode: node,
            resultPath: constraint.path || '',
            message: constraint.message || `Constraint ${constraint.type} violated`,
            severity: 'error'
          });
        }
    }

    return violations;
  }

  /**
   * Check datatype
   */
  private checkDatatype(value: string, datatype: string): boolean {
    // Simplified datatype checking
    switch (datatype) {
      case 'http://www.w3.org/2001/XMLSchema#string':
        return typeof value === 'string';
      case 'http://www.w3.org/2001/XMLSchema#integer':
        return /^-?\d+$/.test(value);
      case 'http://www.w3.org/2001/XMLSchema#boolean':
        return value === 'true' || value === 'false';
      default:
        return true; // Unknown datatype, assume valid
    }
  }

  /**
   * Check constraint
   */
  private checkConstraint(node: string, constraint: any, triples: RdfTriple[]): boolean {
    // Simplified constraint checking
    // Full implementation would handle all SHACL constraint types
    return true;
  }
}
