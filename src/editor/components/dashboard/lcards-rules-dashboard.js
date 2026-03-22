/**
 * @fileoverview LCARdS Rules Dashboard
 *
 * Display-only overview of rules in the system.
 * Shows all rules registered in the rules engine with highlighting
 * for rules that target the current card.
 *
 * @element lcards-rules-dashboard
 *
 * @property {Object} editor - Parent editor instance
 * @property {String} cardId - Current card ID for highlighting
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-message.js';
import '../shared/lcards-form-section.js';
import './lcards-rule-editor-dialog.js';

export class LCARdSRulesDashboard extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
            cardId: { type: String },
            hass: { type: Object },
            _rules: { type: Array, state: true },
            _sortColumn: { type: String, state: true },
            _sortDirection: { type: String, state: true }, // 'asc' | 'desc'
            _previewDialogOpen: { type: Boolean, state: true },
            _previewRule: { type: Object, state: true },
            _editDialogOpen: { type: Boolean, state: true },
            _editingRule: { type: Object, state: true },
            _editMode: { type: String, state: true },
            _confirmDeleteRule: { type: Object, state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.editor = undefined;
        /** @type {any} */
        this.hass = undefined;
        this._rules = [];
        this._sortColumn = 'id';
        this._sortDirection = 'asc';
        this.cardId = '';
        this._previewDialogOpen = false;
        this._previewRule = null;
        this._editDialogOpen = false;
        this._editingRule = null;
        this._editMode = 'add';
        this._confirmDeleteRule = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                padding: 16px 0;
            }

            .rules-dashboard {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 12px;
                margin-bottom: 12px;
            }

            .stat-card {
                background: var(--card-background-color, #fff);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 12px;
                padding: 12px;
                text-align: center;
            }

            .stat-card.highlight {
                border-color: var(--primary-color, #03a9f4);
                background: var(--primary-color, #03a9f4);
                color: white;
            }

            .stat-value {
                font-size: 32px;
                font-weight: bold;
                line-height: 1;
                margin-bottom: 8px;
            }

            .stat-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.8;
            }

            .table-wrapper {
                overflow-x: auto;
                overflow-y: visible;
                margin: 0 -12px;
                padding: 0 12px;
                mask-image: linear-gradient(
                    to right,
                    transparent,
                    black 20px,
                    black calc(100% - 20px),
                    transparent
                );
                -webkit-mask-image: linear-gradient(
                    to right,
                    transparent,
                    black 20px,
                    black calc(100% - 20px),
                    transparent
                );
            }

            .rules-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                background: var(--card-background-color, #fff);
                border-radius: 8px;
                overflow: hidden;
            }

            .rules-table th {
                background: var(--secondary-background-color, #f5f5f5);
                padding: 12px;
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: pointer;
                user-select: none;
                border-bottom: 2px solid var(--divider-color, #e0e0e0);
                white-space: nowrap;
            }

            .rules-table th:hover {
                background: var(--divider-color, #e0e0e0);
            }

            .rules-table th .sort-indicator {
                margin-left: 4px;
                opacity: 0.5;
            }

            .rules-table th.sorted .sort-indicator {
                opacity: 1;
            }

            .rules-table td {
                padding: 12px;
                border-bottom: 1px solid var(--divider-color, #e0e0e0);
                white-space: nowrap;
            }

            .rules-table tr:last-child td {
                border-bottom: none;
            }

            .rules-table tr.highlight {
                background: rgba(3, 169, 244, 0.1);
                border-left: 4px solid var(--primary-color, #03a9f4);
            }

            .rules-table tr:not(.highlight):hover {
                background: var(--secondary-background-color, #f5f5f5);
            }

            .rule-id {
                font-family: monospace;
                font-size: 13px;
                font-weight: 600;
            }

            .rule-priority {
                font-family: monospace;
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color, #000);
            }

            .rule-type {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                background: var(--secondary-background-color, #e0e0e0);
                color: var(--primary-text-color, #000);
            }

            .rule-enabled {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .status-badge {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .status-badge.enabled {
                background: #4caf50;
            }

            .status-badge.disabled {
                background: #f44336;
            }

            .rule-target {
                font-family: monospace;
                font-size: 12px;
                color: var(--secondary-text-color, #666);
            }

            .rule-conditions {
                font-size: 12px;
                color: var(--secondary-text-color, #666);
            }

            .rule-actions {
                font-size: 12px;
                font-weight: 600;
            }

            .rule-row-actions {
                display: flex;
                gap: 8px;
                align-items: center;
                justify-content: flex-end;
            }

            .action-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: var(--primary-color, #03a9f4);
                transition: all 0.2s ease;
                width: 32px;
                height: 32px;
            }

            .action-button:hover {
                background: var(--primary-color, #03a9f4);
                color: white;
            }

            .action-button ha-icon {
                --mdc-icon-size: 20px;
            }

            ha-dialog {
                --mdc-dialog-max-width: 600px;
            }

            .rule-preview-dialog {
                padding: 16px;
            }

            .rule-preview-dialog h3 {
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
            }

            .rule-preview-dialog .detail-row {
                display: grid;
                grid-template-columns: 120px 1fr;
                gap: 12px;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--divider-color, #e0e0e0);
            }

            .rule-preview-dialog .detail-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            .rule-preview-dialog .detail-label {
                font-weight: 600;
                color: var(--secondary-text-color, #666);
            }

            .rule-preview-dialog .detail-value {
                font-family: monospace;
                font-size: 13px;
            }

            .help-content {
                padding: 12px;
            }

            .help-content h4 {
                margin: 16px 0 8px 0;
                font-size: 14px;
                font-weight: 600;
            }

            .help-content h4:first-child {
                margin-top: 0;
            }

            .help-content p {
                margin: 8px 0;
                line-height: 1.6;
                color: var(--secondary-text-color, #666);
            }

            .help-content code {
                background: var(--secondary-background-color, #f5f5f5);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 12px;
            }

            .help-content pre {
                background: var(--secondary-background-color, #f5f5f5);
                padding: 12px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 12px 0;
            }

            .help-content pre code {
                background: none;
                padding: 0;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadRules();
    }

    /**
     * Load rules from the rules manager
     * @private
     */
    _loadRules() {
        const rulesManager = window.lcards?.core?.rulesManager;
        if (rulesManager && typeof rulesManager.getAllRules === 'function') {
            this._rules = rulesManager.getAllRules() || [];
            lcardsLog.debug('[RulesDashboard] Loaded rules:', this._rules.length);
        } else {
            lcardsLog.warn('⚠️ [RulesDashboard] RulesManager not available or getAllRules not implemented');
            this._rules = [];
        }
    }

    /**
     * Check if a rule targets the current card
     * @param {Object} rule - Rule object
     * @param {String} cardId - Card ID
     * @returns {Boolean}
     * @private
     */
    _isTargetingCard(rule, cardId) {
        if (!rule || !cardId) return false;

        // Check direct card ID target (old structure)
        if (rule.target === cardId || rule.cardId === cardId) {
            return true;
        }

        // Check if rule has target array (old structure)
        if (Array.isArray(rule.target) && rule.target.includes(cardId)) {
            return true;
        }

        // Check for tag-based targeting (if card has unique tag)
        if (rule.tags && Array.isArray(rule.tags)) {
            // This would need card config to check tags, but we don't have that here
            // So we'll skip tag-based for now
            return false;
        }

        // Check apply.overlays for overlay IDs (current structure)
        if (rule.apply && rule.apply.overlays) {
            const overlayIds = Object.keys(rule.apply.overlays);
            if (overlayIds.includes(cardId)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a rule is owned by (defined in) this card's config
     * @param {Object} rule - Rule object
     * @returns {Boolean}
     */
    _isOwnedRule(rule) {
        // @ts-ignore - TS2339: auto-suppressed
        const myRules = this.editor?.config?.rules || [];
        return myRules.some(r => r.id === rule.id);
    }

    // ─── Rule Edit Handlers ──────────────────────────────────────────────────

    /** Open dialog to add a new rule */
    _handleAddRule() {
        this._editingRule = null;
        this._editMode = 'add';
        this._editDialogOpen = true;
    }

    /**
     * Open dialog to edit an owned rule
     * @param {Object} rule - Rule to edit
     */
    _handleEditRule(rule) {
        // Deep clone so nested objects (e.g. `when`) cannot be mutated in place.
        // Use structuredClone for correctness (same pattern as LCARdSBaseEditor.setConfig).
        this._editingRule = (typeof globalThis.structuredClone === 'function')
            ? globalThis.structuredClone(rule)
            : JSON.parse(JSON.stringify(rule));
        this._editMode = 'edit';
        this._editDialogOpen = true;
    }

    /**
     * Request deletion of an owned rule (shows confirmation dialog)
     * @param {Object} rule - Rule to delete
     */
    _handleDeleteRule(rule) {
        this._confirmDeleteRule = rule;
    }

    /**
     * Confirm and execute deletion of the pending rule
     * @private
     */
    _confirmDelete() {
        if (!this._confirmDeleteRule) return;
        const rule = this._confirmDeleteRule;
        this._confirmDeleteRule = null;
        // @ts-ignore - TS2339: auto-suppressed
        const currentRules = this.editor?.config?.rules || [];
        const updatedRules = currentRules.filter(r => r.id !== rule.id);
        this._applyRulesChange(updatedRules);
    }

    /**
     * Cancel the pending delete
     * @private
     */
    _cancelDelete() {
        this._confirmDeleteRule = null;
    }

    /**
     * Toggle enabled state of an owned rule
     * @param {Object} rule - Rule to toggle
     */
    _handleToggleRule(rule) {
        // @ts-ignore - TS2339: auto-suppressed
        const currentRules = this.editor?.config?.rules || [];
        const updatedRules = currentRules.map(r =>
            r.id === rule.id ? { ...r, enabled: !(r.enabled !== false) } : r
        );
        this._applyRulesChange(updatedRules);
    }

    /**
     * Move an owned rule one position up (higher priority index)
     * @param {Object} rule - Rule to move
     */
    _handleMoveUp(rule) {
        // @ts-ignore - TS2339: auto-suppressed
        const currentRules = [...(this.editor?.config?.rules || [])];
        const idx = currentRules.findIndex(r => r.id === rule.id);
        if (idx <= 0) return;
        [currentRules[idx - 1], currentRules[idx]] = [currentRules[idx], currentRules[idx - 1]];
        this._applyRulesChange(currentRules);
    }

    /**
     * Move an owned rule one position down (lower priority index)
     * @param {Object} rule - Rule to move
     */
    _handleMoveDown(rule) {
        // @ts-ignore - TS2339: auto-suppressed
        const currentRules = [...(this.editor?.config?.rules || [])];
        const idx = currentRules.findIndex(r => r.id === rule.id);
        if (idx < 0 || idx >= currentRules.length - 1) return;
        [currentRules[idx], currentRules[idx + 1]] = [currentRules[idx + 1], currentRules[idx]];
        this._applyRulesChange(currentRules);
    }

    /**
     * Handle save event from the rule editor dialog
     * @param {CustomEvent} event
     */
    _handleRuleSave(event) {
        const savedRule = event.detail.rule;
        // @ts-ignore - TS2339: auto-suppressed
        const currentRules = [...(this.editor?.config?.rules || [])];

        if (this._editMode === 'add') {
            currentRules.push(savedRule);
        } else {
            const idx = currentRules.findIndex(r => r.id === savedRule.id);
            if (idx >= 0) {
                currentRules[idx] = savedRule;
            } else {
                currentRules.push(savedRule);
            }
        }

        this._applyRulesChange(currentRules);
        this._editDialogOpen = false;
        this._editingRule = null;
    }

    /** Close the rule editor dialog */
    _handleRuleDialogClose() {
        this._editDialogOpen = false;
        this._editingRule = null;
    }

    /**
     * Apply rules array change to editor config and fire config-changed
     * @param {Array} updatedRules
     * @private
     */
    _applyRulesChange(updatedRules) {
        // @ts-ignore - TS2339: auto-suppressed
        if (!this.editor) return;
        // Note: we update editor.config directly here (replacement semantics, not deep merge)
        // because we always want to replace the rules array as a whole.
        // The fireEvent call causes HA to re-call setConfig, which handles validation/YAML sync.
        // @ts-ignore - TS2339: auto-suppressed
        this.editor.config = { ...this.editor.config, rules: updatedRules };
        // @ts-ignore - TS2339: auto-suppressed
        fireEvent(this.editor, 'config-changed', { config: this.editor.config });
        this.requestUpdate();
    }

    /**
     * Sort rules by column
     * @param {String} column - Column to sort by
     * @private
     */
    _handleSort(column) {
        if (this._sortColumn === column) {
            // Toggle direction
            this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortColumn = column;
            this._sortDirection = 'asc';
        }

        this.requestUpdate();
    }

    /**
     * Get sorted rules
     * @param {Array} rules - Rules to sort
     * @returns {Array} Sorted rules
     * @private
     */
    _getSortedRules(rules) {
        const sorted = [...rules];
        const column = this._sortColumn;
        const direction = this._sortDirection;

        sorted.sort((a, b) => {
            let aVal, bVal;

            switch (column) {
                case 'id':
                    aVal = a.id || '';
                    bVal = b.id || '';
                    break;
                case 'type':
                    aVal = a.type || 'overlay';
                    bVal = b.type || 'overlay';
                    break;
                case 'priority':
                    aVal = a.priority || 0;
                    bVal = b.priority || 0;
                    break;
                case 'enabled':
                    aVal = a.enabled !== false ? 1 : 0;
                    bVal = b.enabled !== false ? 1 : 0;
                    break;
                case 'target':
                    aVal = this._getRuleTargets(a);
                    bVal = this._getRuleTargets(b);
                    break;
                case 'source':
                    aVal = this._getSourceCard(a);
                    bVal = this._getSourceCard(b);
                    break;
                case 'actions':
                    aVal = this._getActionsCount(a);
                    bVal = this._getActionsCount(b);
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }

    /**
     * Get condition summary
     * @param {Object} rule - Rule object
     * @returns {String}
     * @private
     */
    _getConditionSummary(rule) {
        // Check for 'when' (current structure)
        const conditions = rule.when || rule.conditions;

        if (!conditions) return 'No conditions';

        // Check for composition operators (all/any/not)
        const condType = conditions.all ? 'all' :
                        conditions.any ? 'any' :
                        conditions.not ? 'not' : null;

        if (condType) {
            const condList = conditions[condType];
            const count = Array.isArray(condList) ? condList.length : 0;
            return `${condType.toUpperCase()} (${count} condition${count !== 1 ? 's' : ''})`;
        }

        // Single condition (e.g., entity: light.tv, state: "on")
        if (conditions.entity) {
            let desc = `entity: ${conditions.entity}`;
            if (conditions.state) desc += `, state: ${conditions.state}`;
            if (conditions.above !== undefined) desc += `, above: ${conditions.above}`;
            if (conditions.below !== undefined) desc += `, below: ${conditions.below}`;
            return desc;
        }

        return 'Custom condition';
    }

    /**
     * Get target overlay IDs from a rule
     * @param {Object} rule - Rule object
     * @returns {String} Comma-separated overlay IDs or "Global"
     * @private
     */
    _getRuleTargets(rule) {
        // Check old-style target property
        if (rule.target) {
            return Array.isArray(rule.target) ? rule.target.join(', ') : rule.target;
        }

        // Check apply.overlays for overlay IDs (current structure)
        if (rule.apply && rule.apply.overlays) {
            const overlayIds = Object.keys(rule.apply.overlays);
            if (overlayIds.length > 0) {
                return overlayIds.join(', ');
            }
        }

        return 'Global';
    }

    /**
     * Get actions/apply changes count
     * @param {Object} rule - Rule object
     * @returns {Number} Number of actions/changes
     * @private
     */
    _getActionsCount(rule) {
        // Check old-style actions array
        if (rule.actions && Array.isArray(rule.actions)) {
            return rule.actions.length;
        }

        // Check apply section (current structure)
        if (rule.apply) {
            let count = 0;
            if (rule.apply.overlays) count += Object.keys(rule.apply.overlays).length;
            if (rule.apply.profiles_add) count += rule.apply.profiles_add.length;
            if (rule.apply.profiles_remove) count += rule.apply.profiles_remove.length;
            if (rule.apply.animations) count += rule.apply.animations.length;
            if (rule.apply.base_svg) count += 1;
            return count;
        }

        return 0;
    }

    /**
     * Get source card ID for a rule
     * @param {Object} rule - Rule object
     * @returns {String} Source card ID or 'Unknown'
     * @private
     */
    _getSourceCard(rule) {
        // Check for metadata added during registration
        if (rule._sourceCardId) {
            return rule._sourceCardId;
        }

        // Fallback: try to infer from overlay targets
        const targets = this._getRuleTargets(rule);
        if (targets && targets !== 'Global') {
            return targets.split(', ')[0]; // Return first target as likely source
        }

        return 'Unknown';
    }

    /**
     * Get source card type for a rule
     * @param {Object} rule - Rule object
     * @returns {String} Source card type or 'unknown'
     * @private
     */
    _getSourceCardType(rule) {
        return rule._sourceCardType || 'unknown';
    }

    /**
     * Handle copy YAML action
     * @param {Object} rule - Rule object
     * @private
     */
    _handleCopyYAML(rule) {
        try {
            // Convert rule object to YAML-like string
            const yaml = this._ruleToYAML(rule);

            // Copy to clipboard
            navigator.clipboard.writeText(yaml).then(() => {
                lcardsLog.info('[RulesDashboard] Copied rule YAML to clipboard:', rule.id);
                // Could show a toast notification here if available
            }).catch(err => {
                lcardsLog.error('❌ [RulesDashboard] Failed to copy to clipboard:', err);
            });
        } catch (error) {
            lcardsLog.error('❌ [RulesDashboard] Error copying rule YAML:', error);
        }
    }

    /**
     * Convert rule object to YAML format
     * @param {Object} rule - Rule object
     * @returns {String} YAML representation
     * @private
     */
    _ruleToYAML(rule) {
        const indent = (level) => '  '.repeat(level);
        let yaml = '';

        // Basic properties
        yaml += `- id: ${rule.id || 'unnamed'}\n`;
        if (rule.priority !== undefined && rule.priority !== 0) {
            yaml += `${indent(1)}priority: ${rule.priority}\n`;
        }
        if (rule.enabled === false) {
            yaml += `${indent(1)}enabled: false\n`;
        }
        if (rule.stop === true) {
            yaml += `${indent(1)}stop: true\n`;
        }

        // Conditions (when)
        if (rule.when) {
            yaml += `${indent(1)}when:\n`;
            yaml += this._conditionsToYAML(rule.when, 2);
        }

        // Apply section
        if (rule.apply) {
            yaml += `${indent(1)}apply:\n`;
            if (rule.apply.overlays) {
                yaml += `${indent(2)}overlays:\n`;
                for (const [overlayId, overlayConfig] of Object.entries(rule.apply.overlays)) {
                    yaml += `${indent(3)}${overlayId}:\n`;
                    yaml += this._objectToYAML(overlayConfig, 4);
                }
            }
        }

        return yaml;
    }

    /**
     * Convert conditions to YAML
     * @param {Object} conditions - Conditions object
     * @param {Number} level - Indentation level
     * @returns {String} YAML representation
     * @private
     */
    _conditionsToYAML(conditions, level) {
        const indent = (l) => '  '.repeat(l);
        let yaml = '';

        if (conditions.all || conditions.any || conditions.not) {
            const op = conditions.all ? 'all' : conditions.any ? 'any' : 'not';
            yaml += `${indent(level)}${op}:\n`;
            const condList = conditions[op];
            if (Array.isArray(condList)) {
                condList.forEach(cond => {
                    yaml += `${indent(level + 1)}- `;
                    if (cond.entity) {
                        yaml += `entity: ${cond.entity}\n`;
                        if (cond.state !== undefined) {
                            yaml += `${indent(level + 2)}state: "${cond.state}"\n`;
                        }
                    }
                });
            }
        } else if (conditions.entity) {
            yaml += `${indent(level)}entity: ${conditions.entity}\n`;
            if (conditions.state !== undefined) {
                yaml += `${indent(level)}state: "${conditions.state}"\n`;
            }
        }

        return yaml;
    }

    /**
     * Convert object to YAML
     * @param {Object} obj - Object to convert
     * @param {Number} level - Indentation level
     * @returns {String} YAML representation
     * @private
     */
    _objectToYAML(obj, level) {
        const indent = (l) => '  '.repeat(l);
        let yaml = '';

        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) continue;

            if (typeof value === 'object' && !Array.isArray(value)) {
                yaml += `${indent(level)}${key}:\n`;
                yaml += this._objectToYAML(value, level + 1);
            } else if (Array.isArray(value)) {
                yaml += `${indent(level)}${key}:\n`;
                value.forEach(item => {
                    if (typeof item === 'object') {
                        yaml += `${indent(level + 1)}-\n`;
                        yaml += this._objectToYAML(item, level + 2);
                    } else {
                        yaml += `${indent(level + 1)}- ${item}\n`;
                    }
                });
            } else {
                yaml += `${indent(level)}${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
            }
        }

        return yaml;
    }

    /**
     * Handle preview action
     * @param {Object} rule - Rule object
     * @private
     */
    _handlePreview(rule) {
        lcardsLog.trace('[RulesDashboard] Preview rule:', rule.id);
        this._previewRule = rule;
        this._previewDialogOpen = true;
    }

    /**
     * Close preview dialog
     * @private
     */
    _closePreviewDialog() {
        this._previewDialogOpen = false;
        this._previewRule = null;
    }

    /**
     * Render rules table
     * @param {Array} rules - Rules to display
     * @param {Boolean} highlight - Whether to highlight targeting rules
     * @returns {TemplateResult}
     * @private
     */
    _renderRulesTable(rules, highlight = false) {
        const sortedRules = this._getSortedRules(rules);

        return html`
            <div class="table-wrapper">
                <table class="rules-table">
                    <thead>
                        <tr>
                            <th @click=${() => this._handleSort('id')}
                                class=${this._sortColumn === 'id' ? 'sorted' : ''}>
                                Rule ID
                                <span class="sort-indicator">
                                    ${this._sortColumn === 'id' ?
                                        (this._sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                </span>
                            </th>
                            <th @click=${() => this._handleSort('priority')}
                                class=${this._sortColumn === 'priority' ? 'sorted' : ''}>
                                Priority
                                <span class="sort-indicator">
                                    ${this._sortColumn === 'priority' ?
                                        (this._sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                </span>
                            </th>
                            <th @click=${() => this._handleSort('enabled')}
                                class=${this._sortColumn === 'enabled' ? 'sorted' : ''}>
                                Status
                                <span class="sort-indicator">
                                    ${this._sortColumn === 'enabled' ?
                                        (this._sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                </span>
                            </th>
                            <th @click=${() => this._handleSort('source')}
                                class=${this._sortColumn === 'source' ? 'sorted' : ''}>
                                Source Card
                                <span class="sort-indicator">
                                    ${this._sortColumn === 'source' ?
                                        (this._sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                </span>
                            </th>
                            <th @click=${() => this._handleSort('target')}
                                class=${this._sortColumn === 'target' ? 'sorted' : ''}>
                                Target
                                <span class="sort-indicator">
                                    ${this._sortColumn === 'target' ?
                                        (this._sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                </span>
                            </th>
                            <th>Conditions</th>
                            <th @click=${() => this._handleSort('actions')}
                                class=${this._sortColumn === 'actions' ? 'sorted' : ''}>
                                Actions
                                <span class="sort-indicator">
                                    ${this._sortColumn === 'actions' ?
                                        (this._sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                </span>
                            </th>
                            <th>
                                <!-- Row Actions Column -->
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedRules.map(rule => {
                            const isTargeting = highlight && this._isTargetingCard(rule, this.cardId);
                            const hasStop = rule.stop === true;
                            const cardType = this._getSourceCardType(rule);
                            return html`
                                <tr class=${isTargeting ? 'highlight' : ''}>
                                    <td><span class="rule-id">${rule.id || 'N/A'}</span></td>
                                    <td>
                                        <span class="rule-priority">
                                            ${rule.priority ?? 0}${hasStop ? ' 🛑' : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="rule-enabled">
                                            <span class="status-badge ${rule.enabled !== false ? 'enabled' : 'disabled'}"></span>
                                            ${rule.enabled !== false ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="rule-target">
                                            <div style="font-family: monospace; font-size: 12px;">
                                                ${this._getSourceCard(rule)}
                                            </div>
                                            <div style="font-size: 11px; color: var(--secondary-text-color, #666); margin-top: 2px;">
                                                ${cardType}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="rule-target">
                                            ${this._getRuleTargets(rule)}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="rule-conditions">
                                            ${this._getConditionSummary(rule)}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="rule-actions">
                                            ${this._getActionsCount(rule)} action${this._getActionsCount(rule) !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="rule-row-actions">
                                            <button
                                                class="action-button"
                                                @click=${() => this._handlePreview(rule)}
                                                title="Preview rule details">
                                                <ha-icon icon="mdi:eye"></ha-icon>
                                            </button>
                                            <button
                                                class="action-button"
                                                @click=${() => this._handleCopyYAML(rule)}
                                                title="Copy rule YAML to clipboard">
                                                <ha-icon icon="mdi:content-copy"></ha-icon>
                                            </button>
                                            ${this._isOwnedRule(rule) ? html`
                                                <button
                                                    class="action-button"
                                                    @click=${() => this._handleEditRule(rule)}
                                                    title="Edit rule">
                                                    <ha-icon icon="mdi:pencil"></ha-icon>
                                                </button>
                                                <button
                                                    class="action-button"
                                                    @click=${() => this._handleToggleRule(rule)}
                                                    title="${rule.enabled !== false ? 'Disable rule' : 'Enable rule'}">
                                                    <ha-icon icon="${rule.enabled !== false ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off'}"></ha-icon>
                                                </button>
                                                <button
                                                    class="action-button"
                                                    @click=${() => this._handleMoveUp(rule)}
                                                    title="Move up">
                                                    <ha-icon icon="mdi:arrow-up"></ha-icon>
                                                </button>
                                                <button
                                                    class="action-button"
                                                    @click=${() => this._handleMoveDown(rule)}
                                                    title="Move down">
                                                    <ha-icon icon="mdi:arrow-down"></ha-icon>
                                                </button>
                                                <button
                                                    class="action-button"
                                                    style="color: var(--error-color, #f44336);"
                                                    @click=${() => this._handleDeleteRule(rule)}
                                                    title="Delete rule">
                                                    <ha-icon icon="mdi:delete"></ha-icon>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        })}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render preview dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderPreviewDialog() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._previewRule) return '';

        const rule = this._previewRule;
        const targets = this._getRuleTargets(rule);
        const conditions = this._getConditionSummary(rule);
        const actions = this._getActionsCount(rule);

        return html`
            <ha-dialog
                .open=${this._previewDialogOpen}
                @closed=${(e) => { e.stopPropagation(); this._closePreviewDialog(); }}
                header-title="Rule Details">
                <div class="rule-preview-dialog">
                    <h3>${rule.id || 'Unnamed Rule'}</h3>

                    <div class="detail-row">
                        <div class="detail-label">Rule ID:</div>
                        <div class="detail-value">${rule.id || 'N/A'}</div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-label">Priority:</div>
                        <div class="detail-value">${rule.priority ?? 0}${rule.stop ? ' (stops execution)' : ''}</div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-label">Status:</div>
                        <div class="detail-value">${rule.enabled !== false ? 'Enabled' : 'Disabled'}</div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-label">Source Card:</div>
                        <div class="detail-value">${this._getSourceCard(rule)} (${this._getSourceCardType(rule)})</div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-label">Target:</div>
                        <div class="detail-value">${targets}</div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-label">Conditions:</div>
                        <div class="detail-value">${conditions}</div>
                    </div>

                    <div class="detail-row">
                        <div class="detail-label">Actions:</div>
                        <div class="detail-value">${actions} action${actions !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div slot="footer">
                    <ha-button
                        variant="brand"
                        appearance="accent"
                        @click=${this._closePreviewDialog}
                        data-dialog="close">
                        Close
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    render() {
        const myRules = this._rules.filter(r => this._isTargetingCard(r, this.cardId));
        const totalEnabled = this._rules.filter(r => r.enabled !== false).length;

        return html`
            <div class="rules-dashboard">
                <!-- Stats Header -->
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-value">${this._rules.length}</div>
                        <div class="stat-label">Total Rules</div>
                    </div>
                    <div class="stat-card highlight">
                        <div class="stat-value">${myRules.length}</div>
                        <div class="stat-label">Targeting This Card</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalEnabled}</div>
                        <div class="stat-label">Enabled</div>
                    </div>
                </div>

                <!-- This Card's Rules -->
                ${myRules.length > 0 ? html`
                    <lcards-form-section
                        header="Rules Targeting This Card"
                        description="Rules that specifically affect this card (highlighted in table below)"
                        icon="mdi:target"
                        ?expanded=${true}>
                        ${this._renderRulesTable(myRules, true)}
                        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
                            <ha-button
                                variant="brand"
                                appearance="accent"
                                @click=${this._handleAddRule}>
                                <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                                Add Rule
                            </ha-button>
                        </div>
                    </lcards-form-section>
                ` : html`
                    <lcards-message
                        type="info"
                        message="No rules currently target this card.">
                    </lcards-message>
                    <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
                        <ha-button
                            variant="brand"
                            appearance="accent"
                            @click=${this._handleAddRule}>
                            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                            Add Rule
                        </ha-button>
                    </div>
                `}

                <!-- All Rules in System -->
                <lcards-form-section
                    header="All Rules in System"
                    description="Complete list of all rules registered in the rules engine (rules targeting this card are highlighted)"
                    icon="mdi:code-braces"
                    ?expanded=${false}>
                    ${this._rules.length > 0 ?
                        this._renderRulesTable(this._rules, true) :
                        html`<lcards-message type="info" message="No rules found in system."></lcards-message>`
                    }
                </lcards-form-section>

                <!-- Help Section -->
                <lcards-form-section
                    header="About Rules"
                    icon="mdi:help-circle"
                    ?expanded=${false}>
                    <div class="help-content">
                        <h4>What are Rules?</h4>
                        <p>
                            Rules enable dynamic card behavior based on entity states, time conditions,
                            and other criteria. When a rule's conditions are met, it applies configuration
                            patches to modify any aspect of the card (text, style, icons, etc.).
                        </p>

                        <h4>How to Add Rules</h4>
                        <p>
                            Rules are configured in YAML. Add a <code>rules</code> section to your card configuration:
                        </p>
                        <pre><code>type: custom:lcards-button
id: my_button
entity: light.living_room
rules:
  - id: light_on_rule
    priority: 100
    when:
      entity: light.living_room
      state: "on"
    apply:
      overlays:
        my_button:
          text:
            label: "Light ON"
          style:
            card:
              color:
                background:
                  active: "var(--lcars-green)"</code></pre>

                        <h4>Rule Structure</h4>
                        <p>
                            <code>id</code> - Unique identifier<br>
                            <code>priority</code> - Higher values execute first (default: 0)<br>
                            <code>stop</code> - Stop evaluating lower priority rules (default: false)<br>
                            <code>enabled</code> - Enable/disable rule (default: true)<br>
                            <code>when</code> - Conditions to check (entity states, time, etc.)<br>
                            <code>apply.overlays</code> - Configuration patches to apply (can patch any config property)
                        </p>

                        <h4>What Can Rules Patch?</h4>
                        <p>
                            Rules can modify <strong>any configuration property</strong>, including:<br>
                            • <code>text</code> - Labels, values, units<br>
                            • <code>style</code> - Colors, sizes, borders<br>
                            • <code>icon</code> - Icon name, color, size<br>
                            • <code>dpad</code> - D-pad configuration<br>
                            • Any other card configuration property
                        </p>

                        <h4>Editing Rules</h4>
                        <p>
                            Use the <strong>Add Rule</strong> button to create rules visually,
                            or edit your card's YAML configuration directly.
                        </p>
                    </div>
                </lcards-form-section>
            </div>

            ${this._renderPreviewDialog()}
            ${this._renderEditDialog()}
            ${this._renderConfirmDeleteDialog()}
        `;
    }

    /**
     * Render the rule editor dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderEditDialog() {
        return html`
            <lcards-rule-editor-dialog
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .mode=${this._editMode}
                .rule=${this._editingRule}
                .open=${this._editDialogOpen}
                // @ts-ignore - TS2339: auto-suppressed
                .editor=${this.editor}
                @save=${this._handleRuleSave}
                @cancel=${this._handleRuleDialogClose}>
            </lcards-rule-editor-dialog>
        `;
    }

    /**
     * Render the delete confirmation dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderConfirmDeleteDialog() {
        if (!this._confirmDeleteRule) return html``;
        const rule = this._confirmDeleteRule;
        return html`
            <ha-dialog
                .open=${true}
                @closed=${(e) => { e.stopPropagation(); this._cancelDelete(); }}
                header-title="Delete Rule?">
                <div style="padding: 8px 0;">
                    <p>Are you sure you want to delete rule <strong>${rule.id}</strong>?</p>
                    <p style="color: var(--secondary-text-color, #666); font-size: 13px;">This action cannot be undone.</p>
                </div>
                <div slot="footer">
                    <ha-button
                        appearance="plain"
                        @click=${this._cancelDelete}>
                        Cancel
                    </ha-button>
                    <ha-button
                        variant="brand"
                        appearance="accent"
                        style="--mdc-theme-primary: var(--error-color, #f44336);"
                        @click=${this._confirmDelete}>
                        Delete
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }
}

customElements.define('lcards-rules-dashboard', LCARdSRulesDashboard);
