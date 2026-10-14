/**
 * @fileoverview LCARdS Storage Explorer Tab
 *
 * Full CRUD interface for the LCARdS backend persistent storage.
 * Reads/writes via IntegrationService convenience methods which wrap
 * the lcards/storage/* WebSocket command namespace.
 *
 * Features:
 *  - Live key list loaded from backend on open
 *  - Expandable per-key JSON viewer
 *  - Inline JSON editor (edit → save / cancel)
 *  - Per-key delete with confirmation
 *  - Reset All with confirmation
 *  - Graceful degraded state when integration is unavailable
 *
 * @element lcards-storage-explorer-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../../editor/components/shared/lcards-form-section.js';
import { surfaceStyles } from '../../editor/base/surface-styles.js';
import { showConfirmDeleteDialog } from '../../views/layout-edit-dialogs.js';

/** Rows rendered per group before "Show all". */
const ROW_LIMIT = 100;

/** Key groups: LCARdS-wide settings, then the per-device and per-user entries (prefixes from ScopedSettingsService). */
const STORAGE_GROUPS = [
  { id: 'devices', prefix: '_device_', label: 'Devices', icon: 'mdi:devices', description: 'Per-device identity and overrides, one key per browser.' },
  { id: 'users', prefix: '_user_', label: 'Users', icon: 'mdi:account-multiple', description: 'Per-user overrides.' },
];

/**
 * Split sorted keys into display groups (settings first; empty groups dropped).
 * @param {string[]} keys
 */
export function groupStorageKeys(keys) {
  const settings = { id: 'settings', label: 'Settings', icon: 'mdi:database-cog', description: 'LCARdS-wide data. Use with care: deleting keys may reset service configuration.', keys: [] };
  const others = STORAGE_GROUPS.map(g => ({ ...g, keys: [] }));
  for (const key of keys) {
    const group = others.find(g => key.startsWith(g.prefix));
    (group ?? settings).keys.push(key);
  }
  return [settings, ...others].filter(g => g.keys.length > 0);
}

export class LCARdSStorageExplorerTab extends LitElement {
  static properties = {
    hass:           { type: Object },
    _data:          { state: true },   // { key: value, ... } — full storage snapshot
    _loading:       { state: true },
    _error:         { state: true },   // string | null
    _expandedKeys:  { state: true },   // Set<string>
    _editingKey:    { state: true },   // string | null — key currently in edit mode
    _editDraft:     { state: true },   // string: raw JSON being edited
    _editError:     { state: true },   // string | null — JSON parse error
    _savingKey:     { state: true },   // string | null
    _deletingKey:   { state: true },   // string | null
    _resetting:     { state: true },
    _available:     { state: true },
    _loaded:        { state: true },   // a read has succeeded
    _filter:        { state: true },   // key search text
    _openGroups:    { state: true },   // Set<string>: groups whose rows are rendered
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._data          = {};
    this._loading       = false;
    this._error         = null;
    this._expandedKeys  = new Set();
    this._editingKey    = null;
    this._editDraft     = '';
    this._editError     = null;
    this._savingKey     = null;
    this._deletingKey   = null;
    this._resetting     = false;
    this._available     = false;
    this._loaded        = false;
    this._filter        = '';
    this._openGroups    = new Set(['settings']);
  }

  connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  willUpdate(changedProps) {
    super.willUpdate(changedProps);
    // A load that found no connection yet (or a failed one) runs again once hass is here.
    if (changedProps.has('hass') && this.hass?.connection && !this._loaded && !this._loading) this._load();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Read the whole storage dict. Reads through this tab's own hass connection
   * (not IntegrationService.readStorage, which returns undefined for "no
   * connection yet" and for errors alike, so a failed first read looked like
   * an empty store).
   */
  async _load() {
    const integration = window.lcards?.core?.integrationService;
    this._loading = true;
    this._error = null;
    try {
      // On a fresh page load the integration probe is still running.
      if (integration && !integration.isReady) await integration.onReady();
      this._available = !!integration?.available;
      const connection = this.hass?.connection;
      if (!this._available || !connection) return;   // willUpdate retries when hass arrives

      const result = await connection.sendMessagePromise({ type: 'lcards/storage/get' });
      const value = result?.value;
      this._data = (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
      this._loaded = true;
      lcardsLog.debug('[StorageExplorer] Loaded', Object.keys(this._data).length, 'keys');
    } catch (err) {
      this._error = `Failed to load storage: ${err?.message ?? err}`;
      lcardsLog.error('[StorageExplorer] Load failed:', err);
    } finally {
      this._loading = false;
    }
  }

  // ============================================================================
  // EDIT
  // ============================================================================

  _beginEdit(key) {
    this._editingKey = key;
    this._editDraft  = JSON.stringify(this._data[key], null, 2);
    this._editError  = null;
    this.requestUpdate();
    // Focus textarea after render
    this.updateComplete.then(() => {
      /** @type {HTMLElement|null} */ (this.shadowRoot?.querySelector('.edit-area'))?.focus();
    });
  }

  _cancelEdit() {
    this._editingKey = null;
    this._editDraft  = '';
    this._editError  = null;
    this.requestUpdate();
  }

  async _saveEdit(key) {
    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(this._editDraft);
    } catch (e) {
      this._editError = `Invalid JSON: ${e.message}`;
      this.requestUpdate();
      return;
    }

    const integration = window.lcards?.core?.integrationService;
    if (!integration?.available) return;

    this._savingKey = key;
    this._editError = null;
    this.requestUpdate();

    try {
      await integration.writeStorage({ [key]: parsed });
      this._data = { ...this._data, [key]: parsed };
      this._editingKey = null;
      this._editDraft  = '';
      lcardsLog.info(`[StorageExplorer] Saved key "${key}"`);
    } catch (err) {
      this._editError = `Save failed: ${err.message ?? err}`;
      lcardsLog.error('[StorageExplorer] Save failed:', err);
    } finally {
      this._savingKey = null;
      this.requestUpdate();
    }
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async _askDelete(key) {
    const confirmed = await showConfirmDeleteDialog({
      title: 'Delete storage key?',
      message: `Delete "${key}" from LCARdS storage? Services that use it go back to their defaults.`,
    });
    if (confirmed) await this._deleteKey(key);
  }

  async _deleteKey(key) {
    const integration = window.lcards?.core?.integrationService;
    if (!integration?.available) return;

    this._deletingKey = key;

    try {
      await integration.deleteStorage(key);
      const updated = { ...this._data };
      delete updated[key];
      this._data = updated;
      // Clean up any expanded / edit state for this key
      this._expandedKeys.delete(key);
      if (this._editingKey === key) this._cancelEdit();
      lcardsLog.info(`[StorageExplorer] Deleted key "${key}"`);
    } catch (err) {
      this._error = `Delete failed: ${err.message ?? err}`;
      lcardsLog.error('[StorageExplorer] Delete failed:', err);
    } finally {
      this._deletingKey = null;
      this.requestUpdate();
    }
  }

  // ============================================================================
  // RESET ALL
  // ============================================================================

  async _askReset() {
    const n = Object.keys(this._data).length;
    const confirmed = await showConfirmDeleteDialog({
      title: 'Reset all storage?',
      message: `This permanently wipes all ${n} stored key${n !== 1 ? 's' : ''}.`,
      confirmText: 'Reset all',
    });
    if (confirmed) await this._resetAll();
  }

  /**
   * Delete every key in one group (the keys shown, when a search is active) with
   * one backend save, leaving the other groups alone.
   */
  async _askResetGroup(group, filtering) {
    const n = group.keys.length;
    const what = filtering ? `the ${n} ${group.label} key${n !== 1 ? 's' : ''} matching "${this._filter}"` : `all ${n} ${group.label} key${n !== 1 ? 's' : ''}`;
    const confirmed = await showConfirmDeleteDialog({
      title: `Reset ${group.label}?`,
      message: `This permanently deletes ${what}. Other sections are kept.`
        + (group.id === 'devices' ? ' Browsers register again on their next load, without their device overrides.' : ''),
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    this._resetting = true;
    try {
      const result = await this.hass.connection.sendMessagePromise({ type: 'lcards/storage/delete_many', keys: group.keys });
      const data = { ...this._data };
      for (const key of group.keys) {
        delete data[key];
        this._expandedKeys.delete(key);
      }
      this._data = data;
      if (group.keys.includes(this._editingKey)) this._cancelEdit();
      lcardsLog.info(`[StorageExplorer] Deleted ${result?.removed ?? n} key(s) from ${group.label}`);
    } catch (err) {
      this._error = `Reset failed: ${err?.message ?? err}`;
      lcardsLog.error('[StorageExplorer] Group reset failed:', err);
    } finally {
      this._resetting = false;
    }
  }

  async _resetAll() {
    const integration = window.lcards?.core?.integrationService;
    if (!integration?.available) return;

    this._resetting = true;

    try {
      await integration.resetStorage();
      this._data         = {};
      this._expandedKeys = new Set();
      this._cancelEdit();

      // Invalidate in-memory caches so stale data cannot be re-written
      // to the backend by services that were loaded before the reset.
      const sm = window.lcards?.core?.soundManager;
      if (sm) {
        sm._overridesCache  = {};
        sm._overridesLoaded = true; // keep loaded=true to prevent a re-read race
        lcardsLog.debug('[StorageExplorer] SoundManager cache cleared after reset');
      }

      lcardsLog.info('[StorageExplorer] Reset all storage');
    } catch (err) {
      this._error = `Reset failed: ${err.message ?? err}`;
      lcardsLog.error('[StorageExplorer] Reset failed:', err);
    } finally {
      this._resetting = false;
      this.requestUpdate();
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  _formatPreview(value) {
    const str = JSON.stringify(value);
    return str.length > 80 ? str.slice(0, 80) + '…' : str;
  }

  _typeLabel(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return `object{${Object.keys(value).length}}`;
    return typeof value;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  render() {
    if (!this._available) {
      return html`
        <div class="studio-layout">
          ${this._loading ? html`
            <div class="empty-state">
              <ha-spinner size="small"></ha-spinner>
              <p>Loading storage</p>
            </div>
          ` : html`
            <div class="empty-state">
              <ha-icon icon="mdi:connection"></ha-icon>
              <p class="empty-title">Integration not available</p>
              <p class="hint">The LCARdS integration isn't installed or set up yet. Backend storage needs it.</p>
            </div>
          `}
        </div>
      `;
    }

    const keys = Object.keys(this._data).sort();
    const filter = this._filter.trim().toLowerCase();
    const shown = filter ? keys.filter(k => k.toLowerCase().includes(filter)) : keys;
    const groups = groupStorageKeys(shown);

    return html`
      <div class="studio-layout">
        <div class="toolbar">
          <ha-input-search
            appearance="outlined"
            placeholder="Search keys"
            .value=${this._filter}
            @input=${(e) => { this._filter = e.target.value ?? ''; }}
            @wa-clear=${() => { this._filter = ''; }}>
          </ha-input-search>
          <ha-button appearance="plain" @click=${() => { this._loaded = false; this._load(); }} ?disabled=${this._loading}>
            <ha-icon slot="start" icon="mdi:refresh"></ha-icon>
            Refresh
          </ha-button>
          <ha-button
            variant="danger"
            @click=${this._askReset}
            ?disabled=${this._resetting || keys.length === 0}
          >
            <ha-icon slot="start" icon="mdi:delete-sweep"></ha-icon>
            Reset All
          </ha-button>
        </div>

        <div class="scrollable-body">
          ${this._error ? html`
            <div class="banner error">
              <ha-icon icon="mdi:alert-circle"></ha-icon>
              <span class="banner-text">${this._error}</span>
              <ha-button appearance="plain" @click=${() => { this._loaded = false; this._load(); }}>Retry</ha-button>
            </div>
          ` : ''}

          ${this._loading && !this._loaded ? html`
            <div class="empty-state">
              <ha-spinner size="small"></ha-spinner>
              <p>Loading storage</p>
            </div>
          ` : keys.length === 0 && this._loaded ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:database-off-outline"></ha-icon>
              <p>No keys stored yet.</p>
              <p class="hint">Values written by LCARdS services (sound overrides, for example) appear here.</p>
            </div>
          ` : filter && shown.length === 0 ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:filter-off"></ha-icon>
              <p>No keys match "${this._filter}"</p>
            </div>
          ` : groups.map(g => this._renderGroup(g, !!filter))}
        </div>
      </div>
    `;
  }

  /** One section per key group; its rows render only while it is open (there can be thousands of device keys). */
  _renderGroup(group, filtering) {
    const open = filtering || this._openGroups.has(group.id);
    const limit = this._showAll?.has(group.id) ? Infinity : ROW_LIMIT;
    return html`
      <lcards-form-section
        header=${group.label}
        icon=${group.icon}
        secondary=${`${group.keys.length} key${group.keys.length !== 1 ? 's' : ''}`}
        description=${group.description}
        ?expanded=${open}
        ?outlined=${true}
        @expanded-changed=${(e) => {
          const next = new Set(this._openGroups);
          if (e.detail.expanded) next.add(group.id); else next.delete(group.id);
          this._openGroups = next;
        }}>
        <ha-button
          slot="header-icons"
          variant="danger"
          appearance="plain"
          size="s"
          ?disabled=${this._resetting}
          @click=${(e) => { e.stopPropagation(); this._askResetGroup(group, filtering); }}>
          <ha-icon slot="start" icon="mdi:delete-sweep"></ha-icon>
          ${filtering ? 'Delete matches' : 'Reset section'}
        </ha-button>
        ${open ? html`
          ${group.keys.slice(0, limit).map(key => this._renderKeyRow(key))}
          ${group.keys.length > limit ? html`
            <div class="more-row">
              <span class="hint">Showing ${limit} of ${group.keys.length}. Search to narrow the list.</span>
              <ha-button appearance="plain" @click=${() => { this._showAll = new Set([...(this._showAll ?? []), group.id]); this.requestUpdate(); }}>
                Show all
              </ha-button>
            </div>
          ` : ''}
        ` : ''}
      </lcards-form-section>
    `;
  }

  _renderKeyRow(key) {
    const value      = this._data[key];
    const expanded   = this._expandedKeys.has(key);
    const isEditing  = this._editingKey === key;
    const isDeleting = this._deletingKey === key;
    const isSaving   = this._savingKey === key;

    return html`
      <ha-expansion-panel
        class="key-panel ${isDeleting ? 'busy' : ''}"
        .header=${key}
        outlined
        ?expanded=${expanded || isEditing}
        @expanded-changed=${(e) => {
          e.stopPropagation();
          const s = new Set(this._expandedKeys);
          e.detail.expanded ? s.add(key) : s.delete(key);
          this._expandedKeys = s;
        }}
      >
        <!-- ── TYPE CHIP + PREVIEW in header ── -->
        <div slot="description" class="panel-description">
          <ha-assist-chip
            .filled=${true}
            .label=${this._typeLabel(value)}
            class="type-chip"
          ></ha-assist-chip>
          ${!isEditing && !expanded ? html`
            <span class="preview">${this._formatPreview(value)}</span>
          ` : ''}
        </div>

        <!-- ── ACTION BUTTONS in icons slot ── -->
        <div slot="icons" class="panel-icons" @click=${(e) => e.stopPropagation()}>
          ${!isEditing ? html`
            <ha-icon-button
              .label=${'Edit'}
              @click=${(e) => { e.stopPropagation(); this._beginEdit(key); }}
              ?disabled=${isDeleting || isSaving}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              .label=${'Delete'}
              class="danger-icon"
              @click=${(e) => { e.stopPropagation(); this._askDelete(key); }}
              ?disabled=${isDeleting}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          ` : html`
            <ha-button
              @click=${(e) => { e.stopPropagation(); this._saveEdit(key); }}
              ?disabled=${isSaving}
            >
              ${isSaving ? html`<ha-spinner size="small"></ha-spinner>` : 'Save'}
            </ha-button>
            <ha-button @click=${(e) => { e.stopPropagation(); this._cancelEdit(); }}>Cancel</ha-button>
          `}
        </div>

        <!-- ── PANEL CONTENT ── -->
        <div class="panel-content">

          <!-- EDIT AREA -->
          ${isEditing ? html`
            <!-- JSON is valid YAML: the YAML mode highlights it; the value is parsed as JSON. -->
            <ha-code-editor
              class="edit-area"
              mode="yaml"
              linewrap
              .value=${this._editDraft}
              @value-changed=${(e) => { e.stopPropagation(); this._editDraft = e.detail.value; this._editError = null; }}
            ></ha-code-editor>
            ${this._editError ? html`
              <div class="edit-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                ${this._editError}
              </div>
            ` : ''}
          ` : ''}

          <!-- JSON VIEW (only while open: each one is a code editor) -->
          ${!isEditing && expanded ? html`
            <ha-code-editor
              mode="yaml"
              read-only
              linewrap
              .value=${JSON.stringify(value, null, 2)}
            ></ha-code-editor>
          ` : ''}

        </div>
      </ha-expansion-panel>
    `;
  }

  // ============================================================================
  // STYLES
  // ============================================================================

  static styles = [surfaceStyles, css`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .banner-text {
      flex: 1;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
      margin-bottom: var(--ha-space-3);
    }

    .toolbar ha-input-search {
      flex: 1;
    }

    .more-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-2);
      padding-top: var(--ha-space-2);
    }

    /* ── Loading / empty / unavailable ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ha-space-2);
      padding: var(--ha-space-12) var(--ha-space-6);
      text-align: center;
      color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
      --mdc-icon-size: 48px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      max-width: 480px;
    }

    .empty-title {
      color: var(--primary-text-color);
      font-weight: var(--ha-font-weight-medium, 500);
    }

    /* ── Key panels (ha-expansion-panel per key) ── */
    .key-panel {
      display: block;
      margin-bottom: 6px;
    }

    .key-panel.busy {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Description row below the panel header (type chip + preview) */
    .panel-description {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
      padding-top: 2px;
    }

    .type-chip {
      --ha-assist-chip-filled-container-color:
        color-mix(in srgb, var(--primary-color) 18%, transparent);
      --md-assist-chip-label-text-color: var(--primary-color);
      --md-sys-color-on-surface: var(--primary-color);
      flex-shrink: 0;
    }

    .preview {
      font-family: var(--ha-font-family-code);
      font-size: 0.8em;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .panel-icons {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .danger-icon {
      color: var(--error-color);
    }

    .panel-content {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2);
      padding: var(--ha-space-2) 0 var(--ha-space-1);
    }

    ha-code-editor {
      display: block;
      border: var(--ha-border-width-sm) solid var(--divider-color);
      border-radius: var(--ha-border-radius-md);
      overflow: hidden;
    }

    .edit-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--error-color);
      font-size: 0.85em;
    }
  `];
}

if (!customElements.get('lcards-storage-explorer-tab')) customElements.define('lcards-storage-explorer-tab', LCARdSStorageExplorerTab);
