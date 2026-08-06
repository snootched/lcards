/**
 * @fileoverview Shared numeric threshold comparison helpers.
 *
 * Centralizes the four canonical comparison operators used across the
 * codebase's independently-implemented "above/below" style config systems
 * (state-color ranges, animation `while` conditions, rules-engine
 * conditions, button preset ranges). Each system keeps its own config-key
 * vocabulary and maps its own keys onto these four operators — this module
 * only owns the leaf boolean, not any system's key-parsing or specificity
 * logic.
 *
 * @module utils/comparison-utils
 */

/** @typedef {'above'|'at_least'|'below'|'at_most'} ComparisonOp */

/**
 * @param {number} value
 * @param {ComparisonOp} op
 * @param {number} threshold
 * @returns {boolean}
 */
export function compareThreshold(value, op, threshold) {
    switch (op) {
        case 'above':    return value > threshold;
        case 'at_least': return value >= threshold;
        case 'below':    return value < threshold;
        case 'at_most':  return value <= threshold;
        default:         return false;
    }
}

/**
 * @param {number} value
 * @param {number} lo
 * @param {number} hi
 * @param {boolean} [exclusive=false] - false: lo <= value <= hi, true: lo < value < hi
 * @returns {boolean}
 */
export function compareBetween(value, lo, hi, exclusive = false) {
    return exclusive ? (value > lo && value < hi) : (value >= lo && value <= hi);
}

/**
 * AND-combines every present bound key against value. Returns false if any
 * present bound fails, or if value is non-numeric. Used by systems whose
 * condition object may carry multiple simultaneous bound keys
 * (above/at_least/below/at_most) that must all hold — e.g. a range expressed
 * as `{ at_least: 20, at_most: 80 }`.
 *
 * @param {*} value
 * @param {{above?: number, at_least?: number, below?: number, at_most?: number}} bounds
 * @returns {boolean}
 */
export function compareNumericBounds(value, bounds) {
    const num = Number(value);
    if (!Number.isFinite(num)) return false;
    if (bounds.above    !== undefined && !compareThreshold(num, 'above', Number(bounds.above)))    return false;
    if (bounds.at_least !== undefined && !compareThreshold(num, 'at_least', Number(bounds.at_least))) return false;
    if (bounds.below    !== undefined && !compareThreshold(num, 'below', Number(bounds.below)))    return false;
    if (bounds.at_most  !== undefined && !compareThreshold(num, 'at_most', Number(bounds.at_most))) return false;
    return true;
}
