/**
 * @fileoverview LCARdS Chart Editor
 *
 * Launcher for the Chart Configuration Studio plus identification/sizing.
 *
 * Legacy chart configs are upgraded to the current sources[] format when the
 * editor opens: the first setConfig() fires config-changed once, so HA's Save
 * persists the upgrade and Cancel discards it. Later setConfig() calls (HA
 * re-sends the config on every keystroke in its code editor) only migrate for
 * display and never fire, so legacy YAML being typed is not rewritten.
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { fireEvent } from 'custom-card-helpers';
import { configToYaml } from '../utils/yaml-utils.js';
import { migrateChartConfig } from '../../charts/chart-config-migration.js';

// Import shared form components
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Import Chart Configuration Studio dialog
import '../dialogs/lcards-chart-studio-dialog.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';

export class LCARdSChartEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'chart';
        /** Set once: only the first setConfig() after opening may upgrade. */
        this._openedConfigSeen = false;
        /** @type {string[]} Migration notes shown in the upgrade notice */
        this._upgradeNotes = [];
    }

    /**
     * Migrate legacy configs before the base editor clones/validates them.
     * @param {Object} config
     * @override
     */
    setConfig(config) {
        const { config: migrated, changed, notes } = migrateChartConfig(config);
        const firstCall = !this._openedConfigSeen;
        this._openedConfigSeen = true;

        super.setConfig(migrated);

        if (firstCall && changed) {
            this._upgradeNotes = notes;
            lcardsLog.info('[LCARdSChartEditor] Upgraded legacy chart config', notes);
            // After the first render, so HA has the editor wired up.
            this.updateComplete.then(() => fireEvent(this, 'config-changed', { config: this.config }));
        }
    }

    /**
     * Define editor tabs - 1-tab structure + utility tabs
     * Chart Configuration Studio handles all visual editing
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
                <ha-alert alert-type="info" title="Chart format upgraded">
                    This card was upgraded to the current chart format. Save to keep the change.
                </ha-alert>
            ` : ''}

            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Chart Configuration Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with live preview: series, time span,
                        axes, colours, animations and more.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        @click=${this._openChartStudio}>
                        <ha-icon icon="mdi:chart-line" slot="start"></ha-icon>
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
                    ${FormField.renderField(this, 'height', { label: 'Height' })}

                    ${FormField.renderField(this, 'width', { label: 'Width' })}

                    ${FormField.renderField(this, 'min_height', { label: 'Min Height' })}

                    ${FormField.renderField(this, 'min_width', { label: 'Min Width' })}

                    ${FormField.renderField(this, 'max_height', { label: 'Max Height' })}

                    ${FormField.renderField(this, 'max_width', { label: 'Max Width' })}

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
     * Open Chart Configuration Studio dialog
     * @private
     */
    async _openChartStudio() {
        lcardsLog.debug('[ChartEditor] Opening Chart Configuration Studio');

        const dialog = /** @type {any} */ (document.createElement('lcards-chart-studio-dialog'));
        dialog.hass = this.hass;
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));

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

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        // Append to body and show
        mountDialogNearHomeAssistant(dialog, this);
    }
}

// Register the custom element
if (!customElements.get('lcards-chart-editor')) customElements.define('lcards-chart-editor', LCARdSChartEditor);
