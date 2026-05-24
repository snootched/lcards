# Asset Manager

> **`window.lcards.core.assetManager`** — Named asset loading, URL registry, and caching.

---

## Overview

`AssetManager` loads external SVG and font assets from pack definitions, caches them in memory, and serves them to cards on request. It also maintains a URL-only registry for image assets, which allows cards to reference images as `builtin:<key>` without AssetManager fetching the file content (the browser loads images natively via `ImageLoader`).

---

## File

`src/core/assets/AssetManager.js`

---

## Asset Types

| Type | Pack key | Description |
|---|---|---|
| `svg` | `svg_assets` | SVG markup strings; used as card backgrounds, MSD base SVGs, component shapes. Fetched via `fetch()`, sanitized, cached as text. |
| `font` | `font_assets` | Webfont declarations loaded at startup. |
| `audio` | `audio_assets` | Sound clip files, loaded as `ArrayBuffer`. |
| `image` | `image_assets` | URL-only registry for raster and SVG images. **No content is fetched by AssetManager** — stores only `key → url`. The browser loads images via `ImageLoader` using the resolved URL. |

---

## Pack Registration

Assets are registered by `PackManager` during startup:

```javascript
// Inside a pack definition:
export const MY_PACK = {
  svg_assets: {
    'enterprise_schematic': { url: '/local/lcards/assets/enterprise.svg' },
  },
  font_assets: {
    'okuda': { url: '/local/lcards/fonts/okuda.woff2', family: 'Okuda' },
  },
  // URL-only image registry — no content fetch
  image_assets: {
    'bedroom': {
      url: '/lcards/images/bedroom.jpg',
      label: 'Bedroom',
      category: 'rooms'
    },
    'lcars_panel': {
      url: '/lcards/images/lcars-panel.png',
      label: 'LCARS Panel',
      category: 'backgrounds'
    }
  }
};
```

Users can also register their own images at runtime:

```javascript
// Register a user /local/ image under a friendly name
window.lcards.core.assetManager.register('image', 'living-room', null, {
  url: '/local/images/living-room.jpg',
  label: 'Living Room'
});

// Cards can then reference it as:
// config.url: 'builtin:living-room'
```

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `loadSvg(key)` | `Promise<string>` | Load SVG by key; cached after first fetch |
| `hasSvg(key)` | `boolean` | True if SVG is already cached |
| `resolveImageUrl(key)` | `string\|null` | Resolve an image key → URL (no I/O). Used by `ImageLoader` for `builtin:key` references. |
| `listImages()` | `string[]` | All registered image asset keys |
| `listFonts()` | `Object[]` | All registered font asset entries |
| `listTypes()` | `string[]` | All registered asset categories |
| `register(type, key, content, metadata)` | `void` | Low-level registration; content may be `null` for URL-only types |
| `getRegistry(type)` | `AssetRegistry` | Full asset registry for a category |

```javascript
const assetManager = window.lcards.core.assetManager;

// Returns promise resolving to SVG string (cached after first load)
const svg = await assetManager.loadSvg('enterprise_schematic');

// Resolve an image key to its URL (synchronous — no fetch)
const url = assetManager.resolveImageUrl('bedroom');
// → '/lcards/images/bedroom.jpg'

// All registered image keys
const images = assetManager.listImages();
// → ['bedroom', 'living-room', 'lcars_panel', ...]
```

---

## `builtin:key` Resolution Flow

```
card config: url = 'builtin:bedroom'
    │
    ↓ ImageLoader.loadImage('builtin:bedroom')
      │
      ↓ assetManager.resolveImageUrl('bedroom')
        → '/lcards/images/bedroom.jpg'
      │
      ↓ new Image() with resolved URL
        → browser fetches & caches the image
      │
      ↓ ctx.drawImage(img, ...) in ImageEffect / ImageTextureEffect
```

---

## Caching

- **SVG / Font / Audio**: Cached by key in `AssetRegistry.assets` after first fetch. Session-scoped; cleared on page reload.
- **Image**: `AssetManager` stores only the URL. `ImageLoader` maintains its own `Map<url, Promise<HTMLImageElement>>` cache (also session-scoped).

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('assetManager')
// → { type: 'AssetManager', initialized: true, registeredTypes: ['svg', 'font', 'audio', 'image'] }
```
```javascript [Live object]
const am = window.lcards.core.assetManager

const svg = await am.loadSvg('enterprise_schematic')  // fetch + cache
am.resolveImageUrl('bedroom')  // resolve builtin key → URL (sync)
am.listImages()                // all registered image keys
am.listFonts()                 // registered font entries
am.listTypes()                 // ['svg', 'font', 'audio', 'image']
am.getRegistry('image')        // raw registry map for images
```
:::

---

## See Also

- [Pack System](pack-system.md)
- [Component Manager](component-manager.md)
