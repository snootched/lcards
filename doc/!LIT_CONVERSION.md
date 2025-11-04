# 🚀 CB-LCARS Native Architecture Migration - Comprehensive Implementation Proposal

**Version**: 1.0  
**Date**: 2025-01-04  
**Author**: CB-LCARS Development Team  
**Status**: Ready for Implementation

---

## 📋 Executive Summary

### Objective

Remove the `custom-button-card` dependency from CB-LCARS and migrate to a native LitElement-based architecture, leveraging the community-maintained `custom-card-helpers` library for action handling while preserving all existing functionality and template patterns.

### Impact

- 📦 **95KB bundle size reduction** (120KB → 25KB)
- 🚀 **Faster load times** (~20% improvement)
- 🛠️ **Full architectural control** with no external framework constraints
- ✅ **Battle-tested action system** via `custom-card-helpers`
- 🎯 **Clean component-based architecture** aligned with MSD evolution
- 🔮 **Foundation for future enhancements** (multi-instance, component library)

### Scope

**Phase 1 (This Migration)**:
- ✅ Create native `CBLCARSNativeCard` base class
- ✅ Migrate MSD card to native base
- ✅ Replace button-card action bridge with `custom-card-helpers`
- ✅ Preserve all MSD template initialization patterns
- ✅ Maintain backward compatibility for legacy cards
- ⚠️ **Single-instance MSD only** (no change from current behavior)

**Out of Scope for Phase 1**:
- ❌ Multi-instance MSD support (Phase 2+)
- ❌ Migrating legacy v1 standalone cards (button, elbow, label, etc.)
- ❌ Component library for v2 cards (Future)

---

## 🎯 Problem Statement

### Current Architecture Limitations

CB-LCARS currently extends `custom-button-card` as its base class, but this relationship has become problematic:

1. **Unused Features**: MSD disables ~95% of button-card functionality
2. **Bundle Bloat**: 120KB+ dependency for minimal benefit
3. **Indirect Action Handling**: "Bridge pattern" to inject actions into button-card config
4. **External Dependency**: Breaking changes in button-card affect CB-LCARS
5. **Architectural Mismatch**: Button-card designed for simple buttons, not complex MSD systems

### What We're Actually Using from Button-Card

After analyzing the codebase (`src/cb-lcars.js`, `src/msd/renderer/ActionHelpers.js`):

✅ **Currently Used**:
- LitElement lifecycle (available natively in Lit)
- Home Assistant card interface (easily implemented)
- `_handleAction()` method for executing actions

❌ **Disabled/Unused**:
- Button-card templates (we use our own system)
- Button-card state management (we use DataSourceManager)
- Button-card styling (we use ThemeManager)
- Button-card entity tracking (we use our own)
- Button-card animations (we use anime.js v4)

### The Bridge Pattern Problem

Current action execution uses a workaround:

```javascript
// src/msd/renderer/ActionHelpers.js (lines 437-481)
static executeActionViaButtonCardBridge(action, cardInstance, actionType = 'tap') {
    // Store original config
    const originalConfig = cardInstance._config;
    
    // Create temporary config with action
    const tempConfig = { ...originalConfig, [`${actionType}_action`]: action };
    cardInstance._config = tempConfig;
    
    try {
        // Call button-card's action handler
        cardInstance._handleAction(mockEvent);
        return true;
    } finally {
        // Restore original config
        cardInstance._config = originalConfig;
    }
}
```

This is fragile, indirect, and unnecessary with `custom-card-helpers`.

---

## 🏗️ Proposed Architecture

### Native Base Class Hierarchy

```
LitElement (from lit)
    ↓
CBLCARSNativeCard (new - native base)
    ↓
    ├── CBLCARSMSDCard (migrated to native)
    │
    └── [Future] CBLCARSButtonCardV2, CBLCARSTextCardV2, etc.

ButtonCard (custom-button-card - preserved for legacy)
    ↓
CBLCARSBaseCard (legacy wrapper - deprecated but maintained)
    ↓
    ├── CBLCARSButtonCard (v1 - legacy)
    ├── CBLCARSElbowCard (v1 - legacy)
    └── CBLCARSLabelCard (v1 - legacy)
```

### Action Handling Architecture

```
User Interaction (tap/hold/double-tap)
    ↓
CBLCARSActionHandler (native wrapper)
    ↓
custom-card-helpers.handleAction()
    ↓
Home Assistant Action System
    ↓
Execute (toggle, call-service, navigate, etc.)
```

### File Structure After Migration

```
src/
├── base/
│   ├── CBLCARSNativeCard.js          # ✅ NEW: Native LitElement base
│   ├── CBLCARSActionHandler.js       # ✅ NEW: custom-card-helpers wrapper
│   ├── CBLCARSBaseCard.js            # ⚠️ DEPRECATED: Button-card wrapper (keep for legacy)
│   └── index.js                       # Barrel export
│
├── cards/
│   ├── cb-lcars-msd.js               # ✅ NEW: MSD card (native base)
│   └── legacy/                        # ⚠️ Move old cards here later
│       ├── cb-lcars-button.js         # (still uses button-card base)
│       ├── cb-lcars-elbow.js
│       └── ...
│
├── msd/
│   ├── core/
│   │   └── MsdPipeline.js            # ✅ MODIFIED: Accept action handler
│   ├── overlays/
│   │   ├── ButtonOverlay.js          # ✅ MODIFIED: Use new action handler
│   │   ├── StatusGridOverlay.js      # ✅ MODIFIED: Use new action handler
│   │   └── ...
│   └── renderer/
│       └── ActionHelpers.js          # ✅ MODIFIED: Replace bridge with direct calls
│
├── utils/
│   └── cb-lcars-logging.js           # (unchanged)
│
├── cb-lcars.js                        # ✅ MODIFIED: Import new MSD, remove button-card check
└── webpack.config.js                  # ✅ MODIFIED: Add lit externals
```

