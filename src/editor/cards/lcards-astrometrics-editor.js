/**
 * @fileoverview LCARdS Astrometrics Editor
 *
 * A launcher for the Astrometrics Studio (points, objects, camera views and
 * scene settings with a live preview), plus identification and sizing. The
 * YAML tab holds the whole config (schema completion knows every key).
 */

import { html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { configToYaml } from '../utils/yaml-utils.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';
import { ensureAstrometricsSchema } from '../../cards/lcards-astrometrics-card.js';

import '../components/shared/lcards-form-section.js';
import '../dialogs/lcards-astrometrics-studio-dialog.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

export class LCARdSAstrometricsEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'astrometrics';
        /** @type {any} Open studio dialog, kept in sync with hass */
        this._studio = null;
        // The schema loads lazily; the fields and YAML completion read it
        ensureAstrometricsSchema().then(() => this.requestUpdate());
    }

    /** @param {Map<string, unknown>} changedProps */
    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('hass') && this._studio) this._studio.hass = this.hass;
    }

    /**
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Configuration', content: () => this._renderConfigurationTab() },
            ...this._getUtilityTabs()
        ];
    }

    /**
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderConfigurationTab() {
        const config = this.config ?? {};
        const points = Array.isArray(config.points) ? config.points.length : 0;
        const objects = Array.isArray(config.objects) ? config.objects.length : 0;
        const views = Object.keys(config.camera?.views ?? {});
        return html`
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Astrometrics Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with the live scene: points and objects
                        (tap one on the scene to edit it), camera views and scene settings.
                    </p>
                    <div class="astro-stats">
                        <span><b>${points}</b> point${points === 1 ? '' : 's'}</span>
                        <span><b>${objects}</b> object${objects === 1 ? '' : 's'}</span>
                        <span><b>${views.length}</b> view${views.length === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button @click=${this._openStudio}>
                        <ha-icon icon="mdi:pencil-ruler" slot="start"></ha-icon>
                        Open Astrometrics Studio
                    </ha-button>
                    <ha-button appearance="plain" @click=${() => window.open(docsUrl(DOCS.astrometricsStudio), '_blank', 'noopener')}>
                        Docs
                        <ha-icon icon="mdi:open-in-new" slot="end"></ha-icon>
                    </ha-button>
                </div>
            </div>

            <lcards-form-section
                header="Card Identification"
                description="Identification for rules engine targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${FormField.renderField(this, 'id', { label: 'Card ID', helper: 'Unique identifier for rules engine targeting' })}
                ${FormField.renderField(this, 'tags', { label: 'Tags', helper: 'Tags for rules engine categorization' })}
            </lcards-form-section>

            <lcards-form-section
                header="Sizing"
                description="The scene fills the card"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                <div class="astro-pair">
                    ${FormField.renderField(this, 'height', { label: 'Height' })}
                    ${FormField.renderField(this, 'width', { label: 'Width' })}
                    ${FormField.renderField(this, 'min_height')}
                    ${FormField.renderField(this, 'max_height')}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `;
    }

    /**
     * Open the Astrometrics Studio on a copy of the config; Save replaces the
     * config (deleted keys must go).
     * @private
     */
    _openStudio() {
        const dialog = /** @type {any} */ (document.createElement('lcards-astrometrics-studio-dialog'));
        dialog.hass = this.hass;
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));
        this._studio = dialog;
        dialog.addEventListener('config-changed', (/** @type {CustomEvent} */ e) => {
            this.config = e.detail.config;
            this._isUpdatingYaml = true;
            this._yamlValue = configToYaml(this.config);
            requestAnimationFrame(() => { this._isUpdatingYaml = false; });
            fireEvent(this, 'config-changed', { config: this.config });
            this.requestUpdate();
        });
        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._studio === dialog) this._studio = null;
        });
        mountDialogNearHomeAssistant(dialog, this);
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .astro-stats { display: flex; gap: var(--ha-space-4); margin: var(--ha-space-2) 0 var(--ha-space-1); font-size: 13px; color: var(--primary-text-color); }
                .astro-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
                .astro-pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2); }
            `
        ];
    }
}

if (!customElements.get('lcards-astrometrics-editor')) {
    customElements.define('lcards-astrometrics-editor', LCARdSAstrometricsEditor);
}
