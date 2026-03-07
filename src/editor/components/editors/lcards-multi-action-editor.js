/**
 * @fileoverview LCARdS Multi-Action Editor
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
import '../shared/lcards-form-section.js';

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
        this.actions = {};
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .action-section {
                margin-bottom: var(--lcards-section-spacing, 16px);
            }
        `;
    }

    render() {
        // Show actual config values - no display defaults
        // If undefined, action-editor will show its own empty state
        const tapAction = this.actions.tap_action || { action: 'none' };
        const holdAction = this.actions.hold_action || { action: 'none' };
        const doubleTapAction = this.actions.double_tap_action || { action: 'none' };

        return html`
            <div class="action-section">
                <lcards-form-section
                    header="Tap Action"
                    icon="mdi:gesture-tap"
                    description="Action to perform when tapped (default: none)"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="5">

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ ui_action: {} }}
                        .value=${tapAction}
                        @value-changed=${(e) => this._handleActionChange('tap_action', e)}>
                    </ha-selector>
                </lcards-form-section>
            </div>

            <div class="action-section">
                <lcards-form-section
                    header="Hold Action"
                    icon="mdi:gesture-tap-hold"
                    description="Action to perform when held (default: none)"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="5">

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ ui_action: {} }}
                        .value=${holdAction}
                        @value-changed=${(e) => this._handleActionChange('hold_action', e)}>
                    </ha-selector>
                </lcards-form-section>
            </div>

            <div class="action-section">
                <lcards-form-section
                    header="Double-Tap Action"
                    icon="mdi:gesture-double-tap"
                    description="Action to perform when double-tapped (default: none)"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="5">

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ ui_action: {} }}
                        .value=${doubleTapAction}
                        @value-changed=${(e) => this._handleActionChange('double_tap_action', e)}>
                    </ha-selector>
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
        // Stop the inner action-editor event from bubbling
        event.stopPropagation();

        const actionValue = event.detail.value;

        // Build updated actions object
        const updatedActions = { ...this.actions };

        // If action is set to 'none', remove it from config entirely
        // This prevents polluting config with default/empty actions
        if (actionValue?.action === 'none') {
            delete updatedActions[actionType];
        } else {
            // Only add action if it's actually configured with something meaningful
            updatedActions[actionType] = actionValue;
        }

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
