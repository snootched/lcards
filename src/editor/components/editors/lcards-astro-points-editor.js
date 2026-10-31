/**
 * @fileoverview Astrometrics points list (the astrometrics card editor).
 *
 * Edits `config.points[]`: one collapsible row per point with its placement
 * form and numbers, the object it stands on, entity, label, style, marker,
 * colour and a lean label-text form (position, size, weight). Rows can be
 * added, duplicated, removed and reordered. Keys the form does not show
 * stay as they are (edit them in YAML).
 *
 * Pick: asks the preview card (`preview`, the Astrometrics Studio's live
 * card: `pickPosition()`, see lcards-astrometrics-card.js) for a position;
 * the next tap on the preview writes the point's form. A point on a model
 * can stand on one of its parts: the part names come from the built-in
 * model's registry entry, else from the live preview (`partNames()`).
 *
 * `selected` (a point id) opens that row and scrolls to it; opening a row
 * emits `point-selected` with `{ id }` (null when closed).
 *
 * Card: a Lovelace card pinned to the point (`card:`), chosen with HA's card
 * picker and edited inline with `hui-card-element-editor`.
 *
 * Emits `points-changed` with `{ value: points }`.
 */

import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { MARKERS, LABEL_STYLE_NAMES, SKY_BODIES, BODY_NAMES, PLACEMENT_FORMS } from '../../../core/astrometrics/names.js';
import { mountDialogNearHomeAssistant } from '../../../utils/lcards-shared-helpers.js';
import { showInfoDialog } from '../../../views/layout-edit-dialogs.js';
import '../shared/lcards-form-section.js';
import '../shared/lcards-message.js';
import '../shared/lcards-color-picker.js';
import './lcards-text-field-editor.js';
import './lcards-position-picker.js';
import { astrometricsSchema } from '../../../cards/schemas/astrometrics-schema.js';
import { valueEditor } from '../../dialogs/astro-studio/text-adapter.js';

/** @type {Record<string, { label: string, inputs?: string[], host?: string, pick?: boolean, value: any }>} */
const FORMS = {
  xyz: { label: 'x, y, z', inputs: ['x', 'y', 'z'], pick: true, value: [0, 0, 0] },
  polar: { label: 'Distance and bearing', inputs: ['Distance', 'Bearing (°)'], pick: true, value: [0, 0] },
  latlon: { label: 'Latitude and longitude (a sphere)', inputs: ['Latitude (°)', 'Longitude (°)'], host: 'sphere', pick: true, value: [0, 0] },
  altaz: { label: 'Azimuth and altitude (a dome)', inputs: ['Azimuth (°)', 'Altitude (°)'], host: 'dome', pick: true, value: [0, 30] },
  sky: { label: 'Sun or moon (a dome)', host: 'dome', value: 'sun' },
  body: { label: 'A real Solar System body (scene date)', value: 'earth' },
  at: { label: 'At another point', value: '' },
  cell: { label: 'Sector map cell (a plane grid)', host: 'plane', pick: true, value: '' },
  part: { label: 'A part of a model', host: 'model', value: '' }
};

/** How a pinned card is shown, and where round the point */
const CARD_SHOW = [
  { value: 'tap', label: 'On tap (opens with a tap on the point)' },
  { value: 'always', label: 'Always' }
];

/** A body name for a menu: the Moon is Luna to the scenes, but the key is moon */
const bodyLabel = (/** @type {string} */ b) => (b === 'moon' ? 'Moon (Luna)' : b.charAt(0).toUpperCase() + b.slice(1));

/** Forms that take `alt` */
const ALT_FORMS = ['polar', 'latlon', 'altaz', 'sky'];

/** Remove keys whose value is empty, so YAML stays clean. */
const prune = (/** @type {Record<string, any>} */ obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) =>
  v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)));

/**
 * The placement form a point uses (the first present), or null.
 * @param {any} point
 */
export const formOf = (point) => (point?.part !== undefined ? 'part' : PLACEMENT_FORMS.find((f) => point?.[f] !== undefined) ?? null);

/**
 * What an object can carry: sphere (latlon), dome (altaz, sky), plane (cell),
 * model (part).
 * @param {any} obj
 * @returns {string | null}
 */
export const hostKind = (obj) => {
  if (obj?.type === 'sphere') return 'sphere';
  if (obj?.type === 'model') return 'model';
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
  delete next.part;
  // center goes with body
  delete next.center;
  next[form] = structuredClone(FORMS[form]?.value ?? null);
  return next;
};

/**
 * Part names of a built-in model (`builtin:<key>`) from the asset registry,
 * or null (a user file, or not registered).
 * @param {any} obj - the model object config
 * @returns {string[] | null}
 */
