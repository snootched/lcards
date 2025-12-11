/**
 * LCARdS Multi-Action Editor
 *
 * Unified view for tap, hold, and double-tap actions.
 * Provides a single interface for configuring all three action types
 * with clear visual separation and context.
 *
 * @example
 * <lcards-multi-action-editor
 *   .hass=${this.hass}
 *   .actions=${{ tap_action, hold_action, double_tap_action }}
 *   @value-changed=${this._handleActionsChange}>
 * </lcards-multi-action-editor>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import '../common/lcards-action-editor.js';

export class LCARdSMultiActionEditor extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },           // Home Assistant instance
            actions: { type: Object }         // { tap_action, hold_action, double_tap_action }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.actions = {
            tap_action: { action: 'toggle' },
            hold_action: { action: 'more-info' },
            double_tap_action: { action: 'none' }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .action-section {
                margin-bottom: 12px;
            }
        `;
    }

    render() {
        return html`
            <div class="action-section">
                <lcards-form-section
                    header="👆 Tap Action"
                    description="Action to perform when tapped"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="5">
                    
                    <lcards-action-editor
                        .hass=${this.hass}
                        .action=${this.actions.tap_action || { action: 'toggle' }}
                        @value-changed=${(e) => this._handleActionChange('tap_action', e)}>
                    </lcards-action-editor>
                </lcards-form-section>
            </div>

            <div class="action-section">
                <lcards-form-section
                    header="✋ Hold Action"
                    description="Action to perform when held"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="5">
                    
                    <lcards-action-editor
                        .hass=${this.hass}
                        .action=${this.actions.hold_action || { action: 'more-info' }}
                        @value-changed=${(e) => this._handleActionChange('hold_action', e)}>
                    </lcards-action-editor>
                </lcards-form-section>
            </div>

            <div class="action-section">
                <lcards-form-section
                    header="👆👆 Double-Tap Action"
                    description="Action to perform when double-tapped"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="5">
                    
                    <lcards-action-editor
                        .hass=${this.hass}
                        .action=${this.actions.double_tap_action || { action: 'none' }}
                        @value-changed=${(e) => this._handleActionChange('double_tap_action', e)}>
                    </lcards-action-editor>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Handle action change for a specific action type
     * @param {string} actionType - Action type ('tap_action', 'hold_action', 'double_tap_action')
     * @param {CustomEvent} event - value-changed event from action editor
     * @private
     */
    _handleActionChange(actionType, event) {
        const updatedActions = {
            ...this.actions,
            [actionType]: event.detail.value
        };

        this.actions = updatedActions;

        // Dispatch value-changed event with all actions
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: updatedActions },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-multi-action-editor', LCARdSMultiActionEditor);
