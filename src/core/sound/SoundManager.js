/**
 * @fileoverview SoundManager - Core singleton for LCARdS UI audio
 *
 * Manages sound playback for all UI interaction events using a two-tier approach:
 *   Tier 1 — Card interactions: Called from LCARdSActionHandler at tap/hold/double-tap/hover
 *   Tier 2 — Global HA UI:  Single document click listener + location-changed listener
 *
 * Configuration uses a three-tier waterfall (Card YAML → Device → User → Global):
 *
 * | Setting              | Scopes              | Global fallback (HA helper)                  |
 * |----------------------|---------------------|----------------------------------------------|
 * | sound_enabled        | device, user, global| input_boolean.lcards_sound_enabled           |
 * | sound_{cat}_enabled  | global only         | input_boolean.lcards_sound_{cat}             |
 * | sound_volume         | device, user, global| input_number.lcards_sound_volume             |
 * | sound_scheme         | device, user, global| input_select.lcards_sound_scheme             |
 * | sound_overrides      | device, user, global| backend flat key 'sound_overrides'           |
 *
 * Sound schemes are registered from pack definitions via PackManager.registerPack().
 * Audio asset URLs are resolved directly from AssetManager's internal registry.
 *
 * @module core/sound/SoundManager
 */

import { BaseService } from '../BaseService.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import {
  STORAGE_KEY_SOUND_OVERRIDES,
  STORAGE_KEY_SOUND_VOLUME,
  STORAGE_KEY_SOUND_ENABLED,
  STORAGE_KEY_SOUND_SCHEME,
  STORAGE_KEY_CUSTOM_SOUND_SCHEMES,
} from '../services/ScopedSettingsConstants.js';

/**
 * Maps each event type to its helper sub-category key.
 * Category key maps to: input_boolean.lcards_sound_{category}
 */
const EVENT_CATEGORY = {
  card_tap:          'cards',
  card_hold:         'cards',
  card_double_tap:   'cards',
  card_hover:        'cards',
  button_tap:        'cards',
  toggle_on:         'cards',
  toggle_off:        'cards',
  slider_drag_start: 'cards',
  slider_drag_end:   'cards',
  slider_change:     'cards',
  more_info_open:    'cards',
  menu_expand:            'ui',
  nav_page:               'ui',
  dialog_open:            'ui',
  dashboard_edit_start:   'ui',
  dashboard_edit_save:    'ui',
  dialog_close:           'ui',
  alert_red:             'alerts',
  alert_yellow:          'alerts',
  alert_blue:            'alerts',
  alert_gray:            'alerts',
  alert_black:           'alerts',
  alert_clear:           'alerts',
  system_ready:      'alerts',
  error:             'alerts',
  notification:      'alerts',
};

/**
 * Human-readable labels for all sound event types.
 * Used in Config Panel UI.
 */
export const SOUND_EVENT_LABELS = {
  card_tap:          'Card Tap',
  card_hold:         'Card Hold',
  card_double_tap:   'Card Double-Tap',
  card_hover:        'Card Hover (Desktop)',
  button_tap:        'Button Tap',
  toggle_on:         'Toggle → On',
  toggle_off:        'Toggle → Off',
  slider_drag_start: 'Slider Grab',
  slider_drag_end:   'Slider Release',
  slider_change:     'Slider Value Change',
  more_info_open:    'More Info Open',
  menu_expand:            'Sidebar Menu Expand / Collapse',
  nav_page:               'Page / View Navigation (incl. sidebar)',
  dialog_open:            'Dialog Open',
  dialog_close:           'Dialog Close',
  dashboard_edit_start:   'Dashboard Edit Start',
  dashboard_edit_save:    'Dashboard Edit Save / Done',
  alert_clear:           'Alert Cleared (Green Alert)',
  alert_yellow:          'Yellow Alert',
  alert_red:             'Red Alert',
  alert_blue:            'Blue Alert',
  alert_gray:            'Gray Alert',
  alert_black:           'Black Alert',
  system_ready:      'System Ready',
  error:             'System Error',
  notification:      'Notification',
};

/**
 * SoundManager — Coordinates all UI sound playback for LCARdS.
 *
 * Extends BaseService to participate in HASS distribution.
 * Accessed via window.lcards.core.soundManager.
 */
