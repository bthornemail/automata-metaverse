/**
 * Provenance Canvas Worker
 * OffscreenCanvas worker for rendering 3D provenance chains without blocking main thread
 * 
 * Note: This worker uses Three.js directly. In a browser environment, Three.js must be
 * available in the worker context. Vite will handle bundling this correctly.
 */

// Import Three.js - Vite will bundle this for the worker
// @ts-ignore - Three.js types may not be available in worker context
import * as THREE from 'three';

// Worker message types
interface WorkerMessage {
  type: 'init' | 'load' | 'query' | 'render' | 'interact' | 'updateCamera';
  payload: any;
}

interface CanvasOptions {
  width: number;
  height: number;
  antialias?: boolean;
}

interface ProvenanceNode {
  id: string;
  type: 'agent' | 'document' | 'code' | 'interaction' | 'evolution';
  position: [number, number, number];
  metadata: {
    timestamp: number;
    file: string;
    line: number;
    agentId: string;
    dimension?: string;
    churchEncoding?: string;
  };
  data: any;
}

interface ProvenanceEdge {
  id: string;
  type: 'consumes' | 'produces' | 'references' | 'evolves' | 'interacts';
  from: string;
  to: string;
  metadata: {
    timestamp: number;
    weight: number;
    context: string;
  };
}

interface ProvenanceChain {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

class ProvenanceCanvasRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nodes: Map<string, THREE.Mesh> = new Map();
  private edges: Map<string, THREE.Line> = new Map();
  private selectedNode: ProvenanceNode | null = null;
  private chain: ProvenanceChain | null = null;

  constructor(canvas: OffscreenCanvas, options: CanvasOptions) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      options.width / options.height,
      0.1,
      1000
    );
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: options.antialias ?? true
    });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.5);
    pointLight.position.set(-10, -10, -10);
    this.scene.add(pointLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x4b5563, 0x1f2937);
    this.scene.add(gridHelper);

    // Start render loop
    this.animate();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  loadProvenanceChain(chain: ProvenanceChain): void {
    this.chain = chain;
    this.clearScene();
    this.renderChain(chain);
  }

  private clearScene(): void {
    // Remove existing nodes
    for (const node of this.nodes.values()) {
      this.scene.remove(node);
      node.geometry.dispose();
      if (node.material instanceof THREE.Material) {
        node.material.dispose();
      }
    }
    this.nodes.clear();

    // Remove existing edges
    for (const edge of this.edges.values()) {
      this.scene.remove(edge);
      edge.geometry.dispose();
      if (edge.material instanceof THREE.Material) {
        edge.material.dispose();
      }
    }
    this.edges.clear();
  }

  private renderChain(chain: ProvenanceChain): void {
    // Render nodes
    for (const node of chain.nodes) {
      const mesh = this.createNodeMesh(node);
      this.scene.add(mesh);
      this.nodes.set(node.id, mesh);
    }

    // Render edges
    for (const edge of chain.edges) {
      const line = this.createEdgeLine(edge, chain.nodes);
      if (line) {
        this.scene.add(line);
        this.edges.set(edge.id, line);
      }
    }
  }

  private createNodeMesh(node: ProvenanceNode): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const color = this.getNodeColor(node.type);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...node.position);
    mesh.userData = { node };

    return mesh;
  }

  private createEdgeLine(
    edge: ProvenanceEdge,
    nodes: ProvenanceNode[]
  ): THREE.Line | null {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) {
      return null;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...fromNode.position),
      new THREE.Vector3(...toNode.position)
    ]);

    const color = this.getEdgeColor(edge.type);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
      opacity: 0.6,
      transparent: true
    });

    return new THREE.Line(geometry, material);
  }

  private getNodeColor(type: ProvenanceNode['type']): number {
    const colors: Record<ProvenanceNode['type'], number> = {
      agent: 0x6366f1,
      document: 0x10b981,
      code: 0xf59e0b,
      interaction: 0xec4899,
      evolution: 0x06b6d4
    };
    return colors[type] || 0xffffff;
  }

  private getEdgeColor(type: ProvenanceEdge['type']): number {
    const colors: Record<ProvenanceEdge['type'], number> = {
      consumes: 0x10b981,
      produces: 0xf59e0b,
      references: 0x6366f1,
      evolves: 0x06b6d4,
      interacts: 0xec4899
    };
    return colors[type] || 0xffffff;
  }

  handleClick(x: number, y: number, width: number, height: number): ProvenanceNode | null {
    // Convert screen coordinates to normalized device coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (x / width) * 2 - 1;
    mouse.y = -(y / height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(Array.from(this.nodes.values()));

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const node = mesh.userData.node as ProvenanceNode;
      this.selectedNode = node;
      return node;
    }

    return null;
  }

  handleHover(x: number, y: number, width: number, height: number): ProvenanceNode | null {
    const mouse = new THREE.Vector2();
    mouse.x = (x / width) * 2 - 1;
    mouse.y = -(y / height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(Array.from(this.nodes.values()));

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      return mesh.userData.node as ProvenanceNode;
    }

    return null;
  }

  updateCamera(position: [number, number, number], target: [number, number, number]): void {
    this.camera.position.set(...position);
    this.camera.lookAt(...target);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    this.clearScene();
    this.renderer.dispose();
  }
}

// Worker global scope
let renderer: ProvenanceCanvasRenderer | null = null;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      const { canvas, options } = payload;
      renderer = new ProvenanceCanvasRenderer(canvas, options);
      self.postMessage({ type: 'initialized' });
      break;

    case 'load':
      if (renderer) {
        renderer.loadProvenanceChain(payload.chain);
        self.postMessage({ type: 'loaded', payload: { nodeCount: payload.chain.nodes.length } });
      }
      break;

    case 'interact':
      if (renderer) {
        const { x, y, width, height, interactionType } = payload;
        let result: ProvenanceNode | null = null;
        
        if (interactionType === 'click') {
          result = renderer.handleClick(x, y, width, height);
        } else if (interactionType === 'hover') {
          result = renderer.handleHover(x, y, width, height);
        }
        
        if (result) {
          self.postMessage({ type: 'nodeSelected', payload: { node: result } });
        }
      }
      break;

    case 'updateCamera':
      if (renderer) {
        renderer.updateCamera(payload.position, payload.target);
      }
      break;

    case 'resize':
      if (renderer) {
        renderer.resize(payload.width, payload.height);
      }
      break;

    case 'dispose':
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }
      break;
  }
};
