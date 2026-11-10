/**
 * [RulesEngine] Rules evaluation system - processes rules with DataSource integration and performance tracing
 * 🧠 Features dependency tracking, conditional evaluation, overlay patching, and comprehensive rule tracing
 */


import { globalTraceBuffer } from './RuleTraceBuffer.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../../core/BaseService.js';
import { compileRule, evalCompiled } from './compileConditions.js';  // ✨ NEW
import { UnifiedTemplateEvaluator } from '../templates/UnifiedTemplateEvaluator.js';  // ✨ NEW
import { resolveAnimParam, resolveAnimCommandParams } from '../animation/resolveAnimParams.js';

/** Rules that read the clock (time_between, weekday_in, random_chance) are checked again every minute, on the minute. */
export const TIME_REFRESH_MS = 60000;

/** Rule config without the engine's source-card metadata, as comparable text. */
const ruleText = (rule) => {
  const { _sourceCardId, _sourceCardType, ...own } = rule || {};
  try { return JSON.stringify(own); } catch { return null; }
};

export class RulesEngine extends BaseService {
  /**
   * @param {Array<Object>} [rules] - Initial rules
   * @param {Object|null} [dataSourceManager] - Shared DataSourceManager (rule conditions that name a data source)
   */
  constructor(rules = [], dataSourceManager = null) {
    super();
    this.rules = Array.isArray(rules) ? rules : [];
    this.rulesById = new Map();
    this.dependencyIndex = null;
    this.dirtyRules = new Set();
    this.lastEvaluation = new Map(); // ruleId -> evaluation result
    // The latest result of every rule that matches now (ruleId -> result). Every
    // evaluateDirty() returns the patches of all of these, not only of the rules it
    // evaluated itself: each card calls it, and only the first call after a change
    // finds the rules dirty.
    this._matchedResults = new Map();
    // evaluateDirty() calls run one at a time (each card's callback calls it at once)
    this._evalQueue = Promise.resolve();
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
    // dependencyIndex.entityToRules is the live entity→rules map; no separate cache needed
    this._freshStateCache = new Map(); // Cache for fresh states from events (entityId -> state object)

    // ✨ NEW: Template evaluator for Jinja2/JS conditions
    this._templateEvaluator = null;

    // ✨ NEW: Compiled rules cache
    this.compiledRules = new Map();

    // ✨ NEW: Rule-based animation tracking
    // Maps ruleId to Set of overlayIds that have active rule animations
    this.activeRuleAnimations = new Map(); // ruleId -> Map<overlayId, animDef[]> (the looping defs it started)

    // Rules that read the clock, re-checked every minute (see _syncTimeRefresh)
    /** @type {Set<string>} */
    this._timeRuleIds = new Set();
    /** @type {any} */
    this._timeRefreshTimer = null;

    // Card-owned rules (setCardRules): ruleId -> Map<ownerId, rule>, newest owner last.
    // The newest owner's definition is the live one; the rule goes when no owner is left.
    /** @type {Map<string, Map<string, Object>>} */
    this._ruleOwners = new Map();
    /** @type {Map<string, Set<string>>} ownerId -> the rule ids it owns */
    this._ownerRuleIds = new Map();
    /** @type {any} */
    this._rulesChangedTimer = null;

    // DataSourceManager entity-change listener (rules naming a data source)
    /** @type {(() => void) | null} */
    this._dataSourceUnsubscribe = null;
    if (dataSourceManager) this._watchDataSources();

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
    // Every rule is compiled again below; a removed rule's tree must not linger
    this.compiledRules.clear();

    lcardsLog.debug(`[RulesEngine] Compiling ${this.rules.length} rules...`);

    this.rules.forEach(rule => {
      try {
        const compiled = compileRule(rule, issues);
        this.compiledRules.set(rule.id, compiled);

        lcardsLog.trace(`[RulesEngine] Compiled rule ${rule.id}:`, {
          hasConditions: !!compiled.tree,
          dependencies: {
            entities: compiled.deps.entities.size
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

    this._syncTimeRefresh();
  }

  // ============================================================================
  // Time-dependent rules: checked again every minute
  // ============================================================================

  /**
   * Collect the rules that read the clock and start (or stop) the minute timer.
   * Entity rules are re-checked on state changes; nothing changes when the clock
   * passes into a time_between window, so these get a timer of their own.
   * @private
   */
  _syncTimeRefresh() {
    this._timeRuleIds = new Set();
    for (const [id, compiled] of this.compiledRules) {
      if (compiled?.deps?.time) this._timeRuleIds.add(id);
    }
    if (this._timeRuleIds.size === 0) {
      this._clearTimeRefresh();
    } else if (!this._timeRefreshTimer) {
      this._scheduleTimeRefresh();
    }
  }

  /**
   * Arm the timer for the start of the next minute (time_between has minute
   * resolution), a little after it so the clock has passed the boundary.
   * @private
   */
  _scheduleTimeRefresh() {
    const delay = TIME_REFRESH_MS - (Date.now() % TIME_REFRESH_MS) + 50;
    const timer = setTimeout(() => {
      this._timeRefreshTimer = null;
      this.refreshTimeRules();
      if (this._timeRuleIds.size > 0) this._scheduleTimeRefresh();
    }, delay);
    // Node (tests): never keep the process alive for this timer
    /** @type {any} */ (timer)?.unref?.();
    this._timeRefreshTimer = timer;
  }

  /** @private */
  _clearTimeRefresh() {
    if (this._timeRefreshTimer) {
      clearTimeout(this._timeRefreshTimer);
      this._timeRefreshTimer = null;
    }
  }

  /**
   * Mark the rules that read the clock dirty and run the re-evaluation callbacks.
   * Called by the minute timer; entity rules are left alone.
   * @returns {number} How many rules were marked dirty
   */
  refreshTimeRules() {
    let marked = 0;
    for (const id of this._timeRuleIds) {
      if (this.rulesById.has(id)) {
        this.dirtyRules.add(id);
        marked++;
      }
    }
    if (marked > 0) {
      lcardsLog.trace(`[RulesEngine] Minute tick: ${marked} time-dependent rules dirty`);
      this._runReEvaluationCallbacks('time');
    }
    return marked;
  }

  /**
   * Run every card's re-evaluation callback (each calls evaluateDirty()).
   * @param {string} reason - For the log
   * @private
   */
  _runReEvaluationCallbacks(reason) {
    if (this._reEvaluationCallbacks.length === 0) return;
    [...this._reEvaluationCallbacks].forEach((callback, index) => {
      try {
        callback();
      } catch (error) {
        lcardsLog.error(`[RulesEngine] Re-evaluation callback ${index} failed (${reason}):`, error);
      }
    });
  }

  // ============================================================================
  // Card-owned rules: replaced on config change, removed with the card
  // ============================================================================

  /**
   * Set the rules a card owns, replacing what it registered before. A rule the
   * card no longer lists is removed once no other card lists it; a changed rule
   * replaces the live one. Two cards listing the same id (the dashboard card and
   * the editor preview) share it, the newest definition live. An id held by a
   * pack rule is left alone.
   *
   * @param {string} ownerId - The card instance (its GUID), not its config id
   * @param {Array<Object>} rules - The card's `rules` (each needs an `id`)
   * @param {{sourceCardId?: string, sourceCardType?: string}} [meta] - Shown with the rule (Rules tab)
   * @returns {{added: number, replaced: number, removed: number}}
   */
  setCardRules(ownerId, rules, meta = {}) {
    const counts = { added: 0, replaced: 0, removed: 0 };
    if (!ownerId) return counts;
    const previous = this._ownerRuleIds.get(ownerId) ?? new Set();
    /** @type {Set<string>} */
    const next = new Set();

    for (const rule of Array.isArray(rules) ? rules : []) {
      if (!rule || typeof rule !== 'object' || !rule.id) {
        lcardsLog.warn('[RulesEngine] Card rule missing ID, skipping:', rule);
        continue;
      }
      // A pack (or constructor) rule with this id: not the card's to replace
      if (this.rulesById.has(rule.id) && !this._ruleOwners.has(rule.id)) {
        lcardsLog.debug(`[RulesEngine] Rule ${rule.id} is a pack rule, card rule skipped`);
        continue;
      }
      next.add(rule.id);
      // A copy carrying the source-card metadata: Home Assistant freezes card configs
      const entry = { ...rule, _sourceCardId: meta.sourceCardId ?? ownerId, _sourceCardType: meta.sourceCardType ?? 'card' };
      let owners = this._ruleOwners.get(rule.id);
      if (!owners) {
        owners = new Map();
        this._ruleOwners.set(rule.id, owners);
      }
      const held = owners.get(ownerId);
      // Unchanged: keep its place, so re-setting the same config never takes the
      // rule back from a newer owner (the editor preview)
      if (!held || ruleText(held) !== ruleText(entry)) {
        owners.delete(ownerId);
        owners.set(ownerId, entry);
      }
    }

    for (const id of previous) {
      if (!next.has(id)) this._ruleOwners.get(id)?.delete(ownerId);
    }
    if (next.size) this._ownerRuleIds.set(ownerId, next);
    else this._ownerRuleIds.delete(ownerId);

    /** @type {string[]} */
    const removedIds = [];
    for (const id of new Set([...previous, ...next])) {
      const owners = this._ruleOwners.get(id);
      const live = this.rulesById.get(id);
      if (!owners || owners.size === 0) {
        this._ruleOwners.delete(id);
        if (live) {
          this.rules = this.rules.filter(r => r !== live);
          removedIds.push(id);
          counts.removed++;
        }
        continue;
      }
      const wanted = [...owners.values()].pop();
      if (live === wanted) continue;
      if (!live) {
        this.rules.push(wanted);
        counts.added++;
      } else {
        this.rules = this.rules.map(r => (r === live ? wanted : r));
        counts.replaced++;
      }
    }

    if (counts.added || counts.replaced || counts.removed) {
      for (const id of removedIds) {
        this._matchedResults.delete(id);
        this.lastEvaluation.delete(id);
        this.dirtyRules.delete(id);
        this._stopRuleAnimations(id);
      }
      this.buildRulesIndex();
      this.buildDependencyIndex();
      this._compileRules();
      this.markAllDirty();
      this._scheduleRulesChanged();
      lcardsLog.debug(`[RulesEngine] Card ${meta.sourceCardId ?? ownerId} rules: +${counts.added} ~${counts.replaced} -${counts.removed} (total ${this.rules.length})`);
    }
    return counts;
  }

  /**
   * Remove every rule a card owns (unless another card lists it too).
   * @param {string} ownerId - The card instance (its GUID)
   * @returns {{added: number, replaced: number, removed: number}}
   */
  removeCardRules(ownerId) {
    return this.setCardRules(ownerId, []);
  }

  /**
   * Re-evaluate once after rules were added, replaced or removed (several cards
   * setting rules in one task run the callbacks once).
   * @private
   */
  _scheduleRulesChanged() {
    if (this._rulesChangedTimer) return;
    this._rulesChangedTimer = setTimeout(() => {
      this._rulesChangedTimer = null;
      if (this.dirtyRules.size > 0) this._runReEvaluationCallbacks('rules changed');
    }, 0);
  }

  // ============================================================================
  // Data sources named in conditions
  // ============================================================================

  /**
   * Listen for data source updates, so a rule naming a data source
   * (`entity: my_source` or `my_source.transformations.x`) is checked again when
   * the source changes.
   * @private
   */
  _watchDataSources() {
    this._dataSourceUnsubscribe?.();
    this._dataSourceUnsubscribe = null;
    const dsm = this.dataSourceManager;
    if (typeof dsm?.addEntityChangeListener !== 'function') return;
    this._dataSourceUnsubscribe = dsm.addEntityChangeListener((ids) => this._onDataSourceEntitiesChanged(ids));
  }

  /**
   * A data source's entity changed: mark the rules naming that source dirty.
   * @param {string[]} changedEntityIds - Home Assistant entity ids the sources read
   * @private
   */
  _onDataSourceEntitiesChanged(changedEntityIds) {
    const sources = this.dataSourceManager?.sources;
    if (!sources || typeof sources.entries !== 'function') return;
    const changed = new Set(changedEntityIds || []);
    /** @type {string[]} */
    const names = [];
    for (const [name, source] of sources.entries()) {
      if (changed.has(source?.cfg?.entity)) names.push(name);
    }
    if (names.length && this.markEntitiesDirty(names) > 0) {
      this._runReEvaluationCallbacks('data source');
    }
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

    lcardsLog.debug(`[RulesEngine] Dependency index built: ${entityToRules.size} entities across ${this.rules.length} rules`);
  }

  extractEntityReferences(rule) {
    const entities = new Set();

    if (!rule.when) return Array.from(entities);

    // Support flat form: when: { entity: ..., above: 15 }
    // as well as compound form: when: { all: [...], any: [...] }
    const flatCondition = (rule.when.entity || rule.when.entity_attr) ? [rule.when] : [];
    const conditions = [
      ...flatCondition,
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
            // Indexed under the full reference: markEntitiesDirty(sourceName) finds it
            // by prefix when the source updates. The Home Assistant subscription
            // (setupHassMonitoring) leaves data source references out.
            entities.add(condition.entity);
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

      // Entity attribute reference: `entity_attr: sensor.temp` (+ `attribute:`)
      if (typeof condition.entity_attr === 'string') {
        const entityId = condition.entity_attr.split('.').slice(0, 2).join('.');
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

    // The compiler's deps also cover nested all/any/not trees and entities read by
    // Jinja2 ({{ states('x') }}) and JavaScript (states['x']) conditions; without
    // them such rules never re-evaluated when those entities changed.
    try {
      for (const entityId of compileRule(rule, []).deps.entities) {
        if (/^[a-z_]+\.[\w-]+$/.test(entityId)) entities.add(entityId);
      }
    } catch (_) {
      // Compilation problems are reported by _compileRules().
    }

    return Array.from(entities);
  }

  markEntitiesDirty(changedEntityIds) {
    if (!Array.isArray(changedEntityIds)) {
      changedEntityIds = [changedEntityIds];
    }

    const index = this.dependencyIndex;
    if (!index) return 0; // rules not indexed yet
    let affectedRules = 0;

    changedEntityIds.forEach(entityId => {
      // Direct entity/DataSource rule matches
      const rules = index.entityToRules.get(entityId);
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
        for (const [fullRef, ruleSet] of index.entityToRules) {
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
  evaluateDirty(context = {}) {
    const run = this._evalQueue.then(() => this._evaluateDirtyNow(context));
    this._evalQueue = run.catch(() => {});
    return run;
  }

  /**
   * evaluateDirty's body: evaluate the dirty rules, then return the patches of every
   * rule that matches now.
   * @param {Object} context
   * @returns {Promise<Object>}
   * @private
   */
  async _evaluateDirtyNow(context = {}) {
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

        // Clear the dirty flag before evaluating, not after: a rule marked dirty again while it
        // is evaluated (an MSD's overlays registering during the await, then markAllDirty())
        // stays dirty and is evaluated again. Deleting it afterwards lost that mark: the rule
        // kept the patches it resolved before the overlays existed.
        this.dirtyRules.delete(rule.id);
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
          this._matchedResults.set(rule.id, result);
          this.evalCounts.matched++;

          // ✨ NEW: Execute rule animations when rule transitions to matched state
          if (!wasMatched && result.animations && result.animations.length > 0) {
            lcardsLog.debug(`[RulesEngine] Rule ${rule.id} matched - executing animations`);
            await this._executeRuleAnimations(result.animations, rule.id);
          }
        } else {
          this._matchedResults.delete(rule.id);
        }
        if (!isMatched && wasMatched) {
          // ✨ NEW: Stop animations when rule transitions from matched to unmatched
          lcardsLog.debug(`[RulesEngine] Rule ${rule.id} unmatched - stopping animations`);
          this._stopRuleAnimations(rule.id);
        }

      }

      // Performance tracking
      this.evalCounts.total += totalDirty;
      this.evalCounts.dirty += totalDirty;
      this.evalCounts.skipped += (this.rules.length - totalDirty);

      // Every rule that matches now, not only this call's: the patches are the full
      // current set for every caller (a rule removed since is dropped)
      for (const id of this._matchedResults.keys()) {
        if (!this.rulesById.has(id)) this._matchedResults.delete(id);
      }
      const aggregatedResult = this.aggregateResults([...this._matchedResults.values()]);

      // DEBUG: Log what we're returning from evaluateDirty
      lcardsLog.trace(`[RulesEngine] evaluateDirty returning:`, {
        overlayPatchesCount: aggregatedResult.overlayPatches?.length || 0,
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
  /**
   * A hass view whose `states` lookups prefer _freshStateCache (no copying).
   * @private
   */
  _hassWithFreshStates(hass) {
    const fresh = this._freshStateCache;
    if (!hass || !fresh?.size) return hass;
    const states = new Proxy(hass.states ?? {}, {
      get: (target, key) => (typeof key === 'string' && fresh.has(key) ? fresh.get(key) : target[key]),
      has: (target, key) => fresh.has(/** @type {string} */ (key)) || key in target,
    });
    return { ...hass, states };
  }

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
   * @param {Array|null} contextOverlays - Overlays available during evaluation (for initial render)
   * @param {string|null} boundEntity - Entity ID bound to the card (for JavaScript context)
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateRule(rule, getEntity, contextOverlays = null, boundEntity = null) {  // ✨ CHANGED: Accept boundEntity
    const startTime = performance.now();

    try {
      // A disabled rule (enabled: false, what the Rules tab's Disable writes) never
      // matches, so its patches and animations are removed like any unmatched rule's
      if (rule.enabled === false) return this.createUnmatchedResult(rule);

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

        // HASS access, with states from just-received state_changed events taking
        // precedence: evaluation runs on the event, before HA hands the cards (and
        // the systems manager) a new hass, so JS conditions reading states['x']
        // saw the previous state and never matched on the change.
        hass: this._hassWithFreshStates(this.systemsManager?.getHass?.()),

        // Time/date
        now: Date.now(),

        // Additional context
        // sun_elevation reads sun.sun (there is no getSunInfo on the systems manager)
        sun: { elevation: Number(getEntity?.('sun.sun')?.attributes?.elevation ?? this.systemsManager?.getHass?.()?.states?.['sun.sun']?.attributes?.elevation) },

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
        /** @type {any} */ ({ matched }),  // Simplified conditions
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

        result.animations = rule.apply.animations || [];
        result.baseSvgUpdate = rule.apply.base_svg || null;
        // the card whose rules: block holds the rule (an MSD applies only its own base_svg changes)
        result.sourceCardId = rule._sourceCardId ?? null;
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
        /** @type {any} */ ({}),
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
   * @returns {Promise<Array<Object>>} Array of overlay patches with {id, style, ...}
   * @private
   * @param {*} [contextOverlays]
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
        } else if (key === 'shape_texture' && value && typeof value === 'object' && value.config && typeof value.config === 'object') {
          // Resolve map_range descriptors in shape_texture.config (e.g. fill_pct: { map_range: {...} })
          // Mirrors how _resolveAnimCommandParams handles animation params.
          const hass = this._systemsManager?.getHass();
          const resolvedTexConfig = {};
          for (const [cfgKey, cfgVal] of Object.entries(value.config)) {
            if (cfgVal && typeof cfgVal === 'object' && cfgVal.map_range) {
              const resolved = this._resolveAnimParam(cfgVal, hass);
              resolvedTexConfig[cfgKey] = resolved !== undefined ? resolved : cfgVal;
              lcardsLog.trace(`[RulesEngine] Resolved map_range in patch ${patch.id}.shape_texture.config.${cfgKey}:`, {
                descriptor: cfgVal,
                resolved: resolvedTexConfig[cfgKey]
              });
            } else {
              resolvedTexConfig[cfgKey] = cfgVal;
            }
          }
          evaluatedPatch[key] = { ...value, config: resolvedTexConfig };
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
      animations: /** @type {any[]} */ ([]),
      baseSvgUpdate: null,  // the highest-priority base_svg update of any card
      /** @type {Record<string, any>} base_svg updates by source card id ('*' for a rule of no card) */
      baseSvgUpdates: {}
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

    // Add non-overlay results (animations, base_svg)
    ruleResults
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach(result => {
        if (result.animations) {
          aggregated.animations.push(...result.animations);
        }
        // ✅ NEW: Take the first (highest priority) base_svg update
        if (result.baseSvgUpdate && !aggregated.baseSvgUpdate) {
          aggregated.baseSvgUpdate = result.baseSvgUpdate;
        }
        if (result.baseSvgUpdate) {
          const owner = result.sourceCardId ?? '*';
          if (!(owner in aggregated.baseSvgUpdates)) aggregated.baseSvgUpdates[owner] = result.baseSvgUpdate;
        }
      });

    // DEBUG: Log what we're returning
    lcardsLog.trace(`[RulesEngine] aggregateResults returning:`, {
      overlayPatchesCount: aggregated.overlayPatches.length,
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

  createEmptyResult() {
    return {
      overlayPatches: [],
      animations: [],
      baseSvgUpdate: null,
      baseSvgUpdates: {}
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
      this.activeRuleAnimations.set(ruleId, new Map());
    }
    const activeOverlays = this.activeRuleAnimations.get(ruleId);

    for (const animCmd of animationCommands) {
      try {
        // Resolve overlay targets (supports overlay ID, tag, type, pattern), retrying
        // briefly if none are found yet — rules can evaluate and match before an MSD
        // card's own overlays (e.g. a line) finish registering with CoreSystemsManager
        // during initial pipeline setup. A rule whose condition is already true on
        // load only ever "matches" once (no re-trigger while it stays matched), so
        // without a retry the animation never gets a second chance to find its target.
        const targetOverlays = await this._resolveAnimationTargetsWithRetry(animCmd);

        if (targetOverlays.length === 0) {
          lcardsLog.debug(`[RulesEngine] No overlays found matching animation target:`, animCmd);
          continue;
        }

        lcardsLog.debug(`[RulesEngine] Triggering animation for ${targetOverlays.length} overlay(s):`, {
          targets: targetOverlays,
          preset: animCmd.preset,
          loop: animCmd.loop
        });

        // Debug-only visibility into what map_range params will resolve to — NOT
        // used for the actual animation call below. playAnimation() does its own
        // internal resolveAnimCommandParams() call (AnimationManager.js:1034) and
        // MUST be the one to see the raw, unresolved animCmd: it captures the raw
        // duration first (AnimationManager.js:1030) specifically to detect a
        // map_range descriptor and register a live-updating speed binding for
        // looping animations (Phase 10). Pre-resolving here and handing playAnimation()
        // an already-flattened plain-number duration silently defeats that — the
        // animation would start at the right initial speed but never live-adjust
        // as the bound entity changes, since the object-shaped descriptor
        // playAnimation() checks for (`typeof rawDuration === 'object'`) would
        // already be gone.
        const hass = this.systemsManager?.getHass?.();
        const resolvedAnimCmd = this._resolveAnimCommandParams(animCmd, hass);

        lcardsLog.debug(`[RulesEngine] Resolved animation params for rule ${ruleId} (debug preview only):`, {
          original: animCmd.params,
          resolved: resolvedAnimCmd.params
        });

        // Execute animation on each target overlay
        for (const overlayId of targetOverlays) {
          // Add trigger type so the animation can be tracked and stopped. Pass the
          // ORIGINAL animCmd (not resolvedAnimCmd above) — see comment above.
          const ruleAnimDef = { ...animCmd, trigger: 'on_rule' };
          await animationManager.playAnimation(overlayId, ruleAnimDef);
          if (animCmd.loop) {
            // Remember the exact definition: stopping it leaves other rules' loops on the overlay running
            if (!activeOverlays.has(overlayId)) activeOverlays.set(overlayId, []);
            activeOverlays.get(overlayId).push(ruleAnimDef);
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
    return resolveAnimParam(paramValue, hass);
  }

  // _interpolateHexColor moved to src/core/animation/resolveAnimParams.js

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
    return resolveAnimCommandParams(animCmd, hass);
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
    activeOverlays.forEach((defs, overlayId) => {
      try {
        // Only this rule's animations: another rule's loop on the same overlay keeps running
        for (const def of defs) animationManager.stopAnimations(overlayId, 'on_rule', def);
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
   * Same resolution as _resolveAnimationTargets(), but polls briefly instead of
   * giving up on the first empty result. Confirmed via live testing: a rule whose
   * condition is already true on card load can evaluate and try to target an MSD
   * overlay (e.g. a line) before that overlay finishes registering with
   * CoreSystemsManager during the card's own pipeline init — and since a
   * continuously-true condition never re-triggers a match, there was no second
   * chance for the animation to ever start. Mirrors the same poll-instead-of-a-
   * single-fixed-delay-check pattern already used for the card-picker priming fix.
   * @param {Object} animCmd
   * @param {number} [maxAttempts=15]
   * @param {number} [intervalMs=100]
   * @returns {Promise<Array<string>>}
   * @private
   */
  async _resolveAnimationTargetsWithRetry(animCmd, maxAttempts = 15, intervalMs = 100) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const targets = this._resolveAnimationTargets(animCmd);
      if (targets.length > 0) return targets;
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    return [];
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

      lcardsLog.debug(`[RulesEngine] Setting up monitoring for ${ruleEntities.length} rule entities:`, ruleEntities);

      // Direct subscription - following DataSource pattern.
      // NOTE: The listener consults dependencyIndex.entityToRules live (not a
      // frozen snapshot) so that entities added by cards that load after this
      // subscription is created are automatically covered. Map.has() is O(1).
      this.hassUnsubscribe = await hass.connection.subscribeEvents((event) => {
        if (event.event_type === 'state_changed' && event.data?.entity_id) {
          const entityId = event.data.entity_id;

          if (this.dependencyIndex?.entityToRules.has(entityId)) {
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
   * @param {Function} callback - Re-evaluation callback function (keep the reference to remove it later)
   * @returns {void}
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
    this._clearTimeRefresh();
    if (this._rulesChangedTimer) {
      clearTimeout(this._rulesChangedTimer);
      this._rulesChangedTimer = null;
    }
    this._dataSourceUnsubscribe?.();
    this._dataSourceUnsubscribe = null;
    if (this.hassUnsubscribe) {
      try {
        this.hassUnsubscribe();
        this.hassUnsubscribe = null;
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
    this._watchDataSources();
    this._templateEvaluator?.updateDataSourceManager(dataSourceManager);

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
   * Get debug information about the rules engine state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    try {
      const idx = this.dependencyIndex;
      return {
        type: 'RulesEngine',
        rulesCount: this.rules?.length || 0,
        rulesById: this.rulesById?.size || 0,
        dirtyRules: this.dirtyRules?.size || 0,
        evalCounts: this.evalCounts || {},
        hasDataSourceManager: !!this.dataSourceManager,
        dependencyIndex: idx ? {
          entityToRules: Object.fromEntries(idx.entityToRules),
          ruleToEntities: Object.fromEntries(idx.ruleToEntities),
          totalEntities: idx.entityToRules.size,
          totalRules: this.rules?.length || 0
        } : null,
        recentMatches: this.getRecentMatches(10000),
        trace: this.getTrace()
      };
    } catch (error) {
      return { type: 'RulesEngine', error: error.message };
    }
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
