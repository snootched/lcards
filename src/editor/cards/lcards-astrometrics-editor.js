/**
 * @fileoverview LCARdS Astrometrics Editor
 *
 * YAML first: points and objects are written in the YAML tab (schema
 * completion knows every object type's keys). The Configuration tab holds
 * the card-level settings: the first view, camera controls, label snapping,
 * identification and sizing. A points table and picking points on the
 * scene come later (E3 in reports/astrometrics-design.md).
 */

import { html, css } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { ensureAstrometricsSchema } from '../../cards/lcards-astrometrics-card.js';

import '../components/shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

export class LCARdSAstrometricsEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'astrometrics';
        // The schema loads lazily; the fields and YAML completion read it
        ensureAstrometricsSchema().then(() => this.requestUpdate());
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
                    <h3>Scene</h3>
                    <p>
                        Points (labels, markers, where things are) and objects (grids, volumes,
                        spheres, rings, paths, beams, images, glows) are written in the
                        <strong>YAML</strong> tab, which completes every key.
                    </p>
                    <div class="astro-stats">
                        <span><b>${points}</b> point${points === 1 ? '' : 's'}</span>
                        <span><b>${objects}</b> object${objects === 1 ? '' : 's'}</span>
                        <span><b>${views.length}</b> view${views.length === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button appearance="plain" @click=${() => window.open(docsUrl(DOCS.astrometrics), '_blank', 'noopener')}>
                        Docs
                        <ha-icon icon="mdi:open-in-new" slot="end"></ha-icon>
                    </ha-button>
                </div>
            </div>

            <lcards-form-section
                header="Camera"
                description="The first view, drag and zoom, turning"
                icon="mdi:video-3d"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${views.length ? FormField.renderField(this, 'camera.view', {
                    label: 'First view',
                    helper: 'Shown when the card opens. Views are named under camera.views in YAML.',
                    selectorOverride: { select: { mode: 'dropdown', options: views.map(v => ({ value: v, label: v })) } }
                }) : html`<div class="hint">No named views yet: the camera frames the whole scene. Add camera.views in YAML to fly between views.</div>`}

                ${FormField.renderField(this, 'camera.controls', { label: 'Drag and zoom' })}

                <div class="astro-pair">
                    ${FormField.renderField(this, 'camera.auto_rotate', {
                        label: 'Auto rotate',
                        selectorOverride: { number: { min: -30, max: 30, step: 0.5, mode: 'slider', unit_of_measurement: '°/s' } }
                    })}
                    ${FormField.renderField(this, 'camera.fly_duration', {
                        label: 'Fly-to duration',
                        selectorOverride: { number: { min: 0, max: 5000, step: 100, mode: 'box', unit_of_measurement: 'ms' } }
                    })}
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Labels"
                icon="mdi:label-outline"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${FormField.renderField(this, 'labels.snap', { label: 'Snap labels to whole pixels' })}
            </lcards-form-section>

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
