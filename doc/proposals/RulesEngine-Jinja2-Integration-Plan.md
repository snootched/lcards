# RulesEngine Jinja2 Integration - Complete Implementation Plan

**Version:** 2.0 (Post-Template v1.9.30 Overhaul)  
**Date:** November 13, 2025  
**Status:** Ready for Implementation  
**Author:** Based on original proposals, revised for current template system

---

## Executive Summary

This plan integrates Home Assistant Jinja2 template support into the LCARdS RulesEngine, enabling powerful server-side condition evaluation alongside existing client-side conditions. The implementation leverages the recently completed unified template system (v1.9.30) and eliminates duplicate condition evaluation logic.

### Key Changes

- ✅ Add Jinja2 condition support: `{{ states('sensor.temp') | float > 25 }}`
- ✅ Add JavaScript condition support: `entity.state === 'on'`
- ✅ Smart auto-detection of condition types via `TemplateDetector`
- ✅ Unify `compileConditions.js` and `RulesEngine` (eliminate duplicate logic)
- ✅ Leverage `UnifiedTemplateEvaluator` and `HATemplateEvaluator`
- ✅ Make rule evaluation async (for Jinja2 WebSocket calls)
- ✅ **No breaking changes** - all existing rule syntax works

### Timeline

**Total:** ~2 weeks (10 working days)
- Phase 0: Syntax alignment (1 day)
- Phase 1: Enhance compileConditions (3 days)
- Phase 2: Integrate into RulesEngine (4 days)
- Phase 3: Testing & validation (2 days)

---

## Table of Contents

1. [Background](#background)
2. [Current State](#current-state)
3. [Architecture Design](#architecture-design)
4. [Implementation Phases](#implementation-phases)
5. [Syntax Examples](#syntax-examples)
6. [Testing Strategy](#testing-strategy)
7. [Migration Guide](#migration-guide)
8. [Performance Considerations](#performance-considerations)
9. [Risk Assessment](#risk-assessment)

---

## Background

### Why This Change?

**User Request:**  
*"Can we support Jinja2 templates in rule conditions like Home Assistant uses?"*

**Current Limitations:**
- Rules only support basic entity conditions: `entity.state === 'on'`, `above: 25`
- No server-side template evaluation (Jinja2)
- No JavaScript expressions for complex logic
- Duplicate condition logic between `compileConditions.js` and `RulesEngine`

**What This Enables:**
```yaml
# Before: Basic entity condition
when:
  entity: sensor.temperature
  above: 25

# After: Powerful Jinja2 conditions
when:
  condition: "{{ states('sensor.temp') | float > 25 and is_state('light.desk', 'on') }}"

# After: JavaScript expressions
when:
  condition: "entity.state === 'on' && entity.attributes.brightness > 128"

# After: Simple token expressions
when:
  condition: "{entity.state} === 'on'"
```

### Template System Foundation (v1.9.30)

The unified template system is **already implemented** with:

- ✅ `UnifiedTemplateEvaluator` - Orchestrates all template types
- ✅ `HATemplateEvaluator` - Server-side Jinja2 via HA WebSocket API
- ✅ `SimpleCardTemplateEvaluator` - Client-side JavaScript and tokens
- ✅ `TemplateDetector` - Auto-detects template types
- ✅ `TemplateParser` - Extracts dependencies

**Current Template Syntax:**
```javascript
Tokens:      {entity.state}           // Single braces
Jinja2:      {{states('entity')}}     // Double braces
JavaScript:  [[[code]]]                // Triple brackets
Datasources: {datasource:sensor.temp} // Explicit prefix
```

---

## Current State

### The Problem: Duplicate Logic

We have **two separate condition evaluation systems**:

#### 1. `compileConditions.js` (Unused, Complete)
- ✅ Compiles rules to optimized AST-like trees
- ✅ Has `evalCompiled(tree, ctx)` evaluation function
- ✅ Supports: `entity`, `entity_attr`, `map_range_cond`, `time_between`, etc.
- ✅ Logical operators: `all`, `any`, `not`
- ❌ **Not integrated** into RulesEngine
- ❌ No Jinja2 or JavaScript support

#### 2. `RulesEngine.evaluateCondition()` (Active)
- ✅ Manually evaluates conditions (100+ lines of duplicate logic)
- ✅ Integrated with DataSourceManager
- ✅ HASS state caching
- ✅ Used by MSD cards
- ❌ Duplicates `compileConditions.js` logic
- ❌ No Jinja2 or JavaScript support

### Current Condition Syntax

**What works today:**
```yaml
when:
  entity: sensor.temperature
  state: "on"              # Exact match
  above: 25                # Greater than
  below: 30                # Less than
  equals: 25               # Numeric equality

when:
  time_between: "08:00-22:00"

when:
  time:
    after: "08:00"
    before: "22:00"

when:
  all:
    - entity: light.living_room
      state: "on"
    - entity: sensor.temperature
      above: 20
```

---

## Architecture Design

### Solution: Integrate compileConditions with Template Support

**Approach:**
1. ✅ Enhance `compileConditions.js` to support Jinja2 and JavaScript
2. ✅ Add auto-detection via `condition` field
3. ✅ Make RulesEngine use compiled conditions
4. ✅ Eliminate duplicate evaluation logic
5. ✅ Make evaluation async (for Jinja2)

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│ RulesEngine (Enhanced)                                  │
│ + _initializeTemplateEvaluators()                       │
│ + _compileRules()                                       │
│ + async evaluateRule()                                  │
│ + async evaluateDirty()                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ├──────────────────────┐
                           ▼                      ▼
┌─────────────────────────────────┐  ┌──────────────────────────┐
│ compileConditions.js (Enhanced) │  │ UnifiedTemplateEvaluator │
│ + compileNode() [auto-detect]   │  │ + evaluateAsync()        │
│ + async evalCompiled()          │  │ + evaluateSync()         │
│ + evalJinja2()                  │  └──────────────────────────┘
│ + evalJavaScript()              │              │
│ + resolveTokensInCode()         │              ├───────────────┐
└─────────────────────────────────┘              ▼               ▼
                                     ┌─────────────────┐  ┌─────────────────┐
                                     │ HATemplate      │  │ SimpleCard      │
                                     │ Evaluator       │  │ Template        │
                                     │ (Jinja2)        │  │ Evaluator       │
                                     │                 │  │ (JS/Tokens)     │
                                     └─────────────────┘  └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Home Assistant  │
                                     │ WebSocket API   │
                                     │ render_template │
                                     └─────────────────┘
```

### Evaluation Flow

```
Rule Configuration
        │
        ▼
┌──────────────────┐
│ compileRule()    │ ← Compile once at registration
│ compileNode()    │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Compiled Tree    │
│ (stored in Map)  │
└──────────────────┘
        │
        ▼ [When entity changes]
┌──────────────────┐
│ evaluateDirty()  │ ← async
└──────────────────┘
        │
        ├──────────────────────────┐
        ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│ Sync Conditions  │      │ Async Conditions │
│ (Entity, Time)   │      │ (Jinja2)         │
└──────────────────┘      └──────────────────┘
        │                          │
        │                          ▼
        │                 ┌──────────────────┐
        │                 │ HA WebSocket API │
        │                 │ render_template  │
        │                 └──────────────────┘
        │                          │
        └────────┬─────────────────┘
                 ▼
        ┌──────────────────┐
        │ Matched Rules    │
        │ Apply Patches    │
        └──────────────────┘
```

---

## Implementation Phases

### Phase 0: Syntax Alignment (Day 1)

**Goal:** Ensure all examples and detection match current template syntax

#### Task 0.1: Document Current Syntax

**File:** `doc/architecture/rules-engine-template-syntax.md` (NEW)

```markdown
# RulesEngine Template Syntax Reference

## Token Templates (Single Braces)

Syntax: `{entity.state}`

Used for simple client-side value lookups.

**Examples:**
```yaml
condition: "{entity.state} === 'on'"
condition: "{entity.attributes.brightness} > 100"
condition: "{variables.threshold} < 50"
```

## Jinja2 Templates (Double Braces)

Syntax: `{{states('entity') | filter}}`

Server-side evaluation via Home Assistant.

**Examples:**
```yaml
condition: "{{ states('sensor.temp') | float > 25 }}"
condition: "{{ is_state('light.desk', 'on') }}"
condition: "{{ now().hour >= 18 }}"
```

## JavaScript Expressions (No Braces)

Syntax: Plain JavaScript

Client-side evaluation with entity context.

**Examples:**
```yaml
condition: "entity.state === 'on'"
condition: "entity.attributes.brightness > 100 && entity.state === 'on'"
condition: "Math.round(parseFloat(entity.state)) > 25"
```

## Detection Priority

1. **Jinja2**: Has `{{...}}` with functions (`states()`, `now()`) or filters (`| float`)
2. **Tokens**: Has `{...}` (single braces)
3. **JavaScript**: Everything else (fallback)
```

#### Task 0.2: Create Detection Test Suite

**File:** `test/rules/template-detection.test.js` (NEW)

```javascript
import { TemplateDetector } from '../../src/core/templates/TemplateDetector.js';

describe('RulesEngine Template Detection', () => {
  describe('Jinja2 Detection', () => {
    it('detects Jinja2 with states() function', () => {
      const types = TemplateDetector.detectTemplateTypes(
        "{{ states('sensor.temp') | float > 25 }}"
      );
      expect(types.hasJinja2).toBe(true);
      expect(types.hasTokens).toBe(false);
    });

    it('detects Jinja2 with filters', () => {
      const types = TemplateDetector.detectTemplateTypes(
        "{{ value | round(1) }}"
      );
      expect(types.hasJinja2).toBe(true);
    });

    it('detects Jinja2 control structures', () => {
      const types = TemplateDetector.detectTemplateTypes(
        "{% if is_state('light.desk', 'on') %}true{% endif %}"
      );
      expect(types.hasJinja2).toBe(true);
    });
  });

  describe('Token Detection', () => {
    it('detects single-brace tokens', () => {
      const types = TemplateDetector.detectTemplateTypes(
        "{entity.state} === 'on'"
      );
      expect(types.hasTokens).toBe(true);
      expect(types.hasJinja2).toBe(false);
    });

    it('excludes MSD datasources', () => {
      const types = TemplateDetector.detectTemplateTypes(
        "{sensor.temperature}"
      );
      expect(types.hasMSD).toBe(true);
      expect(types.hasTokens).toBe(false);
    });
  });

  describe('JavaScript Detection', () => {
    it('detects plain JavaScript expressions', () => {
      const types = TemplateDetector.detectTemplateTypes(
        "entity.state === 'on' && entity.attributes.brightness > 100"
      );
      // Should not detect as any template type
      expect(types.hasJinja2).toBe(false);
      expect(types.hasTokens).toBe(false);
      expect(types.hasJavaScript).toBe(false); // Not [[[...]]]
    });
  });
});
```

---

### Phase 1: Enhance compileConditions.js (Days 2-4)

**Goal:** Add Jinja2, JavaScript, and auto-detection support to condition compiler

#### Task 1.1: Add Auto-Detection to compileNode()

**File:** `src/core/rules/compileConditions.js` (PATCH)

```javascript
import { linearMap } from '../../utils/linearMap.js';
import { TemplateDetector } from '../templates/TemplateDetector.js';
import { TemplateParser } from '../templates/TemplateParser.js';

export function compileRule(rule, issues) {
  const raw = rule.when;
  const compiled = {
    tree: raw ? compileNode(raw, issues, rule.id) : alwaysTrueNode(),
    deps: {
      entities: new Set(),
      perf: new Set(),
      flags: new Set()
    }
  };
  collectDeps(compiled.tree, compiled.deps);
  return compiled;
}

function compileNode(node, issues, ruleId) {
  if (!node) return alwaysTrueNode();
  if (Array.isArray(node)) {
    return { type: 'all', nodes: node.map(n => compileNode(n, issues, ruleId)) };
  }
  if (node.all) {
    return { type: 'all', nodes: node.all.map(n => compileNode(n, issues, ruleId)) };
  }
  if (node.any) {
    return { type: 'any', nodes: node.any.map(n => compileNode(n, issues, ruleId)) };
  }
  if (node.not) {
    return { type: 'not', node: compileNode(node.not, issues, ruleId) };
  }

  // ✨ NEW: Auto-detect template type from 'condition' field
  if (node.condition) {
    const conditionStr = String(node.condition);
    const types = TemplateDetector.detectTemplateTypes(conditionStr);

    // Priority 1: Jinja2 (most specific - double braces with functions/filters)
    if (types.hasJinja2) {
      return {
        type: 'jinja2',
        template: conditionStr,
        detected: true
      };
    }

    // Priority 2: Tokens (single braces) - need to resolve before JavaScript eval
    if (types.hasTokens) {
      return {
        type: 'javascript',
        code: conditionStr,
        detected: true,
        hasTokens: true  // Flag to pre-process tokens
      };
    }

    // Priority 3: Plain expression (treat as JavaScript)
    return {
      type: 'javascript',
      code: conditionStr,
      detected: true,
      isExpression: true
    };
  }

  // ✨ NEW: Explicit type support (for power users)
  if (node.jinja2) {
    return {
      type: 'jinja2',
      template: node.jinja2,
      detected: false  // Explicitly declared
    };
  }

  if (node.javascript || node.js) {
    return {
      type: 'javascript',
      code: node.javascript || node.js,
      detected: false
    };
  }

  // Existing condition types (unchanged)
  if (node.map_range_cond) {
    const c = { ...node.map_range_cond };
    return { type: 'map_range_cond', c };
  }
  if (node.entity || node.entity_attr) {
    return { type: node.entity ? 'entity' : 'entity_attr', c: node };
  }
  if (node.time_between) {
    return { type: 'time_between', range: node.time_between };
  }
  if (node.weekday_in) {
    return { type: 'weekday_in', list: node.weekday_in };
  }
  if (node.sun_elevation) {
    return { type: 'sun_elevation', cmp: node.sun_elevation };
  }
  if (node.perf_metric) {
    return { type: 'perf_metric', c: node.perf_metric };
  }
  if (node.flag) {
    return { type: 'flag', c: node.flag };
  }
  if (node.random_chance != null) {
    return { type: 'random_chance', p: node.random_chance };
  }

  // Fallback: invalid condition
  return { type: 'invalid', reason: 'unrecognized', raw: node };
}

function collectDeps(node, deps) {
  switch (node.type) {
    case 'all':
    case 'any':
      node.nodes.forEach(n => collectDeps(n, deps));
      break;
    case 'not':
      collectDeps(node.node, deps);
      break;
    case 'entity':
    case 'entity_attr':
    case 'map_range_cond':
      if (node.c?.entity) deps.entities.add(node.c.entity);
      break;
    case 'perf_metric':
      if (node.c?.key) deps.perf.add(node.c.key);
      break;
    case 'flag':
      if (node.c?.debugFlagName) deps.flags.add(node.c.debugFlagName);
      break;
    // ✨ NEW: Extract dependencies from template conditions
    case 'jinja2':
      // Extract entity IDs from Jinja2 templates
      const jinja2Entities = TemplateParser.extractJinja2Entities(node.template);
      jinja2Entities.forEach(entityId => deps.entities.add(entityId));
      break;
    case 'javascript':
      // Extract entity references from JavaScript code
      const jsTokens = TemplateParser.extractTokens(node.code);
      jsTokens.forEach(token => {
        if (token.parts[0] === 'entity') {
          // This references ctx.entity, dependency will be from rule's entity context
        }
      });
      break;
  }
}

function alwaysTrueNode() {
  return { type: 'always' };
}

// ... existing evalCompiled, getEntity, evalEntity, evalEntityAttr, etc. (unchanged)
```

#### Task 1.2: Add Jinja2 Evaluation

**File:** `src/core/rules/compileConditions.js` (PATCH - add new function)

```javascript
/**
 * Evaluate Jinja2 template condition via Home Assistant
 *
 * @param {Object} tree - Compiled Jinja2 node
 * @param {Object} ctx - Evaluation context
 * @param {Object} ctx.unifiedTemplateEvaluator - UnifiedTemplateEvaluator instance
 * @returns {Promise<boolean>} True if condition matches
 */
async function evalJinja2(tree, ctx) {
  if (!ctx.unifiedTemplateEvaluator) {
    console.warn('[compileConditions] UnifiedTemplateEvaluator not available for Jinja2 evaluation');
    return false;
  }

  try {
    // Evaluate Jinja2 template - result is a string
    const result = await ctx.unifiedTemplateEvaluator.evaluateAsync(tree.template);

    // Convert result to boolean
    // Jinja2 may return: "True", "False", "true", "false", "1", "0", "yes", "no"
    const resultStr = String(result).trim().toLowerCase();

    const truthyValues = ['true', '1', 'yes', 'on'];
    const falsyValues = ['false', '0', 'no', 'off', '', 'none'];

    if (truthyValues.includes(resultStr)) {
      return true;
    }

    if (falsyValues.includes(resultStr)) {
      return false;
    }

    // Try numeric conversion as fallback
    const numValue = parseFloat(resultStr);
    if (!isNaN(numValue)) {
      return numValue !== 0;
    }

    // If result is non-empty string, treat as truthy
    return resultStr.length > 0;

  } catch (error) {
    console.error('[compileConditions] Jinja2 evaluation failed:', error);
    console.error('Template:', tree.template);
    return false;
  }
}
```

#### Task 1.3: Add JavaScript Evaluation with Token Resolution

**File:** `src/core/rules/compileConditions.js` (PATCH - add new function)

```javascript
/**
 * Resolve tokens in JavaScript code before evaluation
 *
 * Converts {entity.state} to actual values from context
 *
 * @param {string} code - JavaScript code with tokens
 * @param {Object} ctx - Evaluation context
 * @returns {string} Code with tokens replaced by values
 */
function resolveTokensInCode(code, ctx) {
  // Extract tokens using TemplateParser
  const tokens = TemplateParser.extractTokens(code);

  if (tokens.length === 0) {
    return code;
  }

  let resolved = code;

  tokens.forEach(token => {
    // Resolve token path from context
    const value = resolveTokenPath(token.parts, ctx);

    // Replace token with value
    // If value is string, wrap in quotes
    // If value is null/undefined, use 'null'
    let replacement;
    if (value === null || value === undefined) {
      replacement = 'null';
    } else if (typeof value === 'string') {
      replacement = `"${value.replace(/"/g, '\\"')}"`;  // Escape quotes
    } else {
      replacement = String(value);
    }

    resolved = resolved.replace(token.match, replacement);
  });

  return resolved;
}

/**
 * Resolve dot-notation path from context
 *
 * @param {Array<string>} parts - Path parts (e.g., ['entity', 'state'])
 * @param {Object} ctx - Evaluation context
 * @returns {*} Resolved value
 */
function resolveTokenPath(parts, ctx) {
  let current = ctx;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[part];
  }

  return current;
}

/**
 * Evaluate JavaScript condition
 *
 * @param {Object} tree - Compiled JavaScript node
 * @param {Object} ctx - Evaluation context
 * @returns {boolean} True if condition matches
 */
function evalJavaScript(tree, ctx) {
  let code = tree.code;

  // Pre-process: Resolve tokens {entity.state} before eval
  if (tree.hasTokens || code.includes('{')) {
    code = resolveTokensInCode(code, ctx);
  }

  try {
    // Create safe evaluation context
    const evalContext = {
      entity: ctx.entity,
      hass: ctx.hass,
      states: ctx.hass?.states || {},
      getEntity: ctx.getEntity,

      // Convenience shortcuts
      state: ctx.entity?.state,
      attributes: ctx.entity?.attributes || {},

      // Safe utility functions
      Math,
      Date,
      parseFloat,
      parseInt,
      String,
      Number,
      Boolean
    };

    // Wrap expression with return if needed
    const wrappedCode = tree.isExpression ? `return (${code})` : code;

    // Create function with context as parameters
    const func = new Function(
      ...Object.keys(evalContext),
      wrappedCode
    );

    // Execute with context values
    const result = func(...Object.values(evalContext));

    // Ensure boolean result
    return !!result;

  } catch (error) {
    console.error('[compileConditions] JavaScript evaluation failed:', error);
    console.error('Code:', code);
    console.error('Original:', tree.code);
    return false;
  }
}
```

#### Task 1.4: Make evalCompiled Async

**File:** `src/core/rules/compileConditions.js` (PATCH - modify existing function)

```javascript
/**
 * Evaluate compiled condition tree
 *
 * NOW ASYNC to support Jinja2 evaluation
 *
 * @param {Object} tree - Compiled condition tree
 * @param {Object} ctx - Evaluation context
 * @returns {Promise<boolean>} True if condition matches
 */
export async function evalCompiled(tree, ctx) {
  switch (tree.type) {
    case 'always':
      return true;

    case 'all':
      // Evaluate all conditions (in parallel for performance)
      const allResults = await Promise.all(
        tree.nodes.map(n => evalCompiled(n, ctx))
      );
      return allResults.every(r => r);

    case 'any':
      // Evaluate all conditions (in parallel)
      const anyResults = await Promise.all(
        tree.nodes.map(n => evalCompiled(n, ctx))
      );
      return anyResults.some(r => r);

    case 'not':
      const notResult = await evalCompiled(tree.node, ctx);
      return !notResult;

    // ✨ NEW: Async template conditions
    case 'jinja2':
      return await evalJinja2(tree, ctx);

    case 'javascript':
      return evalJavaScript(tree, ctx);  // Sync

    // Existing conditions (sync)
    case 'entity':
      return evalEntity(tree.c, ctx);
    case 'entity_attr':
      return evalEntityAttr(tree.c, ctx);
    case 'map_range_cond':
      return evalMapRangeCond(tree.c, ctx);
    case 'time_between':
      return evalTimeBetween(tree.range, ctx);
    case 'weekday_in':
      return evalWeekdayIn(tree.list, ctx);
    case 'sun_elevation':
      return evalSunElevation(tree.cmp, ctx);
    case 'perf_metric':
      return evalPerfMetric(tree.c, ctx);
    case 'flag':
      return evalFlag(tree.c, ctx);
    case 'random_chance':
      return Math.random() < (tree.p || 0);

    default:
      console.warn('[compileConditions] Unknown condition type:', tree.type);
      return false;
  }
}

// ... existing helper functions (unchanged)
```

---

### Phase 2: Integrate into RulesEngine (Days 5-8)

**Goal:** Make RulesEngine use compiled conditions with template support

#### Task 2.1: Add Template Evaluator Initialization

**File:** `src/core/rules/RulesEngine.js` (PATCH - add to constructor)

```javascript
import { perfTime, perfCount } from '../../utils/performance.js';
import { globalTraceBuffer } from './RuleTraceBuffer.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../../core/BaseService.js';
import { compileRule, evalCompiled } from './compileConditions.js';  // ✨ NEW
import { UnifiedTemplateEvaluator } from '../templates/UnifiedTemplateEvaluator.js';  // ✨ NEW

export class RulesEngine extends BaseService {
  constructor(rules = [], dataSourceManager = null) {
    super();
    this.rules = Array.isArray(rules) ? rules : [];
    this.rulesById = new Map();
    this.dependencyIndex = null;
    this.dirtyRules = new Set();
    this.lastEvaluation = new Map();
    this.traceBuffer = globalTraceBuffer;
    this.stopProcessing = new Map();

    // DataSource integration
    this.dataSourceManager = dataSourceManager;

    // Performance tracking
    this.evalCounts = {
      total: 0,
      dirty: 0,
      matched: 0,
      skipped: 0
    };

    // HASS subscription management
    this.hassUnsubscribe = null;
    this._reEvaluationCallbacks = [];
    this._hassEntities = new Set();
    this._freshStateCache = new Map();

    // ✨ NEW: Template evaluator for Jinja2/JS conditions
    this._templateEvaluator = null;

    // ✨ NEW: Compiled rules cache
    this.compiledRules = new Map();

    // Initialize
    this.buildRulesIndex();
    this.buildDependencyIndex();
    this.markAllDirty();

    // ✨ NEW: Compile rules
    this._compileRules();
  }

  /**
   * Initialize template evaluator for rule conditions
   * Called after systemsManager is set
   *
   * @private
   */
  _initializeTemplateEvaluator() {
    if (!this.systemsManager) {
      lcardsLog.warn('[RulesEngine] Cannot initialize template evaluator without systemsManager');
      return;
    }

    const hass = this.systemsManager.getHass();
    if (!hass) {
      lcardsLog.warn('[RulesEngine] Cannot initialize template evaluator without hass');
      return;
    }

    this._templateEvaluator = new UnifiedTemplateEvaluator({
      hass: hass,
      context: {
        hass: hass,
        config: {},
        variables: {}
      },
      dataSourceManager: this.dataSourceManager
    });

    lcardsLog.debug('[RulesEngine] Template evaluator initialized for Jinja2/JS conditions');
  }

  /**
   * Compile all rules to optimized trees
   *
   * @private
   */
  _compileRules() {
    const issues = [];

    lcardsLog.debug(`[RulesEngine] Compiling ${this.rules.length} rules...`);

    this.rules.forEach(rule => {
      try {
        const compiled = compileRule(rule, issues);
        this.compiledRules.set(rule.id, compiled);

        lcardsLog.trace(`[RulesEngine] Compiled rule ${rule.id}:`, {
          hasConditions: !!compiled.tree,
          dependencies: {
            entities: compiled.deps.entities.size,
            perf: compiled.deps.perf.size,
            flags: compiled.deps.flags.size
          }
        });
      } catch (error) {
        lcardsLog.error(`[RulesEngine] Failed to compile rule ${rule.id}:`, error);
        issues.push({
          ruleId: rule.id,
          error: error.message
        });
      }
    });

    if (issues.length > 0) {
      lcardsLog.warn('[RulesEngine] Rule compilation issues:', issues);
    }

    lcardsLog.debug(`[RulesEngine] Compiled ${this.compiledRules.size} rules successfully`);
  }

  // ... rest of existing constructor code ...
}
```

#### Task 2.2: Replace evaluateConditions with Compiled Evaluation

**File:** `src/core/rules/RulesEngine.js` (PATCH - replace methods)

```javascript
/**
 * Evaluate rule using compiled conditions
 *
 * NOW ASYNC to support Jinja2 conditions
 *
 * @param {Object} rule - Rule to evaluate
 * @param {Function} getEntity - Function to get entity state
 * @returns {Promise<Object>} Evaluation result
 */
async evaluateRule(rule, getEntity) {
  const startTime = performance.now();

  try {
    // Get compiled rule
    const compiled = this.compiledRules.get(rule.id);
    if (!compiled) {
      lcardsLog.warn(`[RulesEngine] No compiled rule found for ${rule.id}`);
      return this.createUnmatchedResult(rule);
    }

    // Create evaluation context
    const ctx = {
      // Entity lookup
      getEntity,
      entity: null,  // Will be set by evalEntity if needed

      // HASS access
      hass: this.systemsManager?.getHass?.(),

      // Time/date
      now: Date.now(),

      // Additional context
      sun: this.systemsManager?.getSunInfo?.(),
      getPerf: (key) => this.perfMetrics?.[key],
      flags: this.debugFlags || {},

      // ✨ NEW: Template evaluator for Jinja2/JS
      unifiedTemplateEvaluator: this._templateEvaluator
    };

    // Evaluate compiled tree (async)
    const matched = await evalCompiled(compiled.tree, ctx);

    const evaluationTime = performance.now() - startTime;

    const result = {
      ruleId: rule.id,
      priority: rule.priority || 0,
      matched,
      conditions: { matched },  // Simplified since tree is pre-compiled
      rule,
      evaluationTime
    };

    // Add trace entry
    this.traceBuffer.addTrace(
      rule.id,
      matched,
      { matched },  // Simplified conditions
      evaluationTime,
      {
        priority: rule.priority || 0,
        hasTemplateConditions: !!this._hasTemplateConditions(compiled.tree)
      }
    );

    if (matched && rule.apply) {
      // Resolve overlay selectors to patches (existing logic)
      result.overlayPatches = this._resolveOverlaySelectors(rule.apply);
      result.profilesAdd = rule.apply.profiles_add || [];
      result.profilesRemove = rule.apply.profiles_remove || [];
      result.animations = rule.apply.animations || [];
      result.baseSvgUpdate = rule.apply.base_svg || null;
      result.stopAfter = rule.stop === true;
    }

    return result;

  } catch (error) {
    const evaluationTime = performance.now() - startTime;

    // Trace error
    this.traceBuffer.addTrace(
      rule.id,
      false,
      {},
      evaluationTime,
      { error: error.message }
    );

    lcardsLog.error(`[RulesEngine] Error evaluating rule ${rule.id}:`, error);
    return {
      ruleId: rule.id,
      matched: false,
      error: error.message,
      evaluationTime
    };
  }
}

/**
 * Check if compiled tree has template conditions
 *
 * @private
 * @param {Object} tree - Compiled condition tree
 * @returns {boolean} True if has Jinja2 or JavaScript conditions
 */
_hasTemplateConditions(tree) {
  if (!tree) return false;

  if (tree.type === 'jinja2' || tree.type === 'javascript') {
    return true;
  }

  if (tree.type === 'all' || tree.type === 'any') {
    return tree.nodes.some(n => this._hasTemplateConditions(n));
  }

  if (tree.type === 'not') {
    return this._hasTemplateConditions(tree.node);
  }

  return false;
}

/**
 * Create unmatched result for missing/failed rules
 *
 * @private
 * @param {Object} rule - Rule that failed
 * @returns {Object} Unmatched result
 */
createUnmatchedResult(rule) {
  return {
    ruleId: rule.id,
    priority: rule.priority || 0,
    matched: false,
    conditions: { matched: false },
    rule,
    evaluationTime: 0
  };
}
```

#### Task 2.3: Make evaluateDirty Async

**File:** `src/core/rules/RulesEngine.js` (PATCH - modify existing method)

```javascript
/**
 * Evaluate dirty (changed) rules
 *
 * NOW ASYNC to support Jinja2 template conditions
 *
 * @param {Object} context - Evaluation context
 * @returns {Promise<Object>} Aggregated rule results
 */
async evaluateDirty(context = {}) {
  return perfTime('rules.evaluate', async () => {  // ✨ CHANGED: async
    let { getEntity } = context;

    // ENHANCED: Always prioritize original HASS states for rule evaluation
    if (this.dataSourceManager || this.systemsManager) {
      const originalGetEntity = getEntity;

      getEntity = (entityId) => {
        lcardsLog.trace(`[RulesEngine] getEntity called for: ${entityId}`);

        // PRIORITY 0: Check fresh state cache from events
        if (this._freshStateCache.has(entityId)) {
          const freshState = this._freshStateCache.get(entityId);
          lcardsLog.trace(`[RulesEngine] Using FRESH cached state for ${entityId}: ${freshState.state}`);
          return freshState;
        }

        // PRIORITY 1: Try to get HASS state from SystemsManager
        if (this.systemsManager) {
          const hass = this.systemsManager.getHass();
          if (hass && hass.states && hass.states[entityId]) {
            return {
              entity_id: entityId,
              state: hass.states[entityId].state,
              attributes: hass.states[entityId].attributes || {},
              last_changed: hass.states[entityId].last_changed,
              last_updated: hass.states[entityId].last_updated
            };
          }
        }

        // PRIORITY 2: Check if this is a DataSource reference
        if (entityId.includes('.') && this.dataSourceManager) {
          const value = this.resolveDataSourceValue(entityId);
          if (value !== null) {
            return {
              entity_id: entityId,
              state: String(value),
              attributes: {}
            };
          }
        }

        // PRIORITY 3: Fallback to provided getEntity
        if (originalGetEntity) {
          return originalGetEntity(entityId);
        }

        lcardsLog.warn(`[RulesEngine] No entity data found for ${entityId}`);
        return null;
      };
    }

    if (!getEntity || typeof getEntity !== 'function') {
      lcardsLog.warn('[RulesEngine] evaluateDirty called without getEntity function');
      return this.createEmptyResult();
    }

    const totalDirty = this.dirtyRules.size;
    const results = [];
    const processedRules = new Set();

    // Sort dirty rules by priority (higher first)
    const dirtyRulesArray = Array.from(this.dirtyRules)
      .map(ruleId => this.rulesById.get(ruleId))
      .filter(rule => rule)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // ✨ CHANGED: Sequential async evaluation
    for (const rule of dirtyRulesArray) {
      if (processedRules.has(rule.id)) continue;

      // Await async evaluation (for Jinja2)
      const result = await this.evaluateRule(rule, getEntity);  // ✨ CHANGED: await
      processedRules.add(rule.id);

      // Cache evaluation result
      this.lastEvaluation.set(rule.id, {
        matched: result.matched,
        timestamp: Date.now(),
        conditions: result.conditions
      });

      if (result.matched) {
        results.push(result);
        this.evalCounts.matched++;
      }

      // Remove from dirty set
      this.dirtyRules.delete(rule.id);
    }

    // Performance tracking
    this.evalCounts.total += totalDirty;
    this.evalCounts.dirty += totalDirty;
    this.evalCounts.skipped += (this.rules.length - totalDirty);

    perfCount('rules.eval.total', totalDirty);
    perfCount('rules.eval.matched', results.length);
    perfCount('rules.eval.skipped', this.rules.length - totalDirty);

    return this.aggregateResults(results);
  });
}
```

#### Task 2.4: Update SystemsManager Integration

**File:** `src/msd/pipeline/SystemsManager.js` (PATCH - update callback registration)

```javascript
// ... existing code ...

/**
 * Initialize rules engine
 * @private
 */
_initializeRulesEngine() {
  if (!this.rulesEngine) {
    lcardsLog.warn('[SystemsManager] No rules engine available');
    return;
  }

  // Set references
  this.rulesEngine.systemsManager = this;

  // ✨ NEW: Initialize template evaluator after systemsManager is set
  this.rulesEngine._initializeTemplateEvaluator();

  // Register async callback for rule updates
  this.rulesEngine.setReEvaluationCallback(async () => {  // ✨ CHANGED: async
    await this._handleRuleUpdate();  // ✨ CHANGED: await
  });

  lcardsLog.debug('[SystemsManager] Rules engine initialized');
}

/**
 * Handle rule updates (async)
 * @private
 */
async _handleRuleUpdate() {  // ✨ CHANGED: async
  const results = await this.rulesEngine.evaluateDirty(this._getEvalContext());  // ✨ CHANGED: await
  this.applyRuleResults(results);
  // Rendering will happen on next frame
}

// ... rest of existing code ...
```

---

### Phase 3: Testing & Validation (Days 9-10)

**Goal:** Comprehensive testing of all condition types and integration

#### Task 3.1: Unit Tests

**File:** `test/rules/compile-conditions-templates.test.js` (NEW)

```javascript
import { compileRule, evalCompiled } from '../../src/core/rules/compileConditions.js';
import { UnifiedTemplateEvaluator } from '../../src/core/templates/UnifiedTemplateEvaluator.js';

describe('compileConditions Template Support', () => {
  let mockHass;
  let templateEvaluator;

  beforeEach(() => {
    mockHass = {
      states: {
        'sensor.temperature': {
          state: '23.5',
          attributes: { unit_of_measurement: '°C' }
        },
        'light.desk': {
          state: 'on',
          attributes: { brightness: 150 }
        }
      },
      connection: {
        subscribeMessage: jest.fn((callback, message) => {
          // Mock Jinja2 evaluation
          setTimeout(() => {
            if (message.template.includes('states("sensor.temperature")')) {
              callback({ result: '23.5' });
            } else if (message.template.includes('is_state("light.desk", "on")')) {
              callback({ result: 'True' });
            } else {
              callback({ result: 'False' });
            }
          }, 10);
          return Promise.resolve(() => {});
        })
      }
    };

    templateEvaluator = new UnifiedTemplateEvaluator({
      hass: mockHass,
      context: { hass: mockHass }
    });
  });

  describe('Auto-Detection', () => {
    it('detects Jinja2 conditions', () => {
      const rule = {
        id: 'test',
        when: {
          condition: "{{ states('sensor.temperature') | float > 25 }}"
        }
      };

      const compiled = compileRule(rule, []);
      expect(compiled.tree.type).toBe('jinja2');
      expect(compiled.tree.template).toContain('states(');
    });

    it('detects JavaScript conditions', () => {
      const rule = {
        id: 'test',
        when: {
          condition: "entity.state === 'on'"
        }
      };

      const compiled = compileRule(rule, []);
      expect(compiled.tree.type).toBe('javascript');
      expect(compiled.tree.code).toContain('entity.state');
    });

    it('detects token conditions', () => {
      const rule = {
        id: 'test',
        when: {
          condition: "{entity.state} === 'on'"
        }
      };

      const compiled = compileRule(rule, []);
      expect(compiled.tree.type).toBe('javascript');
      expect(compiled.tree.hasTokens).toBe(true);
    });
  });

  describe('Jinja2 Evaluation', () => {
    it('evaluates simple Jinja2 expression', async () => {
      const rule = {
        id: 'test',
        when: {
          condition: "{{ states('sensor.temperature') | float > 20 }}"
        }
      };

      const compiled = compileRule(rule, []);
      const ctx = {
        hass: mockHass,
        unifiedTemplateEvaluator: templateEvaluator
      };

      const matched = await evalCompiled(compiled.tree, ctx);
      expect(matched).toBe(true);
    });

    it('evaluates Jinja2 with is_state()', async () => {
      const rule = {
        id: 'test',
        when: {
          condition: "{{ is_state('light.desk', 'on') }}"
        }
      };

      const compiled = compileRule(rule, []);
      const ctx = {
        hass: mockHass,
        unifiedTemplateEvaluator: templateEvaluator
      };

      const matched = await evalCompiled(compiled.tree, ctx);
      expect(matched).toBe(true);
    });
  });

  describe('JavaScript Evaluation', () => {
    it('evaluates JavaScript expression', async () => {
      const rule = {
        id: 'test',
        when: {
          condition: "entity.state === 'on' && entity.attributes.brightness > 100"
        }
      };

      const compiled = compileRule(rule, []);
      const ctx = {
        entity: mockHass.states['light.desk'],
        hass: mockHass
      };

      const matched = await evalCompiled(compiled.tree, ctx);
      expect(matched).toBe(true);
    });

    it('resolves tokens in JavaScript', async () => {
      const rule = {
        id: 'test',
        when: {
          condition: "{entity.state} === 'on'"
        }
      };

      const compiled = compileRule(rule, []);
      const ctx = {
        entity: mockHass.states['light.desk'],
        hass: mockHass
      };

      const matched = await evalCompiled(compiled.tree, ctx);
      expect(matched).toBe(true);
    });
  });

  describe('Mixed Conditions', () => {
    it('evaluates all with Jinja2 and entity conditions', async () => {
      const rule = {
        id: 'test',
        when: {
          all: [
            { entity: 'light.desk', state: 'on' },
            { condition: "{{ states('sensor.temperature') | float > 20 }}" }
          ]
        }
      };

      const compiled = compileRule(rule, []);
      const ctx = {
        getEntity: (id) => mockHass.states[id],
        entity: mockHass.states['light.desk'],
        hass: mockHass,
        unifiedTemplateEvaluator: templateEvaluator
      };

      const matched = await evalCompiled(compiled.tree, ctx);
      expect(matched).toBe(true);
    });
  });
});
```

#### Task 3.2: Integration Tests

**File:** `test/integration/rules-jinja2-integration.test.js` (NEW)

```javascript
import { RulesEngine } from '../../src/core/rules/RulesEngine.js';
import { UnifiedTemplateEvaluator } from '../../src/core/templates/UnifiedTemplateEvaluator.js';

describe('RulesEngine Jinja2 Integration', () => {
  let rulesEngine;
  let mockSystemsManager;
  let mockHass;

  beforeEach(() => {
    mockHass = {
      states: {
        'sensor.temperature': { state: '25', attributes: {} },
        'light.desk': { state: 'on', attributes: { brightness: 150 } }
      },
      connection: {
        subscribeMessage: jest.fn((callback, message) => {
          // Mock Jinja2 evaluation based on template
          setTimeout(() => {
            const template = message.template;
            if (template.includes('25')) {
              callback({ result: 'True' });
            } else {
              callback({ result: 'False' });
            }
          }, 10);
          return Promise.resolve(() => {});
        })
      }
    };

    mockSystemsManager = {
      getHass: () => mockHass,
      getSunInfo: () => ({ elevation: 30 })
    };

    const rules = [
      {
        id: 'jinja2_rule',
        priority: 100,
        when: {
          condition: "{{ states('sensor.temperature') | float > 20 }}"
        },
        apply: {
          overlays: {
            warning: {
              style: { visible: true }
            }
          }
        }
      },
      {
        id: 'js_rule',
        priority: 50,
        when: {
          condition: "entity.state === 'on'"
        },
        apply: {
          overlays: {
            status: {
              style: { color: 'green' }
            }
          }
        }
      }
    ];

    rulesEngine = new RulesEngine(rules, null);
    rulesEngine.systemsManager = mockSystemsManager;
    rulesEngine._initializeTemplateEvaluator();
  });

  it('evaluates rules with Jinja2 conditions', async () => {
    rulesEngine.markAllDirty();

    const results = await rulesEngine.evaluateDirty({
      getEntity: (id) => mockHass.states[id]
    });

    expect(results.overlayPatches.length).toBeGreaterThan(0);
  });

  it('evaluates rules with JavaScript conditions', async () => {
    rulesEngine.markAllDirty();

    const results = await rulesEngine.evaluateDirty({
      getEntity: (id) => mockHass.states[id]
    });

    const jsResults = results.overlayPatches.filter(p => 
      p.id === 'status'
    );
    expect(jsResults.length).toBeGreaterThan(0);
  });

  it('handles async callbacks', async () => {
    let callbackCalled = false;
    rulesEngine.setReEvaluationCallback(async () => {
      callbackCalled = true;
    });

    rulesEngine.markEntitiesDirty(['sensor.temperature']);
    rulesEngine._handleEntityUpdate('sensor.temperature', {});

    // Wait for async callbacks
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(callbackCalled).toBe(true);
  });
});
```

#### Task 3.3: Live Test Page

**File:** `test-rules-jinja2.html` (NEW)

```html
<!DOCTYPE html>
<html>
<head>
  <title>RulesEngine Jinja2 Tests</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #0f0; }
    .test { margin: 20px 0; padding: 10px; border: 1px solid #0f0; }
    .pass { color: #0f0; }
    .fail { color: #f00; }
  </style>
</head>
<body>
  <h1>RulesEngine Jinja2 Template Tests</h1>
  <div id="results"></div>

  <script type="module">
    import { RulesEngine } from './src/core/rules/RulesEngine.js';
    import { UnifiedTemplateEvaluator } from './src/core/templates/UnifiedTemplateEvaluator.js';

    const results = document.getElementById('results');

    function addResult(name, passed, details) {
      const div = document.createElement('div');
      div.className = 'test';
      div.innerHTML = `
        <strong class="${passed ? 'pass' : 'fail'}">${passed ? '✓' : '✗'} ${name}</strong>
        <pre>${details}</pre>
      `;
      results.appendChild(div);
    }

    // Mock HASS
    const mockHass = {
      states: {
        'sensor.temperature': { state: '25', attributes: {} },
        'light.desk': { state: 'on', attributes: { brightness: 150 } }
      },
      connection: {
        subscribeMessage: (callback, message) => {
          console.log('WS Call:', message.template);
          
          // Simulate Jinja2 evaluation
          setTimeout(() => {
            const template = message.template;
            let result = 'False';
            
            if (template.includes('states("sensor.temperature")')) {
              result = '25';
            } else if (template.includes('> 20')) {
              result = 'True';
            } else if (template.includes('is_state')) {
              result = 'True';
            }
            
            callback({ result });
          }, 50);
          
          return Promise.resolve(() => {});
        }
      }
    };

    // Mock SystemsManager
    const mockSystemsManager = {
      getHass: () => mockHass
    };

    // Test 1: Jinja2 Condition
    async function testJinja2() {
      const rules = [{
        id: 'jinja2_test',
        when: {
          condition: "{{ states('sensor.temperature') | float > 20 }}"
        },
        apply: {
          overlays: { test: { style: { visible: true } } }
        }
      }];

      const engine = new RulesEngine(rules, null);
      engine.systemsManager = mockSystemsManager;
      engine._initializeTemplateEvaluator();
      engine.markAllDirty();

      const results = await engine.evaluateDirty({
        getEntity: (id) => mockHass.states[id]
      });

      addResult(
        'Jinja2 Condition',
        results.overlayPatches.length > 0,
        `Matched: ${results.overlayPatches.length} rules`
      );
    }

    // Test 2: JavaScript Condition
    async function testJavaScript() {
      const rules = [{
        id: 'js_test',
        when: {
          condition: "entity.state === 'on' && entity.attributes.brightness > 100"
        },
        apply: {
          overlays: { test: { style: { visible: true } } }
        }
      }];

      const engine = new RulesEngine(rules, null);
      engine.systemsManager = mockSystemsManager;
      engine._initializeTemplateEvaluator();
      engine.markAllDirty();

      const results = await engine.evaluateDirty({
        getEntity: (id) => mockHass.states[id]
      });

      addResult(
        'JavaScript Condition',
        results.overlayPatches.length > 0,
        `Matched: ${results.overlayPatches.length} rules`
      );
    }

    // Test 3: Token Condition
    async function testToken() {
      const rules = [{
        id: 'token_test',
        when: {
          condition: "{entity.state} === 'on'"
        },
        apply: {
          overlays: { test: { style: { visible: true } } }
        }
      }];

      const engine = new RulesEngine(rules, null);
      engine.systemsManager = mockSystemsManager;
      engine._initializeTemplateEvaluator();
      engine.markAllDirty();

      const results = await engine.evaluateDirty({
        getEntity: (id) => mockHass.states[id]
      });

      addResult(
        'Token Condition',
        results.overlayPatches.length > 0,
        `Matched: ${results.overlayPatches.length} rules`
      );
    }

    // Run tests
    (async () => {
      await testJinja2();
      await testJavaScript();
      await testToken();
    })();
  </script>
</body>
</html>
```

---

## Syntax Examples

### All Supported Condition Syntaxes

#### 1. Entity Conditions (Existing - Unchanged)

```yaml
rules:
  # Simple state match
  - id: light_on
    when:
      entity: light.living_room
      state: "on"
    apply:
      overlays:
        indicator:
          style:
            color: green

  # Numeric comparison
  - id: temp_high
    when:
      entity: sensor.temperature
      above: 25
      below: 35
    apply:
      overlays:
        warning:
          style:
            visible: true

  # Time conditions
  - id: evening_mode
    when:
      time:
        after: "18:00"
        before: "23:00"
    apply:
      profiles:
        - evening

  # Logical operators
  - id: complex_condition
    when:
      all:
        - entity: light.desk
          state: "on"
        - entity: sensor.temperature
          above: 20
        - any:
            - time:
                after: "08:00"
            - entity: binary_sensor.manual_override
              state: "on"
    apply:
      overlays:
        status:
          style:
            visible: true
```

#### 2. Jinja2 Conditions (NEW)

```yaml
rules:
  # Simple Jinja2
  - id: jinja2_simple
    when:
      condition: "{{ states('sensor.temperature') | float > 25 }}"
    apply:
      overlays:
        warning:
          style:
            color: red

  # Jinja2 with multiple entities
  - id: jinja2_multi
    when:
      condition: "{{ states('sensor.temp') | float > 25 and is_state('light.desk', 'on') }}"
    apply:
      overlays:
        alert:
          style:
            visible: true

  # Jinja2 with time functions
  - id: jinja2_time
    when:
      condition: "{{ now().hour >= 18 and now().hour < 23 }}"
    apply:
      profiles:
        - evening

  # Jinja2 with aggregations
  - id: jinja2_aggregate
    when:
      condition: "{{ states.light | selectattr('state', 'eq', 'on') | list | count > 3 }}"
    apply:
      overlays:
        many_lights_warning:
          style:
            visible: true

  # Explicit Jinja2 (for edge cases)
  - id: explicit_jinja2
    when:
      jinja2: "{{ states('sensor.temp') > 25 }}"
    apply:
      # ...
```

#### 3. JavaScript Conditions (NEW)

```yaml
rules:
  # Simple JavaScript expression
  - id: js_simple
    when:
      condition: "entity.state === 'on'"
    apply:
      overlays:
        indicator:
          style:
            color: green

  # JavaScript with complex logic
  - id: js_complex
    when:
      condition: "entity.state === 'on' && entity.attributes.brightness > 128"
    apply:
      overlays:
        bright_indicator:
          style:
            visible: true

  # JavaScript with Math
  - id: js_math
    when:
      condition: "Math.round(parseFloat(entity.state)) > 25"
    apply:
      overlays:
        warning:
          style:
            color: red

  # JavaScript with multiple conditions
  - id: js_multi
    when:
      condition: |
        entity.state === 'on' && 
        entity.attributes.brightness > 100 &&
        entity.attributes.color_temp < 500
    apply:
      # ...

  # Explicit JavaScript (for edge cases)
  - id: explicit_js
    when:
      javascript: "entity.state === 'on'"
    apply:
      # ...
```

#### 4. Token Conditions (NEW)

```yaml
rules:
  # Token in expression
  - id: token_simple
    when:
      condition: "{entity.state} === 'on'"
    apply:
      overlays:
        indicator:
          style:
            visible: true

  # Multiple tokens
  - id: token_multi
    when:
      condition: "{entity.attributes.brightness} > {variables.threshold}"
    apply:
      # ...

  # Token with JavaScript
  - id: token_js
    when:
      condition: "parseFloat({entity.state}) > 25"
    
