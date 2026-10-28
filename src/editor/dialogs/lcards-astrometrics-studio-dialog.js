/**
 * @fileoverview LCARdS Astrometrics Studio
 *
 * Full-screen editor for the astrometrics card with a live preview: the real
 * card (labels, templates, state colours, pinned cards all as on the
 * dashboard), in edit mode (`attachStudio`): a tap on the preview selects the
 * point or object under it instead of running its action, a point can be
 * dragged on its placement surface, and place mode (toolbar) adds a point
 * where the next tap lands. Selection follows both ways: opening a row
 * highlights its point or object on the scene.
 *
 * Tabs: Scene (backdrop, labels, background), Points (the points list with
 * Pick), Objects (a list; each object's form is generated from its type's
 * schema branch, so new object types need no Studio work), Camera (named
 * views captured from the preview, flown to, set first; then the camera keys),
 * Starters (whole scenes and parts copied into the config, with a few
 * params), YAML.
 *
 * The working copy is plain config: Save sends it whole.
 *
 * @element lcards-astrometrics-studio-dialog
 * @fires config-changed - On save (detail: { config }); not bubbling
 * @fires closed - When the dialog closes; not bubbling
 */

import { LitElement, html, css, nothing } from 'lit';
import jsYaml from 'js-yaml';
import { createRef, ref } from 'lit/directives/ref.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { messageStyles } from '../base/surface-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { astrometricsSchema, objectSchema } from '../../cards/schemas/astrometrics-schema.js';
import { TYPE_GUIDE } from '../../core/astrometrics/names.js';
import { objectBranch, objectSummary, freshId, newObject, COMMON_GROUPS } from './astro-studio/schema-fields.js';
import {
  viewsOf, startViewName, captureView, freshViewName, setView, deleteView, moveView, renameView, viewNameProblem, viewSummary
} from './astro-studio/camera-views.js';
import { STARTERS, applyStarter, starterParams, hasScene } from '../../core/astrometrics/starters/index.js';
import { showConfirmDeleteDialog } from '../../views/layout-edit-dialogs.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import './astro-studio/lcards-astro-schema-form.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/editors/lcards-astro-points-editor.js';
import '../components/yaml/lcards-studio-yaml-tab.js';

const clone = (/** @type {any} */ v) => JSON.parse(JSON.stringify(v ?? {}));
const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** Debounce for preview updates while typing, ms */
const PREVIEW_DELAY = 150;

/** Keys of the Scene tab, in order */
const SCENE_KEYS = ['backdrop', 'labels', 'background_animation'];

