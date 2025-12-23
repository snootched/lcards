/**
 * @fileoverview Alert Mode Color Transformation
 *
 * HSL-based color transformation for Star Trek alert modes.
 * Uses existing ColorUtils for hex/RGB/HSL conversion.
 *
 * @module core/themes/alertModeTransform
 */

import { ColorUtils } from './ColorUtils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Alert mode transformation parameters
 * Each mode defines how to shift hue, saturation, and lightness
 *
 * Hue Anchoring:
 * - centerHue: Target hue to anchor toward (0-360°)
 * - range: Allowed hue variance in degrees (e.g., ±60°)
 * - strength: Pull strength (0.0 = no anchoring, 1.0 = strong pull)
 *
 * Colors outside the range are pulled back toward the range edge.
 * This creates a cohesive color personality for each alert mode.
 */
export const ALERT_MODE_TRANSFORMS = {
  green_alert: {
    // Normal mode — no transformation
    hueShift: 0,
    hueStrength: 0,
    saturationMultiplier: 1.0,
    lightnessMultiplier: 1.0,
    hueAnchor: null  // No anchoring for normal mode
  },

  red_alert: {
    // Shift toward red (0°), boost saturation, darken slightly
    hueShift: 0,                    // Target red
    hueStrength: 0.8,               // Strong rotation for vivid reds
    saturationMultiplier: 1.4,      // High saturation for dramatic red palette
    lightnessMultiplier: 0.9,       // Slightly darker for intensity
    hueAnchor: {
      centerHue: 0,                 // Red
      range: 60,                    // ±60° (magenta to orange: 300°-60°)
      strength: 0.9                 // Very strong pull for cohesive personality
    }
  },

  blue_alert: {
    // Shift toward blue (210°), maintain balance
    hueShift: 210,                  // Target deep blue
    hueStrength: 0.85,              // Strong rotation for vivid blues
    saturationMultiplier: 1.5,      // High saturation (especially for grays)
    lightnessMultiplier: 1.0,
    hueAnchor: {
      centerHue: 210,               // Deep blue (not cyan)
      range: 60,                    // Cyan to purple (150°-270°)
      strength: 0.9                 // Very strong pull for cohesive personality
    }
  },

  yellow_alert: {
    // Shift toward amber/yellow (45°), brighten
    hueShift: 45,                   // Target amber
    hueStrength: 0.9,               // Very strong rotation for vivid yellows
    saturationMultiplier: 1.5,      // High saturation for dramatic amber palette
    lightnessMultiplier: 1.05,
    hueAnchor: {
      centerHue: 45,                // Amber
      range: 50,                    // Slightly wider range (orange to yellow)
      strength: 0.9                 // Very strong pull for cohesive personality
    }
  },

  gray_alert: {
    // Full desaturation (grayscale)
    hueShift: 0,
    hueStrength: 0,
    saturationMultiplier: 0,        // Remove all color
    lightnessMultiplier: 1.0,
    hueAnchor: null  // No anchoring for grayscale
  },

  black_alert: {
    // Desaturate and darken significantly
    hueShift: 0,
    hueStrength: 0,
    saturationMultiplier: 0,
    lightnessMultiplier: 0.3,       // Very dark
    hueAnchor: null,                // No anchoring for black alert
    // Contrast enhancement to maintain readability
    contrastEnhancement: {
      enabled: true,
      threshold: 50,                // Split point: colors below go darker, above go lighter
      darkMultiplier: 0.6,          // Make dark colors even darker (below threshold)
      lightMultiplier: 1.4          // Make light colors lighter (above threshold)
    }
  }
};

/**
 * Calculate shortest distance between two hues on circular color wheel
 *
 * Handles 360°→0° wrapping to always return the shortest path.
 *
 * @param {number} fromHue - Starting hue (0-360°)
 * @param {number} toHue - Target hue (0-360°)
 * @returns {number} Signed distance (-180 to +180°)
 *
 * @example
 * calculateCircularDistance(350, 10)  // Returns: 20 (not 340)
 * calculateCircularDistance(10, 350)  // Returns: -20 (not 340)
 * calculateCircularDistance(100, 200) // Returns: 100
 */
function calculateCircularDistance(fromHue, toHue) {
  let distance = toHue - fromHue;

  // Normalize to shortest path (-180 to +180)
  if (distance > 180) distance -= 360;
  if (distance < -180) distance += 360;

  return distance;
}

/**
 * Apply hue anchoring to pull colors toward a target hue range
 *
 * This creates cohesive alert modes by constraining colors to a specific
 * hue range while preserving their relative distinctiveness.
 *
 * Algorithm:
 * 1. Calculate shortest distance on circular color wheel (handles 360°→0° wrap)
 * 2. If outside allowed range, interpolate toward range edge
 * 3. Apply strength factor to control pull intensity
 *
 * @param {number} hue - Current hue (0-360°)
 * @param {Object} anchor - Anchoring parameters
 * @param {number} anchor.centerHue - Target center hue (0-360°)
 * @param {number} anchor.range - Allowed variance in degrees (e.g., ±60°)
 * @param {number} anchor.strength - Pull strength (0.0-1.0)
 * @returns {number} Anchored hue (0-360°)
 *
 * @example
 * // Red alert: pull cyan (180°) toward red range (300°-60°)
 * applyHueAnchor(180, {centerHue: 0, range: 60, strength: 0.6})
 * // Returns ~104° (orange-yellow, within red alert personality)
 */
