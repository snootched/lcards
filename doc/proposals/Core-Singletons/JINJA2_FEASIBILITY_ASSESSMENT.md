# Jinja2 Template Support - Feasibility Assessment
**LCARdS Template System Enhancement**

Date: 2025-11-12
Status: **APPROVED - Direct Migration Approach**
Assessment for: Core-Template-Refactor-jinja2-support.md

---

## Executive Summary

✅ **APPROVED FOR IMMEDIATE IMPLEMENTATION** - Unified singleton architecture approach.

**Key Findings:**
1. ✅ Template infrastructure (Detector, Parser, Evaluator) **already exists** and matches proposal
2. ✅ SimpleCard already uses `SimpleCardTemplateEvaluator` - ready for enhancement
3. ✅ MSD has `MsdTemplateEngine.js` - **will be replaced** with unified singleton system
4. ✅ Home Assistant WebSocket API access confirmed via `hass.connection.sendMessagePromise()`
5. ✅ Syntax migration plan is sound - changing to `{token}` removes ambiguity
6. ✅ No backward compatibility concerns per user requirements
7. ✅ Direct migration approved - no parallel systems needed

**Implementation Strategy:**
- **Unified System**: Single HATemplateEvaluator for both SimpleCard and MSD
- **Direct Migration**: Replace MsdTemplateEngine completely, fix issues as they arise
- **Start with SimpleCard**: Validate approach, then extend to MSD
- **No Gradual Migration**: Move directly to final state

---

## Architecture Validation

### ✅ Existing Infrastructure Matches Proposal

The proposal's assumed architecture is **accurate**:

```javascript
// ✅ CONFIRMED: Template detection infrastructure exists
src/core/templates/
├── TemplateDetector.js       ✅ Exists - detects MSD, HA, JS, Token syntax
├── TemplateParser.js          ✅ Exists - parses references
├── TemplateEvaluator.js       ✅ Exists - base class
└── SimpleCardTemplateEvaluator.js  ✅ Exists - handles JS/token evaluation
```

**Current TemplateDetector.js markers:**
```javascript
static MARKERS = {
  MSD_START: '{',
  MSD_END: '}',
  HA_START: '{{',      // ✅ Already detects HA templates
  HA_END: '}}',
  JS_START: '[[[',
  JS_END: ']]]'
};
```

**Current SimpleCardTemplateEvaluator.js:**
```javascript
// Currently evaluates:
// - [[[JavaScript]]] templates
// - {{token}} templates (entity.state, variables.color)
```

**Current LCARdSSimpleCard.js:**
```javascript
processTemplate(template) {
  // ✅ Already uses SimpleCardTemplateEvaluator
  const evaluator = new SimpleCardTemplateEvaluator(context);
  return evaluator.evaluate(template);  // Currently SYNC
}
```

### ✅ Home Assistant Integration Confirmed

**WebSocket API Access:**
```javascript
// ✅ CONFIRMED: Used in DataSource.js
this.hass.connection.sendMessagePromise({
  type: 'render_template',  // ✅ This is the correct API
  template: '...',
  // ... other params
});

// ✅ CONFIRMED: Alternative API also available
this.hass.callService('domain', 'service', data);
```

**HASS object structure:**
```javascript
// Available in all cards via LCARdSNativeCard
this.hass = {
  states: {},              // Entity states
  connection: {            // WebSocket connection
    sendMessagePromise(),
    subscribeEvents()
  },
  callService(),           // Service calls
  // ... other properties
};
```

---

## Discovery: Existing MSD Jinja2 Implementation

### ⚠️ Important Finding: MsdTemplateEngine Already Implements Jinja2-Style Templates

**Location:** `src/msd/templates/MsdTemplateEngine.js`

**Current Implementation:**
```javascript
class MsdTemplateEngine {
  // Already processes {{...}} templates!
  compileTemplate(template, templateId) {
    // Parses: "Battery: {{states('sensor.battery')}}%"
    const templateRegex = /\{\{([^}]+)\}\}/g;
    // ...
  }

  parseTemplateExpression(expression) {
    // Supports:
    // - {{states('entity.id')}}
    // - {{states('entity.id') | format}}
    // - {{state_attr('entity.id', 'attribute')}}
    // - {{is_state('entity.id', 'state')}}
    // - {{has_value('entity.id')}}
    // - Mathematical operations
    // - Conditional expressions
  }

  // Evaluates CLIENT-SIDE (not via HA WebSocket)
  evaluateTemplate(compiledTemplate, hass) {
    // Uses hass.states directly
    // No server-side rendering
  }
}
```

