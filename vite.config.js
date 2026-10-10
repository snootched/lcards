import { defineConfig, transformWithEsbuild } from 'vite';
import { readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// 'integration' mode writes directly into custom_components/lcards/ so the
// devcontainer bind-mount picks it up without a separate copy step.
// Other modes write to tmp/vite-build/ (gitignored scratch output); the legacy
// dist/ HACS-plugin path is retired.
const isIntegrationMode = (mode) => mode === 'integration';

/**
 * emptyOutDir is off (Python files live next to lcards.js), so hashed chunks from
 * earlier builds would pile up. Clear only the chunks/ folder and the
 * pre-compressed lcards.js siblings at build start.
 * @param {string} outDir
 */
const cleanChunks = (outDir) => ({
    name: 'lcards-clean-chunks',
    buildStart() {
        rmSync(join(outDir, 'chunks'), { recursive: true, force: true });
        for (const ext of ['.gz', '.br']) rmSync(join(outDir, `lcards.js${ext}`), { force: true });
    },
});

/**
 * HA serves the integration folder through aiohttp's FileResponse, which sends a
 * `.br` or `.gz` sibling when the browser accepts it. Write both for lcards.js and
 * every lazy chunk so the bundle goes over the wire compressed.
 * @param {string} outDir
 */
const precompress = (outDir) => ({
    name: 'lcards-precompress',
    apply: 'build',
    closeBundle() {
        const chunkDir = join(outDir, 'chunks');
        const files = [join(outDir, 'lcards.js')];
        if (existsSync(chunkDir)) {
            for (const name of readdirSync(chunkDir)) {
                if (name.endsWith('.js')) files.push(join(chunkDir, name));
            }
        }
        for (const file of files) {
            if (!existsSync(file)) continue;
            const src = readFileSync(file);
            writeFileSync(`${file}.gz`, gzipSync(src, { level: 9 }));
            writeFileSync(`${file}.br`, brotliCompressSync(src, {
                params: {
                    [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
                    [zlibConstants.BROTLI_PARAM_SIZE_HINT]: src.length,
                },
            }));
        }
    },
});

/**
 * Vite 5 never strips whitespace in ES library builds (it assumes a downstream
 * bundler will). lcards.js is served as-is, so strip it here. `order: 'post'`
 * runs after Vite's own identifier/syntax minify; Rollup chains the sourcemap.
 */
const minifyWhitespace = () => ({
    name: 'lcards-minify-whitespace',
    apply: 'build',
    renderChunk: {
        order: 'post',
        async handler(code, chunk) {
            const result = await transformWithEsbuild(code, chunk.fileName, {
                loader: 'js',
                format: 'esm',
                minifyWhitespace: true,
                charset: 'utf8',
                sourcemap: true,
            });
            return { code: result.code, map: result.map };
        },
    },
});

const outDirFor = (mode) => (isIntegrationMode(mode) ? 'custom_components/lcards' : 'tmp/vite-build');

export default defineConfig(({ mode }) => ({
    plugins: [
        cleanChunks(outDirFor(mode)),
        ...(mode === 'development' ? [] : [minifyWhitespace()]),
        ...(isIntegrationMode(mode) ? [precompress(outDirFor(mode))] : []),
    ],
    // Keep class/function names through minification: logs and BaseService use
    // constructor.name.
    esbuild: {
        keepNames: true,
    },
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
        // all other modes  → tmp/vite-build/             (scratch output)
        outDir: outDirFor(mode),
        // Never wipe outDir: Python files live alongside lcards.js in integration mode.
        emptyOutDir: false,
        sourcemap: true,
        // Minified with esbuild (sourcemaps map back to src/). 'development' mode
        // stays readable for debugging.
        minify: mode === 'development' ? false : 'esbuild',
    },
    define: {
        __LCARDS_VERSION__: JSON.stringify(pkg.version),
        __LCARDS_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
}));
