/**
 * LCARdS Font Registry
 *
 * Central registry of all fonts distributed with LCARdS.
 * Used by editor form components to populate font selectors.
 *
 * Naming conventions:
 * - Core fonts: Loaded at module init (Antonio, Jeffries, Microgramma)
 * - Standard fonts: Common LCARS display fonts
 * - Alien fonts: Star Trek alien language fonts
 *
 * @module utils/lcards-fonts
 */

import { lcardsLog } from './lcards-logging.js';

/**
 * Font metadata structure
 * @typedef {Object} FontMetadata
 * @property {string} name - Display name for UI
 * @property {string} value - Actual font-family value for CSS
 * @property {string} category - Category for grouping
 * @property {string} [description] - Optional description
 */

/**
 * Core fonts (loaded at module initialization)
 * @type {FontMetadata[]}
 */
export const CORE_FONTS = [
    {
        name: 'Antonio (Default)',
        value: 'Antonio',
        category: 'Core',
        description: 'Primary LCARS display font'
    },
    {
        name: 'Jeffries',
        value: 'lcards_jeffries',
        category: 'Core',
        description: 'Technical display font'
    },
    {
        name: 'Microgramma',
        value: 'lcards_microgramma',
        category: 'Core',
        description: 'Bold extended variant'
    }
];

/**
 * Standard LCARS fonts
 * @type {FontMetadata[]}
 */
export const STANDARD_FONTS = [
    { name: 'Tungsten', value: 'lcards_tungsten', category: 'Standard' },
    { name: 'Microgramma Regular', value: 'lcards_microgramma_regular', category: 'Standard' },
    { name: 'Context Ultra Condensed', value: 'lcards_context_ultra_condensed', category: 'Standard' },
    { name: 'Crillee', value: 'lcards_crillee', category: 'Standard' },
    { name: 'Eurostile', value: 'lcards_eurostile', category: 'Standard' },
    { name: 'Eurostile Oblique', value: 'lcards_eurostile_oblique', category: 'Standard' },
    { name: 'Federation', value: 'lcards_federation', category: 'Standard' },
    { name: 'Galaxy', value: 'lcards_galaxy', category: 'Standard' },
    { name: 'Handel Gothic', value: 'lcards_handel_gothic', category: 'Standard' },
    { name: 'Millennium Extended Bold', value: 'lcards_millenium_extended_bold', category: 'Standard' },
    { name: 'Sonic', value: 'lcards_sonic', category: 'Standard' },
    { name: 'Square 721', value: 'lcards_sqaure_721', category: 'Standard' },
    { name: 'Stellar', value: 'lcards_stellar', category: 'Standard' },
    { name: 'Swiss 911', value: 'lcards_swiss_911', category: 'Standard' },
    { name: 'Trek Arrow Caps', value: 'lcards_trekarrowcaps', category: 'Standard' }
];

/**
 * Alien language fonts
 * @type {FontMetadata[]}
 */
export const ALIEN_FONTS = [
    { name: '[Alien] Bajoran Ancient', value: 'lcards_bajoran_ancient', category: 'Alien' },
    { name: '[Alien] Bajoran Ideogram', value: 'lcards_bajoran_ideogram', category: 'Alien' },
    { name: '[Alien] Binar', value: 'lcards_binar', category: 'Alien' },
    { name: '[Alien] Borg', value: 'lcards_borg', category: 'Alien' },
    { name: '[Alien] Cardassian', value: 'lcards_cardassian', category: 'Alien' },
    { name: '[Alien] Changeling', value: 'lcards_changeling', category: 'Alien' },
    { name: '[Alien] Dominion', value: 'lcards_dominion', category: 'Alien' },
    { name: '[Alien] Fabrini', value: 'lcards_fabrini', category: 'Alien' },
    { name: '[Alien] Ferengi (Left)', value: 'lcards_ferengi_left', category: 'Alien' },
    { name: '[Alien] Ferengi (Right)', value: 'lcards_ferengi_right', category: 'Alien' },
    { name: '[Alien] Klingon', value: 'lcards_klingon', category: 'Alien' },
    { name: '[Alien] Romulan', value: 'lcards_romulan', category: 'Alien' },
    { name: '[Alien] Tellarite', value: 'lcards_tellarite', category: 'Alien' },
    { name: '[Alien] Tholian', value: 'lcards_tholian', category: 'Alien' },
    { name: '[Alien] Trill', value: 'lcards_trill', category: 'Alien' },
    { name: '[Alien] Vulcan', value: 'lcards_vulcan', category: 'Alien' }
];

/**
 * All available fonts (flat list for dropdowns)
 * @type {FontMetadata[]}
 */
export const ALL_FONTS = [
    ...CORE_FONTS,
    ...STANDARD_FONTS,
    ...ALIEN_FONTS
];

/**
 * Get font metadata by value
 * @param {string} fontValue - Font-family value (e.g., 'lcards_borg')
 * @returns {FontMetadata|null} Font metadata or null if not found
 */
export function getFontMetadata(fontValue) {
    return ALL_FONTS.find(f => f.value === fontValue) || null;
}

/**
 * Check if a font value is a known LCARdS font
 * @param {string} fontValue - Font-family value
 * @returns {boolean} True if font is in registry
 */
export function isKnownFont(fontValue) {
    return ALL_FONTS.some(f => f.value === fontValue);
}

/**
 * Ensure a font is loaded (integrates with existing loadFont system)
 * @deprecated Use window.lcards.core.assetManager.loadFont() instead
 * @param {string} fontValue - Font-family value
 */
export function ensureFontLoaded(fontValue) {
    if (!fontValue) return;

    const core = window.lcards?.core;

    if (core?.assetManager) {
        return core.assetManager.loadFont(fontValue);
    }

    lcardsLog.warn('[ensureFontLoaded] DEPRECATED: Use assetManager.loadFont()');
}

/**
 * Get fonts grouped by category for UI rendering
 * @returns {Object<string, FontMetadata[]>} Fonts grouped by category
 */
export function getFontsByCategory() {
    return {
        Core: CORE_FONTS,
        Standard: STANDARD_FONTS,
        Alien: ALIEN_FONTS
    };
}

/**
 * Generate options for ha-selector select dropdown
 * @deprecated Use window.lcards.core.assetManager.listFonts() instead
 * @param {boolean} [includeCustomOption=true] - Include "Custom..." option
 * @returns {Array<{value: string, label: string}>} Options array
 */
export function getFontSelectorOptions(includeCustomOption = true) {
    const core = window.lcards?.core;

    if (core?.assetManager) {
        const fonts = core.assetManager.listFonts();
        const options = fonts.map(f => ({ value: f.key, label: f.displayName }));

        if (includeCustomOption) {
            options.push({ value: '__custom__', label: '🔧 Custom Font...' });
        }

        return options;
    }

    // Fallback to static registry (shouldn't happen after init)
    lcardsLog.warn('[getFontSelectorOptions] AssetManager not available, using static registry');
    const options = ALL_FONTS.map(font => ({
        value: font.value,
        label: font.name
    }));

    if (includeCustomOption) {
        options.push({ value: '__custom__', label: '🔧 Custom Font...' });
    }

    return options;
}