**Key Differences from Proposal:**
| Feature | MsdTemplateEngine (Existing) | HATemplateEvaluator (Proposed) |
|---------|------------------------------|--------------------------------|
| **Syntax** | `{{states('entity')}}` | `{{states('entity')}}` ✅ Same |
| **Processing** | Client-side evaluation | Server-side via WebSocket |
| **Capabilities** | Limited HA functions | Full Jinja2 engine |
| **Location** | MSD only | System-wide (SimpleCard + MSD) |
| **Caching** | Template compilation cache | Result cache with invalidation |
| **Dependencies** | Entity extraction | Entity extraction |

### 🔄 Integration Strategy

**Option A: Unify Systems (Recommended)**
- Enhance `MsdTemplateEngine` to optionally use WebSocket API
- Share between MSD and SimpleCard
- Single template evaluation path

**Option B: Parallel Systems (As Proposed)**
- Create new `HATemplateEvaluator` for server-side rendering
- Keep `MsdTemplateEngine` for client-side (existing MSD compatibility)
- Detection layer determines which evaluator to use

**Option C: Gradual Migration**
- Phase 1: Implement `HATemplateEvaluator` for SimpleCard
- Phase 2: Migrate MSD to use `HATemplateEvaluator`
- Phase 3: Deprecate `MsdTemplateEngine`

**Recommendation:** **Option B** initially, transition to **Option A** later
- Maintains MSD backward compatibility
- Allows testing new system in SimpleCard first
- Clear migration path

---

## Syntax Migration Validation

### ✅ Token Syntax Change is Necessary and Safe

**Current Collision:**
```yaml
# OLD SimpleCard tokens (client-side) - DEPRECATED
name: "{{entity.state}}"  # Evaluated by SimpleCardTemplateEvaluator

# MSD HA templates (client-side Jinja2-like)
value: "{{states('sensor.temp')}}"  # Evaluated by MsdTemplateEngine

# Proposed HA templates (server-side Jinja2)
label: "{{states('sensor.temp') | round(1)}}"  # Would use HATemplateEvaluator
```

**After Migration:**
```yaml
# SimpleCard tokens (client-side) - CLEAR SYNTAX
name: "{entity.state}"  # Single braces = simple lookup

# HA templates (server-side) - CLEAR SYNTAX
label: "{{states('sensor.temp') | round(1)}}"  # Double braces = server-side

# MSD datasources (unchanged)
value: "{sensor.temp:.1f}"  # With datasource prefix
```

**Files Requiring Migration:**
```bash
# Search results show these use {{token}} syntax:
src/core/templates/TemplateDetector.js
src/core/templates/TemplateParser.js
src/core/templates/SimpleCardTemplateEvaluator.js
test/*.html files
test/*.yaml files
Documentation files
```

**Migration Complexity:** **LOW**
- Simple find/replace operation
- No external users (internal only)
- Clear visual distinction after migration
- Can be done in single commit

---

## Implementation Adjustments

### 1. Detection Logic Enhancement

**Current TemplateDetector needs enhancement:**

```javascript
// CURRENT: Cannot distinguish {{token}} from {{states()}}
static hasHATemplates(content) {
  return content.includes('{{') && content.includes('}}');
}

static hasTokens(content) {
  return content.includes('{{') && content.includes('}}');
  // ⚠️ Identical to hasHATemplates!
}
```

**AFTER Token Migration:**
```javascript
// ✅ Clear distinction after migration
static hasTokens(content) {
  // Match {token} but NOT {{jinja2}} or {msd.datasource}
  return /\{(?!sensor\.|light\.|switch\.|climate\.)(?!\{)([^{}]+)\}/.test(content);
}

static hasJinja2Templates(content) {
  // Match {{...}} with Jinja2 indicators
  return /\{\{.*?(states|state_attr|now|\|).*?\}\}/.test(content);
}
```

### 2. SimpleCard Integration - Async Migration

