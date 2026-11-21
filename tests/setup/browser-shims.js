/**
 * Browser/build globals that src/ modules touch at import time, preloaded for
 * every test via `node --import ./tests/setup/browser-shims.js --test ...`
 * (see the `test*` scripts in package.json). Running a test file directly needs
 * the same flag.
 *
 * Deliberately no fake `document`: Lit reads document APIs at import time
 * (e.g. createTreeWalker) and fails on a partial stub. Tests that need a
 * `document` stub install their own before a dynamic import.
 */

// lcards-logging and friends read `window`; the Vite build injects the version.
globalThis.window ??= globalThis;
globalThis.__LCARDS_VERSION__ ??= 'test';
globalThis.requestAnimationFrame ??= (fn) => setTimeout(fn, 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
