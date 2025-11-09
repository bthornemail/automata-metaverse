/**
 * Metaverse Canvas 3D Component
 * Renders CanvasL files in 3D space with editing capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { canvasl3DService, Node3D, Edge3D, Canvas3D } from '../../services/canvasl-3d-service';
import { databaseService } from '../../services/database-service';
import { motion } from 'framer-motion';
import { Save, Loader2, FileText, Edit2, Trash2, Plus, GitBranch, X } from 'lucide-react';

interface MetaverseCanvas3DProps {
  filename: string;
  onSave?: (canvas3D: Canvas3D) => void;
  readOnly?: boolean;
}

// 3D Node Component with editing
const Node3DComponent: React.FC<{
  node: Node3D;
  isSelected: boolean;
  isEditing: boolean;
  onClick: () => void;
  onDrag: (position: [number, number, number]) => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ node, isSelected, isEditing, onClick, onDrag, onEdit, onDelete, readOnly = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number, number] | null>(null);

  useFrame((state) => {
    if (meshRef.current && !dragging) {
      // Gentle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + node.dimension || 0;
      
      // Pulsing for selected nodes
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setDragging(true);
    setDragStart([e.clientX, e.clientY, 0]);
    onClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart || readOnly) return;
    e.stopPropagation();
    
    // Calculate 3D position from mouse
    const deltaX = (e.clientX - dragStart[0]) * 0.01;
    const deltaY = (e.clientY - dragStart[1]) * 0.01;
    
    const newPosition: [number, number, number] = [
      node.position[0] + deltaX,
      node.position[1] + deltaY,
      node.position[2]
    ];
    
    onDrag(newPosition);
    setDragStart([e.clientX, e.clientY, 0]);
  };

  const handlePointerUp = () => {
    setDragging(false);
    setDragStart(null);
  };

  const geometry = node.type === 'file' ? 
    <Box args={[node.radius * 1.5, node.radius * 1.5, node.radius * 1.5]} /> :
    <Sphere args={[node.radius, 16, 16]} />;

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
      >
        {geometry}
        <meshStandardMaterial
          color={node.color}
          emissive={isSelected ? node.color : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.2 : 0}
          roughness={0.2}
          metalness={0.8}
          wireframe={node.type === 'file'}
        />
      </mesh>
      
      {/* Node label */}
      <Text
        position={[0, node.radius + 0.5, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {node.text || node.id}
      </Text>
      
      {/* Dimension indicator */}
      {node.dimension !== undefined && (
        <Text
          position={[0, -node.radius - 0.3, 0]}
          fontSize={0.15}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          {node.dimension}D
        </Text>
      )}
      
      {/* Church encoding */}
      {node.churchEncoding && (
        <Text
          position={[0, node.radius + 0.8, 0]}
          fontSize={0.12}
          color="#a855f7"
          anchorX="center"
          anchorY="middle"
        >
          {node.churchEncoding}
        </Text>
      )}

      {/* Edit controls */}
      {isSelected && !readOnly && (
        <Html position={[0, node.radius + 1.2, 0]} center>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 hover:bg-gray-700 rounded"
              title="Edit"
            >
              <Edit2 className="w-3 h-3 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 hover:bg-red-700 rounded"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Edge Component
const Edge3DComponent: React.FC<{
  edge: Edge3D;
  isSelected: boolean;
  onClick: () => void;
}> = ({ edge, isSelected, onClick }) => {
  return (
    <Line
      points={[edge.fromPosition, edge.toPosition]}
      color={edge.color}
      lineWidth={isSelected ? 3 : 2}
      onClick={onClick}
    />
  );
};

// Main 3D Scene
const Canvas3DScene: React.FC<{
  canvas3D: Canvas3D;
  selectedNode: Node3D | null;
  selectedEdge: Edge3D | null;
  onNodeSelect: (node: Node3D | null) => void;
  onEdgeSelect: (edge: Edge3D | null) => void;
  onNodeDrag: (nodeId: string, position: [number, number, number]) => void;
  onNodeEdit: (node: Node3D) => void;
  onNodeDelete: (nodeId: string) => void;
  readOnly?: boolean;
}> = ({
  canvas3D,
  selectedNode,
  selectedEdge,
  onNodeSelect,
  onEdgeSelect,
  onNodeDrag,
  onNodeEdit,
  onNodeDelete,
  readOnly = false
}) => {
  const { camera } = useThree();

  // Center camera on bounds
  useEffect(() => {
    if (canvas3D.bounds.center) {
      camera.position.set(
        canvas3D.bounds.center[0] + 5,
        canvas3D.bounds.center[1] + 5,
        canvas3D.bounds.center[2] + 5
      );
      camera.lookAt(...canvas3D.bounds.center);
    }
  }, [canvas3D.bounds.center, camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} />
      
      {/* Render nodes */}
      {canvas3D.nodeList.map(node => (
        <Node3DComponent
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          isEditing={false}
          onClick={() => onNodeSelect(node)}
          onDrag={(position) => onNodeDrag(node.id, position)}
          onEdit={() => onNodeEdit(node)}
          onDelete={() => onNodeDelete(node.id)}
          readOnly={readOnly}
        />
      ))}
      
      {/* Render edges */}
      {canvas3D.edgeList.map(edge => (
        <Edge3DComponent
          key={edge.id}
          edge={edge}
          isSelected={selectedEdge?.id === edge.id}
          onClick={() => onEdgeSelect(edge)}
        />
      ))}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
};

export const MetaverseCanvas3D: React.FC<MetaverseCanvas3DProps> = ({
  filename,
  onSave,
  readOnly = false
}) => {
  const [canvas3D, setCanvas3D] = useState<Canvas3D | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge3D | null>(null);
  const [editingNode, setEditingNode] = useState<Node3D | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load CanvasL file
  useEffect(() => {
    loadCanvas();
  }, [filename]);

  const loadCanvas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loaded = await canvasl3DService.loadCanvasLTo3D(filename);
      setCanvas3D(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load canvas');
      console.error('Failed to load canvas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canvas3D || readOnly) return;
    
    setIsSaving(true);
    try {
      await canvasl3DService.sync3DToCanvasL(canvas3D, filename);
      if (onSave) {
        onSave(canvas3D);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save canvas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNodeDrag = (nodeId: string, position: [number, number, number]) => {
    if (!canvas3D || readOnly) return;
    
    const updated = canvasl3DService.updateNode3D(canvas3D, nodeId, { position });
    setCanvas3D(updated);
  };

  const handleNodeEdit = (node: Node3D) => {
    setEditingNode(node);
  };

  const handleNodeDelete = (nodeId: string) => {
    if (!canvas3D || readOnly) return;
    
    if (confirm('Delete this node and all connected edges?')) {
      const updated = canvasl3DService.deleteNode3D(canvas3D, nodeId);
      setCanvas3D(updated);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    }
  };

  const handleAddNode = () => {
    if (!canvas3D || readOnly) return;
    
    const newNode: Node3D = {
      id: `node-${Date.now()}`,
      type: 'text',
      position: [0, 0, 0],
      color: '#6366f1',
      radius: 0.5,
      text: 'New Node'
    };
    
    const updated = canvasl3DService.addNode3D(canvas3D, newNode);
    setCanvas3D(updated);
    setSelectedNode(newNode);
    setEditingNode(newNode);
  };

  const handleAddEdge = () => {
    if (!canvas3D || !selectedNode || readOnly) return;
    
    // Prompt for target node
    const targetId = prompt('Enter target node ID:');
    if (!targetId) return;
    
    const targetNode = canvas3D.nodes.get(targetId);
    if (!targetNode) {
      alert('Target node not found');
      return;
    }
    
    const newEdge: Edge3D = {
      id: `edge-${Date.now()}`,
      type: 'vertical',
      from: selectedNode.id,
      to: targetId,
      fromPosition: selectedNode.position,
      toPosition: targetNode.position,
      color: '#6366f1'
    };
    
    const updated = canvasl3DService.addEdge3D(canvas3D, newEdge);
    setCanvas3D(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading 3D canvas...</p>
        </div>
      </div>
    );
  }

  if (error || !canvas3D) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-red-400">
          <p>Error: {error || 'Failed to load canvas'}</p>
          <button
            onClick={loadCanvas}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">3D Metaverse Canvas: {filename}</h2>
            <span className="text-xs text-gray-400">
              {canvas3D.nodeList.length} nodes, {canvas3D.edgeList.length} edges
            </span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNode}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Node
              </button>
              <button
                onClick={handleAddEdge}
                disabled={!selectedNode}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg"
              >
                <GitBranch className="w-4 h-4" />
                Add Edge
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
          <Canvas3DScene
            canvas3D={canvas3D}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onNodeSelect={setSelectedNode}
            onEdgeSelect={setSelectedEdge}
            onNodeDrag={handleNodeDrag}
            onNodeEdit={handleNodeEdit}
            onNodeDelete={handleNodeDelete}
            readOnly={readOnly}
          />
        </Canvas>
      </div>

      {/* Edit Node Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Node</h3>
              <button
                onClick={() => setEditingNode(null)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID</label>
                <input
                  type="text"
                  value={editingNode.id}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Text</label>
                <input
                  type="text"
                  value={editingNode.text || ''}
                  onChange={(e) => {
                    const updated = { ...editingNode, text: e.target.value };
                    setEditingNode(updated);
                    if (canvas3D) {
                      setCanvas3D(canvasl3DService.updateNode3D(canvas3D, editingNode.id, { text: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">X</label>
                  <input
                    type="number"
                    value={editingNode.position[0].toFixed(2)}
                    onChange={(e) => {
                      const newPos: [number, number, number] = [
                        parseFloat(e.target.value) || 0,
                        editingNode.position[1],
                        editingNode.position[2]
                      ];
                      if (canvas3D) {
                        setCanvas3D(canvasl3DService.updateNode3D(canvas3D, editingNode.id, { position: newPos }));
                        setEditingNode({ ...editingNode, position: newPos });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Y</label>
                  <input
                    type="number"
                    value={editingNode.position[1].toFixed(2)}
                    onChange={(e) => {
                      const newPos: [number, number, number] = [
                        editingNode.position[0],
                        parseFloat(e.target.value) || 0,
                        editingNode.position[2]
                      ];
                      if (canvas3D) {
                        setCanvas3D(canvasl3DService.updateNode3D(canvas3D, editingNode.id, { position: newPos }));
                        setEditingNode({ ...editingNode, position: newPos });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Z</label>
                  <input
                    type="number"
                    value={editingNode.position[2].toFixed(2)}
                    onChange={(e) => {
                      const newPos: [number, number, number] = [
                        editingNode.position[0],
                        editingNode.position[1],
                        parseFloat(e.target.value) || 0
                      ];
                      if (canvas3D) {
                        setCanvas3D(canvasl3DService.updateNode3D(canvas3D, editingNode.id, { position: newPos }));
                        setEditingNode({ ...editingNode, position: newPos });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingNode(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaverseCanvas3D;
