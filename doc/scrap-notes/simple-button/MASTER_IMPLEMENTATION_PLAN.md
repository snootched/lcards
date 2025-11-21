# LCARdS Theme & Preset System - Master Implementation Plan

**Date:** November 16, 2025
**Version:** 1.0 - Consolidated Plan
**Status:** Ready for Implementation

---

## Executive Summary

This master plan consolidates three major initiatives into a cohesive implementation strategy:

1. **Button Presets** - Complete the 7 CB-LCARS button styles (lozenge, bullet, capped, picard, etc.)
2. **CB-LCARS Theme System** - Implement 6 alert modes with 210+ color definitions
3. **Experience Pack Integration** - Package themes + presets + rules together

**Total Estimated Effort:** 15-20 hours across 5 phases

**Key Decisions:**
- ✅ Use existing Experience Pack architecture (from Core-AssetManager-v2.md)
- ✅ Add custom SVG path support NOW (chevrons, trapezoids, etc.)
- ✅ Defer full ShapesManager to future (centralized library not needed yet)
- ✅ Extend RulesEngine for theme switching
- ✅ Priority-based theme resolution (card < input_select < rules)
- ✅ Start with green-alert as default

---

## Table of Contents

1. [What We're NOT Implementing (Yet)](#1-what-were-not-implementing-yet)
2. [What We ARE Implementing](#2-what-we-are-implementing)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Phases](#4-implementation-phases)
5. [Detailed Implementation Steps](#5-detailed-implementation-steps)
6. [Testing Strategy](#6-testing-strategy)
7. [Migration Guide](#7-migration-guide)
8. [File Changes Checklist](#8-file-changes-checklist)

---

## 1. What We're NOT Implementing (Yet)

### From Core-AssetManager-v2.md Proposal

**Deferring:**
- ❌ AssetManager singleton (fonts/SVGs work fine today)
- ❌ ExperiencePackLoader (we'll use simpler pack loading)
- ❌ Complex dependency resolution
- ❌ URL-based pack loading

**Why:** Current asset loading works. We only need the **pack structure** concept for organizing themes + presets + rules together.

---

### From Core-ShapesManager-v2.md Proposal

**Deferring:**
- ❌ Full ShapesManager singleton (centralized shape library)
- ❌ Multi-segment shapes with animation targets
- ❌ Parametric shape generation

**Implementing NOW:**
- ✅ Custom SVG path support in button card
- ✅ Presets can specify `custom_path` for chevrons, trapezoids, etc.

**Why:** We need custom path support for CB-LCARS shapes (chevrons, trapezoids), but we don't need a centralized shape library yet. Presets can embed custom paths directly. When we implement full ShapesManager later, we'll add shape references (e.g., `shape: 'voyager_chevron'` instead of embedding path).

---

## 2. What We ARE Implementing

### Phase 1: Button Presets + Custom Paths (~2.5 hours)
✅ Add 7 missing button preset definitions
✅ Add custom SVG path support to button card
✅ Use existing preset system (`LCARDS_BUTTONS_PACK`)
✅ Reference theme tokens for colors
✅ Forward-compatible with future ShapesManager

### Phase 2: CB-LCARS Color Palette (~3 hours)
✅ Create 6 alert mode theme definitions
✅ 210 total colors (6 modes × 5 families × 7 shades)
✅ Use existing theme token system

### Phase 3: RulesEngine Extensions (~2 hours)
✅ Add `theme` action to RulesEngine
✅ Implement priority-based theme resolution
✅ Add built-in theme switching rules

### Phase 4: Experience Pack Structure (~2 hours)
✅ Organize themes + presets + rules into packs
✅ Use simplified pack structure (no AssetManager)
✅ Create 6 alert mode packs

### Phase 5: Integration & Testing (~3 hours)
✅ Wire everything together
✅ Test all presets and themes
✅ Test custom path rendering
✅ Create migration guide

---

## 3. Architecture Overview

### 3.0 Custom Path Support (Bridge to Future ShapesManager)

**Current Implementation (Phase 1):**
```javascript
// Preset embeds custom SVG path directly
{
  button: {
    'picard-chevron': {
      custom_path: 'M 10,10 L 180,10 L 200,30 L 180,50 L 10,50 L 20,30 Z',
      width: 200,
      height: 60,
      backgroundColor: 'theme:colors.grays.medium-light'
    }
  }
}
```

**Future Implementation (ShapesManager):**
```javascript
// Shape registered in ShapesManager
ShapesManager.registerShape('voyager_chevron', {
  path: 'M 10,10 L 180,10 L 200,30 L 180,50 L 10,50 L 20,30 Z',
  viewBox: [0, 0, 200, 60],
  segments: [...]  // For animations
});

// Preset references shape
{
  button: {
    'picard-chevron': {
      shape: 'voyager_chevron',  // ← References ShapesManager
      backgroundColor: 'theme:colors.grays.medium-light'
    }
  }
}
```

**Migration Path:**
1. **Now:** Embed paths in presets → Works immediately
2. **Later:** Extract common paths to ShapesManager → Reusable across presets
3. **Future:** Add multi-segment paths → Animation support

**Why This Approach:**
- ✅ Get custom shapes working NOW (30 min implementation)
- ✅ No dependency on full ShapesManager system
- ✅ Forward-compatible (can migrate to shape references later)
- ✅ Simple for users (`custom_path: "..."` in preset)

---

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    LCARdS Core Systems                       │
│                                                              │
│  ┌──────────────────┐      ┌───────────────────┐          │
│  │  ThemeManager    │◄─────┤  RulesEngine      │          │
│  │  (Token system)  │      │  (with theme      │          │
│  │                  │      │   actions)        │          │
│  └──────┬───────────┘      └───────────────────┘          │
│         │                                                   │
│         │                  ┌───────────────────┐          │
│         │                  │  Experience Pack  │          │
│         └─────────────────►│  Loader           │          │
│                            │  (simplified)     │          │
│                            └─────────┬─────────┘          │
│                                      │                     │
│                                      ▼                     │
│              ┌────────────────────────────────┐           │
│              │   Experience Packs             │           │
│              │   (themes + presets + rules)   │           │
│              └────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
1. User Action (e.g., change input_select)
         ↓
2. RulesEngine evaluates conditions
         ↓
3. Rule matched → apply.theme action
         ↓
4. ThemeManager.setGlobalTheme(name, priority)
         ↓
5. ThemeManager notifies subscribers
         ↓
6. Cards re-render with new theme tokens
```

### 3.3 Theme Priority System

```
Priority Levels:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1000+ │ Rules: Emergency (alarm triggered)
━━━━━━┼━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 500  │ Card Config (theme: 'red-alert')
━━━━━━┼━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  50  │ Rules: input_select watcher
━━━━━━┼━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1  │ Default (green-alert)
━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resolution: Highest priority wins
```

---

## 4. Implementation Phases

### Phase 1: Button Presets + Custom Path Support (2.5 hours)

**Goal:** Add 7 missing button styles to `LCARDS_BUTTONS_PACK` + enable custom SVG path support

**Deliverables:**
- ✅ Custom path support in button card (forward-compatible with ShapesManager)
- ✅ `bullet` / `bullet-right` (half rounded)
- ✅ `capped` / `capped-right` (end cap)
- ✅ `picard` / `picard-right` (outlined)
- ✅ `picard-filled` / `picard-filled-right` (solid)
- ✅ `picard-filled-dense` variants
- ✅ `picard-icon` (compact icon-only)
- ✅ `square` (no rounding)

**Files Modified:**
- `src/cards/lcards-simple-button.js` (add custom path rendering)
- `src/core/packs/loadBuiltinPacks.js` (LCARDS_BUTTONS_PACK)

---

### Phase 2: CB-LCARS Color Palette (3 hours)

**Goal:** Create 6 alert mode theme definitions with complete color palettes

**Deliverables:**
- ✅ Green Alert theme (210 colors: 5 families × 7 shades + moonlight)
- ✅ Red Alert theme (all red spectrum)
- ✅ Blue Alert theme (all blue spectrum)
- ✅ Yellow Alert theme (amber/yellow spectrum)
- ✅ Black Alert theme (pure grayscale)
- ✅ Gray Alert theme (muted grayscale)

**Files Modified:**
- `src/core/packs/loadBuiltinPacks.js` (BUILTIN_THEMES_PACK)

---

### Phase 3: RulesEngine Extensions (2 hours)

**Goal:** Enable rule-based theme switching with priority system

**Deliverables:**
- ✅ `theme` action in RulesEngine apply block
- ✅ `_applyThemeAction()` method
- ✅ Priority-based theme management in ThemeManager
- ✅ Subscribe/notify pattern for theme changes
- ✅ Built-in rules for input_select watching

**Files Modified:**
- `src/core/rules/RulesEngine.js`
- `src/core/themes/ThemeManager.js`
- `src/core/packs/loadBuiltinPacks.js` (add built-in rules)

---

### Phase 4: Experience Pack Structure (2 hours)

**Goal:** Organize themes + presets + rules into cohesive packs

**Deliverables:**
- ✅ Pack structure definition (simplified from v2 proposal)
- ✅ 6 alert mode packs with themes + presets + rules
- ✅ Pack loader (simplified - no AssetManager needed)
- ✅ Pack registry for builtin packs

**Files Created:**
- `src/core/packs/builtin/cb-lcars-green-alert.js`
- `src/core/packs/builtin/cb-lcars-red-alert.js`
- `src/core/packs/builtin/cb-lcars-blue-alert.js`
- `src/core/packs/builtin/cb-lcars-yellow-alert.js`
- `src/core/packs/builtin/cb-lcars-black-alert.js`
- `src/core/packs/builtin/cb-lcars-gray-alert.js`
- `src/core/packs/PackLoader.js` (simplified)

---

### Phase 5: Integration & Testing (3 hours)

**Goal:** Wire everything together and validate

**Deliverables:**
- ✅ Cards subscribe to theme changes
- ✅ Theme resolution respects priority
- ✅ Test suite for all presets
- ✅ Test suite for theme switching
- ✅ Migration guide for users
- ✅ Documentation updates

**Files Modified:**
- `src/cards/lcards-simple-button.js`
- `src/core/lcards-core.js`
- `test/test-button-presets-complete.yaml` (NEW)

---

## 5. Detailed Implementation Steps

### PHASE 1: Button Presets + Custom Path Support

#### Step 1.1: Add Custom Path Support to Button Card

**File:** `src/cards/lcards-simple-button.js`

**Goal:** Allow presets to specify `custom_path` for completely custom SVG shapes (chevrons, trapezoids, etc.)

**Find:** `_generateButtonSvg()` method (around line 1850)

**Modify:** Check for custom_path before generating border path

**Add new method** (after `_generateComplexBorderPath`):

```javascript
/**
 * Check if button style uses custom SVG path
 * @private
 * @param {Object} style - Resolved button style
 * @returns {string|null} Custom path string or null
 */
_getCustomPath(style) {
    // Check for custom_path in style
    if (style.custom_path) {
        return style.custom_path;
    }

    // Check for path in border config (alternative location)
    if (style.border?.custom_path) {
        return style.border.custom_path;
    }

    return null;
}
```

**Modify** `_generateButtonBackground()` method:

```javascript
_generateButtonBackground(width, height, style) {
    const backgroundColor = this._getButtonColor(this._entityState, style);

    // NEW: Check for custom path first
    const customPath = this._getCustomPath(style);
    if (customPath) {
        return `<path
                    class="button-background"
                    d="${customPath}"
                    fill="${backgroundColor}"
                    style="pointer-events: all;"
                />`;
    }

    // Existing code for radius-based shapes...
    const border = style.border || {};
    // ... rest of existing method
}
```

**Action:** Add custom path rendering to button card (~30 minutes)

**Test:**
```javascript
// In preset:
test_chevron: {
  extends: 'button.base',
  custom_path: 'M 10,10 L 180,10 L 200,30 L 180,50 L 10,50 L 20,30 Z',
  width: 200,
  height: 60
}
```

---

#### Step 1.2: Review Current Preset Structure

**File:** `src/core/packs/loadBuiltinPacks.js`

**Current State:**
```javascript
const LCARDS_BUTTONS_PACK = {
  id: 'lcards_buttons',
  style_presets: {
    button: {
      base: { /* foundation */ },
      lozenge: { /* fully rounded */ },
      'lozenge-right': { /* fully rounded, icon right */ }
    }
  }
};
```

**Action:** Review lines 37-200 to understand current structure

---

#### Step 1.3: Add Missing Presets (with custom path examples)

**Add to `LCARDS_BUTTONS_PACK.style_presets.button`:**

```javascript
// Half rounded (bullet)
bullet: {
  extends: 'button.base',
  show_icon: true,
  border: {
    radius: {
      top_left: 0,
      bottom_left: 0,
      top_right: 'theme:components.button.base.radius.full',
      bottom_right: 'theme:components.button.base.radius.full'
    }
  },
  icon: {
    border: {
      left: { padding: 0, color: 'transparent' },
      right: { padding: '3px', color: 'theme:components.button.base.border.color' }
    }
  }
},

'bullet-right': {
  extends: 'button.bullet',
  text: {
    justify: 'left'
  },
  icon: {
    position: 'right',
    border: {
      left: { padding: '3px', color: 'theme:components.button.base.border.color' },
      right: { padding: '3px', color: 'transparent' }
    }
  }
},

// End cap (capped)
capped: {
  extends: 'button.base',
  show_icon: true,
  border: {
    radius: {
      top_left: 'theme:components.button.base.radius.full',
      bottom_left: 'theme:components.button.base.radius.full',
      top_right: 0,
      bottom_right: 0
    }
  },
  icon: {
    border: {
      left: { padding: 0, color: 'transparent' },
      right: { padding: '3px', color: 'theme:components.button.base.border.color' }
    }
  }
},

'capped-right': {
  extends: 'button.capped',
  text: {
    justify: 'left'
  },
  icon: {
    position: 'right',
    border: {
      left: { padding: '3px', color: 'theme:components.button.base.border.color' },
      right: { padding: '3px', color: 'transparent' }
    }
  }
},

// Picard outlined (transparent background)
picard: {
  extends: 'button.base',
  show_icon: false,
  background: {
    color: 'transparent'
  },
  border: {
    width: 4,
    radius: 0,
    color: 'theme:components.button.base.background.active'
  },
  text: {
    label: {
      font_size: 22,
      font_weight: 'normal',
      align_items: 'center',
      color: {
        active: 'theme:components.button.base.background.active',
        inactive: 'theme:components.button.base.background.inactive',
        unavailable: 'theme:components.button.base.background.unavailable'
      }
    }
  }
},

'picard-right': {
  extends: 'button.picard',
  text: {
    label: {
      justify: 'left'
    }
  }
},

// Picard filled (solid background, black text)
'picard-filled': {
  extends: 'button.base',
  show_icon: false,
  border: {
    width: 0,
    radius: 0
  },
  text: {
    label: {
      font_size: 22,
      font_weight: 'normal',
      align_items: 'center',
      padding: {
        top: 0,
        left: 10,
        right: 10,
        bottom: 5
      },
      color: {
        active: 'black',
        inactive: 'black',
        unavailable: 'black'
      }
    }
  }
},

'picard-filled-right': {
  extends: 'button.picard-filled',
  text: {
    label: {
      justify: 'left'
    }
  }
},

'picard-filled-dense': {
  extends: 'button.picard-filled',
  height: 50,
  min_height: 50
},

'picard-filled-dense-right': {
  extends: 'button.picard-filled-right',
  height: 50,
  min_height: 50
},

// Picard icon (compact, icon-only)
'picard-icon': {
  extends: 'button.picard-filled-dense',
  width: 40,
  height: 40,
  min_height: 40,
  show_icon: true,
  show_label: false,
  border: {
    radius: {
      top_left: 10,
      top_right: 10,
      bottom_left: 10,
      bottom_right: 10
    }
  },
  icon: {
    size: 30,
    border: {
      left: { width: 0 },
      right: { width: 0 }
    }
  }
},

// Square (no rounding)
square: {
  extends: 'button.base',
  show_icon: false,
  border: {
    radius: 0
  }
}
```

**Action:** Add all presets to `LCARDS_BUTTONS_PACK`

**Note:** All presets above use radius-based shapes. Custom paths can be added later:

```javascript
// FUTURE: Custom chevron shape
'picard-chevron': {
  extends: 'button.base',
  custom_path: 'M 10,10 L 180,10 L 200,30 L 180,50 L 10,50 L 20,30 Z',
  width: 200,
  height: 60,
  text: {
    label: {
      font_size: 22,
      color: { active: 'black', inactive: 'black', unavailable: 'black' }
    }
  }
},

// FUTURE: Custom trapezoid shape
'voyager-trapezoid': {
  extends: 'button.base',
  custom_path: 'M 30,10 L 170,10 L 190,50 L 10,50 Z',
  width: 200,
  height: 60
}
```

---

#### Step 1.4: Build and Test

```bash
npm run build
```

**Action:** Verify build succeeds, no errors

---

### PHASE 2: CB-LCARS Color Palette (3 hours)

#### Step 2.1: Add Green Alert Theme

**File:** `src/core/packs/loadBuiltinPacks.js`

**Add to `BUILTIN_THEMES_PACK.themes`:**

```javascript
'cb-lcars-green-alert': {
  name: 'CB-LCARS Green Alert',
  description: 'Normal operations - 7-shade color progression',

  colors: {
    oranges: {
      'darkest':       '#d91604',
      'dark':          '#ef1d10',
      'medium-dark':   '#e7442a',
      'base':          '#ff6753',
      'medium-light':  '#ff8470',
      'light':         '#ff977b',
      'lightest':      '#ffb399'
    },
    grays: {
      'darkest':       '#1e2229',
      'dark':          '#2f3749',
      'medium-dark':   '#52596e',
      'base':          '#6d748c',
      'medium-light':  '#9ea5ba',
      'light':         '#d2d5df',
      'lightest':      '#f3f4f7',
      'moonlight':     '#dfe1e8'
    },
    blues: {
      'darkest':       '#002241',
      'dark':          '#1c3c55',
      'medium-dark':   '#2a7193',
      'base':          '#37a6d1',
      'medium-light':  '#67caf0',
      'light':         '#93e1ff',
      'lightest':      '#00eeee'
    },
    greens: {
      'darkest':       '#0c2a15',
      'dark':          '#083717',
      'medium-dark':   '#095320',
      'base':          '#266239',
      'medium-light':  '#458359',
      'light':         '#80bb93',
      'lightest':      '#b8e0c1'
    },
    yellows: {
      'darkest':       '#70602c',
      'dark':          '#ac943b',
      'medium-dark':   '#d2bf50',
      'base':          '#f9ef97',
      'medium-light':  '#fffac9',
      'light':         '#e7e6de',
      'lightest':      '#f5f5dc'
    }
  },

  components: {
    button: {
      base: {
        background: {
          active:      'theme:colors.grays.medium-light',
          inactive:    'theme:colors.grays.dark',
          unavailable: 'theme:colors.grays.darkest'
        },
        text: {
          default: {
            color: {
              active:      'black',
              inactive:    'black',
              unavailable: 'black'
            }
          }
        },
        border: {
          color: 'black',
          width: 2
        },
        radius: {
          none:   0,
          small:  4,
          medium: 8,
          large:  12,
          full:   9999
        }
      }
    }
  }
}
```

**Action:** Add green alert theme

---

#### Step 2.2: Add Remaining Alert Themes

**Add 5 more themes** (red, blue, yellow, black, gray):

```javascript
'cb-lcars-red-alert': {
  name: 'CB-LCARS Red Alert',
  description: 'Emergency - red spectrum',
  colors: {
    oranges: {
      'darkest': '#8b0000', 'dark': '#a52a2a', 'medium-dark': '#b22222',
      'base': '#dc143c', 'medium-light': '#ff0000', 'light': '#ff4500', 'lightest': '#ff6347'
    },
    grays: {
      'darkest': '#8b0000', 'dark': '#a52a2a', 'medium-dark': '#b22222',
      'base': '#dc143c', 'medium-light': '#ff0000', 'light': '#ff4500', 'lightest': '#ff7f50'
    },
    blues: {
      'darkest': '#cd5c5c', 'dark': '#f08080', 'medium-dark': '#e9967a',
      'base': '#fa8072', 'medium-light': '#ffa07a', 'light': '#ff6347', 'lightest': '#ff4500'
    },
    greens: {
      'darkest': '#dc143c', 'dark': '#b22222', 'medium-dark': '#a52a2a',
      'base': '#8b0000', 'medium-light': '#ff0000', 'light': '#ff4500', 'lightest': '#ff6347'
    },
    yellows: {
      'darkest': '#8b0000', 'dark': '#a52a2a', 'medium-dark': '#b22222',
      'base': '#dc143c', 'medium-light': '#ff0000', 'light': '#ff4500', 'lightest': '#ff6347'
    }
  },
  components: { button: { base: { /* inherits from green-alert */ } } }
},

// Add: blue-alert, yellow-alert, black-alert, gray-alert
// (Same structure, different color values)
```

**Action:** Add all 6 alert mode themes (reference `src/cb-lcars-themes.yaml` for exact color values)

---

#### Step 2.3: Build and Test

```bash
npm run build
```

**Action:** Verify all themes load correctly

---

### PHASE 3: RulesEngine Extensions

#### Step 3.1: Add Theme Action to RulesEngine

**File:** `src/core/rules/RulesEngine.js`

**Find:** `evaluateRule()` method (around line 592-620)

**After:**
```javascript
result.profilesAdd = rule.apply.profiles_add || [];
result.profilesRemove = rule.apply.profiles_remove || [];
result.animations = rule.apply.animations || [];
result.baseSvgUpdate = rule.apply.base_svg || null;
```

**Add:**
```javascript
// NEW: Theme actions
result.themeAction = rule.apply.theme || null;
```

**Action:** Add theme action result to rule evaluation

---

#### Step 3.2: Add Theme Action Handler

**File:** `src/core/rules/RulesEngine.js`

**Add new method** (around line 700):

```javascript
/**
 * Apply theme action from rule result
 * @param {Object} themeAction - Theme action from rule.apply.theme
 * @param {string} cardId - Card identifier (for per-card themes)
 * @private
 */
_applyThemeAction(themeAction, cardId = null) {
  if (!themeAction) return;

  const themeManager = this._systemsManager?.core?.themeManager;
  if (!themeManager) {
    lcardsLog.warn('[RulesEngine] ThemeManager not available');
    return;
  }

  const scope = themeAction.scope || 'global';
  const themeName = themeAction.global || themeAction.theme;
  const priority = themeAction.priority || 0;

  switch (scope) {
    case 'global':
      themeManager.setGlobalTheme(themeName, priority);
      lcardsLog.debug(`[RulesEngine] Set global theme: ${themeName} (priority ${priority})`);
      break;

    case 'card':
      if (cardId) {
        themeManager.setCardTheme(cardId, themeName, priority);
        lcardsLog.debug(`[RulesEngine] Set card theme: ${cardId} → ${themeName} (priority ${priority})`);
      } else {
        lcardsLog.warn('[RulesEngine] Card scope theme action requires cardId');
      }
      break;

    default:
      lcardsLog.warn(`[RulesEngine] Unknown theme scope: ${scope}`);
  }
}
```

**Action:** Add theme action handler method

---

#### Step 3.3: Call Theme Action Handler

**File:** `src/core/rules/RulesEngine.js`

**Find:** Where rules are applied (in aggregateResults or card evaluation loop)

**Add:** Call to `_applyThemeAction()` when processing matched rules

**Action:** Wire theme action handler into rule execution

---

#### Step 3.4: Extend ThemeManager with Priority System

**File:** `src/core/themes/ThemeManager.js`

**Add to constructor:**

```javascript
constructor() {
  super();
  this.themes = new Map();

  // NEW: Multi-level theme state
  this._globalTheme = {
    name: 'cb-lcars-green-alert',
    priority: 1  // Default priority
  };

  this._cardThemes = new Map();  // cardId -> { name, priority }
  this._listeners = new Set();   // Theme change callbacks
}
```

**Add methods:**

```javascript
/**
 * Set global theme with priority
 */
setGlobalTheme(themeName, priority = 100) {
  if (!this.hasTheme(themeName)) {
    lcardsLog.warn(`[ThemeManager] Theme not found: ${themeName}`);
    return false;
  }

  if (priority >= this._globalTheme.priority) {
    this._globalTheme = { name: themeName, priority };
    localStorage.setItem('lcards-global-theme', themeName);
    localStorage.setItem('lcards-global-theme-priority', String(priority));
    this._notifyListeners('global', themeName);
    lcardsLog.info(`[ThemeManager] Global theme set: ${themeName} (priority ${priority})`);
    return true;
  } else {
    lcardsLog.debug(`[ThemeManager] Theme rejected (priority ${priority} < ${this._globalTheme.priority})`);
    return false;
  }
}

/**
 * Set per-card theme with priority
 */
setCardTheme(cardId, themeName, priority = 500) {
  if (!this.hasTheme(themeName)) {
    lcardsLog.warn(`[ThemeManager] Theme not found: ${themeName}`);
    return false;
  }

  const current = this._cardThemes.get(cardId);

  if (!current || priority >= current.priority) {
    this._cardThemes.set(cardId, { name: themeName, priority });
    this._notifyListeners('card', themeName, cardId);
    lcardsLog.debug(`[ThemeManager] Card theme set: ${cardId} → ${themeName} (priority ${priority})`);
    return true;
  } else {
    lcardsLog.debug(`[ThemeManager] Card theme rejected (priority ${priority} < ${current.priority})`);
    return false;
  }
}

/**
 * Get active theme for a card (respects priority)
 */
getActiveTheme(cardId = null) {
  if (cardId) {
    const cardTheme = this._cardThemes.get(cardId);
    if (cardTheme) {
      return cardTheme.name;
    }
  }
  return this._globalTheme.name;
}

/**
 * Subscribe to theme changes
 */
subscribe(callback) {
  this._listeners.add(callback);
  return () => this._listeners.delete(callback);
}

/**
 * Notify listeners
 */
_notifyListeners(scope, themeName, cardId = null) {
  this._listeners.forEach(callback => {
    try {
      callback(scope, themeName, cardId);
    } catch (error) {
      lcardsLog.error('[ThemeManager] Listener error:', error);
    }
  });
}

/**
 * Check if theme exists
 */
hasTheme(themeName) {
  return this.themes.has(themeName);
}
```

**Action:** Add priority-based theme management to ThemeManager

---

#### Step 3.5: Build and Test

```bash
npm run build
```

**Action:** Verify RulesEngine + ThemeManager changes compile

---

### PHASE 4: Experience Pack Structure

#### Step 4.1: Create Simplified Pack Structure

**File:** `src/core/packs/PackStructure.js` (NEW)

```javascript
/**
 * Experience Pack Structure (Simplified)
 *
 * No AssetManager needed - just themes + presets + rules
 */

export const PACK_STRUCTURE_V1 = {
  // Metadata
  id: 'string',
  name: 'string',
  version: 'string',
  author: 'string',
  description: 'string',

  // Dependencies (optional)
  depends_on: ['builtin:pack_id'],

  // Configuration (loaded by existing managers)
  config: {
    // Themes → ThemeManager
    themes: {
      'theme-id': {
        colors: {},
        components: {}
      }
    },

    // Presets → StylePresetManager
    presets: {
      button: {},
      text: {}
    },

    // Rules → RulesEngine
    rules: [
      {
        id: 'string',
        enabled: false,
        when: {},
        apply: {}
      }
    ]
  }
};
```

**Action:** Document simplified pack structure

---

#### Step 4.2: Create Green Alert Pack

**File:** `src/core/packs/builtin/cb-lcars-green-alert.js` (NEW)

```javascript
export default {
  id: 'cb-lcars-green-alert',
  name: 'CB-LCARS Green Alert',
  version: '1.0.0',
  author: 'CB-LCARS Team',
  description: 'Normal operations color palette',

  depends_on: [],

  config: {
    themes: {
      'cb-lcars-green-alert': {
        // ... full theme definition from Phase 2
      }
    },

    presets: {
      button: {
        // ... button presets from Phase 1
      }
    },

    rules: [
      {
        id: 'green-alert-from-input-select',
        name: 'Activate Green Alert from Input Select',
        enabled: false,
        config: {
          entity: 'input_select.lcards_theme'
        },
        when: {
          all: [
            {
              type: 'state',
              entity: '${config.entity}',
              state: 'cb-lcars-green-alert'
            }
          ]
        },
        apply: {
          theme: {
            global: 'cb-lcars-green-alert',
            scope: 'global',
            priority: 50
          }
        }
      },
      {
        id: 'green-alert-default',
        name: 'Default to Green Alert',
        enabled: true,
        when: {
          type: 'startup'
        },
        apply: {
          theme: {
            global: 'cb-lcars-green-alert',
            scope: 'global',
            priority: 1
          }
        }
      }
    ]
  }
};
```

**Action:** Create complete green alert pack

---

#### Step 4.3: Create Remaining Alert Packs

**Create 5 more pack files:**
- `src/core/packs/builtin/cb-lcars-red-alert.js`
- `src/core/packs/builtin/cb-lcars-blue-alert.js`
- `src/core/packs/builtin/cb-lcars-yellow-alert.js`
- `src/core/packs/builtin/cb-lcars-black-alert.js`
- `src/core/packs/builtin/cb-lcars-gray-alert.js`

**Action:** Create all 6 alert mode packs (same structure as green alert, different colors)

---

#### Step 4.4: Create Pack Registry

**File:** `src/core/packs/builtin/index.js` (NEW)

```javascript
import cbLcarsGreenAlert from './cb-lcars-green-alert.js';
import cbLcarsRedAlert from './cb-lcars-red-alert.js';
import cbLcarsBlueAlert from './cb-lcars-blue-alert.js';
import cbLcarsYellowAlert from './cb-lcars-yellow-alert.js';
import cbLcarsBlackAlert from './cb-lcars-black-alert.js';
import cbLcarsGrayAlert from './cb-lcars-gray-alert.js';

export const BUILTIN_PACKS = {
  'cb-lcars-green-alert': cbLcarsGreenAlert,
  'cb-lcars-red-alert': cbLcarsRedAlert,
  'cb-lcars-blue-alert': cbLcarsBlueAlert,
  'cb-lcars-yellow-alert': cbLcarsYellowAlert,
  'cb-lcars-black-alert': cbLcarsBlackAlert,
  'cb-lcars-gray-alert': cbLcarsGrayAlert
};

export function getBuiltinPack(id) {
  return BUILTIN_PACKS[id] || null;
}
```

**Action:** Create pack registry

---

#### Step 4.5: Create Simplified Pack Loader

**File:** `src/core/packs/PackLoader.js` (NEW)

```javascript
import { lcardsLog } from '../../utils/lcards-logging.js';
import { getBuiltinPack } from './builtin/index.js';

export class PackLoader {
  constructor(core) {
    this.core = core;
    this.loadedPacks = new Map();
  }

  async loadPack(packId) {
    lcardsLog.info(`[PackLoader] Loading pack: ${packId}`);

    // Get pack definition
    const pack = getBuiltinPack(packId);
    if (!pack) {
      lcardsLog.error(`[PackLoader] Pack not found: ${packId}`);
      return false;
    }

    // Load themes
    if (pack.config.themes) {
      Object.entries(pack.config.themes).forEach(([themeId, themeDef]) => {
        this.core.themeManager.registerTheme(themeId, themeDef);
      });
      lcardsLog.debug(`[PackLoader] Loaded ${Object.keys(pack.config.themes).length} themes from ${packId}`);
    }

    // Load presets
    if (pack.config.presets) {
      Object.entries(pack.config.presets).forEach(([type, presets]) => {
        Object.entries(presets).forEach(([name, preset]) => {
          this.core.stylePresetManager.registerPreset(type, name, preset, packId);
        });
      });
      lcardsLog.debug(`[PackLoader] Loaded presets from ${packId}`);
    }

    // Load rules
    if (pack.config.rules) {
      pack.config.rules.forEach(rule => {
        this.core.rulesManager.addRule(rule);
      });
      lcardsLog.debug(`[PackLoader] Loaded ${pack.config.rules.length} rules from ${packId}`);
    }

    this.loadedPacks.set(packId, pack);
    lcardsLog.info(`[PackLoader] ✅ Pack loaded: ${packId}`);
    return true;
  }

  isPackLoaded(packId) {
    return this.loadedPacks.has(packId);
  }
}
```

**Action:** Create simplified pack loader

---

#### Step 4.6: Wire Pack Loader into Core

**File:** `src/core/lcards-core.js`

**Add to constructor:**

```javascript
this.packLoader = null;
```

**Add to initialization:**

```javascript
// Initialize PackLoader
lcardsLog.info('[LCARdSCore] Initializing PackLoader...');
this.packLoader = new PackLoader(this);

// Load default packs
await this.packLoader.loadPack('cb-lcars-green-alert');
lcardsLog.info('[LCARdSCore] ✅ Default packs loaded');
```

**Action:** Wire pack loader into core initialization

---

#### Step 4.7: Build and Test

```bash
npm run build
```

**Action:** Verify pack system loads correctly

---

### PHASE 5: Integration & Testing

#### Step 5.1: Update Button Card for Theme Changes

**File:** `src/cards/lcards-simple-button.js`

**Add to constructor:**

```javascript
this._themeUnsubscribe = null;
```

**Add to `connectedCallback()`:**

```javascript
// Subscribe to theme changes
if (this._singletons?.themeManager) {
  this._themeUnsubscribe = this._singletons.themeManager.subscribe((scope, themeName, cardId) => {
    // Only re-render if global theme changed or this card's theme changed
    if (scope === 'global' || cardId === this._cardGuid) {
      lcardsLog.debug(`[LCARdSSimpleButtonCard] Theme changed: ${themeName}`);
      this.requestUpdate();
    }
  });
}
```

**Add to `disconnectedCallback()`:**

```javascript
// Unsubscribe from theme changes
if (this._themeUnsubscribe) {
  this._themeUnsubscribe();
  this._themeUnsubscribe = null;
}
```

**Action:** Make button card reactive to theme changes

---

#### Step 5.2: Create Test Configuration

**File:** `test/test-button-presets-complete.yaml` (NEW)

```yaml
type: grid
title: "CB-LCARS Button Preset Gallery"
cards:
  # Lozenge variants
  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: lozenge
    label: "Lozenge"

  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: lozenge-right
    label: "Lozenge Right"

  # Bullet variants
  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: bullet
    label: "Bullet"

  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: bullet-right
    label: "Bullet Right"

  # Capped variants
  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: capped
    label: "Capped"

  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: capped-right
    label: "Capped Right"

  # Picard variants
  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: picard
    label: "Picard Outline"

  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: picard-filled
    label: "Picard Filled"

  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: picard-icon
    icon: mdi:lightbulb

  - type: custom:lcards-simple-button
    entity: light.bedroom
    preset: square
    label: "Square"
```

**Action:** Create comprehensive test configuration

---

#### Step 5.3: Create Theme Switching Test

**File:** `test/test-theme-switching.yaml` (NEW)

```yaml
# Input Select Helper (add to configuration.yaml first)
# input_select:
#   lcards_theme:
#     name: "Bridge Alert Mode"
#     options:
#       - cb-lcars-green-alert
#       - cb-lcars-red-alert
#       - cb-lcars-blue-alert
#       - cb-lcars-yellow-alert
#       - cb-lcars-black-alert
#       - cb-lcars-gray-alert
#     initial: cb-lcars-green-alert

type: vertical-stack
cards:
  # Theme selector
  - type: entities
    title: "Theme Selection"
    entities:
      - input_select.lcards_theme

  # Test buttons
  - type: grid
    title: "Theme Test - Global"
    cards:
      - type: custom:lcards-simple-button
        entity: light.bedroom
        preset: lozenge
        label: "Uses Global Theme"

      - type: custom:lcards-simple-button
        entity: light.kitchen
        preset: bullet
        label: "Also Global"

  # Card-level override
  - type: grid
    title: "Theme Test - Card Override"
    cards:
      - type: custom:lcards-simple-button
        entity: light.bedroom
        preset: lozenge
        label: "Always Red"
        theme: cb-lcars-red-alert

      - type: custom:lcards-simple-button
        entity: light.kitchen
        preset: bullet
        label: "Always Blue"
        theme: cb-lcars-blue-alert
```

**Action:** Create theme switching test

---

#### Step 5.4: Manual Testing Checklist

**Test Cases:**

1. **Default Theme**
   - [ ] Dashboard loads with green-alert
   - [ ] All buttons use green-alert colors

2. **Input Select Switching**
   - [ ] Create input_select.lcards_theme
   - [ ] Enable green-alert-from-input-select rule
   - [ ] Change input_select → All cards update
   - [ ] Reload page → Theme persists

3. **Card Config Override**
   - [ ] Set card theme: red-alert
   - [ ] Change input_select → Card stays red
   - [ ] Other cards follow input_select

4. **All Presets**
   - [ ] Lozenge (fully rounded)
   - [ ] Bullet (half rounded)
   - [ ] Capped (end cap)
   - [ ] Picard (outline)
   - [ ] Picard-filled (solid)
   - [ ] Picard-icon (icon only)
   - [ ] Square (no rounding)

5. **All Themes**
   - [ ] Green Alert (default)
   - [ ] Red Alert (emergency)
   - [ ] Blue Alert (external threat)
   - [ ] Yellow Alert (caution)
   - [ ] Black Alert (stealth)
   - [ ] Gray Alert (muted)

6. **Custom Paths**
   - [ ] Test preset with custom_path (create test chevron preset)
   - [ ] Verify path renders correctly
   - [ ] Test that custom path respects width/height
   - [ ] Test that custom path works with theme colors

**Action:** Complete manual testing checklist

---

#### Step 5.5: Create Migration Guide

**File:** `doc/MIGRATION_GUIDE_THEMES_PRESETS.md` (NEW)

```markdown
# Migration Guide: CB-LCARS Themes & Presets

## Overview

This guide helps CB-LCARS users migrate to the new LCARdS theme and preset system.

## Button Preset Migration

### Old (CB-LCARS YAML Templates)
\```yaml
type: custom:button-card
template: lcards-button-lozenge
entity: light.bedroom
label: "Bedroom"
\```

### New (LCARdS Presets)
\```yaml
type: custom:lcards-simple-button
preset: lozenge
entity: light.bedroom
label: "Bedroom"
\```

## Preset Mapping

| CB-LCARS Template | LCARdS Preset | Notes |
|-------------------|---------------|-------|
| `lcards-button-lozenge` | `lozenge` | ✅ Identical |
| `lcards-button-lozenge-right` | `lozenge-right` | ✅ Identical |
| `lcards-button-bullet` | `bullet` | ✅ New |
| `lcards-button-bullet-right` | `bullet-right` | ✅ New |
| `lcards-button-capped` | `capped` | ✅ New |
| `lcards-button-capped-right` | `capped-right` | ✅ New |
| `lcards-button-picard` | `picard` | ✅ New |
| `lcards-button-picard-filled` | `picard-filled` | ✅ New |
| `lcards-button-picard-icon` | `picard-icon` | ✅ New |
| `lcards-button-square` | `square` | ✅ New |

## Theme System Setup

### Step 1: Create Input Select

Add to `configuration.yaml`:

\```yaml
input_select:
  lcards_theme:
    name: "Bridge Alert Mode"
    options:
      - cb-lcars-green-alert
      - cb-lcars-red-alert
      - cb-lcars-blue-alert
      - cb-lcars-yellow-alert
      - cb-lcars-black-alert
      - cb-lcars-gray-alert
    initial: cb-lcars-green-alert
    icon: mdi:palette
\```

### Step 2: Enable Theme Rules

Add to LCARdS configuration:

\```yaml
lcards:
  rules:
    green-alert-from-input-select:
      enabled: true
      config:
        entity: input_select.lcards_theme

    red-alert-from-input-select:
      enabled: true
      config:
        entity: input_select.lcards_theme

    # ... enable for all alert modes
\```

### Step 3: Use in Cards

\```yaml
# Uses global theme (from input_select)
type: custom:lcards-simple-button
preset: lozenge
entity: light.bedroom

# Card-specific theme override
type: custom:lcards-simple-button
preset: lozenge
entity: light.bedroom
theme: cb-lcars-red-alert  # Always red
\```

## Automation Examples

### Alarm-Based Red Alert

\```yaml
automation:
  - alias: "Red Alert on Alarm"
    trigger:
      - platform: state
        entity_id: alarm_control_panel.home
        to: "triggered"
    action:
      - service: input_select.select_option
        target:
          entity_id: input_select.lcards_theme
        data:
          option: cb-lcars-red-alert

  - alias: "Green Alert on Alarm Clear"
    trigger:
      - platform: state
        entity_id: alarm_control_panel.home
        to: "disarmed"
    action:
      - service: input_select.select_option
        target:
          entity_id: input_select.lcards_theme
        data:
          option: cb-lcars-green-alert
\```

## Troubleshooting

### Theme Not Changing

1. Check input_select exists
2. Verify rule is enabled in LCARdS config
3. Check browser console for errors
4. Reload dashboard

### Colors Wrong

1. Check active theme: `localStorage.getItem('lcards-global-theme')`
2. Verify theme is registered: Check console logs
3. Clear browser cache

## Support

For questions or issues, visit:
https://github.com/snootched/lcards/issues
```

**Action:** Create comprehensive migration guide

---

#### Step 5.6: Update Documentation

**Files to Update:**
- `README.md` - Add theme/preset information
- `doc/user-guide/BUTTON_PRESETS.md` - Document all presets
- `doc/user-guide/THEME_SYSTEM.md` - Document theme system

**Action:** Update all documentation

---

#### Step 5.7: Final Build and Test

```bash
npm run build
```

**Action:** Final build, verify everything works

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Not required for MVP** - Current approach is integration testing via dashboard

### 6.2 Integration Tests

**Manual testing via test configurations:**
- `test/test-button-presets-complete.yaml`
- `test/test-theme-switching.yaml`

### 6.3 Regression Tests

**Verify existing functionality still works:**
- [ ] Existing button card configs work
- [ ] MSD cards still work
- [ ] Theme tokens resolve correctly
- [ ] No breaking changes

---

## 7. Migration Guide

See: `doc/MIGRATION_GUIDE_THEMES_PRESETS.md` (created in Phase 5.5)

---

## 8. File Changes Checklist

### Modified Files

- [ ] `src/cards/lcards-simple-button.js` (custom path support + theme subscriptions)
- [ ] `src/core/packs/loadBuiltinPacks.js` (LCARDS_BUTTONS_PACK + themes)
- [ ] `src/core/rules/RulesEngine.js` (theme actions)
- [ ] `src/core/themes/ThemeManager.js` (priority system)
- [ ] `src/core/lcards-core.js` (pack loader initialization)
- [ ] `README.md` (documentation updates)

### New Files

- [ ] `src/core/packs/PackStructure.js` (pack structure docs)
- [ ] `src/core/packs/PackLoader.js` (simplified loader)
- [ ] `src/core/packs/builtin/index.js` (pack registry)
- [ ] `src/core/packs/builtin/cb-lcars-green-alert.js`
- [ ] `src/core/packs/builtin/cb-lcars-red-alert.js`
- [ ] `src/core/packs/builtin/cb-lcars-blue-alert.js`
- [ ] `src/core/packs/builtin/cb-lcars-yellow-alert.js`
- [ ] `src/core/packs/builtin/cb-lcars-black-alert.js`
- [ ] `src/core/packs/builtin/cb-lcars-gray-alert.js`
- [ ] `test/test-button-presets-complete.yaml`
- [ ] `test/test-theme-switching.yaml`
- [ ] `doc/MIGRATION_GUIDE_THEMES_PRESETS.md`
- [ ] `doc/user-guide/BUTTON_PRESETS.md`
- [ ] `doc/user-guide/THEME_SYSTEM.md`

---

## Summary

This consolidated plan provides a clear, step-by-step implementation path for:
✅ **Custom SVG path support** (chevrons, trapezoids - forward-compatible with ShapesManager)
✅ **7 button presets** (bullet, capped, picard variants, square)
✅ **6 alert mode themes** (210+ colors)
✅ **Rule-based theme switching** (priority system)
✅ **Experience pack structure** (simplified, no AssetManager)
✅ **Complete testing** (manual test configurations)
✅ **Migration guide** (for CB-LCARS users)

**Total Effort:** 15-20 hours (can be split across multiple sessions)

**Key Innovation:** Custom path support bridges current needs (get chevrons/trapezoids working) with future architecture (full ShapesManager with animations). Presets can use `custom_path` now, migrate to `shape: 'name'` references later.

**Ready to implement Phase 1!** 🚀
