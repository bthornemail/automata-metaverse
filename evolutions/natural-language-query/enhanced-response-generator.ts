#!/usr/bin/env tsx
/**
 * Enhanced Response Generator
 * 
 * Generates natural language answers with citations,
 * formatting, and context-aware responses
 */

import { QueryResult } from './nl-query-engine';
import { ConversationContext, Entity } from './conversation-context-manager';
import { ParsedIntent } from './enhanced-intent-parser';
import { CoordinatedResponse } from './agent-router';

export interface FormattedResponse {
  answer: string;
  citations: Citation[];
  followUpSuggestions: string[];
  relatedEntities: Entity[];
  confidence: number;
}

export interface Citation {
  source: string;
  type: 'document' | 'agent' | 'function' | 'rule';
  title?: string;
  lineNumber?: number;
  url?: string;
}

/**
 * Enhanced Response Generator
 */
export class EnhancedResponseGenerator {
  /**
   * Generate formatted response
   */
  generateResponse(
    queryResult: QueryResult,
    parsedIntent: ParsedIntent,
    coordinatedResponse?: CoordinatedResponse,
    context?: ConversationContext
  ): FormattedResponse {
    // Use coordinated response if available, otherwise use query result
    const answer = coordinatedResponse 
      ? coordinatedResponse.mergedAnswer 
      : queryResult.answer;

    // Extract citations
    const citations = this.extractCitations(queryResult, parsedIntent, coordinatedResponse);

    // Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(
      queryResult,
      parsedIntent,
      coordinatedResponse,
      context
    );

    // Get related entities
    const relatedEntities = this.getRelatedEntities(parsedIntent, context);

    // Format answer with citations
    const formattedAnswer = this.formatAnswerWithCitations(answer, citations);

