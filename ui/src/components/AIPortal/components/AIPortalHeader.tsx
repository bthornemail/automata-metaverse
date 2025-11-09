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
  metaverseMode: 'abstract' | 'canvasl-3d' | 'unified';
  onMetaverseModeChange: (mode: 'abstract' | 'canvasl-3d' | 'unified') => void;
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
  metaverseMode,
  onMetaverseModeChange,
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
              3D Metaverse Portal - Bridging Human NLP ↔ Automaton Metaverse ↔ WebLLM ↔ TinyML
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Metaverse Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onMetaverseModeChange('unified')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                metaverseMode === 'unified' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Unified View (Major/Minor Modes)"
            >
              Unified
            </button>
            <button
              onClick={() => onMetaverseModeChange('abstract')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                metaverseMode === 'abstract' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Abstract Metaverse Only"
            >
              Abstract
            </button>
            <button
              onClick={() => onMetaverseModeChange('canvasl-3d')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                metaverseMode === 'canvasl-3d' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="CanvasL 3D Only"
            >
              CanvasL 3D
            </button>
          </div>
          
          {/* File Selection (for CanvasL 3D mode) */}
          {metaverseMode === 'canvasl-3d' && (
            <select
              value={selectedJSONLFile}
              onChange={(e) => onJSONLFileChange(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            >
              <option value="automaton-kernel.jsonl">automaton-kernel.jsonl</option>
              <option value="generate.metaverse.jsonl">generate.metaverse.jsonl</option>
              <option value="automaton.jsonl">automaton.jsonl</option>
              <option value="automaton.canvas.space.jsonl">automaton.canvas.space.jsonl</option>
              <option value="automaton-kernel.canvasl">automaton-kernel.canvasl</option>
              <option value="generate.metaverse.canvasl">generate.metaverse.canvasl</option>
            </select>
          )}
          
          {/* View Changes / Chat Toggle */}
          <button
            onClick={onToggleChatPanel}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title={showChatPanel ? "Hide Chat" : "View Chat"}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">{showChatPanel ? 'Hide Chat' : 'View Chat'}</span>
          </button>
          
          {/* Bridge Status Indicators */}
          <button
            onClick={onBridgeStatusClick}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Bridge Status"
          >
            <Network className="w-4 h-4 text-gray-300" />
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`} title="NLP"></div>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`} title="Metaverse"></div>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`} title="WebLLM"></div>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`} title="TinyML"></div>
            </div>
          </button>
          
          <div className={`px-2 py-1 rounded text-xs ${
            isWebLLMLoaded ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'
          }`}>
            {isWebLLMLoaded ? 'WebLLM Ready' : 'Loading...'}
          </div>
          
          <button
            onClick={onAgentAPIClick}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Agent API"
          >
            <BotIcon className="w-4 h-4 text-gray-300" />
          </button>
          
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
