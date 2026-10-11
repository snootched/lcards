/**
 * @fileoverview Inline editor for one processor in the data source editor's
 * Processing tab: name, input, the type's settings (or its YAML), and actions.
 * Every change is reported at once, so the preview above follows the edit.
 *
 * @element lcards-processor-form
 * @fires processor-change - detail: { config } (the processor's whole config)
 * @fires processor-rename - detail: { from, to }
 * @fires processor-duplicate - detail: { key }
 * @fires processor-delete - detail: { key }
 *
 * @property {Object} hass - Home Assistant instance
 * @property {string} processorKey - The processor's name
 * @property {Object} config - The processor's config ({ type, ... })
 * @property {Array<string>} processorKeys - Every processor name in the pipeline
 * @property {string} latestValue - Latest preview value (formatted), if any
 */

import { LitElement, html, css, nothing } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import { processorType, processorDocsUrl, unitOptions, unitTargets, PROCESSOR_KEY_PATTERN } from './processor-types.js';
import '../shared/lcards-message.js';

/** Select value for "no input_source" (a select can't hold an empty value). */
const RAW = '__raw__';

const STATS = [
  ['min', 'Minimum'], ['max', 'Maximum'], ['mean', 'Mean'], ['median', 'Median'], ['std_dev', 'Standard deviation'],
  ['q1', 'Q1 (25th percentile)'], ['q3', 'Q3 (75th percentile)'], ['range', 'Range (max - min)'], ['count', 'Count'], ['sum', 'Sum']
];

