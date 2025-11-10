/**
 * Metaverse Physics Service
 * Drives physics simulation for abstract components (particles, qubits, dimension nodes, topology grid)
 * and connects physics to visual components (trees sway, avatars affected by gravity, etc.)
 */

import * as THREE from 'three';

export interface ParticleState {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface QubitState {
  id: string;
  theta: number; // Polar angle
  phi: number;   // Azimuthal angle
  amplitude: { real: number; imag: number };
  probability: number;
  label: string;
  position: [number, number, number];
}

export interface DimensionNodeState {
  id: string;
  name: string;
  level: number;
  color: string;
  position: [number, number, number];
  churchEncoding: string;
  gravityStrength: number; // Gravity well strength
  fieldRadius: number; // Field effect radius
}

export interface TopologyGridState {
  resolution: number;
  size: number;
  fieldStrength: number[][]; // 2D grid of field strengths
}

export interface PhysicsState {
  particles: Map<string, ParticleState>;
  qubits: Map<string, QubitState>;
  dimensionNodes: Map<string, DimensionNodeState>;
  topologyGrid: TopologyGridState | null;
  wind: {
    direction: [number, number, number];
    strength: number;
  };
  time: number;
}

class MetaversePhysicsService {
  private state: PhysicsState = {
    particles: new Map(),
    qubits: new Map(),
    dimensionNodes: new Map(),
    topologyGrid: null,
    wind: {
      direction: [1, 0, 0],
      strength: 0.5
    },
    time: 0
  };

  private listeners: Set<() => void> = new Set();
  private animationFrameId: number | null = null;

  // Initialize physics system
  initialize() {
    this.setupDefaultDimensionNodes();
    this.setupTopologyGrid();
    this.startPhysicsLoop();
  }

  // Setup default dimension nodes (0D-7D)
  private setupDefaultDimensionNodes() {
    const nodes: DimensionNodeState[] = [
      { id: '0D-topology', name: 'Topology', level: 0, color: '#6366f1', position: [0, 0, 0], churchEncoding: 'λf.λx.x', gravityStrength: 0.1, fieldRadius: 10 },
      { id: '1D-temporal', name: 'Temporal', level: 1, color: '#8b5cf6', position: [2, 1, 0], churchEncoding: 'λn.λf.λx.f(nfx)', gravityStrength: 0.15, fieldRadius: 12 },
      { id: '2D-structural', name: 'Structural', level: 2, color: '#ec4899', position: [3, 2, -1], churchEncoding: 'λx.λy.λf.fxy', gravityStrength: 0.2, fieldRadius: 14 },
      { id: '3D-algebraic', name: 'Algebraic', level: 3, color: '#f43f5e', position: [3, 3, -2], churchEncoding: 'λm.λn.λf.λx.mf(nfx)', gravityStrength: 0.25, fieldRadius: 16 },
      { id: '4D-network', name: 'Network', level: 4, color: '#f97316', position: [2, 4, -2], churchEncoding: 'λm.λn.λf.m(nf)', gravityStrength: 0.3, fieldRadius: 18 },
      { id: '5D-consensus', name: 'Consensus', level: 5, color: '#eab308', position: [0, 4, -1], churchEncoding: 'λm.λn.nm', gravityStrength: 0.35, fieldRadius: 20 },
      { id: '6D-intelligence', name: 'Intelligence', level: 6, color: '#22c55e', position: [-2, 3, 0], churchEncoding: 'λf.(λx.f(xx))(λx.f(xx))', gravityStrength: 0.4, fieldRadius: 22 },
      { id: '7D-quantum', name: 'Quantum', level: 7, color: '#06b6d4', position: [-3, 1, 1], churchEncoding: '|ψ⟩ = α|0⟩ + β|1⟩', gravityStrength: 0.5, fieldRadius: 24 }
    ];

    nodes.forEach(node => {
      this.state.dimensionNodes.set(node.id, node);
    });
  }

  // Setup topology grid for spatial field calculations
  private setupTopologyGrid() {
    const resolution = 50;
    const size = 200;
    const fieldStrength: number[][] = [];

    for (let x = 0; x < resolution; x++) {
      fieldStrength[x] = [];
      for (let z = 0; z < resolution; z++) {
        // Calculate field strength based on distance to dimension nodes
        let strength = 0;
        this.state.dimensionNodes.forEach(node => {
          const worldX = (x / resolution) * size - size / 2;
          const worldZ = (z / resolution) * size - size / 2;
          const distance = Math.sqrt(
            Math.pow(worldX - node.position[0], 2) +
            Math.pow(worldZ - node.position[2], 2)
          );
          if (distance < node.fieldRadius) {
            strength += node.gravityStrength * (1 - distance / node.fieldRadius);
          }
        });
        fieldStrength[x][z] = Math.min(strength, 1);
      }
    }

    this.state.topologyGrid = {
      resolution,
      size,
      fieldStrength
    };
  }

  // Start physics update loop
  private startPhysicsLoop() {
    const update = () => {
      this.state.time += 0.016; // ~60fps
      this.updateParticles();
      this.updateQubits();
      this.updateWind();
      this.notifyListeners();
      this.animationFrameId = requestAnimationFrame(update);
    };
    update();
  }