---

## 🔍 Critical MSD Template Patterns to Preserve

The current MSD template (`src/cb-lcars/cb-lcars-msd.yaml`) contains sophisticated initialization logic that **must be preserved**:

### 1. Preview Mode Detection & Handling

**Why Critical**: Prevents full MSD initialization in HA's card picker/editor.

```javascript
// From cb-lcars-msd.yaml (lines 112-118)
const isPreview = window.cblcars.debug.msd.MsdInstanceManager.detectPreviewMode(mount);

if (isPreview) {
    console.log('[MSD DEBUG] 🔍 Preview mode detected - showing preview content');
    const previewResult = window.cblcars.debug.msd.MsdInstanceManager._createPreviewContent(msdConfig || {}, mount);
    return previewResult.html;
}
```

**Benefits**:
- ❌ Avoids heavy resource usage during configuration
- ❌ Prevents SVG loading in preview mode
- ❌ Blocks entity subscriptions in editor
- ❌ Skips animation system initialization

### 2. Instance GUID Management

**Why Critical**: Prevents multiple MSD instances from interfering.

```javascript
// From cb-lcars-msd.yaml (lines 92-99)
if (!this._msdInstanceGuid) {
    this._msdInstanceGuid = window.cblcars.debug.msd.MsdInstanceManager._generateGuid();
    console.log('[MSD DEBUG] 🔑 Generated instance GUID:', {
        guid: this._msdInstanceGuid,
        cardId: this.id,
        timestamp: new Date().toISOString()
    });
}
```

**Benefits**:
- ✅ Instance tracking for debugging
- ✅ Resource cleanup on card reload
- ✅ Prevents duplicate entity subscriptions

### 3. Progressive Mount Resolution with Retry Logic

**Why Critical**: ShadowRoot may not be ready immediately.

```javascript
// From cb-lcars-msd.yaml (lines 341-360)
const resolveMount = (attempt = 0) => {
    const baseWrapper = this.shadowRoot?.getElementById('msd-v1-comprehensive-wrapper');
    const mount = baseWrapper || this.shadowRoot || this;
    
    if (!mount && attempt < 5) {
        console.warn('[MSD DEBUG] ⚠️ mount not ready, retrying...', attempt);
        setTimeout(() => resolveMount(attempt + 1), 30 * (attempt + 1));
        return;
    }
    // ... initialize pipeline
};
```

**Benefits**:
- ✅ Handles async rendering
- ✅ Progressive backoff (30ms, 60ms, 90ms, etc.)
- ✅ Graceful failure after 5 attempts

### 4. SVG Source: "none" Support

**Why Critical**: Allows MSD to work without base SVG.

```javascript
// From cb-lcars-msd.yaml (lines 128-163)
if (source === 'none') {
    console.log('[MSD DEBUG] 🚫 base_svg.source is "none" - using overlay-only mode');
    
    if (!msdConfig.view_box || !Array.isArray(msdConfig.view_box)) {
        return `<div>❌ view_box Required</div>`;
    }
    
    svgContent = ''; // Skip SVG loading
}
```

**Benefits**:
- ✅ Overlay-only mode
- ✅ Custom background images
- ✅ Explicit viewBox control

### 5. Rich Error Messages with Debugging Context

**Why Critical**: Developer experience and debugging.

```javascript
// From cb-lcars-msd.yaml (lines 221-253)
if (!svgContent && source !== 'none') {
    const isBuiltin = source.startsWith('builtin:');
    // ... detailed error analysis
    
    return `
        <div style="color: #ff6666; padding: 20px; border: 2px solid #ff6666;">
            <div>❌ SVG Loading Failed</div>
            <div>${errorMessage}</div>
            <div>💡 ${suggestion}</div>
        </div>
    `;
}
```

**Benefits**:
- ✅ Clear error messages
- ✅ Actionable suggestions
- ✅ Available SVG list
- ✅ URL/builtin detection

### 6. MsdInstanceManager Integration

**Why Critical**: Centralized instance management.

```javascript
// From cb-lcars-msd.yaml (lines 379-402)
window.cblcars.debug.msd.MsdInstanceManager.requestInstance(
    enhancedConfig, 
    mount, 
    realHass, 
    isPreview
).then(pipelineResult => {
    if (pipelineResult.preview) { /* ... */ }
    if (pipelineResult.blocked) { /* ... */ }
    if (!pipelineResult.enabled) { /* ... */ }
    
    // Normal initialization
    this._msdPipeline = pipeline;
});
```

**Benefits**:
- ✅ Prevents duplicate instances
- ✅ Handles preview/blocked states
- ✅ Validation error display
- ✅ Resource tracking

### 7. SVG Content Wrapping for Filter Isolation

**Why Critical**: SVG filter isolation.

```javascript
// From cb-lcars-msd.yaml (lines 286-304)
if (svgContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgContent;
    const svgEl = tempDiv.querySelector('svg');
    
    const wrapperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapperGroup.setAttribute('id', '__msd-base-content');
    
    children.forEach(child => wrapperGroup.appendChild(child));
    svgEl.appendChild(wrapperGroup);
    svgContent = tempDiv.innerHTML;
}
```

**Benefits**:
- ✅ Prevents filters from affecting overlays
- ✅ Clean layer separation
- ✅ Performance optimization

