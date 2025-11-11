# AssetManager Singleton: Detailed Implementation Proposal

## Executive Summary

Create a unified `AssetManager` singleton that consolidates asset loading (fonts, SVGs, icons) while integrating seamlessly with existing systems (StylePresetManager, ThemeManager, AnimationManager). This provides a foundation for "experience packs" without requiring a major refactor.

**Key Principle**: AssetManager **coordinates and caches**, existing managers **consume and utilize**. No rewrites needed.

---

## Current Asset Loading Analysis

Let me first analyze the current state:Perfect! Now I have a comprehensive view of the codebase. Let me create a detailed, pragmatic proposal for the AssetManager singleton that integrates elegantly with existing systems.

---

# 📦 AssetManager Singleton - Detailed Implementation Proposal

## Executive Summary

Create an **AssetManager singleton** that centralizes font, SVG, and asset loading while **preserving existing systems** (StylePresetManager, ThemeManager, AnimationManager). This approach:

- ✅ **Non-disruptive**: Works alongside existing code, no mass refactoring
- ✅ **Incremental adoption**: Migrate legacy systems progressively
- ✅ **Pack-driven**: Unifies assets into "experience packs"
- ✅ **Backward compatible**: Existing APIs continue to work

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   AssetManager                          │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │  Fonts   │   SVGs   │  Icons   │  Future  │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│        ↑           ↑          ↑                         │
│        └───────────┴──────────┘                         │
│               Pack Loading                              │
│  ┌────────────────────────────────────────────┐        │
│  │  Experience Packs (fonts + svgs + themes)  │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │   Theme    │  │  Preset    │  │ Animation  │
  │  Manager   │  │  Manager   │  │  Manager   │
  └────────────┘  └────────────┘  └────────────┘
