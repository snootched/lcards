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


/**
 * Fix ha-select helper text color by copying from ha-textfield
 * @private
 */
function _fixMdcSelectLabelColor(rootElement = document.documentElement) {
  const styles = getComputedStyle(rootElement);
  const textFieldColor = styles.getPropertyValue('--mdc-text-field-label-ink-color').trim();

  if (textFieldColor) {
    rootElement.style.setProperty('--mdc-select-label-ink-color', textFieldColor);
  }
}

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
    /** @type {HTMLElement} */ (root).style.setProperty(cssVarName, value);
    injectedCount++;
  });

  lcardsLog.info(`[PaletteInjector] ✅ Injected ${injectedCount} palette variables as --lcards-*`);
  lcardsLog.debug('[PaletteInjector] Sample injected variables:', {
    '--lcards-orange-medium': palette['orange-medium'],
    '--lcards-gray-medium-light': palette['gray-medium-light'],
    '--lcards-blue-medium': palette['blue-medium'],
    '--lcards-moonlight': palette['moonlight']
  });

  // Fix missing HA CSS variable: --mdc-select-label-ink-color
  // Some HA themes don't define this variable, causing ha-select helper text to be invisible
  // Copy from --mdc-text-field-label-ink-color which is properly defined
  _fixMdcSelectLabelColor(/** @type {HTMLElement} */ (root));
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
import { runTransitionEffect } from './alertTransitions.js';

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

  // Capture LCARS variables (--lcars-*)
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

  // Also capture Home Assistant state colors (used in LCARS theme)
  const stateColors = ['--success-color', '--warning-color', '--error-color'];
  for (const varName of stateColors) {
    const value = computedStyle.getPropertyValue(varName).trim();
    if (value && value.match(/^#|^rgb|^hsl/i)) {
      colors[varName] = value;
      colorCount++;
    }
  }

  // Store internally for alert mode system
  originalLcarsColors = colors;

  lcardsLog.debug(`[PaletteInjector] Captured ${colorCount} original color values (--lcars-* + HA state colors)`);
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
export async function setAlertMode(mode, hass, rootElement = null, opts = {}) {
  const root = rootElement || document.documentElement;
  const { transitionStyle = 'off' } = opts;

  // Validate mode
  if (!ALERT_MODE_TRANSFORMS[mode]) {
    lcardsLog.warn(`[PaletteInjector] Unknown alert mode: ${mode}, using green_alert`);
    mode = 'green_alert';
  }

  // Locate the main HA view element that transitions will animate.
  const mainView = document.querySelector('home-assistant')
    ?.shadowRoot?.querySelector('home-assistant-main');

  // Wrap all colour-variable work in a callback so each transition effect
  // can call it at the moment the screen is most obscured.
  const colorApplyFn = async () => {
    if (mode === 'green_alert') {
      // Restore HA-LCARS theme variables (--lcars-*) by reloading the HA theme
      await reloadHATheme(hass);
      // Capture original colours for future transformations
      originalLcarsColors = captureOriginalColors(root);
      // Restore LCARdS fallback palette variables (--lcards-*)
      injectPalette(GREEN_ALERT_PALETTE, root);
    } else {
      // Transform from ORIGINAL colours (prevents drift when switching modes)
      await transformAndApplyAlertMode(mode, root, originalLcarsColors);
      // Transform LCARdS fallback variables (--lcards-*) from green_alert baseline
      injectTransformedPalette(mode, root);
    }
    // Wait one frame to ensure styles are applied before transition reveals them
    await new Promise(resolve => requestAnimationFrame(resolve));
  };

  await runTransitionEffect(transitionStyle, mainView, mode, colorApplyFn);

  lcardsLog.info(`[PaletteInjector] ✅ Alert mode: ${mode}`);
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
      /** @type {HTMLElement} */ (root).style.setProperty(varName, transformed);
      transformCount++;
    }
  });

  lcardsLog.info(`[PaletteInjector] Alert mode '${mode}': Transformed ${transformCount} variables`);
}

/**
 * Transform and inject LCARdS fallback variables (--lcards-*) for a given alert mode.
 * Uses GREEN_ALERT_PALETTE as the baseline, applying the same HSL pipeline as --lcars-*.
 * This replaces the legacy per-mode static palettes with dynamic HSL-based transforms.
 *
 * @param {string} mode - Alert mode
 * @param {Element} root - Root element
 * @private
 */
function injectTransformedPalette(mode, root) {
  let injectedCount = 0;
  Object.entries(GREEN_ALERT_PALETTE).forEach(([key, baseColor]) => {
    const transformed = transformColorToAlertMode(baseColor, mode);
    /** @type {HTMLElement} */ (root).style.setProperty(`--lcards-${key}`, transformed);
    injectedCount++;
  });
  lcardsLog.debug(`[PaletteInjector] Injected ${injectedCount} transformed --lcards-* vars for mode: ${mode}`);
}