### 8. Layered Rendering Architecture

**Why Critical**: Proper z-index layering.

```javascript
// From cb-lcars-msd.yaml (lines 647-682)
return `
    <div id="msd-v1-comprehensive-wrapper" style="
        width: 100%; height: 100%;
        position: relative;
        aspect-ratio: ${aspect};
        pointer-events: none;
    ">
        <!-- SVG Base Layer (z-index: 0) -->
        <div style="z-index: 0; pointer-events: auto;">
            ${svgContent}
        </div>
    </div>
`;
```

**Benefits**:
- ✅ Base SVG at z-index: 0
- ✅ Overlays render on top
- ✅ Controls layer above everything
- ✅ Pointer events properly scoped

---

## 📦 Implementation Details

### 1. Native Base Card (`CBLCARSNativeCard.js`)

**Location**: `src/base/CBLCARSNativeCard.js`

**Key Features**:
- Extends `LitElement` directly
- Implements Home Assistant card interface
- Provides lifecycle hooks for subclass customization
- Integrates with CB-LCARS infrastructure (logging, fonts, animations)
- Includes all template patterns (GUID, preview mode, mount resolution, error display)

**Core Methods**:

```javascript
export class CBLCARSNativeCard extends LitElement {
    // Home Assistant Card Interface
    setConfig(config)
    set hass(hass)
    getCardSize()
    getLayoutOptions()
    
    // LitElement Lifecycle
    connectedCallback()
    disconnectedCallback()
    firstUpdated()
    updated(changedProperties)
    
    // Protected Hooks for Subclasses
    _initialize()
    _cleanup()
    _onConfigChanged()
    _handleHassUpdate(oldHass)
    _onFirstUpdate()
    
    // Template Pattern Methods
    _generateInstanceGuid()
    _isPreviewMode()
    _resolveMount(callback, attempt, maxAttempts)
    _createErrorDisplay(title, message, suggestion)
    
    // Rendering
    render()
    _renderCard()
    
    // Utilities
    _log(level, message, data)
}
```

**Integration Points**:
- ✅ `window.cblcars` global namespace
- ✅ `cblcarsLog` logging system
- ✅ `window.cblcars.loadFont()` font loading
- ✅ `window.cblcars.anim` animation system (anime.js v4 scopes)

### 2. Action Handler (`CBLCARSActionHandler.js`)

**Location**: `src/base/CBLCARSActionHandler.js`

**Purpose**: Wrapper around `custom-card-helpers` for CB-LCARS conventions.

**Key Features**:
- Uses `custom-card-helpers.handleAction()` for all action types
- Supports animation triggers (integrates with `AnimationManager`)
- Template evaluation support
- Entity formatting utilities
- Navigation helpers

**Core Methods**:

```javascript
export class CBLCARSActionHandler {
    constructor(card)
    
    // Action Execution
    async handleAction(action, event, options)
    
    // Utilities (from custom-card-helpers)
    formatEntity(entityId)
    computeStateDisplay(entityId)
    navigate(path)
    
    // Internal
    _getAnimationTrigger(action)
    _log(level, message, data)
}
```

**Supported Actions** (via `custom-card-helpers`):
- ✅ `toggle` - Toggle entity
- ✅ `call-service` - Call any service
- ✅ `perform-action` - Modern action format
- ✅ `navigate` - Navigate to path
- ✅ `url` - Open URL
- ✅ `more-info` - Show entity dialog
- ✅ `assist` - Open Assist dialog
- ✅ `fire-dom-event` - Fire custom DOM event
- ✅ Confirmation dialogs (native HA dialogs)
- ✅ Template evaluation
- ✅ Repeat actions

### 3. MSD Card (`cb-lcars-msd.js`)

**Location**: `src/cards/cb-lcars-msd.js`

**Purpose**: MSD card implementation using native base with all template patterns preserved.

**Key Features**:
- Extends `CBLCARSNativeCard`
- Preserves **exact** `custom_field` initialization logic
- Preview mode detection and handling
- SVG source: "none" support
- Rich error handling with developer-friendly messages
- MsdInstanceManager integration
- SVG filter isolation
- Layered rendering architecture
- Progressive mount resolution
- Instance GUID management

**Core Structure**:

```javascript
class CBLCARSMSDCard extends CBLCARSNativeCard {
    static get properties() { /* ... */ }
    static get cardType() { return 'cb-lcars-msd-card'; }
    
    constructor()
    setConfig(config)
    
    // Initialization
    async _onFirstUpdate()
    async _initializePreview()
    async _initializeMSD()
    async _processSVGAndInitialize(mount)
    async _initializePipeline(mount, msdConfig)
    
    // SVG Processing
    _wrapSVGForFilterIsolation(svgContent)
    _processAnchors(msdConfig)
    _handleSVGLoadError(source, error)
    
    // Lifecycle
    _handleHassUpdate(oldHass)
    _cleanup()
    
    // Rendering
    _renderCard()
    
    static get styles() { /* ... */ }
}
```

**MsdInstanceManager Integration**:
```javascript
// From MsdInstanceManager.js
static requestInstance(userMsdConfig, mountEl, hass, isPreview) {
    // Extract card instance and GUID
    const requestingCard = MsdInstanceManager._getCardInstanceFromMount(mountEl);
    const requestingGuid = requestingCard?._msdInstanceGuid;
    
    // Handle preview mode
    if (isPreview) {
        return MsdInstanceManager._createPreviewContent(userMsdConfig, mountEl);
    }
    
    // Check for existing instance (GUID-based)
    if (MsdInstanceManager._currentInstanceGuid === requestingGuid) {
        return MsdInstanceManager._currentInstance; // Same card re-initializing
    }
    
    if (MsdInstanceManager._currentInstanceGuid !== requestingGuid) {
        return { blocked: true, /* ... */ }; // Different card blocked
    }
    
    // Initialize new instance
    // ...
}
```

