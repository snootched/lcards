/**
 * @fileoverview Chart series list editor (used by Chart Studio).
 *
 * Edits `config.sources[]` only. Each series is one of:
 * - entity history:    { entity, attribute? }
 * - entity statistics: { entity, statistics: { type, period } }
 * - data source:       { datasource, buffer? }
 * plus optional group_by and display fields (name, unit, float_precision,
 * type, curve, stroke_width, stroke_dash, color, opacity, yaxis_id).
 *
 * Emits `config-changed` with `{ config: { ...config, sources } }`.
 * Never writes data_sources (named data sources are edited in the Data
 * Sources studio).
 */

import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { toNumericValue } from '../../core/data-sources/ha-history-utils.js';
import { arrayChartProblem, normalizeChartSources } from '../../charts/chart-sources.js';
import { migrateChartConfig } from '../../charts/chart-config-migration.js';
import './shared/lcards-form-section.js';
import './shared/lcards-message.js';
import './shared/lcards-color-picker.js';

const SOURCE_KINDS = [
  { value: 'history', label: 'Entity history' },
  { value: 'statistics', label: 'Entity long-term statistics' },
  { value: 'datasource', label: 'Data source' }
];
const STAT_TYPES = ['mean', 'min', 'max', 'sum', 'state', 'change'];
const STAT_PERIODS = [
  { value: '5minute', label: '5 minutes' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
];
const GROUP_FUNCS = [
  { value: '', label: '(No grouping)' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'first', label: 'First' },
  { value: 'last', label: 'Last' },
  { value: 'sum', label: 'Sum' },
  { value: 'median', label: 'Median' },
  { value: 'delta', label: 'Delta (last minus first)' },
  { value: 'diff', label: 'Difference from previous bucket' },
  { value: 'minmax', label: 'Min/max band (range area)' },
  { value: 'box', label: 'Box plot values' },
  { value: 'ohlc', label: 'Open/high/low/close (candlestick)' }
];
const FILL_MODES = [
  { value: 'last', label: 'Repeat last value' },
  { value: 'null', label: 'Leave a gap' },
  { value: 'zero', label: 'Zero' }
];
const SERIES_TYPES = [
  { value: '', label: '(Chart type)' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'column', label: 'Column' },
  { value: 'scatter', label: 'Scatter' }
];
const CURVES = [
  { value: '', label: '(Chart default)' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'straight', label: 'Straight' },
  { value: 'stepline', label: 'Step' },
  { value: 'monotoneCubic', label: 'Monotone' }
];

/** Fields that belong to one source kind; dropped when switching kinds. */
const KIND_FIELDS = ['entity', 'attribute', 'statistics', 'datasource', 'buffer'];

/**
 * @param {Object} series
 * @returns {'history'|'statistics'|'datasource'}
 */
const kindOf = (series) => (series.datasource !== undefined ? 'datasource' : (series.statistics ? 'statistics' : 'history'));

/** Remove keys whose value is empty, so YAML stays clean. */
const prune = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) =>
  v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)));

export class LCARdSChartSeriesListEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _expanded: { type: Number, state: true }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--ha-space-2);
      }
      .header h3 {
        margin: 0;
      }
      .series {
        margin-bottom: var(--ha-space-2);
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-2);
      }
      .full {
        grid-column: 1 / -1;
      }
      .empty {
        padding: var(--ha-space-4);
        text-align: center;
        color: var(--secondary-text-color);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--ha-space-2);
      }
    `;
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    /** @type {any} */
    this.config = {};
    this._expanded = 0;
  }

  /** Current series list (canonical; legacy configs are migrated for editing). */
  get _sources() {
    const { config } = migrateChartConfig(this.config ?? {});
    return Array.isArray(config.sources) ? config.sources : [];
  }

  /**
   * Replace the series list and notify the studio.
   * @param {Array<Object>} sources
   */
  _commit(sources) {
    fireEvent(this, 'config-changed', { config: { ...this.config, sources } });
  }

  /**
   * Merge a patch into one series.
   * @param {number} index
   * @param {Object} patch - undefined values remove keys
   */
  _patch(index, patch) {
    const sources = this._sources.map((s, i) => (i === index ? prune({ ...s, ...patch }) : s));
    this._commit(sources);
  }

  _add() {
    const sources = [...this._sources, { entity: '' }];
    this._expanded = sources.length - 1;
    this._commit(sources);
  }

  _remove(index) {
    this._commit(this._sources.filter((_, i) => i !== index));
  }

  _move(index, delta) {
    const sources = [...this._sources];
    const target = index + delta;
    if (target < 0 || target >= sources.length) return;
    [sources[index], sources[target]] = [sources[target], sources[index]];
    this._expanded = target;
    this._commit(sources);
  }

  /**
   * Switch a series between entity history, statistics and data source.
   * @param {number} index
   * @param {string} kind
   */
  _setKind(index, kind) {
    const current = this._sources[index];
    if (kindOf(current) === kind) return;
    const display = Object.fromEntries(Object.entries(current).filter(([k]) => !KIND_FIELDS.includes(k)));
    const entity = current.entity ?? '';
    const next = kind === 'datasource'
      ? { datasource: '', ...display }
      : kind === 'statistics'
        ? { entity, statistics: { type: 'mean', period: 'hour' }, ...display }
        : { entity, ...display };
    const sources = this._sources.map((s, i) => (i === index ? next : s));
    this._commit(sources);
  }

  /** Data source names: this card's data_sources plus any registered globally. */
  _dataSourceNames() {
    const local = Object.keys(this.config?.data_sources ?? {});
    const global = [...(window.lcards?.core?.dataSourceManager?.sources?.keys?.() ?? [])];
    return [...new Set([...local, ...global])].sort();
  }

  /** Processor keys of a data source (from this card's config, else the live source). */
  _bufferNames(datasource) {
    const local = this.config?.data_sources?.[datasource]?.processing;
    if (local) return Object.keys(local);
    const live = window.lcards?.core?.dataSourceManager?.getSource?.(datasource);
    return [...(live?.processorManager?.processors?.keys?.() ?? [])];
  }

  /**
   * Warnings for one series (non-numeric entity, array chart types).
   * @param {Object} series
   * @returns {string[]}
   */
  _warnings(series) {
    const warnings = [];
    if (series.entity && kindOf(series) === 'history') {
      const state = this.hass?.states?.[series.entity];
      const raw = series.attribute ? state?.attributes?.[series.attribute] : state?.state;
      if (state && raw !== undefined && toNumericValue(raw) === null && !['unavailable', 'unknown'].includes(String(raw))) {
        warnings.push(`The current value "${raw}" isn't numeric, so it won't plot. Pick a numeric attribute, or use a data source with enum_mapping.`);
      }
    }
    const [normalized] = normalizeChartSources({ chart_type: this.config?.chart_type, sources: [series] });
    const problem = normalized && arrayChartProblem(normalized, this.config?.chart_type || 'line');
    if (problem) warnings.push(`This chart type plots ranges: ${problem}.`);
    return warnings;
  }

  _select(label, value, options, onChange, extra = {}) {
    return html`
      <ha-selector
        .hass=${this.hass}
        .label=${label}
        .value=${value ?? ''}
        .selector=${{ select: { mode: 'dropdown', options, ...extra } }}
        @value-changed=${(e) => onChange(e.detail.value)}>
      </ha-selector>
    `;
  }

  _text(label, value, onChange, placeholder = '') {
    return html`
      <ha-selector
        .hass=${this.hass}
        .label=${label}
        .value=${value ?? ''}
        .selector=${{ text: placeholder ? { placeholder } : {} }}
        @value-changed=${(e) => onChange(e.detail.value || undefined)}>
      </ha-selector>
    `;
  }

  _number(label, value, onChange, { min = 0, max = 20, step = 1 } = {}) {
    return html`
      <ha-selector
        .hass=${this.hass}
        .label=${label}
        .value=${value}
        .selector=${{ number: { min, max, step, mode: 'box' } }}
        @value-changed=${(e) => onChange(e.detail.value === '' || e.detail.value === null ? undefined : Number(e.detail.value))}>
      </ha-selector>
    `;
  }

  _renderSource(series, index) {
    const kind = kindOf(series);
    if (kind === 'datasource') {
      const names = this._dataSourceNames();
      const buffers = series.datasource ? this._bufferNames(series.datasource) : [];
      return html`
        ${this._select('Data source', series.datasource, names.map(n => ({ value: n, label: n })),
          (v) => this._patch(index, { datasource: v, buffer: undefined }), { custom_value: true })}
        ${this._select('Buffer', series.buffer ?? '', [{ value: '', label: '(Raw values)' }, ...buffers.map(b => ({ value: b, label: b }))],
          (v) => this._patch(index, { buffer: v || undefined }))}
      `;
    }

    return html`
      <ha-selector
        class=${kind === 'statistics' ? '' : 'full'}
        .hass=${this.hass}
        .label=${'Entity'}
        .value=${series.entity ?? ''}
        .required=${true}
        .selector=${{ entity: {} }}
        @value-changed=${(e) => this._patch(index, { entity: e.detail.value, attribute: undefined })}>
      </ha-selector>
      ${kind === 'statistics' ? html`
        ${this._select('Statistic', series.statistics?.type ?? 'mean', STAT_TYPES.map(t => ({ value: t, label: t })),
          (v) => this._patch(index, { statistics: { ...series.statistics, type: v } }))}
        ${this._select('Period', series.statistics?.period ?? 'hour', STAT_PERIODS,
          (v) => this._patch(index, { statistics: { ...series.statistics, period: v } }))}
      ` : html`
        <ha-selector
          class="full"
          .hass=${this.hass}
          .label=${'Attribute (optional)'}
          .value=${series.attribute ?? ''}
          .selector=${{ attribute: { entity_id: series.entity } }}
          @value-changed=${(e) => this._patch(index, { attribute: e.detail.value || undefined })}>
        </ha-selector>
      `}
    `;
  }

  _renderSeries(series, index, total) {
    const kind = kindOf(series);
    const title = series.name || series.entity || series.datasource || `Series ${index + 1}`;
    const yaxisIds = (this.config?.yaxis ?? []).map(a => a.id).filter(Boolean);
    const groupBy = series.group_by ?? {};

    return html`
      <lcards-form-section
        class="series"
        header=${title}
        secondary=${SOURCE_KINDS.find(k => k.value === kind)?.label ?? ''}
        icon=${kind === 'datasource' ? 'mdi:database' : (kind === 'statistics' ? 'mdi:chart-box-outline' : 'mdi:chart-line')}
        ?expanded=${this._expanded === index}
        outlined>
        <ha-icon-button slot="header-icons" .label=${'Move up'} ?disabled=${index === 0}
          @click=${(e) => { e.stopPropagation(); this._move(index, -1); }}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Move down'} ?disabled=${index === total - 1}
          @click=${(e) => { e.stopPropagation(); this._move(index, 1); }}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${'Remove series'}
          @click=${(e) => { e.stopPropagation(); this._remove(index); }}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>

        ${this._warnings(series).map(w => html`<lcards-message type="warning">${w}</lcards-message>`)}

        <div class="grid">
          <div class="full">
            ${this._select('Source', kind, SOURCE_KINDS, (v) => this._setKind(index, v))}
          </div>
          ${this._renderSource(series, index)}
        </div>

        <lcards-form-section header="Grouping" icon="mdi:group" nested outlined>
          <div class="grid">
            ${this._select('Group points by', groupBy.func ?? '', GROUP_FUNCS,
              (v) => this._patch(index, { group_by: v ? { duration: '1h', fill: 'last', ...groupBy, func: v } : undefined }))}
            ${groupBy.func ? html`
              ${this._text('Bucket length', groupBy.duration, (v) => this._patch(index, { group_by: { ...groupBy, duration: v ?? '1h' } }), '1h')}
              ${this._select('Empty buckets', groupBy.fill ?? 'last', FILL_MODES,
                (v) => this._patch(index, { group_by: { ...groupBy, fill: v } }))}
            ` : nothing}
          </div>
        </lcards-form-section>

        <lcards-form-section header="Display" icon="mdi:palette" nested outlined>
          <div class="grid">
            ${this._text('Name', series.name, (v) => this._patch(index, { name: v }))}
            ${this._text('Unit', series.unit, (v) => this._patch(index, { unit: v }), 'From entity')}
            ${this._select('Series type', series.type ?? '', SERIES_TYPES, (v) => this._patch(index, { type: v || undefined }))}
            ${this._select('Line', series.curve ?? '', CURVES, (v) => this._patch(index, { curve: v || undefined }))}
            ${this._number('Line width', series.stroke_width, (v) => this._patch(index, { stroke_width: v }))}
            ${this._number('Dash length', series.stroke_dash, (v) => this._patch(index, { stroke_dash: v }))}
            ${this._number('Decimals', series.float_precision, (v) => this._patch(index, { float_precision: v }), { max: 6 })}
            ${this._number('Fill opacity', series.opacity, (v) => this._patch(index, { opacity: v }), { max: 1, step: 0.1 })}
            ${yaxisIds.length ? this._select('Y axis', series.yaxis_id ?? '',
              [{ value: '', label: '(First axis)' }, ...yaxisIds.map(id => ({ value: id, label: id }))],
              (v) => this._patch(index, { yaxis_id: v || undefined })) : nothing}
            <div class="full">
              <lcards-color-picker
                .hass=${this.hass}
                .value=${series.color ?? ''}
                .showPreview=${true}
                @value-changed=${(e) => this._patch(index, { color: e.detail.value || undefined })}>
              </lcards-color-picker>
            </div>
          </div>
        </lcards-form-section>
      </lcards-form-section>
    `;
  }

  render() {
    const sources = this._sources;
    return html`
      <div class="header">
        <h3>Series</h3>
        <ha-button @click=${this._add}>
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add series
        </ha-button>
      </div>
      ${sources.length
        ? sources.map((series, index) => this._renderSeries(series, index, sources.length))
        : html`<div class="empty">No series yet. Add one to plot an entity or a data source.</div>`}
    `;
  }
}

if (!customElements.get('lcards-chart-series-list-editor')) {
  customElements.define('lcards-chart-series-list-editor', LCARdSChartSeriesListEditor);
}
