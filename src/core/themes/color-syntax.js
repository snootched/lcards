/**
 * Colour syntax: the single definition of what LCARdS accepts as a colour value.
 *
 * Pure module (no DOM; its only import is the pure theme-generator maths) so schemas, workers, editors and node tests
 * can all use it. Everything that recognises, validates or parses a colour
 * string reads from here: the schema pattern, ThemeTokenResolver's computed
 * functions, ColorUtils parsing, the MSD renderer and the editor swatches.
 *
 * Grammar (config values):
 *   - CSS colour:    #RGB · #RGBA · #RRGGBB · #RRGGBBAA, a named colour, transparent,
 *                    currentColor, rgb() · rgba() · hsl() · hsla() · hwb() · lab() · lch()
 *                    · oklab() · oklch() · color() · color-mix(), var(--name)
 *   - Theme token:   theme:path (and theme:<computed expression>)
 *   - Computed:      alpha() · darken() · lighten() · saturate() · desaturate() · mix() · base()
 *                    evaluated by ThemeTokenResolver; arguments may nest
 *   - Card keyword:  match-light (and match-brightness inside a computed function)
 *
 * @module core/themes/color-syntax
 */

import { oklchToRgb } from './themeGeneratorCore.js';

/** CSS named colours (CSS Color Module Level 4), lower case, to hex. */
export const CSS_NAMED_COLORS = Object.freeze({
    aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4',
    azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000',
    blanchedalmond: '#ffebcd', blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a',
    burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00', chocolate: '#d2691e',
    coral: '#ff7f50', cornflowerblue: '#6495ed', cornsilk: '#fff8dc', crimson: '#dc143c',
    cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9', darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00', darkorchid: '#9932cc',
    darkred: '#8b0000', darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1', darkviolet: '#9400d3',
    deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969', dimgrey: '#696969',
    dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22',
    fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700',
    goldenrod: '#daa520', gray: '#808080', green: '#008000', greenyellow: '#adff2f',
    grey: '#808080', honeydew: '#f0fff0', hotpink: '#ff69b4', indianred: '#cd5c5c',
    indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa',
    lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd', lightblue: '#add8e6',
    lightcoral: '#f08080', lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
    lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1', lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa', lightskyblue: '#87cefa', lightslategray: '#778899', lightslategrey: '#778899',
    lightsteelblue: '#b0c4de', lightyellow: '#ffffe0', lime: '#00ff00', limegreen: '#32cd32',
    linen: '#faf0e6', magenta: '#ff00ff', maroon: '#800000', mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd', mediumorchid: '#ba55d3', mediumpurple: '#9370db', mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc', mediumvioletred: '#c71585',
    midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1', moccasin: '#ffe4b5',
    navajowhite: '#ffdead', navy: '#000080', oldlace: '#fdf5e6', olive: '#808000',
    olivedrab: '#6b8e23', orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6',
    palegoldenrod: '#eee8aa', palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#db7093',
    papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb',
    plum: '#dda0dd', powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399',
    red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1', saddlebrown: '#8b4513',
    salmon: '#fa8072', sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee',
    sienna: '#a0522d', silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd',
    slategray: '#708090', slategrey: '#708090', snow: '#fffafa', springgreen: '#00ff7f',
    steelblue: '#4682b4', tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8',
    tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee', wheat: '#f5deb3',
    white: '#ffffff', whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32',
});

/** CSS keywords that are colours but have no fixed RGB (`transparent` parses to alpha 0). */
export const CSS_COLOR_KEYWORDS = Object.freeze(['transparent', 'currentcolor']);

/** CSS colour functions the browser evaluates natively. */
export const CSS_COLOR_FUNCTIONS = Object.freeze([
    'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix',
]);

/**
 * LCARdS computed colour functions, evaluated by ThemeTokenResolver.
 * `mix(a, b, w)` is equivalent to `color-mix(in srgb, a w%, b)`.
 * `base(x)` reads the pre-alert (green_alert) baseline of a token or CSS variable.
 */
export const COMPUTED_COLOR_FUNCTIONS = Object.freeze([
    'alpha', 'darken', 'lighten', 'saturate', 'desaturate', 'mix', 'base',
]);