### 4. Updated Action Helpers for MSD

**Location**: `src/msd/renderer/ActionHelpers.js`

**Changes Required**:

```javascript
// OLD (lines 437-481): Bridge pattern with config injection
static executeActionViaButtonCardBridge(action, cardInstance, actionType = 'tap') {
    const tempConfig = { ...originalConfig, [`${actionType}_action`]: action };
    cardInstance._config = tempConfig;
    cardInstance._handleAction(mockEvent);
    cardInstance._config = originalConfig;
}

// NEW: Direct execution via action handler
static executeAction(action, cardInstance, actionType = 'tap', options = {}) {
    const actionHandler = cardInstance.actionHandler || 
                         new CBLCARSActionHandler(cardInstance);
    
    return actionHandler.handleAction(action, null, {
        actionType,
        animationManager: options.animationManager,
        overlayId: options.overlayId
    });
}
```

**Updated Method Signatures**:
- `executeAction(action, cardInstance, actionType, options)` - Direct execution
- `_attachSimpleActions(element, simpleActions, cardInstance, options)` - Animation support
- `attachCellActionsFromConfigs(overlayElement, cells, cardInstance)` - Cell actions

**Animation Integration**:
```javascript
// In _attachSimpleActions()
if (options.animationManager && overlayId) {
    const trigger = this._getAnimationTrigger(actionType);
    options.animationManager.triggerAnimations(overlayId, trigger);
}

await actionHandler.handleAction(action, event);
```

### 5. Overlay Renderer Updates

**Files to Update**:
- `src/msd/overlays/ButtonOverlay.js`
- `src/msd/overlays/StatusGridOverlay.js`
- `src/msd/overlays/TextOverlay.js`

**Changes**:
```javascript
// ButtonOverlay.js (lines 95-236)
// Replace button-card bridge with action handler
render(overlay, anchors, viewBox, svgContainer, cardInstance) {
    // ... rendering logic ...
    
    const actionInfo = ActionHelpers.processOverlayActions(overlay, resolvedStyle, cardInstance);
    
    if (actionInfo) {
        setTimeout(() => {
            const element = this.shadowRoot.querySelector(`[data-overlay-id="${overlay.id}"]`);
            ActionHelpers.attachActions(element, overlay, actionInfo.config, cardInstance, {
                animationManager: this.systemsManager?.animationManager
            });
        }, 100);
    }
    
    return { markup, actionInfo, overlayId, metadata, provenance };
}
```

### 6. Dependency Updates

**File**: `package.json`

**Add Dependencies**:
```json
{
  "dependencies": {
    "lit": "^3.0.0",
    "custom-card-helpers": "^1.9.0",
    "ha-editor-formbuilder-yaml": "github:snootched/ha-card-formbuilder",
    "animejs": "^4.0.0"
  }
}
```

**Note**: `lit` may already be available via Home Assistant's frontend, but adding it explicitly ensures version control.

### 7. Webpack Configuration

**File**: `webpack.config.js`

**Add Externals**:
```javascript
module.exports = {
    // ... existing config ...
    externals: {
        // Don't bundle these - use HA's versions
        'lit': 'lit',
        'lit-element': 'lit-element',
        'lit-html': 'lit-html'
    }
};
```

### 8. Main Entry Point Updates

**File**: `src/cb-lcars.js`

**Changes**:

```javascript
// REMOVE (lines 119-122): Button-card dependency check
// if (!customElements.get('cblcars-button-card')) {
//     cblcarsLog.error(`Custom Button Card for LCARS [cblcars-button-card] was not found!`);
// }

// ADD: Import new MSD card
import './cards/cb-lcars-msd.js';

// Initialize and register cards
initializeCustomCard()
    .then(() => {
        // Legacy cards (still use button-card base - deprecated)
        defineCustomElement('cb-lcars-base-card', CBLCARSBaseCard, /*...*/);
        defineCustomElement('cb-lcars-button-card', CBLCARSButtonCard, /*...*/);
        // ... other legacy cards ...
        
        // MSD card already self-registered in cb-lcars-msd.js
        
        cblcarsLog.info('✅ CB-LCARS cards registered');
        cblcarsLog.info('📢 MSD now uses native architecture (custom-button-card no longer required)');
        cblcarsLog.info('⚠️ Legacy v1 cards still use custom-button-card (will be migrated in future release)');
    });
```

---

## 🧪 Testing Strategy

### Unit Tests

**New File**: `scripts/msd/test-native-architecture.js`

**Test Cases**:

#### CBLCARSNativeCard Tests
```javascript
describe('CBLCARSNativeCard', () => {
    test('✅ instantiation');
    test('✅ setConfig() sets configuration');
    test('✅ setHass() triggers updates');
    test('✅ getCardSize() returns correct values');
    test('✅ getLayoutOptions() returns grid layout');
    test('✅ lifecycle hooks fire in correct order');
    test('✅ _generateInstanceGuid() creates unique GUIDs');
    test('✅ _isPreviewMode() detects preview context');
    test('✅ _resolveMount() retries with backoff');
    test('✅ _createErrorDisplay() generates error HTML');
    test('✅ error handling and logging work');
});
```