function applyHueAnchor(hue, anchor) {
  if (!anchor) return hue;

  const { centerHue, range, strength } = anchor;

  // Validate anchor configuration
  if (centerHue === undefined || range === undefined || strength === undefined) {
    return hue;
  }

  // Calculate shortest distance on circular color wheel
  let distance = calculateCircularDistance(centerHue, hue);

  // If outside allowed range, pull toward range edge
  const absDistance = Math.abs(distance);
  if (absDistance > range) {
    // Target is the edge of the range in the same direction
    const targetDistance = Math.sign(distance) * range;

    // Interpolate between current distance and target distance
    distance = distance + (targetDistance - distance) * strength;
  }

  // Convert back to absolute hue and normalize to 0-360
  const newHue = (centerHue + distance + 360) % 360;
  return newHue;
}

/**
 * Transform a single color to alert mode
 *
 * Uses ColorUtils internal APIs (_parseColor, _rgbToHsl, _hslToRgbHex) for
 * low-level color manipulation. This is intentional as alert mode transformation
 * requires direct HSL manipulation not available in the public ColorUtils API.
 *
 * Transformation Steps:
 * 1. Parse color to RGB, then convert to HSL
 * 2. Apply hue shift (rotation toward target)
 * 3. Apply hue anchoring (pull into target range)
 * 4. Apply saturation multiplier
 * 5. Apply lightness multiplier
 * 6. Apply contrast enhancement (for black_alert readability)
 * 7. Convert back to hex
 *
 * @param {string} color - Original color (hex, rgb, rgba)
 * @param {string} alertMode - Target alert mode
 * @returns {string} Transformed color (hex)
 */
export function transformColorToAlertMode(color, alertMode) {
  const transform = ALERT_MODE_TRANSFORMS[alertMode];
  if (!transform) {
    lcardsLog.warn(`[AlertModeTransform] Unknown mode: ${alertMode}`);
    return color;
  }

  // Skip non-color values
  if (!color || color === 'transparent' || color === 'inherit' || color === 'none') {
    return color;
  }

  // Extract alpha channel if present in 8-char hex (#RRGGBBAA)
  let alphaChannel = null;
  if (color.startsWith('#') && color.length === 9) {
    alphaChannel = color.slice(7, 9); // Extract AA
  }

  // Parse to RGB (using ColorUtils internal API)
  const rgb = ColorUtils._parseColor(color);
  if (!rgb) {
    // Not parseable, return as-is
    return color;
  }

  // Convert to HSL (using ColorUtils internal API)
  const hsl = ColorUtils._rgbToHsl(rgb);
  if (!hsl) return color;

  let [h, s, l] = hsl;

  // Step 1: Apply hue shift (blend toward target hue)
  if (transform.hueStrength > 0) {
    const targetHue = transform.hueShift;

    // Calculate shortest distance on circular color wheel
    const distance = calculateCircularDistance(h, targetHue);

    // Interpolate using shortest path
    h = h + distance * transform.hueStrength;

    // Normalize to 0-360
    h = ((h % 360) + 360) % 360;
  }

  // Step 2: Apply hue anchoring (pull into target range)
  if (transform.hueAnchor) {
    h = applyHueAnchor(h, transform.hueAnchor);
  }

  // Step 3: Apply saturation multiplier
  s = Math.max(0, Math.min(100, s * transform.saturationMultiplier));

  // Step 4: Apply lightness multiplier
  l = Math.max(0, Math.min(100, l * transform.lightnessMultiplier));

  // Step 5: Apply contrast enhancement (for black_alert readability)
  if (transform.contrastEnhancement?.enabled) {
    const { threshold, darkMultiplier, lightMultiplier } = transform.contrastEnhancement;

    // Split colors at threshold and push them apart for better contrast
    if (l < threshold) {
      // Dark colors: make them darker
      l = Math.max(0, l * darkMultiplier);
    } else {
      // Light colors: make them lighter
      l = Math.min(100, l * lightMultiplier);
    }
  }

  // Convert back to hex (using ColorUtils internal API)
  let result = ColorUtils._hslToRgbHex([h, s, l]);

  // Re-append alpha channel if it was present
  if (alphaChannel) {
    result = result + alphaChannel;
  }

  return result;
}

/**
 * Transform all LCARS variables in a collection
 *
 * @param {Object} lcarsVariables - Map of varName → color value
 * @param {string} alertMode - Target alert mode
 * @returns {Object} Transformed variables
 */
export function transformAllLCARSVariables(lcarsVariables, alertMode) {
  const transformed = {};

  Object.entries(lcarsVariables).forEach(([varName, colorValue]) => {
    transformed[varName] = transformColorToAlertMode(colorValue, alertMode);
  });

  return transformed;
}
