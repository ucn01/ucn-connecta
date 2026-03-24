import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class ErrorEventEmitter {
  private emitter = new EventEmitter();

  on<E extends keyof Events>(event: E, listener: Events[E]): void {
    this.emitter.on(event, listener);
  }

  off<E extends keyof Events>(event: E, listener: Events[E]): void {
    this.emitter.off(event, listener);
  }

  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): void {
    this.emitter.emit(event, ...args);
  }
}

export const errorEmitter = new ErrorEventEmitter();
