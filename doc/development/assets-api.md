# Assets & SVG API

Pack and card developer reference for font loading, SVG caching, and SVG utility helpers.

---

## Font Loading

### `window.lcards.loadFont(fontInput)`

Dynamically injects a font stylesheet into the document. Safe to call multiple times — already-loaded fonts are skipped.

**Parameters:**
- `fontInput` — comma-separated font-family string, URL, or `lcards_*` font name

**Accepted formats:**

```javascript
// 1. LCARdS built-in font (lcards_ prefix required)
window.lcards.loadFont('lcards_antonio');

// 2. Comma-separated list (e.g. from a font-family CSS value)
window.lcards.loadFont('lcards_microgramma, lcards_handel_gothic');

// 3. Remote URL — injects a <link> directly
window.lcards.loadFont('https://fonts.googleapis.com/css2?family=Roboto');
```

Built-in font names use the `lcards_` prefix. Legacy `cb-lcars_*` names are auto-migrated at load time. Fonts without the `lcards_` prefix (and that are not URLs) are silently ignored.

---

## SVG Cache

### `window.lcards.loadUserSVG(key, url)` → `Promise<string | undefined>`

Fetches an SVG from `url`, strips its `width`/`height` attributes (replaces with `100%`), caches it under `key`, and returns the SVG string. Subsequent calls for the same `key` return the cached value immediately.

```javascript
await window.lcards.loadUserSVG('my_ship', '/local/lcards/svgs/ship.svg');
// → '<svg width="100%" height="100%" ...>...</svg>'
```

Returns `undefined` on fetch failure.

### `window.lcards.getSVGFromCache(key)` → `string | undefined`

Synchronous cache lookup. Returns the SVG string if previously loaded, otherwise `undefined`.

```javascript
const svg = window.lcards.getSVGFromCache('my_ship');
if (svg) {
  myElement.innerHTML = svg;
}
```

---

## SVG Helpers (`window.lcards.svgHelpers`)

Utilities for generating SVG element strings. All return an SVG element as a string.

### Drawing functions

All accept an options object. `id`, `attrs`, and `style` are optional on every function.

| Function | Required fields | Description |
|---|---|---|
| `drawLine({ x1, y1, x2, y2, id?, attrs?, style? })` | x1, y1, x2, y2 | `<line>` element |
| `drawPolyline({ points, id?, attrs?, style? })` | points | `<polyline>` |
| `drawPath({ d, id?, attrs?, style? })` | d | `<path>` |
| `drawText({ x, y, text, id?, attrs?, style? })` | x, y, text | `<text>` |
| `drawCircle({ cx, cy, r, id?, attrs?, style? })` | cx, cy, r | `<circle>` |
| `drawRect({ x, y, width, height, id?, attrs?, style? })` | x, y, width, height | `<rect>` |

```javascript
const svg = window.lcards.svgHelpers;

svg.drawRect({ x: 0, y: 0, width: 200, height: 50, attrs: { fill: '#1b4f8a' } });
// → '<rect x="0" y="0" width="200" height="50" fill="#1b4f8a" />'

svg.drawLine({ x1: 0, y1: 25, x2: 200, y2: 25, style: { stroke: 'white', strokeWidth: 2 } });
```

### Utility functions

| Function | Description |
|---|---|
| `attrsToString(attrs)` | Convert an attributes object to an HTML attribute string |
| `styleToString(style)` | Convert a style object to an inline CSS string |
| `escapeXmlAttribute(value)` | Escape a string for safe use inside an XML/SVG attribute value |
| `sanitizeSvg(svgContent, stripScripts?)` | Remove unsafe elements from SVG markup. `stripScripts` defaults to `true` |
| `extractViewBox(svgContent)` | Extract the `viewBox` attribute string from SVG markup |
| `extractDataUriContent(dataUri)` | Decode and return the content of a `data:` URI |

---

## Anchor Helpers (`window.lcards.anchorHelpers`)

Utilities for working with LCARdS SVG anchor markers (`data-anchor` attributes).

### `window.lcards.findSvgAnchors(svgContent)` → `Object`

Also available directly as `window.lcards.findSvgAnchors`. Parses SVG markup and returns a map of anchor name → position/size data. Used by the MSD renderer to place overlays at named positions within background SVGs.

```javascript
const anchors = window.lcards.findSvgAnchors(svgString);
// → { 'top-left': { x, y, width, height }, ... }
```

### Additional anchor functions

Available on `window.lcards.anchorHelpers.*`:

| Function | Description |
|---|---|
| `getSvgContent(base_svg)` | Resolve and return SVG content (string, URL, or cache key) |
| `getSvgViewBox(svgContent)` | Extract and parse the viewBox as `{ x, y, width, height }` |
| `getSvgAspectRatio(viewBox)` | Return the aspect ratio (width / height) from a parsed viewBox |

---

## Text Measure Cache

### `window.lcards.clearTextMeasureCache()`

Clears the internal canvas-based text measurement cache used by the MSD renderer. Call this after a font is loaded or changed to ensure subsequent text layout measurements use the new font metrics.

```javascript
window.lcards.loadFont('lcards_microgramma');
window.lcards.clearTextMeasureCache();
```

---

## Internal references (not public API)

Two root properties exist for MSD renderer internal compatibility and should not be used in pack code:

| Property | What it points to |
|---|---|
| `window.lcards.theme` | `lcardsCore.getThemeManager()` — use `window.lcards.core.themeManager` instead |
| `window.lcards.styleResolver` | `lcardsCore.getStylePresetManager()` — use `window.lcards.core.stylePresetManager` instead |

---

## See Also

- [Animation API](anim-api.md)
- [Debug API](debug-api.md)
- [Pack System](../architecture/subsystems/pack-system.md)
