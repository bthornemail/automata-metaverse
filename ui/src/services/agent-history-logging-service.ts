/**
 * Agent History Logging Service
 * Federated logging system for tracking agent evolution, document consumption, code production, and interactions
 */

import { databaseService } from './database-service';

// Types
export interface DocumentReference {
  type: 'document';
  file: string;
  line: number;
  section?: string;
}

export interface CodeReference {
  type: 'typescript' | 'javascript' | 'scheme' | 'canvasl' | 'jsonl';
  file: string;
  snippet: string;
  line: number;
}

export interface ExtractedKnowledge {
  facts?: string[];
  rules?: string[];
  functions?: string[];
  concepts?: string[];
}

export interface EvolutionData {
  fromDimension: string;
  toDimension: string;
  changes: {
    capabilities?: string[];
    churchEncoding?: string;
    state?: Record<string, any>;
  };
}

export interface AgentSnapshot {
  state: Record<string, any>;
  memory: number;
  objects: number;
  timestamp: number;
}

export interface InteractionData {
  type: 'touch' | 'communicate' | 'collaborate' | 'learn';
  shared?: {
    knowledge?: string[];
    code?: string[];
    documents?: string[];
  };
}

export interface Reference {
  type: 'document' | 'code' | 'agent-log';
  file: string;
  line?: number;
  entryId?: string;
  agentId?: string;
}

export interface ProvenanceMetadata {
  selfReference: {
    file: string;
    line: number;
    pattern?: string;
  };
  wasDerivedFrom?: Array<{
    file: string;
    line: number;
    agent?: string;
    timestamp: number;
  }>;
  produced?: Array<{
    type: string;
    fact?: string;
    code?: string;
    confidence?: number;
  }>;
}

export interface HistoryLogEntry {
  id: string;
  type: 'document-consumption' | 'code-production' | 'evolution' | 'interaction';
  timestamp: number;
  agentId: string;
  action: string;
  target?: DocumentReference | CodeReference | string;
  extracted?: ExtractedKnowledge;
  code?: CodeReference;
  references?: Reference[];
  evolution?: EvolutionData;
  snapshot?: AgentSnapshot;
  targetAgent?: string;
  interaction?: InteractionData;
  provenance: ProvenanceMetadata;
  metadata?: {
    dimension?: string;
    churchEncoding?: string;
    interactionRange?: string;
  };
}

export interface QueryOptions {
  timeRange?: [number, number];
  types?: string[];
  limit?: number;
  offset?: number;
}

export interface ProvenanceChain {
  entry: HistoryLogEntry;
  upstream: ProvenanceChain[];
  downstream: ProvenanceChain[];
}

export interface AgentHistoryLoggingService {
  logDocumentConsumption(
    agentId: string,
    document: DocumentReference,
    extracted: ExtractedKnowledge
  ): Promise<void>;
  
  logCodeProduction(
    agentId: string,
    code: CodeReference,
    references: Reference[]
  ): Promise<void>;
  
  logEvolution(
    agentId: string,
    evolution: EvolutionData,
    snapshot: AgentSnapshot
  ): Promise<void>;
  
  logInteraction(
    agentId: string,
    targetAgent: string,
    interaction: InteractionData
  ): Promise<void>;
  
  getHistory(agentId: string, options?: QueryOptions): Promise<HistoryLogEntry[]>;
  
  getProvenanceChain(
    agentId: string,
    entryId: string,
    direction?: 'upstream' | 'downstream' | 'both'
  ): Promise<ProvenanceChain>;
  
  getAgentLogFile(agentId: string): string;
  getAllAgentIds(): Promise<string[]>;
}

class AgentHistoryLoggingServiceImpl implements AgentHistoryLoggingService {
  private readonly LOGS_BASE_PATH = 'logs/agents';
  private lineCounters: Map<string, number> = new Map();

  /**
   * Get the CanvasL log file path for an agent
   */
  getAgentLogFile(agentId: string): string {
    return `${this.LOGS_BASE_PATH}/${agentId}/history.canvasl`;
  }

