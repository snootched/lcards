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
 * Alert mode color palettes (from cb-lcars-themes.yaml)
 *
 * Each palette provides complete color sets for all LCARdS components.
 * Naming convention: --lcards-<hue>-<shade> (e.g., --lcards-orange-darkest)
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

export const RED_ALERT_PALETTE = {
  // Oranges
  'orange-darkest': '#8b0000',
  'orange-dark': '#a52a2a',
  'orange-medium-dark': '#b22222',
  'orange': '#dc143c',
  'orange-medium': '#dc143c',  // Alias for base orange
  'orange-medium-light': '#ff0000',
  'orange-light': '#ff4500',
  'orange-lightest': '#ff6347',

  // Grays
  'gray-darkest': '#8b0000',
  'gray-dark': '#a52a2a',
  'gray-medium-dark': '#b22222',
  'gray': '#dc143c',
  'gray-medium': '#dc143c',  // Alias for base gray
  'gray-medium-light': '#ff0000',
  'gray-light': '#ff4500',
  'gray-lightest': '#ff7f50',
  'moonlight': '#ff6347',

  // Blues
  'blue-darkest': '#cd5c5c',
  'blue-dark': '#f08080',
  'blue-medium-dark': '#e9967a',
  'blue': '#fa8072',
  'blue-medium': '#fa8072',  // Alias for base blue
  'blue-medium-light': '#ffa07a',
  'blue-light': '#ff6347',
  'blue-lightest': '#ff4500',

  // Greens
  'green-darkest': '#dc143c',
  'green-dark': '#b22222',
  'green-medium-dark': '#a52a2a',
  'green': '#8b0000',
  'green-medium': '#8b0000',  // Alias for base green
  'green-medium-light': '#ff0000',
  'green-light': '#ff4500',
  'green-lightest': '#ff6347',

  // Yellows
  'yellow-darkest': '#8b0000',
  'yellow-dark': '#a52a2a',
  'yellow-medium-dark': '#b22222',
  'yellow': '#dc143c',
  'yellow-medium': '#dc143c',  // Alias for base yellow
  'yellow-medium-light': '#ff0000',
  'yellow-light': '#ff4500',
  'yellow-lightest': '#ff6347'
};

export const BLUE_ALERT_PALETTE = {
  // Oranges
  'orange-darkest': '#00008b',
  'orange-dark': '#0000cd',
  'orange-medium-dark': '#4169e1',
  'orange': '#4682b4',
  'orange-medium': '#4682b4',  // Alias for base orange
  'orange-medium-light': '#5f9ea0',
  'orange-light': '#87ceeb',
  'orange-lightest': '#b0e0e6',

  // Grays
  'gray-darkest': '#1c1c3c',
  'gray-dark': '#2a2a5a',
  'gray-medium-dark': '#3a3a7a',
  'gray': '#4a4a9a',
  'gray-medium': '#4a4a9a',  // Alias for base gray
  'gray-medium-light': '#5a5ab4',
  'gray-light': '#6a6ad4',
  'gray-lightest': '#7a7af4',
  'moonlight': '#5a5ab4',

  // Blues
  'blue-darkest': '#00008b',
  'blue-dark': '#0000cd',
  'blue-medium-dark': '#4169e1',
  'blue': '#4682b4',
  'blue-medium': '#4682b4',  // Alias for base blue
  'blue-medium-light': '#5f9ea0',
  'blue-light': '#87ceeb',
  'blue-lightest': '#b0e0e6',

  // Greens
  'green-darkest': '#1c1c3c',
  'green-dark': '#2a2a5a',
  'green-medium-dark': '#3a3a7a',
  'green': '#4a4a9a',
  'green-medium': '#4a4a9a',  // Alias for base green
  'green-medium-light': '#5a5ab4',
  'green-light': '#6a6ad4',
  'green-lightest': '#7a7af4',

  // Yellows
  'yellow-darkest': '#1c1c3c',
  'yellow-dark': '#2a2a5a',
  'yellow-medium-dark': '#3a3a7a',
  'yellow': '#4a4a9a',
  'yellow-medium': '#4a4a9a',  // Alias for base yellow
  'yellow-medium-light': '#5a5ab4',
  'yellow-light': '#6a6ad4',
  'yellow-lightest': '#7a7af4'
};

