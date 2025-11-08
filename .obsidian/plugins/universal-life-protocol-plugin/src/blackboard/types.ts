/**
 * Blackboard Architecture - Type Definitions
 */

export interface EpistemicNodeFrontmatter {
  id: string;
  title: string;
  level: 'gateway' | 'foundational' | 'practical' | 'applied';
  type: 'navigation' | 'concept' | 'implementation' | 'application' | 'guide' | 'analysis';
  tags: string[];
  keywords: string[];
  prerequisites: string[];
  enables: string[];
  related: string[];
  readingTime: number;
  difficulty: number;
  blackboard?: BlackboardMetadata;
}

export interface BlackboardMetadata {
  status?: 'active' | 'processing' | 'completed' | 'needs-review';
  assignedAgent?: string;
  lastUpdate?: number;
  validationIssues?: string[];
  canvasSynced?: boolean;
  dependencies?: string[];
  watchers?: string[];
  agentNotes?: Record<string, any>;
}

export interface EpistemicNode {
  id: string;
  path: string;
  frontmatter: EpistemicNodeFrontmatter;
}

export interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'link' | 'group';
  x: number;
  y: number;
  width?: number;
  height?: number;
  file?: string;
  text?: string;
  color?: string;
  metadata?: {
    epistemicNodeId?: string;
    blackboardState?: {
      processed?: boolean;
      agentNotes?: any[];
    };
    [key: string]: any;
  };
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
  metadata?: {
    relationship?: 'prerequisite' | 'enables' | 'related';
    [key: string]: any;
  };
}

export interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  metadata?: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface AgentResult {
  success: boolean;
  changes?: any;
  issues?: string[];
  data?: any;
}

export interface IBlackboardAgent {
  name: string;
  priority: number;
  canProcess(node: EpistemicNode): boolean;
  process(node: EpistemicNode, blackboard: IBlackboard): Promise<AgentResult>;
}

export interface IBlackboard {
  getNode(nodeId: string): Promise<EpistemicNode | null>;
  getNodeByPath(path: string): Promise<EpistemicNode | null>;
  getAllNodes(): Promise<EpistemicNode[]>;
  updateNode(nodeId: string, updates: Partial<EpistemicNodeFrontmatter>): Promise<void>;
  getDocumentContent(nodeId: string): Promise<string>;
  findCanvasNode(nodeId: string): Promise<CanvasNode | null>;
  createCanvasNode(node: CanvasNode): Promise<void>;
  updateCanvasNode(nodeId: string, updates: Partial<CanvasNode>): Promise<void>;
  getCanvas(canvasPath: string): Promise<Canvas | null>;
  updateCanvas(canvasPath: string, canvas: Canvas): Promise<void>;
}
