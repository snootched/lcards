/**
 * @fileoverview Shared, dependency-free theme-generation math for LCARdS.
 *
 * Pure JS only — no `window`, no `fs`, no other LCARdS module imports — so
 * this file can be imported unmodified from both Node (scripts/generate-
 * lcards-*.js, run outside a browser at release time) and the browser bundle
 * (the in-app Theme Generator UI, editor/components/theme-browser/lcards-
 * theme-generator-view.js). `ColorUtils.js` cannot fill this role: it
 * transitively imports `lcards-logging.js`, which touches `window`
 * unconditionally at module load and throws under plain Node.
 *
 * Previously this OKLCH/tone-index math was hand-duplicated once in each of
 * the two Node scripts. This module is now the single source; the scripts
 * import from it instead of maintaining their own copies.
 *
 * @module core/themes/themeGeneratorCore
 */

// ─── Color primitives ───────────────────────────────────────────────────

/** @param {string} hex @returns {[number,number,number]} */
export function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/** @param {number} r @param {number} g @param {number} b @returns {string} */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const h = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

/** Convert RGB (0-255) to OKLCH (Björn Ottosson's OKLab, cylindrical form). @returns {[number,number,number]} */
export function rgbToOklch(r, g, b) {
  const toLinear = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bLab * bLab);
  let H = Math.atan2(bLab, a) * 180 / Math.PI;
  if (H < 0) H += 360;

  return [L, C, C < 1e-6 ? 0 : H];
}

/** Inverse of {@link rgbToOklch}. @returns {[number,number,number]} */
export function oklchToRgb(L, C, H) {
  const hRad = H * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const bLab = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bLab;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bLab;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * bLab;

  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (c) => {
    c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(1, c)) * 255;
  };

  return [toSrgb(lr), toSrgb(lg), toSrgb(lb)];
}

/** Shortest-path hue lerp (handles wraparound near 0/360). */
export function lerpHue(h1, h2, t) {
  const delta = ((h2 - h1 + 540) % 360) - 180;
  return (h1 + delta * t + 360) % 360;
}

/** Perceptually-uniform interpolation between two hex colors, in OKLCH. */
export function lerpOklch(hex1, hex2, t) {
  const [L1, C1, H1] = rgbToOklch(...hexToRgb(hex1));
  const [L2, C2, H2] = rgbToOklch(...hexToRgb(hex2));
  const L = L1 + (L2 - L1) * t;
  const C = C1 + (C2 - C1) * t;
  const H = (C1 < 1e-6) ? H2 : (C2 < 1e-6) ? H1 : lerpHue(H1, H2, t);
  return rgbToHex(...oklchToRgb(L, C, H));
}

