/**
 * @fileoverview AssetManager - Unified asset management singleton
 *
 * Manages all asset types (SVG, components, fonts, audio) with:
 * - Lazy loading for external assets
 * - Validation and sanitization
 * - Pack integration
 * - Runtime discovery
 *
 * @module core/assets/AssetManager
 */

import { BaseService } from '../BaseService.js';
import { sanitizeSvg } from '../../utils/lcards-svg-helpers.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Asset type definitions with validation rules
 */
const ASSET_TYPES = {
  svg: {
    description: 'SVG templates and graphics',
    sanitize: true,
    cache: true,
    lazyLoad: true,
    maxSize: 2 * 1024 * 1024 // 2 MB
  },
  font: {
    description: 'Custom font files',
    sanitize: false,
    cache: true,
    lazyLoad: true,
    maxSize: 500 * 1024 // 500 KB per font
  },
  audio: {
    description: 'Sound effects and audio clips',
    sanitize: false,
    cache: true,
    lazyLoad: true,
    maxSize: 1024 * 1024 // 1 MB per audio file
  }
};

/**
 * Individual asset registry for a specific type
 */
class AssetRegistry {
  constructor(type, config) {
    this.type = type;
    this.config = config;
    this.assets = new Map(); // key -> { content, metadata, url }
    this.loadingPromises = new Map(); // key -> Promise (for deduplication)
  }

  /**
   * Register an asset
   * @param {string} key - Asset key
   * @param {*} content - Asset content (null if lazy load)
   * @param {Object} metadata - Asset metadata
   */
  register(key, content, metadata = {}) {
    this.assets.set(key, {
      content,
      metadata: {
        registeredAt: Date.now(),
        size: content ? this._getSize(content) : null,
        ...metadata
      },
      url: metadata.url || null
    });
  }

  /**
   * Get asset content
   * @param {string} key - Asset key
   * @returns {*} Asset content or null
   */
  get(key) {
    return this.assets.get(key)?.content || null;
  }

  /**
   * Get asset metadata
   * @param {string} key - Asset key
   * @returns {Object|null} Asset metadata
   */
  getMetadata(key) {
    return this.assets.get(key)?.metadata || null;
  }

  /**
   * Check if asset exists
   * @param {string} key - Asset key
   * @returns {boolean} True if exists
   */
  has(key) {
    return this.assets.has(key);
  }

  /**
   * List all asset keys
   * @returns {Array<string>} Asset keys
   */
  list() {
    return Array.from(this.assets.keys()).sort();
  }

  /**
   * Get asset size in bytes
   * @private
   */
  _getSize(content) {
    if (!content) return 0;
    if (content instanceof ArrayBuffer) return content.byteLength;
    if (typeof content === 'string') return new Blob([content]).size;
    return 0;
  }
}

/**
 * AssetManager - Unified asset management singleton
 *
 * Manages all asset types (SVG, components, fonts, audio) with:
 * - Lazy loading for external assets
 * - Validation and sanitization
 * - Pack integration
 * - Runtime discovery
 *
 * @extends BaseService
 */
export class AssetManager extends BaseService {
  constructor() {
    super();
    this.registries = new Map();
    this.config = ASSET_TYPES;

    lcardsLog.debug('[AssetManager] Initialized');
  }

  /**
   * Initialize asset manager
   * Called by LCARdSCore during singleton initialization
   */
  async initialize() {
    lcardsLog.debug('[AssetManager] Initializing registries for supported types');

    // Create registries for all asset types
    Object.entries(this.config).forEach(([type, config]) => {
      this.registries.set(type, new AssetRegistry(type, config));
    });

    lcardsLog.info('[AssetManager] Ready - supported types:', Object.keys(this.config));
  }

  /**
   * Get or create registry for asset type
   * @param {string} type - Asset type
   * @returns {AssetRegistry} Registry instance
   */
  getRegistry(type) {
    if (!this.config[type]) {
      throw new Error(`[AssetManager] Unknown asset type: ${type}`);
    }

    if (!this.registries.has(type)) {
      this.registries.set(type, new AssetRegistry(type, this.config[type]));
    }

    return this.registries.get(type);
  }

  /**
   * Register an asset
   * @param {string} type - Asset type
   * @param {string} key - Asset key
   * @param {*} content - Asset content
   * @param {Object} metadata - Asset metadata
   */
  register(type, key, content, metadata = {}) {
    const typeConfig = this.config[type];
    if (!typeConfig) {
      throw new Error(`[AssetManager] Unknown asset type: ${type}`);
    }

    // Sanitize SVG content
    if (typeConfig.sanitize && type === 'svg' && content) {
      content = sanitizeSvg(content);
    }

    // Check size limits
    if (typeConfig.maxSize && content) {
      const size = this._getSize(content);
      if (size > typeConfig.maxSize) {
        throw new Error(`[AssetManager] Asset ${type}:${key} exceeds size limit (${size} > ${typeConfig.maxSize})`);
      }
    }

    const registry = this.getRegistry(type);
    registry.register(key, content, metadata);

    lcardsLog.debug(`[AssetManager] Registered ${type}: ${key}`, {
      hasContent: !!content,
      hasUrl: !!metadata.url,
      pack: metadata.pack
    });
  }

