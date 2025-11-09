/**
 * Agent API Modal Component
 * 
 * Modal for Agent API interface with list, execution, status dashboard, and coordinator
 */

import React from 'react';
import { Modal } from '@/components/shared/Modal';
import { AgentList, AgentExecution, StatusDashboard, MultiAgentCoordinator } from '../../AgentAPI';

interface AgentAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentAPIModal: React.FC<AgentAPIModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent API"
      size="xl"
    >
      <div className="space-y-6">
        <AgentList />
        <AgentExecution />
        <StatusDashboard />
        <MultiAgentCoordinator />
      </div>
    </Modal>
  );
};
