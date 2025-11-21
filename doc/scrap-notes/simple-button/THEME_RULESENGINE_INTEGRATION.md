# Theme System Integration: RulesEngine + Experience Packs

**Date:** November 16, 2025
**Goal:** Integrate CB-LCARS theme switching with RulesEngine and Experience Pack system
**Related:** THEME_ALIGNMENT_PLAN.md, Core-AssetManager-v2.md, Core-ShapesManager-v2.md

---

## Executive Summary

This document describes how to integrate the CB-LCARS theme system with:
1. **RulesEngine** - For dynamic theme switching based on conditions
2. **Experience Packs** - For bundling themes + presets + rules together
3. **ThemeManager** - For managing active themes and token resolution

### Key Decisions

✅ **Per-card themes allowed** - Each card can specify its own theme
✅ **Global override via rules** - Rules can set global theme (higher priority)
✅ **Default to green-alert** - Or read from input_select if configured
✅ **Package in Experience Packs** - Bundle themes + presets + rules together

---

## 1. RulesEngine Extensions

### 1.1 Current RulesEngine `apply` Block

The RulesEngine currently supports:
```javascript
{
  id: 'my-rule',
  when: { /* conditions */ },
  apply: {
    overlays: { /* overlay patches */ },
    profiles_add: [],
    profiles_remove: [],
    animations: [],
    base_svg: 'source'
  }
}
```

### 1.2 Add Theme Actions

**New action types to add:**

```javascript
{
  id: 'theme-rule',
  when: { /* conditions */ },
  apply: {
    // NEW: Theme actions
    theme: {
      global: 'cb-lcars-red-alert',      // Set global theme
      scope: 'card',                      // or 'global', 'view'
      priority: 100                       // Higher = takes precedence
    },

    // EXISTING: Other actions still work
    overlays: { /* ... */ },
    animations: []
  }
}
```

### 1.3 Implementation: Extend RulesEngine

**File:** `src/core/rules/RulesEngine.js`

**Add to `evaluateRule()` method** (around line 606):

```javascript
if (matched && rule.apply) {
  // Existing apply logic...
  result.overlayPatches = this._resolveOverlaySelectors(rule.apply, contextOverlays);
  result.profilesAdd = rule.apply.profiles_add || [];
  result.profilesRemove = rule.apply.profiles_remove || [];
  result.animations = rule.apply.animations || [];
  result.baseSvgUpdate = rule.apply.base_svg || null;

  // NEW: Theme actions
  result.themeAction = rule.apply.theme || null;

  result.stopAfter = rule.stop === true;
}
```

**Add theme action handler** (new method):

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
      // Set global theme (affects all cards)
      themeManager.setGlobalTheme(themeName, priority);
      lcardsLog.debug(`[RulesEngine] Set global theme: ${themeName} (priority ${priority})`);
      break;

    case 'card':
      // Set per-card theme
      if (cardId) {
        themeManager.setCardTheme(cardId, themeName, priority);
        lcardsLog.debug(`[RulesEngine] Set card theme: ${cardId} → ${themeName} (priority ${priority})`);
      } else {
        lcardsLog.warn('[RulesEngine] Card scope theme action requires cardId');
      }
      break;

    case 'view':
      // Set view-level theme (future)
      lcardsLog.warn('[RulesEngine] View-level themes not yet implemented');
      break;

    default:
      lcardsLog.warn(`[RulesEngine] Unknown theme scope: ${scope}`);
  }
}
```

---

## 2. ThemeManager Extensions

### 2.1 Theme Priority System

**Priority Levels:**
```
1000+ = Rule-based (highest)
 500  = Card config (medium)
 100  = URL parameter
  50  = input_select entity
   1  = Default (green-alert)
```

### 2.2 Implementation: Theme Resolution

**File:** `src/core/themes/ThemeManager.js`

**Add priority-based theme management:**

```javascript
export class ThemeManager extends BaseService {
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

  /**
   * Set global theme with priority
   * @param {string} themeName - Theme to activate
   * @param {number} priority - Priority level (higher wins)
   */
  setGlobalTheme(themeName, priority = 100) {
    if (!this.hasTheme(themeName)) {
      lcardsLog.warn(`[ThemeManager] Theme not found: ${themeName}`);
      return false;
    }

    // Only update if higher priority
    if (priority >= this._globalTheme.priority) {
      this._globalTheme = { name: themeName, priority };

      // Persist to localStorage
      localStorage.setItem('lcards-global-theme', themeName);
      localStorage.setItem('lcards-global-theme-priority', String(priority));

      // Notify listeners
      this._notifyListeners('global', themeName);

      lcardsLog.info(`[ThemeManager] Global theme set: ${themeName} (priority ${priority})`);
      return true;
    } else {
      lcardsLog.debug(`[ThemeManager] Theme update rejected (priority ${priority} < ${this._globalTheme.priority})`);
      return false;
    }
  }