**Current (Sync):**
```javascript
processTemplate(template) {
  const evaluator = new SimpleCardTemplateEvaluator(context);
  return evaluator.evaluate(template);  // ✅ Returns immediately
}

_processTemplatesSync() {
  this._processedTexts.label = this.processTemplate(this.config.label);
  // ✅ Works because processTemplate is sync
}
```

**After Migration (Async):**
```javascript
async processTemplate(template) {  // ⚠️ Now async
  const types = TemplateDetector.detectTemplateTypes(template);

  let result = template;

  // Sync processing first
  if (types.hasJavaScript || types.hasTokens) {
    const syncEval = new SimpleCardTemplateEvaluator(context);
    result = syncEval.evaluate(result);
  }

  // Async processing second
  if (types.hasJinja2) {
    const asyncEval = new HATemplateEvaluator(context);
    result = await asyncEval.evaluate(result);  // ⚠️ Await
  }

  return result;
}

async _processTemplatesAsync() {  // ⚠️ Renamed
  this._processedTexts.label = await this.processTemplate(this.config.label);
  this.requestUpdate();  // ✅ Trigger re-render
}
```

**Impact:** All callers of `processTemplate()` must handle async.

### 3. HATemplateEvaluator Implementation

**Core Requirements:**

```javascript
export class HATemplateEvaluator extends TemplateEvaluator {
  constructor(context) {
    super(context);

    // ✅ Validate hass available
    if (!context.hass?.connection?.sendMessagePromise) {
      throw new Error('HATemplateEvaluator requires hass.connection');
    }

    this._cache = new TemplateCache({
      maxAge: 1000,      // 1 second TTL
      maxSize: 1000      // 1000 entries
    });
  }

  async evaluate(content) {
    const templates = TemplateParser.extractJinja2(content);

    let result = content;
    for (const template of templates) {
      // Check cache first
      const cacheKey = this._getCacheKey(template.expression);
      let value = this._cache.get(cacheKey);

      if (!value) {
        // Render via WebSocket
        value = await this._renderTemplate(template.expression);
        this._cache.set(cacheKey, value);
      }

      result = result.replace(template.match, value);
    }

    return result;
  }

  async _renderTemplate(template) {
    try {
      // ✅ Use confirmed API
      const result = await this.context.hass.connection.sendMessagePromise({
        type: 'render_template',
        template: template,
        variables: this.context.variables || {},
        timeout: 5
      });

      return result !== null ? String(result) : '';

    } catch (error) {
      lcardsLog.error('[HATemplateEvaluator] Render failed:', error);
      return `[Template Error: ${error.message}]`;
    }
  }
}
```

### 4. Cache Integration with HASS Updates

**Challenge:** Invalidate cache when entities change.

**Solution:**
```javascript
// In LCARdSSimpleCard
set hass(newHass) {
  const oldHass = this._hass;
  this._hass = newHass;

  // Check if entity changed
  if (this._config?.entity) {
    const oldState = oldHass?.states?.[this._config.entity];
    const newState = newHass?.states?.[this._config.entity];

    if (oldState?.state !== newState?.state) {
      // Clear Jinja2 cache
      if (this._haTemplateEvaluator) {
        this._haTemplateEvaluator.invalidateEntity(this._config.entity);
      }

      // Re-process templates
      this._processTemplatesAsync();
    }
  }
}
```

---

## MSD Integration Strategy

### ✅ Unified Singleton Architecture (Approved Approach)

**Decision:** Replace `MsdTemplateEngine` with unified `HATemplateEvaluator` singleton.

**Rationale:**
- Single source of truth for template processing
- Consistent behavior across SimpleCard and MSD
- Leverages Home Assistant's full Jinja2 engine (more powerful than client-side)
- Reduces code duplication and maintenance burden
- Better caching at system level

**Migration Path:**
1. **Phase 1:** Implement `HATemplateEvaluator` for SimpleCard
2. **Phase 2:** Create `CoreTemplateService` singleton (optional wrapper)
3. **Phase 3:** Replace MSD's `MsdTemplateEngine` with `HATemplateEvaluator`
4. **Phase 4:** Remove deprecated `MsdTemplateEngine.js`

