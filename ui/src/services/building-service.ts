/**
 * Building Service
 * Centralized building management and state synchronization
 */

import { BuildingConfig } from '../components/VirtualWorld/VirtualWorldBuilding';
import { InteriorRoom, BuildingDoor } from '../components/VirtualWorld/BuildingInterior';

export interface BuildingState {
  building: BuildingConfig;
  isOccupied: boolean;
  occupants: string[]; // Avatar IDs
  currentRoom?: string; // Current room ID
  doors: Map<string, BuildingDoor>;
  rooms: Map<string, InteriorRoom>;
  metadata?: {
    capacity?: number;
    purpose?: string;
    level?: number;
  };
}

export interface BuildingServiceEvents {
  'building:enter': (buildingId: string, avatarId: string) => void;
  'building:exit': (buildingId: string, avatarId: string) => void;
  'room:enter': (buildingId: string, roomId: string, avatarId: string) => void;
  'room:exit': (buildingId: string, roomId: string, avatarId: string) => void;
  'door:open': (buildingId: string, doorId: string) => void;
  'door:close': (buildingId: string, doorId: string) => void;
  'building:update': (building: BuildingState) => void;
}

class BuildingService {
  private buildings: Map<string, BuildingState> = new Map();
  private listeners: Map<keyof BuildingServiceEvents, Set<Function>> = new Map();

  // Event system
  on<K extends keyof BuildingServiceEvents>(event: K, callback: BuildingServiceEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof BuildingServiceEvents>(event: K, callback: BuildingServiceEvents[K]) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof BuildingServiceEvents>(event: K, ...args: Parameters<BuildingServiceEvents[K]>) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        (callback as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Building management
  registerBuilding(building: BuildingConfig, rooms: InteriorRoom[] = [], doors: BuildingDoor[] = []): string {
    const buildingState: BuildingState = {
      building,
      isOccupied: false,
      occupants: [],
      doors: new Map(doors.map(d => [d.id, d])),
      rooms: new Map(rooms.map(r => [r.id, r]))
    };

    this.buildings.set(building.id, buildingState);
    return building.id;
  }

  unregisterBuilding(buildingId: string): void {
    this.buildings.delete(buildingId);
  }

  getBuilding(buildingId: string): BuildingState | undefined {
    return this.buildings.get(buildingId);
  }

  getAllBuildings(): BuildingState[] {
    return Array.from(this.buildings.values());
  }

  // Building entry/exit
  enterBuilding(buildingId: string, avatarId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) {
      console.warn(`Building ${buildingId} not found`);
      return false;
    }

    if (!building.occupants.includes(avatarId)) {
      building.occupants.push(avatarId);
      building.isOccupied = building.occupants.length > 0;
      this.emit('building:enter', buildingId, avatarId);
      this.emit('building:update', building);
    }

    return true;
  }

  exitBuilding(buildingId: string, avatarId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) {
      return false;
    }

    const index = building.occupants.indexOf(avatarId);
    if (index > -1) {
      building.occupants.splice(index, 1);
      building.isOccupied = building.occupants.length > 0;
      building.currentRoom = undefined;
      this.emit('building:exit', buildingId, avatarId);
      this.emit('building:update', building);
    }

    return true;
  }

  // Room entry/exit
  enterRoom(buildingId: string, roomId: string, avatarId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const room = building.rooms.get(roomId);
    if (!room) return false;

    // Check capacity
    if (room.capacity && room.occupants && room.occupants.length >= room.capacity) {
      console.warn(`Room ${roomId} is at capacity`);
      return false;
    }

    // Exit previous room
    if (building.currentRoom) {
      this.exitRoom(buildingId, building.currentRoom, avatarId);
    }

    // Enter new room
    if (!room.occupants) {
      room.occupants = [];
    }
    if (!room.occupants.includes(avatarId)) {
      room.occupants.push(avatarId);
    }

    building.currentRoom = roomId;
    this.emit('room:enter', buildingId, roomId, avatarId);
    this.emit('building:update', building);

    return true;
  }

  exitRoom(buildingId: string, roomId: string, avatarId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const room = building.rooms.get(roomId);
    if (!room || !room.occupants) return false;

    const index = room.occupants.indexOf(avatarId);
    if (index > -1) {
      room.occupants.splice(index, 1);
      if (building.currentRoom === roomId) {
        building.currentRoom = undefined;
      }
      this.emit('room:exit', buildingId, roomId, avatarId);
      this.emit('building:update', building);
    }

    return true;
  }

  // Door management
  openDoor(buildingId: string, doorId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const door = building.doors.get(doorId);
    if (!door) return false;

    door.isOpen = true;
    door.animationProgress = 1;
    this.emit('door:open', buildingId, doorId);
    this.emit('building:update', building);

    return true;
  }

  closeDoor(buildingId: string, doorId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const door = building.doors.get(doorId);
    if (!door) return false;

    door.isOpen = false;
    door.animationProgress = 0;
    this.emit('door:close', buildingId, doorId);
    this.emit('building:update', building);

    return true;
  }

  toggleDoor(buildingId: string, doorId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const door = building.doors.get(doorId);
    if (!door) return false;

    return door.isOpen
      ? this.closeDoor(buildingId, doorId)
      : this.openDoor(buildingId, doorId);
  }

  // Queries
  getBuildingsByZone(zoneId: string): BuildingState[] {
    return Array.from(this.buildings.values()).filter(
      b => b.building.zoneId === zoneId
    );
  }

  getBuildingsByType(type: BuildingConfig['type']): BuildingState[] {
    return Array.from(this.buildings.values()).filter(
      b => b.building.type === type
    );
  }

  getOccupiedBuildings(): BuildingState[] {
    return Array.from(this.buildings.values()).filter(b => b.isOccupied);
  }

  getBuildingOccupancy(buildingId: string): number {
    const building = this.buildings.get(buildingId);
    return building ? building.occupants.length : 0;
  }

  getRoomOccupancy(buildingId: string, roomId: string): number {
    const building = this.buildings.get(buildingId);
    if (!building) return 0;

    const room = building.rooms.get(roomId);
    return room && room.occupants ? room.occupants.length : 0;
  }

  // Cleanup
  destroy(): void {
    this.buildings.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const buildingService = new BuildingService();

// Export for testing
export { BuildingService };
