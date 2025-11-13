# Phase 3: Unified Template System

**Status:** ✅ Complete
**Version:** 1.9.25
**Branch:** msd-globalisation

## Overview

Phase 3 implements a **unified template system** that works across both SimpleCard and MSD card types, supporting multiple template syntaxes without ambiguity.

### What's New in Phase 3

✅ **SimpleCard:** Full support for JavaScript, Tokens, Datasources (new!), and Jinja2
✅ **MSD:** Full support for JavaScript (new!), Tokens (new!), and Datasources
⚠️ **MSD + Jinja2:** Not yet supported (requires async refactor - planned for Phase 4)

## Architecture

### Key Components

1. **UnifiedTemplateEvaluator** (NEW)
   - Orchestrates all template types in proper order
   - Works for both SimpleCard and MSD contexts
   - Single source of truth for template processing
   - Supports both async (all templates) and sync (no Jinja2) modes

2. **TemplateDetector** (Updated)
   - Added `hasMSDDatasources()` for explicit datasource syntax
   - Updated `detectTemplateTypes()` to include datasources

3. **TemplateParser** (Updated)
   - Added `extractDatasourceReferences()` for parsing `{datasource:...}`
   - Added `parseDatasourceReference()` for explicit prefix handling
   - Updated token regex to exclude `{datasource:...}` patterns

4. **SimpleCardTemplateEvaluator** (Updated)
   - Updated token regex to exclude `{datasource:...}`
   - Added public methods for individual evaluation phases
   - Added `extractDependencies()` for Jinja2 entity tracking

5. **MSDContentResolver** (Updated)
   - **Now uses UnifiedTemplateEvaluator** in sync mode for all MSD rendering
   - Added `processTemplateUnified()` for async template processing (future use)
   - Maintains backward compatibility with legacy methods

## Template Syntax Reference

### Supported Template Types

| Template Type | Syntax | Example | SimpleCard | MSD | Evaluation |
|--------------|--------|---------|------------|-----|------------|
| **JavaScript** | `[[[code]]]` | `[[[return entity.state]]]` | ✅ | ✅ | Sync |
| **Tokens** | `{path}` | `{entity.state}` | ✅ | ✅ | Sync |
| **Datasources (new)** | `{datasource:name}` | `{datasource:sensor.temp:.1f}` | ✅ | ✅ | Sync |
| **Datasources (legacy)** | `{domain.entity}` | `{sensor.temp:.1f}` | ✅ | ✅ | Sync |
| **Jinja2 Expressions** | `{{expression}}` | `{{states('sensor.temp')}}` | ✅ | ⏳ | Async |
| **Jinja2 Control** | `{% statement %}` | `{% if hour < 12 %}AM{% endif %}` | ✅ | ⏳ | Async |
| **Jinja2 Comments** | `{# comment #}` | `{# This is ignored #}` | ✅ | ⏳ | Async |

**Legend:** ✅ = Supported | ⏳ = Planned for Phase 4 (requires async MSD rendering)

### Evaluation Order

```
1. JavaScript templates:    [[[code]]]          → Synchronous
2. Token templates:          {entity.state}      → Synchronous
3. Datasource templates:     {datasource:...}    → Synchronous
                            {sensor.temp}        → Synchronous (legacy)
4. Jinja2 templates:         {{expression}}      → Async via HA (SimpleCard only)
                            {% control %}        → Async via HA (SimpleCard only)
```## Template Disambiguation

### The Problem

Both SimpleCard and MSD previously used single braces `{}` for different purposes:
- SimpleCard: `{entity.state}` = context tokens
- MSD: `{sensor.temp}` = datasource references

This created ambiguity and prevented cross-pollination of features.

### The Solution

**Explicit prefix syntax** for datasources:

```yaml
# New explicit syntax (recommended)
label: "{datasource:sensor.temp:.1f}°C"

# Legacy syntax (still supported for backward compatibility)
label: "{sensor.temp:.1f}°C"
```

### Disambiguation Rules

