/**
 * @fileoverview LCARdS Chart Editor
 *
 * Visual configuration editor for chart cards with 1-tab structure.
 * Supports 16 chart types with comprehensive styling and data visualization features.
 * All configuration is done through the Chart Configuration Studio (full-screen visual editor).
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

// Import Chart Configuration Studio dialog
import '../dialogs/lcards-chart-studio-dialog.js';

export class LCARdSChartEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'chart';
        lcardsLog.debug('[LCARdSChartEditor] Editor initialized with cardType: chart (1 tab: Configuration Studio launcher)');
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
            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>📊 Chart Configuration Studio</h3>
                    <p>
                        <strong>Full-screen immersive workspace</strong> with live preview
                        <br />
                        Visual chart designer, 16 chart types, and comprehensive styling
                    </p>
                    <p style="font-size: 13px; color: var(--secondary-text-color);">
                        Build your chart visually with instant feedback. Configure data sources, colors, animations, and more.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        raised
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
                description="Override card dimensions — useful in stacks, overlays, or any auto-height container"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${FormField.renderField(this, 'height', { label: 'Height' })}

                    ${FormField.renderField(this, 'width', { label: 'Width' })}
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Open Chart Configuration Studio dialog
     * @private
     */
    async _openChartStudio() {
        lcardsLog.debug('[ChartEditor] Opening Chart Configuration Studio');

        const dialog = document.createElement('lcards-chart-studio-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.hass = this.hass;

        // Deep clone current config
        // @ts-ignore - TS2339: auto-suppressed
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));

        // Listen for config changes
        dialog.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            lcardsLog.debug('[ChartEditor] Studio config changed:', e.detail.config);

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
            dialog.remove();
        });

        // Append to body and show
        document.body.appendChild(dialog);
    }
}

// Register the custom element
customElements.define('lcards-chart-editor', LCARdSChartEditor);
