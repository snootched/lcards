/**
 * @fileoverview Wrapper component for hui-card-picker.
 *
 * Provides the DOM structure that hui-card-picker expects (shadowRoot with #content div).
 */
import { LitElement, html, css } from 'lit';

export class LCARdSCardPickerWrapper extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            lovelace: { type: Object }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
            #content {
                position: relative;
                overflow-y: auto;
                max-height: 400px;
            }
        `;
    }

    render() {
        return html`
            <div id="content">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('lcards-card-picker-wrapper', LCARdSCardPickerWrapper);
