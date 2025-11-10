# MSD to Core Singleton Migration Plan

**Date:** 2025-11-10
**Branch:** msd-globalisation
**Goal:** Move singleton systems from `src/msd/` to `src/core/` to clarify architecture

## Overview

This migration moves **complete systems** (not just individual files) from MSD to Core when they've been promoted to global singletons. Each system includes its manager plus all supporting files.

---

## Systems to Move

### ✅ 1. Data Sources System
**Current:** `src/msd/data/` → **Target:** `src/core/data-sources/`

**Files to move:**
```
src/msd/data/
├── DataSourceManager.js          ← Main singleton
├── MsdDataSource.js              ← Data source implementation
├── RollingBuffer.js              ← Support class
├── aggregations/
│   ├── AggregationProcessor.js
│   ├── RollingStatisticsAggregation.js
│   ├── RollingStatisticsSeriesAggregation.js
│   └── index.js
└── transformations/
    └── TransformationProcessor.js
```

**Action:**
- Move entire `data/` directory
- Replace stub `src/core/data-sources/index.js` (201 lines)
- Rename `MsdDataSource.js` → `DataSource.js` (remove "Msd" prefix since it's now core)

**Dependencies:**
- ✅ Clean - only imports from `../../utils/` and `../../core/`

---

### ✅ 2. Animation System
**Current:** `src/msd/animation/` → **Target:** `src/core/animation/`

**Files to move:**
```
src/msd/animation/
├── AnimationManager.js           ← Main singleton
├── AnimationRegistry.js          ← Performance caching
├── TriggerManager.js             ← Trigger coordination
├── AnimationConfigProcessor.js   ← Config processing
├── TimelineDiffer.js             ← Diffing engine
├── presets.js                    ← Animation presets
├── resolveAnimations.js          ← Animation resolution
└── resolveTimelines.js           ← Timeline resolution
```

**Action:**
- Move entire `animation/` directory
- Replace stub `src/core/animation-manager/index.js` (421 lines)

**Dependencies:**
- ⚠️ `AnimationManager.js` imports `ActionHelpers` from `../renderer/ActionHelpers.js`
- ⚠️ Multiple files import from `../util/` (deepMerge, performance, hashing)

**Decision needed:**
1. Should `ActionHelpers` be extracted to core? (Check if it's MSD-specific or general utility)
2. Util files will be handled separately (see Util Files section)

---

### ✅ 3. Rules System
**Current:** `src/msd/rules/` → **Target:** `src/core/rules/`

**Files to move:**
```
src/msd/rules/
├── RulesEngine.js                ← Main singleton
├── RuleTraceBuffer.js            ← Debugging/tracing
└── compileConditions.js          ← Condition compiler
```

**Action:**
- Move entire `rules/` directory
- Replace stub `src/core/rules-engine/index.js`

**Dependencies:**
- ⚠️ `RulesEngine.js` imports `ApexChartsOverlayRenderer` from `../renderer/`
- ⚠️ Imports from `../util/` (linearMap, performance)

**Decision needed:**
1. Is the ApexChartsOverlayRenderer dependency necessary in core RulesEngine?
2. Can this be injected/passed rather than imported directly?

---

### ✅ 4. Themes System
**Current:** `src/msd/themes/` → **Target:** `src/core/themes/`

**Files to move:**
```
src/msd/themes/
├── ThemeManager.js               ← Main singleton
├── ThemeTokenResolver.js         ← Token resolution
├── ColorUtils.js                 ← Color utilities
├── initializeThemeSystem.js      ← Initialization
└── tokens/
    ├── lcarsClassicTokens.js
    ├── lcarsDs9Tokens.js
    ├── lcarsHighContrastTokens.js
    └── lcarsVoyagerTokens.js
```

**Action:**
- Move entire `themes/` directory
- Replace stub `src/core/theme-manager/index.js` (456 lines)

**Dependencies:**
- ✅ Clean - only imports from `../../utils/`

---

### ✅ 5. Presets System
**Current:** `src/msd/presets/` → **Target:** `src/core/presets/`

**Files to move:**
```
src/msd/presets/
└── StylePresetManager.js         ← Main singleton (single file)
```

**Action:**
- Move `StylePresetManager.js` to `src/core/presets/`
- Create `index.js` for consistency

**Dependencies:**
- ✅ Clean

---

### ✅ 6. Packs System
**Current:** `src/msd/packs/` → **Target:** `src/core/packs/`

**Files to move:**
```
src/msd/packs/
├── loadBuiltinPacks.js           ← Builtin pack loading
├── externalPackLoader.js         ← External pack loading
└── mergePacks.js                 ← Pack merging
```

**Action:**
- Move entire `packs/` directory
- No JSON files found (they may be elsewhere or loaded dynamically)

**Dependencies:**
- ✅ Clean

---

## Util Files Analysis

### Files Used by Singletons (Should Move to Core)

These util files are imported by the singleton systems and should move to `src/core/utils/`:

```
src/msd/util/ → src/core/utils/
├── deepMerge.js          ← Used by: animation (presets, resolveAnimations, resolveTimelines)
├── hashing.js            ← Used by: animation (AnimationRegistry, TimelineDiffer)
├── performance.js        ← Used by: animation (AnimationRegistry), rules (RulesEngine)
├── linearMap.js          ← Used by: rules (compileConditions)
└── stableStringify.js    ← May be used by hashing
```

### Files That May Stay in MSD (Need to Check Usage)

```
src/msd/util/
├── checksum.js           ← Check if used by singletons or MSD-only
└── issues.js             ← Check if used by singletons or MSD-only
```

**Action needed:**
1. Search codebase for usage of `checksum.js` and `issues.js`
2. If used by singletons → move to `src/core/utils/`
3. If MSD-only → leave in `src/msd/util/`

---

## Critical Dependencies to Resolve

### 1. ActionHelpers (used by AnimationManager)

**Current import in `AnimationManager.js`:**
```javascript
import { ActionHelpers } from '../renderer/ActionHelpers.js';
```

**Options:**
- A) Extract `ActionHelpers` to `src/core/actions/` if it's general-purpose
- B) Pass ActionHelpers as a dependency during initialization
- C) Keep in MSD but export for singleton use

