/**
 * @fileoverview LCARdS Sound Config Tab - UI for managing sound system settings
 *
 * Provides a full configuration UI for the LCARdS sound system:
 * - Helper status (create missing helpers inline)
 * - Master enable / volume controls
 * - Per-category toggles (cards, UI navigation, alerts)
 * - Sound scheme selector with preview
 * - Per-event override table with asset picker and preview per row
 *
 * Reads from window.lcards.core.soundManager and window.lcards.core.helperManager.
 *
 * @element lcards-sound-config-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { STORAGE_KEY_SOUND_VOLUME, STORAGE_KEY_SOUND_SCHEME, STORAGE_KEY_SOUND_ENABLED, STORAGE_KEY_SOUND_OVERRIDES } from '../../core/services/ScopedSettingsConstants.js';
import { originBadge } from './shared/scoped-field-helpers.js';
import '../../editor/components/shared/lcards-form-section.js';
import '../../editor/components/shared/lcards-message.js';
import './lcards-preview-chip.js';
import './shared/lcards-scope-selector.js';

const CATEGORY_LABELS = {
  cards:  'Card Interactions',
  ui:     'UI Navigation',
  alerts: 'Alerts & System',
};

// Fill colours for the per-event category chips (matching the former .category-badge palette)
const CATEGORY_CHIP_BG = {
  cards:  'color-mix(in srgb, var(--info-color, #03a9f4) 20%, transparent)',
  ui:     'color-mix(in srgb, var(--success-color, #4caf50) 20%, transparent)',
  alerts: 'color-mix(in srgb, var(--warning-color, #ff9800) 20%, transparent)',
};
const CATEGORY_CHIP_FG = {
  cards:  'var(--info-color, #03a9f4)',
  ui:     'var(--success-color, #4caf50)',
  alerts: 'var(--warning-color, #ff9800)',
};

export class LCARdSSoundConfigTab extends LitElement {
  static properties = {
    hass:               { type: Object },
    _helpers:           { type: Array,    state: true },
    _audioAssets:       { type: Array,    state: true },
    _overrides:         { type: Object,   state: true },
    _schemeNames:       { type: Array,    state: true },
    _eventTypes:        { type: Array,    state: true },
    _creatingHelpers:   { type: Boolean,  state: true },
    /** Currently-displayed scope in the Scoped Overrides section */
    _scopeTab:          { type: String,   state: true },
    /**
     * Cached resolved values from ScopedSettingsService.readAllScopes():
     * { [key]: { device, user, global, resolved } }
     */
    _scopedValues:      { type: Object,   state: true },
    _scopedLoading:     { type: Boolean,  state: true },
    /** Per-event overrides for the currently-viewed scope subject */
    _scopedOverrides:   { type: Object,   state: true },
    _scopedOverridesLoading: { type: Boolean, state: true },
    /** Admin: which user_id is being edited (null = own) */
    _adminScopeUserId:  { type: String,   state: true },
    /** Admin: which device_id is being edited (null = own device) */
    _adminScopeDeviceId:{ type: String,   state: true },
    /** Admin: basic settings (volume/scheme/enabled) for the currently-viewed admin target; null = own */
    _adminTargetBasic:  { type: Object,   state: true },
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._helpers             = [];
    this._audioAssets         = [];
    this._overrides           = {};
    this._schemeNames         = ['none'];
    this._eventTypes          = [];
    this._creatingHelpers     = false;
    /** @type {Function[]} Unsubscribe functions for helper state subscriptions */
    this._helperSubscriptions = [];
    /** @type {'user'|'device'} Active tab in the scoped overrides panel */
    this._scopeTab   = 'user';
    /** @type {Object|null} Cached scope values; null means not yet loaded */
    this._scopedValues  = null;
    /** @type {boolean} True while an async load is in progress */
    this._scopedLoading = false;
    /** @type {Object|null} Per-event overrides for the active scope subject */
    this._scopedOverrides = null;
    this._scopedOverridesLoading = false;
    /** @type {string|null} Admin: which user_id is being edited; null = own */
    this._adminScopeUserId = null;
    /** @type {string|null} Admin: which device_id is being edited; null = own */
    this._adminScopeDeviceId = null;
    /** @type {Object|null} Basic settings for admin-selected target; null = own */
    this._adminTargetBasic = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._refresh();
    this._subscribeToHelpers();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._helperSubscriptions.forEach(unsub => unsub());
    this._helperSubscriptions = [];
  }

  /**
   * Propagate hass and refresh when it becomes available
   */
  willUpdate(changedProps) {
    super.willUpdate(changedProps);
    if (changedProps.has('hass') && this.hass) {
      this._refresh();
    }
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  _refresh() {
    const sm  = window.lcards?.core?.soundManager;
    const hm  = window.lcards?.core?.helperManager;
    const am  = window.lcards?.core?.assetManager;

    if (!hm) return;

    // Read current values directly from this.hass.states so we always get the
    // live HA state regardless of whether hm._valueCache has been populated yet.
    this._helpers = (hm.getHelpersByCategory('sound') || []).map(h => {
      const entityState = this.hass?.states?.[h.entity_id];
      return {
        ...h,
        exists:       !!entityState,
        currentValue: entityState ? entityState.state : (hm.getHelperValue(h.key) ?? h.default_value),
      };
    });

    // Audio assets from AssetManager
    if (am) {
      try {
        const registry = am.getRegistry('audio');
        this._audioAssets = Array.from(registry.assets.entries()).map(([key, entry]) => ({
          key,
          description: entry.metadata?.description || key,
          pack: entry.metadata?.pack || 'unknown',
        }));
      } catch {
        this._audioAssets = [];
      }
    }

    // Scheme names and event types from SoundManager
    if (sm) {
      this._schemeNames = sm.getSchemeNames();
      this._eventTypes  = sm.getEventTypes();
      // Explicitly read the global scope — the Global Settings panel shows/edits
      // the shared overrides that apply to every user.
      this._overrides   = sm.getOverrides('global');
    }

    this.requestUpdate();
  }

  /**
   * Subscribe to all sound helpers via HelperManager so the UI stays in sync
   * when values change externally (e.g. from another browser tab or HA UI).
   * Called once on connectedCallback; re-subscribes safely if already clean.
   */
  _subscribeToHelpers() {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;

    const soundHelperKeys = (hm.getHelpersByCategory('sound') || []).map(h => h.key);

    soundHelperKeys.forEach(key => {
      const unsub = hm.subscribeToHelper(key, (newValue) => {
        this._helpers = this._helpers.map(h =>
          h.key === key ? { ...h, currentValue: newValue } : h
        );
        this.requestUpdate();
        lcardsLog.trace(`[SoundConfigTab] Helper updated: ${key} = ${newValue}`);
      });
      this._helperSubscriptions.push(unsub);
    });

    lcardsLog.debug(`[SoundConfigTab] Subscribed to ${soundHelperKeys.length} sound helpers`);
  }

  // ============================================================================
  // HELPER ACTIONS
  // ============================================================================

  async _createAllMissingHelpers() {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;

    this._creatingHelpers = true;
    this.requestUpdate();

    try {
      for (const h of this._helpers.filter(h => !h.exists)) {
        await hm.ensureHelper(h.key);
        lcardsLog.info(`[SoundConfigTab] Created helper: ${h.key}`);
      }
    } catch (e) {
      lcardsLog.error('[SoundConfigTab] Failed to create helpers:', e);
    }

    this._creatingHelpers = false;
    this._refresh();
  }

  async _createHelper(key) {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;
    try {
      await hm.ensureHelper(key);
      this._refresh();
    } catch (e) {
      lcardsLog.error(`[SoundConfigTab] Failed to create helper ${key}:`, e);
    }
  }

  // ============================================================================
  // HELPER VALUE CONTROLS
  // ============================================================================

  async _setHelperValue(key, value) {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;
    try {
      await hm.setHelperValue(key, value);
      // Update local cache immediately
      this._helpers = this._helpers.map(h => h.key === key ? { ...h, currentValue: value } : h);
      this.requestUpdate();
    } catch (e) {
      lcardsLog.error(`[SoundConfigTab] Failed to set ${key}:`, e);
    }
  }

  // ============================================================================
  // SCOPED SETTINGS
  // ============================================================================

  /**
   * Load all-scope values for the three scoped sound settings.
   * Results cached in this._scopedValues.
   */
  async _loadScopedValues() {
    const sss = window.lcards?.core?.scopedSettingsService;
    const hm  = window.lcards?.core?.helperManager;
    if (!sss || this._scopedLoading) return;

    this._scopedLoading = true;
    this.requestUpdate();

    try {
      const [vol, scheme, enabled] = await Promise.all([
        sss.readAllScopes(STORAGE_KEY_SOUND_VOLUME,
          () => hm?.getHelperValue('sound_volume')),
        sss.readAllScopes(STORAGE_KEY_SOUND_SCHEME,
          () => hm?.getHelperValue('sound_scheme')),
        sss.readAllScopes(STORAGE_KEY_SOUND_ENABLED,
          () => hm?.getHelperValue('sound_enabled')),
      ]);
      this._scopedValues = {
        [STORAGE_KEY_SOUND_VOLUME]:  vol,
        [STORAGE_KEY_SOUND_SCHEME]:  scheme,
        [STORAGE_KEY_SOUND_ENABLED]: enabled,
      };
      lcardsLog.debug('[SoundConfigTab] Loaded scoped values', this._scopedValues);
    } catch (err) {
      lcardsLog.error('[SoundConfigTab] Failed to load scoped values:', err);
    } finally {
      this._scopedLoading = false;
      this.requestUpdate();
    }
  }

  /**
   * Write a value to a specific scope and refresh the cache.
   * @param {string} storageKey  - ScopedSettingsConstants key
   * @param {*}      value       - The new value
   * @param {'user'|'device'} scope
   */
  async _setScopedValue(storageKey, value, scope) {
    const sss = window.lcards?.core?.scopedSettingsService;
    if (!sss) return;
    try {
      await sss.write(storageKey, value, scope);
      lcardsLog.info(`[SoundConfigTab] Wrote ${storageKey}=${value} to ${scope} scope`);
    } catch (err) {
      lcardsLog.error(`[SoundConfigTab] Failed to write ${storageKey} to ${scope}:`, err);
    }
    // Reload to reflect truth
    this._scopedValues = null;
    await this._loadScopedValues();
    // Keep SoundManager caches in sync so playback reflects the change immediately.
    await window.lcards?.core?.soundManager?.refreshScopedCache();
  }

  /**
   * Clear a scoped override, letting the value fall through to the parent scope.
   * @param {string} storageKey
   * @param {'user'|'device'} scope
   */
  async _clearScopedValue(storageKey, scope) {
    const sss = window.lcards?.core?.scopedSettingsService;
    if (!sss) return;
    try {
      await sss.clear(storageKey, scope);
      lcardsLog.info(`[SoundConfigTab] Cleared ${storageKey} from ${scope} scope`);
    } catch (err) {
      lcardsLog.error(`[SoundConfigTab] Failed to clear ${storageKey} from ${scope}:`, err);
    }
    this._scopedValues = null;
    await this._loadScopedValues();
    // Keep SoundManager caches in sync so playback reflects the clear immediately.
    await window.lcards?.core?.soundManager?.refreshScopedCache();
  }

  /**
   * Write a basic setting for an admin-selected target (another user or device).
   * @param {string} storageKey
   * @param {*} value  null = clear
   * @param {'user'|'device'} scope
   */
  async _setScopedValueAdmin(storageKey, value, scope) {
    const conn = this.hass?.connection;
    if (!conn) return;
    try {
      if (scope === 'user' && this._adminScopeUserId) {
        // Use null to signal "cleared" — deep-merge sets the key to null, which
        // the read path treats as "no override" (null ?? null = null).
        await conn.sendMessagePromise({
          type: 'lcards/storage/users/set',
          user_id: this._adminScopeUserId,
          data: { [storageKey]: value },  // value may be null (clear) or a real value
        });
      } else if (scope === 'device' && this._adminScopeDeviceId) {
        await conn.sendMessagePromise({
          type: 'lcards/storage/devices/set',
          device_id: this._adminScopeDeviceId,
          data: { [storageKey]: value },  // same null-as-clear pattern
        });
      }
      // Reload to reflect truth
      await this._loadScopedOverrides();
    } catch (err) {
      lcardsLog.error(`[SoundConfigTab] Admin write ${storageKey} failed:`, err);
    }
  }

  /**
   * Handle scope-changed event from <lcards-scope-selector>.
   * Syncs local scope state and triggers a data reload.
   */
  _onScopeChanged(e) {
    const { scope, userId, deviceId } = e.detail;
    this._scopeTab           = scope;
    this._adminScopeUserId   = userId   ?? null;
    this._adminScopeDeviceId = deviceId ?? null;
    // Reset loaded data so it reloads for the new scope subject
    this._scopedValues     = null;
    this._scopedOverrides  = null;
    this._adminTargetBasic = null;
    this._loadScopedValues();
    this._loadScopedOverrides();
  }

  /**
   * Load admin user list (from users/list + config/auth/list for display names)
   * and device list (from devices/list).  Silently no-ops for non-admin.
   * @deprecated Use <lcards-scope-selector> which handles this internally.
   */
  async _loadAdminLists() {
    // No-op: admin list loading is now owned by <lcards-scope-selector>.
  }

  /**
   * Load per-event overrides for the currently-viewed scope subject.
   * For own scope: use ScopedSettingsService.
   * For admin-selected subject: use WS users/get or devices/get directly.
   */
  async _loadScopedOverrides() {
    const conn = this.hass?.connection;
    const sss  = window.lcards?.core?.scopedSettingsService;
    if (!sss || !conn) return;

    this._scopedOverridesLoading = true;
    this.requestUpdate();

    try {
      const scope = this._scopeTab;
      let rawOverrides = null;

      if (scope === 'user') {
        const targetId = this._adminScopeUserId;
        if (targetId) {
          // Admin reading another user's data — load full value object
          const result = await conn.sendMessagePromise({
            type: 'lcards/storage/users/get',
            user_id: targetId,
          });
          const val = result?.value ?? {};
          rawOverrides = val[STORAGE_KEY_SOUND_OVERRIDES] ?? null;
          this._adminTargetBasic = {
            [STORAGE_KEY_SOUND_VOLUME]:  val[STORAGE_KEY_SOUND_VOLUME]  ?? null,
            [STORAGE_KEY_SOUND_SCHEME]:  val[STORAGE_KEY_SOUND_SCHEME]  ?? null,
            [STORAGE_KEY_SOUND_ENABLED]: val[STORAGE_KEY_SOUND_ENABLED] ?? null,
          };
        } else {
          // Own user
          const allScopes = await sss.readAllScopes(STORAGE_KEY_SOUND_OVERRIDES, () => ({}));
          rawOverrides = allScopes?.user ?? null;
          this._adminTargetBasic = null;
        }
      } else {
        const dim = window.lcards?.core?.deviceIdentityManager;
        const targetId = this._adminScopeDeviceId ?? dim?.deviceId;
        if (targetId) {
          // Load full device storage (no key filter) so we get basic settings too
          const result = await conn.sendMessagePromise({
            type: 'lcards/storage/device/get',
            device_id: targetId,
          });
          const val = result?.value ?? {};
          rawOverrides = val[STORAGE_KEY_SOUND_OVERRIDES] ?? null;
          if (this._adminScopeDeviceId) {
            // Admin viewing another device
            this._adminTargetBasic = {
              [STORAGE_KEY_SOUND_VOLUME]:  val[STORAGE_KEY_SOUND_VOLUME]  ?? null,
              [STORAGE_KEY_SOUND_SCHEME]:  val[STORAGE_KEY_SOUND_SCHEME]  ?? null,
              [STORAGE_KEY_SOUND_ENABLED]: val[STORAGE_KEY_SOUND_ENABLED] ?? null,
            };
          } else {
            this._adminTargetBasic = null;
          }
        }
      }

      this._scopedOverrides = rawOverrides ?? {};
      lcardsLog.debug('[SoundConfigTab] Loaded scoped overrides:', this._scopedOverrides);
    } catch (err) {
      lcardsLog.error('[SoundConfigTab] Failed to load scoped overrides:', err);
      this._scopedOverrides = {};
    } finally {
      this._scopedOverridesLoading = false;
      this.requestUpdate();
    }
  }

  /**
   * Write a per-event override for the current scope subject.
   * @param {string} eventKey  The event type key
   * @param {string|null} assetKey  Asset key, '__mute__' for null, '__scheme__' to clear
   * @param {'user'|'device'} scope
   */
  async _setScopedOverride(eventKey, assetKey, scope) {
    const conn = this.hass?.connection;
    const sss  = window.lcards?.core?.scopedSettingsService;
    if (!sss || !conn) return;

    // '__scheme__' → clear this event (fall through to scheme default)
    // '__mute__'   → explicit silence (store null)
    // anything else → use that asset key
    const value = assetKey === '__scheme__' ? undefined : (assetKey === '__mute__' ? null : assetKey);

    // Build the new overrides object from the in-memory state, which is kept in sync
    // after every operation. This avoids an extra WS round-trip.
    const existing = { ...(this._scopedOverrides ?? {}) };
    if (value === undefined) {
      delete existing[eventKey];
    } else {
      existing[eventKey] = value;
    }

    // IMPORTANT: the backend uses deep-merge (async_deep_set) for all writes, so
    // writing {} has NO effect — it cannot remove existing keys. The correct approach
    // is delete-then-rewrite:
    //   1. Delete the entire "sound_overrides" key for this scope (real removal)
    //   2. Re-write the new object if it contains any entries
    // This ensures the stored value always reflects exactly what is in `existing`.

    try {
      if (scope === 'user') {
        const targetId = this._adminScopeUserId;
        if (targetId) {
          // Admin path: null-set first (replaces the existing Mapping since null is not
          // a Mapping, so deep-merge treats it as a scalar replace), then write real value.
          await conn.sendMessagePromise({
            type: 'lcards/storage/users/set',
            user_id: targetId,
            data: { [STORAGE_KEY_SOUND_OVERRIDES]: null },
          });
          if (Object.keys(existing).length > 0) {
            await conn.sendMessagePromise({
              type: 'lcards/storage/users/set',
              user_id: targetId,
              data: { [STORAGE_KEY_SOUND_OVERRIDES]: existing },
            });
          }
        } else {
          // Own user: delete the sub-key entirely, then write the new object if non-empty.
          await sss.clear(STORAGE_KEY_SOUND_OVERRIDES, 'user');
          if (Object.keys(existing).length > 0) {
            await sss.write(STORAGE_KEY_SOUND_OVERRIDES, existing, 'user');
          }
        }
      } else {
        // Device scope
        const adminTargetId = this._adminScopeDeviceId;
        if (adminTargetId) {
          // Admin editing another device — use the devices/set admin command directly
          // because sss.clear/write always target the own device ID.
          await conn.sendMessagePromise({
            type: 'lcards/storage/devices/set',
            device_id: adminTargetId,
            data: { [STORAGE_KEY_SOUND_OVERRIDES]: null },
          });
          if (Object.keys(existing).length > 0) {
            await conn.sendMessagePromise({
              type: 'lcards/storage/devices/set',
              device_id: adminTargetId,
              data: { [STORAGE_KEY_SOUND_OVERRIDES]: existing },
            });
          }
        } else {
          // Own device: sss.clear sends {key: null} via device/set (own device ID).
          // null is not a Mapping so the subsequent write replaces rather than deep-merges.
          await sss.clear(STORAGE_KEY_SOUND_OVERRIDES, 'device');
          if (Object.keys(existing).length > 0) {
            await sss.write(STORAGE_KEY_SOUND_OVERRIDES, existing, 'device');
          }
        }
      }

      await this._loadScopedOverrides();
      // Keep SoundManager caches in sync so the override takes effect immediately.
      await window.lcards?.core?.soundManager?.refreshScopedCache();
    } catch (err) {
      lcardsLog.error('[SoundConfigTab] Failed to set scoped override:', err);
    }
  }

  /**
   * Clear a per-event override for the current scope subject (delegates to _setScopedOverride with __scheme__).
   */
  async _clearScopedOverride(eventKey, scope) {
    return this._setScopedOverride(eventKey, '__scheme__', scope);
  }

  /**
   * Clear all per-event overrides for the current scope subject.
   * Uses a direct delete so deep-merge artifacts are avoided.
   */
  async _clearAllScopedOverrides(scope) {
    const conn = this.hass?.connection;
    const sss  = window.lcards?.core?.scopedSettingsService;
    if (!sss || !conn) return;
    try {
      if (scope === 'user') {
        const targetId = this._adminScopeUserId;
        if (targetId) {
          // Admin: null-set the overrides key for the target user
          await conn.sendMessagePromise({
            type: 'lcards/storage/users/set',
            user_id: targetId,
            data: { [STORAGE_KEY_SOUND_OVERRIDES]: null },
          });
        } else {
          await sss.clear(STORAGE_KEY_SOUND_OVERRIDES, 'user');
        }
      } else {
        // Device scope
        const targetId = this._adminScopeDeviceId;
        if (targetId) {
          // Admin editing another device — use the devices/set admin command.
          await conn.sendMessagePromise({
            type: 'lcards/storage/devices/set',
            device_id: targetId,
            data: { [STORAGE_KEY_SOUND_OVERRIDES]: null },
          });
        } else {
          await sss.clear(STORAGE_KEY_SOUND_OVERRIDES, 'device');
        }
      }
      await this._loadScopedOverrides();
      await window.lcards?.core?.soundManager?.refreshScopedCache();
    } catch (err) {
      lcardsLog.error('[SoundConfigTab] Failed to clear all scoped overrides:', err);
    }
  }

  /** True if the current user is an HA admin */
  _isAdmin() {
    return this.hass?.user?.is_admin === true;
  }

  /** True when the user has opted into preview / experimental features. */
  _isPreviewEnabled() {
    return window.lcards?.core?.integrationService?.options?.enable_previews ?? false;
  }

  // ============================================================================
  // SOUND CONTROL HELPERS
  // ============================================================================

  _getHelperValue(key) {
    return this._helpers.find(h => h.key === key)?.currentValue;
  }

  _helperExists(key) {
    return this._helpers.find(h => h.key === key)?.exists ?? false;
  }

  _masterEnabled() {
    const v = this._getHelperValue('sound_enabled');
    return v === true || v === 'on';
  }

  async _previewScheme(schemeName) {
    window.lcards?.core?.soundManager?.previewScheme(schemeName);
  }

  async _previewAsset(assetKey) {
    if (!assetKey || assetKey === '__scheme__' || assetKey === '__mute__') return;
    window.lcards?.core?.soundManager?.preview(assetKey);
  }

  /** Preview the effective sound for an event (resolves override → scheme). */
  _previewEvent(eventType) {
    window.lcards?.core?.soundManager?.previewEvent(eventType);
  }

  async _setOverride(eventType, value) {
    const sm = window.lcards?.core?.soundManager;
    if (!sm) return;
    // '__mute__' means null (silence); '__scheme__' means clear override (use scheme).
    // Always write to 'global' scope — this is the Global Settings section.
    if (value === '__mute__') {
      await sm.setOverride(eventType, null, 'global');
    } else if (value === '__scheme__') {
      await sm.setOverride(eventType, null, 'global');
    } else {
      await sm.setOverride(eventType, value, 'global');
    }
    this._overrides = sm.getOverrides('global');
    this.requestUpdate();
  }

  _resetOverrides() {
    const sm = window.lcards?.core?.soundManager;
    if (!sm) return;
    sm.clearAllOverrides('global');
    this._overrides = sm.getOverrides('global');
    this.requestUpdate();
  }

  _overrideValueFor(eventType) {
    if (eventType in this._overrides) {
      const v = this._overrides[eventType];
      return v === null ? '__mute__' : v;
    }
    return '__scheme__';
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  render() {
    const missing = this._helpers.filter(h => !h.exists);
    const masterEnabled = this._masterEnabled();
    const schemeValue = this._getHelperValue('sound_scheme') || 'none';
    const volumeValue = parseFloat(this._getHelperValue('sound_volume') ?? 0.5);

    return html`
      <div class="studio-layout"><div class="scrollable-body">

        <!-- ── MISSING HELPERS BANNER ── -->
        ${missing.length > 0 ? html`
          <div class="banner warning">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span>${missing.length} sound helper${missing.length > 1 ? 's are' : ' is'} missing in Home Assistant.</span>
            <ha-button
              @click=${this._createAllMissingHelpers}
              ?disabled=${this._creatingHelpers}
            >
              ${this._creatingHelpers ? 'Creating…' : 'Create All'}
            </ha-button>
          </div>
        ` : ''}

        <!-- ── GLOBAL SETTINGS GROUP ── -->
        <lcards-form-section
          header="Global Settings"
          icon="mdi:earth"
          description="Default sound behaviour for all users and devices. Per-user / per-device overrides are in the section below. Note: Sound Categories are global-only."
          ?expanded=${true}
          ?outlined=${true}>
          <div class="nested-sections">

        <!-- ── MASTER CONTROLS ── -->
        <lcards-form-section
          header="Master Controls"
          icon="mdi:volume-high"
          ?expanded=${true}
          ?outlined=${true}>

          <div class="control-row prominent">
            <div class="control-label">
              <strong>Sound Effects Enabled</strong>
              <span class="hint">Master on/off for all LCARdS sounds</span>
            </div>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${masterEnabled}
              ?disabled=${!this._helperExists('sound_enabled')}
              @value-changed=${(e) => { e.stopPropagation(); this._setHelperValue('sound_enabled', e.detail.value); }}
            ></ha-selector>
          </div>

          <div class="control-row ${!masterEnabled ? 'dimmed' : ''}">
            <div class="control-label">
              Volume
              <span class="hint">Master volume for all sound effects</span>
            </div>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${volumeValue}
              ?disabled=${!this._helperExists('sound_volume') || !masterEnabled}
              @value-changed=${(e) => this._setHelperValue('sound_volume', e.detail.value)}
            ></ha-selector>
          </div>
        </lcards-form-section>

        <!-- ── CATEGORY TOGGLES ── -->
        <lcards-form-section
          header="Sound Categories"
          icon="mdi:tune"
          ?expanded=${false}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${[
            { key: 'sound_cards_enabled',  icon: 'mdi:gesture-tap',  label: 'Card Interaction Sounds',   hint: 'Button taps, holds, sliders, toggles' },
            { key: 'sound_ui_enabled',     icon: 'mdi:navigation',   label: 'UI Navigation Sounds',      hint: 'Sidebar, page transitions, menus' },
            { key: 'sound_alerts_enabled', icon: 'mdi:alert-circle', label: 'Alert & System Sounds',     hint: 'Alert mode changes, system events' },
          ].map(cat => html`
            <div class="control-row">
              <div class="control-label">
                <ha-icon icon="${cat.icon}"></ha-icon>
                ${cat.label}
                <span class="hint">${cat.hint}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ boolean: {} }}
                .value=${this._getHelperValue(cat.key) !== 'off' && this._getHelperValue(cat.key) !== false}
                ?disabled=${!this._helperExists(cat.key) || !masterEnabled}
                @value-changed=${(e) => { e.stopPropagation(); this._setHelperValue(cat.key, e.detail.value); }}
              ></ha-selector>
            </div>
          `)}
        </lcards-form-section>

        <!-- ── SOUND SCHEME ── -->
        <lcards-form-section
          header="Sound Scheme"
          icon="mdi:music-box-multiple"
          ?expanded=${false}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${this._schemeNames.length <= 1 ? html`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio packs loaded. Add an audio pack to get sound schemes.
            </div>
          ` : ''}

          <div class="control-row">
            <div class="control-label">
              Active Scheme
              <span class="hint">Select a sound scheme provided by audio packs</span>
            </div>
            <div class="scheme-row">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ select: {
                  options: this._schemeNames.map(s => ({ value: s, label: s === 'none' ? 'None (silent)' : s })),
                  mode: 'dropdown'
                }}}
                .value=${schemeValue}
                ?disabled=${!this._helperExists('sound_scheme') || !masterEnabled}
                @value-changed=${(e) => this._setHelperValue('sound_scheme', e.detail.value)}
              ></ha-selector>
              ${schemeValue !== 'none' ? html`
                <ha-button
                  @click=${() => this._previewScheme(schemeValue)}
                  ?disabled=${!masterEnabled}
                >
                  <ha-icon slot="start" icon="mdi:play-circle"></ha-icon>
                  Preview
                </ha-button>
              ` : ''}
            </div>
          </div>
        </lcards-form-section>

        <!-- ── PER-EVENT OVERRIDES ── -->
        <lcards-form-section
          header="Per-Event Overrides"
          icon="mdi:tune-variant"
          description="Override individual events regardless of the active scheme"
          ?expanded=${false}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${this._audioAssets.length === 0 ? html`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio assets registered. Load an audio pack to enable overrides.
            </div>
          ` : ''}

          ${this._eventTypes.length > 0 ? html`
            <div class="overrides-header-row">
              <lcards-message
                type="info"
                message="Overrides are stored in LCARdS Integration persistent storage.  See Storage tab for details."
              ></lcards-message>
              ${Object.keys(this._overrides).length > 0 ? html`
                <ha-button @click=${this._resetOverrides} class="reset-overrides-btn">
                  <ha-icon slot="start" icon="mdi:restore"></ha-icon>
                  Reset all to scheme defaults
                </ha-button>
              ` : ''}
            </div>
            <div class="overrides-table-wrapper">
              <table class="overrides-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Override</th>
                    <th style="width:60px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._eventTypes.map(evt => {
                    const overrideValue = this._overrideValueFor(evt.key);
                    const isCustom = overrideValue !== '__scheme__';
                    return html`
                      <tr class="${isCustom ? 'has-override' : ''}">
                        <td class="event-label">${evt.label}</td>
                        <td>
                          <ha-assist-chip
                            .filled=${true}
                            .label=${CATEGORY_LABELS[evt.category] || evt.category}
                            style="
                              --ha-assist-chip-filled-container-color: ${CATEGORY_CHIP_BG[evt.category] || 'var(--secondary-background-color)'};
                              --md-assist-chip-label-text-color: ${CATEGORY_CHIP_FG[evt.category] || 'var(--primary-text-color)'};
                              --md-sys-color-on-surface: ${CATEGORY_CHIP_FG[evt.category] || 'var(--primary-text-color)'};
                            "
                          ></ha-assist-chip>
                        </td>
                        <td>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: {
                              options: [
                                { value: '__scheme__', label: '— Use scheme default —' },
                                { value: '__mute__',   label: '🔇 Mute this event' },
                                ...this._audioAssets.map(a => ({ value: a.key, label: `${a.key} (${a.pack})` }))
                              ],
                              mode: 'dropdown'
                            }}}
                            .value=${overrideValue}
                            ?disabled=${!masterEnabled}
                            @value-changed=${(e) => this._setOverride(evt.key, e.detail.value)}
                          ></ha-selector>
                        </td>
                        <td>
                          ${overrideValue !== '__mute__' ? html`
                            <ha-icon-button
                              .label=${'Preview'}
                              @click=${() => overrideValue === '__scheme__'
                                ? this._previewEvent(evt.key)
                                : this._previewAsset(overrideValue)}
                              ?disabled=${!masterEnabled}
                            >
                              <ha-icon icon="mdi:play"></ha-icon>
                            </ha-icon-button>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          ` : ''}
        </lcards-form-section>

          </div><!-- /nested-sections -->
        </lcards-form-section><!-- /global-settings-group -->

        <!-- ── SCOPED OVERRIDES (User / Device level) ── -->
        ${this._renderScopedSection()}

        <!-- ── HELPER STATUS ── -->
        <lcards-form-section
          header="Sound Helpers Status"
          icon="mdi:cog"
          ?expanded=${false}
          ?outlined=${true}>
          <table class="helper-status-table">
            <thead>
              <tr>
                <th>Helper</th>
                <th>Entity ID</th>
                <th style="width:100px">Status</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              ${this._helpers.map(h => html`
                <tr>
                  <td>
                    <ha-icon icon="${h.icon || 'mdi:cog'}" style="color: var(--primary-color);"></ha-icon>
                    <span class="helper-name">${h.name}</span>
                  </td>
                  <td><span class="entity-id">${h.entity_id}</span></td>
                  <td>
                    <ha-assist-chip
                      .label=${h.exists ? 'Exists' : 'Missing'}
                      style="
                        --ha-assist-chip-filled-container-color: ${h.exists ? 'var(--success-color)' : 'var(--error-color)'};
                        --md-assist-chip-label-text-color: white;
                        --md-sys-color-on-surface: white;
                      "
                    >
                      <ha-icon icon="${h.exists ? 'mdi:check-circle' : 'mdi:alert-circle'}" slot="icon"></ha-icon>
                    </ha-assist-chip>
                  </td>
                  <td>
                    ${!h.exists ? html`
                      <ha-button @click=${() => this._createHelper(h.key)}>
                        <ha-icon slot="start" icon="mdi:plus"></ha-icon>
                        Create
                      </ha-button>
                    ` : ''}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </lcards-form-section>

      </div></div>
    `;
  }

  // ============================================================================
  // SCOPED OVERRIDES SECTION RENDER
  // ============================================================================

  _renderScopedSection() {
    const sss = window.lcards?.core?.scopedSettingsService;
    // Only show if the backend supports scoped storage
    const available = sss && window.lcards?.core?.integrationService?.capabilities?.has('scoped_storage');

    if (!available) {
      return html`
        <lcards-form-section
          header="Per-User / Per-Device Overrides"
          icon="mdi:account-cog"
          ?expanded=${false}
          ?outlined=${true}>
          <lcards-message
            type="info"
            message="Requires the LCARdS integration v1.12+ with scoped storage support. Update the integration to use this feature."
          ></lcards-message>
        </lcards-form-section>
      `;
    }

    const scope        = this._scopeTab;
    const isAdminUser  = this._isAdmin();
    const masterEnabled = this._masterEnabled();
    const schemeNames   = this._schemeNames;

    // Lazy-load own values (basic settings) on first render
    if (!this._scopedValues && !this._scopedLoading) {
      this._loadScopedValues();
    }
    // Lazy-load per-event overrides on first render
    if (this._scopedOverrides === null && !this._scopedOverridesLoading) {
      this._loadScopedOverrides();
    }

    // ── ADMIN TARGET STATE ──────────────────────────────────────────────────
    const adminTargetId = scope === 'user' ? this._adminScopeUserId : this._adminScopeDeviceId;
    const isAdminTarget = isAdminUser && !!adminTargetId;

    const sv = this._scopedValues;

    // Helper: value for a basic setting in the active scope
    const basicVal = (key) => {
      if (isAdminTarget) {
        return this._adminTargetBasic?.[key] ?? null;
      }
      return sv?.[key]?.[scope] ?? null;
    };
    const basicHasOverride = (key) => basicVal(key) !== null && basicVal(key) !== undefined;
    const resolvedBasicFrom = (key) => {
      if (!sv) return '…';
      const r = sv[key];
      if (!r) return '…';
      if (r.device !== null && r.device !== undefined && scope !== 'user') return 'device';
      if (r.user   !== null && r.user   !== undefined) return 'user';
      return 'global';
    };

    // Basic setting write handler
    const setBasic = (key, val) => {
      if (isAdminTarget) {
        this._setScopedValueAdmin(key, val, scope);
      } else {
        this._setScopedValue(key, val, scope);
      }
    };
    const clearBasic = (key) => {
      if (isAdminTarget) {
        this._setScopedValueAdmin(key, null, scope);
      } else {
        this._clearScopedValue(key, scope);
      }
    };

    // Per-event override helpers
    const scopedOverrideValueFor = (key) => {
      const v = this._scopedOverrides?.[key];
      if (v === null) return '__mute__';
      if (v === undefined || !(key in (this._scopedOverrides ?? {}))) return '__scheme__';
      return v;
    };
    const hasAnyScopedOverride = Object.keys(this._scopedOverrides ?? {}).length > 0;

    return html`
      <lcards-form-section
        header="Per-User / Per-Device Overrides"
        icon="mdi:account-cog"
        description="Override sound settings for a specific user or device, without changing the global defaults."
        ?expanded=${false}
        ?outlined=${true}>

        <!-- ── SCOPE SELECTOR (tabs + admin subject + context banner) ── -->
        <lcards-scope-selector
          .hass=${this.hass}
          .showGlobal=${false}
          @scope-changed=${this._onScopeChanged}
        ></lcards-scope-selector>

        <!-- ── LOADING / SETTINGS BODY ── -->
        ${(this._scopedLoading && !isAdminTarget) || this._scopedOverridesLoading ? html`
          <div class="scoped-loading">
            <ha-circular-progress indeterminate size="small"></ha-circular-progress>
            Loading…
          </div>
        ` : html`

          <!-- ╴╴╴ BASIC SETTINGS ╴╴╴ -->
          <!-- Master Enabled (user and device scope) -->
          <div class="scoped-row">
            <div class="scoped-label">
              <span>Sound Effects Enabled</span>
              ${originBadge(basicHasOverride(STORAGE_KEY_SOUND_ENABLED) ? scope : 'global', isAdminTarget)}
            </div>
            <div class="scoped-control">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ boolean: {} }}
                .value=${basicVal(STORAGE_KEY_SOUND_ENABLED) !== null
                  ? (basicVal(STORAGE_KEY_SOUND_ENABLED) === true || basicVal(STORAGE_KEY_SOUND_ENABLED) === 'on')
                  : masterEnabled}
                @value-changed=${(e) => { e.stopPropagation(); setBasic(STORAGE_KEY_SOUND_ENABLED, e.detail.value); }}
              ></ha-selector>
              ${basicHasOverride(STORAGE_KEY_SOUND_ENABLED) ? html`
                <ha-icon-button
                  .label=${'Clear override'}
                  @click=${() => clearBasic(STORAGE_KEY_SOUND_ENABLED)}
                ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>
              ` : ''}
            </div>
          </div>

          <!-- Volume -->
          <div class="scoped-row">
            <div class="scoped-label">
              <span>Volume</span>
              ${originBadge(basicHasOverride(STORAGE_KEY_SOUND_VOLUME) ? scope : 'global', isAdminTarget)}
            </div>
            <div class="scoped-control">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                .value=${basicVal(STORAGE_KEY_SOUND_VOLUME) !== null
                  ? parseFloat(basicVal(STORAGE_KEY_SOUND_VOLUME))
                  : parseFloat(sv?.[STORAGE_KEY_SOUND_VOLUME]?.resolved ?? 0.5)}
                @value-changed=${(e) => setBasic(STORAGE_KEY_SOUND_VOLUME, e.detail.value)}
              ></ha-selector>
              ${basicHasOverride(STORAGE_KEY_SOUND_VOLUME) ? html`
                <ha-icon-button
                  .label=${'Clear override'}
                  @click=${() => clearBasic(STORAGE_KEY_SOUND_VOLUME)}
                ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>
              ` : ''}
            </div>
          </div>

          <!-- Scheme -->
          <div class="scoped-row">
            <div class="scoped-label">
              <span>Sound Scheme</span>
              ${originBadge(basicHasOverride(STORAGE_KEY_SOUND_SCHEME) ? scope : 'global', isAdminTarget)}
            </div>
            <div class="scoped-control">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ select: {
                  options: schemeNames.map(s => ({ value: s, label: s === 'none' ? 'None (silent)' : s })),
                  mode: 'dropdown'
                }}}
                .value=${basicVal(STORAGE_KEY_SOUND_SCHEME)
                  ?? sv?.[STORAGE_KEY_SOUND_SCHEME]?.resolved
                  ?? 'none'}
                ?disabled=${!masterEnabled}
                @value-changed=${(e) => setBasic(STORAGE_KEY_SOUND_SCHEME, e.detail.value)}
              ></ha-selector>
              ${basicHasOverride(STORAGE_KEY_SOUND_SCHEME) ? html`
                <ha-icon-button
                  .label=${'Clear override'}
                  @click=${() => clearBasic(STORAGE_KEY_SOUND_SCHEME)}
                ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>
              ` : ''}
            </div>
          </div>

          <!-- ╴╴╴ PER-EVENT OVERRIDES ╴╴╴ -->
          <div class="scoped-overrides-header">
            <ha-icon icon="mdi:tune"></ha-icon>
            <span>Per-Event Overrides
              <span class="hint">&nbsp;—&nbsp;override individual events at the ${scope} level</span>
            </span>
            ${hasAnyScopedOverride ? html`
              <ha-button
                class="clear-all-btn"
                @click=${() => this._clearAllScopedOverrides(scope)}
              >
                <ha-icon slot="start" icon="mdi:close-circle-outline"></ha-icon>
                Clear All
              </ha-button>
            ` : ''}
          </div>

          ${this._eventTypes.length === 0 ? html`
            <div class="scoped-loading">No event types loaded yet.</div>
          ` : html`
            <div class="overrides-table-wrapper">
              <table class="overrides-table scoped-overrides-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Override</th>
                    <th style="width:60px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._eventTypes.map(evt => {
                    const scopedVal = scopedOverrideValueFor(evt.key);
                    const hasOverride = scopedVal !== '__scheme__';
                    return html`
                      <tr class="${hasOverride ? 'has-override' : ''}">
                        <td class="event-label">${evt.label}</td>
                        <td>
                          <ha-assist-chip
                            .filled=${true}
                            .label=${CATEGORY_LABELS[evt.category] || evt.category}
                            style="
                              --ha-assist-chip-filled-container-color: ${CATEGORY_CHIP_BG[evt.category] ?? 'transparent'};
                              --md-assist-chip-label-text-color: ${CATEGORY_CHIP_FG[evt.category] ?? 'inherit'};
                              --md-sys-color-on-surface: ${CATEGORY_CHIP_FG[evt.category] ?? 'inherit'};
                            "
                          ></ha-assist-chip>
                        </td>
                        <td>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: {
                              options: [
                                { value: '__scheme__',  label: '🎵 Use scheme default' },
                                { value: '__mute__',    label: '🔇 Mute this event' },
                                ...this._audioAssets.map(a => ({ value: a.key, label: `${a.key} (${a.pack})` }))
                              ],
                              mode: 'dropdown'
                            }}}
                            .value=${scopedVal}
                            ?disabled=${!masterEnabled}
                            @value-changed=${(e) => this._setScopedOverride(evt.key, e.detail.value, scope)}
                          ></ha-selector>
                        </td>
                        <td>
                          ${scopedVal !== '__mute__' ? html`
                            <ha-icon-button
                              .label=${'Preview'}
                              @click=${() => scopedVal === '__scheme__'
                                ? this._previewEvent(evt.key)
                                : this._previewAsset(scopedVal)}
                              ?disabled=${!masterEnabled}
                            >
                              <ha-icon icon="mdi:play"></ha-icon>
                            </ha-icon-button>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          `}

        `}
      </lcards-form-section>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .studio-layout {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--primary-background-color);
      min-height: 0;
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 16px;
    }

    .scrollable-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 8px;
      /* Suppress lcards-form-section's own margin-bottom; gap handles spacing */
      --lcards-section-spacing: 0;
    }

    .banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9em;
    }
    .banner.warning {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
      color: var(--primary-text-color);
    }
    .banner ha-button {
      margin-left: auto;
    }

    /* Dim sections or individual rows when sound is globally disabled */
    .dimmed {
      opacity: 0.5;
      pointer-events: none;
    }

    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
    }
    .control-row:last-child { border-bottom: none; }
    .control-row.prominent { font-size: 1.05em; }

    .control-label {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      gap: 2px;
      font-size: 0.9em;
    }
    .control-label ha-icon {
      margin-right: 6px;
      color: var(--primary-color);
    }
    .hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }

    .scheme-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 280px;
    }
    .scheme-row ha-selector {
      flex: 1;
    }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 0.85em;
      padding: 8px 0;
    }

    /* Overrides table */
    .overrides-table-wrapper {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }
    .overrides-table {
      width: 100%;
      border-collapse: collapse;
    }
    .overrides-table th {
      text-align: left;
      padding: 6px 8px;
      color: var(--secondary-text-color);
      border-bottom: 1px solid var(--divider-color);
      position: sticky;
      top: 0;
      z-index: 1;
      /* Use a fully-opaque surface colour so content doesn't bleed through when scrolling.
         Cascade through the most-specific HA surface tokens to the primary BG fallback. */
      background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color, #1c1c1c)));
    }
    .overrides-table td {
      padding: 4px 8px;
      vertical-align: middle;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
    }
    .overrides-table tr.has-override td {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .event-label {
      white-space: nowrap;
    }
    .overrides-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0 4px 8px;
    }
    .reset-overrides-btn {
      --mdc-theme-primary: var(--warning-color, #ff9800);
      flex-shrink: 0;
    }

    /* Helper status table */
    .helper-status-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85em;
    }
    .helper-status-table th {
      text-align: left;
      padding: 6px 8px;
      color: var(--secondary-text-color);
      border-bottom: 1px solid var(--divider-color);
    }
    .helper-status-table td {
      padding: 6px 8px;
      vertical-align: middle;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
    }
    .helper-status-table tr:last-child td { border-bottom: none; }
    .helper-name {
      margin-left: 6px;
      vertical-align: middle;
    }
    .entity-id {
      font-family: monospace;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }

    /* ── Scoped Overrides section ─────────────────────────────────────── */

    .scope-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .scoped-loading {
      padding: 8px;
      color: var(--secondary-text-color);
      font-size: 0.85rem;
    }

    .scoped-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.06));
    }
    .scoped-row:last-child { border-bottom: none; }

    .scoped-label {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 180px;
      font-size: 0.9rem;
      color: var(--primary-text-color);
    }

    .scoped-control {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .scoped-control ha-selector { flex: 1; }

    /* ── Admin Selector ── */
    .nested-sections {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .admin-selector-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin: 4px 0;
      background: color-mix(in srgb, var(--warning-color, #ff9800) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 30%, transparent);
      border-radius: 8px;
    }
    .admin-selector-label {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .admin-selector-input {
      flex: 1;
      min-width: 0;
    }

    /* ── Scope Context Banner ── */
    .scope-context-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      margin: 4px 0 8px;
    }
    .scope-context-banner.own {
      background: color-mix(in srgb, var(--info-color, #03a9f4) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--info-color, #03a9f4) 25%, transparent);
      color: var(--primary-text-color);
    }
    .scope-context-banner.own ha-icon {
      color: var(--info-color, #03a9f4);
      --mdc-icon-size: 18px;
    }
    .scope-context-banner.admin {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 35%, transparent);
      color: var(--primary-text-color);
    }
    .scope-context-banner.admin ha-icon {
      color: var(--warning-color, #ff9800);
      --mdc-icon-size: 18px;
    }

    /* ── Per-Event Overrides Sub-header ── */
    .scoped-overrides-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 0 6px;
      margin-top: 8px;
      border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .scoped-overrides-header ha-icon {
      color: var(--primary-color);
      --mdc-icon-size: 18px;
    }
    .scoped-overrides-header .hint {
      font-weight: 400;
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
    .scoped-overrides-header .clear-all-btn {
      margin-left: auto;
    }

    /* Scoped overrides table inherits .overrides-table but can add specifics */
    .scoped-overrides-table {
      font-size: 0.88rem;
    }
  `;
}

if (!customElements.get('lcards-sound-config-tab')) customElements.define('lcards-sound-config-tab', LCARdSSoundConfigTab);