export const YELLOW_ALERT_PALETTE = {
  // Oranges
  'orange-darkest': '#8b4513',
  'orange-dark': '#d2691e',
  'orange-medium-dark': '#ff8c00',
  'orange': '#ffa500',
  'orange-medium': '#ffa500',  // Alias for base orange
  'orange-medium-light': '#ffb84d',
  'orange-light': '#ffd700',
  'orange-lightest': '#ffec8b',

  // Grays
  'gray-darkest': '#4b4b00',
  'gray-dark': '#6b6b00',
  'gray-medium-dark': '#8b8b00',
  'gray': '#abab00',
  'gray-medium': '#abab00',  // Alias for base gray
  'gray-medium-light': '#cbcb00',
  'gray-light': '#ebeb00',
  'gray-lightest': '#fbfb00',
  'moonlight': '#cbcb00',

  // Blues
  'blue-darkest': '#4b4b00',
  'blue-dark': '#6b6b00',
  'blue-medium-dark': '#8b8b00',
  'blue': '#abab00',
  'blue-medium': '#abab00',  // Alias for base blue
  'blue-medium-light': '#cbcb00',
  'blue-light': '#ebeb00',
  'blue-lightest': '#fbfb00',

  // Greens
  'green-darkest': '#4b4b00',
  'green-dark': '#6b6b00',
  'green-medium-dark': '#8b8b00',
  'green': '#abab00',
  'green-medium': '#abab00',  // Alias for base green
  'green-medium-light': '#cbcb00',
  'green-light': '#ebeb00',
  'green-lightest': '#fbfb00',

  // Yellows
  'yellow-darkest': '#8b4513',
  'yellow-dark': '#d2691e',
  'yellow-medium-dark': '#ff8c00',
  'yellow': '#ffa500',
  'yellow-medium': '#ffa500',  // Alias for base yellow
  'yellow-medium-light': '#ffb84d',
  'yellow-light': '#ffd700',
  'yellow-lightest': '#ffec8b'
};

export const GRAY_ALERT_PALETTE = {
  // Oranges
  'orange-darkest': '#2b2b2b',
  'orange-dark': '#3b3b3b',
  'orange-medium-dark': '#4b4b4b',
  'orange': '#5b5b5b',
  'orange-medium': '#5b5b5b',  // Alias for base orange
  'orange-medium-light': '#6b6b6b',
  'orange-light': '#7b7b7b',
  'orange-lightest': '#8b8b8b',

  // Grays
  'gray-darkest': '#2b2b2b',
  'gray-dark': '#3b3b3b',
  'gray-medium-dark': '#4b4b4b',
  'gray': '#5b5b5b',
  'gray-medium': '#5b5b5b',  // Alias for base gray
  'gray-medium-light': '#6b6b6b',
  'gray-light': '#7b7b7b',
  'gray-lightest': '#8b8b8b',
  'moonlight': '#6b6b6b',

  // Blues
  'blue-darkest': '#2b2b2b',
  'blue-dark': '#3b3b3b',
  'blue-medium-dark': '#4b4b4b',
  'blue': '#5b5b5b',
  'blue-medium': '#5b5b5b',  // Alias for base blue
  'blue-medium-light': '#6b6b6b',
  'blue-light': '#7b7b7b',
  'blue-lightest': '#8b8b8b',

  // Greens
  'green-darkest': '#2b2b2b',
  'green-dark': '#3b3b3b',
  'green-medium-dark': '#4b4b4b',
  'green': '#5b5b5b',
  'green-medium': '#5b5b5b',  // Alias for base green
  'green-medium-light': '#6b6b6b',
  'green-light': '#7b7b7b',
  'green-lightest': '#8b8b8b',

  // Yellows
  'yellow-darkest': '#2b2b2b',
  'yellow-dark': '#3b3b3b',
  'yellow-medium-dark': '#4b4b4b',
  'yellow': '#5b5b5b',
  'yellow-medium': '#5b5b5b',  // Alias for base yellow
  'yellow-medium-light': '#6b6b6b',
  'yellow-light': '#7b7b7b',
  'yellow-lightest': '#8b8b8b'
};