/** WCAG relative luminance (0-1). */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors, 1 (none) to 21 (max). */
export function wcagContrast(hex1, hex2) {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── 11-stop OKLCH scale interpolation ───────────────────────────────────
//
// LCARdS's canon palette hand-picks 7 stops per hue family (darkest/dark/
// medium-dark/medium(base)/medium-light/light/lightest), mapped onto HA's
// 11-stop tone grid (05/10/20/30/40/50/60/70/80/90/95). The 4 gaps (10/50/
// 60/95) are computed here, never hand-picked.

export const TONE_ORDER = ['05', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95'];

/** Canon anchor suffix (as used in GREEN_ALERT_PALETTE keys) -> HA tone slot. */
export const ANCHOR_SUFFIX_TO_TONE = {
  'darkest': '05',
  'dark': '20',
  'medium-dark': '30',
  '': '40', // bare family key, e.g. 'orange'
  'medium-light': '70',
  'light': '80',
  'lightest': '90',
};

const EXTRAPOLATE_95_TOWARD_WHITE_T = 0.5; // most subjective value in the scale

/** Fade-to-white extrapolation: desaturates as it lightens toward pure white. Comparison-only, not shipped. */
export function extrapolate95FadeToWhite(anchor90hex, t = EXTRAPOLATE_95_TOWARD_WHITE_T) {
  return lerpOklch(anchor90hex, '#ffffff', t);
}

/**
 * Neon/electric extrapolation (shipped): lighten toward white's L while
 * holding hue and chroma from the -90/lightest anchor — an "electric/neon"
 * pale tone instead of a washed-out pastel, matching how LCARS palettes read
 * as vibrant even at their lightest steps.
 */
export function extrapolate95Neon(anchor90hex, t = EXTRAPOLATE_95_TOWARD_WHITE_T, chromaBoost = 1.0) {
  const [L90, C90, H90] = rgbToOklch(...hexToRgb(anchor90hex));
  const L = L90 + (1 - L90) * t;
  return rgbToHex(...oklchToRgb(L, C90 * chromaBoost, H90));
}

/**
 * @param {Object<string,string>} anchors - 7 canon tones keyed by HA tone slot: {05,20,30,40,70,80,90}
 * @returns {{scale: Object<string,string>, meta: Object<string,string>, fadeToWhite95: string}}
 */
export function computeFullScale(anchors) {
  /** @type {Object<string,string>} */
  const scale = { ...anchors }; // 05,20,30,40,70,80,90 already present
  /** @type {Object<string,string>} */
  const meta = {}; // tone -> 'anchor' | 'interpolated' | 'extrapolated'
  for (const tone of Object.keys(anchors)) meta[tone] = 'anchor';

  scale['10'] = lerpOklch(anchors['05'], anchors['20'], (10 - 5) / (20 - 5));
  meta['10'] = 'interpolated';

  scale['50'] = lerpOklch(anchors['40'], anchors['70'], (50 - 40) / (70 - 40));
  meta['50'] = 'interpolated';

  scale['60'] = lerpOklch(anchors['40'], anchors['70'], (60 - 40) / (70 - 40));
  meta['60'] = 'interpolated';

  // Shipped method is Method B (neon/electric). Method A (fade-to-white) is
  // exposed only as a labeled comparison, not used for the real scale.
  scale['95'] = extrapolate95Neon(anchors['90']);
  meta['95'] = 'extrapolated';

  const fadeToWhite95 = extrapolate95FadeToWhite(anchors['90']);

  return { scale, meta, fadeToWhite95 };
}

/** ha-lcars's own generic `&base` OKLCH-mix formula (color-mix(in oklch, seed N%, black/white)) — reference/comparison only, never shipped. */
export const HA_DEFAULT_MIX = {
  '05': { pct: 10, toward: '#000000' }, '10': { pct: 22, toward: '#000000' },
  '20': { pct: 44, toward: '#000000' }, '30': { pct: 67, toward: '#000000' },
  '40': null, // seed itself, unmixed
  '50': { pct: 88, toward: '#ffffff' }, '60': { pct: 70, toward: '#ffffff' },
  '70': { pct: 50, toward: '#ffffff' }, '80': { pct: 30, toward: '#ffffff' },
  '90': { pct: 15, toward: '#ffffff' }, '95': { pct: 8, toward: '#ffffff' },
};

/** What HA-LCARS's generic (non-LCARdS) theme fallback would have produced from a single seed hex. */
export function computeHaDefaultScale(seedHex) {
  const scale = {};
  for (const tone of TONE_ORDER) {
    const mix = HA_DEFAULT_MIX[tone];
    scale[tone] = mix === null ? seedHex : lerpOklch(mix.toward, seedHex, mix.pct / 100);
  }
  return scale;
}

// ─── LCARdS palette tone <-> `--lcards-<family>-<suffix>` var naming ─────

/** HA tone slot -> the GREEN_ALERT_PALETTE key suffix for that slot (e.g. '05' -> 'darkest', '40' -> ''/bare key). */
export const TONE_SUFFIX = {
  5: 'darkest', 10: '10', 20: 'dark', 30: 'medium-dark', 40: '',
  50: '50', 60: '60', 70: 'medium-light', 80: 'light', 90: 'lightest', 95: '95',
};

/** @returns {string} the GREEN_ALERT_PALETTE key for (family, tone), e.g. toneKey('orange', 5) -> 'orange-darkest' */
export function toneKey(family, tone) {
  const suffix = TONE_SUFFIX[Number(tone)];
  return suffix ? `${family}-${suffix}` : family;
}

/** @returns {string} the `--lcards-*` var name for (family, tone), e.g. lcardsToneVarName('orange', 5) -> '--lcards-orange-darkest' */
export function lcardsToneVarName(family, tone) {
  return `--lcards-${toneKey(family, tone)}`;
}

/** HA semantic-role -> LCARdS-palette-role slot (the 5 roles Palette Seed lets a user assign a family to). */
export const ROLE_TO_SLOT = {
  primary: 'primary', neutral: 'neutral', disabled: 'neutral',
  danger: 'red', warning: 'orange', success: 'green',
};

/** The 5 HA-mapped palette roles a Theme Generator profile assigns a LCARdS family to. */
export const HA_PALETTE_ROLES = ['primary', 'neutral', 'orange', 'red', 'green'];

// ─── WebAwesome color indirection layer ──────────────────────────────────
// Transcribed verbatim (color-relevant lines only — the static geometry ones,
// e.g. --wa-panel-border-radius/-style/-width and --wa-shadow-l, aren't
// derived from any --ha-color-* var and don't need re-declaring) from
// frontend/src/resources/theme/color/wa.globals.ts's `html {...}` block.
// That block is declared only at <html> — a descendant wrapper overriding
// just the leaf --ha-color-* tokens (as the in-app generator's live preview
// does) won't retroactively change this already-frozen indirection, since
// CSS custom properties don't re-resolve var() at inheriting descendants.
// ha-button (extends webawesome's Button) reads the generic, unprefixed
// --wa-color-fill-normal/-loud/-on-normal names for its resting-state
// colors, not the leaf tokens directly — re-declaring this same mapping on
// a themed wrapper, pointing at the same leaf vars, makes it re-theme
// correctly at any DOM depth. Static — never derived from the theme being
// edited — safe to spread into a preview wrapper's style as-is.
export const WA_COLOR_ALIAS_VARS = {
  '--wa-color-brand-fill-loud': 'var(--ha-color-fill-primary-loud-resting)',
  '--wa-color-brand-fill-normal': 'var(--ha-color-fill-primary-normal-resting)',
  '--wa-color-brand-fill-quiet': 'var(--ha-color-fill-primary-quiet-hover)',
  '--wa-color-brand-border-loud': 'var(--ha-color-border-primary-loud)',
  '--wa-color-brand-border-normal': 'var(--ha-color-primary-50)',
  '--wa-color-brand-border-quiet': 'var(--ha-color-border-primary-quiet)',
  '--wa-color-brand-on-loud': 'var(--ha-color-on-primary-loud)',
  '--wa-color-brand-on-normal': 'var(--ha-color-on-primary-normal)',
  '--wa-color-brand-on-quiet': 'var(--ha-color-on-primary-quiet)',

  '--wa-color-neutral-fill-loud': 'var(--ha-color-fill-neutral-loud-resting)',
  '--wa-color-neutral-fill-normal': 'var(--ha-color-fill-neutral-normal-resting)',
  '--wa-color-neutral-fill-quiet': 'var(--ha-color-fill-neutral-quiet-hover)',
  '--wa-color-neutral-border-loud': 'var(--ha-color-border-neutral-loud)',
  '--wa-color-neutral-border-normal': 'var(--ha-color-border-neutral-normal)',
  '--wa-color-neutral-border-quiet': 'var(--ha-color-border-neutral-quiet)',
  '--wa-color-neutral-on-loud': 'var(--ha-color-on-neutral-loud)',
  '--wa-color-neutral-on-normal': 'var(--ha-color-on-neutral-normal)',
  '--wa-color-neutral-on-quiet': 'var(--ha-color-on-neutral-quiet)',

  '--wa-color-success-fill-loud': 'var(--ha-color-fill-success-loud-resting)',
  '--wa-color-success-fill-normal': 'var(--ha-color-fill-success-normal-resting)',
  '--wa-color-success-fill-quiet': 'var(--ha-color-fill-success-quiet-hover)',
  '--wa-color-success-border-loud': 'var(--ha-color-border-success-loud)',
  '--wa-color-success-border-normal': 'var(--ha-color-border-success-normal)',
  '--wa-color-success-border-quiet': 'var(--ha-color-border-success-quiet)',
  '--wa-color-success-on-loud': 'var(--ha-color-on-success-loud)',
  '--wa-color-success-on-normal': 'var(--ha-color-on-success-normal)',
  '--wa-color-success-on-quiet': 'var(--ha-color-on-success-quiet)',

  '--wa-color-warning-fill-loud': 'var(--ha-color-fill-warning-loud-resting)',
  '--wa-color-warning-fill-normal': 'var(--ha-color-fill-warning-normal-resting)',
  '--wa-color-warning-fill-quiet': 'var(--ha-color-fill-warning-quiet-hover)',
  '--wa-color-warning-border-loud': 'var(--ha-color-border-warning-loud)',
  '--wa-color-warning-border-normal': 'var(--ha-color-border-warning-normal)',
  '--wa-color-warning-border-quiet': 'var(--ha-color-border-warning-quiet)',
  '--wa-color-warning-on-loud': 'var(--ha-color-on-warning-loud)',
  '--wa-color-warning-on-normal': 'var(--ha-color-on-warning-normal)',
  '--wa-color-warning-on-quiet': 'var(--ha-color-on-warning-quiet)',

  '--wa-color-danger-fill-loud': 'var(--ha-color-fill-danger-loud-resting)',
  '--wa-color-danger-fill-normal': 'var(--ha-color-fill-danger-normal-resting)',
  '--wa-color-danger-fill-quiet': 'var(--ha-color-fill-danger-quiet-hover)',
  '--wa-color-danger-border-loud': 'var(--ha-color-border-danger-loud)',
  '--wa-color-danger-border-normal': 'var(--ha-color-border-danger-normal)',
  '--wa-color-danger-border-quiet': 'var(--ha-color-border-danger-quiet)',
  '--wa-color-danger-on-loud': 'var(--ha-color-on-danger-loud)',
  '--wa-color-danger-on-normal': 'var(--ha-color-on-danger-normal)',
  '--wa-color-danger-on-quiet': 'var(--ha-color-on-danger-quiet)',

  '--wa-color-text-quiet': 'var(--ha-color-text-secondary)',
  '--wa-color-text-normal': 'var(--primary-text-color)',
  '--wa-color-surface-default': 'var(--card-background-color)',
  '--wa-color-surface-border': 'var(--ha-color-border-neutral-quiet)',
  '--wa-form-control-border-color': 'var(--ha-color-border-neutral-quiet)',
  '--wa-form-control-value-color': 'var(--primary-text-color)',
  '--wa-form-control-placeholder-color': 'var(--ha-color-text-secondary)',
};

// ─── HA semantic tone-index convention ───────────────────────────────────
// Transcribed verbatim from frontend/src/resources/theme/color/semantic.globals.ts
// (light block / dark block). Family-agnostic: callers resolve `role -> family`
// and `(family, tone) -> {var, hex}` themselves via the `resolveTone` callback,
// since the Node release scripts and the in-app generator each source that
// differently (parsed static palette text vs. live-edited UI state).

export const SEMANTIC_ROLES = ['primary', 'neutral', 'disabled', 'danger', 'warning', 'success'];
export const BORDER_ROLES = ['primary', 'neutral', 'danger', 'warning', 'success'];
export const SEMANTIC_TIERS = ['quiet', 'normal', 'loud'];
export const AA_THRESHOLD = 4.5;

export const BORDER = {
  primary: { light: { quiet: 90, normal: 70, loud: 40 }, dark: {} },
  neutral: { light: { quiet: 90, normal: 60, loud: 40 }, dark: { quiet: 40, normal: 50, loud: 70 } },
  danger: { light: { quiet: 90, normal: 70, loud: 40 }, dark: { normal: 50, loud: 50 } },
  warning: { light: { quiet: 90, normal: 70, loud: 40 }, dark: { normal: 50, loud: 50 } },
  success: { light: { quiet: 90, normal: 70, loud: 40 }, dark: {} },
};

export const ON = {
  // loud entries are the literal string 'WHITE' except on-disabled (tone-based)
  primary: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60 } },
  neutral: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
  disabled: { light: { quiet: 80, normal: 70, loud: 95 }, dark: { quiet: 40, normal: 50, loud: 50 } },
  danger: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
  warning: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
  success: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
};

