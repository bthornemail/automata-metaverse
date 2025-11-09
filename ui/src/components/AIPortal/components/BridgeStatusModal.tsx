/**
 * Bridge Status Modal Component
 * 
 * Displays status of all system bridges (NLP, Metaverse, WebLLM, TinyML)
 */

import React from 'react';
import { Modal } from '@/components/shared/Modal';

interface BridgeStatus {
  nlp: boolean;
  metaverse: boolean;
  webllm: boolean;
  tinyml: boolean;
}

interface LLMProviderConfig {
  provider: 'webllm' | 'ollama' | 'openai' | 'opencode';
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  ollamaUrl?: string;
  openaiApiKey?: string;
  opencodeEndpoint?: string;
}

interface BridgeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bridgeStatus: BridgeStatus;
  llmProviderConfig: LLMProviderConfig;
}

export const BridgeStatusModal: React.FC<BridgeStatusModalProps> = ({
  isOpen,
  onClose,
  bridgeStatus,
  llmProviderConfig,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bridge Status & Integration"
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-white font-medium mb-3">System Bridges</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${bridgeStatus.nlp ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <div>
                  <div className="text-white font-medium">Human NLP</div>
                  <div className="text-xs text-gray-400">Natural language processing for human input</div>
                </div>
              </div>
              <span className={`text-xs ${bridgeStatus.nlp ? 'text-green-400' : 'text-gray-500'}`}>
                {bridgeStatus.nlp ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${bridgeStatus.metaverse ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <div>
                  <div className="text-white font-medium">Automaton Metaverse</div>
                  <div className="text-xs text-gray-400">0D-7D dimensional topology state</div>
                </div>
              </div>
              <span className={`text-xs ${bridgeStatus.metaverse ? 'text-green-400' : 'text-gray-500'}`}>
                {bridgeStatus.metaverse ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${bridgeStatus.webllm ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <div>
                  <div className="text-white font-medium">LLM Provider ({llmProviderConfig.provider.toUpperCase()})</div>
                  <div className="text-xs text-gray-400">
                    {llmProviderConfig.provider === 'webllm' && 'Browser-based LLM for AI evolution'}
                    {llmProviderConfig.provider === 'ollama' && 'Local Ollama server'}
                    {llmProviderConfig.provider === 'openai' && 'OpenAI API'}
                    {llmProviderConfig.provider === 'opencode' && 'OpenCode SDK'}
                  </div>
                </div>
              </div>
              <span className={`text-xs ${bridgeStatus.webllm ? 'text-green-400' : 'text-gray-500'}`}>
                {bridgeStatus.webllm ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${bridgeStatus.tinyml ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <div>
                  <div className="text-white font-medium">TinyML</div>
                  <div className="text-xs text-gray-400">Edge AI pattern recognition</div>
                </div>
              </div>
              <span className={`text-xs ${bridgeStatus.tinyml ? 'text-green-400' : 'text-gray-500'}`}>
                {bridgeStatus.tinyml ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
