/**
 * LCARdS Rules Dashboard
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
import '../common/lcards-message.js';
import '../form/lcards-form-section.js';

export class LCARdSRulesDashboard extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
            cardId: { type: String },
            hass: { type: Object },
            _rules: { type: Array, state: true },
            _sortColumn: { type: String, state: true },
            _sortDirection: { type: String, state: true } // 'asc' | 'desc'
        };
    }

    constructor() {
        super();
        this._rules = [];
        this._sortColumn = 'id';
        this._sortDirection = 'asc';
        this.cardId = '';
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
                gap: 16px;
            }

            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                margin-bottom: 16px;
            }

            .stat-card {
                background: var(--card-background-color, #fff);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 12px;
                padding: 16px;
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

            .rules-table {
                width: 100%;
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
            console.debug('[RulesDashboard] Loaded rules:', this._rules.length);
        } else {
            console.warn('[RulesDashboard] RulesManager not available or getAllRules not implemented');
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
     * Render rules table
     * @param {Array} rules - Rules to display
     * @param {Boolean} highlight - Whether to highlight targeting rules
     * @returns {TemplateResult}
     * @private
     */
    _renderRulesTable(rules, highlight = false) {
        const sortedRules = this._getSortedRules(rules);

        return html`
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
                            </tr>
                        `;
                    })}
                </tbody>
            </table>
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
                    </lcards-form-section>
                ` : html`
                    <lcards-message
                        type="info"
                        message="No rules currently target this card. Add rules in your YAML configuration to enable dynamic behavior.">
                    </lcards-message>
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
                            This dashboard is <strong>read-only</strong>. To add, edit, or remove rules,
                            edit your card's YAML configuration directly.
                        </p>
                    </div>
                </lcards-form-section>
            </div>
        `;
    }
}

customElements.define('lcards-rules-dashboard', LCARdSRulesDashboard);
