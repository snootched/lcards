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

    /** @type {boolean} Whether a microtask-deferred sync has already been scheduled.
     * Prevents multiple rapid registerSchemes() calls from each triggering a separate sync.
     */
    this._syncScheduled = false;

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
    if (!this._schemesOptionsSynced && this._soundSchemes.size > 0) {
      this._scheduleSyncSchemeHelperOptions();
    }
    // One-shot: load overrides from backend once IntegrationService has probed
    this._ensureOverridesLoaded();

    // Subscribe to persistent notifications via WebSocket once we have a connection.
    // This is independent of any card being on the dashboard.
    if (hass?.connection && !this._notificationUnsubscribe) {
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
    let isInitialSnapshot = true;

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
      { type: 'persistent_notification/subscribe' }
    ).then((unsubscribe) => {
      this._notificationUnsubscribe = unsubscribe;
      lcardsLog.info('[SoundManager] Subscribed to persistent notifications');
    }).catch((err) => {
      lcardsLog.warn('[SoundManager] Could not subscribe to persistent notifications:', err);
    });
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
    // Defer the sync to the next microtask — if multiple packs register schemes in
    // the same tick only a single sync fires after all of them have been added.
    this._scheduleSyncSchemeHelperOptions();
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
   * Get the active sound scheme event map.
   * Returns cached scoped value if available, else falls back to HA helper.
   * @returns {Object}
   * @private
   */
  _getActiveScheme() {
    const name = this._cachedScheme
      ?? this._core?.helperManager?.getHelperValue('sound_scheme');
    // 'none' = not yet configured (same as missing entity) → fall through to first scheme
    // Explicit silence is done via the master sound_enabled toggle, not the scheme picker
    if (name && name !== 'none') return this._soundSchemes.get(name) || {};
    return this._soundSchemes.values().next().value || {};
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
   * @returns {Object}
   * @private
   */
  _getOverrides() {
    return {
      ...(this._globalOverridesCache ?? {}),
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
   * @param {string} assetKey - Asset key registered in AssetManager
   * @private
   */
  _playAsset(assetKey) {
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
   * @private
   */
  async _syncSchemeHelperOptions() {
    // Prevent concurrent syncs — a second call while one is in-flight would read
    // stale/reset HA state and clobber the restore from the first call.
    if (this._syncInProgress) {
      lcardsLog.debug('[SoundManager] _syncSchemeHelperOptions: sync already in progress, skipping');
      return;
    }
    this._syncInProgress = true;
    const helperManager = this._core?.helperManager;
    if (!helperManager) {
      this._syncInProgress = false;
      return;
    }
    try {
      const updated = await helperManager.updateSelectOptions('sound_scheme', this.getSchemeNames());
      if (updated) {
        this._schemesOptionsSynced = true;
        lcardsLog.debug('[SoundManager] Synced sound_scheme helper options:', this.getSchemeNames());
      }
    } catch (e) {
      lcardsLog.debug('[SoundManager] Could not sync sound_scheme options:', e.message);
    } finally {
      this._syncInProgress = false;
    }
  }

}

