/**
 * Chat Panel Component
 * 
 * Handles chat messaging (broadcast, direct, agent interactions)
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, X } from 'lucide-react';
import { chatService, ChatMessage as ChatServiceMessage, ChatParticipant } from '@/services/chat-service';
import { agentCommunicationService } from '@/services/agent-communication-service';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  onClose?: () => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, className = '' }) => {
  const [chatMode, setChatMode] = useState<'broadcast' | 'direct'>('broadcast');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [chatParticipants, setChatParticipants] = useState<ChatParticipant[]>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [inputMessage, setInputMessage] = useState('');

  // Helper function to convert ChatServiceMessage to ChatMessage
  const convertToChatMessage = (msg: ChatServiceMessage): ChatMessage => {
    return {
      role: msg.type === 'agent' ? 'agent' : 'user',
      content: msg.content,
      timestamp: msg.timestamp,
      citations: msg.metadata?.citations,
      confidence: msg.metadata?.confidence,
    };
  };

  useEffect(() => {
    // Initialize chat participants
    const participants = chatService.getParticipants();
    setChatParticipants(participants);
    
    // Initialize messages - convert from ChatServiceMessage to ChatMessage
    const serviceMessages = chatService.getBroadcastMessages();
    setBroadcastMessages(serviceMessages.map(convertToChatMessage));
    
    const allDirectMessages = new Map<string, ChatMessage[]>();
    participants.forEach(participant => {
      const messages = chatService.getDirectMessages(participant.id);
      if (messages.length > 0) {
        const conversationId = `${chatService.getCurrentUserId()}-${participant.id}`;
        allDirectMessages.set(conversationId, messages.map(convertToChatMessage));
      }
    });
    setDirectMessages(allDirectMessages);

    // Subscribe to participant changes
    const unsubscribeParticipants = chatService.onParticipantsChange((participants) => {
      setChatParticipants(participants);
    });
    
    // Subscribe to broadcast messages
    const unsubscribeBroadcast = chatService.onMessage('broadcast', null, (message) => {
      const serviceMessages = chatService.getBroadcastMessages();
      setBroadcastMessages(serviceMessages.map(convertToChatMessage));
    });
    
    // Subscribe to direct messages
    const unsubscribeDirect = chatService.onMessage('direct', null, (message) => {
      const conversationId = message.to === chatService.getCurrentUserId()
        ? `${message.from}-${chatService.getCurrentUserId()}`
        : `${chatService.getCurrentUserId()}-${message.to}`;
      
      setDirectMessages(prev => {
        const newMap = new Map(prev);
        const messages = newMap.get(conversationId) || [];
        newMap.set(conversationId, [...messages, convertToChatMessage(message)]);
        return newMap;
      });
    });

    // Subscribe to agent communication messages
    const currentUserId = chatService.getCurrentUserId();
    let unsubscribeAgentComm: (() => void) | null = null;
    if (currentUserId) {
      unsubscribeAgentComm = agentCommunicationService.onMessage(currentUserId, (message) => {
        // Convert agent communication message to chat message
        const chatMsg: ChatMessage = {
          role: message.from === currentUserId ? 'user' : 'agent',
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
          timestamp: message.timestamp
        };
        
        if (message.to === 'broadcast') {
          // Add to broadcast messages
          setBroadcastMessages(prev => [...prev, chatMsg]);
        } else {
          // Add to direct messages
          const conversationId = message.from === currentUserId
            ? `${currentUserId}-${message.to}`
            : `${message.from}-${currentUserId}`;
          
          setDirectMessages(prev => {
            const newMap = new Map(prev);
            const messages = newMap.get(conversationId) || [];
            newMap.set(conversationId, [...messages, chatMsg]);
            return newMap;
          });
        }
      });
    }

    return () => {
      unsubscribeParticipants();
      unsubscribeBroadcast();
      unsubscribeDirect();
      if (unsubscribeAgentComm) {
        unsubscribeAgentComm();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (chatMode === 'broadcast') {
      // Send via chat service
      chatService.sendBroadcast(inputMessage);
      
      // Also send via agent communication service if we have a current user ID
      const currentUserId = chatService.getCurrentUserId();
      if (currentUserId) {
        try {
          await agentCommunicationService.broadcastMessage(currentUserId, inputMessage);
        } catch (error) {
          console.warn('[ChatPanel] Failed to broadcast via agent communication:', error);
        }
      }
    } else if (chatMode === 'direct' && selectedParticipant) {
      // Send via chat service
      chatService.sendDirectMessage(selectedParticipant, inputMessage);
      
      // Also send via agent communication service
      const currentUserId = chatService.getCurrentUserId();
      if (currentUserId) {
        try {
          await agentCommunicationService.sendMessage(currentUserId, selectedParticipant, inputMessage);
        } catch (error) {
          console.warn('[ChatPanel] Failed to send direct message via agent communication:', error);
        }
      }
    }

    setInputMessage('');
  };

  const handleParticipantClick = (participantId: string) => {
    setSelectedParticipant(participantId);
    setChatMode('direct');
  };

  const getCurrentMessages = (): ChatMessage[] => {
    if (chatMode === 'broadcast') {
      return broadcastMessages;
    } else if (chatMode === 'direct' && selectedParticipant) {
      const conversationId = `${chatService.getCurrentUserId()}-${selectedParticipant}`;
      return directMessages.get(conversationId) || [];
    }
    return [];
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Chat
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close chat panel"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Chat Mode Toggle */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Chat mode selection">
        <button
          onClick={() => setChatMode('broadcast')}
          role="tab"
          aria-selected={chatMode === 'broadcast'}
          aria-controls="chat-panel-content"
          className={`px-4 py-2 rounded ${
            chatMode === 'broadcast'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Broadcast
        </button>
        <button
          onClick={() => setChatMode('direct')}
          role="tab"
          aria-selected={chatMode === 'direct'}
          aria-controls="chat-panel-content"
          className={`px-4 py-2 rounded ${
            chatMode === 'direct'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Direct
        </button>
      </div>

      {/* Participant List (for Direct mode) */}
      {chatMode === 'direct' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Participants</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {chatParticipants.map((participant) => (
              <button
                key={participant.id}
                onClick={() => handleParticipantClick(participant.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedParticipant === participant.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${participant.online ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span>{participant.name}</span>
                  {participant.type === 'agent' && (
                    <span className="text-xs text-gray-400">(Agent)</span>
                  )}
                  {participant.dimension && (
                    <span className="text-xs text-gray-500">{participant.dimension}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        id="chat-panel-content"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="h-64 overflow-y-auto mb-4 space-y-2"
      >
        {getCurrentMessages().map((message, index) => (
          <div
            key={index}
            role="article"
            aria-label={`${message.role === 'user' ? 'User' : 'Agent'} message`}
            className={`p-2 rounded ${
              message.role === 'user'
                ? 'bg-blue-600/20 ml-auto max-w-[80%]'
                : 'bg-gray-800 mr-auto max-w-[80%]'
            }`}
          >
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {message.content}
            </div>
            {message.citations && message.citations.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="text-gray-400 mb-1">Sources:</div>
                {message.citations.map((citation, i: number) => (
                  <a
                    key={i}
                    href={citation.url || '#'}
                    className="text-blue-400 hover:underline block"
                  >
                    {citation.title || citation.source} ({citation.type || 'unknown'})
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          {chatMode === 'broadcast'
            ? 'Type a message to broadcast'
            : selectedParticipant
            ? `Message ${chatParticipants.find((p) => p.id === selectedParticipant)?.name}`
            : 'Select a participant to message'}
        </label>
        <input
          id="chat-input"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={
            chatMode === 'broadcast'
              ? 'Type a message to broadcast...'
              : selectedParticipant
              ? `Message ${chatParticipants.find((p) => p.id === selectedParticipant)?.name}...`
              : 'Select a participant to message...'
          }
          aria-label={
            chatMode === 'broadcast'
              ? 'Type a message to broadcast'
              : selectedParticipant
              ? `Message ${chatParticipants.find((p) => p.id === selectedParticipant)?.name}`
              : 'Select a participant to message'
          }
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={chatMode === 'direct' && !selectedParticipant}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || (chatMode === 'direct' && !selectedParticipant)}
          aria-label="Send message"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
