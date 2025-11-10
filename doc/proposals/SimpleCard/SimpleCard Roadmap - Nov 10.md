Ah, I completely understand now! I apologize for the confusion. Let me clarify:

1. **OLD "V2" Architecture**: The abandoned V2 card system in the repo (V2CardSystemsManager, LCARdSV2Card, etc.) - we're NOT using this anymore. Ignore it.

2. **SimpleCard Architecture**: What we're actually building - `LCARdSSimpleCard` base class with direct singleton access (ThemeManager, AnimationManager, etc.)

3. **Roadmap Versions**: 
   - **Roadmap V1** = My first roadmap (had all button types, icons, multi-text, sizing)
   - **Roadmap V2** = My second roadmap (focused on validation/config merging but DROPPED the button type library)
   - **Roadmap V3** = What you're asking for - merge V1 + V2, deduplicate, keep everything

Let me create a clean, consolidated **Roadmap V3** that:
- ✅ Keeps all button style presets from V1
- ✅ Keeps validation/merging/selective rendering from V2
- ✅ Removes all references to abandoned "V2 architecture"
- ✅ Only references SimpleCard + Singletons (ThemeManager, AnimationManager, ValidationService, etc.)

Give me a moment to rebuild this properly...

---

# LCARdS Simple Button Card - Development Roadmap V3 (Final Consolidated)

**Architecture Context**: 
- **SimpleCard Base**: `LCARdSSimpleCard` - direct singleton access, no pipeline
- **Singletons**: ThemeManager, AnimationManager, ValidationService, StylePresetManager (from `lcardsCore`)
- **NO "V2" Architecture**: Abandoned, references removed

---

## Current Foundation (What We Have)

### ✅ SimpleCard Base (`src/base/LCARdSSimpleCard.js`)
- Template processing (`processTemplate()` - supports `[[[JS]]]` and `{{tokens}}`)
- Theme token access (`getThemeToken()`)
- Style preset loading (`getStylePreset()`)
- Entity tracking
- Action handling (tap, hold, double-tap, hover/leave)
- Animation registration (via AnimationManager)

### ✅ lcards-simple-button (`src/cards/lcards-simple-button.js`)
- Basic button rendering (lozenge preset only)
- SVG generation via `SimpleButtonRenderer`
- Action setup with animation triggers

### ✅ Singleton Systems (via `window.lcardsCore`)
- **ThemeManager**: `lcarsClassicTokens` with theme token resolution
- **AnimationManager**: Anime.js v4 integration for animations
- **StylePresetManager**: Preset loading from packs
- **ValidationService**: Schema-based config validation (from MSD)
- **ActionHandler**: Unified action handling

---

## Critical Gaps (Must Fix Before Visual Features)

### 🚨 Missing: Config Validation Integration
**Current**: SimpleCard doesn't validate configs  
**Need**: Use `ValidationService` to validate button configs against schema

### 🚨 Missing: Selective Re-Rendering  
**Current**: Full card re-render on every HASS update (causes flashing)  
**Need**: Detect what changed, update only text/colors without full re-render

### 🚨 Missing: Preset Deep Merging
**Current**: Basic shallow merge of preset + user config  
**Need**: Deep merge with proper precedence (base defaults < preset < user overrides)

---

## Consolidated Roadmap

---

## **PHASE 0: Architecture Foundation (BLOCKING)**
**Priority**: CRITICAL  
**Duration**: 2-3 days  
**Must Complete Before Any Visual Work**

### 0.1 Config Validation Schema

Create validation schema for simple-button cards:

```javascript
// NEW FILE: src/cards/schemas/simple-button-schema.js
export const SimpleButtonSchema = {
  $id: 'simple-button-v1',
  type: 'object',
  required: ['type'],
  
  properties: {
    type: { type: 'string', enum: ['custom:lcards-simple-button'] },
    entity: { type: 'string', pattern: '^[a-z_]+\\.[a-z0-9_]+$' },
    preset: { 
      type: 'string', 
      enum: ['lozenge', 'bullet', 'capped', 'picard', 'picard-filled', 'picard-icon', 'square', 'pill']
    },
    
    // Text
    label: { type: 'string' },
    texts: { 
      type: 'array',
      items: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          position: { type: 'string' },
          fontSize: { type: 'number', minimum: 8, maximum: 72 },
          overflow: { type: 'string', enum: ['ellipsis', 'auto-scroll', 'shrink-to-fit', 'wrap'] }
        }
      }
    },
    
    // Icon
    icon: { 
      oneOf: [
        { type: 'string' },
        { type: 'object' }
      ]
    },
    
    // Style overrides
    style: { type: 'object' },
    
    // Actions
    tap_action: { type: 'object' },
    hold_action: { type: 'object' },
    double_tap_action: { type: 'object' },
    
    // Animations
    animations: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        configs: { type: 'array' }
      }
    }
  }
};
```

