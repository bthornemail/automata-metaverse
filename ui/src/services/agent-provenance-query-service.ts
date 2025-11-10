/**
 * Agent Provenance Query Service
 * Integrates with Meta-Log database for Prolog/Datalog/SPARQL queries on agent histories
 */

import { agentHistoryLoggingService, HistoryLogEntry } from './agent-history-logging-service';
import { databaseService } from './database-service';
import { metaLogApiService } from './meta-log-api-service';

// Query result types
export interface PrologResult {
  bindings: Record<string, any>[];
}

export interface DatalogResult {
  facts: any[];
}

export interface SparqlResult {
  results: {
    bindings: Record<string, { value: string; type: string }>[];
  };
}

export type QueryType = 'prolog' | 'datalog' | 'sparql';

export interface QueryTemplate {
  name: string;
  type: QueryType;
  query: string;
  description: string;
}

export interface AgentProvenanceQueryService {
  // Query execution
  queryProlog(agentId: string, query: string): Promise<PrologResult>;
  queryDatalog(agentId: string, query: string, program?: any): Promise<DatalogResult>;
  querySparql(agentId: string, query: string): Promise<SparqlResult>;
  
  // Query building
  buildQuery(template: QueryTemplate, params: Record<string, any>): string;
  
  // History loading
  loadAgentHistory(agentId: string): Promise<void>;
  loadAllAgentHistories(): Promise<void>;
  
  // Query templates
  getQueryTemplates(): QueryTemplate[];
}

class AgentProvenanceQueryServiceImpl implements AgentProvenanceQueryService {
  private loadedAgents: Set<string> = new Set();
  private historyCache: Map<string, HistoryLogEntry[]> = new Map();

  /**
   * Load agent history into cache and Meta-Log DB
   */
  async loadAgentHistory(agentId: string): Promise<void> {
    if (this.loadedAgents.has(agentId)) {
      return;
    }

    const history = await agentHistoryLoggingService.getHistory(agentId);
    this.historyCache.set(agentId, history);
    this.loadedAgents.add(agentId);

    // Load into Meta-Log API if available
    if (metaLogApiService.isAvailable()) {
      try {
        const logFile = agentHistoryLoggingService.getAgentLogFile(agentId);
        await metaLogApiService.loadCanvas(logFile);
      } catch (error) {
        console.warn(`Failed to load ${agentId} history into Meta-Log API:`, error);
      }
    }
  }

  /**
   * Load all agent histories
   */
  async loadAllAgentHistories(): Promise<void> {
    const agentIds = await agentHistoryLoggingService.getAllAgentIds();
    await Promise.all(agentIds.map(id => this.loadAgentHistory(id)));
  }

  /**
   * Convert history entries to Prolog facts
   */
  private historyToPrologFacts(agentId: string): string[] {
    const history = this.historyCache.get(agentId) || [];
    const facts: string[] = [];

    for (const entry of history) {
      // Document consumption facts
      if (entry.type === 'document-consumption' && entry.target && typeof entry.target === 'object' && 'file' in entry.target) {
        facts.push(`consumes(${agentId}, '${entry.target.file}', ${entry.timestamp}).`);
        if (entry.extracted?.facts) {
          entry.extracted.facts.forEach(fact => {
            facts.push(`extracted_fact(${agentId}, '${fact.replace(/'/g, "''")}', ${entry.timestamp}).`);
          });
        }
      }

      // Code production facts
      if (entry.type === 'code-production' && entry.code) {
        facts.push(`produces(${agentId}, '${entry.code.file}', ${entry.timestamp}).`);
        facts.push(`produces_code(${agentId}, '${entry.code.type}', ${entry.timestamp}).`);
      }

      // Evolution facts
      if (entry.type === 'evolution' && entry.evolution) {
        facts.push(`evolves(${agentId}, '${entry.evolution.fromDimension}', '${entry.evolution.toDimension}', ${entry.timestamp}).`);
      }

      // Interaction facts
      if (entry.type === 'interaction' && entry.targetAgent) {
        facts.push(`interacts(${agentId}, '${entry.targetAgent}', '${entry.interaction?.type || 'unknown'}', ${entry.timestamp}).`);
      }

      // Provenance facts
      if (entry.provenance.wasDerivedFrom) {
        entry.provenance.wasDerivedFrom.forEach(source => {
          facts.push(`was_derived_from('${entry.id}', '${source.file}', ${source.line}, ${source.timestamp}).`);
        });
      }
    }

    return facts;
  }

