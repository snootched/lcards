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
            actions: { type: Object },        // { tap_action, hold_action, double_tap_action }
            defaults: { type: Object }        // the card's own defaults, e.g. { tap_action: { action: 'toggle' } }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.actions = {};
        this.defaults = {};
    }

    /** @param {string} type @returns {{ action: string }} the card's action when the key is unset */
    _default(type) {
        return this.defaults?.[type] || { action: 'none' };
    }

    /** @param {string} type @returns {string} */
    _describe(type) {
        const verb = { tap_action: 'tapped', hold_action: 'held', double_tap_action: 'double-tapped' }[type];
        return `Action to perform when ${verb} (default: ${this._default(type).action.replace(/-/g, ' ')})`;
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
        // An unset action shows what the card does without it (a button toggles)
        const tapAction = this.actions.tap_action || this._default('tap_action');
        const holdAction = this.actions.hold_action || this._default('hold_action');
        const doubleTapAction = this.actions.double_tap_action || this._default('double_tap_action');

        return html`
            <div class="action-section">
                <lcards-form-section
                    header="Tap Action"
                    icon="mdi:gesture-tap"
                    description=${this._describe('tap_action')}
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
                    description=${this._describe('hold_action')}
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
                    description=${this._describe('double_tap_action')}
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

        // The card's own default (none, or a button's toggle) leaves the key out;
        // anything else is written, so None on a button that would toggle sticks
        if (!actionValue || JSON.stringify(actionValue) === JSON.stringify(this._default(actionType))) {
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

if (!customElements.get('lcards-multi-action-editor')) customElements.define('lcards-multi-action-editor', LCARdSMultiActionEditor);
