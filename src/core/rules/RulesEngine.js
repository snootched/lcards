/**
 * [RulesEngine] Rules evaluation system - processes rules with DataSource integration and performance tracing
 * 🧠 Features dependency tracking, conditional evaluation, overlay patching, and comprehensive rule tracing
 */


import { globalTraceBuffer } from './RuleTraceBuffer.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../../core/BaseService.js';
import { compileRule, evalCompiled } from './compileConditions.js';  // ✨ NEW
import { UnifiedTemplateEvaluator } from '../templates/UnifiedTemplateEvaluator.js';  // ✨ NEW
import { deepMerge } from '../config-manager/merge-helpers.js';
import { linearMap } from '../../utils/linearMap.js';

export class RulesEngine extends BaseService {
  constructor(rules = [], dataSourceManager = null) {
    super();
    this.rules = Array.isArray(rules) ? rules : [];
    this.rulesById = new Map();
    this.dependencyIndex = null;
    this.dirtyRules = new Set();
    this.lastEvaluation = new Map(); // ruleId -> evaluation result
    this.traceBuffer = globalTraceBuffer;
    this.stopProcessing = new Map(); // overlayId -> Set of stopped rule priorities

    // NEW: DataSource integration
    this.dataSourceManager = dataSourceManager;

    // Performance tracking
    this.evalCounts = {
      total: 0,
      dirty: 0,
      matched: 0,
      skipped: 0
    };

    // NEW: HASS subscription management
    this.hassUnsubscribe = null;
    this._reEvaluationCallbacks = []; // CHANGED: Array of callbacks for multiple MSD cards
    this._hassEntities = new Set(); // Cached entity list for performance
    this._freshStateCache = new Map(); // Cache for fresh states from events (entityId -> state object)

    // ✨ NEW: Template evaluator for Jinja2/JS conditions
    this._templateEvaluator = null;

    // ✨ NEW: Compiled rules cache
    this.compiledRules = new Map();

    // ✨ NEW: Rule-based animation tracking
    // Maps ruleId to Set of overlayIds that have active rule animations
    this.activeRuleAnimations = new Map(); // ruleId -> Set<overlayId>

    this.buildRulesIndex();
    this.buildDependencyIndex();
    this.markAllDirty(); // Initial state

    // ✨ NEW: Compile rules
    this._compileRules();
  }

  buildRulesIndex() {
    this.rulesById.clear();
    this.rules.forEach(rule => {
      if (rule.id) {
        this.rulesById.set(rule.id, rule);
      }
    });
  }

  /**
   * Set systemsManager and initialize template evaluator
   * @param {Object} manager - SystemsManager instance
   */
  set systemsManager(manager) {
    this._systemsManager = manager;
    if (manager) {
      this._initializeTemplateEvaluator();
    }
  }

  get systemsManager() {
    return this._systemsManager;
  }

