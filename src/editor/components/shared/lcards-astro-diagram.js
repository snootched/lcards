/**
 * @fileoverview Static explainers for the Astrometrics Studio's info guides
 * (astro-studio/studio-guides.js), one per `kind`:
 *
 * - scale: a scene in light years, a star system at one of its points, a
 *   planet with points on its surface
 * - starters: a scene starter replaces (or merges into) the card; a part adds
 *   one thing with prefixed ids
 * - placement: where a point can stand (the ground plane, a sphere, a sector
 *   map cell)
 * - camera: a view's target, yaw, tilt and distance
 * - distance: min_distance and max_distance against the camera's distance
 *
 * Fixed sample geometry, no data: the live preview shows the user's own scene.
 * Theme colours with fallbacks (the docs harness has no theme).
 *
 * @element lcards-astro-diagram
 */

import { LitElement, html, css, svg, nothing } from 'lit';

/** A loose spiral arm round (60, 60), as polyline points */
const ARM = (/** @type {number} */ phase) => Array.from({ length: 28 }, (_, i) => {
  const t = i / 27;
  const a = phase + t * 4.6;
  const r = 5 + t * 46;
  return `${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r * 0.55).toFixed(1)}`;
}).join(' ');

/** A panel's frame, title and caption, at x */
const panel = (/** @type {number} */ x, /** @type {string} */ title, /** @type {string} */ caption, /** @type {any} */ body, w = 120) => svg`
  <g transform="translate(${x} 0)">
    <rect class="frame" x="0.5" y="0.5" width=${w - 1} height="120" rx="6"></rect>
    ${body}
    <text class="title" x=${w / 2} y="137" text-anchor="middle">${title}</text>
    <text class="caption" x=${w / 2} y="152" text-anchor="middle">${caption}</text>
  </g>`;

