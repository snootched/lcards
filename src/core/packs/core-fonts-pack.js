/**
 * @fileoverview LCARdS Core Fonts Pack
 *
 * Registers all built-in LCARdS fonts with AssetManager.
 * Font metadata is sourced from core_fonts.json and converted
 * to the font_assets format expected by PackManager.
 *
 * Pack key:  core_fonts
 * Registry:  AssetManager → font_assets.*
 *
 * Fonts included: Antonio (external), Jeffries, Microgramma,
 * Tungsten, and all other fonts defined in core_fonts.json.
 *
 * Pack system guide: doc/architecture/pack-system.md
 */

import coreFontsJson from './core_fonts.json';

const font_assets = {};
Object.entries(coreFontsJson.fonts).forEach(([key, fontMeta]) => {
  const fm = /** @type {any} */ (fontMeta);
  font_assets[key] = {
    url:         fm.external ? fm.url : `/hacsfiles/lcards/fonts/${fm.cssFile}`,
    displayName: fm.displayName,
    category:    fm.category,
    legacyName:  fm.legacyName,
    description: fm.description,
    external:    fm.external || false
  };
});

export const CORE_FONTS_PACK = {
  id:          coreFontsJson.id,
  name:        coreFontsJson.name,
  version:     coreFontsJson.version,
  description: coreFontsJson.description,
  font_assets
};
