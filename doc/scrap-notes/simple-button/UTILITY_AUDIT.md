# Utility Functions Audit - Button Card vs. src/utils

**Date:** November 16, 2025
**Context:** Pre-button presets refactoring
**Question:** Are we duplicating utility functions? Where should they live?

---

## Findings Summary

### 🔴 **DUPLICATED:** `deepMerge` exists in 3 places!

1. **`src/utils/deepMerge.js`** (canonical version)
   - Used by: animation presets, animation resolvers
   - Exports: `deepMerge()` and `isPlain()` helper

2. **`src/core/config-manager/merge-helpers.js`** (enhanced version)
   - Used by: CoreConfigManager
   - Exports: `deepMerge()` with provenance tracking
   - Additional features: `trackFieldSources()` for config layer tracking

3. **`src/cards/lcards-simple-button.js`** (local copy)
   - Lines 320-337
   - Used only by button card
   - **SHOULD BE REMOVED** and use `src/utils/deepMerge.js`

### ✅ **UNIQUE:** Other button card utilities

- `_resolveThemeTokensRecursive()` - No existing equivalent
- `_escapeHtml()` - No existing equivalent (SVG-specific)
- `_getButtonState()` - Card-specific logic

---

## Deep Dive: Three `deepMerge` Implementations

### 1. `src/utils/deepMerge.js` (Canonical)

```javascript
export function isPlain(o) {
  return o && typeof o === 'object' && !Array.isArray(o);
}

export function deepMerge(target, source) {
  if (!isPlain(source)) return source;
  if (!isPlain(target)) target = {};
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];
    if (isPlain(sv) && isPlain(tv)) {
      target[k] = deepMerge(tv, sv);
    } else {
      // Arrays & scalars replace (per spec).
      target[k] = sv;
    }
  }
  return target;
}
```

**Behavior:**
- Mutates target (modifies in place)
- Uses `isPlain()` helper to check for plain objects
- Arrays and primitives replace (no merge)
- Recursively merges plain objects

**Used by:**
- `src/core/animation/presets.js`
- `src/core/animation/resolveAnimations.js`
- `src/core/animation/resolveTimelines.js`

### 2. `src/core/config-manager/merge-helpers.js` (Enhanced)

```javascript
export function deepMerge(target, source) {
  // Handle null/undefined
  if (!source) return target;
  if (!target) return source;

  // Create result from target
  const result = { ...target };

  // Merge each property from source
  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      // Explicit null/undefined overrides
      result[key] = value;
    } else if (Array.isArray(value)) {
      // Arrays overwrite (no merge)
      result[key] = [...value];
    } else if (typeof value === 'object' && value.constructor === Object) {
      // Plain objects - recurse
      result[key] = deepMerge(result[key] || {}, value);
    } else {
      // Primitives, functions, class instances - overwrite
      result[key] = value;
    }
  }
  return result;
}
```

**Behavior:**
- Does NOT mutate (creates new object)
- Handles null/undefined explicitly
- Uses `value.constructor === Object` check
- Clones arrays (prevents mutation)

**Used by:**
- CoreConfigManager (config layer merging with provenance tracking)

### 3. `src/cards/lcards-simple-button.js` (Button Card)

```javascript
_deepMerge(base, override) {
    if (!override || typeof override !== 'object') return base;
    if (!base || typeof base !== 'object') return override;

    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively merge nested objects
            result[key] = this._deepMerge(result[key], value);
        } else {
            // Override with new value
            result[key] = value;
        }
    }

    return result;
}
```

**Behavior:**
- Does NOT mutate (creates new object)
- Simple null/undefined check
- Uses `typeof === 'object' && !Array.isArray()` check
- Arrays and primitives replace

**Used by:**
- Button card only (4 places)

---

## Comparison Table

| Feature | utils/deepMerge | config-manager/merge-helpers | button card |
|---------|-----------------|------------------------------|-------------|
| Mutates target | ✅ Yes | ❌ No | ❌ No |
| Handles null | ❌ Returns source | ✅ Explicit override | ⚠️ Returns base |
| Array handling | Replace | Clone + replace | Replace |
| Object check | `isPlain()` helper | `constructor === Object` | `typeof + !Array` |
| Used by | Animations (3) | ConfigManager (1) | Button (4) |
| Provenance tracking | ❌ No | ✅ Yes (separate fn) | ❌ No |

