/**
 * @fileoverview Processing tab of the data source editor: the processors as a
 * tree (each under its input, numbered in execution order) and the selected
 * processor's settings, edited inline. The dialog shows the preview beside it
 * (lcards-processor-preview) and passes its result back as `previewResult`.
 *
 * Execution order and configuration errors come from the real ProcessorManager
 * (runProcessorPreview), so they always match what a data source does.
 *
 * @element lcards-processor-tree-editor
 * @fires change - When the processing map changes, detail: { value: processingConfig }
 * @fires processor-selected - When the selected processor changes, detail: { key }
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} value - The processing map ({ name: { type, ... } })
 * @property {Object} previewResult - The preview's latest runProcessorPreview result (latest values, runtime errors)
 * @property {string} label - Section label
 */

import { LitElement, html, css, nothing } from 'lit';
import { runProcessorPreview } from '../../../core/data-sources/processor-preview.js';
import { PROCESSOR_TYPES, processorType, renameProcessor, uniqueProcessorKey, PROCESSOR_KEY_PATTERN } from './processor-types.js';
import './lcards-processor-form.js';
import '../shared/lcards-message.js';
import { showConfirmDeleteDialog } from '../../../views/layout-edit-dialogs.js';

export class LCARdSProcessorTreeEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      value: { attribute: false },
      previewResult: { attribute: false },
      label: { type: String },
      _selectedKey: { state: true },
      _adding: { state: true },
      _newType: { state: true },
      _newName: { state: true },
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    /** @type {Object} */
    this.value = {};
    /** @type {any} */
    this.previewResult = null;
    this.label = 'Processors';
    this._selectedKey = '';
    this._adding = false;
    this._newType = 'smooth';
    this._newName = '';
  }

  static get styles() {
    return css`
      :host {
        display: block;
        container-type: inline-size;
      }
      .errors {
        display: grid;
        gap: var(--ha-space-1);
        margin-bottom: var(--ha-space-3);
      }
      .split {
        display: grid;
        grid-template-columns: minmax(200px, 32%) 1fr;
        gap: var(--ha-space-4);
        min-height: 280px;
      }
      /* Tree above the form when the pane is narrow */
      @container (max-width: 560px) {
        .split {
          grid-template-columns: 1fr;
        }
      }
      .tree {
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        padding: var(--ha-space-2);
        align-self: start;
      }
      .tree-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-2);
        padding: var(--ha-space-1) var(--ha-space-1) var(--ha-space-2);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .node {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        width: 100%;
        box-sizing: border-box;
        padding: var(--ha-space-2);
        padding-left: calc(var(--ha-space-2) + var(--depth, 0) * var(--ha-space-4));
        border: none;
        border-radius: var(--ha-border-radius-sm);
        background: none;
        color: var(--primary-text-color);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .node:hover {
        background: var(--secondary-background-color);
      }
      .node.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }
      .order {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: var(--ha-border-radius-circle);
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        font-size: 11px;
        font-weight: 600;
      }
      .node.selected .order {
        background: color-mix(in srgb, var(--text-primary-color) 25%, transparent);
      }
      .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
      }
      .node-type {
        flex: none;
        font-size: 12px;
        opacity: 0.8;
      }
      .empty {
        padding: var(--ha-space-4) var(--ha-space-2);
        color: var(--secondary-text-color);
        font-size: 13px;
        text-align: center;
      }
      .add {
        display: grid;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2);
        margin-bottom: var(--ha-space-2);
        border-radius: var(--ha-border-radius-sm);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }
      .add-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--ha-space-2);
      }
      .add-help {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .detail-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: var(--secondary-text-color);
        text-align: center;
      }
    `;
  }

  /** Execution order and configuration errors from the real ProcessorManager (no points needed). */
  get _structure() {
    return runProcessorPreview({ processing: this.value ?? {} }, []);
  }

  willUpdate(changed) {
    if (changed.has('value')) {
      const keys = Object.keys(this.value ?? {});
      if (!keys.includes(this._selectedKey)) this._selectedKey = keys[0] ?? '';
    }
  }

  updated(changed) {
    if (changed.has('_selectedKey')) {
      this.dispatchEvent(new CustomEvent('processor-selected', { detail: { key: this._selectedKey }, bubbles: true, composed: true }));
    }
  }

  render() {
    const processing = this.value ?? {};
    const keys = Object.keys(processing);
    const structure = this._structure;
    const runtime = (this.previewResult?.errors ?? []).filter(e => !structure.errors.includes(e));
    const errors = [...structure.errors, ...runtime];
    const latest = Object.fromEntries((this.previewResult?.latest ?? []).map(l => [l.key, l.value]));

    return html`
      ${errors.length ? html`
        <div class="errors">
          ${errors.map(text => html`<lcards-message type="error" .message=${text}></lcards-message>`)}
        </div>
      ` : nothing}

      <div class="split">
        <div class="tree">
          <div class="tree-head">
            <span>${this.label} (${keys.length})</span>
            ${this._adding ? nothing : html`
              <ha-button appearance="filled" variant="brand" size="s" @click=${this._startAdd}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Add
              </ha-button>
            `}
          </div>
          ${this._adding ? this._renderAdd(processing) : nothing}
          ${keys.length ? this._renderTree(processing, structure.order) : this._adding ? nothing : html`
            <div class="empty">No processors yet. Add one to smooth, convert, scale or analyse the values.</div>
          `}
        </div>

        <div class="detail">
          ${this._selectedKey && processing[this._selectedKey] ? html`
            <lcards-processor-form
              .hass=${this.hass}
              .processorKey=${this._selectedKey}
              .config=${processing[this._selectedKey]}
              .processorKeys=${keys}
              .latestValue=${latest[this._selectedKey] ?? ''}
              @processor-change=${this._onChange}
              @processor-rename=${this._onRename}
              @processor-duplicate=${this._onDuplicate}
              @processor-delete=${this._onDelete}>
            </lcards-processor-form>
          ` : html`<div class="detail-empty">${keys.length ? 'Select a processor to edit it.' : 'Its settings will appear here.'}</div>`}
        </div>
      </div>
    `;
  }

  /** Processors under their input (input_source), numbered in execution order. */
  _renderTree(processing, order) {
    const keys = Object.keys(processing);
    /** @type {Map<string, string[]>} */
    const children = new Map(keys.map(k => [k, []]));
    const roots = [];
    for (const key of keys) {
      const parent = processing[key]?.input_source;
      const siblings = parent && parent !== key ? children.get(parent) : undefined;
      if (siblings) siblings.push(key);
      else roots.push(key);
    }
    const seen = new Set();
    const rows = [];
    const walk = (key, depth) => {
      if (seen.has(key)) return; // cycles are reported above
      seen.add(key);
      rows.push({ key, depth });
      for (const child of children.get(key) ?? []) walk(child, depth + 1);
    };
    roots.forEach(k => walk(k, 0));
    keys.filter(k => !seen.has(k)).forEach(k => walk(k, 0));

    return rows.map(({ key, depth }) => {
      const index = order.indexOf(key);
      const type = processing[key]?.type;
      return html`
        <button type="button" class="node ${key === this._selectedKey ? 'selected' : ''}" style="--depth: ${depth}"
          @click=${() => { this._selectedKey = key; }}>
          <span class="order">${index >= 0 ? index + 1 : '!'}</span>
          <span class="name">${key}</span>
          <span class="node-type">${processorType(type)?.label ?? type}</span>
        </button>
      `;
    });
  }

  _renderAdd(processing) {
    const name = this._newName || uniqueProcessorKey(processing, this._newType);
    const nameError = !PROCESSOR_KEY_PATTERN.test(name) ? 'Lowercase letters, digits and underscores, starting with a letter or underscore.'
      : processing[name] ? `"${name}" is already used.` : '';
    return html`
      <div class="add">
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: { mode: 'dropdown', options: PROCESSOR_TYPES.map(t => ({ value: t.type, label: t.label })) } }}
          .label=${'Type'}
          .required=${false}
          .value=${this._newType}
          @value-changed=${(e) => { this._newType = e.detail.value || 'smooth'; this._newName = ''; }}>
        </ha-selector>
        <div class="add-help">${processorType(this._newType)?.description ?? ''}</div>
        <ha-selector
          .hass=${this.hass}
          .selector=${{ text: {} }}
          .label=${'Name'}
          .value=${name}
          @value-changed=${(e) => { this._newName = String(e.detail.value ?? '').trim(); }}>
        </ha-selector>
        ${nameError ? html`<div class="add-help" style="color: var(--error-color)">${nameError}</div>`
          : html`<div class="add-help">It starts on the raw entity value; pick another processor as its Input to chain them.</div>`}
        <div class="add-actions">
          <ha-button appearance="plain" size="s" @click=${() => { this._adding = false; }}>Cancel</ha-button>
          <ha-button variant="brand" size="s" .disabled=${!!nameError} @click=${() => this._add(name)}>Create</ha-button>
        </div>
      </div>
    `;
  }

  _startAdd() {
    this._adding = true;
    this._newType = 'smooth';
    this._newName = '';
  }

  _add(name) {
    const meta = processorType(this._newType);
    this._emit({ ...(this.value ?? {}), [name]: { type: this._newType, ...structuredClone(meta?.defaults ?? {}) } });
    this._adding = false;
    this._selectedKey = name;
  }

  _onChange(e) {
    e.stopPropagation();
    this._emit({ ...(this.value ?? {}), [this._selectedKey]: e.detail.config });
  }

  _onRename(e) {
    e.stopPropagation();
    const { from, to } = e.detail;
    const next = renameProcessor(this.value ?? {}, from, to);
    if (next === this.value) return;
    this._selectedKey = to;
    this._emit(next);
  }

  _onDuplicate(e) {
    e.stopPropagation();
    const key = e.detail.key;
    const copy = uniqueProcessorKey(this.value, key);
    this._emit({ ...(this.value ?? {}), [copy]: structuredClone(this.value[key]) });
    this._selectedKey = copy;
  }

  async _onDelete(e) {
    e.stopPropagation();
    const key = e.detail.key;
    const users = Object.entries(this.value ?? {})
      .filter(([k, p]) => k !== key && (p.input_source === key || (Array.isArray(p.sources) && p.sources.includes(key))))
      .map(([k]) => k);
    if (users.length && !(await showConfirmDeleteDialog({
      title: `Delete ${key}?`,
      message: `${users.join(', ')} ${users.length > 1 ? 'use' : 'uses'} it as input. ${users.length > 1 ? 'They switch' : 'It switches'} to the raw value.`,
    }))) return;
    const next = {};
    for (const [k, p] of Object.entries(this.value ?? {})) {
      if (k === key) continue;
      const proc = { ...p };
      if (proc.input_source === key) delete proc.input_source;
      if (Array.isArray(proc.sources)) proc.sources = proc.sources.filter(s => s !== key);
      next[k] = proc;
    }
    this._emit(next);
  }

  _emit(value) {
    this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('lcards-processor-tree-editor')) customElements.define('lcards-processor-tree-editor', LCARdSProcessorTreeEditor);