export const BLACK_ALERT_PALETTE = {
  // Oranges
  'orange-darkest': '#0d0d0d',
  'orange-dark': '#1a1a1a',
  'orange-medium-dark': '#333333',
  'orange': '#4d4d4d',
  'orange-medium': '#4d4d4d',  // Alias for base orange
  'orange-medium-light': '#666666',
  'orange-light': '#808080',
  'orange-lightest': '#999999',

  // Grays
  'gray-darkest': '#0d0d0d',
  'gray-dark': '#1a1a1a',
  'gray-medium-dark': '#333333',
  'gray': '#4d4d4d',
  'gray-medium': '#4d4d4d',  // Alias for base gray
  'gray-medium-light': '#666666',
  'gray-light': '#808080',
  'gray-lightest': '#999999',
  'moonlight': '#666666',

  // Blues
  'blue-darkest': '#0d0d0d',
  'blue-dark': '#1a1a1a',
  'blue-medium-dark': '#333333',
  'blue': '#4d4d4d',
  'blue-medium': '#4d4d4d',  // Alias for base blue
  'blue-medium-light': '#666666',
  'blue-light': '#808080',
  'blue-lightest': '#999999',

  // Greens
  'green-darkest': '#0d0d0d',
  'green-dark': '#1a1a1a',
  'green-medium-dark': '#333333',
  'green': '#4d4d4d',
  'green-medium': '#4d4d4d',  // Alias for base green
  'green-medium-light': '#666666',
  'green-light': '#808080',
  'green-lightest': '#999999',

  // Yellows
  'yellow-darkest': '#0d0d0d',
  'yellow-dark': '#1a1a1a',
  'yellow-medium-dark': '#333333',
  'yellow': '#4d4d4d',
  'yellow-medium': '#4d4d4d',  // Alias for base yellow
  'yellow-medium-light': '#666666',
  'yellow-light': '#808080',
  'yellow-lightest': '#999999'
};

/**
 * Map alert mode names to their palettes
 */
export const ALERT_MODE_PALETTES = {
  green_alert: GREEN_ALERT_PALETTE,
  red_alert: RED_ALERT_PALETTE,
  blue_alert: BLUE_ALERT_PALETTE,
  yellow_alert: YELLOW_ALERT_PALETTE,
  gray_alert: GRAY_ALERT_PALETTE,
  black_alert: BLACK_ALERT_PALETTE
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
    lcardsLog.warn('[PaletteInjector] Cannot reload theme - Home Assistant instance not available. Theme restoration will fail. Alert mode changes may not revert properly.');
    return;
  }

  try {
    lcardsLog.info('[PaletteInjector] Reloading HA theme...');
    await hass.callService('frontend', 'reload_themes');

    // CRITICAL: Wait for theme to actually apply in the DOM
    // The service call returns immediately but theme application is async
    await new Promise(resolve => setTimeout(resolve, 500));

    lcardsLog.info('[PaletteInjector] ✅ Theme reloaded and applied');
  } catch (error) {
    lcardsLog.error('[PaletteInjector] ❌ Theme reload failed:', error);
    throw error;
  }
}

/**
 * Storage for original (green_alert) color values
 * This prevents color drift when switching between alert modes
 */
let originalLcarsColors = null;

/**
 * Capture and store original --lcars-* color values from current theme
 * Should be called after theme is loaded to capture baseline colors
 *
 * @param {Element} root - Root element
 * @returns {Object} Map of --lcars-* variable names to color values
 */
