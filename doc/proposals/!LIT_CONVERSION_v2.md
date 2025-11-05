# 🚀 LCARdS Native Architecture Migration + LCARdS Rebrand - Final Comprehensive Proposal

**Version**: 2.0 (Updated with Rename)  
**Date**: 2025-01-04  
**Author**: LCARdS Development Team  
**Status**: Ready for Implementation

---

## 📋 Executive Summary

### Objective

Remove the `custom-button-card` dependency from LCARdS, migrate to a native LitElement-based architecture, and **rebrand to LCARdS** - all in a single coordinated release. The project will leverage the community-maintained `custom-card-helpers` library for action handling while preserving all existing functionality and template patterns.

### Impact

- 📦 **95KB bundle size reduction** (120KB → 25KB)
- 🚀 **Faster load times** (~20% improvement)
- 🛠️ **Full architectural control** with no external framework constraints
- ✅ **Battle-tested action system** via `custom-card-helpers`
- 🎯 **Clean component-based architecture** aligned with MSD evolution
- 🎨 **Modern branding** that reflects independent architecture
- 💡 **Memorable name** (LCARdS = LCARS + cards wordplay)
- 🔮 **Foundation for future enhancements** (multi-instance, component library)

### Scope

**Phase 1 (This Migration + Rebrand)**:
- ✅ Create native `LCARdSNativeCard` base class
- ✅ Migrate MSD card to native base
- ✅ Replace button-card action bridge with `custom-card-helpers`
- ✅ Preserve all MSD template initialization patterns
- ✅ **Rename all LCARdS references to LCARdS**
- ✅ **Update global namespace: `window.lcards` → `window.lcards`**
- ✅ **Rename element names: `lcards-*` → `lcards-*`**
- ✅ **Include backward compatibility layer for 12 months**
- ✅ Maintain legacy v1 cards support during transition
- ⚠️ **Single-instance MSD only** (no change from current behavior)

**Out of Scope for Phase 1**:
- ❌ Multi-instance MSD support (Phase 2+)
- ❌ Migrating legacy v1 standalone cards to native base (Future)
- ❌ Component library for v2 cards (Future)

---

## 🎨 Project Rebrand: LCARdS → LCARdS

### Why Rename?

1. **"CB" No Longer Relevant**: "Custom Button" naming tied to `custom-button-card` dependency
2. **Independent Architecture**: Native LitElement base deserves independent branding
3. **Clever Wordplay**: LCARdS = **LCAR**S + car**dS** (memorable and searchable)
4. **Perfect Timing**: Already making breaking architectural changes
5. **Future-Proof**: Name aligns with vision as comprehensive LCARS card system

### New Branding

| **Aspect** | **Old (LCARdS)** | **New (LCARdS)** |
|------------|-------------------|------------------|
| **Project Name** | LCARdS | LCARdS |
| **Pronunciation** | "See-Bee-El-Cars" | "El-Cards" |
| **Global Namespace** | `window.lcards` | `window.lcards` |
| **Element Prefix** | `lcards-*` | `lcards-*` |
| **Class Prefix** | `LCARdS*` | `LCARdS*` |
| **Package Name** | `cb-lcars` | `lcards` |
| **GitHub Repo** | `snootched/lcards-copilot` | `snootched/lcards` |
| **HACS Name** | LCARdS | LCARdS |
| **Documentation URL** | `cb-lcars.unimatrix01.ca` | `lcards.io` (or keep unimatrix01.ca) |

### Naming Convention

**Class Names**: `LCARdS` (capital L, capital CARS, lowercase d)
- Example: `LCARdSNativeCard`, `LCARdSMSDCard`, `LCARdSActionHandler`
- **Rationale**: Emphasizes the LCARS+cards wordplay

**Element Names**: `lcards-*` (all lowercase)
- Example: `lcards-msd-card`, `lcards-button-card`, `lcards-elbow-card`
- **Rationale**: HTML custom elements must be lowercase

**Namespace**: `window.lcards` (all lowercase)
- Example: `window.lcards.log`, `window.lcards.anim`, `window.lcards.msd`
- **Rationale**: JavaScript convention for global objects

**File Names**: `lcards-*` (all lowercase)
- Example: `lcards.js`, `lcards-logging.js`, `lcards-msd.yaml`
- **Rationale**: Standard file naming convention

---

## 🏗️ Proposed Architecture

### Native Base Class Hierarchy

```
LitElement (from lit)
    ↓
LCARdSNativeCard (new - native base)
    ↓
    ├── LCARdSMSDCard (migrated to native)
    │
    └── [Future] LCARdSButtonCardV2, LCARdSTextCardV2, etc.

ButtonCard (custom-button-card - preserved for legacy)
    ↓
LCARdSBaseCard (legacy wrapper - deprecated but maintained)
    ↓
    ├── LCARdSButtonCard (v1 - legacy, backward compat only)
    ├── LCARdSElbowCard (v1 - legacy, backward compat only)
    └── LCARdSLabelCard (v1 - legacy, backward compat only)
```

