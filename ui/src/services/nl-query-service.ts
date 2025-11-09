/**
 * Natural Language Query Service
 * 
 * Client-side service for interacting with the NL Query API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface NLQueryResponse {
  answer: string;
  citations: Array<{
    source: string;
    type: 'document' | 'agent' | 'function' | 'rule';
    title?: string;
    lineNumber?: number;
    url?: string;
  }>;
  followUpSuggestions: string[];
  relatedEntities: Array<{
    id: string;
    type: string;
    name: string;
  }>;
  confidence: number;
  conversationId: string;
}

export interface ConversationHistory {
  turnId: string;
  timestamp: number;
  userInput: string;
  intent: any;
  mergedResponse?: string;
  entities?: any[];
}

class NLQueryService {
  private conversationId: string | null = null;

  /**
   * Ask a question using natural language
   */
  async ask(question: string, conversationId?: string): Promise<NLQueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/nl-query/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          conversationId: conversationId || this.conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }

      // Store conversation ID
      if (data.data.conversationId) {
        this.conversationId = data.data.conversationId;
      }

      return data.data;
    } catch (error) {
      console.error('NL Query error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(conversationId?: string): Promise<ConversationHistory[]> {
    try {
      const id = conversationId || this.conversationId;
      if (!id) {
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/nl-query/history/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get history');
      }

      return data.data;
    } catch (error) {
      console.error('Get history error:', error);
      return [];
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId?: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/nl-query/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      this.conversationId = data.data.conversationId;
      return data.data.conversationId;
    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory(conversationId?: string): Promise<void> {
    try {
      const id = conversationId || this.conversationId;
      if (!id) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/nl-query/conversation/${id}/clear`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear history');
      }
    } catch (error) {
      console.error('Clear history error:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/nl-query/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Set conversation ID
   */
  setConversationId(conversationId: string): void {
    this.conversationId = conversationId;
  }
}

export const nlQueryService = new NLQueryService();
