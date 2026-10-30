/**
 * @fileoverview A form generated from a schema's properties (the Astrometrics
 * Studio's object, camera and scene forms).
 *
 * Every key is shown as the field `fieldKind()` picks (schema-fields.js):
 * switches, dropdowns, number boxes, colour pickers, coordinate boxes, a
 * point id or coordinates, nested sections for nested objects and lists of
 * them, and a YAML editor (with schema completion) for anything else. Keys
 * scoped to another shape are hidden unless set (`appliesTo`), or shown with
 * `showAll`.
 *
 * @element lcards-astro-schema-form
 * @fires form-changed - detail: { value } (the whole object, unset keys removed); not bubbling
 */

import { LitElement, html, css, nothing } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import {
  fieldKind, tupleLabels, tupleSize, labelFor, helperText, appliesTo, withKey, parseNumbers, isUnset, objectAlternative, choiceOptions, choiceValue,
  settingNumber, isBoundValue, isBindable, boundIn
} from './schema-fields.js';
import '../../components/shared/lcards-form-section.js';
import '../../components/shared/lcards-color-picker.js';
import '../../components/shared/lcards-asset-source-picker.js';
import '../../components/yaml/lcards-yaml-editor.js';

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** Kinds laid out two to a row */
const SHORT = new Set(['boolean', 'enum', 'choice', 'number', 'text', 'strings', 'numbers']);
const COORDS = 'coords';

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
      /** Show keys scoped to another shape too */
      showAll: { type: Boolean },
      /** Dropdown values for text keys, by key (camera.view: the view names) */
      choices: { attribute: false },
      _open: { state: true }
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
    this.showAll = false;
    /** @type {Record<string, string[]>} */
    this.choices = {};
    /** @type {Set<string>} YAML sections opened (their editor mounts then) */
    this._open = new Set();
  }

  static get styles() {
    return css`
      :host { display: block; font-family: var(--ha-font-family-body); }
      .wrap { container-type: inline-size; }
      .fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-4); align-items: start; margin-bottom: var(--ha-space-4); }
      .full { grid-column: 1 / -1; }
      .row { display: grid; gap: var(--ha-space-2); grid-auto-flow: column; grid-auto-columns: 1fr; }
      .field-label { display: block; font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-bottom: var(--ha-space-1); }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-top: var(--ha-space-1); }
      .list-item { display: flex; gap: var(--ha-space-1); align-items: flex-start; }
      .list-item > :first-child { flex: 1; min-width: 0; }
      .list-actions { display: flex; justify-content: flex-end; }
      lcards-form-section { display: block; }
      .bindable { display: flex; align-items: flex-start; gap: var(--ha-space-1); }
      .bindable > ha-selector, .bindable > div { flex: 1; min-width: 0; }
      .binding { display: grid; gap: var(--ha-space-2); padding: var(--ha-space-2); border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-md); }
      .binding-head { display: flex; align-items: center; justify-content: space-between; }
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
    const keys = (this.keys ?? Object.keys(props)).filter((k) => props[k] && (this.showAll || appliesTo(k, props, this.value ?? {})));
    const flat = keys.filter((k) => !['object', 'objectList', 'boolOrObject', 'yaml'].includes(fieldKind(props[k], k)));
    const nested = keys.filter((k) => ['object', 'objectList', 'boolOrObject'].includes(fieldKind(props[k], k)));
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
    const label = labelFor(key);
    const helper = helperText(s.description);
    const value = this._get(key);
    const cls = SHORT.has(kind) ? '' : 'full';
    switch (kind) {
      case 'boolean':
        return this._selector(key, { boolean: {} }, value ?? s.default ?? false, label, helper, cls, (v) => v);
      case 'enum': {
        // unset shows the default; choosing the default leaves the key out
        const descs = s.enumDescriptions ?? {};
        const options = s.enum.map((/** @type {string} */ v) => ({ value: v, label: descs[v] ? `${v}: ${descs[v]}` : v }));
        if (s.default === undefined) options.unshift({ value: '', label: '(Not set)' });
        return this._selector(key, { select: { mode: 'dropdown', options } }, value ?? s.default ?? '', label, helper, cls,
          (v) => (!v || v === s.default ? undefined : v));
      }
      case 'number': {
        const n = settingNumber(s) ?? s;
        const help = s.default !== undefined && !/Default/.test(helper) ? `${helper} Default ${s.default}.`.trim() : helper;
        // a setting that can follow an entity: the binding's own fields, or a template (YAML)
        if (isBoundValue(value)) return this._binding(key, value, label, help);
        if (typeof value === 'string') return this._templateField(key, value, label);
        const box = this._selector(key, { number: { mode: 'box', min: n.minimum, max: n.maximum, step: n.type === 'integer' ? 1 : 'any' } },
          value, label, help, '', num);
        if (!settingNumber(s)) return html`<div class=${cls}>${box}</div>`;
        return html`
          <div class="bindable ${cls}">
            ${box}
            <ha-icon-button class="bind" data-key=${`${key}-bind`} .label=${'Follow an entity'} title="Follow an entity"
              @click=${() => this._set(key, { entity: '' })}>
              <ha-icon icon="mdi:link-variant"></ha-icon>
            </ha-icon-button>
          </div>`;
      }
      case 'text':
        // a guided tour ({ entity, views }) or a date binding: YAML
        if (isObj(value)) return this._yaml(key, s);
        if (this.choices?.[key]) {
          const options = [{ value: '', label: '(Not set)' }, ...this.choices[key].map((v) => ({ value: v, label: v }))];
          return this._selector(key, { select: { mode: 'dropdown', options, custom_value: true } }, value ?? '', label, helper, cls, (v) => v || undefined);
        }
        return this._selector(key, { text: {} }, value === undefined ? '' : String(value), label, helper, cls, (v) => v || undefined);
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
        return html`
          <div class="full">
            <span class="field-label">${label}</span>
            <lcards-color-picker .hass=${this.hass} .value=${value ?? ''}
              @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._set(key, e.detail.value || undefined); }}>
            </lcards-color-picker>
            ${helper ? html`<div class="hint">${helper}</div>` : nothing}
          </div>`;
      case 'tuple':
        return this._tuple(key, s, value, label, helper, 'tuple');
      case 'numberOrTuple': {
        if (isBoundValue(value)) return this._binding(key, value, label, helper);
        if (typeof value === 'string') return this._templateField(key, value, label);
        const tuple = this._tuple(key, s, value, label, helper, 'numberOrTuple');
        if (!isBindable(s)) return tuple;
        return html`
          <div class="bindable full">
            ${tuple}
            <ha-icon-button class="bind" data-key=${`${key}-bind`} .label=${'Follow an entity'} title="Follow an entity"
              @click=${() => this._set(key, { entity: '' })}>
              <ha-icon icon="mdi:link-variant"></ha-icon>
            </ha-icon-button>
          </div>`;
      }
      case 'pointRef':
        return this._pointRef(label, helper, value, (v) => this._set(key, v));
      case 'pointList':
        return this._pointList(key, label, helper, value);
      case 'choice': {
        const opts = /** @type {NonNullable<ReturnType<typeof choiceOptions>>} */ (choiceOptions(s));
        const options = [
          { value: '', label: '(Not set)' },
          ...(opts.bool ? [{ value: 'true', label: 'true' }, { value: 'false', label: 'false' }] : []),
          ...opts.words.map((w) => ({ value: w, label: w }))
        ];
        return this._selector(key, { select: { mode: 'dropdown', options, custom_value: opts.number } }, value === undefined ? '' : String(value),
          label, opts.number ? `${helper ? `${helper} ` : ''}(or type a number)` : helper, cls, (v) => choiceValue(v, opts));
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
   * A setting that follows an entity: entity, attribute, range, to and
   * smooth, and a button back to a plain number.
   * @param {string} key @param {Record<string, any>} value @param {string} label @param {string} helper
   */
  _binding(key, value, label, helper) {
    const set = (/** @type {Record<string, any>} */ patch) => {
      const next = { ...value, ...patch };
      for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
      this._set(key, next);
    };
    const pair = (/** @type {'range' | 'to'} */ k, /** @type {string} */ name) => html`
      <div class="row">
        ${[0, 1].map((i) => this._selector(`${key}~${k}${i}`, { number: { mode: 'box', step: 'any' } },
          Array.isArray(value[k]) ? value[k][i] : undefined, `${name} ${i ? 'high' : 'low'}`, '', '', (v) => {
            const cur = Array.isArray(value[k]) ? [...value[k]] : [undefined, undefined];
            cur[i] = num(v);
            set({ [k]: cur.every((x) => x === undefined) ? undefined : cur.map((x) => x ?? 0) });
          }))}
      </div>`;
    return html`
      <div class="full binding" data-key=${key}>
        <div class="binding-head">
          <span class="field-label">${label}: follows an entity</span>
          <ha-icon-button data-key=${`${key}-unbind`} .label=${'Back to a number'} title="Back to a number" @click=${() => this._set(key, undefined)}>
            <ha-icon icon="mdi:link-variant-off"></ha-icon>
          </ha-icon-button>
        </div>
        ${this._selector(`${key}~entity`, { entity: {} }, value.entity || undefined, 'Entity', helper, '', (v) => set({ entity: v || '' }))}
        ${this._selector(`${key}~attribute`, { text: {} }, value.attribute ?? '', 'Attribute (optional)', 'Leave empty to read the state.', '', (v) => set({ attribute: v || undefined }))}
        ${pair('range', 'Range')}
        ${pair('to', 'To')}
        ${this._selector(`${key}~smooth`, { number: { mode: 'box', min: 0, step: 50 } }, value.smooth, 'Smooth (ms)', 'opacity, radius, size and spin ease over this; default 600, 0 steps.', '', (v) => set({ smooth: num(v) }))}
      </div>`;
  }

  /**
   * A setting given as a template: shown as text (edit it here or in the YAML tab).
   * @param {string} key @param {string} value @param {string} label
   */
  _templateField(key, value, label) {
    return html`
      <div class="full binding" data-key=${key}>
        <div class="binding-head">
          <span class="field-label">${label}: a template</span>
          <ha-icon-button data-key=${`${key}-unbind`} .label=${'Back to a number'} title="Back to a number" @click=${() => this._set(key, undefined)}>
            <ha-icon icon="mdi:link-variant-off"></ha-icon>
          </ha-icon-button>
        </div>
        ${this._selector(`${key}~template`, { text: { multiline: true } }, value, '', 'JavaScript [[[ ]]], Jinja2 {{ }} or a {entity.state} token.', '', (v) => this._set(key, v || undefined))}
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
          // sub-fields (key~part: a binding's entity, range, ...) set the key themselves
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
    /** @param {number} i @param {any} v */
    const change = (i, v) => {
      const next = Array.from({ length: n }, (_, j) => (j === i ? num(v) : num(vals[j])));
      if (next.every((x) => x === undefined)) return this._set(key, undefined);
      if (kind === 'numberOrTuple' && next.slice(1).every((x) => x === undefined)) return this._set(key, next[0]);
      const fill = next.find((x) => x !== undefined) ?? 0;
      this._set(key, next.map((x) => (x === undefined ? (kind === 'numberOrTuple' ? fill : 0) : x)));
    };
    return html`
      <div class="full" data-key=${key}>
        <span class="field-label">${label}</span>
        <div class="row">
          ${names.map((name, i) => html`
            <ha-selector .hass=${this.hass} .selector=${{ number: { mode: 'box', step: 'any' } }} .value=${vals[i]} .label=${name} .required=${false}
              @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); change(i, e.detail.value); }}>
            </ha-selector>`)}
        </div>
        ${helper ? html`<div class="hint">${helper}${kind === 'numberOrTuple' ? ' Fill only the first box for one number.' : ''}</div>` : nothing}
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
          nested outlined ?expanded=${boundIn(value).length > 0}>
          ${this._sub(s.properties, isObj(value) ? value : {}, (v) => this._set(key, v))}
        </lcards-form-section>`;
    }
    if (kind === 'boolOrObject') {
      const alt = objectAlternative(s);
      const on = value === true || isObj(value);
      return html`
        <lcards-form-section data-key=${key} header=${label} description=${helper} nested outlined ?expanded=${on}>
          ${this._selector(`${key}-on`, { boolean: {} }, on, 'On', '', '', (v) => this._set(key, v ? true : undefined))}
          ${on ? this._sub(alt.properties, isObj(value) ? value : {}, (v) => this._set(key, isUnset(v) ? true : v)) : nothing}
        </lcards-form-section>`;
    }
    // objectList
    const list = Array.isArray(value) ? value : [];
    const item = s.items;
    const typeKey = Array.isArray(item.required) && item.required.includes('type') && Array.isArray(item.properties?.type?.enum) ? 'type' : null;
    /** @param {any[]} next */
    const set = (next) => this._set(key, next);
    return html`
      <lcards-form-section data-key=${key} header=${label} description=${helper} secondary=${list.length ? `${list.length}` : ''} nested outlined ?expanded=${list.length > 0}>
        ${list.map((entry, i) => html`
          <lcards-form-section header=${`${i + 1}${typeKey && entry?.[typeKey] ? ` · ${entry[typeKey]}` : ''}`}
            secondary=${boundIn(entry).length ? 'follows an entity' : ''} nested outlined ?expanded=${boundIn(entry).length > 0}>
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
      <lcards-astro-schema-form .hass=${this.hass} .schema=${properties} .value=${value} .pointIds=${this.pointIds} ?showAll=${this.showAll}
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