### Action Handling Architecture

```
User Interaction (tap/hold/double-tap)
    ↓
LCARdSActionHandler (native wrapper)
    ↓
custom-card-helpers.handleAction()
    ↓
Home Assistant Action System
    ↓
Execute (toggle, call-service, navigate, etc.)
```

### File Structure After Migration + Rebrand

```
src/
├── base/
│   ├── LCARdSNativeCard.js           # ✅ NEW: Native LitElement base
│   ├── LCARdSActionHandler.js        # ✅ NEW: custom-card-helpers wrapper
│   ├── LCARdSBaseCard.js             # ⚠️ DEPRECATED: Button-card wrapper (legacy compat)
│   └── index.js                       # Barrel export
│
├── cards/
│   ├── lcards-msd.js                 # ✅ NEW: MSD card (native base)
│   └── legacy/                        # ⚠️ Legacy v1 cards (backward compat)
│       ├── lcards-button.js          # (still uses button-card base)
│       ├── lcards-elbow.js
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
│   ├── lcards-logging.js             # ✅ RENAMED: Was lcards-logging.js
│   ├── lcards-anim-helpers.js        # ✅ RENAMED: Was lcards-anim-helpers.js
│   └── ...
│
├── lcards/                            # ✅ RENAMED: Was cb-lcars/
│   ├── lcards-msd.yaml               # ✅ RENAMED: Was lcards-msd.yaml
│   ├── lcards-button-*.yaml          # ✅ RENAMED: All button templates
│   └── ...
│
├── lcards.js                          # ✅ RENAMED: Was cb-lcars.js (main entry)
└── webpack.config.js                  # ✅ MODIFIED: Update entry point, output
```

---

## 📦 Implementation Details

### 1. Native Base Card (`LCARdSNativeCard.js`)

**Location**: `src/base/LCARdSNativeCard.js`

**Key Features**:
- Extends `LitElement` directly
- Implements Home Assistant card interface
- Provides lifecycle hooks for subclass customization
- Integrates with LCARdS infrastructure (logging, fonts, animations)
- Includes all template patterns (GUID, preview mode, mount resolution, error display)

**Core Methods**:

