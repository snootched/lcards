# MSD to Core Singleton Migration - EXECUTION PLAN

**Date:** 2025-11-10
**Branch:** msd-globalisation

## Confirmed Decisions ✅

1. ✅ **Skip ActionHelpers** - Will address separately later
2. ✅ **ApexChartsOverlayRenderer import removed** - User already fixed RulesEngine.js
3. ✅ **Remove "Msd" prefix** - Files like MsdDataSource.js → DataSource.js
4. ✅ **Delete unused stubs** - Core stub implementations are not being used
5. ✅ **Slow and methodical** - One system at a time, test between each

---

## Execution Order

We'll move systems in order of increasing complexity:

### Phase 1: Foundation (Util Files)
Move shared utilities first - these have no dependencies on other systems

### Phase 2: Simple Systems
Move systems with clean dependencies (themes, presets, packs)

### Phase 3: Complex Systems
Move systems with more interconnections (data, rules, animation)

---

## Phase 1: Move Generic Util Files to src/utils/

**Strategy:** Move truly generic utilities to `src/utils/` (not locked to core or msd)

**Files to move:**
```
src/msd/util/ → src/utils/
├── deepMerge.js          ← Pure object merging utility (used by animation)
├── hashing.js            ← Generic object hashing (used by animation)
├── performance.js        ← Generic perf tracking (used by animation + rules)
├── linearMap.js          ← Pure math utility (used by rules)
├── stableStringify.js    ← Generic JSON serialization (used by hashing)
└── checksum.js           ← Generic checksumming (used by packs)
```

**Keep in src/msd/util/:**
```
src/msd/util/
└── issues.js             ← Unused, MSD-specific if ever needed
```

**Commands:**
```bash
# Move generic utils to src/utils/
git mv src/msd/util/deepMerge.js src/utils/deepMerge.js
git mv src/msd/util/hashing.js src/utils/hashing.js
git mv src/msd/util/performance.js src/utils/performance.js
git mv src/msd/util/linearMap.js src/utils/linearMap.js
git mv src/msd/util/stableStringify.js src/utils/stableStringify.js
git mv src/msd/util/checksum.js src/utils/checksum.js
```

**Import updates needed:**
- Animation files: `../util/deepMerge` → `../../utils/deepMerge`
- Animation files: `../util/hashing` → `../../utils/hashing`
- Animation files: `../util/performance` → `../../utils/performance`
- Rules files: `../util/linearMap` → `../../utils/linearMap`
- Rules files: `../util/performance` → `../../utils/performance`
- Packs files: `../util/checksum` → `../../utils/checksum`

**Test:** `npm run build`

---

## Phase 2: Move Themes System

**Current:** `src/msd/themes/` → **Target:** `src/core/themes/`

**Files to move:**
```
src/msd/themes/
├── ThemeManager.js
├── ThemeTokenResolver.js
├── ColorUtils.js
├── initializeThemeSystem.js
└── tokens/
    ├── lcarsClassicTokens.js
    ├── lcarsDs9Tokens.js
    ├── lcarsHighContrastTokens.js
    └── lcarsVoyagerTokens.js
```

**Commands:**
```bash
# Delete stub implementation
rm -rf src/core/theme-manager

# Move entire themes directory
git mv src/msd/themes src/core/themes
```

**Import updates:**
```javascript
// src/core/lcards-core.js
- import { ThemeManager } from '../msd/themes/ThemeManager.js';
+ import { ThemeManager } from './themes/ThemeManager.js';

// src/msd/pipeline/SystemsManager.js
- import { ThemeManager } from '../themes/ThemeManager.js';
+ import { ThemeManager } from '../../core/themes/ThemeManager.js';

- import { initializeThemeSystem } from '../themes/initializeThemeSystem.js';
+ import { initializeThemeSystem } from '../../core/themes/initializeThemeSystem.js';
```

**Test:** `npm run build`

---

## Phase 3: Move Presets System

**Current:** `src/msd/presets/` → **Target:** `src/core/presets/`

**Files to move:**
```
src/msd/presets/
└── StylePresetManager.js
```

**Commands:**
```bash
# Move presets directory
git mv src/msd/presets src/core/presets
```

