import { defineConfig } from 'vite';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// 'integration' mode writes directly into custom_components/lcards/ so the
// devcontainer bind-mount picks it up without a separate copy step.
// All other modes (default, 'development') write to dist/ as before.
const isIntegrationMode = (mode) => mode === 'integration';

/**
 * emptyOutDir is off (Python files live next to lcards.js), so hashed chunks from
 * earlier builds would pile up. Clear only the chunks/ folder at build start.
 * @param {string} outDir
 */
const cleanChunks = (outDir) => ({
    name: 'lcards-clean-chunks',
    buildStart() {
        rmSync(join(outDir, 'chunks'), { recursive: true, force: true });
    },
});

const outDirFor = (mode) => (isIntegrationMode(mode) ? 'custom_components/lcards' : 'dist');

export default defineConfig(({ mode }) => ({
    plugins: [cleanChunks(outDirFor(mode))],
    build: {
        lib: {
            entry: 'src/lcards.js',
            name: 'LCARdS',
            // String (not function) lets Vite append the format extension automatically → lcards.js
            fileName: 'lcards',
            formats: ['es'],
        },
        rollupOptions: {
            output: {
                // lcards.js is injected into every HA page, so heavy, rarely needed
                // libraries are split into lazily loaded chunks (ApexCharts loads only
                // when a chart renders). Chunks use native ESM import() resolved
                // relative to lcards.js, so there is no global chunk registry that
                // could collide with other bundled cards on the same page.
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
        // integration mode → custom_components/lcards/  (bind-mounted into HA devcontainer)
        // all other modes  → dist/                      (legacy plugin path, unchanged)
        outDir: outDirFor(mode),
        // Never wipe outDir — Python files live alongside lcards.js in integration mode;
        // fonts/ and msd/ asset dirs are managed by CI in dist/ mode.
        emptyOutDir: false,
        sourcemap: true,
        // Disable minification in development / integration mode for readable output.
        // Production builds use esbuild (default, ~10x faster than Terser).
        minify: (mode === 'development' || isIntegrationMode(mode)) ? false : 'esbuild',
    },
    define: {
        __LCARDS_VERSION__: JSON.stringify(pkg.version),
        __LCARDS_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
}));
