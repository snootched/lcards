/**
 * @fileoverview LCARdS Data Grid Editor
 *
 * Launcher for the Data Grid Configuration Studio plus identification/sizing.
 *
 * Legacy data grid configs are upgraded to the current format when the editor
 * opens: the first setConfig() fires config-changed once, so HA's Save persists
 * the upgrade and Cancel discards it. Later setConfig() calls (HA re-sends the
 * config on every keystroke in its code editor) only migrate for display and
 * never fire, so legacy YAML being typed is not rewritten.
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { fireEvent } from 'custom-card-helpers';
import { configToYaml } from '../utils/yaml-utils.js';
import { migrateDataGridConfig } from '../../data-grid/data-grid-config-migration.js';

// Import shared form components
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';

// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';

// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';

// Import theme browser

// Import provenance tab
import '../components/provenance/lcards-provenance-tab.js';

// Import Configuration Studio dialog
import '../dialogs/lcards-data-grid-studio-dialog.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';

export class LCARdSDataGridEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'data-grid';
        /** Set once: only the first setConfig() after opening may upgrade. */
        this._openedConfigSeen = false;
        /** @type {string[]} Migration notes shown in the upgrade notice */
        this._upgradeNotes = [];
        /** @type {any} Open studio dialog, kept in sync with hass */
        this._studio = null;
    }

    /**
     * Migrate legacy configs before the base editor clones/validates them.
     * @param {Object} config
     * @override
     */
    setConfig(config) {
        const { config: migrated, changed, notes } = migrateDataGridConfig(config);
        const firstCall = !this._openedConfigSeen;
        this._openedConfigSeen = true;

        super.setConfig(migrated);

        if (firstCall && changed) {
            this._upgradeNotes = notes;
            lcardsLog.info('[LCARdSDataGridEditor] Upgraded legacy data grid config', notes);
            // After the first render, so HA has the editor wired up.
            this.updateComplete.then(() => fireEvent(this, 'config-changed', { config: this.config }));
        }
    }

    /** @param {Map<string, unknown>} changedProps */
    updated(changedProps) {
        super.updated?.(changedProps);
        if (changedProps.has('hass') && this._studio) this._studio.hass = this.hass;
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
            ${this._upgradeNotes.length ? html`
                <lcards-message type="info" title="Data grid format upgraded">
                    This card was upgraded to the current data grid format
                    (${this._upgradeNotes.join('; ')}). Save to keep the change.
                </lcards-message>
            ` : ''}

            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Data Grid Configuration Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with live preview: grid layout,
                        cells, styles, animations and more.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
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
                description="Override card dimensions: useful in stacks, overlays, or any auto-height container"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2);">
                    ${FormField.renderField(this, 'height')}

                    ${FormField.renderField(this, 'width')}

                    ${FormField.renderField(this, 'min_height')}

                    ${FormField.renderField(this, 'min_width')}

                    ${FormField.renderField(this, 'max_height')}

                    ${FormField.renderField(this, 'max_width')}

                    ${FormField.renderField(this, 'overflow')}

                    ${FormField.renderField(this, 'z_index')}

                    ${FormField.renderField(this, 'overflow_x')}

                    ${FormField.renderField(this, 'overflow_y')}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `;
    }

    /**
     * Open Configuration Studio dialog
     * @private
     */
    async _openConfigurationStudio() {
        const dialog = /** @type {any} */ (document.createElement('lcards-data-grid-studio-dialog-v4'));
        dialog.hass = this.hass;
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));
        this._studio = dialog;

        // Studio sends the whole config: replace, don't merge (deleted keys must go)
        dialog.addEventListener('config-changed', (/** @type {CustomEvent} */ e) => {
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

        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._studio === dialog) this._studio = null;
        });

        mountDialogNearHomeAssistant(dialog, this);
    }
}

// Register the custom element
if (!customElements.get('lcards-data-grid-editor')) customElements.define('lcards-data-grid-editor', LCARdSDataGridEditor);