  /**
   * Initialize template evaluator for rule conditions
   * Called after systemsManager is set
   *
   * @private
   */
  _initializeTemplateEvaluator() {
    if (!this._systemsManager) {
      lcardsLog.warn('[RulesEngine] Cannot initialize template evaluator without systemsManager');
      return;
    }

    const hass = this._systemsManager.getHass();
    if (!hass) {
      lcardsLog.warn('[RulesEngine] Cannot initialize template evaluator without hass');
      return;
    }

    // Create evaluator WITHOUT hass in context - we'll update it before each evaluation
    // This ensures we always use fresh hass with current connection state
    this._templateEvaluator = new UnifiedTemplateEvaluator({
      hass: null, // Will be updated before evaluation
      context: {
        config: {},
        variables: {}
      },
      dataSourceManager: this.dataSourceManager
    });

    lcardsLog.debug('[RulesEngine] Template evaluator initialized (hass will be updated on each evaluation)');
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

  buildDependencyIndex() {
    const entityToRules = new Map();
    const ruleToEntities = new Map();

    this.rules.forEach(rule => {
      const entities = this.extractEntityReferences(rule);
      ruleToEntities.set(rule.id, entities);

      entities.forEach(entityId => {
        if (!entityToRules.has(entityId)) {
          entityToRules.set(entityId, new Set());
        }
        entityToRules.get(entityId).add(rule.id);
      });
    });

    this.dependencyIndex = { entityToRules, ruleToEntities };

    // Update cached entity list for performance
    if (this.hassUnsubscribe) {
      const ruleEntities = Array.from(this.dependencyIndex?.entityToRules.keys() || [])
        .filter(entityId => !entityId.includes('.'));
      this._hassEntities = new Set(ruleEntities);

      lcardsLog.debug(`[RulesEngine] Updated monitored entities: ${ruleEntities.length} entities`);
    }

    // Debug exposure
    try {
      const debugNamespace = (typeof window !== 'undefined') ? window : global;
      if (debugNamespace.__msdDebug) {
        debugNamespace.__msdDebug.rulesDeps = {
          entityToRules: Object.fromEntries(entityToRules),
          ruleToEntities: Object.fromEntries(ruleToEntities),
          totalEntities: entityToRules.size,
          totalRules: this.rules.length
        };
      }
    } catch (e) {}
  }

  extractEntityReferences(rule) {
    const entities = new Set();

    if (!rule.when) return Array.from(entities);

    // Extract from all/any conditions
    const conditions = [
      ...(rule.when.all || []),
      ...(rule.when.any || [])
    ];

    conditions.forEach(condition => {
      // Direct entity reference
      if (condition.entity) {
        // FIXED: Better DataSource detection and filtering
        if (condition.entity.includes('.')) {
          // This looks like a DataSource reference (e.g., "temperature_enhanced.transformations.celsius")
          const sourceName = condition.entity.split('.')[0];

          // Check if this is actually a DataSource by consulting the DataSourceManager
          if (this.dataSourceManager && this.dataSourceManager.getSource(sourceName)) {
            lcardsLog.trace(`[RulesEngine] Skipping DataSource reference in rule monitoring: ${condition.entity}`);
            // Don't add DataSource references to HASS entity monitoring
            // The DataSourceManager already handles these entities via its own subscriptions
            return;
          } else {
            // Not a DataSource, might be an entity with attribute reference (e.g., "sensor.temp.state")
            // Extract just the entity ID part
            const entityId = condition.entity.split('.')[0] + '.' + condition.entity.split('.')[1];
            if (entityId.includes('.') && entityId.split('.').length === 2) {
              entities.add(entityId);
              lcardsLog.trace(`[RulesEngine] Added entity with attribute to monitoring: ${entityId} (from ${condition.entity})`);
            }
          }
        } else {
          // Regular Home Assistant entity (no dots)
          entities.add(condition.entity);
          lcardsLog.trace(`[RulesEngine] Added regular entity to monitoring: ${condition.entity}`);
        }
      }

      // Entity attribute reference (e.g., "sensor.temp.state")
      if (condition.entity_attr) {
        const entityId = condition.entity_attr.split('.')[0];
        entities.add(entityId);
      }

      // Map range condition
      if (condition.map_range_cond?.entity) {
        entities.add(condition.map_range_cond.entity);
      }

      // Value map references in rule conditions
      if (condition.value_map?.entity) {
        entities.add(condition.value_map.entity);
      }
    });

    return Array.from(entities);
  }

  markEntitiesDirty(changedEntityIds) {
    if (!Array.isArray(changedEntityIds)) {
      changedEntityIds = [changedEntityIds];
    }

    let affectedRules = 0;

    changedEntityIds.forEach(entityId => {
      // Direct entity/DataSource rule matches
      const rules = this.dependencyIndex.entityToRules.get(entityId);
      if (rules) {
        rules.forEach(ruleId => {
          if (!this.dirtyRules.has(ruleId)) {
            this.dirtyRules.add(ruleId);
            affectedRules++;
          }
        });
      }

      // Handle DataSource change propagation
      // If a DataSource changes, mark rules that depend on its transformations/aggregations
      if (this.dataSourceManager?.getSource(entityId)) {
        // Find rules that depend on this DataSource's transformations/aggregations
        for (const [fullRef, ruleSet] of this.dependencyIndex.entityToRules) {
          if (fullRef.startsWith(`${entityId}.`)) {
            ruleSet.forEach(ruleId => {
              if (!this.dirtyRules.has(ruleId)) {
                this.dirtyRules.add(ruleId);
                affectedRules++;
              }
            });
          }
        }
      }
    });

    return affectedRules;
  }

  markAllDirty() {
    this.dirtyRules.clear();
    this.rules.forEach(rule => {
      if (rule.id) {
        this.dirtyRules.add(rule.id);
      }
    });
  }

  /**
   * Evaluate dirty (changed) rules
   *
   * NOW ASYNC to support Jinja2 template conditions
   *
   * @param {Object} context - Evaluation context
   * @returns {Promise<Object>} Aggregated rule results
   */
  async evaluateDirty(context = {}) {
    let { getEntity, overlays, entity } = context;  // ✨ CHANGED: Extract entity and overlays from context

      // ENHANCED: Always prioritize original HASS states for rule evaluation
      // regardless of the context or provided getEntity function
      if (this.dataSourceManager || this.systemsManager) {
        const originalGetEntity = getEntity;

        getEntity = (entityId) => {
          lcardsLog.trace(`[RulesEngine] getEntity called for: ${entityId}`);

          // PRIORITY 0: Check fresh state cache from events (most recent data)
          if (this._freshStateCache.has(entityId)) {
            const freshState = this._freshStateCache.get(entityId);
            lcardsLog.trace(`[RulesEngine] Using FRESH cached state for ${entityId}: ${freshState.state}`);
            return freshState;
          }

          // PRIORITY 1: Try to get HASS state from SystemsManager
          if (this.systemsManager) {
            const hass = this.systemsManager.getHass();
            if (hass && hass.states && hass.states[entityId]) {
              const state = hass.states[entityId].state;
              lcardsLog.trace(`[RulesEngine] Found HASS state for ${entityId}: ${state}`);

              return {
                entity_id: entityId,
                state: state,
                attributes: hass.states[entityId].attributes || {},
                last_changed: hass.states[entityId].last_changed,
                last_updated: hass.states[entityId].last_updated
              };
            }
          }

          // PRIORITY 2: Check if this is a DataSource reference (contains dots)
          if (entityId.includes('.') && this.dataSourceManager) {
            const value = this.resolveDataSourceValue(entityId);
            if (value !== null) {
              lcardsLog.trace(`[RulesEngine] Found DataSource reference value for ${entityId}: ${value}`);
              return {
                entity_id: entityId,
                state: String(value),
                attributes: {}
              };
            }
          }

          // PRIORITY 3: Try auto-created template DataSource with original entity preservation
          const templateDataSourceName = `template_${entityId.replace(/\./g, '_')}`;
          if (this.dataSourceManager) {
            const templateDataSource = this.dataSourceManager.getSource(templateDataSourceName);
            if (templateDataSource) {
              const currentData = templateDataSource.getCurrentData();
              if (currentData && currentData.entity && currentData.entity.state !== undefined) {
                const originalState = currentData.entity.state;
                lcardsLog.trace(`[RulesEngine] Found auto-DataSource original state for ${entityId}: ${originalState}`);

                return {
                  entity_id: entityId,
                  state: originalState,
                  attributes: currentData.entity.attributes || {},
                  last_changed: currentData.entity.last_changed,
                  last_updated: currentData.entity.last_updated
                };
              }
            }
          }

          // PRIORITY 4: Fall back to provided getEntity function (debug: type coercion may occur)
          if (originalGetEntity) {
            const entity = originalGetEntity(entityId);
            if (entity) {
              lcardsLog.trace(`[RulesEngine] Using fallback getEntity for ${entityId} - state may be converted: ${entity.state}`);
              return entity;
            }
          }

          // PRIORITY 5: Try DataSourceManager's getEntity method as last resort (debug: type coercion may occur)
          if (this.dataSourceManager && this.dataSourceManager.getEntity) {
            const entity = this.dataSourceManager.getEntity(entityId);
            if (entity) {
              lcardsLog.trace(`[RulesEngine] Using DataSourceManager getEntity for ${entityId} - state may be converted: ${entity.state}`);
              return entity;
            }
          }

          lcardsLog.warn(`[RulesEngine] No entity data found for ${entityId}`);
          return null;
        };
      }

      if (!getEntity || typeof getEntity !== 'function') {
        lcardsLog.warn('[RulesEngine] ⚠️ evaluateDirty called without getEntity function and no DataSourceManager available');
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

      // ✨ CHANGED: Sequential async evaluation (maintains priority order)
      for (const rule of dirtyRulesArray) {
        if (processedRules.has(rule.id)) continue;

        const result = await this.evaluateRule(rule, getEntity, overlays, entity);  // ✨ CHANGED: Pass entity
        processedRules.add(rule.id);

        // Get previous evaluation result to detect transitions
        const previousEval = this.lastEvaluation.get(rule.id);
        const wasMatched = previousEval?.matched || false;
        const isMatched = result.matched;

        // Cache evaluation result
        this.lastEvaluation.set(rule.id, {
          matched: result.matched,
          timestamp: Date.now(),
          conditions: result.conditions
        });

        if (result.matched) {
          results.push(result);
          this.evalCounts.matched++;

          // ✨ NEW: Execute rule animations when rule transitions to matched state
          if (!wasMatched && result.animations && result.animations.length > 0) {
            lcardsLog.debug(`[RulesEngine] Rule ${rule.id} matched - executing animations`);
            await this._executeRuleAnimations(result.animations, rule.id);
          }
        } else if (wasMatched) {
          // ✨ NEW: Stop animations when rule transitions from matched to unmatched
          lcardsLog.debug(`[RulesEngine] Rule ${rule.id} unmatched - stopping animations`);
          this._stopRuleAnimations(rule.id);
        }

        // Remove from dirty set
        this.dirtyRules.delete(rule.id);
      }

      // Performance tracking
      this.evalCounts.total += totalDirty;
      this.evalCounts.dirty += totalDirty;
      this.evalCounts.skipped += (this.rules.length - totalDirty);

      const aggregatedResult = this.aggregateResults(results);

      // DEBUG: Log what we're returning from evaluateDirty
      lcardsLog.trace(`[RulesEngine] evaluateDirty returning:`, {
        overlayPatchesCount: aggregatedResult.overlayPatches?.length || 0,
        profilesAddCount: aggregatedResult.profilesAdd?.length || 0,
        hasResult: !!aggregatedResult,
        isObject: typeof aggregatedResult === 'object',
        keys: Object.keys(aggregatedResult || {})
      });

      return aggregatedResult;
  }

  /**
   * Ingest fresh HASS state
   * Called by Core when HASS updates (for backwards compatibility)
   *
   * NOTE: With setupHassMonitoring(), entity-specific dirty marking is handled
   * automatically via WebSocket subscriptions. This method is kept for:
   * 1. Cards that haven't set up monitoring yet
   * 2. Manual HASS updates in tests
   * 3. Backwards compatibility
   *
   * If setupHassMonitoring() is active, this does NOT mark all rules dirty
   * to avoid duplicate evaluations.
   *
   * @param {Object} hass - Fresh Home Assistant state object
   */
  ingestHass(hass) {
    if (!hass || !hass.states) {
      lcardsLog.warn('[RulesEngine] ingestHass: Invalid HASS provided');
      return;
    }

    // If WebSocket monitoring is active, entity changes already mark rules dirty
    // Only mark all dirty if no monitoring is set up (fallback for legacy cards)
    if (!this.hassUnsubscribe) {
      lcardsLog.trace('[RulesEngine] No WebSocket monitoring, marking all rules dirty (fallback)');
      this.markAllDirty();
    } else {
      lcardsLog.trace('[RulesEngine] WebSocket monitoring active, skipping markAllDirty (entity-specific tracking active)');
    }

    // ✨ EFFICIENCY CHECK: Only invoke callbacks if there are dirty rules
    if (this._reEvaluationCallbacks.length > 0 && this.dirtyRules.size > 0) {
      lcardsLog.debug(`[RulesEngine] Changes detected, triggering ${this._reEvaluationCallbacks.length} re-evaluation callbacks`);
      this._reEvaluationCallbacks.forEach((callback, index) => {
        try {
          callback();
        } catch (error) {
          lcardsLog.error(`[RulesEngine] Error in re-evaluation callback ${index}:`, error);
        }
      });
    } else if (this._reEvaluationCallbacks.length > 0) {
      lcardsLog.trace('[RulesEngine] No dirty rules, skipping callback invocation (efficiency check)');
    }
  }

  /**
   * Override BaseService updateHass to forward to ingestHass
   * Core calls updateHass(), but RulesEngine implements ingestHass()
   *
   * @param {Object} hass - Home Assistant instance
   */
  updateHass(hass) {
    return this.ingestHass(hass);
  }

  /**
   * Evaluate rule using compiled conditions
   *
   * NOW ASYNC to support Jinja2 conditions
   *
   * @param {Object} rule - Rule to evaluate
   * @param {Function} getEntity - Function to get entity state
   * @param {Array} contextOverlays - Overlays available during evaluation (for initial render)
   * @param {string} boundEntity - Entity ID bound to the card (for JavaScript context)
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateRule(rule, getEntity, contextOverlays = null, boundEntity = null) {  // ✨ CHANGED: Accept boundEntity
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
        entity: boundEntity ? getEntity(boundEntity) : null,  // ✨ CHANGED: Use passed entity if available

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
          hasTemplateConditions: this._hasTemplateConditions(compiled.tree),
          entityRefs: this.dependencyIndex?.ruleToEntities.get(rule.id) || []
        }
      );

      if (matched && rule.apply) {
        // Resolve overlay selectors to patches (supports bulk targeting)
        result.overlayPatches = await this._resolveOverlaySelectors(rule.apply, contextOverlays);  // ✨ CHANGED: await async call

        // Add ruleId and condition info to each patch for provenance tracking
        if (result.overlayPatches) {
          // Build a human-readable condition string
          const conditionStr = rule.when ? JSON.stringify(rule.when) : 'always true';

          result.overlayPatches = result.overlayPatches.map(patch => ({
            ...patch,
            ruleId: rule.id,
            ruleCondition: conditionStr
          }));
        }

        // DEBUG: Log the patches we got back
        lcardsLog.trace(`[RulesEngine] _resolveOverlaySelectors returned:`, {
          ruleId: rule.id,
          patchesCount: result.overlayPatches?.length || 0,
          patches: result.overlayPatches,
          isArray: Array.isArray(result.overlayPatches)
        });

        result.profilesAdd = rule.apply.profiles_add || [];
        result.profilesRemove = rule.apply.profiles_remove || [];
        result.animations = rule.apply.animations || [];
        result.baseSvgUpdate = rule.apply.base_svg || null;
        result.stopAfter = rule.stop === true;

        // DEBUG: Log what we found
        lcardsLog.trace(`[RulesEngine] Rule ${rule.id} matched - apply block:`, {
          hasBaseSvg: !!rule.apply.base_svg,
          baseSvgValue: rule.apply.base_svg,
          hasOverlays: !!rule.apply.overlays,
          overlayCount: result.overlayPatches?.length || 0
        });
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


  /**
   * Resolve overlay selectors to concrete overlay patches
   *
   * Supports bulk targeting via special selectors:
   * - all: - Target all overlays
   * - type:typename: - Target overlays of specific type
   * - tag:tagname: - Target overlays with specific tag
   * - pattern:regex: - Target overlays matching ID pattern
   * - exclude: - Exclude specific overlay IDs
   * - overlay_id (direct) - Target specific overlay (backwards compatible)
   *
   * @param {Object} ruleApply - Rule 'apply' clause
   * @returns {Array<Object>} Array of overlay patches with {id, style, ...}
   * @private
   */
  async _resolveOverlaySelectors(ruleApply, contextOverlays = null) {  // ✨ CHANGED: Made async for template evaluation
    if (!ruleApply.overlays) return [];

    const startTime = performance.now();

    // Get all available overlays from:
    // 1. Context (during initial render)
    // 2. SystemsManager overlay registry (for LCARdS cards with registered overlays)
    // 3. SystemsManager getResolvedModel (for MSD cards)
    const allOverlays = contextOverlays
      || this.systemsManager?.getAllTargetableOverlays?.()
      || this.systemsManager?.getResolvedModel?.()?.overlays
      || [];

    lcardsLog.trace('[RulesEngine] _resolveOverlaySelectors called', {
      hasContextOverlays: !!contextOverlays,
      hasSystemsManager: !!this.systemsManager,
      allOverlaysCount: allOverlays.length,
      overlayIds: allOverlays.map(o => o.id),
      selectors: Object.keys(ruleApply.overlays)
    });

    if (allOverlays.length === 0) {
      // This is expected during initialization before overlays are ready
      lcardsLog.debug('[RulesEngine] No overlays available yet for selector resolution (may be during initialization)');
      return [];
    }

    // Build exclusion set
    const excludeIds = new Set();
    if (ruleApply.overlays.exclude) {
      const excludeList = Array.isArray(ruleApply.overlays.exclude)
        ? ruleApply.overlays.exclude
        : [ruleApply.overlays.exclude];
      excludeList.forEach(id => excludeIds.add(id));
    }

    // Collect patches by overlay ID (allows merging from multiple selectors)
    const patchMap = new Map();

    // Process each selector
    for (const [selector, patchContent] of Object.entries(ruleApply.overlays)) {
      // Skip exclude key (already processed)
      if (selector === 'exclude') continue;

      let matchedOverlays = [];

      // Selector: all - Match all overlays
      if (selector === 'all') {
        matchedOverlays = allOverlays.filter(o => !excludeIds.has(o.id));
      }
      // Selector: type:typename - Match overlays by type
      else if (selector.startsWith('type:')) {
        const typeName = selector.substring(5); // Remove 'type:' prefix
        matchedOverlays = allOverlays.filter(o =>
          o.type === typeName && !excludeIds.has(o.id)
        );
      }
      // Selector: tag:tagname - Match overlays by tag
      else if (selector.startsWith('tag:')) {
        const tagName = selector.substring(4); // Remove 'tag:' prefix
        matchedOverlays = allOverlays.filter(o => {
          const tags = o.tags || [];
          return tags.includes(tagName) && !excludeIds.has(o.id);
        });
      }
      // Selector: pattern:regex - Match overlays by ID pattern
      else if (selector.startsWith('pattern:')) {
        const pattern = selector.substring(8); // Remove 'pattern:' prefix
        try {
          const regex = new RegExp(pattern);
          matchedOverlays = allOverlays.filter(o =>
            regex.test(o.id) && !excludeIds.has(o.id)
          );
        } catch (e) {
          lcardsLog.warn(`[RulesEngine] Invalid regex pattern: ${pattern}`, e);
          continue;
        }
      }
      // Direct overlay ID (backwards compatible)
      else {
        const overlay = allOverlays.find(o => o.id === selector);
        lcardsLog.trace(`[RulesEngine] Direct ID selector '${selector}'`, {
          found: !!overlay,
          availableIds: allOverlays.map(o => o.id),
          searching: selector
        });
        if (overlay && !excludeIds.has(overlay.id)) {
          matchedOverlays = [overlay];
        }
      }

      // Create/merge patches for matched overlays
      matchedOverlays.forEach(overlay => {
        const existing = patchMap.get(overlay.id);
        if (existing) {
          // Merge with existing patch (later selectors override)
          patchMap.set(overlay.id, {
            ...existing,
            ...patchContent,
            style: {
              ...(existing.style || {}),
              ...(patchContent.style || {})
            }
          });
        } else {
          // New patch
          patchMap.set(overlay.id, {
            id: overlay.id,
            ...patchContent
          });
        }
      });

      // Debug logging (if enabled)
      if (window.lcards?.debug?.rules) {
        lcardsLog.trace(`[RulesEngine] Selector '${selector}' matched ${matchedOverlays.length} overlay(s)`);
      }
    }

    const patches = Array.from(patchMap.values());

    // ✨ NEW: Evaluate templates in patch values (Jinja2, JavaScript, Tokens, DataSources)
    // This must happen BEFORE patches are sent to cards so they receive evaluated values
    const evaluatedPatches = await this._evaluateTemplatesInPatches(patches);

    const resolutionTime = performance.now() - startTime;

    lcardsLog.trace('[RulesEngine] Selector resolution complete:', {
      selectors: Object.keys(ruleApply.overlays).filter(k => k !== 'exclude').length,
      excluded: excludeIds.size,
      patchesGenerated: evaluatedPatches.length,
      resolutionTime: `${resolutionTime.toFixed(2)}ms`
    });

    return evaluatedPatches;
  }

  /**
   * Evaluate templates in patch values recursively
   * Handles Jinja2, JavaScript, Tokens, and DataSource templates
   *
   * @private
   * @param {Array} patches - Array of patch objects
   * @returns {Promise<Array>} Patches with evaluated templates
   */
  async _evaluateTemplatesInPatches(patches) {
    if (!patches || patches.length === 0) return patches;
    if (!this._templateEvaluator) {
      lcardsLog.warn('[RulesEngine] No template evaluator available for patch evaluation');
      return patches;
    }

    // Update template evaluator with FRESH hass (ensures connection is available)
    const freshHass = this._systemsManager?.getHass();
    if (freshHass) {
      this._templateEvaluator.hass = freshHass;
      this._templateEvaluator.context.hass = freshHass;
      lcardsLog.trace('[RulesEngine] Updated template evaluator with fresh hass', {
        hasConnection: !!freshHass.connection,
        connectionType: freshHass.connection?.constructor?.name
      });
    } else {
      lcardsLog.warn('[RulesEngine] No hass available for template evaluation');
    }

    const evaluatedPatches = [];

    for (const patch of patches) {
      const evaluatedPatch = { ...patch };

      // Evaluate templates in style properties
      if (patch.style) {
        evaluatedPatch.style = {};
        for (const [key, value] of Object.entries(patch.style)) {
          if (typeof value === 'string') {
            try {
              // Use template evaluator to handle all template types
              const evaluated = await this._templateEvaluator.evaluateAsync(value);
              evaluatedPatch.style[key] = evaluated;

              // Log if value changed (template was evaluated)
              if (evaluated !== value) {
                lcardsLog.trace(`[RulesEngine] Evaluated template in patch ${patch.id}.style.${key}:`, {
                  original: value,
                  evaluated: evaluated
                });
              }
            } catch (error) {
              lcardsLog.error(`[RulesEngine] Template evaluation failed for ${patch.id}.style.${key}:`, error);
              evaluatedPatch.style[key] = value; // Use original value on error
            }
          } else {
            evaluatedPatch.style[key] = value;
          }
        }
      }

      // Evaluate templates in other top-level properties (like text content, etc.)
      for (const [key, value] of Object.entries(patch)) {
        if (key === 'style' || key === 'id' || key === 'ruleId' || key === 'ruleCondition') {
          continue; // Skip already processed or metadata fields
        }

        if (typeof value === 'string') {
          try {
            const evaluated = await this._templateEvaluator.evaluateAsync(value);
            evaluatedPatch[key] = evaluated;

            if (evaluated !== value) {
              lcardsLog.trace(`[RulesEngine] Evaluated template in patch ${patch.id}.${key}:`, {
                original: value,
                evaluated: evaluated
              });
            }
          } catch (error) {
            lcardsLog.error(`[RulesEngine] Template evaluation failed for ${patch.id}.${key}:`, error);
            evaluatedPatch[key] = value;
          }
        }
      }

      evaluatedPatches.push(evaluatedPatch);
    }

    return evaluatedPatches;
  }

  /**
   * Resolve a DataSource reference to its current value
   * @param {string} dataSourceRef - Reference like 'source.transformations.key' or 'source.aggregations.key'
   * @returns {any|null} Resolved value or null if not found
   */
  resolveDataSourceValue(dataSourceRef) {
    try {
      // Parse the DataSource reference
      const parts = dataSourceRef.split('.');
      const sourceName = parts[0];

      // Get the DataSource
      const dataSource = this.dataSourceManager.getSource(sourceName);
      if (!dataSource) {
        return null;
      }

      const currentData = dataSource.getCurrentData();
      if (!currentData) {
        return null;
      }

      // Handle simple DataSource reference (just the source name)
      if (parts.length === 1) {
        return currentData.v;
      }

      // Handle enhanced DataSource references
      if (parts.length >= 3) {
        const dataType = parts[1]; // 'transformations' or 'aggregations'
        const dataKey = parts.slice(2).join('.'); // Support nested keys

        if (dataType === 'transformations' && currentData.transformations) {
          return currentData.transformations[dataKey];
        } else if (dataType === 'aggregations' && currentData.aggregations) {
          const aggData = currentData.aggregations[dataKey];

          // Handle aggregation objects with multiple properties
          if (typeof aggData === 'object' && aggData !== null) {
            // Return the most relevant value from aggregation
            if (aggData.avg !== undefined) return aggData.avg;
            if (aggData.value !== undefined) return aggData.value;
            if (aggData.last !== undefined) return aggData.last;
            if (aggData.current !== undefined) return aggData.current;
            return aggData; // Return the object itself if no standard property
          }

          return aggData;
        }
      }

      return null;
    } catch (error) {
      lcardsLog.warn(`[RulesEngine] ⚠️ Error resolving DataSource reference '${dataSourceRef}':`, error);
      return null;
    }
  }

  aggregateResults(ruleResults) {
    // DEBUG: Log what we're aggregating
    lcardsLog.trace(`[RulesEngine] aggregateResults called:`, {
      resultsCount: ruleResults.length,
      resultsWithPatches: ruleResults.filter(r => r.overlayPatches && r.overlayPatches.length > 0).length,
      allResults: ruleResults.map(r => ({
        ruleId: r.ruleId,
        matched: r.matched,
        hasPatchesArray: !!r.overlayPatches,
        patchesCount: r.overlayPatches?.length || 0
      }))
    });

    const aggregated = {
      overlayPatches: [],
      profilesAdd: [],
      profilesRemove: [],
      animations: [],
      baseSvgUpdate: null  // ✅ NEW: Aggregate base_svg updates
    };

    // Group results by target overlays for stop semantics
    const overlayGroups = new Map();

    ruleResults.forEach(result => {
      if (result.overlayPatches) {
        result.overlayPatches.forEach(patch => {
          if (!overlayGroups.has(patch.id)) {
            overlayGroups.set(patch.id, []);
          }
          overlayGroups.get(patch.id).push({
            ...result,
            overlayPatch: patch
          });
        });
      }
    });

    // Process each overlay group with stop semantics
    overlayGroups.forEach((rules, overlayId) => {
      this.processOverlayRules(overlayId, rules, aggregated);
    });

    // Add non-overlay results (profiles, animations, base_svg)
    ruleResults
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach(result => {
        if (result.profilesAdd) {
          aggregated.profilesAdd.push(...result.profilesAdd);
        }
        if (result.profilesRemove) {
          aggregated.profilesRemove.push(...result.profilesRemove);
        }
        if (result.animations) {
          aggregated.animations.push(...result.animations);
        }
        // ✅ NEW: Take the first (highest priority) base_svg update
        if (result.baseSvgUpdate && !aggregated.baseSvgUpdate) {
          aggregated.baseSvgUpdate = result.baseSvgUpdate;
        }
      });

    // DEBUG: Log what we're returning
    lcardsLog.trace(`[RulesEngine] aggregateResults returning:`, {
      overlayPatchesCount: aggregated.overlayPatches.length,
      profilesAddCount: aggregated.profilesAdd.length,
      profilesRemoveCount: aggregated.profilesRemove.length,
      animationsCount: aggregated.animations.length,
      hasBaseSvg: !!aggregated.baseSvgUpdate,
      overlayPatches: aggregated.overlayPatches
    });

    return aggregated;
  }

  processOverlayRules(overlayId, rules, aggregated) {
    // Sort by priority (higher first)
    const sortedRules = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let shouldStop = false;

    sortedRules.forEach(result => {
      if (shouldStop) {
        // Rule was stopped, add to trace
        this.traceBuffer.addTrace(
          result.ruleId,
          result.matched,
          result.conditions,
          result.evaluationTime,
          {
            stopped: true,
            stoppedBy: overlayId,
            reason: 'stop_semantics'
          }
        );

        return;
      }

      // Apply the rule result
      if (result.overlayPatch) {
        aggregated.overlayPatches.push(result.overlayPatch);
      }

      // Check for stop condition
      if (result.stopAfter) {
        shouldStop = true;

        // Add stop trace
        this.traceBuffer.addTrace(
          result.ruleId,
          result.matched,
          result.conditions,
          result.evaluationTime,
          {
            stopTriggered: true,
            affectedOverlay: overlayId
          }
        );
      }
    });
  }

  countConditions(when) {
    if (!when) return 0;
    return (when.all?.length || 0) + (when.any?.length || 0);
  }

  createEmptyResult() {
    return {
      overlayPatches: [],
      profilesAdd: [],
      profilesRemove: [],
      animations: [],
      baseSvgUpdate: null  // ✅ NEW: Include base_svg in empty result
    };
  }

  /**
   * Execute animations from rule matches
   * Called when rules are evaluated and animations are specified in apply.animations
   *
   * @param {Array} animationCommands - Array of animation commands from aggregated rule results
   * @param {string} ruleId - Rule ID that triggered these animations
   * @private
   */
  async _executeRuleAnimations(animationCommands, ruleId) {
    if (!animationCommands || animationCommands.length === 0) {
      return;
    }

    // Get AnimationManager from Core singleton (it's not in SystemsManager)
    const animationManager = window.lcards?.core?.animationManager;
    if (!animationManager) {
      lcardsLog.warn('[RulesEngine] Cannot execute rule animations - no AnimationManager available');
      return;
    }

    lcardsLog.debug(`[RulesEngine] 🎬 Executing ${animationCommands.length} animation(s) for rule: ${ruleId}`);

    // Track which overlays have animations started by this rule
    if (!this.activeRuleAnimations.has(ruleId)) {
      this.activeRuleAnimations.set(ruleId, new Set());
    }
    const activeOverlays = this.activeRuleAnimations.get(ruleId);

    for (const animCmd of animationCommands) {
      try {
        // Resolve overlay targets (supports overlay ID, tag, type, pattern)
        const targetOverlays = this._resolveAnimationTargets(animCmd);

        if (targetOverlays.length === 0) {
          lcardsLog.debug(`[RulesEngine] No overlays found matching animation target:`, animCmd);
          continue;
        }

        lcardsLog.debug(`[RulesEngine] Triggering animation for ${targetOverlays.length} overlay(s):`, {
          targets: targetOverlays,
          preset: animCmd.preset,
          loop: animCmd.loop
        });

        // Resolve any map_range param descriptors to concrete values
        const hass = this.systemsManager?.getHass?.();
        const resolvedAnimCmd = this._resolveAnimCommandParams(animCmd, hass);

        lcardsLog.debug(`[RulesEngine] Resolved animation params for rule ${ruleId}:`, {
          original: animCmd.params,
          resolved: resolvedAnimCmd.params
        });

        // Execute animation on each target overlay
        for (const overlayId of targetOverlays) {
          // Add trigger type so the animation can be tracked and stopped
          const ruleAnimDef = { ...resolvedAnimCmd, trigger: 'on_rule' };
          await animationManager.playAnimation(overlayId, ruleAnimDef);
          if (animCmd.loop) {
            activeOverlays.add(overlayId);
          }
        }

      } catch (error) {
        lcardsLog.error(`[RulesEngine] Failed to execute rule animation:`, error);
      }
    }
  }

  /**
   * Resolve a single animation parameter value.
   * If the value is a map_range descriptor object, linearly interpolates
   * the entity's current state value into the output range.
   * Otherwise, returns the value as-is.
   *
   * map_range descriptor shape:
   * {
   *   map_range: {
   *     entity: 'sensor.grid_power',      // Required: HA entity ID
   *     attribute: 'brightness',          // Optional: attribute to read (default: state)
   *     input: [0, 5000],                 // Required: [inMin, inMax]
   *     output: [8, 0.5],                 // Required: [outMin, outMax] — numbers OR hex color strings
   *     clamp: true                       // Optional: clamp to output range (default: true)
   *   }
   * }
   *
   * Supports numeric output ranges (e.g. speed, duration, opacity) and
   * hex color string interpolation (e.g. '#00ff88' → '#ff4400').
   *
   * @param {*} paramValue - The raw param value (may be a map_range descriptor or a plain value)
   * @param {Object} hass - Home Assistant instance for entity lookup
   * @returns {*} Resolved value, or the original value if not a map_range descriptor
   * @private
   */
  _resolveAnimParam(paramValue, hass) {
    if (!paramValue || typeof paramValue !== 'object' || !paramValue.map_range) {
      return paramValue;
    }

    const cfg = paramValue.map_range;
    const entityId = cfg.entity;
    if (!entityId) {
      lcardsLog.warn('[RulesEngine] map_range param missing required "entity" field:', cfg);
      return undefined;
    }

    // Look up entity state — use fresh state cache if available, then hass.states
    let rawValue;
    if (this._freshStateCache?.has(entityId)) {
      const cached = this._freshStateCache.get(entityId);
      rawValue = cfg.attribute ? cached.attributes?.[cfg.attribute] : cached.state;
    } else if (hass?.states?.[entityId]) {
      const entityObj = hass.states[entityId];
      rawValue = cfg.attribute ? entityObj.attributes?.[cfg.attribute] : entityObj.state;
    } else {
      lcardsLog.warn(`[RulesEngine] map_range param: entity not found: ${entityId}`);
      return undefined;
    }

    const numVal = Number(rawValue);
    if (!Number.isFinite(numVal)) {
      lcardsLog.warn(`[RulesEngine] map_range param: entity "${entityId}" value "${rawValue}" is not numeric`);
      return undefined;
    }

    const [inMin, inMax] = cfg.input || [];
    const clamp = cfg.clamp !== false; // Default true

    if (![inMin, inMax].every(v => Number.isFinite(Number(v)))) {
      lcardsLog.warn('[RulesEngine] map_range param: invalid "input" range:', cfg.input);
      return undefined;
    }

    if (!Array.isArray(cfg.output) || cfg.output.length !== 2) {
      lcardsLog.warn('[RulesEngine] map_range param: "output" must be a 2-element array:', cfg.output);
      return undefined;
    }
    const [outMin, outMax] = cfg.output;

    // Numeric output range
    if (typeof outMin === 'number' && typeof outMax === 'number' && Number.isFinite(outMin) && Number.isFinite(outMax)) {
      const result = linearMap(numVal, Number(inMin), Number(inMax), outMin, outMax, clamp);
      lcardsLog.debug(`[RulesEngine] map_range resolved: ${entityId}=${numVal} → ${result} (input:[${inMin},${inMax}] output:[${outMin},${outMax}])`);
      return result;
    }

    // Hex color string interpolation
    if (typeof outMin === 'string' && typeof outMax === 'string') {
      const t = linearMap(numVal, Number(inMin), Number(inMax), 0, 1, clamp);
      const colorResult = this._interpolateHexColor(outMin, outMax, t);
      lcardsLog.debug(`[RulesEngine] map_range color resolved: ${entityId}=${numVal} → t=${t.toFixed(3)} → ${colorResult}`);
      return colorResult;
    }

    lcardsLog.warn('[RulesEngine] map_range param: "output" must be [number, number] or ["#hex", "#hex"]:', cfg.output);
    return undefined;
  }

  /**
   * Interpolate between two hex color strings by a normalized t value (0–1).
   * Only supports 6-digit hex colors (#rrggbb).
   *
   * @param {string} hexA - Start color e.g. '#00ff88'
   * @param {string} hexB - End color e.g. '#ff4400'
   * @param {number} t - Interpolation factor 0–1
   * @returns {string} Interpolated hex color string
   * @private
   */
  _interpolateHexColor(hexA, hexB, t) {
    const parse = (hex) => {
      const h = hex.replace('#', '');
      if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) {
        throw new Error(`Invalid 6-digit hex color: "${hex}"`);
      }
      return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16)
      ];
    };

