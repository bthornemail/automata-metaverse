/**
 * Automaton Controller Unit Tests
 */

import { AutomatonController } from '../../../src/server/automaton-controller';
import { AdvancedSelfReferencingAutomaton } from '../../../advanced-automaton';
import { Server as SocketIOServer } from 'socket.io';

// Mock automaton - use any to avoid type issues
const createMockAutomaton = () => ({
  currentDimension: 0,
  executionHistory: [],
  selfModificationCount: 0,
  objects: [],
  executeEvolution: jest.fn(),
  executeSelfReference: jest.fn(),
  executeSelfModification: jest.fn(),
  executeSelfIO: jest.fn(),
  executeSelfValidation: jest.fn(),
  executeSelfTraining: jest.fn(),
  executeSelfObservation: jest.fn(),
  executeComposition: jest.fn(),
});

jest.mock('../../../advanced-automaton', () => ({
  AdvancedSelfReferencingAutomaton: jest.fn().mockImplementation(() => createMockAutomaton()),
}));

// Mock Socket.IO
const mockIo = {
  emit: jest.fn(),
} as any;

describe('AutomatonController', () => {
  let controller: AutomatonController;
  let mockAutomaton: any;

  beforeEach(() => {
    mockAutomaton = new AdvancedSelfReferencingAutomaton('./automaton.jsonl');
    controller = new AutomatonController(mockAutomaton, mockIo);
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start automaton execution', () => {
      controller.start(1000, 5);

      const state = controller.getState();
      expect(state.isRunning).toBe(true);
    });

    it('should not start if already running', () => {
      controller.start(1000, 5);
      const initialState = controller.getState();

      controller.start(1000, 5);
      const afterState = controller.getState();

      expect(initialState.isRunning).toBe(true);
      expect(afterState.isRunning).toBe(true);
    });

    it('should emit status updates', (done) => {
      controller.start(100, 1);

      setTimeout(() => {
        expect(mockIo.emit).toHaveBeenCalledWith('status', expect.any(Object));
        done();
      }, 150);
    });
  });

  describe('stop', () => {
    it('should stop running automaton', () => {
      controller.start(1000, 10);
      expect(controller.getState().isRunning).toBe(true);

      controller.stop();
      expect(controller.getState().isRunning).toBe(false);
    });

    it('should emit status update on stop', () => {
      controller.start(1000, 10);
      controller.stop();

      expect(mockIo.emit).toHaveBeenCalledWith('status', expect.objectContaining({
        isRunning: false,
        status: 'idle',
      }));
    });
  });

  describe('executeAction', () => {
    it('should execute evolve action', () => {
      controller.executeAction('evolve');

      expect(mockAutomaton.executeEvolution).toHaveBeenCalled();
      expect(mockIo.emit).toHaveBeenCalledWith('action', expect.any(Object));
    });

    it('should execute self-modify action', () => {
      controller.executeAction('self-modify');

      expect(mockAutomaton.executeSelfModification).toHaveBeenCalled();
      expect(mockIo.emit).toHaveBeenCalledWith('modification', expect.any(Object));
    });

    it('should handle invalid action gracefully', () => {
      expect(() => {
        controller.executeAction('invalid-action');
      }).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset automaton', () => {
      controller.start(1000, 10);
      controller.reset();

      expect(controller.getState().isRunning).toBe(false);
    });

    it('should create new automaton instance', () => {
      const originalAutomaton = controller.getAutomaton();
      controller.reset();
      const newAutomaton = controller.getAutomaton();

      // Should be different instances
      expect(newAutomaton).toBeDefined();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = controller.getState();

      expect(state).toBeDefined();
      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('automaton');
      expect(state).toHaveProperty('intervalId');
    });
  });
});
