/**
 * @fileoverview LCARdS Message Component
 *
 * Display informational messages, warnings, or errors in the editor.
 * Wraps ha-alert for consistency with legacy formbuilder.
 *
 * @example
 * <lcards-message
 *   type="info"
 *   title="Configuration Note"
 *   message="This card requires an entity to be selected.">
 * </lcards-message>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSMessage extends LitElement {

    static get properties() {
        return {
            type: { type: String },      // Message type: info, warning, error, success
            title: { type: String },     // Optional title
            message: { type: String }    // Message content
        };
    }

    constructor() {
        super();
        this.type = 'info';
        this.title = '';
        this.message = '';
    }

    static get styles() {
        return css`
            :host {
                display: block;
                margin-bottom: 12px;
            }

            .form-control {
                padding: 2px 8px;
            }
        `;
    }

    render() {
        return html`
            <div class="form-control">
                <ha-alert alert-type="${this.type}" .title="${this.title || ''}">
                    ${this.message}
                    <slot></slot>
                </ha-alert>
            </div>
        `;
    }
}

customElements.define('lcards-message', LCARdSMessage);
