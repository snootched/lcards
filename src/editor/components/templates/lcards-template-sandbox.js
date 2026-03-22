/**
 * @fileoverview LCARdS Template Sandbox
 *
 * Interactive modal for testing templates in isolation with:
 * - Live DataSource integration with real-time subscriptions
 * - Mock entity configuration with quick state pickers
 * - Real-time evaluation feedback with execution time
 * - Dependency visualization with availability status
 * - Example templates library with 14 pre-configured scenarios
 *
 * ## Features
 *
 * **Three-Panel Layout:**
 * 1. Input Panel: Template editor with examples dropdown and type detection
 * 2. Context Panel: Mock entity config, live DataSource selector, theme info
 * 3. Output Panel: Evaluated result, execution time, dependency tree, actions
 *
 * **Live DataSource Integration:**
 * - Waterfall resolution: live → mock → warning
 * - Automatic subscription to referenced DataSources
 * - Real-time re-evaluation on DataSource updates
 * - Cleanup subscriptions on close
 *
 * **Template Evaluation:**
 * - Uses `UnifiedTemplateEvaluator` for all types (JS, Token, DataSource, Jinja2)
 * - Extracts dependencies using pattern matching
 * - Measures execution time with performance.now()
 * - Comprehensive error handling with helpful messages
 *
 * @element lcards-template-sandbox
 * @fires sandbox-closed - When sandbox is closed by user
 * @fires insert-template - When user requests to insert template (future enhancement)
 *
 * @property {Object} hass - Home Assistant instance for entity state access
 * @property {Object} config - Card configuration for context
 * @property {Boolean} open - Whether sandbox modal is open
 * @property {Object} initialData - Initial data for pre-populating sandbox (template, mockEntity, mockState)
 *
 * @example
 * // Open sandbox from Template Evaluation Tab
 * <lcards-template-sandbox
 *   .hass=${this.hass}
 *   .config=${this.config}
 *   .open=${this._sandboxOpen}
 *   .initialData=${{ template: '{entity.state}', mockEntity: 'light.kitchen' }}
 *   @sandbox-closed=${this._handleSandboxClosed}>
 * </lcards-template-sandbox>
 */

import { LitElement, html, css } from 'lit';
import { UnifiedTemplateEvaluator } from '../../../core/templates/UnifiedTemplateEvaluator.js';
import { TemplateParser } from '../../../core/templates/TemplateParser.js';
import { TemplateDetector } from '../../../core/templates/TemplateDetector.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { haFormatState } from '../../../utils/ha-entity-display.js';
import { EXAMPLE_TEMPLATES, getExampleIds } from './template-examples.js';
import '../shared/lcards-dialog.js';
import '../shared/lcards-form-section.js';
import '../shared/lcards-collapsible-section.js';