```

**Key principle:** AssetManager handles **loading and caching**, existing managers handle **application and logic**.

---

## 2. Core Implementation

### File: `src/core/assets/AssetManager.js`

```javascript
/**
 * AssetManager - Centralized asset loading and caching
 * 
 * Handles fonts, SVGs, icons, and future assets (audio, images).
 * Works with pack system for bundled asset loading.
 * 
 * Philosophy:
 * - Loading/caching only (doesn't handle application logic)
 * - Works WITH existing managers (Theme, Preset, Animation)
 * - Pack-based for "experience bundles"
 * - Progressive enhancement (legacy APIs still work)
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

export class AssetManager {
    constructor() {
        // Asset storage
        this._fonts = new Map();           // name → FontMetadata
        this._svgs = new Map();            // key → SVGData
        this._icons = new Map();           // name → IconSprite
        
        // Loading state
        this._loadingPromises = new Map(); // asset key → Promise
        this._loadedPacks = new Set();     // track loaded packs
        
        // Configuration
        this._cachingEnabled = true;
        this._preloadOnInit = true;
        
        lcardsLog.debug('[AssetManager] Instance created');
    }

    /**
     * Initialize with builtin assets (called from lcards-core.js)
     * @param {Array<Object>} builtinPacks - Array of pack definitions
     */
    async initialize(builtinPacks = []) {
        lcardsLog.info('[AssetManager] 🚀 Initializing...');

        try {
            // Load builtin packs
            for (const pack of builtinPacks) {
                await this.loadPack(pack);
            }

            lcardsLog.info('[AssetManager] ✅ Initialized with builtin assets');
            return true;
        } catch (error) {
            lcardsLog.error('[AssetManager] ❌ Initialization failed:', error);
            return false;
        }
    }

    // ========================================================================
    // PACK LOADING - Experience Packs
    // ========================================================================

    /**
     * Load an experience pack (fonts + svgs + metadata)
     * @param {Object} pack - Pack definition
     * @returns {Promise<void>}
     */
    async loadPack(pack) {
        if (!pack || !pack.id) {
            lcardsLog.warn('[AssetManager] Invalid pack (missing id)');
            return;
        }

        if (this._loadedPacks.has(pack.id)) {
            lcardsLog.debug(`[AssetManager] Pack already loaded: ${pack.id}`);
            return;
        }

        lcardsLog.info(`[AssetManager] 📦 Loading pack: ${pack.id}`);

        try {
            // Load fonts
            if (pack.fonts && Array.isArray(pack.fonts)) {
                await Promise.all(
                    pack.fonts.map(font => this.loadFont(font.name, font.source, font))
                );
            }

            // Load SVGs
            if (pack.svgs && Array.isArray(pack.svgs)) {
                await Promise.all(
                    pack.svgs.map(svg => this.loadSvg(svg.key, svg.source, svg))
                );
            }

            // Load icons (future)
            if (pack.icons && Array.isArray(pack.icons)) {
                await Promise.all(
                    pack.icons.map(icon => this.loadIconSprite(icon.name, icon.source))
                );
            }

            this._loadedPacks.add(pack.id);
            lcardsLog.info(`[AssetManager] ✅ Pack loaded: ${pack.id}`);

        } catch (error) {
            lcardsLog.error(`[AssetManager] ❌ Failed to load pack ${pack.id}:`, error);
        }
    }

    /**
     * Unload a pack (free memory)
     * @param {string} packId - Pack identifier
     */
    async unloadPack(packId) {
        // Future enhancement for dynamic pack switching
        lcardsLog.debug(`[AssetManager] Unloading pack: ${packId}`);
        // Implementation: Remove assets tagged with this packId
        this._loadedPacks.delete(packId);
    }

    // ========================================================================
    // FONT LOADING
    // ========================================================================

    /**
     * Load a font via FontFace API
     * @param {string} name - Font family name
     * @param {string} source - URL or data URI
     * @param {Object} options - Font options (weight, style, display)
     * @returns {Promise<FontFace>}
     */
    async loadFont(name, source, options = {}) {
        const cacheKey = `${name}-${options.weight || 400}-${options.style || 'normal'}`;

        // Check cache
        if (this._fonts.has(cacheKey)) {
            lcardsLog.trace(`[AssetManager] Font cached: ${name}`);
            return this._fonts.get(cacheKey).fontFace;
        }

        // Check for ongoing load
        if (this._loadingPromises.has(cacheKey)) {
            return this._loadingPromises.get(cacheKey);
        }

        // Start load
        const loadPromise = this._loadFontInternal(name, source, options, cacheKey);
        this._loadingPromises.set(cacheKey, loadPromise);

        try {
            const result = await loadPromise;
            this._loadingPromises.delete(cacheKey);
            return result;
        } catch (error) {
            this._loadingPromises.delete(cacheKey);
            throw error;
        }
    }

    /**
     * Internal font loading implementation
     * @private
     */
    async _loadFontInternal(name, source, options, cacheKey) {
        try {
            lcardsLog.debug(`[AssetManager] 🔤 Loading font: ${name} from ${source}`);

            const fontFace = new FontFace(
                name,
                `url(${source})`,
                {
                    weight: options.weight || 400,
                    style: options.style || 'normal',
                    display: options.display || 'swap'
                }
            );

            await fontFace.load();
            document.fonts.add(fontFace);

            // Cache
            this._fonts.set(cacheKey, {
                name,
                source,
                options,
                fontFace,
                loadedAt: Date.now()
            });

            lcardsLog.info(`[AssetManager] ✅ Font loaded: ${name}`);
            return fontFace;

        } catch (error) {
            lcardsLog.error(`[AssetManager] ❌ Font load failed: ${name}`, error);
            throw error;
        }
    }

    /**
     * Check if font is loaded
     * @param {string} name - Font family name
     * @returns {boolean}
     */
    isFontLoaded(name) {
        for (const [key, font] of this._fonts) {
            if (font.name === name) {
                return true;
            }
        }
        return false;
    }

    // ========================================================================
    // SVG LOADING
    // ========================================================================

    /**
     * Load an SVG template
     * @param {string} key - SVG identifier
     * @param {string} source - 'builtin:key' or '/local/path.svg'
     * @param {Object} options - { preload, extractAnchors }
     * @returns {Promise<Object>} { content, viewBox, anchors }
     */
    async loadSvg(key, source, options = {}) {
        // Check cache
        if (this._svgs.has(key)) {
            lcardsLog.trace(`[AssetManager] SVG cached: ${key}`);
            return this._svgs.get(key);
        }

        // Check for ongoing load
        if (this._loadingPromises.has(key)) {
            return this._loadingPromises.get(key);
        }

        // Start load
        const loadPromise = this._loadSvgInternal(key, source, options);
        this._loadingPromises.set(key, loadPromise);

        try {
            const result = await loadPromise;
            this._loadingPromises.delete(key);
            return result;
        } catch (error) {
            this._loadingPromises.delete(key);
            throw error;
        }
    }

    /**
     * Internal SVG loading implementation
     * @private
     */
    async _loadSvgInternal(key, source, options) {
        try {
            lcardsLog.debug(`[AssetManager] 🎨 Loading SVG: ${key} from ${source}`);

            let content;

            // Handle builtin SVGs
            if (source.startsWith('builtin:')) {
                const builtinKey = source.replace('builtin:', '');
                content = window.lcards?.assets?.svg_templates?.[builtinKey];
                
                if (!content) {
                    throw new Error(`Builtin SVG not found: ${builtinKey}`);
                }
            }
            // Handle user SVGs
            else if (source.startsWith('/local/') || source.startsWith('/hacsfiles/')) {
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                content = await response.text();
            }
            else {
                throw new Error(`Unsupported SVG source: ${source}`);
            }

            // Parse SVG data
            const svgData = {
                key,
                source,
                content,
                viewBox: this._extractViewBox(content),
                anchors: options.extractAnchors ? this._extractAnchors(content) : {},
                loadedAt: Date.now()
            };

            // Cache
            this._svgs.set(key, svgData);

            // Also expose via legacy API for compatibility
            if (source.startsWith('builtin:')) {
                const builtinKey = source.replace('builtin:', '');
                window.lcards = window.lcards || {};
                window.lcards.assets = window.lcards.assets || {};
                window.lcards.assets.svg_templates = window.lcards.assets.svg_templates || {};
                window.lcards.assets.svg_templates[builtinKey] = content;
            }

            lcardsLog.info(`[AssetManager] ✅ SVG loaded: ${key}`);
            return svgData;

        } catch (error) {
            lcardsLog.error(`[AssetManager] ❌ SVG load failed: ${key}`, error);
            throw error;
        }
    }

    /**
     * Get SVG from cache
     * @param {string} key - SVG identifier
     * @returns {Object|null} SVG data or null
     */
    getSvg(key) {
        return this._svgs.get(key) || null;
    }

    /**
     * Get SVG content string
     * @param {string} key - SVG identifier
     * @returns {string|null} SVG content or null
     */
    getSvgContent(key) {
        const svg = this._svgs.get(key);
        return svg ? svg.content : null;
    }

    /**
     * Extract viewBox from SVG content
     * @private
     */
    _extractViewBox(svgContent) {
        // Use existing helper if available
        if (window.lcards?.getSvgViewBox) {
            return window.lcards.getSvgViewBox(svgContent);
        }

        // Fallback implementation
        const match = svgContent.match(/viewBox=["']([^"']+)["']/);
        if (match) {
            return match[1].split(' ').map(Number);
        }
        return [0, 0, 1920, 1080]; // default
    }

    /**
     * Extract anchors from SVG content
     * @private
     */
    _extractAnchors(svgContent) {
        // Use existing helper if available
        if (window.lcards?.findSvgAnchors) {
            return window.lcards.findSvgAnchors(svgContent);
        }

        // Fallback: no anchor extraction
        return {};
    }

    // ========================================================================
    // ICON LOADING (Future)
    // ========================================================================

    /**
     * Load an icon sprite sheet
     * @param {string} name - Sprite name
     * @param {string} source - Sprite URL
     * @returns {Promise<void>}
     */
    async loadIconSprite(name, source) {
        lcardsLog.debug(`[AssetManager] 🎭 Loading icon sprite: ${name}`);
        // Future implementation
        // Similar to SVG loading but for sprite sheets
    }

    /**
     * Get individual icon from sprite
     * @param {string} spriteName - Sprite name
     * @param {string} iconName - Icon name
     * @returns {string|null} Icon SVG or null
     */
    getIcon(spriteName, iconName) {
        // Future implementation
        return null;
    }

    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            fonts: {
                count: this._fonts.size,
                items: Array.from(this._fonts.keys())
            },
            svgs: {
                count: this._svgs.size,
                items: Array.from(this._svgs.keys())
            },
            icons: {
                count: this._icons.size,
                items: Array.from(this._icons.keys())
            },
            packs: {
                count: this._loadedPacks.size,
                items: Array.from(this._loadedPacks)
            },
            memoryEstimate: this._estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage (rough)
     * @private
     */
    _estimateMemoryUsage() {
        let bytes = 0;

        // SVG content
        for (const svg of this._svgs.values()) {
            bytes += svg.content.length * 2; // UTF-16
        }

        // Rough estimate
        return `~${Math.round(bytes / 1024)}KB`;
    }

    /**
     * Clear cache (selective or all)
     * @param {string} type - 'fonts' | 'svgs' | 'icons' | 'all'
     */
    clearCache(type = 'all') {
        lcardsLog.info(`[AssetManager] 🧹 Clearing cache: ${type}`);

        switch (type) {
            case 'fonts':
                this._fonts.clear();
                break;
            case 'svgs':
                this._svgs.clear();
                break;
            case 'icons':
                this._icons.clear();
                break;
            case 'all':
                this._fonts.clear();
                this._svgs.clear();
                this._icons.clear();
                this._loadedPacks.clear();
                break;
        }
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            initialized: true,
            ...this.getCacheStats()
        };
    }

    /**
     * Cleanup (called on destroy)
     */
    destroy() {
        this.clearCache('all');
        this._loadingPromises.clear();
        lcardsLog.debug('[AssetManager] Destroyed');
    }
}
```

---

## 3. Pack Structure Definition

### File: `src/core/assets/packs/builtin-assets-pack.js`

```javascript
/**
 * Builtin Assets Pack
 * 
 * Contains core LCARS fonts and SVG templates
 */

