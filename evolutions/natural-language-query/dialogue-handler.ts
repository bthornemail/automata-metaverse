#!/usr/bin/env tsx
/**
 * Multi-turn Dialogue Handler
 * 
 * Handles follow-up questions, maintains conversation flow,
 * asks clarification questions, and manages context switches
 */

import { QueryIntent, QueryResult } from './nl-query-engine';
import { ConversationContextManager, ConversationContext, ConversationTurn, Entity } from './conversation-context-manager';
import { EnhancedIntentParser, ParsedIntent } from './enhanced-intent-parser';

export interface Response {
  answer: string;
  confidence: number;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  followUpSuggestions?: string[];
  contextSwitched?: boolean;
  entities?: Entity[];
}

export interface ClarificationQuestion {
  question: string;
  options?: string[];
  type: 'disambiguation' | 'missing_info' | 'confirmation';
}

/**
 * Multi-turn Dialogue Handler
 */
export class DialogueHandler {
  private contextManager: ConversationContextManager;
  private intentParser: EnhancedIntentParser;
  private baseQueryEngine: any; // NLQueryEngine

  constructor(
    contextManager: ConversationContextManager,
    intentParser: EnhancedIntentParser,
    baseQueryEngine: any
  ) {
    this.contextManager = contextManager;
    this.intentParser = intentParser;
    this.baseQueryEngine = baseQueryEngine;
  }

