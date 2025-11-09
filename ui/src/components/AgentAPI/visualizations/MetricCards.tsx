/**
 * Metric Cards Component
 * 
 * Displays key metrics in card format
 */

import React from 'react';
import './MetricCards.css';

export interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

interface MetricCardsProps {
  metrics: Metric[];
  columns?: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, columns = 4 }) => {
  if (!metrics || metrics.length === 0) {
    return <div className="metrics-empty">No metrics available</div>;
  }

  const getTrendIcon = (trend?: string): string => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '';
    }
  };

  const getTrendColor = (trend?: string): string => {
    switch (trend) {
      case 'up':
        return '#4caf50';
      case 'down':
        return '#f44336';
      default:
        return '#666';
    }
  };

  return (
    <div 
      className="metric-cards-container"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value-container">
            <div 
              className="metric-value"
              style={{ color: metric.color || '#333' }}
            >
              {metric.value}
              {metric.unit && <span className="metric-unit">{metric.unit}</span>}
            </div>
            {metric.trend && (
              <span
                className="metric-trend"
                style={{ color: getTrendColor(metric.trend) }}
              >
                {getTrendIcon(metric.trend)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