**Import updates:**
```javascript
// src/core/lcards-core.js
- import { StylePresetManager } from '../msd/presets/StylePresetManager.js';
+ import { StylePresetManager } from './presets/StylePresetManager.js';

// src/msd/pipeline/SystemsManager.js
- import { StylePresetManager } from '../presets/StylePresetManager.js';
+ import { StylePresetManager } from '../../core/presets/StylePresetManager.js';
```

**Test:** `npm run build`

---

## Phase 4: Move Packs System

**Current:** `src/msd/packs/` → **Target:** `src/core/packs/`

**Files to move:**
```
src/msd/packs/
├── loadBuiltinPacks.js
├── externalPackLoader.js
└── mergePacks.js
```

**Commands:**
```bash
# Move packs directory
git mv src/msd/packs src/core/packs
```

**Import updates:**
```javascript
// src/core/lcards-core.js
- import { loadBuiltinPacks } from '../msd/packs/loadBuiltinPacks.js';
+ import { loadBuiltinPacks } from './packs/loadBuiltinPacks.js';
```

**Test:** `npm run build`

---

## Phase 5: Move Data Sources System

**Current:** `src/msd/data/` → **Target:** `src/core/data-sources/`

**Files to move:**
```
src/msd/data/
├── DataSourceManager.js
├── MsdDataSource.js          ← Rename to DataSource.js
├── RollingBuffer.js
├── aggregations/
│   ├── AggregationProcessor.js
│   ├── RollingStatisticsAggregation.js
│   ├── RollingStatisticsSeriesAggregation.js
│   └── index.js
└── transformations/
    └── TransformationProcessor.js
```

**Commands:**
```bash
# Delete stub implementation
rm -rf src/core/data-sources

# Move and rename
git mv src/msd/data src/core/data-sources

# Rename MsdDataSource to DataSource
git mv src/core/data-sources/MsdDataSource.js src/core/data-sources/DataSource.js
git mv src/core/data-sources/MsdDataSource.js.bak src/core/data-sources/DataSource.js.bak
```

**Import updates:**
```javascript
// src/core/lcards-core.js
- import { DataSourceManager } from '../msd/data/DataSourceManager.js';
+ import { DataSourceManager } from './data-sources/DataSourceManager.js';

// src/msd/pipeline/SystemsManager.js
- import { DataSourceManager } from '../data/DataSourceManager.js';
+ import { DataSourceManager } from '../../core/data-sources/DataSourceManager.js';

// Inside DataSourceManager.js
- import { MsdDataSource } from './MsdDataSource.js';
+ import { DataSource } from './DataSource.js';
// And rename class usage: MsdDataSource → DataSource
```

**Test:** `npm run build`

---

## Phase 6: Move Rules System

**Current:** `src/msd/rules/` → **Target:** `src/core/rules/`

**Files to move:**
```
src/msd/rules/
├── RulesEngine.js
├── RuleTraceBuffer.js
└── compileConditions.js
```

**Commands:**
```bash
# Delete stub implementation
rm -rf src/core/rules-engine

# Move rules directory
git mv src/msd/rules src/core/rules
```

**Import updates:**
```javascript
// src/core/lcards-core.js
- import { RulesEngine } from '../msd/rules/RulesEngine.js';
+ import { RulesEngine } from './rules/RulesEngine.js';

// src/msd/pipeline/SystemsManager.js
- import { RulesEngine } from '../rules/RulesEngine.js';
+ import { RulesEngine } from '../../core/rules/RulesEngine.js';

// src/msd/pipeline/ModelBuilder.js
- import { applyOverlayPatches } from '../rules/RulesEngine.js';
+ import { applyOverlayPatches } from '../../core/rules/RulesEngine.js';

// src/msd/perf/benchHarness.js
- import { RulesEngine } from '../rules/RulesEngine.js';
+ import { RulesEngine } from '../../core/rules/RulesEngine.js';

// Inside rules files - update util imports
- import { linearMap } from '../util/linearMap.js';
+ import { linearMap } from '../utils/linearMap.js';

- import { perfTime, perfCount } from '../util/performance.js';
+ import { perfTime, perfCount } from '../utils/performance.js';
```

