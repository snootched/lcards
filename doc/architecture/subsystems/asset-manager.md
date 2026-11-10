# Asset Manager

> **`window.lcards.core.assetManager`**: named asset registries (SVG, image, model, font, audio), lazy loading and caching.

---

## Overview

`AssetManager` (`src/core/assets/AssetManager.js`) extends `BaseService`. It keeps one `AssetRegistry` per asset type, filled from pack `*_assets` keys by `PackManager`. SVG content is fetched on first use, sanitized and cached. Images and 3D models are URL-only: the manager maps a key to a URL so configs can say `builtin:<key>`, and the consumer loads the file itself. Fonts are CSS files injected as `<link>` tags. It also resolves Home Assistant media library IDs (`media-source://...`) to URLs.

---

## Asset Types

From `ASSET_TYPES` in AssetManager.js:

| Type | Pack key | Content | Notes |
|---|---|---|---|
| `svg` | `svg_assets` | SVG text, sanitized by `sanitizeSvg()` (`src/utils/lcards-svg-helpers.js`) | Lazy (fetched by `get()` / `loadSvg()`), cached; 2 MB limit. MSD base SVGs and backgrounds |
| `image` | `image_assets` | none (`urlOnly`) | `key → url` for `builtin:<key>` images; `get()` returns `null` by design. The browser loads the file through `loadImage()` (`src/core/packs/shared/ImageLoader.js`) |
| `model` | `model_assets` | none (`urlOnly`) | glTF / GLB models for the astrometrics card (`src: builtin:<key>` on a `model` object); metadata carries `parts` |
| `font` | `font_assets` | none in practice | Each entry's `url` is a CSS file (a bundled `/lcards/fonts/<name>.css` or a Google Fonts CSS URL), injected by `loadFont()`; 500 KB limit applies only if `get('font', ...)` is used |
| `audio` | `audio_assets` | none in practice | `SoundManager` reads `url` from the registry and plays it with an `Audio` element; `get('audio', ...)` would fetch an `ArrayBuffer` (1 MB limit) |

`listTypes()` returns these five keys: `['svg', 'image', 'model', 'font', 'audio']`.

---

## Pack Registration

`PackManager.registerPack()` calls `preloadFromPack(pack)` when the pack has any of `svg_assets`, `font_assets`, `audio_assets`, `image_assets` or `model_assets` (`src/core/PackManager.js`). Despite the name, `preloadFromPack()` fetches nothing: it registers entries (with `pack: pack.id` in the metadata) and leaves loading to first use.

```javascript
// Pack shape for each asset key (see also src/core/packs/example/lcards-example-pack.js)
export const MY_PACK = {
  id: 'my_pack',
  version: '1.0.0',

  svg_assets: {
    // url: registered as a placeholder, fetched on first use; metadata is flattened
    my_schematic: { url: '/local/my_pack/schematic.svg', metadata: { description: 'Deck plan' } },
    // a string is inline SVG content
    my_icon: '<svg viewBox="0 0 10 10">...</svg>'
    // or { content: '<svg>...</svg>', metadata: { ... } }
  },

  font_assets: {
    // url points to a CSS file with the @font-face rules, not the font file
    my_font: { url: '/local/my_pack/my-font.css', displayName: 'My Font', category: 'Custom', autoLoad: false }
  },

  image_assets: {
    my_background: { url: '/local/my_pack/bg.webp', label: 'My background', category: 'backgrounds' }
  },

  model_assets: {
    my_ship: { url: '/local/my_pack/ship.glb', label: 'My ship', parts: ['saucer', 'nacelle_port'] }
  },

  audio_assets: {
    my_tap: { url: '/local/my_pack/tap.mp3', description: 'Tap beep' }
  }
};
```

- Entries without `url` are skipped for every type except SVG (inline string or `content`).
- Font entries keep `displayName`, `category`, `legacyName`, `description`, `external`, `autoLoad`, `family`, `weight`, `style`; image entries `label`, `category`, `description`; model entries `label`, `description`, `parts`; audio entries `description`.
- The built-in font pack (`core_fonts`, `src/core/packs/core-fonts-pack.js`) builds its entries from `core_fonts.json`: `url` is the external URL for external fonts, else `/lcards/fonts/<cssFile>`.

