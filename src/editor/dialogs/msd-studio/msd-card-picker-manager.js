/**
 * @fileoverview MSD Card Picker Manager
 *
 * Manages hui-card-picker component loading and initialization.
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
     * Ensure required components are loaded (max 10 attempts over 1 second)
     * @returns {Promise<boolean>}
     */
    async ensureComponentsLoaded() {
        const maxAttempts = 10;
        let attempts = 0;

        // If hui-card-picker is already available, return immediately
        if (customElements.get("hui-card-picker")) {
            this._isLoaded = true;
            return true;
        }

        lcardsLog.debug('[MSDCardPickerManager] 🔄 Attempting to load card picker...');

        while (!customElements.get("hui-card-picker") && attempts < maxAttempts) {
            lcardsLog.debug(`[MSDCardPickerManager] Load attempt ${attempts + 1}/${maxAttempts}`);
            try {
                await this.loadCustomElements();
                if (customElements.get("hui-card-picker")) {
                    this._isLoaded = true;
                    lcardsLog.debug(`[MSDCardPickerManager] ✅ Card picker loaded after ${attempts + 1} attempts`);
                    return true;
                }
            } catch (e) {
                // Silently fail individual attempts
                lcardsLog.trace('[MSDCardPickerManager] Load attempt failed:', e);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }

        // Card picker didn't load - editor can function without it
        if (!this._isLoaded) {
            lcardsLog.info('[MSDCardPickerManager] ℹ️ Card picker not available');
            lcardsLog.info('[MSDCardPickerManager] 💡 To enable: Close this dialog, click dashboard "Add Card" button, then cancel and reopen MSD Studio');
        }

        return false;
    }

    /**
     * Load custom elements - fire ll-create-card event using shadow DOM traversal
     * @private
     */
    async loadCustomElements() {
        if (customElements.get("hui-card-picker")) {
            lcardsLog.debug('[MSDCardPickerManager] hui-card-picker already available');
            return;
        }

        try {
            // Traverse shadow DOM to find lovelace elements (adapted from legacy button-card)
            let root = document.querySelector('home-assistant');
            if (!root) {
                lcardsLog.trace('[MSDCardPickerManager] home-assistant element not found');
                return;
            }

            // @ts-ignore - TS2740: auto-suppressed
            root = root.shadowRoot;
            if (!root) {
                lcardsLog.trace('[MSDCardPickerManager] home-assistant shadowRoot not found');
                return;
            }

            root = root.querySelector('home-assistant-main');
            // @ts-ignore - TS2740: auto-suppressed
            root = root && root.shadowRoot;
            root = root && root.querySelector('app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver');
            // @ts-ignore - TS2322: auto-suppressed
            root = (root && root.shadowRoot) || root;
            root = root && root.querySelector('ha-panel-lovelace');

            if (!root) {
                lcardsLog.trace('[MSDCardPickerManager] ha-panel-lovelace not found in shadow DOM');
                return;
            }

            // @ts-ignore - TS2740: auto-suppressed
            root = root.shadowRoot;
            root = root && root.querySelector('hui-root');

            if (!root) {
                lcardsLog.trace('[MSDCardPickerManager] hui-root not found');
                return;
            }

            // hui-root might have its own shadowRoot
            const huiRootShadow = root.shadowRoot;
            const searchRoot = huiRootShadow || root;

            // Now find the actual view elements within hui-root (or its shadowRoot)
            const viewElements = [
                searchRoot.querySelector('hui-view'),
                searchRoot.querySelector('hui-sections-view'),
                searchRoot.querySelector('hui-grid-section'),
                searchRoot.querySelector('hui-section')
            ].filter(Boolean);

            lcardsLog.trace('[MSDCardPickerManager] hui-root shadowRoot:', !!huiRootShadow);
            lcardsLog.trace('[MSDCardPickerManager] Found view elements:', viewElements.map(e => e.tagName).join(', '));

            if (viewElements.length === 0) {
                lcardsLog.trace('[MSDCardPickerManager] No view elements found - trying to fire on hui-root directly');

                // Fire on hui-root itself if we can't find view elements
                const event = new CustomEvent('ll-create-card', {
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                    detail: {
                        suggested: ["lcards-button","lcards-slider","lcards-elbow","lcards-chart","lcards-data-grid"]
                    }
                });

                root.dispatchEvent(event);
                event.stopPropagation();
                event.preventDefault();

                // Wait for picker to load
                await new Promise(resolve => setTimeout(resolve, 150));

                if (customElements.get("hui-card-picker")) {
                    lcardsLog.debug('[MSDCardPickerManager] ✅ hui-card-picker loaded via ll-create-card on hui-root');
                }
                return;
            }

            // Fire ll-create-card event on each view element
            for (const element of viewElements) {
                lcardsLog.trace(`[MSDCardPickerManager] Firing ll-create-card on ${element.tagName}...`);

                const event = new CustomEvent('ll-create-card', {
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                    detail: {
                        suggested: ["lcards-button","lcards-slider","lcards-elbow","lcards-chart","lcards-data-grid"]
                    }
                });

                element.dispatchEvent(event);

                // Immediately stop propagation and prevent default to avoid opening the dialog
                event.stopPropagation();
                event.preventDefault();
            }

            // Wait a moment for picker to load
            await new Promise(resolve => setTimeout(resolve, 50));

            // Close any dialogs that might have opened (hui-dialog-create-card in home-assistant shadowRoot)
            const homeAssistant = document.querySelector('home-assistant');
            if (homeAssistant?.shadowRoot) {
                const createCardDialog = homeAssistant.shadowRoot.querySelector('hui-dialog-create-card');
                if (createCardDialog) {
                    lcardsLog.trace('[MSDCardPickerManager] Found hui-dialog-create-card, closing it...');

                    // Try multiple methods to close the dialog
                    // @ts-ignore - TS2339: auto-suppressed
                    if (typeof createCardDialog.closeDialog === 'function') {
                        // @ts-ignore - TS2339: auto-suppressed
                        createCardDialog.closeDialog();
                    // @ts-ignore - TS2551: auto-suppressed
                    } else if (createCardDialog.close) {
                        // @ts-ignore - TS2551: auto-suppressed
                        createCardDialog.close();
                    // @ts-ignore - TS2339: auto-suppressed
                    } else if (createCardDialog.opened !== undefined) {
                        // @ts-ignore - TS2339: auto-suppressed
                        createCardDialog.opened = false;
                    }

                    // Also try removing it from DOM as last resort
                    try {
                        createCardDialog.remove();
                        lcardsLog.trace('[MSDCardPickerManager] Removed hui-dialog-create-card from DOM');
                    } catch (e) {
                        lcardsLog.trace('[MSDCardPickerManager] Could not remove dialog:', e.message);
                    }
                }
            }

            // Wait for picker to load
            await new Promise(resolve => setTimeout(resolve, 100));

            if (customElements.get("hui-card-picker")) {
                lcardsLog.debug('[MSDCardPickerManager] ✅ hui-card-picker loaded via ll-create-card event');
            } else {
                lcardsLog.trace('[MSDCardPickerManager] hui-card-picker not loaded after event');
            }

        } catch (e) {
            lcardsLog.trace('[MSDCardPickerManager] loadCustomElements failed:', e.message);
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
