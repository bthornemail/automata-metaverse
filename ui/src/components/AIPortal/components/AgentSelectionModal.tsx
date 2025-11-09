/**
 * Agent Selection Modal Component
 * 
 * Modal for selecting an agent to interact with
 */

import React from 'react';
import { Modal } from '@/components/shared/Modal';

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAgents: string[];
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
  getAgentDescription: (agent: string) => string;
}

export const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({
  isOpen,
  onClose,
  availableAgents,
  activeAgent,
  onSelectAgent,
  getAgentDescription,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Agent"
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableAgents.map((agent) => (
          <button
            key={agent}
            onClick={() => {
              onSelectAgent(agent);
              onClose();
            }}
            className={`p-4 rounded-lg text-left transition-all ${
              activeAgent === agent
                ? 'bg-[#6366f1] text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="font-medium mb-1">{agent.replace('-', ' ')}</div>
            <div className="text-xs opacity-75">{getAgentDescription(agent)}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
};
