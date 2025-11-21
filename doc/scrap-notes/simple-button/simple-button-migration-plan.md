# Simple Button Card - Schema Migration Plan (v1.10.69)

**Date:** November 15, 2025
**Status:** 🎯 READY FOR REVIEW - Please approve before code changes
**Estimated Work:** 2-3 hours of focused implementation

---

## What We've Done

✅ **Created definitive schema document** (`SIMPLE_BUTTON_SCHEMA_DEFINITION.md`)
✅ **Updated theme tokens** (`lcarsClassicTokens.js` - button.base structure)

---

## What Needs To Be Done

### 1. Update Presets (15 minutes)

**File:** `src/core/packs/loadBuiltinPacks.js`

**Current (flat):**
```javascript
lozenge: {
  extends: 'button.base',
  border_radius_top_left: '...',  // FLAT
  border_radius_top_right: '...',
  // ...
}
```

**New (nested):**
```javascript
lozenge: {
  extends: 'button.base',
  border: {
    radius: {
      top_left: '50%',
      top_right: '50%',
      bottom_right: '50%',
      bottom_left: '50%'
    }
  }
}
```

---

### 2. Update Button Resolution Code (30-45 minutes)

**File:** `src/cards/lcards-simple-button.js`

#### A. `_resolveButtonStyleSync()` - Lines ~310-430

**Current:** Writes to flat keys
```javascript
style.background_color = backgroundColor;
style.text_color = textColor;
```

**New:** Write to nested paths
```javascript
if (!style.card) style.card = {};
if (!style.card.color) style.card.color = {};
if (!style.card.color.background) style.card.color.background = {};
style.card.color.background[buttonState] = backgroundColor;

if (!style.text) style.text = {};
if (!style.text.default) style.text.default = {};
if (!style.text.default.color) style.text.default.color = {};
style.text.default.color[buttonState] = textColor;
```

**Add fallback reads** for backward compatibility:
```javascript
// Read from nested first, fall back to flat
const backgroundColor =
  style?.card?.color?.background?.[buttonState] ||
  style?.card?.color?.background?.default ||
  style?.background_color ||  // Backward compat
  'var(--lcars-orange)';
```

---

#### B. `_generateSimpleButtonSVG()` - Lines ~750-800

**Current:** Reads flat keys
```javascript
const backgroundColor = this._buttonStyle?.background_color || ...;
const textColor = this._buttonStyle?.text_color || ...;
```

**New:** Read from nested with fallbacks
```javascript
const buttonState = this._buttonStyle?._currentState || 'active';

const backgroundColor =
  this._buttonStyle?.card?.color?.background?.[buttonState] ||
  this._buttonStyle?.card?.color?.background?.default ||
  this._buttonStyle?.background_color ||  // Backward compat
  'var(--lcars-orange)';

const textColor =
  this._buttonStyle?.text?.default?.color?.[buttonState] ||
  this._buttonStyle?.text?.default?.color?.default ||
  this._buttonStyle?.text_color ||  // Backward compat
  'black';
```

---

#### C. `_resolveBorderConfiguration()` - Lines ~850-900

**Current:** Reads `border_radius`, `border_radius_top_left`, etc.

**New:** Read from `border.radius` with fallbacks
```javascript
// Check nested schema first
const radiusConfig = this._buttonStyle?.border?.radius;

if (radiusConfig && typeof radiusConfig === 'object') {
  // Per-corner nested
  border.hasIndividualRadius = true;
  border.topLeft = radiusConfig.top_left || '0px';
  border.topRight = radiusConfig.top_right || '0px';
  border.bottomRight = radiusConfig.bottom_right || '0px';
  border.bottomLeft = radiusConfig.bottom_left || '0px';
} else if (radiusConfig) {
  // Uniform nested
  border.radius = radiusConfig;
} else {
  // Backward compat - flat keys
  border.radius = this._buttonStyle?.border_radius || '8px';
  border.topLeft = this._buttonStyle?.border_radius_top_left || null;
  // ...
}

// Border width - uniform or per-side
const widthConfig = this._buttonStyle?.border?.width;
if (widthConfig && typeof widthConfig === 'object') {
  // Per-side nested
  border.hasIndividualSides = true;
  border.widthTop = widthConfig.top || '2px';
  border.widthRight = widthConfig.right || '2px';
  border.widthBottom = widthConfig.bottom || '2px';
  border.widthLeft = widthConfig.left || '2px';
} else {
  // Uniform
  border.width = widthConfig || this._buttonStyle?.border_width || '2px';
}

// Individual side styling (advanced)
if (this._buttonStyle?.border?.top) {
  border.top = {
    width: this._buttonStyle.border.top.width || border.width,
    color: this._buttonStyle.border.top.color || borderColor
  };
}
// ...same for right, bottom, left

// Border color
const buttonState = this._getButtonState();
const borderColor = 
  this._buttonStyle?.border?.color?.[buttonState] ||
  this._buttonStyle?.border?.color?.default ||
  this._buttonStyle?.border_color ||  // Backward compat
  'black';
```---