export const FILL = {
  primary: {
    // normal-tier light-mode resting/active pinned to tone-80/70 rather than
    // HA's mechanical tone-90/80 — see generate-lcards-ha-semantic-tokens.js
    // history: some LCARdS lightest stops are deliberately vivid accents, not
    // smooth ramp continuations, and using them here broke the
    // quiet<normal<loud prominence ordering for at least one family.
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 80, hover: 70, active: 80 }, loud: { resting: 40, hover: 30, active: 40 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 } },
  },
  neutral: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 40, hover: 30, active: 40 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 60, hover: 70, active: 60 } },
  },
  disabled: {
    light: { quiet: { resting: 95, hover: 90 }, normal: { resting: 95, hover: 90 }, loud: { resting: 80, hover: 70 } },
    dark: { quiet: { resting: 10, hover: 20 }, normal: { resting: 20, hover: 30 }, loud: { resting: 30, hover: 40 } },
  },
  danger: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 50, hover: 40, active: 50 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 40, hover: 30, active: 40 } },
  },
  warning: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 70, hover: 50, active: 70 } }, // HA's own orange exception: loud=70 not 40/50
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 40, hover: 30, active: 40 } },
  },
  success: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 50, hover: 40, active: 50 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 40, hover: 30, active: 40 } },
  },
};