---

## Key Differences & Implications

### 1. Mutation Behavior

**`utils/deepMerge`** mutates the target:
```javascript
const a = { x: 1 };
const b = { y: 2 };
const result = deepMerge(a, b);
// a is now { x: 1, y: 2 } (MUTATED!)
// result === a (same reference)
```

**Others** create new objects:
```javascript
const a = { x: 1 };
const b = { y: 2 };
const result = deepMerge(a, b);
// a is still { x: 1 } (unchanged)
// result is { x: 1, y: 2 } (new object)
```

**Impact:** Animation code must be careful not to rely on target mutation. Button card expects immutability.

### 2. Null/Undefined Handling

**`utils/deepMerge`:**
- `deepMerge({a: 1}, null)` → `null`
- `deepMerge(null, {a: 1})` → `{a: 1}`

**`config-manager/deepMerge`:**
- `deepMerge({a: 1}, null)` → `{a: 1}` (source ignored)
- `deepMerge({a: 1}, {b: null})` → `{a: 1, b: null}` (explicit override)

**`button card`:**
- `deepMerge({a: 1}, null)` → `{a: 1}` (override ignored)
- `deepMerge(null, {a: 1})` → `{a: 1}` (base ignored)

**Impact:** Button card's behavior is most defensive (ignores nullish values).

### 3. Performance

**Mutation (utils):** Fastest (no object creation)
**Immutable (others):** Slower (creates new objects at each level)

For animation performance, mutation might be preferred.
For config/style resolution, immutability is safer.

---

## Recommendations

### ✅ Use Existing `src/utils/deepMerge.js` for Button Card

**Action:** Replace button card's `_deepMerge()` with import from `src/utils/deepMerge.js`

**Reasoning:**
1. Button card doesn't need the immutability (style resolution is one-time)
2. Performance benefit from mutation is negligible for button rendering
3. Reduces code duplication
4. Animation system already uses this version successfully

**Changes Required:**
```javascript
// At top of lcards-simple-button.js
import { deepMerge } from '../utils/deepMerge.js';

// Replace all calls:
// OLD: style = this._deepMerge({}, preset);
// NEW: style = deepMerge({}, preset);

// Remove _deepMerge() method entirely (lines 320-337)
```

**Risk:** Mutation behavior might surprise if code relies on immutability
- **Mitigation:** Always pass empty object `{}` as first arg: `deepMerge({}, source)`

### ⚠️ Consider Standardizing on Immutable Version

**Long-term consideration:** The config-manager version is safer (no mutation)

**Benefits:**
- Predictable behavior (no surprise mutations)
- Safer for React-style state management
- Easier to debug (source objects unchanged)

**Drawbacks:**
- Performance cost (creates many intermediate objects)
- Would require updating animation code

**Recommendation:** Keep both for now, document the difference, consider unifying in future refactor.

---

## Other Utility Functions from Button Card

### 1. `_resolveThemeTokensRecursive(obj)` - Lines 345-392

**Purpose:**
- Recursively resolve `theme:` tokens
- Resolve computed tokens (`alpha()`, `darken()`, `lighten()`)

**Decision:** ✅ **Move to `src/utils/lcards-theme.js`**

**Reasoning:**
- Theme-specific logic belongs with other theme utilities
- `lcards-theme.js` already has `loadFont()`, `loadCoreFonts()`
- Other cards will need recursive theme token resolution
- Name: `resolveThemeTokensRecursive(obj, themeManager)`

**Implementation:**
```javascript
// In src/utils/lcards-theme.js
export function resolveThemeTokensRecursive(obj, themeManager) {
  if (!obj || typeof obj !== 'object' || !themeManager) {
    return obj;
  }
  // ... (move logic from button card)
}

// In button card, replace with:
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
// ... later ...
configWithTokens = resolveThemeTokensRecursive(configWithTokens, this._singletons.themeManager);
```

### 2. `_escapeHtml(text)` - Lines 1941-1953

**Purpose:**
- Escape HTML/SVG special characters
- Security: prevent XSS in SVG text content

