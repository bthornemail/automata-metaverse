/**
 * Chat Panel Component
 * 
 * Handles chat messaging (broadcast, direct, agent interactions)
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, X } from 'lucide-react';
import { ChatMessage, ChatParticipant } from '@/types';
import { chatService } from '@/services/chat-service';

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

  useEffect(() => {
    // Initialize chat participants
    const participants = chatService.getParticipants();
    setChatParticipants(participants);

    // Subscribe to chat events
    const unsubscribe = chatService.subscribe((event) => {
      if (event.type === 'participant-joined') {
        setChatParticipants(chatService.getParticipants());
      } else if (event.type === 'participant-left') {
        setChatParticipants(chatService.getParticipants());
      } else if (event.type === 'broadcast') {
        setBroadcastMessages(chatService.getBroadcastMessages());
      } else if (event.type === 'direct') {
        setDirectMessages(chatService.getDirectMessages());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (chatMode === 'broadcast') {
      chatService.sendBroadcast({
        role: 'user',
        content: inputMessage,
        timestamp: Date.now(),
      });
    } else if (chatMode === 'direct' && selectedParticipant) {
      chatService.sendDirectMessage(selectedParticipant, {
        role: 'user',
        content: inputMessage,
        timestamp: Date.now(),
      });
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
      return directMessages.get(selectedParticipant) || [];
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
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setChatMode('broadcast')}
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
                key={participant.userId}
                onClick={() => handleParticipantClick(participant.userId)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedParticipant === participant.userId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{participant.userName}</span>
                  {participant.type === 'agent' && (
                    <span className="text-xs text-gray-400">(Agent)</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {getCurrentMessages().map((message, index) => (
          <div
            key={index}
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
                {message.citations.map((citation, i) => (
                  <a
                    key={i}
                    href={citation.url || '#'}
                    className="text-blue-400 hover:underline block"
                  >
                    {citation.title || citation.source} ({citation.type})
                  </a>
                ))}
              </div>
            )}
            {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {message.followUpSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-gray-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={
            chatMode === 'broadcast'
              ? 'Type a message to broadcast...'
              : selectedParticipant
              ? `Message ${chatParticipants.find((p) => p.userId === selectedParticipant)?.userName}...`
              : 'Select a participant to message...'
          }
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={chatMode === 'direct' && !selectedParticipant}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || (chatMode === 'direct' && !selectedParticipant)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
};