export class SoundManager extends BaseService {
  constructor() {
    super();

    /** @type {Map<string, Object>} Registered sound schemes by name */
    this._soundSchemes = new Map();

    /** @type {Map<string, HTMLAudioElement>} Cached Audio elements by asset key */
    this._audioCache = new Map();

    /** @type {Function|null} Unsubscribe fn for persistent_notification/subscribe WebSocket subscription */
    this._notificationUnsubscribe = null;
    /** @type {boolean} True while a subscribeMessage call is in flight — prevents parallel subscription attempts */
    this._notificationPending = false;

    /** @type {EventListener|null} hass-toggle-menu handler for sidebar expand/collapse */
    this._menuToggleHandler = null;

    /** @type {EventListener|null} Bound location-changed handler (for cleanup) */
    this._navHandler = null;


    /** @type {EventListener|null} hass-action event listener (for non-LCARdS HA cards) */
    this._hassActionHandler = null;

    /** @type {EventListener|null} show-dialog listener (general dialog open sounds) */
    this._showDialogHandler = null;

    /** @type {EventListener|null} hass-more-info listener (more-info panel sounds) */
    this._hassMoreInfoHandler = null;

    /** @type {any} Original history.replaceState (restored on destroy) */
    this._historyReplaceStateOrig = null;

    /** @type {boolean} Last known lovelace edit mode state (for replaceState patch dedup) */
    this._lastEditMode = false;

    /** @type {EventListener|null} dialog-closed listener (dialog save/cancel sounds) */
    this._dialogClosedHandler = null;

    /** @type {Object|null} Reference to LCARdSCore */
    this._core = null;

    /** @type {boolean} Whether the sound_scheme input_select options have been successfully
     * synced to HA at least once.
     */
    this._schemesOptionsSynced = false;

    /** @type {boolean} Whether a _syncSchemeHelperOptions call is already in-flight.
     * Prevents concurrent sync calls from racing and clobbering each other's restore.
     */
    this._syncInProgress = false;

    /** @type {boolean} True if a sync was requested while one was already in-flight —
     * triggers exactly one follow-up sync once the current one finishes, so a scheme
     * registered mid-sync (e.g. custom schemes loading from storage while the
     * pack-provided scheme sync's `set_options` network round trip is still pending)
     * is never silently dropped from the HA helper's options list.
     */
    this._syncPending = false;

    /** @type {boolean} Whether a microtask-deferred sync has already been scheduled.
     * Prevents multiple rapid registerSchemes() calls from each triggering a separate sync.
     */
    this._syncScheduled = false;

    /** @type {Function[]} Resolve callbacks for pending waitForSchemeSync() callers. */
    this._syncSettledResolvers = [];

    /** @type {boolean} True once _doLoadCustomSchemes() has settled (found custom
     * schemes or not) — registerSchemes() only auto-syncs once this is true, so the
     * very first scheme-options sync always sees the complete pack+custom list.
     * See registerSchemes() for why syncing with an incomplete list is unsafe.
     */
    this._startupSchemesSettled = false;

    /**
     * The scheme name every sync should try to (re-)select once it's present
     * in the options list — captured once, lazily, on the first sync this
     * session, before any set_options call has had a chance to reset the
     * live helper value to its first option. Updated when the live value is
     * later observed to be a different, already-registered scheme (the user
     * explicitly picked something new after startup settled).
     * @type {string|null|undefined}
     */
    this._schemeRestoreValue = undefined;

    /**
     * In-memory cache of per-event sound overrides for the current user (user scope).
     * Populated once by _ensureOverridesLoaded(). Remains null until the backend
     * load completes. User-scope overrides beat global on a per-event basis during
     * playback resolution.
     * @type {Object|null}
     */
    this._overridesCache = null;

    /**
     * In-memory cache of per-event sound overrides for the current device (device scope).
     * Device-scope overrides beat both user and global on a per-event basis.
     * @type {Object|null}
     */
    this._deviceOverridesCache = null;

    /**
     * In-memory cache of globally-shared per-event overrides (global / legacy flat
     * backend key). These apply to all users unless a user-scope or device-scope
     * override exists for the same event. Written by the Global Settings section.
     * @type {Object|null}
     */
    this._globalOverridesCache = null;

    /** @type {boolean} True once the backend load has completed (or was attempted) */
    this._overridesLoaded = false;

    /**
     * Promise that resolves when overrides and scoped settings have been fully loaded.
     * Set on the first call to _ensureOverridesLoaded() that finds a valid integration.
     * Subsequent callers (including ensureReady()) await this same promise.
     * @type {Promise<void>|null}
     */
    this._overridesLoadPromise = null;

    /**
     * Promise that resolves once persisted custom sound schemes have been loaded
     * from backend storage and registered. Set on the first call to
     * _ensureCustomSchemesLoaded() that finds a valid integration.
     * @type {Promise<void>|null}
     */
    this._customSchemesLoadPromise = null;

    /**
     * Scoped-settings cache fields.
     * Populated asynchronously by _ensureOverridesLoaded(). While undefined the
     * synchronous getters fall back to the live HA helpers.
     */
    /** @type {boolean|undefined} */
    this._cachedEnabled = undefined;
    /** @type {string|undefined} */
    this._cachedScheme = undefined;
    /** @type {number|undefined} */
    this._cachedVolume = undefined;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Initialize the SoundManager.
   * @param {Object} core - LCARdSCore instance
   * @returns {Promise<void>}
   */
  async initialize(core) {
    this._core = core;
    lcardsLog.info('[SoundManager] Initialized');
  }

  /**
   * Called by LCARdSCore on every HASS update (BaseService override).
   * SoundManager delegates HASS reads to HelperManager, so this is mostly a no-op,
   * but we keep it for completeness and future reactive logic.
   * @param {Object} hass - Home Assistant instance
   */
  updateHass(hass) {
    lcardsLog.trace('[SoundManager] updateHass received');
    // NOTE: the scheme-options sync is intentionally NOT triggered from here.
    // _ensureCustomSchemesLoaded() below (via _doLoadCustomSchemes()) is the
    // sole trigger for the first sync each session, once custom schemes have
    // had their one chance to load — see registerSchemes() for why syncing
    // any earlier, with a possibly-incomplete scheme list, is unsafe.

    // One-shot: load overrides from backend once IntegrationService has probed
    this._ensureOverridesLoaded();

    // One-shot: load persisted custom sound schemes from backend once IntegrationService has probed
    this._ensureCustomSchemesLoaded();

    // Subscribe to persistent notifications via WebSocket once we have a connection.
    // This is independent of any card being on the dashboard.
    if (hass?.connection && !this._notificationUnsubscribe && !this._notificationPending) {
      this._subscribeToNotifications(hass.connection);
    }
  }

  /**
   * Subscribe to HA's persistent_notification/subscribe WebSocket stream.
   * Fires the 'notification' sound whenever a notification is added (not on the
   * initial snapshot, which contains pre-existing notifications on page load).
   * @param {Object} connection - hass.connection
   * @private
   */
  _subscribeToNotifications(connection) {
    this._notificationPending = true;
    let isInitialSnapshot = true;

    // resubscribe: false — we manage reconnects via the 'disconnected' listener
    // below rather than relying on the library's auto-resubscribe.  Auto-resubscribe
    // can fire an unhandled rejection if HA rejects the attempt during its own
    // restart sequence (before the persistent_notification component is ready).
    connection.subscribeMessage(
      (message) => {
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          return;
        }
        if (message.type === 'added') {
          lcardsLog.debug('[SoundManager] Persistent notification added — playing notification sound');
          if (this._isCategoryEnabled('alerts')) this.play('notification');
        }
      },
      { type: 'persistent_notification/subscribe' },
      { resubscribe: false }
    ).then((unsubscribe) => {
      this._notificationPending     = false;
      this._notificationUnsubscribe = unsubscribe;
      lcardsLog.info('[SoundManager] Subscribed to persistent notifications');
    }).catch((err) => {
      this._notificationPending = false;
      lcardsLog.warn('[SoundManager] Could not subscribe to persistent notifications:', err);
    });

    // When this connection closes, clear the ref so updateHass() re-subscribes
    // fresh on the next hass update after reconnect.
    // The removeEventListener() call is deferred to a microtask: Connection.fireEvent()
    // dispatches via Array.forEach() over the *live* listeners array, and
    // removeEventListener() splices that same array. Splicing out an earlier-registered
    // listener while forEach is still iterating shifts later listeners down an index,
    // causing forEach to skip whichever listener was registered immediately after this
    // one (e.g. ConnectionOverlayService's 'disconnected' handler) on this first firing.
    const onDisconnect = () => {
      this._notificationUnsubscribe = null;
      this._notificationPending     = false;
      queueMicrotask(() => connection.removeEventListener('disconnected', onDisconnect));
    };
    connection.addEventListener('disconnected', onDisconnect);
  }