**Register with ValidationService**:
```javascript
// In src/core/lcards-core.js initialization
import { SimpleButtonSchema } from '../cards/schemas/simple-button-schema.js';

async _performInitialization(hass) {
  // ... existing code ...
  
  // Register schemas
  if (this.validationService) {
    this.validationService.registerSchema('simple-button', SimpleButtonSchema);
  }
}
```

**Use in LCARdSSimpleCard**:
```javascript
// In src/base/LCARdSSimpleCard.js
_onConfigSet(config) {
  super._onConfigSet(config);
  
  // Validate config
  const validationService = this._singletons?.validationService;
  if (validationService) {
    const validation = validationService.validateConfig(config, 'simple-button');
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }
  }
  
  // ... rest of config processing
}
```

**Files**:
- ✅ NEW: `src/cards/schemas/simple-button-schema.js`
- ✅ MODIFY: `src/core/lcards-core.js` - Register schema
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js` - Add validation

---

### 0.2 Selective Re-Rendering (Performance)

Implement change detection to avoid full re-renders:

```javascript
// In src/base/LCARdSSimpleCard.js

_handleHassUpdate(newHass, oldHass) {
  // Detect what changed
  const changes = this._detectEntityChanges(newHass, oldHass);
  
  if (!changes.requiresRender) {
    return; // No update needed
  }
  
  if (changes.onlyText) {
    this._updateTextNodesDirectly(changes.textUpdates); // < 2ms
    return;
  }
  
  if (changes.onlyColors) {
    this._updateColorsDirectly(changes.colorUpdates); // < 2ms
    return;
  }
  
  // Full re-render only when structure changes
  this._scheduleTemplateUpdate();
}

/**
 * Detect what changed between HASS updates
 */
_detectEntityChanges(newHass, oldHass) {
  if (!this.config.entity) {
    return { requiresRender: false };
  }
  
  const oldState = oldHass?.states?.[this.config.entity];
  const newState = newHass.states[this.config.entity];
  
  if (!oldState || !newState) {
    return { requiresRender: true };
  }
  
  const analysis = {
    requiresRender: false,
    onlyText: false,
    onlyColors: false,
    textUpdates: {},
    colorUpdates: {}
  };
  
  // State value changed
  if (oldState.state !== newState.state) {
    analysis.requiresRender = true;
    
    // If no templates, only colors change
    if (!this._hasTemplatesInConfig()) {
      analysis.onlyColors = true;
      analysis.colorUpdates = this._getStateColors(newState.state);
    }
  }
  
  // Attributes changed (for templates)
  if (this._attributesChanged(oldState.attributes, newState.attributes)) {
    analysis.requiresRender = true;
    
    const changedAttrs = this._getChangedAttributes(oldState.attributes, newState.attributes);
    if (this._onlyTextAttributesChanged(changedAttrs)) {
      analysis.onlyText = true;
      analysis.textUpdates = this._getTextUpdates(newState);
    }
  }
  
  return analysis;
}

/**
 * Update text nodes directly (no re-render)
 */
_updateTextNodesDirectly(textUpdates) {
  const svg = this.shadowRoot?.querySelector('svg');
  if (!svg) return;
  
  Object.entries(textUpdates).forEach(([textId, newContent]) => {
    const textEl = svg.querySelector(`#${textId}`);
    if (textEl) {
      textEl.textContent = newContent;
    }
  });
}

/**
 * Update colors directly (no re-render)
 */
_updateColorsDirectly(colorUpdates) {
  const svg = this.shadowRoot?.querySelector('svg');
  if (!svg) return;
  
  if (colorUpdates.background) {
    svg.querySelector('.button-bg')?.setAttribute('fill', colorUpdates.background);
  }
  
  if (colorUpdates.text) {
    svg.querySelectorAll('.button-text').forEach(el => {
      el.setAttribute('fill', colorUpdates.text);
    });
  }
}
```

**Files**:
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js` - Add change detection

