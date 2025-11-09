/**
 * Turtle/RDF Parser for SHACL Shapes
 * Parses Turtle format RDF files into structured data
 */

export interface TurtleTriple {
  subject: string;
  predicate: string;
  object: string | TurtleLiteral;
}

export interface TurtleLiteral {
  value: string;
  datatype?: string;
  language?: string;
}

/**
 * Turtle Parser
 * Basic Turtle parser for SHACL shape files
 */
export class TurtleParser {
  /**
   * Parse Turtle content into triples
   */
  static parse(content: string): TurtleTriple[] {
    const triples: TurtleTriple[] = [];
    const lines = content.split('\n');
    let currentSubject: string | null = null;
    let currentPredicate: string | null = null;
    let inMultiLine = false;
    let multiLineValue = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Handle multi-line strings
      if (inMultiLine) {
        multiLineValue += ' ' + line;
        if (line.endsWith('"""') || line.endsWith("'''")) {
          inMultiLine = false;
          line = multiLineValue;
          multiLineValue = '';
        } else {
          continue;
        }
      }

      // Check for multi-line string start
      if (line.includes('"""') || line.includes("'''")) {
        inMultiLine = true;
        multiLineValue = line;
        continue;
      }

      // Parse prefixes
      if (line.startsWith('@prefix') || line.startsWith('PREFIX')) {
        // Prefix handling would go here
        continue;
      }

      // Parse triples
      const parts = this.splitTripleLine(line);
      
      if (parts.length >= 3) {
        const subject = this.expandIRI(parts[0]);
        const predicate = this.expandIRI(parts[1]);
        const object = this.parseObject(parts[2]);

        triples.push({
          subject,
          predicate,
          object
        });

        // Handle predicate lists (a b c .)
        if (parts.length > 3) {
          for (let j = 2; j < parts.length - 1; j++) {
            const nextPredicate = this.expandIRI(parts[j]);
            const nextObject = this.parseObject(parts[j + 1]);
            triples.push({
              subject,
              predicate: nextPredicate,
              object: nextObject
            });
          }
        }
      }
    }

    return triples;
  }

  /**
   * Split a triple line into parts
   */
  private static splitTripleLine(line: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let inBrackets = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : '';

      if (!inQuotes && !inBrackets && (char === ' ' || char === '\t')) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
        continue;
      }

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === '<' && !inQuotes) {
        inBrackets++;
        current += char;
      } else if (char === '>' && !inQuotes) {
        inBrackets--;
        current += char;
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts.filter(p => p && p !== '.');
  }

  /**
   * Parse object value
   */
  private static parseObject(objStr: string): string | TurtleLiteral {
    objStr = objStr.trim();

    // Remove trailing semicolon or period
    objStr = objStr.replace(/[.;]$/, '').trim();

    // Literal with datatype
    const datatypeMatch = objStr.match(/^"([^"]+)"\^\^<(.+)>$/);
    if (datatypeMatch) {
      return {
        value: datatypeMatch[1],
        datatype: datatypeMatch[2]
      };
    }

    // Literal with language
    const langMatch = objStr.match(/^"([^"]+)"@(.+)$/);
    if (langMatch) {
      return {
        value: langMatch[1],
        language: langMatch[2]
      };
    }

    // Quoted string literal
    if ((objStr.startsWith('"') && objStr.endsWith('"')) ||
        (objStr.startsWith("'") && objStr.endsWith("'"))) {
      return {
        value: objStr.slice(1, -1)
      };
    }

    // IRI or blank node
    return this.expandIRI(objStr);
  }

  /**
   * Expand IRI (simplified - would need prefix resolution)
   */
  private static expandIRI(iri: string): string {
    // Remove angle brackets
    if (iri.startsWith('<') && iri.endsWith('>')) {
      return iri.slice(1, -1);
    }

    // Handle prefixed names (simplified)
    if (iri.includes(':')) {
      const [prefix, local] = iri.split(':', 2);
      // In a full implementation, would resolve prefix
      return iri;
    }

    return iri;
  }

  /**
   * Group triples by subject
   */
  static groupBySubject(triples: TurtleTriple[]): Map<string, TurtleTriple[]> {
    const grouped = new Map<string, TurtleTriple[]>();

    for (const triple of triples) {
      if (!grouped.has(triple.subject)) {
        grouped.set(triple.subject, []);
      }
      grouped.get(triple.subject)!.push(triple);
    }

    return grouped;
  }
}