    try {
      const [r1, g1, b1] = parse(hexA);
      const [r2, g2, b2] = parse(hexB);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
      lcardsLog.warn(`[RulesEngine] _interpolateHexColor failed for "${hexA}" → "${hexB}":`, e);
      return hexA;
    }
  }

  /**
   * Resolve all map_range descriptors within an animation command's params object
   * and any top-level numeric/color param fields.
   *
   * Walks `animCmd.params` (preset-specific params) and the top-level fields
   * `duration`, `delay`, and any string/object values that may be map_range
   * descriptors, resolving them to concrete values.
   *
   * @param {Object} animCmd - Raw animation command from apply.animations
   * @param {Object} hass - Home Assistant instance
   * @returns {Object} New animation command object with all map_range values resolved
   * @private
   */
  _resolveAnimCommandParams(animCmd, hass) {
    const resolved = { ...animCmd };

    // Resolve top-level animatable scalar fields that accept map_range
    const topLevelFields = ['duration', 'delay'];
    for (const field of topLevelFields) {
      if (resolved[field] !== undefined) {
        resolved[field] = this._resolveAnimParam(resolved[field], hass);
      }
    }

    // Resolve nested params object (preset-specific params like speed, color, etc.)
    if (resolved.params && typeof resolved.params === 'object') {
      const resolvedParams = {};
      for (const [key, val] of Object.entries(resolved.params)) {
        resolvedParams[key] = this._resolveAnimParam(val, hass);
      }
      resolved.params = resolvedParams;
    }

    return resolved;
  }

  /**
   * Stop animations that were started by a rule
   * Called when a rule unmatches and its animations should stop
   *
   * @param {string} ruleId - Rule ID whose animations should be stopped
   * @private
   */
  _stopRuleAnimations(ruleId) {
    const activeOverlays = this.activeRuleAnimations.get(ruleId);

    if (!activeOverlays || activeOverlays.size === 0) {
      return;
    }

    // Get AnimationManager from Core singleton (it's not in SystemsManager)
    const animationManager = window.lcards?.core?.animationManager;
    if (!animationManager) {
      lcardsLog.warn('[RulesEngine] Cannot stop rule animations - no AnimationManager available');
      return;
    }

    lcardsLog.debug(`[RulesEngine] 🛑 Stopping animations for rule: ${ruleId} (${activeOverlays.size} overlay(s))`);

    // Stop animations on each overlay that has rule-triggered animations
    // ✅ FIX: Only stop rule-triggered animations by passing trigger type
    activeOverlays.forEach(overlayId => {
      try {
        animationManager.stopAnimations(overlayId, 'on_rule');
      } catch (error) {
        lcardsLog.error(`[RulesEngine] Failed to stop animation for overlay ${overlayId}:`, error);
      }
    });

    // Clear tracking
    activeOverlays.clear();
  }

  /**
   * Resolve animation targets to overlay IDs
   * Supports: overlay (direct ID), tag, type, pattern
   *
   * @param {Object} animCmd - Animation command with targeting info
   * @returns {Array<string>} Array of overlay IDs
   * @private
   */
  _resolveAnimationTargets(animCmd) {
    const targets = [];

    // Try method first, then direct property access, then empty Map
    const overlayRegistry = this.systemsManager?.getOverlayRegistry?.()
      || this.systemsManager?._overlayRegistry
      || new Map();

    if (overlayRegistry.size === 0) {
      lcardsLog.warn('[RulesEngine] No overlay registry available for animation targeting');
      return targets;
    }

    // Direct overlay ID targeting
    if (animCmd.overlay) {
      if (overlayRegistry.has(animCmd.overlay)) {
        targets.push(animCmd.overlay);
      }
      return targets;
    }

    // Tag-based targeting
    if (animCmd.tag) {
      overlayRegistry.forEach((metadata, overlayId) => {
        if (metadata.tags && metadata.tags.includes(animCmd.tag)) {
          targets.push(overlayId);
        }
      });
      return targets;
    }

    // Type-based targeting
    if (animCmd.type) {
      overlayRegistry.forEach((metadata, overlayId) => {
        if (metadata.type === animCmd.type) {
          targets.push(overlayId);
        }
      });
      return targets;
    }

    // Pattern-based targeting (regex)
    if (animCmd.pattern) {
      try {
        const regex = new RegExp(animCmd.pattern);
        overlayRegistry.forEach((metadata, overlayId) => {
          if (regex.test(overlayId)) {
            targets.push(overlayId);
          }
        });
      } catch (error) {
        lcardsLog.error('[RulesEngine] Invalid pattern for animation targeting:', error);
      }
      return targets;
    }

    lcardsLog.warn('[RulesEngine] Animation command has no valid targeting criteria:', animCmd);
    return targets;
  }

  /**
   * Set up HASS state monitoring for rule entities
   * @param {Object} hass - Home Assistant instance
   * @returns {Promise<void>}
   */
  async setupHassMonitoring(hass) {
    // Check if already set up OR setup is in progress
    if (!hass?.connection?.subscribeEvents || this.hassUnsubscribe || this._hassMonitoringSetupInProgress) {
      if (this._hassMonitoringSetupInProgress) {
        lcardsLog.debug('[RulesEngine] HASS monitoring setup already in progress, skipping duplicate setup');
      } else {
        lcardsLog.debug('[RulesEngine] HASS monitoring already set up or unavailable');
      }
      return;
    }

    // Set flag to prevent concurrent setup attempts
    this._hassMonitoringSetupInProgress = true;

    try {
      // Extract all HASS entities referenced in rules (exclude DataSource references)
      const allEntityReferences = Array.from(this.dependencyIndex?.entityToRules.keys() || []);
      lcardsLog.trace('[RulesEngine] All entity references from dependency index:', allEntityReferences);

      // Filter out DataSource references
      const ruleEntities = allEntityReferences.filter(entityId => {
        // Skip DataSource references (contain dots and match DataSource pattern)
        if (entityId.includes('.')) {
          const sourceName = entityId.split('.')[0];
          if (this.dataSourceManager?.getSource(sourceName)) {
            lcardsLog.trace(`[RulesEngine] Filtered out DataSource reference: ${entityId}`);
            return false;
          }
        }
        lcardsLog.trace(`[RulesEngine] Including HASS entity: ${entityId}`);
        return true;
      });

      lcardsLog.trace(`[RulesEngine] HASS entity monitoring summary:`, {
        totalReferences: allEntityReferences.length,
        dataSourceReferences: allEntityReferences.length - ruleEntities.length,
        hassEntities: ruleEntities.length,
        hassEntityList: ruleEntities
      });

      if (ruleEntities.length === 0) {
        lcardsLog.debug('[RulesEngine] No HASS entities found in rules for monitoring (all references are DataSources)');
        this._hassMonitoringSetupInProgress = false;
        return;
      }

      // Cache entity list for performance
      this._hassEntities = new Set(ruleEntities);

      lcardsLog.debug(`[RulesEngine] Setting up monitoring for ${ruleEntities.length} rule entities:`, ruleEntities);

      // Direct subscription - following DataSource pattern
      this.hassUnsubscribe = await hass.connection.subscribeEvents((event) => {
        if (event.event_type === 'state_changed' && event.data?.entity_id) {
          const entityId = event.data.entity_id;

          // Performance: Use cached Set for O(1) lookup
          if (this._hassEntities.has(entityId)) {
            this._handleRuleEntityChange(entityId, event.data);
          }
        }
      }, 'state_changed');

      lcardsLog.debug('[RulesEngine] ✅ HASS state monitoring enabled');
    } catch (error) {
      lcardsLog.error('[RulesEngine] ❌ Failed to set up HASS monitoring:', error);
      throw error;
    } finally {
      // Clear flag whether setup succeeded or failed
      this._hassMonitoringSetupInProgress = false;
    }
  }

  /**
   * Handle state change for rule-referenced entities
   * @private
   * @param {string} entityId - Changed entity ID
   * @param {Object} eventData - State change event data
   */
  _handleRuleEntityChange(entityId, eventData) {
    lcardsLog.debug(`[RulesEngine] Processing entity change: ${entityId} -> ${eventData.new_state?.state}`);

    // Cache the fresh state from the event for immediate use
    if (eventData.new_state) {
      this._freshStateCache.set(entityId, {
        entity_id: entityId,
        state: eventData.new_state.state,
        attributes: eventData.new_state.attributes || {},
        last_changed: eventData.new_state.last_changed,
        last_updated: eventData.new_state.last_updated
      });
      lcardsLog.trace(`[RulesEngine] Cached fresh state for ${entityId}: ${eventData.new_state.state}`);
    }

    // Mark affected rules as dirty using existing infrastructure
    const affectedRules = this.markEntitiesDirty([entityId]);

    if (affectedRules > 0) {
      lcardsLog.debug(`[RulesEngine] Entity ${entityId} changed, marked ${affectedRules} rules dirty`);

      // Trigger re-evaluation callbacks if registered (supports multiple MSD cards)
      if (this._reEvaluationCallbacks.length > 0) {
        lcardsLog.debug(`[RulesEngine] Triggering ${this._reEvaluationCallbacks.length} re-evaluation callbacks for entity ${entityId}`);
        this._reEvaluationCallbacks.forEach((callback, index) => {
          try {
            callback();
          } catch (error) {
            lcardsLog.error(`[RulesEngine] Re-evaluation callback ${index} failed for entity ${entityId}:`, error);
          }
        });
      }
    }

    // Clear the cache after evaluation (it will be stale for next change)
    // Do this async so the callback completes first
    setTimeout(() => {
      this._freshStateCache.delete(entityId);
      lcardsLog.trace(`[RulesEngine] Cleared cached state for ${entityId}`);
    }, 100);
  }

  /**
   * Add callback for when rules need re-evaluation (supports multiple MSD cards)
   * @param {Function} callback - Re-evaluation callback function
   * @returns {number} - Index of the added callback (for removal)
   */
  setReEvaluationCallback(callback) {
    if (typeof callback !== 'function') {
      lcardsLog.warn('[RulesEngine] Re-evaluation callback must be a function');
      return;
    }

    // Add callback to array - callers should store function reference for cleanup
    this._reEvaluationCallbacks.push(callback);

    lcardsLog.debug(`[RulesEngine] Re-evaluation callback added (total: ${this._reEvaluationCallbacks.length})`);
  }

  /**
   * Remove callback for when rules need re-evaluation
   * @param {Function|number} callbackOrIndex - Callback function or its index to remove
   */
  removeReEvaluationCallback(callbackOrIndex) {
    if (typeof callbackOrIndex === 'number') {
      // Remove by index
      if (callbackOrIndex >= 0 && callbackOrIndex < this._reEvaluationCallbacks.length) {
        this._reEvaluationCallbacks.splice(callbackOrIndex, 1);
        lcardsLog.debug(`[RulesEngine] Re-evaluation callback removed by index ${callbackOrIndex} (remaining: ${this._reEvaluationCallbacks.length})`);
      } else {
        lcardsLog.warn(`[RulesEngine] Invalid callback index: ${callbackOrIndex}`);
      }
    } else if (typeof callbackOrIndex === 'function') {
      // Remove by function reference
      const index = this._reEvaluationCallbacks.indexOf(callbackOrIndex);
      if (index !== -1) {
        this._reEvaluationCallbacks.splice(index, 1);
        lcardsLog.debug(`[RulesEngine] Re-evaluation callback removed by reference (remaining: ${this._reEvaluationCallbacks.length})`);
      } else {
        lcardsLog.warn('[RulesEngine] Callback not found for removal');
      }
    } else {
      lcardsLog.warn('[RulesEngine] removeReEvaluationCallback requires function or index');
    }
  }

  /**
   * Clean up HASS subscription and resources
   * @returns {Promise<void>}
   */
  async destroy() {
    if (this.hassUnsubscribe) {
      try {
        this.hassUnsubscribe();
        this.hassUnsubscribe = null;
        this._hassEntities.clear();
        lcardsLog.debug('[RulesEngine] HASS subscription cleaned up');
      } catch (error) {
        lcardsLog.warn('[RulesEngine] Error cleaning up HASS subscription:', error);
      }
    }

    // CHANGED: Clear all re-evaluation callbacks
    this._reEvaluationCallbacks = [];
    lcardsLog.debug('[RulesEngine] All re-evaluation callbacks cleared');
  }

  /**
   * Set the DataSourceManager reference (for cases where it wasn't available during construction)
   * @param {Object} dataSourceManager - DataSourceManager instance
   */
  setDataSourceManager(dataSourceManager) {
    lcardsLog.debug(`[RulesEngine] Setting DataSourceManager with ${Object.keys(dataSourceManager?.sources || {}).length} sources`);
    this.dataSourceManager = dataSourceManager;

    // Rebuild dependency index to include DataSource references
    this.buildDependencyIndex();

    // Mark all rules dirty since DataSource conditions might now be evaluable
    this.markAllDirty();

    lcardsLog.debug(`[RulesEngine] DataSourceManager set, rebuilt dependencies and marked ${this.dirtyRules.size} rules dirty`);
  }

  getRuleDependencies(ruleId) {
    return this.dependencyIndex?.ruleToEntities.get(ruleId) || [];
  }

  getEntityDependents(entityId) {
    return Array.from(this.dependencyIndex?.entityToRules.get(entityId) || []);
  }

  // Enhanced debug and introspection methods
  getTrace() {
    const baseTrace = {
      totalRules: this.rules.length,
      dirtyRules: this.dirtyRules.size,
      lastEvaluations: Object.fromEntries(this.lastEvaluation),
      evalCounts: { ...this.evalCounts },
      dependencyStats: {
        entitiesTracked: this.dependencyIndex?.entityToRules.size || 0,
        avgRulesPerEntity: this.dependencyIndex ?
          Array.from(this.dependencyIndex.entityToRules.values()).reduce((sum, rules) => sum + rules.size, 0) / this.dependencyIndex.entityToRules.size : 0
      }
    };

    // Add trace buffer stats
    const traceStats = this.traceBuffer.getStats();
    baseTrace.traceStats = traceStats;

    return baseTrace;
  }

  getRuleTrace(ruleId, limit = 20) {
    return this.traceBuffer.getRuleHistory(ruleId, limit);
  }

  getRecentMatches(timeWindow = 60000) {
    return this.traceBuffer.getMatchedRules(timeWindow);
  }

  exportTrace(options = {}) {
    return this.traceBuffer.exportTraces(options);
  }

  clearTrace() {
    this.traceBuffer.clear();
  }

  /**
   * Get all rules in the system
   * @returns {Array} Array of rule objects
   */
  getAllRules() {
    return this.rules || [];
  }

  /**
   * Track rule patch application (for provenance tracking)
   *
   * Records which rule applied which patch to which field for debugging.
   * Called by cards when they apply rule patches.
   *
   * @param {string} fieldPath - Field path (e.g., 'style.opacity')
   * @param {any} originalValue - Value before patch
   * @param {any} patchedValue - Value after patch
   * @param {string} ruleId - Rule ID that applied the patch
   * @param {string} ruleCondition - Human-readable rule condition
   * @param {Object} cardTracker - Card's ProvenanceTracker instance
   *
   * @example
   * rulesEngine.trackRulePatch(
   *   'style.opacity',
   *   1.0,
   *   0.5,
   *   'dim-inactive',
   *   'entity.state != "on"',
   *   card._provenanceTracker
   * );
   */
  trackRulePatch(fieldPath, originalValue, patchedValue, ruleId, ruleCondition, cardTracker = null) {
    if (!cardTracker) {
      lcardsLog.trace('[RulesEngine] No card tracker provided for rule patch tracking');
      return;
    }

    // Track in card's provenance tracker
    cardTracker.trackRulePatch(fieldPath, originalValue, patchedValue, ruleId, ruleCondition);

    lcardsLog.trace(`[RulesEngine] Tracked rule patch: ${fieldPath}`, {
      ruleId,
      originalValue,
      patchedValue
    });
  }
}

