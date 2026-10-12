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

import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-form-section.js';
import './lcards-rule-editor-dialog.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import '../yaml/lcards-yaml-editor.js';
import { ruleSchema, pageSchemaOptions, cardTypeOf } from './rule-apply-schema.js';
import { messageStyles } from '../../base/surface-styles.js';
import { renderLauncher, launcherStyles } from '../shared/launcher.js';
import { showConfirmDeleteDialog } from '../../../views/layout-edit-dialogs.js';
import { DOCS_BASE_URL } from '../shared/docs-links.js';

const RULES_DOCS_URL = `${DOCS_BASE_URL}/core/rules/`;

/** Sortable table columns: [key, heading] (null key: not sortable). */
/** What a pending rule waits for, shown in its Status cell. */
const PENDING = {
    new: 'New: refresh if it has no effect',
    changed: 'Changed: refresh to apply',
    removed: 'Removed: refresh to apply',
};

/** Same rule content, ignoring the engine's `_` keys and key order. */
function sameRule(a, b) {
    const canon = (v) => Array.isArray(v) ? v.map(canon)
        : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).filter(k => !k.startsWith('_')).sort().map(k => [k, canon(v[k])]))
        : v;
    return JSON.stringify(canon(a)) === JSON.stringify(canon(b));
}