```javascript
export class LCARdSNativeCard extends LitElement {
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
- ✅ `window.lcards` global namespace (was `window.lcards`)
- ✅ `lcardsLog` logging system (was `lcardsLog`)
- ✅ `window.lcards.loadFont()` font loading
- ✅ `window.lcards.anim` animation system (anime.js v4 scopes)

### 2. Action Handler (`LCARdSActionHandler.js`)

**Location**: `src/base/LCARdSActionHandler.js`

**Purpose**: Wrapper around `custom-card-helpers` for LCARdS conventions.

**Core Methods**:

```javascript
export class LCARdSActionHandler {
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

### 3. MSD Card (`lcards-msd.js`)

**Location**: `src/cards/lcards-msd.js`

**Purpose**: MSD card implementation using native base with all template patterns preserved.

**Core Structure**:

```javascript
class LCARdSMSDCard extends LCARdSNativeCard {
    static get properties() { /* ... */ }
    static get cardType() { return 'lcards-msd-card'; }
    
    constructor() {
        super();
        this.actionHandler = new LCARdSActionHandler(this);
        this._msdPipeline = null;
        this._msdViewBox = null;
        this._msdAnchors = null;
        this._msdPreviewMode = false;
    }
    
    // ... implementation with all template patterns ...
}

// Register card
customElements.define('lcards-msd-card', LCARdSMSDCard);

// Register with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-msd-card',
    name: 'LCARdS MSD',
    preview: true,
    description: 'LCARdS Master Systems Display (MSD) card',
    documentationURL: "https://lcards.io"
});
```

### 4. Updated Main Entry Point

**File**: `src/lcards.js` (renamed from `cb-lcars.js`)

**Key Changes**:

```javascript
// Global namespace
window.lcards = window.lcards || {};

// Logging
import { lcardsLog, lcardsSetGlobalLogLevel, lcardsGetGlobalLogLevel } from './utils/lcards-logging.js';
window.lcards.log = lcardsLog;

// Animation namespace
window.lcards.anim = {
    animejs: anime,
    anime: anime.animate,
    utils: anime.utils,
    animateElement: animHelpers.animateElement,
    animateWithRoot: animHelpers.animateWithRoot,
    waitForElement: animHelpers.waitForElement,
    presets: animPresets,
    scopes: new Map(),
};

// SVG helpers
window.lcards.svgHelpers = svgHelpers;
window.lcards.anchorHelpers = anchorHelpers;
window.lcards.findSvgAnchors = anchorHelpers.findSvgAnchors;
window.lcards.getSvgContent = anchorHelpers.getSvgContent;
window.lcards.getSvgViewBox = anchorHelpers.getSvgViewBox;
window.lcards.getSvgAspectRatio = anchorHelpers.getSvgAspectRatio;

// Font loading
window.lcards.loadFont = loadFont;

// SVG loading
window.lcards.loadUserSVG = async function(key, url) {
    return await loadSVGToCache(key, url);
};
window.lcards.getSVGFromCache = getSVGFromCache;

// Load YAML configs
templatesPromise = loadTemplates(LCARDS.templates_uri);
stubConfigPromise = loadStubConfig(LCARDS.stub_config_uri);
themeColorsPromise = loadThemeColors(LCARDS.theme_colors_uri);

// Initialize and register cards
initializeCustomCard()
    .then(() => {
        // NEW MSD card (native base)
        // Already self-registered in lcards-msd.js
        
        // Legacy v1 cards (still use button-card base - backward compat)
        defineCustomElement('lcards-base-card', LCARdSBaseCard, 'lcards-base-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-button-card', LCARdSButtonCard, 'lcards-button-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-elbow-card', LCARdSElbowCard, 'lcards-elbow-card-editor', LCARdSCardEditor);
        // ... other legacy cards ...
        
        lcardsLog.info('✅ LCARdS cards registered');
        lcardsLog.info('📢 MSD now uses native architecture (custom-button-card no longer required)');
        lcardsLog.info('⚠️ Legacy v1 cards still use custom-button-card (will be migrated in future release)');
    });

// ✅ BACKWARD COMPATIBILITY: Alias old namespace for 12 months
if (typeof window.lcards === 'undefined') {
    Object.defineProperty(window, 'lcards', {
        get: () => {
            console.warn(
                '⚠️ LCARdS has been renamed to LCARdS!\n' +
                'Please update your code to use window.lcards instead of window.lcards\n' +
                'See migration guide: https://lcards.io/migration\n' +
                'This compatibility layer will be removed in v3.0.0'
            );
            return window.lcards;
        },
        configurable: true
    });
}

// ✅ BACKWARD COMPATIBILITY: Register old element names with deprecation warnings
const legacyElementMap = {
    'lcards-msd-card': 'lcards-msd-card',
    'lcards-button-card': 'lcards-button-card',
    'lcards-elbow-card': 'lcards-elbow-card',
    'lcards-label-card': 'lcards-label-card',
    'lcards-double-elbow-card': 'lcards-double-elbow-card',
    'lcards-meter-card': 'lcards-meter-card',
    'lcards-picard-card': 'lcards-picard-card',
    'lcards-slider-card': 'lcards-slider-card',
    'lcards-base-card': 'lcards-base-card'
};

Object.entries(legacyElementMap).forEach(([oldName, newName]) => {
    const CardClass = customElements.get(newName);
    if (CardClass) {
        // Create wrapper that shows deprecation warning
        class DeprecatedCard extends CardClass {
            connectedCallback() {
                console.warn(
                    `⚠️ Element '${oldName}' is deprecated. Use '${newName}' instead.\n` +
                    `This element will be removed in v3.0.0.\n` +
                    `See migration guide: https://lcards.io/migration`
                );
                super.connectedCallback();
            }
        }
        customElements.define(oldName, DeprecatedCard);
    }
});
```

### 5. Backward Compatibility Layer

**Purpose**: Allow existing users to migrate gradually over 12 months.

**Features**:

#### Global Namespace Alias
```javascript
// window.lcards → window.lcards
Object.defineProperty(window, 'lcards', {
    get: () => {
        console.warn('⚠️ LCARdS renamed to LCARdS. Use window.lcards instead.');
        return window.lcards;
    }
});
```

#### Element Name Aliases
```javascript
// lcards-msd-card → lcards-msd-card
customElements.define('lcards-msd-card', class extends LCARdSMSDCard {
    connectedCallback() {
        console.warn('⚠️ lcards-msd-card deprecated. Use lcards-msd-card instead.');
        super.connectedCallback();
    }
});
```

#### Template Key Support
```javascript
// Support both old and new template keys
lcards-msd:
  variables:
    card:
      color:
        background:
          default: black

# Backward compat
lcards-msd:  # Still works, shows warning
  variables:
    card:
      color:
        background:
          default: black
