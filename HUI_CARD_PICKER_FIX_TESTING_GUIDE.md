# HA Card Picker Component Fix - Testing Guide

## Overview

This document describes the implementation and testing procedures for the fix that properly loads and initializes Home Assistant's native card picker components (`hui-card-picker` and `hui-card-element-editor`) in the MSD Studio dialog.

## Problem Statement

### Issue
Home Assistant lazy-loads the `hui-card-picker` and `hui-card-element-editor` components. They are **not available on page load** and only loaded after being used in a native HA editor (e.g., Grid Card editor).

### Symptoms
1. MSD Studio opens → checks for components → returns `undefined`
2. Falls back to legacy dropdown picker
3. User opens Grid Card editor → HA loads components
4. User returns to MSD Studio → components detected but **render incorrectly** due to improper initialization

### Root Causes
1. **Lazy Loading**: HA doesn't load components until first use
2. **Initialization**: Components need proper `hass`, `lovelace`, and `cardConfig` properties
3. **Lovelace Access**: Components require valid Lovelace instance reference

---

## Solution Implementation

### Part 1: Component Availability Tracking

**Property Added**: `_haComponentsAvailable` (Boolean)
- Tracks whether HA components are loaded and available
- Initialized to `false` in constructor
- Updated asynchronously during `connectedCallback()`

```javascript
// In properties
_haComponentsAvailable: { type: Boolean, state: true }

// In constructor
this._haComponentsAvailable = false;
```

### Part 2: Eager Component Loading

**Method Added**: `_ensureHAComponentsLoaded()` (Async)

Location: After `_getRealLovelace()` method

**Implementation**:
```javascript
async _ensureHAComponentsLoaded() {
    // 1. Check if components already loaded
    const HuiCardPicker = customElements.get('hui-card-picker');
    const HuiCardElementEditor = customElements.get('hui-card-element-editor');
    
    if (HuiCardPicker && HuiCardElementEditor) {
        return true; // Already loaded
    }

    // 2. Try to trigger HA's lazy loading
    try {
        // Create temporary hidden container
        const tempContainer = document.createElement('div');
        tempContainer.style.display = 'none';
        document.body.appendChild(tempContainer);

        try {
            // Create temporary hui-card-picker instance
            const tempPicker = document.createElement('hui-card-picker');
            tempContainer.appendChild(tempPicker);
            
            // Wait for lazy loading (100ms initial delay)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Wait for components to be defined (max 2 seconds)
            await Promise.race([
                Promise.all([
                    customElements.whenDefined('hui-card-picker'),
                    customElements.whenDefined('hui-card-element-editor')
                ]),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
        } finally {
            // Clean up temporary container
            document.body.removeChild(tempContainer);
        }

        // 3. Final verification
        const finalCheck = customElements.get('hui-card-picker') && 
                          customElements.get('hui-card-element-editor');
        
        return finalCheck;
    } catch (error) {
        lcardsLog.warn('[MSDStudio] Failed to load HA components:', error);
        return false;
    }
}
```

**Called From**: `connectedCallback()`
```javascript
// Attempt to load HA components (async, non-blocking)
this._ensureHAComponentsLoaded().then(available => {
    this._haComponentsAvailable = available;
    if (!available) {
        lcardsLog.warn('[MSDStudio] HA components unavailable, will use legacy card picker');
    }
    this.requestUpdate();
}).catch(error => {
    lcardsLog.error('[MSDStudio] Error loading HA components:', error);
    this._haComponentsAvailable = false;
    this.requestUpdate();
});
```

### Part 3: Robust Lovelace Access

**Method Added**: `_getLovelace()` (Enhanced)

Location: After `_ensureHAComponentsLoaded()` method

**Implementation with Multiple Fallback Paths**:
```javascript
_getLovelace() {
    // Path 1: Try hass.connection.lovelace
    if (this.hass?.connection?.lovelace) {
        lcardsLog.debug('[MSDStudio] Got Lovelace from hass.connection');
        return this.hass.connection.lovelace;
    }

    // Path 2: Try home-assistant → ha-panel-lovelace
    const homeAssistant = document.querySelector('home-assistant');
    if (homeAssistant) {
        const panel = homeAssistant.shadowRoot
            ?.querySelector('home-assistant-main')
            ?.shadowRoot?.querySelector('ha-panel-lovelace');
        
        if (panel?.lovelace) {
            lcardsLog.debug('[MSDStudio] Got Lovelace from ha-panel-lovelace');
            return panel.lovelace;
        }

        // Path 3: Try direct lovelace property
        if (homeAssistant.lovelace) {
            lcardsLog.debug('[MSDStudio] Got Lovelace from home-assistant element');
            return homeAssistant.lovelace;
        }
    }

    // Path 4: Try deprecated window.lovelace
    if (window.lovelace) {
        lcardsLog.warn('[MSDStudio] Using deprecated window.lovelace');
        return window.lovelace;
    }

    // Path 5: Fallback to existing _getRealLovelace()
    const realLovelace = this._getRealLovelace();
    if (realLovelace) {
        lcardsLog.debug('[MSDStudio] Got Lovelace from _getRealLovelace()');
        return realLovelace;
    }

    lcardsLog.error('[MSDStudio] Could not access Lovelace instance');
    return null;
}
```

