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
      _selectedLiveDataSource: { type: String, state: true }
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
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        border: 1px solid var(--divider-color);
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
          <select class="example-select" @change=${this._handleExampleSelect}>
            <option value="">-- Select an example --</option>
            ${getExampleIds().map(id => {
              const example = EXAMPLE_TEMPLATES[id];
              return html`<option value=${id}>${example.name}</option>`;
            })}
          </select>
        </div>

        <div>
          <div class="context-label">Template</div>
          <textarea
            class="template-input"
            .value=${this._templateInput}
            @input=${this._handleTemplateInput}
            placeholder="Enter template here...&#10;Examples:&#10;  {entity.state}&#10;  [[[return entity.state]]]&#10;  {datasource:sensor.temp}&#10;  {{states('sensor.temp')}}">
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

    return html`
      <div class="sandbox-panel">
        <div class="panel-header">
          <ha-icon icon="mdi:cog"></ha-icon>
          <span>Context</span>
        </div>

        <!-- Mock Entity Configuration -->
        <div class="context-section">
          <div class="context-label">Mock Entity</div>
          <input
            type="text"
            class="entity-input"
            .value=${this._mockEntityId}
            @input=${this._handleEntityIdInput}
            placeholder="entity.domain_name">
          
          <div class="context-label">Quick State</div>
          <div class="state-picker">
            ${this._renderQuickStatePickers()}
          </div>

          <div class="context-label">Entity State (YAML)</div>
          <textarea
            class="yaml-editor"
            .value=${this._serializeState()}
            @input=${this._handleStateYamlInput}
            placeholder="state: on&#10;attributes:&#10;  brightness: 200">
          </textarea>
        </div>

        <!-- Live DataSource Selector -->
        ${dsManager && liveDataSources.length > 0 ? html`
          <div class="context-section">
            <div class="context-label">Live DataSources</div>
            <select
              class="example-select"
              @change=${this._handleDataSourceSelect}>
              <option value="">-- Available DataSources --</option>
              ${liveDataSources.map(ds => html`
                <option value=${ds.id}>${ds.id}</option>
              `)}
            </select>

            ${this._selectedLiveDataSource ? this._renderDataSourceInfo() : ''}
          </div>
        ` : html`
          <div class="context-section">
            <div class="context-label">Live DataSources</div>
            <div style="color: var(--secondary-text-color); font-size: 12px;">
              No DataSources configured
            </div>
          </div>
        `}

        <!-- Theme Info -->
        <div class="context-section">
          <div class="context-label">Active Theme</div>
          <div style="font-size: 12px; color: var(--secondary-text-color);">
            ${this._getActiveThemeName()}
          </div>
        </div>
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
              ${dependencies.entities.map(entityId => {
                const available = this._isEntityAvailable(entityId);
                return html`
                  <li class="dep-item ${available ? 'available' : 'unavailable'}">
                    <span class="dep-name">${entityId}</span>
                    <span class="dep-status">
                      ${available ? '✅ Available' : '❌ Not found'}
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
              ${dependencies.datasources.map(dsId => {
                const isLive = this._isDataSourceLive(dsId);
                const isMock = this._mockDataSources[dsId] !== undefined;
                return html`
                  <li class="dep-item ${isLive ? 'live' : isMock ? 'mock' : 'unavailable'}">
                    <span class="dep-name">{datasource:${dsId}}</span>
                    <span class="dep-status">
                      ${isLive ? '⚡ Live' : isMock ? '🔸 Mock' : '❌ Not found'}
                    </span>
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
      const dataSourceManager = window.lcards?.core?.dataSourceManager;

      // Create evaluator
      const evaluator = new UnifiedTemplateEvaluator({
        hass: this.hass,
        context: {
          entity: mockEntity,
          config: this.config || {},
          hass: this.hass,
          theme: themeManager?.getCurrentTheme?.()
        },
        dataSourceManager
      });

      // Evaluate template
      const result = await evaluator.evaluateAsync(this._templateInput);
      const evalTime = (performance.now() - startTime).toFixed(2);

      // Extract dependencies
      const dependencies = this._extractDependencies(this._templateInput);

      this._evaluationResult = {
        success: true,
        result: String(result),
        evalTime,
        dependencies,
        types: TemplateDetector.detectTemplateTypes(this._templateInput)
      };

    } catch (error) {
      const evalTime = (performance.now() - startTime).toFixed(2);
      this._evaluationResult = {
        success: false,
        error: error.message,
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
    // Return real entity if available in hass
    if (this.hass?.states?.[this._mockEntityId]) {
      return this.hass.states[this._mockEntityId];
    }

    // Otherwise return mock entity
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
}

customElements.define('lcards-template-sandbox', LCARdSTemplateSandbox);
