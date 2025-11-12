Thank you for the clarifications! Let me address each point and then provide a refined implementation plan.

## Clarifications Analysis

### 1. Overlay Registry Architecture

**Your Feedback**: Overlays = Cards in SimpleCard context. MSD has advanced SystemsManager, Core is simplified.

**Decision**: Keep separate registries - MSD overlays remain in MSD's SystemsManager, SimpleCards register with CoreSystemsManager. RulesEngine uses unified view via `getAllTargetableOverlays()`.

**Rationale**: Maintains separation of concerns. MSD complexity stays in MSD, SimpleCards remain lightweight.

---

### 2. Callback Invocation Strategy

**Your Feedback**: Only update cards when rules actually apply to them. Avoid unnecessary updates.

**Decision**: RulesEngine invokes callbacks only when evaluation produces patches. Callbacks receive full results, cards filter for relevance.

**Implementation**:
```javascript
// In RulesEngine.evaluateDirty()
const aggregated = this.aggregateResults(results);

// Only invoke callbacks if there are patches to distribute
if (aggregated.overlayPatches.length > 0 ||
    aggregated.profilesAdd.length > 0 ||
    aggregated.animations.length > 0) {
  this._lastEvaluationResults = aggregated;
  this._invokeReEvaluationCallbacks();
}
```

---

### 3. Selector Syntax

**Your Feedback**: Use colon syntax only (`tag:emergency`). CSS-like was reviewer error.

**Confirmed**: All selectors use colon format. No CSS-like attribute selectors.

---

### 4. Base SVG Support

**Your Feedback**: MSD concept, not in SimpleCards today. May add layer system later.

**Decision**: Keep `baseSvgUpdate` in RulesEngine aggregation (it's already there), but SimpleCards ignore it for now. Document as future enhancement.

---

### 5. MSD Animation Configuration

**Your Feedback**: Rules can alter animation settings or types (e.g., emergency → red + flash).

**MSD Pattern Investigation Needed**: Let me check how MSD handles rule-triggered animations.Thank you for the clarifications! Now I have a much clearer picture. Let me create the final, ratified proposal based on your answers and the MSD animation architecture.

## **RATIFIED IMPLEMENTATION PROPOSAL - RulesEngine Integration for SimpleCards**

**Document Version**: 2.0 (Final)
**Date**: 2025-11-12
**Status**: ✅ APPROVED FOR IMPLEMENTATION

---

## Executive Summary

**Objective**: Enable SimpleCards to receive and apply rule-based styling, animations, and content updates from the global RulesEngine singleton, matching MSD's cross-card coordination capabilities.

**Key Clarifications from Discussion**:
1. **Overlay vs Card**: For SimpleCards, one card = one overlay (1:1 mapping). MSD has multiple overlays per card.
2. **Update Efficiency**: Cards should only update when they have relevant patches - no unnecessary re-renders.
3. **Tag Selector Syntax**: Use existing `tag:emergency` format only (colon-based).
4. **Base SVG**: Not implemented for SimpleCards in this phase (future layer system).
5. **Animations from Rules**: Follow MSD pattern - `animationManager.playAnimation()` triggered from rule patches.

**Implementation Time**: 5-7 days

---

## Architecture Decision: Unified vs Separate Overlay Registry

### Recommendation: **Unified Registry with Type Distinction**

Based on MSD architecture where `SystemsManager` is the central coordinator:

**Add to `CoreSystemsManager`**:
```javascript
/**
 * Unified overlay registry for rule targeting
 * Supports both MSD overlays and SimpleCard "overlays" (entire cards)
 * @private
 */
this._overlayRegistry = new Map();
```

**Benefits**:
- ✅ Single source of truth for RulesEngine
- ✅ Consistent selector resolution
- ✅ Future-proof for other card types (V2 cards, custom overlays)
- ✅ Clear separation via `sourceType` metadata (`'msd'` vs `'simple-card'`)

---

## Phase 0: Infrastructure Setup (2-3 days)

### Task 0.1: Implement RulesEngine Callback API

**Location**: `src/core/rules/RulesEngine.js`

**Add after `constructor()`** (around line 65):

```javascript
  /**
   * Register callback for rule re-evaluation notifications
   * Supports multiple callbacks for multi-card scenarios
   * @param {Function} callback - Callback to invoke (receives results parameter)
   * @returns {string} Callback ID for removal
   */
  setReEvaluationCallback(callback) {
    if (typeof callback !== 'function') {
      lcardsLog.warn('[RulesEngine] Callback must be a function');
      return null;
    }

    const callbackId = `re-eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this._reEvaluationCallbacks.push({
      id: callbackId,
      fn: callback
    });

    lcardsLog.debug(`[RulesEngine] Registered re-evaluation callback: ${callbackId} (total: ${this._reEvaluationCallbacks.length})`);

    return callbackId;
  }

  /**
   * Remove a registered callback by ID or function reference
   * @param {string|Function} callbackIdOrFn - Callback ID or function reference
   */
  removeReEvaluationCallback(callbackIdOrFn) {
    const initialCount = this._reEvaluationCallbacks.length;

    if (typeof callbackIdOrFn === 'string') {
      // Remove by ID
      this._reEvaluationCallbacks = this._reEvaluationCallbacks.filter(
        cb => cb.id !== callbackIdOrFn
      );
    } else if (typeof callbackIdOrFn === 'function') {
      // Remove by function reference
      this._reEvaluationCallbacks = this._reEvaluationCallbacks.filter(
        cb => cb.fn !== callbackIdOrFn
      );
    } else {
      lcardsLog.warn('[RulesEngine] Invalid callback identifier for removal');
      return;
    }

    const removed = initialCount - this._reEvaluationCallbacks.length;
    if (removed > 0) {
      lcardsLog.debug(`[RulesEngine] Removed ${removed} callback(s) (remaining: ${this._reEvaluationCallbacks.length})`);
    } else {
      lcardsLog.warn('[RulesEngine] Callback not found for removal');
    }
  }

  /**
   * Invoke all registered callbacks with evaluation results
   * Only invoked when there are actual patches to apply (efficiency)
   * @private
   * @param {Object} results - Evaluation results from evaluateDirty
   */
  _invokeReEvaluationCallbacks(results) {
    if (this._reEvaluationCallbacks.length === 0) return;

    // EFFICIENCY: Only invoke if there are actual changes to distribute
    const hasChanges = results.overlayPatches?.length > 0 ||
                       results.profilesAdd?.length > 0 ||
                       results.profilesRemove?.length > 0 ||
                       results.animations?.length > 0 ||
                       results.baseSvgUpdate;

    if (!hasChanges) {
      lcardsLog.trace('[RulesEngine] No changes in evaluation results - skipping callbacks');
      return;
    }

    lcardsLog.debug(`[RulesEngine] Invoking ${this._reEvaluationCallbacks.length} callback(s) with ${results.overlayPatches?.length || 0} patch(es)`);

    this._reEvaluationCallbacks.forEach(({ id, fn }) => {
      try {
        fn(results); // Pass results to callback
      } catch (error) {
        lcardsLog.error(`[RulesEngine] Callback ${id} failed:`, error);
      }
    });

    perfCount('rules.callbacks.invoked', this._reEvaluationCallbacks.length);
  }
