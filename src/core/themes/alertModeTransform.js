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
    hueStrength: 0.6,               // Moderate-strong rotation
    saturationMultiplier: 1.2,      // More vibrant
    lightnessMultiplier: 0.9,       // Slightly darker
    hueAnchor: {
      centerHue: 0,                 // Red
      range: 60,                    // ±60° (magenta to orange: 300°-60°)
      strength: 0.85                // Very strong pull for cohesive personality
    }
  },

  blue_alert: {
    // Shift toward blue (210°), maintain balance
    hueShift: 210,                  // Target deep blue
    hueStrength: 0.6,               // Moderate-strong rotation
    saturationMultiplier: 1.0,
    lightnessMultiplier: 1.0,
    hueAnchor: {
      centerHue: 210,               // Deep blue (not cyan)
      range: 60,                    // Cyan to purple (150°-270°)
      strength: 0.85                // Very strong pull for cohesive personality
    }
  },

  yellow_alert: {
    // Shift toward amber/yellow (45°), brighten
    hueShift: 45,                   // Target amber
    hueStrength: 0.6,               // Moderate-strong rotation
    saturationMultiplier: 1.1,
    lightnessMultiplier: 1.05,
    hueAnchor: {
      centerHue: 45,                // Amber
      range: 45,                    // Orange to yellow (0°-90°)
      strength: 0.8                 // Strong pull
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
    hueAnchor: null  // No anchoring for black alert
  }
};

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
  
  // Calculate shortest distance on circular color wheel
  let distance = hue - centerHue;
  
  // Handle wrap-around (e.g., 350° to 10° is 20°, not 340°)
  if (distance > 180) distance -= 360;
  if (distance < -180) distance += 360;
  
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
 * 3. Apply hue anchoring (pull into target range) - NEW
 * 4. Apply saturation multiplier
 * 5. Apply lightness multiplier
 * 6. Convert back to hex
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
    // Interpolate between current and target hue
    h = h + (targetHue - h) * transform.hueStrength;
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

  // Convert back to hex (using ColorUtils internal API)
  return ColorUtils._hslToRgbHex([h, s, l]);
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
