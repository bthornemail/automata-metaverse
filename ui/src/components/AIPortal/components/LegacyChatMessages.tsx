/**
 * Legacy Chat Messages Component
 * 
 * Legacy chat messages display (kept for backward compatibility)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, FileText, Lightbulb } from 'lucide-react';
import { ChatMessage } from '@/types';

interface LegacyChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSuggestionClick: (suggestion: string) => void;
  activeAgent: string;
}

export const LegacyChatMessages: React.FC<LegacyChatMessagesProps> = ({
  messages,
  isTyping,
  messagesEndRef,
  onSuggestionClick,
  activeAgent,
}) => {
  return (
    <div className="hidden">
      {/* Chat Messages */}
      <div className="flex-1 bg-gray-900 rounded-lg p-4 mb-4 overflow-y-auto min-h-0 border border-gray-700">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-sm">Start a conversation with {activeAgent.replace('-', ' ')}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'agent' && (
                  <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Citations */}
                  {message.role === 'agent' && message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Sources:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.citations.map((citation, idx) => (
                          <a
                            key={idx}
                            href={citation.url || `#${citation.source}`}
                            target={citation.url ? '_blank' : undefined}
                            rel={citation.url ? 'noopener noreferrer' : undefined}
                            className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300 transition-colors"
                            title={citation.title || citation.source.split('/').pop()}
                          >
                            {citation.title || citation.source.split('/').pop()}
                            {citation.type && (
                              <span className="ml-1 text-gray-500">({citation.type})</span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Performance Metrics */}
                  {message.role === 'agent' && message.performanceMetrics && (
                    <div className="mt-2 text-xs text-gray-500">
                      Response time: {message.performanceMetrics.responseTime.toFixed(0)}ms
                      {message.confidence !== undefined && (
                        <span className="ml-2">
                          • Confidence: {(message.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Follow-up Suggestions */}
                  {message.role === 'agent' && message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Follow-up questions:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.followUpSuggestions.slice(0, 3).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => onSuggestionClick(suggestion)}
                            className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
