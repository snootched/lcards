I'll analyze the current state of the `lcards-simple-button` card and the legacy templates to create a comprehensive roadmap for development.Let me search for more context on the current implementation:# LCARdS Simple Button Card - Development Roadmap & Assessment

## Current State Analysis

Based on the provided code, I can see you've established a solid foundation:

### ✅ **Completed Infrastructure**
1. **LCARdSSimpleCard Base Class** - Template processing, style resolution, entity tracking
2. **Action Handling** - Full action support (tap, hold, double_tap, hover/leave) integrated with AnimationManager
3. **SimpleButtonRenderer** - SVG generation with basic text/style support
4. **Theme Token Integration** - Connected to `lcarsClassicTokens` via ThemeManager
5. **Style Preset System** - "lozenge" preset working as proof-of-concept
6. **Shadow DOM Support** - Proper isolation and action registration

### 🔧 **Current Capabilities**
- Single button with configurable preset (lozenge)
- Template processing for label/content
- Theme token resolution
- State-based style overrides
- Animation triggers (via AnimationManager)
- SVG rendering with basic text positioning

### ⚠️ **Identified Gaps**
1. **Limited Button Variants** - Only "lozenge" implemented
2. **No Icon Support** - Icon rendering/positioning not integrated
3. **Single Text Field** - `texts` array not fully utilized
4. **Static Sizing** - No auto-sizing or HA grid integration
5. **Limited Text Positioning** - Basic center/left/right only

---

## Strategic Roadmap

I've organized this into **5 phases** based on dependency chains and user impact. Each phase builds on the previous one.

---

### **PHASE 1: Style Preset Library Foundation** 🎨
**Priority: HIGHEST** - This enables all future visual development

#### 1.1 Create Button Style Presets in `loadBuiltinPacks.js`
**Goal**: Define all legacy button types as reusable presets

**Button Types to Implement**:
- ✅ `lozenge` (done)
- `bullet` (left-rounded, right-sharp)
- `bullet-right` (right-rounded, left-sharp)
- `capped` (left-rounded, right-square)
- `capped-right` (right-rounded, left-square)
- `picard` (square with borders, transparent background)
- `picard-filled` (square with filled background)
- `picard-icon` (small square for icons only)
- `square` (no rounding)
- `pill` (fully rounded ends)

**Preset Structure** (per button type):
```javascript
{
  id: 'button-lozenge',
  overlayType: 'button',
  style: {
    // Geometry
    cornerRadius: 'components.button.base.radius.pill', // Token ref
    width: null, // auto
    height: 'components.button.base.layout.height.standard', // 45px
    
    // Colors (state-based)
    color: {
      active: 'components.button.base.color.active',
      inactive: 'components.button.base.color.inactive',
      unavailable: 'components.button.base.color.unavailable'
    },
    background: {
      active: 'components.button.base.background.active',
      inactive: 'components.button.base.background.inactive'
    },
    
    // Border
    strokeWidth: 'components.button.base.border.width',
    strokeColor: 'components.button.base.border.color',
    
    // Text defaults
    textColor: 'components.button.base.text.onColor',
    fontSize: 'components.button.base.font.size.normal',
    fontWeight: 'components.button.base.font.weight.normal',
    fontFamily: 'components.button.base.font.family',
    textTransform: 'components.button.base.font.transform',
    
    // Layout
    padding: {
      vertical: 'components.button.base.layout.padding.vertical',
      horizontal: 'components.button.base.layout.padding.horizontal'
    }
  }
}
```

**Variations to Add**:
- `-dense` variants (smaller height: 50px → 40px)
- `-right` variants (flip text/icon alignment)
- New: `-minimal` (thin borders, subtle styling)
- New: `-alert` (pulsing glow, danger colors)

**Files to Modify**:
- `src/msd/packs/loadBuiltinPacks.js` - Add button preset definitions
- `src/msd/themes/tokens/lcarsClassicTokens.js` - Ensure all button tokens exist

**Deliverable**: ~12-15 button presets ready for use

---

#### 1.2 Enhance Theme Token Coverage
**Goal**: Fill gaps in `lcarsClassicTokens.js` for button styling

