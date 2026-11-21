#!/usr/bin/env node
/**
 * generate-third-party-notices.js - write custom_components/lcards/THIRD_PARTY_NOTICES.txt.
 *
 * The license texts of every npm package built into lcards.js and its chunks (found
 * in the build's sourcemaps, so transitive packages such as @lezer/* and d3-ease are
 * included), read from node_modules/<pkg>/LICENSE, plus the hand entries of the
 * repo's THIRD_PARTY_LICENSES (ha-lcars, lcars, engage). The file is gitignored like
 * lcards.js and ships in the release zip with the rest of custom_components/lcards/.
 *
 * Runs after the Vite build in npm run build, build:integration and docs:bundle:
 *   node scripts/generate-third-party-notices.js [--dir=custom_components/lcards]
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, bundledPackagesFromMaps, sourcemapFiles, rowPackages, noticesText } from './lib/third-party.js';

const dirArg = process.argv.slice(2).find(a => a.startsWith('--dir='));
const DIR = dirArg ? resolve(dirArg.slice('--dir='.length)) : join(ROOT, 'custom_components/lcards');

if (sourcemapFiles(DIR).length === 0) {
  console.error(`No sourcemaps in ${DIR}: run the Vite build first (it always writes .map files, hidden ones for a stable release).`);
  process.exit(1);
}

const bundled = bundledPackagesFromMaps(DIR);
// Row packages too: a row's own package can be all re-exports that leave no source
// in the map (lit itself; lit-html and friends hold the code).
const rows = rowPackages('runtime');
const names = new Set([...bundled.keys(), ...[...rows.keys()].filter(p => [...bundled.keys()].some(b => rows.get(b) === rows.get(p)))]);

const out = join(DIR, 'THIRD_PARTY_NOTICES.txt');
writeFileSync(out, noticesText(names));
console.log(`✅ Wrote ${out.slice(ROOT.length + 1)} (${names.size} packages)`);