export function captureOriginalColors(root = null) {
  const element = root || document.documentElement;
  const computedStyle = getComputedStyle(element);
  const colors = {};
  let colorCount = 0;

  for (let i = 0; i < computedStyle.length; i++) {
    const varName = computedStyle[i];

    if (varName.startsWith('--lcars-') && !varName.startsWith('--lcards-')) {
      const value = computedStyle.getPropertyValue(varName).trim();

      // Only store color values (skip dimensions, etc.)
      if (value && value.match(/^#|^rgb|^hsl/i)) {
        colors[varName] = value;
        colorCount++;
      }
    }
  }

  // Store internally for alert mode system
  originalLcarsColors = colors;

  lcardsLog.debug(`[PaletteInjector] Captured ${colorCount} original --lcars-* color values`);
  return colors;
}

/**
 * Set alert mode by injecting appropriate palette
 *
 * @param {string} mode - Alert mode ('green_alert', 'red_alert', etc.)
 * @param {Object} hass - Home Assistant instance (required for theme reload)
 * @param {Element} [rootElement] - Target element (default: document.documentElement)
 * @returns {Promise<void>}
 */
export async function setAlertMode(mode, hass, rootElement = null) {
  const root = rootElement || document.documentElement;

  // Validate mode
  const palette = ALERT_MODE_PALETTES[mode];
  if (!palette) {
    lcardsLog.warn(`[PaletteInjector] Unknown alert mode: ${mode}, using green_alert`);
    mode = 'green_alert';
  }

  // Get the appropriate palette
  const targetPalette = ALERT_MODE_PALETTES[mode];

  // Apply blur transition effect during mode switch
  const mainView = document.querySelector('home-assistant')?.shadowRoot?.querySelector('home-assistant-main');
  if (mainView) {
    mainView.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
    mainView.style.filter = 'blur(8px)';
    mainView.style.opacity = '0.6';
  }

  try {
    // Handle green_alert (normal mode) - restore original theme
    if (mode === 'green_alert') {
      // Restore HA-LCARS theme variables (--lcars-*) by reloading theme
      await reloadHATheme(hass);

      // Capture original colors for future transformations
      originalLcarsColors = captureOriginalColors(root);

      // Restore LCARdS fallback palette variables (--lcards-*)
      injectPalette(targetPalette, root);

      lcardsLog.info('[PaletteInjector] ✅ Restored to normal mode');
    } else {
      // Transform from ORIGINAL colors (prevents drift when switching modes)
      // Colors are captured at theme init, so no need to reload here
      await transformAndApplyAlertMode(mode, root, originalLcarsColors);

      // Inject alert mode palette for LCARdS variables (--lcards-*)
      injectPalette(targetPalette, root);

      lcardsLog.info(`[PaletteInjector] ✅ Alert mode: ${mode}`);
    }

    // Wait for next animation frame to ensure styles are applied
    await new Promise(resolve => requestAnimationFrame(resolve));

  } finally {
    // Clear blur transition effect
    if (mainView) {
      // Trigger reflow to ensure transition animates back
      void mainView.offsetHeight;
      mainView.style.filter = '';
      mainView.style.opacity = '';

      // Clean up transition after animation completes
      setTimeout(() => {
        if (mainView) {
          mainView.style.transition = '';
        }
      }, 300);
    }
  }
}

/**
 * Transform and apply alert mode to HA-LCARS theme variables (--lcars-*)
 *
 * Uses HSL transformation to shift HA-LCARS theme colors to match alert mode.
 * LCARdS fallback variables (--lcards-*) use pre-defined palettes instead.
 *
 * CRITICAL: Home Assistant's theme system resolves all var() references at load time,
 * converting them to static hex values. So --lcars-ui-quaternary: var(--lcars-mittelgrau)
 * becomes --lcars-ui-quaternary: #656B83FF. This means we MUST transform ALL variables.
 *
 * By transforming from stored original colors (not current colors), we prevent color drift
 * when switching between modes (e.g., red→blue→yellow always uses green as baseline).
 *
 * @param {string} mode - Alert mode
 * @param {Element} root - Root element
 * @param {Object} originalColors - Map of original --lcars-* color values from green_alert
 * @private
 */
async function transformAndApplyAlertMode(mode, root, originalColors) {
  let transformCount = 0;

  if (!originalColors || Object.keys(originalColors).length === 0) {
    lcardsLog.warn('[PaletteInjector] No original colors provided for transformation');
    return;
  }

  lcardsLog.debug(`[PaletteInjector] Transforming ${Object.keys(originalColors).length} --lcars-* variables from original values`);

  // Transform from ORIGINAL colors (prevents drift)
  Object.entries(originalColors).forEach(([varName, originalColor]) => {
    const transformed = transformColorToAlertMode(originalColor, mode);
    if (transformed !== originalColor) {
      root.style.setProperty(varName, transformed);
      transformCount++;
    }
  });

  lcardsLog.info(`[PaletteInjector] Alert mode '${mode}': Transformed ${transformCount} variables`);
}