1. **`{datasource:...}`** → Always treated as datasource (explicit)
2. **`{sensor.*}`, `{light.*}`, etc.** → Treated as datasource (legacy, uses hardcoded domain list)
3. **`{entity.*}`, `{config.*}`, `{variables.*}`** → Treated as token (context reference)
4. **`{{...}}`** → Always treated as Jinja2 expression
5. **`{%...%}`** → Always treated as Jinja2 control structure
6. **`{#...#}`** → Always treated as Jinja2 comment
7. **`[[[...]]]`** → Always treated as JavaScript

## Usage Examples

### SimpleCard with Datasources (NEW!)

```yaml
type: custom:lcards
card_type: simple
entity: sensor.temperature
label_top: "Current Temp"
label_main: "{datasource:sensor.temp:.1f}°C"
label_bottom: "Updated: {{now().strftime('%H:%M')}}"
```

### MSD with JavaScript and Tokens (NEW in Phase 3!)

```yaml
type: custom:lcards
card_type: msd
overlays:
  - type: text
    content: "[[[return 'Status: ' + 'Active']]]"
    position: { x: 100, y: 100 }
  - type: text
    content: "Datasource: {datasource:sensor.temp:.1f}°C"
    position: { x: 100, y: 150 }
```

**Note:** Jinja2 support for MSD overlays is planned for Phase 4 (requires async rendering refactor).

### Mixed Template Types

```yaml
type: custom:lcards
card_type: simple
entity: sensor.status
# JavaScript
label_top: "[[[return 'Computed: ' + entity.state]]]"
# Token
label_main: "{entity.attributes.friendly_name}"
# Datasource (explicit)
label_side: "{datasource:sensor.temp:.1f}"
# Datasource (legacy)
label_bottom_left: "{sensor.humidity:.0f}%"
# Jinja2
label_bottom_right: "{{now().hour}}:{{now().minute}}"
```

### All Template Types in One Field

```yaml
label: "[[[return 'JS']]] {entity.state} {datasource:sensor.temp} {{now().hour}}"
# Evaluates in order:
# 1. JavaScript: [[[return 'JS']]] → "JS"
# 2. Token: {entity.state} → "on"
# 3. Datasource: {datasource:sensor.temp} → "23.5"
# 4. Jinja2: {{now().hour}} → "14"
# Result: "JS on 23.5 14"
```

## API Reference

### UnifiedTemplateEvaluator

```javascript
import { UnifiedTemplateEvaluator } from './core/templates/UnifiedTemplateEvaluator.js';

const evaluator = new UnifiedTemplateEvaluator({
  hass: hassObject,
  context: contextObject,
  dataSourceManager: dataSourceManager
});

// Async evaluation (all template types)
const result = await evaluator.evaluateAsync(content);

// Sync evaluation (no Jinja2)
const result = evaluator.evaluateSync(content);

// Extract Jinja2 dependencies
const entities = evaluator.extractDependencies(content);

// Update components
evaluator.updateContext(newContext);
evaluator.updateHass(newHass);
evaluator.updateDataSourceManager(newManager);
```

### MSDContentResolver.processTemplateUnified()

```javascript
import { MSDContentResolver } from './msd/renderer/MSDContentResolver.js';

// New unified method (Phase 3)
const processed = await MSDContentResolver.processTemplateUnified(content, {
  hass: hassObject,
  context: contextObject,
  rendererName: 'MyRenderer'
});
```

## Backward Compatibility

### SimpleCard
- ✅ All existing token syntax `{entity.state}` works unchanged
- ✅ All existing JavaScript `[[[code]]]` works unchanged
- ✅ All existing Jinja2 `{{expression}}` works unchanged
- ✅ **NEW:** Can now use datasources `{datasource:sensor.temp}`

### MSD
- ✅ All existing datasource syntax `{sensor.temp}` works unchanged
- ✅ **NEW:** Can now use explicit prefix `{datasource:sensor.temp}`
- ✅ **NEW:** Can now use JavaScript `[[[code]]]`
- ⏳ **PLANNED:** Jinja2 `{{states('entity')}}` (Phase 4 - requires async rendering)

