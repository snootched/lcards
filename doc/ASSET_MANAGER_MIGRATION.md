# AssetManager Migration Guide

**Version:** 1.22+  
**Breaking Changes:** None  
**Deprecations:** Legacy SVG cache API

---

## Overview

LCARdS v1.22+ introduces **AssetManager**, a unified singleton for managing all asset types (SVG, components, fonts, audio). This replaces the fragmented asset loading patterns with a consistent, extensible API.

### Key Benefits

✅ **Unified API** - Single pattern for all asset types  
✅ **Lazy Loading** - External assets load on-demand  
✅ **Pack Integration** - Assets distributed via packs  
✅ **Security** - Automatic SVG sanitization  
✅ **Discovery** - Runtime asset enumeration  
✅ **Backward Compatible** - Legacy APIs still work

---

## For Pack Authors

### Old: Hardcoded SVG Loading

```yaml
# ❌ Old: SVGs had to be manually preloaded in lcards.js
# No pack support for SVG assets
```

### New: Pack-Based SVG Distribution

```yaml
# ✅ New: SVG assets in pack definition
packs:
  - name: my_custom_pack
    version: 1.0.0
    
    svg_assets:
      # Inline SVG
      my_ship:
        content: |
          <svg viewBox="0 0 800 600">
            <!-- SVG content here -->
          </svg>
        metadata:
          ship: "USS Custom"
          era: "Custom"
      
      # External SVG (lazy loaded)
      external_ship:
        url: "/static/svg/external-ship.svg"
        metadata:
          ship: "USS External"
    
    font_assets:
      custom_font:
        url: "/static/fonts/custom.woff2"
        family: "Custom Font"
        weight: 400
        style: "normal"
    
    audio_assets:
      custom_alert:
        url: "/static/audio/alert.mp3"
        description: "Custom alert sound"
```

### Asset Registration

Packs are automatically registered by PackManager:

```javascript
// Assets are loaded when pack is registered
await packManager.registerPack(myPack);

// Assets now available via AssetManager
const svg = await assetManager.get('svg', 'my_ship');
```

---

## For MSD Card Users

### No Breaking Changes

MSD cards automatically use AssetManager internally. **Your existing configs work unchanged.**

### Debug Commands Changed

```javascript
// ❌ OLD (Still works, but deprecated)
Object.keys(window.lcards?.assets?.svg_templates || {})

// ✅ NEW (Recommended)
window.lcards.core.assetManager.listAssets('svg')
```

### Asset Discovery

```javascript
// List all registered SVGs
window.lcards.core.assetManager.listAssets('svg')
// ['ncc-1701-a-blue', 'ncc-1701-d', 'nx-01', 'my_ship']

// Get asset metadata
window.lcards.core.assetManager.getMetadata('svg', 'ncc-1701-a-blue')
// { pack: 'builtin', registeredAt: 1234567890, size: 12345, ... }

// Check if asset exists
window.lcards.core.assetManager.getRegistry('svg').has('my_ship')
// true
```

---

## For Developers

### Custom SVG Loading

#### Old Pattern

```javascript
// ❌ DEPRECATED
await window.lcards.loadUserSVG('my-ship', '/local/custom-ship.svg');
const svg = window.lcards.getSVGFromCache('my-ship');
```

#### New Pattern

```javascript
// ✅ RECOMMENDED
const assetManager = window.lcards.core.assetManager;

// Register external SVG (placeholder with URL)
assetManager.register('svg', 'my-ship', null, {
  url: '/local/custom-ship.svg',
  source: 'user'
});

// Load on demand (async)
const svg = await assetManager.get('svg', 'my-ship');

// Or sync access if already loaded
const registry = assetManager.getRegistry('svg');
if (registry.has('my-ship')) {
  const svg = registry.get('my-ship'); // Sync
}
```

### Component Access

#### Button Components

```javascript
// Old: Direct import (still works)
import { BUTTON_COMPONENTS } from './core/packs/components/buttons/index.js';

// New: AssetManager (future-proof)
const assetManager = window.lcards.core.assetManager;
assetManager.listAssets('button');
// ['basic', 'rounded', 'elbow-left', ...]

const component = await assetManager.get('button', 'basic');
```

#### Slider Components

```javascript
// Old: Direct import (still works)
import { sliderComponents } from './core/packs/components/sliders/index.js';

// New: AssetManager (registered at boot)
const assetManager = window.lcards.core.assetManager;
assetManager.listAssets('slider');
// ['basic', 'picard', 'picard-vertical']

const component = await assetManager.get('slider', 'picard');
```

### Registering Custom Assets

```javascript
const assetManager = window.lcards.core.assetManager;

// Register inline SVG
assetManager.register('svg', 'my-custom-ship', svgContent, {
  pack: 'my-pack',
  metadata: { ship: 'USS Custom' }
});

// Register external asset (lazy load)
assetManager.register('svg', 'external-ship', null, {
  url: '/local/external-ship.svg',
  source: 'user'
});

// Register component function
assetManager.register('button', 'custom-button', buttonFunction, {
  pack: 'my-pack',
  type: 'custom'
});
```