/**
 * Helper function for applying overlay patches from rule results.
 * @param {Array} overlays - Array of overlay configurations
 * @param {Array} patches - Array of patch configurations from rules
 * @returns {Array} Patched overlays array
 */
export function applyOverlayPatches(overlays, patches) {
  if (!patches || patches.length === 0) {
    return overlays;
  }

  lcardsLog.trace('[RulesEngine] Applying overlay patches:', {
    overlayCount: overlays.length,
    patchCount: patches.length,
    patches: patches.map(p => ({
      id: p.id,
      type: overlays.find(o => o.id === p.id)?.type,
      styleKeys: Object.keys(p.style || {}),
      cellTarget: p.cell_target || p.cellTarget || null
    }))
  });

  const patchMap = new Map(patches.map(patch => [patch.id, patch]));

  // Removed: applyStatusGridCellPatch - status_grid overlay type was removed in v1.16.22
  // Removed: apexChartUpdates - apexchart overlay type was removed in v1.16.22

  const patchedOverlays = overlays.map(overlay => {
    const patch = patchMap.get(overlay.id);
    if (!patch) {
      return overlay;
    }
    lcardsLog.trace('[RulesEngine] Applying patch to overlay:', {
      id: overlay.id,
      type: overlay.type,
      cellTarget: patch.cell_target || patch.cellTarget,
      originalStyle: overlay.style,
      patchKeys: Object.keys(patch)
    });

    // Deep merge entire patch into overlay (not just .style)
    // This allows rules to patch text, dpad, icon, and other properties
    const patchedOverlay = deepMerge({ ...overlay }, patch);

    // Mark that this is an overlay-level patch, not cell-level
    patchedOverlay._hasOverlayLevelPatch = !patch.cell_target && !patch.cellTarget;

    lcardsLog.trace('[RulesEngine] Patched overlay result:', {
      id: patchedOverlay.id,
      type: patchedOverlay.type,
      patchedKeys: Object.keys(patch),
      hasText: !!patchedOverlay.text,
      hasStyle: !!patchedOverlay.style,
      hasFinalStyle: !!patchedOverlay.finalStyle
    });

    return patchedOverlay;
  });
  return patchedOverlays;
}

// ============================================================================
// PHASE 1: New HASS Ingestion Method (Step 1 - Add alongside existing)
// ============================================================================