export const SURFACE = {
  light: {
    default: 'WHITE', low: { role: 'neutral', tone: 95 }, lower: { role: 'neutral', tone: 90 },
    'default-inverted': { role: 'neutral', tone: 10 }, 'low-inverted': { role: 'neutral', tone: 5 }, 'lower-inverted': 'BLACK',
    'on-surface-default': { role: 'neutral', tone: 5 },
  },
  dark: {
    default: { role: 'neutral', tone: 10 }, low: { role: 'neutral', tone: 5 }, lower: 'BLACK',
    'default-inverted': 'WHITE', 'low-inverted': { role: 'neutral', tone: 95 },
    'lower-inverted': { role: 'neutral', tone: 90 }, // HA source: --ha-color-90 (dangling), substituted with neutral-90
    'on-surface-default': { role: 'neutral', tone: 95 },
  },
};

export const FORM_BACKGROUND_TONES = {
  light: { hover: 90, disabled: 80 },
  dark: { hover: 30, disabled: 20 },
};

/**
 * @callback ResolveTone
 * @param {string} role - semantic role, e.g. 'primary'/'danger'
 * @param {number|'WHITE'|'BLACK'} spec - HA tone number, or a fixed endpoint
 * @param {string} [mode] - 'light'|'dark', for callers whose underlying palette can itself differ by mode
 *   (ha-lcars's own palette never does — its shipped themes only vary the tone-index *selection* below, not the
 *   palette itself — but this generator's Palette Seed optionally allows a genuinely different palette per mode,
 *   e.g. a custom family reassigned to a different hue in dark mode). Callers that don't care can ignore it.
 * @returns {{var: string, hex: string}}
 */

