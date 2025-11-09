import React, { useState } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { Agent, AgentConversation, AgentMessage } from '../types';

interface AgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  conversations: AgentConversation[];
  activeConversation: string | null;
  onSendMessage: (message: string) => void;
  isExecuting: boolean;
}

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  isOpen,
  onClose,
  agent,
  conversations,
  activeConversation,
  onSendMessage,
  isExecuting
}) => {
  const [message, setMessage] = useState('');

  if (!isOpen || !agent) return null;

  const currentConversation = conversations.find(conv => conv.id === activeConversation);
  
  const handleSendMessage = () => {
    if (message.trim() && !isExecuting) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              agent.category === 'analysis' ? 'bg-green-900' :
              agent.category === 'advisory' ? 'bg-blue-900' : 'bg-purple-900'
            }`}>
              {agent.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
              <p className="text-sm text-gray-400">{agent.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 mb-4">
            {currentConversation?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with {agent.name}</p>
                <p className="text-sm mt-2">{agent.description}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex space-x-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask ${agent.name} something...`}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                disabled={isExecuting}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isExecuting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isExecuting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};