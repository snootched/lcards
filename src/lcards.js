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
import { loadSVGToCache, getSVGFromCache } from './utils/lcards-fileutils.js';
import { loadFont } from './utils/lcards-theme.js';

import * as animHelpers from './utils/lcards-anim-helpers.js';
import { listAnimationPresets, getAnimationPreset } from './core/animation/presets.js';
import * as svgHelpers from './utils/lcards-svg-helpers.js';
import * as anchorHelpers from './utils/lcards-anchor-helpers.js';

// MSD system import
import './msd/index.js';

// LCARdS card imports
import { LCARdSButton } from './cards/lcards-button.js';
import { LCARdSElbow } from './cards/lcards-elbow.js';
import { LCARdSChart } from './cards/lcards-chart.js';
import { LCARdSSlider } from './cards/lcards-slider.js';
import { LCARdSDataGrid } from './cards/lcards-data-grid.js';
import { LCARdSMSDCard } from './cards/lcards-msd.js';
import { LCARdSAlertOverlay } from './cards/lcards-alert-overlay.js';
import { LCARdSConfigPanel } from './panels/lcards-config-panel.js';


// Ensure global namespace
window.lcards = window.lcards || {};


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
        spring: anime.createSpring,    // spring easing generator (v4 API)
        utils: anime.utils,            // CENTRAL canonical utils reference
        animateElement: animHelpers.animateElement,
        animateWithRoot: animHelpers.animateWithRoot,
        waitForElement: animHelpers.waitForElement,
        presets: {},   // Populated entirely by pack loading (legacy presets disabled)
        scopes: new Map(),
        // Easing function shortcuts
        eases: anime.eases,            // All easing functions (built-in and advanced)
        // Easing function API reference:
        // - Built-in parametric: anime.eases.in(), .out(), .inOut(), .inBack(), etc.
        // - Advanced generators:
        //   • anime.createSpring({ mass, stiffness, damping, velocity }) - top-level export
        //   • anime.eases.cubicBezier(x1, y1, x2, y2)
        //   • anime.eases.steps(count, fromStart)
        //   • anime.eases.linear(...points)
        //   • anime.eases.irregular(steps, randomness)
    };


    // Backward-compatible shortcuts (to be deprecated)
    window.lcards.animejs = window.lcards.anim.animejs;
    window.lcards.anime = window.lcards.anim.anime;
    window.lcards.animateElement = window.lcards.anim.animateElement;
    window.lcards.animateWithRoot = window.lcards.anim.animateWithRoot;
    window.lcards.waitForElement = window.lcards.anim.waitForElement;


    window.lcards.svgHelpers = svgHelpers;
    window.lcards.anchorHelpers = anchorHelpers;
    window.lcards.findSvgAnchors = anchorHelpers.findSvgAnchors;
    //window.lcards.getSvgContent = anchorHelpers.getSvgContent;
    //window.lcards.getSvgViewBox = anchorHelpers.getSvgViewBox;
    //window.lcards.getSvgAspectRatio = anchorHelpers.getSvgAspectRatio;


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

    // === PERFORMANCE MONITOR DEBUG SHORTCUT ===
    // window.lcards.perf.fps()       → current FPS
    // window.lcards.perf.status()    → full status object
    // window.lcards.perf.thresholds  → {disable3D, reduceEffects}
    window.lcards.perf = {
      fps() {
        return window.lcards.core.performanceMonitor?.getFPS() ?? null;
      },
      status() {
        const m = window.lcards.core.performanceMonitor;
        if (!m) return { available: false };
        const settled = m._startTime ? (performance.now() - m._startTime) >= m._settleMs : false;
        return {
          fps: m.currentFPS,
          isMonitoring: m.isMonitoring,
          settled,
          settleMs: m._settleMs,
          consecutiveLow: m._consecutiveLow,
          lowRequiredCount: m._lowRequiredCount,
          thresholds: { ...m.thresholds }
        };
      },
      get thresholds() {
        return window.lcards.core.performanceMonitor?.thresholds ?? null;
      }
    };

    lcardsLog.debug('[lcards.js] LCARdSCore singleton attached to window.lcards.core');
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
        lcardsLog.debug('[lcards.js] Core singletons initialized on module load');

        // NOW merge MSD presets after pack loading (so cascade-color and others are registered)
        const msdPresetNames = listAnimationPresets();
        msdPresetNames.forEach(name => {
            window.lcards.anim.presets[name] = getAnimationPreset(name);
        });
        lcardsLog.debug(`[LCARdS] Loaded ${msdPresetNames.length} MSD animation presets after pack loading:`, msdPresetNames);
        lcardsLog.debug(`[LCARdS] Total presets now available:`, Object.keys(window.lcards.anim.presets));

        // Expose ThemeManager at expected location for MSD renderers
        window.lcards.theme = lcardsCore.getThemeManager();
        lcardsLog.debug('[lcards.js] ✅ ThemeManager exposed at window.lcards.theme for MSD compatibility');

        // Builtin SVGs are now registered via builtin_msd_backgrounds pack
        // (automatically loaded by PackManager during core initialization)

    } catch (error) {
        lcardsLog.warn('[lcards.js] ⚠️ Core singleton initialization deferred (will init on first card):', error);
        // This is okay - singletons will initialize when first card loads with real HASS
    }
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
        customElements.define('lcards-alert-overlay', LCARdSAlertOverlay);
        //customElements.define('lcards-config-panel', LCARdSConfigPanel);

        lcardsLog.debug('[lcards.js] All custom elements registered after core initialization');

        // Register card schemas (must be after core initialization)
        if (window.lcards?.core?.configManager) {
            // Import and call schema registration functions
            if (LCARdSButton.registerSchema) LCARdSButton.registerSchema();
            if (LCARdSElbow.registerSchema) LCARdSElbow.registerSchema();
            if (LCARdSChart.registerSchema) LCARdSChart.registerSchema();
            if (LCARdSSlider.registerSchema) LCARdSSlider.registerSchema();
            if (LCARdSDataGrid.registerSchema) LCARdSDataGrid.registerSchema();
            if (LCARdSMSDCard.registerSchema) LCARdSMSDCard.registerSchema();
            if (LCARdSAlertOverlay.registerSchema) LCARdSAlertOverlay.registerSchema();

            lcardsLog.debug('[lcards.js] Card schemas registered');
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
    },
    {
        type: 'lcards-alert-overlay',
        name: 'LCARdS Alert Overlay',
        preview: false,
        description: 'Full-screen alert overlay that reacts to lcards_alert_mode with backdrop and content card',
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
    lcardsLog.warn('⚠️ [LCARdS] ThemeManager not initialized');
    return;
  }

  // Ensure ThemeManager has HASS reference (critical for green_alert theme reload)
  const hass = window.lcards.core._currentHass;

  if (hass && typeof hass.callService === 'function') {
    window.lcards.core.themeManager.updateHass(hass);
  } else if (mode === 'green_alert') {
    lcardsLog.warn('⚠️ [LCARdS] HASS connection not available - green alert theme reload may fail', {
      hasHass: !!hass,
      hassType: hass ? typeof hass : 'undefined',
      hasCallService: !!(hass && hass.callService),
      callServiceType: hass && hass.callService ? typeof hass.callService : 'undefined'
    });
  }

  // Apply theme change immediately.
  const previousMode = window.lcards.core.themeManager.getAlertMode?.();
  await window.lcards.core.themeManager.setAlertMode(mode);

  // Sync the input_select helper if it exists.
  // This keeps the HA state in sync when called from the JS console or Config Panel,
  // and is the trigger for the SoundManager subscription to fire.
  // If the helper doesn't exist, play the sound directly as a fallback.
  const helperEntityId = 'input_select.lcards_alert_mode';
  const helperExists = hass?.states?.[helperEntityId] !== undefined;

  if (helperExists && mode !== previousMode) {
    // Fire and forget — the HelperManager subscription will handle sound.
    hass.callService('input_select', 'select_option', {
      entity_id: helperEntityId,
      option: mode,
    }).catch(err => lcardsLog.warn('[LCARdS] Failed to sync alert_mode helper:', err));
  } else if (!helperExists && mode !== previousMode) {
    // No helper — play sound directly since the subscription won't fire.
    window.lcards.core.soundManager?.playAlertSound(mode);
  }
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

// === SOUND DEBUG API ===
// Exposes sound system controls for debugging and testing in the HA developer console.
// Example usage:
//   window.lcards.sound.preview('ui_click')        // Preview a specific asset
//   window.lcards.sound.play('card_tap')            // Simulate a card tap sound
//   window.lcards.sound.getSchemes()               // List all registered scheme names
//   window.lcards.sound.getEvents()                // List all sound event types
window.lcards.sound = {
  play:       (eventType, ctx) => window.lcards.core.soundManager?.play(eventType, ctx),
  preview:    (assetKey)       => window.lcards.core.soundManager?.preview(assetKey),
  getSchemes: ()               => window.lcards.core.soundManager?.getSchemeNames(),
  getEvents:  ()               => window.lcards.core.soundManager?.getEventTypes(),
};
lcardsLog.debug('[lcards.js] Sound console API attached');
lcardsLog.debug('[lcards.js] Alert mode console API attached');