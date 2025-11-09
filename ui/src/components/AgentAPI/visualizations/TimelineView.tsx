/**
 * Timeline View Component
 * 
 * Displays agent execution timeline
 */

import React from 'react';
import { StatusUpdate } from '../../../services/agent-api/status-service';
import './TimelineView.css';

interface TimelineViewProps {
  updates: StatusUpdate[];
  agentId?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ updates, agentId }) => {
  if (!updates || updates.length === 0) {
    return <div className="timeline-empty">No timeline data available</div>;
  }

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
        return '#8884d8';
    }
  };

  // Sort updates by timestamp (newest first)
  const sortedUpdates = [...updates].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="timeline-view-container">
      <div className="timeline-header">
        <h3>Status Timeline{agentId ? `: ${agentId}` : ''}</h3>
      </div>
      <div className="timeline-content">
        {sortedUpdates.map((update, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-marker">
              <div
                className="timeline-dot"
                style={{ backgroundColor: getStatusColor(update.status) }}
              />
              {index < sortedUpdates.length - 1 && (
                <div className="timeline-line" />
              )}
            </div>
            <div className="timeline-content-item">
              <div className="timeline-status">
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(update.status) }}
                >
                  {update.status}
                </span>
                <span className="timeline-time">
                  {update.timestamp.toLocaleString()}
                </span>
              </div>
              {update.message && (
                <div className="timeline-message">{update.message}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
