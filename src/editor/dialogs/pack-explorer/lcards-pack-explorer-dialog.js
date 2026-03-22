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
        /** @type {any} */
        this.hass = undefined;
    this.open = false;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      /* Dialog styles */
      ha-dialog {
        --ha-dialog-width-md: 90vw;
        --ha-dialog-min-height: 80vh;
        --ha-dialog-max-height: 80vh;
      }
    `;
  }

  /**
   * Handle dialog close
   * @private
   */
  _handleClose() {
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: false }));
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <ha-dialog
        open
        @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}
        header-title="Pack Explorer">
        <lcards-pack-explorer-tab
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          ._inlineMode=${true}
        ></lcards-pack-explorer-tab>

        <div slot="footer">
          <ha-button
            variant="brand"
            appearance="accent"
            @click=${this._handleClose}
            data-dialog="close">
            Close
          </ha-button>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define('lcards-pack-explorer-dialog', LCARdSPackExplorerDialog);