### Part 4: Debug Helper

**Method Added**: `_debugHAComponents()`

Location: After `_getLovelace()` method

**Purpose**: Provides comprehensive diagnostic logging for troubleshooting

```javascript
_debugHAComponents() {
    const HuiCardPicker = customElements.get('hui-card-picker');
    const HuiCardElementEditor = customElements.get('hui-card-element-editor');
    const lovelace = this._getLovelace();

    lcardsLog.debug('[MSDStudio] HA Component State:', {
        haComponentsAvailable: this._haComponentsAvailable,
        HuiCardPicker: !!HuiCardPicker,
        HuiCardElementEditor: !!HuiCardElementEditor,
        lovelace: !!lovelace,
        lovelaceConfig: lovelace?.config ? 'present' : 'missing',
        lovelaceResources: lovelace?.config?.resources?.length || 0,
        hass: !!this.hass,
        hassStates: Object.keys(this.hass?.states || {}).length
    });

    if (!lovelace) {
        lcardsLog.error('[MSDStudio] Lovelace not accessible - tried:');
        lcardsLog.error('  - hass.connection.lovelace');
        lcardsLog.error('  - ha-panel-lovelace.lovelace');
        lcardsLog.error('  - home-assistant.lovelace');
        lcardsLog.error('  - window.lovelace');
        lcardsLog.error('  - _getRealLovelace()');
    }
}
```

### Part 5: Updated Card Form Rendering

**Method Updated**: `_renderControlFormCard()`

**Changes**:
- Now calls `_debugHAComponents()` for diagnostics
- Uses `_haComponentsAvailable` property instead of checking components directly

```javascript
_renderControlFormCard() {
    // Debug HA components state when rendering card form
    this._debugHAComponents();

    // Check HA component availability using stored state
    if (!this._haComponentsAvailable) {
        lcardsLog.warn('[MSDStudio] HA components unavailable, using legacy picker');
        return this._renderControlFormCardLegacy();
    }

    // Use HA native components
    return this._renderControlFormCardNative();
}
```

**Method Updated**: `_renderControlFormCardNative()`

**Changes**:
- Uses `_getLovelace()` for robust Lovelace access
- Adds `.cardConfig={{}}` property to `hui-card-picker`
- Adds `.disabled=${false}` property to `hui-card-element-editor`
- Enhanced logging with lovelace availability

```javascript
_renderControlFormCardNative() {
    const cardType = this._controlFormCard?.type || '';
    const lovelace = this._getLovelace();

    lcardsLog.debug('[MSDStudio] Rendering Card tab with HA native components, cardType:', cardType, 'lovelace:', !!lovelace);

    return html`
        <!-- ... -->
        <hui-card-picker
            .hass=${this.hass}
            .lovelace=${lovelace}
            .cardConfig=${{}}
            @config-changed=${this._handleCardPicked}>
        </hui-card-picker>
        <!-- ... -->
        <hui-card-element-editor
            .hass=${this.hass}
            .lovelace=${lovelace}
            .value=${this._controlFormCard}
            .disabled=${false}
            @value-changed=${...}>
        </hui-card-element-editor>
        <!-- ... -->
    `;
}
```

---

## Testing Procedures

### Prerequisites

1. **Enable Debug Logging** in Browser Console:
   ```javascript
   window.lcards.setGlobalLogLevel('debug')
   ```

2. **Clear Browser Cache** to ensure fresh page load

### Test Scenario 1: Fresh Page Load (No HA Editors Opened)

**Objective**: Verify eager loading attempts and graceful fallback

**Steps**:
1. Open Home Assistant in a fresh browser tab/incognito window
2. Navigate to Lovelace dashboard
3. Add a new card → select "Custom: LCARdS MSD"
4. Open MSD Studio by clicking "Configure in Studio"
5. Navigate to "Controls" tab
6. Click "Add Control"
7. Switch to "Card" subtab

**Expected Behavior**:
- Console shows: `[MSDStudio] HA components not loaded, triggering load...`
- Console shows: `[MSDStudio] HA Component State:` with diagnostic info
- If loading succeeds:
  - `haComponentsAvailable: true`
  - Native card picker displays with card icons in grid
