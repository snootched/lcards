/**
 * Node loader hooks that mirror the two Vite import forms src/ uses, so modules
 * that Vite bundles fine also load under `node --test`:
 *
 *   import text from './file.js?raw';   -> default export is the file's text
 *   import data from './file.json';     -> default export is the parsed JSON
 *                                          (node otherwise demands `with { type: 'json' }`)
 *
 * Preloaded by the `test*` scripts in package.json after browser-shims.js.
 * Test-only: the shipped bundle is unaffected.
 */
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Only rewrite the repo's own sources: dependencies (e.g. jsdom's tr46) use
// CommonJS require() on .json files, which must keep node's native handling.
const SRC_URL = pathToFileURL(fileURLToPath(new URL('../../src/', import.meta.url))).href;

registerHooks({
    load(url, context, nextLoad) {
        if (url.startsWith(SRC_URL)) {
            const [path, query] = url.split('?');
            if (query === 'raw') {
                const text = readFileSync(fileURLToPath(path), 'utf8');
                return { format: 'module', source: `export default ${JSON.stringify(text)};`, shortCircuit: true };
            }
            if (path.endsWith('.json') && !context.importAttributes?.type) {
                const json = readFileSync(fileURLToPath(path), 'utf8');
                return { format: 'module', source: `export default ${json};`, shortCircuit: true };
            }
        }
        return nextLoad(url, context);
    },
});