const DIAGRAMS = {
  scale: {
    label: 'A scene in light years holds a star system in kilometres at one of its points; a planet in that system has points on its surface',
    body: () => svg`
      ${panel(0, 'SCENE', 'light years', svg`
        <polyline class="arm" points=${ARM(0)}></polyline><polyline class="arm" points=${ARM(Math.PI)}></polyline>
        <ellipse class="fill" cx="60" cy="60" rx="5" ry="3"></ellipse>
        <circle class="point" cx="88" cy="76" r="2.4"></circle>
        <text class="label" x="84" y="92">SOL</text>`)}
      <line class="zoom" x1="90" y1="76" x2="140" y2="0.5"></line>
      <line class="zoom" x1="90" y1="76" x2="140" y2="120.5"></line>
      ${panel(140, 'SYSTEM', 'km or au, at a point', svg`
        <ellipse class="line" cx="60" cy="60" rx="22" ry="12"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="44" ry="24"></ellipse>
        <circle class="star" cx="60" cy="60" r="6"></circle>
        <circle class="body" cx="98" cy="72" r="4"></circle>
        <text class="label" x="84" y="90">EARTH</text>`)}
      <line class="zoom" x1="240" y1="72" x2="280" y2="0.5"></line>
      <line class="zoom" x1="240" y1="72" x2="280" y2="120.5"></line>
      ${panel(280, 'OBJECT + POINTS', 'points stand on it', svg`
        <circle class="body" cx="60" cy="60" r="38"></circle>
        <ellipse class="line" cx="60" cy="60" rx="38" ry="12"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="14" ry="38"></ellipse>
        <circle class="point" cx="44" cy="48" r="2.4"></circle>
        <text class="label" x="48" y="45">BASE</text>
        <circle class="point" cx="72" cy="70" r="2.4"></circle>
        <text class="label" x="76" y="67">PORT</text>`)}`
  },
  starters: {
    label: 'A scene starter replaces the card\'s scene or merges into it; a part adds one thing with ids that start with its name',
    body: () => svg`
      ${panel(0, 'SCENE', 'replace or merge', svg`
        <rect class="line" x="12" y="30" width="38" height="44" rx="3"></rect>
        <circle class="point" cx="24" cy="44" r="2.4"></circle><circle class="point" cx="38" cy="60" r="2.4"></circle>
        <text class="small" x="31" y="88" text-anchor="middle">yours</text>
        <path class="arrow" d="M54 52 H66 M62 48 L66 52 L62 56"></path>
        <rect class="fill-soft" x="70" y="30" width="38" height="44" rx="3"></rect>
        <polyline class="arm" points="80,60 86,48 96,46 100,54"></polyline>
        <text class="small" x="89" y="88" text-anchor="middle">starter</text>`, 120)}
      ${panel(140, 'PART', 'adds one thing', svg`
        <rect class="line" x="12" y="30" width="60" height="50" rx="3"></rect>
        <circle class="point" cx="26" cy="46" r="2.4"></circle><circle class="point" cx="44" cy="64" r="2.4"></circle>
        <text class="small" x="42" y="94" text-anchor="middle">your scene</text>
        <text class="label big" x="82" y="58" text-anchor="middle">+</text>
        <circle class="body" cx="102" cy="54" r="9"></circle>
        <ellipse class="line" cx="102" cy="54" rx="15" ry="5"></ellipse>
        <text class="small" x="102" y="78" text-anchor="middle">mars_body</text>
        <text class="small" x="102" y="88" text-anchor="middle">mars_orbit</text>`, 130)}
      ${panel(290, 'COPIED', 'yours to change', svg`
        <rect class="fill-soft" x="15" y="25" width="80" height="60" rx="3"></rect>
        <text class="small" x="24" y="42">points:</text>
        <text class="small" x="24" y="56">objects:</text>
        <text class="small" x="24" y="70">camera:</text>`, 110)}`
  },
  placement: {
    label: 'A point stands on the ground plane by coordinates or bearing and range, on a sphere by latitude and longitude, or in a sector map cell',
    body: () => svg`
      ${panel(0, 'XYZ · POLAR', 'the ground plane', svg`
        <polygon class="line" points="10,90 40,40 110,40 80,90"></polygon>
        <circle class="star" cx="60" cy="65" r="2.4"></circle>
        <line class="zoom" x1="60" y1="65" x2="88" y2="52"></line>
        <path class="line" d="M74 65 A 14 6 0 0 0 72 59"></path>
        <circle class="point" cx="88" cy="52" r="2.6"></circle>
        <text class="label" x="60" y="28" text-anchor="middle">[distance, bearing]</text>`)}
      ${panel(140, 'LATLON', 'on a sphere', svg`
        <circle class="body" cx="60" cy="60" r="38"></circle>
        <ellipse class="line" cx="60" cy="60" rx="38" ry="11"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="15" ry="38"></ellipse>
        <circle class="point" cx="73" cy="44" r="2.6"></circle>
        <text class="label" x="78" y="40">[lat, lon]</text>`)}
      ${panel(280, 'CELL', 'on a sector map', svg`
        ${[0, 1, 2, 3].map((i) => svg`<line class="line" x1=${20 + i * 27} y1="30" x2=${20 + i * 27} y2="111"></line><line class="line" x1="20" y1=${30 + i * 27} x2="101" y2=${30 + i * 27}></line>`)}
        ${['A', 'B', 'C'].map((c, i) => svg`<text class="small" x=${33 + i * 27} y="24" text-anchor="middle">${c}</text>`)}
        ${[1, 2, 3].map((r, i) => svg`<text class="small" x="12" y=${47 + i * 27} text-anchor="middle">${r}</text>`)}
        <rect class="fill-soft" x="47" y="57" width="27" height="27"></rect>
        <circle class="point" cx="60.5" cy="70.5" r="2.6"></circle>
        <text class="label" x="60.5" y="80" text-anchor="middle">B2</text>`)}`
  },
  camera: {
    label: 'A camera view: the target it looks at, the yaw it is turned round the target, the tilt it looks down at, and its distance',
    body: () => svg`
      <g>
        <rect class="frame" x="0.5" y="0.5" width="399" height="120" rx="6"></rect>
        <ellipse class="line" cx="170" cy="84" rx="140" ry="18"></ellipse>
        <circle class="point" cx="170" cy="84" r="3"></circle>
        <text class="label" x="150" y="80" text-anchor="end">target</text>
        <line class="zoom" x1="170" y1="84" x2="300" y2="30"></line>
        <text class="label" x="236" y="48">distance</text>
        <line class="zoom" x1="300" y1="30" x2="296" y2="90"></line>
        <line class="zoom" x1="170" y1="84" x2="296" y2="90"></line>
        <path class="arrow" d="M150 101 A 50 9 0 0 0 214 95"></path>
        <text class="label" x="182" y="114">yaw</text>
        <path class="arrow" d="M216 86 A 46 46 0 0 0 212.5 66.3"></path>
        <text class="label" x="222" y="76">tilt</text>
        <g transform="translate(300 30) rotate(25)">
          <rect class="fill" x="-10" y="-7" width="20" height="14" rx="2"></rect>
          <polygon class="fill" points="-10,-4 -18,-8 -18,8 -10,4"></polygon>
        </g>
        <text class="label" x="318" y="28">camera</text>
        <text class="title" x="200" y="137" text-anchor="middle">A VIEW</text>
        <text class="caption" x="200" y="152" text-anchor="middle">looks at a target, from yaw, tilt and distance</text>
      </g>`
  },
  distance: {
    label: 'An object shows while the camera is between its min_distance and max_distance, fading in and out at the edges',
    body: () => svg`
      <g>
        <rect class="frame" x="0.5" y="0.5" width="399" height="120" rx="6"></rect>
        <line class="line" x1="20" y1="96" x2="384" y2="96"></line>
        <path class="arrow" d="M378 92 L384 96 L378 100"></path>
        <text class="small" x="384" y="112" text-anchor="end">camera distance</text>
        <polyline class="curve" points="20,90 100,90 124,40 270,40 296,90 380,90"></polyline>
        <line class="zoom" x1="112" y1="30" x2="112" y2="96"></line>
        <line class="zoom" x1="283" y1="30" x2="283" y2="96"></line>
        <text class="label" x="112" y="24" text-anchor="middle">min_distance</text>
        <text class="label" x="283" y="24" text-anchor="middle">max_distance</text>
        <text class="small" x="60" y="80" text-anchor="middle">too close: hidden</text>
        <text class="small" x="197" y="60" text-anchor="middle">shown</text>
        <text class="small" x="336" y="80" text-anchor="middle">too far: hidden</text>
        <text class="title" x="200" y="137" text-anchor="middle">DISTANCE</text>
        <text class="caption" x="200" y="152" text-anchor="middle">shown between the two, fading in and out at the edges</text>
      </g>`
  }
};

