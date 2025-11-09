/**
 * Multi-Agent Coordinator Component
 * 
 * UI for coordinating tasks across multiple agents
 */

import React, { useState } from 'react';
import { useAgentAPI } from '../../hooks/useAgentAPI';
import { CoordinationEngine, CoordinationTask, CoordinationResult } from '../../services/agent-api/coordination-engine';
import { createAgentAPIClient } from '../../services/agent-api';
import { ResultViewer } from './ResultViewer';
import { MetricCards, Metric } from './visualizations';
import './MultiAgentCoordinator.css';

export const MultiAgentCoordinator: React.FC = () => {
  const { agents } = useAgentAPI();
  const [coordinator] = useState(() => {
    const client = createAgentAPIClient({
      baseURL: import.meta.env.VITE_AGENT_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      apiKey: import.meta.env.VITE_AGENT_API_KEY || import.meta.env.VITE_API_KEY,
      useMock: import.meta.env.VITE_USE_MOCK_AGENT_API === 'true' || false
    });
    return new CoordinationEngine(client);
  });

  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [operation, setOperation] = useState<string>('');
  const [parameters, setParameters] = useState<string>('{}');
  const [strategy, setStrategy] = useState<'parallel' | 'sequential' | 'hierarchical'>('parallel');
  const [coordinating, setCoordinating] = useState(false);
  const [result, setResult] = useState<CoordinationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleCoordinate = async () => {
    if (selectedAgents.length === 0 || !operation) {
      setError(new Error('Please select at least one agent and enter an operation'));
      return;
    }

    let parsedParams: Record<string, any> = {};
    try {
      parsedParams = JSON.parse(parameters);
    } catch (err) {
      setError(new Error('Invalid JSON in parameters'));
      return;
    }

    setCoordinating(true);
    setError(null);
    setResult(null);

    try {
      const task: CoordinationTask = {
        id: `task-${Date.now()}`,
        agents: selectedAgents,
        operation,
        parameters: parsedParams,
        strategy
      };

      const coordinationResult = await coordinator.coordinate(task);
      setResult(coordinationResult);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Coordination failed');
      setError(error);
    } finally {
      setCoordinating(false);
    }
  };

  const metrics: Metric[] = result ? [
    {
      label: 'Total Agents',
      value: result.results.size,
      color: '#2196f3'
    },
    {
      label: 'Successful',
      value: Array.from(result.results.values()).filter(r => r.success).length,
      color: '#4caf50'
    },
    {
      label: 'Failed',
      value: result.errors.size,
      color: '#f44336'
    },
    {
      label: 'Duration',
      value: result.duration.toFixed(0),
      unit: 'ms',
      color: '#ff9800'
    }
  ] : [];

  return (
    <div className="multi-agent-coordinator-container">
      <h2>Multi-Agent Coordinator</h2>

      <div className="coordinator-form">
        <div className="form-section">
          <h3>Select Agents</h3>
          <div className="agents-selection">
            {agents.map(agent => (
              <label key={agent.id} className="agent-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent.id)}
                  onChange={() => handleAgentToggle(agent.id)}
                  disabled={coordinating}
                />
                <span className="agent-checkbox-label">
                  <strong>{agent.name}</strong>
                  {agent.dimension && <span className="agent-dimension">({agent.dimension})</span>}
                </span>
              </label>
            ))}
          </div>
          {selectedAgents.length > 0 && (
            <div className="selected-agents-summary">
              {selectedAgents.length} agent(s) selected
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Operation Configuration</h3>
          <div className="form-group">
            <label htmlFor="coord-operation">Operation:</label>
            <input
              id="coord-operation"
              type="text"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              placeholder="e.g., query, analyze, execute"
              disabled={coordinating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="coord-strategy">Coordination Strategy:</label>
            <select
              id="coord-strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              disabled={coordinating}
            >
              <option value="parallel">Parallel (simultaneous)</option>
              <option value="sequential">Sequential (one by one)</option>
              <option value="hierarchical">Hierarchical (coordinator + workers)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="coord-parameters">Parameters (JSON):</label>
            <textarea
              id="coord-parameters"
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
              placeholder='{"query": "SELECT * WHERE { ?s ?p ?o }"}'
              rows={5}
              disabled={coordinating}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            onClick={handleCoordinate}
            disabled={selectedAgents.length === 0 || !operation || coordinating}
          >
            {coordinating ? 'Coordinating...' : 'Coordinate Task'}
          </button>
          <button onClick={() => {
            setResult(null);
            setError(null);
            setSelectedAgents([]);
            setOperation('');
            setParameters('{}');
          }} disabled={coordinating}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="coordinator-error">
          <h3>Error</h3>
          <p>{error.message}</p>
        </div>
      )}

      {result && (
        <div className="coordinator-results">
          <h3>Coordination Results</h3>

          <MetricCards metrics={metrics} columns={4} />

          <div className="results-summary">
            <div className="successful-results">
              <h4>Successful Executions ({Array.from(result.results.values()).filter(r => r.success).length})</h4>
              <div className="results-list">
                {Array.from(result.results.entries())
                  .filter(([_, response]) => response.success)
                  .map(([agentId, response]) => (
                    <div key={agentId} className="result-item success">
                      <div className="result-header">
                        <strong>{agentId}</strong>
                        <span className="result-duration">{response.duration?.toFixed(0)}ms</span>
                      </div>
                      <ResultViewer result={response} format="json" />
                    </div>
                  ))}
              </div>
            </div>

            {result.errors.size > 0 && (
              <div className="failed-results">
                <h4>Failed Executions ({result.errors.size})</h4>
                <div className="errors-list">
                  {Array.from(result.errors.entries()).map(([agentId, error]) => (
                    <div key={agentId} className="result-item error">
                      <strong>{agentId}</strong>: {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.mergedResult && (
              <div className="merged-result">
                <h4>Merged Result</h4>
                <ResultViewer result={{ success: true, result: result.mergedResult, agentId: 'merged', operation: 'coordinate' }} format="json" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
