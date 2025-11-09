/**
 * Path Service
 * Path finding and navigation system
 */

import { PathConfig } from '../components/VirtualWorld/VirtualWorldPaths';
import { CurvedPathConfig, PathFollower } from '../components/VirtualWorld/PathNavigation';
import * as THREE from 'three';

export interface PathNode {
  id: string;
  position: [number, number, number];
  connections: string[]; // Connected path IDs
}

export interface PathRoute {
  pathIds: string[];
  totalDistance: number;
  waypoints: [number, number, number][];
}

export interface PathServiceEvents {
  'path:follow': (followerId: string, pathId: string, progress: number) => void;
  'path:complete': (followerId: string, pathId: string) => void;
  'route:found': (route: PathRoute) => void;
}

class PathService {
  private paths: Map<string, CurvedPathConfig> = new Map();
  private nodes: Map<string, PathNode> = new Map();
  private followers: Map<string, PathFollower> = new Map();
  private listeners: Map<keyof PathServiceEvents, Set<Function>> = new Map();
  private updateInterval: number | null = null;

  constructor() {
    this.setupUpdateLoop();
  }

  // Event system
  on<K extends keyof PathServiceEvents>(event: K, callback: PathServiceEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof PathServiceEvents>(event: K, callback: PathServiceEvents[K]) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof PathServiceEvents>(event: K, ...args: Parameters<PathServiceEvents[K]>) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        (callback as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Path management
  registerPath(path: CurvedPathConfig): void {
    this.paths.set(path.id, path);
    
    // Create/update nodes
    const fromNodeId = `node-${path.from.join(',')}`;
    const toNodeId = `node-${path.to.join(',')}`;

    if (!this.nodes.has(fromNodeId)) {
      this.nodes.set(fromNodeId, {
        id: fromNodeId,
        position: path.from,
        connections: []
      });
    }

    if (!this.nodes.has(toNodeId)) {
      this.nodes.set(toNodeId, {
        id: toNodeId,
        position: path.to,
        connections: []
      });
    }

    this.nodes.get(fromNodeId)!.connections.push(path.id);
    this.nodes.get(toNodeId)!.connections.push(path.id);
  }

  unregisterPath(pathId: string): void {
    this.paths.delete(pathId);
  }

  getPath(pathId: string): CurvedPathConfig | undefined {
    return this.paths.get(pathId);
  }

  getAllPaths(): CurvedPathConfig[] {
    return Array.from(this.paths.values());
  }

  // Path following
  startFollowing(followerId: string, pathId: string, speed: number = 1, direction: 'forward' | 'backward' = 'forward'): void {
    const follower: PathFollower = {
      id: followerId,
      pathId,
      progress: direction === 'forward' ? 0 : 1,
      speed,
      direction
    };

    this.followers.set(followerId, follower);
  }

  stopFollowing(followerId: string): void {
    this.followers.delete(followerId);
  }

  getFollower(followerId: string): PathFollower | undefined {
    return this.followers.get(followerId);
  }

  // Path finding (A* algorithm)
  findPath(start: [number, number, number], end: [number, number, number]): PathRoute | null {
    const startNodeId = this.findNearestNode(start);
    const endNodeId = this.findNearestNode(end);

    if (!startNodeId || !endNodeId || startNodeId === endNodeId) {
      return null;
    }

    // Simple A* pathfinding
    const openSet = new Set<string>([startNodeId]);
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startNodeId, 0);
    fScore.set(startNodeId, this.heuristic(start, this.nodes.get(endNodeId)!.position));

    while (openSet.size > 0) {
      // Find node with lowest fScore
      let current: string | null = null;
      let lowestF = Infinity;
      for (const nodeId of openSet) {
        const f = fScore.get(nodeId) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = nodeId;
        }
      }

      if (!current) break;

      if (current === endNodeId) {
        // Reconstruct path
        return this.reconstructPath(cameFrom, current, startNodeId);
      }

      openSet.delete(current);
      closedSet.add(current);

      const currentNode = this.nodes.get(current);
      if (!currentNode) continue;

      // Check neighbors
      for (const pathId of currentNode.connections) {
        const path = this.paths.get(pathId);
        if (!path) continue;

        const neighborId = path.from.join(',') === current.split('-')[1] 
          ? `node-${path.to.join(',')}`
          : `node-${path.from.join(',')}`;

        if (closedSet.has(neighborId)) continue;

        const tentativeG = (gScore.get(current) || Infinity) + this.getPathLength(path);

        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        } else if (tentativeG >= (gScore.get(neighborId) || Infinity)) {
          continue;
        }

        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);
        const neighborNode = this.nodes.get(neighborId);
        if (neighborNode) {
          fScore.set(neighborId, tentativeG + this.heuristic(neighborNode.position, this.nodes.get(endNodeId)!.position));
        }
      }
    }

    return null; // No path found
  }

  private reconstructPath(cameFrom: Map<string, string>, current: string, startNodeId: string): PathRoute {
    const pathIds: string[] = [];
    const waypoints: [number, number, number][] = [];
    let totalDistance = 0;

    let nodeId: string | undefined = current;
    while (nodeId) {
      const node = this.nodes.get(nodeId);
      if (node) {
        waypoints.unshift(node.position);
      }

      const previous = cameFrom.get(nodeId);
      if (previous) {
        // Find path between previous and current
        const prevNode = this.nodes.get(previous);
        const currNode = this.nodes.get(nodeId);
        if (prevNode && currNode) {
          for (const path of this.paths.values()) {
            const matchesFrom = path.from.join(',') === prevNode.position.join(',');
            const matchesTo = path.to.join(',') === currNode.position.join(',');
            if (matchesFrom && matchesTo) {
              pathIds.unshift(path.id);
              totalDistance += this.getPathLength(path);
              break;
            }
          }
        }
      }

      nodeId = previous;
      if (nodeId === startNodeId) break;
    }

    return { pathIds, totalDistance, waypoints };
  }

  private findNearestNode(position: [number, number, number]): string | null {
    let nearestId: string | null = null;
    let minDistance = Infinity;

    for (const [nodeId, node] of this.nodes) {
      const distance = new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...node.position));
      if (distance < minDistance) {
        minDistance = distance;
        nearestId = nodeId;
      }
    }

    return nearestId;
  }

  private heuristic(a: [number, number, number], b: [number, number, number]): number {
    return new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));
  }

  private getPathLength(path: CurvedPathConfig): number {
    return new THREE.Vector3(...path.from).distanceTo(new THREE.Vector3(...path.to));
  }

  // Update loop for path followers
  private setupUpdateLoop(): void {
    this.updateInterval = window.setInterval(() => {
      this.followers.forEach((follower, id) => {
        const path = this.paths.get(follower.pathId);
        if (!path) return;

        const delta = (follower.speed * 0.016) / this.getPathLength(path); // 60 FPS
        const newProgress = follower.direction === 'forward'
          ? Math.min(follower.progress + delta, 1)
          : Math.max(follower.progress - delta, 0);

        follower.progress = newProgress;
        this.emit('path:follow', id, follower.pathId, newProgress);

        if ((follower.direction === 'forward' && newProgress >= 1) ||
            (follower.direction === 'backward' && newProgress <= 0)) {
          this.emit('path:complete', id, follower.pathId);
        }
      });
    }, 16); // ~60 FPS
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    this.paths.clear();
    this.nodes.clear();
    this.followers.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const pathService = new PathService();

// Export for testing
export { PathService };
