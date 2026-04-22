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

    /** @type {EventListener|null} Bound global click handler (for cleanup) */
    this._globalClickHandler = null;

    /** @type {EventListener|null} Bound location-changed handler (for cleanup) */
    this._navHandler = null;

    /** @type {EventListener|null} First-interaction tracker (for cleanup) */
    this._interactionHandler = null;

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

    /** @type {boolean} Whether the user has interacted (browser autoplay policy) */
    this._userInteracted = false;

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
  }

  /**
   * Mount global HA UI event listeners for Tier 2 sounds.
   * Safe to call multiple times — only mounts once.
   */
  mountGlobalUIListener() {
    if (this._globalClickHandler) return; // Already mounted

    // Track first user interaction (browser autoplay policy guard)
    this._interactionHandler = () => {
      this._userInteracted = true;
      lcardsLog.debug('[SoundManager] User interaction detected — audio playback enabled');
      // Once we have interaction, remove this one-time listener
      document.removeEventListener('click', this._interactionHandler, { capture: true });
      this._interactionHandler = null;
    };
    document.addEventListener('click', this._interactionHandler, { capture: true, passive: true });

    // Global click handler — handles sidebar hamburger/menu expand only.
    // Navigation sounds (sidebar items, view changes) are handled by location-changed below.
    this._globalClickHandler = (e) => {
      if (!this._isCategoryEnabled('ui')) return;
      const path = /** @type {any[]} */ (e.composedPath());
      if (!path || path.length === 0) return;

      const inSidebar = path.some(el =>
        el?.tagName === 'HA-SIDEBAR' ||
        el?.getAttribute?.('role') === 'navigation'
      );
      if (!inSidebar) return;

      const isHamburger = path.some(el =>
        el?.tagName === 'HA-ICON-BUTTON' ||
        el?.tagName === 'PAPER-ICON-BUTTON'
      );
      if (isHamburger) {
        this.play('menu_expand');
      }
    };

    // Page / view navigation handler — fires for all location changes including sidebar nav.
    this._navHandler = () => {
      if (this._isCategoryEnabled('ui')) this.play('nav_page');
    };

    document.addEventListener('click', this._globalClickHandler, { capture: true, passive: true });
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
    if (this._interactionHandler) {
      document.removeEventListener('click', this._interactionHandler, { capture: true });
      this._interactionHandler = null;
    }
    if (this._globalClickHandler) {
      document.removeEventListener('click', this._globalClickHandler, { capture: true });
      this._globalClickHandler = null;
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
   *     nav_sidebar: 'beep_nav',
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
      if (context.cardOverride === null) return; // Explicitly silenced
      assetKey = context.cardOverride;
    }

    // 2. Per-event override (user beats global; null = explicit mute)
    if (!assetKey) {
      const overrides = this._getOverrides();
      if (eventType in overrides) {
        if (overrides[eventType] === null) return; // Explicitly silenced — do not fall through
        assetKey = overrides[eventType] || null;
      }
    }

    // 3. Active scheme
    if (!assetKey) {
      const scheme = this._getActiveScheme();
      const schemeValue = scheme[eventType];
      if (schemeValue === null) return; // Scheme explicitly silences this event
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
    this._playAsset(assetKey, true);
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
    if (assetKey) this._playAsset(assetKey, true);
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

    if (assetKey) this._playAsset(assetKey, true);
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
    // Synchronous path: use cached scoped value if we have it, else fall back to helper
    if (this._cachedEnabled !== undefined) return this._cachedEnabled;
    const val = this._core?.helperManager?.getHelperValue('sound_enabled');
    return val === true || val === 'on';
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
    // Default to true if helper doesn't exist (category opt-out model)
    return val !== false && val !== 'off';
  }

  /**
   * Get the active sound scheme event map.
   * Returns cached scoped value if available, else falls back to HA helper.
   * @returns {Object}
   * @private
   */
  _getActiveScheme() {
    const name = this._cachedScheme
      ?? this._core?.helperManager?.getHelperValue('sound_scheme')
      ?? 'none';
    return this._soundSchemes.get(name) || {};
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
  async _ensureOverridesLoaded() {
    if (this._overridesLoaded) return;
    const integration = this._core?.integrationService;
    if (!integration) return; // Core not ready yet — will retry on next updateHass()

    // Wait for the probe to complete via the public API rather than accessing
    // the private _probed flag directly.
    await integration.onReady();

    this._overridesLoaded = true; // Claim the slot to prevent concurrent loads

    // Load scoped sound settings (async, cached in _cached* fields for sync access)
    const sss = this._core?.scopedSettingsService;

    if (sss) {
      // Volume: device > user only — no 'global' tier here so the cache is only
      // populated when there is an actual scoped override.  When no override
      // exists (null result) _cachedVolume stays undefined, and _getVolume()
      // falls through to the live HA helper on every call, picking up any
      // changes made through the global volume slider without a page reload.
      const vol = await sss.read(STORAGE_KEY_SOUND_VOLUME, ['device', 'user']);
      if (vol !== null && vol !== undefined) this._cachedVolume = parseFloat(vol);

      // Scheme: same rationale — only cache when a real scoped override exists.
      const scheme = await sss.read(STORAGE_KEY_SOUND_SCHEME, ['device', 'user']);
      if (scheme !== null && scheme !== undefined) this._cachedScheme = scheme;

      // Enabled: device > user — same rationale as volume/scheme. Only cache when
      // a real scoped override exists so changes to the global helper are picked up
      // via the live fallback in _isEnabled() when no scoped override is set.
      const enabled = await sss.read(STORAGE_KEY_SOUND_ENABLED, ['device', 'user']);
      if (enabled !== null && enabled !== undefined) this._cachedEnabled = (enabled === true || enabled === 'on');
    }

    if (integration.available) {
      if (sss) {
        // Load global, user and device overrides separately so each tier can be read/written
        // independently from the config panel.  Playback merges them (device > user > global).
        const globalRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['global']);
        this._globalOverridesCache = (globalRaw !== null && globalRaw !== undefined) ? globalRaw : {};

        const userRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['user']);
        this._overridesCache = (userRaw !== null && userRaw !== undefined) ? userRaw : {};

        const deviceRaw = await sss.read(STORAGE_KEY_SOUND_OVERRIDES, ['device']);
        this._deviceOverridesCache = (deviceRaw !== null && deviceRaw !== undefined) ? deviceRaw : {};
      } else {
        // Legacy path (no scoped storage) — flat global key only.
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
   * @param {string} assetKey - Asset key registered in AssetManager
   * @param {boolean} [force=false] - If true, skip browser interaction check (for preview)
   * @private
   */
  _playAsset(assetKey, force = false) {
    // Enforce browser autoplay policy — skip until user has interacted with the page.
    // Preview calls (force=true) bypass this so the Config Panel can test sounds.
    if (!force && !this._userInteracted) {
      lcardsLog.trace('[SoundManager] Audio skipped — awaiting first user interaction (browser autoplay policy)');
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
   * Get debug information about the sound manager state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      type: 'SoundManager',
      schemesCount: this._soundSchemes?.size || 0,
      schemeNames: this.getSchemeNames(),
      audioCacheSize: this._audioCache?.size || 0,
      userInteracted: this._userInteracted || false,
      schemesOptionsSynced: this._schemesOptionsSynced || false,
      syncInProgress: this._syncInProgress || false,
      syncScheduled: this._syncScheduled || false
    };
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

