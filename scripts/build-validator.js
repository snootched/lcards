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
 * attached to each GitHub release (the Release workflow). The licence notices of the
 * npm packages inlined into it (ajv, js-yaml, yaml and their dependencies) go into a
 * comment at the top of the file (scripts/lib/third-party.js noticesText).
 */
import { build } from 'vite';
import { mkdirSync, mkdtempSync, rmSync, statSync, chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildRegistries } from './lib/registries.js';
import { packageFromPath, noticesText } from './lib/third-party.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.slice(2).find(a => a.startsWith('--out='));
const OUT = outArg ? resolve(outArg.slice('--out='.length)) : join(ROOT, 'doc/public/tools/lcards-validate.mjs');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const REGISTRIES_MODULE = join(ROOT, 'scripts/lib/registries.js');

const registries = await buildRegistries();
const work = mkdtempSync(join(tmpdir(), 'lcards-validator-'));

const result = await build({
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

// The npm packages Rollup inlined, from the modules of the output chunk.
const packages = new Set();
for (const output of [result].flat()) {
  for (const chunk of /** @type {any} */ (output).output ?? []) {
    for (const id of [...(chunk.moduleIds ?? []), ...Object.keys(chunk.modules ?? {})]) {
      const name = packageFromPath(id.replace(/\\/g, '/'));
      if (name) packages.add(name);
    }
  }
}
const notices = noticesText(packages, { title: `lcards-validate (LCARdS ${pkg.version}): third-party notices`, generator: 'scripts/build-validator.js', hand: false }).replaceAll('*/', '* /');
const code = readFileSync(join(work, 'lcards-validate.mjs'), 'utf8');
const shebang = code.startsWith('#!') ? code.slice(0, code.indexOf('\n') + 1) : '';

mkdirSync(dirname(OUT), { recursive: true });
// Write, not rename: the temp folder may be on another filesystem (EXDEV).
writeFileSync(OUT, `${shebang}/*\n${notices}*/\n${code.slice(shebang.length)}`);
rmSync(work, { recursive: true, force: true });
chmodSync(OUT, 0o755);
console.log(`✅ Wrote ${OUT.startsWith(ROOT) ? OUT.slice(ROOT.length + 1) : OUT} (${(statSync(OUT).size / 1024).toFixed(0)} KB, LCARdS ${pkg.version}, notices for ${packages.size} packages)`);