  /**
   * Mount global HA UI event listeners for Tier 2 sounds.
   * Safe to call multiple times — only mounts once.
   */
  mountGlobalUIListener() {
    if (this._menuToggleHandler) return; // Already mounted

    // Sidebar hamburger expand/collapse — HA's ha-menu-button dispatches this event
    // on window when the hamburger is tapped. Some HA versions dispatch it twice per
    // click (button + host component), so dedup within a 200 ms window.
    let _lastMenuToggle = 0;
    this._menuToggleHandler = () => {
      const now = Date.now();
      if (now - _lastMenuToggle < 200) return;
      _lastMenuToggle = now;
      this.play('menu_expand');
    };

    // Page / view navigation handler — fires for all location changes including sidebar nav.
    this._navHandler = () => {
      if (this._isCategoryEnabled('ui')) this.play('nav_page');
    };

    window.addEventListener('hass-toggle-menu', this._menuToggleHandler);
    window.addEventListener('location-changed', this._navHandler);

    // hass-action listener — catches taps/holds on any standard HA card that fires
    // the 'hass-action' composed event (Mushroom, HA built-in cards, etc.).
    // LCARdS cards that already handle their own sounds via setupActions() do NOT fire
    // hass-action, so there is no double-firing. As a belt-and-suspenders guard we
    // also skip events whose composedPath passes through a LCARdS custom element.
    this._hassActionHandler = (e) => {
      if (!this._isCategoryEnabled('cards')) return;
      // Skip if the event originated inside a LCARdS card shadow DOM
      const path = /** @type {any[]} */ (e.composedPath?.() || []);
      if (path.some(el => el?.tagName?.startsWith?.('LCARDS-'))) return;
      const action = /** @type {any} */ (e).detail?.action;
      if (action === 'tap') this.play('card_tap');
      else if (action === 'hold') this.play('card_hold');
      else if (action === 'double_tap') this.play('card_double_tap');
    };
    document.addEventListener('hass-action', this._hassActionHandler, { passive: true });

    // show-dialog → dialog_open for any HA dialog EXCEPT more-info (handled separately below)
    this._showDialogHandler = (e) => {
      if (!this._isCategoryEnabled('ui')) return;
      const tag = /** @type {any} */ (e).detail?.dialogTag;
      // Skip more-info — hass-more-info listener handles it with its own event type
      if (tag === 'ha-more-info-dialog') return;
      this.play('dialog_open');
    };
    document.addEventListener('show-dialog', this._showDialogHandler, { passive: true });

    // hass-more-info → more_info_open (fired by both LCARdS and native HA cards)
    this._hassMoreInfoHandler = () => {
      this.play('more_info_open');
    };
    document.addEventListener('hass-more-info', this._hassMoreInfoHandler, { passive: true });

    // Dashboard edit mode detection — HA uses history.replaceState (not a DOM event)
    // to toggle ?edit=1 in the URL when entering/exiting dashboard edit mode.
    // Patch replaceState to detect the param change; restore the original in destroy().
    this._lastEditMode = window.location.search.includes('edit=1');
    const _origReplaceState = window.history.replaceState.bind(window.history);
    this._historyReplaceStateOrig = _origReplaceState;
    window.history.replaceState = (...args) => {
      _origReplaceState(...args);
      const url = args[2] != null ? String(args[2]) : window.location.href;
      const nowEditing = url.includes('edit=1');
      if (nowEditing !== this._lastEditMode) {
        this._lastEditMode = nowEditing;
        if (!this._isCategoryEnabled('ui')) return;
        this.play(nowEditing ? 'dashboard_edit_start' : 'dashboard_edit_save');
      }
    };

    // dialog-closed → fires when any HA dialog is dismissed (save or cancel)
    // Detail: { dialog: element.localName } e.g. 'hui-dialog-edit-card'
    // Covers card edit, view edit, badge edit, more-info, etc.
    // Skip LCARdS-own elements to avoid double-sounds.
    this._dialogClosedHandler = (e) => {
      if (!this._isCategoryEnabled('ui')) return;
      const dialog = /** @type {any} */ (e).detail?.dialog || '';
      if (!dialog || dialog.startsWith('lcards-')) return;
      this.play('dialog_close');
    };
    document.addEventListener('dialog-closed', this._dialogClosedHandler, { passive: true });

    lcardsLog.info('[SoundManager] Global UI listeners mounted');
  }

  /**
   * Subscribe to alert mode changes for alert sounds.
   * Called by LCARdSCore after initialization.
   * The input_select is the source of truth — sounds fire via this subscription
   * whether the change came from the HA UI, the Config Panel, or window.lcards.setAlertMode().
   */
  subscribeToAlertMode() {
    const helperManager = this._core?.helperManager;
    if (!helperManager) {
      lcardsLog.warn('[SoundManager] HelperManager not available — alert sound subscription skipped');
      return;
    }
    if (this._alertUnsubscribe) {
      this._alertUnsubscribe();
      this._alertUnsubscribe = null;
    }
    this._alertUnsubscribe = helperManager.subscribeToHelper('alert_mode', (newMode, oldMode) => {
      if (!oldMode) return; // Skip initial fire on registration
      if (!this._isCategoryEnabled('alerts')) return;
      const EVENT_MAP = {
        red_alert:    'alert_red',
        yellow_alert: 'alert_yellow',
        blue_alert:   'alert_blue',
        gray_alert:   'alert_gray',
        black_alert:  'alert_black',
        green_alert:  'alert_clear',
      };
      const event = EVENT_MAP[newMode];
      if (event) this.play(event);
    });
    lcardsLog.info('[SoundManager] Alert mode subscription active');
  }

  /**
   * Play an alert sound directly — used as fallback when no input_select helper exists.
   * @param {string} mode
   */
  playAlertSound(mode) {
    if (!this._isCategoryEnabled('alerts')) return;
    const EVENT_MAP = {
      red_alert:    'alert_red',
      yellow_alert: 'alert_yellow',
      blue_alert:   'alert_blue',
      gray_alert:   'alert_gray',
      black_alert:  'alert_black',
      green_alert:  'alert_clear',
    };
    const event = EVENT_MAP[mode];
    if (event) this.play(event);
  }

  /**
   * Destroy SoundManager — unmounts listeners, clears cache, unsubscribes.
   */
  destroy() {
    if (this._menuToggleHandler) {
      window.removeEventListener('hass-toggle-menu', this._menuToggleHandler);
      this._menuToggleHandler = null;
    }
    if (this._navHandler) {
      window.removeEventListener('location-changed', this._navHandler);
      this._navHandler = null;
    }
    if (this._hassActionHandler) {
      document.removeEventListener('hass-action', this._hassActionHandler);
      this._hassActionHandler = null;
    }
    if (this._showDialogHandler) {
      document.removeEventListener('show-dialog', this._showDialogHandler);
      this._showDialogHandler = null;
    }
    if (this._hassMoreInfoHandler) {
      document.removeEventListener('hass-more-info', this._hassMoreInfoHandler);
      this._hassMoreInfoHandler = null;
    }
    if (this._historyReplaceStateOrig) {
      window.history.replaceState = /** @type {any} */ (this._historyReplaceStateOrig);
      this._historyReplaceStateOrig = null;
    }
    if (this._dialogClosedHandler) {
      document.removeEventListener('dialog-closed', this._dialogClosedHandler);
      this._dialogClosedHandler = null;
    }
    if (this._alertUnsubscribe) {
      this._alertUnsubscribe();
      this._alertUnsubscribe = null;
    }
    if (this._notificationUnsubscribe) {
      this._notificationUnsubscribe();
      this._notificationUnsubscribe = null;
    }
    this._audioCache.clear();
    lcardsLog.info('[SoundManager] Destroyed');
  }