**Current Implementation:**
```javascript
_escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

**Decision:** ✅ **Move to new `src/utils/StringUtils.js`**

**Reasoning:**
- General string utility, not card-specific
- Any card rendering user text needs this
- Status cards, label cards, etc. will need it
- Good foundation for future string utilities

**New File:**
```javascript
// src/utils/StringUtils.js
/**
 * String manipulation utilities for LCARdS cards
 */

/**
 * Escape HTML/SVG special characters for safe rendering
 * Prevents XSS attacks in user-provided text
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for SVG/HTML
 */
export function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Future additions:
// - truncate(text, maxLength)
// - capitalize(text)
// - camelToKebab(text)
// etc.
```

### 3. `_getButtonState()` - Lines 832-853

**Purpose:**
- Translate HA entity state to card state
- Returns: `active`, `inactive`, `unavailable`, `default`

**Decision:** 🤔 **Move to base class as `_getEntityState()` OR stay in button card**

**Reasoning for base class:**
- Status cards, indicators, etc. need similar logic
- General pattern for entity-driven cards

**Reasoning to keep in button:**
- State mapping is domain-specific (button vs. status vs. indicator)
- Status cards might have different active/inactive rules
- Better as subclass responsibility with option to override

**Recommendation:** **Keep in button card for now**, but if we see same logic in 2+ cards, extract to base class or utility.

---

## Implementation Plan

### Phase 1: Replace `_deepMerge` with utils version (~10 min)

1. **Add import** to button card:
   ```javascript
   import { deepMerge } from '../utils/deepMerge.js';
   ```

2. **Replace all calls** (4 locations):
   ```javascript
   // Line ~448: style = deepMerge({}, preset);
   // Line ~472: style = deepMerge(style, configWithTokens);
   // Line ~329 (recursive): Remove entire method
   ```

3. **Remove method** (lines 320-337)

4. **Test:** Verify button presets still work

### Phase 2: Move theme token resolver (~10 min)

1. **Move to `src/utils/lcards-theme.js`**:
   ```javascript
   export function resolveThemeTokensRecursive(obj, themeManager) { ... }
   ```

2. **Update button card imports**:
   ```javascript
   import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
   ```

3. **Replace method call**:
   ```javascript
   // OLD: configWithTokens = this._resolveThemeTokensRecursive(configWithTokens);
   // NEW: configWithTokens = resolveThemeTokensRecursive(configWithTokens, this._singletons.themeManager);
   ```

### Phase 3: Move HTML escaper (~5 min)

1. **Create `src/utils/StringUtils.js`** with `escapeHtml()`

2. **Update button card imports**:
   ```javascript
   import { escapeHtml } from '../utils/StringUtils.js';
   ```

3. **Replace method call**:
   ```javascript
   // OLD: this._escapeHtml(field.content)
   // NEW: escapeHtml(field.content)
   ```

**Total Effort:** ~25 minutes

---

## Decision Matrix

| Utility | Current Location | Recommendation | New Location | Effort |
|---------|------------------|----------------|--------------|--------|
| `_deepMerge()` | Button card | ✅ Use existing | `src/utils/deepMerge.js` | 10 min |
| `_resolveThemeTokensRecursive()` | Button card | ✅ Move to utils | `src/utils/lcards-theme.js` | 10 min |
| `_escapeHtml()` | Button card | ✅ Move to utils | `src/utils/StringUtils.js` (new) | 5 min |
| `_getButtonState()` | Button card | ⏸️ Keep for now | Button card | 0 min |

---

## Conclusion

**YES**, we should use the existing utilities:

1. ✅ **Replace button card's `_deepMerge()`** with `src/utils/deepMerge.js`
   - Already exists and tested
   - Used by animation system
   - Removes duplication

2. ✅ **Move `_resolveThemeTokensRecursive()`** to `src/utils/lcards-theme.js`
   - Theme-specific utility
   - Other cards will need this
   - Natural fit with existing theme utilities

3. ✅ **Move `_escapeHtml()`** to new `src/utils/StringUtils.js`
   - General string utility
   - Security best practice
   - Foundation for future string helpers

4. ⏸️ **Keep `_getButtonState()`** in button card (for now)
   - Domain-specific logic
   - May differ for other card types
   - Extract later if pattern repeats

**Total refactor time:** ~25 minutes
**Benefit:** Cleaner code, better separation of concerns, reusable utilities

Ready to proceed with this refactor?