export class LCARdSProcessorForm extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      processorKey: { type: String },
      config: { attribute: false },
      processorKeys: { attribute: false },
      latestValue: { type: String },
      _yaml: { state: true },
      _yamlError: { state: true },
      _nameError: { state: true },
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this.processorKey = '';
    /** @type {any} */
    this.config = {};
    /** @type {string[]} */
    this.processorKeys = [];
    this.latestValue = '';
    /** @type {string|null} YAML text while the YAML view is open */
    this._yaml = null;
    this._yamlError = '';
    this._nameError = '';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-3);
      }
      .type {
        padding: 2px var(--ha-space-2);
        border-radius: var(--ha-border-radius-pill);
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 12px;
        font-weight: 600;
      }
      .description {
        flex: 1 1 200px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .description a {
        color: var(--primary-color);
      }
      .fields {
        display: grid;
        gap: var(--ha-space-3);
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
      }
      @media (max-width: 600px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
      ha-selector {
        display: block;
      }
      .help {
        margin-top: calc(var(--ha-space-2) * -1);
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .help code {
        font-family: var(--code-font-family, monospace);
      }
      .latest {
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .latest strong {
        color: var(--primary-text-color);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-4);
      }
      .error {
        color: var(--error-color);
        font-size: 12px;
      }
    `;
  }

  willUpdate(changed) {
    // Another processor selected: leave the YAML view and clear errors.
    if (changed.has('processorKey') && changed.get('processorKey') !== undefined) {
      this._yaml = null;
      this._yamlError = '';
      this._nameError = '';
    }
  }

  render() {
    const type = this.config?.type;
    const meta = processorType(type);
    return html`
      <div class="head">
        <span class="type">${meta?.label ?? type}</span>
        <span class="description">
          ${meta?.description ?? ''}
          <a href=${processorDocsUrl(type)} target="_blank" rel="noreferrer">Docs</a>
        </span>
      </div>

      <div class="fields">
        <ha-selector
          .hass=${this.hass}
          .selector=${{ text: {} }}
          .label=${'Name'}
          .value=${this.processorKey}
          .helper=${'Used in templates as {source.name} and by other processors as their input'}
          @value-changed=${this._rename}>
        </ha-selector>
        ${this._nameError ? html`<div class="error">${this._nameError}</div>` : nothing}

        ${this._renderInput()}

        ${this._yaml === null ? this._renderTypeFields(type) : this._renderYaml()}

        ${this.latestValue ? html`<div class="latest">Latest value in the preview: <strong>${this.latestValue}</strong></div>` : nothing}
      </div>

      <div class="actions">
        <ha-button appearance="plain" @click=${this._toggleYaml}>
          <ha-icon icon=${this._yaml === null ? 'mdi:code-braces' : 'mdi:form-select'} slot="start"></ha-icon>
          ${this._yaml === null ? 'Edit as YAML' : 'Back to the form'}
        </ha-button>
        <ha-button appearance="plain" @click=${() => this._fire('processor-duplicate', { key: this.processorKey })}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Duplicate
        </ha-button>
        <ha-button appearance="plain" variant="danger" @click=${() => this._fire('processor-delete', { key: this.processorKey })}>
          <ha-icon icon="mdi:delete" slot="start"></ha-icon>
          Delete
        </ha-button>
      </div>
    `;
  }

  _renderInput() {
    const others = this.processorKeys.filter(k => k !== this.processorKey);
    return html`
      <ha-selector
        .hass=${this.hass}
        .selector=${{ select: { mode: 'dropdown', options: [
          { value: RAW, label: '(Raw entity value)' },
          ...others.map(k => ({ value: k, label: k }))
        ] } }}
        .label=${'Input'}
        .required=${false}
        .value=${this.config?.input_source ?? RAW}
        .helper=${'What this processor works on: the raw value, or another processor\'s output (input_source)'}
        @value-changed=${(e) => this._set('input_source', e.detail.value === RAW ? '' : e.detail.value)}>
      </ha-selector>
    `;
  }

  _num(key, label, fallback, opts = {}) {
    return html`
      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { mode: opts.mode ?? 'box', step: opts.step ?? 'any', ...(opts.min !== undefined && { min: opts.min }), ...(opts.max !== undefined && { max: opts.max }) } }}
        .label=${label}
        .value=${this.config?.[key] ?? fallback}
        @value-changed=${(e) => this._set(key, e.detail.value)}>
      </ha-selector>
    `;
  }

  _select(key, label, options, fallback, extra = {}) {
    return html`
      <ha-selector
        .hass=${this.hass}
        .selector=${{ select: { mode: 'dropdown', options, ...extra } }}
        .label=${label}
        .required=${false}
        .value=${this.config?.[key] ?? fallback}
        @value-changed=${(e) => this._set(key, e.detail.value)}>
      </ha-selector>
    `;
  }

  _text(key, label, fallback = '', helper = '') {
    return html`
      <ha-selector
        .hass=${this.hass}
        .selector=${{ text: {} }}
        .label=${label}
        .helper=${helper}
        .value=${this.config?.[key] ?? fallback}
        @value-changed=${(e) => this._set(key, e.detail.value)}>
      </ha-selector>
    `;
  }

  _renderTypeFields(type) {
    const c = this.config ?? {};
    switch (type) {
      case 'smooth': {
        const method = c.method ?? 'exponential';
        return html`
          ${this._select('method', 'Method', [
            { value: 'exponential', label: 'Exponential (weights recent values)' },
            { value: 'moving_average', label: 'Moving average (last N samples)' },
            { value: 'gaussian', label: 'Gaussian (bell-weighted last N samples)' }
          ], 'exponential')}
          ${method === 'exponential'
            ? html`${this._num('alpha', 'Alpha', 0.3, { mode: 'slider', min: 0.01, max: 1, step: 0.01 })}
                <div class="help">Lower is smoother but lags more; higher follows the value closely.</div>`
            : html`${this._num('window', 'Window (samples)', 10, { min: 2, step: 1 })}`}
        `;
      }
      case 'scale':
        return html`
          <div class="row">${this._range('input_range', 'Input', [0, 100])}</div>
          <div class="row">${this._range('output_range', 'Output', [0, 1])}</div>
          ${this._select('curve', 'Curve', ['linear', 'exponential', 'logarithmic', 'sigmoid'].map(v => ({ value: v, label: v })), 'linear')}
        `;
      case 'convert_unit': {
        const from = c.from ?? 'c';
        return html`
          <div class="row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ select: { mode: 'dropdown', options: unitOptions() } }}
              .label=${'From'}
              .value=${from}
              @value-changed=${(e) => this._setUnits(e.detail.value)}>
            </ha-selector>
            ${this._select('to', 'To', unitOptions(unitTargets(from)), '')}
          </div>
          <div class="help">To lists the units this conversion supports from the chosen unit.</div>
        `;
      }
      case 'round':
        return html`
          <div class="row">
            ${this._num('precision', 'Decimal places', 0, { min: 0, max: 10, step: 1 })}
            ${this._select('method', 'Method', [
              { value: 'round', label: 'Round (nearest)' }, { value: 'floor', label: 'Floor (down)' }, { value: 'ceil', label: 'Ceil (up)' }
            ], 'round')}
          </div>
        `;
      case 'clamp':
        return html`
          <div class="row">${this._num('min', 'Minimum', '')}${this._num('max', 'Maximum', '')}</div>
          <div class="help">Leave one empty for no limit on that side.</div>
        `;
      case 'delta':
        return html`
          <ha-selector .hass=${this.hass} .selector=${{ boolean: {} }} .label=${'Absolute (always positive)'}
            .value=${c.absolute ?? false} @value-changed=${(e) => this._set('absolute', e.detail.value)}></ha-selector>
          <div class="help">The change since the previous value.</div>
        `;
      case 'rate':
        return html`
          <div class="row">
            ${this._select('unit', 'Per', [
              { value: 'per_second', label: 'Second' }, { value: 'per_minute', label: 'Minute' }, { value: 'per_hour', label: 'Hour' }
            ], 'per_second')}
            <ha-selector .hass=${this.hass} .selector=${{ boolean: {} }} .label=${'Smooth the rate'}
              .value=${c.smoothing ?? false} @value-changed=${(e) => this._set('smoothing', e.detail.value)}></ha-selector>
          </div>
          <div class="help">(Change in value) / (time between values). A kWh meter per hour gives kW.</div>
        `;
      case 'statistics':
        return html`
          ${this._select('window', 'Window', [
            { value: 'session', label: 'Session (since the dashboard loaded)' },
            ...['15m', '1h', '6h', '12h', '24h'].map(v => ({ value: v, label: `Last ${v}` }))
          ], 'session', { custom_value: true })}
          <ha-selector .hass=${this.hass}
            .selector=${{ select: { multiple: true, mode: 'list', options: STATS.map(([value, label]) => ({ value, label })) } }}
            .label=${'Statistics'} .value=${c.stats ?? ['min', 'max', 'mean']}
            @value-changed=${(e) => this._set('stats', e.detail.value)}></ha-selector>
          <div class="help">A time window covers this processor's recent inputs, up to the data source's buffer (see the Timing tab). Output is an object: use <code>{source.name.mean}</code> in templates.</div>
        `;
      case 'trend':
        return html`
          <div class="row">${this._num('samples', 'Samples', 5, { min: 2, step: 1 })}${this._num('threshold', 'Stable below (slope per sample)', 0.01, { min: 0 })}</div>
          <div class="help">Outputs a word (increasing, decreasing or stable), so it shows in templates, not on charts.</div>
        `;
      case 'threshold':
        return html`
          ${this._num('threshold', 'Threshold', 0)}
          <div class="row">${this._num('above', 'Output when above', 1)}${this._num('below', 'Output when below', 0)}</div>
          ${this._num('hysteresis', 'Hysteresis', 0, { min: 0 })}
          <div class="help">A dead band of this width centred on the threshold: it switches up at threshold + hysteresis / 2 and down at threshold - hysteresis / 2.</div>
        `;
      case 'duration':
        return html`
          ${this._text('condition', 'Condition', '> 0', 'A comparison with a number: >, >=, <, <=, == or !=, e.g. > 20. On/off entities are 1/0.')}
          ${this._text('reset_on', 'Reset when (optional)', '', 'Same form, e.g. < 15')}
          <div class="help">Outputs { duration_ms, duration_human, in_condition }; the chart shows minutes.</div>
        `;
      case 'expression': {
        const others = this.processorKeys.filter(k => k !== this.processorKey);
        return html`
          <ha-selector .hass=${this.hass} .selector=${{ text: { multiline: true } }} .label=${'Expression'}
            .value=${c.expression ?? ''} @value-changed=${(e) => this._set('expression', e.detail.value)}></ha-selector>
          ${others.length ? html`
            <ha-selector .hass=${this.hass}
              .selector=${{ select: { multiple: true, mode: 'list', options: others.map(k => ({ value: k, label: k })) } }}
              .label=${'Sources (sources[0], sources[1], ...)'} .value=${c.sources ?? []}
              @value-changed=${(e) => this._set('sources', e.detail.value)}></ha-selector>
          ` : nothing}
          <div class="help">
            One JavaScript expression (no statements). Available: <code>value</code> (<code>v</code>), <code>sources[n]</code>,
            <code>timestamp</code> (<code>t</code>), <code>entity</code>, <code>Math</code>, <code>abs</code>, <code>min</code>,
            <code>max</code>, <code>round</code>. E.g. <code>value * 1.8 + 32</code> or <code>value &gt; 20 ? 1 : 0</code>.
          </div>
        `;
      }
      default:
        return html`<lcards-message type="warning" .message=${`Unknown processor type "${type}": edit it as YAML.`}></lcards-message>`;
    }
  }

  _range(key, label, fallback) {
    const range = Array.isArray(this.config?.[key]) ? this.config[key] : fallback;
    const set = (i, v) => {
      const next = [...range];
      next[i] = v;
      this._set(key, next);
    };
    return html`
      <ha-selector .hass=${this.hass} .selector=${{ number: { mode: 'box', step: 'any' } }} .label=${`${label} min`}
        .value=${range[0]} @value-changed=${(e) => set(0, e.detail.value)}></ha-selector>
      <ha-selector .hass=${this.hass} .selector=${{ number: { mode: 'box', step: 'any' } }} .label=${`${label} max`}
        .value=${range[1]} @value-changed=${(e) => set(1, e.detail.value)}></ha-selector>
    `;
  }

  _renderYaml() {
    return html`
      <ha-textarea
        label="Processor (YAML)"
        resize="auto"
        rows="8"
        .value=${this._yaml}
        @change=${(e) => this._applyYaml(e.target.value)}>
      </ha-textarea>
      ${this._yamlError ? html`<div class="error">${this._yamlError}</div>` : html`<div class="help">Applies when the field loses focus.</div>`}
    `;
  }

  _toggleYaml() {
    this._yamlError = '';
    this._yaml = this._yaml === null ? configToYaml(this.config ?? {}) : null;
  }

  _applyYaml(text) {
    this._yaml = text;
    let config;
    try {
      config = yamlToConfig(text);
    } catch (error) {
      this._yamlError = `YAML: ${error.message}`;
      return;
    }
    if (!config || typeof config !== 'object' || !config.type) {
      this._yamlError = 'A processor needs a type, e.g. type: smooth';
      return;
    }
    this._yamlError = '';
    this._fire('processor-change', { config });
  }

  /** Set one setting; empty values remove it (the processor's default applies). */
  _set(key, value) {
    const config = { ...(this.config ?? {}) };
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0 && key === 'sources')) {
      delete config[key];
    } else {
      config[key] = value;
    }
    this._fire('processor-change', { config });
  }

  /** From changed: keep To when it still converts, else pick the first unit that does. */
  _setUnits(from) {
    const targets = unitTargets(from);
    const to = targets.includes(this.config?.to) ? this.config.to : targets[0];
    this._fire('processor-change', { config: { ...(this.config ?? {}), from, ...(to && { to }) } });
  }

  _rename(e) {
    const to = String(e.detail.value ?? '').trim();
    if (to === this.processorKey) {
      this._nameError = '';
      return;
    }
    if (!PROCESSOR_KEY_PATTERN.test(to)) {
      this._nameError = 'Use lowercase letters, digits and underscores, starting with a letter or underscore.';
      return;
    }
    if (this.processorKeys.includes(to)) {
      this._nameError = `"${to}" is already used by another processor.`;
      return;
    }
    this._nameError = '';
    this._fire('processor-rename', { from: this.processorKey, to });
  }

  _fire(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

if (!customElements.get('lcards-processor-form')) customElements.define('lcards-processor-form', LCARdSProcessorForm);
