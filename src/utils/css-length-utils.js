/**
 * CSS Length Utilities
 *
 * Provides browser-based measurement of arbitrary CSS <length> expressions for
 * use in SVG/canvas contexts that require resolved pixel values.
 *
 * NOTE: `%` inside complex expressions like `calc(50% - 10px)` or
 * `clamp(0%, 12vw, 200px)` resolves against the viewport/body, NOT the card
 * container, because the probe element is attached to document.body.
 * For viewport-relative sizing that matches a CSS Grid column, prefer
 * `vw`-based expressions: e.g. `clamp(100px, 12vw, 200px)`.
 *
 * `minmax()` is CSS Grid-only syntax and cannot be used here. Convert to the
 * `clamp()` equivalent: `minmax(0px, 45px)` → `clamp(0px, 45px, 45px)`.
 */

/**
 * HA entity IDs follow the pattern `domain.entity_id` (no spaces, no units).
 * This regex matches them so we don't treat them as CSS lengths.
 */
const _HA_ENTITY_RE = /^[a-z_][a-z0-9_]*\.[a-z0-9_]+$/;

/**
 * Sentinel strings used by the elbow card as special keywords — not CSS lengths.
 */
const _SENTINELS = new Set(['theme', 'auto']);

/**
 * Returns true if the given value is a CSS <length> string that needs browser
 * measurement to resolve to pixels.
 *
 * Returns false for:
 *   - non-strings and numbers
 *   - pure numeric strings like "90"
 *   - sentinel keywords: 'theme', 'auto'
 *   - HA entity IDs like 'input_number.lcars_vertical'
 *
 * Returns true for strings containing CSS unit keywords or function names:
 *   vw, vh, vmin, vmax, %, px (with non-trivial expressions), em, rem,
 *   calc(), clamp(), min(), max()
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isCssLengthString(value) {
    if (typeof value !== 'string' || value === '') return false;
    if (_SENTINELS.has(value)) return false;
    if (_HA_ENTITY_RE.test(value)) return false;
    // Pure numeric string — no units
    if (/^\s*-?\d+(\.\d+)?\s*$/.test(value)) return false;
    // Bare px value like "45px" — can be handled by parseFloat, no probe needed
    // but we still let it through so callers can unify the code path.
    // Detect any recognised CSS length marker
    return /vw|vh|vmin|vmax|%|calc\s*\(|clamp\s*\(|min\s*\(|max\s*\(|em|rem/.test(value);
}

/**
 * Resolves a CSS <length> expression to a pixel number by temporarily
 * appending a probe `<div>` to `document.body` and reading its computed width.
 *
 * Works for: vw, vh, vmin, vmax, %, px, em, rem, calc(), clamp(), min(), max(),
 * and any combination thereof.
 *
 * Returns 0 when:
 *   - the DOM is not available (card picker / SSR)
 *   - the value is a plain number (returned as-is, converted to float)
 *   - parsing fails
 *
 * @param {string|number} cssValue  A CSS length string, e.g. "clamp(0px,12vw,45px)"
 * @returns {number}  Resolved pixel value
 */
export function measureCssLength(cssValue) {
    if (typeof cssValue === 'number') return cssValue;
    if (typeof cssValue !== 'string' || cssValue === '') return 0;

    // Fast path — bare px or unitless number
    const bare = cssValue.trim();
    if (/^\s*-?\d+(\.\d+)?\s*(px)?\s*$/.test(bare)) {
        return parseFloat(bare) || 0;
    }

    // DOM probe path
    if (typeof document === 'undefined' || !document.body) return 0;

    const probe = document.createElement('div');
    probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;width:${cssValue};height:0;top:-9999px;left:-9999px;`;
    try {
        document.body.appendChild(probe);
        const px = probe.getBoundingClientRect().width;
        return isFinite(px) ? px : 0;
    } catch (e) {
        return 0;
    } finally {
        if (probe.parentNode) probe.parentNode.removeChild(probe);
    }
}
