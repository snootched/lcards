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
 */
export const ALERT_MODE_TRANSFORMS = {
  green_alert: {
    // Normal mode — no transformation
    hueShift: 0,
    hueStrength: 0,
    saturationMultiplier: 1.0,
    lightnessMultiplier: 1.0
  },
  
  red_alert: {
    // Shift toward red (0°), boost saturation, darken slightly
    hueShift: 0,
    hueStrength: 0.8,              // Strong pull toward red
    saturationMultiplier: 1.2,      // More vibrant
    lightnessMultiplier: 0.9        // Slightly darker
  },
  
  blue_alert: {
    // Shift toward blue (240°), maintain balance
    hueShift: 240,
    hueStrength: 0.8,
    saturationMultiplier: 1.0,
    lightnessMultiplier: 1.0
  },
  
  yellow_alert: {
    // Shift toward amber/yellow (45°), brighten
    hueShift: 45,
    hueStrength: 0.7,
    saturationMultiplier: 1.1,
    lightnessMultiplier: 1.05
  },
  
  grey_alert: {
    // Full desaturation (grayscale)
    hueShift: 0,
    hueStrength: 0,
    saturationMultiplier: 0,        // Remove all color
    lightnessMultiplier: 1.0
  },
  
  black_alert: {
    // Desaturate and darken significantly
    hueShift: 0,
    hueStrength: 0,
    saturationMultiplier: 0,
    lightnessMultiplier: 0.3        // Very dark
  }
};

/**
 * Transform a single color to alert mode
 * 
 * Uses ColorUtils internal APIs (_parseColor, _rgbToHsl, _hslToRgbHex) for
 * low-level color manipulation. This is intentional as alert mode transformation
 * requires direct HSL manipulation not available in the public ColorUtils API.
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
  
  // Apply hue shift (blend toward target hue)
  if (transform.hueStrength > 0) {
    const targetHue = transform.hueShift;
    // Interpolate between current and target hue
    h = h + (targetHue - h) * transform.hueStrength;
    // Normalize to 0-360
    h = ((h % 360) + 360) % 360;
  }
  
  // Apply saturation multiplier
  s = Math.max(0, Math.min(100, s * transform.saturationMultiplier));
  
  // Apply lightness multiplier
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
