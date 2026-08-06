/**
 * @fileoverview lcards-users-devices-tab — Scoped Settings: Users & Devices
 *
 * Provides three collapsible sections in the LCARdS config panel:
 *   1. Current Session  — Shows this browser's device identity (name, UUID, last seen).
 *                         Any user can edit their own device display name from here.
 *   2. Users            — (Admin only) Lists all users who have stored per-user settings,
 *                         showing their HA display name alongside the opaque user ID.
 *                         Admins can clear all overrides for a user.
 *   3. Devices          — (Admin only) Lists all registered devices with last-seen times.
 *                         Admins can inline-rename or delete device records.
 *
 * Access model
 * ───────────────────────────────────────────────────────────────────────────
 *   Non-admin users see Section 1 only (their own device session).
 *   Admin users see all three sections.
 *
 * Data flow
 * ───────────────────────────────────────────────────────────────────────────
 *   Reads from  → window.lcards.core.deviceIdentityManager   (current session)
 *   Reads from  → ScopedSettingsService / WS commands        (users & devices lists)
 *   User names  → hass.connection config/auth/list           (admin only)
 *   Writes via  → ScopedSettingsService / WS commands
 *
 * @module panels/components/lcards-users-devices-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { DEVICE_KEY_DISPLAY_NAME, DEVICE_KEY_LAST_SEEN, DEVICE_KEY_USER_AGENT } from '../../core/services/ScopedSettingsConstants.js';
import '../../editor/components/shared/lcards-form-section.js';

export class LCARdsUsersDevicesTab extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      /** Loaded users list — [{ id, data }] (admin only) */
      _users: { type: Array, state: true },
      /** Loaded devices list — [{ id, data }] (admin only) */
      _devices: { type: Array, state: true },
      /** Map of HA user_id → display name (from config/auth/list) */
      _userNameMap: { type: Object, state: true },
      /** Current device display name (editable) */
      _deviceName: { type: String, state: true },
      /** Whether we are in inline-edit mode for the current device name */
      _editingName: { type: Boolean, state: true },
      /** User ID being confirmed for deletion, or null */
      _confirmDeleteUserId: { type: String, state: true },
      /** Device ID being confirmed for deletion, or null */
      _confirmDeleteDeviceId: { type: String, state: true },
      /** Device ID being renamed inline, or null */
      _renamingDeviceId: { type: String, state: true },
      /** Value in the inline rename input */
      _renameValue: { type: String, state: true },
      /** True while loading data */
      _loading: { type: Boolean, state: true },
      /** Error message to show in banner, or null */
      _error: { type: String, state: true },
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._users = [];
    this._devices = [];
    this._userNameMap = {};
    this._deviceName = '';
    this._editingName = false;
    this._confirmDeleteUserId = null;
    this._confirmDeleteDeviceId = null;
    this._renamingDeviceId = null;
    this._renameValue = '';
    this._loading = false;
    this._error = null;
  }

  // ─────────────────────────────────────────────────────── lifecycle ──────

  connectedCallback() {
    super.connectedCallback();
    this._refresh();
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass && !this._loading) {
      // Re-seed device name if deviceIdentityManager has one set
      const dim = window.lcards?.core?.deviceIdentityManager;
      if (dim && !this._editingName) this._deviceName = dim.displayName ?? '';
    }
  }

  // ─────────────────────────────────────────────────────── data ───────────

  async _refresh() {
    this._loading = true;
    this._error = null;

    const dim = window.lcards?.core?.deviceIdentityManager;
    if (dim) this._deviceName = dim.displayName ?? '';

    try {
      if (this._isAdmin()) {
        await Promise.all([
          this._loadUsers(),
          this._loadDevices(),
          this._loadUserNames(),
        ]);
      }
    } catch (err) {
      lcardsLog.error('[UsersDevicesTab] Failed to load data:', err);
      this._error = `Failed to load data: ${err.message ?? err}`;
    } finally {
      this._loading = false;
      this.requestUpdate();
    }
  }

  async _loadUsers() {
    const conn = this.hass?.connection;
    if (!conn) return;
    const result = await conn.sendMessagePromise({ type: 'lcards/storage/users/list' });
    const map = result?.users ?? {};
    this._users = Object.entries(map).map(([id, data]) => ({ id, data }));
  }

  async _loadDevices() {
    const conn = this.hass?.connection;
    if (!conn) return;
    const result = await conn.sendMessagePromise({ type: 'lcards/storage/devices/list' });
    const map = result?.devices ?? {};
    this._devices = Object.entries(map).map(([id, data]) => ({ id, data }));
  }

  /**
   * Fetch HA user display names via the builtin config/auth/list WS command.
   * Populates _userNameMap: { [user_id]: 'Display Name' }.
   * Admin-only; silently no-ops for non-admins.
   */
  async _loadUserNames() {
    const conn = this.hass?.connection;
    if (!conn || !this._isAdmin()) return;
    try {
      const users = await conn.sendMessagePromise({ type: 'config/auth/list' });
      const map = {};
      (Array.isArray(users) ? users : []).forEach(u => {
        if (u?.id) map[u.id] = u.name ?? u.username ?? u.id;
      });
      this._userNameMap = map;
      lcardsLog.debug('[UsersDevicesTab] Loaded user name map:', this._userNameMap);
    } catch (err) {
      // Non-fatal — IDs still display even without names
      lcardsLog.warn('[UsersDevicesTab] Could not fetch HA user names:', err);
    }
  }

  // ─────────────────────────────────────────────────────── device name ────

  async _saveDeviceName() {
    const dim = window.lcards?.core?.deviceIdentityManager;
    if (!dim) return;
    const name = this._deviceName.trim();
    if (!name) return;
    try {
      await dim.setDisplayName(name);
      this._editingName = false;
      lcardsLog.info('[UsersDevicesTab] Device name updated:', name);
      // Refresh devices list so the Registered Devices section reflects the new name immediately
      if (this._isAdmin()) await this._loadDevices();
    } catch (err) {
      lcardsLog.error('[UsersDevicesTab] Failed to save device name:', err);
      this._error = `Failed to save device name: ${err.message ?? err}`;
    }
  }

  _cancelEditName() {
    const dim = window.lcards?.core?.deviceIdentityManager;
    this._deviceName = dim?.displayName ?? '';
    this._editingName = false;
  }

  // ─────────────────────────────────────────────────────── user actions ────

  _startDeleteUser(userId) {
    this._confirmDeleteUserId = userId;
    this._confirmDeleteDeviceId = null;
    this._renamingDeviceId = null;
  }

  _cancelDeleteUser() {
    this._confirmDeleteUserId = null;
  }

  async _executeDeleteUser() {
    const userId = this._confirmDeleteUserId;
    if (!userId) return;
    const conn = this.hass?.connection;
    if (!conn) return;
    try {
      await conn.sendMessagePromise({ type: 'lcards/storage/users/clear', user_id: userId });
      this._confirmDeleteUserId = null;
      await this._loadUsers();
      lcardsLog.info('[UsersDevicesTab] Cleared overrides for user:', userId);
    } catch (err) {
      lcardsLog.error('[UsersDevicesTab] Failed to delete user data:', err);
      this._error = `Failed to delete user data: ${err.message ?? err}`;
      this._confirmDeleteUserId = null;
    }
  }

  // ─────────────────────────────────────────────────────── device actions ──

  _startRenameDevice(deviceId, currentName) {
    this._renamingDeviceId = deviceId;
    this._renameValue = currentName ?? '';
    this._confirmDeleteDeviceId = null;
  }

  _cancelRenameDevice() {
    this._renamingDeviceId = null;
    this._renameValue = '';
  }

  async _executeRenameDevice() {
    const deviceId = this._renamingDeviceId;
    const newName = this._renameValue.trim();
    if (!deviceId || !newName) return;
    const conn = this.hass?.connection;
    if (!conn) return;
    try {
      await conn.sendMessagePromise({
        type: 'lcards/storage/devices/set',
        device_id: deviceId,
        data: { [DEVICE_KEY_DISPLAY_NAME]: newName },
      });
      this._renamingDeviceId = null;
      this._renameValue = '';
      await this._loadDevices();
    } catch (err) {
      lcardsLog.error('[UsersDevicesTab] Failed to rename device:', err);
      this._error = `Failed to rename device: ${err.message ?? err}`;
      this._renamingDeviceId = null;
    }
  }

  _startDeleteDevice(deviceId) {
    this._confirmDeleteDeviceId = deviceId;
    this._confirmDeleteUserId = null;
    this._renamingDeviceId = null;
  }

  _cancelDeleteDevice() {
    this._confirmDeleteDeviceId = null;
  }

  async _executeDeleteDevice() {
    const deviceId = this._confirmDeleteDeviceId;
    if (!deviceId) return;
    const conn = this.hass?.connection;
    if (!conn) return;
    try {
      await conn.sendMessagePromise({ type: 'lcards/storage/devices/clear', device_id: deviceId });
      this._confirmDeleteDeviceId = null;
      await this._loadDevices();
      lcardsLog.info('[UsersDevicesTab] Removed device record:', deviceId);
    } catch (err) {
      lcardsLog.error('[UsersDevicesTab] Failed to delete device data:', err);
      this._error = `Failed to delete device data: ${err.message ?? err}`;
      this._confirmDeleteDeviceId = null;
    }
  }

  // ─────────────────────────────────────────────────────── helpers ─────────

  _isAdmin() {
    return this.hass?.user?.is_admin === true;
  }

  _dim() {
    return window.lcards?.core?.deviceIdentityManager;
  }

  _formatDate(isoString) {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  }

  /** Return the HA display name for a user_id, falling back gracefully. */
  _userName(userId) {
    return this._userNameMap?.[userId] ?? null;
  }

  // ─────────────────────────────────────────────────────── render ──────────

  render() {
    return html`
      <div class="studio-layout">
        ${this._error ? html`
          <div class="banner error">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span>${this._error}</span>
            <ha-button @click=${() => { this._error = null; }}>Dismiss</ha-button>
          </div>
        ` : ''}
        <div class="scrollable-body">
          ${this._renderCurrentSession()}
          ${this._isAdmin() ? this._renderUsersSection() : ''}
          ${this._isAdmin() ? this._renderDevicesSection() : ''}
        </div>
      </div>
    `;
  }

  // ── Section 1: Current session ─────────────────────────────────────────

  _renderCurrentSession() {
    const dim = this._dim();
    const deviceId = dim?.deviceId ?? '—';
    const lastSeen = this._formatDate(dim?.lastSeen);
    const userName = this.hass?.user?.name ?? 'Unknown';
    const userId = this.hass?.user?.id ?? '—';

    return html`
      <lcards-form-section
        header="This Session"
        icon="mdi:laptop"
        description="Identity of this browser/device and the logged-in user."
        ?expanded=${true}
        ?outlined=${true}>

        <div class="field-group">
          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:account"></ha-icon>
              Logged-in User
            </span>
            <span class="field-value">${userName}</span>
          </div>
          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:identifier"></ha-icon>
              User ID
            </span>
            <span class="field-value mono small muted">${userId}</span>
          </div>
        </div>

        <div class="field-group">
          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:fingerprint"></ha-icon>
              Device ID
            </span>
            <span class="field-value mono small">${deviceId}</span>
          </div>

          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:tag-text"></ha-icon>
              Display Name
            </span>
            <div class="field-value">
              ${this._editingName
                ? html`
                  <div class="inline-edit-row">
                    <input
                      class="inline-input"
                      .value=${this._deviceName}
                      @input=${(e) => (this._deviceName = e.target.value)}
                      @keydown=${(e) => {
                        if (e.key === 'Enter') this._saveDeviceName();
                        if (e.key === 'Escape') this._cancelEditName();
                      }}
                      placeholder="e.g. Kitchen Tablet"
                    />
                    <ha-button @click=${this._saveDeviceName}>Save</ha-button>
                    <ha-button @click=${this._cancelEditName}>Cancel</ha-button>
                  </div>
                `
                : html`
                  <div class="inline-edit-row">
                    <span>${this._deviceName || html`<em class="muted">Not set</em>`}</span>
                    <ha-icon-button
                      .label=${'Edit display name'}
                      @click=${() => { this._editingName = true; }}
                    ><ha-icon icon="mdi:pencil"></ha-icon></ha-icon-button>
                  </div>
                `}
            </div>
          </div>

          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:clock-outline"></ha-icon>
              Last Seen
            </span>
            <span class="field-value">${lastSeen}</span>
          </div>

          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:web"></ha-icon>
              User Agent
            </span>
            <span class="field-value mono small wrap">${dim?.userAgent ?? navigator.userAgent}</span>
          </div>
        </div>

      </lcards-form-section>
    `;
  }

  // ── Section 2: Users (admin) ─────────────────────────────────────────────

  _renderUsersSection() {
    return html`
      <lcards-form-section
        header="Users with Scoped Settings"
        icon="mdi:account-group"
        description="Home Assistant users who have stored per-user sound or other overrides."
        ?expanded=${false}
        ?outlined=${true}>

        <div class="section-actions">
          <ha-button @click=${this._loadUsers}>
            <ha-icon slot="start" icon="mdi:refresh"></ha-icon>
            Refresh
          </ha-button>
        </div>

        ${this._loading ? html`
          <div class="loading-row">
            <ha-spinner size="small"></ha-spinner>
            Loading users…
          </div>
        ` : this._users.length === 0 ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:account-off-outline"></ha-icon>
            <p>No per-user overrides stored yet.</p>
          </div>
        ` : html`
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Stored Keys</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._users.map((u) => {
                  const displayName = this._userName(u.id);
                  const isConfirming = this._confirmDeleteUserId === u.id;
                  return html`
                    <tr class="${isConfirming ? 'confirming' : ''}">
                      <td>
                        <div class="user-cell">
                          ${displayName
                            ? html`<span class="user-display-name">${displayName}</span>`
                            : html`<em class="muted">Unknown user</em>`}
                          <span class="mono small muted">${u.id}</span>
                        </div>
                      </td>
                      <td class="key-count">${u.data?.key_count ?? 0}</td>
                      <td class="actions-cell">
                        ${isConfirming
                          ? html`
                            <div class="inline-confirm">
                              <ha-icon icon="mdi:alert"></ha-icon>
                              <span>Clear all overrides for <strong>${displayName ?? u.id}</strong>?</span>
                              <div class="confirm-actions">
                                <ha-button class="danger-btn" variant="danger" @click=${this._executeDeleteUser}>Delete</ha-button>
                                <ha-button @click=${this._cancelDeleteUser}>Cancel</ha-button>
                              </div>
                            </div>
                          `
                          : html`
                            <ha-icon-button
                              class="danger-icon"
                              .label=${'Clear all overrides for this user'}
                              @click=${() => this._startDeleteUser(u.id)}
                            ><ha-icon icon="mdi:delete"></ha-icon></ha-icon-button>
                          `}
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        `}
      </lcards-form-section>
    `;
  }

  // ── Section 3: Devices (admin) ───────────────────────────────────────────

  _renderDevicesSection() {
    return html`
      <lcards-form-section
        header="Registered Devices"
        icon="mdi:devices"
        description="Browsers/devices that have registered a device identity or device-level overrides."
        ?expanded=${false}
        ?outlined=${true}>

        <div class="section-actions">
          <ha-button @click=${this._loadDevices}>
            <ha-icon slot="start" icon="mdi:refresh"></ha-icon>
            Refresh
          </ha-button>
        </div>

        ${this._loading ? html`
          <div class="loading-row">
            <ha-spinner size="small"></ha-spinner>
            Loading devices…
          </div>
        ` : this._devices.length === 0 ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:laptop-off"></ha-icon>
            <p>No device registrations stored yet.</p>
          </div>
        ` : html`
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Device ID</th>
                  <th>Last Seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._devices.map((d) => {
                  const name = d.data?.[DEVICE_KEY_DISPLAY_NAME];
                  const isRenaming = this._renamingDeviceId === d.id;
                  const isConfirmingDelete = this._confirmDeleteDeviceId === d.id;
                  return html`
                    <tr class="${isRenaming || isConfirmingDelete ? 'confirming' : ''}">
                      <td>
                        ${isRenaming
                          ? html`
                            <div class="inline-edit-row">
                              <input
                                class="inline-input"
                                .value=${this._renameValue}
                                @input=${(e) => (this._renameValue = e.target.value)}
                                @keydown=${(e) => {
                                  if (e.key === 'Enter') this._executeRenameDevice();
                                  if (e.key === 'Escape') this._cancelRenameDevice();
                                }}
                                placeholder="Device name…"
                              />
                              <ha-button @click=${this._executeRenameDevice}>Save</ha-button>
                              <ha-button @click=${this._cancelRenameDevice}>Cancel</ha-button>
                            </div>
                          `
                          : html`<span>${name ?? html`<em class="muted">Unnamed</em>`}</span>`}
                      </td>
                      <td class="mono small">${d.id}</td>
                      <td>${this._formatDate(d.data?.[DEVICE_KEY_LAST_SEEN])}</td>
                      <td class="actions-cell">
                        ${isConfirmingDelete
                          ? html`
                            <div class="inline-confirm">
                              <ha-icon icon="mdi:alert"></ha-icon>
                              <span>Remove <strong>${name ?? d.id}</strong>?</span>
                              <div class="confirm-actions">
                                <ha-button class="danger-btn" variant="danger" @click=${this._executeDeleteDevice}>Delete</ha-button>
                                <ha-button @click=${this._cancelDeleteDevice}>Cancel</ha-button>
                              </div>
                            </div>
                          `
                          : html`
                            <ha-icon-button
                              .label=${'Rename device'}
                              @click=${() => this._startRenameDevice(d.id, name)}
                            ><ha-icon icon="mdi:pencil"></ha-icon></ha-icon-button>
                            <ha-icon-button
                              class="danger-icon"
                              .label=${'Remove device record'}
                              @click=${() => this._startDeleteDevice(d.id)}
                            ><ha-icon icon="mdi:delete"></ha-icon></ha-icon-button>
                          `}
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        `}
      </lcards-form-section>
    `;
  }

  // ─────────────────────────────────────────────────────── styles ──────────

  static get styles() {
    return css`
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
        --lcards-section-spacing: 0;
      }

      /* ── Banners ── */
      .banner {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        padding: 10px 14px;
        border-radius: var(--ha-border-radius-md);
        font-size: 0.9em;
        flex-shrink: 0;
        margin-bottom: 8px;
      }
      .banner.error {
        background: color-mix(in srgb, var(--error-color, #f44336) 15%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color, #f44336) 40%, transparent);
        color: var(--primary-text-color);
      }
      .banner ha-button { margin-left: auto; }

      /* ── Section header actions ── */
      .section-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;
      }

      /* ── Field groups ── */
      .field-group {
        display: flex;
        flex-direction: column;
        padding: 8px 0;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }
      .field-group:last-child { border-bottom: none; }

      .field-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 5px 0;
      }

      .field-label {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 150px;
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        flex-shrink: 0;
        padding-top: 2px;
      }
      .field-label ha-icon {
        --mdc-icon-size: 16px;
        color: var(--primary-color);
      }

      .field-value {
        flex: 1;
        font-size: 0.9rem;
        color: var(--primary-text-color);
        word-break: break-all;
      }
      .field-value.wrap { word-break: break-word; }

      /* ── Inline edit ── */
      .inline-edit-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .inline-input {
        flex: 1;
        min-width: 160px;
        background: var(--input-fill-color, rgba(255,255,255,0.05));
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-sm);
        color: var(--primary-text-color);
        padding: 5px 8px;
        font-size: 0.9rem;
        outline: none;
      }
      .inline-input:focus {
        border-color: var(--primary-color);
      }

      /* ── Tables ── */
      .table-wrapper {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }

      .data-table th {
        text-align: left;
        padding: 6px 8px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--secondary-text-color);
        font-weight: 600;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .data-table td {
        padding: 6px 8px;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
        vertical-align: middle;
      }

      .data-table tr:last-child td { border-bottom: none; }

      .data-table tr:hover td {
        background: var(--secondary-background-color, rgba(255,255,255,0.04));
      }

      .data-table tr.confirming td {
        background: color-mix(in srgb, var(--error-color, #f44336) 6%, transparent);
      }

      /* User cell: stacked display name + ID */
      .user-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .user-display-name {
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .key-count {
        text-align: center;
        color: var(--secondary-text-color);
      }

      .actions-cell {
        white-space: nowrap;
        text-align: right;
      }

      /* ── Inline confirm strip ── */
      .inline-confirm {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: color-mix(in srgb, var(--error-color, #f44336) 10%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color, #f44336) 30%, transparent);
        border-radius: var(--ha-border-radius-md);
        font-size: 0.85em;
        flex-wrap: wrap;
      }
      .inline-confirm ha-icon {
        color: var(--error-color, #f44336);
        flex-shrink: 0;
      }
      .inline-confirm span { flex: 1; }
      .confirm-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
      .danger-icon {
        color: var(--error-color, #f44336);
      }

      /* ── Loading / empty ── */
      .loading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px;
        color: var(--secondary-text-color);
        justify-content: center;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px;
        text-align: center;
        color: var(--secondary-text-color);
        gap: 8px;
      }
      .empty-state ha-icon { --mdc-icon-size: 40px; opacity: 0.4; }
      .empty-state p { margin: 0; font-size: 0.9em; }

      /* ── Utilities ── */
      .mono { font-family: monospace; }
      .small { font-size: 0.75rem; }
      .muted { color: var(--secondary-text-color); font-style: italic; }
    `;
  }
}

if (!customElements.get('lcards-users-devices-tab')) customElements.define('lcards-users-devices-tab', LCARdsUsersDevicesTab);
