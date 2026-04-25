/**
 * @fileoverview LCARdS Layouts Tab
 *
 * Panel tab for the Layout Wizard. Lets users choose a layout strategy,
 * configure its parameters, preview the generated YAML, and copy it to
 * the clipboard. Uses the same HA-native controls and design conventions
 * as the other LCARdS config panel tabs (sound, storage, etc.).
 *
 * @element lcards-layouts-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSPanelViewStrategy } from '../../strategies/lcards-panel-strategy.js';
import '../../editor/components/shared/lcards-form-section.js';

// ============================================================================
// MINIMAL YAML SERIALIZER
// ============================================================================

function _toYaml(value, indent = 0) {
  const pad = '  '.repeat(indent);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);

  if (typeof value === 'string') {
    if (
      /^(true|false|null)$/.test(value) ||
      /^[0-9]/.test(value) ||
      /[:#[\]{}&*!|>'"%@`]/.test(value) ||
      value.includes('\n')
    ) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return value
      .map(item => {
        if (item !== null && typeof item === 'object') {
          const innerPad = '  '.repeat(indent + 1);
          const lines = _toYaml(item, indent + 1).split('\n');
          // Strip the extra indentation from the first key so it sits flush after "- "
          const firstContent = lines[0].startsWith(innerPad)
            ? lines[0].slice(innerPad.length)
            : lines[0];
          return `${pad}- ${firstContent}\n${lines.slice(1).join('\n')}`;
        }
        return `${pad}- ${_toYaml(item, indent)}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    return keys
      .map(k => {
        const v = value[k];
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) {
          return `${pad}${k}:\n${_toYaml(v, indent + 1)}`;
        }
        if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
          return `${pad}${k}:\n${_toYaml(v, indent + 1)}`;
        }
        return `${pad}${k}: ${_toYaml(v, indent)}`;
      })
      .join('\n');
  }

  return String(value);
}

// ============================================================================
// STRATEGY DEFINITIONS
// ============================================================================

const STRATEGIES = [
  {
    id:          'lcards-panel',
    label:       'LCARS Panel',
    icon:        'mdi:view-dashboard-outline',
    description: 'Full-width panel with a sidebar elbow, header bar, content grid, and end-cap — the standard layout for a single system panel.',
    strategy:    LCARdSPanelViewStrategy,
    params: [
      {
        key:          'mode',
        label:        'Mode',
        hint:         'Scaffold gives you the pre-wired grid to fill yourself. Auto populates cards from your HA areas.',
        type:         'select',
        selector:     { select: { options: [
          { value: 'scaffold', label: 'Scaffold — empty grid structure' },
          { value: 'auto',     label: 'Auto — populate from HA areas & entities' },
        ], mode: 'dropdown' } },
        defaultValue: 'scaffold',
      },
      {
        key:          'columns',
        label:        'Content Columns',
        hint:         'Number of equal-width columns in the main content area.',
        type:         'number',
        selector:     { number: { min: 1, max: 6, step: 1, mode: 'box' } },
        defaultValue: 2,
      },
      {
        key:          'header_height',
        label:        'Header Height',
        hint:         'Height of the top header row — use viewport (vh) or fr units.',
        type:         'text',
        selector:     { text: {} },
        defaultValue: '10vh',
      },
      {
        key:          'sidebar_width',
        label:        'Sidebar Width',
        hint:         'Width of the left sidebar / elbow column.',
        type:         'text',
        selector:     { text: {} },
        defaultValue: '15vw',
      },
      {
        key:          'endcap_width',
        label:        'End-cap Width',
        hint:         'Width of the right end-cap column.',
        type:         'text',
        selector:     { text: {} },
        defaultValue: '6vw',
      },
      {
        key:          'gap',
        label:        'Grid Gap',
        hint:         'Gap between grid cells.',
        type:         'text',
        selector:     { text: {} },
        defaultValue: '0.4vw',
      },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export class LCARdSLayoutsTab extends LitElement {

  static properties = {
    hass:              { type: Object },
    _selectedStrategy: { type: String,  state: true },
    _params:           { type: Object,  state: true },
    _generatedYaml:    { type: String,  state: true },
    _generating:       { type: Boolean, state: true },
    _copyFeedback:     { type: Boolean, state: true },
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._selectedStrategy = STRATEGIES[0].id;
    this._params = {};
    this._generating = false;
    this._copyFeedback = false;
    this._generatedYaml = '';
    this._initParams(STRATEGIES[0]);
  }

  _initParams(strategyDef) {
    const defaults = {};
    for (const p of (strategyDef.params ?? [])) defaults[p.key] = p.defaultValue;
    this._params = defaults;
  }

  _getStrategyDef(id) {
    return STRATEGIES.find(s => s.id === id) ?? STRATEGIES[0];
  }

  _selectStrategy(id) {
    this._selectedStrategy = id;
    this._initParams(this._getStrategyDef(id));
    this._generatedYaml = '';
  }

  _handleParamChange(key, e) {
    e.stopPropagation();
    this._params = { ...this._params, [key]: e.detail.value };
    this._generatedYaml = '';
  }

  async _handleGenerate() {
    const strategyDef = this._getStrategyDef(this._selectedStrategy);
    this._generating = true;
    this._generatedYaml = '';
    this.requestUpdate();

    try {
      const result = await strategyDef.strategy.generate(
        { config: this._params },
        this.hass,
      );

      const viewExpanded  = { title: 'LCARS Panel', ...result };
      const viewShorthand = {
        title:    'LCARS Panel',
        strategy: { type: `custom:${this._selectedStrategy}`, config: { ...this._params } },
      };

      this._generatedYaml =
        `# LCARdS Layout Wizard — ${new Date().toLocaleDateString()}\n` +
        `# Requires: layout-card (HACS — custom:grid-layout)\n` +
        `#\n` +
        `# ── Option A: Expanded ───────────────────────────────────────\n` +
        `# Paste under 'views:' in your dashboard raw editor.\n\n` +
        _toYaml(viewExpanded, 0) +
        `\n\n` +
        `# ── Option B: Strategy shorthand ────────────────────────────\n` +
        `# HA calls generate() on every load — always up-to-date.\n\n` +
        _toYaml(viewShorthand, 0);

      lcardsLog.debug('[LCARdSLayoutsTab] YAML generated', { bytes: this._generatedYaml.length });
    } catch (err) {
      lcardsLog.error('[LCARdSLayoutsTab] generate() failed', err);
      this._generatedYaml = `# Error generating layout:\n# ${err.message}`;
    } finally {
      this._generating = false;
    }
  }

  async _handleCopy() {
    if (!this._generatedYaml) return;
    try {
      await navigator.clipboard.writeText(this._generatedYaml);
      this._copyFeedback = true;
      this.requestUpdate();
      setTimeout(() => { this._copyFeedback = false; this.requestUpdate(); }, 2000);
    } catch (err) {
      lcardsLog.warn('[LCARdSLayoutsTab] Clipboard write failed', err);
    }
  }

  render() {
    const strategyDef = this._getStrategyDef(this._selectedStrategy);

    return html`
      <div class="studio-layout"><div class="scrollable-body">

        <!-- ── Prerequisite banner ── -->
        <div class="banner warning">
          <ha-icon icon="mdi:information-outline"></ha-icon>
          <span>
            Layout strategies require
            <strong>layout-card</strong> from HACS (<code>custom:grid-layout</code>).
            Install it before deploying any generated layout.
          </span>
        </div>

        <!-- ── Layout picker ── -->
        <lcards-form-section
          header="Layout Wizard"
          icon="mdi:view-grid-plus-outline"
          description="Choose a layout strategy, configure its parameters, then copy the generated YAML into your dashboard's raw editor."
          ?expanded=${true}
          ?outlined=${true}>

          <div class="strategy-grid">
            ${STRATEGIES.map(s => html`
              <div
                class="strategy-card ${s.id === this._selectedStrategy ? 'selected' : ''}"
                role="button"
                tabindex="0"
                @click=${() => this._selectStrategy(s.id)}
                @keydown=${(e) => e.key === 'Enter' && this._selectStrategy(s.id)}
              >
                <div class="strategy-icon">
                  <ha-icon icon="${s.icon}"></ha-icon>
                </div>
                <div class="strategy-body">
                  <span class="strategy-name">${s.label}</span>
                  <span class="strategy-desc">${s.description}</span>
                </div>
                ${s.id === this._selectedStrategy ? html`
                  <ha-icon icon="mdi:check-circle" class="strategy-check"></ha-icon>
                ` : ''}
              </div>
            `)}
          </div>
        </lcards-form-section>

        <!-- ── Parameters ── -->
        <lcards-form-section
          header="Parameters"
          icon="mdi:tune-variant"
          ?expanded=${true}
          ?outlined=${true}>

          ${(strategyDef.params ?? []).map(p => html`
            <div class="control-row">
              <div class="control-label">
                ${p.label}
                <span class="hint">${p.hint}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${p.selector}
                .value=${this._params[p.key]}
                @value-changed=${(e) => this._handleParamChange(p.key, e)}
              ></ha-selector>
            </div>
          `)}

          <div class="generate-row">
            <ha-button
              unelevated
              ?disabled=${this._generating}
              @click=${this._handleGenerate}
            >
              <ha-icon slot="icon" icon="mdi:code-tags"></ha-icon>
              ${this._generating ? 'Generating…' : 'Generate YAML'}
            </ha-button>
          </div>
        </lcards-form-section>

        <!-- ── Output ── -->
        ${this._generatedYaml ? html`
          <lcards-form-section
            header="Generated YAML"
            icon="mdi:code-tags"
            ?expanded=${true}
            ?outlined=${true}>

            <div class="yaml-actions">
              <span class="yaml-hint">Paste under <code>views:</code> in your dashboard raw editor.</span>
              <ha-button @click=${this._handleCopy}>
                <ha-icon slot="icon" icon=${this._copyFeedback ? 'mdi:check' : 'mdi:content-copy'}></ha-icon>
                ${this._copyFeedback ? 'Copied!' : 'Copy'}
              </ha-button>
            </div>
            <pre class="yaml-block"><code>${this._generatedYaml}</code></pre>
          </lcards-form-section>
        ` : ''}

      </div></div>
    `;
  }

  static get styles() {
    return css`
      :host {
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

      /* Prerequisite banner */
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
      .banner ha-icon {
        flex-shrink: 0;
        color: var(--warning-color, #ff9800);
      }
      .banner code {
        font-family: monospace;
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 5px;
        border-radius: 3px;
      }

      /* Strategy picker cards */
      .strategy-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 4px 0 8px;
      }

      .strategy-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        background: rgba(40, 40, 40, 0.6);
        cursor: pointer;
        color: var(--primary-text-color);
        transition: background 0.15s, border-color 0.15s;
      }

      .strategy-card:hover {
        background: color-mix(in srgb, var(--primary-color, #1b4f8a) 18%, rgba(40, 40, 40, 0.8));
        border-color: var(--primary-color);
      }

      .strategy-card.selected {
        background: color-mix(in srgb, var(--primary-color, #1b4f8a) 22%, rgba(40, 40, 40, 0.9));
        border-color: var(--primary-color);
      }

      .strategy-card:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .strategy-icon {
        flex-shrink: 0;
        --mdc-icon-size: 22px;
        color: var(--primary-color);
      }

      .strategy-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .strategy-name {
        font-weight: 600;
        font-size: 0.95em;
      }

      .strategy-desc {
        color: var(--secondary-text-color);
        font-size: 0.85em;
        line-height: 1.4;
      }

      .strategy-check {
        flex-shrink: 0;
        --mdc-icon-size: 18px;
        color: var(--primary-color);
      }

      /* Parameter control rows — matches sound tab */
      .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      }
      .control-row:last-child { border-bottom: none; }

      .control-label {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
        gap: 2px;
        font-size: 0.9em;
      }

      .hint {
        font-size: 0.8em;
        color: var(--secondary-text-color);
        line-height: 1.4;
      }

      ha-selector {
        min-width: 200px;
      }

      /* Generate button */
      .generate-row {
        display: flex;
        justify-content: flex-end;
        padding-top: 12px;
      }

      /* YAML output */
      .yaml-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0 10px;
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
        margin-bottom: 10px;
      }

      .yaml-hint {
        flex: 1;
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }

      .yaml-hint code {
        font-family: monospace;
        background: rgba(255, 255, 255, 0.08);
        padding: 1px 4px;
        border-radius: 3px;
      }

      .yaml-block {
        background: rgba(10, 10, 10, 0.6);
        color: var(--primary-text-color);
        border: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        border-radius: 6px;
        padding: 14px 16px;
        font-family: 'Fira Code', 'Consolas', 'Menlo', monospace;
        font-size: 0.78em;
        line-height: 1.7;
        overflow-x: auto;
        white-space: pre;
        margin: 0;
        max-height: 50vh;
        overflow-y: auto;
      }
    `;
  }
}

if (!customElements.get('lcards-layouts-tab')) {
  customElements.define('lcards-layouts-tab', LCARdSLayoutsTab);
}
