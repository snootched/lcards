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
 * Tabs, in the order a card is built: Starters (whole scenes and parts
 * copied into the config, with a few params), Scene (backdrop, labels,
 * background), Objects (a list; each object's form is generated from its
 * type's schema branch, so new object types need no Studio work), Points (the
 * points list with Pick), Camera (named views captured from the preview,
 * flown to, set first; then the camera keys), YAML. Each tab opens with an
 * info guide (astro-studio/studio-guides.js).
 *
 * The working copy is plain config: Save sends it whole. Every commit goes
 * through `_commit`, which records the copy it replaces for undo and redo
 * (astro-studio/history.js). A starter can be tried first: the preview shows
 * the working copy with the starter in it (`_trying`) until Keep commits it
 * or Discard drops it.
 *
 * @element lcards-astrometrics-studio-dialog
 * @fires config-changed - On save (detail: { config }); not bubbling
 * @fires closed - When the dialog closes; not bubbling
 */

import { LitElement, html, css, nothing } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { messageStyles } from '../base/surface-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { astrometricsSchema, objectSchema } from '../../cards/schemas/astrometrics-schema.js';
import { TYPE_GUIDE } from '../../core/astrometrics/names.js';
import { objectBranch, objectSummary, freshId, newObject, viewScale, reshape, OBJECT_GROUPS, groupOf, keysBound } from './astro-studio/schema-fields.js';
import {
  viewsOf, startViewName, captureView, freshViewName, setView, deleteView, moveView, renameView, viewNameProblem, viewSummary
} from './astro-studio/camera-views.js';
import { STARTERS, applyStarter, hasScene, unitsClash, targetUnits, targetOf, fitFactor } from '../../core/astrometrics/starters/index.js';
import { starterYaml } from '../../core/astrometrics/starters/yaml.js';
import { showConfirmDeleteDialog } from '../../views/layout-edit-dialogs.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { SCENE_SCOPE, scopeSystem, validScope, scopedList, setScopedList, scopedObjectIds, pointScope, objectScope, allPointIds, allObjectIds, pointsEditorConfig } from './astro-studio/systems.js';
import { createHistory } from './astro-studio/history.js';
import { modelSizeReadout, fitToViewSize, roundLength, shortNumber } from './astro-studio/model-size.js';
import { prismOutline } from '../../core/astrometrics/objects/volume.js';
import { starterPicture, typePicture, TYPE_GROUPS, starterParamSchema, starterParamChoices, starterParamValues, starterAdds, fragmentCounts, sceneUnitsText } from './astro-studio/starter-gallery.js';
import { overviewGuide, startersGuide, objectsGuide, pointsGuide, cameraGuide } from './astro-studio/studio-guides.js';
import './astro-studio/lcards-astro-schema-form.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/editors/lcards-astro-points-editor.js';
import '../components/yaml/lcards-studio-yaml-tab.js';
import '../components/lcards-background-animation-editor.js';
import './astro-studio/lcards-astro-labels-editor.js';

/**
 * How a starter goes in: replace the scene, merge or add, or (`scene`) start
 * with the scene a part is made for and add the part to it.
 * @typedef {'replace' | 'merge' | 'scene'} StarterMode
 */

const clone = (/** @type {any} */ v) => JSON.parse(JSON.stringify(v ?? {}));
const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Scene keys of the card's default config (getStubConfig) */
const STUB_KEYS = ['points', 'objects', 'camera', 'backdrop'];

/**
 * A card with no scene of its own: empty, or still the scene a new card is
 * placed with (the card's getStubConfig). It opens on Starters, and a scene
 * starter replaces it without asking.
 * @param {Record<string, any>} config
 */
export function isStarterCard(config) {
  if (!hasScene(config)) return true;
  const stub = /** @type {any} */ (customElements.get('lcards-astrometrics-card'))?.getStubConfig?.();
  return !!stub && STUB_KEYS.every((k) => JSON.stringify(config[k]) === JSON.stringify(stub[k]));
}
/** Debounce for preview updates while typing, ms */
const PREVIEW_DELAY = 150;

/** How long the Studio waits for a model file to load in the preview (a big download takes a while), ms */
const MODEL_WAIT_MS = 5 * 60 * 1000;

/** Keys of the Scene tab, in order */
/**
 * The Scene tab's sections: each lists schema keys at a path of the config
 * ('' the card itself), shown as one form per part.
 * @type {{ id: string, header: string, icon: string, hint: string, parts: { path: string, keys: string[] }[] }[]}
 */
const SCENE_GROUPS = [
  { id: 'units', header: 'Units', icon: 'mdi:ruler', hint: 'Scene units are your own: every position, size and distance is in them. Name them (km, au, ly) for real data: parts and models then start at their real size, and bodies sit at real distances. In scene units, a part is sized to fit what is already there. Naming the units does not rescale the scene.', parts: [{ path: '', keys: ['units'] }] },
  { id: 'look', header: 'Look', icon: 'mdi:eye-outline', hint: 'Which objects and points show: the diagram ones, the realistic ones, or both. Each object and point can pick its look. Model scale: models at their real size, or drawn larger when they would be too small to see.', parts: [{ path: '', keys: ['look', 'model_scale'] }] },
  { id: 'time', header: 'Time', icon: 'mdi:clock-outline', hint: 'The scene date moves bodies and orbits; the time scale speeds up or slows the decorative motion.', parts: [{ path: 'clock', keys: ['date', 'rate'] }, { path: '', keys: ['time_scale'] }] },
  { id: 'warp', header: 'Warp', icon: 'mdi:rocket-launch-outline', hint: 'Stars and dust stream past while the scene is at warp.', parts: [{ path: '', keys: ['warp', 'warp_factor'] }] },
  { id: 'space', header: 'Space', icon: 'mdi:star-four-points-outline', hint: 'Part of the 3D scene: stars at infinity turn with the camera; depth dust fills the space round the camera and shows depth on every move.', parts: [{ path: 'backdrop', keys: ['stars', 'dust'] }] }
];

/**
 * The Camera tab's sections under the views (camera keys).
 * @type {{ id: string, header: string, icon: string, hint: string, keys: string[] }[]}
 */
const CAMERA_GROUPS = [
  { id: 'controls', header: 'Controls', icon: 'mdi:gesture-swipe', hint: 'How dragging, the wheel, pinching and double-taps move the camera.', keys: ['controls', 'drag', 'pan', 'zoom_to', 'wheel', 'double_tap', 'zoom_step'] },
  { id: 'buttons', header: 'On-card buttons', icon: 'mdi:gesture-tap-button', hint: 'Pan, zoom, reset and time buttons on the card.', keys: ['buttons'] },
  { id: 'flying', header: 'Flying', icon: 'mdi:airplane', hint: 'How the camera flies to a view, point or object.', keys: ['fly_duration', 'ease', 'follow', 'warp'] },
  { id: 'turning', header: 'Turning', icon: 'mdi:rotate-3d-variant', hint: 'Turn round the target on its own.', keys: ['auto_rotate'] },
  { id: 'limits', header: 'Limits', icon: 'mdi:arrow-expand-all', hint: 'How far the camera may tilt, zoom and wander.', keys: ['limits'] }
];

/**
 * What a system holds, for its row ("3 points, 2 objects").
 * @param {any} sys
 */
function systemCounts(sys) {
  const n = (/** @type {any} */ l, /** @type {string} */ what) => {
    const c = Array.isArray(l) ? l.length : 0;
    return `${c} ${what}${c === 1 ? '' : 's'}`;
  };
  return `${n(sys?.points, 'point')}, ${n(sys?.objects, 'object')}`;
}

