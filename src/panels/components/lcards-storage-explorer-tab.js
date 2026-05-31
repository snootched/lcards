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

export class LCARdSStorageExplorerTab extends LitElement {
  static properties = {
    hass:           { type: Object },
    _data:          { state: true },   // { key: value, ... } — full storage snapshot
    _loading:       { state: true },
    _error:         { state: true },   // string | null
    _expandedKeys:  { state: true },   // Set<string>
    _editingKey:    { state: true },   // string | null — key currently in edit mode
    _editDraft:     { state: true },   // string — raw JSON textarea content
    _editError:     { state: true },   // string | null — JSON parse error
    _confirmDelete: { state: true },   // string | null — key pending confirmation
    _confirmReset:  { state: true },   // boolean
    _savingKey:     { state: true },   // string | null
    _deletingKey:   { state: true },   // string | null
    _resetting:     { state: true },
    _available:     { state: true },
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
    this._confirmDelete = null;
    this._confirmReset  = false;
    this._savingKey     = null;
    this._deletingKey   = null;
    this._resetting     = false;
    this._available     = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  willUpdate(changedProps) {
    super.willUpdate(changedProps);
    if (changedProps.has('hass') && this.hass) {
      // Refresh availability on every hass update (integration may have just been set up)
      const was = this._available;
      this._available = !!window.lcards?.core?.integrationService?.available;
      if (!was && this._available) this._load();
    }
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async _load() {
    const integration = window.lcards?.core?.integrationService;
    this._available = !!integration?.available;

    if (!this._available) {
      this._data = {};
      return;
    }

    this._loading = true;
    this._error = null;
    this.requestUpdate();

    try {
      // readStorage() with no key returns the full data dict
      const result = await integration.readStorage();
      this._data = (result && typeof result === 'object' && !Array.isArray(result))
        ? result
        : {};
      lcardsLog.debug('[StorageExplorer] Loaded', Object.keys(this._data).length, 'keys');
    } catch (err) {
      this._error = `Failed to load storage: ${err.message ?? err}`;
      lcardsLog.error('[StorageExplorer] Load failed:', err);
    } finally {
      this._loading = false;
      this.requestUpdate();
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
      /** @type {HTMLTextAreaElement|null} */ (this.shadowRoot?.querySelector('textarea.edit-area'))?.focus();
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

  _askDelete(key) {
    this._confirmDelete = key;
    // Ensure the panel is expanded so the inline confirmation is visible
    const s = new Set(this._expandedKeys);
    s.add(key);
    this._expandedKeys = s;
    this.requestUpdate();
  }

  _cancelDelete() {
    this._confirmDelete = null;
    this.requestUpdate();
  }

  async _confirmDeleteKey(key) {
    const integration = window.lcards?.core?.integrationService;
    if (!integration?.available) return;

    this._deletingKey   = key;
    this._confirmDelete = null;
    this.requestUpdate();

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

  _askReset() {
    this._confirmReset = true;
    this.requestUpdate();
  }

  _cancelReset() {
    this._confirmReset = false;
    this.requestUpdate();
  }

  async _confirmResetAll() {
    const integration = window.lcards?.core?.integrationService;
    if (!integration?.available) return;

    this._resetting    = true;
    this._confirmReset = false;
    this.requestUpdate();

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
          <div class="unavailable">
            <ha-icon icon="mdi:connection"></ha-icon>
            <h3>Integration not available</h3>
            <p>The LCARdS HA integration is not installed or has not yet been set up. Backend persistent storage requires the integration.</p>
          </div>
        </div>
      `;
    }

    const keys = Object.keys(this._data).sort();

    return html`
      <div class="studio-layout">

        <!-- ── HEADER AREA (fixed) ── -->
        <div class="header-area">
          <ha-icon icon="mdi:database-cog" class="header-icon"></ha-icon>
          <div class="header-text">
            <span class="header-title">Backend Storage</span>
            <span class="header-subtitle">${keys.length} key${keys.length !== 1 ? 's' : ''} stored</span>
          </div>
          <div class="header-actions">
            <ha-icon-button
              .label=${'Refresh'}
              @click=${this._load}
              ?disabled=${this._loading}
            >
              <ha-icon icon="mdi:refresh"></ha-icon>
            </ha-icon-button>
            <ha-button
              class="danger-btn"
              variant="danger"
              @click=${this._askReset}
              ?disabled=${this._resetting || keys.length === 0}
            >
              <ha-icon slot="start" icon="mdi:delete-sweep"></ha-icon>
              Reset All
            </ha-button>
          </div>
        </div>

        <!-- ── ERROR BANNER ── -->
        ${this._error ? html`
          <div class="banner error">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span>${this._error}</span>
            <ha-button @click=${() => { this._error = null; this.requestUpdate(); }}>Dismiss</ha-button>
          </div>
        ` : ''}

        <!-- ── RESET CONFIRMATION ── -->
        ${this._confirmReset ? html`
          <div class="banner warning">
            <ha-icon icon="mdi:alert"></ha-icon>
            <span>This will <strong>wipe all ${keys.length} stored key${keys.length !== 1 ? 's' : ''}</strong> permanently. Are you sure?</span>
            <div class="confirm-actions">
              <ha-button class="danger-btn" variant="danger" @click=${this._confirmResetAll}>Yes, reset all</ha-button>
              <ha-button @click=${this._cancelReset}>Cancel</ha-button>
            </div>
          </div>
        ` : ''}

        <!-- ── SCROLLABLE BODY ── -->
        <div class="scrollable-body">

          <!-- ── LOADING ── -->
          ${this._loading ? html`
            <div class="loading-row">
              <ha-circular-progress indeterminate></ha-circular-progress>
              <span>Loading storage…</span>
            </div>
          ` : ''}

          <!-- ── EMPTY STATE ── -->
          ${!this._loading && keys.length === 0 ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:database-off-outline"></ha-icon>
              <p>No keys stored yet.</p>
              <p class="hint">Values written by LCARdS services (e.g. sound overrides) will appear here.</p>
            </div>
          ` : ''}

          <!-- ── KEY LIST ── -->
          ${keys.length > 0 ? html`
            <lcards-form-section
              header="Storage Keys"
              icon="mdi:database"
              description="Live view of all persisted backend data. Use with care — deleting keys may reset service configuration."
              ?expanded=${true}
              ?outlined=${true}
              ?noCollapse=${true}
            >
              ${keys.map(key => this._renderKeyRow(key))}
            </lcards-form-section>
          ` : ''}

        </div>
      </div>
    `;
  }

  _renderKeyRow(key) {
    const value      = this._data[key];
    const expanded   = this._expandedKeys.has(key);
    const isEditing  = this._editingKey === key;
    const isDeleting = this._deletingKey === key;
    const isSaving   = this._savingKey === key;
    const askingDel  = this._confirmDelete === key;

    return html`
      <ha-expansion-panel
        class="key-panel ${isDeleting ? 'busy' : ''}"
        .header=${key}
        outlined
        ?expanded=${expanded || isEditing}
        @expanded-changed=${(e) => {
          e.stopPropagation();
          const s = new Set(this._expandedKeys);
          e.detail.value ? s.add(key) : s.delete(key);
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
              ${isSaving ? html`<ha-circular-progress indeterminate size="s"></ha-circular-progress>` : 'Save'}
            </ha-button>
            <ha-button @click=${(e) => { e.stopPropagation(); this._cancelEdit(); }}>Cancel</ha-button>
          `}
        </div>

        <!-- ── PANEL CONTENT ── -->
        <div class="panel-content">

          <!-- DELETE CONFIRMATION -->
          ${askingDel ? html`
            <div class="inline-confirm">
              <ha-icon icon="mdi:alert"></ha-icon>
              <span>Delete key <strong>${key}</strong>? This cannot be undone.</span>
              <ha-button class="danger-btn" variant="danger" @click=${() => this._confirmDeleteKey(key)}>Delete</ha-button>
              <ha-button @click=${this._cancelDelete}>Cancel</ha-button>
            </div>
          ` : ''}

          <!-- EDIT AREA -->
          ${isEditing ? html`
            <textarea
              class="edit-area"
              .value=${this._editDraft}
              @input=${(e) => { this._editDraft = e.target.value; this._editError = null; }}
              spellcheck="false"
              autocomplete="off"
              rows="10"
            ></textarea>
            ${this._editError ? html`
              <div class="edit-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                ${this._editError}
              </div>
            ` : ''}
          ` : ''}

          <!-- JSON VIEW -->
          ${!isEditing ? html`
            <pre class="json-view">${JSON.stringify(value, null, 2)}</pre>
          ` : ''}

        </div>
      </ha-expansion-panel>
    `;
  }

  // ============================================================================
  // STYLES
  // ============================================================================

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

    /* ── Header area (fixed, non-scrolling) ── */
    .header-area {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: var(--ha-border-width-md) solid var(--divider-color);
      margin-bottom: 12px;
    }

    .header-icon {
      --mdc-icon-size: 28px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .header-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .header-title {
      font-size: 1.05em;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .header-subtitle {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    /* ── Banners (fixed, above scroll) ── */
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

    .banner.warning {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
      color: var(--primary-text-color);
    }

    .banner ha-button {
      margin-left: auto;
    }

    .confirm-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    /* ── Scrollable body ── */
    .scrollable-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-bottom: 8px;
      --lcards-section-spacing: 0;
    }

    /* ── Loading / empty ── */
    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 32px;
      color: var(--secondary-text-color);
      justify-content: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--secondary-text-color);
      gap: 8px;
    }

    .empty-state ha-icon {
      --mdc-icon-size: 56px;
      opacity: 0.4;
    }

    .empty-state p {
      margin: 0;
    }

    .empty-state .hint {
      font-size: 0.85em;
      opacity: 0.7;
    }

    /* ── Unavailable state ── */
    .unavailable {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--secondary-text-color);
      gap: 12px;
    }

    .unavailable ha-icon {
      --mdc-icon-size: 56px;
      opacity: 0.4;
    }

    .unavailable h3 {
      margin: 0;
      color: var(--primary-text-color);
    }

    .unavailable p {
      margin: 0;
      max-width: 480px;
      font-size: 0.9em;
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

    /* Description row below panel header (type chip + preview) */
    .panel-description {
      display: flex;
      align-items: center;
      gap: 8px;
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
      font-family: 'Courier New', monospace;
      font-size: 0.78em;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    /* Icon-slot action buttons */
    .panel-icons {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .danger-icon {
      color: var(--error-color, #f44336);
    }

    /* ── Panel content (below the expansion header) ── */
    .panel-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0 4px;
    }

    /* ── Inline delete confirm ── */
    .inline-confirm {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: color-mix(in srgb, var(--error-color, #f44336) 10%, transparent);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color, #f44336) 30%, transparent);
      border-radius: var(--ha-border-radius-md);
      font-size: 0.9em;
      flex-wrap: wrap;
    }

    .inline-confirm ha-icon {
      color: var(--error-color, #f44336);
      flex-shrink: 0;
    }

    .inline-confirm span {
      flex: 1;
    }

    /* ── Edit textarea ── */
    textarea.edit-area {
      width: 100%;
      box-sizing: border-box;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      padding: 10px;
      background: var(--code-editor-background-color, #1e1e1e);
      color: var(--code-editor-text-color, #d4d4d4);
      border: var(--ha-border-width-sm) solid var(--divider-color);
      border-radius: 6px;
      resize: vertical;
      outline: none;
    }

    textarea.edit-area:focus {
      border-color: var(--primary-color);
    }

    .edit-error {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: color-mix(in srgb, var(--error-color, #f44336) 12%, transparent);
      border-radius: 6px;
      color: var(--error-color, #f44336);
      font-size: 0.85em;
    }

    /* ── JSON read-only view ── */
    .json-view {
      margin: 0;
      padding: 12px 14px;
      background: var(--code-editor-background-color, #1a1a1a);
      color: var(--code-editor-text-color, #d4d4d4);
      font-family: 'Courier New', monospace;
      font-size: 0.82em;
      line-height: 1.5;
      overflow-x: auto;
      border-radius: 6px;
      border: var(--ha-border-width-sm) solid var(--divider-color);
    }

  `;
}

if (!customElements.get('lcards-storage-explorer-tab')) customElements.define('lcards-storage-explorer-tab', LCARdSStorageExplorerTab);
