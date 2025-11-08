import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Lightbulb, MessageSquare, Settings } from 'lucide-react';
import { AgentChat } from '@/types';
import { apiService } from '@/services/api';

const AgentInterface: React.FC = () => {
  const [chat, setChat] = useState<AgentChat>({
    messages: [],
    availableAgents: [
      'automaton-interface',
      'automaton-control',
      'automaton-analyzer',
      'dimensional-guide',
      'church-encoding-expert',
      'automaton-visualizer'
    ],
    activeAgent: 'automaton-interface',
    suggestions: [
      'Start the automaton with 2 second intervals',
      'Analyze the self-modification patterns',
      'Show me the current dimensional state',
      'Explain 6D intelligence systems',
      'Create a visualization of the topology'
    ]
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const loadAvailableAgents = async () => {
    try {
      const response = await apiService.getAvailableAgents();
      if (response.success && response.data) {
        setChat(prev => ({ ...prev, availableAgents: response.data }));
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  useEffect(() => {
    loadAvailableAgents();
  }, []);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: Date.now()
    };

    setChat(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInputMessage('');
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      const response = await apiService.sendAgentMessage(chat.activeAgent, message);
      
      const agentMessage = {
        role: 'agent' as const,
        content: response.success && response.data 
          ? response.data 
          : response.error || 'Sorry, I encountered an error.',
        timestamp: Date.now()
      };

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, agentMessage]
      }));

    } catch (error) {
      const errorMessage = {
        role: 'agent' as const,
        content: 'Sorry, I encountered a network error. Please try again.',
        timestamp: Date.now()
      };

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const getAgentDescription = (agent: string): string => {
    const descriptions: Record<string, string> = {
      'automaton-interface': 'Main coordinator for all automaton operations',
      'automaton-control': 'Direct control and execution commands',
      'automaton-analyzer': 'Pattern analysis and behavioral insights',
      'dimensional-guide': '0D-7D dimensional progression expertise',
      'church-encoding-expert': 'Lambda calculus and Church encoding explanations',
      'automaton-visualizer': 'Visual representations and diagrams'
    };
    return descriptions[agent] || 'Specialized automaton agent';
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-xl h-full flex flex-col" data-testid="agent-interface">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          Agent Interface
        </h3>
        
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Agent Selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Active Agent</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {chat.availableAgents.map((agent) => (
            <button
              key={agent}
              onClick={() => setChat(prev => ({ ...prev, activeAgent: agent }))}
              className={`p-2 rounded-lg text-xs transition-all duration-200 ${
                chat.activeAgent === agent
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{agent.replace('-', ' ')}</div>
              <div className="opacity-75 text-xs">
                {getAgentDescription(agent).substring(0, 30)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-900 rounded-lg p-4 mb-4 overflow-y-auto min-h-0">
        {chat.messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="mb-4">Start a conversation with {chat.activeAgent.replace('-', ' ')}</div>
            <div className="text-sm">{getAgentDescription(chat.activeAgent)}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {chat.messages.map((message, index) => (
                <motion.div
                  key={`${message.timestamp}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'agent' && (
                    <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-md ${
                    message.role === 'user' ? 'order-1' : ''
                  }`}>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 order-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
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
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && chat.messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
            <Lightbulb className="w-4 h-4" />
            Suggested questions:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {chat.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left text-sm text-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${chat.activeAgent.replace('-', ' ')}...`}
          disabled={isTyping}
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#6366f1] disabled:opacity-50"
        />
        
        <button
          onClick={() => sendMessage(inputMessage)}
          disabled={!inputMessage.trim() || isTyping}
          className="control-button bg-[#6366f1] hover:bg-[#8b5cf6] text-white"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Status Bar */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span>{isTyping ? 'Agent is typing...' : 'Ready'}</span>
        </div>
        
        <div>
          {chat.messages.length} messages
        </div>
      </div>
    </div>
  );
};

export default AgentInterface;