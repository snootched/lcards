import { lcardsSetGlobalLogLevel, lcardsGetGlobalLogLevel, lcardsLog, lcardsLogBanner} from './utils/lcards-logging.js';
import * as LCARdS from './lcards-vars.js'
import { lcardsCore } from './core/lcards-core.js';

// Check URL for log level override and set it immediately
const urlLogLevel = new URLSearchParams(window.location.search).get('lcards_log_level');
if (urlLogLevel) {
    lcardsSetGlobalLogLevel(urlLogLevel);
}

// Display banner after log level is set
lcardsLogBanner();

// Now import everything else (including MSD system which will use correct log level)
import * as anime from 'animejs';
import { readYamlFile } from './utils/lcards-fileutils.js';
import { preloadSVGs, loadSVGToCache, getSVGFromCache } from './utils/lcards-fileutils.js';
import { loadFont, loadCoreFonts } from './utils/lcards-theme.js';

import * as animHelpers from './utils/lcards-anim-helpers.js';
import { animPresets } from './utils/lcards-anim-presets.js';
import { listAnimationPresets, getAnimationPreset } from './core/animation/presets.js';
import * as svgHelpers from './utils/lcards-svg-helpers.js';
import * as anchorHelpers from './utils/lcards-anchor-helpers.js';

// MSD system import
import './msd/index.js';

// Native card imports
import { LCARdSMSDCard } from './cards/lcards-msd.js';

// LCARdS card imports
import { LCARdSButton } from './cards/lcards-button.js';
import { LCARdSElbow } from './cards/lcards-elbow.js';
import { LCARdSChart } from './cards/lcards-chart.js';
import { LCARdSSlider } from './cards/lcards-slider.js';
import { LCARdSDataGrid } from './cards/lcards-data-grid.js';

// Unified API system removed - legacy architecture
// Use DOM queries: document.querySelector('lcards-msd')._msdPipeline

// Component registration imports removed - components accessed via Component Registry directly

// Ensure global namespace
window.lcards = window.lcards || {};

window.lcards.loadFont = loadFont;


async function initializeCustomCard() {

    // Call log banner function immediately when the script loads
    //window.lcards.lcardsLog = lcardsLog; // Expose the logging function globally

    // Expose debug helpers (the module already attaches API; this ensures references exist)
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.setLevel = lcardsSetGlobalLogLevel;

    // Animation namespace organization
    window.lcards.anim = {
        animejs: anime,                // full animejs module
        anime: anime.animate,          // shortcut for anime.animate
        stagger: anime.stagger,        // stagger function for animations
        utils: anime.utils,            // CENTRAL canonical utils reference
        animateElement: animHelpers.animateElement,
        animateWithRoot: animHelpers.animateWithRoot,
        waitForElement: animHelpers.waitForElement,
        presets: { ...animPresets },   // Legacy presets (will be merged with MSD presets)
        scopes: new Map(),
    };

    // Merge MSD presets into window.lcards.anim.presets for unified access
    const msdPresetNames = listAnimationPresets();
    msdPresetNames.forEach(name => {
        window.lcards.anim.presets[name] = getAnimationPreset(name);
    });

    lcardsLog.debug(`[LCARdS] Loaded ${msdPresetNames.length} MSD animation presets:`, msdPresetNames);

    // Backward-compatible shortcuts (to be deprecated)
    window.lcards.animejs = window.lcards.anim.animejs;
    window.lcards.anime = window.lcards.anim.anime;
    window.lcards.animateElement = window.lcards.anim.animateElement;
    window.lcards.animateWithRoot = window.lcards.anim.animateWithRoot;
    window.lcards.waitForElement = window.lcards.anim.waitForElement;


    window.lcards.svgHelpers = svgHelpers;
    window.lcards.anchorHelpers = anchorHelpers;
    window.lcards.findSvgAnchors = anchorHelpers.findSvgAnchors;
    window.lcards.getSvgContent = anchorHelpers.getSvgContent;
    window.lcards.getSvgViewBox = anchorHelpers.getSvgViewBox;
    window.lcards.getSvgAspectRatio = anchorHelpers.getSvgAspectRatio;


    window.lcards.loadFont = loadFont;
    window.lcards.loadUserSVG = async function(key, url) {
        return await loadSVGToCache(key, url);
    };
    window.lcards.getSVGFromCache = getSVGFromCache;

    // === CORE INFRASTRUCTURE (NEW) ===
    // Attach the LCARdSCore singleton (imported statically)
    window.lcards.core = lcardsCore;

    // Expose managers for ButtonRenderer compatibility
    window.lcards.theme = lcardsCore.getThemeManager();
    window.lcards.styleResolver = lcardsCore.getStylePresetManager();

    // Add core to debug API
    window.lcards.debug.core = () => lcardsCore.getDebugInfo();

    // Add singleton reference to debug tier for unified API consistency
    window.lcards.debug.singletons = lcardsCore;

    lcardsLog.info('[lcards.js] ✅ LCARdSCore singleton attached to window.lcards.core');
    lcardsLog.debug('[lcards.js] ✅ Singleton reference added to debug.singletons');

    // === SINGLETON INITIALIZATION ===
    // Initialize core singletons immediately without HASS
    // They will update their HASS reference when first card loads
    try {
        // Create a minimal HASS stub for initial singleton setup
        const stubHass = {
            states: {},
            services: {},
            config: {},
            user: { name: 'Loading...', is_admin: false },
            connected: false
        };

        await lcardsCore.initialize(stubHass);
        lcardsLog.info('[lcards.js] 🌐 Core singletons initialized on module load');

        // Expose ThemeManager at expected location for MSD renderers
        window.lcards.theme = lcardsCore.getThemeManager();
        lcardsLog.debug('[lcards.js] ✅ ThemeManager exposed at window.lcards.theme for MSD compatibility');

        // Preload builtin SVGs into AssetManager
        if (lcardsCore.assetManager) {
            for (const key of LCARdS.builtin_svg_keys) {
                const url = `${LCARdS.builtin_svg_basepath}${key}.svg`;
                lcardsCore.assetManager.register('svg', key, null, {
                    url,
                    pack: 'builtin',
                    source: 'builtin'
                });
            }
            lcardsLog.info(`[lcards.js] ✅ Registered ${LCARdS.builtin_svg_keys.length} builtin SVGs with AssetManager`);
        }

    } catch (error) {
        lcardsLog.warn('[lcards.js] ⚠️ Core singleton initialization deferred (will init on first card):', error);
        // This is okay - singletons will initialize when first card loads with real HASS
    }

    // Await SVG preload into legacy cache for backward compatibility
    await preloadSVGs(LCARdS.builtin_svg_keys, LCARdS.builtin_svg_basepath)
        .catch(error => lcardsLog.error('[initializeCustomCard] Error preloading built-in SVGs:', error));

    // Await font loading if loadCoreFonts is async
    await loadCoreFonts();
}


