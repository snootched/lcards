/**
 * @fileoverview LCARdS Preview Feature Chip
 *
 * A simple pill-shaped lozenge badge for labelling preview/experimental features.
 * Pure CSS — no dependency on HA chip components.
 *
 * Usage:
 *   <lcards-preview-chip></lcards-preview-chip>
 *
 * @element lcards-preview-chip
 */

import { LitElement, html, css } from 'lit';

export class LCARdSPreviewChip extends LitElement {

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      margin-left: 6px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 99px;
      background: color-mix(in srgb, var(--info-color, #03a9f4) 18%, transparent);
      color: var(--info-color, #03a9f4);
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 1;
      white-space: nowrap;
      border: var(--ha-border-width-md) solid color-mix(in srgb, var(--info-color, #03a9f4) 40%, transparent);
    }
  `;

  render() {
    return html`<span class="pill">preview</span>`;
  }
}

if (!customElements.get('lcards-preview-chip')) {
  customElements.define('lcards-preview-chip', LCARdSPreviewChip);
}