  /**
   * Set per-card theme with priority
   * @param {string} cardId - Card identifier
   * @param {string} themeName - Theme to activate
   * @param {number} priority - Priority level
   */
  setCardTheme(cardId, themeName, priority = 500) {
    if (!this.hasTheme(themeName)) {
      lcardsLog.warn(`[ThemeManager] Theme not found: ${themeName}`);
      return false;
    }

    const current = this._cardThemes.get(cardId);

    // Only update if higher priority
    if (!current || priority >= current.priority) {
      this._cardThemes.set(cardId, { name: themeName, priority });

      // Notify listeners for this card
      this._notifyListeners('card', themeName, cardId);

      lcardsLog.debug(`[ThemeManager] Card theme set: ${cardId} → ${themeName} (priority ${priority})`);
      return true;
    } else {
      lcardsLog.debug(`[ThemeManager] Card theme rejected for ${cardId} (priority ${priority} < ${current.priority})`);
      return false;
    }
  }

  /**
   * Get active theme for a card (respects priority)
   * @param {string} cardId - Card identifier
   * @returns {string} Active theme name
   */
  getActiveTheme(cardId = null) {
    // Priority order:
    // 1. Card-specific theme (if set)
    // 2. Global theme

    if (cardId) {
      const cardTheme = this._cardThemes.get(cardId);
      if (cardTheme) {
        return cardTheme.name;
      }
    }

    return this._globalTheme.name;
  }

  /**
   * Reset theme priority (allow lower priority themes to take over)
   * @param {string} scope - 'global' or card ID
   */
  resetThemePriority(scope = 'global') {
    if (scope === 'global') {
      this._globalTheme.priority = 1;  // Reset to default
      lcardsLog.debug('[ThemeManager] Global theme priority reset');
    } else {
      this._cardThemes.delete(scope);
      lcardsLog.debug(`[ThemeManager] Card theme cleared: ${scope}`);
    }
  }

  /**
   * Subscribe to theme changes
   * @param {Function} callback - (scope, themeName, cardId?) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  /**
   * Notify listeners of theme change
   * @private
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
   * Load themes from experience pack
   * @param {Object} pack - Experience pack
   */
  loadThemesFromPack(pack) {
    if (!pack.config?.themes) {
      lcardsLog.warn(`[ThemeManager] Pack has no themes: ${pack.id}`);
      return;
    }

    Object.entries(pack.config.themes).forEach(([themeId, themeDef]) => {
      this.registerTheme(themeId, themeDef);
    });

    lcardsLog.info(`[ThemeManager] Loaded ${Object.keys(pack.config.themes).length} themes from pack: ${pack.id}`);
  }

  /**
   * Register a single theme
   * @param {string} themeId - Theme identifier
   * @param {Object} themeDef - Theme definition
   */
  registerTheme(themeId, themeDef) {
    this.themes.set(themeId, themeDef);
    lcardsLog.debug(`[ThemeManager] Theme registered: ${themeId}`);
  }

