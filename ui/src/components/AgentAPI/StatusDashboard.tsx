/**
 * Status Dashboard Component
 * 
 * Real-time agent status monitoring dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useAgentAPI } from '../../hooks/useAgentAPI';
import { StatusUpdate } from '../../services/agent-api/status-service';
import './StatusDashboard.css';

export const StatusDashboard: React.FC = () => {
  const { agents } = useAgentAPI();
  const { statuses, history, isMonitoring, startMonitoring, stopMonitoring } = useAgentStatus(5000);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (agents.length > 0 && !isMonitoring) {
      startMonitoring(agents.map(a => a.id));
    }
  }, [agents, isMonitoring, startMonitoring]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'busy':
        return '#ff9800';
      case 'inactive':
        return '#9e9e9e';
      case 'error':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const selectedHistory = selectedAgent ? history.get(selectedAgent) || [] : [];

  return (
    <div className="status-dashboard-container">
      <div className="dashboard-header">
        <h2>Agent Status Dashboard</h2>
        <div className="dashboard-controls">
          <button
            onClick={() => isMonitoring ? stopMonitoring() : startMonitoring(agents.map(a => a.id))}
            className={`monitor-button ${isMonitoring ? 'active' : ''}`}
          >
            {isMonitoring ? '● Monitoring' : '○ Start Monitoring'}
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="agents-grid">
          {agents.map(agent => {
            const status = statuses.get(agent.id);
            const currentStatus = status?.status || agent.status;

            return (
              <div
                key={agent.id}
                className={`agent-status-card ${selectedAgent === agent.id ? 'selected' : ''}`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className="agent-status-header">
                  <h3>{agent.name}</h3>
                  <div
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(currentStatus) }}
                  >
                    {currentStatus}
                  </div>
                </div>
                {agent.dimension && (
                  <div className="agent-dimension">Dimension: {agent.dimension}</div>
                )}
                {status && (
                  <div className="status-timestamp">
                    Updated: {new Date(status.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedAgent && (
          <div className="status-history-panel">
            <h3>Status History: {agents.find(a => a.id === selectedAgent)?.name}</h3>
            <div className="history-timeline">
              {selectedHistory.length === 0 ? (
                <div className="no-history">No status history available</div>
              ) : (
                selectedHistory.map((update, index) => (
                  <div key={index} className="history-item">
                    <div
                      className="history-status"
                      style={{ backgroundColor: getStatusColor(update.status) }}
                    >
                      {update.status}
                    </div>
                    <div className="history-time">
                      {new Date(update.timestamp).toLocaleString()}
                    </div>
                    {update.message && (
                      <div className="history-message">{update.message}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
