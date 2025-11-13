# Testing Guide for Token Syntax Migration

## Quick Start

1. **Copy the built file to Home Assistant:**
   ```bash
   # From your lcards directory
   cp lcards.js /path/to/homeassistant/www/community/lcards/
   ```

2. **Hard refresh your browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

3. **Use a test config:**
   - Copy `test/QUICK_TOKEN_TEST.yaml` content
   - Replace `light.living_room` with your entity
   - Add to a dashboard as a card

## Test Files

### QUICK_TOKEN_TEST.yaml
**Purpose:** Minimal single-card test
**Use when:** You want the fastest verification
**Expected:** Shows "Entity Name is on/off"

### test-token-syntax-in-ha.yaml
**Purpose:** Comprehensive test suite
**Use when:** You want to test all token types
**Tests:** 7 different token patterns

### ADVANCED_TOKEN_TEST.yaml
**Purpose:** Edge cases and validation
**Use when:** You want to verify old syntax is broken
**Tests:** New vs old syntax, Jinja2 preservation, edge cases

## What to Verify

### ✅ Should Work
- `{entity.state}` → Shows "on", "off", or numeric value
- `{entity.attributes.friendly_name}` → Shows entity name
- `{entity.attributes.brightness}` → Shows brightness value
- `{variables.my_var}` → Shows variable value
- Multiple tokens: `"{entity.name} is {entity.state}"`

### ❌ Should NOT Work (deprecated)
- `{{entity.state}}` → Shows literally "{{entity.state}}"
- `{{variables.color}}` → Shows literally "{{variables.color}}"

### ⏳ Should Show Literally (not yet implemented)
- `{{states('entity')}}` → Shows literally (Phase 2+ will evaluate)
- `{{value | round(1)}}` → Shows literally (Phase 2+ will evaluate)

### 🔍 Should Handle Gracefully
- `{entity.attributes.nonexistent}` → Shows empty string, no error
- `{ }` → Shows empty string
- Missing entity → Shows empty string, logs warning

## Browser Console Checks

Open Developer Tools (F12) and check:

### ✅ Good Signs
- Log messages from `[SimpleCardTemplateEvaluator]`
- No errors about "template parsing failed"
- Tokens resolve to actual values

### ❌ Bad Signs
- Error: "Token resolution failed"
- Cards showing literal `{entity.state}` instead of values
- Console errors mentioning templates

### Expected Warnings
- `[SimpleCardTemplateEvaluator] Token resolution failed` for nonexistent attributes (this is OK)

## Troubleshooting

### Problem: Tokens show literally `{entity.state}`
**Solutions:**
1. Check if `lcards.js` was copied to the right location
2. Hard refresh browser (Ctrl+Shift+R)
3. Check browser console for JavaScript errors
4. Verify file timestamp matches build time

### Problem: Old syntax `{{entity.state}}` still works
**Solution:**
- This shouldn't happen if build is correct
- Check that you're using the new `lcards.js`
- May indicate browser cache issue

### Problem: Console errors about templates
**Solutions:**
1. Check entity exists in Home Assistant
2. Verify token syntax is correct (single braces)
3. Check browser console for detailed error messages

### Problem: Entity updates don't reflect
**Solutions:**
1. Check if entity is actually changing in HA
2. Verify card has correct entity ID
3. Look for WebSocket connection issues

## Testing Checklist

Before committing:
- [ ] QUICK_TOKEN_TEST shows entity name and state
- [ ] Multiple tokens in one string work
- [ ] Missing attributes show empty (no error)
- [ ] Variables tokens work
- [ ] Old syntax `{{token}}` does NOT work
- [ ] Jinja2 syntax `{{states(...)}}` preserved (shows literally)
- [ ] No console errors during rendering
- [ ] Entity updates reflect in real-time
- [ ] Build completes successfully
- [ ] Unit tests pass (`node test/test-token-syntax-migration.js`)

## File Locations

After testing, ensure these are updated:
- `src/core/templates/TemplateDetector.js`
- `src/core/templates/TemplateParser.js`
- `src/core/templates/SimpleCardTemplateEvaluator.js`
- `test/test-overlay-cards.yaml`
- `doc/SYNTAX_MIGRATION.md`

## Next Steps After Successful Testing

1. Commit changes with descriptive message
2. Update CHANGELOG.md with breaking change notice
3. Consider adding automated tests
4. Begin Phase 2: HATemplateEvaluator implementation

## Getting Help

If tests fail:
1. Check browser console for specific errors
2. Review `doc/SYNTAX_MIGRATION.md` for syntax reference
3. Compare with working examples in `test/test-overlay-cards.yaml`
4. Check if entities exist and are accessible
5. Open GitHub issue with:
   - Browser console output
   - Test config used
   - Expected vs actual behavior
