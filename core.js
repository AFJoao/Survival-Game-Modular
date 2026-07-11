// =================================================================
// CORE — EventBus, TickManager e ObjectPool.
// Estes três sistemas são a "espinha dorsal" de comunicação e
// performance do jogo; todos os outros módulos dependem deles.
// =================================================================

// --- EVENT BUS ---------------------------------------------------
export const EventBus = {
  listeners: {},
  on(event, cb) { (this.listeners[event] ??= []).push(cb); },
  off(event, cb) { if (this.listeners[event]) this.listeners[event] = this.listeners[event].filter(f => f !== cb); },
  emit(event, data) { (this.listeners[event] || []).forEach(cb => cb(data)); }
};

// --- TICK SYSTEM ---------------------------------------------------
export const TickManager = {
  channels: { high: [], medium: [], low: [] },
  timers: { medium: 0, low: 0 },
  intervals: { medium: 0.15, low: 0.6 },
  register(channel, fn) { this.channels[channel].push(fn); return fn; },
  update(dt) {
    for (const fn of this.channels.high) fn(dt);
    this.timers.medium += dt;
    if (this.timers.medium >= this.intervals.medium) {
      const d = this.timers.medium; this.timers.medium = 0;
      for (const fn of this.channels.medium) fn(d);
    }
    this.timers.low += dt;
    if (this.timers.low >= this.intervals.low) {
      const d = this.timers.low; this.timers.low = 0;
      for (const fn of this.channels.low) fn(d);
    }
  }
};

// --- OBJECT POOLING ---------------------------------------------------
export class ObjectPool {
  constructor(createFn, resetFn) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.free = [];
    this.active = new Set();
  }
  acquire(...args) {
    let obj = this.free.pop();
    if (!obj) obj = this.createFn();
    this.resetFn(obj, ...args);
    this.active.add(obj);
    return obj;
  }
  release(obj) {
    if (!this.active.has(obj)) return;
    this.active.delete(obj);
    if (obj.mesh) obj.mesh.visible = false;
    this.free.push(obj);
  }
  get activeCount() { return this.active.size; }
}
