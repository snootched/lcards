import { lcardsSetGlobalLogLevel, lcardsGetGlobalLogLevel, lcardsLog, lcardsLogBanner} from './utils/lcards-logging.js';
import * as LCARdS from './lcards-vars.js'
import { lcardsCore } from './core/lcards-core.js';
import { ALERT_MODE_TRANSFORMS } from './core/themes/alertModeTransform.js';

// 1. Integration-configured log level — baked into the script URL as ?log=<level>
//    by frontend.py when the integration loads. Applies the persistent user preference
//    set in the HA "Configure" dialog before anything else runs.
try {
    const scriptLogLevel = new URL(import.meta.url).searchParams.get('log');
    if (scriptLogLevel) {
        lcardsSetGlobalLogLevel(scriptLogLevel);
    }
} catch (_e) {
    // Silently ignore — older browsers or unusual Module-URL environments.
}

// 2. Page URL override — ?lcards_log_level= takes higher priority than the integration
//    setting, letting developers switch verbosity per session without touching HA config.
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

// LCARdS strategy imports
import { LCARdSPanelViewStrategy, LCARdSPanelDashboardStrategy } from './strategies/index.js';

// LCARdS card imports
import { LCARdSButton } from './cards/lcards-button.js';
import { LCARdSElbow } from './cards/lcards-elbow.js';
import { LCARdSChart } from './cards/lcards-chart.js';
import { LCARdSSlider } from './cards/lcards-slider.js';
import { LCARdSDataGrid } from './cards/lcards-data-grid.js';
import { LCARdSMSDCard } from './cards/lcards-msd.js';
import { LCARdSAlertOverlay } from './cards/lcards-alert-overlay.js';
import { LCARdSSelectMenu } from './cards/lcards-select-menu.js';
import { LCARdSConfigPanel } from './panels/lcards-config-panel.js';


// Ensure global namespace
window.lcards = window.lcards || {};

// Version is available immediately at module load (before async init)
window.lcards.version = LCARdS.LCARdS_VERSION;

/**
 * window.lcards.info()
 * Returns a snapshot of the current LCARdS runtime state —
 * useful for troubleshooting and paste into bug reports.
 *
 * Usage (browser console): window.lcards.info()
 */
window.lcards.info = function () {
    const core = window.lcards.core;
    const info = {
        version:   LCARdS.LCARdS_VERSION,
        buildDate: __LCARDS_BUILD_DATE__,
        homepage:  LCARdS.project_url,
        logLevel:  lcardsGetGlobalLogLevel(),
        preview:   window.lcards?.core?.integrationService?.options?.enable_previews ?? false,
        cards: [
            'lcards-button',
            'lcards-elbow',
            'lcards-chart',
            'lcards-slider',
            'lcards-data-grid',
            'lcards-msd-card',
            'lcards-alert-overlay',
        ],
        core: {
            initialized: !!core?._coreInitialized,
            alertMode:   core?.themeManager?.getAlertMode?.() ?? null,
            theme:       core?.themeManager?.getActiveTheme?.()?.id ?? null,
            dataSources: core?.dataSourceManager ? Object.keys(core.dataSourceManager.sources ?? {}).length : null,
        },
    };
    // Pretty-print to console and also return for programmatic use
    console.group('%c LCARdS Info ', 'background:#1b4f8a;color:#7eb6e8;font-weight:bold;padding:2px 6px;border-radius:4px;');
    console.log('Version  :', info.version);
    console.log('Build    :', info.buildDate);
    console.log('Homepage :', info.homepage);
    console.log('Log level:', info.logLevel);
    console.log('Preview  :', info.preview, info.preview === false ? '— call await window.lcards.refreshOptions() if you just changed this' : '');
    console.log('Cards    :', info.cards.join(', '));
    console.log('Core     :', info.core);
    console.groupEnd();
    return info;
};

/**
 * window.lcards.refreshOptions()
 * Re-fetches integration options from the backend (lcards/info) and updates
 * the cached options object used by _isPreviewEnabled() and other checks.
 * Useful after saving integration settings without doing a full page reload.
 *
 * Usage (browser console): await window.lcards.refreshOptions()
 */
window.lcards.refreshOptions = () =>
    window.lcards?.core?.integrationService?.refreshOptions?.()
    ?? Promise.resolve();


