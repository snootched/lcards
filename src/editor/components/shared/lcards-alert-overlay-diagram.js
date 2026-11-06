/**
 * @fileoverview Static explainers for the alert overlay editor's info guides,
 * one per `kind`:
 *
 * - overlay: the layers from the dashboard to the content, the content's
 *   position (nine anchors) and its size (width and height, % of the screen)
 * - band: where the band sits, the dashes (width, gap, height, grow), the sweep
 * - conditions: what a condition shows (your own card, else the built-in symbol
 *   with the changes over it), how its values fall back, and display per condition
 *
 * Fixed sample geometry, no data: the Alert Studio shows the user's own alert.
 * Theme colours with fallbacks (the docs harness has no theme).
 *
 * @element lcards-alert-overlay-diagram
 */

import { LitElement, html, svg, css, nothing } from 'lit';

/** A panel's frame, title and caption, at x */
const panel = (/** @type {number} */ x, /** @type {string} */ title, /** @type {string} */ caption, /** @type {any} */ body, w = 120) => svg`
  <g transform="translate(${x} 0)">
    <rect class="frame" x="0.5" y="0.5" width=${w - 1} height="120" rx="6"></rect>
    ${body}
    <text class="title" x=${w / 2} y="137" text-anchor="middle">${title}</text>
    <text class="caption" x=${w / 2} y="152" text-anchor="middle">${caption}</text>
  </g>`;

/** A small screen: a frame with a stand-in dashboard (three panels) */
const screen = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h) => svg`
  <rect class="line" x=${x} y=${y} width=${w} height=${h} rx="2"></rect>
  ${[0, 1, 2].map((i) => svg`<rect class="dash-panel" x=${x + 4 + i * ((w - 8) / 3)} y=${y + 5} width=${(w - 8) / 3 - 3} height=${h * 0.35} rx="1.5"></rect>`)}`;

/** The alert symbol, simplified: two chevrons round a bar, centred at (cx, cy), width w */
const symbol = (/** @type {number} */ cx, /** @type {number} */ cy, /** @type {number} */ w) => {
  const h = w * 0.73;
  return svg`
    <path class="alert" d="M${cx - w / 2} ${cy - h * 0.12} L${cx - w * 0.3} ${cy - h / 2} H${cx + w * 0.3} L${cx + w / 2} ${cy - h * 0.12} Z"></path>
    <rect class="alert" x=${cx - w / 2} y=${cy - h * 0.08} width=${w} height=${h * 0.16}></rect>
    <path class="alert" d="M${cx - w / 2} ${cy + h * 0.12} L${cx - w * 0.3} ${cy + h / 2} H${cx + w * 0.3} L${cx + w / 2} ${cy + h * 0.12} Z"></path>`;
};

/** A row of dashes from x0 to x1 at cy, height h, skipping a gap round gapX */
const dashes = (/** @type {number} */ x0, /** @type {number} */ x1, /** @type {number} */ cy, /** @type {number} */ h, /** @type {number} */ gapX, /** @type {number} */ gapW, step = 5) => {
  const out = [];
  for (let x = x0; x <= x1; x += step) {
    if (Math.abs(x - gapX) < gapW / 2) continue;
    out.push(svg`<rect class="alert" x=${x} y=${cy - h / 2} width="2" height=${h} rx="0.6"></rect>`);
  }
  return out;
};