**Need to check:** Is ActionHelpers MSD-specific or general action handling?

---

### 2. ApexChartsOverlayRenderer (used by RulesEngine)

**Current import in `RulesEngine.js`:**
```javascript
import { ApexChartsOverlayRenderer } from '../renderer/ApexChartsOverlayRenderer.js';
```

**Options:**
- A) Remove direct import, pass as dependency
- B) Use registry pattern to register overlay renderers
- C) Extract to core if it's general-purpose

**Need to check:** Why does RulesEngine directly import a renderer?

---

## Import Updates Required

### Files Importing Singletons from MSD

**Primary files to update:**
```
src/core/lcards-core.js
  - Change: ../msd/data/DataSourceManager → ./data-sources/DataSourceManager
  - Change: ../msd/rules/RulesEngine → ./rules/RulesEngine
  - Change: ../msd/themes/ThemeManager → ./themes/ThemeManager
  - Change: ../msd/animation/AnimationManager → ./animation/AnimationManager
  - Change: ../msd/animation/AnimationRegistry → ./animation/AnimationRegistry
  - Change: ../msd/presets/StylePresetManager → ./presets/StylePresetManager
  - Change: ../msd/packs/loadBuiltinPacks → ./packs/loadBuiltinPacks

src/msd/pipeline/SystemsManager.js
  - Change: ../data/DataSourceManager → ../../core/data-sources/DataSourceManager
  - Change: ../themes/ThemeManager → ../../core/themes/ThemeManager
  - Change: ../rules/RulesEngine → ../../core/rules/RulesEngine
  - Change: ../presets/StylePresetManager → ../../core/presets/StylePresetManager

src/msd/pipeline/ModelBuilder.js
  - Change: ../rules/RulesEngine → ../../core/rules/RulesEngine

src/msd/perf/benchHarness.js
  - Change: ../rules/RulesEngine → ../../core/rules/RulesEngine

src/utils/lcards-anim-helpers.js
  - Change: ../msd/animation/presets → ../core/animation/presets
```

