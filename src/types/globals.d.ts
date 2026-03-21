/**
 * Global type declarations for the LCARdS runtime namespace.
 * Tells TypeScript about window.lcards and Vite define constants so it
 * doesn't flag every access as an error.
 */

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
        __msdStatus: any;
        __msdScenarios: any;
        __msdDebug: any;
        _msdCardInstance: any;
        // Home Assistant global
        hass: any;
    }
}

export {};
