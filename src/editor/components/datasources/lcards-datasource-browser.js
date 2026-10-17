/**
 * @fileoverview LCARdS DataSource Browser
 *
 * Professional modal dialog for browsing and inspecting all datasources
 * (card-local and global) with hierarchical tree view and live detail pane.
 *
 * Features:
 * - Tree view: Datasources → Entity → Processors → Buffers
 * - Detail pane: Live values, configuration, buffer charts/tables
 * - Live subscription to DataSourceManager (no polling)
 * - Responsive styling matching Theme Browser & Provenance Inspector
 *
 * @element lcards-datasource-browser
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} cardConfig - Card configuration (optional, for card-local context)
 */

import { LitElement, html, css } from 'lit';
import { studioDialogStyles } from '../../dialogs/studio-dialog-styles.js';
import { messageStyles } from '../../base/surface-styles.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { haFormatState, haFormatAttrValue, haFormatAttrName } from '../../../utils/ha-entity-display.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';

export class LCARdSDataSourceBrowser extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      cardConfig: { type: Object },
      open: { type: Boolean },
      _selectedNode: { type: Object, state: true },
      _expandedNodes: { state: true, attribute: false },
      _treeData: { type: Array, state: true },
      _subscriptions: { state: true, attribute: false }
    };
  }

  constructor() {
    super();
    // Reactive properties (declared in static properties); typed here for the checker.
    /** @type {any} */
    this.hass;
    /** @type {any} */
    this.cardConfig;
    this.open = false;
    this._selectedNode = null;
    this._expandedNodes = new Set();
    this._treeData = [];
    this._subscriptions = new Map();
  }

  updated(changedProps) {
    super.updated(changedProps);

    // When dialog opens, build tree and subscribe
    if (changedProps.has('open') && this.open) {
      this._buildTreeData();
      this._subscribeToDataSources();
    }

    // When dialog closes, unsubscribe
    if (changedProps.has('open') && !this.open) {
      this._unsubscribeAll();
    }
  }

  /**
   * Select a datasource by name (for external navigation)
   * @public
   */
  selectDataSource(sourceName) {
    // Find the datasource node in the tree
    const dsNode = this._treeData.find(node => node.label === sourceName);

    if (dsNode) {
      // Select the node
      this._selectedNode = dsNode;

      // Expand the node
      this._expandedNodes.add(dsNode.id);

      this.requestUpdate();
    } else {
      lcardsLog.warn(`[DataSourceBrowser] DataSource "${sourceName}" not found in tree`);
    }
  }

  /**
   * Close the browser dialog
   * @private
   */
  _handleClose() {
    this._unsubscribeAll();
    this.dispatchEvent(new CustomEvent('close'));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribeAll();
  }

  /**
   * Build hierarchical tree data from DataSourceManager
   * @private
   */
  _buildTreeData() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) {
      lcardsLog.warn('[DataSourceBrowser] DataSourceManager not available');
      this._treeData = [];
      return;
    }

    const tree = [];

    // Get all sources from manager
    const sources = dsManager.sources || new Map();

    sources.forEach((dataSource, sourceName) => {
      const node = {
        id: `ds_${sourceName}`,
        type: 'datasource',
        label: sourceName,
        icon: 'mdi:database',
        data: dataSource,
        children: /** @type {any[]} */ ([])
      };

      // Add entity node
      if (dataSource.cfg?.entity) {
        node.children.push({
          id: `${node.id}_entity`,
          type: 'entity',
          label: dataSource.cfg.entity,
          icon: 'mdi:home-assistant',
          data: { entityId: dataSource.cfg.entity },
          children: []
        });
      }

      // REFACTORED: Add processors from unified ProcessorManager
      if (dataSource.processorManager && dataSource.processorManager.processors.size > 0) {
        const processorsNode = {
          id: `${node.id}_processors`,
          type: 'processors',
          label: `Processors (${dataSource.processorManager.processors.size})`,
          icon: 'mdi:cog-outline',
          data: Array.from(dataSource.processorManager.processors.entries()),
          children: /** @type {any[]} */ ([])
        };

        let idx = 0;
        dataSource.processorManager.processors.forEach((processor, key) => {
          processorsNode.children.push({
            id: `${node.id}_processor_${idx}`,
            type: 'processor',
            label: `${key} (${processor.config.type})`,
            icon: 'mdi:function-variant',
            data: { key, processor, type: processor.config.type },
            children: /** @type {any[]} */ ([])
          });
          idx++;
        });

        node.children.push(processorsNode);
      }

      // Add buffers
      const bufferNode = {
        id: `${node.id}_buffers`,
        type: 'buffers',
        label: 'Buffers',
        icon: 'mdi:database-outline',
        data: {},
        children: /** @type {any[]} */ ([])
      };

      // Main buffer
      if (dataSource.buffer) {
        bufferNode.children.push({
          id: `${node.id}_buffer_main`,
          type: 'buffer',
          label: `Main Buffer (${dataSource.buffer.size()} values)`,
          icon: 'mdi:database-outline',
          data: { buffer: dataSource.buffer, bufferType: 'main' },
          children: /** @type {any[]} */ ([])
        });
      }

      // REFACTORED: Processor buffers from ProcessorManager
      if (dataSource.processorManager && dataSource.processorManager.processorBuffers.size > 0) {
        dataSource.processorManager.processorBuffers.forEach((buffer, key) => {
          bufferNode.children.push({
            id: `${node.id}_buffer_${key}`,
            type: 'buffer',
            label: `${key} Buffer (${buffer.size()} values)`,
            icon: 'mdi:database-outline',
            data: { buffer, bufferType: key },
            children: /** @type {any[]} */ ([])
          });
        });
      }

      if (bufferNode.children.length > 0) {
        node.children.push(bufferNode);
      }

      tree.push(node);
    });

    this._treeData = tree;
    lcardsLog.debug('[DataSourceBrowser] Tree data built', { nodeCount: tree.length });
  }

  /**
   * Subscribe to all datasources for live updates
   * @private
   */
  _subscribeToDataSources() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) return;

    const sources = dsManager.sources || new Map();

    sources.forEach((dataSource, sourceName) => {
      if (dataSource.subscribe) {
        const unsubscribe = dataSource.subscribe(() => {
          // Data updated - rebuild tree if needed
          this.requestUpdate();
        });

        this._subscriptions.set(sourceName, unsubscribe);
      }
    });

    lcardsLog.debug('[DataSourceBrowser] Subscribed to datasources', {
      count: this._subscriptions.size
    });
  }

  /**
   * Unsubscribe from all datasources
   * @private
   */
  _unsubscribeAll() {
    this._subscriptions.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    this._subscriptions.clear();
  }

  /**
   * Toggle node expansion
   * @private
   */
  _toggleNode(nodeId) {
    if (this._expandedNodes.has(nodeId)) {
      this._expandedNodes.delete(nodeId);
    } else {
      this._expandedNodes.add(nodeId);
    }
    this.requestUpdate();
  }

  /**
   * Select a node
   * @private
   */
  _selectNode(node) {
    this._selectedNode = node;
    this.requestUpdate();
  }

  /**
   * Render tree nodes recursively
   * @private
   */
  _renderTreeNodes(nodes, level = 0) {
    return nodes.map(node => html`
      <div class="tree-node" style="--node-level: ${level}">
        <div
          class="tree-node-content ${this._selectedNode?.id === node.id ? 'selected' : ''}"
          @click=${() => this._selectNode(node)}>
          <span
            class="tree-expander ${node.children.length === 0 ? 'leaf' : ''} ${this._expandedNodes.has(node.id) ? 'expanded' : ''}"
            @click=${(e) => {
              e.stopPropagation();
              if (node.children.length > 0) {
                this._toggleNode(node.id);
              }
            }}>
            ${node.children.length > 0 ? (this._expandedNodes.has(node.id) ? '▼' : '▶') : ''}
          </span>
          <ha-icon icon="${node.icon}"></ha-icon>
          <span class="node-label">${node.label}</span>
        </div>
        ${this._expandedNodes.has(node.id) && node.children.length > 0
          ? html`<div class="tree-node-children">${this._renderTreeNodes(node.children, level + 1)}</div>`
          : ''}
      </div>
    `);
  }

  /**
   * Render node detail pane
   * @private
   */
  _renderNodeDetail() {
    if (!this._selectedNode) {
      return html`
        <div class="detail-panel-empty">
          <ha-icon icon="mdi:cursor-pointer"></ha-icon>
          <p>Select a data source, entity, processor or buffer on the left.</p>
        </div>
      `;
    }

    const { type, label, data } = this._selectedNode;

    return html`
      <div class="detail-panel">
        <div class="detail-header">
          <ha-icon icon="${this._selectedNode.icon}"></ha-icon>
          <h3>${label}</h3>
          <span class="type-chip">${type}</span>
        </div>

        ${this._renderActionButtons()}

        <div class="detail-content">
          ${this._renderDetailContent(type, data, label)}
        </div>
      </div>
    `;
  }

  /**
   * Render action buttons for the selected node
   * @private
   */
  _renderActionButtons() {
    if (!this._selectedNode) return html``;

    const { type, label } = this._selectedNode;

    // Only show actions for datasource nodes
    if (type !== 'datasource') return html``;

    // Check if this is a card-local source
    const isCardLocal = this._isCardLocalSource(label);

    return html`
      <div class="action-buttons">
        ${isCardLocal ? html`
          <ha-button
            appearance="filled"
            variant="neutral"
            @click=${() => this._handleEditSource(label)}>
            <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
            Edit source
          </ha-button>
        ` : ''}
        <ha-button
          appearance="filled"
          variant="neutral"
          @click=${() => this._handleCopyConfig(label)}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Copy config
        </ha-button>
      </div>
    `;
  }

  /**
   * Check if a datasource is card-local
   * @private
   */
  _isCardLocalSource(sourceName) {
    const cardSources = this.cardConfig?.data_sources || {};
    return sourceName in cardSources;
  }

  /**
   * Handle edit source button click
   * @private
   */
  _handleEditSource(sourceName) {
    this.dispatchEvent(new CustomEvent('edit-source', {
      detail: { sourceName },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle copy config button click
   * @private
   */
  async _handleCopyConfig(sourceName) {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) return;

    const dataSource = dsManager.sources?.get(sourceName);
    if (!dataSource) return;

    // Get the original config (cfg property)
    const config = { ...dataSource.cfg };

    // Remove hass reference if present
    delete config.hass;

    const configJson = JSON.stringify(config, null, 2);

    const ok = await copyTextToClipboard(configJson);
    // HA's toast system listens for hass-notification
    this.dispatchEvent(new CustomEvent('hass-notification', {
      detail: { message: ok ? `Config for "${sourceName}" copied to clipboard` : 'Failed to copy config to clipboard' },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Render detail content based on node type
   * @private
   */
  _renderDetailContent(type, data, label) {
    switch (type) {
      case 'datasource':
        return this._renderDataSourceDetail(data);
      case 'entity':
        return this._renderEntityDetail(data);
      case 'processors':
        return this._renderProcessorsOverview(data);
      case 'processor':
        return this._renderProcessorDetail(data);
      case 'buffers':
        return this._renderBuffersOverview(data);
      case 'buffer':
        return this._renderBufferDetail(data);
      default:
        return html`<p>No detail view for ${type}</p>`;
    }
  }

  /**
   * Render datasource detail
   * @private
   */
  _renderDataSourceDetail(dataSource) {
    return html`
      <div class="detail-section">
        <h4>Configuration</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Entity ID:</span>
            <span class="detail-value">${dataSource.cfg?.entity || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Attribute:</span>
            <span class="detail-value">${dataSource.cfg?.attribute || 'State'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Window:</span>
            <span class="detail-value">${dataSource.windowSeconds || 60}s</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Min Emit:</span>
            <span class="detail-value">${dataSource.minEmitMs || 0}ms</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Buffer Size:</span>
            <span class="detail-value">${dataSource.buffer?.size() || 0} / ${dataSource.buffer?.capacity || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Subscribers:</span>
            <span class="detail-value">${dataSource.subscribers?.size || 0}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Current Value</h4>
        <div class="current-value">
          ${dataSource.buffer && dataSource.buffer.size() > 0
            ? html`
              <div class="value-display">
                <div><strong>Value:</strong> ${dataSource.buffer.last()?.v ?? 'N/A'}</div>
                <div><strong>Timestamp:</strong> ${dataSource.buffer.last()?.t ? new Date(dataSource.buffer.last().t).toLocaleString() : 'N/A'}</div>
              </div>
            `
            : html`<em>No data</em>`}
        </div>
      </div>
    `;
  }

  /**
   * Render entity detail
   * @private
   */
  _renderEntityDetail(data) {
    const entity = this.hass?.states?.[data.entityId];

    if (!entity) {
      return html`<p>Entity not found: ${data.entityId}</p>`;
    }

    return html`
      <div class="detail-section">
        <h4>Entity State</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">State:</span>
            <span class="detail-value">${haFormatState(this.hass, entity)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Last Changed:</span>
            <span class="detail-value">${new Date(entity.last_changed).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Attributes</h4>
        <div class="attributes-table">
          ${Object.entries(entity.attributes).map(([key, value]) => html`
            <div class="attribute-row">
              <span class="attribute-key">${haFormatAttrName(this.hass, entity, key)}:</span>
              <span class="attribute-value">${haFormatAttrValue(this.hass, entity, key)}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  /**
   * Render processor detail
   * @private
   */
  _renderProcessorDetail(data) {
    const { key, processor, type } = data;

    // Get buffer info if available
    const bufferSize = processor.buffer ? processor.buffer.size() : 0;
    const bufferCapacity = processor.buffer ? processor.buffer.capacity : 0;

    // Get dependency info
    const dependencies = processor.config?.from ? [processor.config.from] : [];

    // Create clean config for display
    const cleanConfig = this._sanitizeForDisplay(processor.config);

    return html`
      <div class="detail-section">
        <h4>Processor: ${key}</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${type}</span>
          </div>
          ${dependencies.length > 0 ? html`
            <div class="detail-item">
              <span class="detail-label">Dependencies:</span>
              <span class="detail-value">${dependencies.join(', ')}</span>
            </div>
          ` : ''}
          <div class="detail-item">
            <span class="detail-label">Buffer:</span>
            <span class="detail-value">${bufferSize} / ${bufferCapacity} points</span>
          </div>
          ${processor.lastValue !== undefined ? html`
            <div class="detail-item">
              <span class="detail-label">Current Value:</span>
              <span class="detail-value">${processor.lastValue}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h4>Configuration</h4>
        <pre class="config-block">${JSON.stringify(cleanConfig, null, 2)}</pre>
      </div>
    `;
  }

  /**
   * Sanitize object for JSON display - remove hass, circular refs, functions
   * @private
   */
  _sanitizeForDisplay(obj, depth = 0, seen = new WeakSet()) {
    if (depth > 10) return '[Max Depth]';
    if (obj === null || obj === undefined) return obj;

    // Handle primitives
    if (typeof obj !== 'object' && typeof obj !== 'function') return obj;

    // Skip functions
    if (typeof obj === 'function') return '[Function]';

    // Handle circular references
    if (seen.has(obj)) return '[Circular]';
    seen.add(obj);

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this._sanitizeForDisplay(item, depth + 1, seen));
    }

    // Handle objects
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip hass object and known problematic keys
      if (key === 'hass' || key === '_hass' || key === 'hassInstance') {
        cleaned[key] = '[HASS Object - Hidden]';
        continue;
      }

      // Skip functions
      if (typeof value === 'function') {
        continue;
      }

      cleaned[key] = this._sanitizeForDisplay(value, depth + 1, seen);
    }

    return cleaned;
  }

  /**
   * Render buffer detail
   * @private
   */
  _renderBufferDetail(data) {
    const { buffer, bufferType } = data;

    if (!buffer || !buffer.size || buffer.size() === 0) {
      return html`
        <div class="detail-section">
          <h4>${bufferType} Buffer</h4>
          <p><em>No data in buffer</em></p>
        </div>
      `;
    }

    const bufferSize = buffer.size();
    const allData = buffer.getAll(); // Get all buffer data
    const last10 = allData.slice(-10).reverse();

    return html`
      <div class="detail-section">
        <h4>${bufferType} Buffer (${bufferSize} / ${buffer.capacity} values)</h4>
        <div class="buffer-table">
          ${last10.map((entry, idx) => html`
            <div class="buffer-row">
              <span class="buffer-index">#${bufferSize - idx}</span>
              <span class="buffer-time">${new Date(entry.t).toLocaleTimeString()}</span>
              <span class="buffer-value">${entry.v}</span>
            </div>
          `)}
        </div>
        ${bufferSize > 10 ? html`<p class="buffer-note">Showing last 10 of ${bufferSize} values</p>` : ''}
      </div>
    `;
  }

  /**
   * Render processors overview (unified processing pipeline)
   * @private
   */
  _renderProcessorsOverview(processorsArray) {
    if (!processorsArray || processorsArray.length === 0) {
      return html`<p><em>No processors configured</em></p>`;
    }

    // Count by type
    const typeCounts = {};
    const dependencyMap = new Map();

    processorsArray.forEach(([key, processor]) => {
      const type = processor.config?.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // Track dependencies
      if (processor.config?.from) {
        dependencyMap.set(key, processor.config.from);
      }
    });

    return html`
      <div class="detail-section">
        <h4>Processing Pipeline Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Processors:</span>
            <span class="detail-value">${processorsArray.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Dependencies:</span>
            <span class="detail-value">${dependencyMap.size} processors with dependencies</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>By Type</h4>
        <div class="detail-grid">
          ${Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => html`
            <div class="detail-item">
              <span class="detail-label">${type}:</span>
              <span class="detail-value">${count}</span>
            </div>
          `)}
        </div>
      </div>

      <div class="detail-section">
        <h4>All Processors</h4>
        <div class="detail-grid">
          ${processorsArray.map(([key, processor]) => {
            const type = processor.config?.type || 'unknown';
            const from = processor.config?.from;
            const dependency = from ? ` ← ${from}` : '';
            const bufferSize = processor.buffer ? processor.buffer.size() : 0;

            return html`
              <div class="detail-item">
                <span class="detail-label">${key}:</span>
                <span class="detail-value">${type}${dependency} (${bufferSize} points)</span>
              </div>
            `;
          })}
        </div>
      </div>

      ${dependencyMap.size > 0 ? html`
        <div class="detail-section">
          <h4>Dependency Graph</h4>
          <div class="dependency-tree">
            ${processorsArray.map(([key, processor]) => {
              const from = processor.config?.from;
              return from ? html`
                <div class="dependency-item">
                  <span class="dep-source">${from}</span>
                  <span class="dep-arrow">→</span>
                  <span class="dep-target">${key}</span>
                </div>
              ` : '';
            })}
          </div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Render buffers overview
   * @private
   */
  _renderBuffersOverview(data) {
    // Get parent datasource from selected node ID
    // ID format: ds_<sourceName>_buffers
    const idParts = this._selectedNode?.id?.split('_');
    if (!idParts || idParts.length < 3 || idParts[0] !== 'ds') {
      return html`<p><em>Could not determine datasource from node ID</em></p>`;
    }

    // Extract source name (everything between 'ds_' and '_buffers')
    // Handle source names that might contain underscores
    const dsName = idParts.slice(1, -1).join('_');

    const dsManager = window.lcards?.core?.dataSourceManager;
    const dataSource = dsManager?.getSource(dsName);

    if (!dataSource) {
      return html`<p><em>DataSource "${dsName}" not found</em></p>`;
    }

    const buffers = [];

    // Main buffer
    if (dataSource.buffer) {
      buffers.push({
        name: 'Main',
        buffer: dataSource.buffer,
        size: dataSource.buffer.size(),
        capacity: dataSource.buffer.capacity
      });
    }

    // REFACTORED: Processor buffers from ProcessorManager
    if (dataSource.processorManager?.processorBuffers && dataSource.processorManager.processorBuffers.size > 0) {
      dataSource.processorManager.processorBuffers.forEach((buffer, key) => {
        buffers.push({
          name: `Processor: ${key}`,
          buffer: buffer,
          size: buffer.size(),
          capacity: buffer.capacity
        });
      });
    }

    const totalSize = buffers.reduce((sum, b) => sum + b.size, 0);
    const totalCapacity = buffers.reduce((sum, b) => sum + b.capacity, 0);
    const memoryEstimate = totalSize * 16; // Rough estimate: 16 bytes per entry

    return html`
      <div class="detail-section">
        <h4>Buffers Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Buffers:</span>
            <span class="detail-value">${buffers.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total Entries:</span>
            <span class="detail-value">${totalSize} / ${totalCapacity}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Est. Memory:</span>
            <span class="detail-value">${memoryEstimate < 1024 ? `${memoryEstimate} B` : `${(memoryEstimate / 1024).toFixed(1)} KB`}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>All Buffers</h4>
        <div class="detail-grid">
          ${buffers.map(b => html`
            <div class="detail-item">
              <span class="detail-label">${b.name}:</span>
              <span class="detail-value">${b.size} / ${b.capacity} (${Math.round(b.size / b.capacity * 100)}%)</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  static get styles() {
    return [studioDialogStyles, messageStyles, css`
      :host {
        display: block;
      }

      /* Tree | detail, as a studio's config | preview */
      .studio-layout {
        grid-template-columns: minmax(240px, 32%) 1fr;
      }

      .tree-head {
        padding: var(--ha-space-3) var(--ha-space-4);
        font-weight: 600;
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-2);
        min-height: 0;
      }

      .tree-empty {
        padding: var(--ha-space-6);
        text-align: center;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2);
        padding-left: calc(var(--ha-space-2) + var(--node-level, 0) * var(--ha-space-4));
        border-radius: var(--ha-border-radius-sm);
        color: var(--primary-text-color);
        cursor: pointer;
        user-select: none;
      }

      .tree-node-content:hover {
        background: var(--secondary-background-color);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .tree-expander {
        width: 16px;
        flex: none;
        text-align: center;
        font-size: 12px;
      }

      .tree-expander.leaf {
        visibility: hidden;
      }

      .tree-node-content ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }

      .node-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Detail pane */
      .preview-panel {
        overflow-y: auto;
        padding: var(--ha-space-4);
      }

      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-3);
        height: 100%;
        color: var(--secondary-text-color);
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
        margin-bottom: var(--ha-space-3);
      }

      .detail-header h3 {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .type-chip {
        padding: 2px var(--ha-space-2);
        border-radius: var(--ha-border-radius-pill);
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-4);
      }

      /* Each block reads like an lcards-form-section card */
      .detail-section {
        margin-bottom: var(--ha-space-3);
        padding: var(--ha-space-3);
        border-radius: var(--ha-border-radius-lg);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 30%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }

      .detail-section h4 {
        margin: 0 0 var(--ha-space-3);
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .detail-grid,
      .attributes-table {
        display: grid;
        gap: var(--ha-space-1);
      }

      .detail-item,
      .attribute-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 6px 0;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .detail-item:last-child,
      .attribute-row:last-child {
        border-bottom: none;
      }

      .detail-label,
      .attribute-key {
        font-weight: 500;
        color: var(--secondary-text-color);
      }

      .detail-value,
      .attribute-value {
        font-family: var(--code-font-family, monospace);
        color: var(--primary-text-color);
        text-align: right;
        overflow-wrap: anywhere;
      }

      /* Code-like blocks */
      .current-value,
      .config-block,
      .value-display,
      .dependency-tree,
      .buffer-table {
        padding: var(--ha-space-3);
        border-radius: var(--ha-border-radius-md);
        background: var(--primary-background-color);
        font-family: var(--code-font-family, monospace);
        font-size: 13px;
        color: var(--primary-text-color);
        overflow-x: auto;
      }

      .value-display div {
        margin: var(--ha-space-1) 0;
      }

      .dependency-tree,
      .buffer-table {
        display: grid;
        gap: var(--ha-space-1);
      }

      .buffer-table {
        max-height: 400px;
        overflow-y: auto;
      }

      .dependency-item,
      .buffer-row {
        display: grid;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 6px var(--ha-space-2);
        border-radius: var(--ha-border-radius-sm);
        background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
      }

      .dependency-item {
        display: flex;
      }

      .buffer-row {
        grid-template-columns: 48px 120px 1fr;
      }

      .dep-source,
      .buffer-value {
        color: var(--primary-color);
        overflow-wrap: anywhere;
      }

      .dep-arrow,
      .buffer-index,
      .buffer-time {
        color: var(--secondary-text-color);
      }

      .dep-target {
        color: var(--accent-color, var(--primary-color));
      }

      .buffer-note {
        margin-top: var(--ha-space-2);
      }
    `];
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <ha-dialog
        open
        flexcontent
        @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}
        header-title="Data Source Browser">
        <div class="dialog-content">
          <div class="studio-layout">
            <div class="config-panel">
              <div class="tree-head">Data sources on this page (${this._treeData.length})</div>
              <div class="tree-container">
                ${this._treeData.length > 0
                  ? this._renderTreeNodes(this._treeData)
                  : html`<p class="hint tree-empty">No data sources are running on this page.</p>`}
              </div>
            </div>
            <div class="preview-panel">
              ${this._renderNodeDetail()}
            </div>
          </div>
        </div>

        <div slot="footer">
          <ha-button appearance="plain" @click=${this._handleClose} data-dialog="close">Close</ha-button>
        </div>
      </ha-dialog>
    `;
  }
}

if (!customElements.get('lcards-datasource-browser')) customElements.define('lcards-datasource-browser', LCARdSDataSourceBrowser);
