/**
 * AgentList Component
 * 
 * Displays a list of available agents with their status and capabilities.
 */

import React, { useState } from 'react';
import { useAgentAPI } from '../../hooks/useAgentAPI';
import { Agent } from '../../services/agent-api/types';
import './AgentList.css';

export const AgentList: React.FC = () => {
  const { agents, loading, error, healthStatus, refresh } = useAgentAPI();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filterDimension, setFilterDimension] = useState<string>('all');

  if (loading && agents.length === 0) {
    return (
      <div className="agent-list-container">
        <div className="loading">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-list-container">
        <div className="error">
          <p>Error loading agents: {error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  const filteredAgents = filterDimension === 'all'
    ? agents
    : agents.filter(agent => agent.dimension === filterDimension);

  const dimensions = Array.from(new Set(agents.map(a => a.dimension).filter(Boolean)));

  return (
    <div className="agent-list-container">
      <div className="agent-list-header">
        <h2>Available Agents</h2>
        <div className="header-controls">
          <div className="health-status">
            {healthStatus === true && <span className="status-indicator healthy">●</span>}
            {healthStatus === false && <span className="status-indicator unhealthy">●</span>}
            {healthStatus === null && <span className="status-indicator unknown">●</span>}
            <span className="health-label">
              {healthStatus === true ? 'Healthy' : healthStatus === false ? 'Unhealthy' : 'Checking...'}
            </span>
          </div>
          <button onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {dimensions.length > 0 && (
        <div className="filter-controls">
          <label>
            Filter by Dimension:
            <select
              value={filterDimension}
              onChange={(e) => setFilterDimension(e.target.value)}
            >
              <option value="all">All Dimensions</option>
              {dimensions.map(dim => (
                <option key={dim} value={dim}>{dim}</option>
              ))}
              <option value="null">No Dimension</option>
            </select>
          </label>
        </div>
      )}

      <div className="agent-list">
        {filteredAgents.length === 0 ? (
          <div className="no-agents">No agents found</div>
        ) : (
          filteredAgents.map(agent => (
            <div
              key={agent.id}
              className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="agent-header">
                <h3>{agent.name}</h3>
                <span className={`status-badge status-${agent.status}`}>
                  {agent.status}
                </span>
              </div>
              {agent.dimension && (
                <div className="agent-dimension">
                  Dimension: <strong>{agent.dimension}</strong>
                </div>
              )}
              {agent.description && (
                <p className="agent-description">{agent.description}</p>
              )}
              <div className="agent-capabilities">
                <strong>Capabilities:</strong>
                <div className="capability-tags">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="capability-tag">{cap}</span>
                  ))}
                </div>
              </div>
              {agent.dependencies && agent.dependencies.length > 0 && (
                <div className="agent-dependencies">
                  <strong>Dependencies:</strong>
                  <div className="dependency-list">
                    {agent.dependencies.map(dep => (
                      <span key={dep} className="dependency-tag">{dep}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedAgent && (
        <div className="agent-details">
          <h3>Agent Details: {selectedAgent.name}</h3>
          <pre>{JSON.stringify(selectedAgent, null, 2)}</pre>
          <button onClick={() => setSelectedAgent(null)}>Close</button>
        </div>
      )}
    </div>
  );
};