  /**
   * Check if theme exists
   * @param {string} themeName - Theme name
   * @returns {boolean}
   */
  hasTheme(themeName) {
    return this.themes.has(themeName);
  }
}
```

---

## 3. Experience Pack Structure

### 3.1 Alert Mode Experience Pack

Each alert mode is a complete experience pack:

**File:** `src/core/packs/builtin/cb-lcars-green-alert.js`

```javascript
export default {
  // ===== METADATA =====
  id: 'cb-lcars-green-alert',
  name: 'CB-LCARS Green Alert',
  version: '1.0.0',
  author: 'CB-LCARS Team',
  description: 'Normal operations color palette with 7-shade progressions',

  // ===== DEPENDENCIES =====
  depends_on: ['builtin:core_assets'],

  // ===== CONFIGURATION =====
  config: {
    // Theme definitions
    themes: {
      'cb-lcars-green-alert': {
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
    },

    // Style presets (reference theme tokens)
    presets: {
      button: {
        lozenge: {
          name: 'Lozenge Button',
          extends: 'button.base',
          border: {
            radius: {
              top_left:     'theme:components.button.base.radius.full',
              top_right:    'theme:components.button.base.radius.full',
              bottom_left:  'theme:components.button.base.radius.full',
              bottom_right: 'theme:components.button.base.radius.full'
            }
          }
        },

        bullet: {
          name: 'Bullet Button',
          extends: 'button.lozenge',
          border: {
            radius: {
              top_left:     0,
              bottom_left:  0,
              top_right:    'theme:components.button.base.radius.full',
              bottom_right: 'theme:components.button.base.radius.full'
            }
          }
        }

        // ... more presets
      }
    },

    // Built-in rules for this pack
    rules: [
      {
        id: 'green-alert-from-input-select',
        name: 'Activate Green Alert from Input Select',
        description: 'Watch input_select.lcards_theme and activate green-alert when selected',
        enabled: false,  // User must enable

        config: {
          entity: 'input_select.lcards_theme'  // User can override
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
            priority: 50  // input_select priority
          }
        }
      },

      {
        id: 'green-alert-default',
        name: 'Default to Green Alert',
        description: 'Set green-alert as default theme on startup',
        enabled: true,  // Default enabled

        when: {
          type: 'startup'  // NEW: Special trigger type
        },

        apply: {
          theme: {
            global: 'cb-lcars-green-alert',
            scope: 'global',
            priority: 1  // Lowest priority (default)
          }
        }
      }
    ]
  }
};
```

### 3.2 Red Alert Experience Pack

**File:** `src/core/packs/builtin/cb-lcars-red-alert.js`

```javascript
export default {
  id: 'cb-lcars-red-alert',
  name: 'CB-LCARS Red Alert',
  version: '1.0.0',
  description: 'Emergency alert color palette - red spectrum',

  depends_on: ['builtin:core_assets'],

  config: {
    themes: {
      'cb-lcars-red-alert': {
        colors: {
          oranges: {
            'darkest':       '#8b0000',
            'dark':          '#a52a2a',
            'medium-dark':   '#b22222',
            'base':          '#dc143c',
            'medium-light':  '#ff0000',
            'light':         '#ff4500',
            'lightest':      '#ff6347'
          },
          grays: {
            'darkest':       '#8b0000',
            'dark':          '#a52a2a',
            'medium-dark':   '#b22222',
            'base':          '#dc143c',
            'medium-light':  '#ff0000',
            'light':         '#ff4500',
            'lightest':      '#ff7f50'
          },
          // ... rest of red spectrum colors
        },

        components: {
          button: {
            base: {
              // Inherits structure from green-alert
              // Colors auto-resolve to red spectrum
            }
          }
        }
      }
    },

    rules: [
      {
        id: 'red-alert-from-input-select',
        name: 'Activate Red Alert from Input Select',
        enabled: false,

        config: {
          entity: 'input_select.lcards_theme'
        },

        when: {
          all: [
            {
              type: 'state',
              entity: '${config.entity}',
              state: 'cb-lcars-red-alert'
            }
          ]
        },

        apply: {
          theme: {
            global: 'cb-lcars-red-alert',
            scope: 'global',
            priority: 50
          }
        }
      },

      {
        id: 'red-alert-from-alarm',
        name: 'Red Alert on Alarm Triggered',
        description: 'Switch to red alert when alarm is triggered',
        enabled: false,

        config: {
          entity: 'alarm_control_panel.home'
        },

        when: {
          all: [
            {
              type: 'state',
              entity: '${config.entity}',
              state: 'triggered'
            }
          ]
        },

        apply: {
          theme: {
            global: 'cb-lcars-red-alert',
            scope: 'global',
            priority: 1000  // HIGH: Emergency override
          }
        }
      }
    ]
  }
};
```

---

## 4. User Configuration

### 4.1 Enable Theme Rules

Users enable/configure rules in their pack configuration:

**File:** `config.yaml` (user's LCARdS config)

```yaml
lcards:
  packs:
    - builtin:cb-lcars-green-alert
    - builtin:cb-lcars-red-alert
    - builtin:cb-lcars-blue-alert
    - builtin:cb-lcars-yellow-alert

  rules:
    # Enable input_select theme switching
    green-alert-from-input-select:
      enabled: true
      config:
        entity: input_select.lcards_theme

    red-alert-from-input-select:
      enabled: true
      config:
        entity: input_select.lcards_theme

    # Enable alarm-based red alert
    red-alert-from-alarm:
      enabled: true
      config:
        entity: alarm_control_panel.home
