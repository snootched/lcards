/**
 * [CoreRulesManager] Simplified rules engine for the LCARdS core
 * 🧠 Provides basic rule evaluation and overlay management for shared core infrastructure
 *
 * Extracted from MSD RulesEngine but simplified to focus on core rule processing
 * without the complex performance tracing, dependency analysis, and HASS integration
 * that the full MSD RulesEngine provides.
 */

export class CoreRulesManager {
    constructor() {
        this.rules = [];
        this.rulesById = new Map();
        this.initialized = false;
        this.evalCounts = {
            total: 0,
            matched: 0,
            failed: 0
        };

        this._log('debug', '[CoreRulesManager] 🧠 Created core rules manager');
    }

    /**
     * Simple internal logging method
     * @private
     */
    _log(level, message, ...args) {
        if (typeof window !== 'undefined' && window.lcards?.debug?.log) {
            window.lcards.debug.log(level, message, ...args);
        } else {
            // Fallback to console
            const method = console[level] || console.log;
            method(message, ...args);
        }
    }

    /**
     * Initialize the rules manager
     * @param {Array} rules - Optional array of rules to load
     */
    async initialize(rules = []) {
        if (this.initialized) {
            return;
        }

        this._log('debug', '[CoreRulesManager] 🚀 Initializing core rules manager');

        this.loadRules(rules);
        this.initialized = true;

        this._log('debug', `[CoreRulesManager] ✅ Initialized with ${this.rules.length} rules`);
    }

    /**
     * Load rules into the manager
     * @param {Array} rules - Array of rule objects
     */
    loadRules(rules) {
        this.rules = Array.isArray(rules) ? rules : [];
        this.rulesById.clear();

        this.rules.forEach(rule => {
            if (rule.id) {
                this.rulesById.set(rule.id, rule);
            }
        });

        this._log('debug', `[CoreRulesManager] 📋 Loaded ${this.rules.length} rules`);
    }

    /**
     * Add a single rule
     * @param {Object} rule - Rule object with id, when, then properties
     */
    addRule(rule) {
        if (!rule || !rule.id) {
            this._log('warn', '[CoreRulesManager] ⚠️ Cannot add rule without id', rule);
            return;
        }

        // Replace existing rule if it has the same id
        if (this.rulesById.has(rule.id)) {
            const existingIndex = this.rules.findIndex(r => r.id === rule.id);
            if (existingIndex >= 0) {
                this.rules[existingIndex] = rule;
            }
        } else {
            this.rules.push(rule);
        }

        this.rulesById.set(rule.id, rule);
        this._log('debug', `[CoreRulesManager] ➕ Added rule: ${rule.id}`);
    }

    /**
     * Remove a rule by id
     * @param {string} ruleId - Rule ID to remove
     */
    removeRule(ruleId) {
        if (!this.rulesById.has(ruleId)) {
            return false;
        }

        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        this.rulesById.delete(ruleId);

        this._log('debug', `[CoreRulesManager] ➖ Removed rule: ${ruleId}`);
        return true;
    }

    /**
     * Evaluate all rules against current entity states
     * @param {Function} getEntityState - Function to get entity state by entityId
     * @returns {Array} Array of evaluation results
     */
    evaluateAll(getEntityState) {
        const results = [];

        for (const rule of this.rules) {
            try {
                const result = this.evaluateRule(rule, getEntityState);
                if (result.matched) {
                    results.push(result);
                    this.evalCounts.matched++;
                }
                this.evalCounts.total++;
            } catch (error) {
                this._log('warn', `[CoreRulesManager] ⚠️ Rule evaluation failed for ${rule.id}:`, error);
                this.evalCounts.failed++;
            }
        }

        this._log('debug', `[CoreRulesManager] 📊 Evaluated ${this.rules.length} rules, ${results.length} matched`);
        return results;
    }

    /**
     * Evaluate a single rule
     * @param {Object} rule - Rule object to evaluate
     * @param {Function} getEntityState - Function to get entity state by entityId
     * @returns {Object} Evaluation result
     */
    evaluateRule(rule, getEntityState) {
        if (!rule.when) {
            return { ruleId: rule.id, matched: false, reason: 'No when condition' };
        }

        const conditionResult = this.evaluateConditions(rule.when, getEntityState);

        return {
            ruleId: rule.id,
            matched: conditionResult.matched,
            reason: conditionResult.reason,
            actions: rule.then || [],
            rule: rule
        };
    }

