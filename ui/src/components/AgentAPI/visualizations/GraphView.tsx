/**
 * Graph View Component
 * 
 * Displays agent relationships and network graphs using react-force-graph
 */

import React, { useRef, useEffect } from 'react';
// @ts-ignore - react-force-graph-2d may not have types
import ForceGraph2D from 'react-force-graph-2d';

export interface GraphNode {
  id: string;
  name: string;
  group?: number;
  dimension?: string;
  status?: string;
  [key: string]: any;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
  value?: number;
  [key: string]: any;
}

interface GraphViewProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const graphRef = useRef<any>(null);

  if (!nodes || nodes.length === 0) {
    return <div className="graph-empty">No graph data to display</div>;
  }

  // Color nodes by dimension or status
  const getNodeColor = (node: GraphNode): string => {
    if (node.status) {
      switch (node.status) {
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
    }

    if (node.dimension) {
      const dimensionColors: Record<string, string> = {
        '0D': '#e3f2fd',
        '1D': '#bbdefb',
        '2D': '#90caf9',
        '3D': '#64b5f6',
        '4D': '#42a5f5',
        '5D': '#2196f3',
        '6D': '#1e88e5',
        '7D': '#1976d2'
      };
      return dimensionColors[node.dimension] || '#8884d8';
    }

    return '#8884d8';
  };

  return (
    <div className="graph-view-container">
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        width={width}
        height={height}
        nodeLabel={(node: GraphNode) => `${node.name}${node.dimension ? ` (${node.dimension})` : ''}`}
        nodeColor={(node: GraphNode) => getNodeColor(node)}
        nodeVal={(node: GraphNode) => node.value || 10}
        linkLabel={(link: GraphLink) => link.type || ''}
        linkColor={() => '#999'}
        linkWidth={(link: GraphLink) => link.value || 1}
        onNodeClick={(node: GraphNode) => {
          if (onNodeClick) {
            onNodeClick(node);
          }
        }}
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400);
          }
        }}
      />
    </div>
  );
};
