/**
 * MSD Card Picker Manager
 *
 * Manages hui-card-picker component loading and initialization.
 * Adapted from simple-swipe-card's robust loading strategy.
 *
 * The card picker is optional - if it fails to load, the MSD Studio
 * will gracefully degrade to manual card configuration.
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

export class MSDCardPickerManager {
    /**
     * @param {Object} dialogInstance - Reference to parent MSD Studio dialog
     */
    constructor(dialogInstance) {
        this.dialog = dialogInstance;
        this._cardPickerLoadThrottle = null;
        this._isLoaded = false;
    }

    /**
     * Ensure hui-card-picker is loaded (max 10 attempts over 1 second)
     * Returns true if loaded successfully, false otherwise
     * @returns {Promise<boolean>}
     */
    async ensureCardPickerLoaded() {
        if (customElements.get("hui-card-picker")) {
            this._isLoaded = true;
            lcardsLog.debug('[MSDCardPickerManager] ✅ Card picker already loaded');
            return true;
        }

        const maxAttempts = 10;
        let attempts = 0;

        lcardsLog.debug('[MSDCardPickerManager] 🔄 Attempting to load card picker...');

        while (!customElements.get("hui-card-picker") && attempts < maxAttempts) {
            try {
                await this._loadCardPickerComponent();
                if (customElements.get("hui-card-picker")) {
                    this._isLoaded = true;
                    lcardsLog.debug(`[MSDCardPickerManager] ✅ Card picker loaded after ${attempts + 1} attempts`);
                    return true;
                }
            } catch (e) {
                // Silent fail - card picker is optional
                lcardsLog.trace('[MSDCardPickerManager] Load attempt failed:', e);
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }

        if (!this._isLoaded) {
            lcardsLog.warn('[MSDCardPickerManager] ⚠️ Card picker failed to load after 10 attempts');
        }

        return false;
    }

    /**
     * Trigger loading by accessing various HA card config elements
     * @private
     */
    async _loadCardPickerComponent() {
        const attempts = [
            () => customElements.get("hui-entities-card")?.getConfigElement?.(),
            () => customElements.get("hui-conditional-card")?.getConfigElement?.(),
            () => customElements.get("hui-vertical-stack-card")?.getConfigElement?.(),
            () => customElements.get("hui-horizontal-stack-card")?.getConfigElement?.(),
        ];

        for (const attempt of attempts) {
            try {
                await attempt();
                if (customElements.get("hui-card-picker")) {
                    break;
                }
            } catch (e) {
                // Silent fail - continue to next attempt
                lcardsLog.trace('[MSDCardPickerManager] Component access failed:', e);
            }
        }
    }

    /**
     * Check if picker is loaded and ready
     * @returns {boolean}
     */
    isLoaded() {
        return this._isLoaded;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this._cardPickerLoadThrottle) {
            clearTimeout(this._cardPickerLoadThrottle);
            this._cardPickerLoadThrottle = null;
        }
        lcardsLog.debug('[MSDCardPickerManager] 🧹 Cleanup complete');
    }
}