  /**
   * Get current line number for an agent's log file
   */
  private async getCurrentLineNumber(agentId: string): Promise<number> {
    if (!this.lineCounters.has(agentId)) {
      try {
        const entries = await databaseService.readJSONL(this.getAgentLogFile(agentId));
        // Count directives + entries
        const directiveLines = entries.filter((e: any) => e.type === 'directive').length;
        this.lineCounters.set(agentId, directiveLines + entries.length);
      } catch {
        // File doesn't exist yet, start at 1 (after directives)
        this.lineCounters.set(agentId, 1);
      }
    }
    const current = this.lineCounters.get(agentId) || 1;
    this.lineCounters.set(agentId, current + 1);
    return current;
  }

  /**
   * Ensure log file exists with CanvasL directives
   */
  private async ensureLogFile(agentId: string): Promise<void> {
    const logFile = this.getAgentLogFile(agentId);
    try {
      await databaseService.readJSONL(logFile);
      // File exists
    } catch {
      // File doesn't exist, create with directives
      const directives = [
        { type: 'directive', name: '@version', value: '1.0' },
        { type: 'directive', name: '@schema', value: 'canvasl-v1' },
        { type: 'directive', name: '@r5rs-engine', value: 'r5rs-canvas-engine.scm' },
        { type: 'directive', name: '@dimension', value: agentId.split('-')[1] || '0D' },
        { type: 'directive', name: '@phase', value: 'agent-history-logging' }
      ];
      
      // Write directives
      for (const directive of directives) {
        await databaseService.appendJSONL(logFile, directive);
      }
    }
  }

  /**
   * Create a log entry with provenance metadata
   */
  private async createLogEntry(
    agentId: string,
    type: HistoryLogEntry['type'],
    action: string,
    data: Partial<HistoryLogEntry>
  ): Promise<HistoryLogEntry> {
    await this.ensureLogFile(agentId);
    
    const lineNumber = await this.getCurrentLineNumber(agentId);
    const timestamp = Date.now();
    const entryId = `log-${agentId}-${type}-${timestamp}`;
    
    const entry: HistoryLogEntry = {
      id: entryId,
      type,
      timestamp,
      agentId,
      action,
      provenance: {
        selfReference: {
          file: this.getAgentLogFile(agentId),
          line: lineNumber,
          pattern: type
        }
      },
      ...data
    };

    // Append to log file
    await databaseService.appendJSONL(this.getAgentLogFile(agentId), entry);
    
    return entry;
  }

  /**
   * Log document consumption
   */
  async logDocumentConsumption(
    agentId: string,
    document: DocumentReference,
    extracted: ExtractedKnowledge
  ): Promise<void> {
    await this.createLogEntry(agentId, 'document-consumption', 'read', {
      target: document,
      extracted,
      provenance: {
        selfReference: {
          file: this.getAgentLogFile(agentId),
          line: await this.getCurrentLineNumber(agentId),
          pattern: 'document-consumption'
        },
        wasDerivedFrom: [{
          file: document.file,
          line: document.line,
          agent: agentId,
          timestamp: Date.now()
        }],
        produced: extracted.facts?.map(fact => ({
          type: 'knowledge',
          fact,
          confidence: 0.9
        })) || []
      }
    });
  }

  /**
   * Log code production
   */
  async logCodeProduction(
    agentId: string,
    code: CodeReference,
    references: Reference[]
  ): Promise<void> {
    await this.createLogEntry(agentId, 'code-production', 'generate', {
      code,
      references,
      provenance: {
        selfReference: {
          file: this.getAgentLogFile(agentId),
          line: await this.getCurrentLineNumber(agentId),
          pattern: 'code-production'
        },
        wasDerivedFrom: references.map(ref => ({
          file: ref.file,
          line: ref.line || 0,
          agent: ref.agentId,
          timestamp: Date.now()
        })),
        produced: [{
          type: 'code',
          code: code.snippet,
          confidence: 0.85
        }]
      }
    });
  }