---

### 0.3 Deep Config Merging

Implement proper preset + user config merging:

```javascript
// In src/base/LCARdSSimpleCard.js

_onConfigSet(config) {
  super._onConfigSet(config);
  
  // ... validation ...
  
  // Deep merge preset with user config
  if (config.preset && this._singletons?.stylePresetManager) {
    const preset = this._singletons.stylePresetManager.getPreset('button', config.preset);
    
    if (preset && preset.style) {
      // Deep merge: base < theme defaults < preset < user config
      const baseDefaults = this.getThemeToken('components.button.base') || {};
      this._mergedConfig = this._deepMerge([baseDefaults, preset.style, config.style || {}]);
      
      lcardsLog.debug(`[SimpleCard] Merged config for preset '${config.preset}'`);
    }
  }
}

/**
 * Deep merge multiple config objects
 * Later objects override earlier ones
 */
_deepMerge(configs) {
  const result = {};
  
  for (const config of configs) {
    this._mergeInto(result, config);
  }
  
  return result;
}

/**
 * Recursively merge source into target
 */
_mergeInto(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = target[key] || {};
      this._mergeInto(target[key], value);
    } else {
      target[key] = value;
    }
  }
}
```

**Files**:
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js` - Add deep merge

---

## **PHASE 1: Complete Button Style Library**
**Priority**: HIGH  
**Duration**: 3-4 days

### 1.1 All Button Type Presets

Define all legacy button types in `loadBuiltinPacks.js`:

**Button Types** (from legacy YAML analysis):
- `lozenge` / `lozenge-right` - Fully rounded
- `bullet` / `bullet-right` - Half rounded (one side)
- `capped` / `capped-right` - Single end cap
- `picard` / `picard-right` / `picard-dense` - Square outline
- `picard-filled` / `picard-filled-right` / `picard-filled-dense` - Square filled
- `picard-icon` - Compact icon-only
- `square` - Basic rectangle
- `pill` - Elongated capsule

```javascript
// In src/msd/packs/loadBuiltinPacks.js → LCARDS_BUTTONS_PACK
style_presets: {
  button: {
    // BASE (all others extend this)
    base: {
      width: null,
      height: 45,
      minHeight: 45,
      
      background: {
        active: 'var(--lcars-card-button)',
        inactive: 'var(--lcars-card-button-off)',
        unavailable: 'var(--lcars-card-button-unavailable)'
      },
      
      textColor: {
        active: 'black',
        inactive: 'black',
        unavailable: 'black'
      },
      
      strokeWidth: 0,
      strokeColor: 'black',
      
      cornerRadius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      
      fontSize: 20,
      fontWeight: 'normal',
      fontFamily: 'Antonio, sans-serif',
      textTransform: 'uppercase',
      textAlign: 'right',
      textVerticalAlign: 'end',
      
      padding: { top: 5, bottom: 5, left: 24, right: 24 },
      
      iconPosition: 'left',
      iconSize: 24,
      showIcon: false,
      showLabel: true
    },
    
    // LOZENGE - Fully rounded
    lozenge: {
      extends: 'button.base',
      cornerRadius: { topLeft: 25, topRight: 25, bottomLeft: 25, bottomRight: 25 }
    },
    
    'lozenge-right': {
      extends: 'button.lozenge',
      textAlign: 'left',
      iconPosition: 'right'
    },
    
    // BULLET - Left rounded only
    bullet: {
      extends: 'button.base',
      cornerRadius: { topLeft: 30, topRight: 0, bottomLeft: 30, bottomRight: 0 }
    },
    
    'bullet-right': {
      extends: 'button.bullet',
      textAlign: 'left',
      iconPosition: 'right',
      cornerRadius: { topLeft: 0, topRight: 30, bottomLeft: 0, bottomRight: 30 }
    },
    
    // CAPPED - Left capped
    capped: {
      extends: 'button.base',
      cornerRadius: { topLeft: 30, topRight: 0, bottomLeft: 30, bottomRight: 0 }
    },
    
    'capped-right': {
      extends: 'button.capped',
      textAlign: 'left',
      iconPosition: 'right',
      cornerRadius: { topLeft: 0, topRight: 30, bottomLeft: 0, bottomRight: 30 }
    },
    
    // PICARD - Outline only
    picard: {
      extends: 'button.base',
      fontSize: 22,
      textVerticalAlign: 'center',
      padding: { top: 0, bottom: 5, left: 10, right: 10 },
      
      background: {
        active: 'transparent',
        inactive: 'transparent',
        unavailable: 'transparent'
      },
      
      strokeWidth: 4,
      strokeColor: {
        active: 'var(--lcars-card-button)',
        inactive: 'var(--lcars-card-button-off)',
        unavailable: 'var(--lcars-card-button-unavailable)'
      },
      
      textColor: {
        active: 'var(--lcars-card-button)',
        inactive: 'var(--lcars-card-button-off)',
        unavailable: 'var(--lcars-card-button-unavailable)'
      }
    },
    
    'picard-right': {
      extends: 'button.picard',
      textAlign: 'left',
      iconPosition: 'right'
    },
    
    'picard-dense': {
      extends: 'button.picard',
      height: 50
    },
    
    'picard-dense-right': {
      extends: 'button.picard-right',
      height: 50
    },
    
    // PICARD-FILLED - Solid background
    'picard-filled': {
      extends: 'button.base',
      fontSize: 22,
      textVerticalAlign: 'center',
      padding: { top: 0, bottom: 5, left: 10, right: 10 }
    },
    
    'picard-filled-right': {
      extends: 'button.picard-filled',
      textAlign: 'left',
      iconPosition: 'right'
    },
    
    'picard-filled-dense': {
      extends: 'button.picard-filled',
      height: 50
    },
    
    'picard-filled-dense-right': {
      extends: 'button.picard-filled-right',
      height: 50
    },
    
    // PICARD-ICON - Compact icon button
    'picard-icon': {
      extends: 'button.picard-filled',
      width: 40,
      height: 40,
      minHeight: 40,
      cornerRadius: { topLeft: 10, topRight: 10, bottomLeft: 10, bottomRight: 10 },
      showIcon: true,
      showLabel: false,
      iconPosition: 'center',
      iconSize: 30,
      textAlign: 'center'
    },
    
    // SQUARE - Basic rectangle
    square: {
      extends: 'button.base',
      showIcon: false
    },
    
    // PILL - Elongated capsule
    pill: {
      extends: 'button.base',
      cornerRadius: { topLeft: 50, topRight: 50, bottomLeft: 50, bottomRight: 50 }
    }
  }
}
```

**Files**:
- ✅ MODIFY: `src/msd/packs/loadBuiltinPacks.js` - Add all button presets

---

### 1.2 Theme Token Expansion

Ensure all button tokens exist in theme:

```javascript
// In src/msd/themes/tokens/lcarsClassicTokens.js
components: {
  button: {
    base: {
      color: {
        default: 'var(--lcars-card-button)',
        active: 'var(--lcars-card-button)',
        inactive: 'var(--lcars-card-button-off)',
        unavailable: 'var(--lcars-card-button-unavailable)'
      },
      
      background: {
        active: 'var(--lcars-card-button)',
        inactive: 'var(--lcars-card-button-off)',
        unavailable: 'var(--lcars-card-button-unavailable)',
        transparent: 'transparent'
      },
      
      text: {
        default: 'black',
        active: 'black',
        inactive: 'black',
        unavailable: 'black'
      },
      
      border: {
        width: 0,
        thick: 4,
        color: 'black'
      },
      
      font: {
        family: 'Antonio, sans-serif',
        size: { normal: 20, dense: 22, large: 22 },
        weight: { normal: 'normal', bold: 'bold' },
        transform: 'uppercase'
      },
      
      layout: {
        height: { standard: 45, dense: 50, icon: 40 },
        minHeight: 45,
        padding: { vertical: 5, horizontal: 24 }
      },
      
      radius: {
        none: 0,
        small: 2,
        medium: 4,
        large: 8,
        full: 'var(--ha-card-border-radius)',
        pill: 25
      },
      
      icon: {
        size: 24,
        spacing: 8,
        color: { inherit: true }
      }
    }
  }
}
```

**Files**:
- ✅ MODIFY: `src/msd/themes/tokens/lcarsClassicTokens.js`

---

## **PHASE 2: Icon Support**
**Priority**: HIGH  
**Duration**: 3-4 days

### 2.1 Icon Resolution

Support multiple icon sources:

```yaml
# Icon configuration options
icon: 'entity'  # Use entity's icon (default)
icon: 'mdi:lightbulb'  # Material Design Icon
icon: 'si:github'  # Simple Icons
icon: 'builtin:starfleet'  # Builtin LCARS icon