/**
 * Resolves one `ha-color-on-{role}-{tier}` entry with Phase-2 WCAG validation: if HA's mechanical
 * tone-index default fails AA (4.5:1) against the paired fill-resting background, substitutes
 * whichever candidate gives the best result.
 *
 * For `tier === 'normal'` or `tier === 'quiet'`, also validates against `ambientBgHex` and expands
 * the correction search to every tone in this role's own scale (`TONE_ORDER`), not just white/black
 * — both tiers drive a real ha-button appearance that renders with no solid fill behind it at rest
 * (showing whatever's actually behind the button — in HA-LCARS, always near-black), so a value
 * validated only against its "own" fill-resting background can look fine in isolation while being
 * unreadable, or worse (literally identical colour) once corrected, against what's actually there.
 * Confirmed directly against the real `@home-assistant/webawesome@3.7.0-ha.0` package (matching the
 * version pinned in the local `frontend` checkout, `dist/components/button/button.styles.js`) and
 * `frontend/src/components/ha-button.ts`'s own overrides — the two tiers map to two different real
 * ha-button appearances, not one shared token as an earlier version of this comment claimed:
 *   - `normal` → **Filled** (WA's own base rule) **and Plain** (`ha-button.ts` explicitly
 *     redirects Plain's WA default of `on-quiet` to `on-normal` instead, matching Filled).
 *   - `quiet` → **Outlined only** (WA's own base default for Outlined; `ha-button.ts` never
 *     touches Outlined's enabled-state color at all — only its `.disabled` state).
 *   - `loud` → **Accent** (WA's own base rule) — excluded from both the ambient check and the
 *     expanded search: Accent's real background is always a solid loud-fill, never transparent,
 *     and HA's own `semantic.globals.ts` hard-codes on-loud as always literally white, never a
 *     family tone.
 * Confirmed with real data (both "LCARS Default" and LCARdS's own "LCARS Picard [LCARdS Blue
 * Accent]" profile, light mode, `normal` tier/Primary role): mechanical text measured 2.93:1 /
 * 1.92:1 against Filled's own background (fails, used to trigger correction to black) but 4.98:1 /
 * 7.54:1 against black (passes on its own) — the old single-background correction turned an
 * already-readable-against-the-real-page colour into 1.00:1 (literally identical) the moment
 * Plain read the same corrected value. Same class of bug independently affects Outlined via
 * `quiet`, previously not covered by either fix at all.
 *
 * The expanded search means a same-family substitute wins whenever one actually clears both
 * checks, rather than jumping straight to white/black the instant the mechanical tone-index's own
 * pick fails — and it takes the FIRST candidate (mechanical, then its own scale dark-to-light via
 * `TONE_ORDER`, then white, then black) that clears both outright, not whichever scores highest.
 * Confirmed real case this distinction actually matters for: LCARdS Blue Accent's Success role in
 * dark mode has a mechanical (tone-10) `normal` text that fails both checks, and that same green
 * family's tone-80 already clears both comfortably at 6.96:1 — but white measures 15.47:1 there, so
 * a "maximize contrast" search would always prefer white over a perfectly good, on-brand green;
 * "first good enough" correctly keeps tone-80 instead.
 *
 * Only when nothing passes both checks outright (a real, confirmed case for some role/theme
 * combinations — e.g. Blue Accent's Danger in dark mode never clears the fill check at any tone in
 * its own ramp, topping out at 2.99:1) does this fall back to whichever candidate has the best
 * worst-case ratio across the two backgrounds.
 * @param {ResolveTone} resolveTone
 * @param {(role:string, tier:string) => {var:string, hex:string}} resolveFillResting - resolves fill-{tier}-resting for the same (role, mode); ignored for tier === 'quiet' (see above)
 * @param {string} [ambientBgHex] - the theme's own real backdrop (e.g. card-background-color) — only consulted for tier === 'normal'/'quiet'
 * @returns {{var: string, hex: string, usedTone: string|null, corrected: boolean, mechanicalRatio: number, finalRatio: number}}
 *   usedTone is the TONE_ORDER key actually driving the returned colour, or null when white/black won.
 *   mechanicalRatio is the pre-correction ratio against whichever background is actually meaningful for this tier (fill-resting for 'normal'/'loud', ambient alone for 'quiet') — equal to finalRatio when not corrected and no ambient check applies.
 *   finalRatio is the worst-case ratio across whichever background(s) were actually checked.
 */