  /**
   * Log evolution
   */
  async logEvolution(
    agentId: string,
    evolution: EvolutionData,
    snapshot: AgentSnapshot
  ): Promise<void> {
    await this.createLogEntry(agentId, 'evolution', 'evolve', {
      evolution,
      snapshot,
      metadata: {
        dimension: evolution.toDimension,
        churchEncoding: evolution.changes.churchEncoding
      }
    });
  }

  /**
   * Log interaction
   */
  async logInteraction(
    agentId: string,
    targetAgent: string,
    interaction: InteractionData
  ): Promise<void> {
    const references: Reference[] = [];
    
    // Add reference to target agent's log if interaction shared knowledge
    if (interaction.shared?.knowledge) {
      references.push({
        type: 'agent-log',
        file: this.getAgentLogFile(targetAgent),
        agentId: targetAgent
      });
    }

    await this.createLogEntry(agentId, 'interaction', interaction.type, {
      targetAgent,
      interaction,
      references,
      provenance: {
        selfReference: {
          file: this.getAgentLogFile(agentId),
          line: await this.getCurrentLineNumber(agentId),
          pattern: 'interaction'
        }
      }
    });
  }

  /**
   * Get history entries for an agent
   */
  async getHistory(agentId: string, options?: QueryOptions): Promise<HistoryLogEntry[]> {
    try {
      const entries = await databaseService.readJSONL(this.getAgentLogFile(agentId));
      
      // Filter out directives
      const logEntries = entries.filter((e: any) => 
        e.type && ['document-consumption', 'code-production', 'evolution', 'interaction'].includes(e.type)
      ) as HistoryLogEntry[];

      // Apply filters
      let filtered = logEntries;

      if (options?.timeRange) {
        const [start, end] = options.timeRange;
        filtered = filtered.filter(e => e.timestamp >= start && e.timestamp <= end);
      }

      if (options?.types && options.types.length > 0) {
        filtered = filtered.filter(e => options.types!.includes(e.type));
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => b.timestamp - a.timestamp);

      // Apply pagination
      if (options?.offset) {
        filtered = filtered.slice(options.offset);
      }
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    } catch (error) {
      console.warn(`Failed to load history for ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Get provenance chain for an entry
   */
  async getProvenanceChain(
    agentId: string,
    entryId: string,
    direction: 'upstream' | 'downstream' | 'both' = 'both'
  ): Promise<ProvenanceChain> {
    const entries = await this.getHistory(agentId);
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    const chain: ProvenanceChain = {
      entry,
      upstream: [],
      downstream: []
    };

    // Build upstream chain (what this entry was derived from)
    if (direction === 'upstream' || direction === 'both') {
      if (entry.provenance.wasDerivedFrom) {
        for (const source of entry.provenance.wasDerivedFrom) {
          // Find entries that match this source
          const sourceEntries = entries.filter(e => 
            e.provenance.selfReference.file === source.file &&
            e.provenance.selfReference.line === source.line
          );
          
          for (const sourceEntry of sourceEntries) {
            const sourceChain = await this.getProvenanceChain(agentId, sourceEntry.id, 'upstream');
            chain.upstream.push(sourceChain);
          }
        }
      }
    }

    // Build downstream chain (what was derived from this entry)
    if (direction === 'downstream' || direction === 'both') {
      const downstreamEntries = entries.filter(e => 
        e.provenance.wasDerivedFrom?.some(source =>
          source.file === entry.provenance.selfReference.file &&
          source.line === entry.provenance.selfReference.line
        )
      );

      for (const downstreamEntry of downstreamEntries) {
        const downstreamChain = await this.getProvenanceChain(agentId, downstreamEntry.id, 'downstream');
        chain.downstream.push(downstreamChain);
      }
    }

    return chain;
  }

  /**
   * Get all agent IDs that have log files
   */
  async getAllAgentIds(): Promise<string[]> {
    // In a real implementation, this would scan the logs directory
    // For now, return standard agent IDs
    return [
      'agent-0D', 'agent-1D', 'agent-2D', 'agent-3D',
      'agent-4D', 'agent-5D', 'agent-6D', 'agent-7D'
    ];
  }
}

// Singleton instance
export const agentHistoryLoggingService: AgentHistoryLoggingService = new AgentHistoryLoggingServiceImpl();
