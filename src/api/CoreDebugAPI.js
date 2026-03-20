/**
 * CoreDebugAPI - Debug and introspection API for LCARdS core singletons
 *
 * Provides introspection of the window.lcards.core.* singleton managers.
 * Wired at window.lcards.debug.core / .singleton / .singletons by lcards-core.js.
 *
 * @module api/CoreDebugAPI
 */

/**
 * Core Debug API
 * Provides debugging utilities for the core singleton registry
 */
export class CoreDebugAPI {
  /**
   * Create and return the core debug methods
   * @returns {Object} Debug methods to attach onto window.lcards.debug
   */
  static create() {
    return {
      /**
       * Returns window.lcards.core.getDebugInfo() — a snapshot of all core manager states.
       *
       * @returns {Object} Combined debug info from all core managers
       *
       * @example
       * window.lcards.debug.core()
       * // → { systemsManager: {...}, dataSourceManager: {...}, rulesManager: {...}, ... }
       */
      core() {
        if (window.lcards?.core?.getDebugInfo) {
          return window.lcards.core.getDebugInfo();
        }
        return { error: 'Core not available', available: false };
      },

      /**
       * Returns getDebugInfo() for a specific core singleton by name.
       *
       * @param {string} manager - Manager name (e.g. 'dataSourceManager', 'rulesManager')
       * @returns {Object} Manager debug info
       *
       * @example
       * window.lcards.debug.singleton('dataSourceManager')
       * window.lcards.debug.singleton('animationManager')
       */
      singleton(manager) {
        const core = window.lcards?.core;
        if (!core) {
          return { error: 'Core not available', manager, available: false };
        }
        const m = core[manager];
        if (!m) {
          return {
            error: `Manager '${manager}' not found`,
            manager,
            available: Object.keys(core).filter(k => !k.startsWith('_'))
          };
        }
        if (typeof m.getDebugInfo === 'function') {
          return m.getDebugInfo();
        }
        return { error: `Manager '${manager}' has no getDebugInfo()`, manager, type: typeof m };
      },

      /**
       * Lists all core managers that expose getDebugInfo() and returns their names.
       *
       * @returns {Object} { managers: string[], count: number, coreInitialized: boolean }
       *
       * @example
       * window.lcards.debug.singletons()
       * // → { managers: ['systemsManager', 'animationManager', ...], count: 12, coreInitialized: true }
       */
      singletons() {
        const core = window.lcards?.core;
        if (!core) {
          return { error: 'Core not available', available: false };
        }
        const managers = Object.keys(core).filter(
          k => !k.startsWith('_') && core[k] && typeof core[k].getDebugInfo === 'function'
        );
        return { managers, count: managers.length, coreInitialized: core._coreInitialized };
      }
    };
  }
}