export function resolveOnEntry(resolveTone, resolveFillResting, role, mode, tier, ambientBgHex) {
  const modeData = ON[role][mode]?.[tier] !== undefined ? ON[role][mode] : ON[role].light;
  const spec = modeData[tier] !== undefined ? modeData[tier] : ON[role].light[tier];
  const mechanical = resolveTone(role === 'disabled' ? 'disabled' : role, spec, mode);
  const expandedTier = tier === 'normal' || tier === 'quiet';
  const useAmbient = expandedTier && !!ambientBgHex;
  // fill-quiet-resting isn't a real background for anything: Outlined (the only appearance driven
  // by `quiet`) is transparent at rest, and its hover fill reads fill-quiet-HOVER, a different value
  // than "resting" — confirmed against the real WA/ha-button CSS (see this function's own doc
  // comment). Checking against it anyway was a phantom constraint nothing ever actually renders,
  // and it was failing on its own even when the text was perfectly readable against every
  // background Outlined genuinely shows (confirmed real case: Blue Accent's Danger role in dark
  // mode reads fine against ambient black at 8.79:1, but the phantom fill-quiet-resting check
  // alone measured 2.16:1, dragging the whole result down to a forced white). So `quiet` skips the
  // fill check entirely and is judged on the ambient background alone.
  const isFillMeaningful = tier !== 'quiet';
  const fillHex = isFillMeaningful ? resolveFillResting(role, tier).hex : null;

  const ratiosFor = (hex) => ({
    fill: isFillMeaningful ? wcagContrast(hex, fillHex) : Infinity,
    ambient: useAmbient ? wcagContrast(hex, ambientBgHex) : Infinity,
  });
  const mech = ratiosFor(mechanical.hex);
  const mechanicalRatio = isFillMeaningful ? mech.fill : mech.ambient;
  if (mech.fill >= AA_THRESHOLD && mech.ambient >= AA_THRESHOLD) {
    const mechTone = spec === 'WHITE' || spec === 'BLACK' ? null : String(spec).padStart(2, '0');
    return { var: mechanical.var, hex: mechanical.hex, usedTone: mechTone, corrected: false, mechanicalRatio, finalRatio: Math.min(mech.fill, mech.ambient) };
  }

  const mechTone = spec === 'WHITE' || spec === 'BLACK' ? null : String(spec).padStart(2, '0');
  const candidates = [{ var: mechanical.var, hex: mechanical.hex, tone: mechTone, ratios: mech }];
  if (expandedTier) {
    for (const tone of TONE_ORDER) {
      const c = resolveTone(role === 'disabled' ? 'disabled' : role, Number(tone), mode);
      candidates.push({ var: c.var, hex: c.hex, tone, ratios: ratiosFor(c.hex) });
    }
  }
  candidates.push({ var: 'var(--white-color)', hex: '#ffffff', tone: null, ratios: ratiosFor('#ffffff') });
  candidates.push({ var: 'var(--black-color)', hex: '#000000', tone: null, ratios: ratiosFor('#000000') });

  // Prefer the FIRST candidate (in the order built above: mechanical, then this role's own scale
  // dark-to-light, then white, then black) that clears both thresholds outright, rather than
  // whichever scores highest overall — confirmed real case this got wrong: LCARdS Blue Accent's
  // Success role in dark mode has a same-family tone-80 that already clears both at 6.96:1, comfortably
  // above the 4.5:1 floor, but white measures 15.47:1 there, so a pure "maximize contrast" search
  // always preferred white over a perfectly good, on-brand green. Only when nothing clears both
  // outright (a real, separate case — e.g. that same theme's Danger role, whose whole ramp tops out
  // at 2.99:1 against its own fill background no matter which tone is tried) does this fall back to
  // whichever candidate has the best worst-case ratio.
  let best = candidates.find(c => Math.min(c.ratios.fill, c.ratios.ambient) >= AA_THRESHOLD);
  if (!best) {
    best = candidates[0];
    for (const c of candidates) {
      const worst = Math.min(c.ratios.fill, c.ratios.ambient);
      if (worst > Math.min(best.ratios.fill, best.ratios.ambient)) best = c;
    }
  }
  return {
    var: best.var,
    hex: best.hex,
    usedTone: best.tone,
    corrected: best.hex !== mechanical.hex,
    mechanicalRatio,
    finalRatio: Math.min(best.ratios.fill, best.ratios.ambient),
  };
}

/** @param {ResolveTone} resolveTone */
export function resolveFillEntry(resolveTone, role, mode, tier, state) {
  const tierData = FILL[role][mode]?.[tier] ?? FILL[role].light[tier];
  const spec = tierData[state] !== undefined ? tierData[state] : FILL[role].light[tier][state];
  return resolveTone(role, spec, mode);
}

/** @param {ResolveTone} resolveTone */
export function resolveBorderEntry(resolveTone, role, mode, tier) {
  const spec = BORDER[role][mode]?.[tier] !== undefined ? BORDER[role][mode][tier] : BORDER[role].light[tier];
  return resolveTone(role, spec, mode);
}

/** @param {ResolveTone} resolveTone */
export function resolveSurfaceEntry(resolveTone, mode, key) {
  const spec = SURFACE[mode][key];
  if (spec === 'WHITE') return { var: 'var(--white-color)', hex: '#ffffff' };
  if (spec === 'BLACK') return { var: 'var(--black-color)', hex: '#000000' };
  return resolveTone(spec.role, spec.tone, mode);
}

/** @param {ResolveTone} resolveTone */
export function resolveFormBackgroundEntry(resolveTone, mode, key) {
  return resolveTone('neutral', FORM_BACKGROUND_TONES[mode][key], mode);
}

// ─── Domain / state color roster ─────────────────────────────────────────
//
// HA colors ~29 domains' entity states via `--state-<domain>[-<device_class>]
// -<state>-color`. This used to also include a rule-based default-colour
// guesser (a named lock/climate table plus a generic on/off/problem word
// classifier) — removed deliberately: HA's own real CSS fallback chain
// (confirmed against frontend/src/common/entity/state_color.ts) already
// walks --state-<domain>-<state>-color -> --state-<domain>-<active|inactive>
// -color -> --state-active-color/--state-inactive-color on its own, entirely
// in the browser, the moment a (domain, state) pair is simply left undefined
// in the exported theme. Guessing a value here just meant exporting a role-
// based colour for every row whether the user asked for one or not, which
// silently drifted from those same real HA-native fallback fields (now
// rendered as this section's own "Global Fallback" group) the instant either
// one changed independently. Every row is opt-in now — see
// _renderDomainStateRow/_buildExportModel in lcards-theme-generator-view.js.

/**
 * A pragmatic starter roster of well-known HA domains and their most common
 * states — not all ~29 `STATE_COLORED_DOMAIN` domains, just the high-value
 * ones with stable, well-documented state vocabularies. Extend by appending;
 * anything missing is still reachable via the generator UI's raw override
 * table.
 */
