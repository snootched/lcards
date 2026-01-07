# Testing Guide: AssetManager.loadSvg() Feature

## Overview

This guide describes how to test the new `loadSvg()` convenience method added to AssetManager.

## Changes Summary

1. **AssetManager**: Added `loadSvg(source)` method for unified SVG loading
2. **MSD Card**: Simplified `_loadBaseSvg()` to use new method (28 lines removed, -78%)
3. **Documentation**: Added comprehensive usage guide

## Testing Approach

### Phase 1: Browser Console Testing

#### Test 1: Basic API Tests

Open browser console and run:

```javascript
const am = window.lcards.core.assetManager;

// 1. Test builtin SVG loading
const builtinSvgs = am.listAssets('svg');
console.log('Available builtin SVGs:', builtinSvgs);

if (builtinSvgs.length > 0) {
  const svg = await am.loadSvg(`builtin:${builtinSvgs[0]}`);
  console.log('✓ Builtin SVG loaded:', svg ? 'SUCCESS' : 'FAILED');
}

// 2. Test 'none' handling
const none = await am.loadSvg('none');
console.log('✓ None returns null:', none === null);

// 3. Test null/undefined handling
const nullTest = await am.loadSvg(null);
console.log('✓ Null returns null:', nullTest === null);

// 4. Test invalid key
const invalid = await am.loadSvg('invalid-xyz');
console.log('✓ Invalid key returns null:', invalid === null);
```

**Expected Results:**
- ✓ Builtin SVG loaded successfully
- ✓ `none` returns `null` (no warning)
- ✓ `null` returns `null` (no warning)
- ✓ Invalid key returns `null` with warning in console

#### Test 2: Auto-Registration Tests

```javascript
const am = window.lcards.core.assetManager;

// Test auto-registration of /local/ path
const beforeCount = am.listAssets('svg').length;
console.log('SVGs before:', beforeCount);

// Load a hypothetical local SVG (won't actually load, but should register)
await am.loadSvg('/local/test-custom.svg');

const afterCount = am.listAssets('svg').length;
console.log('SVGs after:', afterCount);
console.log('✓ Auto-registered:', afterCount > beforeCount);

// Check if it's registered with correct key
console.log('✓ Key derived from filename:', am.getRegistry('svg').has('test-custom'));
```

**Expected Results:**
- ✓ SVG count increases by 1
- ✓ Key `test-custom` is registered
- ✓ Console shows: `[AssetManager] Auto-registered SVG: test-custom from /local/test-custom.svg`

### Phase 2: MSD Card Testing

#### Test 3: MSD Card with Builtin SVG

Create test card config:

```yaml
type: custom:lcards-msd
base_svg:
  source: builtin:lcars_master_systems_display_002
control_overlays:
  - id: test1
    type: picard_display_a
    top: 100
    left: 100
```

**Expected Results:**
- ✓ Card renders successfully
- ✓ SVG displays correctly
- ✓ Console shows: `[LCARdSMSDCard] SVG loaded: builtin:lcars_master_systems_display_002`

#### Test 4: MSD Card with No SVG

```yaml
type: custom:lcards-msd
base_svg:
  source: none
control_overlays:
  - id: test1
    type: picard_display_a
    top: 100
    left: 100
```

**Expected Results:**
- ✓ Card renders without SVG (overlays only)
- ✓ No errors in console
- ✓ No warning about SVG loading

#### Test 5: MSD Card with Local SVG (If Available)

```yaml
type: custom:lcards-msd
base_svg:
  source: /local/custom-msd.svg
control_overlays:
  - id: test1
    type: picard_display_a
    top: 100
    left: 100
```

**Expected Results:**
- ✓ Card attempts to load SVG
- ✓ Console shows auto-registration
- ✓ If file exists: SVG displays
- ✓ If file doesn't exist: Error logged but card renders without SVG

### Phase 3: Integration Testing

#### Test 6: Multiple MSD Cards

Create 3 MSD cards with different SVG sources:
1. Card 1: `builtin:lcars_master_systems_display_002`
2. Card 2: `builtin:lcars_master_systems_display_003`
3. Card 3: `none`

**Expected Results:**
- ✓ All cards render correctly
- ✓ Each card loads its specified SVG
- ✓ Card 3 renders without SVG
- ✓ No conflicts between cards

#### Test 7: Caching Behavior

```javascript
const am = window.lcards.core.assetManager;

// Time first load
console.time('First load');
await am.loadSvg('builtin:lcars_master_systems_display_002');
console.timeEnd('First load');

// Time second load (should be instant from cache)
console.time('Second load (cached)');
await am.loadSvg('builtin:lcars_master_systems_display_002');
console.timeEnd('Second load (cached)');
```

**Expected Results:**
- ✓ First load takes measurable time
- ✓ Second load is nearly instant (< 1ms)
- ✓ Same content returned both times

### Phase 4: Error Handling

#### Test 8: Network Errors

```javascript
// Test external URL that doesn't exist
await window.lcards.core.assetManager.loadSvg('https://example.com/nonexistent.svg');
// Expected: Error logged, returns null
```

#### Test 9: Invalid Sources

```javascript
const am = window.lcards.core.assetManager;

await am.loadSvg('');           // Empty string
await am.loadSvg('   ');        // Whitespace only
await am.loadSvg(undefined);    // Undefined
await am.loadSvg({});           // Object instead of string
```

**Expected Results:**
- ✓ All return `null`
- ✓ Appropriate warnings/errors logged
- ✓ No exceptions thrown

## Verification Checklist

- [ ] ✓ Builtin SVG loading works
- [ ] ✓ `none` source returns null without warning
- [ ] ✓ Invalid sources return null with warning
- [ ] ✓ Auto-registration works for `/local/` paths
- [ ] ✓ Auto-registration works for `http://` URLs
- [ ] ✓ Key derivation from filename works correctly
- [ ] ✓ MSD card renders with builtin SVG
- [ ] ✓ MSD card renders with no SVG (`none`)
- [ ] ✓ Multiple MSD cards work simultaneously
- [ ] ✓ Caching works (second load is instant)
- [ ] ✓ Error handling works correctly
- [ ] ✓ No console errors (only expected warnings)
- [ ] ✓ Code reduction achieved (-78% in MSD card)
- [ ] ✓ Documentation is clear and accurate

## Success Criteria

1. **Functionality**: All test cases pass
2. **Performance**: Cached loads are < 1ms
3. **Error Handling**: No uncaught exceptions
4. **Logging**: Appropriate debug/warn/error messages
5. **Code Quality**: Reduced complexity in MSD card
6. **Documentation**: Clear usage examples

## Regression Testing

Verify that existing functionality still works:

1. **Existing MSD cards**: All previous MSD configs render correctly
2. **Pack loading**: Builtin SVGs load from packs as before
3. **Asset registry**: Other asset types (fonts, audio) unaffected
4. **Editor**: MSD editor still functions correctly

## Future Enhancements

Potential improvements for future PRs:

1. Support for `data:` URLs (inline SVG)
2. Progress events for large external SVGs
3. SVG validation and sanitization improvements
4. Batch loading API (`loadSvgs([...sources])`)
5. Preloading API for critical SVGs

---

**Testing Status**: ✅ Ready for testing  
**Last Updated**: 2026-01-07