  // ============================================================================
  // SCHEME MANAGEMENT
  // ============================================================================

  /**
   * Register sound schemes from a pack definition.
   * Called by PackManager when loading packs.
   *
   * @param {Object} schemes - Map of scheme name → event-to-assetKey map
   * @example
   * soundManager.registerSchemes({
   *   'lcars_classic': {
   *     card_tap:    'btn_beep',
   *     menu_expand: 'beep_nav',
   *     card_hover:  null,  // null = silence this event in this scheme
   *   }
   * });
   */
  registerSchemes(schemes) {
    Object.keys(schemes).forEach(name => {
      this._soundSchemes.set(name, schemes[name]);
      lcardsLog.debug(`[SoundManager] Registered sound scheme: ${name}`);
    });
    // Startup registers schemes in two waves — pack-provided schemes register
    // synchronously first, custom schemes load from backend storage moments
    // later (an async round trip gated on the integration probe). Syncing
    // after the FIRST wave would push an options list to the live HA entity
    // that doesn't yet include the custom ones; input_select.set_options
    // unconditionally resets the entity's *value* to the first option on any
    // change, and since the entity is shared across every open tab, an
    // incomplete list from one tab's early sync can stomp a value another
    // tab (or this one, moments later) already correctly set. So: don't sync
    // at all until _doLoadCustomSchemes() has settled (see below) — after
    // that point every registerSchemes() call (e.g. saving a new scheme
    // live) is a single, safe, immediate sync as before.
    if (this._startupSchemesSettled) {
      this._scheduleSyncSchemeHelperOptions();
    }
  }

  /**
   * Schedule a scheme-options sync for the next microtask, coalescing rapid calls.
   * @private
   */
  _scheduleSyncSchemeHelperOptions() {
    if (this._syncScheduled) return;
    this._syncScheduled = true;
    Promise.resolve().then(() => {
      this._syncScheduled = false;
      this._syncSchemeHelperOptions();
    });
  }

  /**
   * Get all registered scheme names (including 'none').
   * @returns {string[]}
   */
  getSchemeNames() {
    return ['none', ...Array.from(this._soundSchemes.keys())];
  }

  /**
   * Get all event types with labels and categories.
   * Used by Config Panel to build the overrides table.
   * @returns {Array<{key: string, label: string, category: string}>}
   */
  getEventTypes() {
    return Object.entries(SOUND_EVENT_LABELS).map(([key, label]) => ({
      key,
      label,
      category: EVENT_CATEGORY[key] || 'other'
    }));
  }

  /**
   * True if a scheme name is a user-created custom scheme (vs. pack-provided).
   * @param {string} name
   * @returns {boolean}
   */
  isCustomScheme(name) {
    return typeof name === 'string' && name.startsWith('custom:');
  }

  /**
   * One-shot load of persisted custom sound schemes from backend storage,
   * registering them alongside pack-provided schemes. Mirrors
   * _ensureOverridesLoaded()'s wait-for-integration-then-load-once pattern.
   * Safe to call multiple times — always returns the same in-flight or
   * completed promise.
   * @returns {Promise<void>}
   * @private
   */
  _ensureCustomSchemesLoaded() {
    if (this._customSchemesLoadPromise) return this._customSchemesLoadPromise;
    const integration = this._core?.integrationService;
    if (!integration) return Promise.resolve(); // Core not ready yet — will retry on next updateHass()
    this._customSchemesLoadPromise = this._doLoadCustomSchemes(integration);
    return this._customSchemesLoadPromise;
  }

  /**
   * Perform the actual custom-schemes load. Called once via _ensureCustomSchemesLoaded().
   * @param {Object} integration
   * @returns {Promise<void>}
   * @private
   */
  async _doLoadCustomSchemes(integration) {
    await integration.onReady();

    if (integration.available) {
      const stored = await integration.readStorage(STORAGE_KEY_CUSTOM_SOUND_SCHEMES);
      if (stored && Object.keys(stored).length > 0) {
        Object.keys(stored).forEach(name => this._soundSchemes.set(name, stored[name]));
        lcardsLog.debug(`[SoundManager] Loaded ${Object.keys(stored).length} custom sound scheme(s) from storage`);
      }
    }

    // This is the first safe point to sync — pack schemes (registered
    // synchronously, earlier in core init) and custom schemes (just above)
    // have both had their one chance to register, whether or not any custom
    // schemes were actually found. Every later registerSchemes() call syncs
    // immediately, since there's no longer a second wave that could race it.
    this._startupSchemesSettled = true;
    this._scheduleSyncSchemeHelperOptions();
  }

  /**
   * Read-modify-write the full custom_sound_schemes backend object.
   * @param {(existing: Object) => Object} mutate - Receives the current stored
   *   map, returns the new map to persist.
   * @returns {Promise<{ok: boolean, error?: string}>}
   * @private
   */
  async _writeCustomSchemes(mutate) {
    const integration = this._core?.integrationService;
    if (!integration?.available) {
      return { ok: false, error: 'Backend unavailable — cannot save.' };
    }
    const existing = (await integration.readStorage(STORAGE_KEY_CUSTOM_SOUND_SCHEMES)) || {};
    const updated = mutate(existing);
    const wrote = await integration.writeStorage({ [STORAGE_KEY_CUSTOM_SOUND_SCHEMES]: updated });
    if (!wrote) return { ok: false, error: 'Failed to save — backend write error.' };
    return { ok: true };
  }

  /**
   * Persist a user-created sound scheme, built from a snapshot of the current
   * global per-event overrides, and register it immediately so it appears in
   * the Sound Scheme dropdown without a reload.
   *
   * @param {string} name - Display name; slugified and prefixed 'custom:' to
   *   form the full scheme name (e.g. "Bridge Ops" → "custom:bridge-ops").
   * @param {Object} overridesMap - event type → assetKey | media-source id | null
   * @returns {Promise<{ok: boolean, name?: string, error?: string}>}
   */
  async saveCustomScheme(name, overridesMap) {
    const slug = String(name ?? '').trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) return { ok: false, error: 'Please enter a scheme name.' };

    const fullName = `custom:${slug}`;
    if (this._soundSchemes.has(fullName)) {
      return { ok: false, error: 'A custom scheme with this name already exists.' };
    }

    const result = await this._writeCustomSchemes(existing => ({ ...existing, [fullName]: overridesMap }));
    if (!result.ok) return result;

