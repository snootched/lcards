/**
 * @fileoverview LCARdS Data Grid Editor
 *
 * Visual configuration editor for data grid cards with 1-tab structure.
 * Supports 3 data modes: random (decorative), template (manual), datasource (real-time).
 * All configuration is done through the Configuration Studio (full-screen visual editor).
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

// Import specialized editor components
import '../components/editors/lcards-object-editor.js';
import '../components/editors/lcards-grid-layout.js';

// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';

// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';

// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';

// Import theme browser
import '../components/theme-browser/lcards-theme-token-browser-tab.js';

// Import provenance tab
import '../components/provenance/lcards-provenance-tab.js';

// Import Configuration Studio dialog (V4 - with WYSIWYG editing)
import '../dialogs/lcards-data-grid-studio-dialog.js';

export class LCARdSDataGridEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'data-grid';
        lcardsLog.debug('[LCARdSDataGridEditor] Editor initialized with cardType: data-grid (1 tab: Configuration Studio launcher)');
    }

    /**
     * Define editor tabs - 1-tab structure + utility tabs
     * Configuration Studio handles all visual editing
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
     * Configuration Tab - Studio launcher and quick settings
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigurationTab() {
        return html`
            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>🎨 Configuration Studio</h3>
                    <p>
                        <strong>Full-screen immersive workspace</strong> with live preview
                        <br />
                        Visual grid designer, contextual controls, and real-time updates
                    </p>
                    <p style="font-size: 13px; color: var(--secondary-text-color);">
                        Build your data grid visually with instant feedback. Perfect for beginners and power users alike.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        raised
                        @click=${this._openConfigurationStudio}>
                        <ha-icon icon="mdi:pencil-ruler" slot="start"></ha-icon>
                        Open Configuration Studio
                    </ha-button>
                </div>
            </div>

            <!-- Card Identification -->
            <lcards-form-section
                header="Card Identification"
                description="Identification for rules engine targeting"
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
     * Open Configuration Studio dialog
     * @private
     */
    async _openConfigurationStudio() {
        lcardsLog.debug('[DataGridEditor] Opening Configuration Studio V4');

        const dialog = document.createElement('lcards-data-grid-studio-dialog-v4');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.hass = this.hass;

        // Deep clone current config
        // @ts-ignore - TS2339: auto-suppressed
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));

        // Listen for config changes
        dialog.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            lcardsLog.debug('[DataGridEditor] Studio config changed:', e.detail.config);

            // CRITICAL: Replace config entirely, don't merge
            // The studio has already cleaned up mode-specific properties
            // If we merge, deleted keys will persist from the old config
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
            dialog.remove();
        });

        // Append to body and show
        document.body.appendChild(dialog);
    }
}

// Register the custom element
customElements.define('lcards-data-grid-editor', LCARdSDataGridEditor);