    return {
      answer: formattedAnswer,
      citations,
      followUpSuggestions,
      relatedEntities,
      confidence: coordinatedResponse?.confidence || queryResult.confidence
    };
  }

  /**
   * Format answer with citations
   */
  private formatAnswerWithCitations(answer: string, citations: Citation[]): string {
    if (citations.length === 0) {
      return answer;
    }

    let formatted = answer;

    // Add citations section
    if (citations.length > 0) {
      formatted += '\n\n---\n\n**Sources:**\n\n';
      citations.forEach((citation, index) => {
        formatted += `${index + 1}. `;
        if (citation.title) {
          formatted += `**${citation.title}**`;
        }
        formatted += ` (${citation.source}`;
        if (citation.lineNumber) {
          formatted += `, line ${citation.lineNumber}`;
        }
        formatted += ')';
        if (citation.url) {
          formatted += ` - ${citation.url}`;
        }
        formatted += '\n';
      });
    }

    return formatted;
  }

  /**
   * Extract citations from query result
   */
  private extractCitations(
    queryResult: QueryResult,
    parsedIntent: ParsedIntent,
    coordinatedResponse?: CoordinatedResponse
  ): Citation[] {
    const citations: Citation[] = [];

    // Extract citations from query results
    queryResult.results.forEach(result => {
      const source = (result as any).source;
      if (source) {
        citations.push({
          source,
          type: this.inferCitationType(result),
          title: (result as any).metadata?.title,
          lineNumber: (result as any).lineNumber
        });
      }
    });

    // Extract citations from coordinated response
    if (coordinatedResponse) {
      coordinatedResponse.agentsUsed.forEach(agentName => {
        citations.push({
          source: agentName,
          type: 'agent',
          title: agentName
        });
      });
    }

    // Remove duplicates
    const uniqueCitations = citations.filter((citation, index, self) =>
      index === self.findIndex(c => 
        c.source === citation.source && 
        c.lineNumber === citation.lineNumber
      )
    );

    return uniqueCitations;
  }

  /**
   * Infer citation type from result
   */
  private inferCitationType(result: any): Citation['type'] {
    if (result.name && result.dimension) {
      return 'agent';
    }
    if (result.name && result.signature) {
      return 'function';
    }
    if (result.rfc2119Keyword) {
      return 'rule';
    }
    return 'document';
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(
    queryResult: QueryResult,
    parsedIntent: ParsedIntent,
    coordinatedResponse?: CoordinatedResponse,
    context?: ConversationContext
  ): string[] {
    const suggestions: string[] = [];

    // Generate suggestions based on query type
    switch (parsedIntent.type) {
      case 'agent':
        if (queryResult.results.length === 1) {
          const agent = queryResult.results[0] as any;
          suggestions.push(`What are the dependencies of ${agent.name}?`);
          suggestions.push(`What are the capabilities of ${agent.name}?`);
          suggestions.push(`What rules apply to ${agent.name}?`);
          
          if (agent.dimension) {
            suggestions.push(`What other agents are in ${agent.dimension}?`);
          }
        } else {
          suggestions.push(`Tell me more about ${parsedIntent.entity || 'these agents'}`);
        }
        break;

      case 'function':
        if (queryResult.results.length === 1) {
          const func = queryResult.results[0] as any;
          suggestions.push(`Show me examples of using ${func.name}`);
          suggestions.push(`What agents use ${func.name}?`);
          suggestions.push(`What are the parameters of ${func.name}?`);
        }
        break;

      case 'rule':
        suggestions.push('What are all the MUST requirements?');
        suggestions.push('What are all the SHOULD requirements?');
        suggestions.push('What rules apply to agents?');
        break;

      case 'fact':
        suggestions.push('Tell me more about this');
        suggestions.push('What are related facts?');
        suggestions.push('What documents discuss this?');
        break;
    }

    // Add context-based suggestions
    if (context?.currentTopic) {
      suggestions.push(`What else can you tell me about ${context.currentTopic}?`);
    }

    // Add entity-based suggestions
    if (parsedIntent.entities.length > 0) {
      const entity = parsedIntent.entities[0];
      suggestions.push(`What are the relationships of ${entity.name}?`);
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Get related entities
   */
  private getRelatedEntities(
    parsedIntent: ParsedIntent,
    context?: ConversationContext
  ): Entity[] {
    const entities: Entity[] = [];

    // Add entities from parsed intent
    entities.push(...parsedIntent.entities);

    // Add entities from context
    if (context) {
      const recentEntities = Array.from(context.entities.values()).slice(-5);
      entities.push(...recentEntities);
    }

    // Remove duplicates
    const uniqueEntities = entities.filter((entity, index, self) =>
      index === self.findIndex(e => e.id === entity.id)
    );

    return uniqueEntities;
  }

  /**
   * Format response for different output types
   */
  formatForOutput(
    response: FormattedResponse,
    outputType: 'markdown' | 'plain' | 'json' = 'markdown'
  ): string {
    switch (outputType) {
      case 'markdown':
        return this.formatMarkdown(response);
      
      case 'plain':
        return this.formatPlain(response);
      
      case 'json':
        return JSON.stringify(response, null, 2);
      
      default:
        return response.answer;
    }
  }

  /**
   * Format as markdown
   */
  private formatMarkdown(response: FormattedResponse): string {
    let markdown = response.answer;

    if (response.followUpSuggestions.length > 0) {
      markdown += '\n\n**Related questions you might ask:**\n\n';
      response.followUpSuggestions.forEach((suggestion, i) => {
        markdown += `${i + 1}. ${suggestion}\n`;
      });
    }

    return markdown;
  }

  /**
   * Format as plain text
   */
  private formatPlain(response: FormattedResponse): string {
    // Remove markdown formatting
    let plain = response.answer
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    if (response.followUpSuggestions.length > 0) {
      plain += '\n\nRelated questions:\n';
      response.followUpSuggestions.forEach((suggestion, i) => {
        plain += `${i + 1}. ${suggestion}\n`;
      });
    }

    return plain;
  }
}
