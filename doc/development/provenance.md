# Provenance Tracking in LCARdS

## Overview

Provenance tracking provides a comprehensive record of where every configuration value, style, and resolved setting originates in LCARdS cards. This system helps developers and users troubleshoot issues by answering the question: **"Where did this value come from?"**

## Features

- **Config Layer Tracking** - Records the merge order and source of every config field
- **Theme Token Resolution** - Tracks token lookups and resolution chains
- **Rule Patches** - Records which rules applied which changes
- **Template Processing** - Tracks template evaluation and dependencies
- **Style Resolution** - MSD-specific style provenance (separate system)
- **Unified API** - Consistent `getProvenance()` and `debugProvenance()` across all cards

## Architecture

### Core Components

1. **ProvenanceTracker** (`src/utils/provenance-tracker.js`)
   - Unified tracker class storing all provenance types
   - Used by all LCARdS cards (button, slider, etc.)
   - Provides public API for querying provenance

2. **LCARdSCard Integration** (`src/base/LCARdSCard.js`)
   - Every card gets `this._provenanceTracker` instance
   - Automatic tracking of config, templates, and rule patches
   - Public `getProvenance()` and `debugProvenance()` methods

3. **ThemeManager** (`src/core/themes/ThemeManager.js`)
   - `trackTokenResolution()` method for theme token tracking
   - Records token lookup chains and computed tokens

4. **RulesEngine** (`src/core/rules/RulesEngine.js`)
   - `trackRulePatch()` method for rule patch tracking
   - Records which rule applied which change

5. **MSD ProvenanceTracker** (`src/msd/styles/ProvenanceTracker.js`)
   - Separate, specialized tracker for MSD style resolution
   - Used by StyleResolverService
   - Not part of unified system (by design)

## Provenance Schema

The unified provenance tracker stores data in the following structure:

```javascript
{
  config: {
    merge_order: ['card_defaults', 'theme_defaults', 'preset_lozenge', 'user_config'],
    field_sources: {
      'style.color': 'user_config',
      'style.borderRadius': 'preset_lozenge',
      'show_label': 'card_defaults',
      // ... more fields
    },
    card_type: 'button',
    timestamp: 1234567890
  },
  
  theme_tokens: {
    'colors.accent.primary': {
      original_ref: 'theme:colors.accent.primary',
      resolved_value: '#ff9966',
      resolution_chain: [
        { step: 'token_lookup', value: '#ff9966', source: 'theme.tokens' }
      ],
      used_by_fields: ['style.background', 'icon.color'],
      timestamp: 1234567890
    }
    // ... more tokens
  },
  
  rule_patches: {
    'style.opacity': {
      original_value: 1.0,
      patched_value: 0.5,
      rule_id: 'dim-inactive',
      rule_condition: 'entity.state != "on"',
      applied_at: 1234567890
    }
    // ... more patches
  },
  
  templates: {
    'label': {
      original: '{entity.state}°C',
      processed: '72°C',
      dependencies: ['sensor.temperature'],
      processor: 'jinja2',
      last_updated: 1234567890
    }
    // ... more templates
  },
  
  styles: null,     // MSD-specific (if applicable)
  renderer: null    // MSD-specific (if applicable)
}
```

## Public API

All LCARdS cards (button, slider, etc.) expose the following methods:

### `getProvenance(path)`

Get provenance data, optionally at a specific path.

**Parameters:**
- `path` (string, optional) - Path to specific provenance data

**Returns:** Provenance data (object or value at path)

**Examples:**

```javascript
// From browser console
const card = document.querySelector('lcards-button');

// Get all provenance
const allProvenance = card.getProvenance();

// Get config provenance
const configProv = card.getProvenance('config');

// Get merge order
const mergeOrder = card.getProvenance('config.merge_order');

// Get specific field source
const colorSource = card.getProvenance('config.field_sources.style.color');

// Get theme tokens
const tokens = card.getProvenance('theme_tokens');

// Get rule patches
const patches = card.getProvenance('rule_patches');
```

### `debugProvenance()`

Get pretty-printed debug output of provenance information.

**Returns:** Formatted string suitable for console output

**Example:**

```javascript
// From browser console
const card = document.querySelector('lcards-button');
console.log(card.debugProvenance());
```

**Output:**

```
🔍 Provenance for button-abc123

  📦 Config Merge Order
    ['card_defaults', 'theme_defaults', 'preset_lozenge', 'user_config']
  
  📋 Field Sources (Sample)
    style.color: user_config
    style.borderRadius: preset_lozenge
    show_label: card_defaults
    ... and 47 more
  
  🎨 Theme Tokens (12)
    colors.accent.primary: "#ff9966"
      Used by: style.background, icon.color
    ... and 11 more
  
  ⚙️ Rule Patches (3)
    style.opacity: 1 → 0.5
      Rule: dim-inactive (entity.state != "on")
    ... and 2 more
  
  📝 Templates (2)
    label: "{entity.state}°C" → "72°C"
      Dependencies: sensor.temperature
    ... and 1 more
  
  📊 Statistics
    Tokens tracked: 12
    Patches tracked: 3
    Templates tracked: 2
```

## Usage Examples

### Troubleshooting Config Values

**Question:** "Why is my button's background color wrong?"

**Answer:**

```javascript
const card = document.querySelector('lcards-button');

// Check where the background color came from
const bgSource = card.getProvenance('config.field_sources.style.background');
console.log('Background color source:', bgSource);
// Output: "preset_lozenge"

// Check if a rule patched it
const patches = card.getProvenance('rule_patches');
if (patches['style.background']) {
  console.log('Rule patch:', patches['style.background']);
}
```

### Tracking Theme Token Usage

