# Theme & Preset Alignment Plan - CB-LCARS Migration

**Date:** November 16, 2025
**Goal:** Align LCARdS theme tokens and button presets with HA-LCARS theme and CB-LCARS customizations

---

## Analysis Summary

### 1. **HA-LCARS Theme Structure**

The HA-LCARS theme provides:
- **72+ LCARS color variables** (lcars-space-white, lcars-violet, lcars-orange, etc.)
- **Picard S1 colors** (dunkelgrau, mittelgrau, hellgrau, feuerrot, mango)
- **Multiple theme variants** (Default, Classic, Nemesis, Lower Decks, Romulus, Picard, etc.)
- **CB-LCARS custom theme** at end of file with "Picard-era" colors

### 2. **CB-LCARS Color Palette** (Complete Structure)

**Alert Modes with 7-Shade Progressions:**

Your color system uses **6 alert modes** × **5 color families** × **7 shades** = 210 total colors!

#### **Green Alert (Normal Operations)** - Default
```yaml
oranges:
  picard-darkest-orange:       #d91604
  picard-dark-orange:          #ef1d10
  picard-medium-dark-orange:   #e7442a
  picard-orange:               #ff6753  ← Base/Reference
  picard-medium-light-orange:  #ff8470
  picard-light-orange:         #ff977b
  picard-lightest-orange:      #ffb399

grays:
  picard-darkest-gray:         #1e2229  ← Unavailable
  picard-dark-gray:            #2f3749  ← Inactive/Off
  picard-medium-dark-gray:     #52596e
  picard-gray:                 #6d748c
  picard-medium-light-gray:    #9ea5ba  ← Active/On
  picard-light-gray:           #d2d5df
  picard-lightest-gray:        #f3f4f7
  picard-moonlight:            #dfe1e8  ← Special accent

blues:
  picard-darkest-blue:         #002241
  picard-dark-blue:            #1c3c55
  picard-medium-dark-blue:     #2a7193
  picard-blue:                 #37a6d1
  picard-medium-light-blue:    #67caf0
  picard-light-blue:           #93e1ff
  picard-lightest-blue:        #00eeee

greens:
  picard-darkest-green:        #0c2a15
  picard-dark-green:           #083717
  picard-medium-dark-green:    #095320
  picard-green:                #266239
  picard-medium-light-green:   #458359
  picard-light-green:          #80bb93
  picard-lightest-green:       #b8e0c1

yellows:
  picard-darkest-yellow:       #70602c
  picard-dark-yellow:          #ac943b
  picard-medium-dark-yellow:   #d2bf50
  picard-yellow:               #f9ef97
  picard-medium-light-yellow:  #fffac9
  picard-light-yellow:         #e7e6de
  picard-lightest-yellow:      #f5f5dc
```

