/**
 * @fileoverview LCARdS Astrometrics Editor
 *
 * The Configuration tab holds the card-level settings: the first view,
 * camera controls and buttons, label defaults, identification and sizing.
 * The Points tab is a list of the points (placement, label, marker), with
 * Pick: the next tap on the preview places the point. Objects are written
 * in the YAML tab (schema completion knows every object type's keys).
 */

import { html, css } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { ensureAstrometricsSchema } from '../../cards/lcards-astrometrics-card.js';

import '../components/shared/lcards-form-section.js';
import '../components/editors/lcards-astro-points-editor.js';
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
            { label: 'Points', content: () => this._renderPointsTab() },
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
                        Points (labels, markers, where things are) are listed in the
                        <strong>Points</strong> tab, where Pick places one with a tap on the preview.
                        Objects (grids, volumes, spheres, rings, paths, beams, images, glows) are
                        written in the <strong>YAML</strong> tab, which completes every key.
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

                ${FormField.renderField(this, 'camera.controls', { label: 'Drag, zoom, double-tap and keys' })}
                <div class="astro-pair">
                    ${FormField.renderField(this, 'camera.drag', { label: 'One-finger drag' })}
                    ${FormField.renderField(this, 'camera.pan', { label: 'Pan along' })}
                    ${FormField.renderField(this, 'camera.zoom_to', { label: 'Wheel and pinch zoom toward' })}
                    ${FormField.renderField(this, 'camera.double_tap', { label: 'Double-tap blank space' })}
                </div>
                ${FormField.renderField(this, 'camera.zoom_step', {
                    label: 'Zoom step',
                    selectorOverride: { number: { min: 1.1, max: 4, step: 0.1, mode: 'slider' } }
                })}
                ${this._renderCameraButtonsFields()}

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
                ${FormField.renderField(this, 'labels.overlap', { label: 'Overlapping labels all show' })}
                ${FormField.renderField(this, 'labels.snap', { label: 'Snap labels to whole pixels' })}
                <div class="astro-pair">
                    ${FormField.renderField(this, 'labels.default.position', { label: 'Default position' })}
                    ${FormField.renderField(this, 'labels.default.font_size', { label: 'Default font size' })}
                    ${FormField.renderField(this, 'labels.default.font_weight', { label: 'Default weight' })}
                    ${FormField.renderField(this, 'labels.default.text_transform', { label: 'Default case' })}
                </div>
                <div class="hint">Every point label inherits these. Label styles (labels.styles) are written in YAML.</div>
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

    /**
     * camera.buttons: on or off, and where (true is every button at bottom-right).
     * @private
     */
    _renderCameraButtonsFields() {
        const b = this.config?.camera?.buttons;
        const on = !!b;
        const o = b && typeof b === 'object' ? b : {};
        /** @param {Record<string, any>} patch */
        const set = (patch) => this._updateConfig({ camera: { buttons: { ...o, ...patch } } });
        return html`
            <ha-selector .hass=${this.hass} .required=${false} .label=${'On-card buttons (pan, zoom, reset)'} .value=${on}
                .selector=${{ boolean: {} }}
                @value-changed=${(/** @type {CustomEvent} */ e) => this._updateConfig({ camera: { buttons: e.detail.value ? true : false } })}>
            </ha-selector>
            ${on ? html`
                <div class="astro-pair">
                    <ha-selector .hass=${this.hass} .required=${false} .label=${'Buttons position'} .value=${o.position ?? 'bottom-right'}
                        .selector=${{ select: { mode: 'dropdown', options: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(p => ({ value: p, label: p })) } }}
                        @value-changed=${(/** @type {CustomEvent} */ e) => set({ position: e.detail.value })}>
                    </ha-selector>
                    <div></div>
                    ${['pan', 'zoom', 'reset'].map(k => html`
                        <ha-selector .hass=${this.hass} .required=${false} .label=${k === 'pan' ? 'Pan arrows' : k === 'zoom' ? 'Zoom in and out' : 'Reset'} .value=${o[k] !== false}
                            .selector=${{ boolean: {} }}
                            @value-changed=${(/** @type {CustomEvent} */ e) => set({ [k]: e.detail.value })}>
                        </ha-selector>`)}
                </div>` : ''}
        `;
    }

    /**
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderPointsTab() {
        return html`
            <lcards-astro-points-editor
                .hass=${this.hass}
                .config=${this.config ?? {}}
                @points-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._updateConfig({ points: e.detail.value }); }}>
            </lcards-astro-points-editor>
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
