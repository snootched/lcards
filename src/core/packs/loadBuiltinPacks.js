/**
 * @fileoverview Builtin Pack Loader
 *
 * Manifest and loader for all LCARdS builtin packs.
 * This file's only job is to:
 *   1. Import each pack from its own dedicated file
 *   2. Register them in BUILTIN_REGISTRY
 *   3. Export loadBuiltinPacks() for PackManager
 *
 * Every pack has its own dedicated file at the packs/ root.
 * No pack data is defined inline here.
 *
 * Pack system guide: doc/architecture/pack-system.md
 */

import { LCARDS_BUTTONS_PACK }   from './lcards-buttons-pack.js';
import { LCARDS_SLIDERS_PACK }   from './lcards-sliders-pack.js';
import { BUILTIN_THEMES_PACK }   from './builtin-themes.js';
import { BUILTIN_MSD_SVG_PACK }  from './builtin-msd.js';
import { BUILTIN_SOUNDS_PACK }   from './lcards-default-sound-scheme.js';
import { LCARDS_BEEPS_PACK }     from './lcards-beeps-pack.js';
import { LCARDS_ALERTS_PACK }    from './lcards-alerts-pack.js';
import { LCARDS_ELBOWS_PACK }    from './lcards-elbows-pack.js';
import { registerBuiltinAnimationPresets } from './animations/index.js';
import { CORE_FONTS_PACK } from './core-fonts-pack.js';
import { CORE_PACK }       from './core-pack.js';
import { LCARDS_TEXTURES_PACK }  from './lcards-textures-pack.js';

// ──────────────────────────────────────────────────────────────
// BUILTIN REGISTRY
//
// All packs that loadBuiltinPacks() can serve.
// Keys are the pack IDs used in loadBuiltinPacks(requested).
// ──────────────────────────────────────────────────────────────
const BUILTIN_REGISTRY = {
  core:                    CORE_PACK,
  lcards_buttons:          LCARDS_BUTTONS_PACK,
  lcards_sliders:          LCARDS_SLIDERS_PACK,
  lcards_elbows:           LCARDS_ELBOWS_PACK,
  builtin_themes:          BUILTIN_THEMES_PACK,
  builtin_msd_backgrounds: BUILTIN_MSD_SVG_PACK,
  core_fonts:              CORE_FONTS_PACK,
  lcards_sounds_default:   BUILTIN_SOUNDS_PACK,
  lcards_beeps:            LCARDS_BEEPS_PACK,
  lcards_alerts:           LCARDS_ALERTS_PACK,
  lcards_textures:         LCARDS_TEXTURES_PACK,
};

/**
 * Load builtin packs by ID.
 *
 * Called exclusively by PackManager.loadBuiltinPacks().
 * Always loads the infrastructure packs regardless of what was requested.
 *
 * @param {string[]} requested - Pack IDs explicitly requested (default: core set)
 * @returns {Object[]} Array of pack objects ready for PackManager.registerPack()
 */
export function loadBuiltinPacks(requested = ['core', 'lcards_buttons', 'lcards_sliders']) {
  registerBuiltinAnimationPresets();

  // Infrastructure packs are always loaded — required for the system to function
  const alwaysLoad = [
    'builtin_themes',
    'builtin_msd_backgrounds',
    'core_fonts',
    'lcards_sounds_default',
    'lcards_beeps',
    'lcards_alerts',
    'lcards_elbows',
    'lcards_textures'
  ];

  const packsToLoad = [...new Set([...requested, ...alwaysLoad])];
  return packsToLoad.map(id => BUILTIN_REGISTRY[id]).filter(Boolean);
}

// Expose for any external tooling that needs to enumerate packs
if (typeof window !== 'undefined') {
  window.loadBuiltinPacksModule = { loadBuiltinPacks };
}

