/**
 * LCARdS MSD Editor
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
 * @extends {LCARdSBaseEditor}
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
        lcardsLog.debug('[LCARdSMSDEditor] Editor initialized with cardType: msd (1 tab: Configuration Studio launcher)');
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
                        Configure base SVG, anchors, control overlays, lines, and routing channels
                    </p>
                    <p style="font-size: 13px; color: var(--secondary-text-color);">
                        Build your Master Systems Display visually with instant feedback.
                        Place controls, connect lines, and manage routing channels graphically.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        raised
                        @click=${this._openMsdStudio}>
                        <ha-icon icon="mdi:monitor-dashboard" slot="icon"></ha-icon>
                        Open Configuration Studio
                    </ha-button>
                </div>
            </div>

            <!-- Card Metadata Summary -->
            <lcards-form-section
                header="Card Metadata"
                description="Current MSD configuration overview"
                icon="mdi:information"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${this._renderCardMetadataSummary()}

            </lcards-form-section>

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

                ${FormField.renderField(this, 'name', {
                    label: 'Name',
                    helper: 'Display name for the MSD card (optional)'
                })}

                ${FormField.renderField(this, 'tags', {
                    label: 'Tags',
                    helper: 'Tags for rules engine categorization'
                })}
            </lcards-form-section>
        `;
    }

    /**
     * Render card metadata summary
     * Shows current base SVG, anchor count, overlay counts
     * @returns {TemplateResult}
     * @private
     */
    _renderCardMetadataSummary() {
        const baseSvgSummary = this._getBaseSvgSummary();
        const anchorCount = this._getAnchorCount();
        const controlCount = this._getControlCount();
        const lineCount = this._getLineCount();

        return html`
            <div style="display: grid; gap: 12px;">
                <!-- Base SVG -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-icon icon="mdi:image" style="color: var(--primary-color);"></ha-icon>
                    <div style="flex: 1;">
                        <strong>Base SVG:</strong> ${baseSvgSummary}
                    </div>
                </div>

                <!-- Anchors -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-icon icon="mdi:map-marker" style="color: var(--primary-color);"></ha-icon>
                    <div style="flex: 1;">
                        <strong>Anchors:</strong> ${anchorCount}
                    </div>
                </div>

                <!-- Control Overlays -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-icon icon="mdi:widgets" style="color: var(--primary-color);"></ha-icon>
                    <div style="flex: 1;">
                        <strong>Control Overlays:</strong> ${controlCount}
                    </div>
                </div>

                <!-- Line Overlays -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-icon icon="mdi:vector-line" style="color: var(--primary-color);"></ha-icon>
                    <div style="flex: 1;">
                        <strong>Line Overlays:</strong> ${lineCount}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get base SVG summary text
     * @returns {string}
     * @private
     */
    _getBaseSvgSummary() {
        const msdConfig = this.config?.msd;
        if (!msdConfig?.base_svg) {
            return html`<span style="color: var(--secondary-text-color);">Not configured</span>`;
        }

        const baseSvg = msdConfig.base_svg;
        if (baseSvg.builtin) {
            return html`<span style="color: var(--success-color);">Builtin: ${baseSvg.builtin}</span>`;
        } else if (baseSvg.path) {
            return html`<span style="color: var(--info-color);">Custom: ${baseSvg.path}</span>`;
        } else if (baseSvg.inline) {
            return html`<span style="color: var(--info-color);">Inline SVG</span>`;
        }

        return html`<span style="color: var(--secondary-text-color);">Unknown</span>`;
    }

    /**
     * Get anchor count
     * @returns {number}
     * @private
     */
    _getAnchorCount() {
        const msdConfig = this.config?.msd;
        if (!msdConfig?.anchors) return 0;
        return Object.keys(msdConfig.anchors).length;
    }

    /**
     * Get control overlay count
     * @returns {number}
     * @private
     */
    _getControlCount() {
        const msdConfig = this.config?.msd;
        if (!msdConfig?.overlays) return 0;
        return msdConfig.overlays.filter(o => o.type === 'control').length;
    }

    /**
     * Get line overlay count
     * @returns {number}
     * @private
     */
    _getLineCount() {
        const msdConfig = this.config?.msd;
        if (!msdConfig?.overlays) return 0;
        return msdConfig.overlays.filter(o => o.type === 'line').length;
    }

    /**
     * Open MSD Configuration Studio dialog
     * @private
     */
    async _openMsdStudio() {
        lcardsLog.debug('[MSDEditor] Opening MSD Configuration Studio');

        const dialog = document.createElement('lcards-msd-studio-dialog');
        dialog.hass = this.hass;

        // Deep clone current config
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));

        // Listen for config changes
        dialog.addEventListener('config-changed', (e) => {
            lcardsLog.debug('[MSDEditor] Studio config changed:', e.detail.config);

            // Replace config entirely (don't merge)
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
customElements.define('lcards-msd-editor', LCARdSMSDEditor);
