/**
 * LCARdS Grid Layout
 *
 * Two-column responsive grid layout for form fields.
 * Automatically stacks to single column on mobile devices.
 *
 * @example
 * <lcards-grid-layout>
 *   <lcards-form-field path="grid_columns" label="Grid Columns"></lcards-form-field>
 *   <lcards-form-field path="grid_rows" label="Grid Rows"></lcards-form-field>
 * </lcards-grid-layout>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSGridLayout extends LitElement {

    static get properties() {
        return {
            columns: { type: Number },     // Number of columns (default: 2)
            gap: { type: String }          // Gap between items (default: '16px')
        };
    }

    constructor() {
        super();
        this.columns = 2;
        this.gap = '12px'; /* Changed from 8px to 12px per Phase 2 requirements */
    }

    static get styles() {
        return css`
            :host {
                display: block;
                margin-bottom: 12px; /* Reduced from 16px for consistency */
            }

            .grid-layout {
                display: grid;
                gap: var(--grid-gap, 12px); /* Changed from 8px to 12px for tighter layout */
                grid-template-columns: var(--grid-columns, 1fr 1fr);
            }

            @media (max-width: 768px) {
                .grid-layout {
                    grid-template-columns: 1fr;
                }
            }

            ::slotted(*) {
                display: block;
            }

            /* Match legacy two-controls styling */
            ::slotted(lcards-form-field) {
                margin-bottom: 0;
            }
        `;
    }

    render() {
        const columnsTemplate = Array(this.columns).fill('1fr').join(' ');

        return html`
            <div class="grid-layout" style="
                --grid-gap: ${this.gap};
                --grid-columns: ${columnsTemplate};
            ">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('lcards-grid-layout', LCARdSGridLayout);