const DIAGRAMS = {
  overlay: {
    label: 'An overlay stacks the backdrop, colour and canvas layers over the dashboard, with the alert symbol on top; the symbol sits at one of nine anchors, sized by width and height as a share of the screen',
    body: () => svg`
      ${panel(0, 'LAYERS', 'back to front', svg`
        ${[['dashboard', 0], ['backdrop (blur)', 1], ['colour (tint)', 2], ['canvas (effect)', 3], ['symbol or card', 4]].map(([name, i]) => svg`
          <rect class=${i === 4 ? 'fill-soft' : 'layer'} x=${14 + Number(i) * 6} y=${92 - Number(i) * 17} width="72" height="20" rx="2"></rect>
          <text class="small" x=${18 + Number(i) * 6} y=${105 - Number(i) * 17}>${name}</text>`)}`)}
      ${panel(140, 'POSITION', 'one of nine anchors', svg`
        ${screen(10, 22, 100, 76)}
        <rect class="fill-soft" x="66" y="30" width="36" height="22" rx="2"></rect>
        ${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => svg`<circle class=${r === 0 && c === 2 ? 'anchor-on' : 'anchor'} cx=${18 + c * 42} cy=${30 + r * 30} r=${r === 0 && c === 2 ? 3.2 : 2.4}></circle>`))}
        <text class="label" x="60" y="112" text-anchor="middle">position: top-right</text>`)}
      ${panel(280, 'SIZE', '% of the screen, or px', svg`
        <rect class="line" x="10" y="22" width="100" height="76" rx="2"></rect>
        <rect class="fill-soft" x="26" y="46" width="46" height="34" rx="2"></rect>
        ${symbol(49, 63, 32)}
        <path class="arrow" d="M26 39 H72 M29 36 L26 39 L29 42 M69 36 L72 39 L69 42"></path>
        <text class="label" x="49" y="34" text-anchor="middle">width</text>
        <path class="arrow" d="M78 46 V80 M75 49 L78 46 L81 49 M75 77 L78 80 L81 77"></path>
        <text class="label" x="82" y="66">height</text>
        <text class="small" x="60" y="112" text-anchor="middle">no height: from the width</text>`)}`
  },
  band: {
    label: 'A band is a row of dashes across the screen with the alert symbol in the middle, at the top, centre, bottom or a percentage of the height; dash width, gap, band height and grow shape the dashes; the sweep runs outward or inward',
    body: () => svg`
      ${panel(0, 'BAND', 'position: top, center, bottom, %', svg`
        ${screen(18, 22, 94, 76)}
        ${dashes(21, 109, 74, 6, 65, 26, 4)}
        ${symbol(65, 74, 20)}
        <path class="arrow" d="M10 22 V74 M7 25 L10 22 L13 25 M7 71 L10 74 L13 71"></path>
        <text class="small" x="60" y="112" text-anchor="middle">70%: lower down</text>`)}
      ${panel(140, 'DASHES', 'width, gap, height, grow', svg`
        <rect class="alert" x="22" y="48" width="12" height="28" rx="1"></rect>
        <rect class="alert" x="52" y="48" width="12" height="28" rx="1"></rect>
        <rect class="grow" x="82" y="36" width="12" height="52" rx="1"></rect>
        <rect class="alert" x="82" y="48" width="12" height="28" rx="1"></rect>
        <path class="arrow" d="M22 42 H34 M24 40 L22 42 L24 44 M32 40 L34 42 L32 44"></path>
        <text class="small" x="28" y="36" text-anchor="middle">width</text>
        <path class="arrow" d="M34 84 H52 M36 82 L34 84 L36 86 M50 82 L52 84 L50 86"></path>
        <text class="small" x="43" y="96" text-anchor="middle">gap</text>
        <path class="arrow" d="M12 48 V76 M10 50 L12 48 L14 50 M10 74 L12 76 L14 74"></path>
        <text class="small" x="12" y="88" text-anchor="middle">height</text>
        <text class="small" x="88" y="30" text-anchor="middle">grow</text>
        <text class="small" x="60" y="112" text-anchor="middle">symbol size: × band height</text>`)}
      ${panel(280, 'SWEEP', 'outward or inward; speed, phase', svg`
        ${dashes(8, 112, 50, 8, 60, 28, 5)}
        ${symbol(60, 50, 22)}
        <path class="arrow" d="M76 70 H106 M102 66 L106 70 L102 74 M44 70 H14 M18 66 L14 70 L18 74"></path>
        <text class="small" x="60" y="84" text-anchor="middle">outward</text>
        <path class="arrow" d="M14 96 H44 M40 92 L44 96 L40 100 M106 96 H76 M80 92 L76 96 L80 100"></path>
        <text class="small" x="60" y="110" text-anchor="middle">inward</text>`)}`
  },
  conditions: {
    label: 'A condition shows your own card, else the built-in alert symbol with the changes over it (the card level, then the condition); every value falls back from the condition to the card to the default; each condition can be an overlay or a band',
    body: () => svg`
      ${panel(0, 'WHAT SHOWS', 'your card, else the symbol', svg`
        ${[['your own card', 'fill-soft', 'else'], ['condition changes', 'layer', 'over'], ['card changes', 'layer', 'over'], ['built-in symbol', 'layer', '']].map(([name, cls, link], i) => svg`
          <rect class=${cls} x="14" y=${6 + i * 28} width="92" height="17" rx="2"></rect>
          <text class="small" x="60" y=${17.5 + i * 28} text-anchor="middle">${name}</text>
          ${link ? svg`<text class="small" x="60" y=${31 + i * 28} text-anchor="middle">${link}</text>` : nothing}`)}`)}
      ${panel(140, 'EACH VALUE', 'condition, then card, then default', svg`
        ${[['red alert: width 30%', 'fill-soft'], ['card: width 60%', 'layer'], ['default: 60%', 'layer']].map(([name, cls], i) => svg`
          <rect class=${cls} x="10" y=${20 + i * 30} width="100" height="22" rx="2"></rect>
          <text class="small" x="60" y=${34 + i * 30} text-anchor="middle">${name}</text>
          ${i < 2 ? svg`<path class="arrow" d="M60 ${43 + i * 30} V${49 + i * 30} M57 ${46 + i * 30} L60 ${49 + i * 30} L63 ${46 + i * 30}"></path>` : nothing}`)}`)}
      ${panel(280, 'DISPLAY', 'per condition', svg`
        ${screen(8, 18, 50, 38)}
        <rect class="fill-soft" x="22" y="28" width="22" height="16" rx="1.5"></rect>
        ${symbol(33, 36, 14)}
        <text class="small" x="33" y="66" text-anchor="middle">red: overlay</text>
        ${screen(62, 18, 50, 38)}
        ${dashes(64, 110, 37, 4, 87, 12, 3)}
        ${symbol(87, 37, 9)}
        <text class="small" x="87" y="66" text-anchor="middle">yellow: band</text>
        <text class="small" x="60" y="92" text-anchor="middle">the band settings</text>
        <text class="small" x="60" y="103" text-anchor="middle">and the overlay size</text>
        <text class="small" x="60" y="114" text-anchor="middle">apply to their own</text>`)}`
  },
};