```

**Deprecation Timeline**:
- **v2.1.0 (2025-Q1)**: Old names work with warnings
- **v2.5.0 (2025-Q3)**: Loud warnings, migration guide promoted
- **v2.9.0 (2025-Q4)**: Final warning before removal
- **v3.0.0 (2026-Q1)**: Remove all backward compatibility (breaking change)

---

## 🔄 Rename Implementation Checklist

### Code Changes

#### Core Files (Critical)
- [ ] Rename `src/cb-lcars.js` → `src/lcards.js`
- [ ] Update `package.json` name: `"cb-lcars"` → `"lcards"`
- [ ] Update `webpack.config.js` entry: `cb-lcars.js` → `lcards.js`
- [ ] Update `webpack.config.js` output: `cb-lcars.js` → `lcards.js`

#### Class Names (Global Find/Replace)
- [ ] `LCARdSNativeCard` → `LCARdSNativeCard`
- [ ] `LCARdSActionHandler` → `LCARdSActionHandler`
- [ ] `LCARdSMSDCard` → `LCARdSMSDCard`
- [ ] `LCARdSButtonCard` → `LCARdSButtonCard`
- [ ] `LCARdSElbowCard` → `LCARdSElbowCard`
- [ ] `LCARdSLabelCard` → `LCARdSLabelCard`
- [ ] `LCARdSBaseCard` → `LCARdSBaseCard`
- [ ] All other `LCARdS*` classes → `LCARdS*`

#### Global Namespace (Global Find/Replace)
- [ ] `window.lcards` → `window.lcards` (everywhere)
- [ ] `lcardsLog` → `lcardsLog`
- [ ] `lcardsSetGlobalLogLevel` → `lcardsSetGlobalLogLevel`
- [ ] `lcardsGetGlobalLogLevel` → `lcardsGetGlobalLogLevel`

#### Element Names (Global Find/Replace)
- [ ] `lcards-msd-card` → `lcards-msd-card`
- [ ] `lcards-button-card` → `lcards-button-card`
- [ ] `lcards-elbow-card` → `lcards-elbow-card`
- [ ] `lcards-label-card` → `lcards-label-card`
- [ ] `lcards-double-elbow-card` → `lcards-double-elbow-card`
- [ ] `lcards-meter-card` → `lcards-meter-card`
- [ ] `lcards-picard-card` → `lcards-picard-card`
- [ ] `lcards-slider-card` → `lcards-slider-card`
- [ ] `lcards-base-card` → `lcards-base-card`
- [ ] All editor elements: `lcards-*-editor` → `lcards-*-editor`

#### File Names
- [ ] `src/cb-lcars.js` → `src/lcards.js`
- [ ] `src/utils/lcards-logging.js` → `src/utils/lcards-logging.js`
- [ ] `src/utils/lcards-anim-helpers.js` → `src/utils/lcards-anim-helpers.js`
- [ ] `src/cb-lcars/` directory → `src/lcards/`
- [ ] `src/lcards/lcards-msd.yaml` → `src/lcards/lcards-msd.yaml`
- [ ] All `lcards-*.yaml` → `lcards-*.yaml`

#### YAML Templates
- [ ] Update all template keys: `lcards-*` → `lcards-*`
- [ ] Update `lcards_card_type` → `lcards_card_type`
- [ ] Update config variable references
- [ ] Update stub configs

#### MSD Files (~150 files)
- [ ] All `src/msd/**/*.js` files (update references)
- [ ] `MsdInstanceManager.js` (update logging, references)
- [ ] All overlay renderers
- [ ] All system managers
- [ ] Pipeline core files

#### Backward Compatibility
- [ ] Add `window.lcards` alias with deprecation warning
- [ ] Register old element names with warnings
- [ ] Support old template keys with warnings
- [ ] Add migration detection logic

### Documentation Changes

#### Core Documentation
- [ ] `README.md` - Complete rewrite with new branding
- [ ] `CHANGELOG.md` - Add v2.1.0 entry with rename details
- [ ] `doc/README.md` - Update overview

#### User Documentation
- [ ] `doc/user-guide/getting-started/*.md` - Update installation
- [ ] `doc/user-guide/cards/*.md` - Update card examples
- [ ] `doc/user-guide/msd/*.md` - Update MSD examples
- [ ] All YAML examples throughout docs

#### Developer Documentation
- [ ] `doc/developer/*.md` - Update class names
- [ ] `doc/architecture/*.md` - Update architecture diagrams
- [ ] `doc/api/*.md` - Update API references
- [ ] `doc/proposals/*.md` - Update future proposals

#### Migration Guide
- [ ] Create `doc/migration/lcards-to-lcards.md`
- [ ] Include automated migration script
- [ ] Add troubleshooting section
- [ ] List all breaking changes

#### Schemas
- [ ] `doc/schemas/*.yaml` - Update element names
- [ ] JSON schema files if any
- [ ] Validation rules

### External Changes

#### GitHub Repository
- [ ] Rename repository: `lcards-copilot` → `lcards`
- [ ] Update repository description
- [ ] Update topics/tags
- [ ] Add redirect notice to old repo (if keeping)
- [ ] Update issue templates
- [ ] Update PR templates
- [ ] Update GitHub Actions workflows

#### HACS Integration
- [ ] Update `hacs.json`:
  ```json
  {
    "name": "LCARdS",
    "filename": "lcards.js",
    "render_readme": true
  }
  ```

#### Package Distribution
- [ ] Update npm package name (if applicable)
- [ ] Update CDN references
- [ ] Update download links

#### Website/Documentation Site
- [ ] Update domain (or add redirect)
- [ ] Update all URLs in documentation
- [ ] Update logos/branding
- [ ] Update screenshots
- [ ] Update examples

### Testing

#### Unit Tests
- [ ] Update all test files with new names
- [ ] Update test assertions
- [ ] Test backward compatibility layer
- [ ] Test deprecation warnings

#### Integration Tests
- [ ] Test MSD with new naming
- [ ] Test legacy cards still work
- [ ] Test old element names show warnings
- [ ] Test namespace alias works

#### Manual Testing
- [ ] Install with new name
- [ ] Test all card types
- [ ] Verify deprecation warnings appear
- [ ] Test migration script
- [ ] Cross-browser testing

---

## 🧪 Testing Strategy

### Backward Compatibility Tests

**New File**: `scripts/test-backward-compatibility.js`

```javascript
describe('Backward Compatibility', () => {
    describe('Global Namespace Alias', () => {
        test('✅ window.lcards points to window.lcards');
        test('✅ window.lcards shows deprecation warning');
        test('✅ window.lcards.log === window.lcards.log');
        test('✅ window.lcards.anim === window.lcards.anim');
    });
    
    describe('Element Name Aliases', () => {
        test('✅ lcards-msd-card element exists');
        test('✅ lcards-msd-card shows deprecation warning');
        test('✅ lcards-msd-card works identically to lcards-msd-card');
        test('✅ all legacy element names work');
    });
    
    describe('Template Key Support', () => {
        test('✅ lcards-msd template key works');
        test('✅ lcards_card_type works');
        test('✅ old keys show deprecation warnings');
    });
    
    describe('Migration Script', () => {
        test('✅ script converts lcards-msd-card to lcards-msd-card');
        test('✅ script converts lcards_card_type to lcards_card_type');
        test('✅ script preserves other config values');
        test('✅ script handles nested configs');
    });
});
```

### Rename Tests

**New File**: `scripts/test-rename-complete.js`

```javascript
describe('Rename Completeness', () => {
    test('✅ no "lcards" in source files (except backward compat)');
    test('✅ no "cb-lcars" in source files (except backward compat)');
    test('✅ no "LCARdS" in class names (except backward compat)');
    test('✅ all files renamed correctly');
    test('✅ all imports updated');
    test('✅ all exports updated');
});
```

---

## 📅 Updated Implementation Timeline

### Week 1-2: Foundation + Rename

**Tasks**:
1. Create `src/base/LCARdSNativeCard.js` with all template patterns
2. Create `src/base/LCARdSActionHandler.js`
3. **Global find/replace: `LCARdS*` → `LCARdS*`**
4. **Global find/replace: `lcards` → `lcards`**
5. **Rename all files: `lcards-*` → `lcards-*`**
6. **Update all imports and exports**
7. **Add backward compatibility layer**
8. Add dependencies to `package.json`
9. Update `webpack.config.js`
10. Write unit tests
11. Write backward compatibility tests
12. Run tests and fix issues

**Deliverables**:
- ✅ `LCARdSNativeCard.js` complete and tested
- ✅ `LCARdSActionHandler.js` complete and tested
- ✅ All files renamed
- ✅ Backward compatibility working
- ✅ All unit tests passing

### Week 3-4: MSD Migration

**Tasks**:
1. Create `src/cards/lcards-msd.js` with full template preservation
2. Update `src/msd/renderer/ActionHelpers.js`
3. Update all overlay renderers
4. Update `src/lcards.js` entry point
5. Update YAML templates
6. Write integration tests
7. Test backward compatibility thoroughly
8. Run all tests

**Deliverables**:
- ✅ MSD card using native base and new naming
- ✅ All overlays using new action handler
- ✅ Old element names working with warnings
- ✅ Integration tests passing
- ✅ Manual testing complete

### Week 5: Testing & Validation

**Tasks**:
1. Comprehensive manual testing
2. Test backward compatibility in real dashboards
3. Performance profiling
4. Cross-browser testing
5. Mobile app testing
6. Create migration script
7. Test migration script
8. Fix any issues
9. Code review

**Deliverables**:
- ✅ All manual tests pass
- ✅ Backward compatibility verified
- ✅ Migration script works
- ✅ Performance improved
- ✅ Works in all browsers
- ✅ Code review approved

### Week 6: Documentation & Release

**Tasks**:
1. Update README with new branding
2. Write comprehensive CHANGELOG
3. Update all documentation
4. Create migration guide
5. Update JSDoc throughout
6. Update GitHub repository
7. Update HACS integration
8. Create GitHub release
9. Write announcement blog post
10. Deploy to production

**Deliverables**:
- ✅ Documentation completely updated
- ✅ Migration guide available
- ✅ GitHub release v2.1.0
- ✅ HACS updated
- ✅ Community announcement posted
- ✅ Deployed and verified

**Total Duration**: 6 weeks

---

## 📚 Documentation Updates (Enhanced for Rebrand)

### 1. Migration Guide

**File**: `doc/migration/lcards-to-lcards.md` (NEW)

**Content**:

````markdown
# LCARdS → LCARdS Migration Guide

## Overview

LCARdS has been renamed to **LCARdS** (LCARS + cards) to reflect its evolution into a modern, independent LCARS card system for Home Assistant.

## What Changed?

### Project Name
- **Old**: LCARdS
- **New**: LCARdS

### Element Names
```yaml
# OLD
type: custom:lcards-msd-card

# NEW
type: custom:lcards-msd-card
```

### Template Keys
```yaml
# OLD
lcards-msd:
  variables: ...

# NEW
lcards-msd:
  variables: ...
```

### Config Variables
```yaml
# OLD
lcards_card_type: lcards-button-lozenge

# NEW
lcards_card_type: lcards-button-lozenge
```

## Do I Need to Update Right Away?

**No!** Backward compatibility is included for **12 months**.

- Old names still work in v2.1.0+
- Console warnings guide you to update
- Migration script available for automatic conversion

## How to Migrate

### Option 1: Automated Migration (Recommended)

```bash
# Download migration script
curl -o migrate.js https://lcards.io/scripts/migrate.js

# Run on your dashboard YAML
node migrate.js /config/ui-lovelace.yaml

# Review changes in ui-lovelace.yaml.migrated
# Copy migrated file when satisfied
```

### Option 2: Manual Migration

1. Find/replace in your dashboard YAML:
   - `lcards-` → `lcards-`
   - `lcards_card_type` → `lcards_card_type`

2. Update resource URL:
```yaml
# OLD
resources:
  - url: /hacsfiles/cb-lcars/cb-lcars.js
    type: module

# NEW
resources:
  - url: /hacsfiles/lcards/lcards.js
    type: module
```

3. Clear browser cache

4. Reload Home Assistant

## Timeline

- **v2.1.0 (Q1 2025)**: Rename released, backward compatibility included
- **v2.5.0 (Q3 2025)**: Loud deprecation warnings
- **v2.9.0 (Q4 2025)**: Final warnings before removal
- **v3.0.0 (Q1 2026)**: Old names removed (breaking change)

## Need Help?

- [GitHub Issues](https://github.com/snootched/lcards/issues)
- [Home Assistant Forum](https://community.home-assistant.io/)
- [Discord Server](https://discord.gg/lcards)
````

### 2. Updated README

**File**: `README.md` (MAJOR UPDATE)

**Key Sections**:
- New LCARdS branding and logo
- Updated installation instructions
- All examples use new naming
- Migration notice for existing users
- Link to migration guide

### 3. Updated CHANGELOG

**File**: `CHANGELOG.md`

**Add Entry**:
```markdown
## [2.1.0] - 2025-Q1

### 🎨 Project Renamed: LCARdS → LCARdS

LCARdS has been renamed to **LCARdS** to reflect its evolution from a custom-button-card extension to an independent LCARS card system.

**What This Means for You:**
- ✅ **No immediate action required** - Backward compatibility included for 12 months
- ⚠️ **Old names deprecated** - Console warnings will guide you to update
- 🔧 **Migration script available** - Automatic conversion of your dashboards
- 📅 **Removal in v3.0.0** (Q1 2026) - Update before then

**Name Changes:**
- Element names: `lcards-*` → `lcards-*`
- Global namespace: `window.lcards` → `window.lcards`
- Template keys: `lcards-*` → `lcards-*`
- Config variables: `lcards_*` → `lcards_*`

**See [Migration Guide](doc/migration/lcards-to-lcards.md)** for complete details.

### Added
- Native LitElement base class (`LCARdSNativeCard`)
- Custom-card-helpers integration for action handling
- MSD card now uses native architecture
- Instance GUID management system
- Preview mode detection and handling
- SVG source "none" support for overlay-only mode
- Backward compatibility layer for 12-month transition

### Changed
- **BREAKING (Developers)**: MSD card now extends `LCARdSNativeCard` instead of button-card
- **RENAMED**: All `LCARdS` → `LCARdS`
- **RENAMED**: All `lcards-*` → `lcards-*`
- **RENAMED**: Global namespace `window.lcards` → `window.lcards`
- Action handling now uses `custom-card-helpers` instead of button-card bridge
- Bundle size reduced by ~95KB
- Initial load time improved by ~20%

### Deprecated
- `window.lcards` namespace (use `window.lcards`)
- `lcards-*` element names (use `lcards-*`)
- `lcards_*` config variables (use `lcards_*`)
- `LCARdSBaseCard` (button-card wrapper) - still supported for v1 cards
- Legacy v1 cards will be migrated in future release
- **All deprecated items will be removed in v3.0.0 (Q1 2026)**

### Removed
- Custom-button-card dependency for MSD card
- Button-card action bridge pattern

### Migration Notes
- **Existing Users**: See [Migration Guide](doc/migration/lcards-to-lcards.md)
- **Developers**: See [Developer Migration Guide](doc/developer/native-architecture.md)
- **Legacy v1 Cards**: Still work via `LCARdSBaseCard` wrapper (no changes needed)
```

---

## 🎯 Definition of Done (Enhanced)

### Code Complete

- [ ] All source files renamed
- [ ] All class names updated
- [ ] All element names updated
- [ ] All global namespace references updated
- [ ] `LCARdSNativeCard.js` implemented and tested
- [ ] `LCARdSActionHandler.js` implemented and tested
- [ ] `lcards-msd.js` migrated to native base
- [ ] `ActionHelpers.js` updated
- [ ] All overlay renderers updated
- [ ] `lcards.js` entry point updated
- [ ] Backward compatibility layer working
- [ ] `package.json` updated
- [ ] `webpack.config.js` configured

### Tests Complete

- [ ] All unit tests passing (with new names)
- [ ] All integration tests passing
- [ ] Backward compatibility tests passing
- [ ] Rename completeness tests passing
- [ ] Manual testing checklist complete
- [ ] No console errors (except intended deprecation warnings)
- [ ] Performance tests show improvement
- [ ] Cross-browser testing complete
- [ ] Mobile app testing complete

### Documentation Complete

- [ ] README completely rewritten
- [ ] CHANGELOG updated with rename details
- [ ] Migration guide created
- [ ] All user docs updated
- [ ] All developer docs updated
- [ ] All API references updated
- [ ] All examples use new naming
- [ ] All screenshots updated
- [ ] JSDoc comments updated throughout

### External Updates Complete

- [ ] GitHub repository renamed
- [ ] HACS integration updated
- [ ] Website updated (if applicable)
- [ ] All external links updated
- [ ] Community announcement drafted
- [ ] Social media posts prepared

### Quality Gates Passed

- [ ] No breaking changes for users (backward compat works)
- [ ] Bundle size reduced by ≥90KB
- [ ] Load time improved by ≥20%
- [ ] Code coverage ≥80%
- [ ] All linting rules pass
- [ ] Deprecation warnings clear and helpful

### Deployment Ready

- [ ] GitHub release v2.1.0 created
- [ ] Release notes complete
- [ ] Version bumped (minor version)
- [ ] Build successful
- [ ] Production testing complete
- [ ] Migration script available
- [ ] Rollback plan documented

---

## 🚀 Automated Migration Script

**File**: `scripts/migrate-lcards-to-lcards.js`

```javascript
#!/usr/bin/env node

/**
 * LCARdS → LCARdS Migration Script
 * 
 * Automatically updates dashboard YAML files to use new LCARdS naming.
 * 
 * Usage:
 *   node migrate-lcards-to-lcards.js <file.yaml>
 *   node migrate-lcards-to-lcards.js /config/ui-lovelace.yaml
 * 
 * Creates: <file.yaml>.migrated
 * 
 * @example
 * node migrate-lcards-to-lcards.js dashboard.yaml
 */