### 3. Update Documentation (30-45 minutes)

**File:** `doc/user-guide/configuration/simple-button-card.md`

**Changes:**
1. Replace all schema sections with new nested structure
2. Fix all Rules Engine examples to use `when`/`apply` syntax
3. Fix all icon examples to use HA-style `icon: 'mdi:lightbulb'`
4. Update all color paths to `card.color.background.{state}`
5. Update all text paths to `text.default.{property}`
6. Update all border paths to `border.{width|radius|color}`
7. Add comprehensive YAML schema example at bottom (from SIMPLE_BUTTON_SCHEMA_DEFINITION.md)

---

### 4. Update Testing Guide (20-30 minutes)

**File:** `doc/user-guide/testing/simple-button-testing.md`

**Fix all 20 test configs:**
- Use nested schema for all properties
- Use correct rules syntax (`when`/`apply`)
- Use HA-style icon syntax

---

### 5. Build & Test (15-20 minutes)

- Build with `npm run build`
- Load in browser
- Test with quick-start tests
- Verify backward compatibility with flat keys

---

## Backward Compatibility Strategy

**Critical:** Must support both schemas during transition.

### Resolution Priority

When resolving a style property:

1. **Check nested schema first** (new way)
   - `style.card.color.background.active`
2. **Fall back to flat key** (old way)
   - `style.background_color`
3. **Fall back to theme token** (if not in config)
   - `theme:components.button.base.background.active`
4. **Fall back to hardcoded default**
   - `'var(--lcars-orange)'`

### Example Fallback Chain

```javascript
const backgroundColor =
  // 1. Nested schema (new)
  style?.card?.color?.background?.[buttonState] ||
  style?.card?.color?.background?.default ||

  // 2. Flat key (backward compat)
  style?.background_color ||

  // 3. Theme token (if not in config)
  this.getThemeToken(`components.button.base.background.${buttonState}`) ||

  // 4. Hardcoded default
  'var(--lcars-orange)';
```

---

## Testing Checklist

After implementation, verify:

### Nested Schema
- [ ] `card.color.background.{state}` works
- [ ] `border.{width|radius|color}` works
- [ ] `text.default.{color|font_*}` works

### Backward Compatibility
- [ ] Flat `background_color` still works
- [ ] Flat `text_color` still works
- [ ] Flat `border_radius` still works
- [ ] Flat `border_width` still works

### Computed Tokens
- [ ] `alpha()` resolves in nested schema
- [ ] `darken()` resolves in nested schema
- [ ] Theme tokens resolve in nested schema

### State Changes
- [ ] Entity toggle updates colors instantly
- [ ] No black screen on state change
- [ ] State-specific colors apply correctly

### Rules Engine
- [ ] Rules with `when`/`apply` work
- [ ] Rules can patch nested schema
- [ ] JavaScript conditions work
- [ ] Jinja2 conditions work

### Icons
- [ ] `icon: 'mdi:lightbulb'` works
- [ ] `icon: 'entity'` works
- [ ] Advanced icon config works

---

## Risk Assessment

### Low Risk ✅
- Theme token updates (done)
- Documentation updates (no code changes)
- Testing guide updates (no code changes)

### Medium Risk ⚠️
- Preset updates (simple structure change)
- Border configuration code (isolated function)

### Higher Risk 🔴
- Resolution code (`_resolveButtonStyleSync`)
- Rendering code (`_generateSimpleButtonSVG`)

**Mitigation:** Extensive fallback chains ensure nothing breaks.

---

## Implementation Order

**Recommended sequence:**

1. ✅ **Theme tokens** (DONE)
2. **Presets** (simple, low risk)
3. **Button code - border config** (isolated, medium risk)
4. **Button code - resolution** (higher risk, test thoroughly)
5. **Button code - rendering** (higher risk, test after each change)
6. **Build & quick test** (verify backward compat)
7. **Documentation** (once code is stable)
8. **Testing guide** (once docs are finalized)
9. **Full systematic testing** (20 test suite)

---

## Time Estimate

- Presets: 15 min
- Border code: 20 min
- Resolution code: 30 min
- Rendering code: 20 min
- Build & quick test: 15 min
- Documentation: 45 min
- Testing guide: 30 min
- Full testing: 60 min

**Total:** ~3-4 hours focused work

---

## Ready to Proceed?

**Next steps:**
1. You review this plan
2. Confirm approach is sound
3. I implement in the order above
4. We test systematically

**Alternative:**
- Start with just documentation updates?
- Test old configs still work before changing code?
- Phase the rollout?

---

**Status:** 🎯 Awaiting your approval to proceed
**Current:** Theme tokens updated, schema documented
**Next:** Update presets, then button code