#### CBLCARSActionHandler Tests
```javascript
describe('CBLCARSActionHandler', () => {
    test('✅ executes toggle action');
    test('✅ executes call-service action');
    test('✅ executes navigate action');
    test('✅ executes url action');
    test('✅ executes more-info action');
    test('✅ handles confirmation dialogs');
    test('✅ evaluates templates in actions');
    test('✅ triggers animations on actions');
    test('✅ formatEntity() formats values');
    test('✅ error handling works');
});
```

#### Template Pattern Tests
```javascript
describe('MSD Template Patterns', () => {
    test('✅ preview mode detection works');
    test('✅ preview content renders');
    test('✅ GUID generation is unique');
    test('✅ mount resolution succeeds on first attempt');
    test('✅ mount resolution retries with backoff');
    test('✅ mount resolution fails gracefully after max attempts');
    test('✅ SVG source "none" works with viewBox');
    test('✅ SVG source "none" fails without viewBox');
    test('✅ SVG filter isolation wrapping works');
    test('✅ error messages are rich and actionable');
});
```

### Integration Tests

**New File**: `scripts/msd/test-msd-native-integration.js`

**Test Cases**:

```javascript
describe('MSD Native Integration', () => {
    test('✅ MSD card initializes with native base');
    test('✅ MSD pipeline receives action handler');
    test('✅ Overlay actions execute correctly');
    test('✅ Button overlay tap actions work');
    test('✅ Button overlay hold actions work');
    test('✅ Button overlay double-tap actions work');
    test('✅ Status grid cell actions work independently');
    test('✅ Text overlay actions work');
    test('✅ Animation triggers fire on actions');
    test('✅ HASS updates propagate to pipeline');
    test('✅ Cleanup properly destroys resources');
    test('✅ MsdInstanceManager blocks second instance');
    test('✅ MsdInstanceManager allows same card re-init');
    test('✅ Preview mode prevents full initialization');
});
```

### Manual Testing Checklist

#### Visual & Functional Tests
- [ ] MSD card renders correctly in Home Assistant
- [ ] Base SVG displays properly
- [ ] Overlays render in correct positions
- [ ] Overlay tap actions execute services
- [ ] Overlay hold actions show more-info dialogs
- [ ] Overlay double-tap actions work
- [ ] Status grid cell actions work independently
- [ ] Button overlays respond to interactions
- [ ] Text overlays with actions work
- [ ] Sparkline overlays work (no actions)
- [ ] Line overlays render correctly

#### Animation Integration
- [ ] Animations trigger on hover (desktop)
- [ ] Animations trigger on tap
- [ ] Animations trigger on hold
- [ ] Animations trigger on double-tap
- [ ] Animations trigger on leave (desktop)
- [ ] Animation manager integration works

#### Error Handling & Edge Cases
- [ ] Invalid SVG source shows error with suggestions
- [ ] Missing viewBox with "none" source shows error
- [ ] Builtin SVG error lists available templates
- [ ] URL SVG error provides helpful message
- [ ] Preview mode shows preview content
- [ ] Second MSD card shows blocked message
- [ ] Console shows no unexpected errors or warnings

#### Performance Tests
- [ ] Bundle size reduced (check dev tools network tab)
- [ ] Initial load time improved
- [ ] No performance regressions in rendering
- [ ] No memory leaks (long-running test)
- [ ] Smooth animations (60fps)

#### Compatibility Tests
- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Home Assistant mobile app (iOS)
- [ ] Works in Home Assistant mobile app (Android)

---

## 📊 Multi-Instance Support Status

### Current State (Phase 1)

**MSD is SINGLE-INSTANCE ONLY** - This migration **does not change** this behavior.

From `src/msd/pipeline/MsdInstanceManager.js`:
```javascript
/**
 * MSD Instance Manager - Provides single-instance protection for MSD system
 *
 * The MSD system is designed for single-instance operation due to:
 * - Global window references (window.cblcars.debug.msd, window.cblcars.msd.api)
 * - Singleton HUD Manager attached to document.body
 * - Shared resource managers with no namespace isolation
 * - Global card instance storage
 */
```

**What happens if user adds 2 MSD cards?**
- ❌ **Second card is BLOCKED**
- 📋 Shows message: "Different MSD card instance already active"
- 💡 User must refresh page to reset
- 🔧 Debug function available: `window.__msdForceReplace()`

**Other cards (button, elbow, label, etc.)**:
- ✅ **Unlimited instances allowed**
- ✅ Each card is independent
- ✅ No conflicts between cards

### Phase 1 Scope: Single-Instance Preserved

**No Changes to Instance Management**:
- ✅ `MsdInstanceManager` still enforces single-instance
- ✅ GUID tracking preserved
- ✅ Blocked state messaging unchanged
- ✅ User experience identical

**Why Keep Single-Instance for Phase 1?**
1. 🎯 **Scope Control**: Migration is already complex
2. 🧪 **Risk Mitigation**: Don't change fundamental architecture and dependency system simultaneously
3. ✅ **Validate First**: Ensure native base works perfectly before multi-instance
4. 🔬 **Foundation**: Native architecture is **prerequisite** for multi-instance work

---

## 🔮 Future Roadmap: Multi-Instance & Beyond

### Phase 2: Multi-Instance Foundation (Future)

**Goal**: Enable multiple MSD cards on same dashboard.

**Required Changes**:

#### 1. Instance-Scoped Global References
```javascript
// CURRENT (Single)
window.cblcars.debug.msd = { pipelineInstance: pipeline };

// FUTURE (Multiple)
window.cblcars.debug.msd = new Map();
window.cblcars.debug.msd.set(instanceGuid, { pipelineInstance: pipeline });
```

