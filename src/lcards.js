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
import * as svgHelpers from './utils/lcards-svg-helpers.js';
import * as anchorHelpers from './utils/lcards-anchor-helpers.js';

// MSD system import
import './msd/index.js';

// Native card imports
import { LCARdSMSDCard } from './cards/lcards-msd.js';

// Simple card imports
import { LCARdSSimpleButtonCard } from './cards/lcards-simple-button.js';
import { LCARdSElbowButtonCard } from './cards/lcards-elbow-button.js';
import { LCARdSSimpleChart } from './cards/lcards-simple-chart.js';

// Unified API system import
import { LCARdSUnifiedAPI } from './api/LCARdSUnifiedAPI.js';

// Ensure global namespace
window.lcards = window.lcards || {};

// Promises for loading the templates and stub configuration
let themeColorsPromise;

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
        utils: anime.utils,            // CENTRAL canonical utils reference
        animateElement: animHelpers.animateElement,
        animateWithRoot: animHelpers.animateWithRoot,
        waitForElement: animHelpers.waitForElement,
        presets: animPresets,
        scopes: new Map(),
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

    } catch (error) {
        lcardsLog.warn('[lcards.js] ⚠️ Core singleton initialization deferred (will init on first card):', error);
        // This is okay - singletons will initialize when first card loads with real HASS
    }

    ///load yaml configs
    // Await YAML configs
    themeColorsPromise = loadThemeColors(LCARdS.theme_colors_uri);

    // Await SVG preload
    await preloadSVGs(LCARdS.builtin_svg_keys, LCARdS.builtin_svg_basepath)
        .catch(error => lcardsLog.error('[initializeCustomCard] Error preloading built-in SVGs:', error));

    // Await font loading if loadCoreFonts is async
    await loadCoreFonts();

    // Await YAML config loading
    await Promise.all([themeColorsPromise]);
}


// Initialize the custom card and register elements only after setup is complete
initializeCustomCard()
    .then(() => {
        // Register cards (registered here to ensure singletons are ready)
        customElements.define('lcards-simple-button', LCARdSSimpleButtonCard);
        customElements.define('lcards-elbow-button', LCARdSElbowButtonCard);
        customElements.define('lcards-simple-chart', LCARdSSimpleChart);
        customElements.define('lcards-msd-card', LCARdSMSDCard);

        lcardsLog.info('[lcards.js] ✅ All custom elements registered after core initialization');
    })
    .catch(error => {
        lcardsLog.error('[initializeCustomCard.then()] Error initializing custom card:', error);
    });


async function loadThemeColors(filePath) {
    try {
        const yamlContent = await readYamlFile(filePath);

        // Merge the lcards stanza with the existing window.lcards object
        if (yamlContent.lcards) {
            window.lcards = {
                ...window.lcards,
                ...yamlContent.lcards
            };
        }
        lcardsLog.info(`[loadThemeColors] LCARdS theme colors loaded from source file [${filePath}]`, yamlContent);
        setThemeColors(window.lcards.themes, 'green');
    } catch (error) {
        lcardsLog.error('[loadThemeColors] Failed to get the LCARdS theme colors from source file.', error);
    }
}

function setThemeColors(themes, alertCondition = 'green', clobber = false) {
    const selectedTheme = themes[`${alertCondition}_alert`];
    if (!selectedTheme) {
        lcardsLog.error(`[setThemeColors] Theme for alert condition ${alertCondition} is not defined.`, '', lcardsGetGlobalLogLevel());
        return;
    }

    const colors = selectedTheme.colors;
    const skippedColors = [];

    for (const [colorGroup, colorValues] of Object.entries(colors)) {
        for (const [colorName, colorValue] of Object.entries(colorValues)) {
            const cssVarName = `--${colorName}`;
            const existingValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();

            if (clobber || !existingValue) {
                lcardsLog.warn(`[setThemeColors] Color undefined or overridden - Setting ${cssVarName}=${colorValue}`, '', lcardsGetGlobalLogLevel());
                document.documentElement.style.setProperty(cssVarName, colorValue);
            } else {
                // Track skipped colors instead of logging each one
                skippedColors.push(cssVarName);
            }
        }
    }

    // Log summary of skipped colors (if any)
    if (skippedColors.length > 0) {
        lcardsLog.debug(`[setThemeColors] Preserved ${skippedColors.length} theme colors already defined by HA theme`, '', lcardsGetGlobalLogLevel());
    }
}
function setAlertCondition(alertCondition) {
    setThemeColors(window.lcards.themes, alertCondition,true);
}
window.lcards.setAlertCondition = setAlertCondition;


// Register the cards to be available in the GUI editor
window.customCards = window.customCards || [];
const LCARdSCardClasses = [
    {
        type: 'lcards-simple-button',
        name: 'LCARdS Simple Button',
        preview: true,
        description: 'Modern LCARS button with multi-text labels and flexible positioning',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-elbow-button',
        name: 'LCARdS Elbow Button',
        preview: true,
        description: 'LCARS button with elbow/corner cap treatment for header and footer styles',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-simple-chart',
        name: 'LCARdS Simple Chart',
        preview: true,
        description: 'Data visualization chart powered by ApexCharts',
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