const fs = require('fs');
const path = require('path');

// Color output helpers
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function migrateContent(content) {
    let migrated = content;
    let changes = 0;

    // Migration patterns
    const patterns = [
        // Element names
        { from: /lcards-msd-card/g, to: 'lcards-msd-card', desc: 'Element: lcards-msd-card → lcards-msd-card' },
        { from: /lcards-button-card/g, to: 'lcards-button-card', desc: 'Element: lcards-button-card → lcards-button-card' },
        { from: /lcards-elbow-card/g, to: 'lcards-elbow-card', desc: 'Element: lcards-elbow-card → lcards-elbow-card' },
        { from: /lcards-label-card/g, to: 'lcards-label-card', desc: 'Element: lcards-label-card → lcards-label-card' },
        { from: /lcards-double-elbow-card/g, to: 'lcards-double-elbow-card', desc: 'Element: lcards-double-elbow-card → lcards-double-elbow-card' },
        { from: /lcards-meter-card/g, to: 'lcards-meter-card', desc: 'Element: lcards-meter-card → lcards-meter-card' },
        { from: /lcards-picard-card/g, to: 'lcards-picard-card', desc: 'Element: lcards-picard-card → lcards-picard-card' },
        { from: /lcards-slider-card/g, to: 'lcards-slider-card', desc: 'Element: lcards-slider-card → lcards-slider-card' },
        { from: /lcards-base-card/g, to: 'lcards-base-card', desc: 'Element: lcards-base-card → lcards-base-card' },
        
        // Template keys
        { from: /lcards-msd:/g, to: 'lcards-msd:', desc: 'Template: lcards-msd → lcards-msd' },
        { from: /lcards-button-/g, to: 'lcards-button-', desc: 'Template: lcards-button-* → lcards-button-*' },
        { from: /lcards-elbow/g, to: 'lcards-elbow', desc: 'Template: lcards-elbow → lcards-elbow' },
        
        // Config variables
        { from: /lcards_card_type/g, to: 'lcards_card_type', desc: 'Config: lcards_card_type → lcards_card_type' },
        
        // Resource URLs
        { from: /\/hacsfiles\/cb-lcars\/cb-lcars\.js/g, to: '/hacsfiles/lcards/lcards.js', desc: 'Resource: cb-lcars.js → lcards.js' },
        { from: /\/local\/cb-lcars\.js/g, to: '/local/lcards.js', desc: 'Resource: cb-lcars.js → lcards.js' }
    ];

    patterns.forEach(pattern => {
        const matches = (migrated.match(pattern.from) || []).length;
        if (matches > 0) {
            migrated = migrated.replace(pattern.from, pattern.to);
            changes += matches;
            log(`  ✓ ${pattern.desc} (${matches} occurrence${matches > 1 ? 's' : ''})`, 'green');
        }
    });

    return { migrated, changes };
}

