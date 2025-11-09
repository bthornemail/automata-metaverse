#!/usr/bin/env tsx
/**
 * Enhanced Intent Parser
 * 
 * Improves query understanding with context awareness,
 * entity reference resolution, disambiguation, and query expansion
 */

import { NLQueryEngine, QueryIntent } from './nl-query-engine';
import { ConversationContextManager, ConversationContext, Entity } from './conversation-context-manager';

export interface ParsedIntent extends QueryIntent {
  originalQuestion: string;
  resolvedQuestion: string;
  entities: Entity[];
  confidence: number;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  expandedQueries?: QueryIntent[];
}

/**
 * Enhanced Intent Parser
 */
export class EnhancedIntentParser {
  private baseParser: NLQueryEngine;
  private contextManager: ConversationContextManager;

  constructor(baseParser: NLQueryEngine, contextManager: ConversationContextManager) {
    this.baseParser = baseParser;
    this.contextManager = contextManager;
  }

  /**
   * Parse intent with context awareness
   */
  parseIntent(
    question: string,
    conversationId: string
  ): ParsedIntent {
    const context = this.contextManager.getContext(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Resolve references in question
    const resolvedQuestion = this.resolveReferences(question, context);

    // Parse base intent
    const baseIntent = this.baseParser['parseIntent'](resolvedQuestion);

    // Refine intent with context
    const refinedIntent = this.refineIntent(baseIntent, context);

    // Extract entities
    const entities = this.extractEntities(resolvedQuestion, refinedIntent, context);

    // Check if clarification is needed
    const clarification = this.checkClarificationNeeded(refinedIntent, entities);

    // Expand query if needed
    const expandedQueries = this.expandQuery(refinedIntent, context);

    // Calculate confidence
    const confidence = this.calculateConfidence(refinedIntent, entities, context);

    return {
      ...refinedIntent,
      originalQuestion: question,
      resolvedQuestion,
      entities,
      confidence,
      requiresClarification: clarification.needsClarification,
      clarificationQuestions: clarification.questions,
      expandedQueries: expandedQueries.length > 1 ? expandedQueries : undefined
    };
  }

  /**
   * Refine intent with context
   */
  refineIntent(intent: QueryIntent, context: ConversationContext): QueryIntent {
    // If intent is unknown, try to infer from context
    if (intent.type === 'unknown') {
      // Check previous intents
      if (context.previousIntents.length > 0) {
        const lastIntent = context.previousIntents[context.previousIntents.length - 1];
        if (lastIntent) {
          // Inherit type from previous intent
          intent.type = lastIntent.type;
        }
      }

      // Check current topic
      if (context.currentTopic) {
        intent.entity = context.currentTopic;
      }
    }

    // Enhance filters with context
    if (!intent.filters) {
      intent.filters = {};
    }

    // Add context-based filters
    if (context.currentTopic) {
      intent.filters.topic = context.currentTopic;
    }

    // Add entity filters from context
    const recentEntities = Array.from(context.entities.values()).slice(-5);
    if (recentEntities.length > 0 && !intent.entity) {
      // Try to infer entity from recent mentions
      const lastEntity = recentEntities[recentEntities.length - 1];
      if (lastEntity && intent.type === lastEntity.type) {
        intent.entity = lastEntity.name;
        intent.filters.name = lastEntity.name;
      }
    }

    return intent;
  }

  /**
   * Resolve references in question (e.g., "it", "that agent", "the function")
   */
  resolveReferences(question: string, context: ConversationContext): string {
    let resolved = question;

    // Common reference patterns
    const referencePatterns = [
      { pattern: /\bit\b/gi, type: 'entity' },
      { pattern: /\bthat\s+(\w+)/gi, type: 'entity' },
      { pattern: /\bthe\s+(\w+)/gi, type: 'entity' },
      { pattern: /\bthis\s+(\w+)/gi, type: 'entity' },
      { pattern: /\bthose\s+(\w+)/gi, type: 'entity' },
      { pattern: /\bthem\b/gi, type: 'entity' }
    ];

    for (const refPattern of referencePatterns) {
      const matches = question.matchAll(refPattern.pattern);
      for (const match of matches) {
        const reference = match[0];
        const entity = this.contextManager.resolveEntityReference(reference, context);
        
        if (entity) {
          // Replace reference with entity name
          resolved = resolved.replace(reference, entity.name);
        }
      }
    }

    return resolved;
  }

  /**
   * Extract entities from question
   */
  extractEntities(
    question: string,
    intent: QueryIntent,
    context: ConversationContext
  ): Entity[] {
    const entities: Entity[] = [];

    // Extract from intent
    if (intent.entity) {
      // Try to find entity in context
      const contextEntity = Array.from(context.entities.values())
        .find(e => e.name.toLowerCase() === intent.entity!.toLowerCase());
      
      if (contextEntity) {
        entities.push(contextEntity);
      } else {
        // Create new entity
        entities.push({
          id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: intent.type as any,
          name: intent.entity,
          metadata: {
            timestamp: Date.now(),
            source: 'question'
          }
        });
      }
    }

    // Extract dimension references (0D-7D)
    const dimensionMatch = question.match(/(\d+d)/i);
    if (dimensionMatch) {
      entities.push({
        id: `dimension-${dimensionMatch[1]}`,
        type: 'concept',
        name: dimensionMatch[1].toUpperCase(),
        metadata: {
          timestamp: Date.now(),
          source: 'question'
        }
      });
    }

    // Extract agent names
    const agentMatch = question.match(/(\d+d-[\w-]+-agent|[\w-]+-agent)/i);
    if (agentMatch) {
      entities.push({
        id: `agent-${agentMatch[1]}`,
        type: 'agent',
        name: agentMatch[1],
        metadata: {
          timestamp: Date.now(),
          source: 'question'
        }
      });
    }

    // Extract function names
    const functionMatch = question.match(/(r5rs:[\w-]+|[\w-]+\(\))/i);
    if (functionMatch) {
      entities.push({
        id: `function-${functionMatch[1]}`,
        type: 'function',
        name: functionMatch[1],
        metadata: {
          timestamp: Date.now(),
          source: 'question'
        }
      });
    }

    return entities;
  }

  /**
   * Check if clarification is needed
   */
  checkClarificationNeeded(
    intent: QueryIntent,
    entities: Entity[]
  ): { needsClarification: boolean; questions: string[] } {
    const questions: string[] = [];

    // If intent is unknown, ask for clarification
    if (intent.type === 'unknown') {
      questions.push('Could you clarify what you\'re looking for? (agent, function, rule, example, or fact)');
      return { needsClarification: true, questions };
    }

    // If entity is ambiguous (multiple matches possible)
    if (intent.entity && entities.length === 0) {
      questions.push(`I couldn't find "${intent.entity}". Could you provide more details?`);
      return { needsClarification: true, questions };
    }

    // If multiple entities match
    if (entities.length > 1) {
      questions.push(`I found multiple matches. Which one did you mean?\n${entities.map((e, i) => `${i + 1}. ${e.name}`).join('\n')}`);
      return { needsClarification: true, questions };
    }

    return { needsClarification: false, questions: [] };
  }

  /**
   * Disambiguate intent when multiple options exist
   */
  disambiguate(
    intent: QueryIntent,
    options: Entity[]
  ): QueryIntent {
    if (options.length === 0) {
      return intent;
    }

    if (options.length === 1) {
      // Single match - use it
      intent.entity = options[0].name;
      intent.filters = intent.filters || {};
      intent.filters.name = options[0].name;
      return intent;
    }

    // Multiple matches - return intent with clarification flag
    // (Caller should ask user to clarify)
    return intent;
  }

  /**
   * Expand query to include related queries
   */
  expandQuery(
    intent: QueryIntent,
    context: ConversationContext
  ): QueryIntent[] {
    const expanded: QueryIntent[] = [intent];

    // Expand agent queries to include dependencies
    if (intent.type === 'agent' && intent.entity) {
      expanded.push({
        type: 'agent',
        entity: intent.entity,
        question: `What are the dependencies of ${intent.entity}?`,
        filters: { ...intent.filters, queryType: 'dependencies' }
      });
    }

    // Expand function queries to include examples
    if (intent.type === 'function' && intent.entity) {
      expanded.push({
        type: 'example',
        entity: intent.entity,
        question: `Show examples of ${intent.entity}`,
        filters: { function: intent.entity }
      });
    }

    // Expand rule queries to include related rules
    if (intent.type === 'rule') {
      expanded.push({
        type: 'rule',
        question: 'What are all related rules?',
        filters: { ...intent.filters, related: true }
      });
    }

    return expanded;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    intent: QueryIntent,
    entities: Entity[],
    context: ConversationContext
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if intent type is known
    if (intent.type !== 'unknown') {
      confidence += 0.2;
    }

    // Increase confidence if entity is found
    if (intent.entity && entities.length > 0) {
      confidence += 0.2;
    }

    // Increase confidence if context supports intent
    if (context.currentTopic && intent.entity === context.currentTopic) {
      confidence += 0.1;
    }

    // Decrease confidence if clarification needed
    const clarification = this.checkClarificationNeeded(intent, entities);
    if (clarification.needsClarification) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
