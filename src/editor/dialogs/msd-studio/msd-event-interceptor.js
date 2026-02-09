/**
 * MSD Event Interceptor
 *
 * Handles complex event interception for MSD Studio.
 * Prevents unwanted event propagation while preserving nested editor functionality.
 *
 * This is critical for:
 * - Preventing card picker events from closing the studio dialog
 * - Allowing element editors (picture-elements) to function properly
 * - Managing event flow between nested dialogs
 *
 * Adapted from simple-swipe-card's battle-tested event handling patterns.
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

export class MSDEventInterceptor {
    /**
     * @param {Object} dialogInstance - Reference to parent MSD Studio dialog
     */
    constructor(dialogInstance) {
        this.dialog = dialogInstance;
        this._boundCardPickerHandler = null;
        this._boundDialogClosedHandler = null;
        this._boundElementEditorHandler = null;
        this._elementEditSession = {
            active: false,
            timestamp: null,
            savedState: null
        };
        this._lastElementEditorLogTime = 0;
        this._elementEditorLogThrottle = 1000;
    }

    /**
     * Setup all event interception (call in connectedCallback)
     */
    setupEventInterception() {
        // Card picker event handler (capture phase)
        this._boundCardPickerHandler = (e) => {
            // Check for element editor events first
            if (this._isElementEditorEvent(e)) {
                lcardsLog.debug('[MSDEventInterceptor] Element editor event, allowing propagation');
                this._elementEditSession.active = true;
                this._elementEditSession.timestamp = Date.now();
                return; // Let it propagate naturally
            }

            // Only process hui-card-picker events
            if (e.type === "config-changed" && e.detail?.config) {
                if (e.target?.tagName?.toLowerCase() === "hui-card-picker") {
                    const path = e.composedPath ? e.composedPath() : [];
                    
                    // Check if event is from our studio
                    if (this._isEventFromOurStudio(path)) {
                        lcardsLog.debug('[MSDEventInterceptor] 🎯 Card picker selection captured:', e.detail.config.type);
                        
                        // Stop propagation to prevent studio closure
                        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                        e.stopPropagation();
                        
                        // Process card addition
                        this.dialog._handleCardPickerSelection(e.detail.config);
                        return false;
                    }
                }
            }
        };

        // Dialog closed handler
        this._boundDialogClosedHandler = (e) => {
            if (e.target?.tagName === "HUI-DIALOG-EDIT-CARD") {
                const dialog = e.target;
                if (this.dialog._activeChildEditors?.has(dialog)) {
                    lcardsLog.debug('[MSDEventInterceptor] 🔒 Child editor closed');
                    this.dialog._activeChildEditors.delete(dialog);
                    
                    // End element edit session if this was handling element edits
                    if (dialog._handlingElementEdit) {
                        setTimeout(() => {
                            if (this._elementEditSession.active && 
                                Date.now() - this._elementEditSession.timestamp > 500) {
                                this._elementEditSession.active = false;
                            }
                        }, 500);
                    }
                    
                    this.dialog.requestUpdate();
                }
            }
        };

        // Element editor event handlers
        this._boundElementEditorHandler = (e) => {
            if ((e.type === "element-updated" || e.type === "show-edit-element") &&
                !this._elementEditSession.active) {
                lcardsLog.debug('[MSDEventInterceptor] 🎨 Element editor session started');
                this._elementEditSession.active = true;
                this._elementEditSession.timestamp = Date.now();
            }
        };

        // Register capture phase listeners
        document.addEventListener("config-changed", this._boundCardPickerHandler, {
            capture: true,
        });
        
        document.addEventListener("dialog-closed", this._boundDialogClosedHandler, {
            capture: true,
        });

        document.addEventListener("element-updated", this._boundElementEditorHandler, {
            capture: true,
        });

        document.addEventListener("show-edit-element", this._boundElementEditorHandler, {
            capture: true,
        });

        lcardsLog.debug('[MSDEventInterceptor] ✅ Event interception setup complete');
    }

    /**
     * Comprehensive detection for element editor events
     * Critical for picture-elements cards
     * @param {Event} e - Event to check
     * @returns {boolean}
     * @private
     */
    _isElementEditorEvent(e) {
        if (!e) return false;

        const now = Date.now();
        const shouldLog = now - this._lastElementEditorLogTime > this._elementEditorLogThrottle;

        // Check event detail for element editor markers
        if (e.detail) {
            if (e.detail.fromElementEditor || e.detail.elementConfig || 
                e.detail.elementToEdit || e.detail.element) {
                if (shouldLog) {
                    lcardsLog.debug('[MSDEventInterceptor] 🔍 Element editor detected via event detail');
                    this._lastElementEditorLogTime = now;
                }
                return true;
            }
        }

        // Check event path for element editor components
        const path = e.composedPath ? e.composedPath() : [];
        for (const node of path) {
            if (!node || !node.localName) continue;

            if (node.localName === "hui-element-editor" ||
                node.localName === "hui-dialog-edit-element" ||
                node.localName === "hui-card-element-editor" ||
                node.localName.includes("element-editor")) {
                if (shouldLog) {
                    lcardsLog.debug('[MSDEventInterceptor] 🔍 Element editor detected via path:', node.localName);
                    this._lastElementEditorLogTime = now;
                }
                return true;
            }
        }

        // Check active element editing session
        if (this._elementEditSession.active &&
            Date.now() - this._elementEditSession.timestamp < 5000) {
            return true;
        }

        return false;
    }

    /**
     * Check if event path includes our studio dialog
     * @param {Array} path - Event composed path
     * @returns {boolean}
     * @private
     */
    _isEventFromOurStudio(path) {
        return path.some((node) => {
            return node === this.dialog ||
                   (node.shadowRoot && node.shadowRoot.contains(this.dialog)) ||
                   (this.dialog.shadowRoot && this.dialog.shadowRoot.contains(node));
        });
    }

    /**
     * Cleanup all event listeners (call in disconnectedCallback)
     */
    cleanupEventInterception() {
        if (this._boundCardPickerHandler) {
            document.removeEventListener("config-changed", this._boundCardPickerHandler, {
                capture: true,
            });
        }
        
        if (this._boundDialogClosedHandler) {
            document.removeEventListener("dialog-closed", this._boundDialogClosedHandler, {
                capture: true,
            });
        }

        if (this._boundElementEditorHandler) {
            document.removeEventListener("element-updated", this._boundElementEditorHandler, {
                capture: true,
            });
            document.removeEventListener("show-edit-element", this._boundElementEditorHandler, {
                capture: true,
            });
        }

        lcardsLog.debug('[MSDEventInterceptor] 🧹 Event interception cleanup complete');
    }
}
