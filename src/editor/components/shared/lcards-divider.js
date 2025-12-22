/**
 * LCARdS Divider Component
 *
 * Horizontal divider for separating form sections.
 * Matches legacy formbuilder divider styling.
 *
 * @example
 * <lcards-divider></lcards-divider>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSDivider extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                margin: 16px 0;
            }

            hr {
                width: 95%;
                border: 0;
                border-top: 1px solid var(--chip-background-color, #e0e0e0);
                margin: 0 auto;
            }
        `;
    }

    render() {
        return html`<hr>`;
    }
}

customElements.define('lcards-divider', LCARdSDivider);
