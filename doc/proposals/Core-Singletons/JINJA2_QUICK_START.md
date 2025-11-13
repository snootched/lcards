# Jinja2 Template Support - Quick Start

## Status: Ready to Implement ✅

**Approach:** Direct migration to unified HATemplateEvaluator singleton
**Branch:** `feature/jinja2-templates`
**Timeline:** 5-6 days

---

## Key Documents

1. **Original Proposal:** `Core-Template-Refactor-jinja2-support.md`
   - Complete technical design
   - Architecture diagrams
   - API specifications

2. **Feasibility Assessment:** `JINJA2_FEASIBILITY_ASSESSMENT.md`
   - ✅ Approved for direct migration
   - Confirms existing infrastructure
   - Documents MSD unification strategy

3. **Implementation Plan:** `JINJA2_IMPLEMENTATION_PLAN.md`
   - Phase 1 ready to start
   - Detailed task breakdown
   - Testing requirements

---

## Quick Summary

### What We're Building

**Unified template system** supporting 4 syntax types:

| Syntax | Example | Purpose | Processing |
|--------|---------|---------|------------|
| `{token}` | `{entity.state}` | Simple lookup | Client, sync |
| `{{jinja2}}` | `{{states('sensor.temp') \| round}}` | HA templates | Server, async |
| `[[[js]]]` | `[[[return entity.state]]]` | JavaScript | Client, sync |
| `{datasource}` | `{sensor.temp:.1f}` | MSD data | Client, sync |

### Key Changes

1. **Token Syntax Migration:** `{{token}}` → `{token}` (removes ambiguity)
2. **New HATemplateEvaluator:** Server-side Jinja2 via WebSocket
3. **Async processTemplate():** SimpleCard template processing now async
4. **MSD Unification:** Replace MsdTemplateEngine with HATemplateEvaluator
5. **System-wide:** Single template evaluation path

### Architecture

```
User Config
    ↓
TemplateDetector.detectTemplateTypes()
    ↓
    ├─ {token} → SimpleCardTemplateEvaluator (sync)
    ├─ [[[js]]] → SimpleCardTemplateEvaluator (sync)
    ├─ {{jinja2}} → HATemplateEvaluator (async) → hass.connection.sendMessagePromise()
    └─ {datasource} → MSD system
```

---

## Implementation Phases

### Phase 1: Token Syntax Migration (Day 1) ⏳
- Change `{{token}}` → `{token}` in code
- Update detection/parsing logic
- Update test files
- **Status:** Ready to start

### Phase 2: HATemplateEvaluator (Days 2-3)
- Create TemplateCache
- Create HATemplateEvaluator
- Unit testing
- **Status:** Waiting for Phase 1

### Phase 3: SimpleCard Integration (Days 3-4)
- Async processTemplate()
- Template processing pipeline
- Integration testing
- **Status:** Waiting for Phase 2

### Phase 4: MSD Migration (Days 4-5)
- Replace MsdTemplateEngine
- Update MSD overlays
- Remove deprecated code
- **Status:** Waiting for Phase 3

### Phase 5: Final Validation (Days 5-6)
- Integration testing
- Performance validation
- Documentation
- **Status:** Waiting for Phase 4

---

## Next Steps

1. **Create feature branch:**
   ```bash
   git checkout -b feature/jinja2-templates
   ```

2. **Start Phase 1:**
   - Open `JINJA2_IMPLEMENTATION_PLAN.md`
   - Follow Task 1.1 (Update TemplateDetector.js)
   - Work through tasks systematically

3. **Testing strategy:**
   - Test after each task
   - Build frequently: `npm run build`
   - Verify no regressions

4. **Commit strategy:**
   - Commit after each completed task
   - Final Phase 1 commit: `refactor: migrate token syntax from {{}} to {}`

---

## Key Files to Modify

**Phase 1 (Token Migration):**
- `src/core/templates/TemplateDetector.js`
- `src/core/templates/TemplateParser.js`
- `src/core/templates/SimpleCardTemplateEvaluator.js`
- `test/*.html`, `test/*.yaml`

**Phase 2 (HATemplateEvaluator):**
- `src/core/templates/TemplateCache.js` (new)
- `src/core/templates/HATemplateEvaluator.js` (new)
- `src/core/templates/index.js`

**Phase 3 (SimpleCard):**
- `src/base/LCARdSSimpleCard.js`

**Phase 4 (MSD):**
- `src/msd/templates/MsdTemplateEngine.js` (delete)
- MSD overlay files (various)

---

## Resources

**WebSocket API Example:**
```javascript
const result = await this.hass.connection.sendMessagePromise({
  type: 'render_template',
  template: '{{states("sensor.temperature") | round(1)}}',
  variables: {},
  timeout: 5
});
```

**Detection Example:**
```javascript
const types = TemplateDetector.detectTemplateTypes(template);
// => { hasTokens: true, hasJinja2: true, hasJavaScript: false, hasMSD: false }
```

**Evaluation Example:**
```javascript
// Sync (tokens, JS)
const syncEval = new SimpleCardTemplateEvaluator(context);
let result = syncEval.evaluate(template);

// Async (Jinja2)
const asyncEval = new HATemplateEvaluator(context);
result = await asyncEval.evaluate(result);
```

---

## Questions?

Refer to:
- **Technical details:** `Core-Template-Refactor-jinja2-support.md`
- **Feasibility concerns:** `JINJA2_FEASIBILITY_ASSESSMENT.md`
- **Implementation tasks:** `JINJA2_IMPLEMENTATION_PLAN.md`

---

*Ready to implement! Start with Phase 1.*
