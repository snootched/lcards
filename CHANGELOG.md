# Changelog

All notable changes to LCARdS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Persistent Configuration System**: Complete helper management system for storing configuration in Home Assistant input helpers
  - `LCARdSHelperManager` service for lifecycle management and state monitoring
  - `Helper Registry` with schema definitions for 13 POC helpers (alert mode + 12 HSL parameters)
  - `Helper API` wrapping WebSocket operations for helper creation/deletion
  - Integration with core singleton at `window.lcards.core.helperManager`
- **Configuration Panel**: Frontend-only panel for helper management (HACS compatible)
  - Helpers tab: View status, create, and edit helper values
  - Alert Lab tab: HSL color pickers for red, yellow, blue, and white alert modes
  - YAML Export tab: Copy helpers as YAML for manual setup
  - Manual registration via `panel_custom` in `configuration.yaml`
  - Separate webpack build: `dist/lcards-config-panel.js`
- **Alert Lab Persistence**: Bidirectional sync between Alert Lab and helpers
  - Load helper values when Alert Lab opens
  - "Save to Helpers" button to persist current parameters
  - Auto-load feature values on subsequent opens
- **Documentation**:
  - User guide for persistent helpers configuration with manual panel setup
  - Developer guide for Helpers API
  - Complete JSDoc comments for all new classes and methods

### Changed
- Alert Lab now loads HSL parameters from helpers if they exist
- Core system updated to include HelperManager in HASS distribution
- Webpack configuration updated with separate panel build entry

### Removed
- Python integration (`custom_components/lcards/`) for HACS compatibility
- Panel now requires manual registration via `panel_custom` configuration

## [Unreleased]

### Added
- **Font System Migration to AssetManager**: Complete overhaul of font loading system
  - New `core_fonts` pack containing all 34 LCARdS fonts (Core, Standard, Alien categories)
  - Font management now centralized through AssetManager singleton
  - Added `loadFont()`, `listFonts()`, and `getFontsByCategory()` methods to AssetManager
  - Automatic legacy name migration (`cb-lcars_*` → `lcards_*`)
  - Pack-based font distribution enables custom font packs
  - Lazy-loading with automatic deduplication

### Changed
- Font selector component now uses AssetManager instead of static registry
- Font loading architecture moved from global functions to AssetManager API

### Deprecated
- `loadFont()` in `src/utils/lcards-theme.js` - Use `assetManager.loadFont()` instead
- `loadCoreFonts()` - Core fonts now loaded automatically via `core_fonts` pack
- `loadAllFontsFromConfig()` - Fonts loaded on-demand via AssetManager
- `getFontSelectorOptions()` in `src/utils/lcards-fonts.js` - Use `assetManager.listFonts()` instead
- `ensureFontLoaded()` - Use `assetManager.loadFont()` instead

### Migration Guide

**For Users**: No changes required. All legacy functions continue to work and redirect to AssetManager with deprecation warnings.

**For Developers**: Update font loading calls:

```javascript
// Old (deprecated)
window.lcards.loadFont('lcards_borg');
ensureFontLoaded('lcards_borg');

// New (recommended)
const assetManager = window.lcards.core.assetManager;
await assetManager.loadFont('lcards_borg');
```

**Benefits**:
- ✅ Centralized font management via AssetManager
- ✅ Pack-based font distribution (enables custom font packs)
- ✅ Automatic legacy name migration
- ✅ Lazy-loading with deduplication
- ✅ Better debugging (fonts visible in AssetManager registry)
- ✅ Consistent architecture with SVG assets

---

## [1.27.04] - 2026-01-25

*Previous releases not documented in this changelog*
