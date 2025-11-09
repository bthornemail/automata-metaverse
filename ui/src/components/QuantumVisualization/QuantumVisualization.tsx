import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Zap, Eye, Grid3x3 } from 'lucide-react';
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface QubitState {
  id: string;
  theta: number; // Polar angle
  phi: number;   // Azimuthal angle
  amplitude: { real: number; imag: number };
  probability: number;
  label: string;
}

interface QuantumVisualizationProps {
  className?: string;
}

const QuantumVisualization: React.FC<QuantumVisualizationProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  // const controlsRef = useRef<OrbitControls>();
  const frameRef = useRef<number | undefined>(undefined);
  
  const [qubits, setQubits] = useState<QubitState[]>([
    { id: 'q0', theta: Math.PI / 4, phi: 0, amplitude: { real: 0.707, imag: 0 }, probability: 0.5, label: '|0⟩' },
    { id: 'q1', theta: Math.PI / 2, phi: Math.PI / 2, amplitude: { real: 0, imag: 0.707 }, probability: 0.5, label: '|1⟩' },
    { id: 'q2', theta: Math.PI / 3, phi: Math.PI, amplitude: { real: 0.5, imag: 0.289 }, probability: 0.33, label: '|+⟩' },
  ]);
  
  const [isAnimating, setIsAnimating] = useState(true);
  const [showEntanglement, setShowEntanglement] = useState(true);
  const [viewMode, setViewMode] = useState<'bloch' | 'entanglement' | 'circuit'>('bloch');
  const [selectedQubit, setSelectedQubit] = useState<string | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;
    // controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Create Bloch sphere for a qubit
  const createBlochSphere = (qubit: QubitState) => {
    const group = new THREE.Group();

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.1,
      wireframe: false
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // Wireframe
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const wireframe = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    group.add(wireframe);

    // Axes
    const axesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // X-axis
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 0, 0),
      new THREE.Vector3(1.2, 0, 0)
    ]);
    const xLine = new THREE.Line(xGeometry, axesMaterial);
    group.add(xLine);

    // Y-axis
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0, 1.2, 0)
    ]);
    const yLine = new THREE.Line(yGeometry, axesMaterial);
    group.add(yLine);

    // Z-axis
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.2),
      new THREE.Vector3(0, 0, 1.2)
    ]);
    const zLine = new THREE.Line(zGeometry, axesMaterial);
    group.add(zLine);

    // State vector
    const x = Math.sin(qubit.theta) * Math.cos(qubit.phi);
    const y = Math.sin(qubit.theta) * Math.sin(qubit.phi);
    const z = Math.cos(qubit.theta);

    const vectorGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z)
    ]);
    const vectorMaterial = new THREE.LineBasicMaterial({ 
      color: 0xf59e0b,
      linewidth: 3
    });
    const stateVector = new THREE.Line(vectorGeometry, vectorMaterial);
    group.add(stateVector);

    // State point
    const pointGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const pointMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3
    });
    const statePoint = new THREE.Mesh(pointGeometry, pointMaterial);
    statePoint.position.set(x, y, z);
    group.add(statePoint);

    // Labels
    const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Axis labels
    // const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Axis labels
    // const loader = new THREE.FontLoader();
    // Note: In production, you'd load actual font files
    // For now, we'll skip text labels

    return group;
  };

  // Create entanglement visualization
  const createEntanglementVisualization = () => {
    const group = new THREE.Group();

    qubits.forEach((qubit, i) => {
      const x = (i - qubits.length / 2) * 2;
      const y = 0;
      const z = 0;

      // Qubit representation
      const qubitGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const qubitMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(i / qubits.length, 0.7, 0.5),
        emissive: new THREE.Color().setHSL(i / qubits.length, 0.7, 0.3),
        emissiveIntensity: 0.5
      });
      const qubitMesh = new THREE.Mesh(qubitGeometry, qubitMaterial);
      qubitMesh.position.set(x, y, z);
      group.add(qubitMesh);

      // Probability visualization
      const probabilityHeight = qubit.probability * 2;
      const probGeometry = new THREE.CylinderGeometry(0.1, 0.1, probabilityHeight, 8);
      const probMaterial = new THREE.MeshPhongMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.7
      });
      const probMesh = new THREE.Mesh(probGeometry, probMaterial);
      probMesh.position.set(x, probabilityHeight / 2, z);
      group.add(probMesh);
    });

    // Entanglement connections
    if (showEntanglement && qubits.length >= 2) {
      for (let i = 0; i < qubits.length - 1; i++) {
        const x1 = (i - qubits.length / 2) * 2;
        const x2 = ((i + 1) - qubits.length / 2) * 2;
        
        const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x1, 0, 0),
          new THREE.Vector3(x2, 0, 0)
        ]);
        
        const connectionMaterial = new THREE.LineBasicMaterial({
          color: 0xec4899,
          transparent: true,
          opacity: 0.6
        });
        
        const connection = new THREE.Line(connectionGeometry, connectionMaterial);
        group.add(connection);
      }
    }

    return group;
  };

  // Update scene based on view mode
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing objects (except lights and camera)
    while (sceneRef.current.children.length > 2) {
      const child = sceneRef.current.children[sceneRef.current.children.length - 1];
      sceneRef.current.remove(child);
    }

    if (viewMode === 'bloch') {
      qubits.forEach((qubit, i) => {
        const blochSphere = createBlochSphere(qubit);
        blochSphere.position.x = (i - qubits.length / 2) * 2.5;
        sceneRef.current?.add(blochSphere);
      });
    } else if (viewMode === 'entanglement') {
      const entanglementViz = createEntanglementVisualization();
      sceneRef.current?.add(entanglementViz);
    }
  }, [qubits, viewMode, showEntanglement]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Rotate qubits
      if (viewMode === 'bloch') {
        setQubits(prevQubits => 
          prevQubits.map(qubit => ({
            ...qubit,
            phi: qubit.phi + 0.01
          }))
        );
      }

      // Update controls
      // controlsRef.current?.update();

      // Render
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isAnimating, viewMode]);

  // Apply quantum gate
  const applyQuantumGate = (gate: string, qubitId: string) => {
    setQubits(prevQubits =>
      prevQubits.map(qubit => {
        if (qubit.id !== qubitId) return qubit;

        switch (gate) {
          case 'X':
            return { ...qubit, theta: Math.PI - qubit.theta, phi: qubit.phi + Math.PI };
          case 'Y':
            return { ...qubit, theta: qubit.theta, phi: qubit.phi + Math.PI };
          case 'Z':
            return { ...qubit, theta: qubit.theta, phi: -qubit.phi };
          case 'H':
            return { ...qubit, theta: Math.PI / 2 - qubit.theta, phi: qubit.phi + Math.PI / 2 };
          default:
            return qubit;
        }
      })
    );
  };

  // Reset qubits
  const resetQubits = () => {
    setQubits([
      { id: 'q0', theta: Math.PI / 4, phi: 0, amplitude: { real: 0.707, imag: 0 }, probability: 0.5, label: '|0⟩' },
      { id: 'q1', theta: Math.PI / 2, phi: Math.PI / 2, amplitude: { real: 0, imag: 0.707 }, probability: 0.5, label: '|1⟩' },
      { id: 'q2', theta: Math.PI / 3, phi: Math.PI, amplitude: { real: 0.5, imag: 0.289 }, probability: 0.33, label: '|+⟩' },
    ]);
  };

  return (
    <div className={`p-6 bg-gray-800 rounded-xl shadow-xl ${className}`} data-testid="quantum-visualization">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Zap className="w-6 h-6 text-cyan-400" />
          Quantum Visualization
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="control-button bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={resetQubits}
            className="control-button bg-gray-600 hover:bg-gray-700 text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button className="control-button bg-gray-600 hover:bg-gray-700 text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'bloch', label: 'Bloch Spheres', icon: Eye },
          { id: 'entanglement', label: 'Entanglement', icon: Grid3x3 },
          { id: 'circuit', label: 'Circuit', icon: Settings }
        ].map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === mode.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* 3D Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div 
            ref={mountRef} 
            className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden"
          />
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Qubit States */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Qubit States</h4>
            <div className="space-y-2">
              {qubits.map((qubit) => (
                <div
                  key={qubit.id}
                  className={`p-3 bg-gray-800 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedQubit === qubit.id ? 'ring-2 ring-cyan-500' : ''
                  }`}
                  onClick={() => setSelectedQubit(qubit.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{qubit.label}</span>
                    <span className="text-cyan-400 text-sm">{qubit.id}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    θ: {(qubit.theta * 180 / Math.PI).toFixed(1)}°
                    φ: {(qubit.phi * 180 / Math.PI).toFixed(1)}°
                  </div>
                  <div className="text-xs text-gray-400">
                    P: {(qubit.probability * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantum Gates */}
          {selectedQubit && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Quantum Gates</h4>
              <div className="grid grid-cols-2 gap-2">
                {['X', 'Y', 'Z', 'H'].map((gate) => (
                  <button
                    key={gate}
                    onClick={() => applyQuantumGate(gate, selectedQubit)}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    {gate}-Gate
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Options</h4>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={showEntanglement}
                onChange={(e) => setShowEntanglement(e.target.checked)}
                className="rounded"
              />
              Show Entanglement
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumVisualization;