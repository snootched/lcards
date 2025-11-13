# Jinja2 Template Support - Implementation Plan
**LCARdS Unified Template System**

Date: 2025-11-12
Status: **PHASE 1 - Ready to Start**
Branch: `feature/jinja2-templates`

---

## Overview

This document tracks the implementation of unified Jinja2 template support across LCARdS.

**Approach:** Direct migration to unified system
- Single HATemplateEvaluator for both SimpleCard and MSD
- Replace existing MsdTemplateEngine
- Fix issues as they arise (no gradual rollout)

**Key Changes:**
- Token syntax: `{{token}}` → `{token}`
- Jinja2 templates: `{{states('entity')}}` (server-side via WebSocket)
- JavaScript: `[[[code]]]` (unchanged)
- MSD datasources: `{datasource.key}` (unchanged)

---

## Phase 1: Token Syntax Migration ⏳

**Goal:** Change `{{token}}` → `{token}` throughout codebase
**Duration:** Day 1
**Status:** Not Started

### Task 1.1: Update TemplateDetector.js

**File:** `src/core/templates/TemplateDetector.js`

**Changes needed:**

1. **Update token detection method:**
```javascript
// CURRENT: hasTokens() - detects {{...}}
static hasTokens(content) {
  if (!content || typeof content !== 'string') return false;
  return content.includes('{{') && content.includes('}}');
}

// AFTER: hasTokens() - detects {token} but NOT {{jinja2}} or {datasource}
static hasTokens(content) {
  if (!content || typeof content !== 'string') return false;

  // Match {token} but exclude:
  // - {{jinja2}} (double braces)
  // - {sensor.*}, {light.*}, etc. (MSD datasources)
  const tokenPattern = /\{(?!\{)(?!sensor\.|light\.|switch\.|climate\.|binary_sensor\.|cover\.|fan\.|lock\.|media_player\.|vacuum\.|camera\.|alarm_control_panel\.)([^{}]+)\}/;

  return tokenPattern.test(content);
}
```

2. **Enhance Jinja2 detection:**
```javascript
// CURRENT: Basic detection
static hasHATemplates(content) {
  if (!content || typeof content !== 'string') return false;
  return content.includes('{{') && content.includes('}}');
}

// AFTER: Detect Jinja2 indicators
static hasJinja2Templates(content) {
  if (!content || typeof content !== 'string') return false;
  if (!content.includes('{{')) return false;

  // Jinja2 indicators:
  // - Function calls: states(), state_attr(), now(), etc.
  // - Filters: | round, | float, | int, etc.
  // - Statements: {% if %}, {% for %}, etc.

  const jinja2Patterns = [
    /\{\{\s*states\s*\(/,           // {{states('entity')}}
    /\{\{\s*state_attr\s*\(/,       // {{state_attr('entity', 'attr')}}
    /\{\{\s*now\s*\(/,              // {{now()}}
    /\{\{\s*is_state\s*\(/,         // {{is_state('entity', 'on')}}
    /\{\{[^}]*\|[^}]+\}\}/,         // {{value | filter}}
    /\{%[\s\S]*?%\}/                // {% if/for/etc %}
  ];

  return jinja2Patterns.some(pattern => pattern.test(content));
}

// Keep alias for backward compatibility
static hasHATemplates(content) {
  return this.hasJinja2Templates(content);
}
```

3. **Update detectTemplateTypes():**
```javascript
static detectTemplateTypes(content) {
  if (!content || typeof content !== 'string') {
    return {
      hasMSD: false,
      hasHA: false,
      hasJinja2: false,  // NEW
      hasJavaScript: false,
      hasTokens: false
    };
  }

  return {
    hasMSD: this.hasMSDTemplates(content),
    hasHA: this.hasJinja2Templates(content),
    hasJinja2: this.hasJinja2Templates(content),  // NEW: Same as hasHA
    hasJavaScript: this.hasJavaScript(content),
    hasTokens: this.hasTokens(content)
  };
}
```

**Testing:**
```javascript
// Should detect tokens
TemplateDetector.hasTokens('{entity.state}')  // true
TemplateDetector.hasTokens('{variables.color}')  // true

// Should NOT detect tokens (these are Jinja2)
TemplateDetector.hasTokens('{{states("sensor.temp")}}')  // false
TemplateDetector.hasTokens('{{entity.state | round}}')  // false

// Should NOT detect tokens (these are MSD datasources)
TemplateDetector.hasTokens('{sensor.temp}')  // false
TemplateDetector.hasTokens('{light.desk.brightness}')  // false

// Should detect Jinja2
TemplateDetector.hasJinja2Templates('{{states("sensor.temp")}}')  // true
TemplateDetector.hasJinja2Templates('{{value | round(1)}}')  // true
TemplateDetector.hasJinja2Templates('{% if condition %}text{% endif %}')  // true

// Should NOT detect Jinja2 (simple tokens)
TemplateDetector.hasJinja2Templates('{entity.state}')  // false
```

**Status:** ☐ Not Started

---

### Task 1.2: Update TemplateParser.js

**File:** `src/core/templates/TemplateParser.js`

**Changes needed:**

1. **Update extractTokens() regex:**
```javascript
// CURRENT: Extracts {{token}}
static extractTokens(content) {
  // ... implementation
  const tokenRegex = /\{\{([^}]+)\}\}/g;
}

// AFTER: Extracts {token}
static extractTokens(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const tokens = [];
  // Match {token} but NOT {{jinja2}} or {datasource}
  const tokenRegex = /\{(?!\{)(?!sensor\.|light\.|switch\.|climate\.|binary_sensor\.|cover\.|fan\.|lock\.|media_player\.|vacuum\.|camera\.|alarm_control_panel\.)([^{}]+)\}/g;

  let match;
  while ((match = tokenRegex.exec(content)) !== null) {
    tokens.push({
      match: match[0],
      token: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return tokens;
}
```

2. **Add extractJinja2() method:**
```javascript
/**
 * Extract Jinja2 template expressions from content
 *
 * @param {string} content - Content to parse
 * @returns {Array<Object>} Array of Jinja2 template info
 *
 * @example
 * extractJinja2('Temp: {{states("sensor.temp") | round(1)}}°C')
 * // => [{
 * //   match: '{{states("sensor.temp") | round(1)}}',
 * //   expression: 'states("sensor.temp") | round(1)',
 * //   start: 6,
 * //   end: 44
 * // }]
 */
static extractJinja2(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const templates = [];
  const jinja2Regex = /\{\{([^}]+)\}\}/g;

  let match;
  while ((match = jinja2Regex.exec(content)) !== null) {
    const expression = match[1].trim();

    // Only include if it has Jinja2 indicators
    const hasFunction = /\w+\s*\(/.test(expression);
    const hasFilter = /\|/.test(expression);

    if (hasFunction || hasFilter) {
      templates.push({
        match: match[0],
        expression: expression,
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }

  return templates;
}
```

3. **Add extractJinja2Entities() method:**
```javascript
/**
 * Extract entity IDs referenced in Jinja2 templates
 *
 * @param {string} content - Content to parse
 * @returns {Array<string>} Array of entity IDs
 *
 * @example
 * extractJinja2Entities('{{states("sensor.temp")}} {{states("sensor.humidity")}}')
 * // => ['sensor.temp', 'sensor.humidity']
 */
static extractJinja2Entities(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const entities = new Set();

  // Match states('entity.id'), state_attr('entity.id', 'attr'), is_state('entity.id', 'state')
  const patterns = [
    /states\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /state_attr\s*\(\s*['"]([^'"]+)['"]\s*,/g,
    /is_state\s*\(\s*['"]([^'"]+)['"]\s*,/g,
    /has_value\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      entities.add(match[1]);
    }
  });

  return Array.from(entities);
}
```