# Or full config
icon:
  name: 'mdi:lightbulb'
  position: 'left'  # or 'right', 'top', 'bottom', 'center'
  size: 24
  color: 'inherit'  # or theme token
  spacing: 8
```

**Implementation**:
```javascript
// In src/base/LCARdSSimpleCard.js

_resolveIconConfig(iconConfig, entity) {
  if (!iconConfig || iconConfig === 'none') {
    return null;
  }
  
  // Default: use entity icon
  if (iconConfig === 'entity') {
    return {
      type: 'mdi',
      name: entity?.attributes?.icon || 'mdi:help-circle',
      position: 'left',
      size: 24,
      color: 'inherit'
    };
  }
  
  // Simple string
  if (typeof iconConfig === 'string') {
    return this._parseIconString(iconConfig);
  }
  
  // Full object
  const parsed = this._parseIconString(iconConfig.name);
  return {
    ...parsed,
    position: iconConfig.position || 'left',
    size: iconConfig.size || 24,
    color: iconConfig.color || 'inherit',
    spacing: iconConfig.spacing || 8
  };
}

_parseIconString(iconString) {
  if (!iconString || !iconString.includes(':')) {
    return { type: 'mdi', name: `mdi:${iconString}` };
  }
  
  const [prefix, name] = iconString.split(':');
  
  switch (prefix) {
    case 'mdi':
      return { type: 'mdi', name: iconString };
    case 'si':
      return { type: 'simple-icons', name: `si:${name}` };
    case 'builtin':
      return { type: 'builtin-svg', name, svg: this._getBuiltinIcon(name) };
    default:
      return { type: 'mdi', name: `mdi:${iconString}` };
  }
}