**New Token Sections Needed**:
```javascript
components: {
  button: {
    base: {
      // ... existing ...
      
      // Add icon tokens
      icon: {
        size: 24,
        spacing: 8, // gap between icon and text
        color: {
          inherit: true, // use button color
          custom: null
        },
        border: {
          width: 6,
          color: 'black',
          style: 'solid'
        }
      },
      
      // Add animation hooks
      animation: {
        hover: {
          scale: 1.05,
          duration: 200
        },
        active: {
          scale: 0.98,
          duration: 100
        }
      }
    }
  }
}
```

**Files to Modify**:
- `src/msd/themes/tokens/lcarsClassicTokens.js`

---

### **PHASE 2: Icon Support & Visual Enhancements** 🖼️
**Priority: HIGH** - Core visual features users expect

#### 2.1 Icon Rendering in SimpleButtonRenderer
**Goal**: Support icons alongside text with proper positioning

**Implementation Steps**:
1. **Extend `SimpleButtonRenderer._generateButtonMarkup()`**:
   - Add icon SVG generation (use `<svg>` or `<foreignObject>` for MDI icons)
   - Support icon positions: `left`, `right`, `top`, `bottom`, `center`
   - Handle icon-only buttons (no text)
   
2. **Icon Styling from Presets**:
   ```javascript
   icon: {
     name: 'mdi:lightbulb',
     position: 'left', // or 'right'
     size: 24,
     color: 'inherit', // or custom color
     spacing: 8 // gap to text
   }
   ```

3. **Layout Algorithms**:
   - Horizontal (icon + text): Use SVG `<g>` with calculated offsets
   - Vertical (icon above/below text): Stack with padding
   - Icon-only: Center with no text

**Files to Modify**:
- `src/cards/renderers/SimpleButtonRenderer.js`
- `src/cards/lcards-simple-button.js` (pass icon config to renderer)

**Deliverable**: Buttons with left/right icons working

---

#### 2.2 Border & Stroke Variants
**Goal**: Implement picard-style borders (transparent backgrounds with colored outlines)

**Preset Examples**:
```javascript
// Picard style: transparent bg, thick border
style: {
  background: { active: 'transparent' },
  strokeWidth: 4,
  strokeColor: 'components.button.base.color.active'
}

// Picard-filled style: colored bg, no border
style: {
  background: { active: 'components.button.base.background.active' },
  strokeWidth: 0
}
```

**Files to Modify**:
- `src/msd/packs/loadBuiltinPacks.js` (add picard presets)

---

### **PHASE 3: Multi-Text Field System (`texts` Array)** 📝
**Priority: HIGH** - Essential for advanced layouts

#### 3.1 Full `texts` Array Support
**Goal**: Allow users to define multiple text elements with independent styling

**Configuration Schema**:
```javascript
texts: [
  {
    id: 'main-label',
    text: '{{entity.attributes.friendly_name}}',
    position: 'center-center',
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    anchor: 'middle' // SVG text-anchor
  },
  {
    id: 'status',
    text: '[[[return entity.state.toUpperCase()]]]',
    position: 'right-bottom',
    fontSize: 14,
    fontWeight: 'normal',
    color: 'colors.status.info'
  }
]
```

**Implementation in SimpleButtonRenderer**:
1. **Extend `_prepareTextConfiguration()`**:
   - Loop through `config.texts` array
   - Process templates for each text element
   - Calculate positions via `_calculateTextPosition()`
   
2. **Add Position Presets**:
   - `top-left`, `top-center`, `top-right`
   - `center-left`, `center-center`, `center-right`
   - `bottom-left`, `bottom-center`, `bottom-right`
   - Custom `{x: 50, y: 30}` coordinates

3. **Text Overflow Handling**:
   - SVG `textLength` adjustment
   - Ellipsis for long text
   - Multi-line support (future enhancement)

**Files to Modify**:
- `src/cards/renderers/SimpleButtonRenderer.js`
- `src/cards/lcards-simple-button.js` (validate/merge `texts` config)

**Deliverable**: Buttons with 2-3 text elements at different positions

---

#### 3.2 Text Style Presets
**Goal**: Create reusable text style combos (e.g., "label + state" layout)

**Preset Examples**:
```javascript
// In loadBuiltinPacks.js
textLayout: {
  'label-state': {
    texts: [
      { id: 'label', position: 'left-center', fontSize: 22, fontWeight: 'bold' },
      { id: 'state', position: 'right-center', fontSize: 14, fontWeight: 'normal' }
    ]
  },
  'title-subtitle': {
    texts: [
      { id: 'title', position: 'center-top', fontSize: 24 },
      { id: 'subtitle', position: 'center-bottom', fontSize: 12, color: 'colors.ui.disabled' }
    ]
  }
}
```

