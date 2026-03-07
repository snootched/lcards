/**
 * @fileoverview LCARdS Dialog Wrapper
 *
 * A wrapper around ha-dialog that automatically handles the 'closed' event
 * from child components like ha-select to prevent premature dialog closure.
 *
 * @element lcards-dialog
 * @fires closed - When dialog is actually closed (user action)
 *
 * Usage: Replace <ha-dialog> with <lcards-dialog> in any component that
 * contains ha-select or other components that fire 'closed' events.
 *
 * @property {Boolean} open - Whether dialog is open
 * @property {String} heading - Dialog heading text
 * @property {String} scrimClickAction - Action on scrim click (default: "")
 * @property {String} escapeKeyAction - Action on escape key (default: "")
 */

import { LitElement, html, css } from 'lit';

export class LCARdSDialog extends LitElement {
  static get properties() {
    return {
      open: { type: Boolean },
      heading: { type: String },
      scrimClickAction: { type: String },
      escapeKeyAction: { type: String }
    };
  }

  constructor() {
    super();
    this.open = false;
    this.heading = '';
    this.scrimClickAction = '';
    this.escapeKeyAction = '';
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
    `;
  }

  render() {
    return html`
      <ha-dialog
        .open=${this.open}
        .heading=${this.heading}
        .scrimClickAction=${this.scrimClickAction}
        .escapeKeyAction=${this.escapeKeyAction}
        @closed=${this._handleClosed}>
        <slot></slot>
        <slot name="heading" slot="heading"></slot>
        <slot name="primaryAction" slot="primaryAction"></slot>
        <slot name="secondaryAction" slot="secondaryAction"></slot>
      </ha-dialog>
    `;
  }

  /**
   * Handle closed events from ha-dialog and its children
   * Only propagate if it's from the ha-dialog itself, not from child components
   */
  _handleClosed(e) {
    // Check if the event originated from ha-dialog itself (user closed it)
    // vs. from a child component like ha-select (dropdown closed)
    const isFromDialog = e.target.tagName === 'HA-DIALOG';

    if (isFromDialog) {
      // This is a legitimate dialog close - propagate it
      this.dispatchEvent(new CustomEvent('closed', {
        bubbles: true,
        composed: true,
        detail: e.detail
      }));
    } else {
      // This is from a child component (like ha-select) - stop it
      e.stopPropagation();
    }
  }
}

customElements.define('lcards-dialog', LCARdSDialog);
