/**
 * @fileoverview A form generated from a schema's properties (the Astrometrics
 * Studio's object, camera and scene forms).
 *
 * Every key is shown as the field `fieldKind()` picks (schema-fields.js):
 * switches, dropdowns, sliders (bounded numbers) and number boxes, colour
 * pickers and colour lists, the font selector, coordinate boxes, a point id
 * or coordinates, nested sections for nested objects and lists of them, and
 * a YAML editor (with schema completion) for anything else. `x-ui-hints`
 * (label, selector, widget) win over the generated field. What a key holds
 * besides its plain value (an entity it follows, a template, a guided tour,
 * the settings of a switch) sits in a contained sub-panel headed with the
 * key's name. Keys scoped to another shape are hidden unless set
 * (`appliesTo`).
 *
 * @element lcards-astro-schema-form
 * @fires form-changed - detail: { value } (the whole object, unset keys removed); not bubbling
 */

import { LitElement, html, css, nothing } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import {
  fieldKind, tupleLabels, tupleSize, labelFor, helperText, appliesTo, withKey, parseNumbers, isUnset, objectAlternative, shorthandKey, choiceOptions, choiceValue,
  isBoundValue, boundIn, uiHints, numberSelector, unitsLabel, unitSuffix, bindingBranch, takesTemplate, isTemplateValue, isTour, sectionIcon, rangeItem, pairItemSchema
} from './schema-fields.js';
import {
  RATE_PRESETS, RATE_UNIT_NAMES, CUSTOM_RATE, rateField, customParts, presetValue, customRateValue, isNowDate, dateSelectorValue, todayValue
} from './clock-fields.js';
import '../../components/shared/lcards-form-section.js';
import '../../components/shared/lcards-color-picker.js';
import '../../components/shared/lcards-color-list.js';
import '../../components/editors/lcards-font-selector.js';
import '../../components/editors/lcards-text-field-editor.js';
import { valueEditor } from './text-adapter.js';
import { shapePicture } from './starter-gallery.js';
import '../../components/shared/lcards-asset-source-picker.js';
import '../../components/yaml/lcards-yaml-editor.js';

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** Kinds laid out two to a row */
const SHORT = new Set(['boolean', 'enum', 'choice', 'number', 'text', 'strings', 'numbers', 'font']);
const COORDS = 'coords';
/** A colour by state: the keys shown as pickers (the rest of a state map stays YAML) */
const STATE_COLOR_KEYS = ['default', 'active', 'inactive', 'unavailable'];
/** @type {Record<string, string>} */
const STATE_COLOR_LABELS = { default: 'Default (no other match)', active: 'Active (on)', inactive: 'Inactive (off)', unavailable: 'Unavailable' };

/** Whether a schema can only be a list (a colour list that takes no single colour) @param {any} s */
const hasArrayType = (s) => s?.type === 'array';

/**
 * A number from a number box (blank: undefined).
 * @param {any} v
 */
const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));

