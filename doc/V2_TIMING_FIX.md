# V2 Singleton Timing Fix

## Problem
V2CardSystemsManager was accessing ThemeManager and StylePresetManager during initialization before these singletons were fully ready, causing "Theme manager not ready" warnings in console.

## Root Cause
The initialization flow had V2 cards trying to bind to singleton managers at construction time (around line 142 in trace.log) while the core initialization completed much later (line 1047).

## Solution
Implemented lazy-loading pattern in V2CardSystemsManager methods:

### Modified Methods

1. **getThemeToken(tokenPath, fallback)**
   - Added lazy-loading check for ThemeManager
   - Only shows debug message once per card instance to avoid spam
   - Gracefully returns fallback if manager not ready

2. **getStylePreset(overlayType, presetName)**
   - Added lazy-loading for both StylePresetManager and ThemeManager
   - Single debug warning per card instance
   - Returns null safely if managers not ready

3. **getAvailablePresets(overlayType)**
   - Added lazy-loading for StylePresetManager
   - Returns empty array if manager not ready
   - No warning spam

### Key Features of Fix

- **Lazy Loading**: Methods check for and bind to managers on first access
- **Warning Reduction**: Changed from `warn` to `debug` level and limited to once per card
- **Graceful Degradation**: Methods return sensible defaults when managers not ready
- **No Functional Impact**: Full functionality restored once core initialization completes

### Code Pattern
```javascript
// Lazy-load manager if not available yet
if (!this.managerName) {
    const core = this.getCore();
    if (core) {
        this.managerName = core.getManagerName();
    }
}

if (!this.managerName) {
    // Only warn once per card instance to avoid spam
    if (!this._managerWarnShown) {
        lcardsLog.debug(`[V2CardSystemsManager] Manager not ready yet (${this.cardId})`);
        this._managerWarnShown = true;
    }
    return fallback;
}
```

## Testing
Created `test-timing-fix.html` to verify warning elimination while maintaining full preset system functionality.

## Result
- Eliminates console warning spam during V2-only page initialization
- Maintains full preset and theme system functionality
- Preserves existing API contracts
- No performance impact once managers are available