import { core_fonts } from '../lcards-vars.js';
import { lcardsLog } from './lcards-logging.js';

/**
 * Process card configurations to load all fonts.
 */
export function loadAllFontsFromConfig(config) {
  const fonts = new Set();
  function scan(obj) {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key === 'font_family' && typeof obj[key] === 'string') {
          fonts.add(obj[key]);
        } else if (typeof obj[key] === 'object') {
          scan(obj[key]);
        }
      }
    }
  }
  scan(config);
  fonts.forEach(font => window.lcards.loadFont(font));
}

/**
 * Dynamically loads a LCARdS font based on font-family name.
 * Only loads if not already injected.
 */
export function loadFont(fontInput) {
  window.lcards._loadedFonts = window.lcards._loadedFonts || new Set();

  const fontList = fontInput.split(',').map(f =>
    f.trim().replace(/^['"]|['"]$/g, '')
  );

  fontList.forEach(fontName => {
    // If it’s a URL, inject directly
    if (fontName.startsWith('http://') || fontName.startsWith('https://')) {
      const href = fontName;
      if (window.lcards._loadedFonts.has(href)) return;
      if (document.querySelector(`link[href="${href}"]`)) {
        window.lcards._loadedFonts.add(href);
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      window.lcards._loadedFonts.add(href);
      lcardsLog.debug(`[loadFont] Loaded remote font from: ${href}`);
      return;
    }

    // Else assume local LCARdS font
    if (!fontName.startsWith('cb-lcars_')) return;

    const href = `/hacsfiles/lcards/fonts/${fontName}.css`;
    const fontKey = fontName;

    if (window.lcards._loadedFonts.has(fontKey)) return;
    if (document.querySelector(`link[href="${href}"]`)) {
      window.lcards._loadedFonts.add(fontKey);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    window.lcards._loadedFonts.add(fontKey);
    lcardsLog.debug(`[loadFont] Loaded local font: ${fontName}`);
  });
}


/**
 * Loads all core LCARdS fonts using the shared dynamic loader.
 */
export async function loadCoreFonts() {
  try {
    const fonts = Array.isArray(core_fonts) ? core_fonts : [core_fonts];
    for (const font of fonts) {
      window.lcards.loadFont(font);
    }
  } catch (error) {
    lcardsLog.error(`[loadCoreFonts] Failed to preload core fonts: ${error.message}`);
  }
}

/**
 * Recursively resolve theme tokens and computed tokens in an object
 *
 * Handles:
 * - `theme:` tokens (e.g., `theme:colors.primary`)
 * - Computed tokens (e.g., `alpha(theme:colors.primary, 0.5)`)
 * - Nested objects and arrays
 *
 * @param {Object|Array} obj - Object or array to resolve tokens in
 * @param {Object} themeManager - ThemeManager instance with getToken() and resolver
 * @returns {Object|Array} Object with all tokens resolved
 *
 * @example
 * const style = {
 *   color: 'theme:colors.primary',
 *   background: 'alpha(theme:colors.background, 0.8)',
 *   nested: { border: 'theme:colors.border' }
 * };
 * const resolved = resolveThemeTokensRecursive(style, themeManager);
 */
export function resolveThemeTokensRecursive(obj, themeManager) {
  if (!obj || typeof obj !== 'object' || !themeManager) {
    return obj;
  }

  const result = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      if (value.startsWith('theme:')) {
        // Resolve theme token
        const tokenPath = value.substring(6);
        const resolved = themeManager.getToken(tokenPath, value);
        if (resolved !== value) {
          result[key] = resolveThemeTokensRecursive(resolved, themeManager); // Recurse in case token resolves to another token
          lcardsLog.trace(`[resolveThemeTokensRecursive] Resolved theme token: ${value} -> ${result[key]}`);
        } else {
          lcardsLog.warn(`[resolveThemeTokensRecursive] Theme token not found: '${value}' - using as literal value`);
        }
      } else if (value.includes('(') && (value.startsWith('alpha(') || value.startsWith('darken(') || value.startsWith('lighten('))) {
        // Resolve computed token (alpha, darken, lighten, etc.)
        try {
          lcardsLog.debug(`[resolveThemeTokensRecursive] Attempting to resolve computed token: ${value}`);
          lcardsLog.debug(`[resolveThemeTokensRecursive] Resolver available:`, !!themeManager?.resolver);
          const resolved = themeManager.resolver.resolve(value, value);
          lcardsLog.debug(`[resolveThemeTokensRecursive] Resolution result: ${value} -> ${resolved}`);
          if (resolved !== value) {
            result[key] = resolved;
            lcardsLog.trace(`[resolveThemeTokensRecursive] Resolved computed token: ${value} -> ${resolved}`);
          } else {
            lcardsLog.warn(`[resolveThemeTokensRecursive] Computed token unchanged: ${value}`);
          }
        } catch (error) {
          lcardsLog.warn(`[resolveThemeTokensRecursive] Failed to resolve computed token: ${value}`, error);
        }
      }
    } else if (value && typeof value === 'object') {
      // Recursively resolve nested objects
      result[key] = resolveThemeTokensRecursive(value, themeManager);
    }
  }

  return result;
}
