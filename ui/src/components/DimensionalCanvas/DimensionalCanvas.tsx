import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStatus } from '@/hooks/useUnifiedState';
import { useDimensionChange } from '@/hooks/useCrossComponent';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import * as d3 from 'd3';

interface DimensionNode {
  id: string;
  level: number;
  name: string;
  x: number;
  y: number;
  color: string;
  currentState: string;
  churchEncoding: string;
}

interface DimensionLink {
  source: string;
  target: string;
  type: 'vertical' | 'horizontal';
}

const DimensionalCanvas: React.FC = () => {
  const status = useStatus();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<DimensionNode | null>(null);
  const [dimensions, setDimensions] = useState<DimensionNode[]>([]);
  const [links, setLinks] = useState<DimensionLink[]>([]);
  const [currentDimension, setCurrentDimension] = useState(status.currentDimension);

  // Subscribe to dimension changes via event bus
  useDimensionChange((dimension) => {
    setCurrentDimension(dimension);
  });

  // Dimension configuration
  const dimensionConfig = [
    { level: 0, name: 'Identity', encoding: 'λx.x', color: '#6366f1' },
    { level: 1, name: 'Successor', encoding: 'λn.λf.λx.f(nfx)', color: '#8b5cf6' },
    { level: 2, name: 'Pair', encoding: 'λx.λy.λf.fxy', color: '#ec4899' },
    { level: 3, name: 'Addition', encoding: 'λm.λn.λf.λx.mf(nfx)', color: '#f43f5e' },
    { level: 4, name: 'Network', encoding: 'localhost:8080', color: '#f97316' },
    { level: 5, name: 'Consensus', encoding: 'blockchain', color: '#eab308' },
    { level: 6, name: 'Intelligence', encoding: 'neural_network', color: '#22c55e' },
    { level: 7, name: 'Quantum', encoding: '|ψ⟩ = α|0⟩ + β|1⟩', color: '#06b6d4' },
  ];

  // Initialize dimensions and links
  useEffect(() => {
    const nodes: DimensionNode[] = dimensionConfig.map((config, index) => ({
      id: `${config.level}D`,
      level: config.level,
      name: config.name,
      x: 100 + (index % 4) * 150,
      y: 100 + Math.floor(index / 4) * 150,
      color: config.color,
      currentState: config.name.toLowerCase(),
      churchEncoding: config.encoding,
    }));

    const verticalLinks: DimensionLink[] = nodes.slice(0, -1).map((node, index) => ({
      source: node.id,
      target: nodes[index + 1].id,
      type: 'vertical' as const,
    }));

    const horizontalLinks: DimensionLink[] = nodes.map(node => ({
      source: node.id,
      target: `${node.id}-transition`,
      type: 'horizontal' as const,
    }));

    setDimensions(nodes);
    setLinks([...verticalLinks, ...horizontalLinks]);
  }, []);

  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current || dimensions.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Draw links
    const linkSelection = container.selectAll('.link')
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'link');

    // Vertical links (dimensional progression)
    linkSelection.filter(d => d.type === 'vertical')
      .append('line')
      .attr('x1', d => {
        const source = dimensions.find(n => n.id === d.source);
        return source ? source.x + 40 : 0;
      })
      .attr('y1', d => {
        const source = dimensions.find(n => n.id === d.source);
        return source ? source.y + 40 : 0;
      })
      .attr('x2', d => {
        const target = dimensions.find(n => n.id === d.target);
        return target ? target.x + 40 : 0;
      })
      .attr('y2', d => {
        const target = dimensions.find(n => n.id === d.target);
        return target ? target.y + 40 : 0;
      })
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('class', 'self-reference-line');

    // Draw nodes
    const nodeSelection = container.selectAll('.node')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('class', 'node dimension-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => setSelectedNode(d));

    // Node circles
    nodeSelection.append('circle')
      .attr('r', 35)
      .attr('fill', d => d.color)
      .attr('stroke', d => d.level === currentDimension ? '#ffffff' : 'transparent')
      .attr('stroke-width', d => d.level === currentDimension ? 3 : 0)
      .attr('class', d => d.level === currentDimension ? 'animate-glow' : '');

    // Node labels
    nodeSelection.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => `${d.level}D`);

    nodeSelection.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 10)
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text(d => d.name);

    // Highlight current dimension
    nodeSelection
      .filter(d => d.level === currentDimension)
      .select('circle')
      .attr('r', 40)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3);

  }, [dimensions, links, currentDimension]);

  return (
    <Card title="Dimensional Topology" data-testid="dimensional-canvas">
      
      <div className="relative">
        <svg
          ref={svgRef}
          width="800"
          height="400"
          className="w-full h-full border border-gray-700 rounded-lg bg-gray-900"
          viewBox="0 0 800 400"
          data-testid="dimensional-canvas-svg"
        />
      </div>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 right-4 w-80 p-4 bg-gray-700 rounded-lg shadow-xl border border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-white">
                {selectedNode.level}D: {selectedNode.name}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-400">Church Encoding</div>
                <div className="text-white font-mono text-sm bg-gray-800 p-2 rounded">
                  {selectedNode.churchEncoding}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Current State</div>
                <div className="text-white capitalize">{selectedNode.currentState}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Status</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  ></div>
                  <span className="text-white">
                    {selectedNode.level === currentDimension ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white"></div>
          <span className="text-gray-400">Current Dimension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0 border-t-2 border-dashed border-gray-500"></div>
          <span className="text-gray-400">Dimensional Progression</span>
        </div>
      </div>
    </Card>
  );
};

export default DimensionalCanvas;