import { core_fonts } from '../lcards-vars.js';
import { lcardsLog } from './lcards-logging.js';

/**
 * Map legacy CB-LCARS font names to new LCARdS names
 * @type {Map<string, string>}
 */
const FONT_NAME_MIGRATION = new Map([
    ['cb-lcars_antonio', 'lcards_antonio'],
    ['cb-lcars_bajoran_ancient', 'lcards_bajoran_ancient'],
    ['cb-lcars_bajoran_ideogram', 'lcards_bajoran_ideogram'],
    ['cb-lcars_binar', 'lcards_binar'],
    ['cb-lcars_borg', 'lcards_borg'],
    ['cb-lcars_cardassian', 'lcards_cardassian'],
    ['cb-lcars_changeling', 'lcards_changeling'],
    ['cb-lcars_context_ultra_condensed', 'lcards_context_ultra_condensed'],
    ['cb-lcars_crillee', 'lcards_crillee'],
    ['cb-lcars_dominion', 'lcards_dominion'],
    ['cb-lcars_eurostile', 'lcards_eurostile'],
    ['cb-lcars_eurostile_oblique', 'lcards_eurostile_oblique'],
    ['cb-lcars_fabrini', 'lcards_fabrini'],
    ['cb-lcars_federation', 'lcards_federation'],
    ['cb-lcars_ferengi_left', 'lcards_ferengi_left'],
    ['cb-lcars_ferengi_right', 'lcards_ferengi_right'],
    ['cb-lcars_galaxy', 'lcards_galaxy'],
    ['cb-lcars_handel_gothic', 'lcards_handel_gothic'],
    ['cb-lcars_jeffries', 'lcards_jeffries'],
    ['cb-lcars_klingon', 'lcards_klingon'],
    ['cb-lcars_microgramma', 'lcards_microgramma'],
    ['cb-lcars_microgramma_regular', 'lcards_microgramma_regular'],
    ['cb-lcars_millenium_extended_bold', 'lcards_millenium_extended_bold'],
    ['cb-lcars_romulan', 'lcards_romulan'],
    ['cb-lcars_sonic', 'lcards_sonic'],
    ['cb-lcars_sqaure_721', 'lcards_sqaure_721'],
    ['cb-lcars_stellar', 'lcards_stellar'],
    ['cb-lcars_swiss_911', 'lcards_swiss_911'],
    ['cb-lcars_tellarite', 'lcards_tellarite'],
    ['cb-lcars_tholian', 'lcards_tholian'],
    ['cb-lcars_trekarrowcaps', 'lcards_trekarrowcaps'],
    ['cb-lcars_trill', 'lcards_trill'],
    ['cb-lcars_tungsten', 'lcards_tungsten'],
    ['cb-lcars_vulcan', 'lcards_vulcan']
]);

/**
 * Migrate legacy CB-LCARS font name to new LCARdS name
 * @param {string} fontName - Font name (may be legacy)
 * @returns {string} Migrated font name
 */
function migrateLegacyFontName(fontName) {
    if (FONT_NAME_MIGRATION.has(fontName)) {
        const newName = FONT_NAME_MIGRATION.get(fontName);
        lcardsLog.info(`[loadFont] Migrating legacy font name: ${fontName} → ${newName}`);
        return newName;
    }
    return fontName;
}

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
 * 
 * Supports legacy CB-LCARS font names (auto-migrates to lcards_ prefix).
 */
export function loadFont(fontInput) {
  window.lcards._loadedFonts = window.lcards._loadedFonts || new Set();

  const fontList = fontInput.split(',').map(f =>
    f.trim().replace(/^['"]|['"]$/g, '')
  );

  fontList.forEach(fontName => {
    // Migrate legacy names
    fontName = migrateLegacyFontName(fontName);

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

    // Else assume local LCARdS font (NEW PREFIX)
    if (!fontName.startsWith('lcards_')) return;

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