  /**
   * Get an asset (with lazy loading)
   * @param {string} type - Asset type
   * @param {string} key - Asset key
   * @returns {Promise<*>} Asset content
   */
  async get(type, key) {
    const registry = this.getRegistry(type);
    const asset = registry.assets.get(key);

    if (!asset) {
      lcardsLog.warn(`[AssetManager] Asset not found: ${type}:${key}`);
      return null;
    }

    // Return content if already loaded
    if (asset.content) {
      return asset.content;
    }

    // Lazy load if URL provided
    if (asset.url) {
      // Check if already loading (deduplicate)
      if (registry.loadingPromises.has(key)) {
        return registry.loadingPromises.get(key);
      }

      const promise = this._loadExternal(type, key, asset.url);
      registry.loadingPromises.set(key, promise);

      try {
        await promise;
        return registry.assets.get(key)?.content;
      } finally {
        registry.loadingPromises.delete(key);
      }
    }

    lcardsLog.warn(`[AssetManager] Asset ${type}:${key} has no content or URL`);
    return null;
  }

  /**
   * Load external asset from URL
   * @param {string} type - Asset type
   * @param {string} key - Asset key
   * @param {string} url - Asset URL
   * @private
   */
  async _loadExternal(type, key, url) {
    const typeConfig = this.config[type];

    lcardsLog.debug(`[AssetManager] Loading external ${type}: ${key} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let content;
      if (type === 'audio' || type === 'font') {
        content = await response.arrayBuffer();
      } else {
        content = await response.text();
      }

      // Get existing metadata before re-registering
      const registry = this.getRegistry(type);
      const existingAsset = registry.assets.get(key);
      const existingMetadata = existingAsset?.metadata || {};

      // Re-register with content, preserving existing metadata
      this.register(type, key, content, {
        ...existingMetadata,  // Preserve all existing metadata
        source: existingMetadata.source || 'external',  // Don't overwrite source if it exists
        url,
        loadedAt: Date.now()
      });

      lcardsLog.debug(`[AssetManager] Loaded ${type}: ${key} (${this._getSize(content)} bytes)`);

      return content;
    } catch (error) {
      lcardsLog.error(`[AssetManager] Failed to load ${type}:${key} from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Preload assets from pack definition
   * @param {Object} packDef - Pack definition
   * @returns {Promise<void>}
   */
  async preloadFromPack(packDef) {
    const packName = packDef.id || packDef.name || 'unknown';
    const promises = [];

    lcardsLog.debug(`[AssetManager] Preloading assets from pack: ${packName}`);

    // SVG assets
    if (packDef.svg_assets) {
      Object.entries(packDef.svg_assets).forEach(([key, def]) => {
        if (typeof def === 'string') {
          // Inline SVG content
          this.register('svg', key, def, {
            pack: packName,
            inline: true
          });
        } else if (def.url) {
          // External SVG (register placeholder, load on demand)
          this.register('svg', key, null, {
            pack: packName,
            url: def.url,
            ...def.metadata  // Flatten metadata into top-level
          });
        } else if (def.content) {
          // Explicit content field
          this.register('svg', key, def.content, {
            pack: packName,
            ...def.metadata  // Flatten metadata into top-level
          });
        }
      });
    }

    // Font assets
    if (packDef.font_assets) {
      Object.entries(packDef.font_assets).forEach(([key, def]) => {
        if (def.url) {
          this.register('font', key, null, {
            pack: packName,
            url: def.url,
            displayName: def.displayName,
            category: def.category,
            legacyName: def.legacyName,
            description: def.description,
            external: def.external,
            family: def.family,
            weight: def.weight,
            style: def.style
          });
        }
      });
    }

    // Audio assets
    if (packDef.audio_assets) {
      Object.entries(packDef.audio_assets).forEach(([key, def]) => {
        if (def.url) {
          this.register('audio', key, null, {
            pack: packName,
            url: def.url,
            description: def.description
          });
        }
      });
    }

    await Promise.all(promises);

    const assetCounts = {
      svg: packDef.svg_assets ? Object.keys(packDef.svg_assets).length : 0,
      font: packDef.font_assets ? Object.keys(packDef.font_assets).length : 0,
      audio: packDef.audio_assets ? Object.keys(packDef.audio_assets).length : 0
    };

    lcardsLog.info(`[AssetManager] Preloaded from pack ${packName}:`, assetCounts);
  }

  /**
   * List all assets of a specific type
   * @param {string} type - Asset type
   * @returns {Array<string>} Asset keys
   */
  listAssets(type) {
    const registry = this.getRegistry(type);
    return registry.list();
  }

  /**
   * List all asset types
   * @returns {Array<string>} Asset types
   */
  listTypes() {
    return Object.keys(this.config);
  }

  /**
   * Get asset metadata
   * @param {string} type - Asset type
   * @param {string} key - Asset key
   * @returns {Object|null} Asset metadata
   */
  getMetadata(type, key) {
    const registry = this.getRegistry(type);
    return registry.getMetadata(key);
  }

  /**
   * Clear all assets (testing only)
   */
  clear() {
    this.registries.forEach(registry => registry.assets.clear());
    lcardsLog.debug('[AssetManager] Cleared all assets');
  }

  /**
   * Load SVG from source with auto-registration
   * Handles builtin, /local/, and external URLs automatically
   *
   * @param {string} source - SVG source ('builtin:name', '/local/path.svg', 'http://...')
   * @returns {Promise<string|null>} SVG content or null
   * @example
   * // Load builtin SVG
   * const svg = await assetManager.loadSvg('builtin:lcars_master_systems_display_002');
   *
   * // Load from /local/
   * const svg = await assetManager.loadSvg('/local/custom.svg');
   *
   * // Load from external URL
   * const svg = await assetManager.loadSvg('https://example.com/graphic.svg');
   */
  async loadSvg(source) {
    if (!source || source === 'none') {
      return null;
    }

    let key;
    let url;

    if (source.startsWith('builtin:')) {
      // Builtin SVGs are pre-registered by packs
      key = source.replace('builtin:', '');
    } else if (source.startsWith('/local/') || source.startsWith('http')) {
      // External/user SVGs: derive key from filename
      key = source.split('/').pop().replace('.svg', '');
      url = source;

      // Auto-register if not already registered
      if (!this.getRegistry('svg').has(key)) {
        this.register('svg', key, null, {
          url,
          source: source.startsWith('http') ? 'external' : 'user'
        });
        lcardsLog.debug(`[AssetManager] Auto-registered SVG: ${key} from ${url}`);
      }
    } else {
      // Assume it's already a registered key
      key = source;
    }

    if (!key) {
      lcardsLog.warn('[AssetManager] Could not determine SVG key from source:', source);
      return null;
    }

    try {
      return await this.get('svg', key);
    } catch (error) {
      lcardsLog.error(`[AssetManager] Failed to load SVG '${key}':`, error);
      return null;
    }
  }

  /**
   * Get asset size in bytes
   * @private
   */
  _getSize(content) {
    if (!content) return 0;
    if (content instanceof ArrayBuffer) return content.byteLength;
    if (typeof content === 'string') return new Blob([content]).size;
    return 0;
  }

  /**
   * Load a font CSS file (lazy-load if needed)
   * Handles legacy font name migration automatically.
   * 
   * @param {string} fontKey - Font key (e.g., 'lcards_borg' or 'cb-lcars_borg')
   * @returns {Promise<void>}
   */
  async loadFont(fontKey) {
    try {
      // Migrate legacy names
      const migratedKey = this._migrateLegacyFontName(fontKey);
      
      // Get font asset (triggers lazy load if needed)
      const fontRegistry = this.getRegistry('font');
      const fontAsset = fontRegistry.assets.get(migratedKey);

      if (!fontAsset) {
        lcardsLog.warn(`[AssetManager] Font not found: ${migratedKey}`);
        return;
      }

      // Check if already injected
      const linkId = `lcards-font-${migratedKey}`;
      if (document.getElementById(linkId)) {
        lcardsLog.debug(`[AssetManager] Font already loaded: ${migratedKey}`);
        return;
      }

      // Inject CSS link
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = fontAsset.url;
      document.head.appendChild(link);

      lcardsLog.debug(`[AssetManager] Loaded font: ${migratedKey} from ${fontAsset.url}`);

    } catch (error) {
      lcardsLog.error(`[AssetManager] Failed to load font ${fontKey}:`, error);
    }
  }

  /**
   * Migrate legacy CB-LCARS font names to new lcards_ prefix
   * @private
   * @param {string} fontKey - Font key (may be legacy name)
   * @returns {string} Migrated font key
   */
  _migrateLegacyFontName(fontKey) {
    const fontRegistry = this.getRegistry('font');
    
    // Find font by legacy name
    for (const [key, asset] of fontRegistry.assets.entries()) {
      if (asset.metadata.legacyName === fontKey) {
        lcardsLog.info(`[AssetManager] Migrating font: ${fontKey} → ${key}`);
        return key;
      }
    }
    
    return fontKey;
  }

  /**
   * Get all available fonts
   * @returns {Array<Object>} Font metadata array
   */
  listFonts() {
    const fontRegistry = this.getRegistry('font');
    const fonts = [];
    
    for (const [key, asset] of fontRegistry.assets.entries()) {
      fonts.push({
        key,
        displayName: asset.metadata.displayName,
        category: asset.metadata.category,
        legacyName: asset.metadata.legacyName,
        description: asset.metadata.description,
        pack: asset.metadata.pack
      });
    }
    
    return fonts;
  }

  /**
   * Get fonts grouped by category
   * @returns {Object<string, Array>} Fonts grouped by category
   */
  getFontsByCategory() {
    const fonts = this.listFonts();
    return fonts.reduce((acc, font) => {
      const cat = font.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(font);
      return acc;
    }, {});
  }

  /**
   * Cleanup on destroy
   */
  async destroy() {
    this.clear();
    lcardsLog.debug('[AssetManager] Destroyed');
  }
}

export default AssetManager;
