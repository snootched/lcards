/**
 * @fileoverview LCARdSScopeSelector — reusable scope tab selector for scoped settings panels.
 *
 * Renders a pill/tab switcher for Global / User / Device scopes, an optional
 * admin subject dropdown (visible to HA admins), and a context banner showing
 * which subject is being edited.  Fires a `scope-changed` custom event whenever
 * the active scope or subject changes.
 *
 * Used by:
 * - lcards-sound-config-tab.js   (showGlobal=false)
 * - lcards-theme-token-browser-tab.js  (showGlobal=true)
 *
 * @fires scope-changed  {scope, userId, deviceId, isAdminTarget}
 * @module panels/components/shared/lcards-scope-selector
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';

export class LCARdSScopeSelector extends LitElement {
  // --------------------------------------------------------------------------
  // Properties
  // --------------------------------------------------------------------------
  static properties = {
    hass:             { type: Object },
    /** When true a "Global" tab is shown first (theme overrides need it). */
    showGlobal:       { type: Boolean },
    disabled:         { type: Boolean },

    // ---- internal state ----
    /** Active tab: 'global' | 'user' | 'device' */
    _scopeTab:          { type: String,  state: true },
    _adminScopeUserId:  { type: String,  state: true },
    _adminScopeDeviceId:{ type: String,  state: true },
    _adminUserList:     { type: Array,   state: true },
    _adminDeviceList:   { type: Array,   state: true },
    _adminListsLoaded:  { type: Boolean, state: true },
  };

  // --------------------------------------------------------------------------
  // Constructor / lifecycle
  // --------------------------------------------------------------------------
  constructor() {
    super();
    this.hass       = undefined;
    this.showGlobal = false;
    this.disabled   = false;

    this._scopeTab           = 'user';
    this._adminScopeUserId   = null;
    this._adminScopeDeviceId = null;
    this._adminUserList      = [];
    this._adminDeviceList    = [];
    this._adminListsLoaded   = false;
  }

  /**
   * Determine the default tab when showGlobal changes so the component
   * doesn't end up on 'global' when showGlobal is turned off.
   */
  willUpdate(changedProps) {
    if (changedProps.has('showGlobal')) {
      if (this.showGlobal) {
        // When the Global tab is shown, default to it.
        this._scopeTab = 'global';
      } else if (this._scopeTab === 'global') {
        // Global tab hidden — fall back to user.
        this._scopeTab = 'user';
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // Kick off admin list load so the dropdown is ready when an admin arrives.
    this._loadAdminLists();
  }

  // --------------------------------------------------------------------------
  // Public API — called by parent to set the active scope programmatically
  // --------------------------------------------------------------------------

  /** Set the active scope tab from outside (e.g. parent restoring state). */
  setScope(scope) {
    if (typeof scope === 'string') this._scopeTab = scope;
  }

  /** Get the current scope descriptor ({ scope, userId, deviceId, isAdminTarget }). */
  getCurrentScope() {
    return this._buildScopeDescriptor();
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  _isAdmin() {
    return this.hass?.user?.is_admin === true;
  }

  _buildScopeDescriptor() {
    const scope      = this._scopeTab;
    const userId     = scope === 'user'   ? (this._adminScopeUserId   ?? null) : null;
    const deviceId   = scope === 'device' ? (this._adminScopeDeviceId ?? null) : null;
    const isAdminTarget = this._isAdmin() && ((scope === 'user' && userId !== null) ||
                                               (scope === 'device' && deviceId !== null));
    return { scope, userId, deviceId, isAdminTarget };
  }

  _fireChange() {
    this.dispatchEvent(new CustomEvent('scope-changed', {
      detail:   this._buildScopeDescriptor(),
      bubbles:  true,
      composed: true,
    }));
  }

  _adminTargetName() {
    const scope = this._scopeTab;
    if (scope === 'user' && this._adminScopeUserId) {
      const u = this._adminUserList.find(u => u.id === this._adminScopeUserId);
      return u?.name ?? this._adminScopeUserId;
    }
    if (scope === 'device' && this._adminScopeDeviceId) {
      const d = this._adminDeviceList.find(d => d.id === this._adminScopeDeviceId);
      return d?.name ?? this._adminScopeDeviceId;
    }
    return null;
  }

  /** Load the lists of users and devices that an admin can manage. */
  async _loadAdminLists() {
    if (!this._isAdmin() || this._adminListsLoaded) return;
    const conn = this.hass?.connection;
    if (!conn) return;

    try {
      const [usersResult, devicesResult, authUsers] = await Promise.all([
        conn.sendMessagePromise({ type: 'lcards/storage/users/list'  }).catch(() => ({ users:   {} })),
        conn.sendMessagePromise({ type: 'lcards/storage/devices/list'}).catch(() => ({ devices: {} })),
        conn.sendMessagePromise({ type: 'config/auth/list'           }).catch(() => []),
      ]);

      const nameMap = {};
      (Array.isArray(authUsers) ? authUsers : []).forEach(u => {
        if (u?.id) nameMap[u.id] = u.name ?? u.id;
      });

      this._adminUserList = Object.entries(usersResult?.users ?? {}).map(([id]) => ({
        id,
        name: nameMap[id] ?? id,
      }));
      this._adminDeviceList = Object.entries(devicesResult?.devices ?? {}).map(([id, data]) => ({
        id,
        name: data?.display_name ?? id,
      }));
      this._adminListsLoaded = true;
      lcardsLog.debug('[ScopeSelector] Loaded admin lists', {
        users: this._adminUserList.length, devices: this._adminDeviceList.length,
      });
    } catch (err) {
      lcardsLog.warn('[ScopeSelector] Failed to load admin lists:', err);
    }
    this.requestUpdate();
  }

  // --------------------------------------------------------------------------
  // Event handlers
  // --------------------------------------------------------------------------

  _onTabClick(tab) {
    if (this._scopeTab === tab) return;
    this._scopeTab           = tab;
    this._adminScopeUserId   = null;
    this._adminScopeDeviceId = null;
    this._fireChange();
  }

  _onAdminTargetChange(e) {
    const v = e.detail.value === '__own__' ? null : (e.detail.value || null);
    if (this._scopeTab === 'user')   this._adminScopeUserId   = v;
    else                             this._adminScopeDeviceId = v;
    this._fireChange();
  }

  // --------------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------------
  static get styles() {
    return css`
      :host { display: block; }

      .scope-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }

      .admin-selector-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .admin-selector-label {
        font-size: 13px;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .admin-selector-input {
        flex: 1;
        min-width: 0;
      }

      .scope-context-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        background: color-mix(in srgb, var(--info-color, #03a9f4) 12%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 30%, transparent);
        margin-bottom: 8px;
      }
      .scope-context-banner.admin {
        background: color-mix(in srgb, var(--warning-color, #ff9800) 12%, transparent);
        border-color: color-mix(in srgb, var(--warning-color, #ff9800) 30%, transparent);
      }
    `;
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  render() {
    const scope        = this._scopeTab;
    const isAdminUser  = this._isAdmin();
    const adminTargetId = scope === 'user' ? this._adminScopeUserId : this._adminScopeDeviceId;
    const isAdminTarget = isAdminUser && adminTargetId !== null;
    const adminTargetName = this._adminTargetName();

    return html`
      <!-- ── SCOPE PILL SWITCHER ── -->
      <div class="scope-tabs">
        ${this.showGlobal ? html`
          <ha-button
            appearance=${scope === 'global' ? 'filled' : 'plain'}
            ?disabled=${this.disabled}
            @click=${() => this._onTabClick('global')}
          >
            <ha-icon icon="mdi:earth" style="--mdc-icon-size:18px;margin-right:4px;vertical-align:middle;"></ha-icon>
            Global
          </ha-button>
        ` : nothing}
        <ha-button
          appearance=${scope === 'user' ? 'filled' : 'plain'}
          ?disabled=${this.disabled}
          @click=${() => this._onTabClick('user')}
        >
          <ha-icon icon="mdi:account" style="--mdc-icon-size:18px;margin-right:4px;vertical-align:middle;"></ha-icon>
          User
        </ha-button>
        <ha-button
          appearance=${scope === 'device' ? 'filled' : 'plain'}
          ?disabled=${this.disabled}
          @click=${() => this._onTabClick('device')}
        >
          <ha-icon icon="mdi:laptop" style="--mdc-icon-size:18px;margin-right:4px;vertical-align:middle;"></ha-icon>
          Device
        </ha-button>
      </div>

      <!-- ── ADMIN SUBJECT SELECTOR (non-Global scopes only) ── -->
      ${isAdminUser && this._adminListsLoaded && scope !== 'global' ? html`
        <div class="admin-selector-row">
          <ha-icon icon="mdi:shield-account" style="color:var(--warning-color,#ff9800);flex-shrink:0;"></ha-icon>
          <span class="admin-selector-label">Edit as admin:</span>
          <ha-selector
            class="admin-selector-input"
            .hass=${this.hass}
            .selector=${{ select: {
              options: [
                {
                  value: '__own__',
                  label: scope === 'user' ? '👤 My User (own)' : '💻 This Device (own)',
                },
                ...(scope === 'user'
                  ? this._adminUserList.map(u => ({ value: u.id, label: u.name || u.id }))
                  : this._adminDeviceList.map(d => ({ value: d.id, label: d.name || d.id }))),
              ],
              mode: 'dropdown',
            }}}
            .value=${adminTargetId ?? '__own__'}
            @value-changed=${this._onAdminTargetChange}
          ></ha-selector>
        </div>
      ` : nothing}

      <!-- ── SCOPE CONTEXT BANNER ── -->
      <div class="scope-context-banner ${isAdminTarget ? 'admin' : 'own'}">
        <ha-icon icon="${scope === 'device' ? 'mdi:laptop' : scope === 'global' ? 'mdi:earth' : 'mdi:account-circle'}"></ha-icon>
        <span>
          ${isAdminTarget
            ? html`Editing <strong>${scope}</strong> overrides for <strong>${adminTargetName}</strong>`
            : scope === 'global'
              ? html`Editing <strong>global</strong> overrides — applied to all users on this install`
              : html`Editing your own <strong>${scope}</strong> overrides`}
        </span>
      </div>
    `;
  }
}

if (!customElements.get('lcards-scope-selector')) {
  customElements.define('lcards-scope-selector', LCARdSScopeSelector);
}
