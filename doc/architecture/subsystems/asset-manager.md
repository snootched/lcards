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
| `getRegistry('svg').has(key)` | `boolean` | True if SVG is already cached (no `hasSvg()` shortcut exists — call `has()` on the SVG registry) |
| `resolveImageUrl(key)` | `string\|null` | Resolve an image key → URL (no I/O). Used by `ImageLoader` for `builtin:key` references. |
| `resolveMediaSourceUrl(mediaContentId)` | `Promise<string\|null>` | Resolve a `media-source://…` content ID to a real URL via the HA `media_source/resolve_media` websocket command. Result is cached for 15 minutes (resolved URLs may carry an expiring signed token). Used by `ImageLoader` for `media-source://…` references. |
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

## Media Source Resolution Flow

Lets a user pick an image from Home Assistant's native media library (local media, uploads, or any other registered `media_source` platform — including LCARdS's own bundled assets, see [Media Source Platform](../ha-integration#media-source-platform)) as a card background or shape texture, via the editor's **Browse HA Media** mode:

```
card config: source = 'media-source://media_source/local/bedroom.jpg'
    │
    ↓ ImageLoader.loadImage('media-source://media_source/local/bedroom.jpg')
      │
      ↓ assetManager.resolveMediaSourceUrl('media-source://media_source/local/bedroom.jpg')
        │
        ↓ hass.connection.sendMessagePromise({ type: 'media_source/resolve_media', media_content_id })
          → { url: '/media/local/bedroom.jpg', mime_type: 'image/jpeg' }
        │
        ↓ cached for 15 minutes (resolved URLs may carry an expiring signed token)
      │
      ↓ new Image() with resolved URL
        → browser fetches & caches the image
      │
      ↓ ctx.drawImage(img, ...) in ImageEffect / ImageTextureEffect
```

`AssetManager` requires a live `hass` instance to issue this websocket call — it receives one via `updateHass()`, wired into `LCARdSCore._updateHass()` alongside the other singletons.

---

## Caching

- **SVG / Font / Audio**: Cached by key in `AssetRegistry.assets` after first fetch. Session-scoped; cleared on page reload.
- **Image**: `AssetManager` stores only the URL. `ImageLoader` maintains its own `Map<url, Promise<HTMLImageElement>>` cache (also session-scoped).
- **Media source**: `AssetManager` caches resolved `media-source://…` URLs for 15 minutes (`MEDIA_SOURCE_CACHE_TTL_MS`), then re-resolves — resolved URLs can carry an expiring signed token, unlike `builtin:key` URLs which are permanent.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('assetManager')
// → { type: 'AssetManager', registriesCount: 4, supportedTypes: ['svg', 'font', 'audio', 'image'],
//      registries: { svg: { assetCount, loadingCount, assets }, font: {...}, audio: {...}, image: {...} } }
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
- [Media Source Platform](../ha-integration.md#media-source-platform) — the reverse direction: LCARdS's own bundled assets exposed as a browsable HA media source