  /**
   * Convert history entries to DataLog facts
   */
  private historyToDatalogFacts(agentId: string): any[] {
    const history = this.historyCache.get(agentId) || [];
    const facts: any[] = [];

    for (const entry of history) {
      if (entry.type === 'document-consumption' && entry.target && typeof entry.target === 'object' && 'file' in entry.target) {
        facts.push({
          predicate: 'consumes',
          args: [agentId, entry.target.file, entry.timestamp]
        });
      }

      if (entry.type === 'code-production' && entry.code) {
        facts.push({
          predicate: 'produces',
          args: [agentId, entry.code.file, entry.timestamp]
        });
      }

      if (entry.type === 'evolution' && entry.evolution) {
        facts.push({
          predicate: 'evolves',
          args: [agentId, entry.evolution.fromDimension, entry.evolution.toDimension, entry.timestamp]
        });
      }

      if (entry.type === 'interaction' && entry.targetAgent) {
        facts.push({
          predicate: 'interacts',
          args: [agentId, entry.targetAgent, entry.interaction?.type || 'unknown', entry.timestamp]
        });
      }
    }

    return facts;
  }

  /**
   * Convert history entries to RDF triples for SPARQL
   */
  private historyToRdfTriples(agentId: string): string[] {
    const history = this.historyCache.get(agentId) || [];
    const triples: string[] = [];
    const baseUri = `http://example.org/agent/${agentId}`;

    for (const entry of history) {
      const entryUri = `${baseUri}/entry/${entry.id}`;
      
      triples.push(`<${entryUri}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/ontology#${entry.type}> .`);
      triples.push(`<${entryUri}> <http://www.w3.org/ns/prov#atTime> "${entry.timestamp}"^^<http://www.w3.org/2001/XMLSchema#long> .`);
      triples.push(`<${entryUri}> <http://www.w3.org/ns/prov#wasPerformedBy> <${baseUri}> .`);

      if (entry.type === 'document-consumption' && entry.target && typeof entry.target === 'object' && 'file' in entry.target) {
        triples.push(`<${entryUri}> <http://www.w3.org/ns/prov#used> <http://example.org/document/${encodeURIComponent(entry.target.file)}> .`);
      }

      if (entry.type === 'code-production' && entry.code) {
        triples.push(`<${entryUri}> <http://www.w3.org/ns/prov#generated> <http://example.org/code/${encodeURIComponent(entry.code.file)}> .`);
      }

      if (entry.provenance.wasDerivedFrom) {
        entry.provenance.wasDerivedFrom.forEach(source => {
          triples.push(`<${entryUri}> <http://www.w3.org/ns/prov#wasDerivedFrom> <http://example.org/source/${encodeURIComponent(source.file)}#L${source.line}> .`);
        });
      }
    }

    return triples;
  }