export const builtinAssetsPack = {
    id: 'builtin_assets',
    version: '1.0.0',
    name: 'LCARdS Core Assets',
    description: 'Core fonts and SVG templates for LCARdS',

    // Fonts
    fonts: [
        {
            name: 'LCARS',
            source: '/hacsfiles/lcards/fonts/LCARS.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap',
            preload: true
        },
        {
            name: 'Antonio',
            source: '/hacsfiles/lcards/fonts/Antonio-Bold.woff2',
            weight: 700,
            style: 'normal',
            display: 'swap',
            preload: true
        },
        {
            name: 'Antonio',
            source: '/hacsfiles/lcards/fonts/Antonio-Regular.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap',
            preload: false
        }
    ],

    // SVG Templates
    svgs: [
        {
            key: 'picard_panel',
            source: 'builtin:picard_panel',
            preload: true,
            extractAnchors: true
        },
        {
            key: 'voyager_ops',
            source: '/hacsfiles/lcards/msd/voyager_ops.svg',
            preload: false,
            extractAnchors: true
        },
        {
            key: 'enterprise_d_lcars',
            source: '/hacsfiles/lcards/msd/enterprise_d_lcars.svg',
            preload: false,
            extractAnchors: true
        }
    ],

    // Icons (future)
    icons: []
};
```

### File: `src/core/assets/packs/index.js`

```javascript
/**
 * Pack Registry
 * Central index of all available asset packs
 */