export class LCARdSTemplateSandbox extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      open: { type: Boolean },
      initialData: { type: Object },
      _templateInput: { type: String, state: true },
      _mockEntityId: { type: String, state: true },
      _mockState: { type: Object, state: true },
      _mockDataSources: { type: Object, state: true },
      _evaluationResult: { type: Object, state: true },
      _isEvaluating: { type: Boolean, state: true },
      _liveDataSources: { type: Array, state: true },
      _selectedLiveDataSource: { type: String, state: true },
      _useMockEntity: { type: Boolean, state: true },
      _activeMainTab: { type: String, state: true } // Main tabs: input, context, output, help
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.hass = undefined;
    this.open = false;
    this.initialData = null;
    this._templateInput = '';
    this._mockEntityId = 'light.example';
    this._mockState = { state: 'on', attributes: {} };
    this._mockDataSources = {};
    this._evaluationResult = null;
    this._isEvaluating = false;
    this._liveDataSources = [];
    this._selectedLiveDataSource = '';
    this._useMockEntity = false;  // Toggle for mock vs live entity
    this._activeMainTab = 'output'; // Right pane tabs: output, context, examples, help

    // DataSource subscriptions tracking
    this._dataSourceSubscriptions = new Map();

    // Debounce timer for auto-evaluation
    this._evaluationDebounce = null;
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }

      /* Dialog sizing (matching DataSource Browser) */
      ha-dialog {
        --ha-dialog-width-md: 90vw;
        --ha-dialog-min-height: 600px;
      }

      /* Dialog structure */
      .dialog-content {
        display: flex;
        flex-direction: column;
        height: 75vh;
        max-height: 75vh;
        overflow: hidden;
      }

      /* Split pane layout (matching DataSource Browser) */
      .split-pane-container {
        display: grid;
        grid-template-columns: 40% 60%;
        grid-template-rows: minmax(0, 1fr);
        gap: 0;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      /* Left pane: Template editor */
      .editor-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 2px solid var(--divider-color);
        background: var(--card-background-color);
      }

      .editor-pane-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
        background: var(--secondary-background-color);
        flex-shrink: 0;
      }

      .editor-pane-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .editor-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      /* Right pane: Tabbed content */
      .content-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--card-background-color);
      }

      /* Tab panel content wrapper - scrollable */
      .tab-panel-content {
        overflow-y: auto;
        max-height: calc(75vh - 120px);
        padding: 16px;
      }

      /* Loading and empty states */
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        gap: 12px;
        color: var(--secondary-text-color);
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--secondary-text-color);
      }

      .empty-state ha-icon {
        --mdc-icon-size: 48px;
        color: var(--divider-color);
        margin-bottom: 12px;
      }

      .empty-state p {
        margin: 8px 0;
      }

      /* Template Builder buttons */
      .builder-button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        width: 100%;
      }

      .builder-button:hover {
        border-color: var(--primary-color);
        background: var(--secondary-background-color);
        transform: translateX(2px);
      }

      .builder-button ha-icon {
        --mdc-icon-size: 18px;
        color: var(--primary-color);
        flex-shrink: 0;
      }

      .builder-button-content {
        flex: 1;
        min-width: 0;
      }

      .builder-button-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 4px;
      }

      .builder-button-template {
        font-size: 11px;
        font-family: 'Courier New', monospace;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .template-type-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        background: var(--primary-color);
        color: white;
        letter-spacing: 0.5px;
      }

      .status-badge {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 600;
      }

      .status-badge.live {
        background: rgba(76, 175, 80, 0.2);
        color: #4caf50;
        border: 1px solid #4caf50;
      }

      .status-badge.mock {
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
        border: 1px solid #ff9800;
      }

      /* Template Input */
      .template-input-wrapper {
        position: relative;
      }

      .template-input {
        width: 100%;
        min-height: 200px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--code-background-color, #282c34);
        color: var(--code-text-color, #abb2bf);
        resize: vertical;
      }

      .template-input:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      /* Form sections */
      .form-row {
        margin-bottom: 12px;
      }

      .form-row:last-child {
        margin-bottom: 0;
      }

      .form-label {
        display: block;
        font-weight: 500;
        font-size: 13px;
        color: var(--primary-text-color);
        margin-bottom: 6px;
      }

      .toggle-label {
        float: right;
        font-weight: normal;
        font-size: 12px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .toggle-label input[type="checkbox"] {
        margin: 0;
        cursor: pointer;
      }

      .toggle-label input[type="checkbox"] {
        margin: 0;
        cursor: pointer;
      }

      .entity-input, .example-select, .yaml-editor {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
      }

      .yaml-editor {
        min-height: 100px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        background: var(--code-background-color, #282c34);
        color: var(--code-text-color, #abb2bf);
        resize: vertical;
      }

      /* Entity state display */
      .entity-state-display {
        padding: 12px;
        background: var(--code-background-color, #282c34);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--code-text-color, #abb2bf);
        max-height: 300px;
        overflow: auto;
      }

      .state-line {
        margin-bottom: 8px;
      }

      .attributes-list {
        margin: 4px 0 0 16px;
        padding: 0;
        list-style: none;
      }

      .attributes-list li {
        margin: 4px 0;
      }

      .attributes-list code {
        color: #61afef;
      }

      .more-indicator {
        color: var(--secondary-text-color);
        font-style: italic;
      }

      /* State picker */
      .state-picker {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .state-button {
        padding: 6px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .state-button:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      /* DataSource info */
      .datasource-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: var(--primary-color);
        color: white;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .datasource-info.live {
        background: #4caf50;
      }

      .datasource-info.mock {
        background: #ff9800;
      }

      .datasource-value {
        font-family: 'Courier New', monospace;
        font-weight: 600;
      }

      /* Result display */
      .result-display {
        padding: 16px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        word-break: break-word;
        min-height: 80px;
        border: 2px solid var(--divider-color);
        position: relative;
      }

      .result-display.success {
        background: rgba(76, 175, 80, 0.1);
        border-color: #4caf50;
        color: var(--primary-text-color);
      }

      .result-display.error {
        background: rgba(244, 67, 54, 0.1);
        border-color: #f44336;
        color: #f44336;
      }

      .result-display.warning {
        background: rgba(255, 152, 0, 0.1);
        border-color: #ff9800;
        color: #ff9800;
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        font-size: 15px;
      }

      .status-icon {
        font-size: 22px;
      }

      .eval-time {
        margin-left: auto;
        font-size: 11px;
        color: var(--secondary-text-color);
        font-weight: normal;
      }

      .result-value {
        padding: 12px;
        background: var(--card-background-color);
        border-radius: 4px;
        margin-top: 8px;
      }

      .copy-button {
        position: absolute;
        top: 12px;
        right: 12px;
      }

      .copy-button {
        position: absolute;
        top: 12px;
        right: 12px;
      }

      /* Dependency tree */
      .dependency-tree {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
      }

      .dep-section {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 12px;
      }

      .dep-section h5 {
        margin: 0 0 10px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dep-section h5 ha-icon {
        --mdc-icon-size: 16px;
      }

      .dep-section ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .dep-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        margin-bottom: 6px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        font-size: 12px;
      }

      .dep-item:last-child {
        margin-bottom: 0;
      }

      .dep-item.available,
      .dep-item.live,
      .dep-item.resolved {
        border-left: 3px solid #4caf50;
      }

      .dep-item.unavailable,
      .dep-item.unresolved {
        border-left: 3px solid #f44336;
      }

      .dep-item.mock {
        border-left: 3px solid #ff9800;
      }

      .dep-name {
        font-family: 'Courier New', monospace;
        font-weight: 500;
        flex: 1;
      }

      .dep-status {
        font-size: 11px;
        color: var(--secondary-text-color);
        font-weight: 600;
      }

      /* Diagnostics */
      .diagnostics-panel {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 16px;
      }

      .diagnostic-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
        border-left: 3px solid;
      }

      .diagnostic-item.error {
        background: rgba(244, 67, 54, 0.1);
        border-color: #f44336;
        color: var(--primary-text-color);
      }

      .diagnostic-item.warning {
        background: rgba(255, 152, 0, 0.1);
        border-color: #ff9800;
        color: var(--primary-text-color);
      }

      .diagnostic-item.info {
        background: rgba(33, 150, 243, 0.1);
        border-color: #2196f3;
        color: var(--primary-text-color);
      }

      .diagnostic-item ha-icon {
        --mdc-icon-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      /* Loading/Empty states */
      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 40px;
        color: var(--secondary-text-color);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 60px 20px;
        color: var(--secondary-text-color);
        text-align: center;
      }

      .empty-state ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .info-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 12px;
      }

      .info-banner.mock {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid #ff9800;
        color: #ff9800;
      }

      .info-banner ha-icon {
        --mdc-icon-size: 20px;
        flex-shrink: 0;
      }

      /* Examples grid */
      .examples-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;
      }

      .example-card {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .example-card:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .example-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .example-card-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-text-color);
        flex: 1;
      }

      .example-card-description {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .example-card-template {
        padding: 10px;
        background: var(--code-background-color, #282c34);
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: var(--code-text-color, #abb2bf);
        overflow-x: auto;
        word-break: break-all;
      }

      /* Buttons */
      ha-button {
        --mdc-theme-primary: var(--primary-color);
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadAvailableDataSources();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupSubscriptions();
  }

  updated(changedProps) {
    if (changedProps.has('open')) {
      if (this.open) {
        this._onOpen();
      } else {
        this._onClose();
      }
    }

    if (changedProps.has('initialData') && this.initialData) {
      this._applyInitialData();
    }

    if (changedProps.has('_templateInput')) {
      this._scheduleEvaluation();
    }
  }

  render() {
    if (!this.open) return html``;

    return html`
      <ha-dialog
        open
        @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}
        header-title="🧪 Template Sandbox">
        <div class="dialog-content">
          <div class="split-pane-container">
            ${this._renderEditorPane()}
            ${this._renderContentPane()}
          </div>
        </div>
        <div slot="footer">
          <ha-button
            variant="brand"
            appearance="accent"
            @click=${this._handleClose}
            data-dialog="close">
            Close
          </ha-button>
        </div>
      </ha-dialog>
    `;
  }

  /**
   * Left pane: Template editor with evaluate button
   */
  _renderEditorPane() {
    const types = TemplateDetector.detectTemplateTypes(this._templateInput);
    const typeLabels = [];
    if (types.hasJavaScript) typeLabels.push('JS');
    if (types.hasTokens) typeLabels.push('Token');
    if (types.hasDatasources) typeLabels.push('DataSource');
    if (types.hasJinja2) typeLabels.push('Jinja2');

    return html`
      <div class="editor-pane">
        <div class="editor-pane-header">
          <h3>Template Input</h3>
          ${typeLabels.length > 0 ? html`
            <div style="display: flex; gap: 4px;">
              ${typeLabels.map(type => html`
                <span class="template-type-badge">${type}</span>
              `)}
            </div>
          ` : ''}
        </div>
        <div class="editor-content">
          ${this._renderTemplateEditorContent()}
          ${this._renderTemplateBuilder()}
        </div>
      </div>
    `;
  }

  /**
   * Right pane: Tabbed content (Output, Context, Help)
   */
  _renderContentPane() {
    const getStatusIcon = () => {
      if (!this._evaluationResult) return 'mdi:play-circle-outline';
      if (this._evaluationResult.success && !this._detectUnresolvedTokens(String(this._evaluationResult.result || '')).length) {
        return 'mdi:check-circle';
      }
      if (this._evaluationResult.error) return 'mdi:close-circle';
      return 'mdi:alert-circle';
    };

    return html`
      <div class="content-pane">
        <ha-tab-group @wa-tab-show=${(e) => {
          // CRITICAL: Stop propagation to prevent bubbling to parent tab handlers
          e.stopPropagation();

          const value = e.target.activeTab?.getAttribute('value');
          if (value !== null && value !== undefined) {
            this._activeMainTab = value;
            this.requestUpdate();
          }
        }}>
          <ha-tab-group-tab value="output" ?active=${this._activeMainTab === 'output'}>
            <ha-icon icon="${getStatusIcon()}"></ha-icon>
            Output
          </ha-tab-group-tab>
          <ha-tab-group-tab value="context" ?active=${this._activeMainTab === 'context'}>
            <ha-icon icon="mdi:tune"></ha-icon>
            Context
          </ha-tab-group-tab>
          <ha-tab-group-tab value="help" ?active=${this._activeMainTab === 'help'}>
            <ha-icon icon="mdi:help-circle"></ha-icon>
            Help
          </ha-tab-group-tab>

          <ha-tab-panel value="output" ?hidden=${this._activeMainTab !== 'output'}>
            <div class="tab-panel-content">
              ${this._renderOutputTabNew()}
            </div>
          </ha-tab-panel>
          <ha-tab-panel value="context" ?hidden=${this._activeMainTab !== 'context'}>
            <div class="tab-panel-content">
              ${this._renderContextTab()}
            </div>
          </ha-tab-panel>
          <ha-tab-panel value="help" ?hidden=${this._activeMainTab !== 'help'}>
            <div class="tab-panel-content">
              ${this._renderHelpTab()}
            </div>
          </ha-tab-panel>
        </ha-tab-group>
      </div>
    `;
  }

  /**
   * Template editor content (in left pane)
   */
  _renderTemplateEditorContent() {
    return html`
      <div class="form-row">
        <label class="form-label">Template</label>
        <div class="template-input-wrapper">
          <ha-code-editor
            mode="jinja2"
            .value=${this._templateInput}
            @value-changed=${(e) => this._handleTemplateInput(e)}
            autofocus>
          </ha-code-editor>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">
          Stats: ${this._templateInput.length} chars, ${this._templateInput.split('\n').length} lines
        </label>
      </div>

      <div class="form-row">
        <ha-button @click=${() => this._evaluateTemplate()} ?disabled=${this._isEvaluating} style="width: 100%; --mdc-typography-button-font-size: 14px;">
          <ha-icon icon="mdi:play" slot="start"></ha-icon>
          ${this._isEvaluating ? 'Evaluating...' : 'Evaluate Now'}
        </ha-button>
      </div>
    `;
  }

  /**
   * Context Tab: Entity and DataSource configuration
   */
  _renderContextTab() {
    return html`
      <div style="display: grid; gap: 12px;">
        ${this._renderEntityContext()}
        ${this._renderDataSourcesContext()}
      </div>
    `;
  }

  /**
   * Template Builder: Quick insert buttons for common template patterns
   */
  _renderTemplateBuilder() {
    const examples = getExampleIds().map(id => ({
      id,
      ...EXAMPLE_TEMPLATES[id]
    }));

    return html`
      <div style="margin-top: 20px;">
        <lcards-collapsible-section
          header="Template Builder"
          description="Click to load example templates"
          ?expanded=${true}>
          <div style="display: grid; gap: 8px; max-height: 300px; overflow-y: auto; padding: 8px;">
            ${examples.map(example => html`
              <button
                class="builder-button"
                @click=${() => this._loadExample(example.id)}
                title="${example.description}">
                <ha-icon icon="mdi:code-braces"></ha-icon>
                <div class="builder-button-content">
                  <div class="builder-button-title">${example.name}</div>
                  <div class="builder-button-template">${example.template}</div>
                </div>
              </button>
            `)}
          </div>
        </lcards-collapsible-section>
      </div>
    `;
  }

  /**
   * Help Tab: Syntax reference and documentation
   */
  _renderHelpTab() {
    return this._renderTemplateSyntaxHelp();
  }

  _renderTemplateEditor() {
    const types = TemplateDetector.detectTemplateTypes(this._templateInput);
    const typeLabels = [];
    if (types.hasJavaScript) typeLabels.push('JS');
    if (types.hasTokens) typeLabels.push('Token');
    if (types.hasDatasources) typeLabels.push('DataSource');
    if (types.hasJinja2) typeLabels.push('Jinja2');

    const charCount = this._templateInput.length;
    const lineCount = this._templateInput.split('\n').length;
    // @ts-ignore - TS2339: auto-suppressed
    const isEntityLive = !!this.hass?.states?.[this._mockEntityId];

    return html`
      <lcards-form-section
        header="Template Editor"
        description="Enter your template using any supported syntax (JS, Token, DataSource, or Jinja2)"
        ?expanded=${true}
        .collapsible=${false}>

        <div class="form-row">
          <ha-code-editor
            mode="jinja2"
            .value=${this._templateInput}
            @value-changed=${(e) => {
              this._templateInput = e.detail.value;
              this._scheduleEvaluation();
            }}
            autocomplete-entities
            autocomplete-icons>
          </ha-code-editor>
        </div>

        <!-- Template Metadata -->
        <div class="form-row" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 12px; padding: 12px; background: var(--secondary-background-color); border-radius: 6px; font-size: 13px;">
          <ha-button @click=${() => this._evaluateTemplate()} ?disabled=${this._isEvaluating} style="--mdc-typography-button-font-size: 12px;">
            <ha-icon icon="mdi:play" slot="start"></ha-icon>
            ${this._isEvaluating ? 'Evaluating...' : 'Evaluate Now'}
          </ha-button>

          ${typeLabels.length > 0 ? html`
            <span class="template-type-badge">
              ${typeLabels.join(' + ')}
            </span>
          ` : ''}

          <span style="color: var(--secondary-text-color);">${lineCount} lines, ${charCount} chars</span>

          <span class="status-badge ${isEntityLive && !this._useMockEntity ? 'live' : 'mock'}">
            ${isEntityLive && !this._useMockEntity ? '⚡ Live Entity' : '🔸 Mock Entity'}
          </span>
        </div>
      </lcards-form-section>
    `;
  }

  _renderTemplateSyntaxHelp() {
    return html`
      <lcards-form-section
        header="Template Syntax Guide"
        description="Comprehensive reference for all supported template types"
        ?expanded=${true}
        .collapsible=${false}>

        <div style="font-size: 13px; line-height: 1.8;">
          <div style="margin-bottom: 12px; padding: 12px; background: var(--card-background-color); border-left: 3px solid var(--primary-color); border-radius: 4px;">
            <strong style="color: var(--primary-color); font-size: 14px;">1. JavaScript Templates</strong><br>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">[[[return entity.state.toUpperCase()]]]</code><br>
            <span style="color: var(--secondary-text-color); font-size: 12px;">Execute arbitrary JavaScript with access to context variables</span>
            <div style="margin-top: 8px; font-size: 12px;">
              <strong>Available context:</strong> entity, config, hass, theme
            </div>
          </div>

          <div style="margin-bottom: 12px; padding: 12px; background: var(--card-background-color); border-left: 3px solid var(--primary-color); border-radius: 4px;">
            <strong style="color: var(--primary-color); font-size: 14px;">2. Token Templates</strong><br>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">{entity.state}</code>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">{theme:palette.moonlight}</code><br>
            <span style="color: var(--secondary-text-color); font-size: 12px;">Simple property access with dot notation</span>
            <div style="margin-top: 8px; font-size: 12px;">
              <strong>Examples:</strong> {entity.attributes.brightness}, {config.name}
            </div>
          </div>

          <div style="margin-bottom: 12px; padding: 12px; background: var(--card-background-color); border-left: 3px solid var(--primary-color); border-radius: 4px;">
            <strong style="color: var(--primary-color); font-size: 14px;">3. DataSource Templates</strong><br>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">{datasource:sensor_temp:.1f}</code>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">{ds:cpu_usage}</code><br>
            <span style="color: var(--secondary-text-color); font-size: 12px;">Access DataSource values with optional Python-style formatting</span>
            <div style="margin-top: 8px; font-size: 12px;">
              <strong>Format codes:</strong> :.1f (1 decimal), :.0f (integer), :03d (padded)
            </div>
          </div>

          <div style="padding: 12px; background: var(--card-background-color); border-left: 3px solid var(--primary-color); border-radius: 4px;">
            <strong style="color: var(--primary-color); font-size: 14px;">4. Jinja2 Templates</strong><br>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">{{states('sensor.temp')}}</code>
            <code style="background: var(--code-background-color); padding: 3px 8px; border-radius: 3px; margin: 8px 0; display: inline-block;">{% if ... %}...{% endif %}</code><br>
            <span style="color: var(--secondary-text-color); font-size: 12px;">Full Jinja2 syntax evaluated by Home Assistant backend</span>
            <div style="margin-top: 8px; font-size: 12px;">
              <strong>Note:</strong> Async evaluation, has access to all HA template functions
            </div>
          </div>
        </div>
      </lcards-form-section>
    `;
  }

  _renderTemplateExamples() {
    const examples = getExampleIds().map(id => ({
      id,
      ...EXAMPLE_TEMPLATES[id]
    }));

    return html`
      <lcards-form-section
        header="Example Templates"
        description="Click any example to load it into the editor"
        ?expanded=${true}
        .collapsible=${false}>

        <div class="examples-grid">
          ${examples.map(example => html`
            <div class="example-card" @click=${() => this._loadExample(example.id)}>
              <div class="example-card-header">
                <span class="example-card-title">${example.name}</span>
                <ha-icon icon="mdi:arrow-right"></ha-icon>
              </div>
              <div class="example-card-description">
                ${example.description}
              </div>
              <div class="example-card-template">
                ${example.template}
              </div>
            </div>
          `)}
        </div>
      </lcards-form-section>
    `;
  }

  _renderEntityContext() {
    // @ts-ignore - TS2339: auto-suppressed
    const isEntityLive = !!this.hass?.states?.[this._mockEntityId];
    // @ts-ignore - TS2339: auto-suppressed
    const entityState = isEntityLive ? this.hass.states[this._mockEntityId] : this._mockState;

    return html`
      <div style="padding: 24px;">
        <lcards-form-section
          header="Entity Context"
          .secondary=${isEntityLive && !this._useMockEntity ? '⚡ Live' : '🔸 Mock'}
          ?expanded=${true}
          .collapsible=${false}>

          <div class="form-row">
            <label class="form-label">Entity Mode</label>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .label=${'Use Mock Entity'}
              .value=${this._useMockEntity}
              @value-changed=${(e) => { this._useMockEntity = e.detail.value; }}>
            </ha-selector>
          </div>

          ${!this._useMockEntity ? html`
            <!-- Live Entity -->
            <div class="form-row">
              <label class="form-label">Entity ID</label>
              <ha-entity-picker
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .value=${this._mockEntityId}
                @value-changed=${(e) => this._handleEntityPickerChange(e)}>
              </ha-entity-picker>
            </div>

            ${isEntityLive ? html`
              <div class="form-row">
                <label class="form-label">Current State</label>
                <div class="entity-state-display">
                  <div class="state-line"><strong>State:</strong> ${haFormatState(this.hass, entityState)}</div>
                  ${Object.keys(entityState.attributes || {}).length > 0 ? html`
                    <div class="state-line"><strong>Attributes:</strong></div>
                    <ul class="attributes-list">
                      ${Object.entries(entityState.attributes).slice(0, 10).map(([key, value]) => html`
                        <li><code>${key}</code>: ${JSON.stringify(value)}</li>
                      `)}
                      ${Object.keys(entityState.attributes).length > 10 ? html`
                        <li class="more-indicator">... and ${Object.keys(entityState.attributes).length - 10} more</li>
                      ` : ''}
                    </ul>
                  ` : ''}
                </div>
              </div>

              ${Object.keys(entityState.attributes || {}).length > 0 ? html`
                <ha-selector
                  // @ts-ignore - TS2339: auto-suppressed
                  .hass=${this.hass}
                  .label=${'Quick Insert Attribute'}
                  .helper=${'Select attribute to insert into template'}
                  .selector=${{
                    select: {
                      mode: 'dropdown',
                      options: Object.keys(entityState.attributes).map(key => ({
                        value: key,
                        label: key
                      }))
                    }
                  }}
                  .value=${''}
                  @value-changed=${(e) => {
                    const value = e.detail.value;
                    if (value) {
                      this._insertAttributeToken({ target: { value } });
                    }
                  }}>
                </ha-selector>
              ` : ''}
            ` : ''}
          ` : html`
            <!-- Mock Entity -->
            <div class="form-row">
              <label class="form-label">Entity ID</label>
              <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ text: {} }}
                .label=${'Enter entity ID (e.g. light.kitchen)'}
                .value=${this._mockEntityId}
                @value-changed=${(e) => {
                  this._mockEntityId = e.detail.value;
                  this._scheduleEvaluation();
                }}>
              </ha-selector>
            </div>

            <div class="form-row">
              <label class="form-label">Quick State Presets</label>
              <div class="state-picker">
                ${this._renderQuickStatePickers()}
              </div>
            </div>

            <div class="form-row">
              <label class="form-label">Entity State (YAML)</label>
              <ha-code-editor
                mode="yaml"
                .value=${this._serializeState()}
                @value-changed=${(e) => {
                  this._handleStateYamlChange(e.detail.value);
                }}>
              </ha-code-editor>
            </div>
          `}
        </lcards-form-section>
      </div>
    `;
  }

  _renderDataSourcesContext() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    const liveDataSources = this._liveDataSources;

    return html`
      <div style="padding: 24px;">
        <lcards-form-section
          header="🔸 Mock Data Sources"
          description="Define mock data source values for testing (IDs use underscores, e.g. sensor_temp)"
          ?expanded=${true}
          .collapsible=${false}>

          <div class="form-row">
            <label class="form-label">Mock DataSource Values (YAML)</label>
            <ha-code-editor
              mode="yaml"
              .value=${this._serializeMockDataSources()}
              @value-changed=${(e) => {
                this._handleMockDataSourcesChange(e.detail.value);
              }}>
            </ha-code-editor>
          </div>

          <div style="padding: 12px; background: rgba(255, 152, 0, 0.1); border-left: 3px solid #ff9800; border-radius: 4px; font-size: 13px;">
            <strong style="color: #ff9800;">💡 Tip:</strong> Mock data sources are used when referenced data sources aren't configured in your card.
          </div>
        </lcards-form-section>

        ${dsManager && liveDataSources.length > 0 ? html`
          <lcards-form-section
            header="⚡ Live Data Sources"
            .count=${liveDataSources.length}
            ?expanded=${true}>

            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .label=${'Available Data Sources'}
              .helper=${'Select DataSource to view details'}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: liveDataSources.map(ds => ({
                    value: ds.id,
                    label: ds.id
                  }))
                }
              }}
              .value=${this._selectedLiveDataSource || ''}
              @value-changed=${(e) => {
                this._selectedLiveDataSource = e.detail.value;
              }}>
            </ha-selector>

            ${this._selectedLiveDataSource ? html`
              <div class="form-row">
                ${this._renderDataSourceInfo()}
              </div>
            ` : ''}
          </lcards-form-section>
        ` : html`
          <div style="padding: 16px; text-align: center; color: var(--secondary-text-color); font-size: 13px;">
            No live data sources configured in this card
          </div>
        `}
      </div>
    `;
  }

  _renderOutputTab() {
    if (this._isEvaluating) {
      return html`
        <div class="loading-indicator">
          <ha-circular-progress active></ha-circular-progress>
          <span>Evaluating template...</span>
        </div>
      `;
    }

    if (!this._evaluationResult) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:play-circle-outline"></ha-icon>
          <p>No evaluation yet</p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Template will auto-evaluate as you type
          </p>
        </div>
      `;
    }

    const result = this._evaluationResult;
    // More accurate success detection: must have no error AND have a result
    const isSuccess = result.success && !result.error && result.result !== undefined && result.result !== null;
    const statusClass = isSuccess ? 'success' : 'error';
    const statusIcon = isSuccess ? '✅' : '❌';

    return html`
      <!-- Using Mock DataSources Warning -->
      ${result.usingMockDataSources ? html`
        <div class="info-banner mock">
          <ha-icon icon="mdi:test-tube"></ha-icon>
          <span>Using mock data sources (no live sources configured)</span>
        </div>
      ` : ''}

      <!-- Main Result -->
      <lcards-form-section
        header="Evaluation Result"
        .secondary=${isSuccess ? 'Success' : 'Failed'}
        ?expanded=${true}
        .collapsible=${false}>

        <div class="result-display ${statusClass}">
          <div class="result-header">
            <span class="status-icon">${statusIcon}</span>
            <span>${isSuccess ? 'Evaluation Successful' : 'Evaluation Failed'}</span>
            ${result.evalTime ? html`
              <span class="eval-time">${result.evalTime}ms</span>
            ` : ''}
          </div>

          <div class="result-value">
            ${isSuccess ? html`
              <strong>Result:</strong> ${result.result}
            ` : html`
              <strong>Error:</strong> ${result.error || 'No result returned'}
            `}
          </div>

          ${isSuccess ? html`
            <div class="action-buttons">
              <ha-button @click=${() => this._copyToClipboard(String(result.result))}>
                <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                Copy Result
              </ha-button>
              <ha-button @click=${() => this._copyToClipboard(this._templateInput)}>
                <ha-icon icon="mdi:code-braces" slot="start"></ha-icon>
                Copy Template
              </ha-button>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      <!-- Diagnostics (if failure) -->
      ${!isSuccess && result.diagnostics ? html`
        <lcards-form-section
          header="Diagnostics"
          description="Helpful information about the failure"
          ?expanded=${true}>
          <div class="diagnostics-panel">
            ${result.diagnostics.missingDataSources?.length > 0 ? html`
              <div class="diagnostic-item error">
                <ha-icon icon="mdi:database-off"></ha-icon>
                <div>
                  <strong>Missing data sources:</strong><br>
                  ${result.diagnostics.missingDataSources.join(', ')}
                </div>
              </div>
            ` : ''}

            ${result.diagnostics.missingEntities?.length > 0 ? html`
              <div class="diagnostic-item warning">
                <ha-icon icon="mdi:home-off"></ha-icon>
                <div>
                  <strong>Missing Entities:</strong><br>
                  ${result.diagnostics.missingEntities.join(', ')}
                </div>
              </div>
            ` : ''}

            ${result.diagnostics.suggestion ? html`
              <div class="diagnostic-item info">
                <ha-icon icon="mdi:lightbulb-on"></ha-icon>
                <div>
                  <strong>Suggestion:</strong><br>
                  ${result.diagnostics.suggestion}
                </div>
              </div>
            ` : ''}
          </div>
        </lcards-form-section>
      ` : ''}

      <!-- Dependencies -->
      ${result.dependencies ? html`
        <lcards-form-section
          header="Dependencies"
          description="Resources referenced by this template"
          ?expanded=${true}>
          ${this._renderDependencyTree(result.dependencies)}
        </lcards-form-section>
      ` : ''}
    `;
  }

  /**
   * Enhanced Output Tab with better validation for unresolved tokens
   * (New tab-based layout for Issue #79)
   */
  _renderOutputTabNew() {
    if (this._isEvaluating) {
      return html`
        <div class="loading-indicator">
          <ha-circular-progress active></ha-circular-progress>
          <span>Evaluating template...</span>
        </div>
      `;
    }

    if (!this._evaluationResult) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:play-circle-outline"></ha-icon>
          <p>No evaluation yet</p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Click "Evaluate Now" in the Input tab to test your template
          </p>
        </div>
      `;
    }

    const result = this._evaluationResult;
    const resultStr = String(result.result || '');

    // Enhanced validation: check if output still contains unresolved template syntax
    const unresolvedTokens = this._detectUnresolvedTokens(resultStr);
    const hasUnresolved = unresolvedTokens.length > 0;

    // Determine status: full success, partial (unresolved), or error
    let status, statusIcon, statusColor, statusText;
    if (result.error) {
      status = 'error';
      statusIcon = '❌';
      statusColor = '#f44336';
      statusText = 'Evaluation Failed';
    } else if (hasUnresolved) {
      status = 'partial';
      statusIcon = '⚠️';
      statusColor = '#ff9800';
      statusText = 'Partial Evaluation';
    } else if (result.success) {
      status = 'success';
      statusIcon = '✅';
      statusColor = '#4caf50';
      statusText = 'Evaluation Successful';
    } else {
      status = 'warning';
      statusIcon = '⚠️';
      statusColor = '#ff9800';
      statusText = 'Evaluation Warning';
    }

    return html`
      <div style="display: grid; gap: 12px;">
        <!-- Result Status Card -->
        <lcards-form-section
          header="Evaluation Result"
          .secondary=${statusText}
          ?expanded=${true}
          .collapsible=${false}>

          <div class="result-display ${status}">
            <div class="result-header">
              <span class="status-icon">${statusIcon}</span>
              <span style="color: ${statusColor};">${statusText}</span>
              ${result.evalTime ? html`
                <span class="eval-time">${result.evalTime}ms</span>
              ` : ''}
            </div>

            <div class="result-value">
              ${resultStr || '(empty result)'}
            </div>

            ${status === 'success' ? html`
              <div class="action-buttons">
                <ha-button @click=${() => this._copyToClipboard(resultStr)}>
                  <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                  Copy Result
                </ha-button>
                <ha-button @click=${() => this._copyToClipboard(this._templateInput)}>
                  <ha-icon icon="mdi:code-braces" slot="start"></ha-icon>
                  Copy Template
                </ha-button>
              </div>
            ` : ''}
          </div>
        </lcards-form-section>

        <!-- Unresolved Tokens (Partial Evaluation) -->
        ${hasUnresolved ? html`
          <lcards-form-section
            header="⚠️ Unresolved Tokens"
            description="These tokens were not resolved during evaluation"
            ?expanded=${true}>
            <div class="diagnostics-panel">
              ${unresolvedTokens.map(token => html`
                <div class="diagnostic-item warning">
                  <ha-icon icon="mdi:alert-circle"></ha-icon>
                  <div>
                    <code style="background: var(--code-background-color); padding: 2px 6px; border-radius: 3px;">${token.raw}</code>
                    <div style="font-size: 12px; margin-top: 4px; color: var(--secondary-text-color);">
                      Type: ${token.type}
                      ${token.suggestion ? html` — <em>${token.suggestion}</em>` : ''}
                    </div>
                  </div>
                </div>
              `)}
            </div>
          </lcards-form-section>
        ` : ''}

        <!-- Error Details -->
        ${result.error ? html`
          <lcards-form-section
            header="❌ Error Details"
            ?expanded=${true}>
            <div class="diagnostics-panel">
              <div class="diagnostic-item error">
                <ha-icon icon="mdi:close-circle"></ha-icon>
                <div>
                  <strong>Error Message:</strong><br>
                  ${result.error}
                </div>
              </div>

              ${result.diagnostics?.suggestion ? html`
                <div class="diagnostic-item info">
                  <ha-icon icon="mdi:lightbulb-on"></ha-icon>
                  <div>
                    <strong>Suggestion:</strong><br>
                    ${result.diagnostics.suggestion}
                  </div>
                </div>
              ` : ''}
            </div>
          </lcards-form-section>
        ` : ''}

        <!-- Dependencies -->
        ${result.dependencies ? html`
          <lcards-form-section
            header="Dependencies"
            description="Resources referenced by this template"
            ?expanded=${status !== 'success'}>
            ${this._renderDependencyTree(result.dependencies)}
          </lcards-form-section>
        ` : ''}

        <!-- Mock DataSources Warning -->
        ${result.usingMockDataSources ? html`
          <div class="info-banner mock">
            <ha-icon icon="mdi:test-tube"></ha-icon>
            <span>Using mock data sources for evaluation (no live sources configured)</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Detect unresolved tokens in evaluation result
   * Returns array of {raw, type, suggestion} objects
   */
  _detectUnresolvedTokens(resultStr) {
    const tokens = [];

    // Check for JavaScript templates
    const jsMatches = resultStr.matchAll(/\[\[\[([\s\S]*?)\]\]\]/g);
    for (const match of jsMatches) {
      tokens.push({
        raw: match[0],
        type: 'JavaScript',
        suggestion: 'Check if expression syntax is valid'
      });
    }

    // Check for theme tokens
    const themeMatches = resultStr.matchAll(/\{theme:([^}]+)\}/g);
    for (const match of themeMatches) {
      tokens.push({
        raw: match[0],
        type: 'Theme Token',
        suggestion: `Theme token '${match[1]}' not found in current theme`
      });
    }

    // Check for datasource tokens
    const dsMatches = resultStr.matchAll(/\{(?:datasource|ds):([^}:]+)/g);
    for (const match of dsMatches) {
      tokens.push({
        raw: match[0],
        type: 'DataSource',
        suggestion: `DataSource '${match[1]}' not configured or not available`
      });
    }

    // Check for simple tokens (entity, config, etc.)
    const tokenMatches = resultStr.matchAll(/\{(?!theme:)(?!datasource:)(?!ds:)(?!\{)([^{}]+)\}/g);
    for (const match of tokenMatches) {
      tokens.push({
        raw: match[0],
        type: 'Token',
        suggestion: `Token '${match[1]}' could not be resolved from context`
      });
    }

    // Check for Jinja2 templates
    const jinjaMatches = resultStr.matchAll(/\{\{([^}]+)\}\}/g);
    for (const match of jinjaMatches) {
      tokens.push({
        raw: match[0],
        type: 'Jinja2',
        suggestion: 'Jinja2 templates require Home Assistant backend evaluation'
      });
    }

    return tokens;
  }

  _loadExample(exampleId) {
    const example = EXAMPLE_TEMPLATES[exampleId];
    if (!example) return;

    this._templateInput = example.template;

    // Apply mock entity if provided
    if (example.mockEntity) {
      this._mockEntityId = example.mockEntity;
      this._useMockEntity = true;
    }

    // Apply mock state if provided
    if (example.mockState) {
      this._mockState = example.mockState;
    }

    // Apply mock datasources if provided
    if (example.mockDataSources) {
      this._mockDataSources = { ...example.mockDataSources };
    }

    // Switch to help tab in right column and evaluate
    this._activeTab = 'help';
    this._evaluateTemplate();
  }  _renderQuickStatePickers() {
    const domain = this._mockEntityId.split('.')[0];

    // Domain-specific quick pickers
    switch (domain) {
      case 'light':
        return html`
          <button class="state-button" @click=${() => this._setQuickState('on')}>On</button>
          <button class="state-button" @click=${() => this._setQuickState('off')}>Off</button>
        `;
      case 'switch':
      case 'input_boolean':
        return html`
          <button class="state-button" @click=${() => this._setQuickState('on')}>On</button>
          <button class="state-button" @click=${() => this._setQuickState('off')}>Off</button>
        `;
      case 'sensor':
        return html`
          <button class="state-button" @click=${() => this._setQuickState('10')}>10</button>
          <button class="state-button" @click=${() => this._setQuickState('20')}>20</button>
          <button class="state-button" @click=${() => this._setQuickState('30')}>30</button>
        `;
      case 'climate':
        return html`
          <button class="state-button" @click=${() => this._setQuickState('heat')}>Heat</button>
          <button class="state-button" @click=${() => this._setQuickState('cool')}>Cool</button>
          <button class="state-button" @click=${() => this._setQuickState('off')}>Off</button>
        `;
      default:
        return html`
          <button class="state-button" @click=${() => this._setQuickState('on')}>On</button>
          <button class="state-button" @click=${() => this._setQuickState('off')}>Off</button>
          <button class="state-button" @click=${() => this._setQuickState('unknown')}>Unknown</button>
        `;
    }
  }

  _renderDataSourceInfo() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    const source = dsManager?.getSource(this._selectedLiveDataSource);

    if (!source) return '';

    const data = source.getCurrentData?.();
    const isLive = !!data;

    return html`
      <div class="datasource-info ${isLive ? 'live' : 'mock'}">
        <div>
          <div>${isLive ? '⚡ Live' : '🔸 Not Available'}</div>
          ${data ? html`
            <div class="datasource-value">Value: ${data.v}</div>
            <div style="font-size: 10px; opacity: 0.8;">
              ${new Date(data.t).toLocaleTimeString()}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderDependencyTree(dependencies) {
    if (!dependencies) return '';

    const hasEntities = dependencies.entities?.length > 0;
    const hasDatasources = dependencies.datasources?.length > 0;
    const hasThemeTokens = dependencies.themeTokens?.length > 0;

    if (!hasEntities && !hasDatasources && !hasThemeTokens) {
      return '';
    }

    return html`
      <div class="dependency-tree">
        <div class="context-label">Dependencies</div>

        ${hasEntities ? html`
          <div class="dep-section">
            <h5>🏠 Entities</h5>
            <ul>
              ${dependencies.entities.map(entity => {
                // Handle both string and object formats
                const entityId = typeof entity === 'string' ? entity : entity.id;
                const status = typeof entity === 'object' ? entity.status :
                  (this._isEntityAvailable(entityId) ? 'available' : 'mock');

                return html`
                  <li class="dep-item ${status}">
                    <span class="dep-name">${entityId}</span>
                    <span class="dep-status">
                      ${status === 'available' ? '✅ Available' : '🔸 Mock'}
                    </span>
                  </li>
                `;
              })}
            </ul>
          </div>
        ` : ''}

        ${hasDatasources ? html`
          <div class="dep-section">
            <h5>📊 Data Sources</h5>
            <ul>
              ${dependencies.datasources.map(ds => {
                // Handle both string and object formats
                const dsId = typeof ds === 'string' ? ds : ds.id;
                const status = typeof ds === 'object' ? ds.status :
                  (this._isDataSourceLive(dsId) ? 'live' :
                   this._mockDataSources[dsId] !== undefined ? 'mock' : 'missing');

                const statusLabels = {
                  live: '⚡ Live',
                  mock: '🔸 Mock',
                  missing: '❌ Missing'
                };

                return html`
                  <li class="dep-item ${status}">
                    <span class="dep-name">{datasource:${dsId}}</span>
                    <span class="dep-status">${statusLabels[status]}</span>
                  </li>
                `;
              })}
            </ul>
          </div>
        ` : ''}

        ${hasThemeTokens ? html`
          <div class="dep-section">
            <h5>🎨 Theme Tokens</h5>
            <ul>
              ${dependencies.themeTokens.map(token => {
                const resolved = this._isThemeTokenResolved(token);
                return html`
                  <li class="dep-item ${resolved ? 'resolved' : 'unresolved'}">
                    <span class="dep-name">{theme:${token}}</span>
                    <span class="dep-status">
                      ${resolved ? '✅ Resolved' : '❌ Not found'}
                    </span>
                  </li>
                `;
              })}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Event Handlers

  _handleTemplateInput(e) {
    this._templateInput = e.detail?.value ?? e.target?.value ?? '';
  }

  _handleEntityPickerChange(e) {
    this._mockEntityId = e.detail.value;
    this._scheduleEvaluation();
  }

  _insertAttributeToken(e) {
    const attribute = e.target.value;
    if (!attribute) return;

    // Insert {entity.attributes.ATTR} at cursor or append
    const token = `{entity.attributes.${attribute}}`;
    this._templateInput = this._templateInput
      ? `${this._templateInput} ${token}`
      : token;

    // Reset dropdown
    e.target.value = '';

    // Trigger evaluation
    this._scheduleEvaluation();
  }

  _handleExampleSelect(e) {
    const exampleId = e.target.value;
    if (!exampleId) return;

    const example = EXAMPLE_TEMPLATES[exampleId];
    if (!example) return;

    this._templateInput = example.template;
    this._mockEntityId = example.mockEntity || 'light.example';
    this._mockState = example.mockState || { state: 'on', attributes: {} };
    this._mockDataSources = example.mockDataSources || {};

    // Reset selection
    e.target.value = '';

    // Trigger evaluation
    this._scheduleEvaluation();
  }

  _handleExampleSelectHA(e) {
    const exampleId = e.detail.value;
    if (!exampleId) return;

    const example = EXAMPLE_TEMPLATES[exampleId];
    if (!example) return;

    this._templateInput = example.template;
    this._mockEntityId = example.mockEntity || 'light.example';
    this._mockState = example.mockState || { state: 'on', attributes: {} };
    this._mockDataSources = example.mockDataSources || {};

    // Trigger evaluation
    this._scheduleEvaluation();
  }

  _handleEntityIdInput(e) {
    this._mockEntityId = e.target.value;
    this._scheduleEvaluation();
  }

  _handleStateYamlInput(e) {
    this._handleStateYamlChange(e.target.value);
  }

  _handleStateYamlChange(value) {
    try {
      // Simple YAML-like parsing
      const lines = value.split('\n');
      const state = { state: '', attributes: {} };
      let currentKey = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.startsWith('state:')) {
          state.state = trimmed.substring(6).trim();
        } else if (trimmed === 'attributes:') {
          currentKey = 'attributes';
        } else if (currentKey === 'attributes' && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          // Try to parse as number
          const numValue = parseFloat(value);
          state.attributes[key.trim()] = isNaN(numValue) ? value : numValue;
        }
      }

      this._mockState = state;
      this._scheduleEvaluation();
    } catch (error) {
      lcardsLog.warn('[TemplateSandbox] Failed to parse state YAML:', error);
    }
  }

  _handleMockDataSourcesInput(e) {
    this._handleMockDataSourcesChange(e.target.value);
  }

  _handleMockDataSourcesChange(value) {
    try {
      // Simple key: value parsing (one per line)
      const lines = value.split('\n');
      const mockDataSources = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.includes(':')) {
          const colonIndex = trimmed.indexOf(':');
          const key = trimmed.substring(0, colonIndex).trim();
          const valueStr = trimmed.substring(colonIndex + 1).trim();

          // Try to parse as number
          const numValue = parseFloat(valueStr);
          mockDataSources[key] = isNaN(numValue) ? valueStr : numValue;
        }
      }

      this._mockDataSources = mockDataSources;

      lcardsLog.debug('[TemplateSandbox] Mock DataSources updated:', mockDataSources);

      this._scheduleEvaluation();
    } catch (error) {
      lcardsLog.warn('[TemplateSandbox] Failed to parse mock DataSources:', error);
    }
  }

  _handleDataSourceSelect(e) {
    this._selectedLiveDataSource = e.target.value;
  }

  _handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('sandbox-closed', {
      bubbles: true,
      composed: true
    }));
  }

  _setQuickState(state) {
    this._mockState = { ...this._mockState, state };
    this._scheduleEvaluation();
  }

  // Lifecycle Methods

  _onOpen() {
    this._loadAvailableDataSources();
    this._subscribeToLiveDataSources();
  }

  _onClose() {
    this._cleanupSubscriptions();
  }

  _applyInitialData() {
    if (!this.initialData) return;

    if (this.initialData.template) {
      this._templateInput = this.initialData.template;
    }
    if (this.initialData.mockEntity) {
      this._mockEntityId = this.initialData.mockEntity;
    }
    if (this.initialData.mockState) {
      this._mockState = this.initialData.mockState;
    }

    this._scheduleEvaluation();
  }

  // Template Evaluation

  _scheduleEvaluation() {
    // Debounce auto-evaluation
    if (this._evaluationDebounce) {
      clearTimeout(this._evaluationDebounce);
    }

    this._evaluationDebounce = setTimeout(() => {
      this._evaluateTemplate();
    }, 500);
  }

  async _evaluateTemplate() {
    if (!this._templateInput || !this._templateInput.trim()) {
      this._evaluationResult = null;
      return;
    }

    this._isEvaluating = true;
    const startTime = performance.now();

    try {
      // Create mock entity for context
      const mockEntity = this._getMockEntity();

      // Get theme and datasource manager
      const themeManager = window.lcards?.core?.themeManager;

      // Use wrapper manager with mock fallback
      // The real manager always exists, but may have zero sources in editor
      const dataSourceManager = this._getDataSourceManagerWithMocks();

      // Log which sources are available
      const realManager = window.lcards?.core?.dataSourceManager;
      const realSourcesCount = realManager?.sources?.size || 0;
      const mockSourcesCount = Object.keys(this._mockDataSources || {}).length;

      lcardsLog.debug('[TemplateSandbox] Evaluation context:', {
        hasRealManager: !!realManager,
        realSourcesCount,
        mockSourcesCount,
        usingWrapper: !!dataSourceManager
      });

      // Create evaluator with wrapper manager
      const evaluator = new UnifiedTemplateEvaluator({
        // @ts-ignore - TS2339: auto-suppressed
        hass: this.hass,
        context: {
          entity: mockEntity,
          // @ts-ignore - TS2339: auto-suppressed
          config: this.config || {},
          // @ts-ignore - TS2339: auto-suppressed
          hass: this.hass,
          theme: themeManager?.getCurrentTheme?.()
        },
        dataSourceManager  // ← Now uses wrapper with mock fallback
      });

      // Evaluate template
      const result = await evaluator.evaluateAsync(this._templateInput);
      const evalTime = (performance.now() - startTime).toFixed(2);

      // Extract dependencies
      const dependencies = this._extractDependencies(this._templateInput);

      // Add resolution status to dependencies
      this._annotateDependencyStatus(dependencies);

      // Determine if evaluation was truly successful
      // If result is undefined, null, empty string, or just returns the template itself, it's a failure
      const resultStr = String(result);
      const isActuallySuccessful = result !== undefined &&
                                    result !== null &&
                                    resultStr.trim() !== '' &&
                                    resultStr !== this._templateInput;

      this._evaluationResult = {
        success: isActuallySuccessful,
        result: resultStr,
        evalTime,
        dependencies,
        types: TemplateDetector.detectTemplateTypes(this._templateInput),
        usingMockDataSources: mockSourcesCount > 0 && realSourcesCount === 0,
        error: isActuallySuccessful ? null : 'Template returned no result or unchanged template'
      };

      lcardsLog.debug('[TemplateSandbox] Evaluation complete', {
        success: isActuallySuccessful,
        result: resultStr,
        evalTime,
        usingMocks: this._evaluationResult.usingMockDataSources
      });

    } catch (error) {
      const evalTime = (performance.now() - startTime).toFixed(2);

      lcardsLog.error('[TemplateSandbox] Evaluation failed', {
        error: error.message,
        template: this._templateInput.substring(0, 100)
      });

      // Create diagnostic information
      const diagnostics = this._diagnoseFailure(error);

      this._evaluationResult = {
        success: false,
        error: error.message,
        diagnostics,
        evalTime,
        result: this._templateInput
      };
    } finally {
      this._isEvaluating = false;
    }
  }

  _extractDependencies(template) {
    const dependencies = {
      entities: [],
      datasources: [],
      themeTokens: []
    };

    // Extract entity references
    const entityMatches = template.matchAll(/\{entity\.([^}]+)\}/g);
    for (const match of entityMatches) {
      if (this._mockEntityId) {
        dependencies.entities.push(this._mockEntityId);
      }
    }

    // Extract datasource references
    const dsMatches = template.matchAll(/\{(?:datasource|ds):([^}:]+)/g);
    for (const match of dsMatches) {
      dependencies.datasources.push(match[1]);
    }

    // Extract theme token references
    const themeMatches = template.matchAll(/\{theme:([^}]+)\}/g);
    for (const match of themeMatches) {
      dependencies.themeTokens.push(match[1]);
    }

    // Deduplicate
    dependencies.entities = [...new Set(dependencies.entities)];
    dependencies.datasources = [...new Set(dependencies.datasources)];
    dependencies.themeTokens = [...new Set(dependencies.themeTokens)];

    return dependencies;
  }

  // DataSource Management

  _loadAvailableDataSources() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) {
      this._liveDataSources = [];
      return;
    }

    const sources = [];
    if (dsManager.sources && dsManager.sources instanceof Map) {
      for (const [id, source] of dsManager.sources.entries()) {
        sources.push({ id, source });
      }
    }

    this._liveDataSources = sources;
  }

  _subscribeToLiveDataSources() {
    // Clean up existing subscriptions
    this._cleanupSubscriptions();

    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) return;

    // Extract datasource references from template
    const refs = this._extractDependencies(this._templateInput).datasources;

    refs.forEach((sourceId) => {
      const source = dsManager.getSource(sourceId);
      if (source && typeof source.subscribe === 'function') {
        const unsubscribe = source.subscribe((data) => {
          this._handleDataSourceUpdate(sourceId, data);
        });
        this._dataSourceSubscriptions.set(sourceId, unsubscribe);
      }
    });
  }

  _handleDataSourceUpdate(sourceId, data) {
    lcardsLog.debug('[TemplateSandbox] DataSource update:', sourceId, data);
    // Trigger re-evaluation on live updates
    this._scheduleEvaluation();
  }

  _cleanupSubscriptions() {
    this._dataSourceSubscriptions.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this._dataSourceSubscriptions.clear();
  }

  // Helper Methods

  _getMockEntity() {
    // If user explicitly wants mock entity, return mock
    if (this._useMockEntity) {
      return {
        entity_id: this._mockEntityId,
        state: this._mockState.state,
        attributes: this._mockState.attributes || {},
        last_changed: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        context: { id: 'mock', parent_id: null, user_id: null }
      };
    }

    // Otherwise return real entity if available in hass
    // @ts-ignore - TS2339: auto-suppressed
    if (this.hass?.states?.[this._mockEntityId]) {
      // @ts-ignore - TS2339: auto-suppressed
      return this.hass.states[this._mockEntityId];
    }

    // Fallback to mock entity
    return {
      entity_id: this._mockEntityId,
      state: this._mockState.state,
      attributes: this._mockState.attributes || {},
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      context: { id: 'mock', parent_id: null, user_id: null }
    };
  }

  _serializeState() {
    const lines = [`state: ${this._mockState.state}`];

    if (this._mockState.attributes && Object.keys(this._mockState.attributes).length > 0) {
      lines.push('attributes:');
      for (const [key, value] of Object.entries(this._mockState.attributes)) {
        lines.push(`  ${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  _serializeMockDataSources() {
    if (!this._mockDataSources || Object.keys(this._mockDataSources).length === 0) {
      return '';
    }

    const lines = [];
    for (const [key, value] of Object.entries(this._mockDataSources)) {
      lines.push(`${key}: ${value}`);
    }

    return lines.join('\n');
  }

  _isEntityAvailable(entityId) {
    // @ts-ignore - TS2339: auto-suppressed
    return !!this.hass?.states?.[entityId];
  }

  _isDataSourceLive(dsId) {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) return false;

    const source = dsManager.getSource(dsId);
    return !!source;
  }

  _isThemeTokenResolved(token) {
    const themeManager = window.lcards?.core?.themeManager;
    if (!themeManager) return false;

    const theme = themeManager.getCurrentTheme?.();
    if (!theme) return false;

    // Simple check: navigate token path
    const parts = token.split('.');
    let current = theme;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return false;
      current = current[part];
    }

    return current !== undefined;
  }

  _getActiveThemeName() {
    const themeManager = window.lcards?.core?.themeManager;
    if (!themeManager) return 'No theme manager';

    const theme = themeManager.getCurrentTheme?.();
    return theme?.name || 'Unknown theme';
  }

  async _copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      lcardsLog.debug('[TemplateSandbox] Copied to clipboard');
    } catch (error) {
      lcardsLog.error('[TemplateSandbox] Failed to copy:', error);
    }
  }

  /**
   * Get DataSourceManager with mock fallback
   *
   * The singleton always exists (initialized at module load), but may have zero
   * configured sources in editor context. This wrapper adds mock fallback.
   *
   * @returns {Object} DataSourceManager with mock fallback
   * @private
   */
  _getDataSourceManagerWithMocks() {
    const realManager = window.lcards?.core?.dataSourceManager;

    if (!realManager) {
      // Singleton truly missing (shouldn't happen, but graceful degradation)
      lcardsLog.warn('[TemplateSandbox] DataSourceManager singleton not found (unexpected)');
      return this._createPureMockManager();
    }

    // Check if manager has any sources
    const sourcesCount = realManager.sources?.size || 0;
    const mockCount = Object.keys(this._mockDataSources || {}).length;

    lcardsLog.debug('[TemplateSandbox] DataSourceManager status:', {
      exists: true,
      sourcesCount,
      mockCount
    });

    // Wrap real manager to add mock fallback
    return {
      // Expose original manager properties
      sources: realManager.sources,

      // Override getSource to add mock fallback
      getSource: (sourceId) => {
        // Try real DataSource first
        const realSource = realManager.getSource(sourceId);
        if (realSource) {
          lcardsLog.debug(`[TemplateSandbox] Using REAL DataSource: ${sourceId}`);
          return realSource;
        }

        // Fall back to mock
        const mockValue = this._mockDataSources?.[sourceId];
        if (mockValue !== undefined) {
          lcardsLog.debug(`[TemplateSandbox] Using MOCK DataSource: ${sourceId}`, { value: mockValue });
          return this._createMockSource(sourceId, mockValue);
        }

        // Not found anywhere
        lcardsLog.debug(`[TemplateSandbox] DataSource NOT FOUND: ${sourceId}`);
        return null;
      }
    };
  }

  /**
   * Create pure mock manager when real singleton unavailable
   * @returns {Object} Mock DataSourceManager
   * @private
   */
  _createPureMockManager() {
    if (!this._mockDataSources || Object.keys(this._mockDataSources).length === 0) {
      lcardsLog.debug('[TemplateSandbox] No mock DataSources configured');
      return null;
    }

    lcardsLog.debug('[TemplateSandbox] Creating pure mock manager', {
      mockSources: Object.keys(this._mockDataSources)
    });

    return {
      sources: new Map(),
      getSource: (sourceId) => {
        const mockValue = this._mockDataSources[sourceId];
        if (mockValue === undefined) return null;

        return this._createMockSource(sourceId, mockValue);
      }
    };
  }

  /**
   * Create a mock DataSource instance
   * @param {string} sourceId - Source identifier
   * @param {*} value - Mock value
   * @returns {Object} Mock DataSource
   * @private
   */
  _createMockSource(sourceId, value) {
    return {
      id: sourceId,
      getCurrentData: () => ({
        v: value,
        value: value,
        t: Date.now(),
        metadata: {
          unit_of_measurement: typeof value === 'number' ? '' : undefined,
          source: 'mock'
        }
      }),
      subscribe: (callback) => {
        // Return no-op unsubscribe function
        return () => {};
      },
      unsubscribe: () => {},
      _isMock: true  // Flag for debugging
    };
  }

  /**
   * Diagnose evaluation failure and provide helpful feedback
   *
   * @param {Error} error - The error that occurred
   * @returns {Object} Diagnostic information
   * @private
   */
  _diagnoseFailure(error) {
    const deps = this._extractDependencies(this._templateInput);
    const realManager = window.lcards?.core?.dataSourceManager;

    // Check which DataSources are missing
    const missingDataSources = deps.datasources.filter(dsId => {
      const hasReal = realManager?.getSource(dsId);
      const hasMock = this._mockDataSources?.[dsId] !== undefined;
      return !hasReal && !hasMock;
    });

    // Check which entities are missing
    const missingEntities = deps.entities.filter(entityId => {
      // @ts-ignore - TS2339: auto-suppressed
      return !this.hass?.states?.[entityId];
    });

    // Generate helpful suggestion
    let suggestion = '';
    if (missingDataSources.length > 0) {
      suggestion = `Add mock values for: ${missingDataSources.join(', ')}`;
    } else if (missingEntities.length > 0) {
      suggestion = `Configure mock entity state for: ${missingEntities.join(', ')}`;
    } else if (error.message.includes('syntax')) {
      suggestion = 'Check template syntax - use {datasource:name}, {entity.state}, [[[JavaScript]]], or {{Jinja2}}';
    } else {
      suggestion = 'Template evaluation error - check syntax and dependencies';
    }

    return {
      missingDataSources,
      missingEntities,
      suggestion,
      hasDataSourceManager: !!realManager,
      dataSourceCount: realManager?.sources?.size || 0
    };
  }

  /**
   * Annotate dependencies with resolution status
   *
   * @param {Object} dependencies - Dependency object
   * @private
   */
  _annotateDependencyStatus(dependencies) {
    const realManager = window.lcards?.core?.dataSourceManager;

    // Annotate DataSources
    if (dependencies.datasources) {
      dependencies.datasources = dependencies.datasources.map(dsId => {
        const hasReal = !!realManager?.getSource(dsId);
        const hasMock = this._mockDataSources?.[dsId] !== undefined;

        return {
          id: dsId,
          status: hasReal ? 'live' : hasMock ? 'mock' : 'missing'
        };
      });
    }

    // Annotate entities
    if (dependencies.entities) {
      dependencies.entities = dependencies.entities.map(entityId => {
        // @ts-ignore - TS2339: auto-suppressed
        const available = !!this.hass?.states?.[entityId];

        return {
          id: entityId,
          status: available ? 'available' : 'mock'
        };
      });
    }
  }
}

customElements.define('lcards-template-sandbox', LCARdSTemplateSandbox);