/** Card-runtime colour keywords, substituted per card at render time. */
export const CARD_COLOR_KEYWORDS = Object.freeze(['match-light', 'match-brightness']);

// Names are [a-z-] only; no escaping needed (and `\-` is invalid under the `u` flag schema tools use)
const fnAlternation = (names) => names.join('|');
const hasName = (name) => Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, name);

/** Matches a string that starts with a computed colour function call. */
export const COMPUTED_COLOR_RE = new RegExp(`^\\s*(${fnAlternation(COMPUTED_COLOR_FUNCTIONS)})\\s*\\(`);

const CSS_FUNCTION_RE = new RegExp(`^(${fnAlternation(CSS_COLOR_FUNCTIONS)})\\(`, 'i');
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * JSON-schema `pattern` for a colour config value. Generated from the lists
 * above so validation accepts exactly what the resolver handles. Named colours
 * are matched in lower case (plus `currentColor`), since schema patterns carry
 * no case-insensitive flag.
 */
export const COLOR_VALUE_PATTERN =
    '^(#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$' +
    `|(${[...Object.keys(CSS_NAMED_COLORS), ...CSS_COLOR_KEYWORDS, 'currentColor', 'match-light'].join('|')})$` +
    '|theme:|var\\(--' +
    `|(${fnAlternation(CSS_COLOR_FUNCTIONS)})\\(` +
    `|(${fnAlternation(COMPUTED_COLOR_FUNCTIONS)})\\()`;

/** @param {*} value @returns {boolean} True for a computed colour expression (`darken(...)` etc.). */
export function isComputedColor(value) {
    return typeof value === 'string' && COMPUTED_COLOR_RE.test(value);
}

/** @param {*} value @returns {boolean} True for a CSS named colour or keyword (`black`, `transparent`). */
export function isNamedColor(value) {
    if (typeof value !== 'string') return false;
    const v = value.trim().toLowerCase();
    return hasName(v) || CSS_COLOR_KEYWORDS.includes(v);
}

/**
 * Colour syntax a browser accepts as-is: hex, named colours, CSS colour
 * functions and `var()`. Excludes LCARdS-only forms (`theme:`, computed
 * functions, match-light).
 * @param {*} value
 * @returns {boolean}
 */
export function isCssColor(value) {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    return HEX_RE.test(v) || isNamedColor(v) || CSS_FUNCTION_RE.test(v) || v.startsWith('var(--');
}

/**
 * Any colour value LCARdS config accepts: CSS colours plus `theme:` tokens,
 * computed functions and match-light. Same grammar as COLOR_VALUE_PATTERN.
 * @param {*} value
 * @returns {boolean}
 */
export function isColorValue(value) {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    return isCssColor(v) || v.startsWith('theme:') || isComputedColor(v) || v === 'match-light';
}

// ── Parsing ──────────────────────────────────────────────────────────────

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Parse a CSS number or percentage; `pctScale` is what 100% maps to. */
function num(token, pctScale) {
    if (token === undefined) return NaN;
    const t = token.trim();
    if (t === 'none') return 0;
    return t.endsWith('%') ? (parseFloat(t) / 100) * pctScale : parseFloat(t);
}

/** Split CSS function arguments: commas or whitespace, with an optional `/ alpha`. */
function fnArgs(inner) {
    const [main, slashAlpha] = inner.split('/');
    const parts = main.includes(',') ? main.split(',') : main.trim().split(/\s+/);
    const args = parts.map(p => p.trim()).filter(Boolean);
    if (slashAlpha !== undefined) args.push(slashAlpha.trim());
    return args;
}

function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/**
 * Parse a concrete CSS colour to RGBA without a DOM.
 *
 * Handles hex (3/4/6/8), named colours, `transparent`, rgb()/rgba()/hsl()/hsla()
 * in comma or space syntax (with `/ alpha`), oklch(), color(srgb ...) and
 * color-mix(in srgb, ...) over any of those (what ColorUtils emits for CSS
 * variables, once materialised). Returns null for anything else (var(),
 * other color-mix() spaces, lab(), LCARdS
 * expressions); callers that need those materialised resolve them first
 * (ColorUtils.toHex() asks the browser).
 *
 * @param {*} value
 * @returns {{r: number, g: number, b: number, a: number}|null} Channels 0-255 (integers), alpha 0-1
 */
