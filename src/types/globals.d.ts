/**
 * Global type declarations for the LCARdS runtime namespace.
 * Tells TypeScript about window.lcards and Vite define constants so it
 * doesn't flag every access as an error.
 */

// Vite ?raw imports — used by Blob-worker pattern to inline worker source at build time.
declare module '*?raw' {
    const content: string;
    export default content;
}

declare global {
    // Vite define() substitutions injected at build time
    const __LCARDS_VERSION__: string;
    const __LCARDS_BUILD_DATE__: string;

    // Lit TemplateResult — HTML template result (from html`` tagged literals)
    type TemplateResult = import('lit').TemplateResult<1>;

    // Global perf utility stubs (used in mergePacks.js and others)
    function perfTime(label: string, fn: () => any, meta?: object): any;
    function perfTimeAsync(label: string, fn: () => Promise<any>, meta?: object): Promise<any>;
    function perfCount(label: string, value?: any): void;

    interface Window {
        lcards: any;
        /** Set by the loader stub (src/lcards.js): the integration's ?log= level. */
        __LCARDS_BOOT__?: { log: string | null };
        lcardsCore: any;
        customCards: any[];
        ApexCharts: any;
        jsyaml: any;
        /** Debug/diagnostic handle exposed at runtime for console access */
        ThemeManager: any;
        BaseService: any;
        StylePresetManager: any;
        themeTokenResolver: any;
        loadBuiltinPacksModule: any;
        __simpleCardTemplateEvaluator: any;
        __templateDetector: any;
        __templateEvaluator: any;
        __templateParser: any;
        __unifiedTemplateEvaluator: any;
        // MSD debug / test globals
        __msdScenarios: any;
        __msdDebug: any;
        _msdCardInstance: any;
        // Home Assistant global
        hass: any;
        /** HA frontend: loads the card helpers (createCardElement, ...); set once HA's frontend is up. */
        loadCardHelpers?: () => Promise<any>;
        /** Legacy HA global some code paths still probe for the Lovelace config object. */
        lovelace?: any;
        /** HA frontend: custom dashboard strategies registered for the picker. */
        customStrategies?: Array<{ type: string; strategyType?: string; name?: string; description?: string; documentationURL?: string }>;
    }
}

export {};
