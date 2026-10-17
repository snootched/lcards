/**
 * @fileoverview LCARdS Pack Explorer Tab Component
 *
 * Browses and inspects the loaded packs (the config panel's Pack Explorer tab).
 *
 * Features:
 * - Tree view: Packs → Asset Types → Individual Assets
 * - Detail pane: Metadata, live previews, copy-to-clipboard actions
 *
 * @element lcards-pack-explorer-tab
 *
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import {
  renderThemePreview,
  rendererStyles
} from '../../dialogs/pack-explorer/renderers/asset-renderers.js';
import { CANVAS_TEXTURE_PRESETS } from '../../../core/packs/textures/presets/index.js';
import { surfaceStyles } from '../../base/surface-styles.js';
import '../shared/lcards-form-section.js';

export class LCARdSPackExplorerTab extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _selectedNode: { type: Object, state: true },
      _expandedNodes: { state: true, attribute: false },
      _treeData: { type: Array, state: true },
      _loadingSvg: { type: Boolean, state: true },
      _svgContent: { type: String, state: true }
    };
  }

  constructor() {
    super();
    // Reactive properties (declared in static properties); typed here for the checker.
    /** @type {any} */
    this.hass;
    this._selectedNode = null;
    this._expandedNodes = new Set();
    this._treeData = [];
    this._loadingSvg = false;
    this._svgContent = null;
    /** @type {Map<string, HTMLElement>} preview cards by cache key (see _renderCardPreview) */
    this._cardPreviews = new Map();
  }

  static get styles() {
    return [
      surfaceStyles,
      rendererStyles,
      css`
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        font-family: var(--ha-font-family-body);
      }

      /* Split pane: tree | detail */
      .split-pane-container {
        display: grid;
        grid-template-columns: minmax(240px, 35%) 1fr;
        grid-template-rows: minmax(0, 1fr);
        gap: var(--ha-space-4);
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      /* Tree pane: a section card on the inset, like lcards-form-section */
      .tree-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        border: var(--ha-border-width-md) solid var(--chip-background-color);
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 30%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }

      .tree-pane-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: var(--ha-space-3) var(--ha-space-4);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        flex-shrink: 0;
        font-weight: 600;
        font-size: var(--ha-font-size-m);
        color: var(--primary-text-color);
      }

      .tree-pane-header ha-icon {
        --mdc-icon-size: 20px;
      }

      .tree-count {
        margin-left: auto;
        font-weight: var(--ha-font-weight-normal, 400);
        color: var(--secondary-text-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-2);
      }

      /* Tree nodes */
      .tree-node {
        margin-left: calc(var(--node-level, 0) * var(--ha-space-4));
        margin-bottom: 2px;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: 6px var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        cursor: pointer;
        transition: background var(--ha-animation-duration-fast, 0.15s);
        user-select: none;
      }

      .tree-node-content:hover {
        background: color-mix(in srgb, var(--secondary-background-color) 70%, transparent);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .tree-node-content.selected .node-icon {
        color: inherit;
      }

      .tree-expander {
        --mdc-icon-size: 18px;
        flex: none;
        transition: transform var(--ha-animation-duration-fast, 0.15s);
      }

      .tree-expander.leaf {
        visibility: hidden;
      }

      .tree-expander.expanded {
        transform: rotate(90deg);
      }

      .node-icon {
        --mdc-icon-size: 16px;
        flex: none;
        color: var(--secondary-text-color);
      }

      .node-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Detail pane: the inset's scrolling column (scroll-body) of form sections */
      .detail-pane {
        min-height: 0;
      }

      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--secondary-text-color);
        gap: var(--ha-space-3);
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .detail-panel {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
        /* lcards-form-section's own margin is replaced by the gap */
        --lcards-section-spacing: 0;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
      }

      .detail-header h3 {
        margin: 0;
        flex: 1;
        min-width: 0;
        font-size: var(--ha-font-size-xl, 20px);
        font-weight: var(--ha-font-weight-medium, 500);
        overflow-wrap: anywhere;
      }

      .type-chip {
        --ha-assist-chip-filled-container-color:
          color-mix(in srgb, var(--primary-color) 18%, transparent);
        --md-assist-chip-label-text-color: var(--primary-color);
        --md-sys-color-on-surface: var(--primary-color);
        flex-shrink: 0;
      }

      .detail-content {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
      }

      .detail-grid {
        display: grid;
        gap: var(--ha-space-1);
      }

      /* Key/value rows (the Users tab's field rows) */
      .detail-item {
        display: grid;
        grid-template-columns: minmax(120px, 30%) 1fr;
        gap: var(--ha-space-3);
        align-items: baseline;
        padding: var(--ha-space-1) 0;
      }

      .detail-label {
        color: var(--secondary-text-color);
      }

      .detail-value {
        color: var(--primary-text-color);
        overflow-wrap: anywhere;
      }

      .empty-state {
        padding: var(--ha-space-12) var(--ha-space-4);
        text-align: center;
        color: var(--secondary-text-color);
      }

      ha-code-editor {
        display: block;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        overflow: hidden;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px;
        margin-bottom: 16px;
      }

      .stat-card {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--primary-color) 35%, transparent);
        padding: 10px var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        text-align: center;
        color: var(--primary-text-color);
      }

      .stat-card .stat-icon {
        color: var(--primary-color);
      }

      .stat-card.zero {
        opacity: 0.35;
      }

      .stat-card .stat-icon {
        --mdc-icon-size: 20px;
        margin-bottom: var(--ha-space-1);
      }

      .stat-value {
        font-size: var(--ha-font-size-2xl);
        font-weight: 600;
        line-height: 1;
      }

      .stat-label {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .svg-preview-container {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
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

      .preview-placeholder {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border: var(--ha-border-width-md) dashed var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 24px;
        text-align: center;
      }

      .preview-note {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        margin-top: 8px;
      }

      .font-preview-container {
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        padding: var(--ha-space-6);
      }

      .font-sample {
        font-size: var(--ha-font-size-l);
        line-height: 1.8;
        color: var(--primary-text-color);
        margin: 0;
      }

      .audio-preview-container {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        justify-content: center;
      }

      .audio-preview-container audio {
        width: 100%;
        max-width: 400px;
      }

      .image-preview-container {
        background: var(--secondary-background-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
        overflow: hidden;
      }

      .image-preview-container img {
        max-width: 100%;
        max-height: 400px;
        border-radius: 6px;
        object-fit: contain;
      }

      .texture-swatch {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--ha-font-family-code);
        font-size: var(--ha-font-size-s);
      }

      .texture-swatch-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        flex-shrink: 0;
      }

      .preset-preview-frame > * {
        width: 100%;
        height: 100%;
      }

      .preset-preview-container {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border: var(--ha-border-width-sm) solid var(--divider-color);
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
          grid-template-rows: auto minmax(0, 1fr);
        }

        .tree-pane {
          max-height: 300px;
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
        icon: 'mdi:package-variant',
        data: pack,
        children: []
      };

      // Add themes category
      if (pack.themeCount > 0) {
        const themesNode = {
          id: `${packNode.id}_themes`,
          type: 'category',
          label: `Themes (${pack.themeCount})`,
          icon: 'mdi:palette',
          data: { category: 'themes', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        // Add individual themes
        const themes = core.themeManager?.getThemesByPack(pack.id) || [];
        themes.forEach(theme => {
          themesNode.children.push({
            id: `theme_${theme.id}`,
            type: 'theme',
            label: theme.name || theme.id,
            icon: 'mdi:palette',
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
          label: `Presets (${pack.presetCount})`,
          icon: 'mdi:tune-variant',
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
              icon: 'mdi:tune-variant',
              data: { presetType: type, packId: pack.id },
              children: /** @type {any[]} */ ([])
            };

            presets.forEach(preset => {
              typeNode.children.push({
                id: `preset_${type}_${preset.id}`,
                type: 'preset',
                label: preset.id,
                icon: 'mdi:tune-variant',
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
          label: `Components (${componentsForPack.length})`,
          icon: 'mdi:puzzle',
          data: { category: 'components', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        componentsForPack.forEach(comp => {
          const componentPresets = comp.definition?.presets
            ? Object.keys(comp.definition.presets)
            : [];

          const compNode = {
            id: `component_${comp.name}`,
            type: 'component',
            label: comp.name,
            icon: 'mdi:puzzle',
            data: comp,
            children: componentPresets.map(presetName => ({
              id: `component_${comp.name}_preset_${presetName}`,
              type: 'component-preset',
              label: presetName,
              icon: 'mdi:tune-variant',
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
          label: `Animations (${animsForPack.length})`,
          icon: 'mdi:animation-play',
          data: { category: 'animations', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        animsForPack.forEach(anim => {
          animationsNode.children.push({
            id: `animation_${anim.id}`,
            type: 'animation',
            label: anim.name,
            icon: 'mdi:animation-play',
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
          label: `SVG Assets (${svgAssets.length})`,
          icon: 'mdi:image-outline',
          data: { category: 'svg_assets', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        svgAssets.forEach(asset => {
          svgNode.children.push({
            id: `svg_${asset.key}`,
            type: 'svg_asset',
            label: asset.key,
            icon: 'mdi:image-outline',
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
          label: `Font Assets (${fontAssets.length})`,
          icon: 'mdi:format-font',
          data: { category: 'font_assets', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        fontAssets.forEach(asset => {
          fontNode.children.push({
            id: `font_${asset.key}`,
            type: 'font_asset',
            label: asset.key,
            icon: 'mdi:format-font',
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
          label: `Audio Assets (${audioAssets.length})`,
          icon: 'mdi:volume-high',
          data: { category: 'audio_assets', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        audioAssets.forEach(asset => {
          audioNode.children.push({
            id: `audio_${asset.key}`,
            type: 'audio_asset',
            label: asset.key,
            icon: 'mdi:volume-high',
            data: asset
          });
        });

        packNode.children.push(audioNode);
      }

      // Add image assets category
      const imageAssets = this._getAssetsForPack('image', pack.id);
      if (imageAssets.length > 0) {
        const imageNode = {
          id: `${packNode.id}_image_assets`,
          type: 'category',
          label: `Images (${imageAssets.length})`,
          icon: 'mdi:image-outline',
          data: { category: 'image_assets', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        imageAssets.forEach(asset => {
          imageNode.children.push({
            id: `image_${asset.key}`,
            type: 'image_asset',
            label: asset.label || asset.key,
            icon: 'mdi:image-outline',
            data: asset
          });
        });

        packNode.children.push(imageNode);
      }

      // Add texture presets category (lcards_textures pack — presets defined in CANVAS_TEXTURE_PRESETS)
      if (pack.id === 'lcards_textures') {
        const textureEntries = Object.entries(CANVAS_TEXTURE_PRESETS);
        const textureNode = {
          id: `${packNode.id}_texture_presets`,
          type: 'category',
          label: `Texture Presets (${textureEntries.length})`,
          icon: 'mdi:texture-box',
          data: { category: 'texture_presets', packId: pack.id },
          children: /** @type {any[]} */ ([])
        };

        textureEntries.forEach(([key, preset]) => {
          textureNode.children.push({
            id: `texture_${key}`,
            type: 'texture_preset',
            label: preset.name,
            icon: 'mdi:texture-box',
            data: { key, ...preset }
          });
        });

        packNode.children.push(textureNode);
      }

      tree.push(packNode);
    });

    this._treeData = tree;
    lcardsLog.debug('[PackExplorer] Tree data built:', tree);
  }

  /**
   * Get total asset count for a pack (SVG + font + audio + image)
   * @private
   */
  _getAssetCountForPack(packId) {
    const svgCount = this._getAssetsForPack('svg', packId).length;
    const fontCount = this._getAssetsForPack('font', packId).length;
    const audioCount = this._getAssetsForPack('audio', packId).length;
    const imageCount = this._getAssetsForPack('image', packId).length;
    return svgCount + fontCount + audioCount + imageCount;
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
          <ha-icon
            class="tree-expander ${hasChildren ? (isExpanded ? 'expanded' : '') : 'leaf'}"
            icon="mdi:chevron-right"></ha-icon>
          ${node.icon ? html`<ha-icon class="node-icon" icon=${node.icon}></ha-icon>` : ''}
          <span class="node-label">${node.label}</span>
        </div>
      </div>
      ${hasChildren && isExpanded
        ? node.children.map(child => this._renderTreeNode(child, level + 1))
        : ''}
    `;
  }

  /**
   * Items under a category, as its tree label counts them ("Presets (26)"):
   * preset-type groups are looked through, everything else counts once.
   * @private
   */
  _countItems(node) {
    return (node.children ?? []).reduce((n, c) => n + (c.type === 'preset-type' ? this._countItems(c) : 1), 0);
  }

  /**
   * A read-only code snippet (usage YAML, default config).
   * @private
   */
  _renderCode(text) {
    return html`<ha-code-editor mode="yaml" read-only .value=${text}></ha-code-editor>`;
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
          <ha-assist-chip
            class="type-chip"
            .filled=${true}
            .label=${String(node.type).replace(/[_-]/g, ' ')}
          ></ha-assist-chip>
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
      case 'image_asset':
        return this._renderImageAssetDetail(node.data);
      case 'texture_preset':
        return this._renderTexturePresetDetail(node.data);
      case 'category':
      case 'preset-type':
        return this._renderCategoryDetail(node);
      default:
        return html`
          <lcards-form-section header="Information" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${node.type}</span>
              </div>
            </div>
          </lcards-form-section>
        `;
    }
  }

  _renderCategoryDetail(node) {
    const childCount = this._countItems(node);
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Category</span>
            <span class="detail-value">${node.data?.category || node.data?.presetType || 'Unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Items</span>
            <span class="detail-value">${childCount}</span>
          </div>
        </div>
      </lcards-form-section>
    `;
  }

  _renderPackDetail(pack) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${pack.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description</span>
            <span class="detail-value">${pack.description || 'No description available'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Version</span>
            <span class="detail-value">${pack.version || 'Unknown'}</span>
          </div>
        </div>
      </lcards-form-section>

      <lcards-form-section header="Statistics" icon="mdi:chart-box-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="stats-grid">
          ${this._renderStatCard('mdi:palette', pack.themeCount || 0, 'Themes')}
          ${this._renderStatCard('mdi:tune-variant', pack.presetCount || 0, 'Presets')}
          ${this._renderStatCard('mdi:puzzle', this._getComponentsForPack(pack.id).length, 'Components')}
          ${this._renderStatCard('mdi:format-list-checks', pack.ruleCount || 0, 'Rules')}
          ${this._renderStatCard('mdi:animation-play', this._getAnimationCountForPack(pack.id), 'Animations')}
          ${this._renderStatCard('mdi:image-outline', this._getAssetsForPack('svg', pack.id).length, 'SVG')}
          ${this._renderStatCard('mdi:format-font', this._getAssetsForPack('font', pack.id).length, 'Fonts')}
          ${this._renderStatCard('mdi:volume-high', this._getAssetsForPack('audio', pack.id).length, 'Audio')}
          ${this._renderStatCard('mdi:image', this._getAssetsForPack('image', pack.id).length, 'Images')}
          ${this._renderStatCard('mdi:texture-box', this._getTextureCountForPack(pack.id), 'Textures')}
        </div>
      </lcards-form-section>
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
        <ha-icon class="stat-icon" icon=${icon}></ha-icon>
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

  /**
   * Get texture preset count for a pack.
   * All Canvas2D texture presets live in the lcards_textures pack; other packs return 0.
   * @private
   */
  _getTextureCountForPack(packId) {
    return packId === 'lcards_textures' ? Object.keys(CANVAS_TEXTURE_PRESETS).length : 0;
  }

  _renderThemeDetail(theme) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${theme.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${theme.name || theme.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description</span>
            <span class="detail-value">${theme.description || 'No description available'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${theme.pack || 'unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Version</span>
            <span class="detail-value">${theme.version || 'Unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Token Count</span>
            <span class="detail-value">${theme.tokenCount || 0}</span>
          </div>
        </div>
      </lcards-form-section>

      <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${renderThemePreview(theme)}
      </lcards-form-section>
    `;
  }

  _renderPresetDetail(preset) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${preset.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description</span>
            <span class="detail-value">${preset.description || 'No description available'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">${preset.presetType || preset.type}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${preset.pack || 'unknown'}</span>
          </div>
          ${preset.extends ? html`
            <div class="detail-item">
              <span class="detail-label">Extends</span>
              <span class="detail-value">${preset.extends}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Live Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderPresetLivePreview(preset)}
      </lcards-form-section>
    `;
  }

  _renderPresetLivePreview(preset) {
    const presetType = preset.presetType || preset.type;

    // Same shapes as the docs preset galleries (doc/.vitepress/theme/card-demo-galleries.js).
    const id = preset.id;
    let cardType, size, config;
    if (presetType === 'button' || presetType?.includes('button')) {
      cardType = 'lcards-button';
      if (id.startsWith('bar-label')) {
        size = 'width: 100%; max-width: 520px; height: 48px;';
        config = { preset: id, interactive: false, text: { label: { content: 'ENGINEERING' } } };
      } else if (id.startsWith('panel-')) {
        size = 'width: 240px; height: 120px;';
        config = { preset: id };
      } else {
        size = 'width: 240px; height: 60px;';
        config = { preset: id, icon: 'mdi:lightbulb', ...(id === 'icon' ? {} : { text: { label: { content: 'MAIN LIGHTS', show: true } } }) };
      }
    } else if (presetType === 'slider' || presetType?.includes('slider')) {
      cardType = 'lcards-slider';
      const vertical = id.includes('vertical');
      size = vertical ? 'width: 160px; height: 320px;' : 'width: 100%; max-width: 360px; height: 80px;';
      config = { preset: id, ...(id === 'picard-gauge-vertical' ? { component: 'picard' } : {}) };
    } else {
      return html`<div class="preview-placeholder">Preview not available for this preset type</div>`;
    }

    return this._renderCardPreview(`preset:${cardType}:${id}`, cardType, config, size);
  }

  /**
   * A real LCARdS card as a preview. Cards are cached per key (a new element on
   * every render would remount the card) and get the panel's hass, so they have a
   * live connection; configs carry no entity, so they show their default look.
   * The card manages its own style attribute, so the size goes on a frame it fills.
   * @private
   */
  _renderCardPreview(cacheKey, cardType, config, size) {
    let card = /** @type {LovelaceCardElement | undefined} */ (this._cardPreviews.get(cacheKey));
    if (!card) {
      card = /** @type {LovelaceCardElement} */ (document.createElement(cardType));
      try {
        card.setConfig({ type: `custom:${cardType}`, ...config });
      } catch (err) {
        lcardsLog.error('[PackExplorer] Failed to set config on preview card:', err);
        return html`<div class="preview-placeholder">Error creating preview: ${err.message}</div>`;
      }
      this._cardPreviews.set(cacheKey, card);
    }
    card.hass = this.hass;
    return html`
      <div class="preset-preview-container">
        <div class="preset-preview-frame" style=${size}>${card}</div>
      </div>
    `;
  }

  /**
   * The card that shows a component, by the pack it comes from; null when there is none.
   * @private
   */
  _componentPreview(name, pack, orientation) {
    if (pack === 'lcards_buttons') {
      return { cardType: 'lcards-button', config: { component: name }, size: 'width: 220px; height: 220px;' };
    }
    if (pack === 'lcards_sliders') {
      const vertical = orientation === 'vertical';
      return { cardType: 'lcards-slider', config: { component: name },
        size: vertical ? 'width: 160px; height: 320px;' : 'width: 100%; max-width: 360px; height: 80px;' };
    }
    if (pack === 'lcards_elbows') {
      return { cardType: 'lcards-elbow', config: { elbow: { type: name, segment: { bar_width: 90, bar_height: 20 } } },
        size: 'width: 100%; max-width: 360px; height: 140px;' };
    }
    return null;
  }

  _renderComponentDetail(component) {
    const definition = component.definition || {};
    const svgLength = definition.svg?.length || 0;
    const hasFeatures = definition.features && definition.features.length > 0;

    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${component.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${component.pack || 'unknown'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Orientation</span>
            <span class="detail-value">${definition.orientation || definition.metadata?.orientation || 'auto'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">SVG Size</span>
            <span class="detail-value">${svgLength} characters</span>
          </div>
          ${hasFeatures ? html`
            <div class="detail-item">
              <span class="detail-label">Features</span>
              <span class="detail-value">${definition.features.join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${this._renderComponentPreviewSection(component.name, component.pack, definition)}
    `;
  }

  /** Live card preview for a component (or its raw SVG when no card shows it). @private */
  _renderComponentPreviewSection(name, pack, definition) {
    const orientation = definition?.orientation ?? definition?.metadata?.orientation;
    const card = this._componentPreview(name, pack, orientation);
    if (card) {
      return html`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          ${this._renderCardPreview(`component:${pack}:${name}`, card.cardType, card.config, card.size)}
        </lcards-form-section>
      `;
    }
    return definition?.svg ? html`
      <lcards-form-section header="SVG Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="svg-preview-container">
          ${unsafeHTML(definition.svg)}
        </div>
      </lcards-form-section>
    ` : '';
  }

  _renderComponentPresetDetail(data) {
    const { componentName, presetName, preset, pack } = data;
    const segments = preset?.segments ? Object.keys(preset.segments) : [];
    const hasText = preset?.text && Object.keys(preset.text).length > 0;
    const hasAnimations = preset?.animations && preset.animations.length > 0;

    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Preset</span>
            <span class="detail-value">${presetName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Component</span>
            <span class="detail-value">${componentName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${pack}</span>
          </div>
          ${segments.length ? html`
            <div class="detail-item">
              <span class="detail-label">Segments</span>
              <span class="detail-value">${segments.join(', ')}</span>
            </div>
          ` : ''}
          ${hasAnimations ? html`
            <div class="detail-item">
              <span class="detail-label">Animations</span>
              <span class="detail-value">${preset.animations.map(a => a.id).join(', ')}</span>
            </div>
          ` : ''}
          ${hasText ? html`
            <div class="detail-item">
              <span class="detail-label">Text overrides</span>
              <span class="detail-value">${Object.keys(preset.text).join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${this._renderComponentPreviewSection(componentName, pack, null)}

      <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(`component: ${componentName}\npreset: ${presetName}`)}
      </lcards-form-section>
    `;
  }

  _renderAnimationDetail(animation) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${animation.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${animation.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${animation.pack || 'core'}</span>
          </div>
          ${animation.preset ? html`
            <div class="detail-item">
              <span class="detail-label">Preset</span>
              <span class="detail-value">${animation.preset}</span>
            </div>
          ` : ''}
          ${animation.duration ? html`
            <div class="detail-item">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${animation.duration}ms</span>
            </div>
          ` : ''}
          ${animation.ease ? html`
            <div class="detail-item">
              <span class="detail-label">Ease</span>
              <span class="detail-value">${animation.ease}</span>
            </div>
          ` : ''}
          ${animation.loop !== undefined ? html`
            <div class="detail-item">
              <span class="detail-label">Loop</span>
              <span class="detail-value">${animation.loop ? 'Yes' : 'No'}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${animation.description ? html`
        <lcards-form-section header="Description" icon="mdi:text" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <p>${animation.description}</p>
        </lcards-form-section>
      ` : ''}
    `;
  }

  _renderSvgAssetDetail(asset) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded</span>
            <span class="detail-value">${asset.hasContent ? 'Yes' : 'Not yet'}</span>
          </div>
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value">${asset.url}</span>
            </div>
          ` : ''}
          ${asset.ship ? html`
            <div class="detail-item">
              <span class="detail-label">Ship</span>
              <span class="detail-value">${asset.ship}</span>
            </div>
          ` : ''}
          ${asset.registry ? html`
            <div class="detail-item">
              <span class="detail-label">Registry</span>
              <span class="detail-value">${asset.registry}</span>
            </div>
          ` : ''}
          ${asset.class ? html`
            <div class="detail-item">
              <span class="detail-label">Class</span>
              <span class="detail-value">${asset.class}</span>
            </div>
          ` : ''}
          ${asset.era ? html`
            <div class="detail-item">
              <span class="detail-label">Era</span>
              <span class="detail-value">${asset.era}</span>
            </div>
          ` : ''}
          ${asset.approximate_size ? html`
            <div class="detail-item">
              <span class="detail-label">Size</span>
              <span class="detail-value">${asset.approximate_size}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${asset.description ? html`
        <lcards-form-section header="Description" icon="mdi:text" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <p>${asset.description}</p>
        </lcards-form-section>
      ` : ''}

      <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderSvgPreview(asset)}
      </lcards-form-section>

      ${asset.author || asset.license ? html`
        <lcards-form-section header="Attribution" icon="mdi:copyright" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="detail-grid">
            ${asset.author ? html`
              <div class="detail-item">
                <span class="detail-label">Author</span>
                <span class="detail-value">${asset.author}</span>
              </div>
            ` : ''}
            ${asset.license ? html`
              <div class="detail-item">
                <span class="detail-label">License</span>
                <span class="detail-value">${asset.license}</span>
              </div>
            ` : ''}
          </div>
        </lcards-form-section>
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
          <ha-spinner size="small"></ha-spinner>
          <p>Loading SVG preview</p>
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
          <ha-button @click=${() => this._loadSvgPreview(asset)}>
            <ha-icon slot="start" icon="mdi:eye-outline"></ha-icon>
            Load Preview
          </ha-button>
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

  /** Fonts that don't auto-load are only fetched when used; fetch this one for its preview. @private */
  _loadPreviewFont(key) {
    if (key) window.lcards?.core?.assetManager?.loadFont?.(key)?.catch?.(() => undefined);
    return '';
  }

  _renderFontAssetDetail(asset) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded</span>
            <span class="detail-value">${asset.hasContent ? 'Yes' : 'Not yet'}</span>
          </div>
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value">${asset.url}</span>
            </div>
          ` : ''}
          ${asset.family ? html`
            <div class="detail-item">
              <span class="detail-label">Family</span>
              <span class="detail-value">${asset.family}</span>
            </div>
          ` : ''}
          ${asset.weight ? html`
            <div class="detail-item">
              <span class="detail-label">Weight</span>
              <span class="detail-value">${asset.weight}</span>
            </div>
          ` : ''}
          ${asset.style ? html`
            <div class="detail-item">
              <span class="detail-label">Style</span>
              <span class="detail-value">${asset.style}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${this._loadPreviewFont(asset.key)}
      ${asset.key ? html`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="font-preview-container">
            <p class="font-sample" style="font-family: '${asset.family || asset.key}', sans-serif;">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
              abcdefghijklmnopqrstuvwxyz<br>
              0123456789
            </p>
          </div>
        </lcards-form-section>
      ` : ''}
    `;
  }

  _renderImageAssetDetail(asset) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          ${asset.label ? html`
            <div class="detail-item">
              <span class="detail-label">Label</span>
              <span class="detail-value">${asset.label}</span>
            </div>
          ` : ''}
          ${asset.category ? html`
            <div class="detail-item">
              <span class="detail-label">Category</span>
              <span class="detail-value">${asset.category}</span>
            </div>
          ` : ''}
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value" style="word-break:break-all">${asset.url}</span>
            </div>
          ` : ''}
          ${asset.description ? html`
            <div class="detail-item">
              <span class="detail-label">Description</span>
              <span class="detail-value">${asset.description}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${asset.url ? html`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="image-preview-container">
            <img
              src="${asset.url}"
              alt="${asset.label || asset.key}"
              @error=${(e) => { e.target.style.display='none'; e.target.insertAdjacentHTML('afterend', '<span style="color:var(--secondary-text-color)">Image not found</span>'); }}
            />
          </div>
        </lcards-form-section>
        <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          ${this._renderCode(`source: builtin:${asset.key}`)}
        </lcards-form-section>
      ` : ''}
    `;
  }

  _renderTexturePresetDetail(data) {
    const { key, name, description, defaults } = data;
    // Extract color swatches from defaults
    const colorKeys = Object.entries(defaults || {}).filter(([k, v]) => typeof v === 'string' && v.startsWith('rgba'));
    const defaultsText = JSON.stringify(
      Object.fromEntries(Object.entries(defaults || {}).map(([k, v]) => [k, v])),
      null, 2
    );
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${name}</span>
          </div>
          ${description ? html`
            <div class="detail-item">
              <span class="detail-label">Description</span>
              <span class="detail-value">${description}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${colorKeys.length > 0 ? html`
        <lcards-form-section header="Default Colours" icon="mdi:palette-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="detail-grid">
            ${colorKeys.map(([k, v]) => html`
              <div class="detail-item">
                <span class="detail-label">${k}</span>
                <span class="texture-swatch">
                  <span class="texture-swatch-dot" style="background:${v}"></span>
                  ${v}
                </span>
              </div>
            `)}
          </div>
        </lcards-form-section>
      ` : ''}

      <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCardPreview(`texture:${key}`, 'lcards-button',
          { preset: 'lozenge', shape_texture: { preset: key }, text: { label: { content: name || key, show: true } } },
          'width: 100%; max-width: 360px; height: 80px;')}
      </lcards-form-section>

      <lcards-form-section header="Default Config" icon="mdi:cog-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(defaultsText)}
      </lcards-form-section>

      <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(`shape_texture:\n  preset: ${key}`)}
      </lcards-form-section>
    `;
  }

  _renderAudioAssetDetail(asset) {
    return html`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${asset.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded</span>
            <span class="detail-value">${asset.hasContent ? 'Yes' : 'Not yet'}</span>
          </div>
          ${asset.url ? html`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value">${asset.url}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>

      ${asset.description ? html`
        <lcards-form-section header="Description" icon="mdi:text" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <p>${asset.description}</p>
        </lcards-form-section>
      ` : ''}

      ${asset.url ? html`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="audio-preview-container">
            <audio controls src="${asset.url}">
              Your browser does not support the audio element.
            </audio>
          </div>
        </lcards-form-section>
      ` : ''}
    `;
  }

  render() {
    return html`
      <div class="studio-layout">
        <div class="split-pane-container">
          <!-- Left pane: tree -->
          <div class="tree-pane">
            <div class="tree-pane-header">
              <ha-icon icon="mdi:package-variant"></ha-icon>
              <span>Packs</span>
              <span class="tree-count">${this._treeData.length}</span>
            </div>
            <div class="tree-container">
              ${this._treeData.length === 0
                ? html`<p class="empty-state">No packs loaded</p>`
                : this._renderTreeNodes(this._treeData)}
            </div>
          </div>

          <!-- Right pane: detail -->
          <div class="detail-pane scroll-body">
            ${this._renderDetailPanel()}
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('lcards-pack-explorer-tab')) customElements.define('lcards-pack-explorer-tab', LCARdSPackExplorerTab);