    /**
     * Evaluate rule conditions (when clause)
     * @param {Object} conditions - Conditions object with all/any/not properties
     * @param {Function} getEntityState - Function to get entity state by entityId
     * @returns {Object} Condition evaluation result
     * @private
     */
    evaluateConditions(conditions, getEntityState) {
        // Handle 'all' conditions (AND logic)
        if (conditions.all && Array.isArray(conditions.all)) {
            for (const condition of conditions.all) {
                const result = this.evaluateSingleCondition(condition, getEntityState);
                if (!result.matched) {
                    return { matched: false, reason: `All condition failed: ${result.reason}` };
                }
            }
            return { matched: true, reason: 'All conditions passed' };
        }

        // Handle 'any' conditions (OR logic)
        if (conditions.any && Array.isArray(conditions.any)) {
            for (const condition of conditions.any) {
                const result = this.evaluateSingleCondition(condition, getEntityState);
                if (result.matched) {
                    return { matched: true, reason: `Any condition passed: ${result.reason}` };
                }
            }
            return { matched: false, reason: 'No any conditions passed' };
        }

        // Handle 'not' conditions (negation)
        if (conditions.not) {
            const result = this.evaluateConditions(conditions.not, getEntityState);
            return {
                matched: !result.matched,
                reason: `Not condition: ${result.reason}`
            };
        }

        // Direct condition evaluation (backward compatibility)
        if (conditions.entity || conditions.state) {
            return this.evaluateSingleCondition(conditions, getEntityState);
        }

        return { matched: false, reason: 'No valid conditions found' };
    }

    /**
     * Evaluate a single condition
     * @param {Object} condition - Single condition object
     * @param {Function} getEntityState - Function to get entity state by entityId
     * @returns {Object} Condition evaluation result
     * @private
     */
    evaluateSingleCondition(condition, getEntityState) {
        if (!condition.entity) {
            return { matched: false, reason: 'No entity specified in condition' };
        }

        const entityState = getEntityState(condition.entity);
        if (!entityState) {
            return { matched: false, reason: `Entity ${condition.entity} not found` };
        }

        // State comparison
        if (condition.state !== undefined) {
            const matched = entityState.state === condition.state;
            return {
                matched,
                reason: `Entity ${condition.entity} state ${entityState.state} ${matched ? '==' : '!='} ${condition.state}`
            };
        }

        // Attribute comparison
        if (condition.attribute && condition.value !== undefined) {
            const attrValue = entityState.attributes?.[condition.attribute];
            const matched = attrValue === condition.value;
            return {
                matched,
                reason: `Entity ${condition.entity}.${condition.attribute} ${attrValue} ${matched ? '==' : '!='} ${condition.value}`
            };
        }

        // Existence check (rule matches if entity exists)
        return { matched: true, reason: `Entity ${condition.entity} exists` };
    }

    /**
     * Get rules that reference a specific entity
     * @param {string} entityId - Entity ID to search for
     * @returns {Array} Array of rules that reference the entity
     */
    getRulesForEntity(entityId) {
        const matchingRules = [];

        for (const rule of this.rules) {
            const entityRefs = this.extractEntityReferences(rule);
            if (entityRefs.includes(entityId)) {
                matchingRules.push(rule);
            }
        }

        return matchingRules;
    }

    /**
     * Extract entity references from a rule
     * @param {Object} rule - Rule object to analyze
     * @returns {Array} Array of entity IDs referenced in the rule
     * @private
     */
    extractEntityReferences(rule) {
        const entities = new Set();

        if (rule.when) {
            this._extractEntitiesFromConditions(rule.when, entities);
        }

        return Array.from(entities);
    }

    /**
     * Extract entities from conditions recursively
     * @param {Object} conditions - Conditions object
     * @param {Set} entities - Set to collect entity IDs
     * @private
     */
    _extractEntitiesFromConditions(conditions, entities) {
        if (conditions.entity) {
            entities.add(conditions.entity);
        }

        if (conditions.all) {
            conditions.all.forEach(cond => this._extractEntitiesFromConditions(cond, entities));
        }

        if (conditions.any) {
            conditions.any.forEach(cond => this._extractEntitiesFromConditions(cond, entities));
        }

        if (conditions.not) {
            this._extractEntitiesFromConditions(conditions.not, entities);
        }
    }

    /**
     * Get the number of rules (for testing)
     * @returns {number} Number of rules
     */
    getRulesCount() {
        return this.rules.length;
    }

    /**
     * Get rules information (for testing and debugging)
     * @returns {Object} Rules information
     */
    getRulesInfo() {
        const rulesInfo = {};

        this.rules.forEach(rule => {
            rulesInfo[rule.id] = {
                priority: rule.priority || 0,
                hasConditions: !!(rule.when && (rule.when.all || rule.when.any || rule.when.not)),
                hasActions: !!(rule.apply),
                evalCount: this.evalCounts[rule.id] || 0
            };
        });

        return {
            totalRules: this.rules.length,
            rules: rulesInfo,
            evalStats: { ...this.evalCounts }
        };
    }

    /**
     * Update HASS reference (for testing)
     * @param {Object} hass - New HASS object
     */
    updateHass(hass) {
        // Store HASS reference if needed for rule evaluation
        this.hass = hass;
        this._log('debug', `[CoreRulesManager] 🔄 HASS updated`);
    }

    /**
     * Get debug information about the rules manager
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            ruleCount: this.rules.length,
            ruleIds: Array.from(this.rulesById.keys()),
            evalCounts: { ...this.evalCounts }
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        this._log('debug', '[CoreRulesManager] 🧹 Destroying core rules manager');

        this.rules = [];
        this.rulesById.clear();
        this.initialized = false;

        // Reset counters
        this.evalCounts = {
            total: 0,
            matched: 0,
            failed: 0
        };
    }
}