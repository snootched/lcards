/**
 * @fileoverview LCARdS Template Evaluation Tab
 *
 * Displays all templates and tokens found in card config with live evaluation results.
 * Helps users discover, debug, and utilize templates across all supported syntaxes:
 * - JavaScript: [[[...]]]
 * - LCARdS Tokens: {theme:...}, {datasource:...}, {ds:...}, {entity.state}, etc.
 * - Jinja2: {{...}}
 *
 * @element lcards-template-evaluation-tab
 * @property {Object} editor - Parent card editor instance
 * @property {Object} config - Full card configuration
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { TemplateDetector } from '../../../core/templates/TemplateDetector.js';
import { UnifiedTemplateEvaluator } from '../../../core/templates/UnifiedTemplateEvaluator.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { editorStyles } from '../../base/editor-styles.js';
import '../shared/lcards-message.js';
import '../shared/lcards-form-section.js';
import './lcards-template-sandbox.js';

export class LCARdSTemplateEvaluationTab extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      config: { type: Object },
      hass: { type: Object },
      _templates: { type: Array, state: true },
      _isEvaluating: { type: Boolean, state: true },
      _filterType: { type: String, state: true },
      _sandboxOpen: { type: Boolean, state: true },
      _sandboxInitialData: { type: Object, state: true }
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.config = undefined;
        /** @type {any} */
        this.hass = undefined;
    this._templates = [];
    this._isEvaluating = false;
    this._filterType = 'all';
    this._sandboxOpen = false;
    this._sandboxInitialData = null;
  }

  static get styles() {
    return [
      editorStyles,
      css`
        /* Templates list section */
        .templates-section {
          margin-top: 16px;
        }

      .templates-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr;
      }

      .template-card {
        background: var(--chip-background-color, var(--card-background-color));
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: box-shadow 0.2s, background 0.2s, border-color 0.2s;
      }

      .template-card:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-color: var(--primary-color);
      }

      /* Color-coded left borders by template type */
      .template-card.type-javascript {
        border-left: 4px solid #f7df1e;
      }

      .template-card.type-token {
        border-left: 4px solid #61dafb;
      }

      .template-card.type-theme {
        border-left: 4px solid #9c27b0;
      }

      .template-card.type-datasource {
        border-left: 4px solid #ff9800;
      }

      .template-card.type-jinja2 {
        border-left: 4px solid #b71c1c;
      }

      .template-card.type-error {
        border-left: 4px solid #f44336;
        background: rgba(244, 67, 54, 0.05);
      }

      .template-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .template-path {
        font-family: 'Courier New', monospace;
        color: var(--primary-color);
        font-size: 13px;
        font-weight: 500;
        word-break: break-all;
        flex: 1;
      }

      .template-type {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        flex-shrink: 0;
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      .card-actions ha-icon-button {
        --mdc-icon-button-size: 32px;
        --mdc-icon-size: 18px;
      }

      .template-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .template-section-label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        letter-spacing: 0.5px;
      }

      .template-raw {
        font-family: 'Courier New', monospace;
        background: var(--code-background-color, #282c34);
        color: var(--code-text-color, #abb2bf);
        padding: 12px;
        border-radius: 4px;
        font-size: 12px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
        line-height: 1.5;
        max-height: 120px;
      }

      .status-success { color: #4caf50; }
      .status-error { color: #f44336; }
      .status-warning { color: #ff9800; }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--secondary-text-color);
      }

      .loading-state {
        text-align: center;
        padding: 48px 24px;
      }

      .error-message {
        color: var(--error-color, #f44336);
        font-size: 12px;
        margin-top: 4px;
        padding: 8px;
        background: rgba(244, 67, 54, 0.1);
        border-radius: 4px;
      }
      `
    ];
  }

  firstUpdated() {
    this._discoverTemplates();
  }

  updated(changedProps) {
    if (changedProps.has('config')) {
      this._discoverTemplates();
    }
  }

  render() {
    return html`
      <div class="tab-content">
        ${this._renderLauncherCard()}
        ${this._renderTemplatesSection()}
      </div>
      ${this._renderSandbox()}
    `;
  }

  _renderLauncherCard() {
    const templateCount = this._templates.length;
    const syntaxTypes = [...new Set(this._templates.map(t => t.type))].length;

    return html`
      <div class="info-card">
        <div class="info-card-content">
          <h3>🧪 Template Sandbox</h3>
          <p>
            <strong>${templateCount} templates</strong> detected
            ${syntaxTypes > 0 ? html`<br /><strong>${syntaxTypes} syntax types</strong> in use` : ''}
          </p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Test and debug templates with live evaluation. Supports JavaScript <code>[[[...]]]</code>,
            Token <code>{...}</code>, and Jinja2 <code>{{...}}</code> syntax.
          </p>
        </div>
        <div class="info-card-actions">
          <ha-button
            class="open-sandbox-button"
            raised
            @click=${this._openSandbox}>
            <ha-icon icon="mdi:flask-outline" slot="start"></ha-icon>
            Open Sandbox
          </ha-button>
        </div>
      </div>
    `;
  }

  _renderTemplatesSection() {
    if (this._templates.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:text-search" style="font-size: 48px; opacity: 0.3;"></ha-icon>
          <p>No templates detected in card configuration</p>
        </div>
      `;
    }

    return html`
      <div class="templates-section">
        <h3>Templates in Config</h3>
        ${this._renderTemplatesTable()}
      </div>
    `;
  }

  _renderHeader() {
    return html`
      <div class="header-row">
        <h3>Template Discovery</h3>
        <ha-button @click=${this._openSandbox}>
          <ha-icon icon="mdi:flask-outline" slot="start"></ha-icon>
          🧪 Open Template Sandbox
        </ha-button>
      </div>
    `;
  }

  _renderSyntaxReference() {
    return html`
      <lcards-form-section
        header="Template & Token Syntax Reference"
        icon="mdi:information-outline"
        ?expanded=${false}>
        <div class="syntax-list">
          <div class="syntax-item">
            <code class="syntax-code">[[[...]]]</code>
            <span class="syntax-description">JavaScript expression — Evaluated client-side with access to entity, config, hass</span>
          </div>
          <div class="syntax-item">
            <code class="syntax-code">{theme:token.path}</code>
            <span class="syntax-description">LCARdS theme token — Single curly braces with <strong>theme:</strong> prefix</span>
          </div>
          <div class="syntax-item">
            <code class="syntax-code">{datasource:name}</code>
            <span class="syntax-description">LCARdS datasource token — Single curly braces with <strong>datasource:</strong> or <strong>ds:</strong> prefix</span>
          </div>
          <div class="syntax-item">
            <code class="syntax-code">{entity.state}</code>
            <span class="syntax-description">LCARdS simple token — Single curly braces for entity/config/variables paths</span>
          </div>
          <div class="syntax-item">
            <code class="syntax-code">{{...}}</code>
            <span class="syntax-description">Jinja2 template — Double curly braces, evaluated by Home Assistant (async)</span>
          </div>
        </div>
      </lcards-form-section>
    `;
  }

  _renderFilterBar() {
    const counts = this._getTypeCounts();

    const filters = [
      { label: 'All', value: 'all', count: counts.total },
      { label: 'JavaScript', value: 'javascript', count: counts.javascript },
      { label: 'Theme', value: 'theme', count: counts.theme },
      { label: 'Datasource', value: 'datasource', count: counts.datasource },
      { label: 'Token', value: 'token', count: counts.token },
      { label: 'Jinja2', value: 'jinja2', count: counts.jinja2 },
      { label: 'Errors', value: 'error', count: counts.error }
    ];

    return html`
      <div class="filter-chip-wrapper">
        ${filters.map(filter => html`
          <button
            class="lcards-chip ${this._filterType === filter.value ? 'selected' : ''}"
            @click=${() => this._filterType = filter.value}
            aria-pressed=${this._filterType === filter.value}>
            ${filter.label} (${filter.count})
          </button>
        `)}
      </div>
    `;
  }

  _renderTemplatesTable() {
    if (this._isEvaluating) {
      return html`
        <div class="loading-state">
          <ha-circular-progress active></ha-circular-progress>
          <p>Discovering and evaluating templates...</p>
        </div>
      `;
    }

    const filteredTemplates = this._getFilteredTemplates();

    if (filteredTemplates.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:code-braces"></ha-icon>
          <p>No templates found in configuration</p>
          <p style="font-size: 12px;">Templates will appear here when you use JavaScript expressions, tokens, or Jinja2 templates in your card config.</p>
        </div>
      `;
    }

    return html`
      <div class="templates-grid">
        ${filteredTemplates.map(template => this._renderTemplateCard(template))}
      </div>
    `;
  }

  _renderTemplateCard(template) {
    const typeClass = `type-${template.type.toLowerCase()}`;

    return html`
      <div class="template-card ${typeClass}">
        <div class="template-card-header">
          <div class="template-path">${template.path}</div>
          <span class="template-type ${typeClass}">${template.type}</span>
          <div class="card-actions">
            <ha-icon-button
              .label=${'Copy Template'}
              @click=${(e) => this._copyToClipboard(template.raw, e)}>
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              .label=${'Test in Sandbox'}
              @click=${() => this._testInSandbox(template)}>
              <ha-icon icon="mdi:flask-outline"></ha-icon>
            </ha-icon-button>
          </div>
        </div>

        <div class="template-section">
          <div class="template-section-label">Template</div>
          <div class="template-raw">${template.raw}</div>
        </div>
      </div>
    `;
  }

  _getTypeCounts() {
    return {
      total: this._templates.length,
      javascript: this._templates.filter(t => t.type === 'JavaScript').length,
      theme: this._templates.filter(t => t.type === 'Theme').length,
      datasource: this._templates.filter(t => t.type === 'Datasource').length,
      token: this._templates.filter(t => t.type === 'Token').length,
      jinja2: this._templates.filter(t => t.type === 'Jinja2').length,
      error: this._templates.filter(t => t.type === 'Error').length
    };
  }

  _getFilteredTemplates() {
    if (this._filterType === 'all') {
      return this._templates;
    }

    const typeMap = {
      'javascript': 'JavaScript',
      'theme': 'Theme',
      'datasource': 'Datasource',
      'token': 'Token',
      'jinja2': 'Jinja2',
      'error': 'Error'
    };

    return this._templates.filter(t => t.type === typeMap[this._filterType]);
  }

  /**
   * Recursively scan config for all templates and tokens
   */
  async _discoverTemplates() {
    // @ts-ignore - TS2339: auto-suppressed
    if (!this.config) {
      this._templates = [];
      return;
    }

    this._isEvaluating = true;
    this.requestUpdate();

    try {
      const templates = [];
      // @ts-ignore - TS2339: auto-suppressed
      this._scanObject(this.config, '', templates);

      // Evaluate all templates
      await this._evaluateTemplates(templates);

      this._templates = templates;
    } catch (error) {
      lcardsLog.error('[TemplateEvaluationTab] Error discovering templates:', error);
      this._templates = [];
    } finally {
      this._isEvaluating = false;
      this.requestUpdate();
    }
  }

  /**
   * Validate token syntax and provide helpful error messages
   */
  _validateTokenSyntax(str) {
    const errors = [];

    // Check for double braces with theme prefix (wrong: {{theme:...}})
    if (/\{\{theme:/.test(str)) {
      errors.push({
        pattern: /\{\{theme:[^}]+\}\}/g,
        message: 'Wrong syntax: {{theme:...}} should be {theme:...} (single braces)',
        suggestion: 'Use single curly braces: {theme:token.path}'
      });
    }

    // Check for missing colon (wrong: {theme.colors})
    if (/\{theme\./.test(str)) {
      errors.push({
        pattern: /\{theme\.[^}]+\}/g,
        message: 'Wrong syntax: {theme.colors} should be {theme:colors} (colon, not dot)',
        suggestion: 'Use colon after prefix: {theme:colors.primary}'
      });
    }

    // Check for datasource with dot instead of colon
    if (/\{(?:datasource|ds)\./.test(str)) {
      errors.push({
        pattern: /\{(?:datasource|ds)\.[^}]+\}/g,
        message: 'Wrong syntax: {datasource.name} should be {datasource:name} (colon, not dot)',
        suggestion: 'Use colon after prefix: {datasource:sensor_data}'
      });
    }

    // Check for ambiguous tokens without prefix (colors, spacing, etc.)
    const ambiguousTokens = /\{(colors|spacing|typography|borders|effects|animations|components)\./.test(str);
    if (ambiguousTokens) {
      errors.push({
        pattern: /\{(colors|spacing|typography|borders|effects|animations|components)\.[^}]+\}/g,
        message: 'Ambiguous syntax: missing theme: prefix',
        suggestion: 'Add theme: prefix for clarity: {theme:colors.primary}'
      });
    }

    return errors;
  }

  /**
   * Recursively scan object for template strings
   */
  _scanObject(obj, path, templates) {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string') {
        this._checkForTemplates(value, currentPath, templates);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayPath = `${currentPath}[${index}]`;
          if (typeof item === 'string') {
            this._checkForTemplates(item, arrayPath, templates);
          } else if (typeof item === 'object') {
            this._scanObject(item, arrayPath, templates);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        this._scanObject(value, currentPath, templates);
      }
    }
  }

  /**
   * Check if string contains templates and categorize them
   */
  _checkForTemplates(str, path, templates) {
    if (!str || typeof str !== 'string') return;

    // Validate token syntax and flag errors
    const validationErrors = this._validateTokenSyntax(str);
    if (validationErrors.length > 0) {
      validationErrors.forEach(errorInfo => {
        const matches = str.matchAll(errorInfo.pattern);
        for (const match of matches) {
          templates.push({
            path,
            type: 'Error',
            raw: match[0],
            fullString: str,
            result: errorInfo.message,
            error: errorInfo.suggestion,
            status: 'status-error'
          });
        }
      });
    }

    const types = TemplateDetector.detectTemplateTypes(str);

    // JavaScript templates
    if (types.hasJavaScript) {
      const matches = str.matchAll(/\[\[\[([\s\S]*?)\]\]\]/g);
      for (const match of matches) {
        templates.push({
          path,
          type: 'JavaScript',
          raw: match[0],
          fullString: str,
          result: null,
          error: null,
          status: 'status-warning'
        });
      }
    }

    // Theme tokens
    if (str.includes('{theme:')) {
      const matches = str.matchAll(/\{theme:([^}]+)\}/g);
      for (const match of matches) {
        templates.push({
          path,
          type: 'Theme',
          raw: match[0],
          fullString: str,
          result: null,
          error: null,
          status: 'status-warning'
        });
      }
    }

    // Datasource tokens
    if (str.includes('{datasource:') || str.includes('{ds:')) {
      const matches = str.matchAll(/\{(?:datasource|ds):([^}]+)\}/g);
      for (const match of matches) {
        templates.push({
          path,
          type: 'Datasource',
          raw: match[0],
          fullString: str,
          result: null,
          error: null,
          status: 'status-warning'
        });
      }
    }

    // Simple tokens (excluding theme, datasource, and jinja2)
    if (types.hasTokens && !types.hasJinja2) {
      // More careful regex to match simple tokens like {entity.state}
      // but exclude theme:, datasource:, ds:, and Jinja2 {{
      const tokenRegex = /\{(?!theme:)(?!datasource:)(?!ds:)(?!\{)([^{}]+)\}/g;
      let match;
      while ((match = tokenRegex.exec(str)) !== null) {
        templates.push({
          path,
          type: 'Token',
          raw: match[0],
          fullString: str,
          result: null,
          error: null,
          status: 'status-warning'
        });
      }
    }

    // Jinja2 templates
    if (types.hasJinja2) {
      const matches = str.matchAll(/\{\{([^}]+)\}\}/g);
      for (const match of matches) {
        templates.push({
          path,
          type: 'Jinja2',
          raw: match[0],
          fullString: str,
          result: null,
          error: null,
          status: 'status-warning'
        });
      }
    }
  }

  /**
   * Evaluate all discovered templates
   */
  async _evaluateTemplates(templates) {
    const entity = this._getEntity();
    const themeManager = window.lcards?.core?.themeManager;
    const dataSourceManager = window.lcards?.core?.dataSourceManager;

    for (const template of templates) {
      try {
        // For Jinja2 templates, don't auto-evaluate (requires Home Assistant server)
        if (template.type === 'Jinja2') {
          template.result = '⏳ Not evaluated (use Test button)';
          template.status = 'status-warning';
          template.note = 'Jinja2 templates evaluate server-side. Use HA template editor to test.';
          continue;
        }

        // Use UnifiedTemplateEvaluator with proper context
        // Note: This follows the same pattern as LCARdSCard.processTemplate() but adapted for editor context
        const evaluator = new UnifiedTemplateEvaluator({
          // @ts-ignore - TS2339: auto-suppressed
          hass: this.hass,
          context: {
            entity,
            // @ts-ignore - TS2339: auto-suppressed
            config: this.config,
            // @ts-ignore - TS2339: auto-suppressed
            hass: this.hass,
            theme: themeManager?.getActiveTheme?.(),
            // Note: NO 'variables' property - this was legacy custom-button-card only
          },
          dataSourceManager
        });

        // Evaluate the template
        const result = evaluator.evaluateSync(template.fullString);
        const resultStr = String(result);

        // Use TemplateDetector to check if result still contains template syntax
        const resultTypes = TemplateDetector.detectTemplateTypes(resultStr);
        const stillHasTemplates = resultTypes.hasJavaScript || resultTypes.hasTokens ||
                                  resultTypes.hasDatasources || resultTypes.hasMSD;
        const isEmpty = resultStr === '' || resultStr.trim() === '';

        if (stillHasTemplates) {
          template.result = resultStr;
          template.error = 'Template not resolved - check if datasource/token exists';
          template.status = 'status-error';
        } else if (isEmpty && template.raw.trim() !== '') {
          template.result = '(empty)';
          template.error = 'Evaluated to empty - token/datasource not found';
          template.status = 'status-error';
        } else {
          template.result = resultStr;
          template.status = 'status-success';
        }
      } catch (error) {
        template.error = error.message;
        template.status = 'status-error';
        lcardsLog.warn('[TemplateEvaluationTab] Template evaluation failed:', template.raw, error);
      }
    }
  }

  /**
   * Get the entity from config if available
   */
  _getEntity() {
    // @ts-ignore - TS2339: auto-suppressed
    const entityId = this.config?.entity;
    // @ts-ignore - TS2339: auto-suppressed
    if (!entityId || !this.hass?.states) {
      return null;
    }
    // @ts-ignore - TS2339: auto-suppressed
    return this.hass.states[entityId];
  }

  /**
   * Copy text to clipboard with visual feedback
   */
  async _copyToClipboard(text, event) {
    try {
      await navigator.clipboard.writeText(text);

      // Show success feedback on the icon button that was clicked
      const button = event.target.closest('ha-icon-button');
      if (button) {
        const iconElement = button.querySelector('ha-icon');
        if (iconElement) {
          const originalIcon = iconElement.icon;
          iconElement.icon = 'mdi:check';
          iconElement.style.color = 'var(--success-color, #4caf50)';

          setTimeout(() => {
            iconElement.icon = originalIcon;
            iconElement.style.color = '';
          }, 2000);
        }
      }
    } catch (error) {
      lcardsLog.error('[TemplateEvaluationTab] Failed to copy to clipboard:', error);

      // Show error feedback
      const button = event.target.closest('ha-icon-button');
      if (button) {
        const iconElement = button.querySelector('ha-icon');
        if (iconElement) {
          const originalIcon = iconElement.icon;
          iconElement.icon = 'mdi:alert-circle';
          iconElement.style.color = 'var(--error-color, #f44336)';

          setTimeout(() => {
            iconElement.icon = originalIcon;
            iconElement.style.color = '';
          }, 2000);
        }
      }
    }
  }

  /**
   * Render the template sandbox modal
   */
  _renderSandbox() {
    return html`
      <lcards-template-sandbox
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}
        // @ts-ignore - TS2339: auto-suppressed
        .config=${this.config}
        .open=${this._sandboxOpen}
        .initialData=${this._sandboxInitialData}
        @sandbox-closed=${this._handleSandboxClosed}>
      </lcards-template-sandbox>
    `;
  }

  /**
   * Open the template sandbox with optional initial data
   */
  _openSandbox(initialData = null) {
    this._sandboxInitialData = initialData;
    this._sandboxOpen = true;
  }

  /**
   * Test a template in the sandbox
   */
  _testInSandbox(template) {
    // @ts-ignore - TS2339: auto-suppressed
    const entityId = this.config?.entity || 'light.example';
    this._openSandbox({
      template: template.raw,
      mockEntity: entityId
    });
  }

  /**
   * Handle sandbox closed event
   */
  _handleSandboxClosed() {
    this._sandboxOpen = false;
    this._sandboxInitialData = null;
  }
}

customElements.define('lcards-template-evaluation-tab', LCARdSTemplateEvaluationTab);