**Font loading.** After all packs register, `LCARdSCore._performInitialization()` calls `loadFont(key)` for every font whose metadata has `autoLoad: true` (only Antonio today, a Google Fonts CSS URL). Other fonts load when something asks for them: the font selector in the editors, `borgFontAssimilation`, or a card whose config has a `font_family` naming an `lcards_*` key (`_loadFonts()` in `LCARdSNativeCard`). `autoLoad` is read only once, for the packs registered at startup. `loadFont(key)` maps a legacy CB-LCARS name (`legacyName`) to its key, then appends `<link id="lcards-font-<key>" rel="stylesheet" href="<url>">` to `document.head` once.

**Images at runtime.** `register('image', key, null, { url, label })` adds an entry from code; the `builtin:<key>` reference then resolves like a pack image. There is no image library UI that does this: users point a `source` at their own file (`/local/...`, a URL or `media-source://...`) or ship a pack with `image_assets`.

```javascript
const am = window.lcards?.core?.assetManager;
am?.register('image', 'living_room', null, {
  url: '/local/images/living-room.jpg',
  label: 'Living room'
});
// A config can now use: builtin:living_room
```

---

## Loading SVG

`loadSvg(source)` accepts:

| Source | Key used | Behaviour |
|---|---|---|
| `builtin:<key>` | `<key>` | Must be registered by a pack |
| A path Home Assistant serves (`/local/...`) or an `http(s)://` URL | The whole source, trimmed | Auto-registered on first use (`source: 'user'` or `'external'`). Two files with the same name in different folders get their own entries, and a user file named like a built-in never gets the built-in |
| `media-source://...` | The content ID | Taken as a registered key; `loadSvgFromMediaSource()` registers it |
| Anything else | The string itself | Taken as a registered key |
| empty or `'none'` | | Returns `null` |

`svgKeyForSource(source)` returns that key (or `null` for an empty source); the sync readers use it to find what `loadSvg()` registered: the MSD card's render (`_fetchRawSvgContent()`), `getSvgContent()` in `src/utils/lcards-anchor-helpers.js` (anchor extraction, MSD Studio previews) and the MSD Studio's source placard. `loadSvg()` then calls `get('svg', key)`, and returns `null` (with an error logged) when loading fails. `get(type, key)` returns cached content, or fetches the entry's `url` (`_loadExternal()`), re-registers it with the content (keeping its metadata, adding `loadedAt`), and returns it. Concurrent requests for the same key share one fetch (`loadingPromises`). `get()` itself throws when a fetch fails; `loadSvg()` catches that.

`loadSvgFromMediaSource(mediaContentId)` resolves a `media-source://...` ID (see below), registers it under the ID itself and loads it through `get()`. The MSD card uses it for media library SVGs and `loadSvg()` for the rest (`src/cards/lcards-msd.js`).

---

## `builtin:key` Resolution Flow

```
card config: an image source of 'builtin:earth_blue_marble'
    │
    ↓ loadImage('builtin:earth_blue_marble')          (src/core/packs/shared/ImageLoader.js)
      │
      ↓ assetManager.resolveImageUrl('earth_blue_marble')
        → image registry url, else the svg registry url, else null
        → '/lcards/images/nasa-blue-marble-earth-2048.webp'
      │
      ↓ new Image() with the resolved URL (cached per URL in ImageLoader)
      │
      ↓ ctx.drawImage(img, ...) in ImageEffect / the texture renderer
```

- `resolveImageUrl(key)` falls back to the SVG registry, so a `builtin:` SVG asset can be drawn as an image.
- Models resolve the same way through `resolveModelUrl(key)`, called by the astrometrics scene runtime (`src/core/astrometrics/scene-runtime.js`), which loads the GLB itself.

---

## Media Source Resolution Flow

