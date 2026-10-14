/**
 * resolveColor(): the one way to turn a configured colour into a usable value.
 *
 * Accepts every form in color-syntax.js: `theme:` tokens, bare token paths,
 * computed functions (nested), CSS variables and any CSS colour.
 *
 * Two targets:
 *   - CSS (default): for Lit templates, inline styles and CSS custom
 *     properties. CSS variables stay live (computed functions become
 *     color-mix(var(...))), so alert-mode palette changes apply without a
 *     re-render.
 *   - concrete: for Canvas2D, SVG attributes set from JS, anime.js and
 *     ApexCharts. Returns `#rrggbb` or `rgba(r, g, b, a)`, read at call time
 *     from `element` (so section-scoped theme variables apply).
 *
 * Card state maps (`{ active: ..., inactive: ... }`) and match-light belong to
 * the card pipeline (LCARdSCard._resolveColorValue), which calls this.
 *
 * @module core/themes/resolve-color
 */

import { ColorUtils } from './ColorUtils.js';
import { isComputedColor, isCssColor, parseColor } from './color-syntax.js';

/**
 * @param {*} value - Configured colour
 * @param {Object} [options]
 * @param {boolean} [options.concrete=false] - Return a value Canvas2D/anime.js can use
 * @param {Element|null} [options.element=null] - Element whose CSS variables apply
 * @param {*} [options.fallback] - Returned when the value is empty or cannot be resolved
 *   (an unknown token, or a non-concrete result when `concrete` is set). Defaults to the value.
 * @returns {*} Resolved colour, or the fallback
 */
export function resolveColor(value, { concrete = false, element = null, fallback = value } = {}) {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value !== 'string') return value;

    let out = value.trim();
    const resolver = globalThis.window?.lcards?.core?.themeManager?.resolver;
    if (resolver) {
        const context = {};
        if (element) context.element = element;
        if (concrete) context.materialize = true;
        out = resolver.resolve(out, out, context);
    }
    if (typeof out !== 'string') return out ?? fallback;

    // Unknown token, or an expression nothing could evaluate
    if (out.startsWith('theme:') || isComputedColor(out)) return fallback;
    if (!concrete) return out;

    if (out.includes('var(')) out = ColorUtils.resolveCssVariable(out, '', element);
    return toConcrete(out, element) ?? fallback;
}

/**
 * `#rrggbb` / `rgba()` for a CSS colour without variables; the browser
 * computes color-mix(), lab() and the like.
 * @param {string} color
 * @param {Element|null} element
 * @returns {string|null}
 */
function toConcrete(color, element) {
    if (!color || !isCssColor(color)) return null;
    let c = parseColor(color);
    if (!c) {
        const hex = ColorUtils.toHex(color, { withAlpha: true, element });
        c = hex ? parseColor(hex) : null;
    }
    if (!c) return null;
    if (c.a < 1) return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    return ColorUtils.rgbToHex(c.r, c.g, c.b);
}
