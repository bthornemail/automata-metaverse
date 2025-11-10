/**
 * AI Portal Header Component
 * 
 * Header with metaverse mode toggles, file selection, chat toggle, bridge status, and settings
 */

import React from 'react';
import { Brain, MessageSquare, Network, Settings, Bot as BotIcon } from 'lucide-react';

interface BridgeStatus {
  nlp: boolean;
  metaverse: boolean;
  webllm: boolean;
  tinyml: boolean;
}

interface AIPortalHeaderProps {
  selectedJSONLFile: string;
  onJSONLFileChange: (file: string) => void;
  showChatPanel: boolean;
  onToggleChatPanel: () => void;
  bridgeStatus: BridgeStatus;
  onBridgeStatusClick: () => void;
  isWebLLMLoaded: boolean;
  onAgentAPIClick: () => void;
  onSettingsClick: () => void;
}

export const AIPortalHeader: React.FC<AIPortalHeaderProps> = ({
  selectedJSONLFile,
  onJSONLFileChange,
  showChatPanel,
  onToggleChatPanel,
  bridgeStatus,
  onBridgeStatusClick,
  isWebLLMLoaded,
  onAgentAPIClick,
  onSettingsClick,
}) => {
  return (
    <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Portal</h2>
            <p className="text-xs text-gray-400">
              Unified Collaborative World - Full 3D Metaverse with Movement, Interactions, Learning & Abstract View Elements
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          
          {/* Bridge Status Indicators */}
          <button
            onClick={onBridgeStatusClick}
            aria-label={`Bridge Status: NLP ${bridgeStatus.nlp ? 'connected' : 'disconnected'}, Metaverse ${bridgeStatus.metaverse ? 'connected' : 'disconnected'}, WebLLM ${bridgeStatus.webllm ? 'connected' : 'disconnected'}, TinyML ${bridgeStatus.tinyml ? 'connected' : 'disconnected'}`}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Network className="w-4 h-4 text-gray-300" aria-hidden="true" />
            <div className="flex gap-1" role="group" aria-label="Bridge status indicators">
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`} aria-label="NLP bridge status" title="NLP"></div>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`} aria-label="Metaverse bridge status" title="Metaverse"></div>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`} aria-label="WebLLM bridge status" title="WebLLM"></div>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`} aria-label="TinyML bridge status" title="TinyML"></div>
            </div>
          </button>
          
          <div 
            className={`px-2 py-1 rounded text-xs ${
              isWebLLMLoaded ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'
            }`}
            role="status"
            aria-live="polite"
            aria-label={isWebLLMLoaded ? 'WebLLM Ready' : 'WebLLM Loading'}
          >
            {isWebLLMLoaded ? 'WebLLM Ready' : 'Loading...'}
          </div>
          
          <button
            onClick={onAgentAPIClick}
            aria-label="Agent API"
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <BotIcon className="w-4 h-4 text-gray-300" aria-hidden="true" />
          </button>
          
          <button
            onClick={onSettingsClick}
            aria-label="Settings"
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-300" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
