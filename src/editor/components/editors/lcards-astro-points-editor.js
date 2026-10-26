/**
 * @fileoverview Astrometrics points list (the astrometrics card editor).
 *
 * Edits `config.points[]`: one collapsible row per point with its placement
 * form and numbers, the object it stands on, entity, label, style, marker,
 * colour and a lean label-text form (position, size, weight). Rows can be
 * added, duplicated, removed and reordered. Keys the form does not show
 * stay as they are (edit them in YAML).
 *
 * Pick: asks the card preview in the edit dialog for a position (window
 * events PICK_REQUEST / PICK_RESULT, see lcards-astrometrics-card.js); the
 * next tap on the preview writes the point's form.
 *
 * Emits `points-changed` with `{ value: points }`.
 */

import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { MARKERS, LABEL_STYLE_NAMES, SKY_BODIES, PLACEMENT_FORMS } from '../../../core/astrometrics/names.js';
import { LABEL_POSITIONS } from '../../../core/astrometrics/label-text.js';
import { PICK_REQUEST, PICK_RESULT, PICK_CANCEL } from '../../../cards/lcards-astrometrics-card.js';
import '../shared/lcards-form-section.js';
import '../shared/lcards-message.js';
import '../shared/lcards-color-picker.js';

/** @type {Record<string, { label: string, inputs?: string[], host?: string, pick?: boolean, value: any }>} */
const FORMS = {
  xyz: { label: 'x, y, z', inputs: ['x', 'y', 'z'], pick: true, value: [0, 0, 0] },
  polar: { label: 'Distance and bearing', inputs: ['Distance', 'Bearing (°)'], pick: true, value: [0, 0] },
  latlon: { label: 'Latitude and longitude (a sphere)', inputs: ['Latitude (°)', 'Longitude (°)'], host: 'sphere', pick: true, value: [0, 0] },
  altaz: { label: 'Azimuth and altitude (a dome)', inputs: ['Azimuth (°)', 'Altitude (°)'], host: 'dome', pick: true, value: [0, 30] },
  sky: { label: 'Sun or moon (a dome)', host: 'dome', value: 'sun' },
  at: { label: 'At another point', value: '' },
  cell: { label: 'Sector map cell (a plane grid)', host: 'plane', pick: true, value: '' }
};

/** Forms that take `alt` */
const ALT_FORMS = ['polar', 'latlon', 'altaz', 'sky'];

/** Remove keys whose value is empty, so YAML stays clean. */
const prune = (/** @type {Record<string, any>} */ obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) =>
  v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)));

/**
 * The placement form a point uses (the first present), or null.
 * @param {any} point
 */
export const formOf = (point) => PLACEMENT_FORMS.find((f) => point?.[f] !== undefined) ?? null;

/**
 * What an object can carry: sphere (latlon), dome (altaz, sky), plane (cell).
 * @param {any} obj
 * @returns {string | null}
 */
export const hostKind = (obj) => {
  if (obj?.type === 'sphere') return 'sphere';
  if (obj?.type !== 'grid') return null;
  const shape = obj.shape ?? 'plane';
  return ['dome', 'sphere', 'plane'].includes(shape) ? shape : null;
};

/**
 * A point with its placement switched to `form` (other forms dropped).
 * @param {any} point
 * @param {string} form
 */
export const withForm = (point, form) => {
  const next = { ...point };
  for (const f of PLACEMENT_FORMS) delete next[f];
  next[form] = structuredClone(FORMS[form]?.value ?? null);
  return next;
};

let pickSeq = 0;