```

**Modify `evaluateDirty()` method** (around line 303):

```javascript
  evaluateDirty(context = {}) {
    return perfTime('rules.evaluate', () => {
      // ... existing evaluation logic ...

      // BEFORE RETURN
      const aggregated = this.aggregateResults(results);

      // Cache results for callbacks
      this._lastEvaluationResults = aggregated;

      // Invoke callbacks ONLY if there are changes to distribute
      this._invokeReEvaluationCallbacks(aggregated);

      return aggregated;
    });
  }
```

---

### Task 0.2: Implement Unified Overlay Registry in CoreSystemsManager

**Location**: `src/core/CoreSystemsManager.js`

**Add to constructor** (around line 30):

```javascript
    /**
     * Unified overlay registry for rule targeting
     * Maps overlay ID -> metadata
     * Supports both MSD overlays and SimpleCard instances
     * @private
     */
    this._overlayRegistry = new Map();
```

**Add methods after `registerCard()`** (around line 180):

```javascript
  /**
   * Register an overlay for rule targeting
   * @param {string} overlayId - Unique overlay ID
   * @param {Object} metadata - Overlay metadata
   * @param {string} metadata.sourceType - 'msd' or 'simple-card'
   * @param {string} metadata.type - Overlay type (e.g., 'button', 'text', 'status_grid')
   * @param {Array<string>} metadata.tags - Tags for selector matching
   * @param {string} metadata.cardGuid - Card instance GUID
   * @param {Object} metadata.cardInstance - Reference to card instance
   * @param {Object} [metadata.config] - Card/overlay configuration
   */
  registerOverlay(overlayId, metadata) {
    if (!overlayId) {
      lcardsLog.warn('[CoreSystemsManager] Cannot register overlay without ID');
      return;
    }

    const registration = {
      id: overlayId,
      sourceType: metadata.sourceType || 'unknown',
      type: metadata.type || 'unknown',
      tags: metadata.tags || [],
      cardGuid: metadata.cardGuid,
      cardInstance: metadata.cardInstance,
      config: metadata.config || {},
      registeredAt: Date.now()
    };

    this._overlayRegistry.set(overlayId, registration);

    lcardsLog.debug(`[CoreSystemsManager] Registered ${metadata.sourceType} overlay: ${overlayId}`, {
      type: registration.type,
      tags: registration.tags
    });

    // Trigger rule re-evaluation if RulesEngine is available
    if (this.rulesManager) {
      this.rulesManager.markAllDirty();
    }
  }

  /**
   * Unregister an overlay
   * @param {string} overlayId - Overlay ID to remove
   */
  unregisterOverlay(overlayId) {
    const existed = this._overlayRegistry.delete(overlayId);

    if (existed) {
      lcardsLog.debug(`[CoreSystemsManager] Unregistered overlay: ${overlayId}`);

      // Trigger rule re-evaluation
      if (this.rulesManager) {
        this.rulesManager.markAllDirty();
      }
    }
  }

  /**
   * Get all targetable overlays (MSD + SimpleCards + future types)
   * Used by RulesEngine for selector resolution
   * @returns {Array<Object>} All overlay metadata
   */
  getAllTargetableOverlays() {
    // Get registered overlays from unified registry
    const registeredOverlays = Array.from(this._overlayRegistry.values());

    // ALSO get MSD overlays from resolved model (if available)
    const msdOverlays = this.getResolvedModel?.()?.overlays || [];

    // Merge without duplicates (registry takes precedence)
    const registryIds = new Set(registeredOverlays.map(o => o.id));
    const uniqueMsdOverlays = msdOverlays.filter(o => !registryIds.has(o.id));

    const allOverlays = [...registeredOverlays, ...uniqueMsdOverlays];

    lcardsLog.trace(`[CoreSystemsManager] getAllTargetableOverlays: ${allOverlays.length} total (${registeredOverlays.length} registered + ${uniqueMsdOverlays.length} MSD)`);

    return allOverlays;
  }

  /**
   * Get overlay metadata by ID
   * @param {string} overlayId - Overlay ID
   * @returns {Object|null} Overlay metadata or null
   */
  getOverlay(overlayId) {
    return this._overlayRegistry.get(overlayId) || null;
  }

  /**
   * Get all registered overlays of a specific type
   * @param {string} sourceType - 'msd', 'simple-card', or 'all'
   * @returns {Array<Object>} Overlay metadata array
   */
  getOverlaysBySource(sourceType = 'all') {
    const overlays = Array.from(this._overlayRegistry.values());

    if (sourceType === 'all') {
      return overlays;
    }

    return overlays.filter(o => o.sourceType === sourceType);
  }