**Note:** MSD now uses UnifiedTemplateEvaluator in **sync mode** which evaluates JavaScript, Tokens, and Datasources. Jinja2 support requires making MSD rendering async, which is planned for Phase 4.

### Migration Path

**No migration required!** The unified system is fully backward compatible.

**Optional:** Migrate to explicit datasource syntax for clarity:
```yaml
# Old (still works)
label: "{sensor.temp:.1f}°C"

# New (recommended, more explicit)
label: "{datasource:sensor.temp:.1f}°C"
```

## Testing

### Test File
- `test/test-phase3-unified-templates.yaml` - Comprehensive test suite

### Test Coverage
1. ✅ SimpleCard with datasource (new syntax)
2. ✅ SimpleCard with mixed templates
3. ✅ SimpleCard with datasource + Jinja2
4. ✅ SimpleCard with all template types
5. ✅ Legacy MSD datasource (backward compatibility)
6. ✅ Tokens that don't conflict with datasources
7. ✅ Explicit datasource prefix in various formats
8. ✅ Jinja2 with datasource reference
9. ✅ Complex mixed template
10. ✅ Edge case - braces everywhere

## Benefits

### For Users
- 🎯 **One consistent syntax** across all card types
- 🔧 **More flexibility** - use any template type anywhere
- 📝 **Clearer intent** with explicit `{datasource:...}` prefix
- ✅ **No breaking changes** - all existing configs work

### For Developers
- 🏗️ **Single template processor** for entire system
- 🔍 **Unambiguous parsing** - no guessing what `{x}` means
- 🧪 **Easier testing** - one system to test
- 📚 **Better maintainability** - one source of truth

## Implementation Details

### File Changes

**New Files:**
- `src/core/templates/UnifiedTemplateEvaluator.js` - Main orchestrator

**Modified Files:**
- `src/core/templates/TemplateDetector.js` - Added datasource detection
- `src/core/templates/TemplateParser.js` - Added datasource parsing
- `src/core/templates/SimpleCardTemplateEvaluator.js` - Updated token regex
- `src/msd/renderer/MSDContentResolver.js` - Added unified method
- `package.json` - Version bump to 1.9.24

**Test Files:**
- `test/test-phase3-unified-templates.yaml` - Phase 3 test suite

### Design Decisions

1. **Explicit prefix over implicit detection**
   - ✅ Unambiguous parsing
   - ✅ Future-proof (any datasource name works)
   - ❌ Slightly more verbose

2. **Maintain legacy syntax support**
   - ✅ Zero breaking changes
   - ✅ Gradual migration path
   - ⚠️ Hardcoded domain list remains (acceptable trade-off)

3. **Evaluation order: JS → Tokens → Datasources → Jinja2**
   - ✅ Predictable behavior
   - ✅ Each phase can see previous results
   - ✅ Jinja2 last (async, can access HA API)

## Future Enhancements

### Phase 4 Candidates
- 🚀 **Performance optimization**: Batch template evaluation
- 💾 **Template caching**: Cache compiled templates
- 🔄 **Smart re-evaluation**: Only re-evaluate changed dependencies
- 📊 **Template profiling**: Measure template evaluation time
- 🎨 **Template linting**: Validate templates before evaluation

## Notes

- Phase 3 builds on Phase 1 (token syntax migration) and Phase 2 (Jinja2 support)
- UnifiedTemplateEvaluator is the new recommended way to process templates
- Legacy methods remain for backward compatibility
- All template types work in both SimpleCard and MSD contexts
- No configuration changes required for existing setups

## Status Summary

✅ **Phase 1:** Token syntax migration `{{}}` → `{}`
✅ **Phase 2:** Jinja2 server-side support in SimpleCard
✅ **Phase 3:** Unified template system across all card types
🔜 **Phase 4:** Performance optimization and caching