**Test:** `npm run build`

---

## Phase 7: Move Animation System

**Current:** `src/msd/animation/` → **Target:** `src/core/animation/`

**Files to move:**
```
src/msd/animation/
├── AnimationManager.js
├── AnimationRegistry.js
├── TriggerManager.js
├── AnimationConfigProcessor.js
├── TimelineDiffer.js
├── presets.js
├── resolveAnimations.js
└── resolveTimelines.js
```

**Commands:**
```bash
# Delete stub implementation
rm -rf src/core/animation-manager

# Move animation directory
git mv src/msd/animation src/core/animation
```

**Import updates:**
```javascript
// src/core/lcards-core.js
- import { AnimationManager } from '../msd/animation/AnimationManager.js';
- import { AnimationRegistry } from '../msd/animation/AnimationRegistry.js';
+ import { AnimationManager } from './animation/AnimationManager.js';
+ import { AnimationRegistry } from './animation/AnimationRegistry.js';

// src/msd/pipeline/SystemsManager.js
- import { AnimationRegistry } from '../animation/AnimationRegistry.js';
+ import { AnimationRegistry } from '../../core/animation/AnimationRegistry.js';

- import { processAnimationConfig } from '../animation/AnimationConfigProcessor.js';
+ import { processAnimationConfig } from '../../core/animation/AnimationConfigProcessor.js';

// src/utils/lcards-anim-helpers.js
- import { getAnimationPreset } from '../msd/animation/presets.js';
+ import { getAnimationPreset } from '../core/animation/presets.js';

// Inside animation files - update util imports
- import { deepMerge } from '../util/deepMerge.js';
+ import { deepMerge } from '../utils/deepMerge.js';

- import { perfTime, perfTimeAsync, perfCount } from '../util/performance.js';
+ import { perfTime, perfTimeAsync, perfCount } from '../utils/performance.js';

- import { computeObjectHash } from '../util/hashing.js';
+ import { computeObjectHash } from '../utils/hashing.js';
```

**Note:** AnimationManager imports ActionHelpers - we're skipping that for now per decision.

**Test:** `npm run build`

---

## Phase 8: Clean Up

**Tasks:**
1. Remove empty directories in `src/msd/`
2. Check if `src/msd/util/` is empty or has remaining MSD-specific files
3. Update documentation

**Commands:**
```bash
# Check for empty directories
find src/msd -type d -empty

# Remove if confirmed empty
rmdir src/msd/data 2>/dev/null
rmdir src/msd/animation 2>/dev/null
rmdir src/msd/rules 2>/dev/null
rmdir src/msd/themes 2>/dev/null
rmdir src/msd/presets 2>/dev/null
rmdir src/msd/packs 2>/dev/null
```

**Test:** Final `npm run build`

---

## Import Update Tracking

### Files That Import Singletons (Need Updates)

1. ✅ `src/core/lcards-core.js` - 7 imports
2. ✅ `src/msd/pipeline/SystemsManager.js` - 5 imports
3. ✅ `src/msd/pipeline/ModelBuilder.js` - 1 import
4. ✅ `src/msd/perf/benchHarness.js` - 1 import
5. ✅ `src/utils/lcards-anim-helpers.js` - 1 import

### Files Within Moved Systems (Internal References)

6. ✅ Animation system files (8 files) - util imports
7. ✅ Rules system files (3 files) - util imports
8. ✅ DataSourceManager.js - MsdDataSource import

---

## Verification Checklist

After each phase:
- [ ] `npm run build` succeeds
- [ ] No import errors in console
- [ ] Git history preserved (check with `git log --follow`)
- [ ] Commit with descriptive message

Final verification:
- [ ] All singleton systems in `src/core/`
- [ ] All stubs removed
- [ ] MSD references removed from filenames
- [ ] No broken imports
- [ ] Documentation updated
- [ ] All tests pass (if applicable)

---

## Rollback Strategy

Each phase is independent and committed separately:
- If a phase fails, `git revert` that phase's commit
- Continue with remaining phases or troubleshoot
- All moves use `git mv` - history is preserved

---

## Ready to Execute?

**Start with:** Phase 1 (Util Files)

Shall we begin? 🚀