export const DOMAIN_STATES = {
  light: ['on', 'off'],
  switch: ['on', 'off'],
  fan: ['on', 'off'],
  cover: ['open', 'closed', 'opening', 'closing'],
  lock: ['locked', 'unlocked', 'locking', 'unlocking', 'open', 'jammed'],
  climate: ['auto', 'cool', 'heat', 'heat_cool', 'dry', 'fan_only', 'manual', 'idle', 'off'],
  binary_sensor: ['on', 'off'],
  alarm_control_panel: ['armed_home', 'armed_away', 'armed_night', 'armed_vacation', 'pending', 'arming', 'disarmed', 'triggered'],
  media_player: ['playing', 'paused', 'idle', 'off'],
  person: ['home', 'not_home'],
  device_tracker: ['home', 'not_home'],
  humidifier: ['on', 'off'],
  vacuum: ['cleaning', 'docked', 'returning', 'error', 'idle'],
  siren: ['on', 'off'],
  water_heater: ['on', 'off', 'eco', 'gas', 'heat_pump', 'high_demand', 'electric'],
  valve: ['open', 'closed', 'opening', 'closing'],
  input_boolean: ['on', 'off'],
  automation: ['on', 'off'],
  sun: ['above_horizon', 'below_horizon'],
};

/**
 * HA core's own real baseline colors — never live-DOM-derived (see lcards-theme-generator-view.js's
 * _staticHaDefault doc comment for why that's fundamentally impossible to get right: HA applies a
 * theme via inline style on <html>, which unconditionally wins the cascade over HA's own `html {}`
 * baseline rule for that same element, so nothing short of a genuinely separate <html> element could
 * ever see "the baseline without the active theme" live). Hand-transcribed, once, directly from HA
 * core source — not derived, not guessed:
 *  - ha-color-<primary|neutral|orange|red|green>-<tone>: frontend/src/resources/theme/color/
 *    core.globals.ts (every bundled ha-lcars theme defines its own primary ramp, but ha-lcars's
 *    *shared* boilerplate anchor doesn't — confirmed absent there — so this is the only real
 *    fallback for a genuinely role-less "primary" preview).
 *  - info-color/success-color/warning-color/error-color/state-inactive-color/state-unavailable-color/
 *    state-climate-heat_cool-color: frontend/src/resources/theme/color/color.globals.ts's `html {}`
 *    block (light mode), each var() reference resolved by hand against that same file's own
 *    named-color table (e.g. --amber-color: #ffc107). Only entries not already covered by ha-lcars's
 *    own shared boilerplate anchor are included — confirmed directly, not assumed: lock's full
 *    DOMAIN_STATES roster and 7 of climate's 9 states are genuinely in that shared anchor already
 *    (color.globals.ts itself defines no state-<domain>-inactive-color for any domain at all either —
 *    every "off"/inactive state falls straight through to the generic state-inactive-color/
 *    state-active-color pair, i.e. Domain & State Colours' own Global Fallback tier, so there's
 *    nothing to transcribe for those).
 */