#### 2. Instance-Scoped HUD Manager
```javascript
// CURRENT (Singleton on document.body)
window.__msdHudBus = new HudManager(document.body);

// FUTURE (Per-instance in shadowRoot)
this._hudManager = new HudManager(this.shadowRoot);
```

#### 3. Instance-Scoped Resource Managers
```javascript
// CURRENT (Global)
window.cblcars.msd.dataSourceManager = new DataSourceManager();

// FUTURE (Per-instance)
this._dataSourceManager = new DataSourceManager(this._instanceGuid);
```

#### 4. Updated MsdInstanceManager
```javascript
// CURRENT
static _currentInstance = null; // Only one

// FUTURE
static _instances = new Map(); // Multiple by GUID
```

#### 5. API with Card ID Support
```javascript
// CURRENT (No cardId needed)
window.cblcars.msd.api.updateOverlay(overlayId, data);

// FUTURE (cardId selects instance)
window.cblcars.msd.api.updateOverlay(overlayId, data, cardId);
```

**Success Criteria for Phase 2**:
- ✅ User can add multiple MSD cards to same dashboard
- ✅ Each MSD has independent pipeline, overlays, data sources
- ✅ HUD manager scoped per instance
- ✅ No cross-contamination between instances
- ✅ Runtime API supports cardId parameter
- ✅ Performance acceptable with 3+ MSD cards

### Phase 3: Component Library & v2 Cards (Future)

**Goal**: Modernize standalone cards with component-based architecture.

**Deliverables**:
- 🧩 `BaseComponent` class for reusable components
- 🧩 `ButtonComponent`, `TextComponent`, `ElbowComponent`, etc.
- 🃏 v2 cards: `cb-lcars-button-v2`, `cb-lcars-text-v2`, etc.
- 📚 Component documentation and examples
- 🔄 Migration tool for v1 → v2 configs

**Architecture**:
```javascript
// v2 Button Card
class CBLCARSButtonCardV2 extends CBLCARSNativeCard {
    constructor() {
        super();
        this.component = null;
        this.actionHandler = new CBLCARSActionHandler(this);
    }
    
    setConfig(config) {
        super.setConfig(config);
        
        // Instantiate ButtonComponent
        this.component = new ButtonComponent(config, {
            mount: this.shadowRoot,
            services: window.cblcars,
            hass: this.hass,
            handleAction: this.actionHandler.handleAction.bind(this.actionHandler)
        });
    }
    
    render() {
        return this.component?.render() || html``;
    }
}
```

### Phase 4: Advanced Features (Future)

**Potential Enhancements**:
- 🎨 **Theme System v2**: Dynamic theme switching without page reload
- 🎭 **Advanced Animations**: Timeline sequences, state-driven animations
- 🔗 **Inter-Card Communication**: Message bus between MSD instances
- 📊 **Enhanced Data Sources**: More aggregation functions, streaming support
- 🎮 **Interactive Controls**: Drag-to-reorder, resize handles
- 📱 **Mobile Optimization**: Touch gestures, responsive layouts
- 🧪 **Visual Editor**: Drag-and-drop MSD builder
- 🔌 **Plugin System**: Third-party overlay types

---

## 📈 Success Criteria

### Functional Requirements

✅ **Core Functionality**:
- MSD card renders correctly
- All overlay types work (button, status_grid, text, sparkline, line, etc.)
- Actions execute correctly (tap, hold, double_tap)
- Animations trigger on actions
- HASS updates propagate correctly
- Data sources update in real-time
- Rules engine applies styles correctly
- Controls layer renders HA cards

✅ **Template Patterns Preserved**:
- Preview mode prevents full initialization
- Mount resolution handles async rendering
- Instance GUID tracking works
- SVG source "none" support functional
- Error messages are developer-friendly
- MsdInstanceManager enforces single-instance
- SVG filter isolation works
- Layered rendering maintains z-index

✅ **Backward Compatibility**:
- Legacy v1 cards still work (button, elbow, label, etc.)
- Existing MSD YAML configs work without changes
- No breaking changes for users
- No console errors or warnings

### Performance Requirements

✅ **Bundle Size**:
- Bundle size reduced by ≥90KB (120KB → ≤30KB)
- Custom-button-card removed from bundle (if not needed by legacy cards)

✅ **Load Time**:
- Initial load time improved by ≥20%
- Time to interactive improved
- No performance regression in rendering

✅ **Runtime Performance**:
- No memory leaks (tested over 1 hour)
- Smooth animations (≥55fps average)
- No jank in overlay updates
- HASS updates process quickly (≤50ms)

### Code Quality Requirements

✅ **Documentation**:
- All new classes have JSDoc comments
- All public methods documented
- Inline comments explain complex logic
- README updated with migration notes
- CHANGELOG entry added

✅ **Testing**:
- All unit tests pass
- All integration tests pass
- Manual testing checklist complete
- No console warnings or errors
- Code coverage ≥80% for new code

✅ **Architecture**:
- Clean separation of concerns
- No circular dependencies
- Proper error handling throughout
- Logging integration complete
- Backward compatibility maintained

---

## ⚠️ Risks and Mitigation

### Risk 1: Breaking Changes in custom-card-helpers

**Risk**: `custom-card-helpers` API changes could break action handling.

**Mitigation**:
- Pin version in `package.json`
- Comprehensive test suite covering all action types
- Fallback to direct HASS calls if `custom-card-helpers` fails
- Monitor `custom-card-helpers` releases

**Likelihood**: Low (stable library, wide usage)  
**Impact**: Medium (action handling breaks)

### Risk 2: Edge Cases in Action Handling

**Risk**: Some action types or configurations may not work via `custom-card-helpers`.