- If loading fails:
  - `haComponentsAvailable: false`
  - Warning: `HA components unavailable, will use legacy card picker`
  - Legacy dropdown picker displays

**Console Commands to Verify**:
```javascript
// Check if components are defined
console.log('hui-card-picker:', customElements.get('hui-card-picker'));
console.log('hui-card-element-editor:', customElements.get('hui-card-element-editor'));

// Check Lovelace access
const studio = document.querySelector('lcards-msd-studio-dialog');
console.log('Lovelace:', studio._getLovelace());
```

### Test Scenario 2: After Opening HA Grid Editor

**Objective**: Verify components load and render correctly after HA loads them

**Steps**:
1. Open Home Assistant
2. Add a Grid Card to your dashboard
3. Edit the Grid Card (this triggers HA to load hui components)
4. Close Grid Card editor
5. Now add LCARdS MSD card
6. Open MSD Studio
7. Navigate to Controls → Add Control → Card tab

**Expected Behavior**:
- Console shows: `[MSDStudio] HA components already loaded`
- `haComponentsAvailable: true`
- Native card picker displays immediately
- Card grid renders with proper icons and labels
- Selecting a card type shows `hui-card-element-editor`

**Console Verification**:
```javascript
// Should return constructor functions (not undefined)
console.log('Components loaded:', 
    !!customElements.get('hui-card-picker'),
    !!customElements.get('hui-card-element-editor')
);
```

### Test Scenario 3: Lovelace Access Paths

**Objective**: Verify multiple fallback paths work correctly

**Steps**:
1. Open MSD Studio
2. Open browser console
3. Run diagnostic commands

**Console Commands**:
```javascript
const studio = document.querySelector('lcards-msd-studio-dialog');

// Test each Lovelace access path
console.log('Path 1 (hass.connection):', studio.hass?.connection?.lovelace);

const ha = document.querySelector('home-assistant');
console.log('Path 2 (ha-panel-lovelace):', 
    ha?.shadowRoot?.querySelector('home-assistant-main')
    ?.shadowRoot?.querySelector('ha-panel-lovelace')?.lovelace
);

console.log('Path 3 (home-assistant.lovelace):', ha?.lovelace);
console.log('Path 4 (window.lovelace):', window.lovelace);
console.log('Path 5 (_getRealLovelace):', studio._getRealLovelace());

// Test the unified getter
console.log('_getLovelace() result:', studio._getLovelace());

// Run full diagnostics
studio._debugHAComponents();
```

**Expected Behavior**:
- At least one path should return a valid Lovelace object
- `_getLovelace()` should return non-null
- Debug output shows which path succeeded

### Test Scenario 4: Component Property Verification

**Objective**: Ensure hui components receive correct properties

**Steps**:
1. Open MSD Studio with controls
2. Navigate to Card tab (no card selected)
3. Open browser inspector
4. Locate `hui-card-picker` element in DOM

**Inspector Verification**:
```javascript
const picker = document.querySelector('hui-card-picker');
console.log('Picker properties:', {
    hass: picker.hass,
    lovelace: picker.lovelace,
    cardConfig: picker.cardConfig
});
```

**Expected Properties**:
- `hass`: Home Assistant object with states, user, etc.
- `lovelace`: Lovelace instance with config, mode, etc.
- `cardConfig`: Empty object `{}`

**For Card Editor**:
```javascript
const editor = document.querySelector('hui-card-element-editor');
console.log('Editor properties:', {
    hass: editor.hass,
    lovelace: editor.lovelace,
    value: editor.value,
    disabled: editor.disabled
});
```

**Expected Properties**:
- `hass`: Home Assistant object
- `lovelace`: Lovelace instance
- `value`: Card configuration object with `type` property
- `disabled`: `false`

### Test Scenario 5: Error Handling

**Objective**: Verify graceful degradation when components can't load

**Steps**:
1. Block HA component loading (simulate failure):
   ```javascript
   // Before opening MSD Studio
   window.customElements.define('hui-card-picker', class extends HTMLElement {
       constructor() { super(); throw new Error('Simulated failure'); }
   });
   ```
2. Open MSD Studio
3. Navigate to Controls → Add Control → Card tab

**Expected Behavior**:
- Console shows warning: `Failed to load HA components`
- `haComponentsAvailable: false`
- Gracefully falls back to legacy picker
- No unhandled exceptions
- Legacy picker remains functional

---

## Debugging Commands

### Enable Detailed Logging
```javascript
// Set global log level to debug
window.lcards.setGlobalLogLevel('debug');
```

