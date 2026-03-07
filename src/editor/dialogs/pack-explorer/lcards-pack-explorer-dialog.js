/**
 * @fileoverview LCARdS Pack Explorer Dialog
 *
 * Professional modal dialog for browsing and inspecting all loaded packs.
 * Now uses the reusable lcards-pack-explorer-tab component.
 *
 * @element lcards-pack-explorer-dialog
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import '../../components/pack-explorer/lcards-pack-explorer-tab.js';

export class LCARdSPackExplorerDialog extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      open: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.open = false;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      /* Dialog styles */
      ha-dialog {
        --mdc-dialog-min-width: 90vw;
        --mdc-dialog-max-width: 1400px;
        --mdc-dialog-min-height: 80vh;
        --mdc-dialog-max-height: 80vh;
      }
    `;
  }

  /**
   * Handle dialog close
   * @private
   */
  _handleClose() {
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <ha-dialog
        open
        @closed=${this._handleClose}
        .heading=${'Pack Explorer'}>
        <lcards-pack-explorer-tab
          .hass=${this.hass}
          ._inlineMode=${true}
        ></lcards-pack-explorer-tab>

        <ha-button
          slot="primaryAction"
          variant="brand"
          appearance="accent"
          @click=${this._handleClose}
          dialogAction="close">
          Close
        </ha-button>
      </ha-dialog>
    `;
  }
}

customElements.define('lcards-pack-explorer-dialog', LCARdSPackExplorerDialog);
