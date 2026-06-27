/**
 * @fileoverview ColorUtils - Complete color manipulation utilities
 *
 * Provides color transformation functions for use in computed tokens.
 * Supports hex, rgb, rgba, hsl, hsla, and CSS variable color formats.
 * Handles CSS variables by using modern CSS color-mix() for runtime computation.
 *
 * @module msd/themes/ColorUtils
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * ColorUtils - Utilities for color manipulation
 *
 * All methods handle CSS variables using CSS color-mix() for runtime computation.
 * Direct color values (hex, rgb) are computed at load time.
 */
export class ColorUtils {
  /**
   * Darken a color by percentage
   *
   * @param {string} color - Color value (hex, rgb, or CSS variable)
   * @param {number} [percent=0.2] - Percentage to darken (0-1)
   * @returns {string} Darkened color
   *
   * @example
   * ColorUtils.darken('#FF9900', 0.2) // Returns 'rgb(204, 122, 0)'
   * ColorUtils.darken('var(--lcars-orange)', 0.3) // Returns 'color-mix(in srgb, var(--lcars-orange) 70%, black 30%)'
   */
  static darken(color, percent = 0.2) {
    // Handle CSS variables with color-mix() for runtime computation
    if (this._isCssVariable(color)) {
      const percentage = Math.round(percent * 100);
      return `color-mix(in srgb, ${color} ${100 - percentage}%, black ${percentage}%)`;
    }

    // Handle direct colors - compute at load time
    const rgb = this._parseColor(color);
    if (!rgb) {
      // Check if this looks like an unresolved token reference
      if (typeof color === 'string' && color.includes('.') && !color.startsWith('#') && !color.startsWith('rgb')) {
        lcardsLog.warn(`[ColorUtils] darken() received what appears to be an unresolved token: '${color}' - returning unchanged`);
      }
      return color;
    }

    const darkened = rgb.map(val => Math.max(0, Math.floor(val * (1 - percent))));
    return this._rgbToHex(darkened[0], darkened[1], darkened[2]);
  }

  /**
   * Lighten a color by percentage
   *
   * @param {string} color - Color value
   * @param {number} [percent=0.2] - Percentage to lighten (0-1)
   * @returns {string} Lightened color
   *
   * @example
   * ColorUtils.lighten('#FF9900', 0.2) // Returns 'rgb(255, 173, 51)'
   * ColorUtils.lighten('var(--lcars-orange)', 0.2) // Returns 'color-mix(in srgb, var(--lcars-orange) 80%, white 20%)'
   */
  static lighten(color, percent = 0.2) {
    // Handle CSS variables with color-mix()
    if (this._isCssVariable(color)) {
      const percentage = Math.round(percent * 100);
      const result = `color-mix(in srgb, ${color} ${100 - percentage}%, white ${percentage}%)`;
      return result;
    }

    // Handle direct colors
    const rgb = this._parseColor(color);
    if (!rgb) {
      // Check if this looks like an unresolved token reference
      if (typeof color === 'string' && color.includes('.') && !color.startsWith('#') && !color.startsWith('rgb')) {
        lcardsLog.warn(`[ColorUtils] lighten() received what appears to be an unresolved token: '${color}' - returning unchanged`);
      }
      lcardsLog.debug(`[ColorUtils.lighten] Unable to parse color, returning unchanged:`, color);
      return color;
    }

    const lightened = rgb.map(val => Math.min(255, Math.floor(val + (255 - val) * percent)));
    return this._rgbToHex(lightened[0], lightened[1], lightened[2]);
  }

