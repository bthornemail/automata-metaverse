/**
 * Agent Interface Component
 * 
 * Handles agent selection and interaction
 */

import React, { useState } from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { AgentChat } from '@/types';

interface AgentInterfaceProps {
  agents: string[];
  onAgentSelect: (agent: string) => void;
  onAgentMessage: (agent: string, message: string) => Promise<void>;
  className?: string;
}

export const AgentInterface: React.FC<AgentInterfaceProps> = ({
  agents,
  onAgentSelect,
  onAgentMessage,
  className = '',
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!selectedAgent || !message.trim()) return;

    setIsLoading(true);
    try {
      await onAgentMessage(selectedAgent, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message to agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5" />
        Agents
      </h3>

      {/* Agent List */}
      <div className="space-y-2 mb-4">
        {agents.map((agent) => (
          <button
            key={agent}
            onClick={() => {
              setSelectedAgent(agent);
              onAgentSelect(agent);
            }}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${
              selectedAgent === agent
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="capitalize">{agent.replace(/-/g, ' ')}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Message Input */}
      {selectedAgent && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            Chatting with: <span className="text-white capitalize">{selectedAgent.replace(/-/g, ' ')}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
