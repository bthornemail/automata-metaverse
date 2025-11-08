import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Plus, Trash2, Edit2, X, Check, AlertCircle, 
  Network, FileText, GitBranch, Search, Filter
} from 'lucide-react';
import { jsonlCanvasService, CanvasGraph, JSONLNode, JSONLEdge } from '../../services/jsonl-canvas-service';
import { databaseService } from '../../services/database-service';
import { BasesManager } from '../BasesManager';
import { basesService } from '../../services/bases-service';

interface JSONLCanvasEditorProps {
  filename: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
}

// Detect file type from extension
function getFileType(filename: string): 'jsonl' | 'canvasl' {
  return filename.endsWith('.canvasl') ? 'canvasl' : 'jsonl';
}

const JSONLCanvasEditor: React.FC<JSONLCanvasEditorProps> = ({ 
  filename, 
  onSave, 
  onClose 
}) => {
  const fileType = getFileType(filename);
  const [graph, setGraph] = useState<CanvasGraph>({
    nodes: new Map(),
    edges: new Map(),
    nodeList: [],
    edgeList: []
  });
  const [rawJSONL, setRawJSONL] = useState('');
  const [selectedNode, setSelectedNode] = useState<JSONLNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<JSONLEdge | null>(null);
  const [editingNode, setEditingNode] = useState<JSONLNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<JSONLEdge | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'raw' | 'split' | 'base'>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load JSONL file
  useEffect(() => {
    loadJSONL();
  }, [filename]);

  const loadJSONL = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const entries = await databaseService.readJSONL(filename);
      
      // Convert entries to JSONL string
      const jsonlContent = entries.map(entry => JSON.stringify(entry)).join('\n');
      setRawJSONL(jsonlContent);
      
      // Parse into graph
      const parsedGraph = jsonlCanvasService.parseJSONL(jsonlContent);
      setGraph(parsedGraph);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load JSONL file');
      console.error('Failed to load JSONL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Export graph to JSONL
      const jsonlContent = jsonlCanvasService.exportToJSONL(graph);
      setRawJSONL(jsonlContent);
      
      // Parse back to entries
      const lines = jsonlContent.split('\n').filter(l => l.trim());
      const entries = lines.map(line => JSON.parse(line));
      
      // Save via database service
      await databaseService.writeJSONL(filename, entries);
      
      if (onSave) {
        onSave(jsonlContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save JSONL file');
      console.error('Failed to save JSONL:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNode = () => {
    const newNode: JSONLNode = {
      id: `node-${Date.now()}`,
      type: 'text',
      x: Math.random() * 500,
      y: Math.random() * 500,
      text: 'New Node',
      width: 280,
      height: 120
    };
    
    setGraph(jsonlCanvasService.addNode(graph, newNode));
    setEditingNode(newNode);
  };

  const handleAddEdge = () => {
    if (!selectedNode) {
      alert('Please select a source node first');
      return;
    }
    
    const newEdge: JSONLEdge = {
      id: `edge-${Date.now()}`,
      type: 'vertical',
      from: selectedNode.id,
      to: '',
      label: 'connection'
    };
    
    setGraph(jsonlCanvasService.addEdge(graph, newEdge));
    setEditingEdge(newEdge);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (confirm('Delete this node and all connected edges?')) {
      setGraph(jsonlCanvasService.deleteNode(graph, nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (confirm('Delete this edge?')) {
      setGraph(jsonlCanvasService.deleteEdge(graph, edgeId));
      if (selectedEdge?.id === edgeId) {
        setSelectedEdge(null);
      }
    }
  };

  const handleUpdateNode = (updates: Partial<JSONLNode>) => {
    if (!editingNode) return;
    
    const updated = { ...editingNode, ...updates };
    setGraph(jsonlCanvasService.updateNode(graph, editingNode.id, updates));
    setEditingNode(null);
    setSelectedNode(updated);
  };

  const handleUpdateEdge = (updates: Partial<JSONLEdge>) => {
    if (!editingEdge) return;
    
    const updated = { ...editingEdge, ...updates };
    const newEdges = new Map(graph.edges);
    newEdges.set(editingEdge.id, updated);
    
    setGraph({
      ...graph,
      edges: newEdges,
      edgeList: Array.from(newEdges.values())
    });
    
    setEditingEdge(null);
    setSelectedEdge(updated);
  };

  // Filter nodes and edges
  const filteredNodes = graph.nodeList.filter(node => {
    if (filterType !== 'all' && node.type !== filterType) return false;
    if (searchQuery && !node.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !node.text?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredEdges = graph.edgeList.filter(edge => {
    if (filterType !== 'all' && edge.type !== filterType) return false;
    if (searchQuery && !edge.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !edge.label?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Canvas Editor: {filename}</h2>
            <span className={`text-xs px-2 py-1 rounded ${
              fileType === 'canvasl' 
                ? 'bg-purple-900/30 text-purple-400 border border-purple-700' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {fileType === 'canvasl' ? 'CanvasL' : 'JSONL'}
            </span>
            <span className="text-xs text-gray-400">
              {graph.nodeList.length} nodes, {graph.edgeList.length} edges
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setViewMode('base')}
              className={`px-3 py-1 rounded ${viewMode === 'base' ? 'bg-blue-600' : 'bg-gray-700'} transition-colors`}
            >
              Base View
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes/edges..."
                className="w-full pl-8 pr-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="file">File</option>
              <option value="node">Node</option>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="transition">Transition</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Graph View */}
        {(viewMode === 'graph' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-700 overflow-auto bg-gray-900`}>
            <div ref={canvasRef} className="relative p-8" style={{ minHeight: '100%' }}>
              {/* Render Nodes */}
              {filteredNodes.map(node => (
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
                  onDoubleClick={() => setEditingNode(node)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-mono text-gray-400">{node.id}</div>
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
                  </div>
                  <div className="text-xs text-gray-300 mb-1">{node.type}</div>
                  {node.text && (
                    <div className="text-sm text-white line-clamp-3">{node.text}</div>
                  )}
                </motion.div>
              ))}

              {/* Render Edges */}
              {filteredEdges.map(edge => {
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
                      onDoubleClick={() => setEditingEdge(edge)}
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
              onChange={(e) => {
                setRawJSONL(e.target.value);
                try {
                  const parsed = jsonlCanvasService.parseJSONL(e.target.value);
                  setGraph(parsed);
                } catch (err) {
                  // Invalid JSONL, keep raw content
                }
              }}
              className="w-full h-full p-4 bg-gray-950 text-green-400 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}

        {viewMode === 'base' && (
          <div className="w-full h-full overflow-hidden">
            <BasesManager
              initialFile={filename.replace(/\.(jsonl|canvasl)$/, '.base')}
              showEmbedPreview={true}
              onFileSelect={(file) => {
                // Handle file selection if needed
              }}
              onConvert={async (from, to) => {
                // Convert current JSONL to base
                try {
                  const base = await basesService.convertToBase(filename);
                  // Base is loaded in BasesManager component
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to convert to base');
                }
              }}
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
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <input
                  type="text"
                  value={editingNode.type}
                  onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
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
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Y</label>
                  <input
                    type="number"
                    value={editingNode.y || 0}
                    onChange={(e) => setEditingNode({ ...editingNode, y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
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
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleUpdateNode(editingNode)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                <Check className="w-4 h-4 inline mr-2" />
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
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={editingEdge.type}
                  onChange={(e) => setEditingEdge({ ...editingEdge, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
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
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleUpdateEdge(editingEdge)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                <Check className="w-4 h-4 inline mr-2" />
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

export default JSONLCanvasEditor;