  /**
   * Adjust alpha/opacity of a color
   *
   * @param {string} color - Color value
   * @param {number} [alpha=1.0] - Alpha value (0-1)
   * @returns {string} Color with alpha
   *
   * @example
   * ColorUtils.alpha('#FF9900', 0.5) // Returns 'rgba(255, 153, 0, 0.5)'
   * ColorUtils.alpha('var(--lcars-orange)', 0.5) // Returns 'color-mix(in srgb, var(--lcars-orange) 50%, transparent)'
   */
  static alpha(color, alpha = 1.0) {
    // Handle CSS variables with color-mix()
    if (this._isCssVariable(color)) {
      const percentage = Math.round(alpha * 100);
      return `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
    }

    // Handle direct colors
    const rgb = this._parseColor(color);
    if (!rgb) {
      // Check if this looks like an unresolved token reference
      if (typeof color === 'string' && color.includes('.') && !color.startsWith('#') && !color.startsWith('rgb')) {
        lcardsLog.warn(`[ColorUtils] alpha() received what appears to be an unresolved token: '${color}' - returning unchanged`);
      }
      return color;
    }

    return `rgba(${rgb.join(', ')}, ${alpha})`;
  }

  /**
   * Saturate a color (increase saturation)
   *
   * @param {string} color - Color value
   * @param {number} [percent=0.2] - Saturation increase (0-1)
   * @returns {string} Saturated color
   *
   * @example
   * ColorUtils.saturate('#FF9900', 0.3) // Returns more vibrant orange
   */
  static saturate(color, percent = 0.2) {
    // CSS variables require browser-side computation (future enhancement)
    if (this._isCssVariable(color)) {
      lcardsLog.warn('[ColorUtils] saturate() with CSS variables not yet supported, returning original');
      return color;
    }

    const hsl = this._rgbToHsl(this._parseColor(color));
    if (!hsl) return color;

    hsl[1] = Math.min(100, hsl[1] + (percent * 100));
    return this._hslToRgbHex(hsl);
  }

  /**
   * Desaturate a color (move toward grayscale)
   *
   * @param {string} color - Color value
   * @param {number} [percent=0.2] - Desaturation amount (0-1)
   * @returns {string} Desaturated color
   *
   * @example
   * ColorUtils.desaturate('#FF9900', 0.5) // Returns muted orange
   */
  static desaturate(color, percent = 0.2) {
    // CSS variables require browser-side computation (future enhancement)
    if (this._isCssVariable(color)) {
      lcardsLog.warn('[ColorUtils] desaturate() with CSS variables not yet supported, returning original');
      return color;
    }

    const hsl = this._rgbToHsl(this._parseColor(color));
    if (!hsl) return color;

    hsl[1] = Math.max(0, hsl[1] - (percent * 100));
    return this._hslToRgbHex(hsl);
  }

  /**
   * Mix two colors
   *
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @param {number} [weight=0.5] - Weight of first color (0-1)
   * @returns {string} Mixed color
   *
   * @example
   * ColorUtils.mix('#FF9900', '#9999FF', 0.5) // Returns color halfway between
   * ColorUtils.mix('var(--lcars-orange)', 'var(--lcars-blue)', 0.5) // Returns 'color-mix(in srgb, var(--lcars-orange) 50%, var(--lcars-blue) 50%)'
   * ColorUtils.mix('rgba(0,0,128,0.18)', '#ff0000', 0.5) // Preserves interpolated alpha
   */
  static mix(color1, color2, weight = 0.5) {
    // Handle CSS variables with color-mix()
    if (this._isCssVariable(color1) || this._isCssVariable(color2)) {
      const percentage1 = Math.round(weight * 100);
      const percentage2 = 100 - percentage1;
      return `color-mix(in srgb, ${color1} ${percentage1}%, ${color2} ${percentage2}%)`;
    }

    // Handle direct colors
    const rgb1 = this._parseColor(color1);
    const rgb2 = this._parseColor(color2);
    if (!rgb1 || !rgb2) return color1;

    const mixed = rgb1.map((val, i) =>
      Math.floor(val * weight + rgb2[i] * (1 - weight))
    );

    // Preserve alpha channel if either input carries one (from rgba() values).
    // _parseColor() only extracts [r, g, b]; extract alpha separately here.
    const a1 = this._parseColorAlpha(color1);
    const a2 = this._parseColorAlpha(color2);
    if (a1 !== null || a2 !== null) {
      const mixedAlpha = Math.round(((a1 ?? 1) * weight + (a2 ?? 1) * (1 - weight)) * 1000) / 1000;
      return `rgba(${mixed[0]}, ${mixed[1]}, ${mixed[2]}, ${mixedAlpha})`;
    }

    return this._rgbToHex(mixed[0], mixed[1], mixed[2]);
  }

  /**
   * Extract the alpha value from an rgba() color string.
   * Returns null for fully-opaque or non-rgba inputs so callers can
   * distinguish "no alpha specified" from "alpha = 1".
   *
   * @private
   * @param {string} color - Color string
   * @returns {number|null} Alpha (0–1) or null when absent / fully opaque
   */
  static _parseColorAlpha(color) {
    if (!color || typeof color !== 'string') return null;
    const match = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
    if (!match) return null;
    const a = parseFloat(match[1]);
    // Treat alpha=1 as "no alpha info" so we don't output redundant rgba() for opaque colors
    return a < 1 ? a : null;
  }

  /**
   * Resolve all CSS variables in a string to their computed values.
   *
   * Each `var()` in the input is replaced in-place so that multi-value CSS
   * properties — font-family stacks, background shorthands, etc. — are fully
   * preserved.  The previous implementation matched only the **first** `var()`
   * and returned its resolved value, silently discarding the rest of the string.
   *
   * Single-var expressions (e.g. a plain color token) behave identically to
   * before: the resolved value is returned directly.
   *
   * Overloads allow TypeScript to infer the return type from the input type so
   * callers that pass a `string` don't need a cast to re-narrow the result.
   *
   * @overload
   * @param {string} value
   * @param {string} [defaultValue]
   * @returns {string}
   */
  /**
   * @overload
   * @param {string[]} value
   * @param {string} [defaultValue]
   * @returns {string[]}
   */
  /**
   * @param {string|string[]} value - CSS value that may contain one or more var(), or an array of values
   * @param {string} [defaultValue='#000000'] - Fallback for each var() that cannot be resolved
   * @param {Element|null} [element=null] - Element to read computed styles from. When provided,
   *   CSS custom properties are read from this element's computed context (which inherits from
   *   parent elements, including HA section/view containers that carry per-section theme vars).
   *   Defaults to document.documentElement for backward-compatibility.
   * @returns {string|string[]} Input with every var() replaced by its computed value
   *
   * @example
   * // Single var — unchanged behaviour
   * ColorUtils.resolveCssVariable('var(--primary-color, #ff0000)') // => computed or '#ff0000'
   * ColorUtils.resolveCssVariable('var(--color)')                  // => computed or '#000000'
   * ColorUtils.resolveCssVariable('#ff0000')                       // => '#ff0000' (passthrough)
   *
   * // Multi-value strings — fixed: full string preserved
   * ColorUtils.resolveCssVariable("var(--lcars-font), 'Antonio', sans-serif")
   *   // => "Tungsten, 'Antonio', sans-serif"  (not just "Tungsten")
   *
   * // Arrays
   * ColorUtils.resolveCssVariable(['var(--color1)', 'var(--color2)']) // => [resolved1, resolved2]
   *
   * // Element-scoped (reads from card's inherited CSS context, picks up section-scoped theme vars)
   * ColorUtils.resolveCssVariable('var(--lcars-card-top-color)', '#888', this)
   */
  static resolveCssVariable(value, defaultValue = '#000000', element = null, _depth = 0) {
    // Handle arrays recursively
    if (Array.isArray(value)) {
      return value.map(v => this.resolveCssVariable(v, defaultValue, element, _depth));
    }

    // Non-string or falsy values pass through unchanged
    if (!value || typeof value !== 'string') {
      return value;
    }

    if (!value.includes('var(')) {
      return value;
    }

    // Guard against circular var() references (e.g. --a: var(--b); --b: var(--a)).
    if (_depth > 10) {
      lcardsLog.warn('[ColorUtils] resolveCssVariable: max recursion depth reached, returning default');
      return defaultValue;
    }

    // Replace every var() occurrence in-place.
    // The regex handles one level of syntactic nesting — var(--a, var(--b, #x)).
    // Deep chains (--a: var(--b); --b: #x) are followed by _resolveSingleVar's
    // recursive call into this method when the obtained property value is itself
    // a var() reference.
    const resolved = value.replace(
      /var\((?:[^)(]|\([^)]*\))*\)/g,
      (varExpr) => this._resolveSingleVar(varExpr, defaultValue, element, _depth)
    );

    lcardsLog.trace(`[ColorUtils] resolveCssVariable: ${value} → ${resolved}`);
    return resolved;
  }

  /**
   * Resolve a single, complete `var(--name, fallback)` expression.
   *
   * @private
   * @param {string} varExpr - A complete `var(...)` token
   * @param {string} defaultValue - Last-resort value if the var is undefined and has no fallback
   * @param {Element|null} [element=null] - Element to read computed styles from (threaded through
   *   from resolveCssVariable). Falls back to document.documentElement when null.
   * @param {number} [_depth=0] - Recursion depth counter (internal use only).
   * @returns {string} Resolved value
   */
  static _resolveSingleVar(varExpr, defaultValue, element = null, _depth = 0) {
    const el = element || document.documentElement;

    // Extract --custom-property-name and optional fallback.
    // The fallback capture group is greedy so it picks up everything after the
    // first comma, including nested var() expressions.
    const match = varExpr.match(/^var\(\s*(--[^,)]+?)\s*(?:,\s*([\s\S]+))?\s*\)$/);
    if (!match) {
      // Malformed var() — attempt a best-effort extraction
      const nameMatch = varExpr.match(/var\(\s*(--[^,)]+)/);
      if (nameMatch) {
        try {
          const computed = getComputedStyle(el)
            .getPropertyValue(nameMatch[1].trim()).trim();
          if (computed) return computed;
        } catch (_) { /* ignore */ }
      }
      return defaultValue;
    }

    const varName = match[1].trim();
    const fallback = match[2]?.trim();

    try {
      const computed = getComputedStyle(el)
        .getPropertyValue(varName).trim();
      if (computed) {
        lcardsLog.trace(`[ColorUtils] ✅ Resolved ${varName} → ${computed}`);
        // HA themes commonly chain vars (--a: var(--b); --b: #hex).
        // getPropertyValue returns the raw token value, not the fully computed
        // colour, so follow the chain until we reach a concrete value.
        if (computed.includes('var(')) {
          return String(this.resolveCssVariable(computed, defaultValue, element, _depth + 1));
        }
        return computed;
      }
    } catch (e) {
      lcardsLog.trace(`[ColorUtils] ⚠️ getComputedStyle failed for ${varName}:`, e.message);
    }

    // Var is undefined — recurse into the CSS-level fallback if one exists.
    // String() cast: resolveCssVariable returns string|string[] depending on
    // input type, but fallback is always a string here so the result is always
    // a string. The cast keeps _resolveSingleVar's return type consistent.
    if (fallback) {
      return String(this.resolveCssVariable(fallback, defaultValue, element, _depth + 1));
    }

    lcardsLog.trace(`[ColorUtils] ⚠️ Using default for ${varExpr}: ${defaultValue}`);
    return defaultValue;
  }

  // ─── Public primitives ────────────────────────────────────────────────────

  /**
   * Parse color string to RGB array
   *
   * @param {string} color - Color string (hex, rgb, rgba)
   * @returns {Array<number>|null} [r, g, b] or null if unparseable
   *
   * @example
   * ColorUtils.parseColor('#FF9900') // Returns [255, 153, 0]
   */
  static parseColor(color) {
    return this._parseColor(color);
  }

  /**
   * Convert RGB values to hex string
   *
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} Hex color (#RRGGBB)
   *
   * @example
   * ColorUtils.rgbToHex(255, 153, 0) // Returns '#ff9900'
   */
  static rgbToHex(r, g, b) {
    return this._rgbToHex(r, g, b);
  }

  /**
   * Convert RGB values to HSL array
   *
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {Array<number>} [h, s, l] where h=0-360, s=0-100, l=0-100
   *
   * @example
   * ColorUtils.rgbToHsl(255, 153, 0) // Returns approximately [36, 100, 50]
   */
  static rgbToHsl(r, g, b) {
    return this._rgbToHsl([r, g, b]);
  }

  /**
   * Convert HSL values to hex color string
   *
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color (#RRGGBB)
   *
   * @example
   * ColorUtils.hslToRgb(36, 100, 50) // Returns '#ff8000'
   */
  static hslToRgb(h, s, l) {
    return this._hslToRgbHex([h, s, l]);
  }

  /**
   * Convert HS (Hue/Saturation) + brightness to RGB
   *
   * Used for converting Home Assistant light entity hs_color attributes.
   * This is an HSV-style conversion where the third parameter is brightness (value),
   * not HSL lightness.
   *
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} [brightness=255] - Brightness / Value (0-255)
   * @returns {Array<number>} [r, g, b]
   *
   * @example
   * ColorUtils.hsToRgb(30, 100, 255) // Returns [255, 128, 0]
   */
  static hsToRgb(h, s, brightness = 255) {
    h = h / 360;
    s = s / 100;
    const v = brightness / 255;

    let r, g, b;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  }

  /**
   * Convert a colour temperature in Kelvin to an approximate RGB value.
   *
   * Uses Tanner Helland's piecewise algorithm which gives visually accurate
   * results for the 1000–40000 K range used by smart-home lighting.
   *
   * @param {number} kelvin - Colour temperature in Kelvin (clamped to 1000–40000)
   * @returns {[number, number, number]} [r, g, b] integers in 0–255 range
   *
   * @example
   * ColorUtils.kelvinToRgb(2700) // Returns approximately [255, 169, 87] — warm white
   * ColorUtils.kelvinToRgb(6500) // Returns approximately [255, 249, 253] — daylight
   */
  static kelvinToRgb(kelvin) {
    // Algorithm works in units of 100 K
    const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;

    let r, g, b;

    // Red channel
    if (temp <= 66) {
      r = 255;
    } else {
      r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      r = Math.max(0, Math.min(255, r));
    }

    // Green channel
    if (temp <= 66) {
      g = 99.4708025861 * Math.log(temp) - 161.1195681661;
      g = Math.max(0, Math.min(255, g));
    } else {
      g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
      g = Math.max(0, Math.min(255, g));
    }

    // Blue channel
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
      b = Math.max(0, Math.min(255, b));
    }

    return [Math.round(r), Math.round(g), Math.round(b)];
  }

  /**
   * Calculate relative luminance (WCAG formula)
   *
   * @param {string} color - Color value (hex, rgb, rgba)
   * @returns {number} Luminance value (0-1), or 0.5 if unparseable
   *
   * @example
   * ColorUtils.luminance('#ffffff') // Returns 1
   * ColorUtils.luminance('#000000') // Returns 0
   */
  static luminance(color) {
    const rgb = this._parseColor(color);
    if (!rgb) return 0.5;

    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Get high-contrast text color for a given background
   *
   * @param {string} bgColor - Background color
   * @returns {string} 'black' or 'white'
   *
   * @example
   * ColorUtils.contrastColor('#ffffff') // Returns 'black'
   * ColorUtils.contrastColor('#000000') // Returns 'white'
   */
  static contrastColor(bgColor) {
    return this.luminance(bgColor) > 0.5 ? 'black' : 'white';
  }

  /**
   * Check if value is a CSS variable reference
   *
   * @private
   * @param {string} value - Value to check
   * @returns {boolean} True if CSS variable
   */
  static _isCssVariable(value) {
    return typeof value === 'string' && value.includes('var(');
  }

  /**
   * Parse color string to RGB array
   *
   * Supports:
   * - Hex: #RRGGBB or #RGB
   * - RGB: rgb(r, g, b)
   * - RGBA: rgba(r, g, b, a)
   *
   * @private
   * @param {string} color - Color string
   * @returns {Array<number>|null} [r, g, b] or null if unparseable
   */
  static _parseColor(color) {
    if (!color) return null;

    // Remove whitespace
    color = color.trim();

    // Hex format: #RRGGBB, #RRGGBBAA, #RGB, or #RGBA
    if (color.startsWith('#')) {
      const hex = color.slice(1);

      // #RGB format
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      }

      // #RGBA format (4 chars)
      if (hex.length === 4) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
        // Alpha channel (hex[3]) is ignored for HSL transformation
      }

      // #RRGGBB format
      if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }

      // #RRGGBBAA format (8 chars) - ignore alpha channel
      if (hex.length === 8) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
        // Alpha channel (hex.slice(6, 8)) is ignored for HSL transformation
      }
    }

    // RGB/RGBA format: rgb(r, g, b) or rgba(r, g, b, a)
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]),
        parseInt(rgbMatch[2]),
        parseInt(rgbMatch[3])
      ];
    }

    return null;
  }

  /**
   * Convert RGB values to hex string
   *
   * @private
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} Hex color (#RRGGBB)
   */
  static _rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Convert RGB to HSL
   *
   * @private
   * @param {Array<number>} rgb - [r, g, b] values (0-255)
   * @returns {Array<number>|null} [h, s, l] where h=0-360, s=0-100, l=0-100
   */
  static _rgbToHsl(rgb) {
    if (!rgb) return null;

    let [r, g, b] = rgb;
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return [h * 360, s * 100, l * 100];
  }

  /**
   * Convert HSL to RGB hex
   *
   * @private
   * @param {Array<number>} hsl - [h, s, l] where h=0-360, s=0-100, l=0-100
   * @returns {string} Hex color (#RRGGBB)
   */
  static _hslToRgbHex(hsl) {
    if (!hsl) return '#000000';

    let [h, s, l] = hsl;
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return this._rgbToHex(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
  }
}
