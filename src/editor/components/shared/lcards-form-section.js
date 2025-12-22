/**
 * LCARdS Form Section
 *
 * Collapsible section component for organizing form fields into logical groups.
 * Uses Home Assistant's ha-expansion-panel component.
 *
 * @example
 * <lcards-form-section
 *   header="Color Settings"
 *   description="Configure colors for different button states"
 *   ?expanded=${true}>
 *   <lcards-form-field path="style.color.default" label="Default Color"></lcards-form-field>
 *   <lcards-form-field path="style.color.active" label="Active Color"></lcards-form-field>
 * </lcards-form-section>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSFormSection extends LitElement {

    static get properties() {
        return {
            header: { type: String },         // Section header text
            description: { type: String },    // Optional description
            expanded: { type: Boolean },      // Expanded state
            outlined: { type: Boolean },      // Show border
            leftChevron: { type: Boolean },   // Chevron position
            icon: { type: String },           // Icon for section header
            headerLevel: { type: Number },    // Header level (h1-h6)
            secondary: { type: String },      // Secondary text for header
            noCollapse: { type: Boolean }     // Disable collapsing
        };
    }

    constructor() {
        super();
        this.header = '';
        this.description = '';
        this.expanded = false;
        this.outlined = true;
        this.leftChevron = false;
        this.icon = '';
        this.headerLevel = 4;
        this.secondary = '';
        this.noCollapse = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                margin-bottom: 12px; /* Reduced from 16px for consistency */
            }

            ha-expansion-panel {
                border-radius: var(--ha-card-border-radius, 24px);
            }

            ha-expansion-panel[outlined] {
                border: 2px solid var(--chip-background-color, #e0e0e0);
            }

            ha-expansion-panel[expanded] {
                background-color: var(--chip-background-color, #f5f5f5);
            }

            .section-content {
                padding: 12px; /* Reduced from 16px for denser layout */
            }

            .section-description {
                font-size: 14px;
                color: var(--secondary-text-color, #727272);
                margin-bottom: 12px; /* Reduced from 16px for consistency */
                line-height: 1.5;
            }

            ::slotted(*) {
                display: block;
            }

            /* Icon spacing in headers */
            h1 ha-icon,
            h2 ha-icon,
            h3 ha-icon,
            h4 ha-icon,
            h5 ha-icon,
            h6 ha-icon {
                margin-right: 8px;
                vertical-align: middle;
            }
        `;
    }

    render() {
        // Check if ha-expansion-panel is available
        const hasExpansionPanel = customElements.get('ha-expansion-panel');

        if (!hasExpansionPanel) {
            return this._renderFallback();
        }

        // Build header HTML with icon and secondary text
        const headerTag = `h${this.headerLevel}`;
        const headerContent = `
            <${headerTag} slot="header">
                ${this.icon ? `<ha-icon icon="${this.icon}"></ha-icon>` : ''}
                ${this.header}
            </${headerTag}>
        `;

        return html`
            <ha-expansion-panel
                .header=${this.header}
                ?expanded=${this.expanded}
                ?outlined=${this.outlined}
                ?leftChevron=${this.leftChevron}
                .noCollapse=${this.noCollapse}
                .secondary=${this.secondary}
                @expanded-changed=${this._handleExpandedChange}>
                ${this.icon || this.secondary ? html`
                    <div slot="header">
                        ${this.icon ? html`<ha-icon icon="${this.icon}"></ha-icon>` : ''}
                        <span>${this.header}</span>
                        ${this.secondary ? html`<span slot="secondary">${this.secondary}</span>` : ''}
                    </div>
                ` : ''}
                <div class="section-content">
                    ${this.description ? html`
                        <div class="section-description">${this.description}</div>
                    ` : ''}
                    <slot></slot>
                </div>
            </ha-expansion-panel>
        `;
    }

    /**
     * Render fallback when ha-expansion-panel is not available
     * @private
     */
    _renderFallback() {
        return html`
            <div class="section-fallback">
                <div style="
                    font-weight: 500;
                    font-size: 16px;
                    margin-bottom: 8px;
                    padding: 12px;
                    background: var(--secondary-background-color, #f5f5f5);
                    border-radius: 4px;
                    cursor: ${this.noCollapse ? 'default' : 'pointer'};
                " @click=${this.noCollapse ? null : this._toggleExpanded}>
                    ${!this.noCollapse ? (this.expanded ? '▼' : '▶') : ''}
                    ${this.icon ? html`<ha-icon icon="${this.icon}" style="margin-right: 8px;"></ha-icon>` : ''}
                    ${this.header}
                    ${this.secondary ? html`<span style="color: var(--secondary-text-color); margin-left: 8px;">${this.secondary}</span>` : ''}
                </div>
                ${this.expanded || this.noCollapse ? html`
                    <div style="padding: 12px;"> <!-- Reduced from 16px for consistency -->
                        ${this.description ? html`
                            <div class="section-description">${this.description}</div>
                        ` : ''}
                        <slot></slot>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Handle expansion state change
     * @param {CustomEvent} ev - expanded-changed event
     * @private
     */
    _handleExpandedChange(ev) {
        // Stop propagation to prevent nested sections from affecting parents
        ev.stopPropagation();

        this.expanded = ev.detail.expanded;
        // Emit a non-bubbling event so parent sections don't react to nested toggles
        this.dispatchEvent(new CustomEvent('expanded-changed', {
            detail: { expanded: this.expanded },
            bubbles: false,
            composed: false
        }));
    }

    /**
     * Toggle expanded state (for fallback)
     * @private
     */
    _toggleExpanded(ev) {
        // Stop propagation to prevent nested sections from affecting parents
        if (ev) {
            ev.stopPropagation();
        }

        this.expanded = !this.expanded;
        // Emit a non-bubbling event so parent sections don't react to nested toggles
        this.dispatchEvent(new CustomEvent('expanded-changed', {
            detail: { expanded: this.expanded },
            bubbles: false,
            composed: false
        }));
    }
}

customElements.define('lcards-form-section', LCARdSFormSection);
