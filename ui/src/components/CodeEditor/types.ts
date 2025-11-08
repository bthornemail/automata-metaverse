export interface OpenCodeConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  enableWebLLM: boolean;
  enableQueries: boolean;
  enableAgents: boolean;
  wordWrap: boolean;
  theme: 'dark' | 'light';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'advisory' | 'specialized';
  icon: React.ReactNode;
  capabilities: string[];
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ConsoleOutput {
  id: string;
  type: 'log' | 'error' | 'warning' | 'success';
  message: string;
  timestamp: number;
}

export interface EditorState {
  content: string;
  language: string;
  cursor: { line: number; ch: number };
  selection?: { from: { line: number; ch: number }; to: { line: number; ch: number } };
}

export interface ModalState {
  showConfig: boolean;
  showAgent: boolean;
  selectedAgent: Agent | null;
}

export type OpenCodeTab = 'analysis' | 'agents' | 'config' | 'webllm' | 'queries';

export interface CodeEditorProps {
  initialContent?: string;
  language?: string;
  theme?: 'dark' | 'light';
  onContentChange?: (content: string) => void;
  onCursorChange?: (cursor: { line: number; ch: number }) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}