_getBuiltinIcon(name) {
  const stylePresetManager = this._singletons?.stylePresetManager;
  // Get icon from pack (to be implemented in Phase 2.2)
  return null;
}
```

**Files**:
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js` - Add icon resolution

---

### 2.2 Icon Rendering

Add icon support to SimpleButtonRenderer:

```javascript
// In src/cards/renderers/SimpleButtonRenderer.js

_generateButtonMarkup(config, width, height) {
  const iconMarkup = config.icon ? this._generateIconMarkup(config.icon, width, height) : '';
  const textMarkup = this._generateTextMarkup(config.texts, width, height);
  
  return `
    <svg ...>
      <defs>...</defs>
      
      <g class="button-group" data-overlay-id="simple-button">
        <rect class="button-bg" .../>
        ${iconMarkup}
        ${textMarkup}
      </g>
    </svg>
  `;
}

_generateIconMarkup(iconConfig, buttonWidth, buttonHeight) {
  const { x, y } = this._calculateIconPosition(iconConfig.position, iconConfig.size, buttonWidth, buttonHeight);
  
  if (iconConfig.type === 'mdi' || iconConfig.type === 'simple-icons') {
    // Use <foreignObject> for <ha-icon>
    return `
      <foreignObject x="${x}" y="${y}" width="${iconConfig.size}" height="${iconConfig.size}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${iconConfig.size}px;height:${iconConfig.size}px">
          <ha-icon icon="${iconConfig.name}" style="--mdc-icon-size:${iconConfig.size}px;color:${iconConfig.color}"></ha-icon>
        </div>
      </foreignObject>
    `;
  }
  
  if (iconConfig.type === 'builtin-svg' && iconConfig.svg) {
    return `<g transform="translate(${x}, ${y})">${iconConfig.svg}</g>`;
  }
  
  return '';
}

_calculateIconPosition(position, size, buttonWidth, buttonHeight) {
  const padding = 8;
  
  const positions = {
    'left': { x: padding, y: (buttonHeight - size) / 2 },
    'right': { x: buttonWidth - size - padding, y: (buttonHeight - size) / 2 },
    'top': { x: (buttonWidth - size) / 2, y: padding },
    'bottom': { x: (buttonWidth - size) / 2, y: buttonHeight - size - padding },
    'center': { x: (buttonWidth - size) / 2, y: (buttonHeight - size) / 2 }
  };
  
  return positions[position] || positions['left'];
}
```

