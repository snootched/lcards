/**
 * LCARdS Pack Explorer Dialog
 *
 * Professional modal dialog for browsing and inspecting all loaded packs,
 * their themes, presets, animations, SVG assets, and components.
 *
 * Features:
 * - Tree view: Packs → Asset Types → Individual Assets
 * - Detail pane: Metadata, live previews, copy-to-clipboard actions
 * - Reuses existing editor infrastructure (DataSource Browser patterns)
 * - Responsive styling matching Theme Browser & DataSource Browser
 *
 * @element lcards-pack-explorer-dialog
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../../components/shared/lcards-dialog.js';
import { 
  renderThemePreview, 
  renderPresetPreview, 
  renderAnimationPreview,
  rendererStyles 
} from './renderers/asset-renderers.js';

export class LCARdSPackExplorerDialog extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      open: { type: Boolean },
      _selectedNode: { type: Object, state: true },
      _expandedNodes: { state: true, attribute: false },
      _treeData: { type: Array, state: true },
      _searchQuery: { type: String, state: true }
    };
  }

  constructor() {
    super();
    this.open = false;
    this._selectedNode = null;
    this._expandedNodes = new Set();
    this._treeData = [];
    this._searchQuery = '';
  }

  static get styles() {
    return [
      rendererStyles,
      css`
      :host {
        display: contents;
      }

      .explorer-container {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 16px;
        height: 600px;
        max-height: 80vh;
        padding: 16px;
      }

      .tree-panel {
        border-right: 1px solid var(--divider-color);
        overflow-y: auto;
        padding-right: 16px;
      }

      .detail-panel {
        overflow-y: auto;
        padding-left: 16px;
      }

      .search-box {
        margin-bottom: 16px;
        width: 100%;
      }

      .search-box input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-family: inherit;
        font-size: 14px;
      }

      .tree-node {
        padding: 6px 8px;
        cursor: pointer;
        border-radius: 4px;
        margin: 2px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      .tree-node:hover {
        background: var(--secondary-background-color);
      }

      .tree-node.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .tree-node.expandable {
        font-weight: 500;
      }

      .tree-node .icon {
        width: 20px;
        text-align: center;
      }

      .tree-children {
        margin-left: 20px;
        border-left: 1px solid var(--divider-color);
        padding-left: 8px;
      }

      .tree-node .expand-icon {
        width: 16px;
        height: 16px;
        display: inline-block;
        transition: transform 0.2s;
      }

      .tree-node.expanded .expand-icon {
        transform: rotate(90deg);
      }

      .detail-card {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .detail-header {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--primary-text-color);
      }

      .detail-section {
        margin-bottom: 16px;
      }

      .detail-section-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--secondary-text-color);
      }

      .detail-value {
        font-family: 'Courier New', monospace;
        background: var(--secondary-background-color);
        padding: 8px;
        border-radius: 4px;
        font-size: 13px;
      }

      .copy-button {
        margin-top: 8px;
        padding: 8px 16px;
        background: var(--primary-color);
        color: var(--text-primary-color);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .copy-button:hover {
        opacity: 0.9;
      }

      .empty-state {
        padding: 48px 16px;
        text-align: center;
        color: var(--secondary-text-color);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat-card {
        background: var(--secondary-background-color);
        padding: 12px;
        border-radius: 6px;
        text-align: center;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-color);
      }

      .stat-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      @media (max-width: 768px) {
        .explorer-container {
          grid-template-columns: 1fr;
          height: auto;
        }

        .tree-panel {
          border-right: none;
          border-bottom: 1px solid var(--divider-color);
          padding-right: 0;
          padding-bottom: 16px;
          max-height: 300px;
        }

        .detail-panel {
          padding-left: 0;
          padding-top: 16px;
        }
      }
    `
    ];
  }

  updated(changedProps) {
    super.updated(changedProps);

    // When dialog opens, build tree data
    if (changedProps.has('open') && this.open) {
      this._buildTreeData();
    }
  }

  /**
   * Build hierarchical tree data from PackManager and singletons
   * @private
   */
  _buildTreeData() {
    const core = window.lcards?.core;
    if (!core) {
      lcardsLog.warn('[PackExplorer] LCARdS core not available');
      this._treeData = [];
      return;
    }

    const tree = [];

    // Get all loaded packs
    const packs = core.packManager?.getLoadedPacks() || [];

    packs.forEach(pack => {
      const packNode = {
        id: `pack_${pack.id}`,
        type: 'pack',
        label: pack.id,
        icon: '📦',
        data: pack,
        children: []
      };

      // Add themes category
      if (pack.themeCount > 0) {
        const themesNode = {
          id: `${packNode.id}_themes`,
          type: 'category',
          label: `🎨 Themes (${pack.themeCount})`,
          icon: '🎨',
          data: { category: 'themes', packId: pack.id },
          children: []
        };

        // Add individual themes
        const themes = core.themeManager?.getThemesByPack(pack.id) || [];
        themes.forEach(theme => {
          themesNode.children.push({
            id: `theme_${theme.id}`,
            type: 'theme',
            label: theme.name || theme.id,
            icon: '🎨',
            data: theme
          });
        });

        packNode.children.push(themesNode);
      }

      // Add presets category
      if (pack.presetCount > 0) {
        const presetsNode = {
          id: `${packNode.id}_presets`,
          type: 'category',
          label: `🎛️ Presets (${pack.presetCount})`,
          icon: '🎛️',
          data: { category: 'presets', packId: pack.id },
          children: []
        };

        // Get presets grouped by type
        const packMetadata = core.packManager?.getPackMetadata(pack.id);
        if (packMetadata?.presets) {
          Object.entries(packMetadata.presets).forEach(([type, presets]) => {
            const typeNode = {
              id: `${packNode.id}_presets_${type}`,
              type: 'preset-type',
              label: `${type} (${presets.length})`,
              icon: '🎛️',
              data: { presetType: type, packId: pack.id },
              children: []
            };

            presets.forEach(preset => {
              typeNode.children.push({
                id: `preset_${type}_${preset.id}`,
                type: 'preset',
                label: preset.id,
                icon: '🎛️',
                data: preset
              });
            });

            presetsNode.children.push(typeNode);
          });
        }

        packNode.children.push(presetsNode);
      }

      tree.push(packNode);
    });

    this._treeData = tree;
    lcardsLog.debug('[PackExplorer] Tree data built:', tree);
  }

  /**
   * Handle node selection
   * @private
   */
  _handleNodeClick(node) {
    this._selectedNode = node;

    // Toggle expansion for expandable nodes
    if (node.children && node.children.length > 0) {
      if (this._expandedNodes.has(node.id)) {
        this._expandedNodes.delete(node.id);
      } else {
        this._expandedNodes.add(node.id);
      }
      this.requestUpdate();
    }
  }

  /**
   * Render tree node recursively
   * @private
   */
  _renderTreeNode(node, level = 0) {
    const isExpanded = this._expandedNodes.has(node.id);
    const isSelected = this._selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return html`
      <div
        class="tree-node ${hasChildren ? 'expandable' : ''} ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}"
        @click=${() => this._handleNodeClick(node)}
        style="padding-left: ${level * 12 + 8}px">
        ${hasChildren ? html`<span class="expand-icon">▶</span>` : html`<span class="icon">${node.icon || ''}</span>`}
        <span>${node.label}</span>
      </div>
      ${hasChildren && isExpanded
        ? html`
            <div class="tree-children">
              ${node.children.map(child => this._renderTreeNode(child, level + 1))}
            </div>
          `
        : ''}
    `;
  }

  /**
   * Render detail panel based on selected node
   * @private
   */
  _renderDetailPanel() {
    if (!this._selectedNode) {
      return html`
        <div class="empty-state">
          <p>Select an item from the tree to view details</p>
        </div>
      `;
    }

    const node = this._selectedNode;

    switch (node.type) {
      case 'pack':
        return this._renderPackDetail(node.data);
      case 'theme':
        return this._renderThemeDetail(node.data);
      case 'preset':
        return this._renderPresetDetail(node.data);
      default:
        return html`
          <div class="detail-card">
            <div class="detail-header">${node.label}</div>
            <div class="detail-section">
              <div class="detail-section-title">Type</div>
              <div class="detail-value">${node.type}</div>
            </div>
          </div>
        `;
    }
  }

  /**
   * Render pack details
   * @private
   */
  _renderPackDetail(pack) {
    return html`
      <div class="detail-card">
        <div class="detail-header">${pack.id}</div>
        
        <div class="detail-section">
          <div class="detail-section-title">Description</div>
          <div class="detail-value">${pack.description || 'No description available'}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Version</div>
          <div class="detail-value">${pack.version || 'Unknown'}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${pack.themeCount || 0}</div>
            <div class="stat-label">Themes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${pack.presetCount || 0}</div>
            <div class="stat-label">Presets</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${pack.ruleCount || 0}</div>
            <div class="stat-label">Rules</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${pack.assetCount || 0}</div>
            <div class="stat-label">Assets</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render theme details
   * @private
   */
  _renderThemeDetail(theme) {
    return html`
      <div class="detail-card">
        <div class="detail-header">${theme.name || theme.id}</div>
        
        <div class="detail-section">
          <div class="detail-section-title">Description</div>
          <div class="detail-value">${theme.description || 'No description available'}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Pack</div>
          <div class="detail-value">${theme.pack || 'unknown'}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Version</div>
          <div class="detail-value">${theme.version || 'Unknown'}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Token Count</div>
          <div class="detail-value">${theme.tokenCount || 0} tokens</div>
        </div>

        ${renderThemePreview(theme)}

        <div class="detail-section">
          <div class="detail-section-title">Config Reference</div>
          <div class="detail-value">theme: "${theme.id}"</div>
          <button class="copy-button" @click=${() => this._copyToClipboard(`theme: "${theme.id}"`)}>
            Copy to Clipboard
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render preset details
   * @private
   */
  _renderPresetDetail(preset) {
    const yamlRef = `preset: "${preset.id}"`;
    
    return html`
      <div class="detail-card">
        <div class="detail-header">${preset.id}</div>
        
        <div class="detail-section">
          <div class="detail-section-title">Description</div>
          <div class="detail-value">${preset.description || 'No description available'}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Type</div>
          <div class="detail-value">${preset.presetType || preset.type}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Pack</div>
          <div class="detail-value">${preset.pack || 'unknown'}</div>
        </div>

        ${preset.extends ? html`
          <div class="detail-section">
            <div class="detail-section-title">Extends</div>
            <div class="detail-value">${preset.extends}</div>
          </div>
        ` : ''}

        ${renderPresetPreview(preset)}

        <div class="detail-section">
          <div class="detail-section-title">Config Reference</div>
          <div class="detail-value">${yamlRef}</div>
          <button class="copy-button" @click=${() => this._copyToClipboard(yamlRef)}>
            Copy to Clipboard
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Copy text to clipboard
   * @private
   */
  async _copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      lcardsLog.info('[PackExplorer] Copied to clipboard:', text);
      
      // Show a brief success message (could be enhanced with toast notification)
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (error) {
      lcardsLog.error('[PackExplorer] Failed to copy to clipboard:', error);
    }
  }

  /**
   * Handle dialog close
   * @private
   */
  _handleClose() {
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <lcards-dialog
        .open=${this.open}
        .heading=${'Pack Explorer'}
        @closed=${this._handleClose}>
        <div class="explorer-container">
          <div class="tree-panel">
            <div class="search-box">
              <input
                type="text"
                placeholder="Search packs, themes, presets..."
                .value=${this._searchQuery}
                @input=${(e) => { this._searchQuery = e.target.value; }}
              />
            </div>
            ${this._treeData.length === 0
              ? html`<div class="empty-state">No packs loaded</div>`
              : this._treeData.map(node => this._renderTreeNode(node))}
          </div>
          <div class="detail-panel">
            ${this._renderDetailPanel()}
          </div>
        </div>
      </lcards-dialog>
    `;
  }
}

customElements.define('lcards-pack-explorer-dialog', LCARdSPackExplorerDialog);
