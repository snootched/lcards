# MSD Pipeline Provenance Testing Guide

## Overview

This guide validates that the MSD pipeline correctly preserves the `__provenance` metadata from CoreConfigManager through the pipeline API.

## Prerequisites

1. Build LCARdS: `npm run build`
2. Copy `dist/lcards.js` to Home Assistant `www/community/lcards/`
3. Create a dashboard with at least one MSD card with `id` set in config
4. Hard refresh browser (Ctrl+Shift+R)

## Manual Testing Script

Open browser console on Home Assistant dashboard with MSD card(s) and run:

```javascript
// Test Suite: MSD Pipeline Provenance Preservation
(function testMsdPipelineProvenance() {
  console.log('%c=== MSD Pipeline Provenance Test Suite ===', 'color: #ff9900; font-weight: bold; font-size: 14px;');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function test(name, assertion, actual, expected) {
    const passed = assertion();
    results.tests.push({ name, passed, actual, expected });
    if (passed) {
      results.passed++;
      console.log(`%c✅ PASS%c ${name}`, 'color: #00ff00; font-weight: bold', 'color: inherit');
      if (actual !== undefined) {
        console.log('   Actual:', actual);
      }
    } else {
      results.failed++;
      console.error(`%c❌ FAIL%c ${name}`, 'color: #ff0000; font-weight: bold', 'color: inherit');
      console.log('   Expected:', expected);
      console.log('   Actual:', actual);
    }
  }
  
  // Test 1: Get MSD card
  console.log('\n%cTest 1: Card Discovery', 'color: #66ccff; font-weight: bold');
  const cards = window.lcards?.debug?.msd?.listMsdCards?.();
  test(
    'MSD Debug API exists',
    () => typeof window.lcards?.debug?.msd?.listMsdCards === 'function',
    typeof window.lcards?.debug?.msd?.listMsdCards,
    'function'
  );
  
  test(
    'At least one MSD card found',
    () => cards && cards.length > 0,
    cards?.length,
    '> 0'
  );
  
  if (!cards || cards.length === 0) {
    console.error('%c⚠️ No MSD cards found. Cannot continue tests.', 'color: #ffaa00; font-weight: bold');
    return results;
  }
  
  const cardInfo = cards[0];
  console.log('   Using card:', cardInfo.id);
  
  // Test 2: Pipeline Config Access
  console.log('\n%cTest 2: Pipeline Config Access', 'color: #66ccff; font-weight: bold');
  const card = cardInfo.element;
  const pipeline = card?._msdPipeline;
  
  test(
    'Card has _msdPipeline property',
    () => !!pipeline,
    !!pipeline,
    true
  );
  
  test(
    'Pipeline has config property',
    () => pipeline?.config !== undefined,
    typeof pipeline?.config,
    'object'
  );
  
  // Test 3: Provenance Preservation
  console.log('\n%cTest 3: Provenance Preservation', 'color: #66ccff; font-weight: bold');
  const pipelineConfig = pipeline?.config;
  
  test(
    'Pipeline config has __provenance',
    () => !!pipelineConfig?.__provenance,
    !!pipelineConfig?.__provenance,
    true
  );
  
  test(
    'Provenance has card_type',
    () => pipelineConfig?.__provenance?.card_type === 'msd',
    pipelineConfig?.__provenance?.card_type,
    'msd'
  );
  
  test(
    'Provenance has merge_order array',
    () => Array.isArray(pipelineConfig?.__provenance?.merge_order),
    Array.isArray(pipelineConfig?.__provenance?.merge_order),
    true
  );
  
  test(
    'Config has type property',
    () => pipelineConfig?.type === 'custom:lcards-msd-card',
    pipelineConfig?.type,
    'custom:lcards-msd-card'
  );
  
  test(
    'Config has msd property',
    () => !!pipelineConfig?.msd,
    !!pipelineConfig?.msd,
    true
  );
  
  // Test 4: Backward Compatibility (msdConfig)
  console.log('\n%cTest 4: Backward Compatibility', 'color: #66ccff; font-weight: bold');
  const msdConfig = pipeline?.msdConfig;
  
  test(
    'Pipeline has msdConfig property',
    () => msdConfig !== undefined,
    typeof msdConfig,
    'object'
  );
  
  test(
    'msdConfig has base_svg',
    () => !!msdConfig?.base_svg,
    !!msdConfig?.base_svg,
    true
  );
  
  test(
    'msdConfig has overlays',
    () => Array.isArray(msdConfig?.overlays),
    Array.isArray(msdConfig?.overlays),
    true
  );
  
  test(
    'msdConfig has anchors',
    () => msdConfig?.anchors !== undefined,
    typeof msdConfig?.anchors,
    'object'
  );
  
  // Test 5: Debug API Access
  console.log('\n%cTest 5: Debug API Access', 'color: #66ccff; font-weight: bold');
  const debugConfig = window.lcards.debug.msd.pipeline.config(cardInfo.id);
  
  test(
    'Debug API returns config',
    () => !!debugConfig,
    !!debugConfig,
    true
  );
  
  test(
    'Debug API config has __provenance',
    () => !!debugConfig?.__provenance,
    !!debugConfig?.__provenance,
    true
  );
  
  test(
    'Debug API config matches pipeline config',
    () => debugConfig === pipelineConfig,
    debugConfig === pipelineConfig,
    true
  );
  
  // Test 6: Multi-Card Support (if applicable)
  if (cards.length > 1) {
    console.log('\n%cTest 6: Multi-Card Support', 'color: #66ccff; font-weight: bold');
    
    cards.forEach((cardInfo, index) => {
      const config = window.lcards.debug.msd.pipeline.config(cardInfo.id);
      test(
        `Card ${index + 1} (${cardInfo.id}) has provenance`,
        () => !!config?.__provenance,
        !!config?.__provenance,
        true
      );
    });
  }
  
  // Test 7: Detailed Provenance Structure
  console.log('\n%cTest 7: Provenance Structure', 'color: #66ccff; font-weight: bold');
  const provenance = pipelineConfig?.__provenance;
  
  if (provenance) {
    test(
      'Provenance has timestamp',
      () => typeof provenance.timestamp === 'number',
      typeof provenance.timestamp,
      'number'
    );
    
    test(
      'Provenance has config_hash',
      () => typeof provenance.config_hash === 'string',
      typeof provenance.config_hash,
      'string'
    );
    
    console.log('   Provenance structure:', {
      card_type: provenance.card_type,
      merge_order: provenance.merge_order,
      timestamp: new Date(provenance.timestamp).toISOString(),
      hash: provenance.config_hash?.substring(0, 16) + '...'
    });
  }
  
  // Summary
  console.log('\n%c=== Test Summary ===', 'color: #ff9900; font-weight: bold; font-size: 14px;');
  console.log(`%cPassed: ${results.passed}`, 'color: #00ff00; font-weight: bold');
  console.log(`%cFailed: ${results.failed}`, results.failed > 0 ? 'color: #ff0000; font-weight: bold' : 'color: inherit');
  console.log(`%cTotal: ${results.tests.length}`, 'color: #66ccff; font-weight: bold');
  
  if (results.failed === 0) {
    console.log('%c🎉 All tests passed!', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  } else {
    console.log('%c⚠️ Some tests failed. Review errors above.', 'color: #ff0000; font-weight: bold; font-size: 16px;');
  }
  
  return results;
})();
```

