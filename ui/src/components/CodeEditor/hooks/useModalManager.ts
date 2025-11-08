import { useState } from 'react';
import { Agent, ModalState } from '../types';

export const useModalManager = () => {
  const [modalState, setModalState] = useState<ModalState>({
    showConfig: false,
    showAgent: false,
    selectedAgent: null
  });

  const showConfigModal = () => {
    setModalState(prev => ({ ...prev, showConfig: true }));
  };

  const hideConfigModal = () => {
    setModalState(prev => ({ ...prev, showConfig: false }));
  };

  const showAgentModal = (agent: Agent) => {
    setModalState(prev => ({
      ...prev,
      showAgent: true,
      selectedAgent: agent
    }));
  };

  const hideAgentModal = () => {
    setModalState(prev => ({
      ...prev,
      showAgent: false,
      selectedAgent: null
    }));
  };

  const hideAllModals = () => {
    setModalState({
      showConfig: false,
      showAgent: false,
      selectedAgent: null
    });
  };

  return {
    modalState,
    showConfigModal,
    hideConfigModal,
    showAgentModal,
    hideAgentModal,
    hideAllModals
  };
};