export class LCARdSAstrometricsStudioDialog extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _workingConfig: { state: true },
      _activeTab: { state: true },
      _expandedObject: { state: true },
      _selectedPoint: { state: true },
      _addingObject: { state: true },
      _showAll: { state: true },
      _placing: { state: true },
      _status: { state: true },
      _expandedView: { state: true },
      _openStarter: { state: true },
      _starterParams: { state: true },
      _starterMessage: { state: true },
      _viewError: { state: true }
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    /** @type {Record<string, any>} */
    this._initialConfig = {};
    /** @type {Record<string, any>} */
    this._workingConfig = {};
    this._activeTab = 'objects';
    this._expandedObject = -1;
    /** @type {string | null} */
    this._selectedPoint = null;
    this._addingObject = false;
    this._showAll = false;
    this._placing = false;
    /** @type {string} the toolbar's line while dragging or placing (else the hint) */
    this._status = '';
    /** @type {string | null} the open view row in the Camera tab */
    this._expandedView = null;
    /** @type {string} why the last rename was refused */
    this._viewError = '';
    /** @type {string | null} the open starter in the Starters tab */
    this._openStarter = null;
    /** @type {Record<string, Record<string, any>>} what was typed into each starter's params */
    this._starterParams = {};
    /** @type {{ starter: string, type: 'error' | 'success', text: string } | null} the last insert's outcome, shown in that starter */
    this._starterMessage = null;
    this._previewRef = createRef();
    this._onPlaceKey = this._onPlaceKey.bind(this);
    /** @type {any} the preview card */
    this._previewCard = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this._previewTimer = undefined;
  }

  /** The config to edit (copied on open). */
  set config(value) {
    this._initialConfig = value ?? {};
  }

  get config() {
    return this._workingConfig;
  }

  connectedCallback() {
    super.connectedCallback();
    this._workingConfig = clone(this._initialConfig);
    this._workingConfig.type ||= 'custom:lcards-astrometrics-card';
    if (!Array.isArray(this._workingConfig.points) || !this._workingConfig.points.length) this._activeTab = 'points';
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._previewTimer);
    window.removeEventListener('keydown', this._onPlaceKey, true);
    this._previewCard?.attachStudio?.(null);
  }

  firstUpdated() {
    this._mountPreview();
  }

  /** @param {Map<string, unknown>} changed */
  updated(changed) {
    if (changed.has('hass') && this._previewCard) this._previewCard.hass = this.hass;
  }

  // ── Working config ─────────────────────────────────────────────────────────

  /** @returns {any[]} */
  get _points() {
    return Array.isArray(this._workingConfig.points) ? this._workingConfig.points : [];
  }

  /** @returns {any[]} */
  get _objects() {
    return Array.isArray(this._workingConfig.objects) ? this._workingConfig.objects : [];
  }

  get _pointIds() {
    return this._points.map((p) => p?.id).filter((id) => id !== undefined).map(String);
  }

  /**
   * Replace the working config and refresh the preview.
   * @param {Record<string, any>} next
   * @param {{ now?: boolean }} [opts]
   */
  _commit(next, { now = false } = {}) {
    this._workingConfig = next;
    clearTimeout(this._previewTimer);
    if (now) this._updatePreview();
    else this._previewTimer = setTimeout(() => this._updatePreview(), PREVIEW_DELAY);
  }

  /** @param {string} key @param {any} value */
  _setTop(key, value) {
    const next = { ...this._workingConfig };
    if (value === undefined || (Array.isArray(value) && !value.length && key !== 'points')) delete next[key];
    else next[key] = value;
    this._commit(next);
  }

  /** @param {any[]} objects */
  _setObjects(objects) {
    this._setTop('objects', objects.length ? objects : undefined);
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  /** The config the preview card shows: the working copy, filling the panel. */
  _previewConfig() {
    return { ...clone(this._workingConfig), height: '100%' };
  }

  /** @private */
  _mountPreview() {
    const host = /** @type {HTMLElement | undefined} */ (this._previewRef.value);
    if (!host) return;
    const card = /** @type {any} */ (document.createElement('lcards-astrometrics-card'));
    try {
      card.setConfig(this._previewConfig());
    } catch (error) {
      lcardsLog.warn('[AstrometricsStudio] Preview config rejected', error);
    }
    card.hass = this.hass;
    host.replaceChildren(card);
    this._previewCard = card;
    card.attachStudio?.({
      onSelect: (/** @type {any} */ hit) => this._onSceneSelect(hit),
      onDrag: (/** @type {string} */ id, /** @type {string} */ form, /** @type {any} */ value, /** @type {boolean} */ done) => this._onPointDrag(id, form, value, done)
    });
  }

  /** @private */
  _updatePreview() {
    const card = this._previewCard;
    if (!card) return;
    try {
      card.setConfig(this._previewConfig());
    } catch (error) {
      lcardsLog.warn('[AstrometricsStudio] Preview config rejected', error);
    }
  }

  /**
   * A tap on the preview: open what is under it in its list.
   * @param {{ kind: 'point' | 'object', id: string } | null} hit
   * @private
   */
  _onSceneSelect(hit) {
    if (!hit) {
      this._selectPoint(null);
      if (this._activeTab === 'objects') this._expandedObject = -1;
      return;
    }
    if (hit.kind === 'point') {
      this._activeTab = 'points';
      this._selectPoint(hit.id);
      return;
    }
    const index = this._objects.findIndex((o, i) => this._objectId(o, i) === hit.id);
    if (index < 0) return;
    this._activeTab = 'objects';
    this._selectObject(index);
    this.updateComplete.then(() => this.renderRoot.querySelector(`[data-object="${index}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  /** @param {string | null} id @private */
  async _selectPoint(id) {
    this._selectedPoint = id;
    const scene = await this._previewCard?.studioScene?.();
    scene?.highlight(id);
  }

  /**
   * Open an object's row (-1 closes) and box it on the scene.
   * @param {number} index
   * @private
   */
  async _selectObject(index) {
    this._expandedObject = index;
    this._selectedPoint = null;
    const obj = this._objects[index];
    const scene = await this._previewCard?.studioScene?.();
    scene?.highlight(obj ? this._objectId(obj, index) : null, 'object');
  }

  /**
   * A point dragged on the preview: shown live by the scene; the value goes
   * into the working copy on release (and the point opens in its list).
   * @param {string} id
   * @param {string} form
   * @param {number[] | string} value
   * @param {boolean} done
   * @private
   */
  _onPointDrag(id, form, value, done) {
    const shown = Array.isArray(value) ? value.join(', ') : value;
    if (!done) {
      this._status = `${id}: ${form} ${shown}`;
      return;
    }
    this._status = '';
    const points = this._points.map((p) => (p && String(p.id) === id ? { ...p, [form]: value } : p));
    this._setTop('points', points);
    this._activeTab = 'points';
    this._selectPoint(id);
  }

  // ── Place mode ─────────────────────────────────────────────────────────────

  /**
   * Place mode on or off: while on, the next tap on the preview adds a point
   * there (on the object under it in its natural form, else on the ground).
   * @param {boolean} on
   * @private
   */
  async _setPlacing(on) {
    const card = this._previewCard;
    const scene = await card?.studioScene?.();
    if (!scene) return;
    if (on) {
      card.cancelPick?.();
      this._placing = true;
      this._status = 'Tap the scene to place a new point. Escape cancels.';
      window.addEventListener('keydown', this._onPlaceKey, true);
      scene.setPickHandler((/** @type {number} */ x, /** @type {number} */ y) => {
        const place = scene.placementAt(x, y);
        if (!place) {
          this._status = 'Nothing to stand on there: tap an object or the ground plane.';
          return;
        }
        this._setPlacing(false);
        this._addPlacedPoint(place);
      });
    } else if (this._placing) {
      this._placing = false;
      this._status = '';
      window.removeEventListener('keydown', this._onPlaceKey, true);
      scene.setPickHandler(null);
    }
  }

  /** @param {KeyboardEvent} e @private */
  _onPlaceKey(e) {
    if (e.key !== 'Escape' || !this._placing) return;
    e.stopPropagation();
    e.preventDefault();
    this._setPlacing(false);
  }

  /**
   * Add a point at a placement from the scene, open in the Points tab.
   * @param {{ form: string, value: number[] | string, object?: string }} place
   * @private
   */
  _addPlacedPoint({ form, value, object }) {
    const id = freshId('point', this._pointIds);
    const point = { id, ...(object ? { object } : {}), [form]: value, marker: 'dot', label: 'NEW POINT' };
    this._setTop('points', [...this._points, point]);
    this._activeTab = 'points';
    this._selectPoint(id);
  }

  /**
   * An object's id as the scene names it (type#n when it has none).
   * @param {any} obj
   * @param {number} index
   */
  _objectId(obj, index) {
    if (obj?.id !== undefined) return String(obj.id);
    const n = this._objects.slice(0, index + 1).filter((o) => o?.type === obj?.type).length;
    return `${obj?.type}#${n}`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  static get styles() {
    return [
      editorStyles,
      studioDialogStyles,
      messageStyles,
      css`
        :host { display: block; }
        /* The MSD studio's split: a third for the forms, two thirds for the scene.
           Rows too, or the shared sheet's narrow-screen rule leaves an empty row. */
        .studio-layout { grid-template-columns: 33.3% 66.6%; grid-template-rows: minmax(0, 1fr); }
        .tab-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: var(--ha-space-4); min-height: 0; }
        ha-tab-group { flex-shrink: 0; }
        .preview-stage { position: relative; flex: 1; min-height: 0; }
        .preview-stage > div { position: absolute; inset: 0; }
        .tab-header { display: flex; align-items: center; justify-content: space-between; gap: var(--ha-space-2); margin-bottom: var(--ha-space-2); }
        .tab-header h3 { margin: 0; }
        .object { margin-bottom: var(--ha-space-2); display: block; }
        .empty { padding: var(--ha-space-4); text-align: center; color: var(--secondary-text-color); }
        .type-picker { margin-bottom: var(--ha-space-3); }
        .type-picker-actions { display: flex; justify-content: flex-end; gap: var(--ha-space-2); margin-top: var(--ha-space-2); }
        lcards-form-section { display: block; }
        .canvas-toolbar { align-items: center; }
        .view-actions { display: flex; flex-wrap: wrap; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); }
        .view-name { display: block; margin-bottom: var(--ha-space-3); }
        .views-section { margin-bottom: var(--ha-space-4); }
        .views-section > .hint { margin-bottom: var(--ha-space-2); }
        .starter-group { margin: var(--ha-space-4) 0 var(--ha-space-2); }
        .starter-params { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-3); margin-bottom: var(--ha-space-3); }
        .starter-yaml { max-height: 220px; overflow: auto; margin: 0 0 var(--ha-space-3); padding: var(--ha-space-2) var(--ha-space-3);
          font-family: var(--ha-font-family-code, monospace); font-size: var(--ha-font-size-s, 12px); white-space: pre;
          border-radius: var(--ha-border-radius-md); background-color: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent)); }
        .starter-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ha-space-2); }
        .toolbar-status { color: white; font-size: var(--ha-font-size-s, 12px); padding-right: var(--ha-space-2); max-width: 32ch; }
      `
    ];
  }

  render() {
    const tabs = [
      { id: 'scene', label: 'Scene', icon: 'mdi:star-four-points-outline' },
      { id: 'points', label: 'Points', icon: 'mdi:map-marker-multiple' },
      { id: 'objects', label: 'Objects', icon: 'mdi:shape-outline' },
      { id: 'camera', label: 'Camera', icon: 'mdi:video-3d' },
      { id: 'starters', label: 'Starters', icon: 'mdi:rocket-launch-outline' },
      { id: 'yaml', label: 'YAML', icon: 'mdi:code-braces' }
    ];
    return html`
      <ha-dialog open flexcontent @closed=${this._onDialogClosed} header-title="Astrometrics Studio">
        <div class="dialog-content">
          <div class="studio-layout">
            <div class="config-panel">
              <ha-tab-group @wa-tab-show=${this._onTab}>
                ${tabs.map((t) => html`
                  <ha-tab-group-tab value=${t.id} ?active=${this._activeTab === t.id}>
                    <ha-icon icon=${t.icon}></ha-icon>
                    ${t.label}
                  </ha-tab-group-tab>`)}
              </ha-tab-group>
              <div class="tab-content">${this._renderActiveTab()}</div>
            </div>
            <div class="preview-panel">
              <div class="canvas-toolbar">
                <div class="canvas-toolbar-buttons">
                  <button class="canvas-toolbar-button" title="Back to the start view" aria-label="Back to the start view" @click=${this._home}>
                    <ha-icon icon="mdi:home-outline"></ha-icon>
                  </button>
                  <button class="canvas-toolbar-button ${this._placing ? 'active' : ''}" title="Place a point" aria-label="Place a point"
                    aria-pressed=${this._placing ? 'true' : 'false'} @click=${() => this._setPlacing(!this._placing)}>
                    <ha-icon icon="mdi:map-marker-plus-outline"></ha-icon>
                  </button>
                </div>
                <span class="hint toolbar-status">${this._status || 'Tap a point or object to edit it, drag a point to move it.'}</span>
              </div>
              <div class="preview-stage"><div ${ref(this._previewRef)}></div></div>
            </div>
          </div>
        </div>
        <ha-dialog-footer slot="footer">
          <div class="footer-start" slot="secondaryAction">
            <ha-button appearance="plain" @click=${() => window.open(docsUrl(DOCS.astrometrics), '_blank', 'noopener')}>
              <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
              Documentation
            </ha-button>
          </div>
          <ha-button slot="secondaryAction" appearance="plain" @click=${this._close}>Cancel</ha-button>
          <ha-button slot="primaryAction" variant="brand" @click=${this._save}>
            <ha-icon icon="mdi:check" slot="start"></ha-icon>
            Save
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }

  /** @private */
  _renderActiveTab() {
    switch (this._activeTab) {
      case 'scene': return this._renderSceneTab();
      case 'points': return this._renderPointsTab();
      case 'camera': return this._renderCameraTab();
      case 'starters': return this._renderStartersTab();
      case 'yaml': return html`
        <lcards-studio-yaml-tab
          .hass=${this.hass}
          .config=${this._workingConfig}
          .schema=${astrometricsSchema}
          cardType="astrometrics"
          @yaml-config-changed=${(/** @type {CustomEvent} */ e) => this._commit(clone(e.detail.config))}>
        </lcards-studio-yaml-tab>`;
      default: return this._renderObjectsTab();
    }
  }

  /** @private */
  _renderSceneTab() {
    return html`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${astrometricsSchema.properties} .keys=${SCENE_KEYS}
        .value=${this._workingConfig} .pointIds=${this._pointIds}
        @form-changed=${(/** @type {CustomEvent} */ e) => this._commit(e.detail.value)}>
      </lcards-astro-schema-form>
    `;
  }

  /** @private */
  _renderPointsTab() {
    return html`
      <lcards-astro-points-editor
        .hass=${this.hass}
        .config=${this._workingConfig}
        .preview=${this._previewCard}
        .selected=${this._selectedPoint}
        @point-selected=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._selectPoint(e.detail.id); }}
        @points-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._setTop('points', e.detail.value); }}>
      </lcards-astro-points-editor>
    `;
  }

  /** @private */
  _renderCameraTab() {
    const props = astrometricsSchema.properties.camera.properties;
    const keys = Object.keys(props).filter((k) => k !== 'views');
    const camera = isObj(this._workingConfig.camera) ? this._workingConfig.camera : {};
    return html`
      ${this._renderViews(camera)}
      <lcards-astro-schema-form .hass=${this.hass} .schema=${props} .keys=${keys} .value=${camera} .pointIds=${this._pointIds}
        .choices=${{ view: Object.keys(viewsOf(camera)) }}
        @form-changed=${(/** @type {CustomEvent} */ e) => this._setTop('camera', Object.keys(e.detail.value).length ? e.detail.value : undefined)}>
      </lcards-astro-schema-form>
    `;
  }

  /**
   * The named views: capture from the preview, fly to, set first, rename,
   * reorder, delete; each view's keys in a generated form.
   * @param {Record<string, any>} camera
   * @private
   */
  _renderViews(camera) {
    const views = viewsOf(camera);
    const names = Object.keys(views);
    const first = startViewName(camera);
    return html`
      <div class="views-section">
        <div class="tab-header">
          <h3>Views</h3>
          <ha-button @click=${() => this._captureView(null)}>
            <ha-icon icon="mdi:camera-plus-outline" slot="start"></ha-icon>
            Capture view
          </ha-button>
        </div>
        <div class="hint">Move the preview's camera, then capture it as a named view. A tap_action with action: fly-to and view: its name flies there.</div>
        ${names.length
          ? names.map((name, i) => this._renderView(name, views[name], i, names.length, name === first))
          : html`<div class="empty">No views yet: the card frames the whole scene.</div>`}
      </div>
    `;
  }

  /**
   * @param {string} name
   * @param {any} view
   * @param {number} index
   * @param {number} total
   * @param {boolean} isFirst
   * @private
   */
  _renderView(name, view, index, total, isFirst) {
    const expanded = this._expandedView === name;
    const viewProps = astrometricsSchema.properties.camera.properties.views.additionalProperties.properties;
    return html`
      <lcards-form-section class="object" data-view=${name} header=${name}
        secondary=${[isFirst ? 'start view' : null, viewSummary(view)].filter(Boolean).join(' · ')}
        icon=${isFirst ? 'mdi:star' : 'mdi:video-outline'} outlined ?expanded=${expanded}
        @expanded-changed=${(/** @type {CustomEvent} */ e) => {
          if (e.detail.expanded) this._expandedView = name;
          else if (this._expandedView === name) this._expandedView = null;
          this._viewError = '';
        }}>
        <ha-icon-button slot="header-icons" .label=${'Fly to'}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._flyToView(view); }}>
          <ha-icon icon="mdi:airplane"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Move up'} ?disabled=${index === 0}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._setCamera(moveView(this._workingConfig.camera, name, -1)); }}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Move down'} ?disabled=${index === total - 1}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._setCamera(moveView(this._workingConfig.camera, name, 1)); }}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Delete view'}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._deleteView(name); }}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
        ${expanded ? html`
          <div class="view-actions">
            <ha-button appearance="plain" @click=${() => this._captureView(name)}>
              <ha-icon icon="mdi:camera-outline" slot="start"></ha-icon>
              Capture over this view
            </ha-button>
            <ha-button appearance="plain" ?disabled=${isFirst && this._workingConfig.camera?.view === name}
              @click=${() => this._setCamera({ ...this._workingConfig.camera, view: name })}>
              <ha-icon icon="mdi:star-outline" slot="start"></ha-icon>
              Start here
            </ha-button>
          </div>
          <ha-input class="view-name" .label=${'Name'} .value=${name}
            @change=${(/** @type {Event} */ e) => this._renameView(name, /** @type {any} */ (e.target).value)}></ha-input>
          ${this._viewError ? html`<lcards-message type="error">${this._viewError}</lcards-message>` : nothing}
          <lcards-astro-schema-form .hass=${this.hass} .schema=${viewProps} .keys=${Object.keys(viewProps)} .value=${view} .pointIds=${this._pointIds}
            @form-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._setCamera(setView(this._workingConfig.camera, name, e.detail.value)); }}>
          </lcards-astro-schema-form>` : nothing}
      </lcards-form-section>
    `;
  }

  /** @param {Record<string, any> | undefined} camera @param {{ now?: boolean }} [opts] @private */
  _setCamera(camera, { now = false } = {}) {
    const next = { ...this._workingConfig };
    if (camera) next.camera = camera;
    else delete next.camera;
    this._commit(next, { now });
  }

  /**
   * The preview's camera as a view: a new one (name null) or over a view.
   * @param {string | null} name
   * @private
   */
  async _captureView(name) {
    const scene = await this._previewCard?.studioScene?.();
    if (!scene) return;
    const camera = this._workingConfig.camera;
    const views = viewsOf(camera);
    const target = name ?? freshViewName(views);
    this._setCamera(setView(camera, target, captureView(scene.cameraKeys(), scene.pointPositions(), views[target])), { now: true });
    this._expandedView = target;
    this._viewError = '';
  }

  /** @param {any} view @private */
  async _flyToView(view) {
    const scene = await this._previewCard?.studioScene?.();
    scene?.flyTo(view);
  }

  /** @param {string} from @param {string} to @private */
  _renameView(from, to) {
    const name = String(to ?? '').trim();
    const problem = viewNameProblem(viewsOf(this._workingConfig.camera), name, from);
    this._viewError = problem ?? '';
    if (problem || name === from) return;
    this._expandedView = name;
    this._commit(renameView(this._workingConfig, from, name));
  }

  /** @param {string} name @private */
  async _deleteView(name) {
    const ok = await showConfirmDeleteDialog({
      title: 'Delete view',
      message: `Delete the view ${name}? Actions that fly to it stop working.`
    });
    if (!ok) return;
    if (this._expandedView === name) this._expandedView = null;
    this._setCamera(deleteView(this._workingConfig.camera, name));
  }

  /** @private */
  _renderStartersTab() {
    const group = (/** @type {'scene' | 'part'} */ kind) => STARTERS.filter((st) => st.kind === kind).map((st) => this._renderStarter(st));
    return html`
      <div class="hint">Starters are copied into your config: change anything afterwards, nothing refers back to them. A scene replaces what is here (or merges into it); a part adds itself, its ids starting with the name you give it.</div>
      <h3 class="starter-group">Scenes</h3>
      ${group('scene')}
      <h3 class="starter-group">Parts</h3>
      ${group('part')}
    `;
  }

  /**
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @private
   */
  _renderStarter(starter) {
    const expanded = this._openStarter === starter.id;
    const typed = this._starterParams[starter.id] ?? {};
    return html`
      <lcards-form-section class="object" data-starter=${starter.id} header=${starter.title} secondary=${starter.description}
        icon=${starter.icon} outlined ?expanded=${expanded}
        @expanded-changed=${(/** @type {CustomEvent} */ e) => {
          if (e.detail.expanded) this._openStarter = starter.id;
          else if (this._openStarter === starter.id) this._openStarter = null;
        }}>
        ${expanded ? html`
          ${starter.params.length ? html`
            <div class="starter-params">
              ${starter.params.map((p) => html`
                <ha-input .label=${p.label} .value=${String(typed[p.key] ?? (Array.isArray(p.default) ? p.default.join(', ') : p.default))}
                  type=${p.type === 'number' ? 'number' : 'text'} .hint=${p.helper ?? ''}
                  @change=${(/** @type {Event} */ e) => this._setStarterParam(starter.id, p.key, /** @type {any} */ (e.target).value)}></ha-input>`)}
            </div>` : nothing}
          <pre class="starter-yaml">${this._starterYaml(starter, typed)}</pre>
          ${this._starterMessage?.starter === starter.id
            ? html`<lcards-message type=${this._starterMessage.type}>${this._starterMessage.text}</lcards-message>` : nothing}
          <div class="starter-actions">
            ${starter.kind === 'scene' ? html`
              <ha-button appearance="plain" ?disabled=${!hasScene(this._workingConfig)} @click=${() => this._insertStarter(starter, 'merge')}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Merge into the scene
              </ha-button>
              <ha-button @click=${() => this._insertStarter(starter, 'replace')}>
                <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>
                Use this scene
              </ha-button>` : html`
              <ha-button @click=${() => this._insertStarter(starter, 'merge')}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Add to the scene
              </ha-button>`}
          </div>` : nothing}
      </lcards-form-section>
    `;
  }

  /** @param {string} id @param {string} key @param {any} value @private */
  _setStarterParam(id, key, value) {
    this._starterParams = { ...this._starterParams, [id]: { ...this._starterParams[id], [key]: value } };
  }

  /**
   * The YAML a starter adds, with the params as typed.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {Record<string, any>} typed
   * @private
   */
  _starterYaml(starter, typed) {
    const out = applyStarter({}, starter, typed);
    if (!out.config) return out.error;
    const { type: _type, ...added } = out.config;
    return jsYaml.dump(added, { flowLevel: 3, lineWidth: 120, noRefs: true });
  }

  /**
   * Put a starter into the working copy: a scene replaces (confirmed when
   * there is a scene) or merges; a part adds. Clashing ids are refused.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {'replace' | 'merge'} mode
   * @private
   */
  async _insertStarter(starter, mode) {
    if (starter.kind === 'scene' && mode === 'replace' && hasScene(this._workingConfig)) {
      const ok = await showConfirmDeleteDialog({
        title: 'Replace the scene',
        message: `Replace the points, objects, camera, backdrop and labels with ${starter.title}? Cancel in the Studio still brings them back.`,
        confirmText: 'Replace'
      });
      if (!ok) return;
    }
    const out = applyStarter(this._workingConfig, starter, this._starterParams[starter.id] ?? {}, { mode });
    if (!out.config || !out.added) {
      this._starterMessage = { starter: starter.id, type: 'error', text: String(out.error) };
      return;
    }
    const n = (/** @type {any[] | undefined} */ list, /** @type {string} */ word) => (list?.length ? `${list.length} ${word}${list.length === 1 ? '' : 's'}` : null);
    const what = [n(out.added.points, 'point'), n(out.added.objects, 'object'), n(Object.keys(out.added.views ?? {}), 'view')].filter(Boolean).join(', ');
    this._starterMessage = { starter: starter.id, type: 'success', text: `${starter.title}: added ${what}.` };
    this._expandedObject = -1;
    this._selectedPoint = null;
    this._commit(out.config, { now: true });
  }

  /** @private */
  _renderObjectsTab() {
    const objects = this._objects;
    return html`
      <div class="tab-header">
        <h3>Objects</h3>
        <div>
          <ha-button appearance="plain" @click=${() => { this._showAll = !this._showAll; }}>
            <ha-icon icon=${this._showAll ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} slot="start"></ha-icon>
            ${this._showAll ? 'Hide keys for other shapes' : 'Show every key'}
          </ha-button>
          <ha-button @click=${() => { this._addingObject = !this._addingObject; }}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add object
          </ha-button>
        </div>
      </div>
      ${this._addingObject ? this._renderTypePicker() : nothing}
      ${objects.length
        ? objects.map((o, i) => this._renderObject(o, i, objects.length))
        : html`<div class="empty">No objects yet. Add a grid, a sphere or another type to draw something.</div>`}
    `;
  }

  /** @private */
  _renderTypePicker() {
    const options = TYPE_GUIDE.map((t) => ({ value: t.type, label: t.type, description: t.use }));
    // box mode shows each type's description under its name
    return html`
      <lcards-form-section class="type-picker" header="Which type for what" icon="mdi:shape-plus-outline" outlined ?expanded=${true}>
        <ha-selector .hass=${this.hass} .required=${false}
          .selector=${{ select: { mode: 'box', options } }}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); if (e.detail.value) this._addObject(e.detail.value); }}>
        </ha-selector>
        <div class="type-picker-actions">
          <ha-button appearance="plain" @click=${() => { this._addingObject = false; }}>Cancel</ha-button>
        </div>
      </lcards-form-section>
    `;
  }

  /** @param {string} type @private */
  _addObject(type) {
    const objects = this._objects;
    const ids = objects.map((o, i) => this._objectId(o, i));
    this._addingObject = false;
    this._expandedObject = objects.length;
    this._setObjects([...objects, newObject(type, ids, this._pointIds)]);
  }

  /**
   * @param {any} obj
   * @param {number} index
   * @param {number} total
   * @private
   */
  _renderObject(obj, index, total) {
    const parts = objectBranch(objectSchema, obj?.type);
    const guide = TYPE_GUIDE.find((t) => t.type === obj?.type);
    const id = this._objectId(obj, index);
    /** @param {Record<string, any>} next */
    const set = (next) => this._setObjects(this._objects.map((o, i) => (i === index ? next : o)));
    const expanded = this._expandedObject === index;
    return html`
      <lcards-form-section class="object" data-object=${index} header=${id}
        secondary=${[obj?.type, objectSummary(obj)].filter(Boolean).join(' · ')}
        icon=${guide?.icon ?? 'mdi:shape-outline'} outlined ?expanded=${expanded}
        @expanded-changed=${(/** @type {CustomEvent} */ e) => { if (e.detail.expanded) this._selectObject(index); else if (this._expandedObject === index) this._selectObject(-1); }}>
        <ha-icon-button slot="header-icons" .label=${'Move up'} ?disabled=${index === 0}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._moveObject(index, -1); }}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Move down'} ?disabled=${index === total - 1}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._moveObject(index, 1); }}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Duplicate'}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._duplicateObject(index); }}>
          <ha-icon icon="mdi:content-copy"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Delete object'}
          @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._deleteObject(index); }}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
        ${expanded ? (parts ? this._renderObjectForm(obj, parts, set) : html`
          <lcards-message type="warning">Unknown type ${String(obj?.type)}: edit this object in the YAML tab.</lcards-message>`) : nothing}
      </lcards-form-section>
    `;
  }

  /**
   * An object's form: its type's own keys, then placement, then actions and tags.
   * @param {any} obj
   * @param {{ branch: any, own: Record<string, any>, common: Record<string, any> }} parts
   * @param {(next: Record<string, any>) => void} set
   * @private
   */
  _renderObjectForm(obj, parts, set) {
    const props = { ...parts.common, ...parts.own };
    const own = ['id', ...Object.keys(parts.own)].filter((k) => k !== 'id' || props.id);
    const placement = COMMON_GROUPS.placement.filter((k) => parts.common[k]);
    const actions = COMMON_GROUPS.actions.filter((k) => parts.common[k]);
    /** @param {string[]} keys */
    const form = (keys) => html`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${props} .keys=${keys} .value=${obj} .pointIds=${this._pointIds} ?showAll=${this._showAll}
        @form-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); set({ type: obj.type, ...e.detail.value }); }}>
      </lcards-astro-schema-form>`;
    return html`
      ${parts.branch.description ? html`<div class="hint">${parts.branch.description}</div>` : nothing}
      ${form(own)}
      <lcards-form-section header="Placement" icon="mdi:axis-arrow" nested outlined ?expanded=${false}>${form(placement)}</lcards-form-section>
      <lcards-form-section header="Actions and tags" icon="mdi:gesture-tap" nested outlined ?expanded=${false}>${form(actions)}</lcards-form-section>
    `;
  }

  /** @param {number} index @param {number} delta @private */
  _moveObject(index, delta) {
    const objects = [...this._objects];
    const target = index + delta;
    if (target < 0 || target >= objects.length) return;
    [objects[index], objects[target]] = [objects[target], objects[index]];
    this._expandedObject = target;
    this._setObjects(objects);
  }

  /** @param {number} index @private */
  _duplicateObject(index) {
    const objects = this._objects;
    const src = objects[index];
    const ids = objects.map((o, i) => this._objectId(o, i));
    const copy = { ...clone(src), id: freshId(`${src?.id ?? src?.type}_`, ids) };
    this._expandedObject = index + 1;
    this._setObjects([...objects.slice(0, index + 1), copy, ...objects.slice(index + 1)]);
  }

  /** @param {number} index @private */
  async _deleteObject(index) {
    const obj = this._objects[index];
    const ok = await showConfirmDeleteDialog({
      title: 'Delete object',
      message: `Delete ${this._objectId(obj, index)}? Points standing on it lose their surface.`
    });
    if (!ok) return;
    if (this._expandedObject === index) this._expandedObject = -1;
    this._setObjects(this._objects.filter((_, i) => i !== index));
  }

  // ── Toolbar, tabs, save ────────────────────────────────────────────────────

  /** @private */
  async _home() {
    const scene = await this._previewCard?.studioScene?.();
    scene?.home();
  }

  /** @param {Event} e @private */
  _onTab(e) {
    const value = /** @type {any} */ (e.target).activeTab?.getAttribute('value');
    if (value) this._activeTab = value;
  }

  /**
   * Only the dialog's own `closed` cancels; closes bubbling from pickers and
   * selects inside it must not close the studio (or reach the card editor).
   * @param {Event} e
   * @private
   */
  _onDialogClosed(e) {
    e.stopPropagation();
    if (e.target === e.currentTarget) this._close();
  }

  /** @private */
  _save() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: clone(this._workingConfig) } }));
    this._close();
  }

  /** @private */
  _close() {
    this.dispatchEvent(new CustomEvent('closed'));
  }
}

if (!customElements.get('lcards-astrometrics-studio-dialog')) {
  customElements.define('lcards-astrometrics-studio-dialog', LCARdSAstrometricsStudioDialog);
}