```

---

### Task 0.3: Update RulesEngine Selector Resolution

**Location**: `src/core/rules/RulesEngine.js` - `_resolveOverlaySelectors()` method

**Change line ~505**:

```javascript
  _resolveOverlaySelectors(ruleApply) {
    if (!ruleApply.overlays) return [];

    const startTime = performance.now();

    // CHANGED: Use unified overlay registry
    const allOverlays = this.systemsManager?.getAllTargetableOverlays?.() || [];

    if (allOverlays.length === 0) {
      lcardsLog.debug('[RulesEngine] No overlays available for selector resolution');
      return [];
    }

    // ... rest of method unchanged ...
```

---

## Phase 1: SimpleCard Integration (2-3 days)

### Task 1.1: Add RulesEngine Integration to LCARdSSimpleCard

**Location**: `src/base/LCARdSSimpleCard.js`

**Add to constructor** (around line 65):

```javascript
        // Action handler (unified utility)
        this._actionHandler = new LCARdSActionHandler();

        // ✨ NEW: Rules integration state
        this._overlayId = null;
        this._overlayTags = [];
        this._overlayType = 'simple-card';
        this._ruleCallbackId = null;
        this._appliedRulePatches = null;

        // Template processing state
        this._templateUpdateScheduled = false;
```

**Add new methods after `_initializeSingletons()`** (around line 180):

```javascript
    /**
     * Register this card with RulesEngine for rule targeting
     * Called during initialization after singletons are available
     * @private
     */
    _registerWithRulesEngine() {
        if (!this._singletons?.systemsManager || !this._singletons?.rulesEngine) {
            lcardsLog.debug(`[LCARdSSimpleCard] RulesEngine not available for ${this._cardGuid}`);
            return;
        }

        // Determine overlay ID (config.id or auto-generated)
        this._overlayId = this.config.id || `simple-card-${this._cardGuid}`;
        this._overlayTags = this.config.tags || [];
        this._overlayType = this.config.overlay_type || this.constructor.CARD_TYPE || 'simple-card';

        lcardsLog.debug(`[LCARdSSimpleCard] Registering with RulesEngine:`, {
            id: this._overlayId,
            tags: this._overlayTags,
            type: this._overlayType
        });

        // Register overlay metadata with CoreSystemsManager
        this._singletons.systemsManager.registerOverlay(this._overlayId, {
            sourceType: 'simple-card',
            type: this._overlayType,
            tags: this._overlayTags,
            cardGuid: this._cardGuid,
            config: this.config,
            cardInstance: this
        });

        // Register callback for rule updates
        this._setupRuleCallback();

        // Register card-local rules if present
        this._registerCardLocalRules();
    }

    /**
     * Setup callback for rule re-evaluation
     * @private
     */
    _setupRuleCallback() {
        const rulesEngine = this._singletons?.rulesEngine;
        if (!rulesEngine) return;

        // Register callback - receives evaluation results
        this._ruleCallbackId = rulesEngine.setReEvaluationCallback((results) => {
            this._handleRuleEvaluation(results);
        });

        lcardsLog.debug(`[LCARdSSimpleCard] Rule callback registered: ${this._ruleCallbackId}`);
    }

    /**
     * Handle rule re-evaluation - filter and apply relevant patches
     * EFFICIENCY: Only called when there are actual changes
     * @private
     * @param {Object} results - Rule evaluation results from RulesEngine
     */
    _handleRuleEvaluation(results) {
        if (!results || !results.overlayPatches) {
            return;
        }

        try {
            // Filter patches targeting this card
            const relevantPatches = this._filterRelevantPatches(results.overlayPatches);

            if (relevantPatches.length > 0) {
                lcardsLog.debug(`[LCARdSSimpleCard] Applying ${relevantPatches.length} rule patch(es) to ${this._overlayId}`);

                // Apply patches and check if visual update needed
                const changed = this._applyRulePatches(relevantPatches);

                if (changed) {
                    // Schedule update to avoid Lit update cycles
                    this._scheduleTemplateUpdate();
                }
            } else if (this._appliedRulePatches) {
                // Had patches before, but none now - clear them
                lcardsLog.debug(`[LCARdSSimpleCard] Clearing previous rule patches from ${this._overlayId}`);
                this._appliedRulePatches = null;
                this._scheduleTemplateUpdate();
            }

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Rule evaluation failed:`, error);
        }
    }

    /**
     * Filter patches relevant to this card
     * @private
     * @param {Array} patches - All overlay patches from rule evaluation
     * @returns {Array} Patches targeting this card
     */
    _filterRelevantPatches(patches) {
        return patches.filter(patch => {
            // Direct ID match (primary mechanism - RulesEngine already resolved selectors)
            if (patch.id === this._overlayId) {
                lcardsLog.trace(`[LCARdSSimpleCard] Patch matches by ID: ${patch.id}`);
                return true;
            }

            return false;
        });
    }

    /**
     * Apply rule patches to card state
     * Follows MSD pattern: merge styles, queue animations
     * @private
     * @param {Array} patches - Rule patches to apply
     * @returns {boolean} True if visual changes were made
     */
    _applyRulePatches(patches) {
        if (!patches || patches.length === 0) {
            return false;
        }

        let changed = false;

        // Merge all patch styles (later patches override earlier)
        const mergedPatch = {
            style: {},
            animations: [],
            texts: null,        // Support texts array override
            label: null,
            content: null,
            visible: null
        };

        patches.forEach(patch => {
            // Merge styles (deep merge for nested objects)
            if (patch.style) {
                mergedPatch.style = this._deepMerge(mergedPatch.style, patch.style);
            }

            // Collect animations (MSD pattern)
            if (patch.animations && Array.isArray(patch.animations)) {
                mergedPatch.animations.push(...patch.animations);
            }

            // Support texts array override (last wins)
            if (patch.texts !== undefined) {
                mergedPatch.texts = patch.texts;
            }

            // Override content/label (last wins)
            if (patch.content !== undefined) {
                mergedPatch.content = patch.content;
            }
            if (patch.label !== undefined) {
                mergedPatch.label = patch.label;
            }
            if (patch.visible !== undefined) {
                mergedPatch.visible = patch.visible;
            }
        });

        // Check if patches actually changed
        const oldPatches = JSON.stringify(this._appliedRulePatches);
        const newPatches = JSON.stringify(mergedPatch);

        if (oldPatches !== newPatches) {
            this._appliedRulePatches = mergedPatch;
            changed = true;

            lcardsLog.debug(`[LCARdSSimpleCard] Rule patches applied to ${this._overlayId}:`, mergedPatch);

            // Trigger animations if present (MSD pattern)
            if (mergedPatch.animations.length > 0) {
                this._triggerRuleAnimations(mergedPatch.animations);
            }
        }

        return changed;
    }

    /**
     * Trigger animations from rule patches
     * Follows MSD pattern: AnimationManager.playAnimation()
     * @private
     */
    _triggerRuleAnimations(animations) {
        const animationManager = this._singletons?.animationManager;
        if (!animationManager || !this.shadowRoot) {
            lcardsLog.warn(`[LCARdSSimpleCard] AnimationManager not available for ${this._overlayId}`);
            return;
        }

        lcardsLog.debug(`[LCARdSSimpleCard] Triggering ${animations.length} animation(s) from rules for ${this._overlayId}`);

        animations.forEach(animDef => {
            try {
                // MSD pattern: playAnimation(overlayId, animDef, mountEl)
                // AnimationManager will find the element via data-overlay-id
                animationManager.playAnimation(
                    this._overlayId,
                    animDef,
                    this.shadowRoot
                );
            } catch (error) {
                lcardsLog.error(`[LCARdSSimpleCard] Animation trigger failed:`, error);
            }
        });
    }

    /**
     * Register card-local rules with RulesEngine
     * @private
     */
    _registerCardLocalRules() {
        const rulesEngine = this._singletons?.rulesEngine;
        if (!rulesEngine || !this.config.rules) return;

        if (!Array.isArray(this.config.rules)) {
            lcardsLog.warn(`[LCARdSSimpleCard] config.rules must be an array`);
            return;
        }

        lcardsLog.debug(`[LCARdSSimpleCard] Registering ${this.config.rules.length} card-local rule(s)`);

        this.config.rules.forEach(rule => {
            if (!rule.id) {
                lcardsLog.warn(`[LCARdSSimpleCard] Skipping rule without ID:`, rule);
                return;
            }

            try {
                // Add rule to global RulesEngine
                // TODO: Track rule IDs for cleanup on disconnect
                rulesEngine.addRule(rule);
                lcardsLog.debug(`[LCARdSSimpleCard] Registered rule: ${rule.id}`);
            } catch (error) {
                lcardsLog.error(`[LCARdSSimpleCard] Failed to register rule ${rule.id}:`, error);
            }
        });
    }

    /**
     * Get merged style including rule patches
     * Call this from subclasses when resolving final styles
     * @protected
     * @param {Object} baseStyle - Base style object
     * @returns {Object} Style with rule patches applied
     */
    _getMergedStyleWithRules(baseStyle) {
        if (!this._appliedRulePatches || !this._appliedRulePatches.style) {
            return baseStyle;
        }

        // Deep merge rule patch styles (rule patches have highest priority)
        return this._deepMerge(baseStyle, this._appliedRulePatches.style);
    }

    /**
     * Get merged texts including rule patches
     * @protected
     * @returns {Object} Processed texts with rule overrides
     */
    _getMergedTextsWithRules() {
        const baseTexts = {
            label: this._processedTexts.label,
            content: this._processedTexts.content,
            texts: this._processedTexts.texts
        };

        if (!this._appliedRulePatches) {
            return baseTexts;
        }

        // Apply rule overrides (if present)
        return {
            label: this._appliedRulePatches.label ?? baseTexts.label,
            content: this._appliedRulePatches.content ?? baseTexts.content,
            texts: this._appliedRulePatches.texts ?? baseTexts.texts
        };
    }

    /**
     * Deep merge two objects
     * @private
     */
    _deepMerge(target, source) {
        const result = { ...target };

        for (const [key, value] of Object.entries(source)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = this._deepMerge(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }
```

**Update `_initializeSingletons()` method** (around line 140):

```javascript
    _initializeSingletons() {
        try {
            // Get core singletons via unified API
            const core = window.lcards?.core;

            if (!core) {
                lcardsLog.warn(`[LCARdSSimpleCard] Core singletons not available`);
                return;
            }

            // ... existing singleton initialization ...

            // ✨ NEW: Register with RulesEngine after singletons are set up
            this._registerWithRulesEngine();

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Singleton initialization failed:`, error);
        }
    }