## Expected Results

### All Tests Pass (✅)

```
=== MSD Pipeline Provenance Test Suite ===

Test 1: Card Discovery
✅ PASS MSD Debug API exists
✅ PASS At least one MSD card found

Test 2: Pipeline Config Access
✅ PASS Card has _msdPipeline property
✅ PASS Pipeline has config property

Test 3: Provenance Preservation
✅ PASS Pipeline config has __provenance
✅ PASS Provenance has card_type
✅ PASS Provenance has merge_order array
✅ PASS Config has type property
✅ PASS Config has msd property

Test 4: Backward Compatibility
✅ PASS Pipeline has msdConfig property
✅ PASS msdConfig has base_svg
✅ PASS msdConfig has overlays
✅ PASS msdConfig has anchors

Test 5: Debug API Access
✅ PASS Debug API returns config
✅ PASS Debug API config has __provenance
✅ PASS Debug API config matches pipeline config

Test 7: Provenance Structure
✅ PASS Provenance has timestamp
✅ PASS Provenance has config_hash

=== Test Summary ===
Passed: 18
Failed: 0
Total: 18
🎉 All tests passed!
```

## Manual Verification

You can also manually verify in browser console:

```javascript
// Get first MSD card
const card = window.lcards.debug.msd.listMsdCards()[0].element;

// Check pipeline config
console.log('Pipeline config:', card._msdPipeline.config);
console.log('Has __provenance:', !!card._msdPipeline.config.__provenance);
console.log('Card type:', card._msdPipeline.config.__provenance?.card_type);
console.log('Merge order:', card._msdPipeline.config.__provenance?.merge_order);

// Check msdConfig for backward compatibility
console.log('MSD config:', card._msdPipeline.msdConfig);
console.log('Has anchors:', !!card._msdPipeline.msdConfig.anchors);
console.log('Has overlays:', Array.isArray(card._msdPipeline.msdConfig.overlays));

// Debug API access
const config = window.lcards.debug.msd.pipeline.config('bridge');  // Use your card ID
console.log('Debug API config:', config);
console.log('Has __provenance:', !!config.__provenance);
```

## Troubleshooting

### No MSD cards found
- Ensure you have an MSD card in your dashboard
- Verify the card has loaded (check for rendering)
- Hard refresh browser (Ctrl+Shift+R)

### Pipeline config missing __provenance
- Verify build succeeded: `npm run build`
- Check `dist/lcards.js` was copied to HA correctly
- Ensure using latest LCARdS code with this fix
- Check browser console for errors during card initialization

### Tests fail
- Check browser console for detailed error messages
- Verify CoreConfigManager is initialized: `window.lcards.core.configManager.initialized`
- Check MSD card initialization logs

## Related Files

- `src/msd/pipeline/PipelineCore.js` - Pipeline initialization and API creation
- `src/api/MsdDebugAPI.js` - Debug API implementation
- `src/cards/lcards-msd.js` - MSD card component
- `TESTING_GUIDE_MSD_DEBUG_API.md` - Full debug API testing guide

## Success Criteria

✅ All 18+ tests pass
✅ `__provenance` metadata preserved through pipeline
✅ Debug API returns full config with provenance
✅ Backward compatibility maintained via `msdConfig` property
✅ Multi-card dashboards work correctly