  /**
   * Execute Prolog query
   */
  async queryProlog(agentId: string, query: string): Promise<PrologResult> {
    await this.loadAgentHistory(agentId);
    
    // Use Meta-Log API if available
    if (metaLogApiService.isAvailable()) {
      try {
        const logFile = agentHistoryLoggingService.getAgentLogFile(agentId);
        const result = await metaLogApiService.prologQuery(query, logFile);
        return result;
      } catch (error) {
        console.warn('Meta-Log API Prolog query failed, falling back to basic implementation:', error);
      }
    }
    
    // Fallback to basic pattern matching
    const facts = this.historyToPrologFacts(agentId);
    const bindings: Record<string, any>[] = [];
    
    // Match consumes(Agent, Document, Timestamp)
    const consumesMatch = query.match(/consumes\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (consumesMatch) {
      const agentVar = consumesMatch[1].trim();
      const docVar = consumesMatch[2].trim();
      const timeVar = consumesMatch[3].trim();
      
      const history = this.historyCache.get(agentId) || [];
      for (const entry of history) {
        if (entry.type === 'document-consumption' && entry.target && typeof entry.target === 'object' && 'file' in entry.target) {
          bindings.push({
            [agentVar]: agentId,
            [docVar]: entry.target.file,
            [timeVar]: entry.timestamp
          });
        }
      }
    }

    // Match evolves(Agent, FromDim, ToDim, Timestamp)
    const evolvesMatch = query.match(/evolves\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (evolvesMatch) {
      const history = this.historyCache.get(agentId) || [];
      for (const entry of history) {
        if (entry.type === 'evolution' && entry.evolution) {
          bindings.push({
            [evolvesMatch[1].trim()]: agentId,
            [evolvesMatch[2].trim()]: entry.evolution.fromDimension,
            [evolvesMatch[3].trim()]: entry.evolution.toDimension,
            [evolvesMatch[4].trim()]: entry.timestamp
          });
        }
      }
    }

    return { bindings };
  }

  /**
   * Execute DataLog query
   */
  async queryDatalog(agentId: string, query: string, program?: any): Promise<DatalogResult> {
    await this.loadAgentHistory(agentId);
    
    // Use Meta-Log API if available
    if (metaLogApiService.isAvailable()) {
      try {
        const logFile = agentHistoryLoggingService.getAgentLogFile(agentId);
        const result = await metaLogApiService.datalogQuery(query, program, logFile);
        return result;
      } catch (error) {
        console.warn('Meta-Log API DataLog query failed, falling back to basic implementation:', error);
      }
    }
    
    // Fallback to basic fact extraction
    const facts = this.historyToDatalogFacts(agentId);
    return { facts };
  }

  /**
   * Execute SPARQL query
   */
  async querySparql(agentId: string, query: string): Promise<SparqlResult> {
    await this.loadAgentHistory(agentId);
    
    // Use Meta-Log API if available
    if (metaLogApiService.isAvailable()) {
      try {
        const logFile = agentHistoryLoggingService.getAgentLogFile(agentId);
        const result = await metaLogApiService.sparqlQuery(query, logFile);
        return result;
      } catch (error) {
        console.warn('Meta-Log API SPARQL query failed, falling back to basic implementation:', error);
      }
    }
    
    // Fallback to basic RDF triple extraction
    const triples = this.historyToRdfTriples(agentId);
    const bindings: Record<string, { value: string; type: string }>[] = [];
    
    // Extract SELECT variables
    const selectMatch = query.match(/SELECT\s+(.+?)\s+WHERE/i);
    if (selectMatch) {
      const variables = selectMatch[1].split(/\s+/).filter(v => v.startsWith('?'));
      
      // Simple triple pattern matching
      const whereMatch = query.match(/WHERE\s*\{([^}]+)\}/is);
      if (whereMatch) {
        const patterns = whereMatch[1].split('.').map(p => p.trim()).filter(p => p);
        
        // Basic pattern matching (would need proper SPARQL engine for full support)
      }
    }

    return {
      results: {
        bindings
      }
    };
  }

  /**
   * Build query from template
   */
  buildQuery(template: QueryTemplate, params: Record<string, any>): string {
    let query = template.query;
    
    // Replace placeholders
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{${key}}`;
      query = query.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return query;
  }

  /**
   * Get available query templates
   */
  getQueryTemplates(): QueryTemplate[] {
    return [
      {
        name: 'Documents Consumed',
        type: 'prolog',
        query: 'consumes(Agent, Document, Timestamp).',
        description: 'Find all documents consumed by agent'
      },
      {
        name: 'Code Produced',
        type: 'prolog',
        query: 'produces(Agent, Code, Timestamp).',
        description: 'Find all code produced by agent'
      },
      {
        name: 'Evolution Chain',
        type: 'prolog',
        query: 'evolves(Agent, FromDim, ToDim, Timestamp).',
        description: 'Find evolution chain for agent'
      },
      {
        name: 'Interactions',
        type: 'prolog',
        query: 'interacts(Agent, OtherAgent, Type, Timestamp).',
        description: 'Find all interactions with other agents'
      },
      {
        name: 'Provenance Chain',
        type: 'sparql',
        query: `PREFIX prov: <http://www.w3.org/ns/prov#>
SELECT ?action ?target ?timestamp
WHERE {
  ?action prov:wasPerformedBy <http://example.org/agent/{agentId}> .
  ?action prov:used ?target .
  ?action prov:atTime ?timestamp .
}
ORDER BY ?timestamp`,
        description: 'Find provenance chain using SPARQL'
      }
    ];
  }
}

// Singleton instance
export const agentProvenanceQueryService: AgentProvenanceQueryService = new AgentProvenanceQueryServiceImpl();
