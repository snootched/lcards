#!/usr/bin/env node

/**
 * Test Control Overlay Schema Validation
 * 
 * This script tests the control overlay schema validation to ensure:
 * 1. Correct patterns (nested card) pass validation
 * 2. Wrong patterns (flat/direct, legacy) fail with clear error messages
 */

import fs from 'fs';
import yaml from 'js-yaml';

console.log('🧪 Testing Control Overlay Schema Validation\n');

// Test cases
const testFile = 'test/test-control-overlay-schema.yaml';

try {
  const fileContent = fs.readFileSync(testFile, 'utf8');
  const testDocs = yaml.loadAll(fileContent);
  
  console.log(`✅ Loaded ${testDocs.length} test cases from ${testFile}\n`);
  
  // Analyze test cases
  testDocs.forEach((doc, index) => {
    const testNum = index + 1;
    const overlay = doc?.msd?.overlays?.[0];
    
    if (!overlay) {
      console.log(`Test ${testNum}: ⚠️  No overlay found`);
      return;
    }
    
    const testId = overlay.id;
    const isCorrectPattern = testId.startsWith('test_correct');
    const isWrongPattern = testId.startsWith('test_wrong') || testId.startsWith('test_missing');
    
    console.log(`Test ${testNum}: ${testId}`);
    console.log(`  Expected: ${isCorrectPattern ? '✅ PASS' : '❌ FAIL'}`);
    
    // Check for correct pattern
    if (overlay.type === 'control' && overlay.card && overlay.card.type) {
      console.log(`  Structure: ✅ Nested card with type`);
      if (isCorrectPattern) {
        console.log(`  Result: ✅ PASS (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED PASS (should have failed)\n`);
      }
    }
    // Check for wrong patterns
    else if (overlay.type !== 'control' && overlay.type !== 'line') {
      console.log(`  Structure: ❌ Flat/direct pattern (type: ${overlay.type})`);
      if (isWrongPattern) {
        console.log(`  Result: ✅ Would fail validation (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED STRUCTURE\n`);
      }
    }
    else if (overlay.card_config || overlay.cardConfig) {
      console.log(`  Structure: ❌ Legacy card_config/cardConfig`);
      if (isWrongPattern) {
        console.log(`  Result: ✅ Would fail validation (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED STRUCTURE\n`);
      }
    }
    else if (!overlay.card) {
      console.log(`  Structure: ❌ Missing card property`);
      if (isWrongPattern) {
        console.log(`  Result: ✅ Would fail validation (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED STRUCTURE\n`);
      }
    }
    else if (!overlay.card.type) {
      console.log(`  Structure: ❌ Card missing type property`);
      if (isWrongPattern) {
        console.log(`  Result: ✅ Would fail validation (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED STRUCTURE\n`);
      }
    }
    else if (!overlay.position) {
      console.log(`  Structure: ❌ Missing position property`);
      if (isWrongPattern) {
        console.log(`  Result: ✅ Would fail validation (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED STRUCTURE\n`);
      }
    }
    else if (!overlay.size) {
      console.log(`  Structure: ❌ Missing size property`);
      if (isWrongPattern) {
        console.log(`  Result: ✅ Would fail validation (as expected)\n`);
      } else {
        console.log(`  Result: ⚠️  UNEXPECTED STRUCTURE\n`);
      }
    }
  });
  
  console.log('✅ Test analysis complete!');
  console.log('\n📝 Note: This script validates test case structure.');
  console.log('   Actual validation happens in Home Assistant via the schema.');
  console.log('   To test actual validation:');
  console.log('   1. Build: npm run build');
  console.log('   2. Copy dist/lcards.js to HA');
  console.log('   3. Try loading test configs in HA');
  console.log('   4. Check browser console for validation errors\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