export class LCARdSAstrometricsStudioDialog extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _workingConfig: { state: true },
      _activeTab: { state: true },
      _expandedObject: { state: true },
      _scope: { state: true },
      _selectedPoint: { state: true },
      _addingObject: { state: true },
      _placing: { state: true },
      _status: { state: true },
      _scaleBar: { state: true },
      _expandedView: { state: true },
      _openStarter: { state: true },
      _starterParams: { state: true },
      _starterMessage: { state: true },
      _trying: { state: true },
      _toolbarExpanded: { state: true },
      _modelScale: { state: true },
      _outlineEdit: { state: true },
      _hasRealModels: { state: true },
      _historyVersion: { state: true },
      _viewError: { state: true },
      _modelExtents: { state: true }
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
    /** @type {number} what the Points and Objects tabs edit: a system's index in the objects, or the scene's (-1) */
    this._scope = SCENE_SCOPE;
    /** @type {string | null} */
    this._selectedPoint = null;
    this._addingObject = false;
    this._placing = false;
    /** @type {string} the toolbar's line while dragging or placing (else the hint) */
    this._status = '';
    /** @type {{ px: number, label: string } | null} the preview's scale bar (_updateScaleBar) */
    this._scaleBar = null;
    /** @type {string | null} the open view row in the Camera tab */
    this._expandedView = null;
    /** @type {string} why the last rename was refused */
    this._viewError = '';
    /** @type {Record<string, number[]>} each model file's extent, its own units, by src (read from the preview once it has loaded) */
    this._modelExtents = {};
    /** @type {Set<string>} model files whose extent is being read */
    this._extentPending = new Set();
    /** @type {string | null} the open starter in the Starters tab */
    this._openStarter = null;
    /** @type {Record<string, Record<string, any>>} what was typed into each starter's params */
    this._starterParams = {};
    /** @type {{ starter: string, type: 'error' | 'success', text: string } | null} the last insert's outcome, shown in that starter */
    this._starterMessage = null;
    /** @type {{ id: string, mode: StarterMode, title: string, config: Record<string, any> } | null} the starter in the preview, not yet kept */
    this._trying = null;
    this._toolbarExpanded = true;
    this._history = createHistory();
    /** bumped on every history change, so undo and redo buttons re-render */
    this._historyVersion = 0;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this._tryTimer = undefined;
    this._onKey = this._onKey.bind(this);
    this._previewRef = createRef();
    this._onPlaceKey = this._onPlaceKey.bind(this);
    /** @type {any} the preview card */
    this._previewCard = null;
    /** @type {{ id: string, draw: boolean } | null} a prism's outline edited on the preview (P6d) */
    this._outlineEdit = null;
    /** @type {'real' | 'visible'} the preview's model scale (its toolbar toggle; not saved) */
    this._modelScale = 'real';
    /** Whether the preview has a model at its real size (the toggle is on offer) */
    this._hasRealModels = false;
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
    // a new card (empty, or the default scene) starts from the starters, else on its objects
    this._activeTab = isStarterCard(this._workingConfig) ? 'starters' : 'objects';
    window.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._previewTimer);
    clearTimeout(this._tryTimer);
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keydown', this._onPlaceKey, true);
    this._previewCard?.attachStudio?.(null);
    this._outlineEdit = null;
  }

  firstUpdated() {
    this._mountPreview();
  }

  /** @param {Map<string, unknown>} changed */
  updated(changed) {
    if (changed.has('hass') && this._previewCard) this._previewCard.hass = this.hass;
    // the scale bar's units: the scope's, a starter being tried, or the scene's changed
    if (changed.has('_scope') || changed.has('_trying') || changed.has('_workingConfig')) this._updateScaleBar();
    // the outline editor: ends when its prism is closed, gone or no longer a prism; else follows the form
    if (this._outlineEdit && (changed.has('_workingConfig') || changed.has('_expandedObject') || changed.has('_scope') || changed.has('_activeTab'))) {
      const obj = this._objects[this._expandedObject];
      if (this._activeTab !== 'objects' || !obj || String(obj.id) !== this._outlineEdit.id || obj.shape !== 'prism') this._endOutline();
      else if (!this._outlineEdit.draw) this._outlineSync(obj);
    }
  }

  // ── Working config ─────────────────────────────────────────────────────────

  /** @returns {any[]} the points of the open scope (the scene or a system) */
  get _points() {
    return scopedList(this._workingConfig, this._scope, 'points');
  }

  /** @returns {any[]} the objects of the open scope */
  get _objects() {
    return scopedList(this._workingConfig, this._scope, 'objects');
  }

  /** Every point id on the card (ids are card-wide) */
  get _pointIds() {
    return allPointIds(this._workingConfig);
  }

  /** The open system, or null for the scene */
  get _system() {
    return scopeSystem(this._workingConfig, this._scope);
  }

  /** What one unit is in the open scope (a system's own, or the scene's), or '' */
  get _units() {
    const sys = this._system;
    if (sys) return sys.units ?? (sys.scale !== undefined ? '' : (this._workingConfig.units ?? ''));
    return this._workingConfig.units ?? '';
  }

  /** The scene's system ids (an object's hide_in_systems picks from them) */
  get _systemIds() {
    const objects = Array.isArray(this._workingConfig.objects) ? this._workingConfig.objects : [];
    return objects.filter((o) => isObj(o) && o.type === 'system' && o.id !== undefined).map((o) => String(o.id));
  }

  /**
   * Replace the working config and refresh the preview. The copy it replaces
   * goes on the undo history (commits to the same keys in a row merge, unless
   * `step`).
   * @param {Record<string, any>} next
   * @param {{ now?: boolean, step?: boolean }} [opts] - step: its own undo step (a starter kept)
   */
  _commit(next, { now = false, step = false } = {}) {
    this._history.push(this._workingConfig, next, { step });
    this._historyVersion++;
    this._show(next, { now });
  }

  /**
   * Show a config as the working copy without recording it (commits, undo and redo).
   * @param {Record<string, any>} next
   * @param {{ now?: boolean }} [opts]
   * @private
   */
  _show(next, { now = false } = {}) {
    this._workingConfig = next;
    // the YAML tab or a starter can take the open system away
    const scope = validScope(next, this._scope);
    if (scope !== this._scope) this._openScope(scope);
    clearTimeout(this._previewTimer);
    if (now) this._updatePreview();
    else this._previewTimer = setTimeout(() => this._updatePreview(), PREVIEW_DELAY);
  }

  /** Step back one commit @private */
  _undo() {
    const prev = this._trying ? null : this._history.undo(this._workingConfig);
    if (!prev) return;
    this._historyVersion++;
    this._show(prev, { now: true });
  }

  /** Step forward one undone commit @private */
  _redo() {
    const next = this._trying ? null : this._history.redo(this._workingConfig);
    if (!next) return;
    this._historyVersion++;
    this._show(next, { now: true });
  }

  /**
   * Ctrl+Z undoes and Ctrl+Shift+Z (or Ctrl+Y) redoes, except in a text box
   * or the code editor, which keep their own undo. Keys inside the Studio
   * count, and keys with nothing focused (a tap on plain text or the preview
   * leaves focus on the page); keys in another dialog do not.
   * @param {KeyboardEvent} e
   * @private
   */
  _onKey(e) {
    const key = e.key.toLowerCase();
    // F (no modifiers): fly to the selection; the preview handles it itself when it has the focus
    const frame = key === 'f' && !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) && !e.defaultPrevented && !e.repeat;
    if (!frame && (!(e.ctrlKey || e.metaKey) || e.altKey || (key !== 'z' && key !== 'y'))) return;
    const path = e.composedPath();
    const active = document.activeElement;
    if (!path.includes(this) && active && active !== document.body) return;
    const typing = path.some((el) => el instanceof HTMLElement
      && (el.matches('input, textarea, [contenteditable=""], [contenteditable="true"], ha-code-editor, .cm-editor')));
    if (typing) return;
    e.preventDefault();
    if (frame) {
      this._frameSelected();
      return;
    }
    e.stopPropagation();
    if (key === 'y' || e.shiftKey) this._redo();
    else this._undo();
  }

  /** @param {string} key @param {any} value */
  _setTop(key, value) {
    const next = { ...this._workingConfig };
    if (value === undefined || (Array.isArray(value) && !value.length && key !== 'points')) delete next[key];
    else next[key] = value;
    this._commit(next);
  }

  /**
   * Replace the open scope's points or objects.
   * @param {'points' | 'objects'} key
   * @param {any[] | undefined} list
   * @param {{ now?: boolean, step?: boolean }} [opts] - as _commit's
   */
  _setList(key, list, opts = {}) {
    this._commit(setScopedList(this._workingConfig, this._scope, key, list), opts);
  }

  /** @param {any[]} objects */
  _setObjects(objects) {
    this._setList('objects', objects.length ? objects : undefined);
  }

  /**
   * Open a scope in the Points and Objects tabs (rows closed). With `fly`
   * (the Open and Back buttons) the preview goes with it: to the system,
   * whole, or back to the start view.
   * @param {number} scope
   * @param {{ fly?: boolean }} [opts]
   * @private
   */
  _openScope(scope, { fly = false } = {}) {
    if (scope === this._scope) return;
    // a starter being tried was put where the old scope was
    if (this._trying) this._discardTry();
    this._scope = scope;
    this._expandedObject = -1;
    this._addingObject = false;
    this._selectedPoint = null;
    if (fly) this._flyToScope();
  }

  /**
   * The scale bar under the units chip: a round length (1, 2 or 5 times a
   * power of ten) about a fifth of the view's width across the spot the
   * camera looks at, in the open scope's units.
   * @private
   */
  async _updateScaleBar() {
    const scene = await this._previewCard?.studioScene?.();
    if (!scene?.viewIn) return;
    const system = !this._trying && this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
    const { width, px } = scene.viewIn(system);
    if (!(width > 0) || !(px > 0) || !Number.isFinite(width)) {
      this._scaleBar = null;
      return;
    }
    const target = width / 5;
    const exp = Math.floor(Math.log10(target));
    const base = target / 10 ** exp;
    const length = (base >= 5 ? 5 : base >= 2 ? 2 : 1) * 10 ** exp;
    const units = system ? this._units : (this._trying?.config ?? this._workingConfig).units;
    const label = `${length.toLocaleString(undefined, { maximumSignificantDigits: 1 })} ${units || 'units'}`;
    const bar = Math.round((length / width) * px);
    if (this._scaleBar?.px !== bar || this._scaleBar?.label !== label) this._scaleBar = { px: bar, label };
  }

  /** The preview to the open scope: the system's frame, or the scene's start view @private */
  async _flyToScope() {
    const scene = await this._previewCard?.studioScene?.();
    if (!scene) return;
    const id = this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
    if (id !== undefined) scene.frameObject(id);
    else scene.home();
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  /** The config the preview card shows: the working copy (with the starter being tried), filling the panel. */
  _previewConfig() {
    return { ...clone(this._trying?.config ?? this._workingConfig), height: '100%' };
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
    card.addEventListener('astro-model-scale', (/** @type {CustomEvent} */ e) => {
      this._modelScale = e.detail.mode;
      this._hasRealModels = e.detail.hasRealModels;
    });
    card.attachStudio?.({
      onView: () => this._updateScaleBar(),
      onSelect: (/** @type {any} */ hit) => this._onSceneSelect(hit),
      onDrag: (/** @type {string} */ id, /** @type {string} */ form, /** @type {any} */ value, /** @type {boolean} */ done, /** @type {string | undefined} */ via) => this._onPointDrag(id, form, value, done, via)
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
      const scope = pointScope(this._workingConfig, hit.id);
      if (scope !== null) this._openScope(scope);
      this._activeTab = 'points';
      this._selectPoint(hit.id);
      return;
    }
    const where = objectScope(this._workingConfig, hit.id);
    if (!where) return;
    this._openScope(where.scope);
    const index = where.index;
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
   * Dragged by the selected object standing at it (`via`), the object stays
   * selected in the Objects tab.
   * @param {string} id
   * @param {string} form
   * @param {number[] | string} value
   * @param {boolean} done
   * @param {string} [via] - the object grabbed
   * @private
   */
  _onPointDrag(id, form, value, done, via) {
    const shown = Array.isArray(value) ? value.join(', ') : value;
    if (!done) {
      this._status = via ? `Moving point ${id} (${via} stands at it): ${form} ${shown}` : `${id}: ${form} ${shown}`;
      return;
    }
    this._status = '';
    const scope = pointScope(this._workingConfig, id);
    if (scope !== null) this._openScope(scope);
    const points = this._points.map((p) => (p && String(p.id) === id ? { ...p, [form]: value } : p));
    // to the preview at once: an undo inside the preview's delay would otherwise find the card on the
    // config before the drag and leave the point where it was dragged
    this._setList('points', points, { now: true });
    if (via !== undefined) return;
    this._activeTab = 'points';
    this._selectPoint(id);
  }

  /** Fly the preview to the selection: the boxed object, else the selected point @private */
  async _frameSelected() {
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    await scene?.frameSelected?.();
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
      const system = this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
      this._status = system ? `Tap the scene to place a new point in ${system}. Escape cancels.` : 'Tap the scene to place a new point. Escape cancels.';
      window.addEventListener('keydown', this._onPlaceKey, true);
      scene.setPickHandler((/** @type {number} */ x, /** @type {number} */ y) => {
        const place = scene.placementAt(x, y, system);
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
    this._setList('points', [...this._points, point]);
    this._activeTab = 'points';
    this._selectPoint(id);
  }

  /**
   * An object's id in the open scope as the scene names it (type#n when it has none).
   * @param {any} obj
   * @param {number} index
   */
  _objectId(obj, index) {
    return this._objectIdIn(this._scope, index) ?? (obj?.id !== undefined ? String(obj.id) : `${obj?.type}#${index + 1}`);
  }

  /**
   * @param {number} scope
   * @param {number} index
   * @returns {string | undefined}
   */
  _objectIdIn(scope, index) {
    return scopedObjectIds(this._workingConfig, scope)[index];
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
        .preview-host { position: absolute; inset: 0; }
        .tab-header { display: flex; align-items: center; justify-content: space-between; gap: var(--ha-space-2); margin-bottom: var(--ha-space-2); }
        .tab-header h3 { margin: 0; }
        .info-guide { display: block; margin-bottom: var(--ha-space-3); }
        .object { margin-bottom: var(--ha-space-2); display: block; }
        .empty { padding: var(--ha-space-4); text-align: center; color: var(--secondary-text-color); }
        .type-picker { margin-bottom: var(--ha-space-3); }
        .scope-bar { display: flex; align-items: center; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); padding: var(--ha-space-2) var(--ha-space-3); border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-md); }
        .scope-bar span { flex: 1; }
        .system-open { margin: var(--ha-space-2) 0; }
        .type-picker-actions { display: flex; justify-content: flex-end; gap: var(--ha-space-2); margin-top: var(--ha-space-2); }
        lcards-form-section { display: block; }
        .canvas-toolbar { align-items: center; }
        .canvas-toolbar-button:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
        .preview-notes { position: absolute; left: var(--ha-space-3); bottom: var(--ha-space-3); max-width: calc(100% - 24px); pointer-events: none; }
        .preview-notes > * { pointer-events: auto; }
        .try-bar { display: flex; align-items: center; gap: var(--ha-space-2); padding: var(--ha-space-1) var(--ha-space-1) var(--ha-space-1) var(--ha-space-4);
          border-radius: var(--ha-border-radius-pill); background: rgba(0, 0, 0, 0.75); color: white; box-shadow: var(--ha-box-shadow-m); }
        .try-bar span { font-weight: var(--ha-font-weight-medium); }
        .view-actions { display: flex; flex-wrap: wrap; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); }
        .outline-panel { display: flex; flex-direction: column; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); }
        .outline-row { display: grid; grid-template-columns: 24px 1fr 1fr repeat(3, 40px); align-items: center; gap: var(--ha-space-2); }
        .outline-n { text-align: right; opacity: 0.7; }
        .view-name { display: block; margin-bottom: var(--ha-space-3); }
        .views-section { display: block; margin-bottom: var(--ha-space-4); }
        .views-actions { display: flex; justify-content: flex-end; margin-bottom: var(--ha-space-2); }
        .start-view { margin-top: var(--ha-space-3); }
        .start-view .field-label { display: block; font-weight: var(--ha-font-weight-medium); }
        .views-section > .hint { margin-bottom: var(--ha-space-2); }
        .starter-group { margin-bottom: var(--ha-space-3); }
        .starter-tile.clash .starter-picture { opacity: 0.4; }
        .starter-note { display: flex; align-items: flex-start; gap: var(--ha-space-1); margin-top: var(--ha-space-1); padding: 0 var(--ha-space-2);
          font-size: var(--ha-font-size-m, 14px); font-weight: var(--ha-font-weight-medium); color: var(--primary-text-color); }
        .starter-note ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
        .starter-clash { display: block; margin-bottom: var(--ha-space-3); }
        .units-chip { position: absolute; top: var(--ha-space-3); left: var(--ha-space-3); }
        .units-chip ha-assist-chip { --ha-assist-chip-filled-container-color: var(--primary-color); --ha-assist-chip-label-text-color: white;
          --ha-chip-label-size: var(--ha-font-size-l, 16px); }
        .units-chip ha-icon { --mdc-icon-size: 18px; color: white; }
        .scale-bar { display: flex; align-items: center; gap: var(--ha-space-2); margin-top: var(--ha-space-2);
          color: var(--lcards-moonlight); font-size: var(--ha-font-size-s, 12px); pointer-events: none; }
        .scale-line { height: 6px; box-sizing: border-box; border: var(--ha-border-width-md) solid currentColor; border-top: none; }
        .starter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--ha-space-3); }
        .starter-tile { display: flex; flex-direction: column; gap: var(--ha-space-1); padding: 0 0 var(--ha-space-2); text-align: start; cursor: pointer;
          font: inherit; color: inherit; background: none; overflow: hidden;
          border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-lg); }
        .starter-tile:hover, .starter-tile:focus-visible { border-color: var(--primary-color); outline: none; }
        .starter-tile .starter-title, .starter-tile .starter-summary { padding: 0 var(--ha-space-2); }
        .starter-title { font-weight: var(--ha-font-weight-medium); }
        .starter-summary { font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color); }
        .starter-picture { position: relative; aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; background: black; }
        .starter-picture ha-icon { --mdc-icon-size: 32px; color: var(--secondary-text-color); }
        .starter-picture img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .starter-detail > .starter-picture { border-radius: var(--ha-border-radius-lg); overflow: hidden; margin-bottom: var(--ha-space-3); }
        .starter-detail-title { display: flex; align-items: center; gap: var(--ha-space-2); margin: 0 0 var(--ha-space-2); }
        .starter-description { margin: 0 0 var(--ha-space-2); }
        .starter-adds { margin: 0 0 var(--ha-space-3); }
        .starter-units { display: flex; align-items: center; gap: var(--ha-space-1); margin: 0 0 var(--ha-space-2); }
        .starter-units ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
        .starter-fit { margin: 0 0 var(--ha-space-2); }
        .starter-detail lcards-form-section { margin-bottom: var(--ha-space-3); }
        .starter-yaml { max-height: 320px; overflow: auto; margin: 0; padding: var(--ha-space-2) var(--ha-space-3);
          font-family: var(--ha-font-family-code, monospace); font-size: var(--ha-font-size-s, 12px); white-space: pre;
          border-radius: var(--ha-border-radius-md); background-color: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent)); }
        .starter-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ha-space-2); }
        .toolbar-status { display: inline-block; color: white; font-size: var(--ha-font-size-m, 14px); padding: var(--ha-space-1) var(--ha-space-3);
          border-radius: var(--ha-border-radius-pill); background: rgba(0, 0, 0, 0.6); max-width: 48ch; }
      `
    ];
  }

  render() {
    const tabs = [
      { id: 'starters', label: 'Starters', icon: 'mdi:rocket-launch-outline' },
      { id: 'scene', label: 'Scene', icon: 'mdi:star-four-points-outline' },
      { id: 'objects', label: 'Objects', icon: 'mdi:shape-outline' },
      { id: 'points', label: 'Points', icon: 'mdi:map-marker-multiple' },
      { id: 'camera', label: 'Camera', icon: 'mdi:video-3d' },
      { id: 'yaml', label: 'YAML', icon: 'mdi:code-braces' }
    ];
    return html`
      <ha-dialog open flexcontent @closed=${this._onDialogClosed} header-title="Astrometrics Studio">
        <div class="dialog-content">
          <div class="studio-layout">
            <div class="config-panel">
              <ha-tab-group @wa-tab-show=${this._onTab}>
                ${tabs.map((t) => html`
                  <ha-tab-group-tab value=${t.id} ?active=${this._activeTab === t.id} ?disabled=${!!this._trying && t.id !== 'starters'}>
                    <ha-icon icon=${t.icon}></ha-icon>
                    ${t.label}
                  </ha-tab-group-tab>`)}
              </ha-tab-group>
              <div class="tab-content">${this._renderActiveTab()}</div>
            </div>
            <div class="preview-panel">
              <div class="preview-stage">
                <div class="preview-host" ${ref(this._previewRef)}></div>
                ${this._renderToolbar()}
                ${this._renderUnitsChip()}
                <div class="preview-notes">
                  ${this._trying ? html`
                    <div class="try-bar" role="status">
                      <span>Trying: ${this._trying.title}</span>
                      <ha-button size="s" appearance="plain" data-try="discard" @click=${this._discardTry}>Discard</ha-button>
                      <ha-button size="s" variant="brand" data-try="keep" @click=${this._keepTry}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Keep
                      </ha-button>
                    </div>` : html`
                    <span class="toolbar-status">${this._status || 'Tap a point or object to edit it; drag a point, or an object standing at one, to move it. F flies to the selection.'}</span>`}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ha-dialog-footer slot="footer">
          <div class="footer-start" slot="secondaryAction">
            <ha-button appearance="plain" @click=${() => window.open(docsUrl(DOCS.astrometricsStudio), '_blank', 'noopener')}>
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

  /**
   * The preview's toolbar in the MSD Studio's shape: labelled groups and a
   * collapse toggle.
   * @private
   */
  _renderToolbar() {
    void this._historyVersion;
    const trying = !!this._trying;
    /** @param {{ icon: string, title: string, action: () => void, active?: boolean, disabled?: boolean, id: string }} b */
    const button = (b) => html`
      <button class="canvas-toolbar-button ${b.active ? 'active' : ''}" data-tool=${b.id} title=${b.title} aria-label=${b.title}
        aria-pressed=${b.active === undefined ? nothing : (b.active ? 'true' : 'false')} ?disabled=${!!b.disabled} @click=${b.action}>
        <ha-icon icon=${b.icon}></ha-icon>
      </button>`;
    /** A camera command: one step on press, moving while held (as the on-card buttons) */
    /** @param {{ icon: string, title: string, id: string }} b */
    const hold = (b) => html`
      <button class="canvas-toolbar-button" data-tool=${b.id} title=${b.title} aria-label=${b.title}
        @pointerdown=${(/** @type {PointerEvent} */ e) => { if (e.button === 0) this._press(b.id); }}
        @pointerup=${() => this._release()} @pointerleave=${() => this._release()} @pointercancel=${() => this._release()}>
        <ha-icon icon=${b.icon}></ha-icon>
      </button>`;
    const toggle = () => { this._toolbarExpanded = !this._toolbarExpanded; };
    if (!this._toolbarExpanded) {
      return html`
        <div class="canvas-toolbar collapsed">
          <button class="canvas-toolbar-toggle" data-tool="toggle" title="Show the toolbar" aria-label="Show the toolbar" @click=${toggle}>
            <ha-icon icon="mdi:tools"></ha-icon>
          </button>
        </div>`;
    }
    return html`
      <div class="canvas-toolbar">
        <div class="canvas-toolbar-buttons">
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">Tools</span>
            ${button({ id: 'place', icon: 'mdi:map-marker-plus-outline', title: 'Place a point', active: this._placing, disabled: trying, action: () => this._setPlacing(!this._placing) })}
          </div>
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">View</span>
            ${button({ id: 'home', icon: 'mdi:home-outline', title: 'Back to the start view', action: () => this._home() })}
            ${button({
              id: 'frame-selected', icon: 'mdi:image-filter-center-focus', disabled: trying || (this._selectedPoint === null && !this._objects[this._expandedObject]),
              title: 'Fly to what is selected (F)', action: () => this._frameSelected()
            })}
            ${hold({ id: 'fly-forward', icon: 'mdi:arrow-up-bold-outline', title: 'Fly forward (W, Page Up); hold to keep going' })}
            ${hold({ id: 'fly-back', icon: 'mdi:arrow-down-bold-outline', title: 'Fly back (S, Page Down); hold to keep going' })}
            ${button({
              id: 'model-scale', icon: 'mdi:magnify-plus-outline', active: this._modelScale === 'visible', disabled: !this._hasRealModels,
              title: this._hasRealModels ? 'Draw small models larger, to see them (V); not saved' : 'Draw small models larger: no model is at its real size',
              action: () => this._previewCard?.setModelScale?.('toggle')
            })}
          </div>
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">Edit</span>
            ${button({ id: 'undo', icon: 'mdi:undo', title: 'Undo (Ctrl+Z)', disabled: trying || !this._history.canUndo, action: () => this._undo() })}
            ${button({ id: 'redo', icon: 'mdi:redo', title: 'Redo (Ctrl+Shift+Z)', disabled: trying || !this._history.canRedo, action: () => this._redo() })}
          </div>
        </div>
        <button class="canvas-toolbar-toggle" data-tool="toggle" title="Hide the toolbar" aria-label="Hide the toolbar" @click=${toggle}>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>`;
  }

  /**
   * What the numbers mean on the preview: the open system's units, else the
   * scene's (the starter being tried included).
   * @private
   */
  _renderUnitsChip() {
    const cfg = this._trying?.config ?? this._workingConfig;
    const sys = this._trying ? null : this._system;
    const id = sys ? this._objectIdIn(SCENE_SCOPE, this._scope) : '';
    const units = sys ? this._units : cfg.units;
    const text = `${sys ? `System ${id}` : 'Scene'}: ${units || 'scene units'}`;
    return html`
      <div class="units-chip" data-units=${units || ''} title="Positions, sizes and distances are in these units">
        <ha-assist-chip filled label=${text}><ha-icon slot="icon" icon="mdi:arrow-expand-horizontal"></ha-icon></ha-assist-chip>
        ${this._scaleBar ? html`
          <div class="scale-bar" title="This length on the preview, where the camera looks">
            <span class="scale-line" style=${`width: ${this._scaleBar.px}px`}></span>
            <span class="scale-label">${this._scaleBar.label}</span>
          </div>` : nothing}
      </div>`;
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
    const cfg = this._workingConfig;
    const props = astrometricsSchema.properties;
    /** @param {string} path */
    const schemaAt = (path) => (path ? props[path].properties : props);
    /** @param {string} path */
    const valueAt = (path) => (path ? (isObj(cfg[path]) ? cfg[path] : {}) : cfg);
    return html`
      ${overviewGuide()}
      ${SCENE_GROUPS.map((g) => html`
        <lcards-form-section data-group=${g.id} header=${g.header} icon=${g.icon} description=${g.hint} outlined ?expanded=${g.id === 'look' || g.id === 'time' || g.id === 'units'}>
          ${g.parts.map((part) => html`
            <lcards-astro-schema-form .hass=${this.hass} .schema=${schemaAt(part.path)} .keys=${part.keys} .value=${valueAt(part.path)}
              .pointIds=${this._pointIds} .units=${cfg.units ?? ''}
              @form-changed=${(/** @type {CustomEvent} */ e) => (part.path
                ? this._setTop(part.path, Object.keys(e.detail.value).length ? e.detail.value : undefined)
                : this._commit(e.detail.value))}>
            </lcards-astro-schema-form>`)}
        </lcards-form-section>`)}
      <lcards-form-section data-group="background" header="Background" icon="mdi:image-filter-hdr" outlined
        description="A flat animation behind the scene, as on other LCARdS cards. It does not turn with the camera: for a sky that turns, use Space, Stars.">
        <lcards-background-animation-editor .hass=${this.hass} .config=${cfg.background_animation ?? []}
          @effects-changed=${(/** @type {CustomEvent} */ e) => {
            e.stopPropagation();
            const v = e.detail.value;
            this._setTop('background_animation', (Array.isArray(v) && !v.length) ? undefined : v);
          }}>
        </lcards-background-animation-editor>
      </lcards-form-section>
      <lcards-form-section data-group="labels" header="Labels" icon="mdi:label-outline" outlined
        description="How every label looks, and the styles points pick (title, major, minor, tiny, and your own).">
        <lcards-astro-labels-editor .hass=${this.hass} .value=${isObj(cfg.labels) ? cfg.labels : {}}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._setTop('labels', Object.keys(e.detail.value ?? {}).length ? e.detail.value : undefined); }}>
        </lcards-astro-labels-editor>
      </lcards-form-section>
    `;
  }

  /** @private */
  _renderPointsTab() {
    return html`
      ${pointsGuide()}
      ${this._renderScopeBar('points')}
      <lcards-astro-points-editor
        .hass=${this.hass}
        .config=${pointsEditorConfig(this._workingConfig, this._scope)}
        .preview=${this._previewCard}
        .takenIds=${this._pointIds}
        .selected=${this._selectedPoint}
        @point-selected=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._selectPoint(e.detail.id); }}
        @points-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._setList('points', e.detail.value); }}>
      </lcards-astro-points-editor>
    `;
  }

  /** @private */
  _renderCameraTab() {
    const props = astrometricsSchema.properties.camera.properties;
    const camera = isObj(this._workingConfig.camera) ? this._workingConfig.camera : {};
    /** @param {string[]} keys */
    const form = (keys) => html`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${props} .keys=${keys} .value=${camera} .pointIds=${this._pointIds}
        .units=${this._workingConfig.units ?? ''} .choices=${{ view: Object.keys(viewsOf(camera)) }}
        @form-changed=${(/** @type {CustomEvent} */ e) => this._setTop('camera', Object.keys(e.detail.value).length ? e.detail.value : undefined)}>
      </lcards-astro-schema-form>`;
    return html`
      ${cameraGuide()}
      ${this._renderViews(camera, form(['view']))}
      ${CAMERA_GROUPS.map((g) => html`
        <lcards-form-section data-group=${g.id} header=${g.header} icon=${g.icon} description=${g.hint} outlined>
          ${form(g.keys.filter((k) => props[k]))}
        </lcards-form-section>`)}
    `;
  }

  /**
   * The named views: capture from the preview, fly to, set first, rename,
   * reorder, delete; each view's keys in a generated form.
   * @param {Record<string, any>} camera
   * @param {any} startForm - the start view field (a view name or a guided tour)
   * @private
   */
  _renderViews(camera, startForm) {
    const views = viewsOf(camera);
    const names = Object.keys(views);
    const first = startViewName(camera);
    return html`
      <lcards-form-section class="views-section" data-group="views" header="Views" icon="mdi:video-outline" outlined ?expanded=${true}
        description="Named camera views: capture one from the preview, fly between them, and pick the one the card starts with.">
        <div class="views-actions">
          <ha-button @click=${() => this._captureView(null)}>
            <ha-icon icon="mdi:camera-plus-outline" slot="start"></ha-icon>
            Capture view
          </ha-button>
        </div>
        <div class="hint">Move the preview's camera, then capture it as a named view. A tap_action with action: fly-to and view: its name flies there.</div>
        ${names.length
          ? names.map((name, i) => this._renderView(name, views[name], i, names.length, name === first))
          : html`<div class="empty">No views yet: the card frames the whole scene.</div>`}
        <div class="start-view">
          <span class="field-label">Start with</span>
          <div class="hint">The view the card opens on (the star in the list), or a guided tour that follows an entity through views.</div>
          ${startForm}
        </div>
      </lcards-form-section>
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
            .units=${this._workingConfig.units ?? ''}
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
    // viewNow names the point the camera looks at (its distance in that point's units, in a system)
    this._setCamera(setView(camera, target, captureView(scene.viewNow?.() ?? scene.cameraKeys(), scene.pointPositions(), views[target])), { now: true });
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
    const open = STARTERS.find((st) => st.id === this._openStarter);
    if (open) return html`${this._renderScopeBar('starters')}${this._renderStarterDetail(open)}`;
    const inSystem = !!this._system;
    const group = (/** @type {'scene' | 'part'} */ kind, /** @type {string} */ header, /** @type {string} */ icon, /** @type {string} */ hint) => html`
      <lcards-form-section class="starter-group" data-group=${kind} header=${header} icon=${icon} description=${hint} outlined expanded>
        <div class="starter-grid">${STARTERS.filter((st) => st.kind === kind).map((st) => this._renderStarterTile(st))}</div>
      </lcards-form-section>`;
    return html`
      ${startersGuide()}
      ${this._renderScopeBar('starters')}
      ${group('scene', 'Scenes', 'mdi:image-filter-hdr-outline', inSystem
        ? 'A whole scene: it acts on the whole card, not only this system.'
        : 'A whole scene: use it in place of yours, or merge it into yours.')}
      ${group('part', 'Parts', 'mdi:puzzle-outline', inSystem
        ? 'One thing to add to this system, sized in its units, such as a planet with moons.'
        : 'One thing to add next to your scene, such as a planet with moons.')}
    `;
  }

  /**
   * A gallery picture; the icon when the picture is missing.
   * @param {string} src
   * @param {string} icon
   * @private
   */
  _picture(src, icon) {
    return html`
      <div class="starter-picture">
        <ha-icon icon=${icon}></ha-icon>
        <img src=${src} alt="" loading="lazy"
          @error=${(/** @type {Event} */ e) => { /** @type {HTMLElement} */ (e.target).hidden = true; }}>
      </div>`;
  }

  /**
   * Where Starters put a part: the open system (an index into the card's
   * objects), or undefined for the scene.
   * @returns {number | undefined}
   */
  get _starterSystem() {
    return this._system ? this._scope : undefined;
  }

  /** The units a part is sized in where it goes ('' when not named) */
  get _starterUnits() {
    return targetUnits(this._workingConfig, this._starterSystem) ?? '';
  }

  /**
   * A part's units when they differ from where it goes, else null; scenes
   * always act on the card.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {Record<string, any>} [typed]
   * @private
   */
  _starterClash(starter, typed) {
    return unitsClash(this._workingConfig, starter, typed, starter.kind === 'part' ? this._starterSystem : undefined);
  }

  /**
   * A gallery tile: picture, title, one line; opens the starter.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @private
   */
  _renderStarterTile(starter) {
    // a part in other units cannot be added to this scene (a scene can still replace it)
    const clash = starter.kind === 'part' ? this._starterClash(starter) : null;
    return html`
      <button class="starter-tile ${clash ? 'clash' : ''}" data-starter=${starter.id} @click=${() => { this._openStarter = starter.id; }}>
        ${this._picture(starterPicture(starter.id), starter.icon)}
        <span class="starter-title">${starter.title}</span>
        <span class="starter-summary">${starter.summary}</span>
        ${clash ? html`<span class="starter-note"><ha-icon icon="mdi:arrow-expand-horizontal"></ha-icon>In ${clash}; this ${this._system ? 'system' : 'scene'} is in ${this._starterUnits || 'scene units'}</span>` : nothing}
      </button>`;
  }

  /**
   * How Try and the main button put a starter in: a scene replaces; a part
   * adds, or when its units differ from the scene's, starts over with the
   * scene it is made for, or on its own.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @returns {StarterMode}
   * @private
   */
  _starterMode(starter) {
    if (starter.kind === 'scene') return 'replace';
    // in a system a part only adds (a clashing one goes to the scene instead)
    if (this._system || !this._starterClash(starter, this._starterParams[starter.id])) return 'merge';
    return starter.scene ? 'scene' : 'replace';
  }

  /**
   * An open starter: picture, description, what it adds, its params, the
   * YAML on request, and Try / use / add.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @private
   */
  _renderStarterDetail(starter) {
    const typed = this._starterParams[starter.id] ?? {};
    const trying = this._trying?.id === starter.id;
    const scene = starter.kind === 'scene';
    const clash = this._starterClash(starter, typed);
    const mode = this._starterMode(starter);
    const host = starter.scene ? STARTERS.find((st) => st.id === starter.scene) : undefined;
    const here = this._workingConfig.units ?? 'scene units';
    // a part in a system goes into it, sized in its units; one in other units has to go to the scene
    const sysId = !scene && this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : null;
    const blocked = !!(sysId && clash);
    const units = scene ? this._workingConfig.units ?? '' : this._starterUnits;
    // a part goes in at a real size (named units) or sized to fit what is there (scene units)
    const target = scene || mode !== 'merge' ? null : targetOf(this._workingConfig, this._starterSystem);
    const values = starterParamValues(starter, typed, units || null, target);
    const fitted = target && fitFactor(starter, target, units || null, typed) !== null;
    return html`
      <div class="starter-detail" data-starter-detail=${starter.id}>
        <div class="tab-header">
          <ha-button appearance="plain" size="s" ?disabled=${!!this._trying} @click=${() => { this._openStarter = null; this._starterMessage = null; }}>
            <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
            All starters
          </ha-button>
        </div>
        ${this._picture(starterPicture(starter.id), starter.icon)}
        <h3 class="starter-detail-title"><ha-icon icon=${starter.icon}></ha-icon>${starter.title}</h3>
        <p class="starter-description">${starter.description}</p>
        ${scene ? html`<p class="hint starter-units"><ha-icon icon="mdi:ruler"></ha-icon>${sceneUnitsText(starter)}</p>` : nothing}
        <p class="hint starter-adds">${mode === 'scene' ? `Replaces the scene with ${host?.title}, then adds` : scene || mode === 'replace' ? 'Replaces the scene with' : 'Adds'} ${starterAdds(starter, typed)}${sysId && !blocked ? ` to system ${sysId}` : ''}.</p>
        ${blocked ? html`
          <lcards-message type="info" class="starter-clash">
            This part is in ${clash} and system ${sysId} is in ${units || 'its parent\'s units'}, so it cannot go into it. Go back to the scene to add it there.
          </lcards-message>` : clash && !scene ? html`
          <lcards-message type="info" class="starter-clash">
            This part is in ${clash} and your scene is in ${here}, so it cannot go next to it.
            ${host ? html`It is made for ${host.title}: start with that scene and add this part to it.` : 'It can replace the scene instead.'}
            Undo brings your scene back.
          </lcards-message>` : nothing}
        ${starter.params.length ? html`
          <lcards-form-section header="Settings" icon="mdi:tune-variant" outlined expanded>
            ${fitted ? html`<p class="hint starter-fit">Sized to fit this ${this._system ? 'system' : 'scene'} (its units have no name). Change the sizes as you like.</p>` : nothing}
            <lcards-astro-schema-form .hass=${this.hass} .schema=${starterParamSchema(starter)} .value=${values}
              .pointIds=${this._pointIds} .choices=${starterParamChoices(starter)} .units=${units}
              @form-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._setStarterParams(starter, e.detail.value); }}>
            </lcards-astro-schema-form>
          </lcards-form-section>` : nothing}
        <lcards-form-section header="YAML" icon="mdi:code-braces" description="What it puts into the card" outlined>
          <pre class="starter-yaml">${this._starterYaml(starter, values, units)}</pre>
        </lcards-form-section>
        ${this._starterMessage?.starter === starter.id
          ? html`<lcards-message type=${this._starterMessage.type}>${this._starterMessage.text}</lcards-message>` : nothing}
        <div class="starter-actions">
          ${blocked ? html`
            <ha-button data-action="to-scene" @click=${() => this._openScope(SCENE_SCOPE, { fly: true })}>
              <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
              Back to the scene to add it
            </ha-button>` : trying ? html`
            <ha-button appearance="plain" @click=${this._discardTry}>Discard</ha-button>
            <ha-button variant="brand" @click=${this._keepTry}>
              <ha-icon icon="mdi:check" slot="start"></ha-icon>
              Keep
            </ha-button>` : html`
            <ha-button appearance="plain" data-action="try" @click=${() => this._tryStarter(starter, mode)}>
              <ha-icon icon="mdi:eye-outline" slot="start"></ha-icon>
              Try in the preview
            </ha-button>
            ${scene ? html`
              <ha-button appearance="plain" ?disabled=${!hasScene(this._workingConfig) || !!clash}
                title=${clash ? `This scene is in ${clash} and yours is in ${here}: only replacing works` : ''}
                @click=${() => this._insertStarter(starter, 'merge')}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Merge into the scene
              </ha-button>
              <ha-button @click=${() => this._insertStarter(starter, 'replace')}>
                <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>
                Use this scene
              </ha-button>` : html`
              <ha-button data-action="insert" @click=${() => this._insertStarter(starter, mode)}>
                <ha-icon icon=${mode === 'merge' ? 'mdi:plus' : 'mdi:swap-horizontal'} slot="start"></ha-icon>
                ${mode === 'merge' ? (sysId ? `Add to system ${sysId}` : 'Add to the scene') : mode === 'scene' ? `Start with ${host?.title} and add it` : 'Replace the scene with it'}
              </ha-button>`}`}
        </div>
      </div>
    `;
  }

  /**
   * New param values from the form; a starter being tried follows them.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {Record<string, any>} value
   * @private
   */
  _setStarterParams(starter, value) {
    this._starterParams = { ...this._starterParams, [starter.id]: value };
    if (this._trying?.id !== starter.id) return;
    const mode = this._trying.mode;
    clearTimeout(this._tryTimer);
    this._tryTimer = setTimeout(() => this._tryStarter(starter, mode), PREVIEW_DELAY);
  }

  /**
   * The YAML a starter adds, with the params as typed.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {Record<string, any>} typed
   * @param {string} [units]
   * @private
   */
  _starterYaml(starter, typed, units = '') {
    // sized in the units where it goes; they only show when the starter sets them
    const out = applyStarter(units ? { units } : {}, starter, typed);
    if (!out.config) return out.error;
    const { type: _type, ...added } = out.config;
    if (out.added.units === undefined) delete added.units;
    return starterYaml(added);
  }

  /**
   * The working copy with a starter put in, or its error (shown in the starter).
   * `scene`: the scene the part is made for replaces the card's first.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {StarterMode} mode
   * @returns {{ config: Record<string, any>, added: import('../../core/astrometrics/starters/index.js').StarterFragment } | null}
   * @private
   */
  _withStarter(starter, mode) {
    let base = this._workingConfig;
    const host = mode === 'scene' ? STARTERS.find((st) => st.id === starter.scene) : undefined;
    if (host) base = applyStarter(base, host, this._starterParams[host.id] ?? {}, { mode: 'replace' }).config ?? base;
    const system = starter.kind === 'part' && mode === 'merge' ? this._starterSystem : undefined;
    const out = applyStarter(base, starter, this._starterParams[starter.id] ?? {}, { mode: mode === 'scene' ? 'merge' : mode, system });
    if (!out.config || !out.added) {
      this._starterMessage = { starter: starter.id, type: 'error', text: String(out.error) };
      return null;
    }
    return { config: out.config, added: out.added };
  }

  /**
   * Show a starter in the preview without changing the working copy; the
   * other tabs wait until Keep or Discard.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {StarterMode} mode
   * @private
   */
  async _tryStarter(starter, mode) {
    const out = this._withStarter(starter, mode);
    if (!out) {
      if (this._trying) this._discardTry();
      return;
    }
    await this._setPlacing(false);
    this._starterMessage = null;
    this._trying = { id: starter.id, mode, title: starter.title, config: out.config };
    this._updatePreview();
  }

  /** Commit the starter being tried (one undo step) @private */
  _keepTry() {
    const trying = this._trying;
    if (!trying) return;
    clearTimeout(this._tryTimer);
    const starter = STARTERS.find((st) => st.id === trying.id);
    this._trying = null;
    if (starter) this._insertStarter(starter, trying.mode);
  }

  /** Drop the starter being tried: the preview shows the working copy again @private */
  _discardTry() {
    clearTimeout(this._tryTimer);
    this._trying = null;
    this._updatePreview();
  }

  /**
   * Put a starter into the working copy: a scene replaces or merges; a part
   * adds. Clashing ids are refused. Undo takes it out again.
   * @param {import('../../core/astrometrics/starters/index.js').Starter} starter
   * @param {StarterMode} mode
   * @private
   */
  _insertStarter(starter, mode) {
    const out = this._withStarter(starter, mode);
    if (!out) return;
    const host = mode === 'scene' ? STARTERS.find((st) => st.id === starter.scene) : undefined;
    const what = `${host ? `${host.title}, then ` : ''}${starter.title}: added ${fragmentCounts(out.added)}.`;
    this._starterMessage = { starter: starter.id, type: 'success', text: `${what} Undo takes it out again.` };
    this._expandedObject = -1;
    this._selectedPoint = null;
    this._commit(out.config, { now: true, step: true });
  }

  /** @private */
  _renderObjectsTab() {
    const objects = this._objects;
    return html`
      ${objectsGuide()}
      ${this._renderScopeBar('objects')}
      <div class="tab-header">
        <h3>Objects</h3>
        <div>
          <ha-button @click=${() => { this._addingObject = !this._addingObject; }}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add object
          </ha-button>
        </div>
      </div>
      ${this._addingObject ? this._renderTypePicker() : nothing}
      ${objects.length
        ? objects.map((o, i) => this._renderObject(o, i, objects.length))
        : html`<div class="empty">${this._system ? 'No objects in this system yet. Add a sphere for its star or a planet, or another type.' : 'No objects yet. Add a grid, a sphere or another type to draw something.'}</div>`}
    `;
  }

  /**
   * Over the Points, Objects and Starters tabs while a system is open:
   * whose lists these are (where parts go), its units, and the way back.
   * @param {'points' | 'objects' | 'starters'} tab
   * @private
   */
  _renderScopeBar(tab) {
    const sys = this._system;
    if (!sys) return nothing;
    const id = this._objectIdIn(SCENE_SCOPE, this._scope);
    const units = sys.units ? `in ${sys.units}` : sys.scale !== undefined ? `scale ${sys.scale}` : `in ${this._workingConfig.units ?? 'scene units'}`;
    return html`
      <div class="scope-bar">
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
        <span>${tab === 'starters' ? 'Parts go into system' : tab === 'points' ? 'Points of system' : 'Objects of system'} <b>${id}</b> (${units})</span>
        <ha-button appearance="plain" @click=${() => this._openScope(SCENE_SCOPE, { fly: true })}>
          <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
          Back to the scene
        </ha-button>
      </div>`;
  }

  /**
   * Add object: a gallery of the types by what they are for, a picture and
   * a line each.
   * @private
   */
  _renderTypePicker() {
    // one level: no system in a system
    const types = TYPE_GUIDE.filter((t) => !(this._system && t.type === 'system'));
    return html`
      <lcards-form-section class="type-picker" header="Add an object" icon="mdi:shape-plus-outline" outlined ?expanded=${true}>
        ${TYPE_GROUPS.map((g) => {
          const list = types.filter((t) => /** @type {readonly string[]} */ (g.types).includes(t.type));
          if (!list.length) return nothing;
          return html`
            <lcards-form-section class="starter-group" data-type-group=${g.id} header=${g.header} icon=${g.icon} nested outlined expanded>
              <div class="starter-grid">${list.map((t) => html`
                <button class="starter-tile" data-type=${t.type} @click=${() => this._addObject(t.type)}>
                  ${this._picture(typePicture(t.type), t.icon)}
                  <span class="starter-title">${t.type}</span>
                  <span class="starter-summary">${t.use}</span>
                </button>`)}
              </div>
            </lcards-form-section>`;
        })}
        <div class="type-picker-actions">
          <ha-button appearance="plain" @click=${() => { this._addingObject = false; }}>Cancel</ha-button>
        </div>
      </lcards-form-section>
    `;
  }

  /**
   * Add an object of a type, sized to the preview's view and where it looks
   * (on the point there, when it is one in this scope), so it shows at once.
   * @param {string} type
   * @private
   */
  async _addObject(type) {
    const ids = allObjectIds(this._workingConfig);
    this._addingObject = false;
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    const system = this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
    /** @type {{ scale?: number, at?: string | number[], real?: boolean }} */
    const place = { real: !!this._units };
    if (scene?.viewIn) {
      const view = scene.viewIn(system);
      place.scale = viewScale(view.distance);
      const point = scene.viewNow?.().target;
      if (typeof point === 'string' && pointScope(this._workingConfig, point) === this._scope) place.at = point;
      else {
        // a spot off the centre, to a thousandth of the view (a power of ten)
        const grain = 10 ** Math.floor(Math.log10(view.distance * 1e-3));
        const spot = view.target.map((v) => Number((Math.round(v / grain) * grain).toPrecision(12)));
        if (spot.some((v) => v !== 0)) place.at = spot;
      }
    }
    const objects = this._objects;
    this._expandedObject = objects.length;
    const obj = newObject(type, ids, this._pointIds, place);
    this._setObjects([...objects, obj]);
    // a model at its real size can be a speck from here: fly to it once it is in
    if (type === 'model') this._showModelWhenLoaded(String(obj.id), String(obj.src));
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
    // a new shape keeps the object's size (a plane's size is a disc's radius)
    const set = (next) => {
      this._setObjects(this._objects.map((o, i) => (i === index ? reshape(o, next) : o)));
      // a model given another file: fly to it once that is in
      if (obj?.type === 'model' && next.src && next.src !== obj.src && next.id !== undefined) this._showModelWhenLoaded(String(next.id), String(next.src));
    };
    const expanded = this._expandedObject === index;
    return html`
      <lcards-form-section class="object" data-object=${index} header=${id}
        secondary=${[obj?.type, objectSummary(obj)].filter(Boolean).join(' · ')}
        icon=${guide?.icon ?? 'mdi:shape-outline'} outlined ?expanded=${expanded}
        @expanded-changed=${(/** @type {CustomEvent} */ e) => { if (e.detail.expanded) this._selectObject(index); else if (this._expandedObject === index) this._selectObject(-1); }}>
        ${obj?.type === 'system' && !this._system ? html`
          <ha-button slot="header-icons" size="s" class="open-system" data-action="open-system"
            title=${`Open the system: its ${systemCounts(obj)}`}
            @click=${(/** @type {Event} */ e) => { e.stopPropagation(); this._openScope(index, { fly: true }); }}>
            <ha-icon icon="mdi:folder-open-outline" slot="start"></ha-icon>
            Open
          </ha-button>` : nothing}
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
   * An object's form: its type's own shape and size keys, then sections by
   * what a key does (OBJECT_GROUPS): Appearance open, the rest closed unless
   * a key in them follows an entity.
   * @param {any} obj
   * @param {{ branch: any, own: Record<string, any>, common: Record<string, any> }} parts
   * @param {(next: Record<string, any>) => void} set
   * @private
   */
  _renderObjectForm(obj, parts, set) {
    const props = { ...parts.common, ...parts.own };
    // a system's points and objects are edited in its own lists (the row's open button)
    const keys = ['id', ...Object.keys(parts.own), ...Object.keys(parts.common).filter((k) => k !== 'id' && !parts.own[k])]
      .filter((k) => props[k] && !(obj?.type === 'system' && (k === 'points' || k === 'objects')));
    // a system's own keys (id, at, units, visible) stay together
    const groupFor = (/** @type {string} */ k) => (k === 'id' || obj?.type === 'system' ? 'main' : groupOf(k, props[k]));
    /** @param {string[]} list */
    const form = (list) => html`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${props} .keys=${list} .value=${obj} .pointIds=${this._pointIds}
        .units=${this._units} .systemIds=${this._systemIds}
        @form-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); set({ type: obj.type, ...e.detail.value }); }}>
      </lcards-astro-schema-form>`;
    return html`
      ${parts.branch.description ? html`<div class="hint">${parts.branch.description}</div>` : nothing}
      ${OBJECT_GROUPS.map((g) => {
        const list = keys.filter((k) => groupFor(k) === g.id);
        if (!list.length) return nothing;
        // its points and objects open with the row's Open system button
        if (g.id === 'main') {
          // a prism's outline: its own panel (rows, Edit on preview, Draw new outline) after the shape keys
          if (obj?.type === 'volume' && obj.shape === 'prism') return html`${form(list.filter((k) => k !== 'outline'))}${this._renderOutline(obj)}`;
          // a model's size panel right under size and file_units
          const cut = obj?.type === 'model' ? Math.max(list.indexOf('size'), list.indexOf('file_units')) + 1 : 0;
          if (cut > 0) return html`${form(list.slice(0, cut))}${this._renderModelSize(obj, set)}${list.length > cut ? form(list.slice(cut)) : nothing}`;
          return html`${form(list)}${obj?.type === 'system' ? html`
            <div class="hint system-open">Holds ${systemCounts(obj)}.</div>` : nothing}`;
        }
        // a section with a setting that follows an entity opens, and says so
        const bound = keysBound(obj, list);
        return html`<lcards-form-section data-group=${g.id} header=${g.header} icon=${g.icon} secondary=${bound ? 'follows an entity' : ''}
          nested outlined ?expanded=${bound || g.id === 'appearance'}>${form(list)}</lcards-form-section>`;
      })}
    `;
  }

  /**
   * A prism's outline (P6d): a row per corner ([x, z] from the object's
   * position, scene units), and Edit on preview (corner handles on its base)
   * and Draw new outline.
   * @param {Record<string, any>} obj
   * @private
   */
  _renderOutline(obj) {
    const outline = /** @type {[number, number][]} */ (Array.isArray(obj.outline) ? obj.outline.map((/** @type {any} */ p) => (Array.isArray(p) ? [Number(p[0]) || 0, Number(p[1]) || 0] : [0, 0])) : []);
    const id = obj.id === undefined ? null : String(obj.id);
    const editing = !!id && this._outlineEdit?.id === id;
    const drawing = editing && !!this._outlineEdit?.draw;
    const units = this._units ? ` (${this._units})` : '';
    /** @param {[number, number][]} next */
    const put = (next) => this._commitOutline(id, next, obj);
    /** @param {number} i @param {0 | 1} axis @param {string} v */
    const setAt = (i, axis, v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      put(outline.map((p, k) => (k === i ? /** @type {[number, number]} */ (axis === 0 ? [n, p[1]] : [p[0], n]) : p)));
    };
    /** @param {number} i @param {number} d */
    const swap = (i, d) => {
      const next = [...outline];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      put(next);
    };
    return html`
      <div class="outline-panel" data-outline>
        <div class="hint">Outline: ${outline.length} corners, x and z${units} from the object's position (-z is north). At least 3.</div>
        ${outline.map((p, i) => html`
          <div class="outline-row" data-corner=${i}>
            <span class="outline-n">${i + 1}</span>
            <ha-input type="number" .label=${'x'} .value=${String(p[0])} @change=${(/** @type {Event} */ e) => setAt(i, 0, /** @type {any} */ (e.target).value)}></ha-input>
            <ha-input type="number" .label=${'z'} .value=${String(p[1])} @change=${(/** @type {Event} */ e) => setAt(i, 1, /** @type {any} */ (e.target).value)}></ha-input>
            <ha-icon-button .label=${'Move up'} ?disabled=${i === 0} @click=${() => swap(i, -1)}><ha-icon icon="mdi:arrow-up"></ha-icon></ha-icon-button>
            <ha-icon-button .label=${'Move down'} ?disabled=${i === outline.length - 1} @click=${() => swap(i, 1)}><ha-icon icon="mdi:arrow-down"></ha-icon></ha-icon-button>
            <ha-icon-button .label=${'Remove corner'} ?disabled=${outline.length <= 3} @click=${() => put(outline.filter((_, k) => k !== i))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
          </div>`)}
        <div class="view-actions">
          <ha-button appearance="plain" size="s" data-action="outline-add" ?disabled=${outline.length < 2}
            @click=${() => put(outline.length >= 2 ? [...outline, /** @type {[number, number]} */ ([Number(((outline[0][0] + outline[outline.length - 1][0]) / 2).toPrecision(6)), Number(((outline[0][1] + outline[outline.length - 1][1]) / 2).toPrecision(6))])] : outline)}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>Add corner
          </ha-button>
          <ha-button appearance=${editing && !drawing ? 'filled' : 'plain'} size="s" data-action="outline-edit" ?disabled=${!id || outline.length < 3}
            @click=${() => (editing && !drawing ? this._endOutline() : this._startOutline(obj, false))}>
            <ha-icon icon=${editing && !drawing ? 'mdi:check' : 'mdi:vector-polygon'} slot="start"></ha-icon>${editing && !drawing ? 'Done' : 'Edit on preview'}
          </ha-button>
          <ha-button appearance=${drawing ? 'filled' : 'plain'} size="s" data-action="outline-draw" ?disabled=${!id}
            @click=${() => (drawing ? this._finishDraw() : this._startOutline(obj, true))}>
            <ha-icon icon=${drawing ? 'mdi:check' : 'mdi:draw'} slot="start"></ha-icon>${drawing ? 'Close outline' : 'Draw new outline'}
          </ha-button>
        </div>
        ${editing ? html`<div class="hint" data-outline-hint>${drawing
          ? 'Tap the ground for each corner in order, then tap the first corner (or Close outline) to finish. Shift: no snapping. Esc stops.'
          : html`Drag a corner to move it (it snaps to ${shortNumber(this._outlineSnapValue(obj, outline))}${units}; Shift: no snapping). Tap a + to add a corner there; select a corner and press Delete to remove it. Esc or Done to finish.`}</div>` : nothing}
      </div>`;
  }

  /**
   * The snap step for a prism's corners: a grid's line spacing in the same
   * scope, else about a twentieth of the outline's span (a fiftieth of the
   * view for a new one), rounded.
   * @param {Record<string, any>} obj
   * @param {[number, number][]} outline
   * @param {number} [viewWidth]
   * @private
   */
  _outlineSnapValue(obj, outline, viewWidth) {
    const grid = this._objects.find((o) => o?.type === 'grid' && Number(o.line_spacing) > 0);
    if (grid) return Number(grid.line_spacing);
    if (outline.length >= 3) {
      const xs = outline.map((p) => p[0]);
      const zs = outline.map((p) => p[1]);
      return roundLength(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) / 20);
    }
    return roundLength((viewWidth ?? 100) / 50);
  }

  /**
   * @param {string | null} id
   * @param {[number, number][]} outline
   * @param {Record<string, any>} [fallback] - the object, when it has no id to find it by
   * @private
   */
  _commitOutline(id, outline, fallback) {
    const objects = this._objects.map((o) => ((id !== null ? String(o?.id) === id : o === fallback) ? { ...o, outline } : o));
    // each corner moved, added or removed is its own undo step (not merged as typing is)
    this._commit(setScopedList(this._workingConfig, this._scope, 'objects', objects), { step: true });
  }

  /**
   * Edit a prism's outline on the preview, or draw a new one.
   * @param {Record<string, any>} obj
   * @param {boolean} draw
   * @private
   */
  async _startOutline(obj, draw) {
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    if (!scene?.editOutline || obj.id === undefined) return;
    const id = String(obj.id);
    const outline = prismOutline(obj.outline) ?? [];
    const system = this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
    const snap = this._outlineSnapValue(obj, draw ? [] : outline, scene.viewIn?.(system)?.width);
    this._outlineEdit = { id, draw };
    scene.editOutline(id, {
      snap, draw, outline,
      onChange: (/** @type {[number, number][]} */ next, /** @type {boolean} */ done) => {
        if (!done) return;
        this._commitOutline(id, next);
        // a drawn outline closed: on to editing it
        if (this._outlineEdit?.draw) this._outlineEdit = { id, draw: false };
      },
      onExit: () => this._endOutline()
    });
  }

  /** @private */
  async _finishDraw() {
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    // Close outline: the corners tapped so far (at least 3); the editor's change commits them
    if (scene?.finishOutline && !scene.finishOutline()) this._status = 'An outline needs at least 3 corners.';
  }

  /**
   * The editor follows the form (a typed corner, a removed one, undo).
   * @param {Record<string, any>} obj
   * @private
   */
  async _outlineSync(obj) {
    const edit = this._outlineEdit;
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    if (!scene?.editOutline || !edit || edit.draw) return;
    const outline = prismOutline(obj.outline) ?? [];
    const system = this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
    scene.editOutline(edit.id, {
      snap: this._outlineSnapValue(obj, outline, scene.viewIn?.(system)?.width), draw: false, outline,
      onChange: (/** @type {[number, number][]} */ next, /** @type {boolean} */ done) => { if (done) this._commitOutline(edit.id, next); },
      onExit: () => this._endOutline()
    });
  }

  /** @private */
  async _endOutline() {
    this._outlineEdit = null;
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    scene?.editOutline?.(null);
  }

  /**
   * A model's size: what its file measures, how it is drawn, and Fit to
   * view, File size and Real size (UX1 P6c).
   * @param {Record<string, any>} obj
   * @param {(obj: Record<string, any>) => void} set
   * @private
   */
  _renderModelSize(obj, set) {
    const src = String(obj.src ?? '');
    const extent = this._modelExtents[src] ?? null;
    if (!extent && src && obj.id !== undefined) this._readModelExtent(String(obj.id), src);
    const units = this._units;
    const r = modelSizeReadout(obj, extent, units);
    const { size: _size, ...withoutSize } = obj;
    return html`
      <div class="model-size" data-mode=${r.mode}>
        <div class="hint">${r.file ? html`File: ${r.file}.` : 'File: measured once the preview has loaded it.'} ${r.note}</div>
        <div class="view-actions">
          <ha-button appearance="plain" size="s" data-action="show-model" ?disabled=${obj.id === undefined}
            @click=${() => this._showObject(String(obj.id))}>
            <ha-icon icon="mdi:crosshairs-gps" slot="start"></ha-icon>Show
          </ha-button>
          <ha-button appearance="plain" size="s" data-action="fit-view" @click=${() => this._fitModelToView(obj, set)}>
            <ha-icon icon="mdi:fit-to-screen-outline" slot="start"></ha-icon>Fit to view
          </ha-button>
          <ha-button appearance="plain" size="s" data-action="file-size" ?disabled=${r.largest === null}
            @click=${() => { if (r.largest !== null) set({ ...obj, size: Number(r.largest.toPrecision(4)) }); }}>
            <ha-icon icon="mdi:file-outline" slot="start"></ha-icon>File size
          </ha-button>
          <ha-button appearance="plain" size="s" data-action="real-size" ?disabled=${!units || r.mode === 'real'}
            @click=${() => set(withoutSize)}>
            <ha-icon icon="mdi:ruler" slot="start"></ha-icon>Real size
          </ha-button>
        </div>
      </div>`;
  }

  /**
   * Fly the preview to an object.
   * @param {string} id
   * @private
   */
  async _showObject(id) {
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    await scene?.frameObject(id);
  }

  /**
   * Fly the preview to a model once its file is in (framed by the file's own
   * size, not the stand-in's).
   * @param {string} id @param {string} src
   * @private
   */
  async _showModelWhenLoaded(id, src) {
    if (await this._whenModelLoaded(id, src)) await this._showObject(id);
  }

  /**
   * A model's measurements once the preview has loaded `src` for it: as long
   * as that file is loading (a 150 MB download takes a while), null when it
   * fails, the dialog closes or after five minutes.
   * @param {string} id @param {string} src
   * @returns {Promise<{ src: string, extent: number[], size: number, real: boolean } | null>}
   * @private
   */
  async _whenModelLoaded(id, src) {
    const until = Date.now() + MODEL_WAIT_MS;
    while (this.isConnected && Date.now() < until) {
      const scene = await this._previewCard?.studioScene?.().catch(() => null);
      // the preview may still hold the build of the file before (a src just changed)
      const now = scene?.modelState?.(id);
      if (now?.src === src && now.state === 'failed') return null;
      const info = now?.src === src && now.state === 'ready' ? scene?.modelInfo?.(id) : null;
      if (info) return info;
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  }

  /**
   * A model file's extent from the preview, once it has loaded (kept by src:
   * a size change rebuilds the model but its file measures the same).
   * @param {string} id @param {string} src
   * @private
   */
  async _readModelExtent(id, src) {
    if (this._extentPending.has(src)) return;
    this._extentPending.add(src);
    try {
      const info = await this._whenModelLoaded(id, src);
      if (info) this._modelExtents = { ...this._modelExtents, [src]: info.extent };
    } finally {
      this._extentPending.delete(src);
    }
  }

  /**
   * Fit to view: size a model to about a fifth of the preview's view.
   * @param {Record<string, any>} obj
   * @param {(obj: Record<string, any>) => void} set
   * @private
   */
  async _fitModelToView(obj, set) {
    const scene = await this._previewCard?.studioScene?.().catch(() => null);
    if (!scene?.viewIn) return;
    const system = this._system ? this._objectIdIn(SCENE_SCOPE, this._scope) : undefined;
    set({ ...obj, size: fitToViewSize(scene.viewIn(system).width) });
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
    const ids = allObjectIds(this._workingConfig);
    const copy = { ...clone(src), id: freshId(`${src?.id ?? src?.type}_`, ids) };
    this._expandedObject = index + 1;
    this._setObjects([...objects.slice(0, index + 1), copy, ...objects.slice(index + 1)]);
  }

  /** @param {number} index @private */
  async _deleteObject(index) {
    const obj = this._objects[index];
    const ok = await showConfirmDeleteDialog({
      title: 'Delete object',
      message: obj?.type === 'system'
        ? `Delete ${this._objectId(obj, index)} with its ${systemCounts(obj)}?`
        : `Delete ${this._objectId(obj, index)}? Points standing on it lose their surface.`
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

  /** A camera command on the preview (fly-forward, fly-back), held until _release @param {string} command @private */
  async _press(command) {
    const scene = await this._previewCard?.studioScene?.();
    scene?.press(command);
  }

  /** @private */
  async _release() {
    const scene = await this._previewCard?.studioScene?.();
    scene?.release();
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
