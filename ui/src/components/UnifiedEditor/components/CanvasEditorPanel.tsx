/**
 * Canvas Editor Panel
 * Extracted from JSONLCanvasEditor component for use in UnifiedEditor
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, GitBranch, Network } from 'lucide-react';
import { CanvasPanelProps } from '../types';
import { JSONLNode, JSONLEdge } from '../../../services/jsonl-canvas-service';
import { jsonlCanvasService } from '../../../services/jsonl-canvas-service';

export const CanvasEditorPanel: React.FC<CanvasPanelProps> = ({
  graph,
  onGraphChange,
  filename,
  readOnly = false
}) => {
  const [selectedNode, setSelectedNode] = useState<JSONLNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<JSONLEdge | null>(null);
  const [editingNode, setEditingNode] = useState<JSONLNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<JSONLEdge | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'raw' | 'split'>('graph');
  const [rawJSONL, setRawJSONL] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update raw JSONL when graph changes
  React.useEffect(() => {
    const jsonlContent = jsonlCanvasService.exportToJSONL(graph);
    setRawJSONL(jsonlContent);
  }, [graph]);

  const handleAddNode = () => {
    if (readOnly) return;
    
    const newNode: JSONLNode = {
      id: `node-${Date.now()}`,
      type: 'text',
      x: Math.random() * 500,
      y: Math.random() * 500,
      text: 'New Node',
      width: 280,
      height: 120
    };
    
    const updatedGraph = jsonlCanvasService.addNode(graph, newNode);
    onGraphChange(updatedGraph);
    setEditingNode(newNode);
  };

  const handleAddEdge = () => {
    if (readOnly || !selectedNode) return;
    
    const newEdge: JSONLEdge = {
      id: `edge-${Date.now()}`,
      type: 'vertical',
      from: selectedNode.id,
      to: '',
      label: 'connection'
    };
    
    const updatedGraph = jsonlCanvasService.addEdge(graph, newEdge);
    onGraphChange(updatedGraph);
    setEditingEdge(newEdge);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (readOnly) return;
    
    if (confirm('Delete this node and all connected edges?')) {
      const updatedGraph = jsonlCanvasService.deleteNode(graph, nodeId);
      onGraphChange(updatedGraph);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (readOnly) return;
    
    if (confirm('Delete this edge?')) {
      const updatedGraph = jsonlCanvasService.deleteEdge(graph, edgeId);
      onGraphChange(updatedGraph);
      if (selectedEdge?.id === edgeId) {
        setSelectedEdge(null);
      }
    }
  };

  const handleUpdateNode = (updates: Partial<JSONLNode>) => {
    if (readOnly || !editingNode) return;
    
    const updatedGraph = jsonlCanvasService.updateNode(graph, editingNode.id, updates);
    onGraphChange(updatedGraph);
    setEditingNode(null);
    setSelectedNode({ ...editingNode, ...updates });
  };

  const handleUpdateEdge = (updates: Partial<JSONLEdge>) => {
    if (readOnly || !editingEdge) return;
    
    const updated = { ...editingEdge, ...updates };
    const newEdges = new Map(graph.edges);
    newEdges.set(editingEdge.id, updated);
    
    onGraphChange({
      ...graph,
      edges: newEdges,
      edgeList: Array.from(newEdges.values())
    });
    
    setEditingEdge(null);
    setSelectedEdge(updated);
  };

  const handleRawJSONLChange = (newContent: string) => {
    if (readOnly) return;
    
    setRawJSONL(newContent);
    try {
      const parsed = jsonlCanvasService.parseJSONL(newContent);
      onGraphChange(parsed);
    } catch (err) {
      // Invalid JSONL, keep raw content
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* View Mode Selector */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setViewMode('graph')}
          className={`px-3 py-1 rounded ${viewMode === 'graph' ? 'bg-blue-600' : 'bg-gray-700'} transition-colors`}
        >
          Graph
        </button>
        <button
          onClick={() => setViewMode('raw')}
          className={`px-3 py-1 rounded ${viewMode === 'raw' ? 'bg-blue-600' : 'bg-gray-700'} transition-colors`}
        >
          Raw JSONL
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={`px-3 py-1 rounded ${viewMode === 'split' ? 'bg-blue-600' : 'bg-gray-700'} transition-colors`}
        >
          Split
        </button>
        {!readOnly && (
          <>
            <div className="flex-1" />
            <button
              onClick={handleAddNode}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>
            <button
              onClick={handleAddEdge}
              disabled={!selectedNode}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Add Edge
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Graph View */}
        {(viewMode === 'graph' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-700 overflow-auto bg-gray-900`}>
            <div ref={canvasRef} className="relative p-8" style={{ minHeight: '100%' }}>
              {/* Render Nodes */}
              {graph.nodeList.map(node => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute cursor-pointer p-3 rounded-lg border-2 ${
                    selectedNode?.id === node.id
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                  style={{
                    left: node.x || 0,
                    top: node.y || 0,
                    width: node.width || 280,
                    minHeight: node.height || 120
                  }}
                  onClick={() => {
                    setSelectedNode(node);
                    setSelectedEdge(null);
                    setEditingNode(null);
                    setEditingEdge(null);
                  }}
                  onDoubleClick={() => !readOnly && setEditingNode(node)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-mono text-gray-400">{node.id}</div>
                    {!readOnly && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNode(node);
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="p-1 hover:bg-red-700 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-300 mb-1">{node.type}</div>
                  {node.text && (
                    <div className="text-sm text-white line-clamp-3">{node.text}</div>
                  )}
                </motion.div>
              ))}

              {/* Render Edges */}
              {graph.edgeList.map(edge => {
                const fromNode = graph.nodes.get(edge.from || edge.fromNode || '');
                const toNode = graph.nodes.get(edge.to || edge.toNode || '');
                
                if (!fromNode || !toNode) return null;
                
                const x1 = (fromNode.x || 0) + (fromNode.width || 280) / 2;
                const y1 = (fromNode.y || 0) + (fromNode.height || 120);
                const x2 = (toNode.x || 0) + (toNode.width || 280) / 2;
                const y2 = toNode.y || 0;
                
                return (
                  <svg
                    key={edge.id}
                    className="absolute pointer-events-none"
                    style={{ top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                  >
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={selectedEdge?.id === edge.id ? '#3b82f6' : '#6b7280'}
                      strokeWidth={selectedEdge?.id === edge.id ? 3 : 2}
                      markerEnd="url(#arrowhead)"
                      className="pointer-events-stroke cursor-pointer"
                      onClick={() => {
                        setSelectedEdge(edge);
                        setSelectedNode(null);
                        setEditingNode(null);
                        setEditingEdge(null);
                      }}
                      onDoubleClick={() => !readOnly && setEditingEdge(edge)}
                    />
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                      </marker>
                    </defs>
                  </svg>
                );
              })}
            </div>
          </div>
        )}

        {/* Raw JSONL View */}
        {(viewMode === 'raw' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto bg-gray-950`}>
            <textarea
              value={rawJSONL}
              onChange={(e) => handleRawJSONLChange(e.target.value)}
              disabled={readOnly}
              className="w-full h-full p-4 bg-gray-950 text-green-400 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Edit Node Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Node</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID</label>
                <input
                  type="text"
                  value={editingNode.id}
                  onChange={(e) => setEditingNode({ ...editingNode, id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <input
                  type="text"
                  value={editingNode.type}
                  onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">X</label>
                  <input
                    type="number"
                    value={editingNode.x || 0}
                    onChange={(e) => setEditingNode({ ...editingNode, x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Y</label>
                  <input
                    type="number"
                    value={editingNode.y || 0}
                    onChange={(e) => setEditingNode({ ...editingNode, y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Text</label>
                <textarea
                  value={editingNode.text || ''}
                  onChange={(e) => setEditingNode({ ...editingNode, text: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleUpdateNode(editingNode)}
                disabled={readOnly}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setEditingNode(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Edge Modal */}
      {editingEdge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Edge</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID</label>
                <input
                  type="text"
                  value={editingEdge.id}
                  onChange={(e) => setEditingEdge({ ...editingEdge, id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={editingEdge.type}
                  onChange={(e) => setEditingEdge({ ...editingEdge, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="transition">Transition</option>
                  <option value="self-ref">Self-Reference</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">From Node</label>
                <select
                  value={editingEdge.from || editingEdge.fromNode || ''}
                  onChange={(e) => setEditingEdge({ ...editingEdge, from: e.target.value, fromNode: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                >
                  <option value="">Select...</option>
                  {graph.nodeList.map(node => (
                    <option key={node.id} value={node.id}>{node.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">To Node</label>
                <select
                  value={editingEdge.to || editingEdge.toNode || ''}
                  onChange={(e) => setEditingEdge({ ...editingEdge, to: e.target.value, toNode: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                >
                  <option value="">Select...</option>
                  {graph.nodeList.map(node => (
                    <option key={node.id} value={node.id}>{node.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Label</label>
                <input
                  type="text"
                  value={editingEdge.label || ''}
                  onChange={(e) => setEditingEdge({ ...editingEdge, label: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleUpdateEdge(editingEdge)}
                disabled={readOnly}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setEditingEdge(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