---

## API Reference

### AssetManager Methods

```javascript
const assetManager = window.lcards.core.assetManager;

// Asset registration
assetManager.register(type, key, content, metadata)

// Asset retrieval
await assetManager.get(type, key)           // Async (with lazy load)
assetManager.getRegistry(type).get(key)     // Sync (if cached)

// Asset discovery
assetManager.listTypes()                    // ['svg', 'button', 'slider', ...]
assetManager.listAssets(type)               // ['key1', 'key2', ...]
assetManager.getMetadata(type, key)         // { pack, size, url, ... }

// Registry access
const registry = assetManager.getRegistry(type)
registry.has(key)                           // Check existence
registry.get(key)                           // Get content (sync)
registry.list()                             // List all keys
```

### AssetRegistry Methods

```javascript
const registry = assetManager.getRegistry('svg');

registry.register(key, content, metadata)   // Register asset
registry.get(key)                           // Get content
registry.has(key)                           // Check if exists
registry.getMetadata(key)                   // Get metadata
registry.list()                             // List all keys
```

---

## Deprecation Timeline

| Feature | Status | Timeline |
|---------|--------|----------|
| `window.lcards.assets.svg_templates` | Deprecated | Remove in v2.0 |
| `window.lcards.loadUserSVG()` | Deprecated | Remove in v2.0 |
| `window.lcards.getSVGFromCache()` | Deprecated | Remove in v2.0 |
| Direct component imports | Supported | Continue support |
| AssetManager API | **Recommended** | Go-forward pattern |

### Backward Compatibility

All legacy APIs remain functional in v1.22+:
- `window.lcards.assets.svg_templates` - populated by preloadSVGs()
- `window.lcards.loadUserSVG()` - wrapper around AssetManager
- `window.lcards.getSVGFromCache()` - accesses AssetManager internally

**Recommendation**: Migrate to AssetManager API for new code. Legacy APIs will be removed in v2.0.

---

## Common Migration Scenarios

### Scenario 1: Custom SVG in MSD Card

**Before:**
```javascript
// Load custom SVG
await window.lcards.loadUserSVG('my-ship', '/local/ship.svg');

// Use in card config
type: custom:lcards-msd-card
msd:
  base_svg:
    source: /local/ship.svg
```

**After:**
```javascript
// Register with AssetManager (optional - MSD card does this automatically)
window.lcards.core.assetManager.register('svg', 'my-ship', null, {
  url: '/local/ship.svg',
  source: 'user'
});

// Same card config works unchanged
type: custom:lcards-msd-card
msd:
  base_svg:
    source: /local/ship.svg
```

### Scenario 2: Pack with Custom SVGs

**Before:**
```javascript
// Manual registration in lcards.js
await preloadSVGs(['custom-ship'], '/static/custom/');
```

**After:**
```yaml
# Pack definition
packs:
  - name: custom_ships
    svg_assets:
      custom-ship:
        url: "/static/custom/custom-ship.svg"
```

### Scenario 3: Runtime Asset Loading

**Before:**
```javascript
const svg = window.lcards.assets.svg_templates['ncc-1701-a-blue'];
if (!svg) {
  await window.lcards.loadUserSVG('ncc-1701-a-blue', '/hacsfiles/lcards/msd/ncc-1701-a-blue.svg');
}
```

**After:**
```javascript
const assetManager = window.lcards.core.assetManager;
const svg = await assetManager.get('svg', 'ncc-1701-a-blue');
// AssetManager handles loading automatically
```

---

## Testing Checklist

After migration, verify:

- [ ] All MSD cards render builtin SVGs correctly
- [ ] External SVGs (`/local/...`) load on demand
- [ ] Custom packs with `svg_assets` register properly
- [ ] No console errors related to asset loading
- [ ] Debug commands return expected asset lists
- [ ] Legacy `window.lcards.getSVGFromCache()` still works (if used)
- [ ] Lazy loading triggers correctly for unloaded assets

---

## Getting Help

**Debug Commands:**
```javascript
// Check AssetManager status
window.lcards.core.getDebugInfo().assetManager

// List all registered SVGs
window.lcards.core.assetManager.listAssets('svg')

// Check if specific asset exists
window.lcards.core.assetManager.getRegistry('svg').has('my-ship')

// View asset metadata
window.lcards.core.assetManager.getMetadata('svg', 'ncc-1701-a-blue')
```

**Common Issues:**

1. **SVG not loading** - Check console for AssetManager errors
2. **Pack assets not registered** - Verify pack definition syntax
3. **Legacy cache empty** - Legacy and new systems coexist independently

**Documentation:**
- [AssetManager Architecture](./architecture/subsystems/asset-manager.md)
- [Pack System Reference](./packs/pack-format.md)

---

*Last Updated: January 2026 | LCARdS v1.22*
