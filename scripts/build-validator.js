#!/usr/bin/env node
/**
 * build-validator.js - bundle scripts/lcards-validate.mjs into one standalone file.
 *
 * The result runs with plain Node 20+ and no install: schemas, the checker, ajv
 * and js-yaml are inlined, and the built-in registries and the LCARdS version are
 * baked in (so the heavy src/ modules that compute the registries stay out).
 *
 *   node scripts/build-validator.js [--out=<file>]   (default doc/public/tools/lcards-validate.mjs)
 *
 * Published at /tools/lcards-validate.mjs on the docs site (docs:build) and
 * attached to each GitHub release (the Release workflow).
 */
import { build } from 'vite';
import { mkdirSync, mkdtempSync, copyFileSync, rmSync, statSync, chmodSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildRegistries } from './lib/registries.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.slice(2).find(a => a.startsWith('--out='));
const OUT = outArg ? resolve(outArg.slice('--out='.length)) : join(ROOT, 'doc/public/tools/lcards-validate.mjs');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const REGISTRIES_MODULE = join(ROOT, 'scripts/lib/registries.js');

const registries = await buildRegistries();
const work = mkdtempSync(join(tmpdir(), 'lcards-validator-'));

await build({
  configFile: false,
  logLevel: 'warn',
  root: ROOT,
  define: {
    __LCARDS_REGISTRIES__: JSON.stringify(registries),
    __LCARDS_VALIDATOR_VERSION__: JSON.stringify(pkg.version),
    // src/ modules reference the build-time version too.
    __LCARDS_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [{
    // The registries are baked in above; keep the modules that compute them out.
    name: 'lcards-validator-no-live-registries',
    enforce: 'pre',
    resolveId(id, importer) {
      if (importer && resolve(dirname(importer), id) === REGISTRIES_MODULE) return '\0lcards-registries-stub';
      return null;
    },
    load(id) {
      return id === '\0lcards-registries-stub'
        ? 'export async function buildRegistries() { throw new Error("registries are bundled"); }'
        : null;
    },
  }],
  ssr: { noExternal: true, target: 'node' },
  build: {
    ssr: join(ROOT, 'scripts/lcards-validate.mjs'),
    outDir: work,
    emptyOutDir: true,
    minify: false,
    target: 'node20',
    rollupOptions: { output: { format: 'es', entryFileNames: 'lcards-validate.mjs', inlineDynamicImports: true } },
  },
});

mkdirSync(dirname(OUT), { recursive: true });
// Copy, not rename: the temp folder may be on another filesystem (EXDEV).
copyFileSync(join(work, 'lcards-validate.mjs'), OUT);
rmSync(work, { recursive: true, force: true });
chmodSync(OUT, 0o755);
console.log(`✅ Wrote ${OUT.startsWith(ROOT) ? OUT.slice(ROOT.length + 1) : OUT} (${(statSync(OUT).size / 1024).toFixed(0)} KB, LCARdS ${pkg.version})`);