export class LCARdSAstroDiagram extends LitElement {
  static get properties() {
    return { kind: { type: String } };
  }

  constructor() {
    super();
    /** @type {keyof typeof DIAGRAMS} */
    this.kind = 'scale';
  }

  static styles = css`
    :host { display: block; padding: var(--ha-space-2) 0; }
    svg { display: block; width: 100%; height: auto; max-width: 520px; margin: 0 auto; overflow: visible; }
    .frame { fill: none; stroke: var(--divider-color, #888); stroke-width: 1; }
    .title { fill: var(--primary-text-color, #ddd); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .caption { fill: var(--secondary-text-color, #aaa); font-size: 10px; }
    .label { fill: var(--primary-text-color, #ddd); font-size: 9px; }
    .label.big { font-size: 18px; }
    .small { fill: var(--secondary-text-color, #aaa); font-size: 8.5px; }
    .arm, .curve { fill: none; stroke: var(--primary-color, #ff9900); stroke-width: 1.6; }
    .arm { opacity: 0.7; }
    .fill { fill: var(--primary-color, #ff9900); }
    .fill-soft { fill: color-mix(in srgb, var(--primary-color, #ff9900) 18%, transparent); stroke: var(--primary-color, #ff9900); stroke-width: 1; }
    .line { fill: none; stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; }
    .star { fill: var(--accent-color, #ffcc66); }
    .body { fill: color-mix(in srgb, var(--primary-color, #ff9900) 15%, transparent); stroke: var(--primary-color, #ff9900); stroke-width: 1; }
    .point { fill: var(--primary-text-color, #ddd); }
    .zoom { fill: none; stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; stroke-dasharray: 3 2; }
    .arrow { fill: none; stroke: var(--primary-text-color, #ddd); stroke-width: 1; }
  `;

  render() {
    const d = DIAGRAMS[this.kind];
    if (!d) return nothing;
    return html`<svg viewBox="0 -4 400 162" role="img" aria-label=${d.label}>${d.body()}</svg>`;
  }
}

if (!customElements.get('lcards-astro-diagram')) {
  customElements.define('lcards-astro-diagram', LCARdSAstroDiagram);
}
