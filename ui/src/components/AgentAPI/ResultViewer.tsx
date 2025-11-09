/**
 * Result Viewer Component
 * 
 * Displays agent execution results with formatting and visualization
 */

import React, { useState, useMemo } from 'react';
import { AgentResponse } from '../../services/agent-api/types';
import { ChartView } from './visualizations/ChartView';
import { GraphView, GraphNode, GraphLink } from './visualizations/GraphView';
import { TimelineView } from './visualizations/TimelineView';
import './ResultViewer.css';

interface ResultViewerProps {
  result: AgentResponse;
  format?: 'json' | 'table' | 'graph' | 'markdown' | 'chart' | 'timeline';
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ result, format = 'json' }) => {
  const [selectedFormat, setSelectedFormat] = useState(format);

  const renderJSON = () => {
    return (
      <pre className="result-json">
        {JSON.stringify(result.result, null, 2)}
      </pre>
    );
  };

  const renderTable = () => {
    if (!result.result || !Array.isArray(result.result)) {
      return <div className="result-error">Result is not in table format</div>;
    }

    const data = result.result as any[];
    if (data.length === 0) {
      return <div className="result-empty">No data to display</div>;
    }

    const keys = Object.keys(data[0]);

    return (
      <table className="result-table">
        <thead>
          <tr>
            {keys.map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {keys.map(key => (
                <td key={key}>{String(row[key] || '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderGraph = () => {
    // Try to extract graph data from result
    const graphData = useMemo(() => {
      if (!result.result) return null;

      // Check if result has nodes/links structure
      if (result.result.nodes && result.result.links) {
        return {
          nodes: result.result.nodes as GraphNode[],
          links: result.result.links as GraphLink[]
        };
      }

      // Try to build graph from array of objects with relationships
      if (Array.isArray(result.result)) {
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const nodeMap = new Map<string, GraphNode>();

        result.result.forEach((item: any, index: number) => {
          const nodeId = item.id || `node-${index}`;
          const node: GraphNode = {
            id: nodeId,
            name: item.name || item.text || nodeId,
            ...item
          };
          nodes.push(node);
          nodeMap.set(nodeId, node);

          // Extract relationships
          if (item.from || item.to) {
            links.push({
              source: item.from || nodeId,
              target: item.to || nodeId,
              type: item.type || 'related'
            });
          }
        });

        return { nodes, links };
      }

      return null;
    }, [result.result]);

    if (graphData) {
      return (
        <GraphView
          nodes={graphData.nodes}
          links={graphData.links}
          width={800}
          height={600}
        />
      );
    }

    return (
      <div className="result-graph-placeholder">
        <p>Graph data not available. Result format:</p>
        <pre className="result-json">{JSON.stringify(result.result, null, 2)}</pre>
      </div>
    );
  };

  const renderMarkdown = () => {
    // Simple markdown rendering (can be enhanced with markdown library)
    if (typeof result.result === 'string') {
      return (
        <div className="result-markdown">
          <pre>{result.result}</pre>
        </div>
      );
    }

    // Convert object to markdown-like format
    return (
      <div className="result-markdown">
        <pre>{JSON.stringify(result.result, null, 2)}</pre>
      </div>
    );
  };

  const renderChart = () => {
    if (!result.result || !Array.isArray(result.result)) {
      return <div className="result-error">Result is not in chart format (array required)</div>;
    }

    const data = result.result as any[];
    if (data.length === 0) {
      return <div className="result-empty">No data to display</div>;
    }

    // Try to detect chart type from data
    const hasNumericValues = data.some(item => typeof item.value === 'number');
    const chartType = hasNumericValues ? 'bar' : 'pie';

    return (
      <ChartView
        data={data}
        type={chartType}
        xKey="name"
        yKey="value"
        nameKey="name"
        valueKey="value"
      />
    );
  };

  const renderTimeline = () => {
    // Check if result has timeline/updates structure
    if (result.result && Array.isArray(result.result)) {
      const updates = result.result.map((item: any) => ({
        agentId: item.agentId || 'unknown',
        status: item.status || 'unknown',
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        message: item.message
      }));

      return <TimelineView updates={updates} />;
    }

    return (
      <div className="result-error">
        Timeline data not available. Expected array of status updates.
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedFormat) {
      case 'json':
        return renderJSON();
      case 'table':
        return renderTable();
      case 'graph':
        return renderGraph();
      case 'markdown':
        return renderMarkdown();
      case 'chart':
        return renderChart();
      case 'timeline':
        return renderTimeline();
      default:
        return renderJSON();
    }
  };

  return (
    <div className="result-viewer-container">
      <div className="result-viewer-header">
        <div className="result-status">
          <span className={`status-badge ${result.success ? 'success' : 'failure'}`}>
            {result.success ? '✓ Success' : '✗ Failed'}
          </span>
          {result.duration && (
            <span className="result-duration">
              Duration: {result.duration.toFixed(2)}ms
            </span>
          )}
        </div>
        <div className="format-selector">
          <label>Format:</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as any)}
          >
            <option value="json">JSON</option>
            <option value="table">Table</option>
            <option value="graph">Graph</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
      </div>

      {result.error && (
        <div className="result-error-message">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {result.success && result.result && (
        <div className="result-content">
          {renderContent()}
        </div>
      )}
    </div>
  );
};