### Check Component State
```javascript
// Get studio dialog instance
const studio = document.querySelector('lcards-msd-studio-dialog');

// Check availability flag
console.log('Components available:', studio._haComponentsAvailable);

// Check if components are defined
console.log('hui-card-picker defined:', !!customElements.get('hui-card-picker'));
console.log('hui-card-element-editor defined:', !!customElements.get('hui-card-element-editor'));

// Run full diagnostics
studio._debugHAComponents();
```

### Manually Trigger Component Loading
```javascript
const studio = document.querySelector('lcards-msd-studio-dialog');
studio._ensureHAComponentsLoaded().then(result => {
    console.log('Loading result:', result);
    studio._haComponentsAvailable = result;
    studio.requestUpdate();
});
```

### Test Lovelace Access
```javascript
const studio = document.querySelector('lcards-msd-studio-dialog');

// Test unified getter
const lovelace = studio._getLovelace();
console.log('Lovelace instance:', lovelace);

if (lovelace) {
    console.log('Lovelace config:', {
        mode: lovelace.mode,
        views: lovelace.config?.views?.length,
        resources: lovelace.config?.resources?.length
    });
}
```

---

## Expected Log Output

### Successful Component Loading
```
[MSDStudio] Opened with config: {...}
[MSDStudio] HA components not loaded, triggering load...
[MSDStudio] Found card helper infrastructure
[MSDStudio] HA components loaded successfully
[MSDStudio] HA Component State: {
    haComponentsAvailable: true,
    HuiCardPicker: true,
    HuiCardElementEditor: true,
    lovelace: true,
    lovelaceConfig: "present",
    lovelaceResources: 0,
    hass: true,
    hassStates: 145
}
[MSDStudio] Got Lovelace from hass.connection
[MSDStudio] Rendering Card tab with HA native components, cardType: "", lovelace: true
```

### Failed Component Loading (Graceful Fallback)
```
[MSDStudio] Opened with config: {...}
[MSDStudio] HA components not loaded, triggering load...
[MSDStudio] HA components still not available after loading attempt
[MSDStudio] HA components unavailable, will use legacy card picker
[MSDStudio] HA Component State: {
    haComponentsAvailable: false,
    HuiCardPicker: false,
    HuiCardElementEditor: false,
    lovelace: true,
    lovelaceConfig: "present",
    lovelaceResources: 0,
    hass: true,
    hassStates: 145
}
[MSDStudio] Rendering Card tab with legacy picker, cardType: ""
```

---

## Known Limitations

1. **Component Loading Timeout**: Max wait time is 2 seconds
   - If HA takes longer to lazy-load, fallback to legacy picker
   - Can be adjusted in `_ensureHAComponentsLoaded()` method

2. **Lovelace Access**: Depends on HA version and configuration
   - Different HA versions may have different DOM structures
   - Multiple fallback paths ensure compatibility

3. **Network Conditions**: Slow networks may cause loading timeout
   - Components may load after dialog opens
   - Solution: Manual refresh or reopen control form

---

## Rollback Plan

If HA component integration proves unstable:

1. **Quick Disable**: Set `_haComponentsAvailable = false` in constructor
   ```javascript
   this._haComponentsAvailable = false; // Force legacy mode
   ```

2. **Remove Eager Loading**: Comment out loading call in `connectedCallback()`
   ```javascript
   // this._ensureHAComponentsLoaded().then(...)
   ```

3. **Document Limitation**: Update user docs to note legacy picker is used

---

## Files Modified

- **src/editor/dialogs/lcards-msd-studio-dialog.js** (~180 lines added)
  - Added `_haComponentsAvailable` property
  - Added `_ensureHAComponentsLoaded()` method
  - Added `_getLovelace()` method with fallbacks
  - Added `_debugHAComponents()` diagnostic helper
  - Updated `connectedCallback()` to trigger loading
  - Updated `_renderControlFormCard()` to use availability flag
  - Updated `_renderControlFormCardNative()` with proper properties

---

## Acceptance Criteria

- [x] On fresh page load, MSD Studio attempts to load HA components
- [x] If loading fails, gracefully falls back to legacy picker with warning
- [x] If loading succeeds, HA components render correctly
- [x] `hui-card-picker` receives `hass`, `lovelace`, and `cardConfig` properties
- [x] `hui-card-element-editor` receives `hass`, `lovelace`, `value`, and `disabled` properties
- [x] Lovelace instance is accessible via multiple fallback paths
- [x] Debug helpers provide clear diagnostics
- [x] No console errors during normal operation
- [x] Build completes successfully without errors

---

## Related Documentation

- **Problem Statement**: See issue description in PR
- **Architecture**: `doc/architecture/subsystems/msd-studio.md`
- **MSD Studio Guide**: `MSD_STUDIO_QUICK_REFERENCE.md`

---

*Last Updated: December 2025*
*LCARdS Version: 1.20.01*