```

**Update `_onDisconnected()` method** (around line 500):

```javascript
    _onDisconnected() {
        // ✨ NEW: Unregister rule callback
        if (this._ruleCallbackId && this._singletons?.rulesEngine) {
            this._singletons.rulesEngine.removeReEvaluationCallback(this._ruleCallbackId);
            this._ruleCallbackId = null;
            lcardsLog.debug(`[LCARdSSimpleCard] Unregistered rule callback for ${this._overlayId}`);
        }

        // ✨ NEW: Unregister overlay from CoreSystemsManager
        if (this._overlayId && this._singletons?.systemsManager) {
            this._singletons.systemsManager.unregisterOverlay(this._overlayId);
            lcardsLog.debug(`[LCARdSSimpleCard] Unregistered overlay: ${this._overlayId}`);
        }

        // Cleanup entity subscriptions
        if (this._entitySubscriptions) {
            // ... existing cleanup ...
        }

        // ... existing cleanup ...

        super._onDisconnected();
    }
```

---

### Task 1.2: Update lcards-simple-button to Use Rule Patches

**Location**: `src/cards/lcards-simple-button.js`

**Modify `_resolveButtonStyleSync()` method** (around line 135):

```javascript
    _resolveButtonStyleSync() {
        // Start with base style from config
        let style = { ...(this.config.style || {}) };

        // Apply preset if specified
        if (this.config.preset) {
            const preset = this.getStylePreset('button', this.config.preset);
            if (preset) {
                // Preset has lower priority than explicit config
                style = { ...preset, ...style };
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Applied preset '${this.config.preset}'`);
            }
        }

        // Get state-based overrides
        const stateOverrides = this._getStateOverrides();

        // Resolve with theme tokens
        const resolvedStyle = this.resolveStyle(style, [
            'colors.accent.primary',
            'colors.text.primary'
        ], stateOverrides);

        // ✨ NEW: Merge with rule patches (highest priority)
        const finalStyle = this._getMergedStyleWithRules(resolvedStyle);

        // Only update if changed
        if (!this._buttonStyle || JSON.stringify(this._buttonStyle) !== JSON.stringify(finalStyle)) {
            this._buttonStyle = finalStyle;
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Button style resolved with rules:`, this._buttonStyle);
        }
    }