**Files to Modify**:
- `src/msd/packs/loadBuiltinPacks.js`

---

### **PHASE 4: Auto-Sizing & HA Grid Integration** 📐
**Priority: MEDIUM** - UX improvement, not blocking

#### 4.1 ResizeObserver for Dynamic Sizing
**Goal**: Button adapts to container size (like legacy cards)

**Implementation**:
1. **Add ResizeObserver in `LCARdSSimpleCard`**:
   ```javascript
   _onFirstUpdated() {
     this._resizeObserver = new ResizeObserver(entries => {
       const { width, height } = entries[0].contentRect;
       this._updateSize(width, height);
     });
     this._resizeObserver.observe(this);
   }
   ```

2. **Dynamic SVG Scaling**:
   - Recalculate SVG viewBox on resize
   - Adjust text positions proportionally
   - Maintain aspect ratio or allow stretch

**Files to Modify**:
- `src/base/LCARdSSimpleCard.js` (add ResizeObserver lifecycle)
- `src/cards/lcards-simple-button.js` (handle size updates)

---

#### 4.2 HA Grid System Integration
**Goal**: Support HA's card grid layout (`columns`, `rows`)

**Config Schema**:
```yaml
type: custom:lcards-simple-button
entity: light.bedroom
preset: lozenge
grid:
  columns: 2  # span 2 columns
  rows: 1     # span 1 row
```

**Implementation**:
1. **Override `getCardSize()`**:
   ```javascript
   getCardSize() {
     return this.config.grid?.rows || 1;
   }
   ```

2. **CSS Grid Styles**:
   ```css
   :host {
     grid-column: span var(--card-columns, 1);
     grid-row: span var(--card-rows, 1);
   }
   ```

**Files to Modify**:
- `src/base/LCARdSNativeCard.js` (add `getLayoutOptions()`)
- `src/cards/lcards-simple-button.js` (apply grid config)

---

### **PHASE 5: Advanced Features & Future-Proofing** 🚀
**Priority: LOW** - Nice-to-haves, prep for future cards

#### 5.1 Gradient & Pattern Fills
**Goal**: Support SVG gradients/patterns for backgrounds

**Example Config**:
```javascript
style: {
  background: {
    type: 'linear-gradient',
    stops: [
      { offset: 0, color: 'colors.accent.primary' },
      { offset: 100, color: 'colors.accent.primaryDark' }
    ],
    angle: 90
  }
}
```

**Files to Modify**:
- `src/cards/renderers/SimpleButtonRenderer.js` (SVG `<defs>` generation)

---

#### 5.2 Label/Text Card Commonality
**Goal**: Extract shared logic for future `lcards-simple-label` card

**Shared Components**:
- Text rendering (already in `SimpleButtonRenderer`)
- Template processing (in `LCARdSSimpleCard`)
- Theme token resolution

**Implementation**:
1. **Create `SimpleTextRenderer`**:
   - Extract text-only rendering from `SimpleButtonRenderer`
   - Support backgrounds, borders (for label cards)

2. **Base Text Card Class**:
   ```javascript
   class LCARdSSimpleTextCard extends LCARdSSimpleCard {
     // Shared text layout logic
   }
   ```

**Files to Create**:
- `src/cards/renderers/SimpleTextRenderer.js`
- `src/cards/lcards-simple-label.js` (future card)

---

#### 5.3 Animation Preset Library
**Goal**: Predefined animation combos for buttons (pulse, glow, cascade)

**Example Presets** (in `loadBuiltinPacks.js`):
```javascript
animations: {
  'button-pulse': {
    hover: { scale: [1, 1.1, 1], duration: 600 },
    tap: { scale: [1, 0.95, 1], duration: 200 }
  },
  'button-glow': {
    hover: { 
      filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
      duration: 800,
      loop: true
    }
  }
}
```

**Files to Modify**:
- `src/msd/packs/loadBuiltinPacks.js`
- `src/base/LCARdSSimpleCard.js` (apply animation presets)

---

#### 5.4 Custom Button Shapes (Advanced)
**Goal**: Support arbitrary SVG paths for button shapes

