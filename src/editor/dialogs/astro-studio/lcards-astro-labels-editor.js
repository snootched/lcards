/**
 * @fileoverview The Astrometrics Studio's labels (`labels`): how every label
 * looks, the built-in styles (title, major, minor, tiny) with your overrides,
 * your own styles, and the overlap and pixel-snap switches. Text settings use
 * the card editors' own controls (lcards-text-field-editor) through an
 * adapter over the labels object (text-adapter.js).
 *
 * @element lcards-astro-labels-editor
 * @fires value-changed - detail: { value } (the whole labels object); not bubbling
 */

import { LitElement, html, css, nothing } from 'lit';
import { astrometricsSchema } from '../../../cards/schemas/astrometrics-schema.js';
import { BUILTIN_LABEL_STYLES } from '../../../core/astrometrics/label-text.js';
import { LCARdSFormFieldHelper as FormField } from '../../components/shared/lcards-form-field.js';
import { valueEditor } from './text-adapter.js';
import '../../components/editors/lcards-text-field-editor.js';
import '../../components/shared/lcards-form-section.js';

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** The colour states a label offers: its point's entity states, and selected */
const LABEL_STATES = ['default', 'active', 'inactive', 'unavailable', 'selected'];

/**
 * A style's one-line summary: size, priority, and whether you changed it.
 * @param {Record<string, any>} style
 * @param {boolean} changed
 */
function styleSummary(style, changed) {
  const bits = [];
  if (style.font_size !== undefined) bits.push(typeof style.font_size === 'number' ? `${style.font_size} px` : String(style.font_size));
  if (style.priority !== undefined) bits.push(`priority ${style.priority}`);
  if (changed) bits.push('changed');
  return bits.join(' · ');
}

export class LCARdSAstroLabelsEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      /** The labels object */
      value: { attribute: false },
      _newName: { state: true }
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    /** @type {Record<string, any>} */
    this.value = {};
    this._newName = '';
  }

  static get styles() {
    return css`
      :host { display: block; font-family: var(--ha-font-family-body); }
      .group-title { font-weight: var(--ha-font-weight-medium); margin: var(--ha-space-4) 0 var(--ha-space-1); }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-bottom: var(--ha-space-2); }
      .switches { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-4); margin-top: var(--ha-space-4); }
      .add { display: flex; gap: var(--ha-space-2); align-items: center; margin-top: var(--ha-space-2); }
      .add ha-input { flex: 1; }
      lcards-form-section { display: block; margin-bottom: var(--ha-space-2); }
    `;
  }

  /** @param {Record<string, any>} next */
  _emit(next) {
    this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: next } }));
  }

  render() {
    const value = isObj(this.value) ? this.value : {};
    const editor = valueEditor({ hass: this.hass, schema: astrometricsSchema.properties.labels, value, onChange: (v) => this._emit(v) });
    const styles = isObj(value.styles) ? value.styles : {};
    const builtins = Object.keys(BUILTIN_LABEL_STYLES);
    const own = Object.keys(styles).filter((n) => !builtins.includes(n));
    return html`
      <lcards-form-section data-key="default" header="Every label" icon="mdi:format-text" outlined nested
        description="Text settings every label on the card starts from (a font, letter spacing, a colour), under the styles.">
        <lcards-text-field-editor .editor=${editor} .config=${editor.config} basePath="default" .suggestedStates=${LABEL_STATES}>
        </lcards-text-field-editor>
      </lcards-form-section>

      <div class="group-title">Label styles</div>
      <div class="hint">A point picks a style (its style key); a style sets the size, colour and priority. Change a built-in one here, or add your own.</div>
      ${builtins.map((name) => this._style(editor, name, { ...BUILTIN_LABEL_STYLES[name], ...(styles[name] ?? {}) }, styles[name] !== undefined, true))}
      ${own.map((name) => this._style(editor, name, styles[name], false, false))}
      <div class="add">
        <ha-input .label=${'New style name'} .value=${this._newName}
          @input=${(/** @type {Event} */ e) => { this._newName = /** @type {any} */ (e.target).value; }}></ha-input>
        <ha-button appearance="plain" data-key="add-style" ?disabled=${!this._validName(this._newName, styles)}
          @click=${() => this._addStyle(editor, styles)}>
          <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add style
        </ha-button>
      </div>

      <div class="switches">
        ${FormField.renderField(editor, 'overlap', { label: 'Labels may overlap' })}
        ${FormField.renderField(editor, 'snap', { label: 'Pixel snap' })}
      </div>
    `;
  }

  /**
   * One style: its summary in the header, its text settings and priority inside.
   * @param {import('./text-adapter.js').ValueEditor} editor
   * @param {string} name @param {Record<string, any>} style @param {boolean} changed @param {boolean} builtin
   */
  _style(editor, name, style, changed, builtin) {
    return html`
      <lcards-form-section data-style=${name} header=${name} secondary=${styleSummary(style, changed)}
        icon=${builtin ? 'mdi:format-size' : 'mdi:format-letter-case'} outlined nested>
        ${builtin && changed ? html`
          <ha-icon-button slot="header-icons" .label=${'Back to the built-in style'} title="Back to the built-in style" data-key=${`reset-${name}`}
            @click=${(/** @type {Event} */ e) => { e.stopPropagation(); editor._setConfigValue(`styles.${name}`, undefined); }}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>` : nothing}
        ${builtin ? nothing : html`
          <ha-icon-button slot="header-icons" .label=${'Delete style'} title="Delete style" data-key=${`delete-${name}`}
            @click=${(/** @type {Event} */ e) => { e.stopPropagation(); editor._setConfigValue(`styles.${name}`, undefined); }}>
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>`}
        ${builtin ? html`<div class="hint">Built in: ${styleSummary(BUILTIN_LABEL_STYLES[name], false)}. What you set here wins.</div>` : nothing}
        ${FormField.renderField(editor, `styles.${name}.priority`, { label: 'Priority', helper: 'Which label wins when two overlap (higher wins).' })}
        ${FormField.renderField(editor, `styles.${name}.overlap`, { label: 'Never hidden by another label' })}
        <lcards-text-field-editor .editor=${editor} .config=${editor.config} basePath=${`styles.${name}`} .suggestedStates=${LABEL_STATES}>
        </lcards-text-field-editor>
      </lcards-form-section>`;
  }

  /** @param {string} name @param {Record<string, any>} styles */
  _validName(name, styles) {
    const n = String(name ?? '').trim();
    return /^[a-z][a-z0-9_]*$/.test(n) && !(n in BUILTIN_LABEL_STYLES) && !(n in styles);
  }

  /** @param {import('./text-adapter.js').ValueEditor} editor @param {Record<string, any>} styles */
  _addStyle(editor, styles) {
    const name = this._newName.trim();
    if (!this._validName(name, styles)) return;
    this._newName = '';
    // a new style starts as minor (a style with no keys would be dropped)
    editor._setConfigValue(`styles.${name}`, { font_size: BUILTIN_LABEL_STYLES.minor.font_size, priority: BUILTIN_LABEL_STYLES.minor.priority });
  }
}

if (!customElements.get('lcards-astro-labels-editor')) {
  customElements.define('lcards-astro-labels-editor', LCARdSAstroLabelsEditor);
}
