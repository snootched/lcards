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

    // Flat map of field paths to source layers (for programmatic queries)
    field_sources: {
      'dpad': 'card_defaults',
      'dpad.segments': 'card_defaults',
      'dpad.segments.default': 'card_defaults',
      'dpad.segments.default.style': 'preset_lozenge',
      'dpad.segments.default.style.fill': 'user_config',
      'style.color': 'user_config',
      'style.borderRadius': 'preset_lozenge',
      'show_label': 'card_defaults',
      // ... more fields
    },

    // Hierarchical tree view (for easier visualization)
    tree: {
      dpad: {
        __source: 'card_defaults',
        segments: {
          __source: 'card_defaults',
          default: {
            __source: 'card_defaults',
            style: {
              __source: 'preset_lozenge',
              fill: {
                __source: 'user_config'
              }
            }
          }
        }
      },
      style: {
        color: { __source: 'user_config' },
        borderRadius: { __source: 'preset_lozenge' }
      },
      show_label: { __source: 'card_defaults' }
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

**Note:** The `config.tree` is generated on-demand from `config.field_sources`. Both representations contain the same information - the tree is just easier to navigate visually.

## Public API

All LCARdS cards (button, slider, etc.) expose the following methods:

### `getProvenance(path)`

Get provenance data, optionally at a specific path.

**Enhanced in v2:** Config provenance now includes both a flat `field_sources` map and a hierarchical `tree` view for easier navigation.

**Parameters:**
- `path` (string, optional) - Path to specific provenance data

**Returns:** Provenance data (object or value at path)

**Examples:**

```javascript
// From browser console
const card = document.querySelector('lcards-button');

// Get all provenance (includes config tree automatically)
const allProvenance = card.getProvenance();
// Returns:
// {
//   config: {
//     merge_order: ['card_defaults', 'preset_dpad', 'user_config'],
//     field_sources: { 'dpad': 'card_defaults', ... },  // Flat map
//     tree: { dpad: { __source: 'card_defaults', ... } }, // Hierarchical!
//     card_type: 'button',
//     timestamp: 1234567890
//   },
//   theme_tokens: {...},
//   rule_patches: {...},
//   templates: {...}
// }

// Get config provenance (includes tree)
const configProv = card.getProvenance('config');

// Get config tree directly
const tree = card.getProvenance('config.tree');

// Get merge order
const mergeOrder = card.getProvenance('config.merge_order');

// Get specific field source from flat map
const colorSource = card.getProvenance('config.field_sources.style.color');

// Get theme tokens
const tokens = card.getProvenance('theme_tokens');

// Get rule patches
const patches = card.getProvenance('rule_patches');
```

### `debugProvenance(toConsole = true)`

Get pretty-printed debug output of provenance information.

**Parameters:**
- `toConsole` (boolean, default: `true`) - If true, outputs directly to console with collapsible groups. If false, returns formatted string (legacy mode).

**Returns:** `undefined` if `toConsole=true`, formatted string otherwise

**Example:**

```javascript
// From browser console (NEW - outputs directly with collapsible groups)
const card = document.querySelector('lcards-button');
card.debugProvenance(); // Interactive, collapsible output

// Legacy string output (for backwards compatibility)
console.log(card.debugProvenance(false));
```

**Console Output (Interactive):**

```
🔍 Provenance for button-abc123
  ▶ 📦 Config Merge Order
  ▶ 📋 Field Sources (45 total)
      ▶ card_defaults (20 fields)
      ▶ preset_dpad (15 fields)
      ▶ user_config (10 fields)
  ▶ 🎨 Theme Tokens (3)
  ▶ ⚙️ Rule Patches (2)
  ▶ 📝 Templates (1)
  ▶ 📊 Statistics
```

Click the arrows to expand sections and see details!

### `getFieldSource(fieldPath)`

Get the source layer for a specific config field. Supports deep paths.

**Parameters:**
- `fieldPath` (string) - Dot-notation field path

**Returns:** Source layer name or null

**Example:**

```javascript
const card = document.querySelector('lcards-button');

card.getFieldSource('dpad');
// → 'card_defaults'

card.getFieldSource('dpad.segments.default');
// → 'card_defaults'

card.getFieldSource('dpad.segments.default.style.fill');
// → 'user_config'
```

### `getFieldsFromLayer(layerName)`

Get all fields from a specific source layer.

**Parameters:**
- `layerName` (string) - Layer name (e.g., 'user_config', 'preset_dpad')

**Returns:** Array of field paths

**Example:**

```javascript
const card = document.querySelector('lcards-button');

card.getFieldsFromLayer('user_config');
// → ['dpad.segments.default.style.fill', 'label', 'entity']

card.getFieldsFromLayer('preset_dpad');
// → ['dpad.segments.default.style', 'dpad.segments.default.animations', ...]
```

### `hasUserOverride(fieldPrefix)`

Check if user overrode a field or any of its children.

**Parameters:**
- `fieldPrefix` (string) - Field path prefix

**Returns:** Boolean

**Example:**

```javascript
const card = document.querySelector('lcards-button');

card.hasUserOverride('dpad.segments.default.style');
// → true (if any style field was customized)

card.hasUserOverride('dpad.segments.default.animations');
// → false (if animations are all from defaults/preset)
```

### `getConfigTree()`

Get the full config provenance as a tree structure.

Reconstructs the flat field sources map into a hierarchical tree showing
the source layer for each field and its nested children.

**Returns:** Object with `__source` annotations

**Example:**

```javascript
const card = document.querySelector('lcards-button');
const tree = card.getConfigTree();
console.log(tree);

// Returns:
// {
//   dpad: {
//     __source: 'card_defaults',
//     segments: {
//       __source: 'card_defaults',
//       default: {
//         __source: 'card_defaults',
//         style: {
//           __source: 'preset_dpad',
//           fill: {
//             __source: 'user_config',
//             default: { __source: 'user_config' }
//           }
//         },
//         animations: { __source: 'preset_dpad' }
//       }
//     }
//   },
//   label: { __source: 'user_config' },
//   entity: { __source: 'user_config' }
// }
```

### `printConfigTree(title)`

Print the config tree to console with interactive collapsible groups.

**Parameters:**
- `title` (string, optional) - Custom title for output

**Returns:** void (outputs to console)

**Example:**

```javascript
const card = document.querySelector('lcards-button');
card.printConfigTree();

// Console output:
// 📋 Config Provenance Tree
//   ▶ dpad [card_defaults]
//       ▶ segments [card_defaults]
//           ▶ default [card_defaults]
//               ▶ style [preset_dpad]
//                   ▶ fill [user_config]
//                       default [user_config]
//               animations [preset_dpad]
//   label [user_config]
//   entity [user_config]
```

## Usage Examples

### Deep Config Field Tracking

**Question:** "My dpad segments are partially from defaults and partially customized - how can I see what's what?"

**Answer (Option 1 - Query Specific Fields):**

```javascript
const card = document.querySelector('lcards-button');

// Check where top-level dpad came from
card.getFieldSource('dpad');
// → 'card_defaults'

// Check where default segment config came from
card.getFieldSource('dpad.segments.default');
// → 'card_defaults'

// Check where the style object came from
card.getFieldSource('dpad.segments.default.style');
// → 'preset_dpad'

// Check where specific fill property came from
card.getFieldSource('dpad.segments.default.style.fill');
// → 'user_config' (you customized this!)

// See all fields you customized
const userFields = card.getFieldsFromLayer('user_config');
console.log('User customized:', userFields);
// → ['dpad.segments.default.style.fill', 'entity', 'label']

// Check if you customized anything under dpad.segments
card.hasUserOverride('dpad.segments');
// → true
```

**Answer (Option 2 - View Full Tree):**

```javascript
const card = document.querySelector('lcards-button');

// Get the complete tree structure
const tree = card.getConfigTree();
console.log(tree);

// Or print it directly to console with collapsible groups
card.printConfigTree();

// Output:
// 📋 Config Provenance Tree
//   ▶ dpad [card_defaults]
//       ▶ segments [card_defaults]
//           ▶ default [card_defaults]
//               ▶ style [preset_dpad]
//                   ▶ fill [user_config]
//                       default [user_config]
//   label [user_config]
//   entity [user_config]
```

**Deep tracking works automatically!** The config merge system tracks every nested field, so you can:
- Query specific fields with `getFieldSource()`
- View the complete hierarchy with `getConfigTree()` or `printConfigTree()`
- Filter by layer with `getFieldsFromLayer()`

### Troubleshooting Config Values

**Question:** "Why is my button's background color wrong?"

**Answer:**

```javascript
const card = document.querySelector('lcards-button');

// Check where the background color came from
const bgSource = card.getFieldSource('style.background');
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
2. **Theme Token Resolution** - Tracked when cards call `getThemeToken()` or similar methods
3. **Template Evaluation** - Tracked when `processTemplate()` is called
4. **Rule Patches** - Tracked when rules apply patches to card

## Manual Tracking (Advanced)

For card-specific features that don't use standard helpers, you can manually track provenance:

### Custom Template Tracking

If you process templates outside of `processTemplate()`:

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

**Note:** Theme token tracking is now automatic when using `getThemeToken()`. Most tracking is automatic through the base class helper methods.

## Best Practices

### For Card Developers

1. **Use automatic tracking** - Let the base class handle config, templates, tokens, and rules
2. **Use helper methods** - Call `getThemeToken()` instead of accessing ThemeManager directly
3. **Test in console** - Use `debugProvenance()` during development
4. **Document tracking** - Note what's tracked in your card's documentation

### For Users

1. **Use browser console** - Access provenance via `document.querySelector()`
2. **Check specific paths** - Use `getProvenance(path)` to drill down
3. **Pretty-print for overview** - Use `debugProvenance()` for full picture
4. **Report issues with provenance** - Include provenance output in bug reports

## Limitations

### Current Limitations

1. **No historical tracking** - Only current state is tracked (no undo/redo)
2. **No performance impact tracking** - Doesn't measure resolution time per field
3. **MSD provenance is separate** - MSD cards have their own specialized system
4. **Computed token chains not fully tracked** - `alpha()`, `darken()`, etc. in utilities

### Future Enhancements

Possible future improvements:

- **Historical provenance** - Store provenance changes over time
- **Performance profiling** - Track resolution time for each field
- **Visual provenance UI** - Card editor integration showing provenance inline
- **Export/import** - Save and share provenance data
- **Computed token chain tracking** - Full tracking of `alpha()`, `darken()`, etc.

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

**Solution:** Ensure you're using `getThemeToken()` helper, not accessing ThemeManager directly.

```javascript
// ✅ Correct - automatically tracked
const color = this.getThemeToken('colors.accent.primary', '#ff9900', 'style.background');

// ❌ Wrong - bypasses tracking
const color = this._singletons.themeManager.getToken('colors.accent.primary');
```

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