```

**Modify `_renderButtonContent()` to use merged texts** (around line 240):

```javascript
    _renderButtonContent() {
        const width = this.config.width || 200;
        const height = this.config.height || 60;

        // ✨ NEW: Get texts with rule overrides
        const mergedTexts = this._getMergedTextsWithRules();

        // Build button configuration for ButtonRenderer
        const buttonConfig = {
            id: 'simple-button',
            label: mergedTexts.label,
            content: mergedTexts.content,
            texts: mergedTexts.texts,
            preset: this.config.preset,
            style: this._buttonStyle,
            size: [width, height]
        };

        // ... rest of method unchanged ...
```

---

## Phase 2: Configuration Schema & Testing (1-2 days)

### Task 2.1: Update Configuration Schema

**Location**: `src/cards/lcards-simple-button.js` - CoreConfigManager registration (around line 370)

```javascript
    // ✨ NEW: Register JSON schema for validation
    configManager.registerCardSchema('simple-button', {
        type: 'object',
        properties: {
            entity: {
                type: 'string',
                description: 'Entity ID to control'
            },

            // ✨ NEW: Rules integration properties
            id: {
                type: 'string',
                description: 'Unique overlay ID for rule targeting (auto-generated if omitted)'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for group-based rule targeting (e.g., ["emergency", "critical"])'
            },
            overlay_type: {
                type: 'string',
                description: 'Override overlay type for type-based selectors (default: "simple-button")'
            },
            rules: {
                type: 'array',
                items: { type: 'object' },
                description: 'Card-local rules to register with RulesEngine'
            },

            label: {
                type: 'string',
                description: 'Button label text (supports templates)'
            },
            content: {
                type: 'string',
                description: 'Additional content text (supports templates)'
            },
            texts: {
                type: 'array',
                items: { type: 'object' },
                description: 'Advanced text array for multi-text buttons'
            },

            // ... existing properties ...
        },
        required: ['entity']
    }, { version: '1.1' });
```

---

### Task 2.2: Create Test File

**Location**: Create `test/test-simple-button-rules.html`

````html
<!DOCTYPE html>
<html>
<head>
  <title>SimpleCard RulesEngine Integration Test</title>
  <script type="module" src="/dist/lcards.js"></script>
</head>
<body>
  <h1>SimpleCard RulesEngine Integration Tests</h1>

  <!-- Test 1: Direct ID Targeting -->
  <section>
    <h2>Test 1: Direct ID Targeting</h2>
    <p>Turn on light.desk - button should turn green with border</p>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "desk_light_btn",
        "entity": "light.desk",
        "preset": "lozenge",
        "label": "Desk Light"
      }
      </script>
    </lcards-simple-button>

    <!-- Rule controller (separate card) -->
    <lcards-simple-button>
      <script type="application/json">
      {
        "entity": "input_boolean.test_mode",
        "label": "Test Controller",
        "rules": [
          {
            "id": "test1_desk_light_on",
            "when": {
              "all": [
                { "entity": "light.desk", "state": "on" }
              ]
            },
            "apply": {
              "overlays": {
                "desk_light_btn": {
                  "style": {
                    "primary": "#00FF00",
                    "border": {
                      "color": "#00FF00",
                      "width": 3
                    }
                  }
                }
              }
            }
          }
        ]
      }
      </script>
    </lcards-simple-button>
  </section>

  <!-- Test 2: Tag-Based Targeting -->
  <section>
    <h2>Test 2: Tag-Based Targeting</h2>
    <p>Trigger binary_sensor.alarm - all emergency buttons turn red and pulse</p>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "emergency1",
        "tags": ["emergency", "critical"],
        "entity": "switch.emergency_lights",
        "preset": "picard-filled",
        "label": "Emergency 1"
      }
      </script>
    </lcards-simple-button>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "emergency2",
        "tags": ["emergency"],
        "entity": "switch.emergency_power",
        "preset": "picard-filled",
        "label": "Emergency 2"
      }
      </script>
    </lcards-simple-button>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "normal_light",
        "tags": ["normal"],
        "entity": "switch.normal_lights",
        "preset": "lozenge",
        "label": "Normal Light"
      }
      </script>
    </lcards-simple-button>

    <!-- Rule controller -->
    <lcards-simple-button>
      <script type="application/json">
      {
        "entity": "binary_sensor.alarm",
        "label": "Alarm Controller",
        "rules": [
          {
            "id": "emergency_alert",
            "when": {
              "all": [
                { "entity": "binary_sensor.alarm", "state": "on" }
              ]
            },
            "apply": {
              "overlays": {
                "tag:emergency": {
                  "style": {
                    "primary": "#FF0000",
                    "border": {
                      "color": "#FF0000",
                      "width": 4
                    }
                  },
                  "animations": [
                    {
                      "preset": "pulse",
                      "duration": 1000
                    }
                  ]
                }
              }
            }
          }
        ]
      }
      </script>
    </lcards-simple-button>
  </section>

  <!-- Test 3: Type-Based Targeting -->
  <section>
    <h2>Test 3: Type-Based Targeting</h2>
    <p>Enable input_boolean.night_mode - all simple-button types dim</p>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "light1",
        "entity": "light.living_room",
        "preset": "lozenge",
        "label": "Living Room"
      }
      </script>
    </lcards-simple-button>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "light2",
        "entity": "light.bedroom",
        "preset": "bullet",
        "label": "Bedroom"
      }
      </script>
    </lcards-simple-button>

    <!-- Rule controller -->
    <lcards-simple-button>
      <script type="application/json">
      {
        "entity": "input_boolean.night_mode",
        "label": "Night Mode",
        "rules": [
          {
            "id": "night_mode_dimming",
            "when": {
              "all": [
                { "entity": "input_boolean.night_mode", "state": "on" }
              ]
            },
            "apply": {
              "overlays": {
                "type:simple-button": {
                  "style": {
                    "opacity": 0.6
                  }
                }
              }
            }
          }
        ]
      }
      </script>
    </lcards-simple-button>
  </section>

  <!-- Test 4: Text Override from Rules -->
  <section>
    <h2>Test 4: Dynamic Text from Rules</h2>
    <p>Turn on switch.mode - button label changes to "MODE ACTIVE"</p>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "mode_button",
        "entity": "switch.mode",
        "preset": "lozenge",
        "label": "Mode Control"
      }
      </script>
    </lcards-simple-button>

    <!-- Rule controller -->
    <lcards-simple-button>
      <script type="application/json">
      {
        "entity": "input_boolean.rule_controller",
        "label": "Controller",
        "rules": [
          {
            "id": "mode_active_text",
            "when": {
              "all": [
                { "entity": "switch.mode", "state": "on" }
              ]
            },
            "apply": {
              "overlays": {
                "mode_button": {
                  "label": "MODE ACTIVE",
                  "style": {
                    "primary": "#FFAA00"
                  }
                }
              }
            }
          }
        ]
      }
      </script>
    </lcards-simple-button>
  </section>

  <!-- Test 5: Pattern Matching -->
  <section>
    <h2>Test 5: Pattern Matching</h2>
    <p>All HVAC buttons turn orange when heating</p>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "hvac_main",
        "entity": "climate.main",
        "preset": "lozenge",
        "label": "Main HVAC"
      }
      </script>
    </lcards-simple-button>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "hvac_bedroom",
        "entity": "climate.bedroom",
        "preset": "lozenge",
        "label": "Bedroom HVAC"
      }
      </script>
    </lcards-simple-button>

    <lcards-simple-button>
      <script type="application/json">
      {
        "id": "other_control",
        "entity": "light.other",
        "preset": "lozenge",
        "label": "Other Control"
      }
      </script>
    </lcards-simple-button>

    <!-- Rule controller -->
    <lcards-simple-button>
      <script type="application/json">
      {
        "entity": "climate.main",
        "label": "HVAC Controller",
        "rules": [
          {
            "id": "hvac_heating_style",
            "when": {
              "all": [
                { "entity": "climate.main", "state": "heat" }
              ]
            },
            "apply": {
              "overlays": {
                "pattern:hvac_.*": {
                  "style": {
                    "primary": "#FF9900"
                  }
                }
              }
            }
          }
        ]
      }
      </script>
    </lcards-simple-button>
  </section>
</body>
</html>
````

---

## Phase 3: Documentation (1 day)

### Task 3.1: Create SimpleCard Rules Integration Guide

**Location**: Create `doc/SimpleCard-Rules-Integration.md`

**Content** (abbreviated outline):

```markdown
# SimpleCard RulesEngine Integration Guide

## Overview

SimpleCards can receive rule-based styling, animations, and content updates from the global RulesEngine singleton.

## Basic Concepts

### Overlay ID
Every SimpleCard can have a unique ID for rule targeting:
- Explicit: `"id": "my_button"`
- Auto-generated: `simple-card-{guid}` if omitted

### Tags
Group SimpleCards for bulk targeting:
```yaml
tags: ["emergency", "critical"]
```

## Selector Types

| Selector | Format | Example |
|----------|--------|---------|
| Direct ID | `"overlay_id": {}` | `"desk_light_btn": { ... }` |
| Tag | `"tag:tagname": {}` | `"tag:emergency": { ... }` |
| Type | `"type:typename": {}` | `"type:simple-button": { ... }` |
| Pattern | `"pattern:regex": {}` | `"pattern:hvac_.*": { ... }` |
| Wildcard | `"all": {}` | `"all": { ... }` |

## Rule Structure

```yaml
rules:
  - id: unique_rule_id
    when:
      all:
        - entity: sensor.temp
          above: 25
    apply:
      overlays:
        "tag:climate":
          style:
            primary: "#FF0000"
          animations:
            - preset: pulse
              duration: 1000
          label: "TOO HOT"
```

## Supported Patches

- `style` - Style overrides (deep merged)
- `animations` - Array of animation definitions
- `label` - Text override
- `content` - Content override
- `texts` - Full texts array override
- `visible` - Show/hide control

## Examples

[Include examples from test file]

## Performance Notes

- Callbacks only invoked when rules produce actual changes
- Selector resolution happens once in RulesEngine
- Cards only re-render if they have relevant patches
```

---

### Task 3.2: Update SimpleCard Documentation

**Location**: Update `doc/cards/lcards-simple-button.md`

Add section:

```markdown
## Rules Integration

SimpleButtons can be targeted by global rules for dynamic styling and behavior.

### Configuration Properties

- `id` (string): Unique overlay ID for rule targeting
- `tags` (array): Tags for group-based targeting
- `rules` (array): Card-local rules to register

### Example with Rules

```yaml
type: custom:lcards-simple-button
id: emergency_lights
tags: ["emergency", "critical"]
entity: switch.emergency_lights
preset: picard-filled
label: "Emergency Lights"
```

Global rule targeting this button:

```yaml
rules:
  - id: emergency_alert
    when:
      all:
        - entity: binary_sensor.alarm
          state: "on"
    apply:
      overlays:
        "tag:emergency":
          style:
            primary: "#FF0000"
          animations:
            - preset: pulse
```

See [SimpleCard Rules Integration Guide](../SimpleCard-Rules-Integration.md) for details.
```

---

## Corrected Selector Reference (Final)

| Selector Type | **Correct Format** | Example | Description |
|--------------|-------------------|---------|-------------|
| Direct ID | `overlay_id` | `"desk_light_btn": { ... }` | Target specific overlay by ID |
| Tag | `tag:tagname` | `"tag:emergency": { ... }` | Target all overlays with tag |
| Type | `type:typename` | `"type:simple-button": { ... }` | Target all overlays of type |
| Pattern | `pattern:regex` | `"pattern:hvac_.*": { ... }` | Target IDs matching regex |
| Wildcard | `all` | `"all": { ... }` | Target every overlay |
| Exclude | `exclude: [...]` | `"all": { ... }, "exclude": ["btn1"]` | Exclude specific IDs |

---

## Implementation Checklist

### Phase 0: Infrastructure (2-3 days)
- [ ] Add `setReEvaluationCallback()` to RulesEngine
- [ ] Add `removeReEvaluationCallback()` to RulesEngine
- [ ] Add `_invokeReEvaluationCallbacks()` to RulesEngine (with efficiency check)
- [ ] Update `evaluateDirty()` to invoke callbacks
- [ ] Add `_overlayRegistry` Map to CoreSystemsManager
- [ ] Add `registerOverlay()` to CoreSystemsManager
- [ ] Add `unregisterOverlay()` to CoreSystemsManager
- [ ] Add `getAllTargetableOverlays()` to CoreSystemsManager
- [ ] Add `getOverlay()` to CoreSystemsManager
- [ ] Add `getOverlaysBySource()` to CoreSystemsManager
- [ ] Update RulesEngine `_resolveOverlaySelectors()` to use new registry

### Phase 1: SimpleCard Integration (2-3 days)
- [ ] Add rules integration state to LCARdSSimpleCard constructor
- [ ] Implement `_registerWithRulesEngine()`
- [ ] Implement `_setupRuleCallback()`
- [ ] Implement `_handleRuleEvaluation()`
- [ ] Implement `_filterRelevantPatches()`
- [ ] Implement `_applyRulePatches()`
- [ ] Implement `_triggerRuleAnimations()` (MSD pattern)
- [ ] Implement `_registerCardLocalRules()`
- [ ] Implement `_getMergedStyleWithRules()`
- [ ] Implement `_getMergedTextsWithRules()`
- [ ] Update `_initializeSingletons()` to call `_registerWithRulesEngine()`
- [ ] Update `_onDisconnected()` to cleanup callbacks and registry
- [ ] Update lcards-simple-button `_resolveButtonStyleSync()` to use merged styles
- [ ] Update lcards-simple-button `_renderButtonContent()` to use merged texts

### Phase 2: Testing (1-2 days)
- [ ] Create `test-simple-button-rules.html` with 5 test scenarios
- [ ] Test direct ID targeting
- [ ] Test tag-based targeting (`tag:emergency`)
- [ ] Test type-based targeting (`type:simple-button`)
- [ ] Test text override from rules
- [ ] Test pattern matching (`pattern:hvac_.*`)
- [ ] Test animations from rules (MSD pattern)
- [ ] Test cleanup on disconnect
- [ ] Verify no unnecessary re-renders (efficiency)

### Phase 3: Documentation (1 day)
- [ ] Create `SimpleCard-Rules-Integration.md`
- [ ] Update `lcards-simple-button.md` with rules section
- [ ] Update configuration schema in code
- [ ] Add troubleshooting section
- [ ] Document performance characteristics

---

## Backlog Items (Future)

1. **Rule Priority/Stop Semantics for SimpleCards**: Currently implemented in RulesEngine for MSD overlays. Need to verify if `stop: true` in rules applies correctly to SimpleCards. If not, implement proper stop handling.

2. **Card-Local Rule Cleanup**: Currently card-local rules persist in global RulesEngine after card disconnect. Consider tracking and removing them.

3. **Base SVG Support**: Not implemented for SimpleCards yet. Future layer system may add this capability.

4. **Rule Debugging UI**: Visual inspector for rule matching and patch application (similar to MSD HUD).

---

## Key Architectural Decisions

1. **Unified Registry**: Single `_overlayRegistry` in CoreSystemsManager for all overlay types (MSD + SimpleCard + future).

2. **Efficiency First**: Callbacks only invoked when rules produce actual changes (patches, animations, etc.).

3. **MSD Pattern Compliance**: SimpleCard animations follow MSD pattern - `AnimationManager.playAnimation(overlayId, animDef, mountEl)`.

4. **1:1 Card-Overlay Mapping**: SimpleCards have one overlay per card (the card itself).

5. **Colon Syntax Only**: Use `tag:emergency`, `type:button` syntax (not CSS-like `*[tag~='']`).

6. **No Base SVG Yet**: SimpleCards don't implement `base_svg` in this phase (future layer system).

---

## Migration from Original Proposal

**Changes from v1.0 proposal**:
- ✅ Fixed selector syntax throughout (removed CSS-like examples)
- ✅ Added efficiency check to callback invocation
- ✅ Unified overlay registry instead of separate SimpleCard registry
- ✅ Added `_getMergedTextsWithRules()` for text override support
- ✅ Clarified animation triggering pattern (MSD `playAnimation` method)
- ✅ Removed `base_svg` implementation from SimpleCard scope
- ✅ Added backlog item for rule priority/stop semantics verification

---

**Implementation Ready**: ✅ This proposal is approved for implementation. Begin with Phase 0, then proceed sequentially through Phases 1-3.