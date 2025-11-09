import { EventEmitter } from '../events';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  describe('Event Subscription', () => {
    test('should subscribe to event', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      expect(emitter.listenerCount('test')).toBe(1);
    });

    test('should emit event to listener', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.emit('test', 'data');
      expect(listener).toHaveBeenCalledWith('data');
    });

    test('should handle multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.emit('test', 'data');
      expect(listener1).toHaveBeenCalledWith('data');
      expect(listener2).toHaveBeenCalledWith('data');
    });
  });

  describe('Event Unsubscription', () => {
    test('should unsubscribe from event', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.off('test', listener);
      emitter.emit('test', 'data');
      expect(listener).not.toHaveBeenCalled();
    });

    test('should remove all listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.removeAllListeners('test');
      emitter.emit('test', 'data');
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalListener = jest.fn();
      
      emitter.on('test', errorListener);
      emitter.on('test', normalListener);
      
      // Should not throw, but log error
      expect(() => emitter.emit('test', 'data')).not.toThrow();
      expect(normalListener).toHaveBeenCalled();
    });
  });
});