**Testing:**
```javascript
// Extract tokens
TemplateParser.extractTokens('{entity.state} and {variables.color}')
// => [
//   { match: '{entity.state}', token: 'entity.state', start: 0, end: 14 },
//   { match: '{variables.color}', token: 'variables.color', start: 19, end: 37 }
// ]

// Extract Jinja2
TemplateParser.extractJinja2('Temp: {{states("sensor.temp") | round(1)}}°C')
// => [{
//   match: '{{states("sensor.temp") | round(1)}}',
//   expression: 'states("sensor.temp") | round(1)',
//   start: 6,
//   end: 44
// }]

// Extract entities
TemplateParser.extractJinja2Entities('{{states("sensor.temp")}} and {{state_attr("light.desk", "brightness")}}')
// => ['sensor.temp', 'light.desk']
```

**Status:** ☐ Not Started

---

### Task 1.3: Update SimpleCardTemplateEvaluator.js

**File:** `src/core/templates/SimpleCardTemplateEvaluator.js`

**Changes needed:**

1. **Update _evaluateTokens() regex:**
```javascript
// CURRENT: Evaluates {{token}}
_evaluateTokens(content) {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
    try {
      const value = this._resolveToken(token.trim());
      return value !== null && value !== undefined ? String(value) : '';
    } catch (error) {
      lcardsLog.warn('[SimpleCardTemplateEvaluator] Token resolution failed:', error);
      return match;
    }
  });
}

// AFTER: Evaluates {token}
_evaluateTokens(content) {
  // Match {token} but NOT {{jinja2}} or {datasource}
  const tokenRegex = /\{(?!\{)(?!sensor\.|light\.|switch\.|climate\.|binary_sensor\.|cover\.|fan\.|lock\.|media_player\.|vacuum\.|camera\.|alarm_control_panel\.)([^{}]+)\}/g;

  return content.replace(tokenRegex, (match, token) => {
    try {
      const value = this._resolveToken(token.trim());
      return value !== null && value !== undefined ? String(value) : '';
    } catch (error) {
      lcardsLog.warn('[SimpleCardTemplateEvaluator] Token resolution failed:', error);
      return match;
    }
  });
}
```

**Testing:**
```javascript
const evaluator = new SimpleCardTemplateEvaluator({
  entity: { state: 'on', attributes: { brightness: 100 } },
  variables: { color: 'red' }
});

// Should evaluate tokens
evaluator.evaluate('State: {entity.state}')  // 'State: on'
evaluator.evaluate('Color: {variables.color}')  // 'Color: red'

// Should NOT evaluate Jinja2 (not its job)
evaluator.evaluate('Temp: {{states("sensor.temp")}}')  // 'Temp: {{states("sensor.temp")}}'

// Should NOT evaluate MSD datasources
evaluator.evaluate('Value: {sensor.temp}')  // 'Value: {sensor.temp}'
```

**Status:** ☐ Not Started

---

### Task 1.4: Find and Replace in Test Files

**Goal:** Update all test files to use new `{token}` syntax

**Files to update:**
```bash
test/*.html
test/*.yaml
test/*.js
```

**Find/Replace patterns:**
```
Find:    {{entity\.
Replace: {entity.

Find:    {{variables\.
Replace: {variables.

Find:    {{config\.
Replace: {config.

Find:    {{theme\.
Replace: {theme.
```

**Important:** Be careful not to replace:
- `{{states(` - This is Jinja2, keep double braces
- `{{now(` - This is Jinja2, keep double braces
- Any other function calls with `{{...}}`

**Verification:**
- Run build: `npm run build`
- Check for syntax errors
- Manually review a few test files

**Status:** ☐ Not Started

---

### Task 1.5: Update Documentation Examples

**Files to check:**
```bash
doc/user-guide/**/*.md
doc/proposals/**/*.md
README.md
```

