/**
 * @fileoverview LCARdS Text Field Editor: the settings of one text field
 * (content, position, font, alignment, padding, background, colours).
 *
 * Shared by `lcards-multi-text-editor-v2` (the button, elbow and slider
 * text fields) and the Astrometrics Studio's labels. Every field goes through
 * `FormField.renderField(editor, '<basePath>.<key>')`, and a key whose schema
 * the editor does not know is left out, so a host whose text fields take
 * fewer keys (astrometrics labels: no anchor, baseline or fill sizing) gets
 * only its own. A section with none of its keys is left out too.
 *
 * @example
 * <lcards-text-field-editor .editor=${this} .config=${this.config} basePath="text.name" name="name">
 * </lcards-text-field-editor>
 */

import { LitElement, html, css, nothing } from 'lit';
import '../shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../shared/lcards-form-field.js';
import './lcards-color-section-v2.js';
import './lcards-padding-editor.js';

/** Colour states every text field offers */
const SUGGESTED_STATES = ['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero'];

export class LCARdSTextFieldEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },       // Host editor: _getSchemaForPath, _getConfigValue, _setConfigValue
            config: { type: Object },       // The host's config (re-renders on change)
            basePath: { type: String },     // Path of the field: text.name, labels.default, ...
            name: { type: String },         // The field's name, for labels ("Show Name")
            inherits: { type: Boolean },    // Unset keys inherit from defaults (helper text says so)
            zones: { type: Object },        // Named zones for routing (shown when more than one)
            suggestedStates: { type: Array }, // Colour states offered (default: the entity states)
            omit: { type: Array }           // Keys the host edits elsewhere (a point's label content)
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.editor = null;
        /** @type {any} */
        this.config = null;
        this.basePath = '';
        this.name = '';
        this.inherits = false;
        /** @type {Record<string, any> | null} */
        this.zones = null;
        this.suggestedStates = SUGGESTED_STATES;
        /** @type {string[]} */
        this.omit = [];
    }

    static get styles() {
        return css`
            :host { display: block; }
        `;
    }

    /** @param {string} key */
    _has(key) {
        if (this.omit?.includes(key)) return false;
        return !!this.editor?._getSchemaForPath?.(`${this.basePath}.${key}`);
    }

    /** @param {string} key */
    _value(key) {
        return this.editor?._getConfigValue?.(`${this.basePath}.${key}`);
    }

    /**
     * One key's field, or nothing when the host's schema has no such key.
     * @param {string} key
     * @param {{ label?: string, helper?: string }} opts
     */
    _field(key, opts) {
        if (!this._has(key)) return nothing;
        return FormField.renderField(this.editor, `${this.basePath}.${key}`, opts);
    }

    /**
     * Helper text that says the key inherits while it is not set.
     * @param {string} key @param {string} own @param {string} [inherited]
     */
    _help(key, own, inherited = 'Inherits from defaults') {
        return this.inherits && this._value(key) === undefined ? inherited : own;
    }

    render() {
        const p = this.basePath;
        const title = this.name ? this.name.charAt(0).toUpperCase() + this.name.slice(1) : '';
        const zones = this.zones && Object.keys(this.zones).length > 1 ? this.zones : null;
        const any = (/** @type {string[]} */ keys) => keys.some((k) => this._has(k));
        return html`
            ${this._field('show', { label: title ? `Show ${title}` : 'Show' })}
            ${this._field('content', { label: 'Content', helper: 'Text content: supports templates like {entity.state}' })}
            ${this._field('display_format', {
                label: 'Display Format',
                helper: this._help('display_format', 'How entity state tokens are rendered: friendly, raw, parts, or unit',
                    'Inherits from defaults: friendly = translated by Home Assistant, raw = actual state, parts = value+unit, unit = unit only')
            })}
            ${this._field('position', { label: 'Position', helper: 'Where to display this text' })}

            ${zones ? html`
                <ha-selector
                    .hass=${this.editor?.hass}
                    .selector=${{ select: { mode: 'dropdown', options: Object.entries(zones).map(([k, label]) => ({
                        value: k,
                        // The editor's own label ("Body (interior)"); component zone maps carry
                        // bounds objects instead, so fall back to the key.
                        label: typeof label === 'string' && label ? label : k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    })) } }}
                    .value=${this._value('zone') || Object.keys(zones)[0]}
                    .label=${'Zone'}
                    .helper=${'Which named layout zone this text field is routed to'}
                    @value-changed=${(/** @type {CustomEvent} */ e) => this.editor?._setConfigValue?.(`${p}.zone`, e.detail.value)}>
                </ha-selector>
            ` : nothing}

            ${any(['font_weight', 'font_family', 'font_size', 'letter_spacing']) ? html`
                <lcards-form-section header="Font" description="Set font family, weight, size and spacing" icon="mdi:format-font"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    ${this._field('font_family', { label: 'Font Family', helper: this._help('font_family', '') })}
                    ${this._field('font_weight', { label: 'Font Weight', helper: this._help('font_weight', '') })}
                    ${this._field('font_size', {
                        label: 'Font Size (px)',
                        helper: this._has('font_size_percent')
                            ? this._help('font_size', 'Absolute font size in px: overrides Font Size % when set explicitly', 'Inherits from defaults: use this OR Font Size %, not both')
                            : this._help('font_size', '')
                    })}
                    ${this._field('letter_spacing', { label: 'Letter Spacing', helper: this._help('letter_spacing', '') })}

                    ${any(['font_size_percent', 'cap_height_ratio', 'stretch']) ? html`
                        <lcards-form-section header="Fill Sizing"
                            description="Scale text to fill the card height. Use Font Size % + Cap Height Ratio instead of Font Size (px)."
                            icon="mdi:arrow-expand-vertical"
                            ?expanded=${!!(this._value('font_size_percent') || this._value('cap_height_ratio') || this._value('stretch'))}
                            ?outlined=${false} headerLevel="6" ?compact=${true}>
                            ${this._field('font_size_percent', {
                                label: 'Font Size (% of height)',
                                helper: 'Scales font so cap glyphs fill this % of the card height (when Cap Height Ratio is also set). Use instead of Font Size (px).'
                            })}
                            ${this._field('cap_height_ratio', {
                                label: 'Cap Height Ratio',
                                helper: 'Ratio of visible cap glyph height to the font em-square. Antonio ≈ 0.86. Adjust per font until caps fill the box. Has no effect without Font Size %.'
                            })}
                            ${this._field('stretch', {
                                label: 'Stretch Width',
                                helper: 'Stretch/compress glyphs to fill a fraction of the available width. true or 1 = 100%, 0.8 = 80%'
                            })}
                        </lcards-form-section>
                    ` : nothing}
                </lcards-form-section>
            ` : nothing}

            ${any(['anchor', 'baseline', 'text_transform', 'rotation']) ? html`
                <lcards-form-section header="Alignment" description="Text transform and rotation, and anchor and baseline where the card takes them"
                    icon="mdi:format-align-left" ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    ${this._field('anchor', { label: 'Anchor', helper: this._help('anchor', 'Text anchor (start/middle/end)') })}
                    ${this._field('baseline', { label: 'Baseline', helper: this._help('baseline', 'Baseline alignment') })}
                    ${this._field('text_transform', { label: 'Text Transform', helper: this._help('text_transform', 'Text transformation') })}
                    ${this._field('rotation', { label: 'Rotation', helper: this._help('rotation', 'Rotation angle in degrees', 'Inherits from defaults (0°)') })}
                </lcards-form-section>
            ` : nothing}

            ${this._has('padding') ? html`
                <lcards-form-section header="Padding" description="Override default padding settings" icon="mdi:move-resize"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    <lcards-padding-editor
                        .editor=${this.editor}
                        .config=${this.config}
                        path="${p}.padding"
                        label="${title || 'Field'} Padding"
                        helper="${this._help('padding', 'Custom padding for this field')}">
                    </lcards-padding-editor>
                </lcards-form-section>
            ` : nothing}

            ${this._has('background') ? html`
                <lcards-form-section header="Background" description="Text background rectangle (bar-break effect)" icon="mdi:rectangle"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.config}
                        basePath="${p}.background"
                        header="Background Colour"
                        description="${this.inherits ? 'Override default background colour per state' : 'Background colour for different entity states'}"
                        .suggestedStates=${this.suggestedStates}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>
                    ${this._field('background_padding', { label: 'Background Padding', helper: this._help('background_padding', '') })}
                    ${this._field('background_radius', { label: 'Background Corner Radius', helper: this._help('background_radius', '') })}
                    ${this._field('background_width', { label: 'Background Width (Fixed)', helper: 'Exact px width: overrides auto-sizing. Text overflows if content is wider.' })}
                    ${this._field('background_min_width', { label: 'Background Min Width', helper: 'Auto-sizes with text but never shrinks below this value, so safe for dynamic content.' })}
                </lcards-form-section>
            ` : nothing}

            ${this._has('color') ? html`
                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.config}
                    basePath="${p}.color"
                    header="Field Colours"
                    description="Override default colour settings"
                    .suggestedStates=${this.suggestedStates}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            ` : nothing}
        `;
    }
}

if (!customElements.get('lcards-text-field-editor')) {
    customElements.define('lcards-text-field-editor', LCARdSTextFieldEditor);
}
