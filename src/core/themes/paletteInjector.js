/**
 * @fileoverview Palette Injector - Injects CB-LCARS green_alert palette as CSS variables
 *
 * Converts CB-LCARS palette colors from themes YAML into --lcards-* CSS variables
 * that serve as fallbacks for HA-LCARS theme variables.
 *
 * Naming convention:
 * - CB-LCARS: picard-<shade>-<hue> (e.g., picard-darkest-orange)
 * - LCARdS:   --lcards-<hue>-<shade> (e.g., --lcards-orange-darkest)
 *
 * @module core/themes/paletteInjector
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * CB-LCARS green_alert palette (from cb-lcars-themes.yaml)
 * 
 * This palette provides fallback colors for all LCARdS components when
 * HA-LCARS theme variables are not available.
 */
export const GREEN_ALERT_PALETTE = {
  // Oranges
  'orange-darkest': '#d91604',
  'orange-dark': '#ef1d10',
  'orange-medium-dark': '#e7442a',
  'orange': '#ff6753',
  'orange-medium': '#ff6753',  // Alias for base orange
  'orange-medium-light': '#ff8470',
  'orange-light': '#ff977b',
  'orange-lightest': '#ffb399',

  // Grays
  'gray-darkest': '#1e2229',
  'gray-dark': '#2f3749',
  'gray-medium-dark': '#52596e',
  'gray': '#6d748c',
  'gray-medium': '#6d748c',  // Alias for base gray
  'gray-medium-light': '#9ea5ba',
  'gray-light': '#d2d5df',
  'gray-lightest': '#f3f4f7',
  'moonlight': '#dfe1e8',

  // Blues
  'blue-darkest': '#002241',
  'blue-dark': '#1c3c55',
  'blue-medium-dark': '#2a7193',
  'blue': '#37a6d1',
  'blue-medium': '#37a6d1',  // Alias for base blue
  'blue-medium-light': '#67caf0',
  'blue-light': '#93e1ff',
  'blue-lightest': '#00eeee',

  // Greens
  'green-darkest': '#0c2a15',
  'green-dark': '#083717',
  'green-medium-dark': '#095320',
  'green': '#266239',
  'green-medium': '#266239',  // Alias for base green
  'green-medium-light': '#458359',
  'green-light': '#80bb93',
  'green-lightest': '#b8e0c1',

  // Yellows
  'yellow-darkest': '#70602c',
  'yellow-dark': '#ac943b',
  'yellow-medium-dark': '#d2bf50',
  'yellow': '#f9ef97',
  'yellow-medium': '#f9ef97',  // Alias for base yellow
  'yellow-medium-light': '#fffac9',
  'yellow-light': '#e7e6de',
  'yellow-lightest': '#f5f5dc'
};

/**
 * Inject palette as CSS variables on document root
 * 
 * This function should be called during LCARdS core initialization to ensure
 * all --lcards-* variables are available before any components render.
 * 
 * @param {Object} [palette=GREEN_ALERT_PALETTE] - Palette to inject (defaults to green_alert)
 * @param {Element} [rootElement=document.documentElement] - Element to inject variables on
 */
export function injectPalette(palette = GREEN_ALERT_PALETTE, rootElement = null) {
  if (typeof document === 'undefined') {
    lcardsLog.warn('[PaletteInjector] Document not available, skipping palette injection');
    return;
  }

  const root = rootElement || document.documentElement;

  let injectedCount = 0;
  Object.entries(palette).forEach(([key, value]) => {
    const cssVarName = `--lcards-${key}`;
    root.style.setProperty(cssVarName, value);
    injectedCount++;
  });

  lcardsLog.info(`[PaletteInjector] ✅ Injected ${injectedCount} palette variables as --lcards-*`);
  lcardsLog.debug('[PaletteInjector] Sample injected variables:', {
    '--lcards-orange-medium': palette['orange-medium'],
    '--lcards-gray-medium-light': palette['gray-medium-light'],
    '--lcards-blue-medium': palette['blue-medium'],
    '--lcards-moonlight': palette['moonlight']
  });
}

/**
 * Get a palette color value
 * 
 * @param {string} key - Palette key (e.g., 'orange-medium', 'gray-dark')
 * @param {Object} [palette=GREEN_ALERT_PALETTE] - Palette to query
 * @returns {string|null} Color value or null if not found
 */
export function getPaletteColor(key, palette = GREEN_ALERT_PALETTE) {
  return palette[key] || null;
}

/**
 * Get CSS variable reference for palette color
 * 
 * @param {string} key - Palette key (e.g., 'orange-medium')
 * @param {string} [fallback] - Optional fallback color
 * @returns {string} CSS var() expression
 * 
 * @example
 * getPaletteCSSVar('orange-medium')
 * // Returns: 'var(--lcards-orange-medium)'
 * 
 * getPaletteCSSVar('orange-medium', '#ff6753')
 * // Returns: 'var(--lcards-orange-medium, #ff6753)'
 */
export function getPaletteCSSVar(key, fallback = null) {
  const varName = `--lcards-${key}`;
  return fallback ? `var(${varName}, ${fallback})` : `var(${varName})`;
}

/**
 * Check if palette has been injected
 * 
 * @param {Element} [rootElement=document.documentElement] - Element to check
 * @returns {boolean} True if palette variables are present
 */
export function isPaletteInjected(rootElement = null) {
  if (typeof document === 'undefined') {
    return false;
  }

  const root = rootElement || document.documentElement;
  const testVar = getComputedStyle(root).getPropertyValue('--lcards-orange-medium');
  return !!testVar && testVar.trim().length > 0;
}