**Key Changes for MSD:**
```javascript
// BEFORE (MsdTemplateEngine - client-side)
const compiled = msdTemplateEngine.compileTemplate(template, templateId);
const result = msdTemplateEngine.evaluateTemplate(compiled, hass);

// AFTER (HATemplateEvaluator - server-side)
const evaluator = new HATemplateEvaluator({ hass, variables });
const result = await evaluator.evaluate(template);  // Now async
```

**MSD-Specific Considerations:**
- MSD overlays already handle async operations (they're chart/data driven)
- Real-time updates benefit from server-side caching (reduce client CPU)
- Home Assistant's Jinja2 has all the functions MSD needs (states, state_attr, filters, etc.)
- Mathematical operations can use Jinja2 filters instead of client-side JS

**Benefits Over Client-Side:**
- ✅ Full Jinja2 feature set (not limited subset)
- ✅ Server-side computation (offload from client)
- ✅ Consistent with HA ecosystem
- ✅ Better error messages from HA engine
- ✅ Automatic entity tracking via HA's dependency system

---

## Performance Considerations

### Caching Strategy Validation

**Proposal's cache design is sound:**
```javascript
class TemplateCache {
  getCacheKey(template, entityIds, hass) {
    // ✅ Good: Hash based on template + entity states
    const stateHash = this._hashEntityStates(entityIds, hass);
    return `${this._hashString(template)}::${stateHash}`;
  }
}
```

**Expected Performance:**
```
First render:  ~50-150ms (WebSocket round-trip)
Cached render: ~0.2ms (Map lookup)
Cache hit rate target: >80%
```

**Optimization Opportunities:**
1. **Batch multiple templates** in single WebSocket call
2. **Pre-compile templates** on config load
3. **Shared cache** across all cards (singleton)
4. **Predictive invalidation** based on entity update frequency

### Async Rendering Concerns

**Challenge:** User sees old value during template evaluation.

**Solutions:**
1. **Show loading state** during first render
2. **Use previous value** while re-evaluating
3. **Debounce rapid updates** to reduce API calls
4. **Pre-fetch on card load** before first render

**Implementation:**
```javascript
async _processTemplatesAsync() {
  // Use stale data while fetching
  const staleLabel = this._processedTexts.label;

  // Fetch new data
  const newLabel = await this.processTemplate(this.config.label);

  // Only update if changed
  if (staleLabel !== newLabel) {
    this._processedTexts.label = newLabel;
    this.requestUpdate();
  }
}
```

---

## Testing Requirements

### Unit Tests

**Required Coverage:**
```javascript
// TemplateDetector
✅ Detect {token} vs {{jinja2}} after migration
✅ Detect {{jinja2}} with function calls
✅ Detect {{jinja2}} with filters
✅ Distinguish from {msd.datasource}

// HATemplateEvaluator
✅ Evaluate simple expression
✅ Evaluate with filters
✅ Cache behavior (hit/miss)
✅ Cache invalidation on entity change
✅ Error handling (timeout, syntax error)
✅ Multiple templates in single string

// SimpleCard Integration
✅ Async processTemplate()
✅ Mixed template types (JS + token + Jinja2)
✅ Entity update triggers re-render
✅ No render loops
```

### Integration Tests

**Test Scenarios:**
```javascript
1. Simple button with Jinja2 label
2. Mixed templates (JS + token + Jinja2)
3. Rapid entity updates (cache performance)
4. Invalid template syntax (error handling)
5. Entity doesn't exist (error handling)
6. Long-running template (timeout)
7. Template with dependencies (multi-entity)
```

### Performance Tests

**Benchmarks:**
```javascript
✅ Cache hit rate >80% after warmup
✅ Cached render <1ms
✅ Uncached render <150ms
✅ No memory leaks (cache eviction working)
✅ No render loops (update only on change)
```

---

## Migration Checklist with Adjustments

## Migration Checklist - Direct Approach

### Phase 1: Token Syntax Migration (Day 1)

**Goal:** Change `{{token}}` → `{token}` throughout codebase

- [ ] Create feature branch: `feature/jinja2-templates`
- [ ] Update `TemplateDetector.js`:
  - [ ] Change token detection regex to match `{token}` not `{{token}}`
  - [ ] Enhance `hasJinja2Templates()` to detect Jinja2 indicators (functions, filters)
  - [ ] Update `detectTemplateTypes()` logic
- [ ] Update `TemplateParser.js`:
  - [ ] Update `extractTokens()` regex to match `{token}`
  - [ ] Add `extractJinja2()` method for `{{...}}`
  - [ ] Add `extractJinja2Entities()` for dependency tracking
- [ ] Update `SimpleCardTemplateEvaluator.js`:
  - [ ] Change `_evaluateTokens()` regex from `{{...}}` to `{...}`
- [ ] Run automated find/replace across codebase:
  - [ ] Test files: `test/*.html`, `test/*.yaml`
  - [ ] Documentation examples
  - [ ] Any config examples
- [ ] Test existing SimpleCard functionality works
- [ ] Commit: "refactor: migrate token syntax from {{}} to {}"

### Phase 2: HATemplateEvaluator Implementation (Days 2-3)

**Goal:** Create server-side Jinja2 evaluator with caching

- [ ] Create `src/core/templates/TemplateCache.js`:
  - [ ] Implement LRU cache with TTL
  - [ ] Add entity-based invalidation
  - [ ] Add cache statistics
- [ ] Create `src/core/templates/HATemplateEvaluator.js`:
  - [ ] Extend `TemplateEvaluator` base class
  - [ ] Implement `async evaluate()` method
  - [ ] Add WebSocket `render_template` API call
  - [ ] Integrate caching
  - [ ] Add error handling (timeout, syntax, network)
  - [ ] Add entity dependency extraction
- [ ] Update `src/core/templates/index.js`:
  - [ ] Export `HATemplateEvaluator`
  - [ ] Export `TemplateCache`
- [ ] Write unit tests:
  - [ ] Test simple Jinja2 evaluation
  - [ ] Test with filters
  - [ ] Test cache hit/miss behavior
  - [ ] Test cache invalidation
  - [ ] Test error scenarios
- [ ] Commit: "feat: add HATemplateEvaluator with WebSocket integration"

### Phase 3: SimpleCard Async Integration (Days 3-4)

**Goal:** Make SimpleCard use HATemplateEvaluator for Jinja2 templates

- [ ] Update `src/base/LCARdSSimpleCard.js`:
  - [ ] Change `processTemplate()` to `async processTemplate()`
  - [ ] Add template type detection
  - [ ] Add sync evaluation (JS/tokens) first
  - [ ] Add async evaluation (Jinja2) second
  - [ ] Create `_haTemplateEvaluator` instance (lazy init)
  - [ ] Rename `_processTemplatesSync()` → `_processTemplatesAsync()`
  - [ ] Make method async and await template processing
  - [ ] Update `set hass()` to invalidate cache and re-process
- [ ] Find and update all `processTemplate()` callers:
  - [ ] Make callers `async` where needed
  - [ ] Add `await` for calls
- [ ] Test SimpleCard with:
  - [ ] Simple tokens: `{entity.state}`
  - [ ] JavaScript: `[[[return entity.state]]]`
  - [ ] Jinja2: `{{states('sensor.temp')}}`
  - [ ] Mixed templates
- [ ] Performance testing:
  - [ ] Measure render times
  - [ ] Check cache hit rates
  - [ ] Verify no render loops
- [ ] Commit: "feat: integrate HATemplateEvaluator into SimpleCard"

### Phase 4: MSD Migration (Days 4-5)

**Goal:** Replace MsdTemplateEngine with HATemplateEvaluator

- [ ] Audit MSD template usage:
  - [ ] Find all MsdTemplateEngine usages
  - [ ] Identify template patterns used
  - [ ] Document any MSD-specific features
- [ ] Update MSD to use HATemplateEvaluator:
  - [ ] Replace `msdTemplateEngine.compileTemplate()` calls
  - [ ] Replace `msdTemplateEngine.evaluateTemplate()` calls
  - [ ] Make MSD overlay rendering async where needed
  - [ ] Update entity subscription logic
- [ ] Remove deprecated code:
  - [ ] Delete `src/msd/templates/MsdTemplateEngine.js`
  - [ ] Remove any MsdTemplateEngine imports
  - [ ] Clean up unused template compilation code
- [ ] Test MSD overlays:
  - [ ] Text overlays with templates
  - [ ] Chart data with template expressions
  - [ ] Status grid with dynamic templates
- [ ] Commit: "refactor: migrate MSD to unified HATemplateEvaluator"

### Phase 5: Testing & Documentation (Day 5-6)

**Goal:** Comprehensive validation and documentation

- [ ] Integration testing:
  - [ ] Create test page: `test-jinja2-templates.html`
  - [ ] Test all template syntax combinations
  - [ ] Test SimpleCard + MSD simultaneously
  - [ ] Test entity state changes
  - [ ] Test error scenarios
- [ ] Performance validation:
  - [ ] Measure cache statistics
  - [ ] Verify >80% cache hit rate
  - [ ] Check render times acceptable
  - [ ] Monitor for memory leaks
- [ ] Documentation:
  - [ ] Create `SYNTAX_MIGRATION.md`
  - [ ] Update user guide with new syntax
  - [ ] Add Jinja2 examples
  - [ ] Document caching behavior
  - [ ] Add troubleshooting guide
- [ ] Final commit: "docs: complete Jinja2 template integration"

---

## Risk Assessment

### Low Risk ✅

1. **Syntax migration** - Simple find/replace, no external users
2. **Template infrastructure** - Already exists, just enhancing
3. **WebSocket API** - Already used elsewhere in codebase (DataSource.js)
4. **Unified architecture** - Simpler than maintaining parallel systems

### Medium Risk ⚠️

1. **Async migration** - Must update all template callers (manageable scope)
2. **MSD template replacement** - Need to verify all MSD features work with HA Jinja2
3. **Performance** - Network latency, but aggressive caching mitigates
4. **Error handling** - Multiple failure modes (timeout, syntax, network down)

### Mitigation Strategies

1. **Async Migration:** Start with SimpleCard (smaller scope), then extend to MSD
2. **MSD Validation:** Test all MSD template patterns work with HA Jinja2 engine
3. **Performance:** Aggressive caching (>80% hit rate target), pre-fetch on load
4. **Error Handling:** Graceful degradation, clear error messages, fallback to previous value

---

## Implementation Timeline

### Direct Migration Approach (5-6 Days)

**Day 1: Token Syntax Migration**
- Change `{{token}}` → `{token}` throughout codebase
- Update detection logic
- Test existing functionality

**Days 2-3: HATemplateEvaluator**
- Implement TemplateCache
- Implement HATemplateEvaluator with WebSocket integration
- Unit testing

**Days 3-4: SimpleCard Integration**
- Async processTemplate()
- Template processing pipeline
- Entity update handling
- Integration testing

**Days 4-5: MSD Migration**
- Replace MsdTemplateEngine
- Update MSD overlay rendering
- Remove deprecated code
- MSD testing

**Day 5-6: Final Validation**
- Integration testing (SimpleCard + MSD)
- Performance validation
- Documentation
- Production readiness

**Total: 5-6 days for complete unified system**

---

## Conclusion

### ✅ APPROVED - Direct Migration to Unified System

**Decision:**
- **Unified Architecture:** Single HATemplateEvaluator for SimpleCard + MSD
- **No Parallel Systems:** Replace MsdTemplateEngine completely
- **Direct Migration:** Fix issues as they arise, no gradual rollout
- **Timeline:** 5-6 days for complete implementation

**Strengths:**
1. ✅ Solid architectural foundation already in place
2. ✅ Clear migration path with manageable risks
3. ✅ Existing WebSocket infrastructure (DataSource.js)
4. ✅ Well-designed caching strategy from proposal
5. ✅ No backward compatibility constraints
6. ✅ Simpler to maintain single unified system

**Implementation Strategy:**
1. Start with SimpleCard (validate approach)
2. Extend to MSD (unified system)
3. Remove deprecated MsdTemplateEngine
4. Single template evaluation path for entire system

**Next Steps:**
1. ✅ Feasibility assessment approved
2. ✅ Direct migration approach confirmed
3. ➡️ Create feature branch: `feature/jinja2-templates`
4. ➡️ Begin Phase 1: Token syntax migration
5. ➡️ Proceed through phases systematically

---

*Assessment Version: 2.0*
*Date: 2025-11-12*
*Status: **APPROVED - Ready to Implement***
*Approach: Direct Migration to Unified System*
