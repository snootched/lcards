/**
 * LCARdS Template Sandbox
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
      _useMockEntity: { type: Boolean, state: true }
    };
  }

  constructor() {
    super();
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

      .sandbox-content {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
        min-height: 600px;
        max-height: 80vh;
        padding: 16px;
      }

      @media (max-width: 1200px) {
        .sandbox-content {
          grid-template-columns: 1fr;
          max-height: none;
        }
      }

      .sandbox-panel {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 12px;
        border: 2px solid var(--divider-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
        color: var(--primary-text-color);
        padding-bottom: 8px;
        border-bottom: 2px solid var(--divider-color);
      }

      .panel-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--primary-color);
      }

      /* Input Panel */
      .template-input {
        width: 100%;
        min-height: 120px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--code-background-color, #282c34);
        color: var(--code-text-color, #abb2bf);
        resize: vertical;
      }

      .template-input:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .template-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .template-type-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        background: var(--primary-color);
        color: white;
      }

      .example-select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
      }

      /* Context Panel */
      .context-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
      }

      .context-label {
        font-weight: 500;
        font-size: 13px;
        color: var(--primary-text-color);
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 500;
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

      .entity-state-display {
        padding: 12px;
        background: var(--code-background-color, #282c34);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--code-text-color, #abb2bf);
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
        margin-bottom: 4px;
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

      .theme-info {
        padding: 8px 12px;
        background: var(--code-background-color, #282c34);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        font-size: 13px;
        color: var(--code-text-color, #abb2bf);
      }

      .entity-input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
      }

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

      .yaml-editor {
        width: 100%;
        min-height: 80px;
        padding: 8px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--code-background-color, #282c34);
        color: var(--code-text-color, #abb2bf);
        resize: vertical;
      }

      .datasource-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        background: var(--primary-color);
        color: white;
        border-radius: 4px;
        font-size: 12px;
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

      /* Output Panel */
      .result-display {
        padding: 12px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        word-break: break-word;
        min-height: 60px;
        border: 2px solid var(--divider-color);
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
        margin-bottom: 8px;
        font-weight: 600;
      }

      .status-icon {
        font-size: 20px;
      }

      .eval-time {
        margin-left: auto;
        font-size: 11px;
        color: var(--secondary-text-color);
      }

      .dependency-tree {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .dep-section {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 8px;
      }

      .dep-section h5 {
        margin: 0 0 8px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--primary-text-color);
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
        padding: 6px 8px;
        margin-bottom: 4px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        font-size: 12px;
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
      }

      .dep-status {
        font-size: 11px;
        color: var(--secondary-text-color);
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        color: var(--secondary-text-color);
      }

      .info-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-radius: 4px;
        font-size: 13px;
        margin-bottom: 12px;
      }

      .info-banner.mock {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid #ff9800;
        color: #ff9800;
      }

      .diagnostics-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .diagnostic-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 4px;
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

      ha-button {
        --mdc-theme-primary: var(--primary-color);
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
    return html`
      <lcards-dialog
        .open=${this.open}
        .heading=${'🧪 Template Sandbox'}
        @closed=${this._handleClose}>

        <div class="sandbox-content">
          ${this._renderInputPanel()}
          ${this._renderContextPanel()}
          ${this._renderOutputPanel()}
        </div>

        <div slot="primaryAction">
          <ha-button @click=${this._handleClose}>
            Close
          </ha-button>
        </div>
      </lcards-dialog>
    `;
  }

  _renderInputPanel() {
    const types = TemplateDetector.detectTemplateTypes(this._templateInput);
    const typeLabels = [];
    if (types.hasJavaScript) typeLabels.push('JS');
    if (types.hasTokens) typeLabels.push('Token');
    if (types.hasDatasources) typeLabels.push('DataSource');
    if (types.hasJinja2) typeLabels.push('Jinja2');

    const charCount = this._templateInput.length;
    const lineCount = this._templateInput.split('\n').length;

    return html`
      <div class="sandbox-panel">
        <div class="panel-header">
          <ha-icon icon="mdi:code-braces"></ha-icon>
          <span>Template Input</span>
        </div>

        <div>
          <div class="context-label">Example Templates</div>
          ${customElements.get('ha-selector') ? html`
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: getExampleIds().map(id => ({
                    value: id,
                    label: EXAMPLE_TEMPLATES[id].name
                  }))
                }
              }}
              .value=${''}
              @value-changed=${(e) => this._handleExampleSelectHA(e)}>
            </ha-selector>
          ` : html`
            <select class="example-select" @change=${this._handleExampleSelect}>
              <option value="">-- Select an example --</option>
              ${getExampleIds().map(id => {
                const example = EXAMPLE_TEMPLATES[id];
                return html`<option value=${id}>${example.name}</option>`;
              })}
            </select>
          `}
        </div>

        <div>
          <div class="context-label">Template</div>
          <textarea
            class="template-input"
            .value=${this._templateInput}
            @input=${this._handleTemplateInput}
            placeholder="Enter template here...&#10;Examples:&#10;  {entity.state}&#10;  [[[return entity.state]]]&#10;  {datasource:sensor_temp:.1f}&#10;  {{states('sensor.temp')}}">
          </textarea>
        </div>

        <div class="template-meta">
          <div>
            ${typeLabels.length > 0 ? html`
              <span class="template-type-badge">
                ${typeLabels.join(' + ')}
              </span>
            ` : html`<span style="color: var(--secondary-text-color);">No templates detected</span>`}
          </div>
          <div>${lineCount} lines, ${charCount} chars</div>
        </div>

        <ha-button @click=${() => this._evaluateTemplate()}>
          <ha-icon icon="mdi:play" slot="icon"></ha-icon>
          Evaluate Now
        </ha-button>
      </div>
    `;
  }

  _renderContextPanel() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    const liveDataSources = this._liveDataSources;
    const isEntityLive = !!this.hass?.states?.[this._mockEntityId];
    const entityState = isEntityLive ? this.hass.states[this._mockEntityId] : this._mockState;
    const hasEntityPicker = customElements.get('ha-entity-picker');

    return html`
      <div class="sandbox-panel">
        <div class="panel-header">
          <ha-icon icon="mdi:cog"></ha-icon>
          <span>Context</span>
        </div>

        <!-- Entity Configuration -->
        <lcards-form-section
          header="Entity"
          .expanded=${true}
          .outlined=${false}
          .secondary=${isEntityLive ? '⚡ Live' : '🔸 Mock'}>

          <div class="form-row">
            <label class="form-label">
              Entity ID
              <label class="toggle-label">
                <input
                  type="checkbox"
                  .checked=${this._useMockEntity}
                  @change=${(e) => { this._useMockEntity = e.target.checked; }}>
                Use Mock Entity
              </label>
            </label>
            ${!this._useMockEntity && hasEntityPicker ? html`
              <ha-entity-picker
                .hass=${this.hass}
                .value=${this._mockEntityId}
                @value-changed=${(e) => this._handleEntityPickerChange(e)}>
              </ha-entity-picker>
            ` : html`
              <input
                type="text"
                class="entity-input"
                .value=${this._mockEntityId}
                @input=${this._handleEntityIdInput}
                placeholder="light.kitchen">
            `}
          </div>

          ${isEntityLive && !this._useMockEntity ? html`
            <!-- Show real entity state (read-only) -->
            <div class="form-row">
              <label class="form-label">State (Live)</label>
              <div class="entity-state-display">
                <div class="state-line"><strong>State:</strong> ${entityState.state}</div>
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

            <!-- Attribute selector for template insertion -->
            ${Object.keys(entityState.attributes || {}).length > 0 ? html`
              <div class="form-row">
                <label class="form-label">Insert Attribute</label>
                <select
                  class="example-select"
                  @change=${(e) => this._insertAttributeToken(e)}>
                  <option value="">-- Select attribute --</option>
                  ${Object.keys(entityState.attributes).map(key => html`
                    <option value=${key}>${key}</option>
                  `)}
                </select>
              </div>
            ` : ''}
          ` : ''}
        </lcards-form-section>

        <!-- Mock Entity Configuration -->
        ${this._useMockEntity ? html`
          <lcards-form-section
            header="Mock Entity Configuration"
            .expanded=${true}
            .outlined=${false}>

            <div class="form-row">
              <label class="form-label">Quick State</label>
              <div class="state-picker">
                ${this._renderQuickStatePickers()}
              </div>
            </div>

            <div class="form-row">
              <label class="form-label">Entity State (YAML)</label>
              <textarea
                class="yaml-editor"
                .value=${this._serializeState()}
                @input=${this._handleStateYamlInput}
                placeholder="state: on&#10;attributes:&#10;  brightness: 200">
              </textarea>
            </div>
          </lcards-form-section>
        ` : ''}

        <!-- Mock DataSources Configuration -->
        <lcards-form-section
          header="Mock DataSources"
          description="DataSource IDs use underscores (e.g., sensor_temp)"
          .expanded=${true}
          .outlined=${false}>

          <div class="form-row">
            <textarea
              class="yaml-editor"
              .value=${this._serializeMockDataSources()}
              @input=${this._handleMockDataSourcesInput}
              placeholder="sensor_temp: 20&#10;cpu_usage: 45&#10;power_total: 1234.5">
            </textarea>
          </div>
        </lcards-form-section>

        <!-- Live DataSources -->
        ${dsManager && liveDataSources.length > 0 ? html`
          <lcards-form-section
            header="Live DataSources"
            .expanded=${false}
            .outlined=${false}
            .count=${liveDataSources.length}>

            <div class="form-row">
              <label class="form-label">Select DataSource</label>
              <select
                class="example-select"
                @change=${this._handleDataSourceSelect}>
                <option value="">-- Available DataSources --</option>
                ${liveDataSources.map(ds => html`
                  <option value=${ds.id}>${ds.id}</option>
                `)}
              </select>
            </div>

            ${this._selectedLiveDataSource ? html`
              <div class="form-row">
                ${this._renderDataSourceInfo()}
              </div>
            ` : ''}
          </lcards-form-section>
        ` : ''}
      </div>
    `;
  }

  _renderOutputPanel() {
    if (this._isEvaluating) {
      return html`
        <div class="sandbox-panel">
          <div class="panel-header">
            <ha-icon icon="mdi:check-circle"></ha-icon>
            <span>Output</span>
          </div>
          <div class="loading-indicator">
            <ha-circular-progress active></ha-circular-progress>
            <span>Evaluating...</span>
          </div>
        </div>
      `;
    }

    if (!this._evaluationResult) {
      return html`
        <div class="sandbox-panel">
          <div class="panel-header">
            <ha-icon icon="mdi:check-circle"></ha-icon>
            <span>Output</span>
          </div>
          <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
            Enter a template and click "Evaluate Now" to see results
          </div>
        </div>
      `;
    }

    const result = this._evaluationResult;
    const statusClass = result.success ? 'success' : 'error';
    const statusIcon = result.success ? '✅' : '❌';

    return html`
      <div class="sandbox-panel">
        <div class="panel-header">
          <ha-icon icon="mdi:check-circle"></ha-icon>
          <span>Output</span>
        </div>

        <!-- Using Mock DataSources Warning -->
        ${result.usingMockDataSources ? html`
          <div class="info-banner mock">
            <ha-icon icon="mdi:test-tube"></ha-icon>
            <span>Using mock DataSources (live DataSourceManager has no configured sources)</span>
          </div>
        ` : ''}

        <!-- Result Display -->
        <div>
          <div class="context-label">Result</div>
          <div class="result-display ${statusClass}">
            <div class="result-header">
              <span class="status-icon">${statusIcon}</span>
              <span>${result.success ? 'Success' : 'Error'}</span>
              ${result.evalTime ? html`
                <span class="eval-time">${result.evalTime}ms</span>
              ` : ''}
            </div>
            <div>${result.success ? result.result : result.error}</div>
          </div>
        </div>

        <!-- Diagnostic Information (for errors) -->
        ${!result.success && result.diagnostics ? html`
          <div class="diagnostics-panel">
            <div class="context-label">Diagnostics</div>

            ${result.diagnostics.missingDataSources?.length > 0 ? html`
              <div class="diagnostic-item error">
                <ha-icon icon="mdi:database-off"></ha-icon>
                <div>
                  <strong>Missing DataSources:</strong><br>
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
        ` : ''}

        <!-- Dependency Tree -->
        ${result.dependencies ? this._renderDependencyTree(result.dependencies) : ''}

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ha-button
            @click=${() => this._copyToClipboard(result.result)}>
            <ha-icon icon="mdi:content-copy" slot="icon"></ha-icon>
            Copy Result
          </ha-button>
          <ha-button
            @click=${() => this._copyToClipboard(this._templateInput)}>
            <ha-icon icon="mdi:code-braces" slot="icon"></ha-icon>
            Copy Template
          </ha-button>
        </div>
      </div>
    `;
  }

  _renderQuickStatePickers() {
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
            <h5>📊 DataSources</h5>
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
    this._templateInput = e.target.value;
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
    try {
      // Simple YAML-like parsing
      const lines = e.target.value.split('\n');
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
    try {
      // Simple key: value parsing (one per line)
      const lines = e.target.value.split('\n');
      const mockDataSources = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.includes(':')) {
          const colonIndex = trimmed.indexOf(':');
          const key = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1).trim();

          // Try to parse as number
          const numValue = parseFloat(value);
          mockDataSources[key] = isNaN(numValue) ? value : numValue;
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

      // ✅ Use wrapper manager with mock fallback
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
        hass: this.hass,
        context: {
          entity: mockEntity,
          config: this.config || {},
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

      this._evaluationResult = {
        success: true,
        result: String(result),
        evalTime,
        dependencies,
        types: TemplateDetector.detectTemplateTypes(this._templateInput),
        usingMockDataSources: mockSourcesCount > 0 && realSourcesCount === 0
      };

      lcardsLog.debug('[TemplateSandbox] Evaluation success', {
        result: String(result),
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
    if (this.hass?.states?.[this._mockEntityId]) {
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
