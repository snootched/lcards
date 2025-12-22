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

// ============================================================================
// ALERT MODE SYSTEM
// ============================================================================

import { transformColorToAlertMode, ALERT_MODE_TRANSFORMS } from './alertModeTransform.js';

// Re-export ALERT_MODE_TRANSFORMS for external use
export { ALERT_MODE_TRANSFORMS } from './alertModeTransform.js';

/**
 * Reload Home Assistant theme to restore original CSS variables
 * 
 * @param {Object} hass - Home Assistant instance
 * @returns {Promise<void>}
 */
export async function reloadHATheme(hass) {
  if (!hass) {
    lcardsLog.warn('[PaletteInjector] Cannot reload theme - HASS not available');
    return;
  }
  
  try {
    lcardsLog.info('[PaletteInjector] Reloading HA theme...');
    await hass.callService('frontend', 'reload_themes');
    lcardsLog.info('[PaletteInjector] ✅ Theme reloaded');
  } catch (error) {
    lcardsLog.error('[PaletteInjector] ❌ Theme reload failed:', error);
    throw error;
  }
}

/**
 * Set alert mode by transforming all --lcars-* variables
 * 
 * @param {string} mode - Alert mode ('green_alert', 'red_alert', etc.)
 * @param {Object} hass - Home Assistant instance (required for reload)
 * @param {Element} [rootElement] - Target element (default: document.documentElement)
 * @returns {Promise<void>}
 */
export async function setAlertMode(mode, hass, rootElement = null) {
  const root = rootElement || document.documentElement;
  
  // Validate mode
  if (!ALERT_MODE_TRANSFORMS[mode]) {
    lcardsLog.warn(`[PaletteInjector] Unknown alert mode: ${mode}, using green_alert`);
    mode = 'green_alert';
  }
  
  // Handle green_alert (normal mode) - restore original theme
  if (mode === 'green_alert') {
    await reloadHATheme(hass);
    lcardsLog.info('[PaletteInjector] ✅ Restored to normal mode');
  } else {
    // Transform ALL --lcars-* variables
    await transformAndApplyAlertMode(mode, root);
    lcardsLog.info(`[PaletteInjector] ✅ Alert mode: ${mode}`);
  }
  
  // Dispatch event for cards to react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lcards-alert-mode-changed', {
      detail: { mode }
    }));
  }
}

/**
 * Transform and apply alert mode to all --lcars-* variables
 * 
 * @param {string} mode - Alert mode
 * @param {Element} root - Root element
 * @private
 */
async function transformAndApplyAlertMode(mode, root) {
  const computedStyle = getComputedStyle(root);
  const lcarsVars = {};
  let transformCount = 0;
  
  // Enumerate ALL --lcars-* variables (but not --lcards-*)
  for (let i = 0; i < computedStyle.length; i++) {
    const varName = computedStyle[i];
    
    if (varName.startsWith('--lcars-') && !varName.startsWith('--lcards-')) {
      const value = computedStyle.getPropertyValue(varName).trim();
      if (value) {
        lcarsVars[varName] = value;
      }
    }
  }
  
  lcardsLog.debug(`[PaletteInjector] Found ${Object.keys(lcarsVars).length} --lcars-* variables`);
  
  // Transform and apply
  Object.entries(lcarsVars).forEach(([varName, color]) => {
    const transformed = transformColorToAlertMode(color, mode);
    if (transformed !== color) {
      root.style.setProperty(varName, transformed);
      transformCount++;
    }
  });
  
  lcardsLog.debug(`[PaletteInjector] Transformed ${transformCount} variables`);
}
