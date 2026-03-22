/**
 * @fileoverview MSD Card Editor Launcher
 *
 * Manages native HA card editor dialog creation and lifecycle.
 * Handles picture-elements, actions-card, and nested card scenarios.
 *
 * This module provides:
 * - Programmatic creation of hui-dialog-edit-card
 * - Active child editor tracking
 * - Proper cleanup on dialog close
 * - Special handling for picture-elements element editors
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

export class MSDCardEditorLauncher {
    /**
     * @param {Object} dialogInstance - Reference to parent MSD Studio dialog
     */
    constructor(dialogInstance) {
        this.dialog = dialogInstance;
        this.dialog._activeChildEditors = new Set();
        this.dialog._editorId = `msd-studio-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Open native HA card editor for a layer's card config
     * @param {string} layerId - Layer identifier
     * @param {Object} cardConfig - Card configuration to edit
     */
    async openCardEditor(layerId, cardConfig) {
        if (!cardConfig) {
            lcardsLog.error('[MSDCardEditorLauncher] ❌ No card config provided for layer:', layerId);
            return;
        }

        const hass = this.dialog.hass;
        const mainApp = document.querySelector("home-assistant");

        if (!hass || !mainApp) {
            lcardsLog.error('[MSDCardEditorLauncher] ❌ Cannot find Home Assistant instance');
            return;
        }

        try {
            await customElements.whenDefined("hui-dialog-edit-card");

            const editorDialog = document.createElement("hui-dialog-edit-card");
            // @ts-ignore - TS2339: auto-suppressed
            editorDialog.hass = hass;

            // Add to body FIRST (important for proper initialization)
            document.body.appendChild(editorDialog);
            this.dialog._activeChildEditors.add(editorDialog);
            // @ts-ignore - TS2339: auto-suppressed
            editorDialog._parentEditorId = this.dialog._editorId;

            // Mark picture-elements cards for special tracking
            if (this._isPictureElementsCard(cardConfig)) {
                editorDialog.setAttribute("data-editing-picture-elements", "true");
                // @ts-ignore - TS2339: auto-suppressed
                editorDialog._editingPictureElements = true;
                lcardsLog.debug(`[MSDCardEditorLauncher] 🖼️ Picture-elements card detected for layer ${layerId}`);
            }

            lcardsLog.debug(`[MSDCardEditorLauncher] 🎨 Created editor for layer ${layerId}`);

            // Setup event handlers
            const boundHandleConfigChanged = this._handleDialogConfigChanged.bind(
                this,
                layerId,
                editorDialog
            );

            editorDialog.addEventListener("config-changed", boundHandleConfigChanged, {
                capture: true,
            });

            // Handle dialog close
            const handleDialogClose = () => {
                editorDialog.removeEventListener("dialog-closed", handleDialogClose);
                editorDialog.removeEventListener("config-changed", boundHandleConfigChanged, {
                    capture: true,
                });

                this.dialog._activeChildEditors.delete(editorDialog);
                lcardsLog.debug(`[MSDCardEditorLauncher] 🔒 Dialog closed for layer ${layerId}`);

                // Cleanup element edit session if active
                // @ts-ignore - TS2339: auto-suppressed
                if (editorDialog._handlingElementEdit) {
                    setTimeout(() => {
                        if (this.dialog._eventInterceptor?._elementEditSession.active &&
                            Date.now() - this.dialog._eventInterceptor._elementEditSession.timestamp > 500) {
                            this.dialog._eventInterceptor._elementEditSession.active = false;
                        }
                    }, 500);
                }

                if (editorDialog.parentNode === document.body) {
                    try {
                        document.body.removeChild(editorDialog);
                    } catch (error) {
                        lcardsLog.warn(`[MSDCardEditorLauncher] ⚠️ Error removing dialog:`, error);
                    }
                }
            };

            editorDialog.addEventListener("dialog-closed", handleDialogClose);

            // Picture-elements specific event handlers
            if (this._isPictureElementsCard(cardConfig)) {
                const handleElementUpdated = (e) => {
                    lcardsLog.debug('[MSDCardEditorLauncher] 🎨 Element updated:', e.detail);
                    // @ts-ignore - TS2339: auto-suppressed
                    editorDialog._handlingElementEdit = true;
                    if (this.dialog._eventInterceptor) {
                        this.dialog._eventInterceptor._elementEditSession.active = true;
                        this.dialog._eventInterceptor._elementEditSession.timestamp = Date.now();
                    }
                };

                editorDialog.addEventListener("element-updated", handleElementUpdated, {
                    capture: true,
                });
                editorDialog.addEventListener("show-edit-element", handleElementUpdated, {
                    capture: true,
                });
            }

            // Show the dialog
            const dialogParams = {
                cardConfig: cardConfig,
                // @ts-ignore - TS2339: auto-suppressed
                lovelaceConfig: mainApp.lovelace,
                saveCardConfig: async (savedCardConfig) => {
                    // Check if save is from element editor
                    // @ts-ignore - TS2339: auto-suppressed
                    if (editorDialog._savingFromElementEditor || editorDialog._handlingElementEdit) {
                        lcardsLog.debug('[MSDCardEditorLauncher] 💾 Save from element editor, preserving dialog');
                        // @ts-ignore - TS2339: auto-suppressed
                        editorDialog._savingFromElementEditor = false;

                        if (this.dialog._eventInterceptor) {
                            this.dialog._eventInterceptor._elementEditSession.timestamp = Date.now();
                        }

                        // Update config silently without closing
                        if (savedCardConfig) {
                            this.dialog._updateLayerCard(layerId, savedCardConfig, {
                                maintainEditorState: true,
                                fromElementEditor: true,
                            });
                        }

                        return savedCardConfig; // Prevent dialog close
                    }

                    // Normal save - update and close
                    if (!savedCardConfig) return;

                    lcardsLog.debug(`[MSDCardEditorLauncher] 💾 Saving card for layer ${layerId}`);
                    this.dialog._updateLayerCard(layerId, savedCardConfig, {
                        reason: 'layer_card_updated',
                    });
                },
            };

            // @ts-ignore - TS2339: auto-suppressed
            await editorDialog.showDialog(dialogParams);
            lcardsLog.debug(`[MSDCardEditorLauncher] ✅ Dialog shown for layer ${layerId}`);
        } catch (err) {
            lcardsLog.error('[MSDCardEditorLauncher] ❌ Error opening editor:', err);

            // Fallback: Just log error - the native approach should work
            // The import statement causes build issues, so we rely on the primary method
            lcardsLog.warn('[MSDCardEditorLauncher] ⚠️ Cannot open editor - native dialog method failed');
        }
    }

    /**
     * Handle config changes from child editor dialog
     * @param {string} layerId - Layer identifier
     * @param {Object} editorDialog - Editor dialog element
     * @param {Event} e - Config changed event
     * @private
     */
    _handleDialogConfigChanged(layerId, editorDialog, e) {
        // Check for element editor events
        if (this.dialog._eventInterceptor?._isElementEditorEvent(e)) {
            lcardsLog.debug(`[MSDCardEditorLauncher] 🎨 Element editor event for layer ${layerId}`);
            editorDialog._handlingElementEdit = true;

            // Track config for restoration if needed
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.config) {
                // @ts-ignore - TS2339: auto-suppressed
                editorDialog._lastElementConfig = JSON.parse(JSON.stringify(e.detail.config));
                editorDialog._savingFromElementEditor = true;

                // Silently update config
                // @ts-ignore - TS2339: auto-suppressed
                this.dialog._updateLayerCard(layerId, e.detail.config, {
                    maintainEditorState: true,
                    fromElementEditor: true,
                    elementEditorEvent: true,
                });
            }

            return; // Let event propagate naturally
        }

        // Stop propagation for card-level changes
        // @ts-ignore - TS2339: auto-suppressed
        if (e.target !== editorDialog && e.detail?.config) {
            e.stopPropagation();

            lcardsLog.debug(`[MSDCardEditorLauncher] 🔄 Config update for layer ${layerId}`);

            // Update silently (don't close dialog)
            // @ts-ignore - TS2339: auto-suppressed
            this.dialog._updateLayerCard(layerId, e.detail.config, {
                maintainEditorState: true,
                reason: 'layer_card_updated_from_dialog',
            });

            this.dialog.requestUpdate();
        }
    }

    /**
     * Check if card is picture-elements type
     * @param {Object} config - Card configuration
     * @returns {boolean}
     * @private
     */
    _isPictureElementsCard(config) {
        return config && config.type === "picture-elements";
    }

    /**
     * Fire HA event (fallback method)
     * @param {string} type - Event type
     * @param {Object} detail - Event detail
     * @private
     */
    _fireHAEvent(type, detail) {
        const event = new Event(type, {
            bubbles: true,
            composed: true,
            cancelable: false,
        });
        // @ts-ignore - TS2339: auto-suppressed
        event.detail = detail;
        this.dialog.dispatchEvent(event);
    }

    /**
     * Cleanup active child editors
     */
    cleanup() {
        this.dialog._activeChildEditors?.forEach((dialog) => {
            if (dialog.parentNode === document.body) {
                try {
                    document.body.removeChild(dialog);
                } catch (e) {
                    lcardsLog.warn('[MSDCardEditorLauncher] ⚠️ Error cleaning up dialog:', e);
                }
            }
        });
        this.dialog._activeChildEditors?.clear();
        lcardsLog.debug('[MSDCardEditorLauncher] 🧹 Cleanup complete');
    }
}