// Initialize the custom card and register elements only after setup is complete
initializeCustomCard()
    .then(() => {
        // Register cards (registered here to ensure singletons are ready)
        customElements.define('lcards-button', LCARdSButton);
        customElements.define('lcards-elbow', LCARdSElbow);
        customElements.define('lcards-chart', LCARdSChart);
        customElements.define('lcards-slider', LCARdSSlider);
        customElements.define('lcards-data-grid', LCARdSDataGrid);
        customElements.define('lcards-msd-card', LCARdSMSDCard);

        lcardsLog.info('[lcards.js] ✅ All custom elements registered after core initialization');

        // Register card schemas (must be after core initialization)
        if (window.lcards?.core?.configManager) {
            // Import and call schema registration functions
            if (LCARdSButton.registerSchema) LCARdSButton.registerSchema();
            if (LCARdSElbow.registerSchema) LCARdSElbow.registerSchema();
            if (LCARdSChart.registerSchema) LCARdSChart.registerSchema();
            if (LCARdSSlider.registerSchema) LCARdSSlider.registerSchema();
            if (LCARdSDataGrid.registerSchema) LCARdSDataGrid.registerSchema();
            if (LCARdSMSDCard.registerSchema) LCARdSMSDCard.registerSchema();

            lcardsLog.info('[lcards.js] ✅ Card schemas registered');
        } else {
            lcardsLog.error('[lcards.js] ❌ CoreConfigManager not available for schema registration');
        }
    })
    .catch(error => {
        lcardsLog.error('[initializeCustomCard.then()] Error initializing custom card:', error);
    });


// Register the cards to be available in the GUI editor
window.customCards = window.customCards || [];
const LCARdSCardClasses = [
    {
        type: 'lcards-button',
        name: 'LCARdS Button',
        preview: true,
        description: 'Modern LCARS button with multi-text labels and flexible positioning',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-elbow',
        name: 'LCARdS Elbow',
        preview: true,
        description: 'LCARS button with elbow/corner cap treatment for header and footer styles',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-chart',
        name: 'LCARdS Chart',
        preview: true,
        description: 'Data visualization chart powered by ApexCharts',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-slider',
        name: 'LCARdS Slider',
        preview: true,
        description: 'Interactive slider/gauge for lights, covers, fans, and sensors with LCARS styling',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-data-grid',
        name: 'LCARdS Data Grid',
        preview: true,
        description: 'LCARS cascade text grid with random, template, or datasource data modes',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-msd-card',
        name: 'LCARdS MSD',
        preview: true,
        description: 'LCARdS Master Systems Display (MSD) card',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    }
];