export const HA_CORE_DEFAULTS = {
  'ha-color-primary-05': '#001721', 'ha-color-primary-10': '#002e3e', 'ha-color-primary-20': '#004156',
  'ha-color-primary-30': '#006787', 'ha-color-primary-40': '#009ac7', 'ha-color-primary-50': '#18bcf2',
  'ha-color-primary-60': '#37c8fd', 'ha-color-primary-70': '#7bd4fb', 'ha-color-primary-80': '#b9e6fc',
  'ha-color-primary-90': '#dff3fc', 'ha-color-primary-95': '#eff9fe',
  'ha-color-neutral-05': '#141414', 'ha-color-neutral-10': '#202020', 'ha-color-neutral-20': '#363636',
  'ha-color-neutral-30': '#4a4a4a', 'ha-color-neutral-40': '#5e5e5e', 'ha-color-neutral-50': '#7a7a7a',
  'ha-color-neutral-60': '#989898', 'ha-color-neutral-70': '#b1b1b1', 'ha-color-neutral-80': '#cccccc',
  'ha-color-neutral-90': '#e6e6e6', 'ha-color-neutral-95': '#f3f3f3',
  'ha-color-orange-05': '#280700', 'ha-color-orange-10': '#3b0f00', 'ha-color-orange-20': '#5e1c00',
  'ha-color-orange-30': '#7e2900', 'ha-color-orange-40': '#9d3800', 'ha-color-orange-50': '#c94e00',
  'ha-color-orange-60': '#f36d00', 'ha-color-orange-70': '#ff9342', 'ha-color-orange-80': '#ffbb89',
  'ha-color-orange-90': '#ffe0c8', 'ha-color-orange-95': '#fff0e4',
  'ha-color-red-05': '#2a040b', 'ha-color-red-10': '#3e0913', 'ha-color-red-20': '#631323',
  'ha-color-red-30': '#8a132c', 'ha-color-red-40': '#b30532', 'ha-color-red-50': '#dc3146',
  'ha-color-red-60': '#f3676c', 'ha-color-red-70': '#fd8f90', 'ha-color-red-80': '#ffb8b6',
  'ha-color-red-90': '#ffdedc', 'ha-color-red-95': '#fff0ef',
  'ha-color-green-05': '#031608', 'ha-color-green-10': '#052310', 'ha-color-green-20': '#0a3a1d',
  'ha-color-green-30': '#0a5027', 'ha-color-green-40': '#036730', 'ha-color-green-50': '#00883c',
  'ha-color-green-60': '#00ac49', 'ha-color-green-70': '#5dc36f', 'ha-color-green-80': '#93da98',
  'ha-color-green-90': '#c2f2c1', 'ha-color-green-95': '#e3f9e3',

  'info-color': '#039be5',
  'success-color': '#43a047',
  'warning-color': '#ffa600',
  'error-color': '#db4437',
  'state-inactive-color': '#9e9e9e',
  'state-unavailable-color': '#bdbdbd',

  // lock's full DOMAIN_STATES roster and 7 of climate's 9 states (all but heat_cool/off) are
  // genuinely in ha-lcars's own shared boilerplate anchor (confirmed directly, not assumed) — those
  // resolve via _staticHaDefault's tier 1 already, so only climate's real gap needs an entry here.
  'state-climate-heat_cool-color': '#ffc107',

  'state-alarm_control_panel-armed_home-color': '#4caf50',
  'state-alarm_control_panel-armed_away-color': '#4caf50',
  'state-alarm_control_panel-armed_night-color': '#4caf50',
  'state-alarm_control_panel-armed_vacation-color': '#4caf50',
  'state-alarm_control_panel-arming-color': '#ff9800',
  'state-alarm_control_panel-pending-color': '#ff9800',
  'state-alarm_control_panel-triggered-color': '#f44336',
  'state-binary_sensor-active-color': '#ffc107',
  'state-cover-active-color': '#926bc7',
  'state-device_tracker-home-color': '#4caf50',
  'state-device_tracker-active-color': '#2196f3',
  'state-fan-active-color': '#00bcd4',
  'state-humidifier-on-color': '#2196f3',
  'state-light-active-color': '#ffc107',
  'state-media_player-active-color': '#03a9f4',
  'state-person-home-color': '#4caf50',
  'state-person-active-color': '#2196f3',
  'state-siren-active-color': '#f44336',
  'state-switch-active-color': '#ffc107',
  'state-vacuum-active-color': '#009688',
  'state-valve-active-color': '#2196f3',
  'state-sun-above_horizon-color': '#ffc107',
  'state-sun-below_horizon-color': '#3f51b5',
  'state-water_heater-eco-color': '#4caf50',
  'state-water_heater-electric-color': '#ff9800',
  'state-water_heater-gas-color': '#ff9800',
  'state-water_heater-heat_pump-color': '#ff9800',
  'state-water_heater-high_demand-color': '#ff6f22',
};

// ─── YAML output formatting ───────────────────────────────────────────────

/** Quotes a scalar if it contains characters unsafe in unquoted YAML (`#` starts a comment when preceded by whitespace, as in `var(--x, #fff)`; `:` can be misread as a mapping separator). */
function yamlScalar(value) {
  if (value === '' || value === null || value === undefined) return '""';
  const str = String(value);
  if (/[#:]/.test(str) || /^[[{]/.test(str)) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

/**
 * Serializes a generated theme profile to pasteable HA theme YAML: a single
 * top-level `<name>:` block of flat key/value pairs, plus a `modes: {light,
 * dark}` block for anything mode-specific — matching the convention already
 * used by `yaml/theme/ha-lcars-lcards-themes.yaml`.
 * @param {{name: string, mergeKeys?: string[], flat: Object<string,string>, modes?: {light?: Object<string,string>, dark?: Object<string,string>}}} model
 *   `mergeKeys` are YAML anchor names (e.g. 'lcars-variables', 'base', 'card-mod-css') emitted as
 *   `<<: *name` lines — real ha-lcars themes always merge these in; explicit keys below still win.
 * @returns {string}
 */
export function formatThemeYaml({ name, mergeKeys, flat, modes }) {
  const lines = [`${yamlScalar(name)}:`];
  // Every real ha-lcars theme sets this to its own theme name — card-mod (the frontend module
  // ha-lcars's card-mod-*-yaml CSS blocks depend on) uses it to scope that CSS to this specific
  // theme. Always first, before the merge-key anchors, matching every bundled theme's own ordering.
  lines.push(`  card-mod-theme: ${yamlScalar(name)}`);
  for (const anchor of mergeKeys || []) {
    lines.push(`  <<: *${anchor}`);
  }
  for (const [key, value] of Object.entries(flat || {})) {
    lines.push(`  ${key}: ${yamlScalar(value)}`);
  }

  const modeNames = ['light', 'dark'].filter(m => modes?.[m] && Object.keys(modes[m]).length > 0);
  if (modeNames.length) {
    lines.push('  modes:');
    for (const mode of modeNames) {
      lines.push(`    ${mode}:`);
      for (const [key, value] of Object.entries(modes[mode])) {
        lines.push(`      ${key}: ${yamlScalar(value)}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}
