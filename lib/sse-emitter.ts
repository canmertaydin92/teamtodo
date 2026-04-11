import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var _sseEmitter: EventEmitter | undefined;
}

const emitter = global._sseEmitter ?? new EventEmitter();
global._sseEmitter = emitter;
emitter.setMaxListeners(500);

export function emitUpdate() {
  emitter.emit("update");
}

export default emitter;
