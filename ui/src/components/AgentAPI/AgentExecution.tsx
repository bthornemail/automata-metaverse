/**
 * AgentExecution Component
 * 
 * Allows users to execute operations on agents.
 */

import React, { useState } from 'react';
import { useAgentAPI } from '../../hooks/useAgentAPI';
import { AgentRequest, AgentResponse } from '../../services/agent-api/types';
import './AgentExecution.css';

export const AgentExecution: React.FC = () => {
  const { agents, loading, executeOperation } = useAgentAPI();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [operation, setOperation] = useState<string>('');
  const [parameters, setParameters] = useState<string>('{}');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleExecute = async () => {
    if (!selectedAgentId || !operation) {
      setError(new Error('Please select an agent and enter an operation'));
      return;
    }

    let parsedParams: Record<string, any> = {};
    try {
      parsedParams = JSON.parse(parameters);
    } catch (err) {
      setError(new Error('Invalid JSON in parameters'));
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const request: AgentRequest = {
        agentId: selectedAgentId,
        operation,
        parameters: parsedParams
      };

      const response = await executeOperation(request);
      setResult(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Execution failed');
      setError(error);
    } finally {
      setExecuting(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setOperation('');
    setParameters('{}');
  };

  return (
    <div className="agent-execution-container">
      <h2>Execute Agent Operation</h2>

      <div className="execution-form">
        <div className="form-group">
          <label htmlFor="agent-select">Select Agent:</label>
          <select
            id="agent-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={loading || executing}
          >
            <option value="">-- Select Agent --</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.dimension || 'N/A'})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="operation-input">Operation:</label>
          <input
            id="operation-input"
            type="text"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            placeholder="e.g., query, analyze, execute"
            disabled={executing}
          />
        </div>

        <div className="form-group">
          <label htmlFor="parameters-input">Parameters (JSON):</label>
          <textarea
            id="parameters-input"
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
            placeholder='{"query": "SELECT * WHERE { ?s ?p ?o }"}'
            rows={5}
            disabled={executing}
          />
        </div>

        <div className="form-actions">
          <button
            onClick={handleExecute}
            disabled={!selectedAgentId || !operation || executing || loading}
          >
            {executing ? 'Executing...' : 'Execute'}
          </button>
          <button onClick={handleClear} disabled={executing}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="execution-error">
          <h3>Error</h3>
          <p>{error.message}</p>
        </div>
      )}

      {result && (
        <div className="execution-result">
          <h3>Result</h3>
          <ResultViewer result={result} format="json" />
        </div>
      )}
    </div>
  );
};
