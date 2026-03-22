/**
 * @fileoverview LCARdS Dialog Wrapper
 *
 * A wrapper around ha-dialog (now Web Awesome based) that:
 *  - Handles the 'closed' event bubbling to prevent premature closure of
 *    parent dialogs/editors when inner components (ha-select, nested dialogs)
 *    close.
 *  - Provides backward-compatible slot aliases:
 *      slot="heading"       → maps to ha-dialog headerTitle slot
 *      slot="primaryAction" → maps to ha-dialog footer slot
 *      slot="secondaryAction" → maps to ha-dialog footer slot
 *
 * @element lcards-dialog
 * @fires closed - When dialog is actually closed by user action
 *
 * Usage: Replace <ha-dialog> with <lcards-dialog> in any component that
 * contains ha-select or other components that fire 'closed' events.
 *
 * @property {Boolean} open - Whether dialog is open
 * @property {String}  heading - Dialog heading text (maps to header-title)
 * @property {Boolean} preventScrimClose - Prevent closing on scrim click / Escape
 */

import { LitElement, html, css } from 'lit';

export class LCARdSDialog extends LitElement {
  static get properties() {
    return {
      open: { type: Boolean },
      heading: { type: String },
      // Legacy compat aliases – both map to preventScrimClose internally
      scrimClickAction: { type: String },
      escapeKeyAction: { type: String },
      preventScrimClose: { type: Boolean, attribute: 'prevent-scrim-close' }
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.heading = undefined;
    this.open = false;
    this.preventScrimClose = false;
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
      /*
       * Single footer wrapper: HA's ::slotted([slot="footer"]) targets this div
       * and applies display:flex + padding. We also declare the same values
       * as a fallback for nested shadow-DOM re-slot edge cases.
       */
      .lcards-footer {
        display: flex;
        padding: var(--ha-space-3, 8px) var(--ha-space-4, 16px) var(--ha-space-4, 16px) var(--ha-space-4, 16px);
        gap: var(--ha-space-3, 8px);
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
      }
    `;
  }

  render() {
    // Legacy scrimClickAction="" / escapeKeyAction="" meant "don't close on scrim/escape",
    // which maps to prevent-scrim-close in the new WA-based ha-dialog.
    const preventClose = this.preventScrimClose
      // @ts-ignore - TS2339: auto-suppressed
      || this.scrimClickAction === ''
      // @ts-ignore - TS2339: auto-suppressed
      || this.escapeKeyAction === '';

    return html`
      <ha-dialog
        .open=${this.open}
        // @ts-ignore - TS2339: auto-suppressed
        .headerTitle=${this.heading || undefined}
        ?prevent-scrim-close=${preventClose}
        @closed=${this._handleClosed}>
        <slot></slot>
        <!-- Backward-compat: slot="heading" maps to headerTitle slot -->
        <slot name="heading" slot="headerTitle"></slot>
        <!-- Single footer wrapper so HA styles the container, not each slot element -->
        <div class="lcards-footer" slot="footer">
          <slot name="primaryAction"></slot>
          <slot name="secondaryAction"></slot>
          <slot name="footer"></slot>
        </div>
      </ha-dialog>
    `;
  }

  /**
   * Handle closed events from ha-dialog and its children.
   *
   * Always stop propagation of the raw ha-dialog/wa-dialog closed event so it
   * doesn't bubble into ancestor HA editors and close them unexpectedly.
   * Then re-dispatch a single controlled 'closed' event from this host element.
   */
  _handleClosed(e) {
    // Always stop the original event from bubbling further up the composed tree.
    e.stopPropagation();

    // Only re-dispatch if the event came from ha-dialog itself (not a nested
    // child like ha-select whose dropdown also fires 'closed').
    const isFromDialog = e.target.tagName === 'HA-DIALOG';
    if (isFromDialog) {
      this.dispatchEvent(new CustomEvent('closed', {
        bubbles: true,
        composed: true,
        detail: e.detail
      }));
    }
  }
}

customElements.define('lcards-dialog', LCARdSDialog);
