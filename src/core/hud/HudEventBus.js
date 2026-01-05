import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * HudEventBus - Event communication system for HUD components
 * 
 * Provides pub/sub event system for coordinating HUD panels and cards.
 * 
 * @module core/hud/HudEventBus
 */
export class HudEventBus {
  constructor() {
    this._listeners = new Map(); // event -> Set<fn>
    lcardsLog.debug('[HudEventBus] 🚀 Event bus initialized');
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} fn - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
    lcardsLog.debug(`[HudEventBus] 🔗 Registered listener for event: ${event}`);
    return () => this.off(event, fn);
  }

  /**
   * Register one-time event listener
   * @param {string} event - Event name
   * @param {Function} fn - Callback function
   */
  once(event, fn) {
    const off = this.on(event, (p) => { 
      off(); 
      fn(p); 
    });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} fn - Callback function
   */
  off(event, fn) {
    const removed = this._listeners.get(event)?.delete(fn);
    if (removed) {
      lcardsLog.debug(`[HudEventBus] 🚫 Removed listener for event: ${event}`);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} payload - Event payload
   */
  emit(event, payload) {
    const list = this._listeners.get(event);
    if (list) {
      lcardsLog.debug(`[HudEventBus] 📡 Emitting event '${event}' to ${list.size} listeners`);
      list.forEach(fn => {
        try { 
          fn(payload); 
        } catch (e) {
          lcardsLog.warn(`[HudEventBus] ⚠️ Error in event listener for '${event}':`, e);
        }
      });
    }

    // Wildcard listeners
    const any = this._listeners.get('*');
    if (any) {
      any.forEach(fn => {
        try { 
          fn({ event, payload }); 
        } catch (e) {
          lcardsLog.warn(`[HudEventBus] ⚠️ Error in wildcard listener for '${event}':`, e);
        }
      });
    }
  }

  /**
   * Clear all event listeners
   */
  clear() {
    const totalListeners = Array.from(this._listeners.values())
      .reduce((sum, set) => sum + set.size, 0);
    this._listeners.clear();
    lcardsLog.debug(`[HudEventBus] 🧹 Cleared all event listeners (${totalListeners} total)`);
  }
}

/**
 * SelectionManager - Manages current HUD selection state
 * 
 * Tracks which card/overlay/element is currently selected in the HUD
 * and broadcasts selection changes via event bus.
 */
export class SelectionManager {
  constructor(bus) {
    this.bus = bus;
    this.current = null;
  }

  /**
   * Set current selection
   * @param {string} type - Selection type (overlay, anchor, card, etc.)
   * @param {string} id - Element ID
   * @param {Object} meta - Additional metadata
   */
  set(type, id, meta = {}) {
    if (!type || !id) {
      lcardsLog.debug('[SelectionManager] 🚫 Selection ignored - missing type or id');
      return;
    }
    
    this.current = {
      type,
      id,
      meta,
      ts: Date.now()
    };
    
    lcardsLog.debug(`[SelectionManager] 🎯 Selection changed: ${type}:${id}`);
    this.bus?.emit('select:changed', this.current);
  }

  /**
   * Clear current selection
   */
  clear() {
    this.current = null;
    lcardsLog.debug('[SelectionManager] 🧹 Selection cleared');
    this.bus?.emit('select:changed', null);
  }

  /**
   * Get current selection
   * @returns {Object|null} Current selection
   */
  get() {
    return this.current;
  }
}