export const builtinParts = (obj) => {
  const src = typeof obj?.src === 'string' ? obj.src : '';
  if (!src.startsWith('builtin:')) return null;
  try {
    const parts = /** @type {any} */ (window).lcards?.core?.assetManager?.getRegistry?.('model')?.assets?.get(src.slice(8))?.metadata?.parts;
    return Array.isArray(parts) ? parts : null;
  } catch (_) {
    return null;
  }
};

let pickSeq = 0;

export class LCARdSAstroPointsEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      preview: { attribute: false },
      takenIds: { attribute: false },
      selected: { type: String },
      _expanded: { type: Number, state: true },
      _picking: { type: String, state: true },
      _parts: { type: Object, state: true }
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
      .card-actions { display: flex; justify-content: flex-end; }
      .card-editor-host { margin-top: var(--ha-space-2); }
    `;
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    /** @type {any} */
    this.config = {};
    this._expanded = -1;
    /** @type {any} the preview card (pickPosition, cancelPick, partNames) */
    this.preview = null;
    /** @type {string[] | undefined} every point id on the card (a system's list holds only some) */
    this.takenIds = undefined;
    /** @type {string | null} */
    this.selected = null;
    /** @type {string} the point id being picked, '' when none */
    this._picking = '';
    /** the current pick (a newer pick or a cancel drops an older answer) */
    this._pickSeq = 0;
    /** @type {Record<string, string[]>} model part names by object id (from the preview) */
    this._parts = {};
    /** @type {Set<string>} objects whose part names are being polled */
    this._partsAsked = new Set();
    /** @type {ReturnType<typeof setTimeout>[]} */
    this._partsTimers = [];
    /** @type {HTMLElement | null} */
    this._pickerDialog = null;
  }

  /** @param {Map<string, unknown>} changed */
  willUpdate(changed) {
    if (changed.has('selected') && this.selected) {
      const index = this._points.findIndex((p) => String(p?.id) === this.selected);
      if (index >= 0 && index !== this._expanded) {
        this._expanded = index;
        this.updateComplete.then(() => this.renderRoot.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      }
    }
  }

  /** Open or close a row, and say which point is selected. @param {number} index */
  _toggle(index) {
    this._expanded = this._expanded === index ? -1 : index;
    const id = this._expanded >= 0 ? String(this._points[this._expanded]?.id ?? '') : null;
    fireEvent(this, /** @type {any} */ ('point-selected'), /** @type {any} */ ({ id }));
  }

  disconnectedCallback() {
    this._partsTimers.forEach(clearTimeout);
    this._partsTimers = [];
    this._pickerDialog?.remove();
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
    // ids are card-wide: a system's points must not take the scene's (takenIds)
    const ids = new Set([...this._points.map((p) => String(p?.id)), ...(this.takenIds ?? [])]);
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
  async _pick(point) {
    const form = formOf(point);
    const value = form ? point[form] : undefined;
    if (!this.preview || !form || !FORMS[form]?.pick || (value && typeof value === 'object' && !Array.isArray(value))) return;
    this._cancelPick();
    const id = String(point.id);
    const seq = ++pickSeq;
    this._pickSeq = seq;
    this._picking = id;
    const picked = await this.preview.pickPosition({ pointId: id, form, object: point.object, label: point.label ?? point.text?.label?.content ?? id });
    if (this._pickSeq !== seq) return;
    this._picking = '';
    if (picked === null || picked === undefined) return;
    const index = this._points.findIndex((p) => String(p?.id) === id);
    if (index < 0) return;
    this._replace(index, { ...withForm(this._points[index], form), [form]: picked });
  }

  _cancelPick() {
    if (!this._picking) return;
    this._pickSeq = 0;
    this._picking = '';
    this.preview?.cancelPick();
  }

  // ── Model parts ────────────────────────────────────────────────────────────

  /**
   * A model object's part names: the built-in list, else what the preview
   * reported (asked for once per object; re-asked while the model loads).
   * @param {string} objectId
   * @returns {string[] | null}
   */
  _partsFor(objectId) {
    const obj = (Array.isArray(this.config?.objects) ? this.config.objects : []).find((o) => o?.id === objectId);
    if (obj?.type !== 'model') return null;
    const known = builtinParts(obj) ?? this._parts[objectId];
    if (known) return known;
    if (!this._partsAsked.has(objectId)) {
      this._partsAsked.add(objectId);
      this._askParts(objectId, 0);
    }
    return null;
  }

  /**
   * Ask the preview for a model's part names; null while it loads (or no
   * preview yet), so ask again a few times.
   * @param {string} objectId @param {number} attempt
   */
  _askParts(objectId, attempt) {
    const parts = this.preview?.partNames?.(objectId);
    if (Array.isArray(parts)) {
      this._parts = { ...this._parts, [objectId]: parts };
      return;
    }
    if (attempt >= 8) return;
    this._partsTimers.push(setTimeout(() => {
      if (this.isConnected && !this._parts[objectId]) this._askParts(objectId, attempt + 1);
    }, 1500));
  }

  /** Model object ids */
  _modelIds() {
    return (Array.isArray(this.config?.objects) ? this.config.objects : [])
      .filter((o) => o?.type === 'model' && typeof o.id === 'string').map((o) => /** @type {string} */ (o.id));
  }

  /**
   * Switch a point's placement form. A part goes on the point's model (or the
   * first one) at its first part.
   * @param {number} index @param {any} point @param {string} form
   */
  _setForm(index, point, form) {
    const next = withForm(point, form);
    if (form === 'part') {
      const models = this._modelIds();
      const model = models.includes(point.object) ? point.object : models[0];
      next.object = model;
      next.part = (model && this._partsFor(model)?.[0]) || 'part';
    }
    this._replace(index, next);
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
          ${this._select('Placed by', form ?? '', Object.entries(FORMS)
            .filter(([v]) => v !== 'part' || form === 'part' || this._modelIds().length)
            .map(([v, f]) => ({ value: v, label: f.label })),
            (v) => v && v !== form && this._setForm(index, point, v))}
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
        ${form === 'body' ? html`
          ${this._select('Body', value, BODY_NAMES.map((b) => ({ value: b, label: bodyLabel(b) })), (v) => this._patch(index, { body: v }))}
          ${this._select('Measured from', point.center ?? '', [{ value: '', label: '(The Sun)' }, ...BODY_NAMES.filter((b) => b !== 'sun').map((b) => ({ value: b, label: bodyLabel(b) }))],
            (v) => this._patch(index, { center: v || undefined }))}
          <div class="full hint">Where it is at the scene date (the card's clock), in the scene's or system's units (set units: km or au).</div>` : nothing}
        ${form === 'at' ? this._select('Point', value, this._points.filter((p) => p !== point && p?.id !== undefined).map((p) => ({ value: String(p.id), label: String(p.id) })), (v) => this._patch(index, { at: v })) : nothing}
        ${form === 'cell' ? this._text('Cell', value, (v) => this._patch(index, { cell: v }), 'Such as AF3') : nothing}
        ${form === 'part' ? this._renderPart(point, index) : nothing}
        ${form !== 'at' && form !== 'body' ? this._select(spec?.host ? 'On object' : 'On object (optional)', point.object ?? '',
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

  /**
   * A point on a model part: the part (a dropdown of the model's parts, or
   * free text while they are unknown) and an optional offset.
   * @param {any} point @param {number} index
   */
  _renderPart(point, index) {
    const parts = point.object ? this._partsFor(point.object) : null;
    const offset = Array.isArray(point.xyz) ? point.xyz : undefined;
    return html`
      <div class="full">
        ${parts
          ? this._select('Part', point.part, parts.map((p) => ({ value: p, label: p })), (v) => v && this._patch(index, { part: v }), { custom_value: true })
          : this._text('Part', point.part, (v) => v && this._patch(index, { part: v }), 'The name of a node in the model file (the list fills in when the preview has loaded it)')}
      </div>
      <div class="full grid3">
        ${['Offset x', 'Offset y', 'Offset z'].map((label, i) => this._number(label, offset?.[i], (v) => {
          const next = offset ? [...offset] : [0, 0, 0];
          next[i] = v ?? 0;
          this._patch(index, { xyz: next.every((n) => n === 0) ? undefined : next });
        }))}
      </div>
      <div class="full hint">The offset is in the part's own coordinates (the model file's units).</div>
    `;
  }

  // ── Card on the point ──────────────────────────────────────────────────────

  _childLovelace() {
    return { views: [{ title: 'Home', path: 'home', cards: [] }] };
  }

  /**
   * HA's card picker in a dialog; `onPick` gets the chosen card config.
   * @param {(card: any) => void} onPick
   */
  async _openCardPicker(onPick) {
    if (!customElements.get('hui-card-picker')) {
      // HA registers its picker only after its own "Add card" dialog has opened once
      showInfoDialog({
        title: 'Card picker not ready',
        message: 'Home Assistant has not loaded its card picker yet. On any dashboard, '
          + 'select "Add card" once (you can cancel it), then come back and try again.'
      });
      return;
    }
    this._pickerDialog?.remove();
    const dialog = /** @type {any} */ (document.createElement('ha-dialog'));
    dialog.headerTitle = 'Select a card';
    this._pickerDialog = dialog;
    mountDialogNearHomeAssistant(dialog, this);
    dialog.open = true;
    await dialog.updateComplete;

    const picker = /** @type {any} */ (document.createElement('hui-card-picker'));
    picker.hass = this.hass;
    picker.lovelace = this._childLovelace();
    picker.style.cssText = 'padding: var(--ha-space-6); display: block;';
    dialog.appendChild(picker);
    await new Promise((r) => setTimeout(r, 80));
    picker.requestUpdate?.();

    picker.addEventListener('config-changed', (/** @type {CustomEvent} */ e) => {
      e.stopPropagation();
      const selected = e.detail?.config;
      dialog.open = false;
      if (selected) onPick(JSON.parse(JSON.stringify(selected)));
    });
    dialog.addEventListener('closed', (/** @type {Event} */ e) => {
      e.stopPropagation();
      if (e.target !== e.currentTarget) return;
      dialog.remove();
      if (this._pickerDialog === dialog) this._pickerDialog = null;
    });
  }

  /** @param {number} index */
  _chooseCard(index) {
    this._openCardPicker((card) => {
      const point = this._points[index];
      if (!point) return;
      this._patch(index, { card: { ...(point.card ?? {}), card } });
    });
  }

  /**
   * The inline card editor changed the pinned card.
   * @param {number} index @param {CustomEvent} e
   */
  _onCardConfigChanged(index, e) {
    // Not the astrometrics card's own config: keep it from HA's edit dialog
    e.stopPropagation();
    const card = e.detail?.config ?? e.detail?.value;
    const point = this._points[index];
    if (!card?.type || !point?.card) return;
    this._patch(index, { card: { ...point.card, card } });
  }

  /** @param {any} point @param {number} index */
  _renderCard(point, index) {
    const pin = point.card && typeof point.card === 'object' ? point.card : null;
    /** @param {Record<string, any>} patch */
    const patchPin = (patch) => this._patch(index, { card: prune({ ...pin, ...patch }) });
    if (!pin?.card) {
      return html`
        <div class="pick-row">
          <ha-button appearance="outlined" @click=${() => this._chooseCard(index)}>
            <ha-icon icon="mdi:card-plus-outline" slot="start"></ha-icon>
            Add card
          </ha-button>
          <span class="hint">Any Lovelace card, shown beside the point.</span>
        </div>
      `;
    }
    const type = String(pin.card.type ?? 'card').replace('custom:', '');
    return html`
      <div class="grid">
        ${this._select('Show', pin.show ?? 'tap', CARD_SHOW, (v) => patchPin({ show: v === 'tap' ? undefined : v }))}
        <lcards-position-picker .value=${pin.position ?? 'center-right'} .label=${'Position'} .helper=${'Where the card sits round the point'}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); patchPin({ position: e.detail.value === 'center-right' ? undefined : e.detail.value }); }}>
        </lcards-position-picker>
        ${this._number('Width (px)', pin.width, (v) => patchPin({ width: v }), { min: 80, max: 1200 })}
        <div class="card-actions">
          <ha-button appearance="plain" @click=${() => this._chooseCard(index)}>
            <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>Change card
          </ha-button>
          <ha-button variant="danger" appearance="plain" @click=${() => this._patch(index, { card: undefined })}>
            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>Remove card
          </ha-button>
        </div>
      </div>
      ${customElements.get('hui-card-element-editor')
        ? html`
          <div class="card-editor-host">
            <hui-card-element-editor
              .hass=${this.hass}
              .lovelace=${this._childLovelace()}
              .value=${pin.card}
              @config-changed=${(/** @type {CustomEvent} */ e) => this._onCardConfigChanged(index, e)}>
            </hui-card-element-editor>
          </div>`
        : html`<lcards-message type="info">Edit the ${type} card in YAML (Home Assistant's card editor is not loaded here).</lcards-message>`}
    `;
  }

  /** @param {any} point @param {number} index */
  _renderLabel(point, index) {
    const styles = Object.keys(this.config?.labels?.styles ?? {});
    // the label's text field, in the card editors' own text controls (the label itself is the Label box)
    const textEditor = valueEditor({ hass: this.hass, schema: astrometricsSchema.properties.points.items, value: point,
      onChange: (v) => this._patch(index, { text: v.text }) });
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
      <lcards-form-section header="Label text" description="Position round the point, font, size, colours and background (over its style)" icon="mdi:format-text" nested outlined>
        <lcards-text-field-editor .editor=${textEditor} .config=${textEditor.config} basePath="text.label" .omit=${['content']}
          .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'selected']}>
        </lcards-text-field-editor>
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
      <lcards-form-section class="point" header=${title} data-index=${index}
        secondary=${[point.label, form ? FORMS[form]?.label : 'no position'].filter(Boolean).join(' · ')}
        icon="mdi:map-marker"
        ?expanded=${this._expanded === index}
        @expanded-changed=${(/** @type {CustomEvent} */ e) => { if (e.detail.expanded !== (this._expanded === index)) this._toggle(index); }}
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
        <lcards-form-section header="Card" description="A Lovelace card pinned to the point" icon="mdi:card-text-outline" nested outlined
          ?expanded=${!!point.card}>
          ${this._renderCard(point, index)}
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