function main() {
    log('\n🚀 LCARdS → LCARdS Migration Script\n', 'bright');

    // Get input file
    const inputFile = process.argv[2];
    
    if (!inputFile) {
        log('❌ Error: No input file specified\n', 'red');
        log('Usage:', 'bright');
        log('  node migrate-lcards-to-lcards.js <file.yaml>\n');
        log('Example:', 'bright');
        log('  node migrate-lcards-to-lcards.js /config/ui-lovelace.yaml\n');
        process.exit(1);
    }

    // Check file exists
    if (!fs.existsSync(inputFile)) {
        log(`❌ Error: File not found: ${inputFile}\n`, 'red');
        process.exit(1);
    }

    log(`📄 Reading: ${inputFile}`, 'blue');

    // Read file
    const content = fs.readFileSync(inputFile, 'utf8');
    
    log(`🔍 Analyzing for LCARdS references...\n`, 'blue');

    // Migrate content
    const { migrated, changes } = migrateContent(content);

    if (changes === 0) {
        log('✅ No LCARdS references found - file is already up to date!\n', 'green');
        process.exit(0);
    }

    // Write migrated file
    const outputFile = inputFile + '.migrated';
    fs.writeFileSync(outputFile, migrated, 'utf8');

    log(`\n✅ Migration complete!`, 'green');
    log(`📊 Total changes: ${changes}`, 'yellow');
    log(`💾 Migrated file: ${outputFile}\n`, 'blue');

    log('Next steps:', 'bright');
    log('  1. Review the migrated file');
    log('  2. Backup your original file');
    log('  3. Replace original with migrated version');
    log('  4. Reload Home Assistant');
    log('  5. Clear browser cache\n');
}