const COLUMNS = [
    ['id', 'Rule'], ['priority', 'Priority'], ['enabled', 'Status'], ['source', 'Source card'],
    ['target', 'Target'], [null, 'Conditions'], ['actions', 'Changes'],
];

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
            _previewEditable: { type: Boolean, state: true },
            _previewError: { type: String, state: true },
            _editDialogOpen: { type: Boolean, state: true },
            _editingRule: { type: Object, state: true },
            _editMode: { type: String, state: true }
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
        this._previewEditable = false;
        this._previewError = '';
        this._refreshTimer = null;
        this._editDialogOpen = false;
        this._editingRule = null;
        this._editMode = 'add';
    }

    static get styles() {
        return [messageStyles, launcherStyles, css`
            :host {
                display: block;
                padding: var(--ha-space-4) 0;
            }

            .rules-dashboard {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .empty {
                margin: 0;
            }

            /* The table on the black inset, so rows read clearly on any card background */
            .table-wrapper {
                overflow-x: auto;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-2) var(--ha-space-3);
            }

            .pending {
                margin-top: 2px;
                font-size: 12px;
                color: var(--warning-color);
            }

            ha-dialog.rule-details {
                --ha-dialog-width-md: min(900px, 95vw);
            }

            .rules-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                font-size: 13px;
            }

            .rules-table th {
                padding: var(--ha-space-2) var(--ha-space-3);
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                color: var(--secondary-text-color);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color);
                white-space: nowrap;
            }

            .rules-table th.sortable {
                cursor: pointer;
                user-select: none;
            }

            .rules-table th.sortable:hover,
            .rules-table th.sorted {
                color: var(--primary-text-color);
            }

            .rules-table th ha-icon {
                --mdc-icon-size: 14px;
                margin-left: var(--ha-space-1);
                opacity: 0.5;
            }

            .rules-table th.sorted ha-icon {
                opacity: 1;
            }

            .rules-table td {
                padding: var(--ha-space-2) var(--ha-space-3);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                white-space: nowrap;
                color: var(--primary-text-color);
            }

            .rules-table tr:last-child td {
                border-bottom: none;
            }

            .rules-table tbody tr:hover {
                background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
            }

            .rules-table tr.highlight {
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
                box-shadow: inset var(--ha-border-width-lg) 0 0 var(--primary-color);
            }

            .mono {
                font-family: var(--code-font-family, monospace);
            }

            .rule-id {
                font-weight: 600;
            }

            .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .muted {
                color: var(--secondary-text-color);
            }

            .status {
                display: inline-flex;
                align-items: center;
                gap: var(--ha-space-1);
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: var(--ha-border-radius-circle);
                background: var(--error-color);
            }

            .status-dot.enabled {
                background: var(--success-color);
            }

            .stop-icon {
                --mdc-icon-size: 16px;
                color: var(--warning-color);
                vertical-align: middle;
                margin-left: var(--ha-space-1);
            }

            .row-actions {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .row-actions .danger {
                color: var(--error-color);
            }

            /* Rule details dialog */
            .details {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .details-inset {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-2) var(--ha-space-4);
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                gap: var(--ha-space-4);
                padding: 6px 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .info-row:last-child {
                border-bottom: none;
            }

            .info-row .label {
                font-weight: 500;
                color: var(--secondary-text-color);
            }

            .info-row .value {
                font-family: var(--code-font-family, monospace);
                text-align: right;
                overflow-wrap: anywhere;
            }

            .details ha-code-editor {
                --code-mirror-max-height: 40vh;
            }
        `];
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadRules();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this._refreshTimer);
    }

    willUpdate() {
        // The engine adds a card's new rules when the card renders its new config
        this._loadRules();
    }

    /**
     * Load rules from the rules manager
     * @private
     */
    _loadRules() {
        const rulesManager = window.lcards?.core?.rulesManager;
        if (rulesManager && typeof rulesManager.getAllRules === 'function') {
            this._rules = [...(rulesManager.getAllRules() || [])];
        } else {
            lcardsLog.warn('⚠️ [RulesDashboard] RulesManager not available or getAllRules not implemented');
            this._rules = [];
        }
    }

    /**
     * The rules to list: the engine's, with this card's own rules taken from its
     * config. The engine loads a card's rules once per page load (and skips IDs it
     * already has), so an edited or removed rule stays live until a refresh: those
     * rows carry `_pending`.
     * @returns {Array<Object>}
     * @private
     */
    _rows() {
        // @ts-ignore - TS2339: auto-suppressed
        const config = this.editor?.config ?? {};
        const own = config.rules || [];
        const ownIds = new Set(own.map(r => r.id));
        const live = new Map(this._rules.map(r => [r.id, r]));
        const rows = [];
        for (const rule of this._rules) {
            if (ownIds.has(rule.id)) continue;
            const removed = this.cardId && rule._sourceCardId === this.cardId;
            rows.push(removed ? { ...rule, _pending: 'removed' } : rule);
        }
        for (const rule of own) {
            const running = live.get(rule.id);
            rows.push({
                ...rule,
                _sourceCardId: running?._sourceCardId ?? (this.cardId || 'this card'),
                _sourceCardType: running?._sourceCardType ?? `lcards-${cardTypeOf(config)}`,
                _pending: !running ? 'new' : sameRule(running, rule) ? undefined : 'changed',
            });
        }
        return rows;
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
        if (rule._pending === 'removed') return false;
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
     * Delete an owned rule, after an HA confirm
     * @param {Object} rule - Rule to delete
     */
    async _handleDeleteRule(rule) {
        const confirmed = await showConfirmDeleteDialog({
            title: `Delete ${rule.id}?`,
            message: "It's removed from this card's config. Cards keep its effect until the page is refreshed.",
        });
        if (!confirmed) return;
        // @ts-ignore - TS2339: auto-suppressed
        const currentRules = this.editor?.config?.rules || [];
        this._applyRulesChange(currentRules.filter(r => r.id !== rule.id));
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
        // Look again once the card has rendered the new config (a new rule registers then)
        clearTimeout(this._refreshTimer);
        this._refreshTimer = setTimeout(() => this.requestUpdate(), 1000);
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
     * The rule as YAML (a list item, ready for a card's `rules:`), without the
     * engine's own `_` keys.
     * @param {Object} rule
     * @returns {string}
     */
    _ruleYaml(rule) {
        const clean = Object.fromEntries(Object.entries(rule).filter(([k]) => !k.startsWith('_')));
        return configToYaml([clean]);
    }

    /**
     * Copy the rule's YAML to the clipboard
     * @param {Object} rule
     * @private
     */
    _handleCopyYAML(rule) {
        copyTextToClipboard(this._ruleYaml(rule)).then(ok => {
            if (ok) lcardsLog.info('[RulesDashboard] Copied rule YAML to clipboard:', rule.id);
        });
    }

    /**
     * Open the rule's YAML: editable for this card's own rules, read-only otherwise
     * @param {Object} rule
     * @param {boolean} [editable]
     * @private
     */
    _handlePreview(rule, editable = false) {
        this._previewRule = rule;
        this._previewEditable = editable;
        this._previewError = '';
        this._previewDialogOpen = true;
    }

    /** @private */
    _closePreviewDialog() {
        this._previewDialogOpen = false;
        this._previewRule = null;
        this._previewError = '';
    }

    /**
     * Save the rule from its YAML (a mapping, or a one-item list as copied)
     * @private
     */
    _savePreviewYaml() {
        const yamlEditor = /** @type {any} */ (this.renderRoot.querySelector('ha-dialog.rule-details lcards-yaml-editor'));
        yamlEditor?.flush?.();
        let rule;
        try {
            rule = yamlToConfig(yamlEditor?.value ?? '');
        } catch (err) {
            this._previewError = `YAML error: ${err.message}`;
            return;
        }
        if (Array.isArray(rule)) rule = rule[0];
        if (!rule || typeof rule !== 'object' || typeof rule.id !== 'string' || !rule.id.trim()) {
            this._previewError = 'A rule needs an id.';
            return;
        }
        // @ts-ignore - TS2339: auto-suppressed
        const rules = [...(this.editor?.config?.rules || [])];
        const index = rules.findIndex(r => r.id === this._previewRule.id);
        if (rule.id !== this._previewRule.id && rules.some(r => r.id === rule.id)) {
            this._previewError = `This card already has a rule with id ${rule.id}.`;
            return;
        }
        if (index >= 0) rules[index] = rule; else rules.push(rule);
        this._applyRulesChange(rules);
        this._closePreviewDialog();
    }

    /**
     * Render rules table
     * @param {Array} rules - Rules to display
     * @param {Boolean} highlight - Whether to highlight rules targeting this card
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderRulesTable(rules, highlight = false) {
        const sortedRules = this._getSortedRules(rules);
        const sortIcon = (key) => this._sortColumn !== key ? 'mdi:swap-vertical'
            : this._sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down';

        return html`
            <div class="table-wrapper">
                <table class="rules-table">
                    <thead>
                        <tr>
                            ${COLUMNS.map(([key, label]) => key ? html`
                                <th class="sortable ${this._sortColumn === key ? 'sorted' : ''}"
                                    @click=${() => this._handleSort(key)}>
                                    ${label}<ha-icon icon=${sortIcon(key)}></ha-icon>
                                </th>
                            ` : html`<th>${label}</th>`)}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedRules.map(rule => {
                            const enabled = rule.enabled !== false;
                            const changes = this._getActionsCount(rule);
                            return html`
                                <tr class=${highlight && this._isTargetingCard(rule, this.cardId) ? 'highlight' : ''}>
                                    <td class="mono rule-id">${rule.id || '-'}</td>
                                    <td class="mono">
                                        ${rule.priority ?? 0}
                                        ${rule.stop === true ? html`<ha-icon class="stop-icon" icon="mdi:octagon" title="Stops lower-priority rules"></ha-icon>` : nothing}
                                    </td>
                                    <td>
                                        <span class="status">
                                            <span class="status-dot ${enabled ? 'enabled' : ''}"></span>
                                            ${enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        ${rule._pending ? html`<div class="pending">${PENDING[rule._pending]}</div>` : nothing}
                                    </td>
                                    <td>
                                        <div class="mono">${this._getSourceCard(rule)}</div>
                                        <div class="sub">${this._getSourceCardType(rule)}</div>
                                    </td>
                                    <td class="mono muted">${this._getRuleTargets(rule)}</td>
                                    <td class="muted">${this._getConditionSummary(rule)}</td>
                                    <td>${changes}</td>
                                    <td>${this._renderRowActions(rule, enabled)}</td>
                                </tr>
                            `;
                        })}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * A row's buttons: details and copy for every rule; edit, toggle, move and
     * delete for the rules in this card's config.
     * @private
     */
    _renderRowActions(rule, enabled) {
        const button = (label, icon, onClick, cls = '') => html`
            <ha-icon-button class=${cls} .label=${label} title=${label} @click=${onClick}>
                <ha-icon icon=${icon}></ha-icon>
            </ha-icon-button>
        `;
        return html`
            <div class="row-actions">
                ${this._isOwnedRule(rule)
                    ? button('Edit as YAML', 'mdi:code-braces', () => this._handlePreview(rule, true))
                    : button('View rule', 'mdi:eye', () => this._handlePreview(rule))}
                ${button('Copy rule YAML', 'mdi:content-copy', () => this._handleCopyYAML(rule))}
                ${this._isOwnedRule(rule) ? html`
                    ${button('Edit rule', 'mdi:pencil', () => this._handleEditRule(rule))}
                    ${button(enabled ? 'Disable rule' : 'Enable rule', enabled ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off', () => this._handleToggleRule(rule))}
                    ${button('Move up', 'mdi:arrow-up', () => this._handleMoveUp(rule))}
                    ${button('Move down', 'mdi:arrow-down', () => this._handleMoveDown(rule))}
                    ${button('Delete rule', 'mdi:delete', () => this._handleDeleteRule(rule), 'danger')}
                ` : nothing}
            </div>
        `;
    }

    /**
     * The rule dialog: a summary and the rule's YAML (editable for this card's rules)
     * @private
     */
    _renderPreviewDialog() {
        if (!this._previewRule) return nothing;

        const rule = this._previewRule;
        const editable = this._previewEditable;
        const changes = this._getActionsCount(rule);
        const clean = Object.fromEntries(Object.entries(rule).filter(([k]) => !k.startsWith('_')));
        const rows = [
            ['Source card', `${this._getSourceCard(rule)} (${this._getSourceCardType(rule)})`],
            ['Target', this._getRuleTargets(rule)],
            ['Conditions', this._getConditionSummary(rule)],
            ['Changes', `${changes} change${changes !== 1 ? 's' : ''}`],
        ];

        return html`
            <ha-dialog
                class="rule-details"
                .open=${this._previewDialogOpen}
                ?prevent-scrim-close=${editable}
                @closed=${(e) => { e.stopPropagation(); if (e.target === e.currentTarget) this._closePreviewDialog(); }}
                header-title=${editable ? `Edit ${rule.id} as YAML` : (rule.id || 'Rule')}>
                <div class="details">
                    <div class="details-inset">
                        ${rows.map(([label, value]) => html`
                            <div class="info-row"><span class="label">${label}</span><span class="value">${value}</span></div>
                        `)}
                    </div>
                    ${editable ? html`<p class="hint">The whole rule: id, when, apply, priority, ... Ctrl+Space lists what can go next.</p>` : nothing}
                    <lcards-yaml-editor
                        .hass=${this.hass}
                        .schema=${ruleSchema(pageSchemaOptions(this.editor))}
                        .value=${configToYaml(clean)}
                        .readOnly=${!editable}>
                    </lcards-yaml-editor>
                    ${this._previewError ? html`<div class="banner error">${this._previewError}</div>` : nothing}
                </div>
                <div slot="footer">
                    <ha-button appearance="plain" @click=${() => this._handleCopyYAML(rule)}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy YAML
                    </ha-button>
                    ${editable ? html`
                        <ha-button appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button variant="brand" @click=${() => this._savePreviewYaml()}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save
                        </ha-button>
                    ` : html`<ha-button appearance="plain" data-dialog="close">Close</ha-button>`}
                </div>
            </ha-dialog>
        `;
    }

    render() {
        const rows = this._rows();
        const myRules = rows.filter(r => r._pending !== 'removed' && this._isTargetingCard(r, this.cardId));
        const active = rows.filter(r => r._pending !== 'removed');
        const totalEnabled = active.filter(r => r.enabled !== false).length;

        return html`
            <div class="rules-dashboard">
                ${renderLauncher({
                    icon: 'mdi:format-list-checks',
                    title: 'Rules',
                    description: "Rules change cards' settings while their conditions are met, on any card on the page.",
                    stats: [
                        { value: myRules.length, label: 'targeting this card' },
                        { value: active.length, label: 'on this page' },
                        { value: totalEnabled, label: 'enabled' },
                    ],
                    actions: [
                        { label: 'Add rule', icon: 'mdi:plus', onClick: () => this._handleAddRule() },
                        { label: 'Rules guide', icon: 'mdi:book-open-variant', onClick: () => window.open(RULES_DOCS_URL, '_blank', 'noopener') },
                    ],
                })}

                <div class="banner info refresh-notice">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    New rules apply right away. Changes to an existing rule, or removing one, apply after a page refresh.
                </div>

                <lcards-form-section
                    header="Rules targeting this card"
                    icon="mdi:target"
                    ?expanded=${true}>
                    ${myRules.length > 0
                        ? this._renderRulesTable(myRules)
                        : html`<p class="hint empty">No rules target this card. Add one above, or write them on the YAML tab.</p>`}
                </lcards-form-section>

                <lcards-form-section
                    header="All rules on this page"
                    description="Rules that target this card are highlighted."
                    icon="mdi:format-list-bulleted"
                    ?expanded=${false}>
                    ${rows.length > 0
                        ? this._renderRulesTable(rows, true)
                        : html`<p class="hint empty">No rules are registered on this page.</p>`}
                </lcards-form-section>
            </div>

            ${this._renderPreviewDialog()}
            ${this._renderEditDialog()}
        `;
    }

    /**
     * Render the rule editor dialog
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderEditDialog() {
        return html`
            <lcards-rule-editor-dialog
                .hass=${this.hass}
                .mode=${this._editMode}
                .rule=${this._editingRule}
                .open=${this._editDialogOpen}
                .editor=${this.editor}
                @save=${this._handleRuleSave}
                @cancel=${this._handleRuleDialogClose}>
            </lcards-rule-editor-dialog>
        `;
    }
}

if (!customElements.get('lcards-rules-dashboard')) customElements.define('lcards-rules-dashboard', LCARdSRulesDashboard);
