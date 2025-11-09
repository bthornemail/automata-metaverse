import { Fact } from '../types/index.js';

/**
 * Fact extraction utilities for DataLog
 */
export class FactExtraction {
  /**
   * Extract facts from JSONL canvas objects
   */
  static extractFromCanvas(objects: any[]): Fact[] {
    const facts: Fact[] = [];

    for (const obj of objects) {
      // Node facts
      if (obj.type === 'node' || obj.id) {
        facts.push({
          predicate: 'node',
          args: [
            obj.id || obj._id || 'unknown',
            obj.type || 'unknown',
            obj.x || 0,
            obj.y || 0,
            obj.text || obj.label || ''
          ]
        });

        // Extract properties
        for (const [key, value] of Object.entries(obj)) {
          if (!['id', '_id', 'type', 'x', 'y', 'text', 'label'].includes(key)) {
            facts.push({
              predicate: `has_${key}`,
              args: [obj.id || obj._id, value]
            });
          }
        }
      }

      // Edge facts
      if (obj.type === 'edge' || obj.fromNode || obj.toNode) {
        facts.push({
          predicate: 'edge',
          args: [
            obj.id || obj._id || 'unknown',
            obj.type || 'unknown',
            obj.fromNode || obj.from || 'unknown',
            obj.toNode || obj.to || 'unknown'
          ]
        });

        // Vertical/horizontal relationships
        if (obj.type?.startsWith('v:') || obj.type === 'vertical') {
          facts.push({
            predicate: 'vertical',
            args: [obj.fromNode || obj.from, obj.toNode || obj.to]
          });
        }

        if (obj.type?.startsWith('h:') || obj.type === 'horizontal') {
          facts.push({
            predicate: 'horizontal',
            args: [obj.fromNode || obj.from, obj.toNode || obj.to]
          });
        }
      }
    }

    return facts;
  }

  /**
   * Extract facts from structured data
   */
  static extractFromData(data: any): Fact[] {
    const facts: Fact[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        facts.push(...this.extractFromData(item));
      }
    } else if (typeof data === 'object' && data !== null) {
      // Extract object properties as facts
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          facts.push({
            predicate: key,
            args: [value]
          });
        } else if (Array.isArray(value)) {
          for (const item of value) {
            facts.push({
              predicate: key,
              args: [item]
            });
          }
        }
      }
    }

    return facts;
  }
}