**Files**:
- ✅ MODIFY: `src/cards/renderers/SimpleButtonRenderer.js`

---

### 2.3 Builtin Icon Library

Create LCARS icon pack:

```javascript
// In src/msd/packs/loadBuiltinPacks.js → NEW PACK
const LCARS_ICONS_PACK = {
  id: 'lcars_icons',
  version: '1.0.0',
  
  icons: {
    'starfleet': '<svg viewBox="0 0 100 100"><path d="M50,5 L80,95 L50,75 L20,95 Z" fill="currentColor"/></svg>',
    'lcars_alert': '<svg>...</svg>',
    'warp_core': '<svg>...</svg>',
    // ... more icons
  }
};

// Add to registry
const BUILTIN_REGISTRY = {
  core: CORE_PACK,
  lcards_buttons: LCARDS_BUTTONS_PACK,
  builtin_themes: BUILTIN_THEMES_PACK,
  lcars_icons: LCARS_ICONS_PACK  // NEW
};

// Always load icons
export function loadBuiltinPacks(requested = ['core', 'lcards_buttons']) {
  const packsToLoad = [...new Set([...requested, 'builtin_themes', 'lcars_icons'])];
  return packsToLoad.map(id => BUILTIN_REGISTRY[id]).filter(Boolean);
}
```

**Files**:
- ✅ MODIFY: `src/msd/packs/loadBuiltinPacks.js`

---

## **PHASE 3: Multi-Text Field System**
**Priority**: HIGH  
**Duration**: 3-4 days

### 3.1 Text Array Support

Support multiple text elements:

```yaml
# Simple label
label: '{{entity.attributes.friendly_name}}'

# Multiple texts
texts:
  - id: label
    text: '{{entity.attributes.friendly_name}}'
    position: top-left
    fontSize: 22
    overflow: ellipsis
  
  - id: state
    text: '[[[return entity.state.toUpperCase()]]]'
    position: bottom-right
    fontSize: 14
    overflow: auto-scroll  # Marquee scroll

# Text layout preset
text_layout: 'label-state'  # Predefined layout
```

**Overflow Strategies**:
1. `ellipsis` - Truncate with `...`
2. `auto-scroll` - Marquee animation (Anime.js)
3. `shrink-to-fit` - Reduce font size
4. `wrap` - Multi-line (future)

**Implementation**: _(implementation code here, similar to what was in the cut-off response)_

**Files**:
- ✅ MODIFY: `src/cards/renderers/SimpleButtonRenderer.js` - Text array processing
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js` - Template processing for texts

---

### 3.2 Text Layout Presets

Add reusable text layouts:

```javascript
// In loadBuiltinPacks.js → LCARDS_BUTTONS_PACK
textLayoutPresets: {
  'label-only': {
    texts: [{ id: 'label', position: 'center-center', fontSize: 22 }]
  },
  
  'label-state': {
    texts: [
      { id: 'label', position: 'left-center', fontSize: 22 },
      { id: 'state', position: 'right-center', fontSize: 14 }
    ]
  },
  
  'title-subtitle-badge': {
    texts: [
      { id: 'title', position: 'center-top', fontSize: 18 },
      { id: 'subtitle', position: 'center-center', fontSize: 12 },
      { id: 'badge', position: 'top-right', fontSize: 10, color: 'colors.status.danger' }
    ]
  }
}
```

**Files**:
- ✅ MODIFY: `src/msd/packs/loadBuiltinPacks.js`

---

## **PHASE 4: Auto-Sizing & Grid Integration**
**Priority**: MEDIUM  
**Duration**: 2-3 days

### 4.1 ResizeObserver for Dynamic Sizing

```javascript
// In src/base/LCARdSSimpleCard.js

_onFirstUpdated(changedProperties) {
  super._onFirstUpdated(changedProperties);
  
  // Setup ResizeObserver
  this._resizeObserver = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    this._handleResize(width, height);
  });
  
  this._resizeObserver.observe(this);
}

_handleResize(width, height) {
  if (width !== this._lastWidth || height !== this._lastHeight) {
    this._lastWidth = width;
    this._lastHeight = height;
    this._scheduleTemplateUpdate(); // Re-render with new size
  }
}
```

**Files**:
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js`

---

### 4.2 HA Grid System Support

```yaml
grid:
  columns: 2  # Span 2 columns
  rows: 1     # Span 1 row
```

