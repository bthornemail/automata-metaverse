/**
 * AgentList Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AgentList } from '../AgentList';
import { useAgentAPI } from '../../../hooks/useAgentAPI';

// Mock the hook
vi.mock('../../../hooks/useAgentAPI');

describe('AgentList', () => {
  const mockUseAgentAPI = useAgentAPI as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseAgentAPI.mockReturnValue({
      agents: [
        {
          id: '0D-Topology-Agent',
          name: '0D Topology Agent',
          dimension: '0D',
          status: 'active',
          capabilities: ['topology']
        }
      ],
      loading: false,
      error: null,
      healthStatus: true,
      loadAgents: vi.fn(),
      getAgent: vi.fn(),
      executeOperation: vi.fn(),
      checkHealth: vi.fn(),
      refresh: vi.fn()
    });
  });

  test('renders agent list', async () => {
    render(<AgentList />);
    
    await waitFor(() => {
      expect(screen.getByText('0D Topology Agent')).toBeInTheDocument();
    });
  });

  test('shows loading state', () => {
    mockUseAgentAPI.mockReturnValue({
      agents: [],
      loading: true,
      error: null,
      healthStatus: null,
      loadAgents: vi.fn(),
      getAgent: vi.fn(),
      executeOperation: vi.fn(),
      checkHealth: vi.fn(),
      refresh: vi.fn()
    });

    render(<AgentList />);
    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    mockUseAgentAPI.mockReturnValue({
      agents: [],
      loading: false,
      error: new Error('Failed to load'),
      healthStatus: null,
      loadAgents: vi.fn(),
      getAgent: vi.fn(),
      executeOperation: vi.fn(),
      checkHealth: vi.fn(),
      refresh: vi.fn()
    });

    render(<AgentList />);
    expect(screen.getByText(/Error loading agents/)).toBeInTheDocument();
  });
});
