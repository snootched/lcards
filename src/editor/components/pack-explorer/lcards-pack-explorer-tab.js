/**
 * @fileoverview LCARdS Pack Explorer Tab Component
 *
 * Reusable component for browsing and inspecting loaded packs.
 * Can be used standalone in a dialog or embedded in the config panel.
 *
 * Features:
 * - Tree view: Packs → Asset Types → Individual Assets
 * - Detail pane: Metadata, live previews, copy-to-clipboard actions
 * - Inline mode support for panel embedding
 *
 * @element lcards-pack-explorer-tab
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Boolean} _inlineMode - Set to true when embedded in panel (hides dialog wrapper)
 */

import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import {
  renderThemePreview,
  rendererStyles
} from '../../dialogs/pack-explorer/renderers/asset-renderers.js';

export class LCARdSPackExplorerTab extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _inlineMode: { type: Boolean, state: true },
      _selectedNode: { type: Object, state: true },
      _expandedNodes: { state: true, attribute: false },
      _treeData: { type: Array, state: true },
      _loadingSvg: { type: Boolean, state: true },
      _svgContent: { type: String, state: true }
    };
  }

  constructor() {
    super();
    this._inlineMode = false;
    this._selectedNode = null;
    this._expandedNodes = new Set();
    this._treeData = [];
    this._loadingSvg = false;
    this._svgContent = null;
  }

  static get styles() {
    return [
      rendererStyles,
      css`
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }

      /* Studio Layout Container */
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

      .content-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .header {
        flex-shrink: 0;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--divider-color);
      }

      .header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      /* Split pane layout */
      .split-pane-container {
        display: grid;
        grid-template-columns: 35% 65%;
        grid-template-rows: minmax(0, 1fr);
        gap: 12px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      /* Tree pane */
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
        padding: 14px 24px;
        border-bottom: 1px solid var(--divider-color);
        background: rgba(60,60,60,0.5);
        flex-shrink: 0;
        border-top-left-radius: var(--ha-card-border-radius, 12px);
      }

      .tree-pane-header span {
        font-weight: 500;
        font-size: 18px;
        color: var(--primary-text-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        background: rgba(60,60,60,0.5);
        border-bottom-left-radius: var(--ha-card-border-radius, 12px);
      }

      /* Tree nodes */
      .tree-node {
        margin-left: calc(var(--node-level, 0) * 16px);
        margin-bottom: 4px;
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
        transition: transform 0.2s;
      }

      .tree-expander.leaf {
        opacity: 0;
      }

      .tree-expander.expanded {
        transform: rotate(0deg);
      }

      .node-label {
        flex: 1;
        font-size: 14px;
      }

      /* Detail pane */
      .detail-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }

      .detail-pane-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-left: 8px;
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

      .detail-panel {
        height: 100%;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        margin-bottom: 12px;
      }

      .detail-header h3 {
        margin: 0;
        flex: 1;
        font-size: 18px;
      }

      .detail-type {
        padding: 4px 12px;
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }

      .detail-content {
        padding: 0 16px;
      }

      .detail-section {
        margin-bottom: 8px;
      }

      .detail-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-grid {
        display: grid;
        gap: 6px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 10px;
      }

      .detail-label {
        font-weight: 500;
        color: var(--secondary-text-color);
      }

      .detail-value {
        font-family: 'Courier New', monospace;
        color: var(--primary-text-color);
        text-align: right;
      }

      .empty-state {
        padding: 48px 16px;
        text-align: center;
        color: var(--secondary-text-color);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px;
        margin-bottom: 16px;
      }

      .stat-card {
        background: var(--primary-color);
        padding: 10px 8px;
        border-radius: 6px;
        text-align: center;
        color: var(--primary-text-color, white);
        opacity: 0.9;
        transition: opacity 0.15s;
      }

      .stat-card.zero {
        opacity: 0.35;
      }

      .stat-card .stat-icon {
        font-size: 18px;
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 22px;
        font-weight: 600;
        line-height: 1;
      }

      .stat-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .svg-preview-container {
        background: rgba(60,60,60,0.5);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        max-height: 600px;
        overflow: auto;
      }

      .svg-preview-container svg {
        max-width: 100%;
        max-height: 550px;
        height: auto;
      }

      .preview-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        gap: 12px;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--divider-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .preview-placeholder {
        background: rgba(60,60,60,0.5);
        border: 2px dashed var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 24px;
        text-align: center;
      }

      .preview-note {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-top: 8px;
      }

      .load-preview-button {
        padding: 10px 20px;
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .load-preview-button:hover {
        opacity: 0.9;
      }

      .font-preview-container {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 24px;
      }

      .font-sample {
        font-size: 16px;
        line-height: 1.8;
        color: var(--primary-text-color);
        margin: 0;
      }

      .audio-preview-container {
        background: rgba(60,60,60,0.5);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        justify-content: center;
      }

      .audio-preview-container audio {
        width: 100%;
        max-width: 400px;
      }

      .preset-preview-container {
        background: rgba(60,60,60,0.5);
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100px;
      }

      @media (max-width: 768px) {
        .split-pane-container {
          grid-template-columns: 1fr;
          height: auto;
        }

        .tree-pane {
          border-right: none;
          border-bottom: 1px solid var(--divider-color);
          max-height: 300px;
        }

        .detail-pane {
          padding-left: 0;
        }
      }
    `
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this._buildTreeData();
  }

  updated(changedProps) {
    super.updated(changedProps);

    // Rebuild tree data when hass changes
    // @ts-ignore - TS2339: auto-suppressed
    if (changedProps.has('hass') && this.hass) {
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

      // Add components category (from global registry)
      const componentsForPack = this._getComponentsForPack(pack.id);
      if (componentsForPack.length > 0) {
        const componentsNode = {
          id: `${packNode.id}_components`,
          type: 'category',
          label: `🧩 Components (${componentsForPack.length})`,
          icon: '🧩',
          data: { category: 'components', packId: pack.id },
          children: []
        };

        componentsForPack.forEach(comp => {
          const componentPresets = comp.definition?.presets
            ? Object.keys(comp.definition.presets)
            : [];

          const compNode = {
            id: `component_${comp.name}`,
            type: 'component',
            label: comp.name,
            icon: '🧩',
            data: comp,
            children: componentPresets.map(presetName => ({
              id: `component_${comp.name}_preset_${presetName}`,
              type: 'component-preset',
              label: presetName,
              icon: '🎛️',
              data: {
                componentName: comp.name,
                presetName,
                preset: comp.definition.presets[presetName],
                pack: pack.id
              }
            }))
          };

          componentsNode.children.push(compNode);
        });

        packNode.children.push(componentsNode);
      }

      // Add animations category (from AnimationRegistry)
      const animations = core.animationRegistry?.getAnimationsWithMetadata() || [];
      const animsForPack = animations.filter(a => a.pack === pack.id);
      if (animsForPack.length > 0) {
        const animationsNode = {
          id: `${packNode.id}_animations`,
          type: 'category',
          label: `🎬 Animations (${animsForPack.length})`,
          icon: '🎬',
          data: { category: 'animations', packId: pack.id },
          children: []
        };

        animsForPack.forEach(anim => {
          animationsNode.children.push({
            id: `animation_${anim.id}`,
            type: 'animation',
            label: anim.name,
            icon: '🎬',
            data: anim
          });
        });

        packNode.children.push(animationsNode);
      }

      // Add SVG assets category
      const svgAssets = this._getAssetsForPack('svg', pack.id);
      if (svgAssets.length > 0) {
        const svgNode = {
          id: `${packNode.id}_svg_assets`,
          type: 'category',
          label: `🖼️ SVG Assets (${svgAssets.length})`,
          icon: '🖼️',
          data: { category: 'svg_assets', packId: pack.id },
          children: []
        };

        svgAssets.forEach(asset => {
          svgNode.children.push({
            id: `svg_${asset.key}`,
            type: 'svg_asset',
            label: asset.key,
            icon: '🖼️',
            data: asset
          });
        });

        packNode.children.push(svgNode);
      }

      // Add font assets category
      const fontAssets = this._getAssetsForPack('font', pack.id);
      if (fontAssets.length > 0) {
        const fontNode = {
          id: `${packNode.id}_font_assets`,
          type: 'category',
          label: `🔤 Font Assets (${fontAssets.length})`,
          icon: '🔤',
          data: { category: 'font_assets', packId: pack.id },
          children: []
        };

        fontAssets.forEach(asset => {
          fontNode.children.push({
            id: `font_${asset.key}`,
            type: 'font_asset',
            label: asset.key,
            icon: '🔤',
            data: asset
          });
        });

        packNode.children.push(fontNode);
      }

      // Add audio assets category
      const audioAssets = this._getAssetsForPack('audio', pack.id);
      if (audioAssets.length > 0) {
        const audioNode = {
          id: `${packNode.id}_audio_assets`,
          type: 'category',
          label: `🔊 Audio Assets (${audioAssets.length})`,
          icon: '🔊',
          data: { category: 'audio_assets', packId: pack.id },
          children: []
        };

        audioAssets.forEach(asset => {
          audioNode.children.push({
            id: `audio_${asset.key}`,
            type: 'audio_asset',
            label: asset.key,
            icon: '🔊',
            data: asset
          });
        });

        packNode.children.push(audioNode);
      }

      tree.push(packNode);
    });

    this._treeData = tree;
    lcardsLog.debug('[PackExplorer] Tree data built:', tree);
  }

  /**
   * Get total asset count for a pack (SVG + font + audio)
   * @private
   */
  _getAssetCountForPack(packId) {
    const svgCount = this._getAssetsForPack('svg', packId).length;
    const fontCount = this._getAssetsForPack('font', packId).length;
    const audioCount = this._getAssetsForPack('audio', packId).length;
    return svgCount + fontCount + audioCount;
  }

  /**
   * Get components associated with a pack.
   * Queries ComponentManager, which has pack provenance set by PackManager
   * when each pack's components key is registered.
   * @private
   */
  _getComponentsForPack(packId) {
    const componentManager = window.lcards?.core?.componentManager;
    if (!componentManager) return [];

    return componentManager.getAllComponentNames()
      .map(name => ({ name, definition: componentManager.getComponent(name) }))
      .filter(({ definition }) => {
        // PackManager sets top-level `pack` when registering via registerComponentsFromPack.
        // Fall back to metadata.pack for externally-defined components, then 'core'.
        const pack = definition?.pack || definition?.metadata?.pack || 'core';
        return pack === packId;
      })
      .map(({ name, definition }) => ({ name, definition, pack: packId }));
  }

  /**
   * Get assets for a specific pack from AssetManager
   * @private
   */
  _getAssetsForPack(assetType, packId) {
    const core = window.lcards?.core;
    if (!core?.assetManager) {
      return [];
    }

    try {
      const registry = core.assetManager.getRegistry(assetType);
      const assets = [];

      registry.assets.forEach((asset, key) => {
        const assetPack = asset.metadata?.pack || asset.pack;
        if (assetPack === packId) {
          assets.push({
            key,
            ...asset.metadata,
            hasContent: !!asset.content,
            url: asset.url
          });
        }
      });

      return assets;
    } catch (error) {
      lcardsLog.warn(`[PackExplorer] Failed to get ${assetType} assets for pack ${packId}:`, error);
      return [];
    }
  }

  /**
   * Handle node selection
   * @private
   */
  _handleNodeClick(node) {
    this._selectedNode = node;
    this._svgContent = null;
    this._loadingSvg = false;

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
      <div class="tree-node" style="--node-level: ${level}">
        <div
          class="tree-node-content ${isSelected ? 'selected' : ''}"
          @click=${() => this._handleNodeClick(node)}>
          <span class="tree-expander ${hasChildren ? (isExpanded ? 'expanded' : '') : 'leaf'}">
            ${hasChildren ? '▶' : ''}
          </span>
          <span class="node-label">${node.label}</span>
        </div>
      </div>
      ${hasChildren && isExpanded
        ? node.children.map(child => this._renderTreeNode(child, level + 1))
        : ''}
    `;
  }

  /**
   * Render all tree nodes
   * @private
   */
  _renderTreeNodes(nodes) {
    return nodes.map(node => this._renderTreeNode(node));
  }

  /**
   * Render detail panel based on selected node
   * @private
   */
  _renderDetailPanel() {
    if (!this._selectedNode) {
      return html`
        <div class="detail-panel-empty">
          <ha-icon icon="mdi:package-variant"></ha-icon>
          <p>Select an item from the tree to view details</p>
        </div>
      `;
    }

    const node = this._selectedNode;

    return html`
      <div class="detail-panel">
        <div class="detail-header">
          <h3>${node.label}</h3>
          <span class="detail-type">${node.type}</span>
        </div>
        <div class="detail-content">
          ${this._renderDetailContent(node)}
        </div>
      </div>
    `;
  }

  /**
   * Render detail content based on node type
   * @private
   */
  _renderDetailContent(node) {
    switch (node.type) {
      case 'pack':
        return this._renderPackDetail(node.data);
      case 'theme':
        return this._renderThemeDetail(node.data);
      case 'preset':
        return this._renderPresetDetail(node.data);
      case 'component':
        return this._renderComponentDetail(node.data);
      case 'component-preset':
        return this._renderComponentPresetDetail(node.data);
      case 'animation':
        return this._renderAnimationDetail(node.data);
      case 'svg_asset':
        return this._renderSvgAssetDetail(node.data);
      case 'font_asset':
        return this._renderFontAssetDetail(node.data);
      case 'audio_asset':
        return this._renderAudioAssetDetail(node.data);
      case 'category':
        return this._renderCategoryDetail(node);
      default:
        return html`
          <div class="detail-section">
            <h4>Information</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${node.type}</span>
              </div>
            </div>
          </div>
        `;
    }
  }

  _renderCategoryDetail(node) {
    const childCount = node.children?.length || 0;
    return html`
      <div class="detail-section">
        <h4>Category Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${node.data?.category || 'Unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Items:</span>
            <span class="detail-value">${childCount}</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderPackDetail(pack) {
    return html`
      <div class="detail-section">
        <h4>Pack Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <span class="detail-value">${pack.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${pack.description || 'No description available'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Version:</span>
            <span class="detail-value">${pack.version || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Statistics</h4>
        <div class="stats-grid">
          ${this._renderStatCard('🎨', pack.themeCount || 0, 'Themes')}
          ${this._renderStatCard('🎛️', pack.presetCount || 0, 'Presets')}
          ${this._renderStatCard('🧩', this._getComponentsForPack(pack.id).length, 'Components')}
          ${this._renderStatCard('📋', pack.ruleCount || 0, 'Rules')}
          ${this._renderStatCard('🎬', this._getAnimationCountForPack(pack.id), 'Animations')}
          ${this._renderStatCard('🖼️', this._getAssetsForPack('svg', pack.id).length, 'SVG')}
          ${this._renderStatCard('🔤', this._getAssetsForPack('font', pack.id).length, 'Fonts')}
          ${this._renderStatCard('🔊', this._getAssetsForPack('audio', pack.id).length, 'Audio')}
        </div>
      </div>
    `;
  }

  /**
   * Render a single stat tile.
   * Tiles with a count of zero are rendered dimmed but still visible.
   * @private
   */
  _renderStatCard(icon, count, label) {
    return html`
      <div class="stat-card ${count === 0 ? 'zero' : ''}">
        <div class="stat-icon">${icon}</div>
        <div class="stat-value">${count}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  }

  /**
   * Get animation count for a pack from AnimationRegistry.
   * @private
   */
  _getAnimationCountForPack(packId) {
    const animations = window.lcards?.core?.animationRegistry?.getAnimationsWithMetadata() || [];
    return animations.filter(a => a.pack === packId).length;
  }

  _renderThemeDetail(theme) {
    return html`
      <div class="detail-section">
        <h4>Theme Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <span class="detail-value">${theme.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${theme.name || theme.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${theme.description || 'No description available'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack:</span>
            <span class="detail-value">${theme.pack || 'unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Version:</span>
            <span class="detail-value">${theme.version || 'Unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Token Count:</span>
            <span class="detail-value">${theme.tokenCount || 0}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Preview</h4>
        ${renderThemePreview(theme)}
      </div>
    `;
  }

  _renderPresetDetail(preset) {
    return html`
      <div class="detail-section">
        <h4>Preset Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <span class="detail-value">${preset.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${preset.description || 'No description available'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${preset.presetType || preset.type}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack:</span>
            <span class="detail-value">${preset.pack || 'unknown'}</span>
          </div>
          ${preset.extends ? html`
            <div class="detail-item">
              <span class="detail-label">Extends:</span>
              <span class="detail-value">${preset.extends}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h4>Live Preview</h4>
        ${this._renderPresetLivePreview(preset)}
      </div>
    `;
  }

  _renderPresetLivePreview(preset) {
    const presetType = preset.presetType || preset.type;

    let cardType, defaultEntity;
    if (presetType === 'button' || presetType?.includes('button')) {
      cardType = 'lcards-button';
      defaultEntity = 'light.demo';
    } else if (presetType === 'slider' || presetType?.includes('slider')) {
      cardType = 'lcards-slider';
      defaultEntity = 'sensor.demo';
    } else {
      return html`<div class="preview-placeholder">Preview not available for this preset type</div>`;
    }

    const config = {
      type: `custom:${cardType}`,
      entity: defaultEntity,
      preset: preset.id,
      label: { content: 'Preview' },
      show_icon: true,
      icon: defaultEntity === 'light.demo' ? 'mdi:lightbulb' : 'mdi:thermometer',
    };

    const cardElement = document.createElement(cardType);
    // @ts-ignore - TS2339: auto-suppressed
    cardElement.hass = this._createMockHass();

    try {
      // @ts-ignore - TS2339: auto-suppressed
      cardElement.setConfig(config);
    } catch (err) {
      lcardsLog.error('[PackExplorer] Failed to set config on preview card:', err);
      return html`<div class="preview-placeholder">Error creating preview: ${err.message}</div>`;
    }

    return html`
      <div class="preset-preview-container">
        ${cardElement}
      </div>
    `;
  }

  _createMockHass() {
    return {
      states: {
        'sensor.demo': {
          entity_id: 'sensor.demo',
          state: '42',
          attributes: {
            friendly_name: 'Demo Sensor',
            unit_of_measurement: '°C'
          },
          last_changed: new Date().toISOString()
        },
        'light.demo': {
          entity_id: 'light.demo',
          state: 'on',
          attributes: {
            friendly_name: 'Demo Light',
            brightness: 128
          },
          last_changed: new Date().toISOString()
        }
      },
      config: { unit_system: { temperature: '°C' } },
      language: 'en',
      themes: { default_theme: 'default' },
      selectedTheme: null,
      user: { name: 'Demo User' },
      callService: () => Promise.resolve(),
      callWS: () => Promise.resolve()
    };
  }

  _renderComponentDetail(component) {
    const definition = component.definition || {};
    const svgLength = definition.svg?.length || 0;
    const hasFeatures = definition.features && definition.features.length > 0;

    return html`
      <div class="detail-section">
        <h4>Component Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${component.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack:</span>
            <span class="detail-value">${component.pack || 'unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Orientation:</span>
            <span class="detail-value">${definition.orientation || 'auto'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">SVG Size:</span>
            <span class="detail-value">${svgLength} characters</span>
          </div>
          ${hasFeatures ? html`
            <div class="detail-item">
              <span class="detail-label">Features:</span>
              <span class="detail-value">${definition.features.join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${definition.svg ? html`
        <div class="detail-section">
          <h4>SVG Preview</h4>
          <div class="svg-preview-container">
            ${unsafeHTML(definition.svg)}
          </div>
        </div>
      ` : ''}
    `;
  }

  _renderComponentPresetDetail(data) {
    const { componentName, presetName, preset, pack } = data;
    const segments = preset?.segments ? Object.keys(preset.segments) : [];
    const hasText = preset?.text && Object.keys(preset.text).length > 0;
    const hasAnimations = preset?.animations && preset.animations.length > 0;

    return html`
      <div class="detail-section">
        <h4>Component Preset</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Preset:</span>
            <span class="detail-value">${presetName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Component:</span>
            <span class="detail-value">${componentName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack:</span>
            <span class="detail-value">${pack}</span>
          </div>
          ${segments.length ? html`
            <div class="detail-item">
              <span class="detail-label">Segments:</span>
              <span class="detail-value">${segments.join(', ')}</span>
            </div>
          ` : ''}
          ${hasAnimations ? html`
            <div class="detail-item">
              <span class="detail-label">Animations:</span>
              <span class="detail-value">${preset.animations.map(a => a.id).join(', ')}</span>
            </div>
          ` : ''}
          ${hasText ? html`
            <div class="detail-item">
              <span class="detail-label">Text overrides:</span>
              <span class="detail-value">${Object.keys(preset.text).join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h4>Usage</h4>
        <div class="code-block">component: ${componentName}\npreset: ${presetName}</div>
      </div>
    `;
  }

  _renderAnimationDetail(animation) {
    return html`
      <div class="detail-section">
        <h4>Animation Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${animation.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <span class="detail-value">${animation.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack:</span>
            <span class="detail-value">${animation.pack || 'core'}</span>
          </div>
          ${animation.preset ? html`
            <div class="detail-item">
              <span class="detail-label">Preset:</span>
              <span class="detail-value">${animation.preset}</span>
            </div>
          ` : ''}
          ${animation.duration ? html`
            <div class="detail-item">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${animation.duration}ms</span>
            </div>
          ` : ''}
          ${animation.easing ? html`
            <div class="detail-item">
              <span class="detail-label">Easing:</span>
              <span class="detail-value">${animation.easing}</span>
            </div>
          ` : ''}
          ${animation.loop !== undefined ? html`
            <div class="detail-item">
              <span class="detail-label">Loop:</span>
              <span class="detail-value">${animation.loop ? 'Yes' : 'No'}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${animation.description ? html`
        <div class="detail-section">
          <h4>Description</h4>
          <p>${animation.description}</p>
        </div>
      ` : ''}
    `;
  }

  _renderSvgAssetDetail(asset) {
    return html`
      <div class="detail-section">
        <h4>SVG Asset Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key:</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded:</span>
            <span class="detail-value">${asset.hasContent ? 'Yes' : 'Not yet'}</span>
          </div>
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL:</span>
              <span class="detail-value">${asset.url}</span>
            </div>
          ` : ''}
          ${asset.ship ? html`
            <div class="detail-item">
              <span class="detail-label">Ship:</span>
              <span class="detail-value">${asset.ship}</span>
            </div>
          ` : ''}
          ${asset.registry ? html`
            <div class="detail-item">
              <span class="detail-label">Registry:</span>
              <span class="detail-value">${asset.registry}</span>
            </div>
          ` : ''}
          ${asset.class ? html`
            <div class="detail-item">
              <span class="detail-label">Class:</span>
              <span class="detail-value">${asset.class}</span>
            </div>
          ` : ''}
          ${asset.era ? html`
            <div class="detail-item">
              <span class="detail-label">Era:</span>
              <span class="detail-value">${asset.era}</span>
            </div>
          ` : ''}
          ${asset.approximate_size ? html`
            <div class="detail-item">
              <span class="detail-label">Size:</span>
              <span class="detail-value">${asset.approximate_size}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${asset.description ? html`
        <div class="detail-section">
          <h4>Description</h4>
          <p>${asset.description}</p>
        </div>
      ` : ''}

      <div class="detail-section">
        <h4>Preview</h4>
        ${this._renderSvgPreview(asset)}
      </div>

      ${asset.author || asset.license ? html`
        <div class="detail-section">
          <h4>Attribution</h4>
          <div class="detail-grid">
            ${asset.author ? html`
              <div class="detail-item">
                <span class="detail-label">Author:</span>
                <span class="detail-value">${asset.author}</span>
              </div>
            ` : ''}
            ${asset.license ? html`
              <div class="detail-item">
                <span class="detail-label">License:</span>
                <span class="detail-value">${asset.license}</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    `;
  }

  _renderSvgPreview(asset) {
    if (asset.hasContent) {
      const core = window.lcards?.core;
      if (core?.assetManager) {
        core.assetManager.get('svg', asset.key).then(content => {
          if (content && content !== this._svgContent) {
            this._svgContent = content;
            this._loadingSvg = false;
            this.requestUpdate();
          }
        }).catch(err => {
          lcardsLog.error('[PackExplorer] Failed to load SVG:', err);
          this._loadingSvg = false;
          this.requestUpdate();
        });
      }
    }

    if (this._loadingSvg) {
      return html`
        <div class="preview-loading">
          <div class="loading-spinner"></div>
          <p>Loading SVG preview...</p>
        </div>
      `;
    }

    if (this._svgContent) {
      return html`
        <div class="svg-preview-container">
          ${unsafeHTML(this._svgContent)}
        </div>
      `;
    }

    if (asset.url) {
      return html`
        <div class="preview-placeholder">
          <button class="load-preview-button" @click=${() => this._loadSvgPreview(asset)}>
            Load Preview
          </button>
          <p class="preview-note">Click to load ${asset.approximate_size || 'SVG'}</p>
        </div>
      `;
    }

    return html`
      <div class="preview-placeholder">
        <p>No preview available</p>
      </div>
    `;
  }

  async _loadSvgPreview(asset) {
    const core = window.lcards?.core;
    if (!core?.assetManager) return;

    this._loadingSvg = true;
    this._svgContent = null;
    this.requestUpdate();

    try {
      const content = await core.assetManager.get('svg', asset.key);
      this._svgContent = content;
      this._loadingSvg = false;
      this.requestUpdate();
    } catch (error) {
      lcardsLog.error('[PackExplorer] Failed to load SVG preview:', error);
      this._loadingSvg = false;
      this.requestUpdate();
    }
  }

  _renderFontAssetDetail(asset) {
    return html`
      <div class="detail-section">
        <h4>Font Asset Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key:</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded:</span>
            <span class="detail-value">${asset.hasContent ? 'Yes' : 'Not yet'}</span>
          </div>
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL:</span>
              <span class="detail-value">${asset.url}</span>
            </div>
          ` : ''}
          ${asset.family ? html`
            <div class="detail-item">
              <span class="detail-label">Family:</span>
              <span class="detail-value">${asset.family}</span>
            </div>
          ` : ''}
          ${asset.weight ? html`
            <div class="detail-item">
              <span class="detail-label">Weight:</span>
              <span class="detail-value">${asset.weight}</span>
            </div>
          ` : ''}
          ${asset.style ? html`
            <div class="detail-item">
              <span class="detail-label">Style:</span>
              <span class="detail-value">${asset.style}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${asset.family ? html`
        <div class="detail-section">
          <h4>Preview</h4>
          <div class="font-preview-container">
            <p class="font-sample" style="font-family: '${asset.family}', sans-serif;">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
              abcdefghijklmnopqrstuvwxyz<br>
              0123456789
            </p>
          </div>
        </div>
      ` : ''}
    `;
  }

  _renderAudioAssetDetail(asset) {
    return html`
      <div class="detail-section">
        <h4>Audio Asset Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key:</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded:</span>
            <span class="detail-value">${asset.hasContent ? 'Yes' : 'Not yet'}</span>
          </div>
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL:</span>
              <span class="detail-value">${asset.url}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${asset.description ? html`
        <div class="detail-section">
          <h4>Description</h4>
          <p>${asset.description}</p>
        </div>
      ` : ''}

      ${asset.url ? html`
        <div class="detail-section">
          <h4>Preview</h4>
          <div class="audio-preview-container">
            <audio controls src="${asset.url}">
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      ` : ''}
    `;
  }

  render() {
    return html`
      <div class="studio-layout">
        <div class="content-container">
          ${!this._inlineMode ? html`
            <div class="header">
              <h2>📦 Pack Explorer</h2>
            </div>
          ` : ''}

          <div class="split-pane-container">
            <!-- Left Pane: Tree View -->
            <div class="tree-pane">
              <div class="tree-pane-header">
                <span>Packs (${this._treeData.length})</span>
              </div>
              <div class="tree-container">
                ${this._treeData.length === 0
                  ? html`<p class="empty-state">No packs loaded</p>`
                  : this._renderTreeNodes(this._treeData)}
              </div>
            </div>

            <!-- Right Pane: Detail View -->
            <div class="detail-pane">
              <div class="detail-pane-content">
                ${this._renderDetailPanel()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('lcards-pack-explorer-tab', LCARdSPackExplorerTab);