main();
```

**Make executable**:
```bash
chmod +x scripts/migrate-lcards-to-lcards.js
```

**Usage**:
```bash
# Migrate dashboard
node scripts/migrate-lcards-to-lcards.js /config/ui-lovelace.yaml

# Review changes
diff /config/ui-lovelace.yaml /config/ui-lovelace.yaml.migrated

# Apply changes
cp /config/ui-lovelace.yaml.migrated /config/ui-lovelace.yaml
```

---

## 🎉 Conclusion

This enhanced proposal combines **two major initiatives** into a single coordinated release:

1. **🏗️ Native Architecture Migration**: Remove button-card dependency, use LitElement directly
2. **🎨 Project Rebrand**: LCARdS → LCARdS to reflect independent evolution

**Benefits of Combined Approach**:
- 🎯 **Single Major Version Bump**: One breaking change instead of two
- 📦 **95KB Smaller**: Performance improvement
- 🚀 **20% Faster Loading**: Better user experience
- 🎨 **Modern Branding**: Memorable, searchable, fun name
- 🛡️ **Backward Compatibility**: 12-month migration period
- 🔮 **Future-Ready**: Foundation for multi-instance, components, advanced features

**Zero User Impact** (with backward compatibility):
- ✅ Old element names work with warnings
- ✅ Old namespace aliased
- ✅ Migration script available
- ✅ 12-month transition period
- ✅ Clear upgrade path

**The timing is perfect**: We're already making foundational changes to the architecture. Adding the rebrand now creates a clean break from the legacy button-card naming while establishing LCARdS as the modern, independent LCARS card system for Home Assistant.

**Ready to begin implementation!** 🚀🎨

---

**End of Comprehensive Proposal + Rebrand - v2.0**
