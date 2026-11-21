---
paths:
  - "src/**"
---

# LCARdS Security Rules

User config (YAML, templates, SVG files, URLs) reaches the DOM and Home Assistant through these paths. Check them on every change and in reviews.

## Evaluating user code

- JavaScript templates (`[[[ ]]]`) run only through the template evaluators (`UnifiedTemplateEvaluator`, `LCARdSCardTemplateEvaluator`). The other `new Function` sites are the rules engine conditions (`compileConditions.js`), the `expression` processor (`ExpressionProcessor.js`), the editor's declarative `condition` (`LCARdSBaseEditor.js`) and `lcards-anim-helpers.js`. Don't add another: route new code through an evaluator. (The slider's own `[[[ ]]]` evaluator, `lcards-slider.js` `new Function('hass', 'entity', 'states', ...)`, predates this rule.)
- Never `eval()`.

## Writing to the DOM

- `unsafeHTML()` / `unsafeSVG()` only on content LCARdS generated or sanitized, with a comment saying which. User SVG goes through `sanitizeSvg()` (`src/utils/lcards-svg-helpers.js`) first.
- `innerHTML =` the same: generated markup only, never a raw config string.
- User strings put into generated CSS or SVG `style` (`<style>`, `style=`, `setAttribute('style', ...)`) are escaped or validated by the schema first.
- A template result used as a link (`href`, `src`) is checked before use; one used as an `id` or `class` keeps to safe characters.

## Network and Home Assistant

- Fetch user assets only through the asset helpers (`bundleUrl()`, `AssetManager`, `lcards-fileutils.js`, the chart history fetcher); no `XMLHttpRequest`, no new direct `fetch()` from cards.
- Service calls go through `this.callService()` (error handling and logging); actions through `this.setupActions()` (hold timing, haptics, confirmation).
- `hass.callWS()` / `connection.subscribeMessage()` outside a service always handle errors.

## Config and logs

- `setConfig()` throws on invalid or missing required config instead of rendering something half-configured.
- Clamp user numbers (sizes, opacity, brightness) before use.
- Don't log a whole config at `info`; at `debug` prefer the keys you need. Configs hold entity ids and personal labels.
