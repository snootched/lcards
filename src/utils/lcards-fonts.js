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
 * - Legacy names (cb-lcars_*) auto-migrate to new names (lcards_*)
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
 * @property {string} [legacyName] - Old CB-LCARS name for migration
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
        description: 'Technical display font',
        legacyName: 'cb-lcars_jeffries'
    },
    { 
        name: 'Microgramma', 
        value: 'lcards_microgramma', 
        category: 'Core', 
        description: 'Bold extended variant',
        legacyName: 'cb-lcars_microgramma'
    }
];

/**
 * Standard LCARS fonts
 * @type {FontMetadata[]}
 */
export const STANDARD_FONTS = [
    { name: 'Tungsten', value: 'lcards_tungsten', category: 'Standard', legacyName: 'cb-lcars_tungsten' },
    { name: 'Microgramma Regular', value: 'lcards_microgramma_regular', category: 'Standard', legacyName: 'cb-lcars_microgramma_regular' },
    { name: 'Context Ultra Condensed', value: 'lcards_context_ultra_condensed', category: 'Standard', legacyName: 'cb-lcars_context_ultra_condensed' },
    { name: 'Crillee', value: 'lcards_crillee', category: 'Standard', legacyName: 'cb-lcars_crillee' },
    { name: 'Eurostile', value: 'lcards_eurostile', category: 'Standard', legacyName: 'cb-lcars_eurostile' },
    { name: 'Eurostile Oblique', value: 'lcards_eurostile_oblique', category: 'Standard', legacyName: 'cb-lcars_eurostile_oblique' },
    { name: 'Federation', value: 'lcards_federation', category: 'Standard', legacyName: 'cb-lcars_federation' },
    { name: 'Galaxy', value: 'lcards_galaxy', category: 'Standard', legacyName: 'cb-lcars_galaxy' },
    { name: 'Handel Gothic', value: 'lcards_handel_gothic', category: 'Standard', legacyName: 'cb-lcars_handel_gothic' },
    { name: 'Millennium Extended Bold', value: 'lcards_millenium_extended_bold', category: 'Standard', legacyName: 'cb-lcars_millenium_extended_bold' },
    { name: 'Sonic', value: 'lcards_sonic', category: 'Standard', legacyName: 'cb-lcars_sonic' },
    { name: 'Square 721', value: 'lcards_sqaure_721', category: 'Standard', legacyName: 'cb-lcars_sqaure_721' },
    { name: 'Stellar', value: 'lcards_stellar', category: 'Standard', legacyName: 'cb-lcars_stellar' },
    { name: 'Swiss 911', value: 'lcards_swiss_911', category: 'Standard', legacyName: 'cb-lcars_swiss_911' },
    { name: 'Trek Arrow Caps', value: 'lcards_trekarrowcaps', category: 'Standard', legacyName: 'cb-lcars_trekarrowcaps' }
];

/**
 * Alien language fonts
 * @type {FontMetadata[]}
 */
export const ALIEN_FONTS = [
    { name: '[Alien] Bajoran Ancient', value: 'lcards_bajoran_ancient', category: 'Alien', legacyName: 'cb-lcars_bajoran_ancient' },
    { name: '[Alien] Bajoran Ideogram', value: 'lcards_bajoran_ideogram', category: 'Alien', legacyName: 'cb-lcars_bajoran_ideogram' },
    { name: '[Alien] Binar', value: 'lcards_binar', category: 'Alien', legacyName: 'cb-lcars_binar' },
    { name: '[Alien] Borg', value: 'lcards_borg', category: 'Alien', legacyName: 'cb-lcars_borg' },
    { name: '[Alien] Cardassian', value: 'lcards_cardassian', category: 'Alien', legacyName: 'cb-lcars_cardassian' },
    { name: '[Alien] Changeling', value: 'lcards_changeling', category: 'Alien', legacyName: 'cb-lcars_changeling' },
    { name: '[Alien] Dominion', value: 'lcards_dominion', category: 'Alien', legacyName: 'cb-lcars_dominion' },
    { name: '[Alien] Fabrini', value: 'lcards_fabrini', category: 'Alien', legacyName: 'cb-lcars_fabrini' },
    { name: '[Alien] Ferengi (Left)', value: 'lcards_ferengi_left', category: 'Alien', legacyName: 'cb-lcars_ferengi_left' },
    { name: '[Alien] Ferengi (Right)', value: 'lcards_ferengi_right', category: 'Alien', legacyName: 'cb-lcars_ferengi_right' },
    { name: '[Alien] Klingon', value: 'lcards_klingon', category: 'Alien', legacyName: 'cb-lcars_klingon' },
    { name: '[Alien] Romulan', value: 'lcards_romulan', category: 'Alien', legacyName: 'cb-lcars_romulan' },
    { name: '[Alien] Tellarite', value: 'lcards_tellarite', category: 'Alien', legacyName: 'cb-lcars_tellarite' },
    { name: '[Alien] Tholian', value: 'lcards_tholian', category: 'Alien', legacyName: 'cb-lcars_tholian' },
    { name: '[Alien] Trill', value: 'lcards_trill', category: 'Alien', legacyName: 'cb-lcars_trill' },
    { name: '[Alien] Vulcan', value: 'lcards_vulcan', category: 'Alien', legacyName: 'cb-lcars_vulcan' }
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
 * Get font metadata by value (supports legacy names)
 * @param {string} fontValue - Font-family value (e.g., 'lcards_borg' or 'cb-lcars_borg')
 * @returns {FontMetadata|null} Font metadata or null if not found
 */
export function getFontMetadata(fontValue) {
    return ALL_FONTS.find(f => 
        f.value === fontValue || f.legacyName === fontValue
    ) || null;
}

/**
 * Check if a font value is a known LCARdS font (supports legacy names)
 * @param {string} fontValue - Font-family value
 * @returns {boolean} True if font is in registry
 */
export function isKnownFont(fontValue) {
    return ALL_FONTS.some(f => 
        f.value === fontValue || f.legacyName === fontValue
    );
}

/**
 * Migrate legacy CB-LCARS font name to new LCARdS name
 * @param {string} fontValue - Font value (may be legacy)
 * @returns {string} Migrated font value
 */
export function migrateFontName(fontValue) {
    const font = ALL_FONTS.find(f => f.legacyName === fontValue);
    if (font) {
        lcardsLog.debug(`[lcards-fonts] Migrating font: ${fontValue} → ${font.value}`);
        return font.value;
    }
    return fontValue;
}

/**
 * Ensure a font is loaded (integrates with existing loadFont system)
 * @param {string} fontValue - Font-family value
 */
export function ensureFontLoaded(fontValue) {
    if (!fontValue) return;

    // Migrate legacy name if needed
    const migratedFont = migrateFontName(fontValue);

    // Use existing font loading system
    if (window.lcards?.loadFont) {
        window.lcards.loadFont(migratedFont);
        lcardsLog.debug(`[lcards-fonts] Requested font load: ${migratedFont}`);
    } else {
        lcardsLog.warn(`[lcards-fonts] Font loader not available for: ${migratedFont}`);
    }
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
 * @param {boolean} [includeCustomOption=true] - Include "Custom..." option
 * @returns {Array<{value: string, label: string}>} Options array
 */
export function getFontSelectorOptions(includeCustomOption = true) {
    const options = ALL_FONTS.map(font => ({
        value: font.value,
        label: font.name
    }));

    if (includeCustomOption) {
        options.push({ value: '__custom__', label: '🔧 Custom Font...' });
    }

    return options;
}
