/**
 * @fileoverview ColorFamily - Classifies colors into named hue families
 *
 * Pure value-based classification (hue/saturation), independent of CSS
 * variable naming conventions. Used by the theme browser and the in-editor
 * color picker to group/filter colors by how they actually look, not by
 * what they're called (e.g. HA-LCARS names like "almond-creme" or "tomato"
 * give no hint of hue on their own).
 *
 * @module core/themes/ColorFamily
 */

import { ColorUtils } from './ColorUtils.js';

/** Family ids in hue-wheel order; 'gray' is pinned last since it has no hue. */
export const FAMILY_ORDER = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'gray'];

export const FAMILY_LABELS = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  teal: 'Teal/Cyan',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink/Magenta',
  gray: 'Gray/B&W'
};

/** Below this saturation (%) a color is classified as 'gray' regardless of hue. */
const ACHROMATIC_SATURATION_THRESHOLD = 12;

/**
 * Hue bucket boundaries in wheel order, [family, lowerBoundInclusive,
 * upperBoundExclusive]. 'red' wraps around 0/360 (345 -> 15). This is the
 * single source of truth for bucketing AND for the derived range labels
 * and swatch colors below, so they can never drift out of sync.
 * @type {Array<[string, number, number]>}
 */
const HUE_RANGES = [
  ['red', 345, 15],
  ['orange', 15, 45],
  ['yellow', 45, 70],
  ['green', 70, 160],
  ['teal', 160, 195],
  ['blue', 195, 255],
  ['purple', 255, 290],
  ['pink', 290, 345]
];

/**
 * Bucket a hue (0-360) into a family id. Caller must already know the
 * color isn't achromatic.
 * @param {number} hue
 * @returns {string}
 */
function bucketHue(hue) {
  const h = ((hue % 360) + 360) % 360;
  const entry = HUE_RANGES.find(([, lo, hi]) => (lo > hi ? (h >= lo || h < hi) : (h >= lo && h < hi)));
  return entry ? entry[0] : 'pink';
}

/** Fixed sat/lightness used to render representative boundary colors for tooltips/swatches. */
const SWATCH_SATURATION = 70;
const SWATCH_LIGHTNESS = 55;

/**
 * Hex + rgba for a hue at the fixed swatch sat/lightness.
 * @param {number} hue
 * @returns {{hex: string, rgba: string}}
 */
function swatchColorAt(hue) {
  const hex = ColorUtils.hslToRgb(hue, SWATCH_SATURATION, SWATCH_LIGHTNESS);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { hex, rgba: `rgba(${r}, ${g}, ${b}, 1)` };
}

/**
 * Human-readable hue range per family, for chip tooltips — degrees, plus the
 * hex/rgba of the representative colors at each boundary so users who don't
 * think in hue degrees still recognize the range.
 */
export const FAMILY_HUE_RANGES = Object.fromEntries(
  HUE_RANGES.map(([family, lo, hi]) => {
    const loColor = swatchColorAt(lo);
    const hiColor = swatchColorAt(hi);
    return [family, `${lo}°-${hi}°\n${loColor.hex} - ${hiColor.hex}\n${loColor.rgba} - ${hiColor.rgba}`];
  })
);
FAMILY_HUE_RANGES.gray = 'Low saturation (<12%)\ne.g. #999999\ne.g. rgba(153, 153, 153, 1)';

/** Representative swatch color per family (mid-hue, fixed sat/lightness), for chip dots. */
export const FAMILY_SWATCH_COLORS = Object.fromEntries(
  HUE_RANGES.map(([family, lo, hi]) => {
    const span = lo > hi ? (hi + 360 - lo) : (hi - lo);
    const mid = (lo + span / 2) % 360;
    return [family, `hsl(${Math.round(mid)}, 70%, 55%)`];
  })
);
FAMILY_SWATCH_COLORS.gray = 'hsl(0, 0%, 60%)';

/**
 * Resolve a color value (hex, rgb(), or var(--x)) to an [h, s, l] triple.
 * @param {string} value
 * @returns {Array<number>|null}
 */
function toHsl(value) {
  if (!value || typeof value !== 'string') return null;
  const resolved = value.includes('var(') ? ColorUtils.resolveCssVariable(value) : value;
  const rgb = ColorUtils.parseColor(resolved);
  if (!rgb) return null;
  return ColorUtils.rgbToHsl(rgb[0], rgb[1], rgb[2]);
}

/**
 * Classify a color value into a family id, or null if it can't be parsed
 * as a color at all (caller should only invoke this on known-color values).
 * @param {string} value
 * @returns {string|null} one of FAMILY_ORDER, or null
 */
export function getColorFamily(value) {
  const hsl = toHsl(value);
  if (!hsl) return null;
  const [hue, sat] = hsl;
  if (sat < ACHROMATIC_SATURATION_THRESHOLD) return 'gray';
  return bucketHue(hue);
}

/**
 * Build a sort key for grouping colors by family, then by hue, then by
 * lightness — gives a smooth "around the wheel" ordering within a family.
 * @param {string} value
 * @returns {{family: string, hue: number, lightness: number}|null}
 */
export function getColorSortKey(value) {
  const hsl = toHsl(value);
  if (!hsl) return null;
  const [hue, sat, lightness] = hsl;
  const family = sat < ACHROMATIC_SATURATION_THRESHOLD ? 'gray' : bucketHue(hue);
  return { family, hue, lightness };
}

/**
 * Comparator for Array#sort using getColorSortKey() output. Items with no
 * sort key (non-colors) sort after all colors, alphabetically among themselves.
 * @param {{family: string, hue: number, lightness: number}|null} a
 * @param {{family: string, hue: number, lightness: number}|null} b
 * @returns {number}
 */
export function compareColorSortKeys(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const familyDiff = FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
  if (familyDiff !== 0) return familyDiff;
  if (a.hue !== b.hue) return a.hue - b.hue;
  return a.lightness - b.lightness;
}