    this.registerSchemes({ [fullName]: overridesMap });
    lcardsLog.info(`[SoundManager] Saved custom sound scheme: ${fullName}`);
    return { ok: true, name: fullName };
  }

  /**
   * Overwrite an existing custom scheme's event map with a new snapshot
   * (typically the current global per-event overrides), and register the
   * change immediately.
   *
   * @param {string} fullName - Full scheme name (must already be registered
   *   and start with 'custom:').
   * @param {Object} overridesMap - event type → assetKey | media-source id | null
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async updateCustomScheme(fullName, overridesMap) {
    if (!this.isCustomScheme(fullName)) {
      return { ok: false, error: 'Not a custom scheme.' };
    }
    if (!this._soundSchemes.has(fullName)) {
      return { ok: false, error: 'Custom scheme not found.' };
    }

    const result = await this._writeCustomSchemes(existing => ({ ...existing, [fullName]: overridesMap }));
    if (!result.ok) return result;

    this._soundSchemes.set(fullName, overridesMap);
    lcardsLog.info(`[SoundManager] Updated custom sound scheme: ${fullName}`);
    return { ok: true };
  }

  /**
   * Permanently delete a custom scheme (backend storage + in-memory registry).
   * No-op error if the target isn't a custom scheme — pack-provided schemes
   * cannot be deleted this way.
   *
   * @param {string} fullName - Full scheme name (must start with 'custom:').
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async deleteCustomScheme(fullName) {
    if (!this.isCustomScheme(fullName)) {
      return { ok: false, error: 'Not a custom scheme.' };
    }

    const result = await this._writeCustomSchemes(existing => {
      const { [fullName]: _removed, ...rest } = existing;
      return rest;
    });
    if (!result.ok) return result;

    this._soundSchemes.delete(fullName);
    // Remove it from the HA input_select's options too, same as registerSchemes()
    // adds new ones — otherwise it stays selectable there as a dead option.
    if (this._startupSchemesSettled) {
      this._scheduleSyncSchemeHelperOptions();
    }
    lcardsLog.info(`[SoundManager] Deleted custom sound scheme: ${fullName}`);
    return { ok: true };
  }

  // ============================================================================
  // PLAYBACK
  // ============================================================================

  /**
   * Play a sound for the given event type.
   *
   * Resolution order:
   * 1. context.cardOverride (null = silence, string = use that asset key)
   * 2. Per-event override from backend storage ('sound_overrides')
   * 3. Active scheme mapping
   * 4. Silence (no sound registered)
   *
   * @param {string} eventType - Event type key (e.g., 'card_tap')
   * @param {Object} [context={}] - Optional context
   * @param {string|null} [context.cardOverride] - Card-level override (null silences)
   */
  play(eventType, context = {}) {
    if (!this._isEnabled()) return;
    const category = EVENT_CATEGORY[eventType];
    if (category && !this._isCategoryEnabled(category)) return;

    let assetKey;

    // 1. Card-level override
    if ('cardOverride' in context) {
      if (context.cardOverride === null) return;
      assetKey = context.cardOverride;
    }

    // 2. Per-event override (device beats user beats global; null = explicit mute)
    if (!assetKey) {
      const overrides = this._getOverrides();
      if (eventType in overrides) {
        if (overrides[eventType] === null) return;
        assetKey = overrides[eventType] || null;
      }
    }

    // 3. Active scheme
    if (!assetKey) {
      const scheme = this._getActiveScheme();
      const schemeValue = scheme[eventType];
      if (schemeValue === null) return;
      assetKey = schemeValue || null;
    }

    if (!assetKey) return;
    this._playAsset(assetKey);
  }

  /**
   * Preview a specific audio asset (bypasses all enable/disable checks).
   * Used by Config Panel preview buttons.
   * @param {string} assetKey - Asset key to preview
   */
  preview(assetKey) {
    this._playAsset(assetKey);
  }

  /**
   * Play a specific audio asset directly, bypassing scheme/override resolution.
   * Respects the master sound_enabled switch but not the per-category toggles
   * (cards/ui/alerts) — used for HA-action-triggered playback such as
   * lcards.play_sound, where the sound isn't tied to any UI category.
   * @param {string} assetKey - Asset key registered in AssetManager
   */
  playAsset(assetKey) {
    if (!this._isEnabled()) return;
    this._playAsset(assetKey);
  }

  /**
   * Preview the active (or specified) scheme by playing a representative event.
   * @param {string} [schemeName] - Scheme to preview (defaults to active)
   * @param {string} [eventType='card_tap'] - Event type to use for preview
   */
  previewScheme(schemeName, eventType = 'card_tap') {
    const name = schemeName || this._core?.helperManager?.getHelperValue('sound_scheme') || 'none';
    const scheme = this._soundSchemes.get(name) || {};
    const assetKey = scheme[eventType] || null;
    if (assetKey) this._playAsset(assetKey);
  }

  /**
   * Preview the effective sound for a given event type, resolving:
   *   1. Per-event override (helper)
   *   2. Active scheme default
   * Bypasses all enable/disable checks (same as preview()).
   * @param {string} eventType - Event type key (e.g., 'card_tap')
   */
  previewEvent(eventType) {
    // 1. Per-event override (null = explicit mute)
    const overrides = this._getOverrides();
    let assetKey = null;
    if (eventType in overrides) {
      if (overrides[eventType] === null) return; // Explicitly silenced
      assetKey = overrides[eventType] || null;
    }

    // 2. Active scheme
    if (!assetKey) {
      const scheme = this._getActiveScheme();
      assetKey = scheme[eventType] || null;
    }

    if (assetKey) this._playAsset(assetKey);
    else lcardsLog.debug(`[SoundManager] previewEvent: no asset found for "${eventType}"`);
  }

  // ============================================================================
  // OVERRIDES
  // ============================================================================

  /**
   * Get current per-event overrides map.
   * @returns {Object} Map of eventType → assetKey
   */
  /**
   * Return per-event overrides for a given scope tier.
   *
   * Use ``'global'`` to read the globally-shared overrides — these are shown in
   * the Global Settings section of the config panel and are shared across all
   * users and browsers.
   *
   * Use ``'user'`` to read the current user's personal overrides.
   * Use ``'device'`` to read this device's overrides.
   *
   * For determining the *effective* sound to play (device beats user beats global),
   * use the private ``_getOverrides()`` instead.
   *
   * @param {'global'|'user'|'device'} [scope='global']
   * @returns {Object}
   */
  getOverrides(scope = 'global') {
    if (scope === 'user')   return this._overridesCache       ?? {};
    if (scope === 'device') return this._deviceOverridesCache ?? {};
    return this._globalOverridesCache ?? {};
  }

  /**
   * Set a per-event sound override.
   * @param {string} eventType - Event type key
   * @param {string|null} assetKey - Asset key to use, or null to clear override
   * @param {'global'|'user'} [scope='user'] - Storage tier to write to
   * @returns {Promise<void>}
   */
  async setOverride(eventType, assetKey, scope = 'user') {
    const current = scope === 'global'
      ? { ...(this._globalOverridesCache ?? {}) }
      : { ...(this._overridesCache ?? {}) };
    if (assetKey === null) {
      delete current[eventType];
    } else {
      current[eventType] = assetKey;
    }
    await this._saveOverrides(current, scope);
  }

  /**
   * Clear all per-event overrides for a given scope tier.
   * @param {'global'|'user'} [scope='user']
   * @returns {Promise<void>}
   */
  async clearAllOverrides(scope = 'user') {
    await this._saveOverrides({}, scope);
  }

  /**
   * Replace the entire global override map in a single write. Used by the
   * Config Panel's explicit "Save" action (_saveOverrideChanges() in
   * lcards-sound-config-tab.js) to commit a staged batch of per-event edits
   * at once, instead of one backend write per dropdown change.
   * @param {Object} overridesMap - event type → assetKey | media-source id | null
   * @returns {Promise<void>}
   */
  async saveGlobalOverrides(overridesMap) {
    await this._saveOverrides({ ...overridesMap }, 'global');
  }

  /**
   * Re-read all device/user scoped settings from the backend and update the
   * in-memory caches (_cachedVolume, _cachedScheme, _cachedEnabled).
   *
   * Call this after writing new scoped values from the config panel so that
   * playback immediately reflects the change without a page reload.  A write
   * from the config panel updates the backend storage but SoundManager would
   * otherwise keep the cached value from boot until the next full reload.
   *
   * @returns {Promise<void>}
   */
  async refreshScopedCache() {
    const sss = window.lcards?.core?.scopedSettingsService;
    if (!sss) return;

    // Reset all scoped caches so _getVolume() / _isEnabled() / _getActiveScheme()
    // fall through to the live helper until the re-read completes.
    this._cachedVolume  = undefined;
    this._cachedScheme  = undefined;
    this._cachedEnabled = undefined;

    // Re-read device + user tiers (same logic as _ensureOverridesLoaded but
    // without the one-shot guard so it can be called any number of times).
    const vol = await sss.read(STORAGE_KEY_SOUND_VOLUME, ['device', 'user']);
    if (vol !== null && vol !== undefined) this._cachedVolume = parseFloat(vol);

    const scheme = await sss.read(STORAGE_KEY_SOUND_SCHEME, ['device', 'user']);
    if (scheme !== null && scheme !== undefined) this._cachedScheme = scheme;

    const enabled = await sss.read(STORAGE_KEY_SOUND_ENABLED, ['device', 'user']);
    if (enabled !== null && enabled !== undefined) {
      this._cachedEnabled = (enabled === true || enabled === 'on');
    }

    // Re-read per-event overrides for all tiers so _setOverride changes take
    // effect immediately without a page reload.
    const globalRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['global']);
    this._globalOverridesCache = (globalRaw !== null && globalRaw !== undefined) ? globalRaw : {};

    const userRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['user']);
    this._overridesCache = (userRaw !== null && userRaw !== undefined) ? userRaw : {};

    const deviceRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['device']);
    this._deviceOverridesCache = (deviceRaw !== null && deviceRaw !== undefined) ? deviceRaw : {};

    lcardsLog.debug('[SoundManager] Scoped settings cache refreshed',
      { volume: this._cachedVolume, scheme: this._cachedScheme, enabled: this._cachedEnabled });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Check if the sound system is globally enabled.
   * Returns the scoped cached value (populated async by _ensureOverridesLoaded) if
   * available; otherwise falls back to the HA helper for synchronous callers.
   * Safe when helpers don't exist yet — returns false (opt-in).
   * @returns {boolean}
   * @private
   */
  _isEnabled() {
    if (this._cachedEnabled !== undefined) return this._cachedEnabled;
    const val = this._core?.helperManager?.getHelperValue('sound_enabled');
    // Opt-in for master: only 'on' enables sounds. Missing entity (boolean false sentinel) → off.
    // Categories are opt-out from master — their default_value=true means "on if master is on".
    return val === 'on';
  }

  /**
   * Check if a specific sound category is enabled.
   * @param {string} category - 'cards', 'ui', or 'alerts'
   * @returns {boolean}
   * @private
   */
  _isCategoryEnabled(category) {
    if (!category) return true;
    const key = `sound_${category}_enabled`;
    const val = this._core?.helperManager?.getHelperValue(key);
    // Opt-out: missing entity (boolean true sentinel) → category on. Only 'off' disables.
    return val !== 'off';
  }

  /**
   * Resolve the name of the currently active sound scheme.
   * Returns cached scoped value if available, else the HA helper's value,
   * else 'none' (the helper's own default_value when missing entirely).
   * 'none' is a genuine empty scheme — see _getActiveScheme() — not a
   * "not configured yet, fall back to something" sentinel; a scheme-level
   * silence distinct from the master sound_enabled toggle, since per-event
   * overrides (global/user/device) still apply on top of it.
   * @returns {string}
   * @private
   */
  _getActiveSchemeName() {
    return this._cachedScheme
      ?? this._core?.helperManager?.getHelperValue('sound_scheme')
      ?? 'none';
  }

  /**
   * Get the active sound scheme event map. 'none' resolves to {} (every
   * event silent by default, per the "omitted events → silence" rule),
   * since 'none' is never a real key in _soundSchemes.
   * @returns {Object}
   * @private
   */
  _getActiveScheme() {
    return this._soundSchemes.get(this._getActiveSchemeName()) ?? {};
  }

  /**
   * Return a shallow copy of a registered scheme's raw event map — e.g. for
   * displaying/editing a custom scheme's own definition directly in the
   * Config Panel, as opposed to the separate global/user/device override
   * layers that sit on top of pack-provided schemes.
   * @param {string} name - Full scheme name.
   * @returns {Object}
   */
  getSchemeMapping(name) {
    return { ...(this._soundSchemes.get(name) ?? {}) };
  }

  /**
   * Return a shallow copy of the currently *active* scheme's raw event map,
   * resolving the 'none' fallback the same way playback does (falls through
   * to the first registered scheme — see _getActiveSchemeName()).
   *
   * Used when promoting the global override layer into a new named scheme:
   * the override layer only ever contains the events someone explicitly
   * touched, so a new scheme built from *just* that would silence every
   * other event once it's active (custom schemes have no further fallback).
   * Merging this full mapping in first, with overrides layered on top,
   * produces a complete, standalone scheme that behaves identically to what
   * was actually playing at save time.
   * @returns {Object}
   */
  getActiveSchemeMapping() {
    return { ...this._getActiveScheme() };
  }

  /**
   * Get current master volume (0.0–1.0).
   * Returns cached scoped value if available, else falls back to HA helper.
   * @returns {number}
   * @private
   */
  _getVolume() {
    const raw = this._cachedVolume !== undefined
      ? this._cachedVolume
      : this._core?.helperManager?.getHelperValue('sound_volume');
    const num = parseFloat(raw);
    return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
  }

  /**
   * Load overrides once from backend storage.
   * No-op after the first successful completion.
   * @returns {Promise<void>}
   * @private
   */
  /**
   * Trigger overrides/settings load if not already started, and return the promise.
   * Safe to call multiple times — always returns the same in-flight or completed promise.
   * Returns a resolved promise immediately if the integration isn't available yet
   * (updateHass will retry on the next HASS update).
   * @returns {Promise<void>}
   * @private
   */
  _ensureOverridesLoaded() {
    if (this._overridesLoadPromise) return this._overridesLoadPromise;
    const integration = this._core?.integrationService;
    if (!integration) return Promise.resolve(); // Core not ready yet — will retry on next updateHass()
    this._overridesLoadPromise = this._doLoadOverrides(integration);
    return this._overridesLoadPromise;
  }

  /**
   * Perform the actual overrides/scoped-settings load. Called once via _ensureOverridesLoaded().
   * @param {Object} integration
   * @returns {Promise<void>}
   * @private
   */
  async _doLoadOverrides(integration) {
    await integration.onReady();
    this._overridesLoaded = true;

    const sss = this._core?.scopedSettingsService;

    if (sss) {
      const vol = await sss.read(STORAGE_KEY_SOUND_VOLUME, ['device', 'user']);
      if (vol !== null && vol !== undefined) this._cachedVolume = parseFloat(vol);

      const scheme = await sss.read(STORAGE_KEY_SOUND_SCHEME, ['device', 'user']);
      if (scheme !== null && scheme !== undefined) this._cachedScheme = scheme;

      const enabled = await sss.read(STORAGE_KEY_SOUND_ENABLED, ['device', 'user']);
      if (enabled !== null && enabled !== undefined) this._cachedEnabled = (enabled === true || enabled === 'on');
    }

    if (integration.available) {
      if (sss) {
        const globalRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['global']);
        this._globalOverridesCache = (globalRaw !== null && globalRaw !== undefined) ? globalRaw : {};

        const userRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['user']);
        this._overridesCache = (userRaw !== null && userRaw !== undefined) ? userRaw : {};

        const deviceRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['device']);
        this._deviceOverridesCache = (deviceRaw !== null && deviceRaw !== undefined) ? deviceRaw : {};
      } else {
        const backendValue = await integration.readStorage(STORAGE_KEY_SOUND_OVERRIDES);
        this._globalOverridesCache = (backendValue !== undefined && backendValue !== null) ? backendValue : {};
        this._overridesCache = {};
      }
      lcardsLog.debug('[SoundManager] Overrides loaded from backend storage (scoped)');
    } else {
      this._globalOverridesCache = {};
      this._overridesCache = {};
      lcardsLog.warn('[SoundManager] Integration unavailable — sound overrides will not be persisted');
    }
  }

  /**
   * Returns a promise that resolves once overrides and scoped settings are fully loaded.
   * Await this before playing startup sounds that may depend on user overrides.
   * @returns {Promise<void>}
   */
  ensureReady() {
    return this._ensureOverridesLoaded();
  }

  /**
   * Return effective per-event overrides for playback: global merged with user merged
   * with device, where device-scope values win on a per-event basis.
   * Returns an empty object if the async load has not yet completed.
   *
   * The global tier is skipped entirely when the active scheme is a custom
   * (user-created) scheme — its own event map (edited in place via the Config
   * Panel, see updateCustomScheme()) already represents the full desired
   * mapping, so layering the separate global-override map on top of it would
   * let stale overrides from a previous built-in-scheme session silently mask
   * the custom scheme's own settings. User/device tiers still always apply —
   * they're a per-person/per-device personalization layer independent of
   * which scheme (built-in or custom) is globally active.
   * @returns {Object}
   * @private
   */
  _getOverrides() {
    const skipGlobal = this.isCustomScheme(this._getActiveSchemeName());
    return {
      ...(skipGlobal ? {} : (this._globalOverridesCache ?? {})),
      ...(this._overridesCache       ?? {}),
      ...(this._deviceOverridesCache ?? {}),
    };
  }

  /**
   * Persist overrides — updates in-memory cache and backend storage.
   * Logs a warning if the integration is unavailable (overrides will not be persisted).
   * @param {Object} overrides
   * @returns {Promise<void>}
   * @private
   */
  async _saveOverrides(overrides, scope = 'user') {
    // 1. Update in-memory cache immediately (synchronous callers benefit)
    if (scope === 'global') {
      this._globalOverridesCache = overrides;
    } else {
      this._overridesCache = overrides;
    }

    // 2. Backend storage
    const sss = this._core?.scopedSettingsService;
    const integration = this._core?.integrationService;

    if (sss && integration?.available) {
      const ok = await sss.write(STORAGE_KEY_SOUND_OVERRIDES, overrides, scope);
      if (ok) {
        lcardsLog.debug(`[SoundManager] Saved sound overrides to ${scope}-scoped backend storage`);
      }
    } else if (integration?.available) {
      // Legacy path (no scoped storage) — always flat global key
      const ok = await integration.writeStorage({ [STORAGE_KEY_SOUND_OVERRIDES]: overrides });
      if (ok) {
        lcardsLog.debug('[SoundManager] Saved sound overrides to global backend storage (legacy path)');
      }
    } else {
      lcardsLog.warn('[SoundManager] Integration unavailable — sound overrides not persisted to backend');
    }
  }

  /**
   * Resolve asset URL from AssetManager registry and play via cached Audio element.
   *
   * NOTE: We read `entry.url` directly from the registry metadata rather than
   * calling assetManager.get() (which is async and loads the ArrayBuffer).
   * Audio elements use the URL natively — no need to pre-load the binary content.
   *
   * Autoplay: browser policy is enforced natively by audio.play() — no guard needed here.
   * Sites that allow autoplay (browser site settings) will hear sounds on page load;
   * others will have play() silently rejected until the first user gesture.
   *
   * @param {string} assetKey - Asset key registered in AssetManager, or a
   *   `media-source://…` content ID picked via the HA media library.
   * @private
   */
  _playAsset(assetKey) {
    if (typeof assetKey === 'string' && assetKey.startsWith('media-source://')) {
      this._playMediaSourceAsset(assetKey);
      return;
    }

    // Read URL directly from registry metadata — no async required
    const registry = this._core?.assetManager?.getRegistry('audio');
    const entry = registry?.assets?.get(assetKey);
    const url = entry?.url;

    if (!url) {
      lcardsLog.warn(`[SoundManager] No audio URL for asset key: ${assetKey}`);
      return;
    }

    try {
      if (!this._audioCache.has(assetKey)) {
        this._audioCache.set(assetKey, new Audio(url));
      }
      const audio = this._audioCache.get(assetKey);
      audio.volume = this._getVolume();
      audio.currentTime = 0;
      audio.play().catch(() => {}); // Suppress AbortError from rapid replays
    } catch (e) {
      lcardsLog.warn('[SoundManager] Audio playback error:', e);
    }
  }

  /**
   * Resolve and play a `media-source://…` sound reference (HA media library item).
   *
   * Re-resolves on every call (cheap — AssetManager caches the resolved URL for
   * 15 minutes) and rebuilds the cached `Audio` element whenever the resolved
   * URL has changed, since media-source URLs may carry an expiring signed token
   * unlike the permanent URLs used by bundled `audio_assets`.
   *
   * @param {string} mediaContentId - A `media-source://…` content ID.
   * @private
   */
  async _playMediaSourceAsset(mediaContentId) {
    const url = await this._core?.assetManager?.resolveMediaSourceUrl?.(mediaContentId);
    if (!url) {
      lcardsLog.warn(`[SoundManager] Failed to resolve media source: ${mediaContentId}`);
      return;
    }

    try {
      let audio = this._audioCache.get(mediaContentId);
      if (!audio || audio.src !== url) {
        audio = new Audio(url);
        this._audioCache.set(mediaContentId, audio);
      }
      audio.volume = this._getVolume();
      audio.currentTime = 0;
      audio.play().catch(() => {}); // Suppress AbortError from rapid replays
    } catch (e) {
      lcardsLog.warn('[SoundManager] Audio playback error:', e);
    }
  }

  /**
   * Get debug information about the sound manager state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      type: 'SoundManager',
      schemesCount: this._soundSchemes?.size || 0,
      schemeNames: this.getSchemeNames(),
      audioCacheSize: this._audioCache?.size || 0,

      schemesOptionsSynced: this._schemesOptionsSynced || false,
      syncInProgress: this._syncInProgress || false,
      syncScheduled: this._syncScheduled || false
    };
  }

  /**
   * Dump the full decision-chain state for enable/disable checks to the console.
   * Run from browser console: window.lcards.core.soundManager.diagnose()
   */
  diagnose() {
    const hm = this._core?.helperManager;
    const soundEnabledVal   = hm?.getHelperValue('sound_enabled');
    const cardsEnabledVal   = hm?.getHelperValue('sound_cards_enabled');
    const uiEnabledVal      = hm?.getHelperValue('sound_ui_enabled');
    const alertsEnabledVal  = hm?.getHelperValue('sound_alerts_enabled');

    const info = {
      '--- SoundManager caches ---': '',
      '_cachedEnabled':  this._cachedEnabled,
      '_cachedScheme':   this._cachedScheme,
      '_cachedVolume':   this._cachedVolume,
      '_overridesLoaded': this._overridesLoaded,
      '--- HelperManager raw values (from cache/HASS) ---': '',
      'sound_enabled (raw)':          soundEnabledVal,
      'sound_enabled (type)':         typeof soundEnabledVal,
      'sound_cards_enabled (raw)':    cardsEnabledVal,
      'sound_cards_enabled (type)':   typeof cardsEnabledVal,
      'sound_ui_enabled (raw)':       uiEnabledVal,
      'sound_ui_enabled (type)':      typeof uiEnabledVal,
      'sound_alerts_enabled (raw)':   alertsEnabledVal,
      'sound_alerts_enabled (type)':  typeof alertsEnabledVal,
      '--- Computed results ---': '',
      '_isEnabled()':                 this._isEnabled(),
      '_isCategoryEnabled(cards)':    this._isCategoryEnabled('cards'),
      '_isCategoryEnabled(ui)':       this._isCategoryEnabled('ui'),
      '_isCategoryEnabled(alerts)':   this._isCategoryEnabled('alerts'),
      '--- HelperManager _valueCache ---': '',
      '_valueCache entries': hm?._valueCache ? Object.fromEntries(hm._valueCache) : null,
    };
    console.table(info);
    return info;
  }

  /**
   * Sync the sound_scheme input_select options to match all registered schemes.
   * Non-fatal if helper doesn't exist yet.
   *
   * `updateSelectOptions()` does a real network round trip (`input_select.set_options`
   * plus a value-restore call), so a second registration can easily land while one
   * is still in flight — e.g. custom schemes loading from storage shortly after
   * pack-provided schemes register at startup. Rather than dropping that second
   * request (which would leave the new scheme name selectable in LCARdS's own UI
   * but rejected by HA as "not a valid option" — the actual entity never got
   * updated), queue exactly one follow-up sync to run once the current one
   * finishes, reading whatever the full scheme list looks like by then.
   * @private
   */
  async _syncSchemeHelperOptions() {
    if (this._syncInProgress) {
      this._syncPending = true;
      lcardsLog.debug('[SoundManager] _syncSchemeHelperOptions: sync in progress, queuing follow-up');
      return;
    }
    this._syncInProgress = true;
    const helperManager = this._core?.helperManager;
    if (!helperManager) {
      this._syncInProgress = false;
      return;
    }

    const liveValue = helperManager.getHelperValue('sound_scheme');
    // Capture once per session (before any set_options call could have reset
    // it), or refresh if the live value is a different, already-registered
    // scheme — that means the user explicitly changed the selection after
    // startup settled, not a set_options side effect from an earlier wave.
    if (this._schemeRestoreValue === undefined
        || (liveValue && liveValue !== this._schemeRestoreValue && this._soundSchemes.has(liveValue))) {
      this._schemeRestoreValue = liveValue ?? null;
    }

    try {
      const updated = await helperManager.updateSelectOptions(
        'sound_scheme',
        this.getSchemeNames(),
        this._schemeRestoreValue
      );
      if (updated) {
        this._schemesOptionsSynced = true;
        lcardsLog.debug('[SoundManager] Synced sound_scheme helper options:', this.getSchemeNames());
      }
    } catch (e) {
      lcardsLog.debug('[SoundManager] Could not sync sound_scheme options:', e.message);
    } finally {
      this._syncInProgress = false;
      if (this._syncPending) {
        this._syncPending = false;
        this._syncSchemeHelperOptions();
      } else {
        // Truly settled — nothing else queued. Wake anyone waiting via
        // waitForSchemeSync() (e.g. a caller about to explicitly switch the
        // active scheme right after registering a new one, which must not
        // race this sync's own restore-previous-value step).
        const resolvers = this._syncSettledResolvers;
        this._syncSettledResolvers = [];
        resolvers.forEach(resolve => resolve());
      }
    }
  }

  /**
   * Resolve once any in-flight or queued scheme-options sync has fully
   * settled. Callers that are about to explicitly change the active scheme
   * right after a registerSchemes()-triggering call (e.g. saving a new
   * custom scheme and switching to it) should await this first — otherwise
   * the sync's own "restore the previously-active scheme" step is a
   * separate, independently-timed service call that can land after the
   * explicit switch and silently revert it.
   * @returns {Promise<void>}
   */
  waitForSchemeSync() {
    if (!this._syncInProgress && !this._syncPending && !this._syncScheduled) {
      return Promise.resolve();
    }
    return new Promise(resolve => this._syncSettledResolvers.push(resolve));
  }

}

