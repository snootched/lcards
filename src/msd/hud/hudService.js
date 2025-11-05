import { lcardsLog } from '../../utils/lcards-logging.js';
/**
 * [HudService] Lightweight HUD event bus and selection manager
 * 🔗 Event communication and state management for MSD HUD components
 */
export class HudEventBus {
  constructor() {
    this._listeners = new Map(); // event -> Set<fn>
  }
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    lcardsLog.debug(`[HudService] 🔗 Registered listener for event: ${event}`);
    return () => this.off(event, fn);
  }
  once(event, fn) {
    const off = this.on(event, (p) => { off(); fn(p); });
  }
  off(event, fn) {
    const removed = this._listeners.get(event)?.delete(fn);
    if (removed) {
      lcardsLog.debug(`[HudService] 🚫 Removed listener for event: ${event}`);
    }
  }
  emit(event, payload) {
    const list = this._listeners.get(event);
    if (list) {
      lcardsLog.debug(`[HudService] 📡 Emitting event '${event}' to ${list.size} listeners`);
      list.forEach(fn => {
        try { fn(payload); } catch (e) {
          lcardsLog.warn(`[HudService] ⚠️ Error in event listener for '${event}':`, e);
        }
      });
    }
    // Wildcard listeners
    const any = this._listeners.get('*');
    if (any) {
      any.forEach(fn => {
        try { fn({ event, payload }); } catch (e) {
          lcardsLog.warn(`[HudService] ⚠️ Error in wildcard listener for '${event}':`, e);
        }
      });
    }
  }
  clear() {
    const totalListeners = Array.from(this._listeners.values()).reduce((sum, set) => sum + set.size, 0);
    this._listeners.clear();
    lcardsLog.debug(`[HudService] 🧹 Cleared all event listeners (${totalListeners} total)`);
  }
}

export class SelectionManager {
  constructor(bus) {
    this.bus = bus;
    this.current = null;
  }
  set(type, id, meta = {}) {
    if (!type || !id) {
      lcardsLog.debug('[HudService] 🚫 Selection ignored - missing type or id');
      return;
    }
    this.current = {
      type,
      id,
      meta,
      ts: Date.now()
    };
    lcardsLog.debug(`[HudService] 🎯 Selection changed: ${type}:${id}`);
    this.bus?.emit('select:changed', this.current);
  }
  clear() {
    this.current = null;
    lcardsLog.debug('[HudService] 🧹 Selection cleared');
    this.bus?.emit('select:changed', null);
  }
  get() {
    return this.current;
  }
}