export function parseColor(value) {
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    if (!v) return null;

    if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    if (hasName(v)) return parseColor(CSS_NAMED_COLORS[v]);

    const hex = v.match(HEX_RE);
    if (hex) {
        let h = hex[1];
        if (h.length <= 4) h = [...h].map(c => c + c).join('');
        const n = i => parseInt(h.slice(i, i + 2), 16);
        return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1 };
    }

    if (v.startsWith('color-mix(')) return parseColorMix(v);

    const fn = v.match(/^(rgba?|hsla?|oklch|color)\((.*)\)$/);
    if (!fn) return null;
    let args = fnArgs(fn[2]);
    if (fn[1] === 'color') {
        // color(srgb r g b / a), channels 0-1: how browsers serialize a computed color-mix(in srgb, ...)
        if (args[0] !== 'srgb') return null;
        args = args.slice(1).map((t, i) => (i < 3 ? String(num(t, 1) * 255) : t));
    }
    if (args.length < 3) return null;
    const alpha = args[3] === undefined ? 1 : clamp(num(args[3], 1), 0, 1);

    let rgb;
    if (fn[1].startsWith('rgb') || fn[1] === 'color') {
        rgb = args.slice(0, 3).map(t => num(t, 255));
    } else if (fn[1].startsWith('hsl')) {
        rgb = hslToRgb(parseFloat(args[0]), num(args[1], 1) / (args[1].endsWith('%') ? 1 : 100), num(args[2], 1) / (args[2].endsWith('%') ? 1 : 100));
    } else {
        const L = num(args[0], 1);
        const C = args[1].endsWith('%') ? (parseFloat(args[1]) / 100) * 0.4 : parseFloat(args[1]);
        rgb = oklchToRgb(L, C, parseFloat(args[2]));
    }
    if (rgb.some(c => !Number.isFinite(c)) || !Number.isFinite(alpha)) return null;
    const [r, g, b] = rgb.map(c => clamp(Math.round(c), 0, 255));
    return { r, g, b, a: alpha };
}

/** Split on top-level commas (nested parentheses kept together). */
function splitTopLevel(str) {
    const parts = [];
    let depth = 0, start = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') depth--;
        else if (str[i] === ',' && depth === 0) { parts.push(str.slice(start, i).trim()); start = i + 1; }
    }
    parts.push(str.slice(start).trim());
    return parts;
}

/**
 * color-mix(in srgb, <color> [p%], <color> [p%]) per CSS Color 5: percentages
 * normalised (a missing one is 100% minus the other; a sum under 100% scales
 * the alpha), interpolated with premultiplied alpha.
 * @param {string} value - Lower-case, trimmed
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
function parseColorMix(value) {
    const inner = value.match(/^color-mix\((.*)\)$/)?.[1];
    if (!inner) return null;
    const [space, ...stops] = splitTopLevel(inner);
    if (space !== 'in srgb' || stops.length !== 2) return null;

    const parsed = stops.map((stop) => {
        const m = stop.match(/^(.*?)(?:\s+([\d.]+)%)?$/);
        return { color: parseColor(m[1]), pct: m[2] === undefined ? null : parseFloat(m[2]) / 100 };
    });
    if (parsed.some(p => !p.color)) return null;

    // A missing percentage is the complement of the other one; both missing is 50/50.
    const [s1, s2] = parsed.map(p => p.pct);
    let p1 = s1 ?? (s2 === null ? 0.5 : 1 - s2);
    let p2 = s2 ?? (s1 === null ? 0.5 : 1 - s1);
    const sum = p1 + p2;
    if (sum <= 0) return null;
    const scale = Math.min(sum, 1);
    [p1, p2] = [p1 / sum, p2 / sum];

    // Both parsed (checked above).
    const [c1, c2] = /** @type {Array<{r: number, g: number, b: number, a: number}>} */ (parsed.map(p => p.color));
    const a = c1.a * p1 + c2.a * p2;
    const channel = (k) => (a === 0 ? 0 : Math.round((c1[k] * c1.a * p1 + c2[k] * c2.a * p2) / a));
    return { r: channel('r'), g: channel('g'), b: channel('b'), a: Math.round(a * scale * 1000) / 1000 };
}