### Files Within Moved Systems (Internal References)

After moving, files within each system that reference `../util/` need updating:
```
animation/* files:
  - Change: ../util/deepMerge → ../../core/utils/deepMerge (or ../utils/deepMerge)
  - Change: ../util/hashing → ../../core/utils/hashing
  - Change: ../util/performance → ../../core/utils/performance

rules/* files:
  - Change: ../util/linearMap → ../../core/utils/linearMap
  - Change: ../util/performance → ../../core/utils/performance
```

---

## Migration Execution Plan

### Phase 1: Pre-Flight Checks
1. ✅ Run `npm run build` to ensure clean starting state
2. ✅ Commit any outstanding changes
3. ✅ Create this migration plan document

### Phase 2: Resolve Critical Dependencies (DO FIRST)
1. **Investigate ActionHelpers usage** - Is it MSD-specific?
2. **Investigate ApexChartsOverlayRenderer usage in RulesEngine** - Why the direct dependency?
3. **Check checksum.js and issues.js usage** - Singleton or MSD-only?
4. **Decision:** How to handle these dependencies

### Phase 3: Move Util Files (Foundation)
1. Move util files to `src/core/utils/`:
   - `deepMerge.js`
   - `hashing.js`
   - `performance.js`
   - `linearMap.js`
   - `stableStringify.js` (if needed)
2. Update imports in files that use these utils (both MSD and soon-to-be-moved files)
3. Test build

### Phase 4: Move Singleton Systems (One at a Time)
For each system (data, themes, presets, packs, animation, rules):
1. Use `git mv` to move directory preserving history
2. Remove stub implementation in core if exists
3. Update imports in the moved files
4. Update imports in files that reference the system
5. Test build after each system
6. Commit with descriptive message

### Phase 5: Clean Up
1. Remove empty directories in `src/msd/`
2. Update documentation
3. Final build test
4. Commit cleanup

---

## Recommended Order

Based on dependencies:

1. **Util files** (foundation for everything else)
2. **Resolve ActionHelpers/ApexCharts dependencies**
3. **Themes** (clean, no complex dependencies)
4. **Presets** (clean, no complex dependencies)
5. **Packs** (clean, no complex dependencies)
6. **Data Sources** (clean once utils are moved)
7. **Rules** (after resolving ApexCharts dependency)
8. **Animation** (after resolving ActionHelpers dependency)

---

## Risk Assessment

### Low Risk ✅
- Themes, Presets, Packs - clean dependencies
- Util file moves - pure utilities

### Medium Risk ⚠️
- Data Sources - need to ensure aggregations/transformations work
- Renaming MsdDataSource → DataSource

### Higher Risk ⚠️⚠️
- Animation system - ActionHelpers dependency
- Rules system - ApexChartsOverlayRenderer dependency
- Large number of files importing these systems

---

## Rollback Plan

If issues arise:
1. All moves use `git mv` - history is preserved
2. Can revert individual commits
3. Each system moved independently - can rollback specific systems

---

## Questions for Review

1. **ActionHelpers**: Should this be extracted to core, or is it MSD-specific?
2. **ApexChartsOverlayRenderer in RulesEngine**: Can we inject this dependency instead of importing directly?
3. **checksum.js / issues.js**: Are these used by singletons or MSD-only?
4. **MsdDataSource rename**: Should we rename to just `DataSource` in core, or keep the Msd prefix?
5. **Order of execution**: Does the recommended order make sense?

---

## Success Criteria

- [ ] All singleton systems moved to `src/core/`
- [ ] All imports updated correctly
- [ ] `npm run build` succeeds
- [ ] No empty directories left in `src/msd/`
- [ ] Documentation updated
- [ ] Git history preserved for all moved files
- [ ] Clear separation: `src/core/` = singletons, `src/msd/` = MSD-specific

---

## Next Steps

**Awaiting review and approval on:**
1. Critical dependency resolution strategy (ActionHelpers, ApexCharts)
2. Util file move approach
3. Execution order
4. Any concerns about the scope

**Once approved, we'll proceed with Phase 2 (investigate dependencies) before any file moves.**
