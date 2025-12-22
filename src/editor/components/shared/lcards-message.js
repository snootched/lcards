/**
 * LCARdS Message Component
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
                margin-bottom: 16px;
            }

            .form-control {
                padding: 2px 8px;
            }
        `;
    }

    render() {
        // Check if ha-alert is available
        const hasAlert = customElements.get('ha-alert');

        if (!hasAlert) {
            return this._renderFallback();
        }

        return html`
            <div class="form-control">
                <ha-alert alert-type="${this.type}" .title="${this.title || ''}">
                    ${this.message}
                    <slot></slot>
                </ha-alert>
            </div>
        `;
    }

    /**
     * Render fallback when ha-alert is not available
     * @private
     */
    _renderFallback() {
        const colors = {
            info: { bg: '#e3f2fd', color: '#1976d2', border: '#1976d2' },
            warning: { bg: '#fff3e0', color: '#f57c00', border: '#f57c00' },
            error: { bg: '#ffebee', color: '#d32f2f', border: '#d32f2f' },
            success: { bg: '#e8f5e9', color: '#388e3c', border: '#388e3c' }
        };

        const style = colors[this.type] || colors.info;

        return html`
            <div style="
                background: ${style.bg};
                color: ${style.color};
                border-left: 4px solid ${style.border};
                padding: 12px 16px;
                border-radius: 4px;
                margin: 8px 0;
            ">
                ${this.title ? html`
                    <div style="font-weight: 600; margin-bottom: 4px;">
                        ${this.title}
                    </div>
                ` : ''}
                <div>${this.message}</div>
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('lcards-message', LCARdSMessage);
