# SVG Background Fix - November 28, 2025

## Issue

The SVG background feature in `lcards-simple-button` was not rendering. When testing Example 1 from `doc/examples/simple-button-svg-background.yaml`, the button rendered with the default rectangular background instead of the configured SVG gradient.

### Rendered Output
The DOM showed a default `<rect>` element instead of the expected SVG content:
```html
<rect class="button-bg button-clickable" x="0" y="0" width="236.109375" height="55.984375"
      rx="8" ry="8" style="fill: var(--lcars-card-button, var(--picard-medium-light-gray));">
</rect>
```

### Error Message
```
LCARdS|error [LCARdSSimpleButtonCard] Invalid SVG markup: This page contains the following errors:
error on line 2 at column 1: Extra content at the end of the document
```

## Root Causes

### Issue 1: Missing SVG Re-processing After Config Update

The issue was in the config update lifecycle:

1. **Initial Config Processing**: When `setConfig()` is called, the button card processes the SVG config in `_onConfigSet()` → `_processSvgConfig()`, storing the result in `this._processedSvg`.

2. **Async Config Replacement**: LCARdSSimpleCard asynchronously processes the config through CoreConfigManager via `_processConfigAsync()`, which **replaces** `this.config` with the merged config:
   ```javascript
   // Update internal config
   this.config = result.mergedConfig;
   ```

3. **Missing SVG Re-processing**: When `_onConfigUpdated()` was called after the async config replacement, it only re-resolved the button style but **did NOT re-process the SVG config**. This left `this._processedSvg` pointing to the old config's SVG data.

4. **Null SVG Reference**: During rendering, `_generateSimpleButtonSVG()` checks for `this._processedSvg && this._processedSvg.content`, but since the SVG wasn't re-processed, this condition failed and fell back to rendering a simple rect.

### Issue 2: Invalid SVG Fragment Parsing

The SVG sanitization was failing because the YAML config provided SVG **fragments** (multiple root elements) instead of a complete SVG document:

```yaml
svg:
  content: |
    <rect width="100" height="100" fill="url(#grad1)" />
    <defs>
      <linearGradient id="grad1" ...>
      </linearGradient>
    </defs>
```

This is **not valid XML** for `DOMParser` because XML requires a single root element. The parser threw the error: "Extra content at the end of the document".

### Issue 3: XML Declaration in External SVG Files

When loading external SVG files, some files include an XML declaration at the top:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg ...>
```

The XML declaration must be at the very start of a document. When the sanitizer wraps content for parsing, the declaration ends up in the middle, causing the error: "XML declaration allowed only at the start of the document".

## Solutions

### Fix 1: Re-process SVG After Config Update

Updated `_onConfigUpdated()` to re-process the SVG configuration after the config is replaced by CoreConfigManager:

```javascript
_onConfigUpdated() {
    lcardsLog.debug(`[LCARdSSimpleButtonCard] Config updated by CoreConfigManager, re-resolving button style and SVG`);

    // Re-process SVG configuration (in case config was replaced by CoreConfigManager)
    this._processSvgConfig();

    // Re-resolve button style with the new merged config
    this._resolveButtonStyleSync();
}
```

### Fix 2: Auto-wrap SVG Fragments & Strip XML Declarations

Updated `_sanitizeSvg()` to automatically handle both SVG fragments and XML declarations:

```javascript
_sanitizeSvg(svgContent, stripScripts = true) {
    // Strip XML declaration if present (causes parsing errors when wrapping)
    // Matches: <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    let cleanedContent = svgContent.trim().replace(/^<\?xml[^?]*\?>\s*/i, '');

    // Wrap content in <svg> if not already wrapped (allows fragments like <rect/><defs/>)
    let wrappedContent = cleanedContent;
    if (!wrappedContent.startsWith('<svg')) {
        wrappedContent = `<svg xmlns="http://www.w3.org/2000/svg">${cleanedContent}</svg>`;
    }

    // Parse SVG to DOM (in memory, not attached to document)
    const parser = new DOMParser();
    const doc = parser.parseFromString(wrappedContent, 'image/svg+xml');

    // ... sanitization logic ...

    // Return the full SVG (including wrapper if we added one)
    // _renderSvgBackground will strip the outer <svg> tag if present
    return new XMLSerializer().serializeToString(svg);
}
```

This allows users to provide:
- **Complete SVG documents**: `<svg>...</svg>` (used as-is)
- **SVG fragments**: `<rect/><defs/>...` (auto-wrapped for parsing)
- **SVG with XML declarations**: `<?xml ...?><svg>...</svg>` (declaration stripped before parsing)

The `_renderSvgBackground()` method already strips outer `<svg>` tags, so the wrapper is transparent to the rest of the system.## Additional Improvements

Added comprehensive debug logging to track SVG processing:

1. **In `_processSvgConfig()`**: Logs when SVG config is detected and processed
2. **In `_finalizeSvgProcessing()`**: Logs the processed SVG content length
3. **In `_generateSimpleButtonSVG()`**: Logs the rendering decision (SVG vs. rect)

This will help identify similar issues in the future.

## Testing

To test the fix:

1. **Refresh your browser** to load the updated `lcards.js`
2. **Open the browser console** (F12) and filter for "LCARdSSimpleButtonCard"
3. **Reload the page** and look for these log messages:
   - `_processSvgConfig called`
   - `Processing inline SVG content`
   - `SVG processed`
   - `Config updated by CoreConfigManager, re-resolving button style and SVG`
   - `Using SVG background`

4. **Verify the rendered output**: The button should now display with the gradient background defined in the SVG config.

## Expected Behavior

After the fix, Example 1 should render with:
- A gradient background transitioning from orange (`rgb(255,153,0)`) to darker orange (`rgb(204,102,0)`)
- The text "GRADIENT BUTTON" centered on the gradient
- The SVG content properly scaled to the button dimensions

## Files Modified

- `src/cards/lcards-simple-button.js`:
  - Fixed `_onConfigUpdated()` to re-call `_processSvgConfig()`
  - Added debug logging in `_processSvgConfig()`, `_finalizeSvgProcessing()`, and `_generateSimpleButtonSVG()`

## Related Files

- `doc/examples/simple-button-svg-background.yaml` - Test examples for SVG background feature
- `doc/architecture/simple-button-schema-definition.md` - Schema definition including SVG properties

## Impact

This fix ensures that all SVG background configurations are properly preserved through the async config processing pipeline, enabling:
- Full SVG backgrounds (Phase 1)
- Segmented interactive SVG regions (Phase 2)
- External SVG files and data URIs
- Template token processing in SVG content
