import { lcardsLog } from './lcards-logging.js';

/**
 * Dynamically loads a LCARdS font based on font-family name.
 * Only loads if not already injected.
 */
const _loadedFonts = new Set();

export function loadFont(fontInput) {
  const fontList = fontInput.split(',').map(f =>
    f.trim().replace(/^['"']|['"']$/g, '')
  );

  fontList.forEach(fontName => {
    // If it’s a URL, inject directly
    if (fontName.startsWith('http://') || fontName.startsWith('https://')) {
      const href = fontName;
      if (_loadedFonts.has(href)) return;
      if (document.querySelector(`link[href="${href}"]`)) {
        _loadedFonts.add(href);
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      _loadedFonts.add(href);
      lcardsLog.debug(`[loadFont] Loaded remote font from: ${href}`);
      return;
    }

    // Else assume local LCARdS font (NEW PREFIX)
    if (!fontName.startsWith('lcards_')) return;

    const href = `/hacsfiles/lcards/fonts/${fontName}.css`;
    const fontKey = fontName;

    if (_loadedFonts.has(fontKey)) return;
    if (document.querySelector(`link[href="${href}"]`)) {
      _loadedFonts.add(fontKey);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    _loadedFonts.add(fontKey);
    lcardsLog.debug(`[loadFont] Loaded local font: ${fontName}`);
  });
}

/**
 * Recursively resolve theme tokens and computed tokens in an object
 *
 * Handles:
 * - Theme tokens with `theme:` prefix: `theme:colors.primary`, `theme:typography.fontSize.base`
 * - Computed tokens: `alpha(theme:colors.primary, 0.5)`, `darken(theme:colors.accent.primary, 0.2)`
 * - Nested objects and arrays
 *
 * The `theme:` prefix is required to explicitly distinguish theme tokens from other
 * dotted notation (e.g., entity references like `sensor.temperature`).
 *
 * @param {Object|Array} obj - Object or array to resolve tokens in
 * @param {Object} themeManager - ThemeManager instance with getToken() and resolver
 * @returns {Object|Array} Object with all tokens resolved
 *
 * @example
 * const style = {
 *   color: 'theme:colors.primary',
 *   fontSize: 'theme:typography.fontSize.base',
 *   padding: 'theme:spacing.gap.base',
 *   background: 'alpha(theme:colors.background, 0.8)',
 *   nested: { borderRadius: 'theme:borders.radius.lg' }
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
      } else if (value.includes('(') && /^(alpha|darken|lighten|saturate|desaturate|mix)\(/.test(value)) {
        // Resolve computed token (all ColorUtils functions)
        try {
          const resolved = themeManager.resolver.resolve(value, value);
          if (resolved !== value) {
            result[key] = resolved;
            lcardsLog.trace(`[resolveThemeTokensRecursive] Resolved computed token: ${value} -> ${resolved}`);
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
