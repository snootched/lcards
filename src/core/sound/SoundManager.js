/**
 * @fileoverview SoundManager - Core singleton for LCARdS UI audio
 *
 * Manages sound playback for all UI interaction events using a two-tier approach:
 *   Tier 1 — Card interactions: Called from LCARdSActionHandler at tap/hold/double-tap/hover
 *   Tier 2 — Global HA UI:  Single document click listener + location-changed listener
 *
 * Configuration is stored in HA input helpers (read via HelperManager):
 *   input_boolean.lcards_sound_enabled    — Master on/off (default: false — opt-in)
 *   input_boolean.lcards_sound_cards      — Card interaction sounds
 *   input_boolean.lcards_sound_ui         — HA UI navigation sounds
 *   input_boolean.lcards_sound_alerts     — Alert/system event sounds
 *   input_number.lcards_sound_volume      — Master volume (0.0–1.0)
 *   input_select.lcards_sound_scheme      — Active sound scheme name
 *   localStorage 'lcards_sound_overrides'  — JSON per-event asset key overrides
 *
 * Sound schemes are registered from pack definitions via PackManager.registerPack().
 * Audio asset URLs are resolved directly from AssetManager's internal registry.
 *
 * @module core/sound/SoundManager
 */

import { BaseService } from '../BaseService.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

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

    /** @type {Function|null} Bound global click handler (for cleanup) */
    this._globalClickHandler = null;

    /** @type {Function|null} Bound location-changed handler (for cleanup) */
    this._navHandler = null;

    /** @type {Function|null} First-interaction tracker (for cleanup) */
    this._interactionHandler = null;

    /** @type {Function|null} hass-action event listener (for non-LCARdS HA cards) */
    this._hassActionHandler = null;

    /** @type {Function|null} show-dialog listener (general dialog open sounds) */
    this._showDialogHandler = null;

    /** @type {Function|null} hass-more-info listener (more-info panel sounds) */
    this._hassMoreInfoHandler = null;

    /** @type {Function|null} Original history.replaceState (restored on destroy) */
    this._historyReplaceStateOrig = null;

    /** @type {boolean} Last known lovelace edit mode state (for replaceState patch dedup) */
    this._lastEditMode = false;

    /** @type {Function|null} dialog-closed listener (dialog save/cancel sounds) */
    this._dialogClosedHandler = null;

    /** @type {boolean} Whether the user has interacted (browser autoplay policy) */
    this._userInteracted = false;

    /** @type {Object|null} Reference to LCARdSCore */
    this._core = null;

    /** @type {boolean} Whether the sound_scheme input_select options have been successfully
     * synced to HA at least once.
     * @type {boolean}
     */
    this._schemesOptionsSynced = false;
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
      this._syncSchemeHelperOptions();
    }
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
      const path = e.composedPath();
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
      const path = e.composedPath?.() || [];
      if (path.some(el => el?.tagName?.startsWith?.('LCARDS-'))) return;
      const action = e.detail?.action;
      if (action === 'tap') this.play('card_tap');
      else if (action === 'hold') this.play('card_hold');
      else if (action === 'double_tap') this.play('card_double_tap');
    };
    document.addEventListener('hass-action', this._hassActionHandler, { passive: true });

    // show-dialog → dialog_open for any HA dialog EXCEPT more-info (handled separately below)
    this._showDialogHandler = (e) => {
      if (!this._isCategoryEnabled('ui')) return;
      const tag = e.detail?.dialogTag;
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
      const dialog = e.detail?.dialog || '';
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
      window.history.replaceState = this._historyReplaceStateOrig;
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
    this._syncSchemeHelperOptions();
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
   * 2. Per-event override from localStorage ('lcards_sound_overrides')
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

    // 2. Per-event helper override
    if (!assetKey) {
      const overrides = this._getOverrides();
      assetKey = overrides[eventType] || null;
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

  // ============================================================================
  // OVERRIDES
  // ============================================================================

  /**
   * Get current per-event overrides map.
   * @returns {Object} Map of eventType → assetKey
   */
  getOverrides() {
    return this._getOverrides();
  }

  /**
   * Set a per-event sound override.
   * @param {string} eventType - Event type key
   * @param {string|null} assetKey - Asset key to use, or null to clear override
   * @returns {Promise<void>}
   */
  async setOverride(eventType, assetKey) {
    const current = this._getOverrides();
    if (assetKey === null) {
      delete current[eventType];
    } else {
      current[eventType] = assetKey;
    }
    this._saveOverrides(current);
  }

  /**
   * Clear all per-event overrides.
   * @returns {Promise<void>}
   */
  async clearAllOverrides() {
    this._saveOverrides({});
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Check if the sound system is globally enabled.
   * Safe when helpers don't exist yet — returns false (opt-in).
   * @returns {boolean}
   * @private
   */
  _isEnabled() {
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
   * @returns {Object}
   * @private
   */
  _getActiveScheme() {
    const name = this._core?.helperManager?.getHelperValue('sound_scheme') || 'none';
    return this._soundSchemes.get(name) || {};
  }

  /**
   * Get current master volume (0.0–1.0).
   * @returns {number}
   * @private
   */
  _getVolume() {
    const val = this._core?.helperManager?.getHelperValue('sound_volume');
    const num = parseFloat(val);
    return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
  }

  /**
   * Parse and return per-event overrides from localStorage.
   * Returns empty object on parse failure (never throws).
   * @returns {Object}
   * @private
   */
  _getOverrides() {
    try {
      const raw = localStorage.getItem('lcards_sound_overrides');
      if (!raw || raw === '{}' || raw === '') return {};
      return JSON.parse(raw);
    } catch {
      lcardsLog.warn('[SoundManager] Failed to parse sound_overrides from localStorage');
      return {};
    }
  }

  /**
   * Persist overrides to localStorage.
   * @param {Object} overrides
   * @private
   */
  _saveOverrides(overrides) {
    try {
      localStorage.setItem('lcards_sound_overrides', JSON.stringify(overrides));
      lcardsLog.debug('[SoundManager] Saved sound overrides to localStorage');
    } catch (e) {
      lcardsLog.error('[SoundManager] Failed to save sound overrides:', e);
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
   * Sync the sound_scheme input_select options to match all registered schemes.
   * Non-fatal if helper doesn't exist yet.
   * @private
   */
  async _syncSchemeHelperOptions() {
    const helperManager = this._core?.helperManager;
    if (!helperManager) return;
    try {
      const updated = await helperManager.updateSelectOptions('sound_scheme', this.getSchemeNames());
      if (updated) {
        this._schemesOptionsSynced = true;
        lcardsLog.debug('[SoundManager] Synced sound_scheme helper options:', this.getSchemeNames());
      }
    } catch (e) {
      lcardsLog.debug('[SoundManager] Could not sync sound_scheme options:', e.message);
    }
  }

}