  // Update particle physics
  private updateParticles() {
    this.state.particles.forEach((particle, id) => {
      // Apply wind force
      particle.velocity[0] += this.state.wind.direction[0] * this.state.wind.strength * 0.01;
      particle.velocity[1] += this.state.wind.direction[1] * this.state.wind.strength * 0.01;
      particle.velocity[2] += this.state.wind.direction[2] * this.state.wind.strength * 0.01;

      // Apply gravity from dimension nodes
      this.state.dimensionNodes.forEach(node => {
        const dx = node.position[0] - particle.position[0];
        const dy = node.position[1] - particle.position[1];
        const dz = node.position[2] - particle.position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < node.fieldRadius && distance > 0.1) {
          const force = node.gravityStrength / (distance * distance);
          particle.velocity[0] += (dx / distance) * force * 0.01;
          particle.velocity[1] += (dy / distance) * force * 0.01;
          particle.velocity[2] += (dz / distance) * force * 0.01;
        }
      });

      // Update position
      particle.position[0] += particle.velocity[0] * 0.016;
      particle.position[1] += particle.velocity[1] * 0.016;
      particle.position[2] += particle.velocity[2] * 0.016;

      // Apply damping
      particle.velocity[0] *= 0.99;
      particle.velocity[1] *= 0.99;
      particle.velocity[2] *= 0.99;

      // Update life
      particle.life += 0.016;
      if (particle.life >= particle.maxLife) {
        this.state.particles.delete(id);
      }
    });
  }

  // Update qubit quantum states
  private updateQubits() {
    this.state.qubits.forEach(qubit => {
      // Quantum state evolution (simplified)
      qubit.phi += 0.01;
      if (qubit.phi > Math.PI * 2) qubit.phi -= Math.PI * 2;
      
      // Entanglement effects with nearby qubits
      this.state.qubits.forEach(otherQubit => {
        if (otherQubit.id !== qubit.id) {
          const dx = otherQubit.position[0] - qubit.position[0];
          const dy = otherQubit.position[1] - qubit.position[1];
          const dz = otherQubit.position[2] - qubit.position[2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance < 5) {
            // Entanglement effect
            qubit.phi += 0.001 * (1 / (distance + 0.1));
          }
        }
      });
    });
  }

  // Update wind (procedural)
  private updateWind() {
    // Procedural wind based on time
    this.state.wind.direction[0] = Math.sin(this.state.time * 0.1) * 0.5;
    this.state.wind.direction[2] = Math.cos(this.state.time * 0.1) * 0.5;
    this.state.wind.strength = 0.3 + Math.sin(this.state.time * 0.05) * 0.2;
  }

  // Get wind at position (for tree sway, etc.)
  getWindAt(position: [number, number, number]): { direction: [number, number, number]; strength: number } {
    // Wind varies slightly by position
    const variation = Math.sin(position[0] * 0.1) * Math.cos(position[2] * 0.1) * 0.1;
    return {
      direction: [
        this.state.wind.direction[0] + variation,
        this.state.wind.direction[1],
        this.state.wind.direction[2] + variation
      ] as [number, number, number],
      strength: this.state.wind.strength + variation * 0.5
    };
  }

  // Get gravity at position (for avatars, objects)
  getGravityAt(position: [number, number, number]): [number, number, number] {
    let totalGravity: [number, number, number] = [0, -9.8, 0]; // Base gravity down

    this.state.dimensionNodes.forEach(node => {
      const dx = node.position[0] - position[0];
      const dy = node.position[1] - position[1];
      const dz = node.position[2] - position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < node.fieldRadius && distance > 0.1) {
        const force = node.gravityStrength / (distance * distance);
        totalGravity[0] += (dx / distance) * force;
        totalGravity[1] += (dy / distance) * force;
        totalGravity[2] += (dz / distance) * force;
      }
    });

    return totalGravity;
  }

  // Get topology field strength at position (for building alignment, paths)
  getTopologyFieldAt(position: [number, number, number]): number {
    if (!this.state.topologyGrid) return 0;

    const { resolution, size, fieldStrength } = this.state.topologyGrid;
    const x = Math.floor(((position[0] + size / 2) / size) * resolution);
    const z = Math.floor(((position[2] + size / 2) / size) * resolution);

    if (x >= 0 && x < resolution && z >= 0 && z < resolution) {
      return fieldStrength[x][z];
    }
    return 0;
  }

  // Add particle
  addParticle(particle: ParticleState) {
    this.state.particles.set(particle.id, particle);
  }

  // Add qubit
  addQubit(qubit: QubitState) {
    this.state.qubits.set(qubit.id, qubit);
  }

  // Get state
  getState(): PhysicsState {
    return {
      particles: new Map(this.state.particles),
      qubits: new Map(this.state.qubits),
      dimensionNodes: new Map(this.state.dimensionNodes),
      topologyGrid: this.state.topologyGrid,
      wind: { ...this.state.wind },
      time: this.state.time
    };
  }

  // Subscribe to updates
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Cleanup
  destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.listeners.clear();
  }
}

export const metaversePhysicsService = new MetaversePhysicsService();
