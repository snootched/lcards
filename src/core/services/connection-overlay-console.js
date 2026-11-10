/**
 * @fileoverview The window.lcards.connectionOverlay console API: thin shims
 * over the core's ConnectionOverlayService for testing and the config panel.
 *
 * Usage examples:
 *   window.lcards.connectionOverlay.show()                  // Force-show (simulate disconnect)
 *   window.lcards.connectionOverlay.simulateReconnect()     // Simulate reconnection sequence
 *   window.lcards.connectionOverlay.hide()                  // Force-hide (clear test)
 *   window.lcards.connectionOverlay.getConfig()             // Read active config
 *   window.lcards.connectionOverlay.saveConfig({...})       // Save (global for an admin, else user)
 *   window.lcards.connectionOverlay.saveConfig({...}, 'device')  // Save to device scope
 *   window.lcards.connectionOverlay.clearConfig('device')   // Remove device override
 *   window.lcards.connectionOverlay.loadConfig()            // Reload from scoped settings
 */

import { defaultSettingsScope } from './storage-permissions.js';

/**
 * Build the console API.
 * @param {() => any} getCore - returns the LCARdS core (window.lcards.core), or nothing yet
 */
export function createConnectionOverlayConsoleApi(getCore) {
    const service = () => getCore()?.connectionOverlayService;
    /**
     * The scope when none is given: global for a Home Assistant admin, the
     * user's own scope otherwise (the backend refuses global writes for others).
     * @returns {'global'|'user'}
     */
    const defaultScope = () => defaultSettingsScope(getCore()?._currentHass);

    return {
        /** Force-show the overlay (useful for testing config changes). */
        show() {
            service()?.show();
        },
        /**
         * Show the overlay using a temporary preview config (not persisted).
         * Original config is restored on hide().  Used by the config panel preview.
         * @param {Object} previewConfig
         */
        showWith(previewConfig) {
            service()?.showWith(previewConfig);
        },
        /** Force-hide the overlay. */
        hide() {
            service()?.hide();
        },
        /**
         * Simulate the reconnection sequence for live preview.
         * Transitions from the disconnect overlay to the "connection restored" banner
         * (if enabled), auto-dismisses, then restores the original config.
         * @param {Object|null} [previewConfig]
         */
        simulateReconnect(previewConfig = null) {
            service()?.simulateReconnect(previewConfig);
        },
        /** Return the currently active (resolved) config object. */
        getConfig() {
            return service()?.getConfig() ?? null;
        },
        /**
         * Save config to a scope (default: global for an admin, user otherwise).
         * @param {Object} config
         * @param {'device'|'user'|'global'} [scope] - global needs a Home Assistant admin
         * @param {Object} [opts]
         * @returns {Promise<boolean>} false when a write failed or was refused (or no service)
         */
        saveConfig(config, scope = defaultScope(), opts = {}) {
            return service()?.saveConfig(config, scope, opts) ?? Promise.resolve(false);
        },
        /**
         * Remove config from a scope (falls back to next tier); default as saveConfig.
         * @param {'device'|'user'|'global'} [scope] - global needs a Home Assistant admin
         * @param {Object} [opts]
         * @returns {Promise<boolean>} false when a clear failed or was refused (or no service)
         */
        clearConfig(scope = defaultScope(), opts = {}) {
            return service()?.clearConfig(scope, opts) ?? Promise.resolve(false);
        },
        /**
         * Reload config from the ScopedSettings waterfall and refresh the overlay.
         * @returns {Promise<Object|null>} Resolved config
         */
        loadConfig() {
            return service()?.loadConfig() ?? Promise.resolve(null);
        },
    };
}
