# MSD Multi-Instance Support Migration Guide

## Overview

As of **v1.12.0**, LCARdS MSD now supports multiple MSD card instances on the same dashboard. This removes the previous single-instance restriction and enables more flexible dashboard layouts.

## What Changed

### 1. Instance Management

**Before:** Only one MSD card could be active per dashboard. Attempting to add a second card resulted in a blocking error message.

**After:** Multiple MSD cards can coexist independently on the same dashboard, each with its own:
- Pipeline instance
- SystemsManager
- Renderer instances
- Independent state and configuration

### 2. Global Singleton Services

The following services remain **global singletons** shared across all instances:
- `ThemeManager` - Unified theming across all cards
- `DataSourceManager` - Shared data intelligence
- `RulesEngine` - Conditional styling rules
- `AnimationManager` - Animation coordination
- `HUDManager` - Global HUD overlay

### 3. Debugging & Diagnostics

**New Multi-Instance API:**

```javascript
// List all active MSD instances
window.lcards.debug.msd.listInstances();

// Get specific instance by GUID
const instance = window.lcards.debug.msd.getInstance('msd_1234567890_abc123');

// Access instance data
instance.cardInstance     // Card element reference
instance.pipelineInstance // Pipeline API
instance.registeredAt     // Registration timestamp
```

**Backward Compatibility:**

Legacy single-instance references still work (refer to most recently active instance):

```javascript
window.lcards.debug.msd.cardInstance
window.lcards.debug.msd.pipelineInstance
window.lcards.debug.msd.dataSourceManager
```

### 4. File Changes

#### Renamed
- `src/msd/hud/hudService.js` → `src/msd/hud/MsdHudUtilities.js`

#### Refactored
- `src/msd/pipeline/MsdInstanceManager.js` - Removed ~400 lines of blocking logic
- `src/cards/lcards-msd.js` - Updated to support multi-instance initialization
- `src/msd/index.js` - Added instance map and registration methods

## Migration Notes

### For Users

**No breaking changes!** Existing single-MSD dashboards will continue to work exactly as before.

**New capability:** You can now add multiple MSD cards to the same dashboard:

```yaml
views:
  - title: Operations
    cards:
      - type: custom:lcards-msd-card
        msd:
          base_svg:
            source: builtin:ncc-1701-a-blue
          overlays:
            # ... your overlays
      
      - type: custom:lcards-msd-card
        msd:
          base_svg:
            source: builtin:ncc-1701-d
          overlays:
            # ... different overlays
```

### For Developers

#### Instance Registration

Cards automatically register/unregister with the instance map:

```javascript
// Registration happens automatically in _initializeMsdPipeline()
window.lcards.debug.msd.registerInstance(guid, cardInstance, pipelineInstance);

// Cleanup happens automatically in _cleanupMsdPipeline()
window.lcards.debug.msd.unregisterInstance(guid);
```

#### Accessing Per-Card State

Use the instance map to access specific card data:

```javascript
// List all instances
const instances = window.lcards.debug.msd.instances;

// Iterate over instances
for (const [guid, instanceData] of instances) {
  console.log(`Card ${guid}:`, instanceData);
}

// Get specific instance
const myInstance = window.lcards.debug.msd.getInstance(cardGuid);
if (myInstance) {
  // Access card-specific pipeline
  const pipeline = myInstance.pipelineInstance;
}
```

#### Debug Console Helpers

```javascript
// Quick status check
window.__msdStatus();

// List all instances with details
window.lcards.debug.msd.listInstances();
```

## Technical Details

### Architecture Changes

1. **MsdInstanceManager Simplified**
   - Removed GUID-based blocking logic
   - Removed static tracking of "current instance"
   - Kept preview detection utilities
   - `requestInstance()` now directly calls `initMsdPipeline()`

2. **Instance Map Structure**
   ```javascript
   Map<string, {
     guid: string,
     cardInstance: LCARdSMSDCard,
     pipelineInstance: Object,
     registeredAt: string
   }>
   ```

3. **Cleanup Flow**
   - Each card manages its own lifecycle
   - Automatic unregistration on `disconnectedCallback()`
   - No global state pollution

### Performance Considerations

- **Memory:** Each MSD instance has its own pipeline (~1-2MB per card)
- **Rendering:** Independent render cycles per card
- **Shared Services:** Singleton services are shared, reducing overhead
- **Recommended:** Limit to 2-3 MSD cards per dashboard for optimal performance

## Testing

### Verified Scenarios

✅ Single MSD card (backward compatibility)
✅ Two MSD cards with different SVGs
✅ Three MSD cards with shared data sources
✅ Card hot-reload in edit mode
✅ Preview mode in card editor
✅ Instance cleanup on card removal

### Known Limitations

- HUD overlay is global (shared across all instances)
- Alert mode affects all instances simultaneously
- Theme changes apply to all instances

## Troubleshooting

### Cards Not Initializing

Check browser console for errors:
```javascript
window.lcards.debug.msd.listInstances();
```

If no instances are registered, check:
- MSD configuration is valid
- `initMsdPipeline()` is completing successfully
- No JavaScript errors during initialization

### Multiple Cards Conflicting

Each card should have a unique GUID. Verify:
```javascript
const instances = window.lcards.debug.msd.listInstances();
console.log(instances.map(i => i.guid));
```

All GUIDs should be unique (format: `msd_[timestamp]_[random]`).

---

## Final Cleanup (v1.17.0)

The multi-instance registry has been **removed entirely** in favor of standard DOM queries.

### What Was Removed
- `MsdInstanceManager.js` (~200 lines)
- `window.lcards.cards.msd.registerInstance()`
- `window.lcards.cards.msd.getInstance()`
- `window.lcards.cards.msd.listInstances()`
- `window.lcards.debug.msd.getThemeProvenance()` (and 6 other helpers)

### Replacement Pattern

```javascript
// Get MSD cards
const cards = document.querySelectorAll('lcards-msd');
const card = document.querySelector('lcards-msd[id="engineering"]');

// Access systems
const routing = card._msdPipeline?.coordinator?.router;
const renderer = card._msdPipeline?.coordinator?.renderer;

// Get provenance
const prov = card.getProvenance();
card.debugProvenance();
```

**End of Migration** - MSD is now a standard LCARdS card! 🎉

---

## Support

For issues or questions:
1. Check browser console for errors
2. Use `window.__msdStatus()` for diagnostics
3. Query DOM with `document.querySelectorAll('lcards-msd')`
4. Open an issue on GitHub with console output

---

*Last Updated: January 2026 | LCARdS v1.17.0+*