async function initializeCustomCard() {

    // Call log banner function immediately when the script loads
    //window.lcards.lcardsLog = lcardsLog; // Expose the logging function globally

    // Expose debug helpers (the module already attaches API; this ensures references exist)
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.setLevel = lcardsSetGlobalLogLevel;
    window.lcards.debug.getLevel = lcardsGetGlobalLogLevel;

    // Animation namespace organization
    window.lcards.anim = {
        animejs: anime,                // full animejs module
        anime: anime.animate,          // shortcut for anime.animate
        stagger: anime.stagger,        // stagger function for animations
        spring: anime.createSpring,    // spring easing generator (v4 API)
        createScope: anime.createScope, // scope factory for overlay-scoped animations
        utils: anime.utils,            // CENTRAL canonical utils reference
        splitText: anime.splitText,    // native text splitter (v4.1+)
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
    window.lcards.debug.perf = {
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

    // === THEME DEBUG SHORTCUT ===
    // window.lcards.debug.theme.current()         → active theme object
    // window.lcards.debug.theme.alertMode()       → current alert mode name
    // window.lcards.debug.theme.list()            → all registered theme IDs
    // window.lcards.debug.theme.token('path')     → resolve a token path
    // window.lcards.debug.theme.info()            → full ThemeManager debug snapshot
    window.lcards.debug.theme = {
      current:   () => window.lcards.core.themeManager?.getActiveTheme() ?? null,
      alertMode: () => window.lcards.core.themeManager?.getAlertMode() ?? null,
      list:      () => window.lcards.core.themeManager?.listThemes() ?? [],
      token:     (path, fallback) => window.lcards.core.themeManager?.getToken(path, fallback) ?? null,
      info:      () => window.lcards.core.themeManager?.getDebugInfo() ?? null,
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
        if (!customElements.get('lcards-button')) customElements.define('lcards-button', LCARdSButton);
        if (!customElements.get('lcards-elbow')) customElements.define('lcards-elbow', LCARdSElbow);
        if (!customElements.get('lcards-chart')) customElements.define('lcards-chart', LCARdSChart);
        if (!customElements.get('lcards-slider')) customElements.define('lcards-slider', LCARdSSlider);
        if (!customElements.get('lcards-data-grid')) customElements.define('lcards-data-grid', LCARdSDataGrid);
        if (!customElements.get('lcards-msd-card')) customElements.define('lcards-msd-card', LCARdSMSDCard);
        if (!customElements.get('lcards-alert-overlay')) customElements.define('lcards-alert-overlay', LCARdSAlertOverlay);
        if (!customElements.get('lcards-select-menu')) customElements.define('lcards-select-menu', LCARdSSelectMenu);
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
            if (LCARdSSelectMenu.registerSchema) LCARdSSelectMenu.registerSchema();

            lcardsLog.debug('[lcards.js] Card schemas registered');

        // Register dashboard/view strategies as custom elements.
        // Naming convention required by HA: ll-strategy-dashboard-{type} / ll-strategy-view-{type}
        // https://developers.home-assistant.io/docs/frontend/custom-ui/custom-strategy/
        if (!customElements.get('ll-strategy-dashboard-lcards-panel')) {
            customElements.define('ll-strategy-dashboard-lcards-panel', LCARdSPanelDashboardStrategy);
        }
        if (!customElements.get('ll-strategy-view-lcards-panel')) {
            customElements.define('ll-strategy-view-lcards-panel', LCARdSPanelViewStrategy);
        }
        lcardsLog.debug('[lcards.js] Dashboard/view strategies registered');
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
        documentationURL: "https://lcards.unimatrix01.ca/cards/button/",
    },
    {
        type: 'lcards-elbow',
        name: 'LCARdS Elbow',
        preview: true,
        description: 'LCARS button with elbow/corner cap treatment for header and footer styles',
        documentationURL: "https://lcards.unimatrix01.ca/cards/elbow/",
    },
    {
        type: 'lcards-chart',
        name: 'LCARdS Chart',
        preview: true,
        description: 'Data visualization chart powered by ApexCharts',
        documentationURL: "https://lcards.unimatrix01.ca/cards/chart/",
    },
    {
        type: 'lcards-slider',
        name: 'LCARdS Slider',
        preview: true,
        description: 'Interactive slider/gauge for lights, covers, fans, and sensors with LCARS styling',
        documentationURL: "https://lcards.unimatrix01.ca/cards/slider-card/",
    },
    {
        type: 'lcards-data-grid',
        name: 'LCARdS Data Grid',
        preview: true,
        description: 'LCARS cascade text grid with random, template, or datasource data modes',
        documentationURL: "https://lcards.unimatrix01.ca/cards/data-grid/",
    },
    {
        type: 'lcards-msd-card',
        name: 'LCARdS MSD',
        preview: true,
        description: 'LCARdS Master Systems Display (MSD) card',
        documentationURL: "https://lcards.unimatrix01.ca/cards/msd/",
    },
    {
        type: 'lcards-select-menu',
        name: 'LCARdS Select Menu',
        preview: true,
        description: 'Renders an input_select entity as a grid of LCARS-styled option buttons',
        documentationURL: 'https://lcards.unimatrix01.ca/cards/select-menu/',
    },
    {
        type: 'lcards-alert-overlay',
        name: 'LCARdS Alert Overlay',
        preview: false,
        description: 'Full-screen alert overlay that reacts to lcards_alert_mode with backdrop and content card',
        documentationURL: "https://lcards.unimatrix01.ca/cards/alert-overlay/",
    }
];

// Guard against double-registration when the bundle is evaluated more than once
// (e.g. both add_extra_js_url AND a lingering hacsfiles Lovelace resource entry).
if (!window.customCards.some(c => c.type === 'lcards-button')) {
  window.customCards.push(...LCARdSCardClasses);
}

// ============================================================================
// ALERT MODE CONSOLE API
// ============================================================================

/**
 * Set alert mode (console/testing API)
 * @param {string} mode - Alert mode name
 */
window.lcards.setAlertMode = async (mode, opts = {}) => {
  if (!window.lcards?.core?.themeManager) {
    lcardsLog.warn('⚠️ [LCARdS] ThemeManager not initialized');
    return;
  }

  // Validate mode early — ThemeManager.setAlertMode() returns *silently* (no throw)
  // for unknown modes, so without this guard the code would fall through to the
  // callService write-back and send an invalid option to HA (causing a UI toast).
  // This protects against stale helper values, misconfigured input_select initial
  // states, or any other source that could produce a non-LCARdS mode string.
  if (!ALERT_MODE_TRANSFORMS[mode]) {
    lcardsLog.warn(`⚠️ [LCARdS] setAlertMode called with unknown mode: '${mode}' — ignoring`);
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

  // Resolve transition style: skip on init/programmatic calls, otherwise read the helper.
  const transitionStyle = opts.skipTransition
    ? 'off'
    : (window.lcards.core.helperManager?.getHelperValue('alert_transition_style') ?? 'off');

  // Apply theme change immediately.
  const previousMode = window.lcards.core.themeManager.getAlertMode?.();
    try {
      await window.lcards.core.themeManager.setAlertMode(mode, { transitionStyle });
    } catch (err) {
      lcardsLog.error(`[LCARdS] setAlertMode('${mode}') failed:`, err);
      return;
    }

  // Sync the input_select helper if it exists.
  // This keeps the HA state in sync when called from the JS console or Config Panel,
  // and is the trigger for the SoundManager subscription to fire.
  // If the helper doesn't exist, play the sound directly as a fallback.
  //
  // skipHelperSync: true suppresses the write-back.  This must be used when
  // setAlertMode() is called from a targeted lcars_event (IntegrationService
  // set_alert_mode case) so the change stays local to this tab — writing to
  // input_select would re-trigger all other tabs via their HelperManager
  // subscriptions, defeating the targeting entirely.
  const helperEntityId = 'input_select.lcards_alert_mode';
  const helperExists = hass?.states?.[helperEntityId] !== undefined;

  if (helperExists && mode !== previousMode && !opts.skipHelperSync) {
    // Fire and forget — the HelperManager subscription will handle sound.
    hass.callService('input_select', 'select_option', {
      entity_id: helperEntityId,
      option: mode,
    }).catch(err => lcardsLog.warn('[LCARdS] Failed to sync alert_mode helper:', err));
  } else if (mode !== previousMode && (!helperExists || opts.skipHelperSync)) {
    // No helper OR helper sync explicitly skipped — play sound directly since
    // the HelperManager subscription will not fire in this case.
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
   * @returns {Promise<any>} Transform configuration
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
   * @returns {Promise<any>} Runtime overrides
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

// === ALERT NAMESPACE ===
// Scoped console API — cleaner alias set for interactive use.
// Root-level shortcuts (window.lcards.redAlert, etc.) are kept for backward compatibility.
window.lcards.alert = {
  set:    (mode, opts) => window.lcards.setAlertMode(mode, opts),
  get:    () => window.lcards.getAlertMode(),
  red:    () => window.lcards.setAlertMode('red_alert'),
  yellow: () => window.lcards.setAlertMode('yellow_alert'),
  blue:   () => window.lcards.setAlertMode('blue_alert'),
  gray:   () => window.lcards.setAlertMode('gray_alert'),
  black:  () => window.lcards.setAlertMode('black_alert'),
  green:  () => window.lcards.setAlertMode('green_alert'),
  off:    () => window.lcards.setAlertMode('green_alert'),  // reset to normal
  config: window.lcards.alertConfig,
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

// === TARGETING DEBUG API ===
// Returns the IDs needed for target_device_ids / target_user_ids service fields.
// Usage in browser console:
//   window.lcards.targeting.getMyIds()  →  { deviceId: '...', userId: '...' }
window.lcards.targeting = {
  /**
   * Return the device ID and HA user ID for this browser session.
   * Copy these values when constructing target_device_ids / target_user_ids
   * service call data.
   * @returns {{ deviceId: string|null, userId: string|null }}
   */
  getMyIds() {
    const deviceId = window.lcards?.core?.deviceIdentityManager?.getDeviceId() ?? null;
    const userId   = window.lcards?.core?._currentHass?.user?.id
                  || window.lcards?.core?.integrationService?._hass?.user?.id
                  || null;
    console.info('[LCARdS Targeting] Your IDs:', { deviceId, userId });
    return { deviceId, userId };
  },
};
lcardsLog.debug('[lcards.js] Targeting console API attached');