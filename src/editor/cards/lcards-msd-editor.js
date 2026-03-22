/**
 * @fileoverview LCARdS MSD Editor
 *
 * Visual configuration editor for MSD (Master Systems Display) cards.
 * Minimal launcher editor that opens full-screen studio for all configuration.
 *
 * Architecture:
 * - Single "Configuration" tab with studio launcher button
 * - Card metadata summary (SVG source, anchor/control/line counts)
 * - Integration with utility tabs (DataSources, Templates, Rules, YAML, etc.)
 * - Opens lcards-msd-studio-dialog for visual editing
 *
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { fireEvent } from 'custom-card-helpers';
import { configToYaml } from '../utils/yaml-utils.js';

// Import shared form components
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Import MSD Configuration Studio dialog
import '../dialogs/lcards-msd-studio-dialog.js';

export class LCARdSMSDEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'msd';
        this._cardPickerDialogRef = null;
        lcardsLog.debug('[LCARdSMSDEditor] Editor initialized with cardType: msd (1 tab: Configuration Studio launcher)');
    }

    /**
     * Set up event listener for card picker requests from nested MSD Studio
     * @override
     */
    connectedCallback() {
        super.connectedCallback();
        this._boundHandleCardPickerRequest = this._handleCardPickerRequest.bind(this);
        document.addEventListener('open-card-picker', this._boundHandleCardPickerRequest);
        lcardsLog.debug('[MSDEditor] Listening for card picker requests from MSD Studio');
    }

    /**
     * Clean up event listener
     * @override
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._boundHandleCardPickerRequest) {
            document.removeEventListener('open-card-picker', this._boundHandleCardPickerRequest);
        }
        if (this._cardPickerDialogRef) {
            this._cardPickerDialogRef.remove();
            this._cardPickerDialogRef = null;
        }
    }

    /**
     * Define editor tabs - 1-tab structure + utility tabs
     * MSD Configuration Studio handles all visual editing
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Configuration', content: () => this._renderConfigurationTab() },
            ...this._getUtilityTabs()
        ];
    }

    // ============================================================================
    // TAB 1: CONFIGURATION
    // ============================================================================

    /**
     * Configuration Tab - Studio launcher and card metadata
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigurationTab() {
        return html`
            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>🖼️ MSD Configuration Studio</h3>
                    <p>
                        <strong>Full-screen visual editor</strong> with live preview
                        <br />
                        Build your Master Systems Display visually with instant feedback.
                        Configure backgroups, place controls, connect lines, add animations, and manage routing channels graphically.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        raised
                        @click=${this._openMsdStudio}>
                        <ha-icon icon="mdi:monitor-dashboard" slot="start"></ha-icon>
                        Open Configuration Studio
                    </ha-button>
                </div>
            </div>

            <!-- Card Identification -->
            <lcards-form-section
                header="Card Identification"
                description="Unique identifier for rules engine targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'id', {
                    label: 'Card ID',
                    helper: 'Unique identifier for rules engine targeting'
                })}

                ${FormField.renderField(this, 'tags', {
                    label: 'Tags',
                    helper: 'Tags for rules engine categorization'
                })}
            </lcards-form-section>

            <!-- Sizing -->
            <lcards-form-section
                header="Sizing"
                description="Override card dimensions — useful in stacks, overlays, or any auto-height container"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${FormField.renderField(this, 'height')}

                    ${FormField.renderField(this, 'width')}
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Handle card picker request from MSD Studio (via composed event)
     * Opens hui-card-picker in editor context (simple DOM) and proxies result back
     * @param {CustomEvent} e - open-card-picker event from MSD Studio
     * @private
     */
    async _handleCardPickerRequest(e) {
        e.stopPropagation();
        const { requestId, context } = e.detail;

        lcardsLog.debug('[MSDEditor] Card picker requested:', { requestId, context });

        // Close existing picker if open
        if (this._cardPickerDialogRef) {
            this._cardPickerDialogRef.remove();
            this._cardPickerDialogRef = null;
        }

        // Create ha-dialog (runs in editor context - simple DOM)
        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.headerTitle = 'Select Card Type';

        // Build lovelace object for hui-card-picker
        const lovelace = this._getLovelace();

        this._cardPickerDialogRef = dialog;
        document.body.appendChild(dialog);

        // Open dialog first so it's visible and upgraded
        // @ts-ignore - TS2339: auto-suppressed
        dialog.open = true;

        // Wait for dialog to render
        // @ts-ignore - TS2339: auto-suppressed
        await dialog.updateComplete;

        // Create hui-card-picker as direct child of ha-dialog
        const picker = document.createElement('hui-card-picker');

        // CRITICAL: Set hass and lovelace BEFORE appending to DOM
        // This ensures firstUpdated() has the data it needs
        // @ts-ignore - TS2339: auto-suppressed
        picker.hass = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        picker.lovelace = lovelace;

        // Style the picker
        picker.style.padding = '24px';
        picker.style.display = 'block';

        // Append directly to dialog (no wrapper div) so picker.parentElement === ha-dialog
        dialog.appendChild(picker);

        // Small delay to let custom element upgrade
        await new Promise(resolve => setTimeout(resolve, 100));

        if (picker) {
            // Force render if needed
            // @ts-ignore - TS2339: auto-suppressed
            if (typeof picker.requestUpdate === 'function') {
                // @ts-ignore - TS2339: auto-suppressed
                picker.requestUpdate();
            }

            // Wait for picker to render
            // @ts-ignore - TS2339: auto-suppressed
            if (picker.updateComplete) {
                // @ts-ignore - TS2339: auto-suppressed
                await picker.updateComplete;
            }

            // Listen for card selection
            picker.addEventListener('config-changed', (pickerEvent) => {
                // @ts-ignore - TS2339: auto-suppressed
                lcardsLog.debug('[MSDEditor] Card selected:', pickerEvent.detail?.config?.type);

                // Proxy result back to MSD Studio Dialog via document event
                const resultEvent = new CustomEvent('card-picker-result', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        requestId,
                        context,
                        // @ts-ignore - TS2339: auto-suppressed
                        config: pickerEvent.detail.config
                    }
                });
                document.dispatchEvent(resultEvent);

                // Close picker dialog
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
            });
        } else {
            lcardsLog.error('[MSDEditor] Failed to create hui-card-picker');
        }

        // Handle dialog close
        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._cardPickerDialogRef === dialog) {
                this._cardPickerDialogRef = null;
            }
        });
    }

    /**
     * Get lovelace object for hui-card-picker
     * @returns {Object} Lovelace object
     * @private
     */
    _getLovelace() {
        // hui-card-picker expects a LovelaceConfig object with views directly
        // NOT a wrapper with config.views
        let lovelaceConfig = this.lovelace?.config || this.lovelace || {};

        // Ensure views exists
        if (!lovelaceConfig.views) {
            lovelaceConfig = { ...lovelaceConfig, views: [] };
        }

        // hui-card-picker needs at least one view to render, add dummy view if empty
        if (lovelaceConfig.views.length === 0) {
            lovelaceConfig = {
                ...lovelaceConfig,
                views: [{
                    title: 'Home',
                    path: 'home',
                    cards: []
                }]
            };
        }

        return lovelaceConfig;
    }

    /**
     * Open MSD Configuration Studio dialog
     * @private
     */
    async _openMsdStudio() {
        lcardsLog.debug('[MSDEditor] Opening MSD Configuration Studio');

        const dialog = document.createElement('lcards-msd-studio-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.hass = this.hass;

        // Deep clone current config
        // @ts-ignore - TS2339: auto-suppressed
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));

        // Listen for card picker results and forward to dialog
        const cardPickerResultHandler = (e) => {
            if (e.target === this) {
                lcardsLog.debug('[MSDEditor] Forwarding card-picker-result to dialog:', e.detail);
                dialog.dispatchEvent(new CustomEvent('card-picker-result', {
                    detail: e.detail
                }));
            }
        };
        this.addEventListener('card-picker-result', cardPickerResultHandler);

        // Listen for config changes
        dialog.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            lcardsLog.debug('[MSDEditor] Studio config changed:', e.detail.config);

            // Replace config entirely (don't merge)
            // @ts-ignore - TS2339: auto-suppressed
            this.config = e.detail.config;

            // Sync to YAML and notify HA
            this._isUpdatingYaml = true;
            this._yamlValue = configToYaml(this.config);
            requestAnimationFrame(() => {
                this._isUpdatingYaml = false;
            });

            fireEvent(this, 'config-changed', { config: this.config });
            this.requestUpdate();
        });

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            this.removeEventListener('card-picker-result', cardPickerResultHandler);
            dialog.remove();
        });

        // Append to body and show
        document.body.appendChild(dialog);
    }
}

// Register the custom element
customElements.define('lcards-msd-editor', LCARdSMSDEditor);
