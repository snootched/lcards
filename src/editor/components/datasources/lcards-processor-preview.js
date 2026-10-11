/**
 * @fileoverview Processor preview for the data source editor: runs the data
 * source's processing pipeline over the entity's own history with the real
 * processors (runProcessorPreview) and charts the raw values against each
 * processor's output.
 *
 * History is fetched the way the data source preloads it (history-fetch.js), once
 * per entity, attribute and span, and reused for a few minutes while editing.
 *
 * @element lcards-processor-preview
 * @fires preview-result - After each run, detail: the runProcessorPreview result
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} entry - The data source config being edited
 * @property {string} selectedKey - Processor to emphasise in the chart
 * @property {boolean} showErrors - Show the run's errors (false when the host shows them)
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { runProcessorPreview } from '../../../core/data-sources/processor-preview.js';
import { processorPreviewChartOptions, PREVIEW_COLORS } from '../../../core/data-sources/processor-preview-chart.js';
import { fetchDataSourceHistory, historySettings, HISTORY_DEFAULT_HOURS } from '../../../core/data-sources/history-fetch.js';
import '../shared/lcards-message.js';

/** History fetched recently: key -> { at, promise }. Shared by every preview on the page. */
const HISTORY_CACHE = new Map();
const CACHE_MS = 5 * 60_000;

/** How each fetch method describes the points. */
const METHOD_TEXT = {
  statistics: 'hourly long-term statistics',
  history: 'state history',
  rest: 'state history',
  none: 'no history',
};

/** Preview spans offered (hours, label); the data source's own history span is added if missing. */
/** @type {Array<[number, string]>} */
const BASE_SPANS = [[1, '1 h'], [6, '6 h'], [12, '12 h'], [24, '24 h'], [48, '48 h'], [168, '7 days']];

/** LCARS palette variables for the processor series, in order. */
const COLOR_VARS = ['--lcars-orange', '--lcars-blue', '--lcars-yellow', '--lcars-violet', '--lcars-green', '--lcars-red', '--lcars-lilac', '--lcars-african-violet'];