**Example**:
```javascript
style: {
  shape: 'custom',
  path: 'M10,10 L100,10 Q110,10 110,20 L110,50 Q110,60 100,60 L10,60 Z'
}
```

**Files to Modify**:
- `src/cards/renderers/SimpleButtonRenderer.js` (add path rendering)

---

## Prioritized Implementation Order

### **Sprint 1: Foundation (Week 1-2)**
1. ✅ Phase 1.1 - Button Style Presets (ALL types)
2. ✅ Phase 1.2 - Theme Token Enhancements

**Outcome**: 12-15 button variants ready to use

---

### **Sprint 2: Visual Polish (Week 3-4)**
3. ✅ Phase 2.1 - Icon Support (left/right positions)
4. ✅ Phase 2.2 - Border Variants (picard styles)

**Outcome**: Buttons with icons, all legacy styles replicated

---

### **Sprint 3: Advanced Text (Week 5-6)**
5. ✅ Phase 3.1 - Multi-Text Field System
6. ✅ Phase 3.2 - Text Style Presets

**Outcome**: Complex multi-label buttons, label-state combos

---

### **Sprint 4: Sizing (Week 7)**
7. ✅ Phase 4.1 - ResizeObserver Auto-Sizing
8. ✅ Phase 4.2 - HA Grid Integration

**Outcome**: Buttons adapt to layout, proper grid behavior

---

### **Sprint 5: Future-Proofing (Week 8+)**
9. 🔮 Phase 5.1 - Gradient Fills
10. 🔮 Phase 5.2 - Label Card Prep (extract shared code)
11. 🔮 Phase 5.3 - Animation Presets
12. 🔮 Phase 5.4 - Custom Shapes

**Outcome**: Advanced features, foundation for next card types

---

## Dependencies & Blockers

### **Critical Path**:
```
Phase 1 (Presets) → Phase 2 (Icons) → Phase 3 (Multi-Text)
                                    ↓
                            Phase 4 (Sizing)
                                    ↓
                            Phase 5 (Advanced)
```

### **Parallel Work Possible**:
- Phase 1.1 and 1.2 can happen together
- Phase 2.1 and 2.2 are independent
- Phase 4.1 and 4.2 can be done separately

---

## Additional Considerations

### **Testing Strategy**:
- Create test HTML files for each phase (like `test-v2-foundation.html`)
- Test all button presets with:
  - Different entity states (on/off/unavailable)
  - Theme switching (verify token resolution)
  - Animation triggers (hover/tap/hold)

### **Documentation Needs**:
- Preset catalog (visual guide to all button types)
- Configuration examples (YAML snippets for common setups)
- Migration guide (legacy YAML → SimpleButton config)

### **Performance Targets**:
- SVG rendering < 16ms (60 FPS)
- ResizeObserver throttling (avoid layout thrashing)
- Template processing cache (reduce re-computation)

---

## Questions for Discussion

1. **Preset Naming**: Do we want to keep legacy names (`picard`, `bullet`) or create a new naming scheme (`rounded-left`, `outline-square`)?

2. **Icon Library**: Should we support both MDI icons (via `<foreignObject>`) and SVG icon paths? Or focus on one?

3. **Text Overflow**: For long labels, do we want:
   - Ellipsis (`...`)
   - Shrink-to-fit (reduce font size)
   - Wrap to multi-line (complex)

4. **Animation Defaults**: Should buttons have hover animations by default, or opt-in only?

5. **Color Overrides**: Allow users to override preset colors at config level, or enforce presets strictly?

6. **Future Card Types**: After buttons, what's the priority order?
   - Labels/Text cards
   - Status Grid cards
   - Gauge/Chart cards
   - Custom SVG overlay cards

---

## Summary

This roadmap provides a **clear, sequential path** to a feature-complete button system while maintaining flexibility for future card types. The foundation work in Phases 1-2 unblocks all subsequent features, making it the highest priority.

The multi-text system (Phase 3) is the most complex feature but also the most powerful for advanced users. Getting that right early enables creative button layouts.

Auto-sizing (Phase 4) is a UX win but not technically blocking, making it a good candidate for parallel development once the visual features are solid.

Phase 5 features are "icing on the cake" and can be deferred or implemented as community contributions once the core system is stable.

**Recommendation**: Start with Sprint 1 (presets) immediately. This will provide instant visual variety and validate the token → preset → renderer pipeline before tackling more complex features.
