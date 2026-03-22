/**
 * @fileoverview LCARdS Processor Tree Editor
 *
 * Professional split-pane tree editor for processor pipelines.
 * Left pane: Collapsible dependency tree
 * Right pane: Selected processor details with inline editing
 *
 * Features:
 * - Tree view with expand/collapse
 * - Visual dependency hierarchy
 * - Execution order badges
 * - Detail pane with config display
 * - Quick actions (Edit, Delete, Duplicate)
 * - Branching support (multiple processors depending on same parent)
 *
 * Pattern based on DataSource Browser split-pane design.
 *
 * @element lcards-processor-tree-editor
 * @fires change - When processors config changes with {value: processingConfig}
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} value - Current processing config (object with processor keys)
 * @property {string} label - Field label
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import './lcards-processor-editor.js';

export class LCARdSProcessorTreeEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      value: { type: Object },
      label: { type: String },
      _processors: { type: Array, state: true },
      _executionOrder: { type: Array, state: true },
      _dependencyErrors: { type: Array, state: true },
      _selectedNode: { type: Object, state: true },
      _expandedNodes: { state: true, attribute: false },
      _editorOpen: { type: Boolean, state: true },
      _editorMode: { type: String, state: true },
      _editingKey: { type: String, state: true },
      _editingConfig: { type: Object, state: true }
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.hass = undefined;
    this.value = {};
    this.label = 'Processors';
    this._processors = [];
    this._executionOrder = [];
    this._dependencyErrors = [];
    this._selectedNode = null;
    this._expandedNodes = new Set();
    this._editorOpen = false;
    this._editorMode = 'add';
    this._editingKey = null;
    this._editingConfig = null;
  }

  updated(changedProps) {
    super.updated(changedProps);

    if (changedProps.has('value')) {
      this._updateProcessorsList();
      this._computeExecutionOrder();
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .container {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--primary-background-color, #fafafa);
        overflow: hidden;
        height: calc(55vh - 60px);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        flex-shrink: 0;
      }

      .header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      /* Error display */
      .error-list {
        background: var(--error-color, #f44336);
        color: white;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .error-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      /* Split pane layout */
      .split-pane-container {
        display: grid;
        grid-template-columns: 35% 65%;
        grid-template-rows: 1fr;
        gap: 12px;
        flex: 1;
        overflow: hidden;
      }

      /* Tree pane (left) */
      .tree-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid var(--divider-color);
        min-height: 0;
      }

      .tree-pane-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
        flex-shrink: 0;
      }

      .tree-pane-header span {
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }

      /* Tree nodes */
      .tree-node {
        margin-left: calc(var(--node-level, 0) * 16px);
        margin-bottom: 2px;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        user-select: none;
      }

      .tree-node-content:hover {
        background: var(--secondary-background-color);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: var(--text-primary-color, white);
      }

      .tree-expander {
        width: 16px;
        text-align: center;
        font-size: 12px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .tree-expander.leaf {
        opacity: 0;
        pointer-events: none;
      }

      .execution-order {
        font-size: 11px;
        font-weight: 600;
        background: var(--primary-color);
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .tree-node-content.selected .execution-order {
        background: white;
        color: var(--primary-color);
      }

      .node-label {
        flex: 1;
        font-size: 16px;
        font-weight: 500;
      }

      .node-type {
        font-size: 12px;
        padding: 2px 8px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        color: var(--primary-color);
        border-radius: 8px;
        font-weight: 500;
      }

      .tree-node-content.selected .node-type {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      /* Detail pane (right) */
      .detail-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        padding: 12px;
      }

      .detail-pane-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--secondary-text-color);
        gap: 12px;
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 64px;
        opacity: 0.3;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .detail-header h3 {
        margin: 0;
        flex: 1;
        font-size: 18px;
        font-weight: 600;
      }

      .detail-type-badge {
        padding: 6px 14px;
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      /* Action buttons */
      .action-buttons {
        display: flex;
        gap: 8px;
        padding: 0 16px 16px;
        flex-wrap: wrap;
      }

      /* Config display */
      .config-section {
        padding: 0 16px 16px;
      }

      .config-section h4 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .config-display {
        background: var(--code-background-color, #1e1e1e);
        border-radius: 8px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: var(--primary-color);
        overflow-x: auto;
      }

      .config-display pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .dependency-section {
        padding: 0 16px 16px;
      }

      .dependency-info {
        font-size: 14px;
        color: var(--secondary-text-color);
      }

      .dependency-info strong {
        color: var(--primary-text-color);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        color: var(--secondary-text-color);
        text-align: center;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
    `;
  }

  // ========== Data Management ==========

  _updateProcessorsList() {
    if (!this.value || typeof this.value !== 'object') {
      this._processors = [];
      return;
    }

    this._processors = Object.entries(this.value).map(([key, config]) => ({
      key,
      config,
      type: config.type || 'unknown',
      from: config.input_source || null
    }));
  }

  _computeExecutionOrder() {
    if (this._processors.length === 0) {
      this._executionOrder = [];
      this._dependencyErrors = [];
      return;
    }

    try {
      // Build dependency graph
      const graph = new Map();
      const inDegree = new Map();

      // Initialize
      this._processors.forEach(proc => {
        graph.set(proc.key, []);
        inDegree.set(proc.key, 0);
      });

      // Build edges
      this._processors.forEach(proc => {
        if (proc.from) {
          if (!graph.has(proc.from)) {
            this._dependencyErrors.push(
              `Processor "${proc.key}" depends on non-existent "${proc.from}"`
            );
          } else {
            graph.get(proc.from).push(proc.key);
            inDegree.set(proc.key, inDegree.get(proc.key) + 1);
          }
        }
      });

      // Topological sort
      const queue = [];
      const order = [];

      inDegree.forEach((degree, key) => {
        if (degree === 0) queue.push(key);
      });

      while (queue.length > 0) {
        const current = queue.shift();
        order.push(current);

        graph.get(current).forEach(dependent => {
          inDegree.set(dependent, inDegree.get(dependent) - 1);
          if (inDegree.get(dependent) === 0) {
            queue.push(dependent);
          }
        });
      }

      // Check for circular dependencies
      if (order.length !== this._processors.length) {
        const remaining = this._processors.map(p => p.key).filter(k => !order.includes(k));
        this._dependencyErrors = [
          `Circular dependency detected: ${remaining.join(', ')}`
        ];
        this._executionOrder = this._processors.map(p => p.key);
      } else {
        this._executionOrder = order;
        this._dependencyErrors = [];
      }
    } catch (error) {
      lcardsLog.error('[ProcessorTreeEditor] Failed to compute execution order:', error);
      this._dependencyErrors = [error.message];
      this._executionOrder = this._processors.map(p => p.key);
    }
  }

  _buildTree() {
    const roots = [];
    const childrenMap = new Map();

    // Initialize children map
    this._processors.forEach(proc => {
      childrenMap.set(proc.key, []);
    });

    // Categorize processors
    this._processors.forEach(proc => {
      if (!proc.from) {
        // No dependency - definitely a root
        roots.push(proc);
      } else if (childrenMap.has(proc.from)) {
        // Has dependency and parent exists - add as child
        childrenMap.get(proc.from).push(proc);
      } else {
        // Has dependency but parent doesn't exist - treat as orphaned root
        roots.push(proc);
      }
    });

    return { roots, childrenMap };
  }

  // ========== Tree Interaction ==========

  _toggleNode(nodeId) {
    if (this._expandedNodes.has(nodeId)) {
      this._expandedNodes.delete(nodeId);
    } else {
      this._expandedNodes.add(nodeId);
    }
    this.requestUpdate();
  }

  _selectNode(processor) {
    this._selectedNode = processor;
    this.requestUpdate();
  }

  // ========== CRUD Handlers ==========

  _handleAdd() {
    this._editorMode = 'add';
    this._editingKey = null;
    this._editingConfig = null;
    this._editorOpen = true;
  }

  _handleEdit(key) {
    const processor = this._processors.find(p => p.key === key);
    if (!processor) return;

    this._editorMode = 'edit';
    this._editingKey = key;
    this._editingConfig = { ...processor.config };
    this._editorOpen = true;
  }

  _handleDelete(key) {
    // Check if any other processor depends on this one
    const dependents = this._processors.filter(p => p.from === key);
    if (dependents.length > 0) {
      const names = dependents.map(p => p.key).join(', ');
      if (!confirm(
        `Warning: Processors "${names}" depend on "${key}". ` +
        `Deleting "${key}" will break these dependencies. Continue?`
      )) {
        return;
      }
    }

    const newValue = { ...this.value };
    delete newValue[key];
    this._emitChange(newValue);
  }

  _handleDuplicate(key) {
    const processor = this._processors.find(p => p.key === key);
    if (!processor) return;

    // Find unique name
    let suffix = 2;
    let newKey = `${key}_${suffix}`;
    while (newKey in this.value) {
      suffix++;
      newKey = `${key}_${suffix}`;
    }

    const newValue = {
      ...this.value,
      [newKey]: { ...processor.config }
    };

    this._emitChange(newValue);
  }

  _handleSave(event) {
    const { key, config } = event.detail;

    const newValue = { ...this.value };

    // Check if renaming (edit mode with different key)
    if (this._editorMode === 'edit' && key !== this._editingKey) {
      delete newValue[this._editingKey];
    }

    newValue[key] = config;
    this._emitChange(newValue);

    this._editorOpen = false;
  }

  _handleCancel() {
    this._editorOpen = false;
  }

  _emitChange(newValue) {
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: newValue },
      bubbles: true,
      composed: true
    }));
  }

  // ========== Rendering ==========

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h3>${this.label}</h3>
          <ha-button
            appearance="filled"
            variant="brand"
            @click="${this._handleAdd}">
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add Processor
          </ha-button>
        </div>

        ${this._dependencyErrors.length > 0 ? html`
          <div class="error-list">
            ${this._dependencyErrors.map(error => html`
              <div class="error-item">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                ${error}
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._processors.length === 0 ? this._renderEmptyState() : this._renderSplitPane()}
      </div>

      <lcards-processor-editor
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .mode="${this._editorMode}"
        .processorKey="${this._editingKey}"
        .processorConfig="${this._editingConfig}"
        .existingProcessors="${this._processors.map(p => p.key)}"
        .open="${this._editorOpen}"
        @save="${this._handleSave}"
        @cancel="${this._handleCancel}">
      </lcards-processor-editor>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">⚙️</div>
        <div>No processors configured</div>
        <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
          Add processors to transform, smooth, or analyze data
        </div>
      </div>
    `;
  }

  _renderSplitPane() {
    const tree = this._buildTree();

    return html`
      <div class="split-pane-container">
        <!-- Left: Tree View -->
        <div class="tree-pane">
          <div class="tree-pane-header">
            <span>Processors (${this._processors.length})</span>
          </div>
          <div class="tree-container">
            ${this._renderTreeNodes(tree.roots, tree.childrenMap, 0)}
          </div>
        </div>

        <!-- Right: Detail View -->
        <div class="detail-pane">
          <div class="detail-pane-content">
            ${this._renderDetail()}
          </div>
        </div>
      </div>
    `;
  }

  _renderTreeNodes(nodes, childrenMap, level) {
    if (!nodes || nodes.length === 0) return nothing;

    return nodes.map(processor => {
      const hasChildren = childrenMap.get(processor.key)?.length > 0;
      const isExpanded = this._expandedNodes.has(processor.key);
      const isSelected = this._selectedNode?.key === processor.key;
      const executionIndex = this._executionOrder.indexOf(processor.key);

      return html`
        <div class="tree-node" style="--node-level: ${level}">
          <div
            class="tree-node-content ${isSelected ? 'selected' : ''}"
            @click=${() => this._selectNode(processor)}>
            <span
              class="tree-expander ${hasChildren ? '' : 'leaf'}"
              @click=${(e) => {
                e.stopPropagation();
                if (hasChildren) this._toggleNode(processor.key);
              }}>
              ${hasChildren ? (isExpanded ? '▼' : '▶') : ''}
            </span>
            <div class="execution-order">${executionIndex + 1}</div>
            <span class="node-label">${processor.key}</span>
            <span class="node-type">${processor.type}</span>
          </div>
          ${isExpanded && hasChildren ? html`
            ${this._renderTreeNodes(childrenMap.get(processor.key), childrenMap, level + 1)}
          ` : nothing}
        </div>
      `;
    });
  }

  _renderDetail() {
    if (!this._selectedNode) {
      return html`
        <div class="detail-panel-empty">
          <ha-icon icon="mdi:cursor-pointer"></ha-icon>
          <p>Select a processor from the tree to view details</p>
        </div>
      `;
    }

    const { key, type, config, from } = this._selectedNode;
    const children = this._processors.filter(p => p.from === key);

    return html`
      <div class="detail-header">
        <h3>${key}</h3>
        <span class="detail-type-badge">${type}</span>
      </div>

      <div class="action-buttons">
        <ha-button
          appearance="filled"
          variant="neutral"
          @click=${() => this._handleEdit(key)}>
          <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
          Edit
        </ha-button>
        <ha-button
          appearance="filled"
          variant="neutral"
          @click=${() => this._handleDuplicate(key)}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Duplicate
        </ha-button>
        <ha-button
          appearance="outlined"
          variant="danger"
          @click=${() => this._handleDelete(key)}>
          <ha-icon icon="mdi:delete" slot="start"></ha-icon>
          Delete
        </ha-button>
      </div>

      <div class="config-section">
        <h4>Configuration</h4>
        <div class="config-display">
          <pre>${JSON.stringify(config, null, 2)}</pre>
        </div>
      </div>

      <div class="dependency-section">
        <h4>Dependencies</h4>
        <div class="dependency-info">
          <div><strong>Input from:</strong> ${from || '(raw data)'}</div>
          <div><strong>Output to:</strong> ${children.length > 0 ? children.map(c => c.key).join(', ') : '(final value)'}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('lcards-processor-tree-editor', LCARdSProcessorTreeEditor);
