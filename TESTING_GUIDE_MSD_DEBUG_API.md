# MSD Debug API Integration - Manual Testing Guide

## Overview

This guide helps validate the fixes for MSD Debug API integration and multi-instance discovery (PRs #166-#172).

## What Was Fixed

### Bug 1: MsdDebugAPI Not Imported ✅ FIXED
- **Issue**: `src/api/MsdDebugAPI.js` existed but was never imported or instantiated
- **Fix**: Import and instantiate MsdDebugAPI in `src/msd/index.js`
- **Impact**: All new debug methods are now accessible

### Bug 2: Wrong Tag Selector ✅ FIXED
- **Issue**: Used `document.querySelector('lcards-msd')` but actual tag is `lcards-msd-card`
- **Fix**: Use SystemsManager to access registered cards instead of DOM queries
- **Impact**: Multi-card detection now works correctly across shadow DOM boundaries

### Bug 3: Config ID Not Applied ✅ FIXED
- **Issue**: Config `id` attribute was not applied to DOM element
- **Fix**: Apply config ID in `connectedCallback()` 
- **Impact**: Can now target specific cards by config ID

## Build Instructions

After cloning/pulling this branch:

```bash
cd /path/to/LCARdS
npm install
npm run build
```

Copy `dist/lcards.js` to your Home Assistant installation:
```bash
cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
```

Then hard refresh your browser (Ctrl+Shift+R).

## Testing Validation

### Test 1: Debug API Loaded

**Expected**: New debug methods exist on the API

```javascript
// Open browser console on Home Assistant dashboard
console.log('listMsdCards exists:', typeof window.lcards.debug.msd.listMsdCards === 'function');
// ✅ Expected: true

// Check other new methods
console.log('inspect exists:', typeof window.lcards.debug.msd.inspect === 'function');
console.log('getRouterMetrics exists:', typeof window.lcards.debug.msd.routing === 'object');
console.log('getPerf exists:', typeof window.lcards.debug.msd.perf === 'object');
// ✅ Expected: all true
```

### Test 2: List Cards Works

**Setup**: Create a dashboard with at least 1 MSD card. Set `id: bridge` in the YAML config.

**Test**:
```javascript
const cards = window.lcards.debug.msd.listMsdCards();
console.log('Found cards:', cards);
```

**Expected Output**:
```javascript
[
  {
    id: 'bridge',              // ✅ Config ID (not "unnamed")
    systemId: 'lcards-abc123', // ✅ Internal system ID
    hasConfig: true,
    hasPipeline: true,
    overlayCount: 0,           // Varies based on your config
    routingChannels: 0,        // Varies based on your config
    element: <lcards-msd-card> // ✅ Element reference
  }
]
```

### Test 3: Multi-Card Warning (With 2+ Cards)

**Setup**: Create a dashboard with 2 MSD cards:
- Card 1: `id: bridge`
- Card 2: `id: engineering`

**Test**:
```javascript
// Call a lightweight method without specifying card ID (triggers warning)
const result = window.lcards.debug.msd.overlays.list();
console.log('Overlays from first card:', result.length);
```

**Expected Console Output**:
```
⚠️ Multiple MSD cards detected (2: bridge, engineering). 
Using first card. To list all cards: listMsdCards(). 
To target specific card, pass card ID as second parameter: methodName(arg, 'bridge')

Overlays from first card: 0 (or however many overlays exist)
```

**Then test targeting specific cards**:
```javascript
const bridgeOverlays = window.lcards.debug.msd.overlays.list('bridge');
const engOverlays = window.lcards.debug.msd.overlays.list('engineering');

console.log('Bridge overlays:', bridgeOverlays.length);
console.log('Engineering overlays:', engOverlays.length);
// ✅ Expected: No warning, returns correct overlays for each card
```

### Test 4: Target Specific Card

**Setup**: Same as Test 3 (2 cards)

**Test**:
```javascript
const bridgePerf = window.lcards.debug.msd.perf.summary('bridge');
const engPerf = window.lcards.debug.msd.perf.summary('engineering');

console.log('Bridge card performance:', bridgePerf);
console.log('Engineering card performance:', engPerf);
```

**Expected**: Both calls return performance data for their respective cards (not the same data).

### Test 5: Element ID Applied

**Setup**: MSD card with `id: bridge` in YAML config

**Test**:
```javascript
// Get the card via SystemsManager
const sm = window.lcards.core.systemsManager;
const cards = [];
sm._registeredCards.forEach((cardData) => {
  if (cardData.card?.tagName === 'LCARDS-MSD-CARD') {
    cards.push(cardData);
  }
});

console.log('First card element ID:', cards[0].card.id);
```

**Expected Output**:
```
First card element ID: bridge  ✅ (not empty string)
```

### Test 6: Production Helpers Work

**Test**:
```javascript
// Get all MSD cards
const allCards = window.lcards.cards.msd.getAll();
console.log('Total MSD cards:', allCards.length);

// Get card by config ID
const bridgeCard = window.lcards.cards.msd.getById('bridge');
console.log('Bridge card found:', !!bridgeCard);
console.log('Bridge card ID:', bridgeCard?.id);
```

**Expected Output**:
```
Total MSD cards: 2  ✅ (or however many you have)
Bridge card found: true  ✅
Bridge card ID: bridge  ✅
```

### Test 7: Legacy Utilities Still Work

**Test**:
```javascript
// These should still exist for backwards compatibility
console.log('mergePacks exists:', typeof window.lcards.debug.msd.mergePacks === 'function');
console.log('buildCardModel exists:', typeof window.lcards.debug.msd.buildCardModel === 'function');
console.log('initMsdPipeline exists:', typeof window.lcards.debug.msd.initMsdPipeline === 'function');
```

**Expected Output**:
```
mergePacks exists: true  ✅
buildCardModel exists: true  ✅
initMsdPipeline exists: true  ✅
```

### Test 8: Provenance Tracking Works

**Setup**: MSD card with `id: bridge` in YAML config

**Test**:
```javascript
// Get the card
const card = window.lcards.cards.msd.getById('bridge');

// Check provenance via config
console.log('Config has __provenance:', !!card.config.__provenance);
console.log('Provenance merge_order:', card.config.__provenance?.merge_order);

// Check provenance via card method
const provenance = card.getProvenance();
console.log('Card provenance:', provenance);

// Test performance methods now work
const perfSummary = window.lcards.debug.msd.perf.summary('bridge');
console.log('Performance summary:', perfSummary);
```

**Expected Output**:
```javascript
Config has __provenance: true  ✅
Provenance merge_order: ['card-defaults', 'theme-defaults', 'user-config']  ✅

Card provenance: {
  config: {
    merge_order: [...],
    field_sources: {...},
    card_type: 'msd',
    timestamp: 1704729600000
  },
  theme_tokens: {...},
  rule_patches: {}
}  ✅

Performance summary: {
  stage: 'complete',
  totalTime: 145.2,
  phases: {...}
}  ✅
```

**What This Tests:**
- ✅ Config has `__provenance` attached (the main fix)
- ✅ Provenance accessible via `card.getProvenance()`
- ✅ Debug API methods that require provenance now work
- ✅ MSD aligned with other LCARdS cards

## Common Issues

### Issue: "SystemsManager not available"
**Cause**: Core not initialized yet  
**Fix**: Wait a moment after page load, then retry

### Issue: Cards array is empty
**Cause**: MSD cards not registered yet  
**Fix**: Ensure cards are visible on dashboard and fully loaded

### Issue: Config ID is 'unnamed'
**Cause**: No `id` attribute in card YAML config  
**Fix**: Add `id: your-card-name` to the MSD card YAML config

## Architecture Notes

### Why SystemsManager?

Home Assistant uses nested shadow DOMs:
```
document (light DOM)
  └─ home-assistant (shadow root)
      └─ home-assistant-main (shadow root)
          └─ ha-panel-lovelace (shadow root)
              └─ hui-view (shadow root)
                  └─ hui-card (shadow root)
                      └─ lcards-msd-card ← YOUR CARD
```

**`document.querySelector()` cannot pierce shadow boundaries.**

SystemsManager maintains a registry of all LCARdS cards:
```javascript
systemsManager._registeredCards = Map {
  'lcards-4hhmmxdof' => {
    card: <lcards-msd-card>,     // ← Direct element reference
    config: {...},
    cardId: 'lcards-4hhmmxdof'
  }
}
```

This is the **canonical way** to access card instances in LCARdS architecture.

## Migration Notes

### Breaking Changes: ❌ NONE
- New API is additive (adds missing functionality)
- Method signatures changed from `cardSelector` to `cardId`, but default behavior (no param = first card) is preserved
- Legacy utilities kept for backwards compatibility

### Parameter Changes

**Before**:
```javascript
window.lcards.debug.msd.routing.inspect('overlay1', 'lcards-msd[id="bridge"]')
```

**After**:
```javascript
window.lcards.debug.msd.routing.inspect('overlay1', 'bridge')
```

The new parameter is simpler - just pass the config ID directly instead of a CSS selector.

## Success Criteria

All tests pass:
- [ ] Test 1: Debug API methods exist
- [ ] Test 2: `listMsdCards()` returns correct card info
- [ ] Test 3: Multi-card warning shows correct IDs
- [ ] Test 4: Can target specific cards by config ID
- [ ] Test 5: Element ID attribute matches config ID
- [ ] Test 6: Production helpers work correctly
- [ ] Test 7: Legacy utilities still accessible

## Reporting Issues

If you encounter issues during testing:

1. Check browser console for error messages
2. Verify build succeeded: `npm run build`
3. Confirm `dist/lcards.js` was copied to HA
4. Hard refresh browser (Ctrl+Shift+R)
5. Check that MSD cards have `id` attributes in config
6. Report with:
   - Browser console output
   - MSD card YAML config
   - Steps to reproduce

---

**Last Updated**: 2026-01-08  
**Branch**: copilot/fix-msd-debug-api-integration  
**Related PRs**: #166-#172