**Mitigation**:
- Test all action types comprehensively
- Test with/without confirmation dialogs
- Test template evaluation
- Test repeat actions
- Provide fallback action handler if needed

**Likelihood**: Low (custom-card-helpers is battle-tested)  
**Impact**: Medium (some actions don't work)

### Risk 3: Animation Integration Issues

**Risk**: Animation triggers may not fire correctly with new action handler.

**Mitigation**:
- Preserve exact trigger logic from ActionHelpers
- Test all trigger types (hover, tap, hold, leave)
- Verify AnimationManager integration
- Test with multiple overlays

**Likelihood**: Low (isolated integration point)  
**Impact**: Low (animations don't trigger)

### Risk 4: Legacy Card Compatibility

**Risk**: Changes might inadvertently break legacy v1 cards.

**Mitigation**:
- Don't modify `CBLCARSBaseCard` (button-card wrapper)
- Keep legacy cards in separate namespace
- Test legacy cards thoroughly
- Maintain parallel support for 6-12 months

**Likelihood**: Very Low (not touching legacy code)  
**Impact**: High (breaks existing dashboards)

### Risk 5: Template Pattern Implementation Errors

**Risk**: Missing or incorrect implementation of critical template patterns.

**Mitigation**:
- Line-by-line comparison with `cb-lcars-msd.yaml` template
- Dedicated tests for each pattern
- Manual testing in card picker and editor
- Review by senior developer

**Likelihood**: Medium (complex patterns)  
**Impact**: High (MSD doesn't initialize correctly)

### Risk 6: Performance Regressions

**Risk**: Native implementation performs worse than button-card base.

**Mitigation**:
- Performance profiling before and after
- Benchmark critical paths
- Optimize hot paths if needed
- Monitor memory usage

**Likelihood**: Very Low (removing code should improve performance)  
**Impact**: Medium (slower rendering)

---

## 📅 Implementation Timeline

### Week 1-2: Foundation

**Tasks**:
1. Create `src/base/CBLCARSNativeCard.js` with all template patterns
2. Create `src/base/CBLCARSActionHandler.js`
3. Create `src/base/index.js` barrel export
4. Add dependencies to `package.json`
5. Update `webpack.config.js` externals
6. Write unit tests for base classes
7. Run tests and fix issues

**Deliverables**:
- ✅ `CBLCARSNativeCard.js` complete and tested
- ✅ `CBLCARSActionHandler.js` complete and tested
- ✅ All unit tests passing
- ✅ Dependencies added

### Week 3-4: MSD Migration

**Tasks**:
1. Create `src/cards/cb-lcars-msd.js` with full template preservation
2. Update `src/msd/renderer/ActionHelpers.js` to use new action handler
3. Update `src/msd/overlays/ButtonOverlay.js` action attachment
4. Update `src/msd/overlays/StatusGridOverlay.js` action attachment
5. Update `src/msd/overlays/TextOverlay.js` action attachment
6. Update `src/cb-lcars.js` entry point
7. Write integration tests
8. Run all tests

**Deliverables**:
- ✅ MSD card using native base
- ✅ All overlays using new action handler
- ✅ Integration tests passing
- ✅ Manual testing complete

### Week 5: Testing & Validation

**Tasks**:
1. Comprehensive manual testing (checklist)
2. Performance profiling and comparison
3. Cross-browser testing
4. Mobile app testing
5. Edge case testing
6. Fix any issues found
7. Code review

**Deliverables**:
- ✅ All manual tests pass
- ✅ Performance improved or equal
- ✅ Works in all browsers
- ✅ No regressions
- ✅ Code review approved

### Week 6: Documentation & Release

**Tasks**:
1. Update README with migration notes
2. Write CHANGELOG entry
3. Update developer documentation
4. Create migration guide
5. Update JSDoc throughout
6. Create GitHub release
7. Deploy to production

**Deliverables**:
- ✅ Documentation updated
- ✅ CHANGELOG complete
- ✅ GitHub release created
- ✅ Deployed and verified

**Total Duration**: 6 weeks

---

## 📚 Documentation Updates Required

### 1. Developer Guide

**File**: `doc/developer/native-architecture.md` (NEW)

**Content**:
- Overview of native base class
- How to extend `CBLCARSNativeCard`
- Action handler usage
- Template pattern explanations
- Best practices

### 2. MSD Documentation

**File**: `doc/msd/initialization-flow.md` (NEW)

**Content**:
- MSD initialization sequence
- Preview mode detection
- Mount resolution
- SVG processing
- Pipeline initialization
- Error handling

### 3. Instance Management

**File**: `doc/msd/instance-management.md` (NEW)

**Content**:
- Single-instance enforcement
- GUID system
- Why only one MSD per dashboard
- Future multi-instance roadmap
- Debugging instance issues

### 4. SVG Source Options

**File**: `doc/msd/svg-sources.md` (UPDATE)

**Content**:
- Builtin SVGs
- URL loading
- Local paths
- **NEW**: Overlay-only mode (`source: "none"`)
- Error messages and troubleshooting

### 5. API Reference

**File**: `doc/api/native-base-api.md` (NEW)

**Content**:
- `CBLCARSNativeCard` class reference
- `CBLCARSActionHandler` class reference
- Method signatures
- Property definitions
- Event handling
- Examples

### 6. Migration Guide

**File**: `doc/migration/button-card-to-native.md` (NEW)

**Content**:
- Why we migrated
- What changed for users (nothing!)
- What changed for developers
- How to create v2 cards
- Breaking changes (none for Phase 1)
- Troubleshooting

### 7. README

**File**: `README.md` (UPDATE)

**Content**:
- Add note about native architecture
- Update installation instructions
- Mention `custom-card-helpers` dependency
- Update feature list
- Add migration status

### 8. CHANGELOG

**File**: `CHANGELOG.md` (UPDATE)

**Content**:
```markdown
## [2026.1.0] - 2025-01-XX

### Added
- Native LitElement base class (`CBLCARSNativeCard`)
- Custom-card-helpers integration for action handling
- MSD card now uses native architecture
- Instance GUID management system
- Preview mode detection and handling
- SVG source "none" support for overlay-only mode

### Changed
- **BREAKING (Developers)**: MSD card now extends `CBLCARSNativeCard` instead of button-card
- Action handling now uses `custom-card-helpers` instead of button-card bridge
- Bundle size reduced by ~95KB
- Initial load time improved by ~20%

### Deprecated
- `CBLCARSBaseCard` (button-card wrapper) - still supported for v1 cards
- Legacy v1 cards will be migrated in future release

### Removed
- Custom-button-card dependency for MSD card
- Button-card action bridge pattern

### Fixed
- None (no user-facing bug fixes, architectural change only)

### Migration Notes
- **Users**: No changes required! Existing MSD configs work without modification
- **Developers**: See doc/migration/button-card-to-native.md for details
- **Legacy v1 Cards**: Still work via `CBLCARSBaseCard` wrapper (no changes needed)
```

---

## 🎯 Definition of Done

### Code Complete

- [ ] `CBLCARSNativeCard.js` implemented and tested
- [ ] `CBLCARSActionHandler.js` implemented and tested
- [ ] `cb-lcars-msd.js` migrated to native base
- [ ] `ActionHelpers.js` updated to use new action handler
- [ ] All overlay renderers updated
- [ ] `cb-lcars.js` entry point updated
- [ ] `package.json` dependencies added
- [ ] `webpack.config.js` configured

### Tests Complete

- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] Manual testing checklist complete
- [ ] No console errors or warnings
- [ ] Performance tests show improvement
- [ ] Cross-browser testing complete
- [ ] Mobile app testing complete

### Documentation Complete

- [ ] All new classes have JSDoc comments
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Developer guide created/updated
- [ ] MSD documentation created/updated
- [ ] API reference created
- [ ] Migration guide created
- [ ] Code review completed

### Quality Gates Passed

- [ ] No breaking changes for users
- [ ] Backward compatibility maintained
- [ ] Bundle size reduced by ≥90KB
- [ ] Load time improved by ≥20%
- [ ] Code coverage ≥80% for new code
- [ ] All linting rules pass
- [ ] No TypeScript errors (if applicable)

### Deployment Ready

- [ ] GitHub release created
- [ ] Release notes written
- [ ] Version bumped (major version)
- [ ] Build successful
- [ ] Production testing complete
- [ ] Rollback plan documented

---

## 🚀 Getting Started

### For Coding Agent

**Primary Task**: Implement Phase 1 native architecture migration.

**Entry Point**: Start with `src/base/CBLCARSNativeCard.js`

**Key Files to Create**:
1. `src/base/CBLCARSNativeCard.js` - Native base class
2. `src/base/CBLCARSActionHandler.js` - Action handler wrapper
3. `src/cards/cb-lcars-msd.js` - MSD card with native base
4. `scripts/msd/test-native-architecture.js` - Unit tests
5. `scripts/msd/test-msd-native-integration.js` - Integration tests

**Key Files to Modify**:
1. `src/msd/renderer/ActionHelpers.js` - Replace bridge pattern
2. `src/msd/overlays/ButtonOverlay.js` - Use new action handler
3. `src/msd/overlays/StatusGridOverlay.js` - Use new action handler
4. `src/cb-lcars.js` - Import new MSD, remove button-card check
5. `package.json` - Add dependencies
6. `webpack.config.js` - Add lit externals

**Critical Requirements**:
- ✅ Preserve ALL template patterns from `src/cb-lcars/cb-lcars-msd.yaml`
- ✅ Maintain single-instance behavior (no changes)
- ✅ No breaking changes for users
- ✅ Complete JSDoc documentation
- ✅ Comprehensive tests

**Success Metrics**:
- ✅ Bundle size ≤30KB (down from 120KB)
- ✅ All tests pass
- ✅ MSD renders identically to current
- ✅ No console errors/warnings
- ✅ Performance equal or better

---

## 📞 Questions & Support

### For Implementation Questions

**Contact**: CB-LCARS Development Team  
**GitHub Issues**: https://github.com/snootched/cb-lcars-copilot/issues  
**Documentation**: `doc/` directory

### For User Questions (Post-Migration)

**Forum**: Home Assistant Community Forum  
**Discord**: CB-LCARS Discord Server  
**Documentation**: https://cb-lcars.unimatrix01.ca

---

## 🎉 Conclusion

This migration represents a **foundational architectural shift** for CB-LCARS:

- 🏗️ **Modern Foundation**: Native LitElement base provides full control
- 🚀 **Performance**: 95KB reduction, 20% faster loading
- 🔮 **Future-Ready**: Enables multi-instance, component library, advanced features
- ✅ **Zero User Impact**: No configuration changes required
- 🛡️ **Risk Mitigation**: Thorough testing, backward compatibility, gradual rollout

The migration is **carefully scoped** to minimize risk while providing maximum long-term benefit. By preserving all template patterns and maintaining backward compatibility, we ensure a smooth transition that sets the stage for exciting future enhancements.

**Ready to begin implementation!** 🚀

---

**End of Comprehensive Proposal - v1.0**