export class LCARdSAlertOverlayDiagram extends LitElement {
  static properties = {
    kind: { type: String },
  };

  constructor() {
    super();
    /** @type {keyof typeof DIAGRAMS} */
    this.kind = 'overlay';
  }

  static styles = css`
    :host { display: block; padding: var(--ha-space-2) 0; }
    svg { display: block; width: 100%; height: auto; max-width: 520px; margin: 0 auto; overflow: visible; }
    .frame { fill: none; stroke: var(--divider-color, #888); stroke-width: 1; }
    .title { fill: var(--primary-text-color, #ddd); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .caption { fill: var(--secondary-text-color, #aaa); font-size: 10px; }
    .label { fill: var(--primary-text-color, #ddd); font-size: 9px; }
    .small { fill: var(--secondary-text-color, #aaa); font-size: 8.5px; }
    .line { fill: none; stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; }
    .dash-panel { fill: color-mix(in srgb, var(--secondary-text-color, #aaa) 25%, transparent); }
    .layer { fill: color-mix(in srgb, var(--secondary-text-color, #aaa) 12%, var(--card-background-color, #111)); stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; }
    .fill-soft { fill: color-mix(in srgb, var(--primary-color, #ff9900) 18%, var(--card-background-color, #111)); stroke: var(--primary-color, #ff9900); stroke-width: 1; }
    .alert { fill: var(--lcars-alert-red, var(--error-color, #cc3333)); }
    .grow { fill: none; stroke: var(--lcars-alert-red, var(--error-color, #cc3333)); stroke-width: 0.8; stroke-dasharray: 2 1.5; }
    .anchor { fill: var(--secondary-text-color, #aaa); }
    .anchor-on { fill: var(--primary-color, #ff9900); }
    .arrow { fill: none; stroke: var(--primary-text-color, #ddd); stroke-width: 0.9; }
  `;

  render() {
    const d = DIAGRAMS[this.kind];
    if (!d) return nothing;
    return html`<svg viewBox="0 -4 400 162" role="img" aria-label=${d.label}>${d.body()}</svg>`;
  }
}

if (!customElements.get('lcards-alert-overlay-diagram')) {
  customElements.define('lcards-alert-overlay-diagram', LCARdSAlertOverlayDiagram);
}