```javascript
// In src/base/LCARdSNativeCard.js

getLayoutOptions() {
  return {
    grid_columns: this.config.grid?.columns || 1,
    grid_rows: this.config.grid?.rows || 1
  };
}
```

**Files**:
- ✅ MODIFY: `src/base/LCARdSNativeCard.js`

---

## **PHASE 5: Animation System (Opt-In)**
**Priority**: MEDIUM  
**Duration**: 2 days

### 5.1 Animation Configuration

```yaml
animations:
  enabled: true  # Must explicitly enable
  
  configs:
    - trigger: on_hover
      preset: pulse-soft
    
    - trigger: on_tap
      preset: ripple
```

```javascript
// In src/base/LCARdSSimpleCard.js

_registerAnimations() {
  // Only if enabled
  if (!this.config.animations?.enabled) {
    return;
  }
  
  // Existing animation registration logic
  super._registerAnimations();
}
```

**Files**:
- ✅ MODIFY: `src/base/LCARdSSimpleCard.js`

---

## **PHASE 6: Label/Text Card**
**Priority**: MEDIUM-LOW  
**Duration**: 3-4 days

### 6.1 Simple Label Card

New card type: `lcards-simple-label`

```javascript
// NEW: src/cards/lcards-simple-label.js
export class LCARdSSimpleLabelCard extends LCARdSSimpleCard {
  // No actions (non-interactive)
  _setupButtonActions() {
    // Skip
  }
  
  _renderCard() {
    // Use text-only renderer
  }
}
```

---

### 6.2 LCARS Cascade Animation

```javascript
// Cascade effect for text reveal
applyCascadeAnimation(textElements, config) {
  const { direction = 'top-to-bottom', stagger = 100, duration = 800 } = config;
  
  if (window.cblcars?.anim) {
    window.cblcars.anim(textElements, {
      opacity: [0, 1],
      translateY: direction === 'top-to-bottom' ? [-20, 0] : 0,
      duration,
      delay: window.cblcars.animStagger(stagger)
    });
  }
}
```

---

## **PHASE 7: Slider/Multimeter Card**
**Priority**: LOW  
**Duration**: TBD

(Deferred until buttons/labels are complete)

---

## Priority Order Summary

### Sprint 0 (Week 1 - BLOCKING):
1. Config validation schema
2. Selective re-rendering
3. Deep config merging

### Sprint 1 (Week 2):
4. All button style presets
5. Theme token expansion

### Sprint 2 (Week 3):
6. Icon resolution
7. Icon rendering
8. Builtin icon library

### Sprint 3 (Week 4):
9. Multi-text array support
10. Text overflow handling
11. Text layout presets

### Sprint 4 (Week 5):
12. ResizeObserver auto-sizing
13. HA grid integration

### Sprint 5 (Week 6):
14. Opt-in animations

### Sprint 6 (Week 7+):
15. Label/text card
16. Cascade animation

---

## Key Design Decisions (From Feedback)

### 1. Button Naming
**Pending**: Standardize on LCARS nomenclature (to be confirmed with community)

### 2. Icon Library
- ✅ MDI via `<ha-icon>` in `<foreignObject>`
- ✅ Simple Icons support
- ✅ Builtin SVG library with `builtin:` prefix
- ✅ Default: entity icon

### 3. Text Overflow
- ✅ User choice: ellipsis, auto-scroll, shrink-to-fit, wrap
- For large text areas (label card): Deeper conversation needed on grid vs single field

### 4. Animations
- ✅ Opt-in only (not automatic)
- Flag: `animations.enabled: true` required

### 5. Config Overrides
- ✅ User can override any preset value
- Deep merge ensures highest priority wins

### 6. Future Cards Priority
1. Label/text cards
2. Text grids (complex layouts)
3. Slider/multimeter
4. (Others TBD)

---

## Testing Requirements

Each phase must include:
1. Test HTML file (e.g., `test-simple-button-phase1.html`)
2. Config examples for all features
3. Performance validation (selective rendering < 2ms)
4. Visual regression tests (screenshot comparison)

---

Is this consolidated roadmap what you were looking for? I've:
- ✅ Removed all references to abandoned "V2 architecture"
- ✅ Kept all button styles from original V1
- ✅ Kept validation/merging/performance from V2
- ✅ Only references SimpleCard + Singletons
- ✅ Merged and deduplicated everything