```

### 4.2 Create Input Select Helper

**File:** `configuration.yaml` (Home Assistant)

```yaml
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
```

### 4.3 Card Configuration

**Per-card theme override:**

```yaml
type: custom:lcards-simple-button
entity: light.bedroom
theme: cb-lcars-red-alert  # This card always red (priority 500)
preset: lozenge
```

**Use global theme:**

```yaml
type: custom:lcards-simple-button
entity: light.kitchen
# No theme specified - uses global theme from rules
preset: lozenge
```

---

## 5. Priority Resolution Example

### Scenario: Multiple Theme Sources

```
1. Default: green-alert (priority 1)
2. input_select: blue-alert (priority 50)
3. Card config: red-alert (priority 500)
4. Alarm triggered: RED ALERT (priority 1000)
```

**Resolution:**
1. Card starts with **green-alert** (default, priority 1)
2. User selects blue-alert → **blue-alert** (priority 50)
3. Card with theme config stays **red-alert** (priority 500 > 50)
4. Alarm triggers → **ALL cards RED ALERT** (priority 1000 > 500)

**After alarm cleared:**
- Rules engine resets priority back to 50
- Cards return to **blue-alert** (from input_select)
- Cards with config return to **red-alert** (config priority)

---

## 6. Implementation Checklist

### Phase 1: RulesEngine Extensions (~2 hours)
- [ ] Add `theme` action to RulesEngine apply block
- [ ] Implement `_applyThemeAction()` method
- [ ] Add `startup` trigger type support
- [ ] Test rule-based theme switching

### Phase 2: ThemeManager Extensions (~2 hours)
- [ ] Add priority-based theme management
- [ ] Implement `setGlobalTheme()` / `setCardTheme()`
- [ ] Add `getActiveTheme()` resolution
- [ ] Implement subscribe/notify pattern
- [ ] Persist to localStorage

### Phase 3: Experience Packs (~3 hours)
- [ ] Create `cb-lcars-green-alert.js` pack
- [ ] Create `cb-lcars-red-alert.js` pack
- [ ] Create `cb-lcars-blue-alert.js` pack
- [ ] Create `cb-lcars-yellow-alert.js` pack
- [ ] Create `cb-lcars-black-alert.js` pack
- [ ] Create `cb-lcars-gray-alert.js` pack
- [ ] Add built-in rules to each pack

### Phase 4: Card Integration (~1 hour)
- [ ] Update button card to subscribe to theme changes
- [ ] Implement theme resolution (priority order)
- [ ] Add `theme` property to card config
- [ ] Test theme switching in dashboard

### Phase 5: Documentation (~1 hour)
- [ ] Document rule configuration
- [ ] Document priority system
- [ ] Create migration guide
- [ ] Add examples

**Total Effort:** ~9 hours

---

## 7. Testing Strategy

### Test Cases

1. **Default Theme**
   - Load dashboard → Should use green-alert
   - No rules enabled → Should use green-alert

2. **Input Select Theme**
   - Enable input_select rule
   - Change input_select → All cards update
   - Verify priority 50

3. **Card Config Override**
   - Set card theme: red-alert
   - Change input_select → Card stays red
   - Verify priority 500

4. **Emergency Override**
   - Trigger alarm → All cards red
   - Clear alarm → Cards return to previous
   - Verify priority 1000

5. **LocalStorage Persistence**
   - Set theme via input_select
   - Reload page → Theme persists
   - Verify from localStorage

---

## 8. Future Enhancements

### 8.1 Animated Theme Transitions
```javascript
apply: {
  theme: {
    global: 'cb-lcars-red-alert',
    transition: {
      duration: 1000,
      easing: 'ease-in-out'
    }
  }
}
```

### 8.2 Theme Conditions
```javascript
when: {
  all: [
    { time_between: ['22:00', '06:00'] }  // Night time
  ]
},
apply: {
  theme: { global: 'cb-lcars-gray-alert' }
}
```

### 8.3 View-Level Themes
```yaml
# Different theme per dashboard view
views:
  - path: engineering
    theme: cb-lcars-yellow-alert
  - path: bridge
    theme: cb-lcars-green-alert
```

---

## Summary

This architecture provides:
✅ **Rule-based theme switching** - Flexible conditions
✅ **Priority system** - Clear precedence order
✅ **Experience Packs** - Bundle themes + presets + rules
✅ **Per-card overrides** - Fine-grained control
✅ **Backward compatible** - Existing configs still work
✅ **User-friendly** - Simple input_select configuration

**Ready to implement!** 🚀
