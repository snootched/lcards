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

        // Check direct card ID target
        if (rule.target === cardId || rule.cardId === cardId) {
            return true;
        }

        // Check if rule has target array
        if (Array.isArray(rule.target) && rule.target.includes(cardId)) {
            return true;
        }

        // Check for tag-based targeting (if card has unique tag)
        if (rule.tags && Array.isArray(rule.tags)) {
            // This would need card config to check tags, but we don't have that here
            // So we'll skip tag-based for now
            return false;
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
                case 'enabled':
                    aVal = a.enabled !== false ? 1 : 0;
                    bVal = b.enabled !== false ? 1 : 0;
                    break;
                case 'target':
                    aVal = a.target || '';
                    bVal = b.target || '';
                    break;
                case 'actions':
                    aVal = (a.actions?.length || 0);
                    bVal = (b.actions?.length || 0);
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
        if (!rule.conditions) return 'No conditions';

        const condType = rule.conditions.all ? 'all' :
                        rule.conditions.any ? 'any' :
                        rule.conditions.not ? 'not' : 'unknown';

        const conditions = rule.conditions.all || rule.conditions.any || rule.conditions.not || [];
        const count = Array.isArray(conditions) ? conditions.length : 0;

        return `${condType.toUpperCase()} (${count} condition${count !== 1 ? 's' : ''})`;
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
                        <th @click=${() => this._handleSort('type')}
                            class=${this._sortColumn === 'type' ? 'sorted' : ''}>
                            Type
                            <span class="sort-indicator">
                                ${this._sortColumn === 'type' ? 
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
                        return html`
                            <tr class=${isTargeting ? 'highlight' : ''}>
                                <td><span class="rule-id">${rule.id || 'N/A'}</span></td>
                                <td>
                                    <span class="rule-type">${rule.type || 'overlay'}</span>
                                </td>
                                <td>
                                    <span class="rule-enabled">
                                        <span class="status-badge ${rule.enabled !== false ? 'enabled' : 'disabled'}"></span>
                                        ${rule.enabled !== false ? 'Enabled' : 'Disabled'}
                                    </span>
                                </td>
                                <td>
                                    <span class="rule-target">
                                        ${rule.target ? 
                                            (Array.isArray(rule.target) ? rule.target.join(', ') : rule.target) : 
                                            'Global'}
                                    </span>
                                </td>
                                <td>
                                    <span class="rule-conditions">
                                        ${this._getConditionSummary(rule)}
                                    </span>
                                </td>
                                <td>
                                    <span class="rule-actions">
                                        ${rule.actions?.length || 0} action${rule.actions?.length !== 1 ? 's' : ''}
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
        const otherRules = this._rules.filter(r => !this._isTargetingCard(r, this.cardId));
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
                        description="Rules that specifically affect this card"
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
                    description="Complete list of rules registered in the rules engine"
                    icon="mdi:code-braces"
                    ?expanded=${false}>
                    ${otherRules.length > 0 ? 
                        this._renderRulesTable(otherRules, false) : 
                        html`<lcards-message type="info" message="No other rules found."></lcards-message>`
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
                            and other criteria. When a rule's conditions are met, it can modify card 
                            configuration, trigger animations, or perform other actions.
                        </p>
                        
                        <h4>How to Add Rules</h4>
                        <p>
                            Rules are configured in YAML. Add a <code>rules</code> section to your card configuration:
                        </p>
                        <pre><code>type: custom:lcards-button
entity: light.living_room
rules:
  - id: rule_night_mode
    conditions:
      all:
        - entity: sun.sun
          state: below_horizon
    actions:
      - type: modify_config
        config:
          style:
            color:
              default: "#0099ff"</code></pre>
                        
                        <h4>Targeting Rules</h4>
                        <p>
                            Rules can target specific cards by ID or tag. To target this card, 
                            use the card's unique ID in the rule's <code>target</code> field.
                        </p>

                        <h4>Editing Rules</h4>
                        <p>
                            This dashboard is <strong>read-only</strong>. To add, edit, or remove rules, 
                            edit your card's YAML configuration directly using the YAML tab.
                        </p>
                    </div>
                </lcards-form-section>
            </div>
        `;
    }
}

customElements.define('lcards-rules-dashboard', LCARdSRulesDashboard);