export class LCARdSAstroPointsEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _expanded: { type: Number, state: true },
      _picking: { type: String, state: true }
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--ha-space-2); }
      .header h3 { margin: 0; }
      .point { margin-bottom: var(--ha-space-2); }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2); }
      .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--ha-space-2); }
      .full { grid-column: 1 / -1; }
      .pick-row { display: flex; align-items: center; gap: var(--ha-space-2); grid-column: 1 / -1; }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); }
      .empty { padding: var(--ha-space-4); text-align: center; color: var(--secondary-text-color); }
    `;
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    /** @type {any} */
    this.config = {};
    this._expanded = -1;
    /** @type {string} the point id being picked, '' when none */
    this._picking = '';
    /** @type {string} */
    this._pickRequest = '';
    this._onPickResult = this._onPickResult.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(PICK_RESULT, this._onPickResult);
  }

  disconnectedCallback() {
    window.removeEventListener(PICK_RESULT, this._onPickResult);
    this._cancelPick();
    super.disconnectedCallback();
  }

  /** @returns {any[]} */
  get _points() {
    return Array.isArray(this.config?.points) ? this.config.points : [];
  }

  /** @param {any[]} points */
  _commit(points) {
    fireEvent(this, /** @type {any} */ ('points-changed'), /** @type {any} */ ({ value: points }));
  }

  /**
   * Merge a patch into one point (undefined removes a key).
   * @param {number} index
   * @param {Record<string, any>} patch
   */
  _patch(index, patch) {
    this._commit(this._points.map((p, i) => (i === index ? prune({ ...p, ...patch }) : p)));
  }

  /** @param {number} index @param {any} point */
  _replace(index, point) {
    this._commit(this._points.map((p, i) => (i === index ? prune(point) : p)));
  }

  /** A fresh id: point1, point2, ... not taken */
  _freshId(base = 'point') {
    const ids = new Set(this._points.map((p) => String(p?.id)));
    let n = 1;
    while (ids.has(`${base}${n}`)) n++;
    return `${base}${n}`;
  }

  _add() {
    const points = [...this._points, { id: this._freshId(), xyz: [0, 0, 0], marker: 'dot', label: 'NEW POINT' }];
    this._expanded = points.length - 1;
    this._commit(points);
  }

  /** @param {number} index */
  _duplicate(index) {
    const src = this._points[index];
    const copy = { ...structuredClone(src), id: this._freshId(`${src?.id ?? 'point'}_`) };
    const points = [...this._points.slice(0, index + 1), copy, ...this._points.slice(index + 1)];
    this._expanded = index + 1;
    this._commit(points);
  }

  /** @param {number} index */
  _remove(index) {
    this._commit(this._points.filter((_, i) => i !== index));
  }

  /** @param {number} index @param {number} delta */
  _move(index, delta) {
    const points = [...this._points];
    const target = index + delta;
    if (target < 0 || target >= points.length) return;
    [points[index], points[target]] = [points[target], points[index]];
    this._expanded = target;
    this._commit(points);
  }

  // ── Picking ────────────────────────────────────────────────────────────────

  /** @param {any} point */
  _pick(point) {
    const form = formOf(point);
    const value = form ? point[form] : undefined;
    if (!form || !FORMS[form]?.pick || (value && typeof value === 'object' && !Array.isArray(value))) return;
    this._cancelPick();
    this._pickRequest = `pick-${++pickSeq}-${Date.now()}`;
    this._picking = String(point.id);
    window.dispatchEvent(new CustomEvent(PICK_REQUEST, {
      detail: {
        requestId: this._pickRequest,
        cardId: this.config?.id ?? null,
        pointId: String(point.id),
        form,
        object: point.object,
        label: point.label ?? point.text?.label?.content ?? point.id
      }
    }));
  }

  _cancelPick() {
    if (!this._pickRequest) return;
    window.dispatchEvent(new CustomEvent(PICK_CANCEL, { detail: { requestId: this._pickRequest } }));
    this._pickRequest = '';
    this._picking = '';
  }

  /** @param {Event} e */
  _onPickResult(e) {
    const d = /** @type {CustomEvent} */ (e).detail ?? {};
    if (!this._pickRequest || d.requestId !== this._pickRequest) return;
    this._pickRequest = '';
    this._picking = '';
    if (d.cancelled || d.value === null || d.value === undefined) return;
    const index = this._points.findIndex((p) => String(p?.id) === d.pointId);
    if (index < 0) return;
    this._replace(index, { ...withForm(this._points[index], d.form), [d.form]: d.value });
  }

  // ── Fields ─────────────────────────────────────────────────────────────────

  /**
   * @param {string} label
   * @param {any} value
   * @param {{ value: string, label: string }[]} options
   * @param {(v: any) => void} onChange
   * @param {Record<string, any>} [extra]
   */
  _select(label, value, options, onChange, extra = {}) {
    return html`
      <ha-selector .hass=${this.hass} .required=${false} .label=${label} .value=${value ?? ''}
        .selector=${{ select: { mode: 'dropdown', options, ...extra } }}
        @value-changed=${(/** @type {CustomEvent} */ e) => onChange(e.detail.value)}>
      </ha-selector>
    `;
  }

  /** @param {string} label @param {any} value @param {(v: any) => void} onChange @param {string} [helper] */
  _text(label, value, onChange, helper = '') {
    return html`
      <ha-selector .hass=${this.hass} .required=${false} .label=${label} .value=${value ?? ''} .helper=${helper}
        .selector=${{ text: {} }}
        @value-changed=${(/** @type {CustomEvent} */ e) => onChange(e.detail.value === '' ? undefined : e.detail.value)}>
      </ha-selector>
    `;
  }

  /** @param {string} label @param {any} value @param {(v: number | undefined) => void} onChange @param {Record<string, any>} [opts] */
  _number(label, value, onChange, opts = {}) {
    return html`
      <ha-selector .hass=${this.hass} .required=${false} .label=${label} .value=${value ?? ''}
        .selector=${{ number: { mode: 'box', step: 'any', ...opts } }}
        @value-changed=${(/** @type {CustomEvent} */ e) => {
          const v = e.detail.value;
          onChange(v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? undefined : Number(v));
        }}>
      </ha-selector>
    `;
  }

  /**
   * Object ids by what they can carry.
   * @param {string | null} kind - sphere, dome, plane, or null for any
   */
  _objectOptions(kind) {
    const objects = Array.isArray(this.config?.objects) ? this.config.objects : [];
    return objects
      .filter((o) => o && typeof o.id === 'string' && (!kind || hostKind(o) === kind))
      .map((o) => ({ value: o.id, label: `${o.id} (${o.type}${o.shape ? ` ${o.shape}` : ''})` }));
  }

  /** @param {any} point @param {number} index */
  _renderPlacement(point, index) {
    const form = formOf(point);
    const spec = form ? FORMS[form] : null;
    const value = form ? point[form] : undefined;
    const bound = value && typeof value === 'object' && !Array.isArray(value);
    const hostOptions = this._objectOptions(spec?.host ?? null);
    const picking = this._picking === String(point.id);
    return html`
      <div class="grid">
        <div class="full">
          ${this._select('Placed by', form ?? '', Object.entries(FORMS).map(([v, f]) => ({ value: v, label: f.label })),
            (v) => v && v !== form && this._replace(index, withForm(point, v)))}
        </div>
        ${bound ? html`<div class="full hint">Position from ${value.entity ?? 'the point\'s entity'} (edit the binding in YAML).</div>` : nothing}
        ${!bound && spec?.inputs ? html`
          <div class="full ${spec.inputs.length === 3 ? 'grid3' : 'grid'}">
            ${spec.inputs.map((label, i) => this._number(label, Array.isArray(value) ? value[i] : undefined, (v) => {
              const next = Array.isArray(value) ? [...value] : [...FORMS[/** @type {string} */ (form)].value];
              next[i] = v ?? 0;
              this._patch(index, { [/** @type {string} */ (form)]: next });
            }))}
          </div>` : nothing}
        ${form === 'sky' ? this._select('Body', value, SKY_BODIES.map((b) => ({ value: b, label: b })), (v) => this._patch(index, { sky: v })) : nothing}
        ${form === 'at' ? this._select('Point', value, this._points.filter((p) => p !== point && p?.id !== undefined).map((p) => ({ value: String(p.id), label: String(p.id) })), (v) => this._patch(index, { at: v })) : nothing}
        ${form === 'cell' ? this._text('Cell', value, (v) => this._patch(index, { cell: v }), 'Such as AF3') : nothing}
        ${form !== 'at' ? this._select(spec?.host ? 'On object' : 'On object (optional)', point.object ?? '',
          [{ value: '', label: '(None)' }, ...hostOptions], (v) => this._patch(index, { object: v || undefined }), { custom_value: true }) : nothing}
        ${form && ALT_FORMS.includes(form) ? this._number('Height above (alt)', point.alt, (v) => this._patch(index, { alt: v })) : nothing}
        ${spec?.pick && !bound ? html`
          <div class="pick-row">
            <ha-button appearance=${picking ? 'filled' : 'outlined'} @click=${() => (picking ? this._cancelPick() : this._pick(point))}>
              <ha-icon icon=${picking ? 'mdi:close' : 'mdi:crosshairs-gps'} slot="start"></ha-icon>
              ${picking ? 'Cancel pick' : 'Pick on preview'}
            </ha-button>
            <span class="hint">${picking ? 'Tap the preview where the point goes.' : 'Then tap the preview where the point goes.'}</span>
          </div>` : nothing}
      </div>
    `;
  }

  /** @param {any} point @param {number} index */
  _renderLabel(point, index) {
    const styles = Object.keys(this.config?.labels?.styles ?? {});
    const field = point.text?.label ?? {};
    /** @param {Record<string, any>} patch */
    const patchField = (patch) => {
      const text = { ...(point.text ?? {}), label: prune({ ...field, ...patch }) };
      if (!Object.keys(text.label).length) delete text.label;
      this._patch(index, { text: Object.keys(text).length ? text : undefined });
    };
    const color = point.color;
    return html`
      <div class="grid">
        <div class="full">${this._text('Label', point.label, (v) => this._patch(index, { label: v }), 'Templates work here; leave empty for a marker only')}</div>
        ${this._select('Style', point.style ?? '', [{ value: '', label: '(Default: minor)' }, ...[...LABEL_STYLE_NAMES, ...styles].map((s) => ({ value: s, label: s }))],
          (v) => this._patch(index, { style: v || undefined }))}
        ${this._select('Marker', point.marker ?? '', [{ value: '', label: '(None)' }, ...MARKERS.filter((m) => m !== 'none').map((m) => ({ value: m, label: m }))],
          (v) => this._patch(index, { marker: v || undefined }))}
        <ha-selector class="full" .hass=${this.hass} .required=${false} .label=${'Entity'} .value=${point.entity ?? ''}
          .helper=${'Label templates read it; state colours and more-info follow it'}
          .selector=${{ entity: {} }}
          @value-changed=${(/** @type {CustomEvent} */ e) => this._patch(index, { entity: e.detail.value || undefined })}>
        </ha-selector>
        <div class="full">
          ${color && typeof color === 'object'
            ? html`<div class="hint">Colour by state: edit the map in YAML.</div>`
            : html`<lcards-color-picker .hass=${this.hass} .value=${color ?? ''} .showPreview=${true}
                @value-changed=${(/** @type {CustomEvent} */ e) => this._patch(index, { color: e.detail.value || undefined })}>
              </lcards-color-picker>`}
        </div>
      </div>
      <lcards-form-section header="Label text" description="Position round the point, size and weight; more fields in YAML" icon="mdi:format-text" nested outlined>
        <div class="grid">
          ${this._select('Position', field.position ?? '', [{ value: '', label: '(Default)' }, ...Object.keys(LABEL_POSITIONS).map((p) => ({ value: p, label: p }))],
            (v) => patchField({ position: v || undefined }))}
          ${this._number('Font size (px)', typeof field.font_size === 'number' ? field.font_size : undefined, (v) => patchField({ font_size: v }), { min: 6, max: 96 })}
          ${this._select('Weight', field.font_weight !== undefined ? String(field.font_weight) : '', [
            { value: '', label: '(Style default)' },
            ...['300', '400', '500', '700', '900'].map((w) => ({ value: w, label: w }))
          ], (v) => patchField({ font_weight: v ? Number(v) : undefined }))}
        </div>
      </lcards-form-section>
    `;
  }

  /** @param {any} point @param {number} index @param {number} total */
  _renderPoint(point, index, total) {
    const form = formOf(point);
    const title = String(point?.id ?? `Point ${index + 1}`);
    const v = form ? point[form] : undefined;
    const pickable = !!(form && FORMS[form]?.pick && !(v && typeof v === 'object' && !Array.isArray(v)));
    return html`
      <lcards-form-section class="point" header=${title}
        secondary=${[point.label, form ? FORMS[form]?.label : 'no position'].filter(Boolean).join(' · ')}
        icon="mdi:map-marker"
        ?expanded=${this._expanded === index}
        outlined>
        ${pickable ? html`
          <ha-icon-button slot="header-icons" .label=${'Pick on preview'}
            @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._pick(point); }}>
            <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
          </ha-icon-button>` : nothing}
        <ha-icon-button slot="header-icons" .label=${'Move up'} ?disabled=${index === 0}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._move(index, -1); }}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Move down'} ?disabled=${index === total - 1}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._move(index, 1); }}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Duplicate'}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._duplicate(index); }}>
          <ha-icon icon="mdi:content-copy"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Remove point'}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._remove(index); }}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>

        ${!form ? html`<lcards-message type="warning">This point has no position: choose how it is placed.</lcards-message>` : nothing}
        <div class="grid">
          <div class="full">${this._text('Id', point.id, (v) => v && this._patch(index, { id: v }), 'Paths, views and rules refer to it by this name')}</div>
        </div>
        <lcards-form-section header="Position" icon="mdi:axis-arrow" nested outlined ?expanded=${true}>
          ${this._renderPlacement(point, index)}
        </lcards-form-section>
        <lcards-form-section header="Label and marker" icon="mdi:label-outline" nested outlined ?expanded=${true}>
          ${this._renderLabel(point, index)}
        </lcards-form-section>
      </lcards-form-section>
    `;
  }

  render() {
    const points = this._points;
    return html`
      <div class="header">
        <h3>Points</h3>
        <ha-button @click=${this._add}>
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add point
        </ha-button>
      </div>
      ${points.length
        ? points.map((p, i) => this._renderPoint(p, i, points.length))
        : html`<div class="empty">No points yet. Add one to label a place on the scene.</div>`}
    `;
  }
}

if (!customElements.get('lcards-astro-points-editor')) {
  customElements.define('lcards-astro-points-editor', LCARdSAstroPointsEditor);
}
