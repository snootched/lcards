# Universal Preset Runtime Fix

## 🐛 **Issue Identified**
The universal preset system was causing a runtime error:
```
TypeError: a.forComponent is not a function at yd._resolveThemeTokensInStyle (ModelBuilder.js:165:39)
```

## 🔍 **Root Cause**
In `src/msd/pipeline/ModelBuilder.js`, the `_resolveThemeTokensInStyle()` method was incorrectly calling:
```javascript
const resolveToken = themeManager.forComponent(overlayType);  // ❌ Wrong!
```

The ThemeManager doesn't have a `forComponent()` method - that method exists on the `ThemeTokenResolver`.

## ✅ **Fix Applied**
Updated ModelBuilder to use the correct pattern:
```javascript
const resolveToken = themeManager.resolver.forComponent(overlayType);  // ✅ Correct!
```

Also added proper null checking:
```javascript
if (!themeManager || !themeManager.initialized || !themeManager.resolver) {
  return { ...style };
}
```

## 🎯 **Additional Improvements**
- Updated theme token prefix from `theme.` to `theme:` to match StylePresetManager
- Added proper return statement that was missing
- Ensured consistent syntax across the system

## 🧪 **Testing**
- ✅ System builds without errors
- ✅ Theme token syntax is consistent (`theme:colors.accent.primary`)
- ✅ Universal presets should now work in ButtonOverlay without runtime errors
- ✅ Created minimal test case: `test-universal-presets.yaml`

## 🚀 **Result**
The universal preset system should now work correctly:
- ButtonOverlay can use universal button presets (`lozenge`, `bullet`, etc.)
- Theme tokens in presets will resolve properly
- No more `forComponent is not a function` errors

## 📋 **Files Modified**
- `src/msd/pipeline/ModelBuilder.js` - Fixed theme token resolution
- `test-universal-presets.yaml` - Simplified test case