window.customCards.push(...LCARdSCardClasses);

// ============================================================================
// ALERT MODE CONSOLE API
// ============================================================================

/**
 * Set alert mode (console/testing API)
 * @param {string} mode - Alert mode name
 */
window.lcards.setAlertMode = async (mode) => {
  if (!window.lcards?.core?.themeManager) {
    console.warn('[LCARdS] ThemeManager not initialized');
    return;
  }
  await window.lcards.core.themeManager.setAlertMode(mode);
};

/**
 * Get current alert mode
 * @returns {string}
 */
window.lcards.getAlertMode = () => {
  return window.lcards?.core?.themeManager?.getAlertMode() || 'green_alert';
};

// Convenience shortcuts (all async to match setAlertMode)
// With stored original colors, we can switch directly between modes without going to green first
window.lcards.redAlert = async () => window.lcards.setAlertMode('red_alert');
window.lcards.blueAlert = async () => window.lcards.setAlertMode('blue_alert');
window.lcards.yellowAlert = async () => window.lcards.setAlertMode('yellow_alert');
window.lcards.grayAlert = async () => window.lcards.setAlertMode('gray_alert');
window.lcards.blackAlert = async () => window.lcards.setAlertMode('black_alert');
window.lcards.normalAlert = async () => window.lcards.setAlertMode('green_alert');
window.lcards.greenAlert = async () => window.lcards.setAlertMode('green_alert');

/**
 * Runtime Alert Mode Configuration API
 * Allows live adjustment of transformation parameters without rebuild
 */
window.lcards.alertConfig = {
  /**
   * Set a single parameter for an alert mode
   * @param {string} mode - Alert mode name (e.g., 'red_alert')
   * @param {string} parameter - Parameter name (e.g., 'saturationMultiplier')
   * @param {*} value - New value
   * @param {boolean} applyNow - If true, re-apply the current alert mode immediately
   */
  setParam: async (mode, parameter, value, applyNow = false) => {
    const { setAlertModeTransformParameter } = await import('./core/themes/alertModeTransform.js');
    setAlertModeTransformParameter(mode, parameter, value);

    if (applyNow && window.lcards.getAlertMode() === mode) {
      await window.lcards.setAlertMode(mode);
    }
  },

  /**
   * Get current transform configuration for a mode
   * @param {string} mode - Alert mode name
   * @returns {Object} Transform configuration
   */
  getTransform: async (mode) => {
    const { getAlertModeTransform } = await import('./core/themes/alertModeTransform.js');
    return getAlertModeTransform(mode);
  },

  /**
   * Reset a mode to default configuration
   * @param {string} mode - Alert mode name
   * @param {boolean} applyNow - If true, re-apply if this is the current mode
   */
  reset: async (mode, applyNow = false) => {
    const { resetAlertModeTransform } = await import('./core/themes/alertModeTransform.js');
    resetAlertModeTransform(mode);

    if (applyNow && window.lcards.getAlertMode() === mode) {
      await window.lcards.setAlertMode(mode);
    }
  },

  /**
   * Reset all modes to defaults
   * @param {boolean} applyNow - If true, re-apply the current alert mode
   */
  resetAll: async (applyNow = true) => {
    const { resetAllAlertModeTransforms } = await import('./core/themes/alertModeTransform.js');
    resetAllAlertModeTransforms();

    // Re-apply current mode to update CSS variables
    if (applyNow) {
      const currentMode = window.lcards.getAlertMode();
      await window.lcards.setAlertMode(currentMode);
    }
  },

  /**
   * Export current runtime overrides as JSON
   * @returns {Object} Runtime overrides
   */
  export: async () => {
    const { getRuntimeTransformOverrides } = await import('./core/themes/alertModeTransform.js');
    return getRuntimeTransformOverrides();
  },

  /**
   * Import runtime overrides from JSON
   * @param {Object} overrides - Transform overrides to load
   */
  import: async (overrides) => {
    const { loadRuntimeTransformOverrides } = await import('./core/themes/alertModeTransform.js');
    loadRuntimeTransformOverrides(overrides);
  }
};

lcardsLog.info('[lcards.js] ✅ Alert mode console API attached');