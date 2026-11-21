#!/usr/bin/env node
/**
 * bump-version.js — Compute and write the next version into package.json
 *
 * Scheme: YYYY.MM.SEQ[-dev.N]  — sequence resets to 0 on each new month.
 *
 *   npm run bump-version          stable bump: promote a -dev.N build to
 *                                 stable (strip suffix), or advance SEQ
 *                                 (reset to 0 on month rollover)
 *   npm run bump-version:dev      dev bump: increment -dev.N on the current
 *                                 base, or start -dev.1 on the next base
 *   npm run bump-version:dev -- 2026.12.0
 *                                 start 2026.12.0-dev.1 now (a target base;
 *                                 also without :dev: set that stable version)
 *
 * Only touches package.json — run `npm run set-version` (or `npm run build`,
 * which calls it) afterward to propagate to manifest.json / const.py.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nextVersion } from './lib/next-version.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const isDev = process.argv.includes('--dev');
// an optional target base: npm run bump-version:dev -- 2026.12.0
const target = process.argv.slice(2).find((a) => !a.startsWith('--'));

const pkgPath = resolve(root, 'package.json');
const pkgContent = readFileSync(pkgPath, 'utf8');
const versionMatch = pkgContent.match(/"version":\s*"([^"]+)"/);
if (!versionMatch) {
  console.error('\n❌ Could not find a "version" field in package.json\n');
  process.exit(1);
}
const rawVersion = versionMatch[1];

let newVersion;
try {
  newVersion = nextVersion(rawVersion, { dev: isDev, target });
} catch (e) {
  console.error(`\n❌ ${e.message}\n`);
  process.exit(1);
}

const newPkgContent = pkgContent.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
writeFileSync(pkgPath, newPkgContent);

console.log(`\n🔢 Version bump (${isDev ? 'dev' : 'stable'}): ${rawVersion} → ${newVersion}\n`);
console.log('   Run `npm run set-version` (or `npm run build`) to propagate to manifest.json / const.py.\n');
