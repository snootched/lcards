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

    interface Window {
        lcards: any;
        lcardsCore: any;
        customCards: any[];
        /** Debug/diagnostic handle exposed at runtime for console access */
        ThemeManager: any;
    }
}

export {};