**Question:** "Which fields are using the accent color token?"

**Answer:**

```javascript
const card = document.querySelector('lcards-button');

// Get theme token info
const tokenInfo = card.getProvenance('theme_tokens.colors.accent.primary');
console.log('Accent color used by:', tokenInfo.used_by_fields);
// Output: ["style.background", "icon.color", "text.name.color"]
```

### Debugging Rule Patches

**Question:** "Why is my button dimmed?"

**Answer:**

```javascript
const card = document.querySelector('lcards-button');

// Check for opacity patches
const opacityPatch = card.getProvenance('rule_patches.style.opacity');
if (opacityPatch) {
  console.log('Opacity changed by rule:', opacityPatch.rule_id);
  console.log('Condition:', opacityPatch.rule_condition);
  console.log('Original:', opacityPatch.original_value);
  console.log('Patched:', opacityPatch.patched_value);
}
```

### Understanding Template Processing

**Question:** "How did my template get processed?"

**Answer:**

```javascript
const card = document.querySelector('lcards-button');

// Get all templates
const templates = card.getProvenance('templates');
for (const [fieldId, tmpl] of Object.entries(templates)) {
  console.log(`${fieldId}:`, tmpl.original, '→', tmpl.processed);
  console.log('  Processor:', tmpl.processor);
  console.log('  Dependencies:', tmpl.dependencies);
}
```

## Automatic Tracking

Provenance tracking is **automatic** for:

1. **Config Processing** - Tracked when CoreConfigManager processes config
2. **Template Evaluation** - Tracked when `processTemplate()` is called
3. **Rule Patches** - Tracked when rules apply patches to card

## Manual Tracking (Advanced)

For card-specific features, you can manually track provenance:

### Theme Token Tracking

```javascript
// In your card class
const themeManager = this._singletons?.themeManager;
const tokenValue = themeManager.getToken('colors.accent.primary');

// Track the resolution
themeManager.trackTokenResolution(
  'colors.accent.primary',
  'theme:colors.accent.primary',
  tokenValue,
  [{ step: 'token_lookup', value: tokenValue, source: 'theme.tokens' }],
  this._provenanceTracker,
  ['style.background']
);
```

### Custom Template Tracking

```javascript
// In your card class
this._provenanceTracker.trackTemplate(
  'custom_field',
  '{entity.state}',
  '72°C',
  ['sensor.temperature'],
  'jinja2'
);
```

### MSD Style Tracking

```javascript
// In MSD cards (separate system)
this._provenanceTracker.trackStyles(msdStyleProvenance);
this._provenanceTracker.trackRenderer(msdRendererProvenance);
```

## Best Practices

### For Card Developers

1. **Use automatic tracking** - Let the base class handle config, templates, and rules
2. **Track custom features** - If you add card-specific logic, track it
3. **Test in console** - Use `debugProvenance()` during development
4. **Document tracking** - Note what's tracked in your card's documentation

### For Users

1. **Use browser console** - Access provenance via `document.querySelector()`
2. **Check specific paths** - Use `getProvenance(path)` to drill down
3. **Pretty-print for overview** - Use `debugProvenance()` for full picture
4. **Report issues with provenance** - Include provenance output in bug reports

## Limitations

### Current Limitations

1. **Theme token tracking is opt-in** - Cards must explicitly call `trackTokenResolution()`
2. **No historical tracking** - Only current state is tracked (no undo/redo)
3. **No performance impact tracking** - Doesn't measure resolution time per field
4. **MSD provenance is separate** - MSD cards have their own specialized system

### Future Enhancements

Possible future improvements:

- **Automatic theme token tracking** - Track all token resolutions without manual calls
- **Historical provenance** - Store provenance changes over time
- **Performance profiling** - Track resolution time for each field
- **Visual provenance UI** - Card editor integration showing provenance inline
- **Export/import** - Save and share provenance data

## MSD Cards

MSD (Multi-State Display) cards have a **separate, specialized** provenance system for style resolution:

- **MSD ProvenanceTracker** (`src/msd/styles/ProvenanceTracker.js`)
- Used by StyleResolverService
- Tracks overlay-specific style resolution
- Not integrated with unified system (by design)

MSD cards do **not** inherit from LCARdSCard, so they don't get the unified provenance tracker. This is intentional - MSD has complex style resolution that requires specialized tracking.

## Debugging Tips

### Common Issues

**Issue:** `getProvenance()` returns null

**Solution:** Wait for card initialization. Config processing is asynchronous.

```javascript
// Wait for config to be processed
setTimeout(() => {
  const card = document.querySelector('lcards-button');
  console.log(card.getProvenance());
}, 1000);
```

**Issue:** Theme tokens not tracked

**Solution:** Theme token tracking is opt-in. Cards must call `trackTokenResolution()`.

**Issue:** Rule patches not showing

**Solution:** Rules must be active and matching. Check rule conditions.

### Debug Helper

Create a global helper for quick provenance checks:

```javascript
// Add to browser console
window.checkProvenance = (selector = 'lcards-button') => {
  const card = document.querySelector(selector);
  if (!card) {
    console.error('Card not found:', selector);
    return;
  }
  console.log(card.debugProvenance());
};

// Usage
checkProvenance('lcards-button');
checkProvenance('#my-custom-button');
```

## Related Documentation

- [Config Management](../architecture/config-management.md)
- [Theme System](../features/themes.md)
- [Rules Engine](../features/rules.md)
- [Template Processing](../features/templates.md)
- [MSD Architecture](../architecture/msd.md)

## Support

For issues or questions:

1. Check provenance output with `debugProvenance()`
2. Review this documentation
3. Check GitHub issues
4. Open a new issue with provenance output included