import { builtinAssetsPack } from './builtin-assets-pack.js';

export const loadBuiltinAssetPacks = () => {
    return [builtinAssetsPack];
};

export { builtinAssetsPack };
```

---

## 4. Integration with LCARdSCore

### Update: `src/core/lcards-core.js`

```javascript
// Add import at top
import { AssetManager } from './assets/AssetManager.js';
import { loadBuiltinAssetPacks } from './assets/packs/index.js';

class LCARdSCore {
    constructor() {
        // ... existing singletons ...
        this.assetManager = null;       // ← NEW
        // ...
    }

    async _performInitialization(hass) {
        // ... existing initialization ...

        // Initialize AssetManager (Phase 2d) - NEW STEP
        this.assetManager = new AssetManager();
        const builtinAssets = loadBuiltinAssetPacks();
        await this.assetManager.initialize(builtinAssets);
        lcardsLog.debug('[LCARdSCore] ✅ AssetManager initialized');

        // ... rest of initialization ...
    }

    _updateHass(hass) {
        // ... existing code ...
        // AssetManager doesn't need HASS updates
    }

    getDebugInfo() {
        return {
            // ... existing debug info ...
            assetManager: this.assetManager ? this.assetManager.getDebugInfo() : null
        };
    }

    destroy() {
        // ... existing cleanup ...
        
        if (this.assetManager) {
            this.assetManager.destroy();
            this.assetManager = null;
        }
    }
}
```

---

## 5. Migration Strategy: Legacy to AssetManager

### Phase 1: Parallel Operation (Current)

**Keep existing systems working**, add AssetManager alongside:

```javascript
// lcards.js - UNCHANGED (for now)
await loadCoreFonts();  // Legacy font loader still works
await preloadSVGs(...); // Legacy SVG loader still works