  /**
   * Handle a conversation turn
   */
  async handleTurn(
    conversationId: string,
    userInput: string
  ): Promise<Response> {
    const context = this.contextManager.getContext(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Detect if this is a follow-up question
    const isFollowUp = this.detectFollowUp(userInput, context);

    // Parse intent with context
    const parsedIntent = this.intentParser.parseIntent(userInput, conversationId);

    // Handle follow-up if detected
    if (isFollowUp && context.currentIntent) {
      const followUpIntent = this.handleFollowUp(
        context.currentIntent,
        userInput,
        context
      );
      
      // Merge follow-up intent with parsed intent
      Object.assign(parsedIntent, followUpIntent);
    }

    // Check if clarification is needed
    if (parsedIntent.requiresClarification) {
      return {
        answer: this.formatClarificationRequest(parsedIntent),
        confidence: parsedIntent.confidence,
        requiresClarification: true,
        clarificationQuestions: parsedIntent.clarificationQuestions,
        entities: parsedIntent.entities
      };
    }

    // Execute query
    const queryResult = this.baseQueryEngine.query(parsedIntent.resolvedQuestion);

    // Detect context switch
    const contextSwitched = this.detectContextSwitch(parsedIntent, context);

    // Generate response
    const answer = this.formatAnswer(queryResult, parsedIntent, context);

    // Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(queryResult, parsedIntent, context);

    // Create turn
    const turn: ConversationTurn = {
      turnId: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userInput,
      intent: parsedIntent,
      mergedResponse: answer,
      entities: parsedIntent.entities,
      contextUpdates: contextSwitched ? [{
        type: 'intent',
        key: 'currentIntent',
        value: parsedIntent,
        timestamp: Date.now()
      }] : undefined
    };

    // Add turn to context
    this.contextManager.addTurn(conversationId, turn);

    return {
      answer,
      confidence: queryResult.confidence,
      requiresClarification: false,
      followUpSuggestions,
      contextSwitched,
      entities: parsedIntent.entities
    };
  }

  /**
   * Ask clarification question
   */
  askClarification(intent: QueryIntent): ClarificationQuestion {
    if (intent.type === 'unknown') {
      return {
        question: 'Could you clarify what you\'re looking for?',
        options: ['agent', 'function', 'rule', 'example', 'fact'],
        type: 'disambiguation'
      };
    }

    if (!intent.entity) {
      return {
        question: `What ${intent.type} are you interested in?`,
        type: 'missing_info'
      };
    }

    return {
      question: `Did you mean "${intent.entity}"?`,
      type: 'confirmation'
    };
  }

  /**
   * Handle follow-up question
   */
  handleFollowUp(
    previousIntent: QueryIntent,
    followUp: string,
    context: ConversationContext
  ): Partial<ParsedIntent> {
    const lowerFollowUp = followUp.toLowerCase();

    // Check for common follow-up patterns
    const followUpPatterns = [
      {
        pattern: /(what are|tell me about|explain)\s+(the\s+)?(dependencies|capabilities|requirements|examples)/i,
        type: 'related_query' as const
      },
      {
        pattern: /(show|give|tell)\s+me\s+(more|another|additional)/i,
        type: 'more_info' as const
      },
      {
        pattern: /(what|which|how)\s+(else|other|more)/i,
        type: 'related_query' as const
      },
      {
        pattern: /(and|also|what about)\s+(.+)/i,
        type: 'additional_query' as const
      }
    ];

    for (const pattern of followUpPatterns) {
      const match = followUp.match(pattern.pattern);
      if (match) {
        // Build new intent based on previous intent
        const newIntent: Partial<ParsedIntent> = {
          ...previousIntent,
          originalQuestion: followUp,
          resolvedQuestion: followUp
        };

        // Enhance filters based on follow-up type
        if (pattern.type === 'related_query') {
          const relatedType = match[3] || match[2];
          newIntent.filters = {
            ...previousIntent.filters,
            queryType: relatedType
          };
        }

        return newIntent;
      }
    }

    // Default: treat as continuation of previous intent
    return {
      ...previousIntent,
      originalQuestion: followUp,
      resolvedQuestion: followUp
    };
  }

  /**
   * Detect if question is a follow-up
   */
  detectFollowUp(question: string, context: ConversationContext): boolean {
    if (context.turns.length === 0) {
      return false;
    }

    const lowerQuestion = question.toLowerCase();

    // Follow-up indicators
    const followUpIndicators = [
      'what about',
      'tell me more',
      'and',
      'also',
      'what else',
      'how about',
      'what are',
      'show me',
      'give me',
      'it',
      'that',
      'this',
      'them',
      'they'
    ];

    // Check for follow-up indicators
    const hasIndicator = followUpIndicators.some(indicator => 
      lowerQuestion.includes(indicator)
    );

    // Check for pronoun references
    const hasPronoun = /\b(it|that|this|them|they|those)\b/i.test(question);

    // Check if question is very short (likely follow-up)
    const isShort = question.split(' ').length <= 5;

    return hasIndicator || hasPronoun || (isShort && context.currentIntent !== null);
  }

  /**
   * Detect context switch
   */
  detectContextSwitch(
    parsedIntent: ParsedIntent,
    context: ConversationContext
  ): boolean {
    if (!context.currentIntent) {
      return false;
    }

    // Check if intent type changed
    if (parsedIntent.type !== context.currentIntent.type) {
      return true;
    }

    // Check if entity changed significantly
    if (parsedIntent.entity && context.currentIntent.entity) {
      if (parsedIntent.entity.toLowerCase() !== context.currentIntent.entity.toLowerCase()) {
        return true;
      }
    }

    // Check if topic changed
    if (parsedIntent.entities.length > 0 && context.currentTopic) {
      const newTopic = parsedIntent.entities[0]?.name;
      if (newTopic && newTopic.toLowerCase() !== context.currentTopic.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Format clarification request
   */
  private formatClarificationRequest(parsedIntent: ParsedIntent): string {
    if (parsedIntent.clarificationQuestions && parsedIntent.clarificationQuestions.length > 0) {
      return parsedIntent.clarificationQuestions[0];
    }

    return 'Could you provide more details about what you\'re looking for?';
  }

  /**
   * Format answer with context
   */
  private formatAnswer(
    queryResult: QueryResult,
    parsedIntent: ParsedIntent,
    context: ConversationContext
  ): string {
    let answer = queryResult.answer;

    // Add context if this is a follow-up
    if (this.detectFollowUp(parsedIntent.originalQuestion, context)) {
      const lastTurn = context.turns[context.turns.length - 1];
      if (lastTurn) {
        answer = `Following up on "${lastTurn.userInput}":\n\n${answer}`;
      }
    }

    // Add entity references if relevant
    if (parsedIntent.entities.length > 0) {
      const entityNames = parsedIntent.entities.map(e => e.name).join(', ');
      if (!answer.includes(entityNames)) {
        answer = `Regarding ${entityNames}:\n\n${answer}`;
      }
    }

    return answer;
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(
    queryResult: QueryResult,
    parsedIntent: ParsedIntent,
    context: ConversationContext
  ): string[] {
    const suggestions: string[] = [];

    // Generate suggestions based on query result
    switch (parsedIntent.type) {
      case 'agent':
        if (queryResult.results.length === 1) {
          const agent = queryResult.results[0] as any;
          suggestions.push(`What are the dependencies of ${agent.name}?`);
          suggestions.push(`What are the capabilities of ${agent.name}?`);
          suggestions.push(`What rules apply to ${agent.name}?`);
        } else {
          suggestions.push(`Tell me more about ${parsedIntent.entity || 'these agents'}`);
        }
        break;

      case 'function':
        if (queryResult.results.length === 1) {
          const func = queryResult.results[0] as any;
          suggestions.push(`Show me examples of using ${func.name}`);
          suggestions.push(`What agents use ${func.name}?`);
        }
        break;

      case 'rule':
        suggestions.push('What are all the MUST requirements?');
        suggestions.push('What are all the SHOULD requirements?');
        break;

      case 'fact':
        suggestions.push('Tell me more about this');
        suggestions.push('What are related facts?');
        break;
    }

    // Add context-based suggestions
    if (context.currentTopic) {
      suggestions.push(`What else can you tell me about ${context.currentTopic}?`);
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
}
