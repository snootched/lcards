# Control Overlay Schema Validation Testing Guide

## Overview

This guide provides instructions for testing the control overlay schema validation that enforces the single nested card pattern.

## Changes Summary

### What Changed

1. **New Control Overlay Schema** (`src/core/validation-service/schemas/controlOverlay.js`)
   - Requires `card` property (nested card definition)
   - Validates `card.type` exists
   - Provides clear error messages for common mistakes

2. **Code Cleanup** (`src/msd/controls/MsdControlsRenderer.js`)
   - Removed support for flat/direct pattern
   - Removed support for legacy `card_config` / `cardConfig`
   - Enforces single pattern: `type: control` with nested `card: { type, ... }`

3. **Documentation** (`doc/user/configuration/overlays/control-overlay.md`)
   - Added "NOT Supported" section
   - Updated all examples to use cleaner syntax
   - Clarified both flat and nested card properties work

## Testing Instructions

### Quick Test

Run the validation test script:

```bash
npm install  # If dependencies not installed
node test/test-control-schema-validation.mjs
```

This will analyze all test cases and show which patterns pass/fail.

### Full Integration Test

To test actual validation in Home Assistant:

1. **Build the code:**
   ```bash
   npm run build
   ```

2. **Deploy to Home Assistant:**
   ```bash
   # Copy dist/lcards.js to your HA instance
   cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
   ```

3. **Test in HA:**
   - Open HA Lovelace editor
   - Create a new card
   - Try different patterns from test file

## Test Cases

### ✅ Patterns That SHOULD Pass

#### Test 1: Flat Card Properties
```yaml
- type: control
  id: test_button
  card:
    type: button
    entity: light.test
    name: "Test"
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ✅ Validates successfully

#### Test 2: Nested Config
```yaml
- type: control
  id: test_button
  card:
    type: button
    config:
      entity: light.test
      name: "Test"
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ✅ Validates successfully

#### Test 3: LCARdS Card
```yaml
- type: control
  id: test_lcards
  card:
    type: custom:lcards-button
    entity: switch.test
    preset: lozenge
  position: [100, 100]
  size: [200, 180]
```
**Expected:** ✅ Validates successfully

### ❌ Patterns That SHOULD Fail

#### Test 4: Flat/Direct Pattern (WRONG)
```yaml
- type: custom:lcards-button  # ❌ Wrong - should be 'control'
  id: test_wrong
  entity: switch.test
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ❌ Validation error
**Error:** Only "line" and "control" overlay types supported

#### Test 5: Legacy card_config (WRONG)
```yaml
- type: control
  id: test_wrong
  card_config:  # ❌ Wrong - should be 'card'
    type: button
    entity: light.test
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ❌ Validation error
**Error:** Legacy field "card_config" is no longer supported

#### Test 6: Legacy cardConfig (WRONG)
```yaml
- type: control
  id: test_wrong
  cardConfig:   # ❌ Wrong - should be 'card'
    type: button
    entity: light.test
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ❌ Validation error
**Error:** Legacy field "cardConfig" is no longer supported

#### Test 7: Missing card Property (WRONG)
```yaml
- type: control
  id: test_wrong
  # Missing 'card' property
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ❌ Validation error
**Error:** Control overlay requires a "card" property

#### Test 8: Missing card.type (WRONG)
```yaml
- type: control
  id: test_wrong
  card:
    # Missing 'type' property
    entity: light.test
  position: [100, 100]
  size: [200, 100]
```
**Expected:** ❌ Validation error
**Error:** Card definition is missing required "type" property

#### Test 9: Missing position (WRONG)
```yaml
- type: control
  id: test_wrong
  card:
    type: button
    entity: light.test
  # Missing position
  size: [200, 100]
```
**Expected:** ❌ Validation error
**Error:** Control overlay requires "position" property

#### Test 10: Missing size (WRONG)
```yaml
- type: control
  id: test_wrong
  card:
    type: button
    entity: light.test
  position: [100, 100]
  # Missing size
```
**Expected:** ❌ Validation error
**Error:** Control overlay requires "size" property

## Expected Behavior

### Console Messages

When validation fails, you should see clear error messages in the browser console:

```
[ValidationService] Control overlay validation failed: test_wrong
  Error: Control overlay requires a "card" property
  Suggestion: Add a "card" property with nested card definition:
    card:
      type: custom:lcards-button
      entity: light.example
```

### MsdControlsRenderer Messages

When `resolveCardDefinition()` fails to find a card:

```
[MsdControlsRenderer] Control overlay missing required "card" property: test_wrong
  Suggestion: Use nested card pattern:
    - type: control
      id: test_wrong
      card:
        type: custom:lcards-button
        entity: light.example
      position: [x, y]
      size: [width, height]
```

## Validation Checklist

- [ ] Test 1-3 (correct patterns) pass validation
- [ ] Test 4 (flat/direct) fails with clear error
- [ ] Test 5-6 (legacy) fail with deprecation error
- [ ] Test 7-8 (missing properties) fail with requirement error
- [ ] Test 9-10 (missing position/size) fail with requirement error
- [ ] Error messages guide users to correct pattern
- [ ] Documentation clearly shows what's NOT supported
- [ ] Build completes without errors
- [ ] Cards render correctly with nested pattern

## Troubleshooting

### Issue: Tests pass but should fail

**Solution:** Check that validation service is initialized and schema is registered:
```javascript
// In browser console
window.lcards.core.validationService.schemaRegistry.getSchema('control')
```

### Issue: No validation errors shown

**Solution:** Enable debug logging:
```javascript
// In browser console
window.lcards.setGlobalLogLevel('debug')
```

### Issue: Old pattern still works

**Solution:** Hard refresh browser (Ctrl+Shift+R) to clear cached JS.

## Success Criteria

All of the following must be true for the changes to be considered successful:

1. ✅ Correct nested card pattern validates successfully
2. ✅ Flat/direct pattern rejected with clear error
3. ✅ Legacy patterns rejected with deprecation error
4. ✅ Missing required properties caught with helpful messages
5. ✅ Documentation clearly shows supported and NOT supported patterns
6. ✅ Code has single clean path in `resolveCardDefinition()`
7. ✅ Build completes without errors
8. ✅ Existing valid configs continue to work

## Related Files

- `src/core/validation-service/schemas/controlOverlay.js` - Schema definition
- `src/core/validation-service/schemas/index.js` - Schema registration
- `src/msd/controls/MsdControlsRenderer.js` - Card resolution logic
- `doc/user/configuration/overlays/control-overlay.md` - User documentation
- `test/test-control-overlay-schema.yaml` - Test cases
- `test/test-control-schema-validation.mjs` - Validation test script