// AssetManager runs in parallel
window.lcards.core.assetManager.loadPack(builtinAssetsPack);
```

**Both systems work**. No breaking changes.

---

### Phase 2: Gradual Migration (Incremental)

**Migrate legacy functions one at a time:**

#### Step 1: Redirect `loadFont` to AssetManager

```javascript
// src/utils/lcards-theme.js
export async function loadFont(name, source, options) {
    // NEW: Use AssetManager if available
    if (window.lcards?.core?.assetManager) {
        return window.lcards.core.assetManager.loadFont(name, source, options);
    }

    // FALLBACK: Legacy implementation
    return loadFontLegacy(name, source, options);
}

// Keep legacy implementation renamed
async function loadFontLegacy(name, source, options) {
    // ... existing implementation ...
}
```

#### Step 2: Redirect SVG functions

```javascript
// src/utils/lcards-fileutils.js
export async function loadSVGToCache(key, url) {
    // NEW: Use AssetManager if available
    if (window.lcards?.core?.assetManager) {
        return window.lcards.core.assetManager.loadSvg(key, url);
    }

    // FALLBACK: Legacy implementation
    return loadSVGToCacheLegacy(key, url);
}

export function getSVGFromCache(key) {
    // NEW: Try AssetManager first
    if (window.lcards?.core?.assetManager) {
        return window.lcards.core.assetManager.getSvgContent(key);
    }

    // FALLBACK: Legacy cache
    return window.lcards?.assets?.svg_templates?.[key] || null;
}
```

**Benefits:**
- ✅ Existing code keeps working
- ✅ New code uses AssetManager
- ✅ No mass find/replace needed
- ✅ Can test incrementally

---

### Phase 3: Complete Migration (Future)

Once AssetManager is proven stable:

1. **Update `lcards.js`** to use AssetManager exclusively
2. **Remove legacy functions** (or mark deprecated)
3. **Update documentation**

---

## 6. Card Usage Examples

### SimpleCard Example

```javascript
// src/cards/lcards-simple-button.js
class LCARdSSimpleButtonCard extends LCARdSSimpleCard {
    async firstUpdated() {
        super.firstUpdated();

        // Access AssetManager via singletons
        const assetManager = this._singletons?.assetManager;

        if (assetManager) {
            // Check if custom font is loaded
            const customFont = this.config.custom_font;
            if (customFont && !assetManager.isFontLoaded(customFont)) {
                await assetManager.loadFont(
                    customFont,
                    this.config.custom_font_url
                );
            }

            // Load custom SVG for button background
            if (this.config.custom_svg) {
                const svg = await assetManager.loadSvg(
                    this.config.custom_svg_key,
                    this.config.custom_svg
                );
                // Use svg.content for rendering
            }
        }
    }
}
```

### MSD Card Example

```javascript
// src/cards/lcards-msd.js - _handleSvgLoading method
async _handleSvgLoading(msdConfig) {
    const source = msdConfig.base_svg?.source;

    // NEW: Try AssetManager first
    if (window.lcards?.core?.assetManager) {
        try {
            const svgData = await window.lcards.core.assetManager.loadSvg(
                source.replace('builtin:', '').replace('/local/', ''),
                source,
                { extractAnchors: true }
            );

            this._viewBox = svgData.viewBox;
            this._anchors = svgData.anchors;
            return;
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] AssetManager load failed, using legacy:', error);
        }
    }

    // FALLBACK: Legacy loading
    // ... existing implementation ...
}
```

---

## 7. Benefits Summary

### For Users
- ✅ **Faster loading**: Preloaded assets, smart caching
- ✅ **Memory efficient**: Shared assets across cards
- ✅ **Theme packs**: Download complete "experience packs"
- ✅ **Better errors**: Clear messages when assets fail

### For Developers
- ✅ **Single source of truth**: No scattered font/SVG loaders
- ✅ **Consistent API**: `assetManager.loadFont()` everywhere
- ✅ **Debug tools**: `window.lcards.core.assetManager.getCacheStats()`
- ✅ **Extensible**: Easy to add audio, images, etc.

### For Architecture
- ✅ **Clean separation**: Loading vs. application logic
- ✅ **Non-disruptive**: Works WITH existing systems
- ✅ **Incremental**: Migrate at your own pace
- ✅ **Future-proof**: Ready for community packs

---

## 8. Pragmatic Implementation Timeline

### Week 1: Foundation
- [ ] Create `AssetManager.js` with font + SVG support
- [ ] Create `builtin-assets-pack.js`
- [ ] Integrate with `lcards-core.js`
- [ ] Test in parallel with legacy systems

### Week 2: Migration Shims
- [ ] Add fallback wrappers to `loadFont`, `loadSVGToCache`
- [ ] Update `lcards.js` to expose AssetManager
- [ ] Test backward compatibility

### Week 3: Card Integration
- [ ] Update SimpleCard to use AssetManager (optional)
- [ ] Update MSD card to use AssetManager (fallback)
- [ ] Document usage patterns

### Week 4+: Community
- [ ] Document pack creation
- [ ] Create community pack template
- [ ] Build 2-3 example theme packs

---

## 9. Questions & Decisions

### Q1: Should AssetManager load theme tokens too?

**Recommendation**: No. Keep AssetManager for **files** (fonts, SVGs, icons). ThemeManager handles **configuration** (tokens, colors).

**Why**: Clear separation of concerns. Themes reference assets, but don't contain them.

---

### Q2: Should packs include animation definitions?

**Recommendation**: Yes, but **reference** them, don't duplicate.

```javascript
// In pack definition
{
    id: 'lcars_voyager_pack',
    fonts: [...],
    svgs: [...],
    animations: 'builtin:voyager_animations',  // ← Reference
    themes: 'builtin:voyager_theme'            // ← Reference
}
```

Pack orchestrates loading, but data lives in respective managers.

---

### Q3: How to handle pack dependencies?

**Future enhancement**:

```javascript
{
    id: 'community_enterprise_pack',
    depends_on: ['builtin_assets'],  // Require base pack
    fonts: [...],
    svgs: [...]
}
```

AssetManager checks dependencies and loads in order.

---

## 10. Final Recommendation

**Implement this proposal incrementally**:

1. ✅ **Week 1-2**: Create AssetManager + pack structure
2. ✅ **Week 3**: Add fallback wrappers (no breaking changes)
3. ✅ **Week 4+**: Migrate cards progressively
4. ✅ **Future**: Community pack ecosystem

**This approach**:
- Doesn't require massive refactoring
- Preserves existing functionality
- Provides immediate value (centralized loading)
- Sets foundation for future enhancements

---

**Ready to proceed?** I can start generating the actual implementation files, or we can refine the design further. Your call! 🚀