export class LCARdSProcessorPreview extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      entry: { attribute: false },
      selectedKey: { type: String },
      showErrors: { type: Boolean },
      _span: { state: true },
      _status: { state: true },
      _result: { state: true },
      _history: { state: true },
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    /** @type {any} */
    this.entry = {};
    this.selectedKey = '';
    this.showErrors = true;
    /** @type {number|null} Hours the preview shows; null follows the data source's history setting */
    this._span = null;
    /** @type {'empty'|'loading'|'ready'|'error'} */
    this._status = 'empty';
    /** @type {any} */
    this._result = null;
    /** @type {{points: Array, method: string, hours: number, previewOnly: boolean}|null} */
    this._history = null;
    this._chart = null;
    this._timer = null;
    this._historyKey = '';
    this._run = 0;
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
        margin-bottom: var(--ha-space-1);
      }
      .title {
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .meta {
        flex: 1;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .span {
        width: 170px;
      }
      .panel {
        position: relative;
        min-height: 200px;
        padding: var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }
      .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-2);
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      .messages {
        display: grid;
        gap: var(--ha-space-1);
        margin-top: var(--ha-space-2);
      }
      .caveat {
        margin-top: var(--ha-space-1);
        font-size: 12px;
        color: var(--secondary-text-color);
      }
    `;
  }

  render() {
    const h = this._history;
    const entity = this.entry?.entity;
    const errors = this.showErrors || this._status === 'error' ? (this._result?.errors ?? []) : [];
    return html`
      <div class="head">
        <span class="title">Preview</span>
        <span class="meta">${h && entity ? `${entity} · ${h.points.length} points from ${METHOD_TEXT[h.method] ?? h.method}` : ''}</span>
        <ha-selector
          class="span"
          .hass=${this.hass}
          .selector=${{ select: { mode: 'dropdown', options: this._spans().map(([hours, text]) => ({ value: String(hours), label: `Last ${text}` })) } }}
          .label=${'Preview span'}
          .required=${false}
          .value=${String(this._hours())}
          @value-changed=${(e) => { if (e.detail.value) { this._span = Number(e.detail.value); this._schedule(); } }}>
        </ha-selector>
      </div>
      <div class="panel">
        <div class="chart"></div>
        ${this._status === 'empty' ? html`<div class="overlay">Choose an entity on the Basic tab to preview its history.</div>` : nothing}
        ${this._status === 'loading' ? html`<div class="overlay"><ha-spinner size="small"></ha-spinner>Loading history...</div>` : nothing}
        ${this._status === 'ready' && !h?.points.length ? html`<div class="overlay">${this._noPointsText()}</div>` : nothing}
      </div>
      ${errors.length || h?.previewOnly ? html`
        <div class="messages">
          ${errors.map(text => html`<lcards-message type="error" .message=${text}></lcards-message>`)}
          ${h?.previewOnly ? html`<lcards-message type="info"
            .message=${'History preload is off for this data source, so on a dashboard it starts empty and fills as values arrive. The preview still loads history to show the processors.'}></lcards-message>` : nothing}
        </div>
      ` : nothing}
      <div class="caveat">
        The real processors, run over this history in order. A data source keeps its last
        ${this._capacityText()} points; between state changes, live-only behaviour (such as a duration's ticking) isn't shown.
      </div>
    `;
  }

  /** Hours the preview shows: the picker's choice, else the data source's history span. */
  _hours() {
    return this._span ?? historySettings(this.entry ?? {}).hours;
  }

  _noPointsText() {
    const entity = this.entry?.entity;
    const state = this.hass?.states?.[entity]?.state;
    if (state !== undefined && !Number.isFinite(parseFloat(state)) && !this.entry?.enum_mapping && !this.entry?.attribute) {
      return `No numeric history for ${entity} (state "${state}"). Map text states to numbers with enum_mapping on the YAML tab.`;
    }
    return `No history recorded for ${entity} in the last ${this._history?.hours ?? HISTORY_DEFAULT_HOURS} hours.`;
  }

  _spans() {
    const own = historySettings(this.entry ?? {}).hours;
    if (BASE_SPANS.some(([h]) => h === own)) return BASE_SPANS;
    /** @type {Array<[number, string]>} */
    const spans = [...BASE_SPANS, [own, `${own} h`]];
    return spans.sort((a, b) => a[0] - b[0]);
  }

  _capacityText() {
    const ws = Number(this.entry?.window_seconds);
    return String(Math.min(1000, Math.max(60, Math.floor((Number.isFinite(ws) && ws > 0 ? ws : 60) * 10))));
  }

  updated(changed) {
    // hass changes on every state update: only a new entity state matters, and the
    // preview reruns on edits anyway.
    if (changed.has('entry') || changed.has('selectedKey') || (changed.has('hass') && !this._history)) this._schedule();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
    this._chart?.destroy();
    this._chart = null;
  }

  _schedule() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._refresh(), 300);
  }

  async _refresh() {
    const entry = this.entry ?? {};
    if (!entry.entity || !this.hass) {
      this._status = 'empty';
      this._result = null;
      return;
    }
    const run = ++this._run;
    const settings = historySettings(entry);
    const hours = this._hours();
    const key = JSON.stringify([entry.entity, entry.attribute ?? '', entry.attribute_path ?? '', entry.enum_mapping ?? null, hours]);
    if (key !== this._historyKey || !this._history) {
      this._status = 'loading';
      try {
        const { points, method } = await this._fetchHistory(key, entry, hours);
        if (run !== this._run) return;
        this._historyKey = key;
        this._history = { points, method, hours, previewOnly: !settings.enabled };
      } catch (error) {
        lcardsLog.warn('[ProcessorPreview] History fetch failed:', error);
        if (run !== this._run) return;
        this._status = 'error';
        this._result = { errors: [`Could not load history: ${error.message}`] };
        return;
      }
    } else {
      this._history = { ...this._history, previewOnly: !settings.enabled };
    }

    const result = runProcessorPreview(entry, this._history.points, { entityState: this.hass.states?.[entry.entity] ?? null });
    this._result = result;
    this._status = 'ready';
    this.dispatchEvent(new CustomEvent('preview-result', { detail: result, bubbles: true, composed: true }));
    await this.updateComplete;
    await this._draw(result.series);
  }

  _fetchHistory(key, entry, hours) {
    const cached = HISTORY_CACHE.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;
    const promise = fetchDataSourceHistory(this.hass, entry, { hours });
    HISTORY_CACHE.set(key, { at: Date.now(), promise });
    promise.catch(() => HISTORY_CACHE.delete(key));
    return promise;
  }

  /** Theme colours for the chart (LCARS palette when the theme has it). */
  _themeColors() {
    const style = getComputedStyle(this);
    const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return {
      colors: COLOR_VARS.map((name, i) => read(name, PREVIEW_COLORS[i])),
      // Dashed in the text colour: readable on any dialog background
      rawColor: read('--primary-text-color', '#cfcfd8'),
      textColor: read('--primary-text-color', '#cfcfd8'),
      gridColor: read('--divider-color', '#333'),
      mode: /** @type {'light'|'dark'} */ (this.hass?.themes?.darkMode === false ? 'light' : 'dark'),
    };
  }

  async _draw(series) {
    const el = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.chart'));
    if (!el) return;
    const options = processorPreviewChartOptions(series, { ...this._themeColors(), selected: this.selectedKey || null, height: 240 });
    try {
      const ApexCharts = (await import('apexcharts')).default;
      // Series and axes change shape between edits: rebuild rather than update.
      this._chart?.destroy();
      this._chart = new ApexCharts(el, options);
      await this._chart.render();
    } catch (error) {
      lcardsLog.error('[ProcessorPreview] Chart failed:', error);
    }
  }
}

if (!customElements.get('lcards-processor-preview')) customElements.define('lcards-processor-preview', LCARdSProcessorPreview);
