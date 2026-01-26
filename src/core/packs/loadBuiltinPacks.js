import * as componentsRegistry from './components/index.js';
import { BUTTON_PRESETS } from './style-presets/buttons/index.js';
import { SLIDER_PRESETS } from './style-presets/sliders/index.js';
import { BUILTIN_THEMES_PACK } from './themes/builtin-themes.js';
import { BUILTIN_MSD_SVG_PACK } from './svg-assets/builtin-msd.js';
import { registerBuiltinAnimationPresets } from './animations/index.js';
import coreFontsJson from './core_fonts.json';

/**
 * Core Builtin Pack
 *
 * Contains system defaults and foundational definitions.
 * Loaded first, available to all cards and components.
 */
// Core builtin pack - Contains all system defaults
const CORE_PACK = {
  id: 'core',
  version: '1.14.18',
  animations: [],
  timelines: [],
  rules: []
};

// LCARdS Button Styles Pack (Phase 2) - Complete button presets for status grids
/**
 * LCARdS Button Styles Pack (v1.14.18+)
 *
 * Complete button presets for LCARdS cards and status grids.
 * All presets use nested CB-LCARS schema structure.
 *
 * Schema: doc/architecture/button-schema-definition.md
 * Theme Tokens: src/core/packs/themes/tokens/lcarsClassicTokens.js
 */
const LCARDS_BUTTONS_PACK = {
  id: 'lcards_buttons',
  version: '1.14.18',
  description: 'LCARdS button styles - v1.14.18 nested schema',
  animations: [],
  timelines: [],
  rules: [],
  // STYLE PRESETS: Named style bundles that can be applied to any overlay type
  style_presets: {
    // Button presets imported from style-presets/buttons
    button: BUTTON_PRESETS
  },

  // COMPONENT PRESETS: Removed - components are now registered via unified components registry
  component_presets: {
    // Legacy component_presets structure removed - all components now use unified format
  }
};

/**
 * LCARdS Slider Styles Pack (v1.22.0+)
 *
 * Complete slider presets for LCARdS cards.
 * Provides pills (segmented) and gauge (ruler) visual styles.
 *
 * Architecture:
 * - Separate visual style (pills/gauge) from interactivity (control.locked)
 * - Pills: Segmented bar style for interactive sliders
 * - Gauge: Ruler with tick marks for displays and controls
 */
const LCARDS_SLIDERS_PACK = {
  id: 'lcards_sliders',
  version: '1.22.0',
  description: 'LCARdS slider presets - pills and gauge styles',
  animations: [],
  timelines: [],
  rules: [],

  style_presets: {
    // Slider presets imported from style-presets/sliders
    slider: SLIDER_PRESETS
  }
};

// Themes pack is imported from themes/builtin-themes.js

/**
 * Core Fonts Pack
 * 
 * Font pack containing all LCARdS fonts (Core, Standard, Alien).
 * Fonts are registered with AssetManager for lazy-loading.
 * Converts font metadata to font_assets format for PackManager.
 */
const CORE_FONTS_PACK = {
  id: coreFontsJson.id,
  version: coreFontsJson.version,
  name: coreFontsJson.name,
  description: coreFontsJson.description,
  font_assets: {}
};

// Convert fonts from JSON to font_assets format
Object.entries(coreFontsJson.fonts).forEach(([key, fontMeta]) => {
  CORE_FONTS_PACK.font_assets[key] = {
    url: fontMeta.external 
      ? fontMeta.url 
      : `/hacsfiles/lcards/fonts/${fontMeta.cssFile}`,
    displayName: fontMeta.displayName,
    category: fontMeta.category,
    legacyName: fontMeta.legacyName,
    description: fontMeta.description,
    external: fontMeta.external || false
  };
});

const BUILTIN_REGISTRY = {
  core: CORE_PACK,
  lcards_buttons: LCARDS_BUTTONS_PACK,
  lcards_sliders: LCARDS_SLIDERS_PACK,
  builtin_themes: BUILTIN_THEMES_PACK,
  builtin_msd_backgrounds: BUILTIN_MSD_SVG_PACK,
  core_fonts: CORE_FONTS_PACK
};

// Remove getBuiltinPack() function entirely - it's not needed anymore
// All packs are now in BUILTIN_REGISTRY

export function loadBuiltinPacks(requested = ['core', 'lcards_buttons', 'lcards_sliders']) {
  // Register animation presets during pack loading
  registerBuiltinAnimationPresets();

  // ✅ CRITICAL FIX: Always load builtin_themes, builtin_msd_backgrounds, and core_fonts packs
  const packsToLoad = [...new Set([...requested, 'builtin_themes', 'builtin_msd_backgrounds', 'core_fonts'])];

  return packsToLoad.map(id => BUILTIN_REGISTRY[id]).filter(Boolean);
}

// Make loadBuiltinPacks globally accessible for preset loading
if (typeof window !== 'undefined') {
  window.loadBuiltinPacksModule = { loadBuiltinPacks };
}

/**
 * Shape and Component Registries
 *
 * Shapes and components are imported above and made available
 * through their respective index.js files:
 *
 * - shapesRegistry: Static SVG shapes with labeled segments
 * - componentsRegistry: Component presets with theme token integration
 *
 * Access via:
 * - import { getShape } from './shapes/index.js'
 * - import { getComponent } from './components/index.js'
 */