export class LCARdSAstroSchemaForm extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      /** The properties to show, by key */
      schema: { attribute: false },
      /** The object being edited */
      value: { attribute: false },
      /** Show only these keys, in this order (default: every key of schema) */
      keys: { attribute: false },
      /** Point ids for point fields */
      pointIds: { attribute: false },
      /** Dropdown values for text keys, by key (camera.view: the view names) */
      choices: { attribute: false },
      /** What one unit is in the open scope (ly, au, ...): labels of keys in scene units say so */
      units: { type: String },
      /** The scene's system ids (hide_in_systems picks from them) */
      systemIds: { attribute: false },
      _open: { state: true },
      _customRates: { state: true }
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    /** @type {Record<string, any>} */
    this.schema = {};
    /** @type {Record<string, any>} */
    this.value = {};
    /** @type {string[] | null} */
    this.keys = null;
    /** @type {string[]} */
    this.pointIds = [];
    /** @type {Record<string, string[]>} */
    this.choices = {};
    /** @type {string} */
    this.units = '';
    /** @type {string[]} */
    this.systemIds = [];
    /** @type {Set<string>} YAML sections opened (their editor mounts then) */
    this._open = new Set();
    /** @type {Set<string>} rate fields switched to Custom (their amount may equal a preset) */
    this._customRates = new Set();
  }

  static get styles() {
    return css`
      :host { display: block; font-family: var(--ha-font-family-body); }
      .wrap { container-type: inline-size; }
      /* minmax(0, ...): a field never widens its column (sliders and their boxes would push past the panel) */
      .fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--ha-space-4); align-items: start; margin-bottom: var(--ha-space-4); }
      .fields > *, .row > * { min-width: 0; }
      .full { grid-column: 1 / -1; }
      .row { display: grid; gap: var(--ha-space-2); grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
      .field-label { display: block; font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-bottom: var(--ha-space-1); }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-top: var(--ha-space-1); }
      .list-item { display: flex; gap: var(--ha-space-1); align-items: flex-start; }
      .list-item > :first-child { flex: 1; min-width: 0; }
      .list-actions { display: flex; justify-content: flex-end; }
      lcards-form-section { display: block; }
      .bindable { display: flex; align-items: flex-start; gap: var(--ha-space-1); }
      .bindable > ha-selector, .bindable > div, .bindable > lcards-font-selector { flex: 1; min-width: 0; }
      /* a side of a pair that follows an entity: its panel is under the row */
      .side-bound { display: flex; align-items: center; min-height: 56px; padding: 0 var(--ha-space-3); font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color); border: var(--ha-border-width-sm) dashed var(--divider-color); border-radius: var(--ha-border-radius-sm); }
      /* what a key holds besides its plain value: a nested section under the key's name */
      .sub-body { display: grid; gap: var(--ha-space-3); }
      .stack { display: grid; gap: var(--ha-space-2); }
      .stack > .field-label, .stack > .hint { margin: 0; }
      .stop { display: flex; gap: var(--ha-space-1); align-items: flex-start; }
      .stop > div { flex: 1; min-width: 0; display: grid; gap: var(--ha-space-2); }
      .pills { display: flex; align-items: center; gap: var(--ha-space-2); }
      .shape-picker { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: var(--ha-space-2); }
      .shape-tile { display: flex; flex-direction: column; gap: var(--ha-space-1); padding: 0 0 var(--ha-space-1); cursor: pointer; overflow: hidden;
        font: inherit; color: var(--primary-text-color); background: none; text-align: center;
        border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-md); }
      .shape-tile:hover, .shape-tile:focus-visible { border-color: var(--primary-color); outline: none; }
      .shape-tile[aria-checked='true'] { border: var(--ha-border-width-md) solid var(--primary-color); }
      .shape-picture { position: relative; aspect-ratio: 16 / 9; background: black; }
      .shape-picture img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .pills wa-button-group ha-button::part(base) { border-radius: 0; }
      .pills wa-button-group ha-button:first-child::part(base) {
        border-start-start-radius: var(--ha-border-radius-pill); border-end-start-radius: var(--ha-border-radius-pill);
      }
      .pills wa-button-group ha-button:last-child::part(base) {
        border-start-end-radius: var(--ha-border-radius-pill); border-end-end-radius: var(--ha-border-radius-pill);
      }
      /* one column in a narrow panel (the Studio's third), two when there is room; last, so it wins */
      @container (max-width: 600px) { .fields { grid-template-columns: 1fr; } }
    `;
  }

  /** @param {Record<string, any>} next */
  _emit(next) {
    this.dispatchEvent(new CustomEvent('form-changed', { detail: { value: next } }));
  }

  /** @param {string} key @param {any} v */
  _set(key, v) {
    this._emit(withKey(this.value ?? {}, key, v));
  }

  /** @param {string} key */
  _get(key) {
    return this.value?.[key];
  }

  render() {
    const props = this.schema ?? {};
    const keys = (this.keys ?? Object.keys(props)).filter((k) => props[k] && appliesTo(k, props, this.value ?? {}));
    const NESTED = ['object', 'objectList', 'boolOrObject', 'valueOrObject', 'textDefault'];
    const flat = keys.filter((k) => ![...NESTED, 'yaml'].includes(fieldKind(props[k], k)));
    const nested = keys.filter((k) => NESTED.includes(fieldKind(props[k], k)));
    const yaml = keys.filter((k) => fieldKind(props[k], k) === 'yaml');
    return html`
      <div class="wrap">
        <div class="fields">${flat.map((k) => this._field(k, props[k]))}</div>
        ${nested.map((k) => this._nested(k, props[k]))}
        ${yaml.map((k) => this._yaml(k, props[k]))}
      </div>
    `;
  }

  /**
   * @param {string} key
   * @param {any} s
   */
  _field(key, s) {
    const kind = fieldKind(s, key);
    const hints = uiHints(s);
    // a number shows its unit beside the value; other fields (a point, a pair) name it in the label
    const unit = kind === 'number' ? unitSuffix(s.description, this.units) : undefined;
    const label = unit ? hints.label ?? labelFor(key) : unitsLabel(hints.label ?? labelFor(key), s.description, this.units);
    const helper = helperText(s.description);
    const value = this._get(key);
    const cls = SHORT.has(kind) ? '' : 'full';
    // a value that follows an entity or a template: its own panel under the key's name
    if (isBoundValue(value) && bindingBranch(s)) return isTour(s) ? this._tour(key, value, label, helper) : this._binding(key, s, kind, value, label, helper);
    if (isTemplateValue(value) && takesTemplate(s)) return this._templateField(key, value, label);
    switch (kind) {
      case 'boolean':
        if (Array.isArray(value) || isObj(value)) return this._yaml(key, s);
        return this._bindable(key, s, cls,
          this._selector(key, { boolean: {} }, value ?? s.default ?? false, label, helper, '', (v) => v));
      case 'boolOrList':
        return this._boolOrList(key, value, label, helper);
      case 'enum': {
        // unset shows the default; choosing the default leaves the key out
        const descs = s.enumDescriptions ?? {};
        const options = s.enum.map((/** @type {string} */ v) => ({ value: v, label: descs[v] ? `${v}: ${descs[v]}` : v }));
        if (s.default === undefined) options.unshift({ value: '', label: hints.empty ?? '(Not set)' });
        return this._selector(key, { select: { mode: 'dropdown', options } }, value ?? s.default ?? '', label, helper, cls,
          (v) => (!v || v === s.default ? undefined : v));
      }
      case 'number': {
        const base = numberSelector(s);
        const selector = unit ? { number: { ...base.number, unit_of_measurement: unit } } : base;
        const slider = selector.number.mode === 'slider';
        const help = s.default !== undefined && !/Default/.test(helper) ? `${helper} Default ${s.default}.`.trim() : helper;
        // a slider takes the row; a box sits two to a row
        // an unset slider sits at the default (a box stays empty and says the default)
        const shown = value === undefined && slider ? s.default : value;
        return this._bindable(key, s, slider ? 'full' : cls, this._selector(key, selector, shown, label, help, '', num));
      }
      case 'text': {
        // a word or a point id (face: motion, or a point to turn toward)
        if (this.choices?.[key] || Array.isArray(s.pointWords)) {
          const words = this.choices?.[key] ?? [...s.pointWords, ...this.pointIds];
          const options = [{ value: '', label: '(Not set)' }, ...words.map((/** @type {string} */ v) => ({ value: v, label: v }))];
          const pick = this._selector(key, { select: { mode: 'dropdown', options, custom_value: true } }, value ?? '', label, helper, '', (v) => v || undefined);
          // the camera's first view can be a guided tour instead
          if (isTour(s)) {
            return html`
              <div class="bindable ${cls}">
                ${pick}
                <ha-icon-button data-key=${`${key}-tour`} .label=${'Make it a guided tour'} title="Make it a guided tour"
                  @click=${() => this._set(key, { entity: '', views: value ? [value] : [] })}>
                  <ha-icon icon="mdi:map-marker-path"></ha-icon>
                </ha-icon-button>
              </div>`;
          }
          return html`<div class=${cls}>${pick}</div>`;
        }
        if (isObj(value)) return this._yaml(key, s);
        return this._bindable(key, s, cls,
          this._selector(key, { text: {} }, value === undefined ? '' : String(value), label, helper, '', (v) => v || undefined));
      }
      case 'range':
        return this._range(key, s, value, label, helper);
      case 'shape':
        return this._shape(key, s, value, label, helper);
      case 'rate':
        return this._bindable(key, s, 'full', this._rate(key, value, label, helper, (v) => this._set(key, v)));
      case 'date':
        if (isTemplateValue(value)) return this._templateField(key, value, label);
        return this._bindable(key, s, 'full', this._date(key, value, label, helper, (v) => this._set(key, v)));
      case 'font':
        return html`
          <lcards-font-selector class=${cls} data-key=${key} .hass=${this.hass} .value=${value ?? ''} .label=${label} .helper=${helper}
            @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._set(key, e.detail.value || undefined); }}>
          </lcards-font-selector>`;
      case 'asset': {
        const model = s.assetSource === 'model';
        return html`
          <lcards-asset-source-picker class="full" data-key=${key} .hass=${this.hass} .value=${value === undefined ? '' : String(value)}
            .label=${label} .assetTypes=${model ? ['model'] : ['image']} .accept=${model ? ['model/*'] : ['image/*']}
            .assetLabel=${model ? 'Built-in model' : 'Built-in image'}
            .customHelper=${model ? 'A .glb or .gltf file: /local/... (in /config/www) or an https:// URL.' : 'An image: /local/... (in /config/www) or an https:// URL.'}
            .mediaHelper=${model ? 'Your own models: put .glb files in /config/www/lcards/models, then find them under LCARdS, My models.' : 'Browse or upload an image in the Home Assistant media library.'}
            @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._set(key, e.detail.value || undefined); }}>
          </lcards-asset-source-picker>
          ${helper ? html`<div class="hint full">${helper}</div>` : nothing}`;
      }
      case 'strings':
        return this._selector(key, { text: {} }, Array.isArray(value) ? value.join(', ') : '', label, `${helper} Separate with commas.`, cls,
          (v) => String(v ?? '').split(',').map((t) => t.trim()).filter(Boolean));
      case 'numbers':
        return this._selector(key, { text: {} }, Array.isArray(value) ? value.join(', ') : '', label, `${helper} Numbers separated by commas.`, cls, parseNumbers);
      case 'color':
        // an object's colour can follow an entity or a template (bindings.js entityColor)
        if (isTemplateValue(value)) return this._templateField(key, value, label, undefined, 'Back to a colour');
        return this._bindable(key, s, 'full', this._color(key, value, label, helper));
      case 'colorList': {
        // a colour that follows an entity or a template stays YAML (a list keeps plain colours)
        if ((Array.isArray(value) ? value : [value]).some((c) => isObj(c) || isTemplateValue(c))) return this._yaml(key, s);
        // one colour or a list: one left is written as one colour where the schema takes it
        const single = !hasArrayType(s);
        const colors = Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []);
        return html`
          <lcards-color-list class="full" data-key=${key} .hass=${this.hass} .colors=${colors} .label=${label} .description=${helper}
            @colors-changed=${(/** @type {CustomEvent} */ e) => {
              e.stopPropagation();
              const next = (e.detail.colors ?? []).filter(Boolean);
              this._set(key, single && next.length === 1 ? next[0] : next);
            }}>
          </lcards-color-list>`;
      }
      case 'tuple':
        return this._tuple(key, s, value, label, helper, 'tuple');
      case 'numberOrTuple':
        return this._bindable(key, s, 'full', this._tuple(key, s, value, label, helper, 'numberOrTuple'));
      case 'pointRef':
        return this._pointRef(label, helper, value, (v) => this._set(key, v));
      case 'pointList':
        return this._pointList(key, label, helper, value);
      case 'choice': {
        if (isObj(value)) return this._yaml(key, s);
        const opts = /** @type {NonNullable<ReturnType<typeof choiceOptions>>} */ (choiceOptions(s));
        /** @type {Record<string, string>} */
        const descs = Object.assign({}, ...(s.oneOf ?? s.anyOf).map((/** @type {any} */ b) => b.enumDescriptions ?? {}));
        if (hints.widget === 'pills') return this._pills(key, s, opts.words, descs, value, label, helper);
        const options = [
          { value: '', label: '(Not set)' },
          ...(opts.bool ? [{ value: 'true', label: 'true' }, { value: 'false', label: 'false' }] : []),
          ...opts.words.map((w) => ({ value: w, label: descs[w] ? `${w}: ${descs[w]}` : w }))
        ];
        return this._bindable(key, s, cls, this._selector(key, { select: { mode: 'dropdown', options, custom_value: opts.number } },
          value === undefined ? '' : String(value), label, opts.number ? `${helper ? `${helper} ` : ''}(or type a number)` : helper, '',
          (v) => choiceValue(v, opts)));
      }
      case 'boolOrNumber':
        return html`
          <div class="full row">
            ${this._selector(`${key}-on`, { boolean: {} }, value !== undefined && value !== false, label, helper, '',
              (v) => this._set(key, v ? true : undefined))}
            ${value !== undefined && value !== false ? this._selector(`${key}-n`, { number: { mode: 'box', step: 'any' } },
              typeof value === 'number' ? value : undefined, 'Factor', '(Blank: the default)', '', (v) => this._set(key, num(v) ?? true)) : nothing}
          </div>`;
      default:
        return nothing;
    }
  }

  /**
   * A colour picker with its label and helper.
   * @param {string} key @param {any} value @param {string} label @param {string} helper
   * @param {(v: any) => void} [put]
   */
  _color(key, value, label, helper, put = (v) => this._set(key, v)) {
    return html`
      <div data-key=${key}>
        <span class="field-label">${label}</span>
        <lcards-color-picker .hass=${this.hass} .value=${value ?? ''}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); put(e.detail.value || undefined); }}>
        </lcards-color-picker>
        ${helper ? html`<div class="hint">${helper}</div>` : nothing}
      </div>`;
  }

  /**
   * A field with a "Follow an entity" button beside it, when its key can
   * follow one (the runtime binds it); else the field as it is.
   * @param {string} key @param {any} s @param {string} cls @param {any} field
   */
  _bindable(key, s, cls, field) {
    if (!bindingBranch(s) || isTour(s)) return html`<div class=${cls}>${field}</div>`;
    return html`
      <div class="bindable ${cls}">
        ${field}
        <ha-icon-button class="bind" data-key=${`${key}-bind`} .label=${'Follow an entity'} title="Follow an entity"
          @click=${() => this._set(key, { entity: '' })}>
          <ha-icon icon="mdi:link-variant"></ha-icon>
        </ha-icon-button>
      </div>`;
  }

  /**
   * A contained panel under a key's name: what the key holds besides a
   * plain value, with the way back to one in its header.
   * @param {string} key @param {string} icon @param {string} title @param {string} back - the back button's label
   * @param {any} body
   * @param {(v: any) => void} [put] - writes the value (a side of a pair writes into the pair)
   */
  _subPanel(key, icon, title, back, body, put = (v) => this._set(key, v)) {
    return html`
      <lcards-form-section class="full binding" data-key=${key} header=${title} icon=${icon} nested outlined ?expanded=${true}>
        <ha-icon-button slot="header-icons" data-key=${`${key}-unbind`} .label=${back} title=${back}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); put(undefined); }}>
          <ha-icon icon="mdi:link-variant-off"></ha-icon>
        </ha-icon-button>
        <div class="sub-body">${body}</div>
      </lcards-form-section>`;
  }

  /**
   * A setting that follows an entity: entity and attribute, and for a
   * number input, output, clamp and smooth (the keys its binding takes).
   * @param {string} key @param {any} s @param {string} kind @param {Record<string, any>} value @param {string} label @param {string} helper
   * @param {(v: any) => void} [put] - writes the binding (a side of a pair writes into the pair)
   */
  _binding(key, s, kind, value, label, helper, put = (v) => this._set(key, v)) {
    const takes = bindingBranch(s)?.properties ?? {};
    const numeric = kind !== 'text' && kind !== 'boolean';
    const set = (/** @type {Record<string, any>} */ patch) => {
      const next = { ...value, ...patch };
      for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
      put(next);
    };
    // input: the entity's values; output: the setting's values they become (the map_range keys)
    /** @param {'input' | 'output'} k @param {[string, string]} names @param {[string, string]} helpers */
    const pair = (k, names, helpers) => html`
      <div class="row">
        ${[0, 1].map((i) => this._selector(`${key}~${k}${i}`, { number: { mode: 'box', step: 'any' } },
          Array.isArray(value[k]) ? value[k][i] : undefined, names[i], helpers[i], '', (v) => {
            const cur = Array.isArray(value[k]) ? [...value[k]] : [undefined, undefined];
            cur[i] = num(v);
            set({ [k]: cur.every((x) => x === undefined) ? undefined : cur.map((x) => x ?? 0) });
          }))}
      </div>`;
    const color = kind === 'color';
    const back = color ? 'Back to a colour' : kind === 'choice' || kind === 'boolean' ? 'Back to a fixed value' : 'Back to a number';
    // a colour by state: the usual state keys here, any other state or range (heat, above:80) in YAML
    const others = color ? Object.keys(value).filter((k) => !['entity', 'attribute', ...STATE_COLOR_KEYS].includes(k)) : [];
    return this._subPanel(key, 'mdi:link-variant', `${label}: follows an entity`, back, html`
      ${this._selector(`${key}~entity`, { entity: {} }, value.entity || undefined, 'Entity', color ? '' : helper, '', (v) => set({ entity: v || '', attribute: undefined }))}
      ${takes.attribute ? this._attribute(key, value, set) : nothing}
      ${color ? html`
        ${STATE_COLOR_KEYS.map((k) => this._color(`${key}~${k}`, value[k], STATE_COLOR_LABELS[k], '', (v) => set({ [k]: v })))}
        <div class="hint full">${others.length ? `Also by state in YAML: ${others.join(', ')}.` : 'Other states ("heat", "above:80", "between:20:80") go in YAML, each with its colour. No key matching: the entity\'s own colour (attribute: rgb_color on a light).'}</div>` : nothing}
      ${numeric && takes.input ? pair('input', ['Entity low', 'Entity high'], ['Default: its min (else 0)', 'Default: its max (else 100)']) : nothing}
      ${numeric && takes.output ? pair('output', [`${label} at entity low`, `${label} at entity high`],
        ['Both empty: the entity\'s own number', 'Held at the ends outside the entity range']) : nothing}
      ${numeric && takes.clamp ? this._selector(`${key}~clamp`, { boolean: {} }, value.clamp !== false, 'Clamp', 'Off: values past the entity range carry on past the ends.', '', (v) => set({ clamp: v ? undefined : false })) : nothing}
      ${numeric && takes.smooth ? this._selector(`${key}~smooth`, { number: { mode: 'box', min: 0, step: 50 } }, value.smooth, 'Smooth (ms)', 'opacity, radius, size and spin ease over this; default 600, 0 steps.', '', (v) => set({ smooth: num(v) })) : nothing}`, put);
  }

  /**
   * A setting given as a template: shown as text (edit it here or in the YAML tab).
   * @param {string} key @param {string} value @param {string} label
   * @param {(v: any) => void} [put] - writes the value (a side of a pair writes into the pair)
   * @param {string} [back] - the back button's label
   */
  _templateField(key, value, label, put = (v) => this._set(key, v), back = 'Back to a number') {
    return this._subPanel(key, 'mdi:code-braces', `${label}: a template`, back,
      this._selector(`${key}~template`, { text: { multiline: true } }, value, '', 'JavaScript [[[ ]]], Jinja2 {{ }} or a {entity.state} token.', '', (v) => put(v || undefined)), put);
  }

  /**
   * A guided tour (camera.view: { entity, views }): the entity, and the
   * stops in order, each a view and optionally the scene clock there.
   * @param {string} key @param {Record<string, any>} value @param {string} label @param {string} helper
   */
  _tour(key, value, label, helper) {
    const stops = Array.isArray(value.views) ? value.views : [];
    const views = this.choices?.[key] ?? [];
    const set = (/** @type {Record<string, any>} */ patch) => {
      const next = { ...value, ...patch };
      for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
      this._set(key, next);
    };
    /** @param {any[]} list */
    const setStops = (list) => set({ views: list.length ? list : undefined });
    /** @param {number} i @param {any} stop */
    const setStop = (i, stop) => setStops(stops.map((x, j) => (j === i ? stop : x)));
    const viewOf = (/** @type {any} */ st) => (typeof st === 'string' ? st : String(st?.view ?? ''));
    const options = views.map((v) => ({ value: v, label: v }));
    return html`
      <lcards-form-section class="full binding" data-key=${key} header=${`${label}: a guided tour`} icon="mdi:map-marker-path" nested outlined ?expanded=${true}>
        <ha-icon-button slot="header-icons" data-key=${`${key}-unbind`} .label=${'Back to one view'} title="Back to one view"
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._set(key, viewOf(stops[0]) || undefined); }}>
          <ha-icon icon="mdi:link-variant-off"></ha-icon>
        </ha-icon-button>
        <div class="sub-body">
        ${this._selector(`${key}~entity`, { entity: {} }, value.entity || undefined, 'Entity', 'An input_number picks the nth stop (from 0); an input_select names the view. ' + helper, '',
          (v) => set({ entity: v || '', attribute: undefined }))}
        ${this._attribute(key, value, set)}
        <span class="field-label">Stops</span>
        ${stops.length ? nothing : html`<div class="hint">No stops: the entity's state names the view (an input_select of view names).</div>`}
        ${stops.map((stop, i) => {
          const timed = isObj(stop);
          return html`
            <div class="stop" data-key=${`${key}~stop${i}`}>
              <div>
                ${this._selector(`${key}~view${i}`, { select: { mode: 'dropdown', options, custom_value: true } }, viewOf(stop), `${i}`, '', '',
                  (v) => setStop(i, timed ? { ...stop, view: v || '' } : (v || '')))}
                ${timed ? html`
                  ${this._date(`${key}~date${i}`, stop.date, 'Date there', '', (v) => setStop(i, withKey(stop, 'date', v)))}
                  ${this._rate(`${key}~rate${i}`, stop.rate, 'Rate there', '', (v) => setStop(i, withKey(stop, 'rate', v)))}` : nothing}
              </div>
              <ha-icon-button .label=${timed ? 'Leave the clock as it is' : 'Set the clock here'} title=${timed ? 'Leave the clock as it is' : 'Set the clock here'}
                @click=${() => setStop(i, timed ? viewOf(stop) : { view: viewOf(stop) })}>
                <ha-icon icon=${timed ? 'mdi:clock-remove-outline' : 'mdi:clock-outline'}></ha-icon>
              </ha-icon-button>
              <ha-icon-button .label=${'Move up'} ?disabled=${i === 0}
                @click=${() => { const n = [...stops]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setStops(n); }}>
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </ha-icon-button>
              <ha-icon-button .label=${'Remove'} @click=${() => setStops(stops.filter((_, j) => j !== i))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
            </div>`;
        })}
        <div class="list-actions">
          <ha-button appearance="plain" size="s" data-key=${`${key}~add`} @click=${() => setStops([...stops, views[stops.length] ?? views[0] ?? ''])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add stop
          </ha-button>
        </div>
        </div>
      </lcards-form-section>`;
  }

  /**
   * The attribute of a binding's entity: a dropdown of that entity's
   * attributes once one is picked (empty reads the state).
   * @param {string} key @param {Record<string, any>} value @param {(patch: Record<string, any>) => void} set
   */
  _attribute(key, value, set) {
    if (!value.entity) return nothing;
    return this._selector(`${key}~attribute`, { attribute: { entity_id: value.entity } }, value.attribute ?? '', 'Attribute (optional)',
      'Leave empty to read the state.', '', (v) => set({ attribute: v || undefined }));
  }

  /**
   * [low, high] of a bounded number: two sliders in a row (a brightness range).
   * @param {string} key @param {any} s @param {any} value @param {string} label @param {string} helper
   */
  _range(key, s, value, label, helper) {
    const item = rangeItem(s);
    const names = tupleLabels(s.description, 2);
    const def = Array.isArray(s.default) ? s.default : [item.minimum, item.maximum];
    const vals = Array.isArray(value) ? value : def;
    /** @param {number} i @param {any} v */
    const change = (i, v) => {
      const next = [0, 1].map((j) => (j === i ? (num(v) ?? def[j]) : (typeof vals[j] === 'number' ? vals[j] : def[j])));
      this._set(key, next[0] === def[0] && next[1] === def[1] ? undefined : next);
    };
    return html`
      <div class="full" data-key=${key}>
        <span class="field-label">${label}</span>
        <div class="row">
          ${names.map((name, i) => html`
            <ha-selector data-key=${`${key}~${i}`} .hass=${this.hass} .selector=${{ number: { mode: 'slider', min: item.minimum, max: item.maximum, step: 'any' } }}
              .value=${typeof vals[i] === 'number' ? vals[i] : def[i]} .label=${name.charAt(0).toUpperCase() + name.slice(1)} .required=${false}
              @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); change(i, e.detail.value); }}>
            </ha-selector>`)}
        </div>
        ${helper ? html`<div class="hint">${helper}</div>` : nothing}
      </div>`;
  }

  /**
   * A shape as a row of pictures (the object's type picks them); a missing
   * picture leaves the shape's name.
   * @param {string} key
   * @param {any} s
   * @param {any} value
   * @param {string} label
   * @param {string} helper
   */
  _shape(key, s, value, label, helper) {
    const type = String(this.value?.type ?? '');
    const descs = s.enumDescriptions ?? {};
    const current = value ?? s.default;
    return html`
      <div class="full" data-key=${key}>
        <span class="field-label" id="shape-${key}">${label}</span>
        <div class="shape-picker" role="radiogroup" aria-labelledby="shape-${key}">
          ${s.enum.map((/** @type {string} */ v) => html`
            <button type="button" class="shape-tile" role="radio" data-shape=${v} aria-checked=${v === current ? 'true' : 'false'}
              title=${descs[v] ?? v} @click=${() => this._set(key, v === s.default ? undefined : v)}>
              <span class="shape-picture"><img src=${shapePicture(type, v)} alt="" loading="lazy"
                @error=${(/** @type {Event} */ e) => { /** @type {HTMLElement} */ (e.target).hidden = true; }}></span>
              <span>${v}</span>
            </button>`)}
        </div>
        ${helper ? html`<div class="hint">${helper}</div>` : nothing}
      </div>`;
  }

  /**
   * The scene clock's rate: live, paused, the time slider's stops in words,
   * or a custom amount of a unit per second.
   * @param {string} key @param {any} value @param {string} label @param {string} helper @param {(v: any) => void} set
   */
  _rate(key, value, label, helper, set) {
    const preset = rateField(value);
    const custom = !('preset' in preset) || this._customRates.has(key);
    const field = custom ? customParts(value) : { amount: 0, unit: 'd' };
    const options = [...RATE_PRESETS.map((p) => ({ value: p.value, label: p.label })), { value: CUSTOM_RATE, label: 'Custom' }];
    return html`
      <div class="stack" data-key=${key}>
        <ha-selector data-key=${`${key}~preset`} .hass=${this.hass} .selector=${{ select: { mode: 'dropdown', options } }}
          .value=${custom || !('preset' in preset) ? CUSTOM_RATE : preset.preset} .label=${label} .required=${false}
          @value-changed=${(/** @type {CustomEvent} */ e) => {
            e.stopPropagation();
            const v = e.detail.value;
            const next = new Set(this._customRates);
            if (v === CUSTOM_RATE) {
              // the boxes start from the current rate
              next.add(key);
              this._customRates = next;
              const parts = customParts(value);
              set(customRateValue(parts.amount, parts.unit));
            } else {
              next.delete(key);
              this._customRates = next;
              set(presetValue(v ?? 'live'));
            }
          }}>
        </ha-selector>
        ${custom ? html`
          <div class="row">
            ${this._selector(`${key}~amount`, { number: { mode: 'box', step: 'any' } }, field.amount, 'Amount', 'Negative runs backward.', '',
              (v) => set(customRateValue(num(v), field.unit)))}
            ${this._selector(`${key}~unit`, { select: { mode: 'dropdown', options: RATE_UNIT_NAMES.map(([u, n]) => ({ value: u, label: `${n}s a second` })) } },
              field.unit, 'Unit', '', '', (v) => set(customRateValue(field.amount, v || 'd')))}
          </div>` : nothing}
        <div class="hint">The scene's date moves on by this much each real second. Live keeps it on the real date and time; Paused holds it.</div>
      </div>`;
  }

  /**
   * The scene clock's date: now, or a date and time.
   * @param {string} key @param {any} value @param {string} label @param {string} helper @param {(v: any) => void} set
   */
  _date(key, value, label, helper, set) {
    const now = isNowDate(value);
    return html`
      <div class="stack" data-key=${key}>
        <span class="field-label">${label}</span>
        <div class="pills">
          <wa-button-group childSelector="ha-button">
            <ha-button size="s" variant="brand" data-value="now" .appearance=${now ? 'accent' : 'filled'} @click=${() => set(undefined)}>Now</ha-button>
            <ha-button size="s" variant="brand" data-value="date" .appearance=${now ? 'filled' : 'accent'}
              @click=${() => { if (now) set(todayValue()); }}>Date and time</ha-button>
          </wa-button-group>
        </div>
        ${now ? nothing : this._selector(`${key}~datetime`, { datetime: {} }, dateSelectorValue(value), '', '', '', (v) => set(v || undefined))}
        ${helper ? html`<div class="hint">${helper}</div>` : nothing}
      </div>`;
  }

  /**
   * true, or a list of names: a switch, and once on the names to pick
   * from (hide_in_systems: the scene's systems; none picked is every one).
   * @param {string} key @param {any} value @param {string} label @param {string} helper
   */
  _boolOrList(key, value, label, helper) {
    const on = value === true || Array.isArray(value);
    const list = Array.isArray(value) ? value.map(String) : [];
    const ids = [...new Set([...this.systemIds, ...list])];
    return html`
      <div class="full">
        ${this._selector(`${key}-on`, { boolean: {} }, on, label, helper, '', (v) => this._set(key, v ? (list.length ? list : true) : undefined))}
        ${on && ids.length ? this._selector(`${key}~list`, { select: { multiple: true, options: ids.map((id) => ({ value: id, label: id })) } }, list,
          'Only in these systems', 'None picked: every system.', '', (v) => this._set(key, Array.isArray(v) && v.length ? v : true)) : nothing}
      </div>`;
  }

  /**
   * A few words as a pill switch (the scene's look), with a bind button
   * when the key can follow an entity.
   * @param {string} key @param {any} s @param {string[]} words @param {Record<string, string>} descs
   * @param {any} value @param {string} label @param {string} helper
   */
  _pills(key, s, words, descs, value, label, helper) {
    const current = value ?? s.default;
    return html`
      <div class="full" data-key=${key}>
        <span class="field-label">${label}</span>
        <div class="pills">
          <wa-button-group childSelector="ha-button">
            ${words.map((w) => html`
              <ha-button size="s" variant="brand" data-value=${w} .appearance=${current === w ? 'accent' : 'filled'} title=${descs[w] ?? w}
                @click=${() => this._set(key, w === s.default ? undefined : w)}>
                ${w.charAt(0).toUpperCase() + w.slice(1)}
              </ha-button>`)}
          </wa-button-group>
          ${bindingBranch(s) ? html`
            <ha-icon-button class="bind" data-key=${`${key}-bind`} .label=${'Follow an entity'} title="Follow an entity"
              @click=${() => this._set(key, { entity: '' })}>
              <ha-icon icon="mdi:link-variant"></ha-icon>
            </ha-icon-button>` : nothing}
        </div>
        ${helper ? html`<div class="hint">${helper}</div>` : nothing}
      </div>`;
  }

  /**
   * An ha-selector bound to a key.
   * @param {string} key - for the test id
   * @param {any} selector
   * @param {any} value
   * @param {string} label
   * @param {string} helper
   * @param {string} cls
   * @param {(v: any) => any} toValue - selector value to config value; the result is set on the key unless it is the boolOrNumber setter
   *   or a sub-field (`key~part`), whose toValue sets it
   */
  _selector(key, selector, value, label, helper, cls, toValue) {
    return html`
      <ha-selector class=${cls} data-key=${key} .hass=${this.hass} .selector=${selector} .value=${value} .label=${label}
        .helper=${helper} .required=${false}
        @value-changed=${(/** @type {CustomEvent} */ e) => {
          e.stopPropagation();
          const out = toValue(e.detail.value);
          // sub-fields (key~part: a binding's entity, input, ...) set the key themselves
          if (!key.includes('~') && !key.endsWith('-on') && !key.endsWith('-n')) this._set(key, out);
        }}>
      </ha-selector>`;
  }

  /**
   * Two to four number boxes. numberOrTuple: only the first filled is one number.
   * @param {string} key @param {any} s @param {any} value @param {string} label @param {string} helper
   * @param {'tuple' | 'numberOrTuple'} kind
   */
  _tuple(key, s, value, label, helper, kind) {
    const n = tupleSize(s);
    const names = tupleLabels(s.description ?? s.oneOf?.find((/** @type {any} */ b) => b.description)?.description, n);
    const vals = Array.isArray(value) ? value : (typeof value === 'number' ? [value] : []);
    // a side that can follow an entity on its own (a pair setting: the array's items take a binding)
    const item = pairItemSchema(s);
    /** a side's value: a number, or a binding or template kept as it is */
    const keep = (/** @type {any} */ v) => (isBoundValue(v) || isTemplateValue(v) ? v : num(v));
    /** @param {number} i @param {any} v - a number, a binding or template, or undefined */
    const change = (i, v) => {
      const next = Array.from({ length: n }, (_, j) => (j === i ? keep(v) : keep(vals[j])));
      if (next.every((x) => x === undefined)) return this._set(key, undefined);
      if (kind === 'numberOrTuple' && next.slice(1).every((x) => x === undefined) && typeof next[0] === 'number') return this._set(key, next[0]);
      const fill = next.find((x) => typeof x === 'number') ?? 0;
      this._set(key, next.map((x) => (x === undefined ? (kind === 'numberOrTuple' ? fill : 0) : x)));
    };
    const bound = names.map((_, i) => isBoundValue(vals[i]) || isTemplateValue(vals[i]));
    return html`
      <div class="full" data-key=${key}>
        <span class="field-label">${label}</span>
        <div class="row">
          ${names.map((name, i) => bound[i] ? html`
            <div class="side-bound" data-side=${i}>${name}: ${isBoundValue(vals[i]) ? 'follows an entity' : 'a template'}</div>` : html`
            <div class=${item ? 'bindable' : ''}>
              <ha-selector .hass=${this.hass} .selector=${{ number: { mode: 'box', step: 'any' } }} .value=${vals[i]} .label=${name} .required=${false}
                @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); change(i, e.detail.value); }}>
              </ha-selector>
              ${item ? html`
                <ha-icon-button class="bind" data-key=${`${key}-${i}-bind`} .label=${`${name}: follow an entity`} title=${`${name}: follow an entity`}
                  @click=${() => change(i, { entity: '' })}>
                  <ha-icon icon="mdi:link-variant"></ha-icon>
                </ha-icon-button>` : nothing}
            </div>`)}
        </div>
        ${helper ? html`<div class="hint">${helper}${kind === 'numberOrTuple' ? ' Fill only the first box for one number.' : ''}${item ? ' Each side can follow an entity of its own (its link button).' : ''}</div>` : nothing}
        ${item ? names.map((name, i) => {
          if (!bound[i]) return nothing;
          // back to a number: the side's output low, else 0
          const put = (/** @type {any} */ v) => change(i, v === undefined ? (Number(vals[i]?.output?.[0]) || 0) : v);
          return isBoundValue(vals[i])
            ? this._binding(`${key}~${i}`, item, 'number', vals[i], `${label} ${name}`, '', put)
            : this._templateField(`${key}~${i}`, vals[i], `${label} ${name}`, put);
        }) : nothing}
      </div>`;
  }

  /**
   * A point id (dropdown of the scene's points, or typed) or coordinates.
   * @param {string} label @param {string} helper @param {any} value @param {(v: any) => void} set
   */
  _pointRef(label, helper, value, set) {
    const coords = Array.isArray(value);
    const options = [
      { value: '', label: '(None)' },
      ...this.pointIds.map((id) => ({ value: id, label: id })),
      { value: COORDS, label: 'Coordinates [x, y, z]' }
    ];
    return html`
      <div class="full">
        <ha-selector .hass=${this.hass} .selector=${{ select: { mode: 'dropdown', options, custom_value: true } }}
          .value=${coords ? COORDS : (value ?? '')} .label=${label} .helper=${helper} .required=${false}
          @value-changed=${(/** @type {CustomEvent} */ e) => {
            e.stopPropagation();
            const v = e.detail.value;
            if (v === COORDS) set(coords ? value : [0, 0, 0]);
            else set(v || undefined);
          }}>
        </ha-selector>
        ${coords ? html`
          <div class="row">
            ${['x', 'y', 'z'].map((name, i) => html`
              <ha-selector .hass=${this.hass} .selector=${{ number: { mode: 'box', step: 'any' } }} .value=${value[i]} .label=${name} .required=${false}
                @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); const next = [...value]; next[i] = num(e.detail.value) ?? 0; set(next); }}>
              </ha-selector>`)}
          </div>` : nothing}
      </div>`;
  }

  /** @param {string} key @param {string} label @param {string} helper @param {any} value */
  _pointList(key, label, helper, value) {
    const list = Array.isArray(value) ? value : [];
    /** @param {any[]} next */
    const set = (next) => this._set(key, next);
    return html`
      <div class="full" data-key=${key}>
        <span class="field-label">${label}</span>
        ${list.map((item, i) => html`
          <div class="list-item">
            ${this._pointRef(`${i + 1}`, '', item, (v) => set(list.map((x, j) => (j === i ? v : x)).filter((x) => !isUnset(x))))}
            <ha-icon-button .label=${'Remove'} @click=${() => set(list.filter((_, j) => j !== i))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
          </div>`)}
        <div class="list-actions">
          <ha-button appearance="plain" size="s" @click=${() => set([...list, this.pointIds[0] ?? [0, 0, 0]])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add point
          </ha-button>
        </div>
        ${helper ? html`<div class="hint">${helper}</div>` : nothing}
      </div>`;
  }

  /**
   * Nested objects, lists of them, and true-or-an-object keys: sections.
   * @param {string} key
   * @param {any} s
   */
  _nested(key, s) {
    const kind = fieldKind(s, key);
    const value = this._get(key);
    const label = labelFor(key);
    const helper = helperText(s.description);
    if (kind === 'object') {
      return html`
        <lcards-form-section data-key=${key} header=${label} description=${helper} secondary=${boundIn(value).length ? 'follows an entity' : ''}
          icon=${sectionIcon(key, kind)} nested outlined ?expanded=${boundIn(value).length > 0}>
          ${this._sub(s.properties, isObj(value) ? value : {}, (v) => this._set(key, v))}
        </lcards-form-section>`;
    }
    if (kind === 'textDefault') {
      // the card editors' text controls over text.default (the labels' text itself is generated)
      const editor = valueEditor({ hass: this.hass, schema: s, value: isObj(value) ? value : {}, onChange: (v) => this._set(key, v) });
      return html`
        <lcards-form-section data-key=${key} header=${label} description=${helper} icon=${sectionIcon(key, kind)} nested outlined
          ?expanded=${isObj(value) && Object.keys(value).length > 0}>
          <lcards-text-field-editor .editor=${editor} .config=${editor.config} basePath="default"></lcards-text-field-editor>
        </lcards-form-section>`;
    }
    if (kind === 'boolOrObject') {
      const alt = objectAlternative(s);
      const on = value === true || isObj(value);
      // the switch sits in the section's header; its settings show once on
      return html`
        <lcards-form-section data-key=${key} header=${label} description=${helper} secondary=${on ? '' : 'off'} icon=${sectionIcon(key, kind)} nested outlined ?expanded=${on}>
          <ha-switch slot="header-icons" data-key=${`${key}-on`} .checked=${on} title=${on ? `Turn ${label.toLowerCase()} off` : `Turn ${label.toLowerCase()} on`}
            @click=${(/** @type {Event} */ e) => e.stopPropagation()}
            @change=${(/** @type {Event} */ e) => this._set(key, /** @type {any} */ (e.target).checked ? true : undefined)}>
          </ha-switch>
          ${on ? this._sub(alt.properties, isObj(value) ? value : {}, (v) => this._set(key, isUnset(v) ? true : v))
            : html`<div class="hint">Off. Turn it on with the switch to set it up.</div>`}
        </lcards-form-section>`;
    }
    if (kind === 'valueOrObject') {
      // the short form shows in its own field; set alone, it stays short (image: builtin:mars_viking)
      const alt = objectAlternative(s);
      const sk = /** @type {string} */ (shorthandKey(s));
      const obj = isObj(value) ? value : value === undefined ? {} : { [sk]: value };
      /** @param {any} v */
      const set = (v) => this._set(key, isUnset(v) ? undefined : isObj(v) && Object.keys(v).length === 1 && v[sk] !== undefined ? v[sk] : v);
      return html`
        <lcards-form-section data-key=${key} header=${label} description=${helper} icon=${sectionIcon(key, kind)} nested outlined ?expanded=${value !== undefined}>
          ${this._sub(alt.properties, obj, set)}
        </lcards-form-section>`;
    }
    // objectList
    const list = Array.isArray(value) ? value : [];
    const item = s.items;
    const typeKey = Array.isArray(item.required) && item.required.includes('type') && Array.isArray(item.properties?.type?.enum) ? 'type' : null;
    /** @param {any[]} next */
    const set = (next) => this._set(key, next);
    return html`
      <lcards-form-section data-key=${key} header=${label} description=${helper} secondary=${list.length ? `${list.length}` : ''} icon=${sectionIcon(key, kind)} nested outlined ?expanded=${list.length > 0}>
        ${list.map((entry, i) => html`
          <lcards-form-section header=${`${i + 1}${typeKey && entry?.[typeKey] ? ` · ${entry[typeKey]}` : ''}`}
            secondary=${boundIn(entry).length ? 'follows an entity' : ''} icon=${sectionIcon(key, 'item')} nested outlined ?expanded=${boundIn(entry).length > 0}>
            <ha-icon-button slot="header-icons" .label=${'Move up'} ?disabled=${i === 0}
              @click=${(/** @type {Event} */ e) => { e.stopPropagation(); const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(n); }}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button slot="header-icons" .label=${'Remove'}
              @click=${(/** @type {Event} */ e) => { e.stopPropagation(); set(list.filter((_, j) => j !== i)); }}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
            ${this._sub(item.properties, isObj(entry) ? entry : {}, (v) => set(list.map((x, j) => (j === i ? v : x))))}
          </lcards-form-section>`)}
        <div class="list-actions">
          <ha-button appearance="plain" size="s"
            @click=${() => set([...list, typeKey ? { [typeKey]: item.properties.type.enum[0] } : {}])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add
          </ha-button>
        </div>
      </lcards-form-section>`;
  }

  /**
   * A nested form for a sub-object.
   * @param {Record<string, any>} properties @param {Record<string, any>} value @param {(v: any) => void} set
   */
  _sub(properties, value, set) {
    return html`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${properties} .value=${value} .pointIds=${this.pointIds}
        .units=${this.units} .systemIds=${this.systemIds}
        @form-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); set(e.detail.value); }}>
      </lcards-astro-schema-form>`;
  }

  /**
   * A key the form cannot show as fields: its own YAML editor (with this
   * key's schema for completion), mounted once the section opens.
   * @param {string} key
   * @param {any} s
   */
  _yaml(key, s) {
    const value = this._get(key);
    const open = this._open.has(key) || false;
    return html`
      <lcards-form-section data-key=${key} header=${labelFor(key)} description=${helperText(s.description)}
        secondary=${value === undefined ? '' : 'set'} icon="mdi:code-braces" nested outlined ?expanded=${open}
        @expanded-changed=${(/** @type {CustomEvent} */ e) => {
          const next = new Set(this._open);
          if (e.detail.expanded) next.add(key); else next.delete(key);
          this._open = next;
        }}>
        ${open ? html`
          <lcards-yaml-editor .hass=${this.hass} .schema=${s} .value=${value === undefined ? '' : configToYaml(value)}
            @value-changed=${(/** @type {CustomEvent} */ e) => {
              e.stopPropagation();
              const text = String(e.detail.value ?? '').trim();
              if (!text) return this._set(key, undefined);
              try {
                this._set(key, yamlToConfig(text));
              } catch (_) {
                // the editor shows the parse error; keep the last good value
              }
            }}>
          </lcards-yaml-editor>` : nothing}
      </lcards-form-section>`;
  }
}

if (!customElements.get('lcards-astro-schema-form')) {
  customElements.define('lcards-astro-schema-form', LCARdSAstroSchemaForm);
}