Lets a user pick an image from Home Assistant's media library (local media, uploads, any other `media_source` platform, including LCARdS's own bundled assets: see [Media Source Platform](../ha-integration.md#media-source-platform)) as a card background or shape texture, through the editor's **Browse Home Assistant Media** mode:

```
card config: source = 'media-source://media_source/local/bedroom.jpg'
    │
    ↓ loadImage('media-source://media_source/local/bedroom.jpg')
      │
      ↓ assetManager.resolveMediaSourceUrl('media-source://media_source/local/bedroom.jpg')
        │
        ↓ no hass.connection yet? poll up to 20 × 150 ms (_waitForHassConnection)
        │
        ↓ hass.connection.sendMessagePromise({ type: 'media_source/resolve_media', media_content_id })
          → { url: '/media/local/bedroom.jpg?authSig=...', mime_type: 'image/jpeg' }
        │
        ↓ cached for 15 minutes (MEDIA_SOURCE_CACHE_TTL_MS): resolved URLs may carry an expiring signed token
      │
      ↓ new Image() with the resolved URL
      │
      ↓ ctx.drawImage(img, ...)
```

`AssetManager` gets `hass` through `updateHass()`, which `LCARdSCore._updateHass()` calls with every HASS update. `resolveMediaSourceUrl()` returns `null` (and logs) when there is still no connection after the wait, or when the call fails.

---

## Caching

- **SVG**: content cached in the registry after the first fetch, for the page session.
- **Image / model**: only the URL is stored. `ImageLoader` keeps its own per-URL promise cache; the astrometrics runtime parses each model file once per src (scene-runtime.js).
- **Font**: the `<link>` element is the cache (`loadFont()` checks its id).
- **Media source**: resolved URLs for 15 minutes, then resolved again. A media library SVG's content stays cached under its content ID.
- `clear()` empties every registry (tests); `destroy()` calls it.

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `initialize()` | `Promise<void>` | Create one registry per type |
| `updateHass(hass)` | `void` | Store HASS for media-source calls |
| `register(type, key, content, metadata?)` | `void` | Add or replace an entry; sanitizes SVG content; throws for an unknown type or content over the size limit |
| `get(type, key)` | `Promise<*>` | Content, fetching the URL on first use; `null` when unknown or URL-only; throws on a failed fetch |
| `preloadFromPack(pack)` | `Promise<void>` | Register a pack's `*_assets` entries (no fetch) |
| `loadSvg(source)` | `Promise<string\|null>` | See [Loading SVG](#loading-svg) |
| `svgKeyForSource(source)` | `string\|null` | The SVG registry key `loadSvg()` uses for a source (no I/O) |
| `loadSvgFromMediaSource(mediaContentId)` | `Promise<string\|null>` | SVG from the Home Assistant media library |
| `resolveImageUrl(key)` | `string\|null` | Image URL, falling back to an SVG asset's URL (no I/O) |
| `resolveModelUrl(key)` | `string\|null` | Model URL (no I/O) |
| `resolveMediaSourceUrl(mediaContentId)` | `Promise<string\|null>` | `media_source/resolve_media`, cached 15 minutes |
| `loadFont(fontKey)` | `Promise<void>` | Inject the font's CSS `<link>` once; accepts legacy names |
| `listFonts()` | `Object[]` | `{ key, displayName, category, legacyName, description, pack }` per font |
| `getFontsByCategory()` | `Object` | `listFonts()` grouped by `category` (`'Other'` when missing) |
| `listImages()` | `string[]` | Image keys, sorted |
| `listAssets(type)` | `string[]` | Keys of one type, sorted |
| `listTypes()` | `string[]` | `['svg', 'image', 'model', 'font', 'audio']` |
| `getMetadata(type, key)` | `Object\|null` | An entry's metadata |
| `getRegistry(type)` | `AssetRegistry` | The registry (`assets` map, `has()`, `get()`, `list()`); throws for an unknown type. There is no `hasSvg()`: use `getRegistry('svg').has(key)` |
| `clear()` / `destroy()` | `void` | Empty all registries |
| `getDebugInfo()` | `Object` | See the snapshot below |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('assetManager')
// → { type: 'AssetManager', registriesCount: 5, supportedTypes: ['svg', 'image', 'model', 'font', 'audio'],
//      registries: { svg: { assetCount, loadingCount, assets }, image: {...}, model: {...}, font: {...}, audio: {...} } }
```
```javascript [Live object]
const am = window.lcards.core.assetManager

const svg = await am.loadSvg('builtin:ncc-1701-a')  // fetch + cache
am.resolveImageUrl('earth_blue_marble')   // builtin key to URL (sync)
am.resolveModelUrl('galaxy_class')        // '/lcards/models/galaxy-class.glb'
am.listImages()                           // image keys
am.listFonts()                            // font entries
am.getMetadata('model', 'galaxy_class')   // { pack, url, label, description, parts, ... }
```
:::

---

## See Also

- [Pack System](pack-system.md)
- [Component Manager](component-manager.md)
- [Sound System](sound-system.md)
- [Media Source Platform](../ha-integration.md#media-source-platform): the reverse direction, LCARdS's own bundled assets exposed as a browsable Home Assistant media source