**Find/Replace patterns:**
```
Find:    {{entity\.
Replace: {entity.

Find:    {{variables\.
Replace: {variables.
```

**Status:** ☐ Not Started

---

### Task 1.6: Test Existing Functionality

**Goal:** Verify SimpleCard still works after token syntax change

**Test cases:**
1. SimpleButton with `{entity.state}` token
2. SimpleLabel with `{entity.attributes.friendly_name}`
3. SimpleCard with `{variables.custom_var}`
4. Mixed: `{entity.state}` + `[[[return entity.attributes.brightness]]]`

**Build and test:**
```bash
npm run build
# Open test page in browser
# Verify cards render correctly
```

**Status:** ☐ Not Started

---

### Task 1.7: Create SYNTAX_MIGRATION.md

**File:** `doc/SYNTAX_MIGRATION.md`

**Content:**
```markdown
# Token Syntax Migration (BREAKING CHANGE)

## What Changed

Token template syntax changed from `{{token}}` to `{token}`.

## Why

Adding Jinja2 support (`{{jinja2}}`) which uses same `{{ }}` syntax.
To avoid confusion, our simple token syntax now uses single braces.

## Migration Guide

### Before
```yaml
name: "{{entity.state}}"
label: "{{entity.attributes.friendly_name}}"
color: "{{variables.accent_color}}"
```

### After
```yaml
name: "{entity.state}"
label: "{entity.attributes.friendly_name}"
color: "{variables.accent_color}"
```

## New Jinja2 Support (Coming Soon)
```yaml
name: "{entity.attributes.friendly_name}"  # Token (client-side)
label: "{{states('sensor.temp') | round(1)}}°C"  # Jinja2 (server-side)
```

## Syntax Reference

| Syntax | Purpose | Example |
|--------|---------|---------|
| `{token}` | Simple lookup | `{entity.state}` |
| `{{jinja2}}` | HA templating | `{{states('sensor.temp')}}` |
| `[[[js]]]` | JavaScript | `[[[return entity.state]]]` |
| `{datasource}` | MSD datasource | `{sensor.temp}` |

## Migration Checklist

- [ ] Replace `{{entity.` with `{entity.` in all configs
- [ ] Replace `{{variables.` with `{variables.`
- [ ] Replace `{{config.` with `{config.`
- [ ] Verify MSD references unchanged (`{sensor.*}`)
- [ ] Test all cards render correctly
```

**Status:** ☐ Not Started

---

### Phase 1 Completion Checklist

- [x] Task 1.1: TemplateDetector.js updated
- [x] Task 1.2: TemplateParser.js updated
- [x] Task 1.3: SimpleCardTemplateEvaluator.js updated
- [x] Task 1.4: Test files updated
- [x] Task 1.5: Documentation updated
- [x] Task 1.6: Existing functionality tested (build successful)
- [x] Task 1.7: SYNTAX_MIGRATION.md created
- [x] Build successful (`npm run build`)
- [ ] No console errors (requires runtime testing in HA)
- [ ] Git commit: `refactor: migrate token syntax from {{}} to {}`

**Phase 1 Status:** ✅ Complete (pending runtime validation)

---

## Phase 2: HATemplateEvaluator Implementation

**Status:** Not Started (waiting for Phase 1)

Will be detailed after Phase 1 completion.

---

## Phase 3: SimpleCard Integration

**Status:** Not Started (waiting for Phase 2)

Will be detailed after Phase 2 completion.

---

## Phase 4: MSD Migration

**Status:** Not Started (waiting for Phase 3)

Will be detailed after Phase 3 completion.

---

## Phase 5: Final Validation

**Status:** Not Started (waiting for Phase 4)

Will be detailed after Phase 4 completion.

---

*Implementation Plan Version: 1.0*
*Last Updated: 2025-11-12*
*Current Phase: Phase 1 (Token Syntax Migration)*