#### **Other Alert Modes:**
- **Red Alert** - All colors shift to red spectrum (#8b0000 → #ff6347)
- **Blue Alert** - All colors shift to blue spectrum (#00008b → #b0e0e6)
- **Yellow Alert** - All colors shift to yellow/amber spectrum (#8b4513 → #ffec8b)
- **Black Alert** - Pure grayscale (#0d0d0d → #999999)
- **Gray Alert** - Muted grayscale (#2b2b2b → #8b8b8b)

**State Color Mapping (Green Alert - Default):**
- **Active/On:** `picard-medium-light-gray` (#9ea5ba)
- **Inactive/Off:** `picard-dark-gray` (#2f3749)
- **Unavailable:** `picard-darkest-gray` (#1e2229)

### 3. **CB-LCARS Button Presets Analyzed**

From the YAML templates, here are the button styles:

#### **lcards-button-lozenge** (Fully Rounded)
```yaml
border:
  top: { left_radius: full, right_radius: full }
  bottom: { left_radius: full, right_radius: full }
icon:
  border:
    left: { padding: 0px }
    right: { padding: 3px, color: black }
text:
  justify: right
  align_items: end
```

#### **lcards-button-lozenge-right** (Icon on Right)
```yaml
extends: lozenge
text:
  justify: left
icon:
  justify: right
  border:
    left: { padding: 3px, color: black }
    right: { padding: 3px, color: transparent }
```

#### **lcards-button-bullet** (Half Rounded - Left)
```yaml
extends: lozenge
border:
  top: { left_radius: 0, right_radius: full }
  bottom: { left_radius: 0, right_radius: full }
```

#### **lcards-button-bullet-right** (Half Rounded - Right)
```yaml
extends: lozenge-right
border:
  top: { right_radius: 0, left_radius: full }
  bottom: { right_radius: 0, left_radius: full }
```

#### **lcards-button-capped** (End Cap - Left)
```yaml
extends: lozenge
border:
  top: { right_radius: 0, left_radius: full }
  bottom: { right_radius: 0, left_radius: full }
```

#### **lcards-button-capped-right** (End Cap - Right)
```yaml
extends: lozenge-right
border:
  top: { left_radius: 0, right_radius: full }
  bottom: { left_radius: 0, right_radius: full }
```

#### **lcards-button-picard** (Outlined - No Fill)
```yaml
background: transparent
border:
  top: 4px
  left: 4px
  right: 4px
  bottom: 4px
text:
  color: border-color (matches button state)
  font_size: 22px
  font_weight: normal
  align_items: center
icon:
  color: border-color (matches button state)
```

#### **lcards-button-picard-filled** (Solid - With Fill)
```yaml
extends: button-base (has solid background)
text:
  color: black (always)
  font_size: 22px
  font_weight: normal
  align_items: center
icon:
  color: black (always)
```

#### **lcards-button-picard-icon** (Compact Icon-Only)
```yaml
extends: picard-filled-dense
size: 40x40px
border_radius: 10px
show_icon: true
show_label: false
```

#### **lcards-button-square** (No Rounding)
```yaml
extends: button-base
show_icon: false
border_radius: 0
```

### 4. **Key Differences from Current Implementation**

**What we have now (in loadBuiltinPacks.js):**
- ✅ `lozenge` - Fully rounded
- ✅ `lozenge-right` - Icon right
- ❌ Missing all other presets

**What we need to add:**
1. `bullet` / `bullet-right`
2. `capped` / `capped-right`
3. `picard` / `picard-right` (outlined)
4. `picard-filled` / `picard-filled-right`
5. `picard-filled-dense` / `picard-filled-dense-right`
6. `picard-icon`
7. `square` (no rounding)

---

## Theme Token Alignment Strategy

### Current Theme Structure (Our System)
```
components.button.base:
  font:
    family: "'LCARS', 'Antonio', sans-serif"
    size:
      normal: 14px
      small: 12px
      large: 16px
    weight:
      normal: bold
      light: normal
    transform: uppercase
  background:
    active: theme color
    inactive: theme color
    unavailable: theme color
  text:
    default:
      color:
        active: black
        inactive: black
        unavailable: black
  border:
    color: black
    width: 2px
  radius:
    none: 0px
    small: 4px
    medium: 8px
    large: 12px
    full: 9999px
```

### Proposed Alignment with CB-LCARS

**Implement Full CB-LCARS Color System:**

```javascript
// In BUILTIN_THEMES_PACK
themes: {
  'green-alert': {  // Default theme
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
            active:      'theme:colors.grays.medium-light',      // #9ea5ba
            inactive:    'theme:colors.grays.dark',              // #2f3749
            unavailable: 'theme:colors.grays.darkest',           // #1e2229
          },
          text: {
            default: {
              color: {
                active:      'black',
                inactive:    'black',
                unavailable: 'black',
              }
            }
          },
          border: {
            color: 'black',
            width: 2,
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
  },

  'red-alert': {
    colors: {
      // All 5 families with red-shifted spectrum
      oranges: { /* ... red spectrum ... */ },
      grays: { /* ... red spectrum ... */ },
      blues: { /* ... coral/salmon spectrum ... */ },
      greens: { /* ... red spectrum ... */ },
      yellows: { /* ... red spectrum ... */ }
    },
    components: {
      button: {
        base: {
          // Inherits from green-alert, colors auto-resolve
        }
      }
    }
  },

  'blue-alert': { /* ... */ },
  'yellow-alert': { /* ... */ },
  'black-alert': { /* ... */ },
  'gray-alert': { /* ... */ }
}
```

**Backward Compatibility Aliases:**
```javascript
// Support old HA-LCARS variable names
colors: {
  'picard-darkest-gray':       'theme:colors.grays.darkest',
  'picard-dark-gray':          'theme:colors.grays.dark',
  'picard-medium-light-gray':  'theme:colors.grays.medium-light',
  'card-button':               'theme:colors.grays.medium-light',
  'card-button-off':           'theme:colors.grays.dark',
  'card-button-unavailable':   'theme:colors.grays.darkest',
}
```

---

## Implementation Plan

### Phase 1: Add Missing Button Presets (~2 hours)

**Update `src/core/packs/loadBuiltinPacks.js` → `LCARDS_BUTTONS_PACK`**

Add 7 new button presets with proper border radius configurations:

```javascript
style_presets: {
  button: {
    base: { /* existing */ },
    lozenge: { /* existing */ },
    'lozenge-right': { /* existing */ },

    // NEW: Bullet buttons (half rounded)
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
      }
    },

    'bullet-right': {
      extends: 'button.bullet',
      text: { justify: 'left' },
      icon: {
        position: 'right',
        border: {
          left: { padding: '3px', color: 'theme:components.button.base.border.color' },
          right: { padding: '3px', color: 'transparent' }
        }
      }
    },

    // NEW: Capped buttons (end cap)
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
      }
    },

    'capped-right': {
      extends: 'button.capped',
      text: { justify: 'left' },
      icon: {
        position: 'right',
        border: {
          left: { padding: '3px', color: 'theme:components.button.base.border.color' },
          right: { padding: '3px', color: 'transparent' }
        }
      }
    },

    // NEW: Picard outlined (transparent background)
    picard: {
      extends: 'button.base',
      show_icon: false,
      background_color: 'transparent',
      border: {
        width: 4,
        color: 'theme:components.button.base.background.active', // Border uses button color
        radius: 0
      },
      text: {
        label: {
          color: {
            active: 'theme:components.button.base.background.active',
            inactive: 'theme:components.button.base.background.inactive',
            unavailable: 'theme:components.button.base.background.unavailable'
          },
          font_size: 22,
          font_weight: 'normal',
          align_items: 'center'
        }
      }
    },

    'picard-right': {
      extends: 'button.picard',
      text: { label: { justify: 'left' } }
    },

    // NEW: Picard filled (solid background, black text)
    'picard-filled': {
      extends: 'button.base',
      show_icon: false,
      border: {
        width: 0,
        radius: 0
      },
      text: {
        label: {
          color: {
            active: 'black',
            inactive: 'black',
            unavailable: 'black'
          },
          font_size: 22,
          font_weight: 'normal',
          align_items: 'center',
          padding: {
            top: 0,
            left: 10,
            right: 10,
            bottom: 5
          }
        }
      }
    },

    'picard-filled-right': {
      extends: 'button.picard-filled',
      text: { label: { justify: 'left' } }
    },

    'picard-filled-dense': {
      extends: 'button.picard-filled',
      height: 50
    },

    'picard-filled-dense-right': {
      extends: 'button.picard-filled-right',
      height: 50
    },

    // NEW: Picard icon (compact, icon-only)
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

    // NEW: Square (no rounding)
    square: {
      extends: 'button.base',
      show_icon: false,
      border: {
        radius: 0
      }
    }
  }
}
```

### Phase 2: Add CB-LCARS Color Palette (~2 hours)

**Update `src/core/packs/loadBuiltinPacks.js` → `BUILTIN_THEMES_PACK`**

Implement the complete CB-LCARS color system with all 6 alert modes:

**Structure:**
```javascript
const BUILTIN_THEMES_PACK = {
  themes: {
    'cb-lcars-green-alert': {  // Default - make this the default theme
      colors: {
        oranges: {
          darkest: '#d91604', dark: '#ef1d10', 'medium-dark': '#e7442a',
          base: '#ff6753', 'medium-light': '#ff8470', light: '#ff977b', lightest: '#ffb399'
        },
        grays: {
          darkest: '#1e2229', dark: '#2f3749', 'medium-dark': '#52596e',
          base: '#6d748c', 'medium-light': '#9ea5ba', light: '#d2d5df',
          lightest: '#f3f4f7', moonlight: '#dfe1e8'
        },
        blues: {
          darkest: '#002241', dark: '#1c3c55', 'medium-dark': '#2a7193',
          base: '#37a6d1', 'medium-light': '#67caf0', light: '#93e1ff', lightest: '#00eeee'
        },
        greens: {
          darkest: '#0c2a15', dark: '#083717', 'medium-dark': '#095320',
          base: '#266239', 'medium-light': '#458359', light: '#80bb93', lightest: '#b8e0c1'
        },
        yellows: {
          darkest: '#70602c', dark: '#ac943b', 'medium-dark': '#d2bf50',
          base: '#f9ef97', 'medium-light': '#fffac9', light: '#e7e6de', lightest: '#f5f5dc'
        }
      },
      components: {
        button: {
          base: {
            background: {
              active: 'theme:colors.grays.medium-light',
              inactive: 'theme:colors.grays.dark',
              unavailable: 'theme:colors.grays.darkest'
            },
            text: {
              default: { color: { active: 'black', inactive: 'black', unavailable: 'black' } }
            },
            border: { color: 'black', width: 2 },
            radius: { none: 0, small: 4, medium: 8, large: 12, full: 9999 }
          }
        }
      }
    },

    'cb-lcars-red-alert': {
      colors: {
        oranges: {
          darkest: '#8b0000', dark: '#a52a2a', 'medium-dark': '#b22222',
          base: '#dc143c', 'medium-light': '#ff0000', light: '#ff4500', lightest: '#ff6347'
        },
        grays: {
          darkest: '#8b0000', dark: '#a52a2a', 'medium-dark': '#b22222',
          base: '#dc143c', 'medium-light': '#ff0000', light: '#ff4500', lightest: '#ff7f50'
        },
        blues: {
          darkest: '#cd5c5c', dark: '#f08080', 'medium-dark': '#e9967a',
          base: '#fa8072', 'medium-light': '#ffa07a', light: '#ff6347', lightest: '#ff4500'
        },
        greens: {
          darkest: '#dc143c', dark: '#b22222', 'medium-dark': '#a52a2a',
          base: '#8b0000', 'medium-light': '#ff0000', light: '#ff4500', lightest: '#ff6347'
        },
        yellows: {
          darkest: '#8b0000', dark: '#a52a2a', 'medium-dark': '#b22222',
          base: '#dc143c', 'medium-light': '#ff0000', light: '#ff4500', lightest: '#ff6347'
        }
      },
      components: { /* inherits from green-alert */ }
    },

    'cb-lcars-blue-alert': { /* ... full blue spectrum ... */ },
    'cb-lcars-yellow-alert': { /* ... full yellow/amber spectrum ... */ },
    'cb-lcars-black-alert': { /* ... pure grayscale ... */ },
    'cb-lcars-gray-alert': { /* ... muted grayscale ... */ }
  }
};
```

**Implementation Notes:**
- Load all colors from your `cb-lcars-themes.yaml` file
- Make `cb-lcars-green-alert` the default theme
- All themes share the same `components.button.base` structure
- Colors auto-resolve based on active theme

### Phase 3: Theme Switching System (~1 hour)

**Add theme switching capability** so users can switch between alert modes:

**Option 1: Via Configuration**
```yaml
type: custom:lcards-simple-button
theme: cb-lcars-red-alert  # Switch to red alert colors
preset: lozenge
```

**Option 2: Via Service Call** (for dynamic switching)
```javascript
// User creates automation to switch themes
service: lcards.set_theme
data:
  theme: cb-lcars-red-alert
```

**Implementation:**
- Theme selection stored in singleton
- All cards auto-refresh when theme changes
- Theme persists across page reloads (localStorage)
- Default theme: `cb-lcars-green-alert`

### Phase 4: Documentation & Migration Guide (~30 min)

**Create migration guide** for CB-LCARS users:

```markdown
# CB-LCARS to LCARdS Migration Guide

## Button Preset Mapping

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

## Color Token Migration

| CB-LCARS Variable | LCARdS Token |
|-------------------|--------------|
| `--lcars-card-button` | `theme:colors.picard.light-gray` |
| `--lcars-card-button-off` | `theme:colors.picard.dark-gray` |
| `--lcars-card-button-unavailable` | `theme:colors.picard.darkest-gray` |
| `--picard-medium-light-gray` | `theme:colors.picard.light-gray` |
| `--picard-dark-gray` | `theme:colors.picard.dark-gray` |
| `--picard-darkest-gray` | `theme:colors.picard.darkest-gray` |
```

---

## Testing Strategy

### Test Matrix

Create test file: `test/test-button-presets-complete.yaml`

```yaml
type: custom:lcards-simple-button
cards:
  # Test all button presets
  - preset: lozenge
    label: "Lozenge"
  - preset: lozenge-right
    label: "Lozenge Right"
  - preset: bullet
    label: "Bullet"
  - preset: bullet-right
    label: "Bullet Right"
  - preset: capped
    label: "Capped"
  - preset: capped-right
    label: "Capped Right"
  - preset: picard
    label: "Picard Outline"
  - preset: picard-right
    label: "Picard Right"
  - preset: picard-filled
    label: "Picard Filled"
  - preset: picard-filled-right
    label: "Picard Filled Right"
  - preset: picard-filled-dense
    label: "Dense"
  - preset: picard-icon
    icon: mdi:lightbulb
  - preset: square
    label: "Square"
```

**Test each preset with:**
1. Active state (entity on)
2. Inactive state (entity off)
3. Unavailable state
4. With icon / without icon
5. With multi-text labels

---

## Timeline

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1 | Add missing button presets (7 styles) | 2 hrs | 🔴 High |
| 2 | Add CB-LCARS color palette (6 alert modes) | 2 hrs | 🔴 High |
| 3 | Theme switching system | 1 hr | 🟡 Medium |
| 4 | Documentation & migration guide | 30 min | 🟡 Medium |

**Total Estimated Effort:** ~5.5 hours

---

## Key Decisions

### 1. **Backward Compatibility**
- ✅ Keep existing `lozenge` and `lozenge-right` unchanged
- ✅ Add aliases for CB-LCARS color variables
- ✅ Support both old and new token names

### 2. **Text Layout Standardization**
- **CB-LCARS had:** Complex padding/alignment per preset
- **LCARdS will use:** Multi-text system for flexible layouts
- **Users can override:** Text positions via `text:` config

### 3. **Icon Borders**
- **CB-LCARS had:** Icon divider borders built into templates
- **LCARdS will use:** Icon configuration with border options
- **Already supported:** `icon.border.left/right` in current system

### 4. **State-Based Styling**
- **CB-LCARS had:** State rules in YAML templates
- **LCARdS will use:** Built-in state detection in button card
- **Already implemented:** `_getButtonState()` method

---

## Next Steps

1. ✅ **Review this plan** - Get feedback on approach
2. 🔲 **Implement Phase 1** - Add missing button presets
3. 🔲 **Implement Phase 2** - Add Picard theme tokens
4. 🔲 **Create test file** - Comprehensive preset testing
5. 🔲 **Build and test** - Verify all presets work
6. 🔲 **Phase 3 & 4** - Full LCARS palette and docs (optional)

Ready to start implementation? 🚀
